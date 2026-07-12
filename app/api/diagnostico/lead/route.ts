import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ensureDiagnosticoLeads } from '@/lib/ensure-diagnostico';
import { forwardLeadToOs } from '@/lib/os-bridge';
import { sendTextMessage, normalizeSpanishPhone } from '@/lib/whatsapp';

export const runtime = 'nodejs';

// Captura del diagnóstico "¿Está tu piso listo para vender?".
// 1) Guarda SIEMPRE en Neon (captacion.diagnostico_leads) — aquí no se pierde nada.
// 2) Reenvía al DELAgala OS (pipeline leads → cualificación → oportunidad).
// 3) Si el lead es CALIENTE, avisa al equipo por WhatsApp.

function looksLikePhone(s: string): boolean {
  return /^[+\d\s\-()]{7,20}$/.test(s.trim());
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { lead_name, lead_contact, answers, score, urgency, source_url } = body;
  const consent = body.consent_privacy === true;

  if (!lead_name?.trim()) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
  if (!lead_contact?.trim()) return NextResponse.json({ error: 'El contacto es obligatorio' }, { status: 400 });
  if (!consent) return NextResponse.json({ error: 'Debes aceptar la política de privacidad' }, { status: 400 });

  const contact = String(lead_contact).trim();
  const isPhone = looksLikePhone(contact);
  const phone = isPhone ? normalizeSpanishPhone(contact) : undefined;
  const email = !isPhone && contact.includes('@') ? contact : undefined;

  const sql = getDb();
  await ensureDiagnosticoLeads();
  const [lead] = await sql`
    INSERT INTO captacion.diagnostico_leads
      (lead_name, lead_contact, answers, score, urgency, source_url, consent_privacy)
    VALUES
      (${lead_name.trim()}, ${phone ?? contact},
       ${answers ? JSON.stringify(answers) : null}::jsonb,
       ${Number.isFinite(score) ? score : null}, ${urgency ?? null},
       ${source_url ?? null}, ${consent})
    RETURNING id, created_at
  `;

  // Zona (P1) como referencia de dirección para el OS
  const zona = Array.isArray(answers) && answers.length > 0 ? String(answers[0]) : 'Sin zona';

  const forwarded = await forwardLeadToOs({
    ownerIntent: 'VENDER',
    address: `Zona: ${zona}`,
    name: lead_name.trim(),
    phone,
    email,
    urgency: urgency === 'CALIENTE' ? 'URGE' : undefined,
    propertyType: 'piso',
    landing_path: '/delagala/diagnostico',
    utm_source: 'diagnostico',
    angle: `diagnostico-score-${score ?? 'na'}`,
    referrer: source_url ?? undefined,
  });
  if (forwarded) {
    await sql`UPDATE captacion.diagnostico_leads SET forwarded_to_os = true WHERE id = ${lead.id}`;
  }

  // Aviso al equipo si el lead viene CALIENTE
  const notify = process.env.DIAGNOSTICO_NOTIFY_PHONE || process.env.MORTGAGE_NOTIFY_PHONE;
  if (notify && urgency === 'CALIENTE') {
    await sendTextMessage(
      notify,
      `🔥 *Lead CALIENTE — Diagnóstico vender piso*\n\n` +
        `Nombre: ${lead_name.trim()}\n` +
        `Contacto: ${contact}\n` +
        `Zona: ${zona}\n` +
        `Puntuación: ${score ?? '—'}/100\n` +
        `Quiere vender YA. Llamar hoy.`,
    ).catch(e => console.error('[WA notify diagnostico] error', e));
  }

  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}

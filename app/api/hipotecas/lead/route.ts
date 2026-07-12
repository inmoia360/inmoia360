import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ensureMortgageLeads } from '@/lib/ensure-mortgage';
import { forwardLeadToOs } from '@/lib/os-bridge';
import { sendTextMessage, normalizeSpanishPhone } from '@/lib/whatsapp';

export const runtime = 'nodejs';

function isValidPhone(phone: string): boolean {
  return /^[+\d\s\-()]{7,20}$/.test(phone.trim());
}

const BRANDS_LABEL: Record<string, string> = {
  delagala: 'DELAGALA',
  blanca: 'Hipoteca Justa',
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const {
    lead_name,
    lead_phone,
    lead_email,
    service,
    message,
    source_url,
    calc,
  } = body;

  const brand = body.brand === 'blanca' ? 'blanca' : 'delagala';
  const consentPrivacy = body.consent_privacy === true;
  const consentMarketing = body.consent_marketing === true;

  if (!lead_name?.trim()) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
  if (!lead_phone?.trim() || !isValidPhone(lead_phone)) return NextResponse.json({ error: 'Teléfono inválido' }, { status: 400 });
  if (!consentPrivacy) return NextResponse.json({ error: 'Debes aceptar la política de privacidad' }, { status: 400 });

  const phone = normalizeSpanishPhone(lead_phone.trim());

  const sql = getDb();
  await ensureMortgageLeads();
  const [lead] = await sql`
    INSERT INTO hipotecas.leads
      (brand, service, lead_name, lead_phone, lead_email, message, calc,
       source_url, consent_privacy, consent_marketing)
    VALUES
      (${brand}, ${service ?? null}, ${lead_name.trim()}, ${phone},
       ${lead_email?.trim() || null}, ${message?.trim() || null},
       ${calc ? JSON.stringify(calc) : null}::jsonb,
       ${source_url ?? null}, ${consentPrivacy}, ${consentMarketing})
    RETURNING id, created_at
  `;

  // Reenvío al DELAgala OS (best-effort: si el OS no está accesible,
  // el lead ya quedó guardado arriba y no se pierde nada).
  await forwardLeadToOs({
    ownerIntent: `HIPOTECA${service ? ` · ${service}` : ''}`,
    address: 'Sin dirección (lead de hipotecas)',
    name: lead_name.trim(),
    phone,
    email: lead_email?.trim() || undefined,
    landing_path: brand === 'blanca' ? '/hipotecas' : '/delagala/hipotecas',
    utm_source: 'landing-hipotecas',
    angle: `hipotecas-${brand}`,
    referrer: source_url ?? undefined,
  });

  // Aviso por WhatsApp, al número asociado a cada landing:
  //   DELAGALA (élite) → 662128409 · Hipoteca Justa (blanca) → 603507168
  // Se puede sobrescribir con el env MORTGAGE_NOTIFY_PHONE (mismo para ambas).
  // NOTA: es texto libre, así que WhatsApp solo lo entrega si el receptor ha
  // escrito al número de DELAGALA (663 305 791) en las últimas 24h.
  const notify = process.env.MORTGAGE_NOTIFY_PHONE || (brand === 'delagala' ? '662128409' : '603507168');
  if (notify) {
    const calcLine =
      calc?.mode === 'cuota'
        ? `\nSimuló: ${calc.amount}€ · ${calc.years} años · cuota ~${calc.monthly}€`
        : calc?.mode === 'capacidad'
          ? `\nSimuló capacidad: hasta ~${calc.maxLoan}€ (${calc.netIncome}€/mes)`
          : '';
    await sendTextMessage(
      notify,
      `🏠 *Nuevo lead hipoteca — ${BRANDS_LABEL[brand]}*\n\n` +
        `Nombre: ${lead_name.trim()}\n` +
        `Tel: ${phone}\n` +
        (lead_email?.trim() ? `Email: ${lead_email.trim()}\n` : '') +
        `Interés: ${service ?? '—'}` +
        calcLine +
        (message?.trim() ? `\n\n"${message.trim()}"` : ''),
    ).catch(e => console.error('[WA notify] error', e));
  }

  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}

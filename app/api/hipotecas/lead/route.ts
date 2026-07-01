import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ensureMortgageLeads } from '@/lib/ensure-mortgage';
import { sendTextMessage, normalizeSpanishPhone } from '@/lib/whatsapp';

export const runtime = 'nodejs';

function isValidPhone(phone: string): boolean {
  return /^[+\d\s\-()]{7,20}$/.test(phone.trim());
}

const BRANDS_LABEL: Record<string, string> = {
  delagala: 'DELAGALA',
  blanca: 'Crédito Claro',
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

  // Aviso por WhatsApp al equipo (solo si hay número configurado).
  // NOTA: texto libre requiere ventana de 24h; para avisos internos basta
  // con que el número receptor haya escrito al de DELAGALA en las últimas 24h.
  const notify = process.env.MORTGAGE_NOTIFY_PHONE;
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

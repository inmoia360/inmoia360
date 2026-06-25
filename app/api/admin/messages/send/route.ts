import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyRequestSession } from '@/lib/auth';
import { ensureInbox } from '@/lib/wa-inbox';
import { normalizeSpanishPhone } from '@/lib/whatsapp';

export const runtime = 'nodejs';

// Responder a un lead por WhatsApp (texto libre, válido dentro de la ventana de 24h).
export async function POST(req: NextRequest) {
  if (!(await verifyRequestSession(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { to, body } = await req.json().catch(() => ({}));
  if (!to?.trim() || !body?.trim()) return NextResponse.json({ error: 'Falta destinatario o mensaje' }, { status: 400 });

  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) return NextResponse.json({ error: 'WhatsApp no configurado' }, { status: 500 });

  const phone = normalizeSpanishPhone(to.trim());
  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: phone, type: 'text', text: { body: body.trim() } }),
  });
  const data = await res.json();

  if (!res.ok) {
    const code = data?.error?.code;
    const msg = code === 131047 || code === 131051
      ? 'No se puede enviar: han pasado más de 24h desde el último mensaje del lead. WhatsApp solo permite texto libre dentro de esa ventana.'
      : (data?.error?.message ?? 'Error al enviar');
    return NextResponse.json({ error: msg, meta: data }, { status: 400 });
  }

  // Registrar el saliente en la bandeja
  try {
    await ensureInbox();
    const sql = getDb();
    const wamId = data?.messages?.[0]?.id ?? null;
    await sql`
      INSERT INTO wa.messages (wam_id, wa_from, wa_name, direction, msg_type, body)
      VALUES (${wamId}, ${phone}, ${null}, 'out', 'text', ${body.trim()})
      ON CONFLICT (wam_id) DO NOTHING
    `;
  } catch (e) { console.error('[WA send] log error', e); }

  return NextResponse.json({ ok: true });
}

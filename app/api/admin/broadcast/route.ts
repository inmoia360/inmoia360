import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyRequestSession } from '@/lib/auth';
import { ensureInbox } from '@/lib/wa-inbox';
import { normalizeSpanishPhone } from '@/lib/whatsapp';

export const runtime = 'nodejs';
export const maxDuration = 60;

const BATCH = 25;

// Envía el newsletter (Delagala Daily) por tandas a los leads registrados.
// El Daily lo aceptaron todos al registrarse (va a 🟢 y 🟡).
export async function POST(req: NextRequest) {
  if (!(await verifyRequestSession(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const campaign = url.searchParams.get('campaign') === 'cafe' ? 'cafe' : 'pan';
  const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);

  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const templateName = (process.env.WHATSAPP_TEMPLATE_NEWS ?? '').trim() || 'delagala_daily_news';
  if (!token || !phoneId) return NextResponse.json({ error: 'WhatsApp no configurado' }, { status: 500 });

  // Modo PRUEBA: envía el newsletter solo a un número (no a todos)
  const test = url.searchParams.get('test');
  if (test) {
    const to = normalizeSpanishPhone(test);
    const r = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'template', template: { name: templateName, language: { code: 'es_ES' }, components: [{ type: 'body', parameters: [{ type: 'text', text: 'Prueba' }] }] } }),
    });
    const data = await r.json();
    return NextResponse.json({ ok: r.ok, test: to, data }, { status: r.ok ? 200 : 400 });
  }

  const sql = getDb();
  const leads = campaign === 'cafe'
    ? await sql`
        SELECT DISTINCT ON (lead_phone) lead_phone, lead_name FROM marketing_pilot.coffee_coupons
        WHERE lead_phone IS NOT NULL
          AND campaign_id = (SELECT id FROM marketing_pilot.campaigns WHERE slug = 'dailycoffee')
        ORDER BY lead_phone, created_at DESC`
    : await sql`
        SELECT DISTINCT ON (lead_phone) lead_phone, lead_name FROM pan.coupons
        WHERE lead_phone IS NOT NULL
        ORDER BY lead_phone, created_at DESC`;

  const total = leads.length;
  const slice = leads.slice(offset, offset + BATCH);
  let sent = 0, failed = 0;

  await ensureInbox().catch(() => {});

  for (const lead of slice as { lead_phone: string; lead_name: string }[]) {
    const to = normalizeSpanishPhone(lead.lead_phone);
    try {
      const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp', to, type: 'template',
          template: { name: templateName, language: { code: 'es_ES' }, components: [{ type: 'body', parameters: [{ type: 'text', text: lead.lead_name || 'hola' }] }] },
        }),
      });
      if (res.ok) {
        sent++;
        const data = await res.json().catch(() => ({}));
        await sql`INSERT INTO wa.messages (wam_id, wa_from, wa_name, direction, msg_type, body)
          VALUES (${data?.messages?.[0]?.id ?? null}, ${to}, ${lead.lead_name ?? null}, 'out', 'template', '[Newsletter] Delagala Daily enviado')
          ON CONFLICT (wam_id) DO NOTHING`.catch(() => {});
      } else { failed++; }
    } catch { failed++; }
  }

  const nextOffset = offset + slice.length;
  return NextResponse.json({ ok: true, total, processed: slice.length, sent, failed, nextOffset, done: nextOffset >= total });
}

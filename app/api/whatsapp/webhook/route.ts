import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ensureInbox } from '@/lib/wa-inbox';
import { setUnsubscribed } from '@/lib/ensure-consent';
import { sendTextMessage } from '@/lib/whatsapp';

// Palabras que un lead puede escribir para darse de baja
const BAJA_WORDS = ['BAJA', 'STOP', 'UNSUBSCRIBE', 'CANCELAR', 'NO QUIERO', 'DARME DE BAJA'];

export const runtime = 'nodejs';

// Verificación del webhook (Meta hace un GET con hub.challenge al configurarlo)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  const expected = (process.env.WHATSAPP_VERIFY_TOKEN ?? '').trim();
  if (mode === 'subscribe' && expected && (token ?? '').trim() === expected) {
    return new NextResponse(challenge ?? '', { status: 200 });
  }
  return new NextResponse('forbidden', { status: 403 });
}

// Recepción de mensajes entrantes de los leads
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  try {
    await ensureInbox();
    const sql = getDb();
    const entries = body?.entry ?? [];
    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        const value = change.value ?? {};
        const contacts: Record<string, string> = {};
        for (const c of value.contacts ?? []) {
          if (c.wa_id) contacts[c.wa_id] = c.profile?.name ?? '';
        }
        for (const m of value.messages ?? []) {
          const text = m.text?.body
            ?? m.button?.text
            ?? m.interactive?.button_reply?.title
            ?? m.interactive?.list_reply?.title
            ?? `[${m.type}]`;
          await sql`
            INSERT INTO wa.messages (wam_id, wa_from, wa_name, direction, msg_type, body)
            VALUES (${m.id ?? null}, ${m.from ?? null}, ${contacts[m.from] ?? null}, 'in', ${m.type ?? null}, ${text})
            ON CONFLICT (wam_id) DO NOTHING
          `;

          // Auto-baja: si el lead escribe "BAJA" (o similar), se da de baja solo.
          const norm = String(text).trim().toUpperCase();
          if (m.from && BAJA_WORDS.includes(norm)) {
            try {
              await setUnsubscribed(m.from, true);
              await sendTextMessage(m.from, 'Hecho. Te hemos dado de baja y no recibiras mas mensajes. Si fue un error, escribe ALTA. Gracias. - DELAGALA');
              await sql`
                INSERT INTO wa.messages (wam_id, wa_from, wa_name, direction, msg_type, body)
                VALUES (${(m.id ?? '') + '-baja'}, ${m.from}, ${contacts[m.from] ?? null}, 'out', 'text', '[Baja automatica] Lead dado de baja por escribir BAJA')
                ON CONFLICT (wam_id) DO NOTHING`;
            } catch (e) { console.error('[WA webhook] baja error', e); }
          }
          // Reactivación: si escribe "ALTA", se vuelve a suscribir.
          if (m.from && norm === 'ALTA') {
            try {
              await setUnsubscribed(m.from, false);
              await sendTextMessage(m.from, 'Listo, te hemos reactivado. Volveras a recibir el Delagala Daily. - DELAGALA');
            } catch (e) { console.error('[WA webhook] alta error', e); }
          }
        }
      }
    }
  } catch (e) {
    console.error('[WA webhook] error', e);
  }
  // Siempre 200 para que Meta no reintente en bucle
  return NextResponse.json({ ok: true });
}

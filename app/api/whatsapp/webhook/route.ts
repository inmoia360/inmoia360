import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ensureInbox } from '@/lib/wa-inbox';

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
        }
      }
    }
  } catch (e) {
    console.error('[WA webhook] error', e);
  }
  // Siempre 200 para que Meta no reintente en bucle
  return NextResponse.json({ ok: true });
}

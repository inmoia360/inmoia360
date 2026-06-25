import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Endpoint TEMPORAL: crea la plantilla MARKETING del newsletter (Delagala Daily)
// con botón al PDF del periódico. Protegido por OPS_SECRET. Se elimina tras usar.
const WABA_ID = '3556657921150855';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = (url.searchParams.get('secret') ?? '').trim();
  const expected = (process.env.OPS_SECRET ?? '').trim();
  if (!expected || secret !== expected) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const token = process.env.WHATSAPP_TOKEN;
  if (!token) return NextResponse.json({ error: 'No WHATSAPP_TOKEN' }, { status: 500 });

  // Modo inspección
  if (url.searchParams.get('action') === 'list') {
    const r = await fetch(`https://graph.facebook.com/v20.0/${WABA_ID}/message_templates?fields=name,status,category,rejected_reason&limit=80`, { headers: { Authorization: `Bearer ${token}` } });
    return NextResponse.json(await r.json(), { status: r.ok ? 200 : 400 });
  }

  const name = url.searchParams.get('name') ?? 'delagala_daily_news';
  const template = {
    name,
    category: 'MARKETING',
    language: 'es_ES',
    components: [
      {
        type: 'BODY',
        text: 'Hola {{1}}, ya esta disponible tu Delagala Daily: el especial de playas de Getxo y todo sobre heredar vivienda en Bizkaia. Toca el boton para leerlo.',
        example: { body_text: [['Carlos']] },
      },
      {
        type: 'BUTTONS',
        buttons: [
          { type: 'URL', text: 'Leer el Delagala Daily', url: 'https://inmoia360.vercel.app/delagala-daily.pdf' },
        ],
      },
    ],
  };
  const res = await fetch(`https://graph.facebook.com/v20.0/${WABA_ID}/message_templates`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(template),
  });
  const data = await res.json();
  return NextResponse.json({ ok: res.ok, status: res.status, data }, { status: res.ok ? 200 : 400 });
}

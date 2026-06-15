import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Endpoint TEMPORAL: crea la plantilla de WhatsApp del PAN en Meta.
// Protegido por OPS_SECRET. Se elimina tras usarlo.
const WABA_ID = '3556657921150855';

export async function GET(req: Request) {
  const secret = (new URL(req.url).searchParams.get('secret') ?? '').trim();
  const expected = (process.env.OPS_SECRET ?? '').trim();
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const token = process.env.WHATSAPP_TOKEN;
  if (!token) return NextResponse.json({ error: 'No WHATSAPP_TOKEN' }, { status: 500 });

  const url = new URL(req.url);
  const name = url.searchParams.get('name') ?? 'delagala_pan_v2';
  const category = url.searchParams.get('category') ?? 'MARKETING';

  const template = {
    name,
    category,
    language: 'es_ES',
    components: [
      {
        type: 'BODY',
        text: 'Hola {{1}} 👋\n\nSoy DELAGALA. ¡Gracias por registrarte!\n\nAquí tienes tu código para canjear tu pan gratis:\n\n{{2}}\n\nMuéstralo en la panadería y disfruta 🥖\n\n— DELAGALA Consultoría Inmobiliaria\nidelagala.com · 662 128 409',
        example: { body_text: [['María', 'DLG-ABC12345']] },
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

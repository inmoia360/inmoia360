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

  // Modo inspección: lista plantillas con su estado y motivo de rechazo
  if (url.searchParams.get('action') === 'list') {
    const r = await fetch(
      `https://graph.facebook.com/v20.0/${WABA_ID}/message_templates?fields=name,status,category,rejected_reason,language,components&limit=50`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const d = await r.json();
    return NextResponse.json(d, { status: r.ok ? 200 : 400 });
  }

  const name = url.searchParams.get('name') ?? 'delagala_pan_v3';
  const category = url.searchParams.get('category') ?? 'MARKETING';

  // Clon de la plantilla del cafe aprobada (delagala_cafe_v7): texto corto,
  // sin tildes ni emojis, con *{{2}}* en negrita y boton al periodico.
  const template = {
    name,
    category,
    language: 'es_ES',
    components: [
      {
        type: 'BODY',
        text: 'Hola {{1}}, aqui tienes tu codigo de pan gratis en DELAGALA: *{{2}}*. Muestralo en la panaderia y disfruta.',
        example: { body_text: [['Carlos', 'DLG-AB12CD']] },
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

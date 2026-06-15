import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Endpoint TEMPORAL de diagnostico: envia la plantilla del pan a un numero y
// devuelve la respuesta cruda de Meta (para ver el error). Se elimina tras usarlo.
function normalizeSpanishPhone(phone: string): string {
  let d = phone.replace(/[^0-9]/g, '');
  if (d.startsWith('0034')) d = d.slice(4);
  if (d.length === 9) d = '34' + d;
  return d;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = (url.searchParams.get('secret') ?? '').trim();
  const expected = (process.env.OPS_SECRET ?? '').trim();
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const templateName = (process.env.WHATSAPP_TEMPLATE_NAME_DAILYBREAD ?? '').trim();
  const phoneRaw = url.searchParams.get('phone');
  if (!phoneRaw) return NextResponse.json({ error: 'falta ?phone=' }, { status: 400 });
  if (!token || !phoneId) return NextResponse.json({ error: 'faltan WHATSAPP_TOKEN/PHONE_ID' }, { status: 500 });

  const to = normalizeSpanishPhone(phoneRaw);
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'es_ES' },
      components: [
        { type: 'body', parameters: [ { type: 'text', text: 'Alvaro' }, { type: 'text', text: 'DLG-TEST1234' } ] },
      ],
    },
  };
  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return NextResponse.json({ ok: res.ok, status: res.status, templateUsed: templateName, to, data });
}

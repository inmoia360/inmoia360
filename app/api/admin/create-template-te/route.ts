import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const TEMPLATE_NAME = 'delagala_te_v1';

// GET: estado de aprobación de la plantilla del código de té en Meta.
export async function GET() {
  const token = process.env.WHATSAPP_TOKEN;
  const wabaId = process.env.WHATSAPP_WABA_ID || process.env.WABA_ID || '3556657921150855';
  if (!token) return NextResponse.json({ error: 'No WHATSAPP_TOKEN' }, { status: 500 });
  try {
    const r = await fetch(`https://graph.facebook.com/v20.0/${wabaId}/message_templates?fields=name,status,category&limit=200`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const d = await r.json();
    const t = Array.isArray(d?.data) ? d.data.find((x: { name?: string }) => x.name === TEMPLATE_NAME) : null;
    return NextResponse.json({ found: !!t, status: t?.status ?? null });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST: crea la plantilla del CÓDIGO del té (herbolistería). UTILITY (es transaccional).
// Mismo formato que el código del café: body {{1}}=nombre {{2}}=código.
export async function POST(req: NextRequest) {
  const pwd = req.headers.get('x-admin-password');
  if (pwd !== process.env.DAILYCOFFEE_ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = process.env.WHATSAPP_TOKEN;
  const wabaId = process.env.WHATSAPP_WABA_ID || process.env.WABA_ID || '3556657921150855';
  if (!token) return NextResponse.json({ error: 'No WHATSAPP_TOKEN' }, { status: 500 });

  const body = {
    name: TEMPLATE_NAME,
    category: 'UTILITY',
    language: 'es_ES',
    components: [
      {
        type: 'BODY',
        text:
          '¡Hola {{1}}! 👋\n\n' +
          '¡Gracias por suscribirte! Aquí tienes tu código para tu *bolsa de té* gratis en Centro Dietético Las Arenas:\n\n' +
          '*{{2}}*\n\n' +
          'Enséñaselo en la tienda y recoge tu té. 🍵\n\n' +
          '— DELAGALA Consultoría Inmobiliaria',
        example: { body_text: [['Álvaro', 'DLG-ABC123']] },
      },
      {
        type: 'BUTTONS',
        buttons: [
          { type: 'URL', text: 'Leer el Daily', url: 'https://www.inmoia360.com/delagala-daily.pdf' },
        ],
      },
    ],
  };

  const res = await fetch(`https://graph.facebook.com/v20.0/${wabaId}/message_templates`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.ok ? 200 : 400 });
}

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const TEMPLATE_NAME = 'delagala_daily_hipotecas';

// GET: estado de aprobación de la plantilla de hipotecas en Meta (para vigilar).
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

// POST: crea (o reintenta) la plantilla del newsletter del especial de HIPOTECAS.
// Protegida por la contraseña admin. Meta la deja en PENDING hasta aprobarla.
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
    category: 'MARKETING',
    language: 'es_ES',
    components: [
      {
        type: 'BODY',
        text:
          'Hola {{1}} 👋\n\n' +
          'Ya está tu *DELAGALA Daily* de este mes.\n\n' +
          '🏦 Especial *Hipotecas*: cómo está el euríbor, qué pasa con tu cuota y cómo saber si estás *pagando de más* — claro y sin tecnicismos.\n\n' +
          '📩 Toca el botón para leerlo.\n\n' +
          'Si no quieres recibir más el Daily, escribe BAJA.\n\n' +
          'DELAGALA Consultoría Inmobiliaria · C/ Las Mercedes 17, Las Arenas',
        example: { body_text: [['Álvaro']] },
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

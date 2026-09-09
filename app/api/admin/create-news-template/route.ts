import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Crea (o reintenta) la plantilla del newsletter enfocada en el PGOU de Getxo.
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
    name: 'delagala_daily_pgou',
    category: 'MARKETING',
    language: 'es_ES',
    components: [
      {
        type: 'BODY',
        text:
          'Hola {{1}} 👋\n\n' +
          'Ya está aquí tu *DELAGALA Daily*.\n\n' +
          '🏙️ Especial *nuevo PGOU de Getxo*: el plan que ordena los próximos 20 años ya es oficial. Te explicamos, sin tecnicismos, qué cambia para tu casa — 4.471 viviendas nuevas, la costa de Azkorri preservada y por qué tu vivienda gana valor.\n\n' +
          '📩 Toca el botón para leerlo.\n\n' +
          'Si prefieres no recibir más el Daily, escribe BAJA y listo.\n\n' +
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

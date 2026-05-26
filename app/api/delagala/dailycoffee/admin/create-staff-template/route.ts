import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const pwd = req.headers.get('x-admin-password');
  if (pwd !== process.env.DAILYCOFFEE_ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = process.env.WHATSAPP_TOKEN;
  const wabaId = '3556657921150855';

  if (!token) return NextResponse.json({ error: 'No WHATSAPP_TOKEN' }, { status: 500 });

  const body = {
    name: 'delagala_staff_notif',
    category: 'UTILITY',
    language: 'es_ES',
    components: [
      {
        type: 'BODY',
        text: 'Nuevo código de café DELAGALA\n\nCliente: {{1}}\nCódigo: {{2}}\nBar: {{3}}\n\nServidos este mes: {{4}} / {{5}}',
        example: {
          body_text: [['María García', 'DLG-ABC12345', 'Las Mercedes', '14', '50']],
        },
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

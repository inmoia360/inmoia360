const GRAPH_API = 'https://graph.facebook.com/v20.0';

function normalizeSpanishPhone(phone: string): string {
  let d = phone.replace(/[^0-9]/g, '');
  if (d.startsWith('0034')) d = d.slice(4);
  if (d.length === 9) d = '34' + d;
  return d;
}

export async function sendCouponWhatsApp(phone: string, name: string, code: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME ?? 'delagala_daily_coffee';

  if (!token || !phoneId) return;

  const to = normalizeSpanishPhone(phone);

  const res = await fetch(`${GRAPH_API}/${phoneId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'es' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: name },
              { type: 'text', text: code },
            ],
          },
        ],
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('[WhatsApp] send failed', JSON.stringify(err));
  }
}

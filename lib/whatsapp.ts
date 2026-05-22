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

  const isTest = templateName === 'hello_world';

  const payload = isTest
    ? {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: {
          body: `Hola ${name} 👋\n\nSoy DELAGALA. ¡Gracias por registrarte!\n\nAquí tienes tu código para canjear tu café gratis:\n\n*${code}*\n\nMuéstraselo al camarero en el bar y disfruta ☕\n\n📰 Y aquí tienes el Delagala Daily:\nhttps://inmoia360.vercel.app/delagala-daily.pdf\n\n— DELAGALA Consultoría Inmobiliaria\nidelagala.com · 662 128 409`,
        },
      }
    : {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'es_ES' },
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
      };

  const res = await fetch(`${GRAPH_API}/${phoneId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('[WhatsApp] send failed', JSON.stringify(err));
  }
}

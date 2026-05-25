const GRAPH_API = 'https://graph.facebook.com/v20.0';
const PDF_URL = 'https://inmoia360.vercel.app/delagala-daily.pdf';

// ── Notificación al camarero del bar ──────────────────────────────────────
// NOTA: requiere que el camarero haya enviado primero un mensaje al número
// de DELAGALA (+34 663 305 791) para abrir la ventana de 24h.
// En producción sustituir por una plantilla UTILITY aprobada en Meta.
export async function sendBarStaffNotification(
  staffPhone: string,
  barName: string,
  customerName: string,
  code: string,
  count: number,
  limit: number,
) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId || !staffPhone) return;

  const to = normalizeSpanishPhone(staffPhone);
  await sendWA(phoneId, token, {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: {
      body:
        `☕ *DELAGALA Daily Coffee — nuevo código*\n\n` +
        `Cliente: ${customerName}\n` +
        `Código: *${code}*\n` +
        `Bar: ${barName}\n\n` +
        `📊 Servidos este mes: *${count} / ${limit}*`,
    },
  });
}

function normalizeSpanishPhone(phone: string): string {
  let d = phone.replace(/[^0-9]/g, '');
  if (d.startsWith('0034')) d = d.slice(4);
  if (d.length === 9) d = '34' + d;
  return d;
}

async function sendWA(phoneId: string, token: string, payload: object) {
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

export async function sendCouponWhatsApp(phone: string, name: string, code: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME ?? 'delagala_daily_coffee';

  if (!token || !phoneId) return;

  const to = normalizeSpanishPhone(phone);
  const isTest = templateName === 'hello_world';

  if (isTest) {
    // Mensaje 1: código del café
    await sendWA(phoneId, token, {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: {
        body: `Hola ${name} 👋\n\nSoy DELAGALA. ¡Gracias por registrarte!\n\nAquí tienes tu código para canjear tu café gratis:\n\n*${code}*\n\nMuéstraselo al camarero en el bar y disfruta ☕\n\n— DELAGALA Consultoría Inmobiliaria\nidelagala.com · 662 128 409`,
      },
    });

    // Mensaje 2: PDF del periódico adjunto
    await sendWA(phoneId, token, {
      messaging_product: 'whatsapp',
      to,
      type: 'document',
      document: {
        link: PDF_URL,
        filename: 'Delagala-Daily.pdf',
        caption: '📰 Tu Delagala Daily de este mes — descárgalo y léelo cuando quieras.',
      },
    });

  } else {
    // delagala_cafe_v7: body {{1}}=nombre {{2}}=código + botón URL al periódico
    await sendWA(phoneId, token, {
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
    });
  }
}

import { NextRequest, NextResponse } from 'next/server';

export interface OrderNotificationPayload {
  order_number: string;
  customer_name: string;
  customer_phone: string;
  additional_phone?: string;
  city?: string;
  area?: string;
  address?: string;
  notes?: string;
  payment_method: 'cod' | 'bank_transfer';
  sender_name?: string;
  sender_bank?: string;
  sender_account?: string;
  items: {
    product_name: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  discount: number;
  shipping?: number;
  total: number;
}

/**
 * Builds a formatted message for WhatsApp using WhatsApp Markdown styling.
 * Matches the exact design, structure, and emojis of the Telegram notification.
 */
function buildWhatsAppMessage(order: OrderNotificationPayload): string {
  const paymentLabel =
    order.payment_method === 'cod' ? '💵 الدفع عند الاستلام' : '🏦 التحويل البنكي';

  const itemsText = order.items
    .map(
      (item, i) =>
        `  ${i + 1}. *${item.product_name}*\n      الكمية: ${item.quantity}   |   السعر: ${(item.price * item.quantity).toFixed(0)} ر.س`
    )
    .join('\n');

  const discountLine =
    order.discount > 0
      ? `\n🏷 الخصم: *- ${order.discount.toFixed(0)} ر.س*`
      : '';

  const shippingLine =
    order.shipping && order.shipping > 0
      ? `\n🚚 رسوم التوصيل: *${order.shipping.toFixed(0)} ر.س*`
      : '';

  const bankLines =
    order.payment_method === 'bank_transfer' && order.sender_name
      ? `\n\n🔁 *بيانات المحوّل*\n` +
        `  الاسم: ${order.sender_name}\n` +
        `  البنك: ${order.sender_bank || '—'}\n` +
        `  الحساب: ${order.sender_account || '—'}`
      : '';

  const notesLine = order.notes
    ? `\n\n📝 *ملاحظات العميل*\n  ${order.notes}`
    : '';

  const now = new Date();
  const dateStr = now.toLocaleString('ar-SA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    `🛍 *طلب جديد — ${order.order_number}*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👤 *معلومات العميل*\n` +
    `  الاسم: ${order.customer_name}\n` +
    `  الجوال: ${order.customer_phone}\n` +
    (order.additional_phone
      ? `  جوال إضافي: ${order.additional_phone}\n`
      : '') +
    `\n📍 *عنوان التوصيل*\n` +
    (order.city ? `  المدينة: ${order.city}\n` : '') +
    `  الحي: ${order.area || '—'}\n` +
    `  التفاصيل: ${order.address || '—'}\n` +
    `\n💳 *طريقة الدفع*\n  ${paymentLabel}` +
    bankLines +
    `\n\n🛒 *المنتجات*\n` +
    itemsText +
    `\n\n💰 *الإجمالي*\n` +
    `  المجموع الفرعي: ${order.subtotal.toFixed(0)} ر.س` +
    discountLine +
    shippingLine +
    `\n  ✅ الصافي: *${order.total.toFixed(0)} ر.س*` +
    notesLine +
    `\n\n━━━━━━━━━━━━━━━━━━━━\n` +
    `🕐 ${dateStr}`
  );
}

/**
 * Sends notification via Green-API (Instant WhatsApp Gateway via personal QR / instance).
 */
async function sendViaGreenApi(
  apiUrl: string,
  idInstance: string,
  apiTokenInstance: string,
  phones: string[],
  message: string
) {
  const cleanApiUrl = apiUrl.replace(/\/+$/, '');
  const url = `${cleanApiUrl}/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;

  const tasks = phones.map(async (phone) => {
    try {
      const cleanNumber = phone.replace(/[^\d]/g, '');
      const chatId = cleanNumber.includes('@') ? cleanNumber : `${cleanNumber}@c.us`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          message,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.idMessage) {
        return { ok: true, phone, data };
      }
      return { ok: res.ok, phone, error: data.message || res.statusText, data };
    } catch (err: any) {
      return { ok: false, phone, error: err?.message || 'Green-API network error' };
    }
  });

  return Promise.all(tasks);
}

/**
 * Sends notification via CallMeBot (Free, zero-Meta-verification service for admin alerts).
 */
async function sendViaCallMeBot(phones: string[], apiKeys: string[], message: string) {
  const tasks = phones.map(async (phone, idx) => {
    const apiKey = apiKeys[idx] || apiKeys[0];
    if (!apiKey) return { ok: false, error: 'Missing API key for phone: ' + phone };

    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`;

    try {
      const res = await fetch(url, { method: 'GET' });
      const text = await res.text();
      if (res.ok && !text.toLowerCase().includes('error')) {
        return { ok: true, phone, response: text };
      }
      return { ok: false, phone, error: text || res.statusText };
    } catch (err: any) {
      return { ok: false, phone, error: err?.message || 'Network error' };
    }
  });

  return Promise.all(tasks);
}

/**
 * Sends notification via Generic WhatsApp Gateway (UltraMsg, Wasapi, etc.).
 */
async function sendViaGateway(gatewayUrl: string, token: string, phones: string[], message: string) {
  const tasks = phones.map(async (to) => {
    try {
      const res = await fetch(gatewayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          to: to.replace(/[^\d]/g, ''),
          body: message,
          message: message,
        }),
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, to, data };
    } catch (err: any) {
      return { ok: false, to, error: err?.message };
    }
  });

  return Promise.all(tasks);
}

/**
 * Sends notification via Meta WhatsApp Cloud API.
 */
async function sendViaMetaCloud(token: string, phoneId: string, phones: string[], message: string) {
  const tasks = phones.map(async (to) => {
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to.replace(/[^\d]/g, ''),
          type: 'text',
          text: { preview_url: false, body: message },
        }),
      });
      const data = await res.json();
      return { ok: res.ok, to, data };
    } catch (err: any) {
      return { ok: false, to, error: err?.message };
    }
  });

  return Promise.all(tasks);
}

export async function POST(req: NextRequest) {
  try {
    const payload: OrderNotificationPayload = await req.json();
    const message = buildWhatsAppMessage(payload);

    // 1. Green-API configuration (Direct personal WhatsApp instance)
    const greenApiUrl =
      process.env.GREEN_API_URL || process.env.WHATSAPP_GREEN_API_URL || 'https://7107.api.greenapi.com';
    const greenIdInstance = process.env.GREEN_API_ID_INSTANCE || process.env.WHATSAPP_GREEN_ID_INSTANCE;
    const greenApiToken = process.env.GREEN_API_TOKEN || process.env.WHATSAPP_GREEN_TOKEN;
    const greenPhones = (
      process.env.GREEN_API_PHONE ||
      process.env.WHATSAPP_GREEN_PHONE ||
      process.env.WHATSAPP_PHONE ||
      ''
    )
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    // 2. CallMeBot configuration (free alert bot)
    const callMeBotPhones = (process.env.WHATSAPP_CALLMEBOT_PHONE || process.env.WHATSAPP_PHONE || '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const callMeBotApiKeys = (process.env.WHATSAPP_CALLMEBOT_APIKEY || process.env.WHATSAPP_APIKEY || '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    // 3. Generic Gateway configuration (e.g. UltraMsg)
    const gatewayUrl = process.env.WHATSAPP_GATEWAY_URL;
    const gatewayToken = process.env.WHATSAPP_GATEWAY_TOKEN;
    const gatewayPhones = (process.env.WHATSAPP_GATEWAY_TO || process.env.WHATSAPP_PHONE || '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    // 4. Meta Cloud API configuration
    const metaToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
    const metaPhoneId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID;
    const metaPhones = (process.env.WHATSAPP_CLOUD_RECIPIENT_PHONE || process.env.WHATSAPP_PHONE || '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    let providerUsed = false;
    let anySuccess = false;
    const errors: any[] = [];

    // Attempt Green-API if configured (Highest priority when set)
    if (greenIdInstance && greenApiToken && greenPhones.length > 0) {
      providerUsed = true;
      const results = await sendViaGreenApi(
        greenApiUrl,
        greenIdInstance,
        greenApiToken,
        greenPhones,
        message
      );
      const successful = results.filter((r) => r.ok);
      const failed = results.filter((r) => !r.ok);
      if (successful.length > 0) anySuccess = true;
      if (failed.length > 0) {
        console.error('WhatsApp Green-API error(s):', failed);
        errors.push(...failed);
      }
    }

    // Attempt CallMeBot if Green-API wasn't used and CallMeBot is configured
    if (!anySuccess && callMeBotPhones.length > 0 && callMeBotApiKeys.length > 0 && !greenIdInstance) {
      providerUsed = true;
      const results = await sendViaCallMeBot(callMeBotPhones, callMeBotApiKeys, message);
      const successful = results.filter((r) => r.ok);
      const failed = results.filter((r) => !r.ok);
      if (successful.length > 0) anySuccess = true;
      if (failed.length > 0) {
        console.error('WhatsApp CallMeBot error(s):', failed);
        errors.push(...failed);
      }
    }

    // Attempt Gateway if configured
    if (!anySuccess && gatewayUrl && gatewayToken && gatewayPhones.length > 0) {
      providerUsed = true;
      const results = await sendViaGateway(gatewayUrl, gatewayToken, gatewayPhones, message);
      const successful = results.filter((r) => r.ok);
      const failed = results.filter((r) => !r.ok);
      if (successful.length > 0) anySuccess = true;
      if (failed.length > 0) {
        console.error('WhatsApp Gateway error(s):', failed);
        errors.push(...failed);
      }
    }

    // Attempt Meta Cloud API if configured
    if (!anySuccess && metaToken && metaPhoneId && metaPhones.length > 0) {
      providerUsed = true;
      const results = await sendViaMetaCloud(metaToken, metaPhoneId, metaPhones, message);
      const successful = results.filter((r) => r.ok);
      const failed = results.filter((r) => !r.ok);
      if (successful.length > 0) anySuccess = true;
      if (failed.length > 0) {
        console.error('WhatsApp Meta Cloud error(s):', failed);
        errors.push(...failed);
      }
    }

    if (!providerUsed) {
      return NextResponse.json(
        { error: 'WhatsApp credentials not configured in environment variables' },
        { status: 500 }
      );
    }

    if (!anySuccess && errors.length > 0) {
      return NextResponse.json({ error: 'All WhatsApp sends failed', details: errors }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('notify-whatsapp route error:', err);
    return NextResponse.json({ error: 'Internal error', details: err?.message }, { status: 500 });
  }
}

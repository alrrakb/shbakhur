import { NextRequest, NextResponse } from 'next/server';

export interface OrderNotificationPayload {
  order_number: string;
  customer_name: string;
  customer_phone: string;
  additional_phone?: string;
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
  total: number;
}

function buildMessage(order: OrderNotificationPayload): string {
  const paymentLabel =
    order.payment_method === 'cod' ? '💵 الدفع عند الاستلام' : '🏦 التحويل البنكي';

  const itemsText = order.items
    .map(
      (item, i) =>
        `  ${i + 1}. ${item.product_name}\n      الكمية: ${item.quantity}   |   السعر: ${(item.price * item.quantity).toFixed(0)} ر.س`
    )
    .join('\n');

  const discountLine =
    order.discount > 0
      ? `\n🏷 الخصم: <b>-${order.discount.toFixed(0)} ر.س</b>`
      : '';

  const bankLines =
    order.payment_method === 'bank_transfer' && order.sender_name
      ? `\n\n🔁 <b>بيانات المحوّل</b>\n` +
        `  الاسم: ${order.sender_name}\n` +
        `  البنك: ${order.sender_bank || '—'}\n` +
        `  الحساب: <code>${order.sender_account || '—'}</code>`
      : '';

  const notesLine = order.notes
    ? `\n\n📝 <b>ملاحظات العميل</b>\n  ${order.notes}`
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
    `🛍 <b>طلب جديد — ${order.order_number}</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👤 <b>معلومات العميل</b>\n` +
    `  الاسم: ${order.customer_name}\n` +
    `  الجوال: <code>${order.customer_phone}</code>\n` +
    (order.additional_phone
      ? `  جوال إضافي: <code>${order.additional_phone}</code>\n`
      : '') +
    `\n📍 <b>عنوان التوصيل</b>\n` +
    `  المنطقة/الحي: ${order.area || '—'}\n` +
    `  التفاصيل: ${order.address || '—'}\n` +
    `\n💳 <b>طريقة الدفع</b>\n  ${paymentLabel}` +
    bankLines +
    `\n\n🛒 <b>المنتجات</b>\n` +
    itemsText +
    `\n\n💰 <b>الإجمالي</b>\n` +
    `  المجموع الفرعي: ${order.subtotal.toFixed(0)} ر.س` +
    discountLine +
    `\n  ✅ الصافي: <b>${order.total.toFixed(0)} ر.س</b>` +
    notesLine +
    `\n\n━━━━━━━━━━━━━━━━━━━━\n` +
    `🕐 ${dateStr}`
  );
}

export async function POST(req: NextRequest) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatIdsRaw = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatIdsRaw) {
      return NextResponse.json({ error: 'Telegram credentials not configured' }, { status: 500 });
    }

    const chatIds = chatIdsRaw.split(',').map((id) => id.trim()).filter(Boolean);

    const payload: OrderNotificationPayload = await req.json();
    const text = buildMessage(payload);

    const results = await Promise.all(
      chatIds.map((chatId) =>
        fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
          }),
        }).then((res) => res.json())
      )
    );

    const failed = results.filter((data) => !data.ok);
    if (failed.length > 0) {
      console.error('Telegram API error(s):', failed);
    }

    if (failed.length === results.length) {
      return NextResponse.json({ error: failed[0]?.description || 'All sends failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('notify-telegram route error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

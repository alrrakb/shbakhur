'use client';

export interface InvoiceOrder {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  notes: string | null;
  created_at: string;
  payment_method?: string | null;
  customers: {
    name: string;
    phone: string;
    additional_phone?: string | null;
    city?: string | null;
    address?: string | null;
  } | null;
  order_items: {
    id: string;
    product_name: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
}

// ── Inline SVG icons ──────────────────────────────────────────────────────────
// These use explicit hex stroke attributes instead of lucide-react.
// html2canvas never needs to resolve `currentColor` via CSS.
// The print window also requires no external stylesheet for icon colours.

function PhoneIcon({ color = '#9ca3af', size = 13 }: { color?: string; size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.54 3.4 2 2 0 0 1 3.51 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.72 6.72l1.12-1.35a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MailIcon({ color = '#9ca3af', size = 13 }: { color?: string; size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function GlobeIcon({ color = '#9ca3af', size = 13 }: { color?: string; size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <path d="M2 12h20" />
    </svg>
  );
}

function MapPinIcon({ color = '#9ca3af', size = 13 }: { color?: string; size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
  })
    .format(amount)
    .replace('ر.س.', 'ر.س');

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

// ── Component ─────────────────────────────────────────────────────────────────
//
// IMPORTANT: this component intentionally uses 100% inline styles with hex
// colour values — zero Tailwind utility classes on the invoice markup.
//
// Reason: Tailwind v4 emits oklch()/lab() colour functions.  html2canvas v1.4.1
// cannot parse those modern colour spaces and throws a parse error when it
// encounters them in getComputedStyle().  By using only inline hex values we
// guarantee html2canvas never meets an oklch/lab colour anywhere in the subtree
// it renders.  The visual output is pixel-identical to the previous Tailwind
// implementation.

export default function InvoiceTemplate({
  order,
  logoUrl,
}: {
  order: InvoiceOrder;
  logoUrl?: string;
}) {
  const addressParts = [order.customers?.city, order.customers?.address]
    .filter(Boolean)
    .join(' - ');

  return (
    <div
      id="invoice-content"
      style={{
        fontFamily: "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif",
        direction: 'rtl',
        textAlign: 'right',
        color: '#111827',
        background: '#ffffff',
        width: '100%',
      }}
    >
      <div style={{ maxWidth: '48rem', margin: '0 auto' }}>

        {/* ─── Header ─────────────────────────────────────────────────────── */}
        <div style={{ padding: '2rem 2rem 1rem' }}>

          {/* Row: logo + store name  ↔  invoice meta */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
          }}>

            {/* Logo + store name */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{
                width: '3.5rem',
                height: '3.5rem',
                backgroundColor: '#000000',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl || '/favicon.png'}
                  alt="شعار المتجر"
                  style={{ width: '52px', height: '52px', objectFit: 'contain' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                  متجر SH
                </h1>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.125rem 0 0' }}>
                  للبخور والعطور الفاخرة
                </p>
              </div>
            </div>

            {/* Invoice meta (left-hand side in RTL layout) */}
            <div style={{ textAlign: 'left' }}>
              <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', margin: '0 0 0.75rem' }}>
                فاتورة
              </h2>
              <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', marginBottom: '0.25rem' }}>
                  <span>رقم الطلب:</span>
                  <span style={{ fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>
                    {order.order_number}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', marginBottom: '0.25rem' }}>
                  <span>التاريخ:</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>
                    {formatDate(order.created_at)}
                  </span>
                </div>
                {order.payment_method && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', marginBottom: '0.25rem' }}>
                    <span>طريقة الدفع:</span>
                    <span style={{ fontWeight: 600, color: '#111827' }}>
                      {order.payment_method === 'cod' ? 'الدفع عند الاستلام' : 'تحويل بنكي'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #e5e7eb', margin: '0 0 1.5rem' }} />

          {/* ─── Customer info ────────────────────────────────────────────── */}
          <div style={{ marginBottom: '1.5rem' }}>
            {/* label: no letterSpacing on Arabic — it breaks glyph joining */}
            <p style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#9ca3af',
              margin: '0 0 0.5rem',
            }}>
              فاتورة إلى
            </p>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem' }}>
              {order.customers?.name || '—'}
            </h3>

            {/*
              Use a <table> instead of flex rows for icon+text pairs.
              html2canvas handles table vertical-align: middle reliably, whereas
              flex align-items: center on SVG flex-items is often mis-rendered.
              In RTL the columns flow right-to-left, so DOM order [icon|text]
              renders visually as [text … icon] — which is what we want.
            */}
            <table style={{ borderCollapse: 'collapse', fontSize: '0.875rem', color: '#4b5563', marginTop: '0.25rem' }}>
              <tbody>
                {order.customers?.phone && (
                  <tr>
                    <td style={{ verticalAlign: 'middle', width: '18px', paddingLeft: '0.5rem', paddingBottom: '0.25rem' }}>
                      <PhoneIcon />
                    </td>
                    <td style={{ verticalAlign: 'middle', paddingBottom: '0.25rem' }} dir="ltr">
                      {order.customers.phone}
                    </td>
                  </tr>
                )}
                {order.customers?.additional_phone && (
                  <tr>
                    <td style={{ verticalAlign: 'middle', width: '18px', paddingLeft: '0.5rem', paddingBottom: '0.25rem' }}>
                      <PhoneIcon />
                    </td>
                    <td style={{ verticalAlign: 'middle', paddingBottom: '0.25rem' }} dir="ltr">
                      {order.customers.additional_phone}
                    </td>
                  </tr>
                )}
                {addressParts && (
                  <tr>
                    <td style={{ verticalAlign: 'middle', width: '18px', paddingLeft: '0.5rem' }}>
                      <MapPinIcon />
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      {addressParts}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── Items Table ─────────────────────────────────────────────────── */}
        <div style={{ padding: '0 2rem', marginBottom: '1.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <th style={{ textAlign: 'right',  padding: '12px 16px', color: '#374151', fontWeight: 600, fontSize: '13px' }}>المنتج</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', color: '#374151', fontWeight: 600, fontSize: '13px' }}>الكمية</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', color: '#374151', fontWeight: 600, fontSize: '13px' }}>سعر الوحدة</th>
                <th style={{ textAlign: 'left',   padding: '12px 16px', color: '#374151', fontWeight: 600, fontSize: '13px' }}>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {order.order_items.map((item, idx) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: '1px solid #f3f4f6',
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb',
                  }}
                >
                  <td style={{ padding: '13px 16px', fontWeight: 500, color: '#111827', fontSize: '14px' }}>
                    {item.product_name || '—'}
                  </td>
                  <td style={{ padding: '13px 16px', textAlign: 'center', color: '#374151', fontSize: '14px' }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: '13px 16px', textAlign: 'center', color: '#374151', fontSize: '14px' }}>
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td style={{ padding: '13px 16px', textAlign: 'left', fontWeight: 600, color: '#111827', fontSize: '14px' }}>
                    {formatCurrency(item.total_price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ─── Totals ──────────────────────────────────────────────────────── */}
        <div style={{ padding: '0 2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-start' }}>
          <div style={{ minWidth: '16rem' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem',
            }}>
              <span style={{ color: '#6b7280' }}>المجموع الفرعي</span>
              <span style={{ fontWeight: 600, color: '#1f2937' }}>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem',
              }}>
                <span style={{ color: '#059669' }}>الخصم</span>
                <span style={{ fontWeight: 600, color: '#059669' }}>- {formatCurrency(order.discount_amount)}</span>
              </div>
            )}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingTop: '0.75rem', marginTop: '0.25rem',
            }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>المجموع الإجمالي</span>
              <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>{formatCurrency(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* ─── Notes ───────────────────────────────────────────────────────── */}
        {order.notes && (
          <div style={{ padding: '0 2rem', marginBottom: '1.5rem' }}>
            <div style={{
              backgroundColor: '#fefce8',
              border: '1px solid #fde68a',
              borderRadius: '0.5rem',
              padding: '1rem',
            }}>
              <p style={{
                fontSize: '0.75rem', fontWeight: 700, color: '#a16207',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                margin: '0 0 0.25rem',
              }}>
                ملاحظات
              </p>
              <p style={{ fontSize: '0.875rem', color: '#92400e', lineHeight: '1.625', margin: 0 }}>
                {order.notes}
              </p>
            </div>
          </div>
        )}

        {/* ─── Footer ──────────────────────────────────────────────────────── */}
        <div style={{
          backgroundColor: '#000000',
          color: '#ffffff',
          borderBottomLeftRadius: '0.5rem',
          borderBottomRightRadius: '0.5rem',
          padding: '1.25rem 2rem',
        }}>
          <p style={{ textAlign: 'center', fontWeight: 700, fontSize: '1rem', margin: '0 0 0.75rem' }}>
            شكراً لاختياركم متجر SH!
          </p>
          <div style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center',
            justifyContent: 'center', gap: '1.5rem',
            fontSize: '0.875rem', color: '#9ca3af',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <PhoneIcon color="#9ca3af" />
              <span style={{ color: '#9ca3af' }}>0580090886</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <MailIcon color="#9ca3af" />
              <span style={{ color: '#9ca3af' }}>shbkhurr@gmail.com</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <GlobeIcon color="#9ca3af" />
              <span style={{ color: '#9ca3af' }}>www.shbkhur.com</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

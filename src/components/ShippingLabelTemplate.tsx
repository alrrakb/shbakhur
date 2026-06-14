'use client';

import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { type InvoiceOrder } from './InvoiceTemplate';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 })
    .format(amount)
    .replace('ر.س.', 'ر.س');

export default function ShippingLabelTemplate({ order }: { order: InvoiceOrder }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && order.order_number) {
      try {
        JsBarcode(svgRef.current, order.order_number, {
          format: 'CODE128',
          width: 2.5,
          height: 55,
          displayValue: true,
          fontSize: 13,
          textAlign: 'center',
          textPosition: 'bottom',
          textMargin: 3,
          background: '#ffffff',
          lineColor: '#000000',
          margin: 6,
        });
      } catch (e) {
        console.error('Barcode error', e);
      }
    }
  }, [order.order_number]);

  const addressParts = [order.customers?.city, order.customers?.address]
    .filter(Boolean)
    .join(' — ');

  const row: React.CSSProperties = { borderBottom: '1px solid #d1d5db' };

  return (
    <div
      style={{
        fontFamily: "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif",
        direction: 'rtl',
        textAlign: 'right',
        color: '#111827',
        background: '#ffffff',
        width: '100%',
        border: '2px solid #111827',
        borderRadius: '6px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        background: '#111827', color: '#fff',
        padding: '10px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '0.5px' }}>متجر SH للبخور</span>
        <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>ملصق الشحن</span>
      </div>

      {/* Order number */}
      <div style={{
        background: '#f9fafb', padding: '8px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...row,
      }}>
        <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>رقم الطلب</span>
        <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '2px', color: '#111827', fontFamily: 'monospace' }}>
          #{order.order_number}
        </span>
      </div>

      {/* Items */}
      <div style={{ padding: '8px 16px', ...row }}>
        <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          المنتجات
        </p>
        {order.order_items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: '13px', color: '#374151', marginBottom: '3px',
          }}>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: '8px' }}>
              {item.product_name || '—'}
            </span>
            <span style={{ color: '#6b7280', fontWeight: 700, flexShrink: 0, fontSize: '12px' }}>× {item.quantity}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div style={{
        padding: '8px 16px', ...row,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#f9fafb',
      }}>
        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>الإجمالي</span>
        <span style={{ fontWeight: 800, fontSize: '17px', color: '#111827' }}>
          {formatCurrency(order.total_amount)}
        </span>
      </div>

      {/* Barcode */}
      <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'center' }}>
        <svg ref={svgRef} style={{ maxWidth: '100%' }} />
      </div>
    </div>
  );
}

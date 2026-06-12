'use client';

import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { type InvoiceOrder } from './InvoiceTemplate';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
  })
    .format(amount)
    .replace('ر.س.', 'ر.س');

export default function ShippingLabelTemplate({ order }: { order: InvoiceOrder }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && order.order_number) {
      try {
        JsBarcode(svgRef.current, order.order_number, {
          format: 'CODE128',
          width: 2,
          height: 40,
          displayValue: true,
          fontSize: 11,
          textAlign: 'center',
          textPosition: 'bottom',
          textMargin: 2,
          background: '#ffffff',
          lineColor: '#000000',
          margin: 5,
        });
      } catch (e) {
        console.error('Barcode error', e);
      }
    }
  }, [order.order_number]);

  const addressParts = [order.customers?.city, order.customers?.address]
    .filter(Boolean)
    .join(' - ');

  const D: React.CSSProperties = { borderBottom: '1px solid #e5e7eb' };

  return (
    <div
      style={{
        fontFamily: "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif",
        direction: 'rtl',
        textAlign: 'right',
        color: '#111827',
        background: '#ffffff',
        width: '100%',
        maxWidth: '300px',
        margin: '0 auto',
        border: '2px solid #111827',
        borderRadius: '5px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ background: '#111827', color: '#fff', padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: '13px' }}>متجر SH</span>
        <span style={{ fontSize: '10px', color: '#9ca3af' }}>ملصق الشحن</span>
      </div>

      {/* Order number */}
      <div style={{ background: '#f3f4f6', padding: '4px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...D }}>
        <span style={{ fontSize: '10px', color: '#6b7280' }}>رقم الطلب</span>
        <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '1px', color: '#111827', fontFamily: 'monospace' }}>
          #{order.order_number}
        </span>
      </div>

      {/* Customer */}
      <div style={{ padding: '7px 12px', ...D }}>
        <p style={{ fontWeight: 800, fontSize: '16px', color: '#111827', margin: '0 0 2px', lineHeight: 1.2 }}>
          {order.customers?.name || '—'}
        </p>
        {order.customers?.phone && (
          <p style={{ fontSize: '12px', color: '#374151', fontWeight: 600, margin: '0 0 1px' }} dir="ltr">
            {order.customers.phone}
          </p>
        )}
        {order.customers?.additional_phone && (
          <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 1px' }} dir="ltr">
            {order.customers.additional_phone}
          </p>
        )}
        {addressParts && (
          <p style={{ fontSize: '10px', color: '#6b7280', margin: '1px 0 0' }}>{addressParts}</p>
        )}
      </div>

      {/* Items */}
      <div style={{ padding: '5px 12px', ...D }}>
        {order.order_items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#374151', marginBottom: '1px' }}>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: '6px' }}>
              {item.product_name || '—'}
            </span>
            <span style={{ color: '#6b7280', fontWeight: 600, flexShrink: 0 }}>× {item.quantity}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div style={{ padding: '5px 12px', ...D, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: '#6b7280' }}>الإجمالي</span>
        <span style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>
          {formatCurrency(order.total_amount)}
        </span>
      </div>

      {/* Barcode */}
      <div style={{ padding: '7px 12px', display: 'flex', justifyContent: 'center' }}>
        <svg ref={svgRef} />
      </div>
    </div>
  );
}

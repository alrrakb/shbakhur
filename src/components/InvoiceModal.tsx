'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, FileText, Tag } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import InvoiceTemplate, { type InvoiceOrder } from './InvoiceTemplate';
import ShippingLabelTemplate from './ShippingLabelTemplate';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Tab = 'invoice' | 'label';

interface InvoiceModalProps {
  order: InvoiceOrder;
  onClose: () => void;
}

export default function InvoiceModal({ order, onClose }: InvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const labelRef   = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>('invoice');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    supabase
      .from('site_logo')
      .select('logo_url')
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data?.logo_url) setLogoUrl(data.logo_url);
      });
  }, []);

  // ── Print invoice (A4) ───────────────────────────────────────────────────────
  const printInvoice = () => {
    const el = invoiceRef.current;
    if (!el) return;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { alert('يرجى السماح بفتح النوافذ المنبثقة في متصفحك.'); return; }

    const linkTags = Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
      .map((l) => `<link rel="stylesheet" href="${l.href}" />`)
      .join('\n');
    const styleTags = Array.from(document.head.querySelectorAll<HTMLStyleElement>('style'))
      .map((s) => `<style>${s.textContent}</style>`)
      .join('\n');

    const title = (order.customers?.name || 'فاتورة').replace(/\s+/g, '_') + '_' + order.order_number;

    win.document.open();
    win.document.write(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />
  ${linkTags}
  ${styleTags}
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; text-align: right; }
    @media print { * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
    @page { margin: 0; size: A4; }
    body { padding: 10mm; }
  </style>
</head>
<body>${el.innerHTML}</body>
</html>`);
    win.document.close();
    win.addEventListener('load', () => setTimeout(() => { win.focus(); win.print(); }, 800));
  };

  // ── Print shipping label (100×150 mm) ────────────────────────────────────────
  const printLabel = () => {
    const el = labelRef.current;
    if (!el) return;

    const win = window.open('', '_blank', 'width=500,height=650');
    if (!win) { alert('يرجى السماح بفتح النوافذ المنبثقة في متصفحك.'); return; }

    // Convert any <canvas> barcodes to <img> data URLs so they survive the copy
    let html = el.innerHTML;
    el.querySelectorAll('canvas').forEach((canvas) => {
      const dataUrl = canvas.toDataURL('image/png');
      html = html.replace(
        /<canvas[^>]*>[\s\S]*?<\/canvas>/,
        `<img src="${dataUrl}" style="max-width:100%;height:auto;display:block;margin:0 auto;" />`
      );
    });

    win.document.open();
    win.document.write(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>ملصق_${order.order_number}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; }
    @media print { * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
    @page { size: 12in 6in; margin: 5mm; }
    body { padding: 0; display: flex; align-items: flex-start; justify-content: center; }
  </style>
</head>
<body>${html}</body>
</html>`);
    win.document.close();
    win.addEventListener('load', () => setTimeout(() => { win.focus(); win.print(); }, 800));
  };

  const handlePrint = () => activeTab === 'invoice' ? printInvoice() : printLabel();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ direction: 'rtl' }}
        className="fixed inset-0 z-[60] bg-black/80 flex items-start justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white w-full max-w-3xl rounded-lg shadow-2xl my-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ───────────────────────────────────────────────────────── */}
          <div
            style={{ direction: 'rtl' }}
            className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg"
          >
            <div className="flex items-center gap-2 text-gray-800">
              <FileText size={20} className="text-gray-600" />
              <span className="font-bold text-base">
                فاتورة الطلب — {order.order_number}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
              >
                <Printer size={15} />
                طباعة
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ── Tabs ─────────────────────────────────────────────────────────── */}
          <div className="flex border-b border-gray-200 bg-white">
            <button
              onClick={() => setActiveTab('invoice')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'invoice'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              <FileText size={15} />
              الفاتورة الكاملة
            </button>
            <button
              onClick={() => setActiveTab('label')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'label'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              <Tag size={15} />
              ملصق الشحن
            </button>
          </div>

          {/* ── Invoice tab ──────────────────────────────────────────────────── */}
          <div className={activeTab === 'invoice' ? 'overflow-y-auto' : 'hidden'} style={{ maxHeight: '78vh' }}>
            <div ref={invoiceRef}>
              <InvoiceTemplate order={order} logoUrl={logoUrl} />
            </div>
          </div>

          {/* ── Label tab ────────────────────────────────────────────────────── */}
          <div
            className={activeTab === 'label' ? 'overflow-y-auto flex justify-center py-6 px-4 bg-gray-100' : 'hidden'}
            style={{ maxHeight: '78vh' }}
          >
            <div ref={labelRef}>
              <ShippingLabelTemplate order={order} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Download, FileText } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import InvoiceTemplate, { type InvoiceOrder } from './InvoiceTemplate';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface InvoiceModalProps {
  order: InvoiceOrder;
  onClose: () => void;
}

export default function InvoiceModal({ order, onClose }: InvoiceModalProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
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

  // ── الطباعة: نفتح نافذة جديدة وننسخ إليها CSS المحوّل من الصفحة الحالية ──
  const handlePrint = () => {
    const el = previewRef.current;
    if (!el) return;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
      alert('يرجى السماح بفتح النوافذ المنبثقة في متصفحك.');
      return;
    }

    // اجمع كل روابط الـ CSS من الصفحة الحالية (Tailwind المُجمَّع من Next.js)
    const linkTags = Array.from(
      document.head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
    )
      .map((l) => `<link rel="stylesheet" href="${l.href}" />`)
      .join('\n');

    // اجمع الـ style tags المضمّنة أيضاً
    const styleTags = Array.from(
      document.head.querySelectorAll<HTMLStyleElement>('style')
    )
      .map((s) => `<style>${s.textContent}</style>`)
      .join('\n');

    const title =
      (order.customers?.name || 'فاتورة').replace(/\s+/g, '_') +
      '_' +
      order.order_number;

    win.document.open();
    win.document.write(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />
  ${linkTags}
  ${styleTags}
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0;
      background: #fff;
      font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
      direction: rtl; text-align: right;
    }
    @media print {
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
    /* @page margin: 0 removes the browser's built-in header/footer area
       (date, filename, URL, page number). Body padding provides content margin. */
    @page {
      margin: 0;
      size: A4;
    }
    body {
      padding: 10mm;
    }
  </style>
</head>
<body>
${el.innerHTML}
</body>
</html>`);
    win.document.close();

    // انتظر تحميل CSS الخارجي ثم اطبع
    win.addEventListener('load', () => {
      setTimeout(() => {
        win.focus();
        win.print();
      }, 800);
    });
  };

  // ── تحميل PDF (html2canvas + jsPDF) ──────────────────────────────────────
  // InvoiceTemplate now uses 100% inline hex styles — zero Tailwind classes.
  // So we only need to: clone off-screen → strip external CSS → capture → slice.
  const handleDownloadPDF = async () => {
    const el = previewRef.current;
    if (!el) return;
    setGeneratingPDF(true);

    // Holds a reference so we can clean up on error too
    let container: HTMLDivElement | null = null;

    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      // Clone invoice markup into an off-screen div so html2canvas is not
      // constrained by the modal's overflow-y:auto clipping rect.
      container = document.createElement('div');
      Object.assign(container.style, {
        position:  'absolute',
        top:       '0',
        left:      '-9999px',
        width:     '794px',
        background:'#ffffff',
        zIndex:    '-1',
        overflow:  'visible',
      });
      container.innerHTML = el.innerHTML;
      document.body.appendChild(container);

      // Wait for web fonts to load before capturing
      await document.fonts.ready;

      const canvas = await html2canvas(container, {
        scale:           2,
        useCORS:         true,
        allowTaint:      true,
        backgroundColor: '#ffffff',
        logging:         false,
        width:           794,
        windowWidth:     794,
        onclone: (clonedDoc) => {
          // Strip Tailwind CSS entirely — its oklch()/lab() colour functions
          // crash html2canvas v1.4.1.  The invoice template already has every
          // colour and layout value as an inline hex style, so nothing is lost.
          clonedDoc.querySelectorAll('link[rel="stylesheet"]').forEach(e => e.remove());
          clonedDoc.querySelectorAll('style').forEach(e => e.remove());
          const st = clonedDoc.createElement('style');
          st.textContent = `
            *, *::before, *::after { box-sizing: border-box; }
            body {
              margin: 0; padding: 0; background: #fff;
              font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
              direction: rtl; text-align: right; color: #111827;
            }
            img { max-width: 100%; }
            table { border-collapse: collapse; width: 100%; }
          `;
          clonedDoc.head.appendChild(st);
          clonedDoc.body.style.fontFamily = "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif";
          clonedDoc.body.style.direction  = 'rtl';
        },
      });

      document.body.removeChild(container);
      container = null;

      // ── Slice canvas into A4 pages ────────────────────────────────────────
      // A4: 210 × 297 mm, 8 mm margins on all sides
      const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const margin  = 8;
      const usableW = 210 - margin * 2;   // 194 mm
      const usableH = 297 - margin * 2;   // 281 mm
      const imgW    = usableW;
      const imgH    = (canvas.height * imgW) / canvas.width;
      const pxPerMm = canvas.width / imgW;
      let srcY      = 0;
      let first     = true;

      while (srcY < canvas.height) {
        if (!first) pdf.addPage();
        first = false;

        // Guard against floating-point edge cases where remaining height goes
        // slightly negative — that produces sliceCanvas.height=0, making
        // toDataURL return 'data:,' which causes jsPDF to throw "wrong PNG signature".
        const remainMm      = imgH - srcY / pxPerMm;
        const sliceHeightMm = Math.min(usableH, remainMm);
        if (sliceHeightMm < 0.01) break;

        const sliceHeightPx = Math.round(sliceHeightMm * pxPerMm);
        if (sliceHeightPx < 1) break;

        const sliceCanvas    = document.createElement('canvas');
        sliceCanvas.width    = canvas.width;
        sliceCanvas.height   = sliceHeightPx;
        const ctx            = sliceCanvas.getContext('2d')!;
        ctx.fillStyle        = '#ffffff';
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(canvas, 0, srcY, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

        const dataUrl = sliceCanvas.toDataURL('image/png');
        if (!dataUrl || dataUrl === 'data:,') break;   // last-resort guard

        pdf.addImage(dataUrl, 'PNG', margin, margin, imgW, sliceHeightMm);
        srcY += sliceHeightPx;
      }

      const filename =
        (order.customers?.name || 'عميل').replace(/\s+/g, '_') +
        '_' + order.order_number + '.pdf';
      pdf.save(filename);

    } catch (err) {
      // Cleanup the off-screen container if an error occurred mid-flight
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
      console.error('PDF error:', err);
      alert('حدث خطأ أثناء إنشاء PDF. جرّب زر الطباعة واختر "حفظ كـ PDF" من متصفحك.');
    } finally {
      setGeneratingPDF(false);
    }
  };

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
          {/* ── Header ── */}
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
              {/* تحميل PDF — مخفي مؤقتاً */}
              {false && (
              <button
                onClick={handleDownloadPDF}
                disabled={generatingPDF}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {generatingPDF ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    تحميل PDF
                  </>
                )}
              </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ── Preview ── */}
          <div className="overflow-y-auto" style={{ maxHeight: '78vh' }}>
            <div ref={previewRef}>
              <InvoiceTemplate order={order} logoUrl={logoUrl} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

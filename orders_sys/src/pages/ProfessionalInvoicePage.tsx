import React, { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ordersApi } from '@/services/api'
import {
  Download,
  ArrowRight,
  Printer,
  Phone,
  Mail,
  Globe,
  FileText,
  Tag,
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/utils'
import LoadingSpinner from '@/components/LoadingSpinner'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import JsBarcode from 'jsbarcode'
import toast from 'react-hot-toast'

type Tab = 'invoice' | 'label'

const ProfessionalInvoicePage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const invoiceRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const barcodeRef = useRef<HTMLCanvasElement>(null)
  const [activeTab, setActiveTab] = useState<Tab>('invoice')
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getById(orderId!),
    enabled: !!orderId,
  })

  useEffect(() => {
    if (order?.customer?.name) {
      const originalTitle = document.title
      document.title = order.customer.name.replace(/\s+/g, '_')
      return () => { document.title = originalTitle }
    }
  }, [order])

  useEffect(() => {
    if (barcodeRef.current && order?.order_number) {
      try {
        JsBarcode(barcodeRef.current, order.order_number, {
          format: 'CODE128',
          width: 2,
          height: 55,
          displayValue: true,
          fontSize: 12,
          textAlign: 'center',
          textPosition: 'bottom',
          textMargin: 2,
          background: '#ffffff',
          lineColor: '#000000',
          margin: 8,
        })
      } catch (e) {
        console.error('Barcode error', e)
      }
    }
  }, [order?.order_number, activeTab])

  // ─── Invoice PDF ────────────────────────────────────────────────────────────
  const generateInvoicePDF = async () => {
    if (!invoiceRef.current || !order) return
    setIsGeneratingPDF(true)
    try {
      await document.fonts.ready
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        removeContainer: true,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          const el = clonedDoc.body
          el.style.fontFamily = 'Cairo, Tajawal, Arial, sans-serif'
          el.style.direction = 'rtl'
        },
      })
      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const imgWidth = 190
      const pageHeight = 280
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
      heightLeft -= pageHeight
      while (heightLeft >= 0) {
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 10, heightLeft - imgHeight + 10, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      const name = order.customer?.name || 'عميل'
      pdf.save(`${name.replace(/\s+/g, '_')}.pdf`)
      toast.success('تم تحميل الفاتورة بنجاح')
    } catch {
      toast.error('حدث خطأ في تحميل الفاتورة')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // ─── Label PDF ──────────────────────────────────────────────────────────────
  const generateLabelPDF = async () => {
    if (!labelRef.current || !order) return
    setIsGeneratingPDF(true)
    try {
      await document.fonts.ready
      const canvas = await html2canvas(labelRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        removeContainer: true,
      })
      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [100, 150] })
      const imgHeight = (canvas.height * 100) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, 100, Math.min(imgHeight, 150))
      const name = order.customer?.name || 'عميل'
      pdf.save(`label_${name.replace(/\s+/g, '_')}.pdf`)
      toast.success('تم تحميل ملصق الشحن بنجاح')
    } catch {
      toast.error('حدث خطأ في تحميل الملصق')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // ─── Print Invoice ───────────────────────────────────────────────────────────
  const printInvoice = () => {
    if (!invoiceRef.current) return
    const stylesheets = Array.from(document.styleSheets)
      .map((sheet) => {
        try { return Array.from(sheet.cssRules).map((r) => r.cssText).join('\n') }
        catch { return '' }
      })
      .join('\n')

    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head>
          <title>${order?.customer?.name?.replace(/\s+/g, '_') || 'فاتورة'}</title>
          <meta charset="UTF-8">
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            ${stylesheets}
            * { box-sizing: border-box; }
            body { font-family: 'Cairo', Arial, sans-serif; margin: 0; padding: 20px; direction: rtl; text-align: right; background: white; color: #111827; }
            .bg-white { background-color: #ffffff !important; }
            .bg-black { background-color: #000000 !important; }
            .bg-gray-50 { background-color: #f9fafb !important; }
            .text-white { color: #ffffff !important; }
            .text-gray-900 { color: #111827 !important; }
            .text-gray-600 { color: #4b5563 !important; }
            .text-gray-700 { color: #374151 !important; }
            .text-gray-500 { color: #6b7280 !important; }
            .text-green-600 { color: #059669 !important; }
            .font-bold { font-weight: bold !important; }
            .font-semibold { font-weight: 600 !important; }
            .text-xs { font-size: 0.75rem !important; }
            .text-sm { font-size: 0.875rem !important; }
            .text-base { font-size: 1rem !important; }
            .text-lg { font-size: 1.125rem !important; }
            .text-xl { font-size: 1.25rem !important; }
            .text-2xl { font-size: 1.5rem !important; }
            .text-3xl { font-size: 1.875rem !important; }
            .rounded-lg { border-radius: 0.5rem !important; }
            .border { border: 1px solid #e5e7eb !important; }
            .border-gray-200 { border-color: #e5e7eb !important; }
            .border-gray-300 { border-color: #d1d5db !important; }
            .overflow-hidden { overflow: hidden !important; }
            .max-w-4xl { max-width: 56rem !important; }
            .mx-auto { margin-left: auto !important; margin-right: auto !important; }
            .p-6 { padding: 1.5rem !important; }
            .px-6 { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
            .py-3 { padding-top: 0.75rem !important; padding-bottom: 0.75rem !important; }
            .py-4 { padding-top: 1rem !important; padding-bottom: 1rem !important; }
            .pt-3 { padding-top: 0.75rem !important; }
            .mb-8 { margin-bottom: 2rem !important; }
            .mb-6 { margin-bottom: 1.5rem !important; }
            .mb-4 { margin-bottom: 1rem !important; }
            .mb-2 { margin-bottom: 0.5rem !important; }
            .ml-8 { margin-left: 2rem !important; }
            .space-y-3 > * + * { margin-top: 0.75rem !important; }
            .space-y-2 > * + * { margin-top: 0.5rem !important; }
            .space-x-4 > * + * { margin-right: 1rem !important; }
            .space-x-2 > * + * { margin-right: 0.5rem !important; }
            .space-x-8 > * + * { margin-right: 2rem !important; }
            .flex { display: flex !important; }
            .items-center { align-items: center !important; }
            .items-start { align-items: flex-start !important; }
            .justify-between { justify-content: space-between !important; }
            .justify-center { justify-content: center !important; }
            .justify-start { justify-content: flex-start !important; }
            .text-center { text-align: center !important; }
            .text-right { text-align: right !important; }
            .text-left { text-align: left !important; }
            .border-t { border-top: 1px solid #d1d5db !important; }
            .w-16 { width: 4rem !important; } .h-16 { height: 4rem !important; }
            .w-12 { width: 3rem !important; } .h-12 { height: 3rem !important; }
            .w-5 { width: 1.25rem !important; } .h-5 { height: 1.25rem !important; }
            .w-24 { width: 6rem !important; } .h-px { height: 1px !important; }
            .w-\\[28rem\\] { width: 28rem !important; }
            .flex-1 { flex: 1 1 0% !important; }
            .flex-shrink-0 { flex-shrink: 0 !important; }
            table { width: 100% !important; border-collapse: collapse !important; }
            th, td { padding: 0.75rem 1.5rem !important; text-align: right !important; border-bottom: 1px solid #e5e7eb !important; }
            th { background-color: #f9fafb !important; font-weight: 500 !important; color: #374151 !important; }
            @media print {
              body { margin: 0 !important; padding: 0 !important; }
              @page { size: A4; margin: 10mm; }
            }
          </style>
        </head>
        <body>${invoiceRef.current.innerHTML}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.onload = () => setTimeout(() => printWindow.print(), 800)
  }

  // ─── Print Label ─────────────────────────────────────────────────────────────
  const printLabel = () => {
    if (!labelRef.current || !order) return

    const canvas = labelRef.current.querySelector('canvas')
    const barcodeDataUrl = canvas ? canvas.toDataURL('image/png') : null
    let labelHtml = labelRef.current.innerHTML
    if (barcodeDataUrl) {
      labelHtml = labelHtml.replace(
        /<canvas[^>]*>[\s\S]*?<\/canvas>/,
        `<img src="${barcodeDataUrl}" style="max-width:100%;height:auto;display:block;margin:0 auto;" />`
      )
    }

    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head>
          <title>ملصق_${order.order_number}</title>
          <meta charset="UTF-8">
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
          <style>
            @page { size: 100mm 150mm; margin: 0; }
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; font-family: 'Cairo', Arial, sans-serif; direction: rtl; background: white; }
            .label-shell { width: 100mm; min-height: 150mm; border: 2px solid #111; display: flex; flex-direction: column; }
            .label-header { background: #111; color: #fff; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; }
            .label-header-title { font-size: 13px; font-weight: bold; }
            .label-header-sub { font-size: 10px; color: #aaa; }
            .label-order-row { background: #f3f4f6; padding: 5px 10px; border-bottom: 1px solid #d1d5db; display: flex; justify-content: space-between; align-items: center; }
            .label-order-label { font-size: 10px; color: #6b7280; }
            .label-order-num { font-size: 14px; font-weight: bold; color: #111; letter-spacing: 1px; }
            .label-customer { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; }
            .label-section-label { font-size: 9px; color: #9ca3af; margin-bottom: 2px; }
            .label-customer-name { font-size: 17px; font-weight: bold; color: #111; line-height: 1.2; }
            .label-customer-phone { font-size: 13px; color: #374151; font-weight: 600; margin-top: 2px; }
            .label-customer-city { font-size: 11px; color: #6b7280; margin-top: 2px; }
            .label-items { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; }
            .label-items-title { font-size: 9px; color: #9ca3af; margin-bottom: 4px; }
            .label-item-row { display: flex; justify-content: space-between; font-size: 11px; color: #374151; line-height: 1.6; }
            .label-item-qty { color: #6b7280; font-weight: 600; }
            .label-totals { padding: 5px 10px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
            .label-total-label { font-size: 10px; color: #6b7280; }
            .label-total-amount { font-size: 15px; font-weight: bold; color: #111; }
            .label-date-row { padding: 4px 10px; border-bottom: 1px solid #d1d5db; display: flex; justify-content: space-between; }
            .label-date-label { font-size: 9px; color: #9ca3af; }
            .label-date-val { font-size: 9px; color: #6b7280; }
            .label-barcode { padding: 8px 10px; display: flex; justify-content: center; flex: 1; align-items: center; }
            @media print {
              body { margin: 0; }
              .label-shell { border: 2px solid #000 !important; }
            }
          </style>
        </head>
        <body>${labelHtml}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.onload = () => setTimeout(() => printWindow.print(), 800)
  }

  const handlePrint = () => activeTab === 'invoice' ? printInvoice() : printLabel()
  const handleDownloadPDF = () => activeTab === 'invoice' ? generateInvoicePDF() : generateLabelPDF()

  if (isLoading) return <LoadingSpinner text="جاري تحميل بيانات الفاتورة..." />

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">حدث خطأ في تحميل بيانات الطلب</div>
          <button onClick={() => navigate('/orders')} className="btn-primary">
            العودة للطلبات
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Top Bar ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 sm:mb-6">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">

            {/* Mobile */}
            <div className="sm:hidden space-y-3">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold text-gray-900">فاتورة الطلب</h1>
                <button
                  onClick={() => navigate('/orders')}
                  className="flex items-center text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 text-sm"
                >
                  <ArrowRight className="h-4 w-4 ml-1" />
                  رجوع
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Printer className="h-4 w-4" />
                  طباعة
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
                >
                  {isGeneratingPDF ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />جاري...</>
                  ) : (
                    <><Download className="h-4 w-4" />تحميل PDF</>
                  )}
                </button>
              </div>
            </div>

            {/* Desktop */}
            <div className="hidden sm:flex items-center justify-between">
              <div className="flex items-center space-x-4 space-x-reverse">
                <button
                  onClick={() => navigate('/orders')}
                  className="flex items-center text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 text-sm"
                >
                  <ArrowRight className="h-5 w-5 ml-2" />
                  العودة للطلبات
                </button>
                <div className="h-6 w-px bg-gray-300" />
                <h1 className="text-xl font-bold text-gray-900">فاتورة الطلب</h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="btn-outline btn-sm flex items-center gap-2 text-sm px-4 py-2"
                >
                  <Printer className="h-4 w-4" />
                  طباعة
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="btn-primary btn-sm flex items-center gap-2 text-sm px-4 py-2"
                >
                  {isGeneratingPDF ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />جاري التحميل...</>
                  ) : (
                    <><Download className="h-4 w-4" />تحميل PDF</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ── Tabs ──────────────────────────────────────────────────────── */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('invoice')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'invoice'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="h-4 w-4" />
              الفاتورة الكاملة
            </button>
            <button
              onClick={() => setActiveTab('label')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'label'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Tag className="h-4 w-4" />
              ملصق الشحن
            </button>
          </div>
        </div>

        {/* ── Invoice Tab ──────────────────────────────────────────────────── */}
        <div className={activeTab === 'invoice' ? 'block' : 'hidden'}>
          <div
            ref={invoiceRef}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-4xl mx-auto mobile-responsive"
            style={{
              fontFamily: 'Cairo, Tajawal, "Noto Sans Arabic", Arial, sans-serif',
              direction: 'rtl',
              textAlign: 'right',
              backgroundColor: '#ffffff',
              color: '#111827',
              fontSize: '16px',
              lineHeight: '1.5',
            }}
          >
            <style>{`
              @media print {
                .mobile-responsive { padding: 0 !important; margin: 0 !important; max-width: 100% !important; transform: scale(0.6) !important; transform-origin: top center !important; }
                .mobile-responsive table { font-size: 0.6rem !important; border-collapse: collapse !important; width: 100% !important; }
                .mobile-responsive th, .mobile-responsive td { padding: 0.1rem 0.2rem !important; border: 1px solid #000 !important; font-size: 0.6rem !important; }
              }
            `}</style>

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-start space-x-4 space-x-reverse flex-1">
                  <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                    <img
                      src="/logo.png"
                      alt="شعار المتجر"
                      className="w-12 h-12 object-contain"
                      onError={(e) => {
                        const t = e.target as HTMLImageElement
                        t.style.display = 'none'
                        t.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                    <div className="hidden text-white font-bold text-lg">SH</div>
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">متجر SH للبخور والعطور</h1>
                    <p className="text-gray-600 text-lg">نلبي جميع احتياجاتكم</p>
                  </div>
                </div>
                <div className="text-left flex-shrink-0 ml-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">فاتورة</h2>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between space-x-4 space-x-reverse">
                      <span className="text-gray-600">رقم الفاتورة:</span>
                      <span className="font-semibold text-gray-900">{order.order_number}</span>
                    </div>
                    <div className="flex items-center justify-between space-x-4 space-x-reverse">
                      <span className="text-gray-600">التاريخ:</span>
                      <span className="font-semibold text-gray-900">{formatDate(order.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">فاتورة إلى:</h3>
                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-gray-900">{order.customer?.name}</h4>
                  <div className="text-gray-600">
                    {order.customer?.address && <div>{order.customer.address}</div>}
                    {order.customer?.city && <div>{order.customer.city}</div>}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-300 mb-8" />

              {/* Items Table */}
              <div className="mb-8">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-right py-3 text-gray-900 font-semibold">المنتج</th>
                      <th className="text-center py-3 text-gray-900 font-semibold">الكمية</th>
                      <th className="text-right py-3 text-gray-900 font-semibold">سعر الوحدة</th>
                      <th className="text-right py-3 text-gray-900 font-semibold">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.order_items?.map((item) => (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="py-4 text-gray-900 font-medium">{item.product?.name}</td>
                        <td className="py-4 text-center text-gray-900">{item.quantity}</td>
                        <td className="py-4 text-right text-gray-900">{formatCurrency(item.unit_price)}</td>
                        <td className="py-4 text-right text-gray-900 font-medium">{formatCurrency(item.total_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="flex justify-start mb-8">
                <div className="w-[28rem] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">المجموع الفرعي:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(order.subtotal)}</span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="flex items-center justify-between text-green-600">
                      <span>الخصم:</span>
                      <span className="font-semibold">-{formatCurrency(order.discount_amount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">المجموع الإجمالي:</span>
                      <span className="text-xl font-bold text-gray-900">{formatCurrency(order.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thank you */}
              <div className="text-center mb-8">
                <div className="w-24 h-px bg-black mx-auto mb-4" />
                <p className="text-gray-700 text-lg">شكراً لاختياركم متجرنا!</p>
              </div>

              {/* Footer */}
              <div className="bg-black text-white p-6 rounded-lg">
                <div className="flex items-center justify-center space-x-8 space-x-reverse">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Phone className="h-5 w-5" />
                    <span>0580090886</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Mail className="h-5 w-5" />
                    <span>contact@shbakhur.com</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Globe className="h-5 w-5" />
                    <span>www.shbakhur.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Shipping Label Tab ────────────────────────────────────────────── */}
        <div className={activeTab === 'label' ? 'flex flex-col items-center' : 'hidden'}>
          <div
            ref={labelRef}
            className="label-shell bg-white rounded border-2 border-gray-800 shadow-lg overflow-hidden w-full max-w-xs"
            style={{ fontFamily: 'Cairo, Tajawal, Arial, sans-serif' }}
          >
            {/* Header */}
            <div className="label-header bg-gray-900 text-white px-4 py-2 flex items-center justify-between">
              <span className="label-header-title font-bold text-base">متجر SH</span>
              <span className="label-header-sub text-xs text-gray-400">ملصق الشحن</span>
            </div>

            {/* Order number */}
            <div className="label-order-row bg-gray-100 px-4 py-2 border-b border-gray-300 flex items-center justify-between">
              <span className="label-order-label text-xs text-gray-500">رقم الطلب</span>
              <span className="label-order-num font-bold text-base tracking-wider text-gray-900">
                #{order.order_number}
              </span>
            </div>

            {/* Customer */}
            <div className="label-customer px-4 py-3 border-b border-gray-200">
              <p className="label-section-label text-xs text-gray-400 mb-1">إلى</p>
              <p className="label-customer-name font-bold text-lg text-gray-900 leading-tight">{order.customer?.name}</p>
              {order.customer?.phone && (
                <p className="label-customer-phone text-sm text-gray-700 font-medium mt-0.5">{order.customer.phone}</p>
              )}
              {(order.customer?.city || order.customer?.address) && (
                <p className="label-customer-city text-xs text-gray-500 mt-1">
                  {[order.customer.city, order.customer.address].filter(Boolean).join(' - ')}
                </p>
              )}
            </div>

            {/* Items */}
            <div className="label-items px-4 py-3 border-b border-gray-200">
              <p className="label-items-title text-xs text-gray-400 mb-1.5">
                المحتويات ({order.order_items?.length ?? 0} منتج)
              </p>
              <div className="space-y-1">
                {order.order_items?.map((item, i) => (
                  <div key={i} className="label-item-row flex justify-between items-center text-xs">
                    <span className="text-gray-800 flex-1 truncate">{item.product?.name}</span>
                    <span className="label-item-qty text-gray-500 font-medium mr-2 flex-shrink-0">× {item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total + Date */}
            <div className="label-totals px-4 py-2 border-b border-gray-200 flex items-center justify-between">
              <div>
                <p className="label-date-label text-xs text-gray-400">تاريخ الطلب</p>
                <p className="label-date-val text-xs text-gray-600">{formatDate(order.created_at)}</p>
              </div>
              <div className="text-left">
                <p className="label-total-label text-xs text-gray-400">الإجمالي</p>
                <p className="label-total-amount font-bold text-base text-gray-900">{formatCurrency(order.total_amount)}</p>
              </div>
            </div>

            {/* Barcode */}
            <div className="label-barcode px-3 py-3 flex justify-center">
              <canvas ref={barcodeRef} />
            </div>
          </div>

          <p className="mt-4 text-xs text-gray-400 text-center">
            حجم الطباعة: 100 × 150 مم — مناسب لورق ملصقات الشحن
          </p>
        </div>

      </div>
    </div>
  )
}

export default ProfessionalInvoicePage

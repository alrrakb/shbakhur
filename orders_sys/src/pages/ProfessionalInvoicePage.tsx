import React, { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ordersApi } from '@/services/api'
import { 
  Download, 
  ArrowRight, 
  Printer, 
  Phone,
  Mail,
  Globe
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/utils'
import LoadingSpinner from '@/components/LoadingSpinner'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import toast from 'react-hot-toast'

const ProfessionalInvoicePage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const invoiceRef = useRef<HTMLDivElement>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getById(orderId!),
    enabled: !!orderId,
  })

  // تحديث عنوان الصفحة عند تحميل البيانات
  React.useEffect(() => {
    if (order?.customer?.name) {
      const originalTitle = document.title
      document.title = order.customer.name.replace(/\s+/g, '_')
      
      // استعادة العنوان الأصلي عند مغادرة الصفحة
      return () => {
        document.title = originalTitle
      }
    }
  }, [order])

  const generatePDF = async () => {
    if (!invoiceRef.current || !order) return

    setIsGeneratingPDF(true)
    try {
      // Wait for fonts to load
      await document.fonts.ready
      
      // Generate canvas from HTML with improved settings
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        removeContainer: true,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Ensure styles are applied in the cloned document
          const clonedElement = clonedDoc.querySelector('[data-html2canvas-ignore]')?.parentElement || clonedDoc.body
          if (clonedElement) {
            clonedElement.style.fontFamily = 'Cairo, Tajawal, "Noto Sans Arabic", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
            clonedElement.style.direction = 'rtl'
            clonedElement.style.textAlign = 'right'
          }
        }
      })

      // Create PDF
      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const imgWidth = 190 // A4 width in mm with margins
      const pageHeight = 280 // A4 height in mm with margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 10 // Add top margin

      // Add first page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Save PDF with customer name only, using underscores instead of spaces
      const customerName = order.customer?.name || 'عميل'
      const fileName = `${customerName.replace(/\s+/g, '_')}.pdf`
      pdf.save(fileName)
      
      toast.success('تم تحميل الفاتورة بنجاح')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('حدث خطأ في تحميل الفاتورة')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const printInvoice = () => {
    if (!invoiceRef.current) return
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      // Get all stylesheets from the current document
      const stylesheets = Array.from(document.styleSheets)
        .map(sheet => {
          try {
            return Array.from(sheet.cssRules)
              .map(rule => rule.cssText)
              .join('\n')
          } catch (e) {
            return ''
          }
        })
        .join('\n')

      printWindow.document.write(`
        <html>
          <head>
            <title>${order?.customer?.name?.replace(/\s+/g, '_') || 'عميل'}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@200;300;400;500;600;700;800;900&display=swap" rel="stylesheet">
            <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;500;700;800;900&display=swap" rel="stylesheet">
            <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet">
            <style>
              ${stylesheets}
              
              * {
                box-sizing: border-box;
              }
              
              body { 
                font-family: 'Cairo', 'Tajawal', 'Noto Sans Arabic', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
                margin: 0 !important;
                padding: 20px !important;
                direction: rtl !important;
                text-align: right !important;
                background: white !important;
                color: #111827 !important;
                font-size: 16px !important;
                line-height: 1.5 !important;
              }
              
              /* Ensure all Tailwind classes work */
              .bg-white { background-color: #ffffff !important; }
              .bg-black { background-color: #000000 !important; }
              .bg-gray-50 { background-color: #f9fafb !important; }
              .bg-gray-100 { background-color: #f3f4f6 !important; }
              .text-white { color: #ffffff !important; }
              .text-gray-900 { color: #111827 !important; }
              .text-gray-600 { color: #4b5563 !important; }
              .text-gray-700 { color: #374151 !important; }
              .text-gray-500 { color: #6b7280 !important; }
              .text-green-600 { color: #059669 !important; }
              .font-bold { font-weight: bold !important; }
              .font-semibold { font-weight: 600 !important; }
              .font-medium { font-weight: 500 !important; }
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
              .shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05) !important; }
              .overflow-hidden { overflow: hidden !important; }
              .max-w-4xl { max-width: 56rem !important; }
              .mx-auto { margin-left: auto !important; margin-right: auto !important; }
              .p-6 { padding: 1.5rem !important; }
              .p-3 { padding: 0.75rem !important; }
              .p-4 { padding: 1rem !important; }
              .px-6 { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
              .py-3 { padding-top: 0.75rem !important; padding-bottom: 0.75rem !important; }
              .py-4 { padding-top: 1rem !important; padding-bottom: 1rem !important; }
              .pt-3 { padding-top: 0.75rem !important; }
              .mb-8 { margin-bottom: 2rem !important; }
              .mb-6 { margin-bottom: 1.5rem !important; }
              .mb-4 { margin-bottom: 1rem !important; }
              .mb-3 { margin-bottom: 0.75rem !important; }
              .mb-2 { margin-bottom: 0.5rem !important; }
              .ml-8 { margin-left: 2rem !important; }
              .space-y-3 > * + * { margin-top: 0.75rem !important; }
              .space-y-2 > * + * { margin-top: 0.5rem !important; }
              .space-x-4 > * + * { margin-right: 1rem !important; }
              .space-x-2 > * + * { margin-right: 0.5rem !important; }
              .space-x-8 > * + * { margin-right: 2rem !important; }
              .space-x-reverse > * + * { margin-right: 0 !important; margin-left: 1rem !important; }
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
              .w-16 { width: 4rem !important; }
              .h-16 { height: 4rem !important; }
              .w-12 { width: 3rem !important; }
              .h-12 { height: 3rem !important; }
              .w-5 { width: 1.25rem !important; }
              .h-5 { height: 1.25rem !important; }
              .w-24 { width: 6rem !important; }
              .h-px { height: 1px !important; }
              .w-80 { width: 20rem !important; }
              .w-[28rem] { width: 28rem !important; }
              .flex-1 { flex: 1 1 0% !important; }
              .flex-shrink-0 { flex-shrink: 0 !important; }
              .whitespace-nowrap { white-space: nowrap !important; }
              .min-w-0 { min-width: 0 !important; }
              .truncate { overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; }
              
              /* Table styles */
              table { width: 100% !important; border-collapse: collapse !important; }
              th, td { padding: 0.75rem 1.5rem !important; text-align: right !important; border-bottom: 1px solid #e5e7eb !important; }
              th { background-color: #f9fafb !important; font-weight: 500 !important; color: #374151 !important; }
              
              /* Print specific styles */
              @media print {
                body { 
                  margin: 0 !important; 
                  padding: 0 !important; 
                  font-size: 12pt !important;
                }
                .no-print { display: none !important; }
                * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
              }
            </style>
          </head>
          <body>
            ${invoiceRef.current.innerHTML}
          </body>
        </html>
      `)
      printWindow.document.close()
      
      // Wait for fonts to load before printing
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
        }, 1000)
      }
    }
  }

  if (isLoading) {
    return <LoadingSpinner text="جاري تحميل بيانات الفاتورة..." />
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">حدث خطأ في تحميل بيانات الطلب</div>
          <button 
            onClick={() => navigate('/orders')}
            className="btn-primary"
          >
            العودة للطلبات
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 sm:mb-6">
          <div className="px-4 sm:px-6 py-4 sm:py-4 border-b border-gray-200">
            {/* Mobile Layout */}
            <div className="sm:hidden space-y-4">
              {/* Title Row */}
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold text-gray-900">فاتورة الطلب</h1>
                <button
                  onClick={() => navigate('/orders')}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  <ArrowRight className="h-4 w-4 ml-2" />
                  رجوع
                </button>
              </div>
              
              {/* Action Buttons Row */}
              <div className="flex items-center justify-center space-x-4 space-x-reverse">
                <button
                  onClick={printInvoice}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors px-4 py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Printer className="h-4 w-4" />
                  طباعة
                </button>
                <button
                  onClick={generatePDF}
                  disabled={isGeneratingPDF}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white transition-colors px-4 py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
                >
                  {isGeneratingPDF ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      جاري...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      تحميل PDF
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center justify-between">
              <div className="flex items-center space-x-4 space-x-reverse">
                <button
                  onClick={() => navigate('/orders')}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                  العودة للطلبات
                </button>
                <div className="h-4 sm:h-6 w-px bg-gray-300"></div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">فاتورة الطلب</h1>
              </div>
              
              <div className="flex items-center space-x-4 space-x-reverse">
                <button
                  onClick={printInvoice}
                  className="btn-outline btn-sm flex items-center gap-2 text-sm px-4 py-2"
                >
                  <Printer className="h-4 w-4" />
                  طباعة
                </button>
                <button
                  onClick={generatePDF}
                  disabled={isGeneratingPDF}
                  className="btn-primary btn-sm flex items-center gap-2 text-sm px-4 py-2"
                >
                  {isGeneratingPDF ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      جاري التحميل...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      تحميل PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Content */}
        <div 
          ref={invoiceRef} 
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-4xl mx-auto mobile-responsive"
          style={{
            fontFamily: 'Cairo, Tajawal, "Noto Sans Arabic", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
            direction: 'rtl',
            textAlign: 'right',
            backgroundColor: '#ffffff',
            color: '#111827',
            fontSize: '16px',
            lineHeight: '1.5'
          }}
        >
          {/* Print and PDF Optimization Styles */}
          <style>{`
            @media print {
              body {
                margin: 0 !important;
                padding: 0 !important;
                font-size: 6pt !important;
                line-height: 1.1 !important;
              }
              
              .mobile-responsive {
                padding: 0.1rem !important;
                margin: 0 !important;
                max-width: 100% !important;
                transform: scale(0.6) !important;
                transform-origin: top center !important;
              }
              
              .mobile-responsive table {
                font-size: 0.6rem !important;
                border-collapse: collapse !important;
                width: 100% !important;
              }
              
              .mobile-responsive th,
              .mobile-responsive td {
                padding: 0.1rem 0.2rem !important;
                border: 1px solid #000 !important;
                font-size: 0.6rem !important;
              }
              
              .mobile-responsive th {
                background-color: #f3f4f6 !important;
                font-weight: bold !important;
              }
              
              .mobile-responsive .text-3xl {
                font-size: 0.8rem !important;
              }
              
              .mobile-responsive .text-xl {
                font-size: 0.7rem !important;
              }
              
              .mobile-responsive .text-lg {
                font-size: 0.6rem !important;
              }
              
              .mobile-responsive .text-base {
                font-size: 0.55rem !important;
              }
              
              .mobile-responsive .text-sm {
                font-size: 0.5rem !important;
              }
              
              .mobile-responsive .w-16 {
                width: 2rem !important;
              }
              
              .mobile-responsive .h-16 {
                height: 2rem !important;
              }
              
              .mobile-responsive .w-12 {
                width: 1.5rem !important;
              }
              
              .mobile-responsive .h-12 {
                height: 1.5rem !important;
              }
              
              .mobile-responsive .w-24 {
                width: 2.5rem !important;
              }
              
              .mobile-responsive .w-\\[28rem\\] {
                width: 12rem !important;
              }
              
              .mobile-responsive .space-x-8 > * + * {
                margin-right: 0.5rem !important;
              }
              
              .mobile-responsive .space-x-4 > * + * {
                margin-right: 0.25rem !important;
              }
              
              .mobile-responsive .space-x-2 > * + * {
                margin-right: 0.125rem !important;
              }
              
              .mobile-responsive .space-y-3 > * + * {
                margin-top: 0.25rem !important;
              }
              
              .mobile-responsive .space-y-2 > * + * {
                margin-top: 0.125rem !important;
              }
              
              .mobile-responsive .mb-8 {
                margin-bottom: 0.5rem !important;
              }
              
              .mobile-responsive .mb-6 {
                margin-bottom: 0.375rem !important;
              }
              
              .mobile-responsive .mb-4 {
                margin-bottom: 0.25rem !important;
              }
              
              .mobile-responsive .mb-2 {
                margin-bottom: 0.125rem !important;
              }
              
              .mobile-responsive .p-6 {
                padding: 0.5rem !important;
              }
              
              .mobile-responsive .py-4 {
                padding-top: 0.25rem !important;
                padding-bottom: 0.25rem !important;
              }
              
              .mobile-responsive .py-3 {
                padding-top: 0.1875rem !important;
                padding-bottom: 0.1875rem !important;
              }
              
              .mobile-responsive .px-6 {
                padding-left: 0.5rem !important;
                padding-right: 0.5rem !important;
              }
              
              .mobile-responsive .pt-3 {
                padding-top: 0.1875rem !important;
              }
              
              .mobile-responsive .h-5 {
                height: 0.75rem !important;
              }
              
              .mobile-responsive .w-5 {
                width: 0.75rem !important;
              }
              
              .mobile-responsive .h-px {
                height: 0.25px !important;
              }
            }
          `}</style>
          {/* Invoice Header */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-8">
              {/* Company Info */}
              <div className="flex items-start space-x-4 space-x-reverse flex-1">
                {/* Logo */}
                <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/logo.png" 
                    alt="شعار المتجر" 
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden text-white font-bold text-lg">SH</div>
                </div>
                
                <div className="flex-1" style={{ flex: '1 1 0%' }}>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>متجر SH للبخور والعطور</h1>
                  <p className="text-gray-600 text-lg" style={{ color: '#4b5563', fontSize: '1.125rem' }}>نلبي جميع احتياجاتكم</p>
                </div>
              </div>
              
              {/* Invoice Details */}
              <div className="text-left flex-shrink-0 ml-8" style={{ textAlign: 'left', flexShrink: 0, marginLeft: '2rem' }}>
                <h2 className="text-3xl font-bold text-gray-900 mb-6" style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', marginBottom: '1.5rem' }}>فاتورة</h2>
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

            {/* Customer Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">فاتورة إلى:</h3>
              <div className="space-y-1">
                <h4 className="text-xl font-bold text-gray-900">{order.customer?.name}</h4>
                <div className="text-gray-600">
                  {order.customer?.address && (
                    <div>{order.customer.address}</div>
                  )}
                  {order.customer?.city && (
                    <div>{order.customer.city}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-300 mb-8"></div>

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
                      <td className="py-4 text-gray-900 font-medium">
                        {item.product?.name}
                      </td>
                      <td className="py-4 text-center text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="py-4 text-right text-gray-900">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="py-4 text-right text-gray-900 font-medium">
                        {formatCurrency(item.total_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary - Moved to left side */}
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

            {/* Thank You Message */}
            <div className="text-center mb-8">
              <div className="w-24 h-px bg-black mx-auto mb-4"></div>
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
    </div>
  )
}

export default ProfessionalInvoicePage

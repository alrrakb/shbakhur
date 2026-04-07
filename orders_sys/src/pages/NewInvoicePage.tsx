import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import { ordersApi } from '@/services/api'
import NewCustomerInvoice from '@/components/NewCustomerInvoice'
import { createInvoicePDF } from '@/utils/newPdfExport'

const NewInvoicePage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()

  // جلب بيانات الطلب
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

  // دالة تحميل PDF
  const handleDownloadPDF = async () => {
    if (!order) return
    
    try {
      await createInvoicePDF(order)
    } catch (error) {
      console.error('خطأ في تحميل PDF:', error)
      alert('حدث خطأ في تحميل الفاتورة. يرجى المحاولة مرة أخرى.')
    }
  }

  // دالة الطباعة
  const handlePrint = () => {
    // تغيير عنوان الصفحة إلى اسم العميل قبل الطباعة
    const originalTitle = document.title
    const customerName = order?.customer?.name || 'عميل'
    document.title = customerName.replace(/\s+/g, '_')
    
    // طباعة الصفحة
    window.print()
    
    // استعادة العنوان الأصلي بعد الطباعة
    setTimeout(() => {
      document.title = originalTitle
    }, 1000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الفاتورة...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">خطأ في تحميل الفاتورة</h2>
          <p className="text-gray-600 mb-4">لم يتم العثور على الطلب المطلوب</p>
          <button
            onClick={() => navigate('/orders')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            العودة إلى الطلبات
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={() => navigate('/orders')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="العودة إلى الطلبات"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Amiri', serif" }}>
                  فاتورة الطلب #{order.order_number}
                </h1>
                <p className="text-sm text-gray-500">
                  تاريخ الطلب: {new Date(order.created_at).toLocaleDateString('ar-SA')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                onClick={handlePrint}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Printer className="h-4 w-4" />
                <span>طباعة</span>
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>تحميل PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="py-8">
        <NewCustomerInvoice order={order} />
      </div>
    </div>
  )
}

export default NewInvoicePage

import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ordersApi } from '@/services/api'
import { ArrowRight, Printer } from 'lucide-react'
import { formatDate, formatCurrency } from '@/utils'
import LoadingSpinner from '@/components/LoadingSpinner'
import QRCodeGenerator from '@/components/QRCodeGenerator'

const ShippingLabelPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getById(orderId!),
    enabled: !!orderId,
  })

  if (isLoading) return <LoadingSpinner />
  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">خطأ في تحميل بيانات الطلب</p>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-gray-200 flex flex-col items-center justify-start p-6 print:p-0 print:bg-white print:block"
      dir="rtl"
    >
      <style>{`
        @media print {
          @page {
            size: 100mm 150mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          #shipping-label {
            width: 100mm;
            min-height: 150mm;
            border: 2px solid #000 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Action Bar */}
      <div className="no-print flex items-center gap-4 mb-6 w-full max-w-xs">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 text-sm"
        >
          <ArrowRight className="h-4 w-4" />
          رجوع
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm mr-auto"
        >
          <Printer className="h-4 w-4" />
          طباعة الملصق
        </button>
      </div>

      {/* Label Card */}
      <div
        id="shipping-label"
        className="bg-white w-full max-w-xs rounded border-2 border-gray-800 shadow-lg overflow-hidden print:shadow-none"
        style={{ fontFamily: 'Cairo, Tajawal, Arial, sans-serif' }}
      >
        {/* Header */}
        <div className="bg-gray-900 text-white px-4 py-2 flex items-center justify-between">
          <span className="font-bold text-base">متجر SH</span>
          <span className="text-xs text-gray-400">ملصق الشحن</span>
        </div>

        {/* Order Number */}
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex items-center justify-between">
          <span className="text-xs text-gray-500">رقم الطلب</span>
          <span className="font-bold text-base tracking-wider text-gray-900">
            #{order.order_number}
          </span>
        </div>

        {/* Customer Info */}
        <div className="px-4 py-3 border-b border-gray-200">
          <p className="text-xs text-gray-400 mb-1">إلى</p>
          <p className="font-bold text-lg text-gray-900 leading-tight">{order.customer?.name}</p>
          {order.customer?.phone && (
            <p className="text-sm text-gray-700 font-medium mt-0.5">{order.customer.phone}</p>
          )}
          {(order.customer?.city || order.customer?.address) && (
            <p className="text-xs text-gray-500 mt-1">
              {[order.customer.city, order.customer.address].filter(Boolean).join(' - ')}
            </p>
          )}
        </div>

        {/* Items */}
        <div className="px-4 py-3 border-b border-gray-200">
          <p className="text-xs text-gray-400 mb-1.5">
            المحتويات ({order.order_items?.length ?? 0} منتج)
          </p>
          <div className="space-y-1">
            {order.order_items?.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-xs">
                <span className="text-gray-800 flex-1 truncate">{item.product?.name}</span>
                <span className="text-gray-500 font-medium mr-2 flex-shrink-0">× {item.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Total + Date */}
        <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">تاريخ الطلب</p>
            <p className="text-xs text-gray-600">{formatDate(order.created_at)}</p>
          </div>
          <div className="text-left">
            <p className="text-xs text-gray-400">الإجمالي</p>
            <p className="font-bold text-base text-gray-900">{formatCurrency(order.total_amount)}</p>
          </div>
        </div>

        {/* Barcode */}
        <div className="px-3 py-3 flex justify-center">
          <QRCodeGenerator
            orderNumber={order.order_number}
            width={240}
            height={55}
          />
        </div>
      </div>

      <p className="no-print mt-4 text-xs text-gray-400 text-center">
        الحجم عند الطباعة: 100 × 150 مم — مناسب لورق الملصقات
      </p>
    </div>
  )
}

export default ShippingLabelPage

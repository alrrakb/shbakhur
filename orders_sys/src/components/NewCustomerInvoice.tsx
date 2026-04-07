import React from 'react'
import { Order } from '@/types'
import { formatDate, formatCurrency } from '@/utils'
import { 
  Package, 
  DollarSign,
  FileText,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin
} from 'lucide-react'
import QRCodeGenerator from './QRCodeGenerator'

interface NewCustomerInvoiceProps {
  order: Order
}

const NewCustomerInvoice: React.FC<NewCustomerInvoiceProps> = ({ order }) => {
  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
            font-size: 12pt !important;
            line-height: 1.4 !important;
          }
          
          .print\\:p-4 {
            padding: 0.5rem !important;
          }
          
          .print\\:mb-4 {
            margin-bottom: 0.5rem !important;
          }
          
          .print\\:mb-6 {
            margin-bottom: 0.75rem !important;
          }
          
          .print\\:mb-8 {
            margin-bottom: 1rem !important;
          }
          
          .print\\:text-sm {
            font-size: 0.875rem !important;
          }
          
          .print\\:text-base {
            font-size: 1rem !important;
          }
          
          .print\\:text-lg {
            font-size: 1.125rem !important;
          }
          
          .print\\:text-xl {
            font-size: 1.25rem !important;
          }
          
          .print\\:text-2xl {
            font-size: 1.5rem !important;
          }
          
          .print\\:text-3xl {
            font-size: 1.875rem !important;
          }
          
          .print\\:scale-90 {
            transform: scale(0.9) !important;
          }
          
          /* Hide mobile cards in print */
          .sm\\:hidden {
            display: none !important;
          }
          
          /* Show desktop table in print */
          .hidden.sm\\:block {
            display: table !important;
          }
          
          /* Ensure proper spacing for print */
          .space-y-3 > * + * {
            margin-top: 0.5rem !important;
          }
          
          .space-y-4 > * + * {
            margin-top: 0.75rem !important;
          }
          
          .space-y-6 > * + * {
            margin-top: 1rem !important;
          }
          
          .space-y-8 > * + * {
            margin-top: 1.25rem !important;
          }
        }
        
        @media screen and (max-width: 640px) {
          .mobile-optimized {
            padding: 0.5rem !important;
            margin: 0 !important;
          }
          
          .mobile-optimized .container {
            max-width: 100% !important;
            padding: 0.25rem !important;
          }
          
          .mobile-optimized table {
            font-size: 0.75rem !important;
          }
          
          .mobile-optimized th,
          .mobile-optimized td {
            padding: 0.25rem !important;
          }
        }
      `}</style>
      
      <div 
        id="invoice-content" 
        className="min-h-screen bg-gradient-to-br from-slate-50 to-white mobile-optimized"
        style={{
          fontFamily: "'Noto Sans Arabic', 'Amiri', 'Cairo', Arial, sans-serif",
          direction: 'rtl'
        }}
      >
        {/* Container */}
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 print:p-4 container">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-t-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4 space-x-reverse">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center">
                <img 
                  src="/logo.png" 
                  alt="شعار المتجر" 
                  className="w-8 h-8 sm:w-12 sm:h-12 object-contain"
                />
              </div>
              <div className="text-center sm:text-right">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2" style={{ fontFamily: "'Amiri', serif" }}>
                  متجر البخور والعود
                </h1>
                <p className="text-slate-300 text-sm sm:text-base lg:text-lg">SH Store</p>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ fontFamily: "'Amiri', serif" }}>
                فاتورة شراء
              </h2>
              <div className="text-slate-300 space-y-1">
                <p className="flex items-center justify-center sm:justify-start space-x-2 space-x-reverse">
                  <span className="font-semibold text-sm sm:text-base">رقم الفاتورة:</span>
                  <span className="font-mono bg-slate-600 px-2 py-1 rounded text-xs sm:text-sm">{order.order_number}</span>
                </p>
                <p className="flex items-center justify-center sm:justify-start space-x-2 space-x-reverse">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">{formatDate(order.created_at, 'dd/MM/yyyy')}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 lg:mb-8 shadow-lg border border-slate-200">
          <div className="flex items-center space-x-3 space-x-reverse mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800" style={{ fontFamily: "'Amiri', serif" }}>
              معلومات العميل
            </h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-bold text-slate-700 mb-2 text-base sm:text-lg" style={{ fontFamily: "'Amiri', serif" }}>
                  {order.customer?.name}
                </h4>
              </div>
              
              {order.customer?.address && (
                <div className="flex items-start space-x-3 space-x-reverse">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-slate-600 font-medium text-sm sm:text-base">العنوان</p>
                    <p className="text-slate-800 text-sm sm:text-base">{order.customer.address}</p>
                  </div>
                </div>
              )}
              
              {order.customer?.city && (
                <div className="flex items-center space-x-3 space-x-reverse">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                  <div>
                    <p className="text-slate-600 font-medium text-sm sm:text-base">المدينة</p>
                    <p className="text-slate-800 text-sm sm:text-base">{order.customer.city}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {order.customer?.phone && (
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                  <div>
                    <p className="text-slate-600 font-medium text-sm sm:text-base">رقم الهاتف</p>
                    <p className="text-slate-800 font-mono text-sm sm:text-base">{order.customer.phone}</p>
                  </div>
                </div>
              )}
              
              {order.customer?.email && (
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                  <div>
                    <p className="text-slate-600 font-medium text-sm sm:text-base">البريد الإلكتروني</p>
                    <p className="text-slate-800 font-mono text-sm sm:text-base">{order.customer.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 lg:mb-8 shadow-lg border border-slate-200">
          <div className="flex items-center space-x-3 space-x-reverse mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800" style={{ fontFamily: "'Amiri', serif" }}>
              تفاصيل المنتجات
            </h3>
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto shadow-lg rounded-xl border border-slate-200">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 to-blue-600">
                  <th className="px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-right font-bold text-white border-l-2 border-indigo-400">
                    <span style={{ fontFamily: "'Cairo', sans-serif", fontSize: '16px', fontWeight: '800', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>المنتج</span>
                  </th>
                  <th className="px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-center font-bold text-white border-l-2 border-indigo-400">
                    <span style={{ fontFamily: "'Cairo', sans-serif", fontSize: '16px', fontWeight: '800', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>الكمية</span>
                  </th>
                  <th className="px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-center font-bold text-white border-l-2 border-indigo-400">
                    <span style={{ fontFamily: "'Cairo', sans-serif", fontSize: '16px', fontWeight: '800', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>السعر</span>
                  </th>
                  <th className="px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-center font-bold text-white">
                    <span style={{ fontFamily: "'Cairo', sans-serif", fontSize: '16px', fontWeight: '800', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>المجموع</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.order_items?.map((item, index) => (
                  <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50 transition-colors`}>
                    <td className="px-4 lg:px-6 py-3 sm:py-4 lg:py-5 border-l-2 border-slate-100">
                      <div>
                        <div className="font-bold text-slate-800 mb-2" style={{ fontFamily: "'Cairo', sans-serif", fontSize: '16px', fontWeight: '700', lineHeight: '1.4' }}>
                          {item.product?.name}
                        </div>
                        {item.product?.categories && item.product.categories.length > 0 && (
                          <div className="text-slate-500 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1.5 rounded-lg inline-block border border-blue-200" style={{ fontFamily: "'Cairo', sans-serif", fontSize: '12px', fontWeight: '500' }}>
                            {item.product.categories[0]?.category?.name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-center border-l-2 border-slate-100">
                      <span className="font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-1.5 rounded-lg shadow-sm" style={{ fontFamily: "'Cairo', sans-serif", fontSize: '16px', fontWeight: '700' }}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-center border-l-2 border-slate-100">
                      <span className="font-bold text-slate-800 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200" style={{ fontFamily: "'Cairo', sans-serif", fontSize: '16px', fontWeight: '700' }}>
                        {formatCurrency(item.unit_price)}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-center">
                      <span className="font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 shadow-sm" style={{ fontFamily: "'Cairo', sans-serif", fontSize: '18px', fontWeight: '800' }}>
                        {formatCurrency(item.total_price)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-4">
            {order.order_items?.map((item, index) => (
              <div key={index} className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-4 border border-slate-200">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-bold text-slate-800 text-base mb-1" style={{ fontFamily: "'Cairo', sans-serif" }}>
                      {item.product?.name}
                    </h4>
                    {item.product?.categories && item.product.categories.length > 0 && (
                      <div className="text-slate-500 bg-blue-100 px-2 py-1 rounded text-xs inline-block">
                        {item.product.categories[0]?.category?.name}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white rounded-lg p-2 border border-slate-200">
                      <p className="text-xs text-slate-600 mb-1">الكمية</p>
                      <p className="font-bold text-slate-800 text-sm">{item.quantity}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-slate-200">
                      <p className="text-xs text-slate-600 mb-1">السعر</p>
                      <p className="font-bold text-slate-800 text-sm">{formatCurrency(item.unit_price)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-green-200">
                      <p className="text-xs text-green-600 mb-1">المجموع</p>
                      <p className="font-bold text-green-600 text-sm">{formatCurrency(item.total_price)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 lg:mb-8 shadow-lg border border-green-200">
          <div className="flex items-center space-x-3 space-x-reverse mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800" style={{ fontFamily: "'Amiri', serif" }}>
              ملخص الطلب
            </h3>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center py-2 sm:py-3 border-b border-green-200">
              <span className="text-slate-600 font-medium text-sm sm:text-base" style={{ fontFamily: "'Amiri', serif" }}>
                المجموع الفرعي:
              </span>
              <span className="font-bold text-slate-800 text-sm sm:text-base">
                {formatCurrency(order.subtotal)}
              </span>
            </div>
            
            {order.discount_amount > 0 && (
              <div className="flex justify-between items-center py-2 sm:py-3 border-b border-green-200">
                <span className="text-slate-600 font-medium text-sm sm:text-base" style={{ fontFamily: "'Amiri', serif" }}>
                  الخصم:
                </span>
                <span className="font-bold text-red-600 text-sm sm:text-base">
                  -{formatCurrency(order.discount_amount)}
                </span>
              </div>
            )}
            
            <div className="pt-3 sm:pt-4">
              <div className="flex justify-between items-center bg-green-100 p-3 sm:p-4 rounded-lg">
                <span className="text-base sm:text-lg font-bold text-slate-800" style={{ fontFamily: "'Amiri', serif" }}>
                  المجموع الإجمالي:
                </span>
                <span className="text-lg sm:text-xl font-bold text-green-600">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {order.notes && (
          <div className="bg-white rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 lg:mb-8 shadow-lg border border-slate-200">
            <div className="flex items-center space-x-3 space-x-reverse mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800" style={{ fontFamily: "'Amiri', serif" }}>
                ملاحظات
              </h3>
            </div>
            <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-200">
              <p className="text-slate-700 leading-relaxed text-sm sm:text-base" style={{ fontFamily: "'Amiri', serif" }}>
                {order.notes}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-b-2xl p-4 sm:p-6 lg:p-8 shadow-2xl">
          <div className="text-center">
            <div className="mb-4 sm:mb-6">
              <h4 className="text-lg sm:text-xl font-bold mb-2" style={{ fontFamily: "'Amiri', serif" }}>
                شكراً لاختياركم متجر SH
              </h4>
              <p className="text-slate-300 mb-3 sm:mb-4 text-sm sm:text-base">
                نقدم لكم أجود أنواع البخور والعود الأصلي
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6 lg:space-x-8 space-x-reverse">
              <div className="text-center">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 sm:mb-2 text-green-400" />
                <p className="text-slate-300 text-xs sm:text-sm">للاستفسارات</p>
                <p className="font-bold text-sm sm:text-base">0580090886</p>
              </div>
              
              <div className="text-center">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 sm:mb-2 text-green-400" />
                <p className="text-slate-300 text-xs sm:text-sm">البريد الإلكتروني</p>
                <p className="font-bold text-sm sm:text-base">contact@shbakhur.com</p>
              </div>
            </div>

            <div className="mt-6 sm:mt-8">
              <QRCodeGenerator 
                orderNumber={order.order_number} 
                width={100}
                height={25}
                className="mx-auto"
              />
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}

export default NewCustomerInvoice

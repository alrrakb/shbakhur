import jsPDF from 'jspdf'
import { Order } from '@/types'
import { formatDate, formatCurrency } from '@/utils'

// إضافة خطوط عربية جميلة
const addArabicFonts = (pdf: jsPDF) => {
  // يمكن إضافة الخطوط هنا في المستقبل إذا لزم الأمر
  // حالياً نستخدم الخطوط الافتراضية في jsPDF
  return pdf
}

// دالة لتحويل النص العربي إلى اتجاه صحيح
const formatArabicText = (text: string): string => {
  // إضافة RTL mark للضمان
  return `\u200F${text}\u200F`
}

// دالة لإنشاء الفاتورة
export const createInvoicePDF = async (order: Order): Promise<void> => {
  try {
    // إنشاء مستند PDF جديد
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // إضافة الخطوط العربية
    addArabicFonts(pdf)

    // الألوان المستخدمة في التصميم
    const colors = {
      primary: '#1f2937',      // رمادي داكن
      secondary: '#6b7280',    // رمادي متوسط
      accent: '#059669',       // أخضر
      light: '#f9fafb',        // رمادي فاتح
      white: '#ffffff',        // أبيض
      border: '#e5e7eb'        // حدود فاتحة
    }

    // الأبعاد
    const pageWidth = 210
    const pageHeight = 297
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)

    let currentY = margin

    // خلفية الفاتورة
    pdf.setFillColor(colors.light)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')

    // إطار الفاتورة
    pdf.setDrawColor(colors.border)
    pdf.setLineWidth(0.5)
    pdf.rect(margin, margin, contentWidth, pageHeight - (margin * 2))

    // ========== رأس الفاتورة ==========
    
    // لوحة الرأس
    pdf.setFillColor(colors.primary)
    pdf.rect(margin, currentY, contentWidth, 40, 'F')
    
    // العنوان الرئيسي
    pdf.setTextColor(colors.white)
    pdf.setFontSize(24)
    pdf.setFont('helvetica', 'bold')
    pdf.text(formatArabicText('فاتورة شراء'), pageWidth / 2, currentY + 15, { align: 'center' })
    
    // رقم الفاتورة
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    pdf.text(formatArabicText(`رقم الفاتورة: ${order.order_number}`), pageWidth / 2, currentY + 25, { align: 'center' })
    
    // تاريخ الفاتورة
    pdf.text(formatArabicText(`تاريخ الطلب: ${formatDate(order.created_at, 'dd/MM/yyyy')}`), pageWidth / 2, currentY + 32, { align: 'center' })

    currentY += 50

    // ========== معلومات العميل ==========
    
    // عنوان قسم العميل
    pdf.setFillColor(colors.accent)
    pdf.rect(margin, currentY, contentWidth, 8, 'F')
    
    pdf.setTextColor(colors.white)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text(formatArabicText('معلومات العميل'), margin + 5, currentY + 6)

    currentY += 15

    // معلومات العميل
    pdf.setTextColor(colors.primary)
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text(formatArabicText(order.customer?.name || ''), margin + 5, currentY)
    currentY += 7

    pdf.setFont('helvetica', 'normal')
    if (order.customer?.address) {
      pdf.text(formatArabicText(`العنوان: ${order.customer.address}`), margin + 5, currentY)
      currentY += 6
    }
    
    if (order.customer?.city) {
      pdf.text(formatArabicText(`المدينة: ${order.customer.city}`), margin + 5, currentY)
      currentY += 6
    }
    
    if (order.customer?.phone) {
      pdf.text(formatArabicText(`الهاتف: ${order.customer.phone}`), margin + 5, currentY)
      currentY += 6
    }
    
    if (order.customer?.email) {
      pdf.text(formatArabicText(`البريد الإلكتروني: ${order.customer.email}`), margin + 5, currentY)
      currentY += 6
    }

    currentY += 10

    // ========== جدول المنتجات ==========
    
    // عنوان قسم المنتجات
    pdf.setFillColor(colors.accent)
    pdf.rect(margin, currentY, contentWidth, 8, 'F')
    
    pdf.setTextColor(colors.white)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text(formatArabicText('تفاصيل المنتجات'), margin + 5, currentY + 6)

    currentY += 15

    // رؤوس الجدول
    const tableHeaders = ['المنتج', 'الكمية', 'السعر', 'المجموع']
    const columnWidths = [80, 25, 35, 35]
    let xPosition = margin + 5

    // خلفية رؤوس الجدول
    pdf.setFillColor(colors.secondary)
    pdf.rect(margin + 5, currentY - 5, contentWidth - 10, 10, 'F')

    // كتابة رؤوس الجدول
    pdf.setTextColor(colors.white)
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    
    tableHeaders.forEach((header, index) => {
      pdf.text(formatArabicText(header), xPosition + (columnWidths[index] / 2), currentY, { align: 'center' })
      xPosition += columnWidths[index]
    })

    currentY += 8

    // بيانات المنتجات
    pdf.setTextColor(colors.primary)
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')

    order.order_items?.forEach((item, index) => {
      // خلفية متناوبة للصفوف
      if (index % 2 === 0) {
        pdf.setFillColor(colors.white)
      } else {
        pdf.setFillColor(colors.light)
      }
      pdf.rect(margin + 5, currentY - 4, contentWidth - 10, 8, 'F')

      // حدود الخلايا
      pdf.setDrawColor(colors.border)
      pdf.setLineWidth(0.2)
      let cellX = margin + 5
      columnWidths.forEach((width) => {
        pdf.line(cellX, currentY - 4, cellX, currentY + 4)
        cellX += width
      })
      pdf.line(margin + 5, currentY - 4, margin + contentWidth - 5, currentY - 4)
      pdf.line(margin + 5, currentY + 4, margin + contentWidth - 5, currentY + 4)

      // كتابة البيانات
      xPosition = margin + 5
      
      // اسم المنتج والتصنيف
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(11)
      pdf.text(formatArabicText(item.product?.name || ''), xPosition + 2, currentY)
      
      if (item.product?.categories && item.product.categories.length > 0) {
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(9)
        pdf.setTextColor(colors.secondary)
        pdf.text(formatArabicText(item.product.categories[0]?.category?.name || ''), xPosition + 2, currentY + 3)
        pdf.setFontSize(11)
        pdf.setTextColor(colors.primary)
      }
      
      xPosition += columnWidths[0]

      // الكمية
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(11)
      pdf.text(item.quantity.toString(), xPosition + (columnWidths[1] / 2), currentY, { align: 'center' })
      xPosition += columnWidths[1]

      // السعر
      pdf.text(formatCurrency(item.unit_price), xPosition + (columnWidths[2] / 2), currentY, { align: 'center' })
      xPosition += columnWidths[2]

      // المجموع
      pdf.setFontSize(12)
      pdf.text(formatCurrency(item.total_price), xPosition + (columnWidths[3] / 2), currentY, { align: 'center' })

      currentY += 8
    })

    currentY += 15

    // ========== ملخص الطلب ==========
    
    // عنوان قسم الملخص
    pdf.setFillColor(colors.accent)
    pdf.rect(margin, currentY, contentWidth, 8, 'F')
    
    pdf.setTextColor(colors.white)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text(formatArabicText('ملخص الطلب'), margin + 5, currentY + 6)

    currentY += 15

    // تفاصيل الملخص
    const summaryItems = [
      { label: 'المجموع الفرعي', value: formatCurrency(order.subtotal) },
    ]

    if (order.discount_amount > 0) {
      summaryItems.push({
        label: 'الخصم',
        value: `-${formatCurrency(order.discount_amount)}`
      })
    }

    summaryItems.push({
      label: 'المجموع الإجمالي',
      value: formatCurrency(order.total_amount)
    })

    // رسم خلفية الملخص
    pdf.setFillColor(colors.white)
    pdf.rect(margin + 5, currentY - 5, contentWidth - 10, summaryItems.length * 8 + 5, 'F')

    // حدود الملخص
    pdf.setDrawColor(colors.border)
    pdf.setLineWidth(0.3)
    pdf.rect(margin + 5, currentY - 5, contentWidth - 10, summaryItems.length * 8 + 5)

    // كتابة عناصر الملخص
    pdf.setTextColor(colors.primary)
    pdf.setFontSize(11)

    summaryItems.forEach((item, index) => {
      const isTotal = item.label === 'المجموع الإجمالي'
      
      if (isTotal) {
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(12)
        pdf.setFillColor(colors.light)
        pdf.rect(margin + 5, currentY - 2, contentWidth - 10, 8, 'F')
      } else {
        pdf.setFont('helvetica', 'normal')
      }

      pdf.text(formatArabicText(item.label), margin + 10, currentY + 2)
      pdf.text(item.value, margin + contentWidth - 15, currentY + 2, { align: 'right' })

      if (index < summaryItems.length - 1) {
        pdf.setDrawColor(colors.border)
        pdf.setLineWidth(0.2)
        pdf.line(margin + 10, currentY + 4, margin + contentWidth - 10, currentY + 4)
      }

      currentY += 8
    })

    currentY += 20

    // ========== الملاحظات ==========
    
    if (order.notes) {
      // عنوان قسم الملاحظات
      pdf.setFillColor(colors.accent)
      pdf.rect(margin, currentY, contentWidth, 8, 'F')
      
      pdf.setTextColor(colors.white)
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text(formatArabicText('ملاحظات'), margin + 5, currentY + 6)

      currentY += 15

      // خلفية الملاحظات
      pdf.setFillColor(colors.white)
      pdf.rect(margin + 5, currentY - 5, contentWidth - 10, 20, 'F')
      
      // حدود الملاحظات
      pdf.setDrawColor(colors.border)
      pdf.setLineWidth(0.3)
      pdf.rect(margin + 5, currentY - 5, contentWidth - 10, 20)

      // كتابة الملاحظات
      pdf.setTextColor(colors.primary)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      
      const notesLines = pdf.splitTextToSize(formatArabicText(order.notes), contentWidth - 20)
      notesLines.forEach((line: string) => {
        pdf.text(line, margin + 10, currentY + 2)
        currentY += 4
      })

      currentY += 10
    }

    // ========== التذييل ==========
    
    currentY = pageHeight - 40

    // خط فاصل
    pdf.setDrawColor(colors.border)
    pdf.setLineWidth(0.5)
    pdf.line(margin, currentY, margin + contentWidth, currentY)

    currentY += 10

    // رسالة الشكر
    pdf.setTextColor(colors.accent)
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text(formatArabicText('شكراً لاختياركم متجر SH'), pageWidth / 2, currentY, { align: 'center' })

    currentY += 8

    // معلومات الاتصال
    pdf.setTextColor(colors.secondary)
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.text(formatArabicText('للاستفسارات: 0580090886 | contact@shbakhur.com'), pageWidth / 2, currentY, { align: 'center' })

    // حفظ الملف
    const filename = `invoice-${order.order_number}.pdf`
    pdf.save(filename)

    console.log('تم إنشاء الفاتورة بنجاح:', filename)
    
  } catch (error) {
    console.error('خطأ في إنشاء الفاتورة:', error)
    throw error
  }
}

// دالة بديلة لتصدير الفاتورة
export const exportInvoiceToPDF = async (order: Order): Promise<void> => {
  return createInvoicePDF(order)
}

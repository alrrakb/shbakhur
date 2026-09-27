/**
 * Bolesa (بوليصة) Shipping API Integration Library
 */

export interface BolesaCreateShipmentParams {
  order_id: number | string;
  order_number: string;
  payment_type: 'cod' | 'cc';
  price: number;
  description?: string;
  weight?: number;
  number_of_pieces?: number;
  order_status?: string;
  shipping_carrier?: string;
  shipping_types?: 'regular' | 'odd' | 'cold' | 'heavy';
  // Shipper details (Sender / Store Warehouse)
  shipper_name?: string;
  shipper_phone?: string;
  shipper_city?: string;
  shipper_address_line_1?: string;
  shipper_country_code?: string;
  shipper_short_address?: string;
  // Consignee details (Customer)
  consignee_name: string;
  consignee_phone: string;
  consignee_city: string;
  consignee_address_line_1: string;
  consignee_country_code?: string;
  consignee_short_address?: string;
}

export interface BolesaShipmentResponse {
  success: boolean;
  message?: string;
  data?: any;
  order?: any;
  tracking_number?: string;
  carrier?: string;
  pdf_url?: string;
  bill_link?: string;
  error?: string;
}

const BOLESA_API_URL = process.env.BOLESA_API_URL || 'https://app.bolesa.net/api';
const BOLESA_API_KEY = process.env.BOLESA_API_KEY;

function getHeaders() {
  if (!BOLESA_API_KEY) {
    throw new Error('BOLESA_API_KEY is not configured in environment variables');
  }
  return {
    'x-api-key': BOLESA_API_KEY,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
}

/**
 * Normalizes phone numbers to standard international 009665XXXXXXXX format required by Bolesa
 */
export function formatBolesaPhone(phone: string): string {
  if (!phone) return '00966500000000';
  const clean = phone.replace(/[^\d]/g, '');
  if (clean.startsWith('00966')) return clean;
  if (clean.startsWith('966')) return '00' + clean;
  if (clean.startsWith('05')) return '00966' + clean.slice(1);
  if (clean.startsWith('5') && clean.length === 9) return '00966' + clean;
  return '00966' + clean;
}

/**
 * Normalizes Order IDs into valid positive integers required by Bolesa API
 */
export function formatBolesaOrderId(orderId: string | number, orderNumber?: string): number {
  if (typeof orderId === 'number' && orderId > 0) return orderId;
  const raw = `${orderNumber || ''}${orderId || ''}`.replace(/\D/g, '');
  if (raw.length >= 4) {
    // Return last 8 digits as safe integer
    return Number(raw.slice(-8));
  }
  return Math.floor(100000 + Math.random() * 900000);
}

/**
 * Creates an Air Waybill (AWB) / Shipping Order in Bolesa.
 */
export async function createBolesaShipment(
  params: BolesaCreateShipmentParams
): Promise<BolesaShipmentResponse> {
  const cleanBaseUrl = BOLESA_API_URL.replace(/\/+$/, '');
  const url = `${cleanBaseUrl}/integrations/create-awb/custom_integration`;

  // Default sender / warehouse info from env if not provided
  const shipper_name = params.shipper_name || process.env.BOLESA_SHIPPER_NAME || 'متجر شخاليل وبخور';
  const shipper_phone = formatBolesaPhone(params.shipper_phone || process.env.BOLESA_SHIPPER_PHONE || '0562578282');
  const shipper_city = params.shipper_city || process.env.BOLESA_SHIPPER_CITY || 'الرياض';
  const shipper_address_line_1 =
    params.shipper_address_line_1 || process.env.BOLESA_SHIPPER_ADDRESS || 'حي الملقا - شارع أنس بن مالك';
  const shipper_country_code =
    params.shipper_country_code || process.env.BOLESA_SHIPPER_COUNTRY_CODE || 'SA';

  const numericOrderId = formatBolesaOrderId(params.order_id, params.order_number);

  const payload: Record<string, any> = {
    order_id: numericOrderId,
    order_number: numericOrderId,
    payment_type: params.payment_type || 'cod',
    price: Number(params.price.toFixed(2)),
    description: params.description || 'بخور وعطور ومستلزمات فاخرة',
    weight: params.weight || 0.5,
    number_of_pieces: params.number_of_pieces || 1,
    order_status: 'delivered', // Required status keyword by Bolesa API validator
    shipping_types: params.shipping_types || 'regular',
    shipping_carrier: params.shipping_carrier || 'smsa', // Required carrier specification
    // Shipper
    shipper_name,
    shipper_phone,
    shipper_city,
    shipper_address_line_1,
    shipper_country_code,
    // Consignee
    consignee_name: params.consignee_name,
    consignee_phone: formatBolesaPhone(params.consignee_phone),
    consignee_city: params.consignee_city || 'الرياض',
    consignee_address_line_1: params.consignee_address_line_1 || params.consignee_city || 'العنوان',
    consignee_country_code: params.consignee_country_code || 'SA',
  };

  if (params.shipper_short_address) {
    payload.shipper_short_address = params.shipper_short_address;
  }
  if (params.consignee_short_address) {
    payload.consignee_short_address = params.consignee_short_address;
  }

  try {
    console.log('[Bolesa API Request]:', { url, payload });
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    console.log('[Bolesa API Response]:', { status: res.status, data });

    // Strict validation: check HTTP status AND API payload success flag
    if (!res.ok || data.success === false) {
      const failReason = data.order?.fail_reason || data.message || data.error || `HTTP Error ${res.status}`;
      return {
        success: false,
        error: typeof failReason === 'object' ? JSON.stringify(failReason) : String(failReason),
        data,
      };
    }

    const orderObj = data.order || data.data || data;

    const tracking_number =
      orderObj.tracking_number ||
      orderObj.number ||
      orderObj.awb_number ||
      orderObj.airwaybill_number ||
      data.tracking_number;

    const carrier =
      orderObj.carrier ||
      orderObj.shipping_carrier ||
      payload.shipping_carrier ||
      'smsa';

    const pdf_url =
      orderObj.public_link ||
      orderObj.label ||
      orderObj.url ||
      orderObj.bill_link ||
      data.pdf_url ||
      data.url;

    const bill_link = orderObj.bill_link;

    if (!tracking_number) {
      return {
        success: false,
        error: 'لم يتم استلام رقم التتبع من بوليصة',
        data,
      };
    }

    return {
      success: true,
      message: data.message || 'تم إصدار بوليصة الشحن بنجاح',
      data,
      order: orderObj,
      tracking_number: String(tracking_number),
      carrier: String(carrier),
      pdf_url: pdf_url ? String(pdf_url) : undefined,
      bill_link: bill_link ? String(bill_link) : undefined,
    };
  } catch (err: any) {
    console.error('createBolesaShipment error:', err);
    return {
      success: false,
      error: err.message || 'Network error occurred while contacting Bolesa',
    };
  }
}

/**
 * Generates a printable Combined PDF shipping label for tracking numbers.
 */
export async function getBolesaCombinedPdf(
  trackingNumbers: string[]
): Promise<{ success: boolean; url?: string; error?: string }> {
  const cleanBaseUrl = BOLESA_API_URL.replace(/\/+$/, '');
  const url = `${cleanBaseUrl}/integrations/generate-combined-pdf`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ tracking_numbers: trackingNumbers }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && (data.success || data.url)) {
      const pdfUrl = data.url || data.data?.url || data.pdf_url;
      if (pdfUrl) {
        return { success: true, url: pdfUrl };
      }
    }
    return { success: false, error: data.message || data.error || 'Failed to generate PDF label' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetches existing orders from Bolesa.
 */
export async function listBolesaOrders(page: number = 1) {
  const cleanBaseUrl = BOLESA_API_URL.replace(/\/+$/, '');
  const url = `${cleanBaseUrl}/integrations/list-of-orders?page=${page}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });
    return await res.json().catch(() => ({}));
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

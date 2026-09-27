import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin client using Service Role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_Service_role_key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Webhook handler for Bolesa (بوليصة) shipping events.
 * Handles:
 * 1. Order updates after AWB creation (saves tracking number & carrier)
 * 2. Pending AWB notices
 * 3. Shipment status updates (shipped, delivered, out_for_delivery, failed)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    console.log('Received Bolesa Webhook payload:', JSON.stringify(body, null, 2));

    const orderNumber = body.order_number || body.order_id || body.merchant_order_id;
    const trackingNumber = body.tracking_number || body.awb_number || body.tracking_code;
    const carrier = body.carrier || body.shipping_carrier;
    const status = body.status || body.shipment_status || body.event;

    if (orderNumber) {
      const updateData: Record<string, any> = {};

      if (trackingNumber) {
        updateData.tracking_number = trackingNumber;
      }
      if (carrier) {
        updateData.shipping_carrier = carrier;
      }

      // Map Bolesa status to store order status
      if (status) {
        const normalizedStatus = String(status).toLowerCase();
        if (
          normalizedStatus.includes('delivered') ||
          normalizedStatus.includes('completed') ||
          normalizedStatus.includes('تم التوصيل')
        ) {
          updateData.status = 'delivered';
        } else if (
          normalizedStatus.includes('ship') ||
          normalizedStatus.includes('transit') ||
          normalizedStatus.includes('out_for_delivery') ||
          normalizedStatus.includes('تم الشحن')
        ) {
          updateData.status = 'shipped';
        } else if (
          normalizedStatus.includes('cancel') ||
          normalizedStatus.includes('fail') ||
          normalizedStatus.includes('ملغي')
        ) {
          updateData.status = 'cancelled';
        }
      }

      if (Object.keys(updateData).length > 0) {
        // Try updating by order_number first, or by id
        const { error: updateError } = await supabaseAdmin
          .from('orders')
          .update(updateData)
          .eq('order_number', String(orderNumber));

        if (updateError) {
          console.error('Error updating order by order_number:', updateError);
          // Fallback to update by ID
          await supabaseAdmin
            .from('orders')
            .update(updateData)
            .eq('id', String(orderNumber));
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook processed successfully' });
  } catch (err: any) {
    console.error('Bolesa Webhook error:', err);
    return NextResponse.json({ error: 'Internal server error', details: err?.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Bolesa Webhook endpoint is active and listening.' });
}

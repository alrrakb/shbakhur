import { NextRequest, NextResponse } from 'next/server';
import { createBolesaShipment } from '@/lib/bolesa';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_Service_role_key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Fetch order with customer details and items
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, customers(*), order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found in database' }, { status: 404 });
    }

    const customer = order.customers || {};
    const itemsDescription = (order.order_items || [])
      .map((item: any) => `${item.product_name} (${item.quantity})`)
      .join(', ') || 'منتجات بخور وعطور';

    const paymentType = order.payment_method === 'cod' ? 'cod' : 'cc';

    // Call Bolesa API
    const bolesaResult = await createBolesaShipment({
      order_id: order.id,
      order_number: order.order_number,
      payment_type: paymentType,
      price: order.total_amount || 0,
      description: itemsDescription,
      weight: 0.5,
      number_of_pieces: 1,
      order_status: 'processing',
      consignee_name: customer.name || 'العميل',
      consignee_phone: customer.phone || '0500000000',
      consignee_city: customer.city || 'الرياض',
      consignee_address_line_1: customer.address || customer.city || 'العنوان',
    });

    if (!bolesaResult.success) {
      return NextResponse.json(
        { error: bolesaResult.error || 'Failed to create shipment in Bolesa', details: bolesaResult.data },
        { status: 400 }
      );
    }

    // Update order in database with tracking number, carrier and PDF url
    const updatePayload: Record<string, any> = {
      status: 'shipped',
      tracking_number: bolesaResult.tracking_number,
      shipping_carrier: bolesaResult.carrier || 'بوليصة (Bolesa)',
    };
    if (bolesaResult.pdf_url) {
      updatePayload.bolesa_pdf_url = bolesaResult.pdf_url;
    }

    await supabaseAdmin.from('orders').update(updatePayload).eq('id', orderId);

    return NextResponse.json({
      success: true,
      message: 'Shipment created successfully in Bolesa',
      tracking_number: bolesaResult.tracking_number,
      carrier: bolesaResult.carrier,
      pdf_url: bolesaResult.pdf_url,
    });
  } catch (err: any) {
    console.error('API create Bolesa shipment error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

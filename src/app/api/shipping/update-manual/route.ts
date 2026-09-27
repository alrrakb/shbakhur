import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_Service_role_key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { orderId, tracking_number, shipping_carrier, unlink } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    if (unlink) {
      // Unlink shipment
      const { error } = await supabaseAdmin
        .from('orders')
        .update({
          tracking_number: null,
          shipping_carrier: null,
          bolesa_pdf_url: null,
        })
        .eq('id', orderId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Shipment unlinked successfully' });
    }

    // Update tracking number & carrier manually
    const updatePayload: Record<string, any> = {};
    if (tracking_number !== undefined) updatePayload.tracking_number = tracking_number;
    if (shipping_carrier !== undefined) updatePayload.shipping_carrier = shipping_carrier;

    const { error } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Shipping info updated successfully',
      tracking_number,
      shipping_carrier,
    });
  } catch (err: any) {
    console.error('Update shipping error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

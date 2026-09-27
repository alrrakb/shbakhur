import { NextRequest, NextResponse } from 'next/server';
import { getBolesaCombinedPdf } from '@/lib/bolesa';

export async function POST(req: NextRequest) {
  try {
    const { trackingNumbers } = await req.json();

    if (!trackingNumbers || !Array.isArray(trackingNumbers) || trackingNumbers.length === 0) {
      return NextResponse.json({ error: 'Tracking numbers array is required' }, { status: 400 });
    }

    const result = await getBolesaCombinedPdf(trackingNumbers);

    if (!result.success || !result.url) {
      return NextResponse.json({ error: result.error || 'Failed to fetch label PDF' }, { status: 400 });
    }

    return NextResponse.json({ success: true, url: result.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

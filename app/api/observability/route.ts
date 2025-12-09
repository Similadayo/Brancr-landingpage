import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge'; // Use edge runtime for better performance

/**
 * Custom observability endpoint
 * Receives error logs, events, and metrics from the client
 * 
 * In production, you should:
 * 1. Store these in a database (PostgreSQL, MongoDB, etc.)
 * 2. Forward to a logging service (CloudWatch, Datadog, etc.)
 * 3. Set up alerts based on error rates
 * 4. Create dashboards for monitoring
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, payload } = body;

    // Extract tenant ID from request if available
    const tenantId = request.headers.get('x-tenant-id') || payload?.tenant_id;

    // Log to console (in production, replace with your logging solution)
    if (type === 'error') {
      console.error('[Observability Error]', {
        tenant_id: tenantId,
        ...payload,
      });
    } else if (type === 'log') {
      console.log('[Observability Log]', {
        tenant_id: tenantId,
        ...payload,
      });
    } else if (type === 'event') {
      console.log('[Observability Event]', {
        tenant_id: tenantId,
        ...payload,
      });
    }

    // TODO: Store in your database/logging service
    // Example:
    // await db.errors.create({
    //   tenant_id: tenantId,
    //   type,
    //   payload,
    //   created_at: new Date(),
    // });

    // TODO: Set up alerts
    // Example:
    // if (type === 'error' && errorRate > threshold) {
    //   await sendAlert('High error rate detected');
    // }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[Observability] Failed to process request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process observability data' },
      { status: 500 }
    );
  }
}


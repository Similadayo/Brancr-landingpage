
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(
    _request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = cookies();
        const sessionCookie = cookieStore.get('brancr_tenant_session');

        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "https://api.brancr.com";
        const response = await fetch(`${baseUrl}/api/tenant/orders/${params.id}/requirements`, {
            headers: {
                'Authorization': `Bearer ${sessionCookie.value}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch order requirements' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Order requirements proxy error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

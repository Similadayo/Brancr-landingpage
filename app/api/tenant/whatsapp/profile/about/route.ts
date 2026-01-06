import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || 'https://api.brancr.com';

// GET /api/tenant/whatsapp/profile/about
export async function GET(req: NextRequest) {
  try {
    // Get authorization token from header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Forward request to backend API
    const response = await fetch(`${API_BASE_URL}/tenant/whatsapp/profile/about`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error getting WhatsApp profile about:', error);
    return NextResponse.json(
      { error: 'api_error', message: `Failed to get profile about: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// PUT /api/tenant/whatsapp/profile/about
export async function PUT(req: NextRequest) {
  try {
    // Get authorization token from header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Get request body
    const body = await req.json();

    // Validate about text length (512 characters max)
    if (body.about && body.about.length > 512) {
      return NextResponse.json(
        { error: 'validation_error', message: 'About text must not exceed 512 characters' },
        { status: 400 }
      );
    }

    // Forward request to backend API
    const response = await fetch(`${API_BASE_URL}/tenant/whatsapp/profile/about`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error updating WhatsApp profile about:', error);
    return NextResponse.json(
      { error: 'api_error', message: `Failed to update profile about: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}


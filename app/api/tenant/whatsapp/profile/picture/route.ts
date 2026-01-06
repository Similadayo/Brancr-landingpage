import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || 'https://api.brancr.com';

// GET /api/tenant/whatsapp/profile/picture
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
    const response = await fetch(`${API_BASE_URL}/tenant/whatsapp/profile/picture`, {
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
    console.error('Error getting WhatsApp profile picture:', error);
    return NextResponse.json(
      { error: 'api_error', message: `Failed to get profile picture: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// PUT /api/tenant/whatsapp/profile/picture
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

    // Get form data from request
    const formData = await req.formData();
    const image = formData.get('image') as File | null;

    if (!image) {
      return NextResponse.json(
        { error: 'missing_file', message: "Image file is required. Use form field 'image'" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (image.size > maxSize) {
      return NextResponse.json(
        { error: 'file_too_large', message: 'Image file size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Create new FormData to forward to backend
    const backendFormData = new FormData();
    backendFormData.append('image', image);

    // Forward request to backend API
    const response = await fetch(`${API_BASE_URL}/tenant/whatsapp/profile/picture`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type - let fetch set it with boundary
      },
      body: backendFormData,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error updating WhatsApp profile picture:', error);
    return NextResponse.json(
      { error: 'api_error', message: `Failed to update profile picture: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}


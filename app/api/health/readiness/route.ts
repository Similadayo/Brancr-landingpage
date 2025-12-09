import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if critical services are available
    const checks = {
      api: true, // In production, check if backend API is reachable
      database: true, // In production, check database connection
      cache: true, // In production, check cache connection
    };

    const allHealthy = Object.values(checks).every((check) => check === true);

    if (allHealthy) {
      return NextResponse.json(
        {
          status: 'ready',
          timestamp: new Date().toISOString(),
          checks,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        status: 'not ready',
        timestamp: new Date().toISOString(),
        checks,
      },
      { status: 503 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}


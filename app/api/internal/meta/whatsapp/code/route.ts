import { NextRequest, NextResponse } from "next/server";

const META_TOKEN_ENDPOINT = "https://graph.facebook.com/v24.0/oauth/access_token";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code: string | undefined = body?.code;

    if (!code) {
      return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
    }

    const clientId = process.env.NEXT_PUBLIC_META_APP_ID;
    const clientSecret = process.env.META_APP_SECRET;
    const redirectUri = process.env.META_WHATSAPP_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        {
          error: "Meta credentials are not fully configured",
        },
        { status: 500 },
      );
    }

    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    });

    const tokenResponse = await fetch(`${META_TOKEN_ENDPOINT}?${params.toString()}`, {
      method: "GET",
    });
    const tokenPayload = await tokenResponse.json();

    if (!tokenResponse.ok) {
      const message =
        typeof tokenPayload?.error?.message === "string"
          ? tokenPayload.error.message
          : "Meta token exchange failed";

      return NextResponse.json({ error: message }, { status: tokenResponse.status });
    }

    // TODO: persist the decrypted business token temporarily or enqueue a job
    // For now we simply acknowledge the exchange.
    return NextResponse.json({ success: true, data: tokenPayload });
  } catch (error) {
    console.error("Failed to exchange Meta authorization code", error);
    return NextResponse.json({ error: "Unexpected error exchanging code" }, { status: 500 });
  }
}


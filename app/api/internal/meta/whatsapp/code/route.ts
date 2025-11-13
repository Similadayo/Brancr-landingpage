import { NextRequest, NextResponse } from "next/server";
import { META_CONFIG, getMetaSecret } from "@/app/config/meta";

const META_TOKEN_ENDPOINT = "https://graph.facebook.com/v24.0/oauth/access_token";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code: string | undefined = body?.code;

    console.log("📥 Received code exchange request, code present:", !!code);

    if (!code) {
      return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
    }

    const clientId = META_CONFIG.appId;
    const clientSecret = getMetaSecret();
    const redirectUri = META_CONFIG.redirectUri;

    console.log("🔑 Using credentials:", {
      clientId,
      redirectUri,
      hasSecret: !!clientSecret,
    });

    if (!clientId || !clientSecret || !redirectUri) {
      console.error("❌ Missing Meta credentials");
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

    console.log("🌐 Calling Meta token endpoint:", META_TOKEN_ENDPOINT);

    const tokenResponse = await fetch(`${META_TOKEN_ENDPOINT}?${params.toString()}`, {
      method: "GET",
    });
    const tokenPayload = await tokenResponse.json();

    console.log("📨 Meta response status:", tokenResponse.status);

    if (!tokenResponse.ok) {
      const message =
        typeof tokenPayload?.error?.message === "string"
          ? tokenPayload.error.message
          : "Meta token exchange failed";

      console.error("❌ Token exchange failed:", tokenPayload);
      return NextResponse.json({ error: message, details: tokenPayload }, { status: tokenResponse.status });
    }

    console.log("✅ Token exchange successful");
    // TODO: persist the decrypted business token temporarily or enqueue a job
    // For now we simply acknowledge the exchange.
    return NextResponse.json({ success: true, data: tokenPayload });
  } catch (error) {
    console.error("💥 Exception in code exchange:", error);
    return NextResponse.json(
      { 
        error: "Unexpected error exchanging code", 
        details: error instanceof Error ? error.message : String(error) 
      }, 
      { status: 500 }
    );
  }
}


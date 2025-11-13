import { NextRequest, NextResponse } from "next/server";

type EmbeddedSignupPayload = {
  type: string;
  phone_number_id?: string;
  waba_id?: string;
  business_id?: string;
  [key: string]: unknown;
};

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as EmbeddedSignupPayload;

    if (payload?.type !== "WA_EMBEDDED_SIGNUP") {
      return NextResponse.json({ error: "Unsupported payload type" }, { status: 400 });
    }

    if (!payload.phone_number_id || !payload.waba_id || !payload.business_id) {
      return NextResponse.json(
        { error: "Missing WhatsApp embedded signup fields" },
        { status: 400 },
      );
    }

    // TODO: associate this payload with the tenant initiating the flow and persist it.
    // For now, we simply acknowledge the receipt for debugging purposes.
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to store Meta embedded signup session", error);
    return NextResponse.json({ error: "Unexpected error storing session" }, { status: 500 });
  }
}


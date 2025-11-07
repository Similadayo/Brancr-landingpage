import { NextRequest, NextResponse } from "next/server";
import { notifyWaitlistSignup } from "@/lib/waitlistNotifications";
import { getWaitlistEntries, saveWaitlistEntry } from "@/lib/waitlistStorage";

export async function GET() {
  try {
    const entries = await getWaitlistEntries();
    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Failed to read waitlist entries:", error);
    return NextResponse.json({ error: "Unable to read waitlist entries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingEntries = await getWaitlistEntries();

    if (existingEntries.some((entry) => entry.email.toLowerCase() === normalizedEmail)) {
      return NextResponse.json(
        { message: "You are already on the waitlist." },
        { status: 200 }
      );
    }

    const record = await saveWaitlistEntry({ name: name.trim(), email: normalizedEmail });

    await notifyWaitlistSignup(record);

    return NextResponse.json(
      { message: "Successfully joined waitlist", entry: record },
      { status: 200 }
    );
  } catch (error) {
    console.error("Waitlist submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


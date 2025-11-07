import { NextRequest, NextResponse } from "next/server";
import { notifyWaitlistSignup } from "@/lib/waitlistNotifications";
import { getWaitlistEntries, saveWaitlistEntry } from "@/lib/waitlistStorage";

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

export async function GET() {
  try {
    const entries = await getWaitlistEntries();
    return jsonResponse({ entries });
  } catch (error) {
    console.error("Failed to read waitlist entries:", error);
    return jsonResponse({ error: "Unable to read waitlist entries" }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return jsonResponse({ error: "Name and email are required" }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return jsonResponse({ error: "Invalid email address" }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingEntries = await getWaitlistEntries();

    if (existingEntries.some((entry) => entry.email.toLowerCase() === normalizedEmail)) {
      return jsonResponse({ message: "You are already on the waitlist." });
    }

    const record = await saveWaitlistEntry({ name: name.trim(), email: normalizedEmail });

    await notifyWaitlistSignup(record);

    return jsonResponse({ message: "Successfully joined waitlist", entry: record });
  } catch (error) {
    console.error("Waitlist submission error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}


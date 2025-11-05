import { NextRequest, NextResponse } from "next/server";

// This is a placeholder implementation
// In production, replace this with Supabase or Airtable integration
// Example for Supabase:
// import { createClient } from '@supabase/supabase-js'
// const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email } = body;

    // Validation
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // TODO: Replace with actual database integration
    // Example for Supabase:
    // const { error } = await supabase
    //   .from('waitlist')
    //   .insert([{ name, email, created_at: new Date().toISOString() }])
    
    // Example for Airtable:
    // const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Waitlist`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     fields: { Name: name, Email: email }
    //   })
    // });

    // For now, just log and return success
    console.log("Waitlist submission:", { name, email, timestamp: new Date() });

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json(
      { message: "Successfully joined waitlist", name, email },
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


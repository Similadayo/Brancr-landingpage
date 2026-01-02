import { NextResponse } from 'next/server';

export async function GET() {
    // Mock data for the adventure widget
    const checklist = [
        {
            id: "1",
            title: "Connect Instagram",
            description: "Link your Instagram Professional account to start automating DMs",
            complete: false,
            action_url: "/app/integrations",
            icon: "📸",
            xp: 50
        },
        {
            id: "2",
            title: "Create your first Product",
            description: "Add a product or service to your catalog",
            complete: false,
            action_url: "/app/products/new",
            icon: "📦",
            xp: 30
        },
        {
            id: "3",
            title: "Schedule a Post",
            description: "Create and schedule your first social media post",
            complete: false,
            action_url: "/app/campaigns",
            icon: "📅",
            xp: 40
        }
    ];

    return NextResponse.json({
        checklist,
        progress: 0,
        earned_xp: 0,
        total_xp: 120
    });
}

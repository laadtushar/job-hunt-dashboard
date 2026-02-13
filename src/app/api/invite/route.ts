import { auth } from "@/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { email } = await req.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
        }

        // Add to allowlist
        const allowed = await prisma.allowedUser.upsert({
            where: { email },
            update: {},
            create: { email }
        });

        return NextResponse.json({ success: true, allowed });

    } catch (error: any) {
        console.error("Invite User Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const allowedUsers = await prisma.allowedUser.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ allowedUsers });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

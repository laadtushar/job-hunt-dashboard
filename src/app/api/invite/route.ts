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

        // Add to allowlist using raw query to bypass stale client
        const id = Math.random().toString(36).substring(7);
        await prisma.$executeRaw`
            INSERT INTO "AllowedUser" ("id", "email", "createdAt")
            VALUES (${id}, ${email}, NOW())
            ON CONFLICT ("email") DO NOTHING
        `;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Invite User Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await auth();
        console.log("Invite API Session:", !!session);

        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const allowedUsers = await prisma.$queryRaw`SELECT * FROM "AllowedUser" ORDER BY "createdAt" DESC`.catch(() => []);
        return NextResponse.json({ allowedUsers });
    } catch (error: any) {
        console.error("Invite API GET Error:", error);
        return NextResponse.json({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}

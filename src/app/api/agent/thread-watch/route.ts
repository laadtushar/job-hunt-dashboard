import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { AgentService } from "@/services/agent";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const account = await prisma.account.findFirst({
            where: { userId: session.user.id, provider: "google" },
        });

        if (!account?.access_token) {
            return NextResponse.json({ error: "Gmail access not found." }, { status: 403 });
        }

        const agentService = new AgentService();
        const result = await agentService.threadWatch(session.user.id, account.access_token, account.refresh_token as string);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Thread Watch Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

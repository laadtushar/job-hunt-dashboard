import { auth } from "@/auth";
import { AgentService } from "@/services/agent";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const agentService = new AgentService();
        const result = await agentService.duplicateScan(session.user.id);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Duplicate Scan Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

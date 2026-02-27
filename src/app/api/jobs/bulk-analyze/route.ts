import { auth } from "@/auth";
import { AIService } from "@/services/ai";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { rawText } = await req.json();

        const ai = new AIService();
        const jobs = await ai.parseBulkJobs(rawText);

        return NextResponse.json({ jobs });
    } catch (e: any) {
        console.error("Bulk Analyze Route Error:", e);
        return NextResponse.json({ error: e.message || "Failed to analyze jobs" }, { status: 500 });
    }
}

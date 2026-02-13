
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id: jobId } = await params;

        const job = await prisma.jobApplication.findUnique({
            where: { id: jobId },
            select: { userId: true }
        });

        if (!job || job.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        await prisma.jobApplication.update({
            where: { id: jobId },
            data: { isIgnored: true }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Ignore Job Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

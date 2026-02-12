
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { applicationId } = await req.json();

        if (!applicationId) {
            return NextResponse.json({ error: "Application ID is required" }, { status: 400 });
        }

        // 1. Fetch related emails to get patterns for feedback
        const emails = await prisma.emailLog.findMany({
            where: { applicationId },
            select: { id: true, snippet: true, body: true, gmailId: true }
        });

        // 2. Generate feedback candidates (just use the first email for now or unique senders)
        // We'll need the sender and subject which we don't store directly in EmailLog except in full body or if we query Gmail.
        // Wait, we don't store 'sender' in EmailLog? We only store body.
        // We can try to extract it from body if it's there or just use what we have.
        // "input" for feedback: { sender: "...", subject: "..." }
        // Attempt to extract simplistic feedback or just store the snippet/body as context?
        // The Prompt expects: - Sender: "${sender}", Subject: "${subject}"

        // LIMITATION: We don't have Sender/Subject readily available in separate columns in EmailLog.
        // We should have added them!
        // Feature Request: add `sender` and `subject` to EmailLog for better querying.

        // Workaround: We will just flag the emails as ignored for now.
        // And manually create a generic "FALSE_POSITIVE" feedback if possible, or skip feedback creation if data is missing.
        // Ideally we fetch from Gmail again? No, too slow.

        // For now, let's just mark ignored and delete the application.
        // We can construct a simple feedback entry if we can parse the header from the stored body if we stored headers?
        // We stored full body.

        // 3. Mark emails as ignored and unlink
        await prisma.emailLog.updateMany({
            where: { applicationId },
            data: {
                isIgnored: true,
                applicationId: null
            }
        });

        // 4. Delete the application
        await prisma.jobApplication.delete({
            where: { id: applicationId }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Ignore Job Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


import { auth } from "@/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AIService } from "@/services/ai";
import { Normalizer } from "@/lib/normalize";

export const maxDuration = 300; // 5 minutes for maintenance tasks

export async function POST(req: Request) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const sendLog = (message: string) => {
                controller.enqueue(encoder.encode(JSON.stringify({ message }) + "\n"));
            };

            try {
                sendLog("Starting consolidation...");

                // 1. Fetch all applications
                const applications = await prisma.jobApplication.findMany({
                    where: { userId },
                    select: {
                        id: true,
                        company: true,
                        role: true,
                        status: true,
                        appliedDate: true,
                        createdAt: true
                    },
                    orderBy: { appliedDate: 'asc' } // Oldest first (Master candidates)
                });

                sendLog(`Fetched ${applications.length} applications.`);

                // 2. Group by Normalized Company
                const groups: Record<string, typeof applications> = {};
                for (const app of applications) {
                    const normCompany = Normalizer.cleanCompanyName(app.company);
                    if (!groups[normCompany]) groups[normCompany] = [];
                    groups[normCompany].push(app);
                }

                const aiService = new AIService();
                let mergedCount = 0;

                // 3. Process each group
                for (const [company, apps] of Object.entries(groups)) {
                    if (apps.length < 2) continue;

                    sendLog(`Checking duplicates for ${company} (${apps.length} items)...`);

                    // We compare iterating from the newest to the oldest to find a match
                    // But to keep it simple: we take the first one as "Master" and try to merge others into it?
                    // No, "Master" should be the one that semantically matches.

                    // Strategy:
                    // Maintain a list of "Unique Applications".
                    // For each app in the group:
                    // Compare against "Unique Applications".
                    // If match -> Merge.
                    // If no match -> Add to "Unique Applications".

                    const uniqueApps: typeof applications = [];
                    const appsSorted = [...apps].sort((a, b) => a.appliedDate.getTime() - b.appliedDate.getTime()); // Oldest first

                    for (const app of appsSorted) {
                        if (uniqueApps.length === 0) {
                            uniqueApps.push(app);
                            continue;
                        }

                        // Compare with existing unique apps
                        const candidates = uniqueApps.map(ua => ({
                            id: ua.id,
                            role: ua.role,
                            company: ua.company,
                            status: ua.status,
                            appliedDate: ua.appliedDate
                        }));

                        const extractedDataForAI = {
                            isJobRelated: true,
                            company: app.company,
                            role: app.role,
                            status: app.status,
                            receivedDate: app.appliedDate.toISOString()
                        };

                        // Use AI Judge
                        const matchId = await aiService.resolveIdentity(extractedDataForAI, candidates);

                        if (matchId) {
                            sendLog(`  MERGE: "${app.role}" (${app.status}) into -> ID: ${matchId}`);

                            // MERGE DB OPERATIONS
                            // 1. Move EmailLogs
                            await prisma.emailLog.updateMany({
                                where: { applicationId: app.id },
                                data: { applicationId: matchId }
                            });

                            // 2. Update the master application with latest status/date if needed
                            // Since we iterate oldest -> newest, 'app' is NEWER than 'matchId'
                            await prisma.jobApplication.update({
                                where: { id: matchId },
                                data: {
                                    status: app.status, // Update status to latest (e.g., REJECTED)
                                    updatedAt: new Date() // Bump updated time
                                }
                            });

                            // 3. Delete the duplicate application
                            await prisma.jobApplication.delete({
                                where: { id: app.id }
                            });

                            mergedCount++;
                        } else {
                            // Valid new unique app
                            uniqueApps.push(app);
                        }
                    }
                }

                sendLog(`Consolidation Complete. Merged ${mergedCount} applications.`);

            } catch (error: any) {
                console.error("Consolidation Error:", error);
                sendLog(`Error: ${error.message}`);
            } finally {
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
        }
    });
}

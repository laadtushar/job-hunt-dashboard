"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function KanbanPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/");

    const jobs = await prisma.jobApplication.findMany({
        where: { userId: session.user.id },
        orderBy: { appliedDate: 'desc' }
    });

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            <Navbar />

            <main className="flex-1 overflow-hidden flex flex-col p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                            <ArrowLeft className="h-6 w-6 text-slate-500" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Pipeline</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Drag and drop to update status</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Link href="/import">
                            <Button variant="outline" size="sm">
                                Bulk Import
                            </Button>
                        </Link>
                        <Link href="/">
                            <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Job
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto">
                    <KanbanBoard initialJobs={jobs} />
                </div>
            </main>
        </div>
    );
}

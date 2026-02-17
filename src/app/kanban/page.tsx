
"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function KanbanPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/");

    const jobs = await prisma.jobApplication.findMany({
        where: { userId: session.user.id },
        orderBy: { lastUpdate: 'desc' },
        include: {
            emailLogs: true,
        }
    });

    // We can't easily force the viewMode from the server component yet 
    // without modifying DashboardClient to accept a defaultViewMode prop.
    // I'll update DashboardClient to accept an optional defaultView prop.

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            <Navbar />
            <div className="max-w-7xl mx-auto p-6 lg:p-10">
                <DashboardClient jobs={jobs} initialView="PIPELINE" />
            </div>
        </div>
    );
}

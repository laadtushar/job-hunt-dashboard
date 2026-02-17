"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { approveInvite, denyInvite } from "./actions";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export default async function AdminPage() {
    const session = await auth();

    // Only superadmin can access this page
    if (!session?.user?.role || session.user.role !== "SUPERADMIN") {
        redirect("/");
    }

    const inviteRequests = await prisma.inviteRequest.findMany({
        orderBy: { createdAt: "desc" }
    });

    const pendingRequests = inviteRequests.filter(r => r.status === "PENDING");
    const approvedRequests = inviteRequests.filter(r => r.status === "APPROVED");
    const deniedRequests = inviteRequests.filter(r => r.status === "DENIED");

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            <Navbar />
            <div className="max-w-6xl mx-auto p-6 lg:p-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                        Admin Dashboard
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Manage invite requests and user access
                    </p>
                </div>

                {/* Pending Requests */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-amber-500" />
                        Pending Requests ({pendingRequests.length})
                    </h2>
                    {pendingRequests.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-center">
                            <p className="text-slate-500 dark:text-slate-400">No pending requests</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingRequests.map((request) => (
                                <div key={request.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                                                {request.name || "Unknown"}
                                            </p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                {request.email}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                                Requested: {new Date(request.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <form action={approveInvite.bind(null, request.email)}>
                                                <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700">
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    Approve
                                                </Button>
                                            </form>
                                            <form action={denyInvite.bind(null, request.email)}>
                                                <Button type="submit" size="sm" variant="destructive">
                                                    <XCircle className="h-4 w-4 mr-1" />
                                                    Deny
                                                </Button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Approved Requests */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Approved ({approvedRequests.length})
                    </h2>
                    {approvedRequests.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-center">
                            <p className="text-slate-500 dark:text-slate-400">No approved requests</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {approvedRequests.map((request) => (
                                <div key={request.id} className="bg-white dark:bg-slate-900 rounded-xl border border-green-200 dark:border-green-800 p-4">
                                    <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                                        {request.name || "Unknown"}
                                    </p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                        {request.email}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Denied Requests */}
                <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-500" />
                        Denied ({deniedRequests.length})
                    </h2>
                    {deniedRequests.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-center">
                            <p className="text-slate-500 dark:text-slate-400">No denied requests</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {deniedRequests.map((request) => (
                                <div key={request.id} className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-800 p-4">
                                    <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                                        {request.name || "Unknown"}
                                    </p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                        {request.email}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

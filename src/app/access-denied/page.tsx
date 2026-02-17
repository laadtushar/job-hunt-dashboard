"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";

export default async function AccessDeniedPage() {
    const session = await auth();
    
    // If not logged in, redirect to home
    if (!session?.user?.email) {
        redirect("/");
    }

    // Check if there's a pending invite request
    const inviteRequest = await prisma.inviteRequest.findUnique({
        where: { email: session.user.email }
    });

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            <Navbar />
            <div className="max-w-2xl mx-auto p-6 lg:p-10 mt-20">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-lg">
                    <div className="text-center">
                        <div className="h-20 w-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6 mx-auto">
                            <span className="text-4xl">🔒</span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                            Access Pending
                        </h1>
                        
                        {inviteRequest?.status === "PENDING" ? (
                            <>
                                <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                                    Your request for access has been submitted and is currently pending approval from the administrator.
                                </p>
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                                    <p className="text-sm text-blue-900 dark:text-blue-100">
                                        <strong>Email:</strong> {session.user.email}
                                    </p>
                                    <p className="text-sm text-blue-900 dark:text-blue-100 mt-2">
                                        <strong>Status:</strong> Pending Review
                                    </p>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-500">
                                    You'll receive access once the administrator approves your request. Please check back later.
                                </p>
                            </>
                        ) : inviteRequest?.status === "DENIED" ? (
                            <>
                                <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                                    Your request for access has been denied by the administrator.
                                </p>
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
                                    <p className="text-sm text-red-900 dark:text-red-100">
                                        <strong>Email:</strong> {session.user.email}
                                    </p>
                                    <p className="text-sm text-red-900 dark:text-red-100 mt-2">
                                        <strong>Status:</strong> Access Denied
                                    </p>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-500">
                                    If you believe this is an error, please contact the administrator.
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                                    This application is invite-only. Your access request has been automatically submitted to the administrator.
                                </p>
                                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-6">
                                    <p className="text-sm text-slate-900 dark:text-slate-100">
                                        <strong>Email:</strong> {session.user.email}
                                    </p>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-500">
                                    You'll receive access once the administrator approves your request.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

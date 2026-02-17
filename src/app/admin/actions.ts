"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { logAdminAction } from "@/lib/audit";

export async function approveInvite(email: string) {
    const session = await auth();
    if (!session?.user?.role || session.user.role !== "SUPERADMIN") {
        throw new Error("Unauthorized");
    }

    // Add to AllowedUser
    await prisma.allowedUser.create({
        data: { email }
    }).catch(() => { });

    // Update InviteRequest status
    await prisma.inviteRequest.update({
        where: { email },
        data: { status: "APPROVED" }
    });

    // Log admin action
    await logAdminAction("APPROVE_INVITE", session.user.email || "unknown", email);

    revalidatePath("/admin");
}

export async function denyInvite(email: string) {
    const session = await auth();
    if (!session?.user?.role || session.user.role !== "SUPERADMIN") {
        throw new Error("Unauthorized");
    }

    await prisma.inviteRequest.update({
        where: { email },
        data: { status: "DENIED" }
    });

    // Log admin action
    await logAdminAction("DENY_INVITE", session.user.email || "unknown", email);

    revalidatePath("/admin");
}

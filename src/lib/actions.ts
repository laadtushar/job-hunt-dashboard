"use server"

import { signIn, signOut } from "@/auth"

export async function loginAction() {
    await signIn("google")
}

export async function logoutAction() {
    await signOut()
}

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateJobStatus(id: string, status: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await prisma.jobApplication.update({
        where: { id, userId: session.user.id },
        data: { status }
    });

    revalidatePath("/");
    revalidatePath("/kanban");
    revalidatePath("/analytics");
}

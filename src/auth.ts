
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"


console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "Set" : "Not Set");
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "Set" : "Not Set");

const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL;

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            authorization: {
                params: {
                    scope: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/calendar.events",
                    access_type: "offline",
                    prompt: "consent",
                },
            },
        }),
    ],
    callbacks: {
        async signIn({ user }) {
            try {
                if (!user.email) return false

                // 1. Check if user is the superadmin
                if (SUPERADMIN_EMAIL && user.email === SUPERADMIN_EMAIL) {
                    // Ensure superadmin has SUPERADMIN role
                    const existingUser: any[] = await prisma.$queryRaw`SELECT * FROM "User" WHERE "email" = ${user.email} LIMIT 1`;
                    if (existingUser && existingUser.length > 0) {
                        await prisma.$executeRaw`UPDATE "User" SET "role" = 'SUPERADMIN' WHERE "email" = ${user.email}`;
                    }
                    return true;
                }

                // 2. Check if email is explicitly on the allowlist
                const allowed: any[] = await prisma.$queryRaw`SELECT * FROM "AllowedUser" WHERE "email" = ${user.email} LIMIT 1`;
                if (allowed && allowed.length > 0) return true

                // 3. Check if user already exists in the database (grandfather them in)
                const existingUser: any[] = await prisma.$queryRaw`SELECT * FROM "User" WHERE "email" = ${user.email} LIMIT 1`;
                if (existingUser && existingUser.length > 0) {
                    // Also add them to AllowedUser table for consistency
                    const id = Math.random().toString(36).substring(7);
                    await prisma.$executeRaw`
                        INSERT INTO "AllowedUser" ("id", "email", "createdAt")
                        VALUES (${id}, ${user.email}, NOW())
                        ON CONFLICT ("email") DO NOTHING
                    `.catch(() => { });
                    return true
                }

                // 4. Bootstrap: If no allowed users exist yet AND no superadmin is configured, allow the first user
                if (!SUPERADMIN_EMAIL) {
                    const countResult: any[] = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM "AllowedUser"`;
                    const count = countResult[0]?.count || 0;

                    if (count === 0) {
                        const id = Math.random().toString(36).substring(7);
                        await prisma.$executeRaw`
                            INSERT INTO "AllowedUser" ("id", "email", "createdAt")
                            VALUES (${id}, ${user.email}, NOW())
                        `;
                        return true
                    }
                }

                // 5. User is not allowed - create an invite request and allow sign-in
                // The page-level logic will redirect them to /access-denied
                const id = Math.random().toString(36).substring(7);
                await prisma.$executeRaw`
                    INSERT INTO "InviteRequest" ("id", "email", "name", "status", "createdAt")
                    VALUES (${id}, ${user.email}, ${user.name || null}, 'PENDING', NOW())
                    ON CONFLICT ("email") DO NOTHING
                `.catch(() => { });

                // Allow sign-in to complete so user can see the access-denied page
                return true
            } catch (e) {
                console.error("Auth SignIn Error:", e);
                return false;
            }
        },
        async session({ session, user }) {
            // Pass the user ID and role to the session
            if (session.user) {
                session.user.id = user.id;
                // Fetch role from database
                const dbUser: any[] = await prisma.$queryRaw`SELECT "role" FROM "User" WHERE "id" = ${user.id} LIMIT 1`;
                session.user.role = dbUser[0]?.role || "USER";
            }
            return session
        },
    },
    trustHost: true,
})

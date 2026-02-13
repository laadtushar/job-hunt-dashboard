
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"


console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "Set" : "Not Set");
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "Set" : "Not Set");

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            authorization: {
                params: {
                    scope: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/spreadsheets",
                    access_type: "offline",
                    prompt: "consent",
                },
            },
        }),
    ],
    callbacks: {
        async signIn({ user }) {
            if (!user.email) return false

            // 1. Check if email is explicitly on the allowlist
            const allowed = await prisma.allowedUser.findUnique({
                where: { email: user.email }
            })
            if (allowed) return true

            // 2. Check if user already exists in the database (grandfather them in)
            const existingUser = await prisma.user.findUnique({
                where: { email: user.email }
            })
            if (existingUser) {
                // Also add them to AllowedUser table for consistency
                await prisma.allowedUser.upsert({
                    where: { email: user.email },
                    update: {},
                    create: { email: user.email }
                })
                return true
            }

            // 3. Bootstrap: If no allowed users exist yet, allow the first user
            const count = await prisma.allowedUser.count()
            if (count === 0) {
                await prisma.allowedUser.create({
                    data: { email: user.email }
                })
                return true
            }

            return false
        },
        async session({ session, user }) {
            // Pass the user ID to the session
            if (session.user) {
                session.user.id = user.id
            }
            return session
        },
    },
    trustHost: true,
})

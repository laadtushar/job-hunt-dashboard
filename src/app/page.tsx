import Navbar from "@/components/Navbar"
import DashboardClient from "@/components/dashboard/DashboardClient"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import LandingPage from "@/components/landing/LandingPage"
import { loginAction } from "@/lib/actions"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth()

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-700 relative overflow-hidden">
        <Navbar />
        <LandingPage loginAction={loginAction} />
      </div>
    )
  }

  // Check if user is allowed (either superadmin or in AllowedUser table)
  const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL;
  const isAllowed = session.user.email === SUPERADMIN_EMAIL ||
    await prisma.allowedUser.findUnique({ where: { email: session.user.email || "" } });

  if (!isAllowed) {
    redirect("/access-denied");
  }

  const applications = await prisma.jobApplication.findMany({
    where: {
      userId: session.user.id,
      isIgnored: false,
    },
    orderBy: {
      lastUpdate: 'desc'
    },
    include: {
      emailLogs: true,
    }
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6 lg:p-10">
        <DashboardClient jobs={applications} />
      </div>
    </div>
  )
}

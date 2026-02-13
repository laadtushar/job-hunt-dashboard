import Navbar from "@/components/Navbar"
import DashboardClient from "@/components/dashboard/DashboardClient"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import LandingPage from "@/components/landing/LandingPage"
import { loginAction } from "@/lib/actions"

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

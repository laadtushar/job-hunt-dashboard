
import Navbar from "@/components/Navbar"
import DashboardClient from "@/components/dashboard/DashboardClient"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export default async function Home() {
  const session = await auth()

  if (!session?.user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-4xl font-bold mb-4 text-slate-900">Track Your Job Hunt with AI</h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl text-balance">
            Automatically sync your applications from Gmail.
            Extract salary, interviews, and status updates instantly.
          </p>
          <div className="bg-white p-6 rounded-xl border shadow-sm max-w-md w-full">
            <p className="text-slate-600 mb-4">Sign in with Google to get started</p>
            {/* Auth is handled in Navbar for now, or we could add a direct button here */}
          </div>
        </div>
      </div>
    )
  }

  // Fetch initial data
  const jobs = await prisma.jobApplication.findMany({
    where: { userId: session.user.id },
    orderBy: { lastUpdate: 'desc' }
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <DashboardClient jobs={jobs} />
    </div>
  )
}

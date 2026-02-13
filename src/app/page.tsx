import Navbar from "@/components/Navbar"
import DashboardClient from "@/components/dashboard/DashboardClient"
import prisma from "@/lib/prisma"
import { auth, signIn } from "@/auth"
import { Button } from "@/components/ui/button"
import { Compass, Mail, Sparkles, Clock } from "lucide-react"

export default async function Home() {
  const session = await auth()

  if (!session?.user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-700 relative overflow-hidden">
        {/* Modern Geometric Background */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 -z-10" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 -z-10" />

        <Navbar />

        <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-24 relative">
          <div className="max-w-5xl w-full text-center space-y-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 shadow-xl shadow-blue-500/5 ring-1 ring-slate-200 dark:ring-slate-800 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
              </span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] pl-1">
                Now tracking 10k+ applications
              </span>
            </div>

            <h1 className="text-6xl sm:text-8xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.05] balance">
              Your career hunt, <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 dark:from-blue-400 dark:via-indigo-400 dark:to-blue-300 bg-clip-text text-transparent italic">
                orchestrated.
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Stop managing spreadsheets. Meridian automatically syncs your job applications from Gmail,
              extracts key details with AI, and gives you a premium dashboard to win.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
              <form
                action={async () => {
                  "use server"
                  await signIn("google")
                }}
              >
                <Button size="lg" className="h-16 px-10 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 text-lg font-bold transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-slate-900/20 dark:shadow-white/10 group">
                  Get Started Free
                  <Compass className="ml-3 h-5 w-5 transition-transform group-hover:rotate-45" />
                </Button>
              </form>
              <Button variant="ghost" size="lg" className="h-16 px-10 rounded-2xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-900">
                View Demo
              </Button>
            </div>

            {/* Bento-style Features Grid Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-24 max-w-4xl mx-auto">
              {[
                { title: "Gmail Sync", desc: "Automated extraction from your inbox", icon: Mail, color: "text-blue-500" },
                { title: "AI Learning", desc: "Learns from your feedback loops", icon: Sparkles, color: "text-indigo-500" },
                { title: "Timeline", desc: "Full history of every application", icon: Clock, color: "text-purple-500" }
              ].map((feature, i) => (
                <div key={i} className="group p-8 rounded-3xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-all duration-500 text-left">
                  <feature.icon className={`h-8 w-8 ${feature.color} mb-6 transition-transform group-hover:scale-110`} />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
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

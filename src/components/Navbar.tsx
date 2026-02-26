import { auth } from "@/auth"
import { Compass, LogOut, User, BarChart3, KanbanSquare, Shield, CheckSquare } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { loginAction, logoutAction } from "@/lib/actions"
import Link from "next/link"

export default async function Navbar() {
    const session = await auth()

    return (
        <nav className="sticky top-0 z-50 border-b bg-white/70 dark:bg-slate-950/70 backdrop-blur-md px-4 md:px-6 py-3 md:py-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <a href="/" className="flex items-center gap-2 md:gap-3 group cursor-pointer">
                    <div className="h-8 w-8 md:h-10 md:w-10 flex items-center justify-center transition-transform group-hover:rotate-12 duration-300">
                        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                            <defs>
                                <linearGradient id="nav-logo-g" gradientUnits="userSpaceOnUse" x1="16" y1="12" x2="48" y2="52">
                                    <stop offset="0%" stopColor="#4d6bff" />
                                    <stop offset="100%" stopColor="#22d3ee" />
                                </linearGradient>
                            </defs>
                            <path d="M16 12V52M48 12V52M16 32H48" stroke="url(#nav-logo-g)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6" />
                            <circle cx="16" cy="12" r="4" fill="#4d6bff" />
                            <circle cx="48" cy="52" r="4" fill="#22d3ee" />
                        </svg>
                    </div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                        <span className="text-slate-900 dark:text-white">Hyred</span>
                        <span className="font-light text-slate-500 dark:text-slate-400">Lab</span>
                    </h1>
                </a>

                <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
                    <ModeToggle />
                    {session?.user ? (
                        <div className="flex items-center gap-2 sm:gap-4">
                            <Link href="/kanban" className="hidden sm:flex items-center justify-center h-8 w-8 md:h-10 md:w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400" title="Pipeline (Kanban)">
                                <KanbanSquare className="h-4 w-4 md:h-5 md:w-5" />
                            </Link>
                            <Link href="/tasks" className="hidden sm:flex items-center justify-center h-8 w-8 md:h-10 md:w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-green-600 dark:text-slate-400 dark:hover:text-green-400" title="Task Manager">
                                <CheckSquare className="h-4 w-4 md:h-5 md:w-5" />
                            </Link>
                            {session.user.role === "SUPERADMIN" && (
                                <Link href="/admin" className="hidden sm:flex items-center justify-center h-8 w-8 md:h-10 md:w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400" title="Admin Dashboard">
                                    <Shield className="h-4 w-4 md:h-5 md:w-5" />
                                </Link>
                            )}
                            <Link href="/analytics" className="hidden sm:flex items-center justify-center h-8 w-8 md:h-10 md:w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400" title="Analytics Dashboard">
                                <BarChart3 className="h-4 w-4 md:h-5 md:w-5" />
                            </Link>
                            <div className="hidden md:flex flex-col items-end">
                                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Account</span>
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                    {session.user?.email?.split('@')[0]}
                                </span>
                            </div>
                            <div className="h-8 w-8 md:h-10 md:w-10 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 border dark:border-slate-800 flex items-center justify-center text-slate-600 font-bold overflow-hidden shadow-inner ring-2 ring-white dark:ring-slate-950">
                                <img
                                    key={session.user?.image || 'avatar'}
                                    src={session.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(session.user?.email || 'default')}`}
                                    alt="User Profile"
                                    className="h-full w-full object-cover"
                                    referrerPolicy="no-referrer"
                                />
                            </div>
                            <form action={logoutAction}>
                                <button className="h-8 w-8 md:h-10 md:w-10 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 transition-colors group" title="Sign Out">
                                    <LogOut className="h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:translate-x-0.5" />
                                </button>
                            </form>
                        </div>
                    ) : (
                        <form action={loginAction}>
                            <button className="px-4 py-2 md:px-5 md:py-2.5 rounded-full bg-slate-900 text-white text-xs md:text-sm font-semibold hover:bg-slate-800 transition-all hover:shadow-lg active:scale-95">
                                Sign In
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </nav>
    )
}

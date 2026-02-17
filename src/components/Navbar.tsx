import { auth } from "@/auth"
import { Compass, LogOut, User } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { loginAction, logoutAction } from "@/lib/actions"

export default async function Navbar() {
    const session = await auth()

    return (
        <nav className="sticky top-0 z-50 border-b bg-white/70 dark:bg-slate-950/70 backdrop-blur-md px-4 md:px-6 py-3 md:py-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <a href="/" className="flex items-center gap-2 md:gap-3 group cursor-pointer">
                    <div className="h-8 w-8 md:h-10 md:w-10 flex items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10 transition-transform group-hover:rotate-12 duration-300">
                        <img src="/logo.png" alt="Meridian Logo" className="h-full w-full object-cover" />
                    </div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-500 dark:from-blue-400 dark:via-indigo-400 dark:to-blue-300 bg-clip-text text-transparent">
                        Meridian
                    </h1>
                </a>

                <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
                    <ModeToggle />
                    {session?.user ? (
                        <div className="flex items-center gap-2 sm:gap-4">
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

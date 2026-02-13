
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, Zap, Users, CheckCircle } from "lucide-react"

interface DashboardStats {
    total: number
    active: number
    interviews: number
    offers: number
}

export function DashboardHeader({ stats }: { stats: DashboardStats }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="overflow-hidden border-none shadow-xl bg-white dark:bg-slate-900/40 backdrop-blur-md relative group transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ring-1 ring-slate-200 dark:ring-slate-800 rounded-3xl">
                <div className="absolute -top-10 -right-10 h-32 w-32 bg-slate-100 dark:bg-slate-800 rounded-full opacity-0 blur-3xl group-hover:opacity-30 transition-opacity duration-700" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-8 pb-3 relative">
                    <CardTitle className="text-[11px] font-black tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase">Total Pulsed</CardTitle>
                    <div className="h-10 w-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm transition-transform group-hover:rotate-12">
                        <Briefcase className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                </CardHeader>
                <CardContent className="px-8 pb-8 relative">
                    <div className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white tabular-nums leading-none">
                        {stats.total}
                    </div>
                    <div className="h-1.5 w-12 bg-slate-100 dark:bg-slate-800 rounded-full mt-4 group-hover:w-full transition-all duration-700" />
                </CardContent>
            </Card>

            <Card className="overflow-hidden border-none shadow-xl bg-white dark:bg-slate-900/40 backdrop-blur-md relative group transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ring-1 ring-blue-500/10 dark:ring-blue-500/20 rounded-3xl">
                <div className="absolute -top-10 -right-10 h-32 w-32 bg-blue-500 rounded-full opacity-0 blur-3xl group-hover:opacity-10 transition-opacity duration-700" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-8 pb-3 relative">
                    <CardTitle className="text-[11px] font-black tracking-[0.2em] text-blue-500 dark:text-blue-400 uppercase">Live Pipeline</CardTitle>
                    <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center border border-blue-100/30 dark:border-blue-800/50 shadow-sm transition-transform group-hover:rotate-12">
                        <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                </CardHeader>
                <CardContent className="px-8 pb-8 relative">
                    <div className="text-5xl font-black tracking-tighter text-blue-700 dark:text-blue-400 tabular-nums leading-none">
                        {stats.active}
                    </div>
                    <div className="h-1.5 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-full mt-4 group-hover:w-full transition-all duration-700" />
                </CardContent>
            </Card>

            <Card className="overflow-hidden border-none shadow-xl bg-white dark:bg-slate-900/40 backdrop-blur-md relative group transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ring-1 ring-purple-500/10 dark:ring-purple-500/20 rounded-3xl">
                <div className="absolute -top-10 -right-10 h-32 w-32 bg-purple-500 rounded-full opacity-0 blur-3xl group-hover:opacity-10 transition-opacity duration-700" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-8 pb-3 relative">
                    <CardTitle className="text-[11px] font-black tracking-[0.2em] text-purple-500 dark:text-purple-400 uppercase">Neural Screens</CardTitle>
                    <div className="h-10 w-10 rounded-2xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center border border-purple-100/30 dark:border-purple-800/50 shadow-sm transition-transform group-hover:rotate-12">
                        <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                </CardHeader>
                <CardContent className="px-8 pb-8 relative">
                    <div className="text-5xl font-black tracking-tighter text-purple-700 dark:text-purple-400 tabular-nums leading-none">
                        {stats.interviews}
                    </div>
                    <div className="h-1.5 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-full mt-4 group-hover:w-full transition-all duration-700" />
                </CardContent>
            </Card>

            <Card className="overflow-hidden border-none shadow-xl bg-white dark:bg-slate-900/40 backdrop-blur-md relative group transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ring-1 ring-green-500/10 dark:ring-green-500/20 rounded-3xl">
                <div className="absolute -top-10 -right-10 h-32 w-32 bg-green-500 rounded-full opacity-0 blur-3xl group-hover:opacity-10 transition-opacity duration-700" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-8 pb-3 relative">
                    <CardTitle className="text-[11px] font-black tracking-[0.2em] text-green-500 dark:text-green-400 uppercase">Victory Goals</CardTitle>
                    <div className="h-10 w-10 rounded-2xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center border border-green-100/30 dark:border-green-800/50 shadow-sm transition-transform group-hover:rotate-12">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                </CardHeader>
                <CardContent className="px-8 pb-8 relative">
                    <div className="text-5xl font-black tracking-tighter text-green-700 dark:text-green-400 tabular-nums leading-none">
                        {stats.offers}
                    </div>
                    <div className="h-1.5 w-12 bg-green-100 dark:bg-green-900/30 rounded-full mt-4 group-hover:w-full transition-all duration-700" />
                </CardContent>
            </Card>
        </div>
    )
}

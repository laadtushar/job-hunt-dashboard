
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-6 px-6">
                    <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-6 pb-6">
                    <div className="text-3xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground mt-1">tracked jobs</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-6 px-6">
                    <CardTitle className="text-sm font-medium">Active Processes</CardTitle>
                    <Zap className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent className="px-6 pb-6">
                    <div className="text-3xl font-bold text-blue-600">{stats.active}</div>
                    <p className="text-xs text-muted-foreground mt-1">ongoing</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-6 px-6">
                    <CardTitle className="text-sm font-medium">Interviews</CardTitle>
                    <Users className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent className="px-6 pb-6">
                    <div className="text-3xl font-bold text-purple-600">{stats.interviews}</div>
                    <p className="text-xs text-muted-foreground mt-1">scheduled</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-6 px-6">
                    <CardTitle className="text-sm font-medium">Offers</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent className="px-6 pb-6">
                    <div className="text-3xl font-bold text-green-600">{stats.offers}</div>
                    <p className="text-xs text-muted-foreground mt-1">received</p>
                </CardContent>
            </Card>
        </div>
    )
}

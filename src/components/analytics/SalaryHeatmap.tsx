"use client"

import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, ZAxis, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const STATUS_COLORS = {
    'APPLIED': '#3b82f6',
    'SCREEN': '#a855f7',
    'INTERVIEW': '#f97316',
    'OFFER': '#22c55e',
    'REJECTED': '#ef4444',
    'GHOSTED': '#64748b'
}

type HeatmapProps = {
    data: any[]
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-xl z-50">
                <p className="font-bold text-white text-sm">{data.company}</p>
                <p className="text-slate-300 text-xs mb-2">{data.role}</p>
                <div className="flex justify-between items-center gap-4">
                    <span className="text-slate-400 text-xs text-left">Status:</span>
                    <span className="font-bold text-xs" style={{ color: STATUS_COLORS[data.status as keyof typeof STATUS_COLORS] || '#fff' }}>
                        {data.status}
                    </span>
                </div>
                <div className="flex justify-between items-center gap-4 mt-1">
                    <span className="text-slate-400 text-xs text-left">Target:</span>
                    <span className="font-bold text-xs text-white">
                        ${data.avg.toLocaleString()}
                    </span>
                </div>
                {data.min !== data.max && (
                    <div className="flex justify-between items-center gap-4 mt-1">
                        <span className="text-slate-400 text-xs text-left">Range:</span>
                        <span className="font-bold text-xs text-slate-400">
                            ${data.min.toLocaleString()} - ${data.max.toLocaleString()}
                        </span>
                    </div>
                )}
            </div>
        )
    }
    return null;
}

export function SalaryHeatmap({ data }: HeatmapProps) {
    if (!data || data.length === 0) {
        return (
            <Card className="col-span-1 lg:col-span-2 border-none shadow-xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl overflow-hidden mt-6">
                <CardContent className="h-[400px] flex flex-col items-center justify-center p-6 text-center">
                    <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <span className="text-2xl">💰</span>
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">No Salary Data Yet</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                        As you log roles with salary explicitly defined, they'll appear here as a heatmap of expectations vs. reality.
                    </p>
                </CardContent>
            </Card>
        )
    }

    const stages = ['APPLIED', 'SCREEN', 'INTERVIEW', 'OFFER', 'REJECTED', 'GHOSTED']

    const chartData = data.map(d => ({
        ...d,
        stageIndex: stages.indexOf(d.status),
        stageName: d.status
    })).filter(d => d.stageIndex !== -1)

    return (
        <Card className="col-span-1 lg:col-span-2 border-none shadow-xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl overflow-hidden mt-6 relative group">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl group-hover:bg-teal-500/20 transition-all duration-700" />

            <CardHeader className="relative z-10 px-8 pt-8">
                <CardTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="text-emerald-500">💰</span> Target Compensation Heatmap
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium">
                    Analyze expected salary ranges across stages of the hiring funnel
                </CardDescription>
            </CardHeader>
            <CardContent className="px-2 pb-8 relative z-10">
                <div className="h-[400px] w-full pr-8">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                            <XAxis
                                type="category"
                                dataKey="stageName"
                                name="Stage"
                                allowDuplicatedCategory={true}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }}
                                dy={10}
                            />
                            <YAxis
                                type="number"
                                dataKey="avg"
                                name="Salary"
                                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }}
                                dx={-10}
                            />
                            <ZAxis type="number" range={[100, 300]} />
                            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }} />
                            <Scatter name="Jobs" data={chartData} animationDuration={1000}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || '#cbd5e1'} className="drop-shadow-md transition-all duration-300 hover:opacity-80" />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}

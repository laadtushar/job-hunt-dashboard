
'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export function ActivityChart({ data }: { data: { date: string, count: number }[] }) {

    if (!data || data.length === 0) {
        return <div className="h-64 flex items-center justify-center text-muted-foreground">No activity data available</div>
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => {
                            const date = new Date(value)
                            return date.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                            })
                        }}
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                    />
                    <Tooltip
                        cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length && label) {
                                return (
                                    <div className="rounded-xl border bg-background/80 backdrop-blur-sm p-3 shadow-xl">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[0.6rem] uppercase font-black text-muted-foreground tracking-widest">
                                                    Date
                                                </span>
                                                <span className="font-bold text-foreground text-xs">
                                                    {new Date(label).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[0.6rem] uppercase font-black text-muted-foreground tracking-widest">
                                                    Apps
                                                </span>
                                                <span className="font-bold text-primary text-xs">
                                                    {payload[0].value}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                            return null
                        }}
                    />
                    <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

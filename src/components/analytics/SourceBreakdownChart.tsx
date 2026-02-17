
'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts"

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

export function SourceBreakdownChart({ data }: { data: { source: string, count: number }[] }) {

    if (!data || data.length === 0) {
        return <div className="h-64 flex items-center justify-center text-muted-foreground">No source data available</div>
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="source"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        fontSize={12}
                        width={100}
                        tick={{ fill: 'hsl(var(--foreground))' }}
                    />
                    <Tooltip
                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            borderRadius: '12px',
                            border: '1px solid hsl(var(--border))',
                        }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

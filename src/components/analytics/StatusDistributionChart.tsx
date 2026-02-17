
'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts"

const COLORS = ['#6366f1', '#22c55e', '#3b82f6', '#8b5cf6', '#eab308', '#ef4444', '#94a3b8'];

export function StatusDistributionChart({ data }: { data: { status: string, count: number }[] }) {

    if (!data || data.length === 0) {
        return <div className="h-64 flex items-center justify-center text-muted-foreground">No status data available</div>
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="status"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            borderRadius: '12px',
                            border: '1px solid hsl(var(--border))',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        }}
                        itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}

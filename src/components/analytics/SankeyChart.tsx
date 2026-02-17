
'use client';

import { ResponsiveContainer, Sankey, Tooltip, Rectangle, Layer } from 'recharts';
import React from 'react';

// Custom Node to add colors
const DemoSankeyNode = ({ x, y, width, height, index, payload, containerWidth }: any) => {
    const isOut = x + width + 6 > containerWidth;
    return (
        <Layer key={`CustomNode${index}`}>
            <Rectangle
                x={x}
                y={y}
                width={width}
                height={height}
                fill={payload.color || "#8884d8"}
                fillOpacity="1"
            />
            <text
                textAnchor={isOut ? 'end' : 'start'}
                x={isOut ? x - 6 : x + width + 6}
                y={y + height / 2}
                fontSize="12"
                fill="hsl(var(--muted-foreground))"
                strokeWidth={0} // 1
                alignmentBaseline="middle" // "central"
            >
                {payload.name} ({payload.value})
            </text>
        </Layer>
    );
};

export function SankeyChart({ data }: { data: { nodes: any[], links: any[] } }) {
    if (!data || !data.nodes.length || !data.links.length) {
        return <div className="h-64 flex items-center justify-center text-muted-foreground">No sufficient data for Sankey diagram</div>
    }

    return (
        <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
                <Sankey
                    data={data}
                    node={<DemoSankeyNode />}
                    nodePadding={50}
                    margin={{
                        left: 0,
                        right: 0,
                        top: 20,
                        bottom: 20,
                    }}
                    link={{ stroke: '#10b981', strokeOpacity: 0.5 }}
                >
                    <Tooltip />
                </Sankey>
            </ResponsiveContainer>
        </div>
    );
}

'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/card';

interface ReportBarChartProps {
  title: string;
  data: { name: string; count: number }[];
  color?: string;
}

export function ReportBarChart({ title, data, color = '#8b5cf6' }: ReportBarChartProps) {
  const chartData = data.slice(0, 8).map((d) => ({ name: d.name, value: d.count }));

  return (
    <Card className="crm-card p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      {chartData.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">No data available</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              angle={-30}
              textAnchor="end"
              height={60}
              className="text-muted-foreground"
            />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} className="text-muted-foreground" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartDataPoint {
  time: string;
  value: number;
}

interface MonitorChartProps {
  title: string;
  data: ChartDataPoint[];
  currentValue: string;
  subtitle: string;
  color: string;
  gradientId: string;
  unit?: string;
}

export default function MonitorChart({ title, data, currentValue, subtitle, color, gradientId, unit = '%' }: MonitorChartProps) {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <div className="chart-card-title">{title}</div>
          <div className="chart-card-sub">{subtitle}</div>
        </div>
        <div className="chart-card-value">{currentValue}{unit}</div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 10 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 10 }}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(17, 24, 39, 0.95)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '8px',
              color: '#f1f5f9',
              fontSize: '12px',
            }}
            formatter={(value: unknown) => [`${Number(value).toFixed(1)}${unit}`, title]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            animationDuration={500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

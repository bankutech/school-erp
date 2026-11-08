import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { TimeSeriesPoint } from './types';
import { InstitutionalTooltip } from './InstitutionalTooltip';
import { formatCurrencyINR, formatCompactNumber } from './utils/formatters';

interface TrendAreaChartProps {
  data: TimeSeriesPoint[];
  seriesName?: string;
  isCurrency?: boolean;
  unit?: string;
  color?: string; // e.g. '#2563eb' or '#059669'
  gradientId?: string;
  showBaseline?: boolean;
  baselineValue?: number;
  curveType?: 'monotone' | 'stepAfter' | 'linear';
  strokeWidth?: number;
  height?: number | `${number}%`;
}

export const TrendAreaChart: React.FC<TrendAreaChartProps> = ({
  data,
  seriesName = 'Value',
  isCurrency = false,
  unit = '',
  color = '#2563eb',
  gradientId = 'trendGradient',
  showBaseline = true,
  baselineValue = 0,
  curveType = 'monotone',
  strokeWidth = 2,
  height = '100%',
}) => {
  // Format Y Axis ticks cleanly
  const yTickFormatter = (val: number) => {
    if (isCurrency) return formatCurrencyINR(val, true);
    return formatCompactNumber(val);
  };

  // Derive min/max domain with breathing room, pinned to 0
  const yDomain = useMemo(() => {
    if (!data || data.length === 0) return [0, 100];
    const values = data.map((d) => d.value);
    const maxVal = Math.max(...values, baselineValue);
    const minVal = Math.min(...values, 0);
    const padding = (maxVal - minVal) * 0.12 || 10;
    return [Math.floor(minVal), Math.ceil(maxVal + padding)];
  }, [data, baselineValue]);

  return (
    <div className="w-full h-full min-h-[240px]">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.22} />
              <stop offset="95%" stopColor={color} stopOpacity={0.01} />
            </linearGradient>
          </defs>

          {/* Clean institutional grid: horizontal only to maximize data-ink ratio */}
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e2e8f0"
          />

          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={{ stroke: '#cbd5e1' }}
            tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
            dy={8}
          />

          <YAxis
            domain={yDomain}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
            tickFormatter={yTickFormatter}
            dx={-4}
          />

          {/* Crosshair cursor tooltip */}
          <Tooltip
            content={
              <InstitutionalTooltip
                isCurrency={isCurrency}
                unit={unit}
                showComparison={true}
              />
            }
            cursor={{ stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '4 4' }}
            isAnimationActive={false}
          />

          {/* Grounded Zero Baseline or Target Threshold */}
          {showBaseline && (
            <ReferenceLine
              y={baselineValue}
              stroke="#94a3b8"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          )}

          <Area
            type={curveType}
            dataKey="value"
            name={seriesName}
            stroke={color}
            strokeWidth={strokeWidth}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            isAnimationActive={true}
            animationDuration={350}
            animationEasing="ease-out"
            activeDot={{
              r: 5,
              fill: color,
              stroke: '#ffffff',
              strokeWidth: 2,
              className: 'shadow-md',
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

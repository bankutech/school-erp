import React, { useMemo } from 'react';
import { CompositionSegment } from './types';
import { formatCurrencyINR, formatCompactNumber } from './utils/formatters';

interface CompositionStackedBarProps {
  segments: CompositionSegment[];
  totalValue?: number;
  isCurrency?: boolean;
  unit?: string;
  height?: number;
}

export const CompositionStackedBar: React.FC<CompositionStackedBarProps> = ({
  segments,
  totalValue,
  isCurrency = false,
  unit = '',
  height = 20,
}) => {
  const sumTotal = useMemo(() => {
    if (totalValue !== undefined && totalValue > 0) return totalValue;
    return segments.reduce((acc, s) => acc + s.value, 0);
  }, [segments, totalValue]);

  const segmentsWithPercent = useMemo(() => {
    return segments.map((seg) => {
      const pct = sumTotal > 0 ? (seg.value / sumTotal) * 100 : 0;
      return {
        ...seg,
        computedPercentage: Math.max(0, Math.min(100, pct)),
      };
    });
  }, [segments, sumTotal]);

  const formatDisplay = (val: number) => {
    if (isCurrency) return formatCurrencyINR(val);
    return `${Number(val).toLocaleString('en-IN')}${unit ? ` ${unit}` : ''}`;
  };

  return (
    <div className="w-full space-y-4 py-2">
      {/* 1. Continuous Stacked Bar Line */}
      <div
        className="w-full rounded-xl overflow-hidden flex bg-slate-100 border border-slate-200/80 shadow-2xs"
        style={{ height: `${height}px` }}
      >
        {segmentsWithPercent.map((seg, idx) => {
          if (seg.computedPercentage <= 0) return null;
          return (
            <div
              key={seg.id || idx}
              style={{
                width: `${seg.computedPercentage}%`,
                backgroundColor: seg.color,
              }}
              className="h-full transition-all duration-300 relative group cursor-pointer first:rounded-l-xl last:rounded-r-xl"
              title={`${seg.label}: ${formatDisplay(seg.value)} (${seg.computedPercentage.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* 2. Direct Callout Labels Underneath (Eradicates detached floating legends) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        {segmentsWithPercent.map((seg, idx) => (
          <div
            key={seg.id || idx}
            className="p-3 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 rounded-xl transition-colors space-y-1"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-xs font-semibold text-slate-700 truncate">
                {seg.label}
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-0.5">
              <span className="font-mono font-bold text-slate-900 text-xs tabular-nums">
                {formatDisplay(seg.value)}
              </span>
              <span className="font-mono text-[11px] font-semibold text-slate-500 tabular-nums">
                {seg.computedPercentage.toFixed(1)}%
              </span>
            </div>
            {seg.details && (
              <p className="text-[10px] text-slate-400 leading-tight truncate">
                {seg.details}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

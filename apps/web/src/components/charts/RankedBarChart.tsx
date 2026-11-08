import React, { useMemo } from 'react';
import { CategoricalDataPoint } from './types';
import { formatCompactNumber } from './utils/formatters';

interface RankedBarChartProps {
  data: CategoricalDataPoint[];
  targetBenchmark?: number;
  benchmarkLabel?: string;
  unit?: string;
  maxScale?: number;
  valueFormatter?: (val: number) => string;
}

export const RankedBarChart: React.FC<RankedBarChartProps> = ({
  data,
  targetBenchmark,
  benchmarkLabel = 'Target Benchmark',
  unit = '%',
  maxScale,
  valueFormatter,
}) => {
  // Sort descending by value for categorical ranking ergonomics
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.value - a.value);
  }, [data]);

  const computedMax = useMemo(() => {
    if (maxScale) return maxScale;
    const maxVal = Math.max(...sortedData.map((d) => d.value), targetBenchmark || 0);
    return maxVal > 100 ? maxVal * 1.1 : 100;
  }, [sortedData, maxScale, targetBenchmark]);

  const formatDisplay = (val: number) => {
    if (valueFormatter) return valueFormatter(val);
    return `${val}${unit}`;
  };

  return (
    <div className="w-full space-y-3.5 py-1">
      {/* Benchmark Target Indicator Line Guide */}
      {targetBenchmark !== undefined && (
        <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100 text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-slate-400 border-t border-dashed border-slate-600"></span>
            <span className="text-[11px] font-medium">{benchmarkLabel}: <strong className="text-slate-800 font-mono tabular-nums">{formatDisplay(targetBenchmark)}</strong></span>
          </div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Ranked Descending</span>
        </div>
      )}

      {/* Ordered Horizontal Bar Rows */}
      <div className="space-y-2.5">
        {sortedData.map((item, idx) => {
          const percentageOfMax = Math.min(100, Math.max(0, (item.value / computedMax) * 100));
          const benchmarkPct = targetBenchmark ? (targetBenchmark / computedMax) * 100 : null;

          // Determine semantic state relative to benchmark or custom status
          let barBg = 'bg-slate-700';
          let badgeBg = 'text-slate-700 bg-slate-100';

          if (targetBenchmark !== undefined) {
            if (item.value >= targetBenchmark) {
              barBg = 'bg-emerald-600';
              badgeBg = 'text-emerald-800 bg-emerald-50 border-emerald-200';
            } else if (item.value >= targetBenchmark * 0.88) {
              barBg = 'bg-amber-600';
              badgeBg = 'text-amber-800 bg-amber-50 border-amber-200';
            } else {
              barBg = 'bg-rose-600';
              badgeBg = 'text-rose-800 bg-rose-50 border-rose-200';
            }
          }

          return (
            <div key={item.id || idx} className="group flex flex-col space-y-1">
              {/* Row Header: Label & Value */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 group-hover:text-slate-900 transition-colors truncate">
                  {item.label}
                  {item.category && (
                    <span className="ml-1.5 font-normal text-[11px] text-slate-400">
                      ({item.category})
                    </span>
                  )}
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] tabular-nums border ${badgeBg}`}
                >
                  {formatDisplay(item.value)}
                </span>
              </div>

              {/* Bar Frame with Benchmark Needle */}
              <div className="w-full h-4 bg-slate-100 rounded-lg overflow-hidden relative border border-slate-200/60">
                {/* Horizontal Progress Bar */}
                <div
                  className={`h-full rounded-lg transition-all duration-300 ease-out ${barBg}`}
                  style={{ width: `${percentageOfMax}%` }}
                />

                {/* Vertical Benchmark Target Line */}
                {benchmarkPct !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-800 z-10 shadow-xs"
                    style={{ left: `${benchmarkPct}%` }}
                    title={`Target: ${formatDisplay(targetBenchmark!)}`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

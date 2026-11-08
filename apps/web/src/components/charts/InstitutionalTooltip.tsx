import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { calculateDelta, formatCurrencyINR, formatCompactNumber } from './utils/formatters';

interface TooltipPayloadItem {
  name: string;
  value: number;
  color?: string;
  payload?: any;
  dataKey?: string;
}

interface InstitutionalTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  isCurrency?: boolean;
  unit?: string;
  showComparison?: boolean;
  previousValueKey?: string;
  customFormatter?: (val: number) => string;
}

export const InstitutionalTooltip: React.FC<InstitutionalTooltipProps> = ({
  active,
  payload,
  label,
  isCurrency = false,
  unit = '',
  showComparison = true,
  previousValueKey = 'previousValue',
  customFormatter,
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const primaryItem = payload[0];
  const rawValue = primaryItem.value;
  const itemPayload = primaryItem.payload || {};
  const previousValue = itemPayload[previousValueKey];

  const formatValue = (val: number) => {
    if (customFormatter) return customFormatter(val);
    if (isCurrency) return formatCurrencyINR(val);
    return `${Number(val).toLocaleString('en-IN')}${unit ? ` ${unit}` : ''}`;
  };

  const delta = showComparison && previousValue !== undefined ? calculateDelta(rawValue, previousValue) : null;

  return (
    <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 rounded-xl shadow-2xl p-3.5 text-xs max-w-xs min-w-[210px] pointer-events-none transition-all duration-150 z-50">
      {/* Date / Period Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 gap-3">
        <span className="font-semibold text-slate-300 tracking-wide text-[11px] uppercase truncate">
          {label || itemPayload.date || 'Snapshot Period'}
        </span>
        {itemPayload.isProjected && (
          <span className="px-1.5 py-0.5 rounded bg-brand-900/80 text-brand-300 text-[10px] font-mono uppercase tracking-wider border border-brand-700">
            Projected
          </span>
        )}
      </div>

      {/* Series Entries */}
      <div className="py-2.5 space-y-2">
        {payload.map((item, idx) => {
          const itemColor = item.color || '#3b82f6';
          return (
            <div key={idx} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: itemColor }}
                />
                <span className="text-slate-300 font-medium truncate text-xs">
                  {item.name || 'Value'}
                </span>
              </div>
              <span className="font-mono font-bold text-white tabular-nums text-xs shrink-0">
                {formatValue(item.value)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Comparative Context vs. Previous Period */}
      {delta && !delta.isZero && (
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">vs. Prior Period</span>
          <span
            className={`inline-flex items-center gap-0.5 font-mono font-semibold tabular-nums ${
              delta.isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {delta.isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
            <span>{delta.formattedDelta}</span>
          </span>
        </div>
      )}

      {delta && delta.isZero && (
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">vs. Prior Period</span>
          <span className="inline-flex items-center gap-0.5 font-mono text-slate-400">
            <Minus className="w-3 h-3" />
            <span>0.0% unchanged</span>
          </span>
        </div>
      )}
    </div>
  );
};

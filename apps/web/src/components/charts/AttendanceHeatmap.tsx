import React, { useState } from 'react';
import { HeatmapCell } from './types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface AttendanceHeatmapProps {
  cells: HeatmapCell[];
  rows: Array<{ id: string; label: string }>;
  columns: Array<{ id: string; label: string }>;
  thresholdWarning?: number; // e.g. 90%
  thresholdCritical?: number; // e.g. 85%
}

export const AttendanceHeatmap: React.FC<AttendanceHeatmapProps> = ({
  cells,
  rows,
  columns,
  thresholdWarning = 90,
  thresholdCritical = 85,
}) => {
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  // Index cells by `${rowId}_${colId}` for O(1) lookup
  const cellMap = React.useMemo(() => {
    const map = new Map<string, HeatmapCell>();
    cells.forEach((c) => {
      map.set(`${c.rowId}_${c.colId}`, c);
    });
    return map;
  }, [cells]);

  const getCellSeverity = (rate: number) => {
    if (rate >= 95) return 'bg-emerald-600 text-white';
    if (rate >= thresholdWarning) return 'bg-emerald-100 text-emerald-900 border-emerald-200';
    if (rate >= thresholdCritical) return 'bg-amber-100 text-amber-900 border-amber-200';
    return 'bg-rose-100 text-rose-900 border-rose-300 font-bold';
  };

  return (
    <div className="w-full space-y-4 py-1 select-none">
      {/* Legend & Outlier Summary */}
      <div className="flex flex-wrap items-center justify-between text-xs gap-3 pb-2 border-b border-slate-100">
        <span className="text-[11px] font-medium text-slate-500">
          Attendance Matrix (% Present by Day of Week)
        </span>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-600"></span>
            <span className="text-slate-600 font-mono">≥95% (High)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-200"></span>
            <span className="text-slate-600 font-mono">90-94%</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-200"></span>
            <span className="text-slate-600 font-mono">85-89%</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-200 border border-rose-400"></span>
            <span className="text-rose-700 font-semibold font-mono">&lt;85% (Outlier)</span>
          </span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="py-2 px-3 text-left font-semibold text-slate-500 uppercase tracking-wider text-[11px] w-32">
                Class / Section
              </th>
              {columns.map((col) => (
                <th
                  key={col.id}
                  className="py-2 px-2 text-center font-semibold text-slate-600 uppercase tracking-wider text-[11px]"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-2.5 px-3 font-semibold text-slate-800 text-xs truncate">
                  {row.label}
                </td>
                {columns.map((col) => {
                  const cell = cellMap.get(`${row.id}_${col.id}`) || {
                    rowId: row.id,
                    colId: col.id,
                    rowLabel: row.label,
                    colLabel: col.label,
                    value: 0,
                  };

                  const rate = cell.value;
                  const severityClass = getCellSeverity(rate);

                  return (
                    <td key={col.id} className="p-1 text-center">
                      <div
                        onMouseEnter={() => setHoveredCell(cell)}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`h-9 rounded-xl flex items-center justify-center font-mono text-xs tabular-nums border transition-all cursor-pointer shadow-2xs hover:scale-105 ${severityClass}`}
                        title={`${row.label} • ${col.label}: ${rate.toFixed(1)}%`}
                      >
                        {rate > 0 ? `${rate.toFixed(1)}%` : '—'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hover Inspection Footer */}
      {hoveredCell && (
        <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-100">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">{hoveredCell.rowLabel}</span>
            <span className="text-slate-400">•</span>
            <span className="text-brand-300 font-medium">{hoveredCell.colLabel}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-[11px]">
              Present: <strong className="text-white font-mono tabular-nums">{hoveredCell.total ? Math.round((hoveredCell.value / 100) * hoveredCell.total) : '—'}</strong> / {hoveredCell.total || '45'}
            </span>
            <span
              className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                hoveredCell.value >= 90
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}
            >
              {hoveredCell.value.toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

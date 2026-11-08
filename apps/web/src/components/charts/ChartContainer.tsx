import React, { useRef, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileCode,
  RefreshCw,
  AlertTriangle,
  Info,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { DateRangeKey } from './types';
import { downloadChartCsv, exportChartSvg } from './utils/formatters';

export interface ChartContainerProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  activeRange?: DateRangeKey;
  onRangeChange?: (range: DateRangeKey) => void;
  availableRanges?: DateRangeKey[];
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  onRetry?: () => void;
  exportData?: Array<Record<string, any>>;
  exportFilename?: string;
  chartType?: 'area' | 'bar' | 'heatmap' | 'stacked';
  height?: number | string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  badge,
  activeRange,
  onRangeChange,
  availableRanges = ['7D', '30D', '90D', 'YTD'],
  isLoading = false,
  isError = false,
  isEmpty = false,
  emptyTitle = 'No data points recorded',
  emptyDescription = 'There is no recorded data for the active filter parameters or date interval.',
  emptyActionLabel = 'Reset Parameters',
  onEmptyAction,
  onRetry,
  exportData,
  exportFilename = 'chart-export',
  chartType = 'area',
  height = 340,
  children,
  headerRight,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const handleExportCsv = () => {
    setIsExportMenuOpen(false);
    if (exportData && exportData.length > 0) {
      downloadChartCsv(exportData, `${exportFilename}.csv`);
    }
  };

  const handleExportSvg = () => {
    setIsExportMenuOpen(false);
    exportChartSvg(containerRef.current, `${exportFilename}.svg`);
  };

  return (
    <div
      ref={containerRef}
      className={`bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col transition-all duration-200 relative ${className}`}
    >
      {/* Top Header: Title, Description & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">{title}</h3>
            {badge}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{subtitle}</p>}
        </div>

        {/* Controls: Range Buttons, Export & Custom Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          {headerRight}

          {/* Quick Date Range Selector */}
          {activeRange && onRangeChange && (
            <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/80 text-xs">
              {availableRanges.map((range) => {
                const isActive = activeRange === range;
                return (
                  <button
                    key={range}
                    type="button"
                    onClick={() => onRangeChange(range)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      isActive
                        ? 'bg-white text-brand-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {range}
                  </button>
                );
              })}
            </div>
          )}

          {/* Export Dropdown Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-2xs"
              title="Export visualization or raw dataset"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isExportMenuOpen && (
              <div
                className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 text-xs animate-in fade-in zoom-in-95 duration-100"
                onMouseLeave={() => setIsExportMenuOpen(false)}
              >
                {exportData && (
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 text-slate-700"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Download CSV Dataset</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleExportSvg}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 text-slate-700"
                >
                  <FileCode className="w-4 h-4 text-brand-600" />
                  <span>Download Vector SVG</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chart Body Frame */}
      <div
        className="w-full relative flex-1 pt-4"
        style={{ height: typeof height === 'number' ? `${height}px` : height, minHeight: '260px' }}
      >
        {/* 1. SKELETON LOADING STATE (Mirrors actual axes and ghost shapes) */}
        {isLoading && (
          <div className="w-full h-full flex flex-col justify-between p-4 animate-pulse">
            <div className="flex items-center justify-between pb-2">
              <div className="h-4 w-32 bg-slate-200 rounded"></div>
              <div className="h-4 w-20 bg-slate-200 rounded"></div>
            </div>
            {chartType === 'bar' ? (
              <div className="space-y-3 flex-1 flex flex-col justify-around py-3">
                {[88, 65, 78, 45, 92].map((w, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-16 h-3 bg-slate-200 rounded shrink-0"></div>
                    <div
                      className="h-5 bg-slate-200 rounded-md"
                      style={{ width: `${w}%` }}
                    ></div>
                  </div>
                ))}
              </div>
            ) : chartType === 'heatmap' ? (
              <div className="grid grid-cols-5 gap-2 flex-1 py-3">
                {Array.from({ length: 25 }).map((_, idx) => (
                  <div key={idx} className="h-full bg-slate-100 rounded-lg"></div>
                ))}
              </div>
            ) : (
              // Area / Trend Skeleton
              <div className="flex-1 flex flex-col justify-between py-2 border-b border-l border-slate-200">
                <div className="w-full h-px bg-slate-100 border-dashed border-t border-slate-200"></div>
                <div className="w-full h-px bg-slate-100 border-dashed border-t border-slate-200"></div>
                <div className="w-full h-px bg-slate-100 border-dashed border-t border-slate-200"></div>
                <div className="w-full h-24 bg-gradient-to-t from-slate-200/50 to-transparent rounded-t-xl"></div>
              </div>
            )}
            <div className="flex justify-between pt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-3 w-10 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        )}

        {/* 2. ERROR STATE BOUNDARY WITH INLINE RETRY */}
        {!isLoading && isError && (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-3 shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Failed to stream telemetry</h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
              An error occurred while computing the aggregated metric dataset from the institutional server.
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Metric Load</span>
              </button>
            )}
          </div>
        )}

        {/* 3. DESCRIPTIVE EMPTY STATE WITH DIRECT ACTION */}
        {!isLoading && !isError && isEmpty && (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <Info className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-800 text-xs">{emptyTitle}</h4>
            <p className="text-[11px] text-slate-500 max-w-xs mt-1 leading-relaxed">
              {emptyDescription}
            </p>
            {onEmptyAction && (
              <button
                type="button"
                onClick={onEmptyAction}
                className="mt-3 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px] shadow-2xs transition-colors"
              >
                {emptyActionLabel}
              </button>
            )}
          </div>
        )}

        {/* 4. ACTIVE CHART RENDER */}
        {!isLoading && !isError && !isEmpty && children}
      </div>
    </div>
  );
};

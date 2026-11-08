export type DateRangeKey = '7D' | '30D' | '90D' | 'YTD';

export interface TimeSeriesPoint {
  date: string; // ISO date or formatted label (e.g. "14 Oct", "2026-10-14")
  value: number;
  previousValue?: number;
  secondaryValue?: number;
  label?: string;
  isProjected?: boolean;
}

export interface CategoricalDataPoint {
  id: string;
  label: string;
  category?: string;
  value: number;
  target?: number;
  secondaryValue?: number;
  status?: 'optimal' | 'warning' | 'critical' | 'neutral';
  meta?: Record<string, any>;
}

export interface CompositionSegment {
  id: string;
  label: string;
  value: number;
  percentage?: number;
  color: string;
  semanticIntent?: 'neutral' | 'healthy' | 'warning' | 'critical';
  details?: string;
}

export interface HeatmapCell {
  rowId: string;
  colId: string;
  rowLabel: string;
  colLabel: string;
  value: number; // e.g. 94.5 (percentage) or count
  total?: number;
  rate?: number;
  meta?: Record<string, any>;
}

export interface DeltaComparison {
  deltaValue: number;
  deltaPercent: number;
  isPositive: boolean;
  isZero: boolean;
  formattedDelta: string;
}

export interface ChartExportConfig {
  filename?: string;
  title?: string;
  subtitle?: string;
}

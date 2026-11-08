import { TimeSeriesPoint, CategoricalDataPoint, CompositionSegment, HeatmapCell, DateRangeKey } from './types';

/**
 * Realistic Institutional Fee Collection Runs (7D, 30D, 90D, YTD)
 * Models: Day-by-day cash inflows with prior period comparison, weekend drops, and fee deadline spikes.
 */
export const MOCK_COLLECTIONS_DATA: Record<DateRangeKey, TimeSeriesPoint[]> = {
  '7D': [
    { date: '15 Oct', value: 450000, previousValue: 380000, label: 'Wed 15 Oct' },
    { date: '16 Oct', value: 680000, previousValue: 510000, label: 'Thu 16 Oct' },
    { date: '17 Oct', value: 890000, previousValue: 720000, label: 'Fri 17 Oct' },
    { date: '18 Oct', value: 210000, previousValue: 180000, label: 'Sat 18 Oct' },
    { date: '19 Oct', value: 0, previousValue: 0, label: 'Sun 19 Oct (Bank Holiday)' }, // Edge case: zero-value period
    { date: '20 Oct', value: 1250000, previousValue: 980000, label: 'Mon 20 Oct (Fee Due Date)' },
    { date: '21 Oct', value: 740000, previousValue: 690000, label: 'Tue 21 Oct (Today)' },
  ],
  '30D': [
    { date: '22 Sep', value: 320000, previousValue: 290000 },
    { date: '25 Sep', value: 450000, previousValue: 410000 },
    { date: '28 Sep', value: 180000, previousValue: 200000 },
    { date: '01 Oct', value: 1850000, previousValue: 1400000 },
    { date: '04 Oct', value: 520000, previousValue: 480000 },
    { date: '07 Oct', value: 410000, previousValue: 390000 },
    { date: '10 Oct', value: 920000, previousValue: 850000 },
    { date: '13 Oct', value: 610000, previousValue: 580000 },
    { date: '16 Oct', value: 680000, previousValue: 510000 },
    { date: '19 Oct', value: 0, previousValue: 0 },
    { date: '21 Oct', value: 740000, previousValue: 690000 },
  ],
  '90D': [
    { date: 'W31 Jul', value: 2400000, previousValue: 2100000 },
    { date: 'W33 Aug', value: 3100000, previousValue: 2800000 },
    { date: 'W35 Aug', value: 1950000, previousValue: 1800000 },
    { date: 'W37 Sep', value: 4200000, previousValue: 3600000 },
    { date: 'W39 Sep', value: 2800000, previousValue: 2900000 },
    { date: 'W41 Oct', value: 5400000, previousValue: 4600000 },
    { date: 'W43 Oct', value: 3600000, previousValue: 3100000 },
  ],
  'YTD': [
    { date: 'Apr 2026', value: 8400000, previousValue: 7200000 },
    { date: 'May 2026', value: 6200000, previousValue: 5900000 },
    { date: 'Jun 2026', value: 3100000, previousValue: 2900000 },
    { date: 'Jul 2026', value: 9800000, previousValue: 8600000 },
    { date: 'Aug 2026', value: 7400000, previousValue: 7100000 },
    { date: 'Sep 2026', value: 11200000, previousValue: 9800000 },
    { date: 'Oct 2026', value: 8900000, previousValue: 7800000, isProjected: true },
  ],
};

/**
 * Section-Wise Academic Examination Marks Ranking
 * Grounded benchmark: 75% school target passing benchmark.
 */
export const MOCK_ACADEMIC_RANKING: CategoricalDataPoint[] = [
  { id: '10-a', label: 'Class 10 - Section A', category: 'Secondary', value: 88.4, target: 75 },
  { id: '12-sci', label: 'Class 12 - Science', category: 'Sr Secondary', value: 84.2, target: 75 },
  { id: '09-a', label: 'Class 9 - Section A', category: 'Secondary', value: 79.6, target: 75 },
  { id: '11-com', label: 'Class 11 - Commerce', category: 'Sr Secondary', value: 76.8, target: 75 },
  { id: '08-b', label: 'Class 8 - Section B', category: 'Middle', value: 74.2, target: 75 }, // Just below target (Amber)
  { id: '10-b', label: 'Class 10 - Section B', category: 'Secondary', value: 71.5, target: 75 }, // Deficit (Amber/Rose)
  { id: '07-a', label: 'Class 7 - Section A', category: 'Middle', value: 68.9, target: 75 }, // Actionable outlier (Rose)
];

/**
 * Fee Ledger Aging & Recovery Breakdown (Part-to-Whole <= 4 categories)
 * Grounded colors: Emerald, Sky, Amber, Rose
 */
export const MOCK_FEE_COMPOSITION: CompositionSegment[] = [
  {
    id: 'settled',
    label: 'Fully Settled',
    value: 6450000,
    color: '#059669', // Emerald
    semanticIntent: 'healthy',
    details: 'Received & verified by accounts desk',
  },
  {
    id: 'partial',
    label: 'Partially Paid',
    value: 1250000,
    color: '#0284c7', // Sky / Slate
    semanticIntent: 'neutral',
    details: 'First installment cleared',
  },
  {
    id: 'pending',
    label: 'Current Term Pending',
    value: 1800000,
    color: '#d97706', // Amber
    semanticIntent: 'warning',
    details: 'Within 15-day grace period',
  },
  {
    id: 'overdue',
    label: 'Overdue Dues',
    value: 580000,
    color: '#e11d48', // Crimson/Rose
    semanticIntent: 'critical',
    details: 'Second reminder notice dispatched',
  },
];

/**
 * Weekly Attendance Matrix by Class/Section (Outlier Detection)
 * Days: Monday to Friday
 */
export const MOCK_ATTENDANCE_HEATMAP = {
  columns: [
    { id: 'mon', label: 'Mon' },
    { id: 'tue', label: 'Tue' },
    { id: 'wed', label: 'Wed' },
    { id: 'thu', label: 'Thu' },
    { id: 'fri', label: 'Fri' },
  ],
  rows: [
    { id: 'c10a', label: 'Class 10-A' },
    { id: 'c10b', label: 'Class 10-B' },
    { id: 'c9a', label: 'Class 9-A' },
    { id: 'c9b', label: 'Class 9-B' },
    { id: 'c8a', label: 'Class 8-A' },
    { id: 'c12sci', label: 'Class 12-Sci' },
  ],
  cells: [
    // Class 10-A: Healthy
    { rowId: 'c10a', colId: 'mon', rowLabel: 'Class 10-A', colLabel: 'Mon', value: 97.5, total: 40 },
    { rowId: 'c10a', colId: 'tue', rowLabel: 'Class 10-A', colLabel: 'Tue', value: 96.0, total: 40 },
    { rowId: 'c10a', colId: 'wed', rowLabel: 'Class 10-A', colLabel: 'Wed', value: 95.0, total: 40 },
    { rowId: 'c10a', colId: 'thu', rowLabel: 'Class 10-A', colLabel: 'Thu', value: 94.5, total: 40 },
    { rowId: 'c10a', colId: 'fri', rowLabel: 'Class 10-A', colLabel: 'Fri', value: 92.5, total: 40 },

    // Class 10-B: Monday / Friday truancy dips
    { rowId: 'c10b', colId: 'mon', rowLabel: 'Class 10-B', colLabel: 'Mon', value: 89.2, total: 38 },
    { rowId: 'c10b', colId: 'tue', rowLabel: 'Class 10-B', colLabel: 'Tue', value: 94.1, total: 38 },
    { rowId: 'c10b', colId: 'wed', rowLabel: 'Class 10-B', colLabel: 'Wed', value: 93.0, total: 38 },
    { rowId: 'c10b', colId: 'thu', rowLabel: 'Class 10-B', colLabel: 'Thu', value: 91.8, total: 38 },
    { rowId: 'c10b', colId: 'fri', rowLabel: 'Class 10-B', colLabel: 'Fri', value: 84.2, total: 38 }, // Outlier!

    // Class 9-A
    { rowId: 'c9a', colId: 'mon', rowLabel: 'Class 9-A', colLabel: 'Mon', value: 95.0, total: 42 },
    { rowId: 'c9a', colId: 'tue', rowLabel: 'Class 9-A', colLabel: 'Tue', value: 96.5, total: 42 },
    { rowId: 'c9a', colId: 'wed', rowLabel: 'Class 9-A', colLabel: 'Wed', value: 93.5, total: 42 },
    { rowId: 'c9a', colId: 'thu', rowLabel: 'Class 9-A', colLabel: 'Thu', value: 92.0, total: 42 },
    { rowId: 'c9a', colId: 'fri', rowLabel: 'Class 9-A', colLabel: 'Fri', value: 91.0, total: 42 },

    // Class 9-B
    { rowId: 'c9b', colId: 'mon', rowLabel: 'Class 9-B', colLabel: 'Mon', value: 91.5, total: 41 },
    { rowId: 'c9b', colId: 'tue', rowLabel: 'Class 9-B', colLabel: 'Tue', value: 90.0, total: 41 },
    { rowId: 'c9b', colId: 'wed', rowLabel: 'Class 9-B', colLabel: 'Wed', value: 88.5, total: 41 }, // Warning
    { rowId: 'c9b', colId: 'thu', rowLabel: 'Class 9-B', colLabel: 'Thu', value: 89.2, total: 41 },
    { rowId: 'c9b', colId: 'fri', rowLabel: 'Class 9-B', colLabel: 'Fri', value: 82.0, total: 41 }, // Outlier!

    // Class 8-A
    { rowId: 'c8a', colId: 'mon', rowLabel: 'Class 8-A', colLabel: 'Mon', value: 96.0, total: 39 },
    { rowId: 'c8a', colId: 'tue', rowLabel: 'Class 8-A', colLabel: 'Tue', value: 97.2, total: 39 },
    { rowId: 'c8a', colId: 'wed', rowLabel: 'Class 8-A', colLabel: 'Wed', value: 95.8, total: 39 },
    { rowId: 'c8a', colId: 'thu', rowLabel: 'Class 8-A', colLabel: 'Thu', value: 94.0, total: 39 },
    { rowId: 'c8a', colId: 'fri', rowLabel: 'Class 8-A', colLabel: 'Fri', value: 93.1, total: 39 },

    // Class 12-Sci
    { rowId: 'c12sci', colId: 'mon', rowLabel: 'Class 12-Sci', colLabel: 'Mon', value: 93.0, total: 35 },
    { rowId: 'c12sci', colId: 'tue', rowLabel: 'Class 12-Sci', colLabel: 'Tue', value: 94.5, total: 35 },
    { rowId: 'c12sci', colId: 'wed', rowLabel: 'Class 12-Sci', colLabel: 'Wed', value: 91.0, total: 35 },
    { rowId: 'c12sci', colId: 'thu', rowLabel: 'Class 12-Sci', colLabel: 'Thu', value: 88.0, total: 35 },
    { rowId: 'c12sci', colId: 'fri', rowLabel: 'Class 12-Sci', colLabel: 'Fri', value: 87.5, total: 35 },
  ],
};

/**
 * Fleet Transport Capacity vs. Current Ridership
 */
export const MOCK_FLEET_CAPACITY = [
  { route: 'Route 1 (North Campus Express)', busNumber: 'DL 01 AB 1234', capacity: 45, occupied: 42, pct: 93.3 },
  { route: 'Route 2 (South Extension Shuttle)', busNumber: 'DL 01 CD 5678', capacity: 35, occupied: 34, pct: 97.1 },
  { route: 'Route 3 (East Enclave Transit)', busNumber: 'DL 01 EF 9012', capacity: 45, occupied: 28, pct: 62.2 },
  { route: 'Route 4 (West Ring Road)', busNumber: 'DL 01 GH 3456', capacity: 40, occupied: 39, pct: 97.5 },
];

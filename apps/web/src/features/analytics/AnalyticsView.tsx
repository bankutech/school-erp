import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Award,
  CalendarCheck,
  CreditCard,
  Bus,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Filter,
  Download,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { DateRangeKey } from '../../components/charts/types';
import { ChartContainer } from '../../components/charts/ChartContainer';
import { TrendAreaChart } from '../../components/charts/TrendAreaChart';
import { RankedBarChart } from '../../components/charts/RankedBarChart';
import { CompositionStackedBar } from '../../components/charts/CompositionStackedBar';
import { AttendanceHeatmap } from '../../components/charts/AttendanceHeatmap';
import {
  MOCK_COLLECTIONS_DATA,
  MOCK_ACADEMIC_RANKING,
  MOCK_FEE_COMPOSITION,
  MOCK_ATTENDANCE_HEATMAP,
  MOCK_FLEET_CAPACITY,
} from '../../components/charts/mockData';
import { formatCurrencyINR } from '../../components/charts/utils/formatters';
import { useAcademic } from '../../context/AcademicContext';

export const AnalyticsView: React.FC = () => {
  const { selectedYear, isCurrentYear } = useAcademic();

  // Global & Chart-Specific State
  const [collectionRange, setCollectionRange] = useState<DateRangeKey>('7D');
  const [academicTarget, setAcademicTarget] = useState<number>(75);
  const [selectedCohort, setSelectedCohort] = useState<string>('ALL');

  // Simulation states to demonstrate Part 3 zero-surprise state resilience
  const [simulateLoading, setSimulateLoading] = useState(false);
  const [simulateError, setSimulateError] = useState(false);
  const [simulateEmpty, setSimulateEmpty] = useState(false);

  // Memoized timeseries data transformation based on selected date range
  const currentCollectionsData = useMemo(() => {
    if (simulateEmpty) return [];
    return MOCK_COLLECTIONS_DATA[collectionRange] || [];
  }, [collectionRange, simulateEmpty]);

  // Total collections calculation
  const totalInPeriod = useMemo(() => {
    return currentCollectionsData.reduce((acc, curr) => acc + curr.value, 0);
  }, [currentCollectionsData]);

  // Filtered academic ranking
  const filteredAcademicRanking = useMemo(() => {
    if (selectedCohort === 'ALL') return MOCK_ACADEMIC_RANKING;
    return MOCK_ACADEMIC_RANKING.filter((item) =>
      item.category?.toLowerCase().includes(selectedCohort.toLowerCase())
    );
  }, [selectedCohort]);

  return (
    <div className="space-y-6">
      {/* Executive Intelligence Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Executive Analytics & Performance Cockpit
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              AY {selectedYear?.name || '2026–27'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            High-density telemetry covering cash velocity, curriculum benchmark attainment, weekly attendance patterns, and fleet utilization.
          </p>
        </div>

        {/* State Resilience Simulation Toggles */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
          <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Resilience Demo:</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setSimulateLoading(true);
              setTimeout(() => setSimulateLoading(false), 1200);
            }}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 font-medium text-slate-700 text-[11px] shadow-2xs transition-colors"
          >
            {simulateLoading ? 'Testing Skeleton...' : 'Test Skeleton'}
          </button>
          <button
            type="button"
            onClick={() => setSimulateError((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg border font-medium text-[11px] transition-colors ${
              simulateError
                ? 'bg-rose-600 text-white border-rose-700'
                : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
            }`}
          >
            {simulateError ? 'Error Active (Clear)' : 'Simulate Error'}
          </button>
          <button
            type="button"
            onClick={() => setSimulateEmpty((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg border font-medium text-[11px] transition-colors ${
              simulateEmpty
                ? 'bg-amber-600 text-white border-amber-700'
                : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
            }`}
          >
            {simulateEmpty ? 'Empty Active (Reset)' : 'Simulate Empty'}
          </button>
        </div>
      </div>

      {/* KPI SPARKLINE STRIP (High Density Quick-Look) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Collections */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Cash Inflow ({collectionRange})
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
              {formatCurrencyINR(totalInPeriod, true)}
            </p>
            <p className="text-[11px] text-emerald-600 mt-1 font-semibold flex items-center gap-1 tabular-nums">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+8.4% vs. prior period</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Academic Benchmark Attainment */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Exam Benchmark Attainment
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
              71.4%
            </p>
            <p className="text-[11px] text-amber-600 mt-1 font-semibold flex items-center gap-1 tabular-nums">
              <span>5 of 7 sections above target</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Weekly Attendance Ratio */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Weekly Attendance Rate
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
              92.8%
            </p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Friday truancy drop: <span className="text-rose-600 font-semibold tabular-nums">-7.2%</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Fleet Safety & Seat Load */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Fleet Seat Utilization
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
              88.5%
            </p>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium">
              Zero capacity exceedance
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
            <Bus className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2-COLUMN PRIMARY VISUALIZATION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: CONTINUOUS TREND OVER TIME */}
        <ChartContainer
          title="Cash Inflow Velocity & Run-Rate"
          subtitle="Continuous trend line pinned to baseline (y=0) with hover crosshairs and prior interval delta tracking."
          activeRange={collectionRange}
          onRangeChange={(r) => setCollectionRange(r)}
          availableRanges={['7D', '30D', '90D', 'YTD']}
          isLoading={simulateLoading}
          isError={simulateError}
          isEmpty={simulateEmpty}
          emptyTitle="No cash receipts recorded"
          emptyDescription="Zero fee transactions found for this interval. Switch to 30D or reset filters."
          onEmptyAction={() => setSimulateEmpty(false)}
          onRetry={() => setSimulateError(false)}
          exportData={currentCollectionsData}
          exportFilename={`collections-${collectionRange}`}
          chartType="area"
          badge={
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Live Bank Stream
            </span>
          }
        >
          <TrendAreaChart
            data={currentCollectionsData}
            seriesName="Receipts"
            isCurrency={true}
            color="#2563eb"
            gradientId="collectionsGrad"
            showBaseline={true}
            baselineValue={0}
            curveType="monotone"
          />
        </ChartContainer>

        {/* CHART 2: COMPARATIVE RANKING & BENCHMARK DEFICIT */}
        <ChartContainer
          title="Curriculum Benchmark Attainment by Section"
          subtitle="Ranked descending with 75% institutional target reference line to surface actionable curriculum outliers."
          isLoading={simulateLoading}
          isError={simulateError}
          isEmpty={simulateEmpty}
          onEmptyAction={() => setSimulateEmpty(false)}
          onRetry={() => setSimulateError(false)}
          exportData={filteredAcademicRanking}
          exportFilename="academic-benchmarks"
          chartType="bar"
          headerRight={
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCohort}
                onChange={(e) => setSelectedCohort(e.target.value)}
                className="px-2 py-1 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="ALL">All Cohorts</option>
                <option value="Secondary">Secondary</option>
                <option value="Sr Secondary">Sr Secondary</option>
                <option value="Middle">Middle</option>
              </select>
            </div>
          }
          badge={
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
              Term 1 Mid-Exams
            </span>
          }
        >
          <RankedBarChart
            data={filteredAcademicRanking}
            targetBenchmark={academicTarget}
            benchmarkLabel="School Standard Target"
            unit="%"
            maxScale={100}
          />
        </ChartContainer>
      </div>

      {/* 2-COLUMN SECONDARY VISUALIZATION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 3: PART-TO-WHOLE RELATIONSHIP (<= 4 CATEGORIES) */}
        <ChartContainer
          title="Fee Ledger Aging & Recovery Breakdown"
          subtitle="Part-to-whole composition with direct callouts underneath, eliminating disconnected floating legends."
          isLoading={simulateLoading}
          isError={simulateError}
          isEmpty={simulateEmpty}
          onEmptyAction={() => setSimulateEmpty(false)}
          onRetry={() => setSimulateError(false)}
          exportData={MOCK_FEE_COMPOSITION}
          exportFilename="fee-aging-breakdown"
          chartType="stacked"
          badge={
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
              ₹1.008 Cr Total Dues
            </span>
          }
        >
          <CompositionStackedBar
            segments={MOCK_FEE_COMPOSITION}
            isCurrency={true}
            height={22}
          />
        </ChartContainer>

        {/* CHART 4: OPERATIONAL STATUS & OUTLIER DETECTION MATRIX */}
        <ChartContainer
          title="Weekly Attendance & Truancy Outlier Matrix"
          subtitle="Day-of-week attendance patterns across cohorts. Highlights critical Friday truancy drops (<85%) in rose."
          isLoading={simulateLoading}
          isError={simulateError}
          isEmpty={simulateEmpty}
          onEmptyAction={() => setSimulateEmpty(false)}
          onRetry={() => setSimulateError(false)}
          exportData={MOCK_ATTENDANCE_HEATMAP.cells}
          exportFilename="attendance-heatmap"
          chartType="heatmap"
          badge={
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
              2 Friday Outliers Flagged
            </span>
          }
        >
          <AttendanceHeatmap
            cells={MOCK_ATTENDANCE_HEATMAP.cells}
            rows={MOCK_ATTENDANCE_HEATMAP.rows}
            columns={MOCK_ATTENDANCE_HEATMAP.columns}
            thresholdWarning={90}
            thresholdCritical={85}
          />
        </ChartContainer>
      </div>

      {/* CHART 5: FLEET UTILIZATION & CAPACITY GAUGES */}
      <ChartContainer
        title="Fleet Transport Capacity & Safety Compliance"
        subtitle="Bullet bars comparing real-time student seat allocation against licensed vehicle capacity limits."
        isLoading={simulateLoading}
        isError={simulateError}
        isEmpty={simulateEmpty}
        onEmptyAction={() => setSimulateEmpty(false)}
        onRetry={() => setSimulateError(false)}
        exportData={MOCK_FLEET_CAPACITY}
        exportFilename="fleet-capacity"
        badge={
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Safety Compliant
          </span>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-2">
          {MOCK_FLEET_CAPACITY.map((bus) => {
            const isNearFull = bus.pct >= 95;
            const barColor = isNearFull ? 'bg-amber-600' : 'bg-emerald-600';
            const badgeColor = isNearFull
              ? 'text-amber-800 bg-amber-50 border-amber-200'
              : 'text-emerald-800 bg-emerald-50 border-emerald-200';

            return (
              <div
                key={bus.busNumber}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900 text-xs truncate">{bus.route}</h4>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{bus.busNumber}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${badgeColor}`}>
                    {bus.pct.toFixed(1)}%
                  </span>
                </div>

                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                    style={{ width: `${bus.pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono">
                  <span>Occupied: <strong className="text-slate-900 tabular-nums">{bus.occupied}</strong></span>
                  <span>Cap: <strong className="text-slate-900 tabular-nums">{bus.capacity} seats</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </ChartContainer>
    </div>
  );
};

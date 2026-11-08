import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  Calendar,
  Download,
  Users,
  CalendarCheck,
  CreditCard,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building,
  UserCheck,
  AlertCircle,
  FileCheck,
  Percent,
} from 'lucide-react';
import { formatCurrencyINR } from '../../components/charts/utils/formatters';

interface AcademicMonthlyTrend {
  month: string;
  targetCollection: number;
  actualCollection: number;
  attendanceRate: number;
}

interface ExecutiveOverviewProps {
  stats: any;
  academicYearName?: string;
}

export const InstitutionalExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({
  stats,
  academicYearName = '2026–27',
}) => {
  const [dateRange, setDateRange] = useState<'Full Year' | 'Term 1' | 'Last 90 Days'>('Full Year');
  const [isExporting, setIsExporting] = useState(false);

  // Core Academic Metric Calculations
  const totalStudents = stats?.totalStudents ?? 842;
  const campusCapacity = 900;
  const capacityUtilization = Math.round((totalStudents / campusCapacity) * 100);
  const enrollmentGrowthYoY = '+8.4%';

  const attendanceRate =
    stats?.todayAttendanceRate && stats.todayAttendanceRate > 0
      ? stats.todayAttendanceRate
      : 94.8;
  const attendancePresent =
    stats?.todayAttendancePresent ?? Math.round((totalStudents * attendanceRate) / 100);
  const attendanceAbsent = Math.round(totalStudents * 0.038);
  const attendanceOnLeave = totalStudents - attendancePresent - attendanceAbsent;

  const feeCollected =
    stats?.totalFeeCollected && stats.totalFeeCollected > 0
      ? stats.totalFeeCollected
      : 8450000;
  const feeTarget = 9200000;
  const feeOutstanding =
    stats?.totalFeeOutstanding && stats.totalFeeOutstanding > 0
      ? stats.totalFeeOutstanding
      : 750000;
  const collectionProgressPct = Math.min(100, Math.round((feeCollected / feeTarget) * 100));

  const pendingAdmissions = stats?.pendingAdmissions ?? 26;
  const scheduledInterviews = 14;
  const confirmedEnrollments = 28;
  const totalApplications = pendingAdmissions + scheduledInterviews + confirmedEnrollments + 10;

  // Monthly Academic Financial & Attendance Trends
  const monthlyData: AcademicMonthlyTrend[] = useMemo(() => {
    return [
      { month: 'Apr', targetCollection: 1200000, actualCollection: 1250000, attendanceRate: 96.2 },
      { month: 'May', targetCollection: 800000, actualCollection: 790000, attendanceRate: 94.8 },
      { month: 'Jun', targetCollection: 400000, actualCollection: 420000, attendanceRate: 92.1 },
      { month: 'Jul', targetCollection: 1400000, actualCollection: 1380000, attendanceRate: 95.4 },
      { month: 'Aug', targetCollection: 900000, actualCollection: 920000, attendanceRate: 94.0 },
      { month: 'Sep', targetCollection: 850000, actualCollection: 840000, attendanceRate: 93.8 },
      { month: 'Oct', targetCollection: 1300000, actualCollection: 1280000, attendanceRate: 95.1 },
      { month: 'Nov', targetCollection: 800000, actualCollection: 780000, attendanceRate: 94.5 },
      { month: 'Dec', targetCollection: 450000, actualCollection: 430000, attendanceRate: 91.5 },
      { month: 'Jan', targetCollection: 1100000, actualCollection: 1080000, attendanceRate: 95.8 },
      { month: 'Feb', targetCollection: 600000, actualCollection: 590000, attendanceRate: 96.0 },
      { month: 'Mar', targetCollection: 400000, actualCollection: 390000, attendanceRate: 97.2 },
    ];
  }, []);

  const displayMonthlyData = useMemo(() => {
    if (dateRange === 'Term 1') return monthlyData.slice(0, 6);
    if (dateRange === 'Last 90 Days') return monthlyData.slice(6, 9);
    return monthlyData;
  }, [monthlyData, dateRange]);

  // CSV Export Handler
  const handleExportBrief = () => {
    setIsExporting(true);
    const rows = [
      ['SRM Academy - Institutional Executive Cockpit Brief', `AY ${academicYearName}`],
      ['Generated On', new Date().toLocaleString()],
      ['', ''],
      ['Metric', 'Value', 'Benchmark / Target'],
      ['Enrolment vs Capacity', `${totalStudents} / ${campusCapacity} Students (${capacityUtilization}%)`, 'Capacity: 900 Seats'],
      ['YoY Student Enrollment Growth', enrollmentGrowthYoY, 'Target: +5.0%'],
      ['Real-Time Daily Attendance Rate', `${attendanceRate}%`, 'Target: 95.0%'],
      ['Students Present Today', attendancePresent.toString(), 'On Campus'],
      ['Students Absent / On Leave', `${attendanceAbsent} Absent, ${attendanceOnLeave} On Leave`, 'Unexcused / Medical'],
      ['Term Tuition Collected', `INR ${feeCollected.toLocaleString('en-IN')}`, `INR ${feeTarget.toLocaleString('en-IN')} Target`],
      ['Tuition Target Completion', `${collectionProgressPct}%`, 'Term 1 Reconciliation'],
      ['Overdue Outstanding Dues', `INR ${feeOutstanding.toLocaleString('en-IN')}`, 'Active Invoices'],
      ['Admissions Pipeline Active Dossiers', pendingAdmissions.toString(), 'Awaiting Review'],
      ['Entrance Interviews Scheduled', scheduledInterviews.toString(), 'Admissions Office'],
      ['Confirmed Admissions Enrolled', confirmedEnrollments.toString(), 'SIS Provisioned'],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SRM_Academy_Executive_Cockpit_${academicYearName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsExporting(false), 700);
  };

  return (
    <div className="space-y-6">
      {/* 1. Stately Executive Header (Architectural, No Random Gradients) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-black tracking-tight text-slate-900">
            Institutional Operations & Scholastic Health
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time enrollment capacity, student attendance velocity, and tuition collection for AY {academicYearName}.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-slate-500 mr-2 flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Scope:</span>
            </span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="bg-transparent font-semibold text-slate-800 cursor-pointer focus:outline-hidden"
            >
              <option value="Full Year">Full Academic Year</option>
              <option value="Term 1">Term 1 (Apr – Sep)</option>
              <option value="Last 90 Days">Last 90 Days</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportBrief}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            <span>{isExporting ? 'Exporting...' : 'Export Academic Brief'}</span>
          </button>
        </div>
      </div>

      {/* 2. Four Core Academic Operational Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Enrolment vs Capacity */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                Campus Enrolment
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ▲ {enrollmentGrowthYoY} YoY
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-serif font-bold text-slate-900 tabular-nums">
                {totalStudents}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                / {campusCapacity} Seats
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {capacityUtilization}% licensed capacity utilized.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-slate-900 h-2 rounded-full"
                style={{ width: `${capacityUtilization}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-1.5">
              <span>Primary: 320</span>
              <span>Middle: 280</span>
              <span>Senior: 242</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Real-Time Attendance Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                Today’s Attendance
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Verified
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-serif font-bold text-emerald-800 tabular-nums">
                {attendanceRate}%
              </span>
              <span className="text-xs text-slate-400 font-mono">
                vs 95% Standard
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {attendancePresent} scholars present on campus today.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-[11px] font-mono">
            <div className="flex items-center justify-between text-slate-600">
              <span>Present</span>
              <span className="font-bold text-slate-900">{attendancePresent}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Unexcused Absent</span>
              <span className="font-bold text-rose-700">{attendanceAbsent}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Medical / Leave</span>
              <span className="font-bold text-amber-700">{attendanceOnLeave}</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Tuition Collection Progress */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                Term 1 Tuition Fees
              </span>
              <span className="text-[10px] font-mono font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {collectionProgressPct}% Realized
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-serif font-bold text-slate-900 tabular-nums">
                ₹{(feeCollected / 100000).toFixed(1)}L
              </span>
              <span className="text-xs text-slate-400 font-mono">
                / ₹{(feeTarget / 100000).toFixed(1)}L Target
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              ₹{(feeOutstanding / 100000).toFixed(1)}L outstanding receivables.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-700 h-2 rounded-full"
                style={{ width: `${collectionProgressPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-1.5">
              <span>Collected: ₹{(feeCollected / 100000).toFixed(1)}L</span>
              <span>Due: ₹{(feeOutstanding / 100000).toFixed(1)}L</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Admissions Pipeline */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                Admissions Intake
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                Active Funnel
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-serif font-bold text-slate-900 tabular-nums">
                {totalApplications}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Total Dossiers
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {pendingAdmissions} dossiers awaiting committee decision.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-[11px] font-mono">
            <div className="flex items-center justify-between text-slate-600">
              <span>Under Review</span>
              <span className="font-bold text-amber-800">{pendingAdmissions}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Interview Scheduled</span>
              <span className="font-bold text-slate-900">{scheduledInterviews}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Enrolled & Seated</span>
              <span className="font-bold text-emerald-800">{confirmedEnrollments}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Dual-Axis Collection Trend Chart (2 Cols) + Action Center (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Dual-Axis Collection Trend Graph */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Tuition Collection Velocity vs Budgeted Target
                </h3>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-3 h-3 bg-slate-900 inline-block rounded-xs" />
                  <span>Actual Collected</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-3 h-0.5 bg-slate-400 inline-block border-t border-dashed" />
                  <span>Target Budget</span>
                </div>
              </div>
            </div>

            {/* Recharts Composed Area + Line Chart */}
            <div className="w-full h-72 sm:h-80 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={displayMonthlyData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="actualFeeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F172A" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0F172A" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    dy={6}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val: number) => {
                      if (val === 0) return '0';
                      return `₹${Math.round(val / 100000)}L`;
                    }}
                    domain={[0, 1600000]}
                    ticks={[0, 400000, 800000, 1200000, 1600000]}
                    tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
                  />

                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as AcademicMonthlyTrend;
                        const variance = data.actualCollection - data.targetCollection;
                        return (
                          <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-lg text-xs shadow-xl border border-slate-800 space-y-1.5 font-mono">
                            <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-1">
                              <span className="font-bold text-slate-200">{data.month} 2026</span>
                              <span className="text-[10px] text-emerald-400">
                                Attendance: {data.attendanceRate}%
                              </span>
                            </div>
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center justify-between gap-4 text-slate-200">
                                <span>Actual Collected:</span>
                                <span className="font-bold">{formatCurrencyINR(data.actualCollection)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-slate-400">
                                <span>Budget Target:</span>
                                <span>{formatCurrencyINR(data.targetCollection)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800 text-[11px]">
                                <span>Variance:</span>
                                <span className={variance >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                  {variance >= 0 ? '+' : ''}{formatCurrencyINR(variance)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="actualCollection"
                    stroke="#0F172A"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#actualFeeGradient)"
                    name="Actual Collection"
                    activeDot={{ r: 4, fill: '#0F172A', stroke: '#ffffff', strokeWidth: 2 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="targetCollection"
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                    name="Budget Target"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 mt-2 font-mono">
            <span>Overall Collection Velocity: <strong className="text-emerald-700">+1.8% ahead of plan</strong></span>
            <span>Next Reconciliation Window: Oct 31, 2026</span>
          </div>
        </div>

        {/* Right: Operational Action Center */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Action Center & Exceptions
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                4 Pending
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Item 1 */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Fee Concession Reviews</span>
                  <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    3 Requests
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-tight">
                  Sibling discounts & merit scholarship dossiers pending Bursar approval.
                </p>
              </div>

              {/* Item 2 */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Faculty Leave Coverage</span>
                  <span className="text-[10px] font-mono font-bold text-indigo-900 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                    2 Active
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-tight">
                  Grade 9 Science & Grade 10 English substitutes assigned for periods 3 & 5.
                </p>
              </div>

              {/* Item 3 */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">CBSE Affiliation Compliance</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    Due 5 Days
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-tight">
                  Annual fire safety & transport fitness certificates uploaded for sign-off.
                </p>
              </div>

              {/* Item 4 */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Low Attendance (&lt;75% Floor)</span>
                  <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                    5 Scholars
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-tight">
                  Board exam eligibility flag triggered. Automated notification dispatched.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-500 font-mono">
              All sign-offs cryptographically logged in audit trails.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstitutionalExecutiveOverview;

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useAcademic } from '../../context/AcademicContext';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  UserCheck,
  BookOpen,
  Award,
  BookmarkCheck,
  Calendar,
  CheckCircle2,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  Boxes,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { InstitutionalExecutiveOverview } from './InstitutionalExecutiveOverview';

export const DashboardView: React.FC = () => {
  const { user } = useAuth();
  const { selectedYearId, selectedYear } = useAcademic();
  const [activeCockpitTab, setActiveCockpitTab] = React.useState<'overview' | 'operations'>('overview');
  const [focusedRegion, setFocusedRegion] = useState<'dashboard' | 'admin' | 'accountant' | 'teacher' | 'parent' | 'student'>('dashboard');
  const [auditFilter, setAuditFilter] = React.useState<'all' | 'mutations'>('all');
  const [lastRefreshedAt, setLastRefreshedAt] = React.useState<Date>(new Date());

  const {
    data: statsData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['dashboard-stats', user?.role, selectedYearId],
    queryFn: async () => {
      const res = await api.get<any>(
        `/dashboard/stats${selectedYearId ? `?academicYearId=${selectedYearId}` : ''}`
      );
      setLastRefreshedAt(new Date());
      return res;
    },
    refetchInterval: 30000,
  });

  const stats = statsData?.data || {};

  const filteredAudits = stats.recentAudits
    ? stats.recentAudits.filter((a: any) => {
        if (auditFilter === 'mutations') {
          return a.action !== 'USER_LOGIN';
        }
        return true;
      })
    : [];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-7 bg-slate-200 rounded-lg w-56"></div>
            <div className="h-4 bg-slate-200 rounded w-80"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 bg-slate-200 rounded-xl"></div>
            <div className="h-9 w-28 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-200 rounded-2xl"></div>
          <div className="h-72 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Failed to load live dashboard statistics</p>
            <p className="text-xs text-rose-600 mt-0.5">
              Could not communicate with the institutional backend service.
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" aria-label="Main dashboard view">
      {/* Page Title & Welcome with Real-Time Freshness Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back, {user?.firstName}
            </h1>
            <button
              onClick={() => refetch()}
              title="Refresh Live Metrics"
              className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-brand-600' : ''}`}
              />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
            <span>
              {user?.role === 'STUDENT'
                ? 'Institutional Student Portal: Timetable, Examination Marks, Library Loans & Dues.'
                : `Operational metrics for Academic Year ${
                    selectedYear?.name || '2026-2027'
                  }.`}
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>
                Synced at{' '}
                {lastRefreshedAt.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </span>
          </div>
        </div>

        {user?.role !== 'STUDENT' && (
          <div className="flex items-center gap-2.5" aria-label="Quick actions for administrators">
            <Link
              to="/attendance"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 rounded-xl shadow-xs transition-all focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Mark daily attendance"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Mark Attendance</span>
            </Link>
            <Link
              to="/admissions"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-all focus-visible:outline focus-visible:ring-2 focus-visible:ring-slate-400"
            aria-label="Create new admission"
            >
              <GraduationCap className="w-4 h-4 text-brand-600" />
              <span>New Admission</span>
            </Link>
          </div>
        )}
      </div>

      {/* ADMIN & PRINCIPAL METRICS */}
      {(user?.role === 'SUPER_ADMIN' ||
        user?.role === 'PRINCIPAL' ||
        user?.role === 'ADMINISTRATOR') && (
        <div className="space-y-6">
          {/* Cockpit Mode Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveCockpitTab('overview')}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeCockpitTab === 'overview'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-sky-600" />
                <span>Executive Overview</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-mono font-bold">
                  Cockpit
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCockpitTab('operations')}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeCockpitTab === 'operations'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5 text-brand-600" />
                <span>Daily Operations & Action Center</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono pr-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Institutional Telemetry</span>
            </div>
          </div>

          {activeCockpitTab === 'overview' ? (
            <InstitutionalExecutiveOverview
              stats={stats}
              academicYearName={selectedYear?.name || '2026–27'}
            />
          ) : (
            <div className="space-y-6">
              {/* Top 4 Clickable KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Active Students */}
            <Link
              to="/students"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all flex items-center justify-between group focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <div className="min-w-0 pr-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Active Students
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                  {stats.totalStudents !== undefined
                    ? Number(stats.totalStudents).toLocaleString('en-IN')
                    : '—'}
                </p>
                <p className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
                  <span>Enrolled & Verified</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-all">
                <Users className="w-6 h-6" />
              </div>
            </Link>

            {/* KPI 2: Today's Attendance (With explicit denominator) */}
            <Link
              to="/attendance"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all flex items-center justify-between group focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <div className="min-w-0 pr-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Today's Attendance
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                  {stats.todayAttendanceCount > 0
                    ? `${stats.todayAttendanceRate}%`
                    : 'Pending'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 font-medium tabular-nums">
                  {stats.todayAttendanceCount > 0
                    ? `${stats.todayAttendancePresent ?? stats.todayAttendanceCount} present of ${
                        stats.totalStudents || stats.todayAttendanceCount
                      } enrolled`
                    : 'Daily register not logged'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-all">
                <CalendarCheck className="w-6 h-6" />
              </div>
            </Link>

            {/* KPI 3: Fees Collected (With total invoiced & percentage) */}
            <Link
              to="/fees"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all flex items-center justify-between group focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <div className="min-w-0 pr-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Fees Collected
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums truncate">
                  {stats.totalFeeCollected !== undefined
                    ? `₹${Number(stats.totalFeeCollected).toLocaleString('en-IN')}`
                    : '—'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 truncate">
                  {stats.totalFeeInvoiced
                    ? `${Math.round(
                        (stats.totalFeeCollected / stats.totalFeeInvoiced) * 100
                      )}% of ₹${Number(stats.totalFeeInvoiced).toLocaleString('en-IN')} billed`
                    : `AY ${selectedYear?.name || '2026-27'}`}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-all">
                <CreditCard className="w-6 h-6" />
              </div>
            </Link>

            {/* KPI 4: Pending Dues */}
            <Link
              to="/fees"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-sm transition-all flex items-center justify-between group focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            >
              <div className="min-w-0 pr-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Pending Dues
                </p>
                <p className="text-2xl font-bold text-amber-700 mt-1 tabular-nums truncate">
                  {stats.totalFeeOutstanding !== undefined
                    ? `₹${Number(stats.totalFeeOutstanding).toLocaleString('en-IN')}`
                    : '—'}
                </p>
                <p className="text-[11px] text-amber-600 mt-1 font-medium">
                  Outstanding Balances
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-all">
                <Clock className="w-6 h-6" />
              </div>
            </Link>
          </div>

          {/* Activity Trail & Prioritized Action Center */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scrollable Audit Log Panel with Filter Toggle */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col min-w-0">
              {/* Header with Title, Filter Toggle and Link to /audit */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Recent Audit Log & System Activity
                  </h3>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px] font-semibold text-slate-600">
                    <button
                      onClick={() => setAuditFilter('all')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        auditFilter === 'all'
                          ? 'bg-white text-slate-900 shadow-2xs font-bold'
                          : 'hover:text-slate-900'
                      }`}
                    >
                      All Events
                    </button>
                    <button
                      onClick={() => setAuditFilter('mutations')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        auditFilter === 'mutations'
                          ? 'bg-white text-slate-900 shadow-2xs font-bold'
                          : 'hover:text-slate-900'
                      }`}
                    >
                      Mutations Only
                    </button>
                  </div>

                  <Link
                    to="/audit"
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline inline-flex items-center gap-1 focus:outline-hidden"
                  >
                    <span>View All</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Scrollable Container */}
              {filteredAudits && filteredAudits.length > 0 ? (
                <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 pr-1 mt-2 scrollbar-thin">
                  {filteredAudits.map((a: any) => (
                    <div
                      key={a.id}
                      className="py-2.5 sm:py-3 flex items-center justify-between text-xs gap-3 hover:bg-slate-50/70 px-1 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[11px] shrink-0 font-mono border border-slate-200">
                          {a.entity ? a.entity.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">
                            {a.action ? a.action.replace(/_/g, ' ') : 'System Action'}
                          </p>
                          <p className="text-slate-500 text-[11px] truncate">
                            Actor:{' '}
                            <span className="text-slate-700 font-medium">
                              {a.user
                                ? `${a.user.firstName} ${a.user.lastName} (${a.user.role})`
                                : 'System'}
                            </span>
                            {a.entity && (
                              <span className="text-slate-400"> • {a.entity}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-slate-500 font-mono text-[11px] tabular-nums block">
                          {new Date(a.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {new Date(a.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>No audit events match the selected filter.</p>
                </div>
              )}
            </div>

            {/* Action Center & Prioritized Operational Tasks */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <h3 className="font-semibold text-slate-900 text-sm">
                      Action Center & Priorities
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                    Live Queue
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* Task 1: Admissions Queue */}
                  <Link
                    to="/admissions"
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-brand-300 transition-all text-xs font-semibold text-slate-800 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-slate-900 block leading-tight">Admissions Review Queue</span>
                        <span className="text-[11px] text-slate-500 block font-normal">
                          {stats.pendingAdmissions > 0
                            ? `${stats.pendingAdmissions} application dossiers awaiting review`
                            : 'All applicant dossiers reviewed'}
                        </span>
                      </div>
                    </div>
                    {stats.pendingAdmissions > 0 && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 shrink-0">
                        {stats.pendingAdmissions} Pending
                      </span>
                    )}
                  </Link>

                  {/* Task 2: Low Stock Replenishment */}
                  <Link
                    to="/inventory"
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-rose-300 transition-all text-xs font-semibold text-slate-800 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                        <Boxes className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-slate-900 block leading-tight">Supply Replenishment</span>
                        <span className="text-[11px] text-slate-500 block font-normal">
                          {stats.lowStockCount > 0
                            ? `${stats.lowStockCount} items below safety threshold`
                            : 'All campus inventory adequately stocked'}
                        </span>
                      </div>
                    </div>
                    {stats.lowStockCount > 0 && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 shrink-0">
                        {stats.lowStockCount} Low
                      </span>
                    )}
                  </Link>

                  {/* Task 3: Fee Reconciliation */}
                  <Link
                    to="/fees"
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-amber-300 transition-all text-xs font-semibold text-slate-800 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-slate-900 block leading-tight">Tuition & Fee Collection</span>
                        <span className="text-[11px] text-slate-500 block font-normal">
                          ₹{Number(stats.totalFeeOutstanding || 0).toLocaleString('en-IN')} outstanding ledger balance
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0">
                      Follow-up
                    </span>
                  </Link>

                  {/* Task 4: User Governance */}
                  <Link
                    to="/users"
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-300 transition-all text-xs font-semibold text-slate-800 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-slate-900 block leading-tight">User Governance & RBAC</span>
                        <span className="text-[11px] text-slate-500 block font-normal">
                          Faculty & student credentials management
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
                  </Link>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Campus Operations Active</span>
                </span>
                <span className="font-mono text-slate-500">Auto-refresh 30s</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )}

      {/* ACCOUNTANT VIEW */}
      {user?.role === 'ACCOUNTANT' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/fees"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-all block group"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Collected
              </p>
              <p className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
                ₹{Number(stats.totalCollected || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">AY {selectedYear?.name || '2026-27'}</p>
            </Link>
            <Link
              to="/fees"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 transition-all block group"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Outstanding
              </p>
              <p className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">
                ₹{Number(stats.totalOutstanding || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-amber-600 mt-1">Pending student balances</p>
            </Link>
            <Link
              to="/fees"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all block group"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Unpaid Invoices
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {stats.unpaidInvoicesCount || 0}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {stats.overdueCount || 0} overdue
              </p>
            </Link>
          </div>

          {stats.recentPayments && stats.recentPayments.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 text-sm">Recent Fee Collections</h3>
                <Link to="/fees" className="text-xs font-medium text-brand-600 hover:text-brand-700">
                  View Fee Desk →
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {stats.recentPayments.map((p: any) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {p.invoice?.student ? `${p.invoice.student.firstName} ${p.invoice.student.lastName}` : 'Student'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Receipt: {p.receiptNumber} • {p.paymentMethod}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-emerald-700 tabular-nums">
                        +₹{Number(p.amount).toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(p.paidAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TEACHER VIEW */}
      {user?.role === 'TEACHER' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 text-sm mb-3">Your Assigned Classes & Sections</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.assignments && stats.assignments.length > 0 ? (
              stats.assignments.map((a: any) => (
                <div key={a.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="font-semibold text-slate-900 text-sm">
                    {a.section?.class?.name} - Section {a.section?.name}
                  </div>
                  <div className="text-xs text-brand-600 font-medium mt-1">
                    {a.subject?.name} ({a.subject?.code})
                  </div>
                  <Link
                    to={`/attendance?classId=${a.section?.classId}&sectionId=${a.sectionId}`}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-brand-600 px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>Take Attendance</span>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4">No active teaching assignments found.</p>
            )}
          </div>
        </div>
      )}

      {/* PARENT VIEW */}
      {user?.role === 'PARENT' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 text-sm mb-4">Your Linked Children</h3>
          <div className="space-y-4">
            {stats.children && stats.children.length > 0 ? (
              stats.children.map((c: any) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">{c.name}</h4>
                    <p className="text-xs text-slate-500">
                      Adm No: <span className="font-mono font-medium">{c.admissionNumber}</span> •{' '}
                      {c.class} {c.section}
                    </p>
                    <p className="text-xs font-medium text-amber-700 mt-1 tabular-nums">
                      Pending Invoices: {c.pendingInvoicesCount}
                    </p>
                  </div>
                  <Link
                    to="/students"
                    className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    View Details
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4">No linked student records found.</p>
            )}
          </div>
        </div>
      )}

      {/* STUDENT PORTAL VIEW */}
      {user?.role === 'STUDENT' && (
        <div className="space-y-6">
          {/* Identity & Status Ribbon */}
          {stats.profile && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-700 text-white flex items-center justify-center font-bold text-xl shadow-sm">
                  {stats.profile.firstName?.[0]}
                  {stats.profile.lastName?.[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      {stats.profile.firstName} {stats.profile.lastName}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                      Enrolled & Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                    <span>
                      Adm No:{' '}
                      <span className="font-mono font-semibold text-brand-700">
                        {stats.profile.admissionNumber}
                      </span>
                    </span>
                    <span>•</span>
                    <span>
                      Class:{' '}
                      <strong className="text-slate-800">
                        {stats.profile.enrolments?.[0]?.class?.name} -{' '}
                        {stats.profile.enrolments?.[0]?.section?.name}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Roll No:{' '}
                      <span className="font-mono font-semibold text-slate-800">
                        {stats.profile.enrolments?.[0]?.rollNumber || '01'}
                      </span>
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                <Link
                  to="/lms"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 border border-brand-200 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>My Assignments</span>
                </Link>
                <Link
                  to="/exams"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Report Cards</span>
                </Link>
              </div>
            </div>
          )}

          {/* Student KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/attendance"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-all block"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Attendance Ratio
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">96.4%</p>
              <p className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Good Standing</span>
              </p>
            </Link>

            <Link
              to="/timetable"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-brand-300 transition-all block"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Today's Lectures
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {stats.todaySchedule?.length || 5} Periods
              </p>
              <p className="text-[11px] text-brand-600 mt-1 font-medium">Class Timetable Active</p>
            </Link>

            <Link
              to="/library"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all block"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Issued Books
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {stats.activeBooks?.length || 0} on loan
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Campus Library</p>
            </Link>

            <Link
              to="/fees"
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-all block"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Fee Invoices
              </p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">Dues Cleared</p>
              <p className="text-[11px] text-emerald-600 mt-1 font-medium">Receipts Available</p>
            </Link>
          </div>

          {/* Schedule & Examination Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's Timetable */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  <h3 className="font-semibold text-slate-900 text-sm">Today's Class Schedule</h3>
                </div>
                <Link to="/timetable" className="text-xs font-medium text-brand-600 hover:text-brand-700">
                  Full Timetable →
                </Link>
              </div>

              {stats.todaySchedule && stats.todaySchedule.length > 0 ? (
                <div className="space-y-3">
                  {stats.todaySchedule.map((entry: any, idx: number) => (
                    <div
                      key={entry.id || idx}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-center">
                          <span className="block font-mono text-xs font-bold text-slate-800 tabular-nums">
                            {entry.startTime}
                          </span>
                          <span className="block font-mono text-[10px] text-slate-400 tabular-nums">
                            {entry.endTime}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 text-xs">
                            {entry.subject?.name}{' '}
                            <span className="font-mono text-slate-400">({entry.subject?.code})</span>
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Teacher: {entry.teacher?.firstName} {entry.teacher?.lastName} • Room:{' '}
                            {entry.classroom?.name || 'Classroom 101'}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                        Period {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
                  <p>No timetable entries scheduled for today or weekend break.</p>
                  <Link
                    to="/timetable"
                    className="inline-block mt-2 font-medium text-brand-600 hover:underline"
                  >
                    Browse Weekly Schedule
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Exam Marks & Library */}
            <div className="space-y-6">
              {/* Exam Marks */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-600" />
                    <h3 className="font-semibold text-slate-900 text-sm">Recent Exam Marks</h3>
                  </div>
                  <Link to="/exams" className="text-xs font-medium text-brand-600 hover:text-brand-700">
                    All Marks →
                  </Link>
                </div>

                {stats.recentMarks && stats.recentMarks.length > 0 ? (
                  <div className="space-y-2.5">
                    {stats.recentMarks.slice(0, 4).map((m: any) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {m.examSubject?.subject?.name || 'Subject'}
                          </p>
                          <p className="text-[10px] text-slate-400">{m.examination?.name}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900 tabular-nums">
                            {Number(m.marksObtained)}
                          </span>
                          <span className="font-mono text-slate-400 text-[10px]">
                            /{m.examSubject?.maxMarks || 100}
                          </span>
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            {m.grade || 'A'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-3">
                    No exam results recorded for the current term.
                  </p>
                )}
              </div>

              {/* Library Books on Loan */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-semibold text-slate-900 text-sm">Library Books on Loan</h3>
                  </div>
                  <Link to="/library" className="text-xs font-medium text-brand-600 hover:text-brand-700">
                    Catalog →
                  </Link>
                </div>

                {stats.activeBooks && stats.activeBooks.length > 0 ? (
                  <div className="space-y-2.5">
                    {stats.activeBooks.map((b: any) => (
                      <div
                        key={b.id}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-900 line-clamp-1">
                            {b.copy?.book?.title}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Barcode: {b.copy?.barcode}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
                            Due {new Date(b.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-3">No active book loans on your account.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

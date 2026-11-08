import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  ShieldAlert,
  Download,
  Filter,
  RefreshCw,
  Search,
  Eye,
  Calendar,
  Activity,
  UserCheck,
  Lock,
  Layers,
  X,
} from 'lucide-react';

interface AuditLogItem {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, any> | null;
  ipAddress: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
}

export const AuditView: React.FC = () => {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMetaLog, setSelectedMetaLog] = useState<AuditLogItem | null>(null);

  // Summary Metrics Query
  const { data: summaryData } = useQuery({
    queryKey: ['audit-summary'],
    queryFn: async () => {
      const res = await api.get<{
        success: boolean;
        data: {
          totalEvents: number;
          todayEvents: number;
          topActions: Array<{ action: string; count: number }>;
        };
      }>('/audit/summary');
      return res.data;
    },
    refetchInterval: 30000,
  });

  // Audit Logs Query
  const { data: logsData, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', page, actionFilter, entityFilter, startDate, endDate],
    queryFn: async () => {
      const res = await api.get<{
        success: boolean;
        data: {
          logs: AuditLogItem[];
          pagination: { total: number; page: number; limit: number; totalPages: number };
        };
      }>('/audit/logs', {
        page,
        action: actionFilter || undefined,
        entity: entityFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      return res.data;
    },
  });

  const handleExportCsv = () => {
    const token = sessionStorage.getItem('school_erp_token') || localStorage.getItem('school_erp_token');
    const baseUrl = import.meta.env.VITE_API_URL || '/api/v1';
    const downloadUrl = `${baseUrl}/audit/export${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    
    // Direct authenticated fetch download
    fetch(`${baseUrl}/audit/export`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => console.error('Export failed:', err));
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('DELETE') || action.includes('SUSPEND') || action.includes('REVOKE')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (action.includes('CREATE') || action.includes('PUBLISH') || action.includes('APPROVE') || action.includes('ACTIVATE')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('LOGIN') || action.includes('LOGOUT') || action.includes('AUTH')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (action.includes('PAYMENT') || action.includes('FEE')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">System Security Audit Trail</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-rose-50 text-rose-700 border border-rose-200">
              Immutable Log
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tamper-evident operational and administrative audit logging for ISO/institutional compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export Audit CSV
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Total Recorded Events</div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
              {summaryData?.totalEvents ?? '—'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across all roles & modules</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Events Today</div>
            <div className="text-2xl font-bold text-emerald-700 tabular-nums mt-1">
              {summaryData?.todayEvents ?? '—'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Since 00:00:00 UTC</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Most Frequent Action</div>
            <div className="text-sm font-semibold text-slate-800 mt-1 font-mono truncate max-w-[180px]">
              {summaryData?.topActions?.[0]?.action || 'USER_LOGIN'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {summaryData?.topActions?.[0]?.count ? `${summaryData.topActions[0].count} events logged` : 'Server-side session validation'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
            <Lock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Date Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            type="text"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Filter action (e.g. USER_LOGIN)..."
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />

          <input
            type="text"
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Filter entity (e.g. User, Mark)..."
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        {(actionFilter || entityFilter || startDate || endDate) && (
          <button
            onClick={() => {
              setActionFilter('');
              setEntityFilter('');
              setStartDate('');
              setEndDate('');
              setPage(1);
            }}
            className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Target Entity</th>
                <th className="py-2.5 px-3">Actor / Origin</th>
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-sans text-xs">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-brand-600" />
                      <span>Loading immutable audit records...</span>
                    </div>
                  </td>
                </tr>
              ) : !logsData?.logs?.length ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-sans text-xs">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                logsData.logs.map((log) => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2 px-3 text-slate-600 tabular-nums">
                        {new Date(log.createdAt).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false,
                        })}
                      </td>

                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="py-2 px-3 text-slate-700">
                        <span className="font-semibold text-slate-900">{log.entity}</span>
                        {log.entityId && (
                          <span className="text-slate-400 text-[10px] ml-1.5">#{log.entityId.slice(0, 8)}...</span>
                        )}
                      </td>

                      <td className="py-2 px-3 font-sans">
                        {log.user ? (
                          <div>
                            <span className="font-medium text-slate-900">
                              {log.user.firstName} {log.user.lastName}
                            </span>
                            <span className="text-[10px] text-slate-500 ml-1.5">({log.user.role})</span>
                            <div className="text-[10px] text-slate-400 font-mono">{log.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic font-mono text-[10px]">System Worker / Cron</span>
                        )}
                      </td>

                      <td className="py-2 px-3 text-slate-500 text-[10px] tabular-nums">
                        {log.ipAddress || '—'}
                      </td>

                      <td className="py-2 px-3 text-right font-sans">
                        <button
                          onClick={() => setSelectedMetaLog(log)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px]"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Payload</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {logsData?.pagination && logsData.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/60 border-t border-slate-200 text-xs text-slate-600">
            <div>
              Showing <span className="font-semibold tabular-nums">{logsData.logs.length}</span> of{' '}
              <span className="font-semibold tabular-nums">{logsData.pagination.total}</span> events
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2 font-medium tabular-nums">
                {page} / {logsData.pagination.totalPages}
              </span>
              <button
                disabled={page >= logsData.pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* METADATA JSON VIEWER MODAL */}
      {selectedMetaLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden text-xs">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-600" />
                <span className="font-bold text-slate-900">Audit Event Metadata Details</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMetaLog(null)}
                aria-label="Close modal"
                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 text-[11px] pb-2 border-b border-slate-100">
                <div className="min-w-0">
                  <span className="text-slate-400">Action:</span>{' '}
                  <span className="font-semibold text-slate-800 break-words">{selectedMetaLog.action}</span>
                </div>
                <div className="min-w-0">
                  <span className="text-slate-400">Entity:</span>{' '}
                  <span className="font-semibold text-slate-800 break-words">
                    {selectedMetaLog.entity} {selectedMetaLog.entityId ? `(#${selectedMetaLog.entityId.slice(0, 8)}...)` : '(N/A)'}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-slate-400">Actor:</span>{' '}
                  <span className="font-semibold text-slate-800 truncate block" title={selectedMetaLog.user?.email || 'System'}>
                    {selectedMetaLog.user?.email || 'System'}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-slate-400">IP:</span>{' '}
                  <span className="font-mono text-slate-800">{selectedMetaLog.ipAddress || 'Internal'}</span>
                </div>
                {selectedMetaLog.entityId && (
                  <div className="col-span-2 min-w-0 pt-1">
                    <span className="text-slate-400">Target Entity ID:</span>{' '}
                    <span className="font-mono text-slate-700 text-[10px] break-all select-all">{selectedMetaLog.entityId}</span>
                  </div>
                )}
              </div>

              <div>
                <div className="text-[10px] font-semibold uppercase text-slate-400 mb-1">Payload JSON</div>
                {!selectedMetaLog.metadata || Object.keys(selectedMetaLog.metadata).length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 italic text-center text-[11px]">
                    No payload metadata attached to this audit event.
                  </div>
                ) : (
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-auto max-h-60 border border-slate-800">
                    {JSON.stringify(selectedMetaLog.metadata, null, 2)}
                  </pre>
                )}
              </div>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedMetaLog(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

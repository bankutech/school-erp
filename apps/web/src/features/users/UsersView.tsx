import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { UserRoleType } from '@school-erp/shared';
import {
  Users,
  UserPlus,
  ShieldAlert,
  Search,
  Filter,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  MoreVertical,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react';

interface UserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRoleType;
  isActive: boolean;
  createdAt: string;
  staffId?: string | null;
  studentId?: string | null;
  guardianId?: string | null;
  staff?: {
    id: string;
    employeeNumber: string;
    designation: string;
    department: string;
  } | null;
  student?: {
    id: string;
    admissionNumber: string;
    enrolments?: Array<{
      class: { name: string };
      section: { name: string };
    }>;
  } | null;
  guardian?: {
    id: string;
    relation: string;
  } | null;
}

const ROLE_BADGES: Record<UserRoleType, { bg: string; text: string; label: string }> = {
  [UserRoleType.SUPER_ADMIN]: { bg: 'bg-rose-50 border-rose-200 text-rose-800', text: 'text-rose-700', label: 'Super Admin' },
  [UserRoleType.PRINCIPAL]: { bg: 'bg-purple-50 border-purple-200 text-purple-800', text: 'text-purple-700', label: 'Principal' },
  [UserRoleType.ADMINISTRATOR]: { bg: 'bg-blue-50 border-blue-200 text-blue-800', text: 'text-blue-700', label: 'Admin' },
  [UserRoleType.TEACHER]: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', text: 'text-emerald-700', label: 'Teacher' },
  [UserRoleType.ACCOUNTANT]: { bg: 'bg-amber-50 border-amber-200 text-amber-800', text: 'text-amber-700', label: 'Accountant' },
  [UserRoleType.HR_MANAGER]: { bg: 'bg-indigo-50 border-indigo-200 text-indigo-800', text: 'text-indigo-700', label: 'HR Manager' },
  [UserRoleType.LIBRARIAN]: { bg: 'bg-teal-50 border-teal-200 text-teal-800', text: 'text-teal-700', label: 'Librarian' },
  [UserRoleType.TRANSPORT_MANAGER]: { bg: 'bg-orange-50 border-orange-200 text-orange-800', text: 'text-orange-700', label: 'Transport Mgr' },
  [UserRoleType.PARENT]: { bg: 'bg-cyan-50 border-cyan-200 text-cyan-800', text: 'text-cyan-700', label: 'Parent' },
  [UserRoleType.STUDENT]: { bg: 'bg-violet-50 border-violet-200 text-violet-800', text: 'text-violet-700', label: 'Student' },
};

export const UsersView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roleModalUser, setRoleModalUser] = useState<UserItem | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<UserRoleType>(UserRoleType.TEACHER);
  const [passwordModalUser, setPasswordModalUser] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [statusModalUser, setStatusModalUser] = useState<UserItem | null>(null);
  const [deleteModalUser, setDeleteModalUser] = useState<UserItem | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State for Create
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: UserRoleType.TEACHER,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['users', page, search, roleFilter, statusFilter],
    queryFn: async () => {
      const res = await api.get<{
        success: boolean;
        data: {
          users: UserItem[];
          pagination: { total: number; page: number; limit: number; totalPages: number };
          roleCounts: Record<string, number>;
        };
      }>('/users', {
        page,
        search: search || undefined,
        role: roleFilter || undefined,
        isActive: statusFilter !== '' ? statusFilter : undefined,
      });
      return res.data;
    },
  });

  const isSuperAdmin = currentUser?.role === UserRoleType.SUPER_ADMIN;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (body: typeof newUserData) => api.post('/users', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreateModal(false);
      setNewUserData({ firstName: '', lastName: '', email: '', password: '', phone: '', role: UserRoleType.TEACHER });
      setActionFeedback({ type: 'success', message: 'User account created successfully.' });
    },
    onError: (err: any) => {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to create user.' });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/users/${id}/status`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setStatusModalUser(null);
      setActionFeedback({ type: 'success', message: 'User status successfully modified.' });
    },
    onError: (err: any) => {
      setActionFeedback({ type: 'error', message: err.message || 'Status change failed.' });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRoleType }) => api.patch(`/users/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setRoleModalUser(null);
      setActionFeedback({ type: 'success', message: 'User role updated successfully.' });
    },
    onError: (err: any) => {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to update role.' });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      api.post(`/users/${id}/reset-password`, { newPassword }),
    onSuccess: () => {
      setPasswordModalUser(null);
      setNewPassword('');
      setActionFeedback({ type: 'success', message: 'Password reset completed. User sessions terminated.' });
    },
    onError: (err: any) => {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to reset password.' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteModalUser(null);
      setActionFeedback({ type: 'success', message: 'User account deleted permanently.' });
    },
    onError: (err: any) => {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to delete user.' });
    },
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">User Accounts & Role Governance</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-300">
              RBAC Directory
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional directory of accounts, authentication credentials, and system permission tiers.
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
          {isSuperAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-brand-700 hover:bg-brand-800 rounded-lg shadow-sm transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create Account
            </button>
          )}
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionFeedback && (
        <div
          className={`flex items-center justify-between p-3 rounded-lg border text-xs font-medium ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-slate-600 font-bold">
            ×
          </button>
        </div>
      )}

      {/* Role Counts Summary Strip */}
      {data?.roleCounts && (
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {Object.entries(ROLE_BADGES).map(([rKey, badge]) => {
            const count = data.roleCounts[rKey] || 0;
            return (
              <button
                key={rKey}
                onClick={() => {
                  setRoleFilter(roleFilter === rKey ? '' : rKey);
                  setPage(1);
                }}
                className={`p-2 rounded-lg border text-left transition-all ${
                  roleFilter === rKey
                    ? 'border-brand-600 bg-brand-50/50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-[10px] font-medium text-slate-500 truncate">{badge.label}</div>
                <div className="text-base font-semibold text-slate-900 tabular-nums">{count}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search accounts by name, email, phone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Roles</option>
            {Object.keys(ROLE_BADGES).map((r) => (
              <option key={r} value={r}>
                {r.replace('_', ' ')}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* High-Density Users Table */}
      <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">User & Contact</th>
                <th className="py-2.5 px-3">Role Tier</th>
                <th className="py-2.5 px-3">Profile Linkage</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Created</th>
                {isSuperAdmin && <th className="py-2.5 px-3 text-right">Administrative Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-brand-600" />
                      <span>Loading authenticated users...</span>
                    </div>
                  </td>
                </tr>
              ) : !data?.users?.length ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No matching user accounts found.
                  </td>
                </tr>
              ) : (
                data.users.map((item) => {
                  const roleBadge = ROLE_BADGES[item.role] || {
                    bg: 'bg-slate-100 border-slate-200 text-slate-800',
                    label: item.role,
                  };
                  const isCurrent = currentUser?.id === item.id;

                  let linkageText = 'Direct System User';
                  if (item.staff) {
                    linkageText = `Staff: ${item.staff.employeeNumber} (${item.staff.designation || 'Staff'})`;
                  } else if (item.student) {
                    const cls = item.student.enrolments?.[0]?.class?.name || '';
                    linkageText = `Student: ${item.student.admissionNumber} ${cls ? `(${cls})` : ''}`;
                  } else if (item.guardian) {
                    linkageText = `Guardian (${item.guardian.relation})`;
                  }

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-900">
                          {item.firstName} {item.lastName}
                          {isCurrent && (
                            <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 font-normal">
                              (You)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">{item.email}</div>
                        {item.phone && <div className="text-[10px] text-slate-400">{item.phone}</div>}
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${roleBadge.bg}`}
                        >
                          {roleBadge.label}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">{linkageText}</td>

                      <td className="py-2.5 px-3">
                        {item.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            Suspended
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-slate-500 tabular-nums">
                        {new Date(item.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {isSuperAdmin && (
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setRoleModalUser(item);
                                setSelectedNewRole(item.role);
                              }}
                              disabled={isCurrent}
                              title="Change Role"
                              className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setPasswordModalUser(item)}
                              title="Reset Password"
                              className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setStatusModalUser(item)}
                              disabled={isCurrent}
                              title={item.isActive ? 'Suspend User' : 'Activate User'}
                              className={`p-1 rounded disabled:opacity-30 disabled:cursor-not-allowed ${
                                item.isActive
                                  ? 'text-amber-600 hover:bg-amber-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {item.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => setDeleteModalUser(item)}
                              disabled={isCurrent}
                              title="Delete Account"
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/60 border-t border-slate-200 text-xs text-slate-600">
            <div>
              Showing <span className="font-semibold tabular-nums">{data.users.length}</span> of{' '}
              <span className="font-semibold tabular-nums">{data.pagination.total}</span> users
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
                {page} / {data.pagination.totalPages}
              </span>
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="font-bold text-slate-900 text-sm">Provision New User Account</div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                ×
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(newUserData);
              }}
              className="p-5 space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newUserData.firstName}
                    onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newUserData.lastName}
                    onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Institutional Email *</label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Temporary Initial Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newUserData.phone}
                    onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Assigned Role *</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as UserRoleType })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500 bg-white"
                  >
                    {Object.keys(ROLE_BADGES).map((r) => (
                      <option key={r} value={r}>
                        {r.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-1.5 text-xs rounded-lg bg-brand-700 hover:bg-brand-800 text-white font-medium disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Provisioning...' : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE ROLE MODAL */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <ShieldAlert className="w-4 h-4 text-brand-600" />
              <span>Modify RBAC Role Assignment</span>
            </div>
            <p className="text-slate-600">
              Update role for{' '}
              <span className="font-semibold text-slate-900">
                {roleModalUser.firstName} {roleModalUser.lastName}
              </span>{' '}
              ({roleModalUser.email}).
            </p>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Target Role</label>
              <select
                value={selectedNewRole}
                onChange={(e) => setSelectedNewRole(e.target.value as UserRoleType)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              >
                {Object.keys(ROLE_BADGES).map((r) => (
                  <option key={r} value={r}>
                    {r.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
              ⚠️ Updating the role immediately alters operational permissions and navigation privileges.
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => updateRoleMutation.mutate({ id: roleModalUser.id, role: selectedNewRole })}
                disabled={updateRoleMutation.isPending}
                className="px-4 py-1.5 rounded-lg bg-brand-700 hover:bg-brand-800 text-white font-medium"
              >
                {updateRoleMutation.isPending ? 'Updating...' : 'Save Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <KeyRound className="w-4 h-4 text-brand-600" />
              <span>Administrative Password Reset</span>
            </div>
            <p className="text-slate-600">
              Set a new temporary password for{' '}
              <span className="font-semibold text-slate-900">{passwordModalUser.email}</span>. Existing login tokens
              will be revoked immediately.
            </p>
            <div>
              <label className="block font-medium text-slate-700 mb-1">New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPasswordModalUser(null);
                  setNewPassword('');
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => resetPasswordMutation.mutate({ id: passwordModalUser.id, newPassword })}
                disabled={resetPasswordMutation.isPending || newPassword.length < 6}
                className="px-4 py-1.5 rounded-lg bg-brand-700 hover:bg-brand-800 text-white font-medium disabled:opacity-50"
              >
                {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOGGLE STATUS CONFIRMATION MODAL */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Confirm Status Modification</span>
            </div>
            <p className="text-slate-600">
              Are you sure you want to {statusModalUser.isActive ? 'suspend' : 'reactivate'} the account for{' '}
              <span className="font-semibold text-slate-900">
                {statusModalUser.firstName} {statusModalUser.lastName}
              </span>{' '}
              ({statusModalUser.email})?
            </p>
            {statusModalUser.isActive && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
                Suspending will instantly terminate all active sessions and block API authentication.
              </div>
            )}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalUser(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => toggleStatusMutation.mutate(statusModalUser.id)}
                disabled={toggleStatusMutation.isPending}
                className={`px-4 py-1.5 rounded-lg text-white font-medium ${
                  statusModalUser.isActive ? 'bg-rose-700 hover:bg-rose-800' : 'bg-emerald-700 hover:bg-emerald-800'
                }`}
              >
                {toggleStatusMutation.isPending
                  ? 'Processing...'
                  : statusModalUser.isActive
                  ? 'Suspend Account'
                  : 'Reactivate Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <Trash2 className="w-4 h-4" />
              <span>Delete User Account</span>
            </div>
            <p className="text-slate-600">
              Permanently delete login credentials for{' '}
              <span className="font-semibold text-slate-900">{deleteModalUser.email}</span>?
            </p>
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
              ⚠️ This action is irreversible. The user will immediately lose system access and active tokens will be
              purged.
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalUser(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteModalUser.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-medium"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

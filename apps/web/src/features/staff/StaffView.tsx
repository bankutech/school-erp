import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  X,
  UserPlus,
  Printer,
} from 'lucide-react';

export const StaffView: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'directory' | 'leaves' | 'payroll'>('directory');
  const [focusedTab, setFocusedTab] = useState('directory');
  const [focusableElements, setFocusableElements] = useState<string[]>([]);
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [selectedPayslipToPrint, setSelectedPayslipToPrint] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  useEffect(() => {
    const elements = document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    setFocusableElements(Array.from(elements).map(el => el.id || el.tagName));
  }, []);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isOnboardModalOpen) setIsOnboardModalOpen(false);
        else if (isLeaveModalOpen) setIsLeaveModalOpen(false);
        else if (isPayslipModalOpen) setIsPayslipModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [isOnboardModalOpen, isLeaveModalOpen, isPayslipModalOpen]);

  // Announce to screen reader
  const announceToScreenReader = (message: string) => {
    const liveRegion = document.getElementById('sr-live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
    } else {
      const region = document.createElement('div');
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'true');
      region.id = 'sr-live-region';
      region.className = 'sr-only';
      region.textContent = message;
      document.body.appendChild(region);
    }
  };

  // Announce page load
  useEffect(() => {
    announceToScreenReader('Staff view loaded. Use tab to navigate directory, leaves, and payroll.');
    return () => announceToScreenReader('Staff view unloaded.');
  }, []);

  // Queries
  const { data: staffData, isLoading } = useQuery({
    queryKey: ['staff', search, deptFilter],
    queryFn: () =>
      api.get<any>('/staff', {
        search: search || undefined,
        department: deptFilter || undefined,
      }),
  });

  const { data: leavesData } = useQuery({
    queryKey: ['leaves'],
    queryFn: () => api.get<any>('/staff/leaves/all'),
  });

  const { data: payslipsData } = useQuery({
    queryKey: ['payslips'],
    queryFn: () => api.get<any>('/staff/payroll/payslips'),
  });

  // Onboard Staff Form
  const [onboardForm, setOnboardForm] = useState({
    employeeNumber: `EMP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    designation: 'Teacher',
    department: 'Academics',
    joiningDate: new Date().toISOString().split('T')[0],
    basicSalary: 50000,
  });

  // Leave Form
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'CASUAL',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    reason: '',
  });

  // Payslip Form
  const [payslipForm, setPayslipForm] = useState({
    staffId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: 50000,
    allowances: 5000,
    deductions: 2000,
  });

  // Mutations
  const onboardMutation = useMutation({
    mutationFn: (data: any) => api.post('/staff', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setIsOnboardModalOpen(false);
    },
  });

  const reviewLeaveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
      api.patch(`/staff/leaves/${id}/review`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });

  const requestLeaveMutation = useMutation({
    mutationFn: (data: any) => api.post('/staff/leaves/request', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      setIsLeaveModalOpen(false);
    },
  });

  const generatePayslipMutation = useMutation({
    mutationFn: (data: any) => api.post('/staff/payroll/generate', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
      setIsPayslipModalOpen(false);
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/staff/payroll/payslips/${id}/paid`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff, HR & Payroll</h1>
          <p className="text-sm text-slate-500 mt-1">
            Employee directory, leave approvals, salary calculations & monthly disbursement
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'directory' && (
            <button
              onClick={() => setIsOnboardModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Onboard Staff</span>
            </button>
          )}

          {activeTab === 'leaves' && (
            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Apply Leave</span>
            </button>
          )}

          {activeTab === 'payroll' && (
            <button
              onClick={() => setIsPayslipModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Payslip</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('directory')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'directory'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          aria-label="Staff directory tab"
        >
          <Users className="w-4 h-4" />
          <span>Staff Directory</span>
        </button>
        <button
          onClick={() => setActiveTab('leaves')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'leaves'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          aria-label="Leave requests tab"
        >
          <Calendar className="w-4 h-4" />
          <span>Leave Requests</span>
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'payroll'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          aria-label="Payroll tab"
        >
          <DollarSign className="w-4 h-4" />
          <span>Payroll & Payslips</span>
        </button>
      </div>

      {/* TAB 1: DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search staff by name, email, employee code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm rounded-xl border border-slate-200"
              />
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm"
            >
              <option value="">All Departments</option>
              <option value="Academics">Academics</option>
              <option value="Administration">Administration</option>
              <option value="Library">Library</option>
              <option value="Transport">Transport</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Employee Name</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Base Salary</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">Loading directory...</td>
                  </tr>
                ) : staffData?.data?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">No staff found.</td>
                  </tr>
                ) : (
                  staffData?.data?.map((st: any) => (
                    <tr key={st.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono font-bold text-xs text-brand-700">{st.employeeNumber}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{st.firstName} {st.lastName}</td>
                      <td className="px-4 py-3 text-slate-600">{st.department}</td>
                      <td className="px-4 py-3 text-slate-600">{st.designation}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {st.email}
                        <br />
                        {st.phone || '-'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">₹{Number(st.basicSalary).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: LEAVE REQUESTS */}
      {activeTab === 'leaves' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50/80 border-b border-slate-100 font-bold text-sm text-slate-900">
            Pending & Past Leave Applications ({leavesData?.data?.length || 0})
          </div>

          <div className="divide-y divide-slate-100">
            {leavesData?.data?.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400 italic">No leave applications recorded.</div>
            ) : (
              leavesData?.data?.map((leave: any) => (
                <div key={leave.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900 text-sm">
                        {leave.staff.firstName} {leave.staff.lastName}
                      </span>
                      <span className="text-xs text-slate-400">({leave.staff.designation})</span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          leave.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : leave.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {leave.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">{leave.leaveType}</span>: {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-slate-500 italic">Reason: "{leave.reason}"</div>
                  </div>

                  {leave.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => reviewLeaveMutation.mutate({ id: leave.id, status: 'APPROVED' })}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => reviewLeaveMutation.mutate({ id: leave.id, status: 'REJECTED' })}
                        className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PAYROLL */}
      {activeTab === 'payroll' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50/80 border-b border-slate-100 font-bold text-sm text-slate-900">
            Generated Payslips ({payslipsData?.data?.length || 0})
          </div>

          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Basic</th>
                <th className="px-4 py-3">Allowances</th>
                <th className="px-4 py-3">Deductions</th>
                <th className="px-4 py-3">Net Disbursed</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payslipsData?.data?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">No payslips generated.</td>
                </tr>
              ) : (
                payslipsData?.data?.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {p.staff.firstName} {p.staff.lastName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">Month {p.month}/{p.year}</td>
                    <td className="px-4 py-3">₹{Number(p.basicSalary).toLocaleString()}</td>
                    <td className="px-4 py-3 text-emerald-600">+₹{Number(p.allowances).toLocaleString()}</td>
                    <td className="px-4 py-3 text-rose-600">-₹{Number(p.deductions).toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">₹{Number(p.netSalary).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          p.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedPayslipToPrint(p)}
                          className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          title="Print Payslip"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {p.status !== 'PAID' && (
                          <button
                            onClick={() => markPaidMutation.mutate(p.id)}
                            className="px-2.5 py-1 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700"
                          >
                            Mark Disbursed
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Onboard Staff Modal */}
      {isOnboardModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Onboard New Staff Member</h2>
              <button onClick={() => setIsOnboardModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onboardMutation.mutate(onboardForm);
              }}
              className="space-y-4 mt-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employee Number</label>
                  <input
                    type="text"
                    required
                    value={onboardForm.employeeNumber}
                    onChange={(e) => setOnboardForm({ ...onboardForm, employeeNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={onboardForm.department}
                    onChange={(e) => setOnboardForm({ ...onboardForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  >
                    <option value="Academics">Academics</option>
                    <option value="Administration">Administration</option>
                    <option value="Library">Library</option>
                    <option value="Transport">Transport</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={onboardForm.firstName}
                    onChange={(e) => setOnboardForm({ ...onboardForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={onboardForm.lastName}
                    onChange={(e) => setOnboardForm({ ...onboardForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={onboardForm.email}
                    onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={onboardForm.phone}
                    onChange={(e) => setOnboardForm({ ...onboardForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Science Teacher"
                    value={onboardForm.designation}
                    onChange={(e) => setOnboardForm({ ...onboardForm, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Base Monthly Salary (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={onboardForm.basicSalary}
                    onChange={(e) => setOnboardForm({ ...onboardForm, basicSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOnboardModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={onboardMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"
                >
                  Confirm Onboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Payslip Modal */}
      {isPayslipModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Generate Staff Payslip</h2>
              <button onClick={() => setIsPayslipModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                generatePayslipMutation.mutate(payslipForm);
              }}
              className="space-y-4 mt-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Member</label>
                <select
                  required
                  value={payslipForm.staffId}
                  onChange={(e) => {
                    const st = staffData?.data?.find((s: any) => s.id === e.target.value);
                    setPayslipForm({
                      ...payslipForm,
                      staffId: e.target.value,
                      basicSalary: st ? Number(st.basicSalary) : 50000,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="">Select staff...</option>
                  {staffData?.data?.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Month (1..12)</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    required
                    value={payslipForm.month}
                    onChange={(e) => setPayslipForm({ ...payslipForm, month: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Year</label>
                  <input
                    type="number"
                    required
                    value={payslipForm.year}
                    onChange={(e) => setPayslipForm({ ...payslipForm, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Basic (₹)</label>
                  <input
                    type="number"
                    required
                    value={payslipForm.basicSalary}
                    onChange={(e) => setPayslipForm({ ...payslipForm, basicSalary: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Allowances (₹)</label>
                  <input
                    type="number"
                    value={payslipForm.allowances}
                    onChange={(e) => setPayslipForm({ ...payslipForm, allowances: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Deductions (₹)</label>
                  <input
                    type="number"
                    value={payslipForm.deductions}
                    onChange={(e) => setPayslipForm({ ...payslipForm, deductions: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-rose-600"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-900 flex justify-between">
                <span>Calculated Net Salary:</span>
                <span>₹{(payslipForm.basicSalary + payslipForm.allowances - payslipForm.deductions).toLocaleString()}</span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPayslipModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generatePayslipMutation.isPending || !payslipForm.staffId}
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50"
                >
                  Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE SALARY SLIP MODAL */}
      {selectedPayslipToPrint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-brand-700" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Monthly Salary Slip</h3>
                  <p className="text-[10px] text-slate-500">SRM Academy - HR & Payroll</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                  title="Print Salary Slip"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedPayslipToPrint(null)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="py-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans">Employee</span>
                  <span className="font-bold text-slate-900 font-sans">
                    {selectedPayslipToPrint.staff?.firstName} {selectedPayslipToPrint.staff?.lastName}
                  </span>
                  <div className="text-[10px] text-slate-500">{selectedPayslipToPrint.staff?.employeeNumber}</div>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] font-sans">Pay Period</span>
                  <span className="font-semibold text-slate-800">
                    Month {selectedPayslipToPrint.month} / {selectedPayslipToPrint.year}
                  </span>
                  <div className="text-[10px] text-emerald-700 font-sans font-semibold">
                    Status: {selectedPayslipToPrint.status}
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                    <tr>
                      <th className="p-2">Earnings Component</th>
                      <th className="p-2 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr>
                      <td className="p-2 font-sans text-slate-700">Basic Salary</td>
                      <td className="p-2 text-right font-medium text-slate-900">
                        ₹{Number(selectedPayslipToPrint.basicSalary).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-sans text-slate-700">Allowances (DA, HRA, Travel)</td>
                      <td className="p-2 text-right font-medium text-emerald-700">
                        +₹{Number(selectedPayslipToPrint.allowances).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-sans text-slate-700">Statutory Deductions (PF, Tax)</td>
                      <td className="p-2 text-right font-medium text-rose-700">
                        -₹{Number(selectedPayslipToPrint.deductions).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                    <tr>
                      <td className="p-2 text-slate-900 font-sans">Net Disbursed Take-Home</td>
                      <td className="p-2 text-right text-brand-800 text-xs font-mono">
                        ₹{Number(selectedPayslipToPrint.netSalary).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="pt-6 flex justify-between items-end text-[10px] text-slate-400">
                <div>System-generated computerized salary voucher</div>
                <div className="border-t border-slate-300 pt-1 w-28 text-center text-slate-700 font-medium">
                  HR Officer Stamp
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedPayslipToPrint(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-sm"
              >
                Close Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

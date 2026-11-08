import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileSpreadsheet,
  Plus,
  Receipt,
  Download,
  Calendar,
  X,
  CreditCard,
  Building,
} from 'lucide-react';

export const AccountsView: React.FC = () => {
  const queryClient = useQueryClient();
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');

  // Queries
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['financial-summary'],
    queryFn: () => api.get<any>('/accounts/summary'),
  });

  const { data: expensesData, isLoading: isExpensesLoading } = useQuery({
    queryKey: ['expenses-list', categoryFilter],
    queryFn: () =>
      api.get<any>('/accounts/expenses', {
        category: categoryFilter || undefined,
      }),
  });

  // Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    category: 'Utilities',
    title: '',
    amount: 15000,
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMode: 'BANK_TRANSFER',
    remarks: '',
  });

  // Mutations
  const createExpenseMutation = useMutation({
    mutationFn: (data: any) => api.post('/accounts/expenses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-list'] });
      setIsExpenseModalOpen(false);
      setExpenseForm({
        category: 'Utilities',
        title: '',
        amount: 15000,
        expenseDate: new Date().toISOString().split('T')[0],
        paymentMode: 'BANK_TRANSFER',
        remarks: '',
      });
    },
  });

  const summary = summaryData?.data || {
    totalFeeIncome: 0,
    totalExpenses: 0,
    netSurplus: 0,
    totalOutstandingDues: 0,
    collectionRate: '0.0',
    expenseBreakdown: [],
  };

  const handleDownloadCsv = (endpoint: string, filename: string) => {
    const token = sessionStorage.getItem('school_erp_token') || localStorage.getItem('school_erp_token');
    const baseUrl = import.meta.env.VITE_API_URL || '/api/v1';
    fetch(`${baseUrl}/accounts/reports/export/${endpoint}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error('Download failed');
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => console.error('Export error:', err));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Accounts & Financial Ledger</h1>
          <p className="text-sm text-slate-500 mt-1">
            Fee reconciliation, operational expenditures, income/expense summaries & CSV data export
          </p>
        </div>

        <button
          onClick={() => setIsExpenseModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Fee Revenue Collected</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ₹{summary.totalFeeIncome.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Collection Rate: <strong className="text-slate-700">{summary.collectionRate}%</strong>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Operational Expenses</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ₹{summary.totalExpenses.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-400">All departments combined</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Net Operating Balance</span>
            <div className={`p-2 rounded-xl ${summary.netSurplus >= 0 ? 'bg-brand-50 text-brand-600' : 'bg-rose-50 text-rose-600'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold ${summary.netSurplus >= 0 ? 'text-brand-700' : 'text-rose-600'}`}>
            ₹{summary.netSurplus.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {summary.netSurplus >= 0 ? 'Operational Surplus' : 'Operating Deficit'}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Uncollected Dues</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">
            ₹{summary.totalOutstandingDues.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-400">Pending student balances</div>
        </div>
      </div>

      {/* Reports Export Section */}
      <div className="bg-gradient-to-r from-navy-950 to-brand-950 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            Audit-Ready Management Data Exports
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Download full CSV records for accounting audits, student enrolment rosters & fee collections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleDownloadCsv('students', 'students-roster.csv')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-colors border border-white/10"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Students CSV</span>
          </button>
          <button
            onClick={() => handleDownloadCsv('fees', 'fee-collections.csv')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-colors border border-white/10"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Fee Collections CSV</span>
          </button>
        </div>
      </div>

      {/* Expenses Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <span className="font-bold text-sm text-slate-900">
            Expenses Ledger ({expensesData?.data?.length || 0})
          </span>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1 rounded-xl border border-slate-200 text-xs font-medium"
          >
            <option value="">All Categories</option>
            <option value="Utilities">Utilities</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Supplies">Supplies</option>
            <option value="Salaries">Salaries</option>
            <option value="Events">Events</option>
          </select>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Expense Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Payment Mode</th>
              <th className="px-4 py-3">Remarks</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isExpensesLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">Loading expenses...</td>
              </tr>
            ) : expensesData?.data?.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 italic">No expenses recorded.</td>
              </tr>
            ) : (
              expensesData?.data?.map((exp: any) => (
                <tr key={exp.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                    {new Date(exp.expenseDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{exp.title}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{exp.paymentMode}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{exp.remarks || '-'}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                    ₹{Number(exp.amount).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Record Operational Expense</h2>
              <button onClick={() => setIsExpenseModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createExpenseMutation.mutate(expenseForm);
              }}
              className="space-y-4 mt-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electricity Bill - North Campus Block A"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  >
                    <option value="Utilities">Utilities</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Supplies">Supplies</option>
                    <option value="Salaries">Salaries</option>
                    <option value="Events">Events</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.expenseDate}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={expenseForm.paymentMode}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Invoice #EB-2026-04"
                  value={expenseForm.remarks}
                  onChange={(e) => setExpenseForm({ ...expenseForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createExpenseMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

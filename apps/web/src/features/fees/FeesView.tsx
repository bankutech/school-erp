import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Receipt,
  CheckCircle,
  X,
  Calendar,
  Layers,
  ArrowRight,
  Printer,
  AlertCircle,
  Users,
  Split,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAcademic } from '../../context/AcademicContext';
import { InvoiceStatus, PaymentMethod, PERMISSIONS } from '@school-erp/shared';

export const FeesView: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const { selectedYearId } = useAcademic();
  const [activeTab, setActiveTab] = useState<'invoices' | 'household' | 'structures'>('invoices');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Household & Sibling State
  const [householdSearch, setHouseholdSearch] = useState('');
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState<any | null>(null);
  const [totalLumpSum, setTotalLumpSum] = useState<string>('');
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [splitForm, setSplitForm] = useState({
    paymentMethod: 'UPI' as PaymentMethod,
    referenceNumber: '',
    notes: '',
  });

  // Receipt Format: A4 standard or 80mm POS Thermal
  const [receiptFormat, setReceiptFormat] = useState<'a4' | 'thermal'>('a4');

  // Modals
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [lastReceipt, setLastReceipt] = useState<any | null>(null);
  const [viewReceipt, setViewReceipt] = useState<any | null>(null);

  // Invoices query
  const { data: invoicesData, isLoading: isInvoicesLoading } = useQuery({
    queryKey: ['invoices', statusFilter, searchTerm, selectedYearId],
    queryFn: () =>
      api.get<any>('/fees/invoices', {
        status: statusFilter || undefined,
        search: searchTerm || undefined,
        academicYearId: selectedYearId || undefined,
      }),
  });

  // Household balances query
  const { data: householdData, isLoading: isHouseholdLoading } = useQuery({
    queryKey: ['household-balances', householdSearch],
    queryFn: () =>
      api.get<any>('/fees/household', {
        search: householdSearch || undefined,
      }),
    enabled: activeTab === 'household' && householdSearch.trim().length >= 2,
  });

  // Fee Structures query
  const { data: structuresData } = useQuery({
    queryKey: ['fee-structures'],
    queryFn: () => api.get<any>('/fees/structures'),
  });

  // Classes & Years
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get<any>('/academics/classes'),
  });

  const { data: yearsData } = useQuery({
    queryKey: ['years'],
    queryFn: () => api.get<any>('/academics/years'),
  });

  const invoices = invoicesData?.data || [];
  const households = householdData?.data || [];
  const structures = structuresData?.data || [];
  const classes = classesData?.data || [];
  const years = yearsData?.data || [];
  const currentYear = years.find((y: any) => y.isCurrent) || years[0];

  // Invoices generation form
  const [genForm, setGenForm] = useState({
    title: 'Term 1 Tuition & Composite Fee',
    academicYearId: '',
    classId: '',
    feeStructureId: '',
    dueDate: '2026-05-15',
  });

  const generateMutation = useMutation({
    mutationFn: (data: any) => api.post('/fees/invoices/generate', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setIsGenerateModalOpen(false);
    },
  });

  // Single Payment form
  const [payForm, setPayForm] = useState({
    amount: '',
    paymentMethod: 'UPI',
    referenceNumber: '',
    notes: '',
  });

  const paymentMutation = useMutation({
    mutationFn: (data: any) => api.post('/fees/payments', data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['household-balances'] });
      setIsPaymentModalOpen(false);
      setLastReceipt(res.data?.payment);
    },
  });

  // Split Payment Mutation
  const splitPaymentMutation = useMutation({
    mutationFn: (data: any) => api.post('/fees/payments/split', data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['household-balances'] });
      setIsSplitModalOpen(false);
      const firstPayment = res.data?.[0]?.payment;
      if (firstPayment) {
        setLastReceipt(firstPayment);
      }
    },
  });

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateMutation.mutate({
      ...genForm,
      academicYearId: genForm.academicYearId || selectedYearId || currentYear?.id,
    });
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    paymentMutation.mutate({
      invoiceId: selectedInvoice.id,
      amount: parseFloat(payForm.amount),
      paymentMethod: payForm.paymentMethod,
      referenceNumber: payForm.referenceNumber,
      notes: payForm.notes,
    });
  };

  // Auto-distribute lump sum across unpaid invoices
  const handleAutoDistribute = (amount: number) => {
    if (!selectedHousehold || amount <= 0) return;
    let remaining = amount;
    const newAllocations: Record<string, number> = {};

    // Collect all unpaid invoices across all siblings
    const allInvoices = selectedHousehold.siblings.flatMap((s: any) =>
      s.invoices.map((inv: any) => ({ ...inv, studentName: `${s.firstName} ${s.lastName}` }))
    );

    for (const inv of allInvoices) {
      if (remaining <= 0) {
        newAllocations[inv.id] = 0;
        continue;
      }
      const invBal = Number(inv.balance);
      const allocated = Math.min(remaining, invBal);
      newAllocations[inv.id] = allocated;
      remaining -= allocated;
    }

    setAllocations(newAllocations);
  };

  const handleSplitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allocArray = Object.entries(allocations)
      .filter(([_, amt]) => amt > 0)
      .map(([invoiceId, amount]) => ({ invoiceId, amount }));

    if (allocArray.length === 0) return;

    splitPaymentMutation.mutate({
      allocations: allocArray,
      paymentMethod: splitForm.paymentMethod,
      referenceNumber: splitForm.referenceNumber,
      notes: splitForm.notes,
    });
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case InvoiceStatus.PAID:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">Paid</span>;
      case InvoiceStatus.PARTIALLY_PAID:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">Partially Paid</span>;
      case InvoiceStatus.UNPAID:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">Unpaid</span>;
      case InvoiceStatus.OVERDUE:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800">Overdue</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Fee Management & Accounts</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Fee structures, invoice generation, partial collections, and official reconciliation.
          </p>
        </div>

        {hasPermission(PERMISSIONS.FEES_WRITE) && (
          <button
            onClick={() => {
              if (structures.length > 0 && !genForm.feeStructureId) {
                setGenForm((prev) => ({
                  ...prev,
                  feeStructureId: structures[0].id,
                  classId: structures[0].classId,
                }));
              }
              setIsGenerateModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Invoices</span>
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'invoices'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Invoices & Collections</span>
        </button>
        <button
          onClick={() => setActiveTab('household')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'household'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Household & Sibling Billing</span>
        </button>
        <button
          onClick={() => setActiveTab('structures')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'structures'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Fee Structures ({structures.length})</span>
        </button>
      </div>

      {/* TAB 1: INVOICES */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search invoice number, student..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {['', 'UNPAID', 'PARTIALLY_PAID', 'PAID'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st ? st.replace('_', ' ') : 'All Statuses'}
                </button>
              ))}
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-4">Invoice No</th>
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Title</th>
                    <th className="py-3.5 px-4">Total Amount</th>
                    <th className="py-3.5 px-4">Paid</th>
                    <th className="py-3.5 px-4">Balance</th>
                    <th className="py-3.5 px-4">Due Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {isInvoicesLoading ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Loading invoices...
                      </td>
                    </tr>
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No invoices found. Generate fee invoices for active academic classes.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-brand-700">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {inv.student?.firstName} {inv.student?.lastName}
                          <span className="block text-[11px] font-normal text-slate-400 font-mono">
                            {inv.student?.admissionNumber}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium">{inv.title}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          ₹{Number(inv.totalAmount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-emerald-700 font-medium">
                          ₹{Number(inv.paidAmount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-amber-700 font-bold">
                          ₹{Number(inv.balance).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(inv.dueDate).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">{statusBadge(inv.status)}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {inv.payments && inv.payments.length > 0 && (
                              <button
                                onClick={() => setViewReceipt({ ...inv.payments[0], invoice: inv })}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                                title="View & Print Official Receipt"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {inv.status !== 'PAID' && hasPermission(PERMISSIONS.FEES_COLLECT) ? (
                              <button
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                  setPayForm({
                                    amount: String(inv.balance),
                                    paymentMethod: 'UPI',
                                    referenceNumber: '',
                                    notes: '',
                                  });
                                  setIsPaymentModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-sm transition-colors"
                              >
                                Collect Fee
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">Settled</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HOUSEHOLD & SIBLING BILLING */}
      {activeTab === 'household' && (
        <div className="space-y-4">
          {/* Household Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by Parent phone, Parent name, or Child admission no..."
                value={householdSearch}
                onChange={(e) => setHouseholdSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
              />
            </div>
            <div className="text-xs text-slate-500">
              <span>Bursar Quick Lookup: Enter at least 2 characters to retrieve linked siblings</span>
            </div>
          </div>

          {/* Household Results */}
          {householdSearch.trim().length < 2 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Unified Household Lookup</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Enter a parent contact number or child admission number above to view all enrolled siblings, their combined fee liabilities, and perform single-receipt split collections.
              </p>
            </div>
          ) : isHouseholdLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-400">
              Searching household sibling rosters...
            </div>
          ) : households.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-400 italic">
              No matching parent or household records found for "{householdSearch}".
            </div>
          ) : (
            households.map((h: any) => (
              <div
                key={h.guardianId}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5"
              >
                {/* Household Header Banner */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{h.guardianName}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {h.relation || 'Guardian'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="font-mono">{h.phone}</span>
                        {h.email && (
                          <>
                            <span>•</span>
                            <span>{h.email}</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="font-semibold text-brand-700">{h.siblings.length} Enrolled Sibling(s)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Total Household Balance</div>
                      <div className="text-xl font-bold text-rose-700 tabular-nums">
                        ₹{Number(h.totalHouseholdBalance).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Billed: ₹{Number(h.totalHouseholdBilled).toLocaleString('en-IN')} | Paid: ₹{Number(h.totalHouseholdPaid).toLocaleString('en-IN')}
                      </div>
                    </div>

                    {hasPermission(PERMISSIONS.FEES_COLLECT) && h.totalHouseholdBalance > 0 && (
                      <button
                        onClick={() => {
                          setSelectedHousehold(h);
                          setTotalLumpSum(String(h.totalHouseholdBalance));
                          // Auto distribute total
                          handleAutoDistribute(h.totalHouseholdBalance);
                          setIsSplitModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-sm transition-colors"
                      >
                        <Split className="w-4 h-4" />
                        <span>Quick Split & Collect</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Siblings Side-by-Side Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {h.siblings.map((sibling: any) => (
                    <div
                      key={sibling.studentId}
                      className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">
                            {sibling.firstName} {sibling.lastName}
                          </h4>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {sibling.admissionNumber} • {sibling.className} ({sibling.sectionName})
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-900 tabular-nums">
                            ₹{Number(sibling.studentBalance).toLocaleString('en-IN')}
                          </span>
                          <span className="block text-[10px] text-slate-500">Child Dues</span>
                        </div>
                      </div>

                      {/* Invoices list */}
                      <div className="space-y-2">
                        {sibling.invoices.length === 0 ? (
                          <div className="text-[11px] text-emerald-700 font-medium py-1">
                            ✓ No outstanding dues for this student.
                          </div>
                        ) : (
                          sibling.invoices.map((inv: any) => (
                            <div
                              key={inv.id}
                              className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between"
                            >
                              <div>
                                <span className="font-semibold text-slate-900 block">{inv.title}</span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {inv.invoiceNumber} • Due: {new Date(inv.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <span className="font-bold text-rose-700 tabular-nums block">
                                    ₹{Number(inv.balance).toLocaleString('en-IN')}
                                  </span>
                                  {statusBadge(inv.status)}
                                </div>
                                {hasPermission(PERMISSIONS.FEES_COLLECT) && (
                                  <button
                                    onClick={() => {
                                      setSelectedInvoice(inv);
                                      setPayForm({
                                        amount: String(inv.balance),
                                        paymentMethod: 'UPI',
                                        referenceNumber: '',
                                        notes: `Household sibling payment: ${sibling.firstName}`,
                                      });
                                      setIsPaymentModalOpen(true);
                                    }}
                                    className="px-2 py-1 bg-slate-900 text-white rounded text-[10px] font-semibold hover:bg-slate-800"
                                  >
                                    Pay Single
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: FEE STRUCTURES */}
      {activeTab === 'structures' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {structures.map((s: any) => (
            <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{s.name}</h3>
                  <p className="text-xs text-slate-500">
                    {s.class?.name} • Year: {s.academicYear?.name}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-brand-700">
                    ₹{Number(s.totalAmount).toLocaleString('en-IN')}
                  </span>
                  <span className="block text-[10px] text-slate-400">Total Annual Fee</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <p className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                  Fee Components
                </p>
                {s.components?.map((c: any) => (
                  <div key={c.id} className="flex justify-between py-1 text-slate-600 border-b border-slate-50">
                    <span>{c.name}</span>
                    <span className="font-medium text-slate-900">
                      ₹{Number(c.amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Record Fee Payment</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedInvoice.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 mt-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <p className="font-semibold text-slate-900">
                  Student: {selectedInvoice.student?.firstName} {selectedInvoice.student?.lastName}
                </p>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Total Bill: ₹{Number(selectedInvoice.totalAmount).toLocaleString('en-IN')}</span>
                  <span className="text-amber-700 font-bold">Outstanding: ₹{Number(selectedInvoice.balance).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Payment Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={Number(selectedInvoice.balance)}
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Payment Method <span className="text-rose-500">*</span>
                </label>
                <select
                  value={payForm.paymentMethod}
                  onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                >
                  <option value="UPI">UPI / QR Code</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Direct Bank Transfer / NEFT</option>
                  <option value="CHEQUE">Cheque / Demand Draft</option>
                  <option value="CARD">Debit / Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Reference / Transaction ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref / UTR / Cheque Number"
                  value={payForm.referenceNumber}
                  onChange={(e) => setPayForm({ ...payForm, referenceNumber: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Notes / Receipt Memo
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid by father via Google Pay"
                  value={payForm.notes}
                  onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                >
                  {paymentMutation.isPending ? 'Processing...' : 'Confirm Payment & Issue Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERATE INVOICES MODAL */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Generate Class Invoices</h3>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Invoice Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={genForm.title}
                  onChange={(e) => setGenForm({ ...genForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Target Fee Structure <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={genForm.feeStructureId}
                  onChange={(e) => {
                    const st = structures.find((s: any) => s.id === e.target.value);
                    setGenForm({
                      ...genForm,
                      feeStructureId: e.target.value,
                      classId: st?.classId || '',
                    });
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                >
                  <option value="">Select Fee Plan</option>
                  {structures.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (₹{Number(s.totalAmount).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Payment Due Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={genForm.dueDate}
                  onChange={(e) => setGenForm({ ...genForm, dueDate: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generateMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm"
                >
                  {generateMutation.isPending ? 'Generating...' : 'Generate All Invoices'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK SPLIT ALLOCATION MODAL (HOUSEHOLD BILLING) */}
      {isSplitModalOpen && selectedHousehold && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Household Split Fee Allocation</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Guardian: <span className="font-semibold text-slate-800">{selectedHousehold.guardianName}</span> ({selectedHousehold.phone})
                </p>
              </div>
              <button
                onClick={() => setIsSplitModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSplitSubmit} className="space-y-4 mt-4 text-xs">
              {/* Total Dues and Lump Sum Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-500 block">Total Household Outstanding</span>
                  <span className="text-base font-bold text-rose-700 tabular-nums">
                    ₹{Number(selectedHousehold.totalHouseholdBalance).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Lump Sum Received (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={totalLumpSum}
                      onChange={(e) => {
                        setTotalLumpSum(e.target.value);
                        handleAutoDistribute(Number(e.target.value));
                      }}
                      className="w-full p-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => handleAutoDistribute(Number(totalLumpSum))}
                      className="px-2.5 py-2 rounded-xl bg-slate-900 text-white font-semibold whitespace-nowrap text-[11px] hover:bg-slate-800"
                    >
                      Auto-Distribute
                    </button>
                  </div>
                </div>
              </div>

              {/* Sibling Invoices Split Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="p-2.5">Sibling & Invoice</th>
                      <th className="p-2.5">Due Balance</th>
                      <th className="p-2.5 w-40 text-right">Allocated Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedHousehold.siblings.map((sibling: any) =>
                      sibling.invoices.map((inv: any) => {
                        const invBal = Number(inv.balance);
                        const currentAlloc = allocations[inv.id] ?? 0;
                        return (
                          <tr key={inv.id} className="hover:bg-slate-50/50">
                            <td className="p-2.5">
                              <span className="font-semibold text-slate-900 block">
                                {sibling.firstName} {sibling.lastName} ({sibling.className})
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {inv.title} • {inv.invoiceNumber}
                              </span>
                            </td>
                            <td className="p-2.5 font-bold text-slate-900 tabular-nums">
                              ₹{invBal.toLocaleString('en-IN')}
                            </td>
                            <td className="p-2.5 text-right">
                              <input
                                type="number"
                                min="0"
                                max={invBal}
                                step="0.01"
                                value={currentAlloc}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setAllocations({
                                    ...allocations,
                                    [inv.id]: Math.min(val, invBal),
                                  });
                                }}
                                className="w-32 p-1.5 rounded-lg border border-slate-200 text-xs font-bold text-right text-slate-900 focus:ring-2 focus:ring-brand-500 tabular-nums"
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td className="p-2.5 text-slate-900">Total Allocated Across Siblings</td>
                      <td colSpan={2} className="p-2.5 text-right font-mono text-emerald-700">
                        ₹
                        {Object.values(allocations)
                          .reduce((acc, v) => acc + (Number(v) || 0), 0)
                          .toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Payment Method <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={splitForm.paymentMethod}
                    onChange={(e) =>
                      setSplitForm({ ...splitForm, paymentMethod: e.target.value as PaymentMethod })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Direct Bank Transfer / NEFT</option>
                    <option value="CHEQUE">Cheque / Demand Draft</option>
                    <option value="CARD">Debit / Credit Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Reference / Transaction ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UPI / Cheque / UTR Ref"
                    value={splitForm.referenceNumber}
                    onChange={(e) =>
                      setSplitForm({ ...splitForm, referenceNumber: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Cashier Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sibling composite payment received in full"
                  value={splitForm.notes}
                  onChange={(e) => setSplitForm({ ...splitForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSplitModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={splitPaymentMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm disabled:opacity-50"
                >
                  {splitPaymentMutation.isPending ? 'Processing...' : 'Confirm Split Payments & Generate Receipts'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL PRINTABLE RECEIPT MODAL (A4 & 80mm POS THERMAL) */}
      {(lastReceipt || viewReceipt) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`bg-white rounded-2xl w-full p-6 shadow-2xl border border-slate-200 transition-all ${
              receiptFormat === 'thermal' ? 'max-w-sm' : 'max-w-md'
            }`}
          >
            {/* Header with Format Selector, Print & Close */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Official Fee Receipt</h3>
                  <p className="text-[10px] text-slate-500">SRM Academy</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Format Toggle Pill */}
                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-[10px] font-semibold">
                  <button
                    onClick={() => setReceiptFormat('a4')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      receiptFormat === 'a4'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    A4 Formal
                  </button>
                  <button
                    onClick={() => setReceiptFormat('thermal')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      receiptFormat === 'thermal'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    80mm POS
                  </button>
                </div>

                <button
                  onClick={() => window.print()}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                  title="Print Official Receipt"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setLastReceipt(null);
                    setViewReceipt(null);
                  }}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Receipt Content */}
            {(() => {
              const r = lastReceipt || viewReceipt;
              const inv = r.invoice || selectedInvoice;

              if (receiptFormat === 'thermal') {
                return (
                  /* 80mm Thermal Receipt Layout */
                  <div className="py-4 space-y-2.5 font-mono text-[11px] leading-tight text-slate-800 bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-300 my-3">
                    <div className="text-center pb-2 border-b border-dashed border-slate-300">
                      <div className="font-bold text-xs uppercase text-slate-900">
                        SRM Academy
                      </div>
                      <div className="text-[10px] text-slate-500">CASHIER DESK • OFFICIAL RECEIPT</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">GST/TAX REG: AIA-EDU-2026-901</div>
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>RC: {r.receiptNumber}</span>
                      <span>
                        {new Date(r.paidAt || Date.now()).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {inv?.student && (
                      <div className="py-1 border-t border-b border-dashed border-slate-200 text-[10px]">
                        <div>
                          STD: <span className="font-bold text-slate-900">{inv.student.firstName} {inv.student.lastName}</span>
                        </div>
                        <div>ADM: {inv.student.admissionNumber}</div>
                        <div>INV: {inv.invoiceNumber}</div>
                      </div>
                    )}

                    <div className="space-y-1 py-1">
                      <div className="flex justify-between font-medium">
                        <span>{inv?.title || 'Tuition & Composite Fee'}</span>
                        <span className="font-bold text-slate-900">₹{Number(r.amount).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="border-t-2 border-slate-900 pt-1.5 flex justify-between font-bold text-xs">
                      <span>TOTAL PAID:</span>
                      <span>₹{Number(r.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="text-[10px] text-slate-600 pt-1">
                      <div>MODE: {r.paymentMethod}</div>
                      {r.referenceNumber && <div>REF: {r.referenceNumber}</div>}
                      <div className="text-emerald-700 font-bold mt-1">STATUS: RECONCILED & CLEARED</div>
                    </div>

                    <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[9px] text-slate-400">
                      <div>*** THANK YOU FOR PROMPT PAYMENT ***</div>
                      <div>Computer-generated institutional voucher</div>
                    </div>
                  </div>
                );
              }

              /* Standard A4 Formal Invoice / Receipt */
              return (
                <div className="py-4 space-y-3 text-xs">
                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Receipt Number</span>
                      <span className="font-bold text-slate-900">{r.receiptNumber}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Payment Date</span>
                      <span className="text-slate-700">
                        {new Date(r.paidAt || Date.now()).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {inv?.student && (
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50/50 rounded-lg text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Student Name</span>
                        <span className="font-semibold text-slate-900">
                          {inv.student.firstName} {inv.student.lastName}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Admission No</span>
                        <span className="font-mono text-slate-700">{inv.student.admissionNumber}</span>
                      </div>
                    </div>
                  )}

                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                        <tr>
                          <th className="p-2">Description</th>
                          <th className="p-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="p-2 text-slate-700 font-medium">{inv?.title || 'Fee Payment'}</td>
                          <td className="p-2 text-right font-bold text-slate-900 tabular-nums">
                            ₹{Number(r.amount).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-center text-[11px] pt-1">
                    <span className="text-slate-500">
                      Payment Mode: <span className="font-semibold text-slate-800">{r.paymentMethod}</span>
                      {r.referenceNumber ? ` (${r.referenceNumber})` : ''}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Verified & Reconciled
                    </span>
                  </div>

                  <div className="pt-6 flex justify-between items-end text-[10px] text-slate-400">
                    <div>Authorized School Seal</div>
                    <div className="text-right border-t border-slate-300 pt-1 w-28">
                      Cashier Signature
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="pt-2">
              <button
                onClick={() => {
                  setLastReceipt(null);
                  setViewReceipt(null);
                }}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

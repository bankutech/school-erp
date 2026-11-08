import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAcademic } from '../../context/AcademicContext';
import {
  GraduationCap,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  UserCheck,
  ChevronRight,
  X,
  AlertCircle,
  Calendar,
  Users,
  Building2,
  Phone,
  Mail,
  FileText,
  Sparkles,
  Download,
  Check,
} from 'lucide-react';
import { AdmissionStatus, Gender } from '@school-erp/shared';

export const AdmissionsView: React.FC = () => {
  const queryClient = useQueryClient();
  const { selectedYearId, selectedYear } = useAcademic();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string>('UNDER_REVIEW');
  const [reviewNotes, setReviewNotes] = useState('');
  const [allocatedSectionId, setAllocatedSectionId] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Fetch applications
  const { data: appsData, isLoading } = useQuery({
    queryKey: ['admissions', statusFilter, searchTerm, selectedYearId],
    queryFn: () =>
      api.get<any>('/admissions', {
        status: statusFilter || undefined,
        search: searchTerm || undefined,
        academicYearId: selectedYearId || undefined,
      }),
  });

  // Fetch classes and sections for dropdowns
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get<any>('/academics/classes'),
  });

  const { data: yearsData } = useQuery({
    queryKey: ['years'],
    queryFn: () => api.get<any>('/academics/years'),
  });

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.patch(`/admissions/${id}/review`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setSelectedApp(null);
    },
  });

  // New application form state
  const [newForm, setNewForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '2012-05-10',
    gender: 'MALE',
    email: '',
    phone: '',
    address: '',
    guardianName: '',
    guardianRelation: 'Father',
    guardianPhone: '',
    guardianEmail: '',
    classId: '',
    academicYearId: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/admissions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      setIsNewModalOpen(false);
      setNewForm({
        firstName: '',
        lastName: '',
        dateOfBirth: '2012-05-10',
        gender: 'MALE',
        email: '',
        phone: '',
        address: '',
        guardianName: '',
        guardianRelation: 'Father',
        guardianPhone: '',
        guardianEmail: '',
        classId: '',
        academicYearId: '',
      });
    },
  });

  const applications = useMemo(() => appsData?.data || [], [appsData]);
  const classes = classesData?.data || [];
  const years = yearsData?.data || [];
  const currentYear = years.find((y: any) => y.isCurrent) || years[0];

  // Metric counts
  const totalCount = applications.length;
  const underReviewCount = applications.filter(
    (a: any) => a.status === 'UNDER_REVIEW' || a.status === 'SUBMITTED'
  ).length;
  const approvedCount = applications.filter((a: any) => a.status === 'APPROVED').length;
  const enrolledCount = applications.filter((a: any) => a.status === 'ENROLLED').length;
  const rejectedCount = applications.filter((a: any) => a.status === 'REJECTED').length;

  const statusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Submitted</span>
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Under Review</span>
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>Interview Scheduled</span>
          </span>
        );
      case 'ENROLLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Admitted (SIS)</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Declined</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    reviewMutation.mutate({
      id: selectedApp.id,
      data: {
        status: reviewStatus,
        reviewNotes,
        sectionId: allocatedSectionId || undefined,
      },
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...newForm,
      academicYearId: newForm.academicYearId || selectedYearId || currentYear?.id,
    });
  };

  // CSV Export
  const handleExportCSV = () => {
    setIsExporting(true);
    const headers = [
      'Application No',
      'First Name',
      'Last Name',
      'Class Applied',
      'Gender',
      'Date of Birth',
      'Guardian Name',
      'Guardian Phone',
      'Guardian Email',
      'Status',
      'Submission Date',
    ];

    const rows = applications.map((app: any) => [
      app.applicationNo,
      app.firstName,
      app.lastName,
      app.class?.name || 'N/A',
      app.gender,
      new Date(app.dateOfBirth).toLocaleDateString(),
      app.guardianName,
      app.guardianPhone,
      app.guardianEmail || '',
      app.status,
      new Date(app.createdAt).toLocaleDateString(),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r: any[]) => r.map((cell: any) => `"${cell}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Admissions_Roster_${selectedYear?.name || '2026-27'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsExporting(false), 600);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Admissions & Enrolment Funnel
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              AY {selectedYear?.name || '2026–27'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Applicant vetting pipeline, entrance interviews, section allocations, and automated SIS provisioning.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={isExporting || applications.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>{isExporting ? 'Exporting...' : 'Export Roster'}</span>
          </button>

          <button
            onClick={() => {
              if (classes.length > 0 && !newForm.classId) {
                setNewForm((prev) => ({ ...prev, classId: classes[0].id }));
              }
              const activeYr = selectedYearId || currentYear?.id;
              if (activeYr && !newForm.academicYearId) {
                setNewForm((prev) => ({ ...prev, academicYearId: activeYr }));
              }
              setIsNewModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Application</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono block">
            Total Dossiers
          </span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">{totalCount}</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Received this term</span>
        </div>

        {/* Card 2: Under Review */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs bg-amber-50/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 font-mono block">
            Under Review
          </span>
          <p className="text-2xl font-extrabold text-amber-700 mt-1 tabular-nums">{underReviewCount}</p>
          <span className="text-[10px] text-amber-600 mt-0.5 block">Awaiting vetting</span>
        </div>

        {/* Card 3: Interview Scheduled */}
        <div className="bg-white p-4 rounded-2xl border border-indigo-200/80 shadow-xs bg-indigo-50/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 font-mono block">
            Interview Scheduled
          </span>
          <p className="text-2xl font-extrabold text-indigo-700 mt-1 tabular-nums">{approvedCount}</p>
          <span className="text-[10px] text-indigo-600 mt-0.5 block">Shortlisted applicants</span>
        </div>

        {/* Card 4: Enrolled */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs bg-emerald-50/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 font-mono block">
            Admitted (SIS)
          </span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1 tabular-nums">{enrolledCount}</p>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">Provisioned students</span>
        </div>

        {/* Card 5: Declined */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-xs bg-rose-50/20 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 font-mono block">
            Declined
          </span>
          <p className="text-2xl font-extrabold text-rose-700 mt-1 tabular-nums">{rejectedCount}</p>
          <span className="text-[10px] text-rose-600 mt-0.5 block">Capacity or eligibility</span>
        </div>
      </div>

      {/* Filter Bar & Instant Filter Pills */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Instant Search Field */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, app #, parent, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
          />
        </div>

        {/* Instant Filter Pills */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-xs text-slate-400 mr-1 flex items-center gap-1 font-medium shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter:</span>
          </span>

          {[
            { label: 'All', value: '', count: totalCount },
            { label: 'Under Review', value: 'UNDER_REVIEW', count: underReviewCount },
            { label: 'Interview Scheduled', value: 'APPROVED', count: approvedCount },
            { label: 'Admitted', value: 'ENROLLED', count: enrolledCount },
            { label: 'Declined', value: 'REJECTED', count: rejectedCount },
          ].map((pill) => {
            const isActive = statusFilter === pill.value;
            return (
              <button
                key={pill.label}
                type="button"
                onClick={() => setStatusFilter(pill.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                <span>{pill.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Multi-Status Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4 font-mono">App #</th>
                <th className="py-3.5 px-4">Applicant Profile</th>
                <th className="py-3.5 px-4">Class Target</th>
                <th className="py-3.5 px-4">Guardian Contact</th>
                <th className="py-3.5 px-4">Applied Date</th>
                <th className="py-3.5 px-4">Funnel Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading applications...</span>
                    </span>
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    No admission applications found matching the selected filter.
                  </td>
                </tr>
              ) : (
                applications.map((app: any) => {
                  const initials = `${app.firstName.charAt(0)}${app.lastName.charAt(0)}`.toUpperCase();
                  return (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                        {app.applicationNo}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 font-mono">
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {app.firstName} {app.lastName}
                            </span>
                            <span className="text-[11px] text-slate-400 font-normal">
                              {app.gender} • DOB: {new Date(app.dateOfBirth).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block">
                          {app.class?.name || 'Class'}
                        </span>
                        {app.allocatedSection ? (
                          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            Section {app.allocatedSection.name}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">Unallocated</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">
                          {app.guardianName}{' '}
                          <span className="text-slate-400 font-normal">({app.guardianRelation})</span>
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                          <span>{app.guardianPhone}</span>
                          {app.guardianEmail && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[120px]">{app.guardianEmail}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">{statusBadge(app.status)}</td>
                      <td className="py-3.5 px-4 text-right">
                        {app.status === 'ENROLLED' ? (
                          <span className="text-[11px] text-emerald-700 font-bold inline-flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Enrolled
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedApp(app);
                              setReviewStatus(
                                app.status === 'SUBMITTED' ? 'UNDER_REVIEW' : app.status
                              );
                              setReviewNotes(app.reviewNotes || '');
                              setAllocatedSectionId(app.allocatedSectionId || '');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 font-semibold transition-colors cursor-pointer text-xs"
                          >
                            Review & Decide →
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REVIEW & ADMISSION DECISION DRAWER / MODAL */}
      {selectedApp && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Application Review: {selectedApp.firstName} {selectedApp.lastName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {/* Applicant Summary Dossier */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Application Number:</span>
                  <span className="font-mono font-bold text-indigo-700">{selectedApp.applicationNo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Target Grade:</span>
                  <span className="font-semibold text-slate-800">{selectedApp.class?.name || 'Class'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Guardian:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedApp.guardianName} ({selectedApp.guardianRelation}) • {selectedApp.guardianPhone}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Date of Birth & Gender:</span>
                  <span className="font-mono text-slate-700">
                    {new Date(selectedApp.dateOfBirth).toLocaleDateString()} ({selectedApp.gender})
                  </span>
                </div>
              </div>

              {/* Status Decision Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Admissions Funnel Decision Stage <span className="text-rose-600">*</span>
                </label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-600 cursor-pointer bg-white"
                >
                  <option value="UNDER_REVIEW">UNDER REVIEW (Dossier Vetting)</option>
                  <option value="APPROVED">APPROVED (Entrance Interview Scheduled)</option>
                  <option value="ENROLLED">ENROLLED (Admit Student & Auto-Provision in SIS)</option>
                  <option value="REJECTED">DECLINED (Capacity / Eligibility)</option>
                </select>
              </div>

              {/* Section Allocation (Required if Enrolling) */}
              {reviewStatus === 'ENROLLED' && (
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1.5 animate-in fade-in">
                  <label className="block text-xs font-bold text-emerald-950">
                    Allocate Class Section <span className="text-rose-600">*</span>
                  </label>
                  <select
                    required
                    value={allocatedSectionId}
                    onChange={(e) => setAllocatedSectionId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-emerald-300 text-xs text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-600 cursor-pointer bg-white"
                  >
                    <option value="">Select Section to Seat Student</option>
                    {classes
                      .find((c: any) => c.id === selectedApp.classId)
                      ?.sections?.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          Section {s.name} ({s.roomNumber ? `Room ${s.roomNumber}` : 'Capacity: 30'})
                        </option>
                      ))}
                  </select>
                  <p className="text-[11px] text-emerald-800 font-medium">
                    ✓ Confirming will auto-generate a unique Scholar Admission Number, SIS student profile, and active enrollment.
                  </p>
                </div>
              )}

              {/* Reviewer Notes / Evaluation Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Committee Notes & Interview Evaluation
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g., Transfer certificate verified, entrance evaluation score: 92%, seat offered."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 placeholder:text-slate-400"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 shadow-sm disabled:opacity-50 cursor-pointer transition-all"
                >
                  {reviewMutation.isPending ? 'Committing...' : 'Save Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW APPLICATION MODAL */}
      {isNewModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">New Admission Application</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    First Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newForm.firstName}
                    onChange={(e) => setNewForm({ ...newForm, firstName: e.target.value })}
                    placeholder="e.g. Aarav"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    Last Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newForm.lastName}
                    onChange={(e) => setNewForm({ ...newForm, lastName: e.target.value })}
                    placeholder="e.g. Patel"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    Class Applying For <span className="text-rose-600">*</span>
                  </label>
                  <select
                    required
                    value={newForm.classId}
                    onChange={(e) => setNewForm({ ...newForm, classId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs cursor-pointer focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                  >
                    <option value="">Select Grade</option>
                    {classes.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    Gender <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={newForm.gender}
                    onChange={(e) => setNewForm({ ...newForm, gender: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs cursor-pointer focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    Date of Birth <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newForm.dateOfBirth}
                    onChange={(e) => setNewForm({ ...newForm, dateOfBirth: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-900 block mb-2">
                  Guardian Information
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Guardian Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newForm.guardianName}
                      onChange={(e) => setNewForm({ ...newForm, guardianName: e.target.value })}
                      placeholder="e.g. Ramesh Patel"
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Relationship <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newForm.guardianRelation}
                      onChange={(e) => setNewForm({ ...newForm, guardianRelation: e.target.value })}
                      placeholder="Father / Mother"
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Guardian Phone <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newForm.guardianPhone}
                      onChange={(e) => setNewForm({ ...newForm, guardianPhone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Guardian Email
                    </label>
                    <input
                      type="email"
                      value={newForm.guardianEmail}
                      onChange={(e) => setNewForm({ ...newForm, guardianEmail: e.target.value })}
                      placeholder="guardian@example.com"
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 shadow-sm disabled:opacity-50 cursor-pointer transition-all"
                >
                  {createMutation.isPending ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdmissionsView;

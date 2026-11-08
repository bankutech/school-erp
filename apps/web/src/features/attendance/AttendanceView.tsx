import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  Users,
  Check,
  RotateCcw,
  ShieldAlert,
  ChevronRight,
  Keyboard,
  Info,
} from 'lucide-react';
import { AttendanceStatus } from '@school-erp/shared';
import { useAcademic } from '../../context/AcademicContext';

export const AttendanceView: React.FC = () => {
  const queryClient = useQueryClient();
  const { selectedYearId } = useAcademic();

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [rosterStatus, setRosterStatus] = useState<Record<string, AttendanceStatus>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(0);
  const [saveFeedback, setSaveFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch classes
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get<any>('/academics/classes'),
  });

  const classes = classesData?.data || [];
  const currentClass = classes.find((c: any) => c.id === selectedClassId) || classes[0];
  const sections = currentClass?.sections || [];

  // Initialize class and section defaults when classes load
  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
      if (classes[0].sections?.length > 0) {
        setSelectedSectionId(classes[0].sections[0].id);
      }
    }
  }, [classes, selectedClassId]);

  // Fetch attendance roster
  const { data: rosterData, isLoading } = useQuery({
    queryKey: ['attendance-roster', selectedClassId, selectedSectionId, selectedDate, selectedYearId],
    queryFn: () =>
      api.get<any>('/attendance/roster', {
        classId: selectedClassId,
        sectionId: selectedSectionId,
        date: selectedDate,
        academicYearId: selectedYearId || undefined,
      }),
    enabled: !!selectedClassId && !!selectedSectionId && !!selectedDate,
  });

  const roster = rosterData?.data?.roster || [];
  const isMarked = rosterData?.data?.isMarked;

  // Initialize roster defaulting to "PRESENT" (The 90-Second Rule)
  useEffect(() => {
    if (rosterData?.data?.roster) {
      const initial: Record<string, AttendanceStatus> = {};
      rosterData.data.roster.forEach((item: any) => {
        // Default to PRESENT if unrecorded
        initial[item.studentId] = item.status || AttendanceStatus.PRESENT;
      });
      setRosterStatus(initial);
      setHasUnsavedChanges(false);
      setSaveFeedback(null);
      setFocusedRowIndex(0);
    }
  }, [rosterData]);

  // Bulk save mutation
  const saveMutation = useMutation({
    mutationFn: (records: any[]) =>
      api.post('/attendance/bulk', {
        date: selectedDate,
        classId: selectedClassId,
        sectionId: selectedSectionId,
        records,
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['attendance-roster'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setHasUnsavedChanges(false);
      setSaveFeedback({ type: 'success', message: res.message || 'Attendance saved and synced successfully.' });
    },
    onError: (err: any) => {
      setSaveFeedback({ type: 'error', message: err.message || 'Failed to save attendance records.' });
    },
  });

  // Cycle status on tap / click
  const cycleStatus = (studentId: string) => {
    const current = rosterStatus[studentId] || AttendanceStatus.PRESENT;
    let next: AttendanceStatus = AttendanceStatus.PRESENT;
    if (current === AttendanceStatus.PRESENT) next = AttendanceStatus.ABSENT;
    else if (current === AttendanceStatus.ABSENT) next = AttendanceStatus.LATE;
    else if (current === AttendanceStatus.LATE) next = AttendanceStatus.EXCUSED;
    else if (current === AttendanceStatus.EXCUSED) next = AttendanceStatus.PRESENT;

    setRosterStatus((prev) => ({ ...prev, [studentId]: next }));
    setHasUnsavedChanges(true);
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRosterStatus((prev) => ({ ...prev, [studentId]: status }));
    setHasUnsavedChanges(true);
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    if (!roster.length) return;
    const updated: Record<string, AttendanceStatus> = {};
    roster.forEach((item: any) => {
      updated[item.studentId] = status;
    });
    setRosterStatus(updated);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    if (!roster.length) return;
    const records = roster.map((item: any) => ({
      studentId: item.studentId,
      status: rosterStatus[item.studentId] || AttendanceStatus.PRESENT,
    }));
    saveMutation.mutate(records);
  };

  // Pure Keyboard Navigation (Down/Up arrow, P, A, L, E, Space)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if user is typing in date or text input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (!roster.length) return;

      const currentStudent = roster[focusedRowIndex];
      if (!currentStudent) return;

      const advance = () => {
        setFocusedRowIndex((prev) => Math.min(roster.length - 1, prev + 1));
      };

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedRowIndex((prev) => Math.min(roster.length - 1, prev + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedRowIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleStatusChange(currentStudent.studentId, AttendanceStatus.PRESENT);
        advance();
      } else if (e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleStatusChange(currentStudent.studentId, AttendanceStatus.ABSENT);
        advance();
      } else if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        handleStatusChange(currentStudent.studentId, AttendanceStatus.LATE);
        advance();
      } else if (e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleStatusChange(currentStudent.studentId, AttendanceStatus.EXCUSED);
        advance();
      } else if (e.key === ' ') {
        e.preventDefault();
        cycleStatus(currentStudent.studentId);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [roster, focusedRowIndex]);

  const presentCount = Object.values(rosterStatus).filter((s) => s === AttendanceStatus.PRESENT).length;
  const absentCount = Object.values(rosterStatus).filter((s) => s === AttendanceStatus.ABSENT).length;
  const lateCount = Object.values(rosterStatus).filter((s) => s === AttendanceStatus.LATE).length;
  const excusedCount = Object.values(rosterStatus).filter((s) => s === AttendanceStatus.EXCUSED).length;

  return (
    <div className="space-y-5 pb-24 select-none">
      {/* Header & Speed Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Attendance Register</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              90-Second Speed Workflow
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Defaulted to all present. Single-tap cyclic toggle or pure keyboard control (`A` = Absent, `L` = Late, `P` = Present).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleMarkAll(AttendanceStatus.PRESENT)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            Mark All Present
          </button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending || roster.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saveMutation.isPending ? 'Syncing...' : 'Save Attendance'}</span>
          </button>
        </div>
      </div>

      {/* Save Notification Alert */}
      {saveFeedback && (
        <div
          className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-between ${
            saveFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {saveFeedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{saveFeedback.message}</span>
          </div>
          <button onClick={() => setSaveFeedback(null)} className="font-bold text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>
      )}

      {/* Class, Section & Date Selection Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider">
            Select Class
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              const cls = classes.find((c: any) => c.id === e.target.value);
              if (cls?.sections?.length > 0) {
                setSelectedSectionId(cls.sections[0].id);
              }
            }}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-brand-500 bg-white"
          >
            {classes.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider">
            Select Section
          </label>
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-brand-500 bg-white"
          >
            {sections.map((s: any) => (
              <option key={s.id} value={s.id}>
                Section {s.name} ({s.roomNumber || 'Room N/A'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider">
            Attendance Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Keyboard Shortcuts Hint Bar */}
      <div className="bg-slate-100/80 border border-slate-200 px-3.5 py-2 rounded-xl flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2 text-[11px]">
          <Keyboard className="w-4 h-4 text-slate-500" />
          <span className="font-medium text-slate-700">Desktop Speed Keys:</span>
          <span className="text-slate-500">
            <kbd className="px-1 py-0.2 bg-white border border-slate-300 rounded font-mono text-[10px]">P</kbd> Present •{' '}
            <kbd className="px-1 py-0.2 bg-white border border-slate-300 rounded font-mono text-[10px]">A</kbd> Absent •{' '}
            <kbd className="px-1 py-0.2 bg-white border border-slate-300 rounded font-mono text-[10px]">L</kbd> Late •{' '}
            <kbd className="px-1 py-0.2 bg-white border border-slate-300 rounded font-mono text-[10px]">Space</kbd> Cycle •{' '}
            <kbd className="px-1 py-0.2 bg-white border border-slate-300 rounded font-mono text-[10px]">↓</kbd> /{' '}
            <kbd className="px-1 py-0.2 bg-white border border-slate-300 rounded font-mono text-[10px]">↑</kbd> Navigate
          </span>
        </div>
        {hasUnsavedChanges && (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse border border-amber-300">
            Unsaved Changes
          </span>
        )}
      </div>

      {/* High-Density Roster Table */}
      <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-slate-800">
              {currentClass?.name} - Section {sections.find((s: any) => s.id === selectedSectionId)?.name} Roster
            </span>
            <span className="text-slate-400 tabular-nums">({roster.length} students)</span>
          </div>

          {isMarked && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
              <Check className="w-3.5 h-3.5" /> Marked for {selectedDate}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3 w-16">Roll #</th>
                <th className="py-2.5 px-3 w-32">Admission No</th>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3 text-center">Status Cycle Pill (Click / Tap)</th>
                <th className="py-2.5 px-3 text-right">Direct Buttons</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Loading class roster...
                  </td>
                </tr>
              ) : roster.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No active student enrolments found for this section.
                  </td>
                </tr>
              ) : (
                roster.map((item: any, idx: number) => {
                  const currentStatus = rosterStatus[item.studentId] || AttendanceStatus.PRESENT;
                  const isFocused = idx === focusedRowIndex;

                  let pillStyle = 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100';
                  if (currentStatus === AttendanceStatus.ABSENT) {
                    pillStyle = 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100';
                  } else if (currentStatus === AttendanceStatus.LATE) {
                    pillStyle = 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100';
                  } else if (currentStatus === AttendanceStatus.EXCUSED) {
                    pillStyle = 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100';
                  }

                  return (
                    <tr
                      key={item.studentId}
                      onClick={() => setFocusedRowIndex(idx)}
                      className={`transition-colors cursor-pointer ${
                        isFocused ? 'bg-brand-50/60 ring-1 ring-inset ring-brand-300' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-2 px-3 font-mono font-semibold text-slate-600 tabular-nums">
                        {item.rollNumber ? `#${item.rollNumber}` : '—'}
                      </td>
                      <td className="py-2 px-3 font-mono font-medium text-brand-700">
                        {item.admissionNumber}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900">
                        {item.firstName} {item.lastName}
                        <span className="ml-2 text-[11px] font-normal text-slate-400">({item.gender})</span>
                      </td>

                      {/* The 1-Tap Toggle Pill */}
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            cycleStatus(item.studentId);
                          }}
                          className={`inline-flex items-center justify-center min-w-28 px-3 py-1 rounded-full text-xs font-bold border transition-transform active:scale-95 shadow-2xs ${pillStyle}`}
                          title="Click to cycle status"
                        >
                          {currentStatus}
                        </button>
                      </td>

                      {/* Direct Speed Buttons */}
                      <td className="py-2 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(item.studentId, AttendanceStatus.PRESENT);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              currentStatus === AttendanceStatus.PRESENT
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            P
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(item.studentId, AttendanceStatus.ABSENT);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              currentStatus === AttendanceStatus.ABSENT
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            A
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(item.studentId, AttendanceStatus.LATE);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              currentStatus === AttendanceStatus.LATE
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            L
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sticky Summary & One-Click Save Footer Drawer */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-300 p-3 shadow-lg flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1 font-semibold text-slate-700">
            <span>Roster:</span>
            <span className="font-bold text-slate-900 tabular-nums">{roster.length}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
              <span>Present:</span>
              <strong className="tabular-nums font-bold">{presentCount}</strong>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0"></span>
              <span>Absent:</span>
              <strong className="tabular-nums font-bold">{absentCount}</strong>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0"></span>
              <span>Late:</span>
              <strong className="tabular-nums font-bold">{lateCount}</strong>
            </span>

            {excusedCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                <span>Excused:</span>
                <strong className="tabular-nums font-bold">{excusedCount}</strong>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-[11px] text-amber-700 font-medium hidden sm:inline">
              ● Unsaved changes pending
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending || roster.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saveMutation.isPending ? 'Syncing...' : 'Save & Confirm Attendance'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

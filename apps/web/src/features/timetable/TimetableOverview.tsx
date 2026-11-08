import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  UserCheck,
  AlertTriangle,
  Building,
  User,
  BookOpen,
  X,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  LayoutGrid,
  Info,
  Shield,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { useToast } from '../../components/common/Toast';

const DAYS = [
  { id: 1, label: 'Monday' },
  { id: 2, label: 'Tuesday' },
  { id: 3, label: 'Wednesday' },
  { id: 4, label: 'Thursday' },
  { id: 5, label: 'Friday' },
  { id: 6, label: 'Saturday' },
];

const CALENDAR_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Subject theme color palette
function getSubjectTheme(subjectName: string = '', index: number = 0) {
  const s = subjectName.toLowerCase();
  if (s.includes('math')) {
    return {
      bg: 'bg-emerald-50/90 hover:bg-emerald-100/90',
      border: 'border-l-[3.5px] border-emerald-500',
      text: 'text-emerald-950',
      timeText: 'text-emerald-700',
      dot: 'text-emerald-600',
    };
  }
  if (s.includes('english') || s.includes('lang') || s.includes('lit')) {
    return {
      bg: 'bg-sky-50/90 hover:bg-sky-100/90',
      border: 'border-l-[3.5px] border-sky-500',
      text: 'text-sky-950',
      timeText: 'text-sky-700',
      dot: 'text-sky-600',
    };
  }
  if (s.includes('sci') || s.includes('phys') || s.includes('chem') || s.includes('bio')) {
    return {
      bg: 'bg-pink-50/90 hover:bg-pink-100/90',
      border: 'border-l-[3.5px] border-pink-400',
      text: 'text-pink-950',
      timeText: 'text-pink-700',
      dot: 'text-pink-600',
    };
  }
  if (s.includes('hist') || s.includes('soc') || s.includes('geo') || s.includes('art')) {
    return {
      bg: 'bg-amber-50/90 hover:bg-amber-100/90',
      border: 'border-l-[3.5px] border-amber-400',
      text: 'text-amber-950',
      timeText: 'text-amber-700',
      dot: 'text-amber-600',
    };
  }
  const fallbacks = [
    {
      bg: 'bg-emerald-50/90 hover:bg-emerald-100/90',
      border: 'border-l-[3.5px] border-emerald-500',
      text: 'text-emerald-950',
      timeText: 'text-emerald-700',
      dot: 'text-emerald-600',
    },
    {
      bg: 'bg-sky-50/90 hover:bg-sky-100/90',
      border: 'border-l-[3.5px] border-sky-500',
      text: 'text-sky-950',
      timeText: 'text-sky-700',
      dot: 'text-sky-600',
    },
    {
      bg: 'bg-pink-50/90 hover:bg-pink-100/90',
      border: 'border-l-[3.5px] border-pink-400',
      text: 'text-pink-950',
      timeText: 'text-pink-700',
      dot: 'text-pink-600',
    },
    {
      bg: 'bg-amber-50/90 hover:bg-amber-100/90',
      border: 'border-l-[3.5px] border-amber-400',
      text: 'text-amber-950',
      timeText: 'text-amber-700',
      dot: 'text-amber-600',
    },
    {
      bg: 'bg-violet-50/90 hover:bg-violet-100/90',
      border: 'border-l-[3.5px] border-violet-400',
      text: 'text-violet-950',
      timeText: 'text-violet-700',
      dot: 'text-violet-600',
    },
  ];
  return fallbacks[index % fallbacks.length];
}

// Conflict detection utility
function detectConflicts(entries: any[], newSlot: any): { hasConflict: boolean; conflictingSlots: any[] } {
  const conflicts: any[] = [];
  
  for (const entry of entries) {
    // Check day match
    if (entry.dayOfWeek !== newSlot.dayOfWeek) continue;
    
    // Check time overlap
    const newStart = parseTime(newSlot.startTime);
    const newEnd = parseTime(newSlot.endTime);
    const entryStart = parseTime(entry.startTime);
    const entryEnd = parseTime(entry.endTime);
    
    if (newStart < entryEnd && newEnd > entryStart) {
      conflicts.push(entry);
    }
  }
  
  return {
    hasConflict: conflicts.length > 0,
    conflictingSlots: conflicts,
  };
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export const TimetableOverview: React.FC = () => {
  const queryClient = useQueryClient();
  const { selectedYearId, selectedYear, academicYears } = useAcademic();
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'calendar' | 'matrix'>('calendar');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEntryForSub, setSelectedEntryForSub] = useState<any | null>(null);
  const [activeSlotDetail, setActiveSlotDetail] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { showToast } = useToast();

  // Queries
  const { data: yearsData } = useQuery({
    queryKey: ['years'],
    queryFn: () => api.get<any>('/academics/years'),
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get<any>('/academics/classes'),
  });

  const { data: staffData } = useQuery({
    queryKey: ['staff'],
    queryFn: () => api.get<any>('/staff'),
  });

  const { data: classroomsData } = useQuery({
    queryKey: ['classrooms'],
    queryFn: () => api.get<any>('/timetable/classrooms'),
  });

  const activeYear =
    selectedYear ||
    academicYears.find((y) => y.id === selectedYearId) ||
    yearsData?.data?.find((y: any) => y.id === selectedYearId) ||
    yearsData?.data?.find((y: any) => y.isCurrent) ||
    yearsData?.data?.[0];

  const allSections =
    classesData?.data?.flatMap((c: any) =>
      c.sections.map((s: any) => ({ ...s, className: c.name }))
    ) || [];

  const currentSectionId = selectedSectionId || allSections[0]?.id;

  const { data: timetableData, isLoading } = useQuery({
    queryKey: ['timetable', currentSectionId, activeYear?.id],
    queryFn: () =>
      api.get<any>('/timetable', {
        sectionId: currentSectionId,
        academicYearId: activeYear?.id,
      }),
    enabled: !!currentSectionId && !!activeYear?.id,
  });

  // Subjects for the selected section's class
  const currentClass = classesData?.data?.find((c: any) =>
    c.sections.some((s: any) => s.id === currentSectionId)
  );
  const classSubjects = currentClass?.subjects || [];

  // Add Entry Form state
  const [formData, setFormData] = useState({
    subjectId: '',
    teacherId: '',
    classroomId: '',
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '08:45',
  });

  // Substitution state
  const [substituteTeacherId, setSubstituteTeacherId] = useState('');
  const [substitutionDate, setSubstitutionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [substitutionReason, setSubstitutionReason] = useState('');

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/timetable', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
      setIsAddModalOpen(false);
      setErrorMsg(null);
      setFormData({
        subjectId: '',
        teacherId: '',
        classroomId: '',
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '08:45',
      });
      showToast('Schedule slot added successfully!', 'success');
    },
    onError: (err: any) => {
      const { hasConflict, conflictingSlots } = detectConflicts(
        timetableData?.data || [],
        {
          dayOfWeek: formData.dayOfWeek,
          startTime: formData.startTime,
          endTime: formData.endTime,
        }
      );
      
      if (hasConflict && conflictingSlots.length > 0) {
        setErrorMsg(
          `Schedule conflict detected! ${conflictingSlots.length} overlapping assignment${
            conflictingSlots.length > 1 ? 's' : ''
          } already exist for ${conflictingSlots[0].startTime} - ${conflictingSlots[0].endTime} on ${
            getDayName(conflictingSlots[0].dayOfWeek)
          }.`
        );
        showToast('Schedule conflict: This slot overlaps with an existing assignment', 'error');
      } else {
        setErrorMsg(
          err.message || 'An error occurred while scheduling the slot.'
        );
        showToast(err.message || 'Failed to schedule slot', 'error');
      }
      
      // Extract conflict details if available for debugging
      if (err.conflicts) {
        console.log('Schedule conflicts:', err.conflicts);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/timetable/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
      setActiveSlotDetail(null);
      showToast('Slot deleted successfully!', 'success');
    },
  });

  const substituteMutation = useMutation({
    mutationFn: (data: any) => api.post('/timetable/substitutions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
      setSelectedEntryForSub(null);
      setSubstituteTeacherId('');
      setSubstitutionReason('');
      setActiveSlotDetail(null);
      showToast('Substitute teacher assigned successfully!', 'success');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    createMutation.mutate({
      academicYearId: activeYear?.id,
      sectionId: currentSectionId,
      ...formData,
    });
  };

  const handleSubstitute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntryForSub) return;
    substituteMutation.mutate({
      timetableEntryId: selectedEntryForSub.id,
      substituteTeacherId,
      date: substitutionDate,
      reason: substitutionReason,
    });
  };

  // Calendar Month Navigation
  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const jumpToToday = () => {
    setCurrentDate(new Date());
  };

  // Get day name from dayOfWeek
  const getDayName = (dayOfWeek: number): string => {
    const dayMap: Record<number, string> = {
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
      6: 'Saturday',
      7: 'Sunday',
    };
    return dayMap[dayOfWeek] || 'Unknown';
  };

  // Build calendar matrix (Sundays to Saturdays)
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  interface CalendarCell {
    date: Date;
    dayNumber: number;
    monthLabel?: string;
    isCurrentMonth: boolean;
    isToday: boolean;
    dateKey: string;
    dayOfWeekIso: number; // 1 (Mon) - 7 (Sun)
  }

  const cells: CalendarCell[] = [];

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const dateObj = new Date(year, month - 1, d);
    const prevMonthName = dateObj.toLocaleString('en-US', { month: 'short' });
    cells.push({
      date: dateObj,
      dayNumber: d,
      monthLabel: `${prevMonthName} ${d}`,
      isCurrentMonth: false,
      isToday: false,
      dateKey: dateObj.toISOString().split('T')[0],
      dayOfWeekIso: dateObj.getDay() === 0 ? 7 : dateObj.getDay(),
    });
  }

  // Current month days
  const todayStr = new Date().toISOString().split('T')[0];
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const dateObj = new Date(year, month, d);
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({
      date: dateObj,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateKey === todayStr,
      dateKey,
      dayOfWeekIso: dateObj.getDay() === 0 ? 7 : dateObj.getDay(),
    });
  }

  // Next month leading days (fill to clean 35 or 42 cells)
  const remainingCells = (7 - (cells.length % 7)) % 7;
  const totalTargetCells = cells.length + remainingCells < 35 ? 35 : cells.length + remainingCells;
  const daysToAdd = totalTargetCells - cells.length;

  for (let d = 1; d <= daysToAdd; d++) {
    const dateObj = new Date(year, month + 1, d);
    const nextMonthName = dateObj.toLocaleString('en-US', { month: 'short' });
    cells.push({
      date: dateObj,
      dayNumber: d,
      monthLabel: `${nextMonthName} ${d}`,
      isCurrentMonth: false,
      isToday: false,
      dateKey: dateObj.toISOString().split('T')[0],
      dayOfWeekIso: dateObj.getDay() === 0 ? 7 : dateObj.getDay(),
    });
  }

  const monthYearLabel = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-5" aria-label="Timetable scheduling view">
      {/* Top Header: Schedule title and controls */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80"
        aria-labelledby="schedule-title"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 tracking-tight" id="schedule-title">
            Schedule
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Class timetable, faculty assignments & conflict-free scheduling
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Section selector */}
          <select
            value={currentSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Select class section"
          >
            {allSections.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.className} — Sec {s.name}
              </option>
            ))}
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100/70 p-0.5">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Month Calendar View"
              aria-pressed={viewMode === 'calendar'}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'matrix'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Weekly Matrix View"
              aria-pressed={viewMode === 'matrix'}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Matrix</span>
            </button>
          </div>

          {/* Add Slot Button */}
          <button
            onClick={() => {
              setErrorMsg(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-2xs transition-colors"
            aria-label="Add new timetable slot"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Slot</span>
          </button>
        </div>
      </div>

      {/* Subheader: Month Title and Arrow Controls */}
      {viewMode === 'calendar' && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
              {monthYearLabel}
            </h2>
            <button
              onClick={jumpToToday}
              className="px-2.5 py-0.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-2xs"
              aria-label="Jump to today"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              title="Previous Month"
              className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              title="Next Month"
              className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Calendar Headers: Sun, Mon, Tue, Wed, Thu, Fri, Sat */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center">
            {CALENDAR_HEADERS.map((h, i) => (
              <div
                key={h}
                className={`py-2.5 text-xs font-semibold text-slate-600 ${
                  i !== 0 ? 'border-l border-slate-200' : ''
                }`}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 auto-rows-fr bg-slate-200 gap-px">
            {cells.map((cell, idx) => {
              // Find timetable entries for this cell's day of the week
              const dayEntries =
                timetableData?.data?.filter((e: any) => e.dayOfWeek === cell.dayOfWeekIso) || [];

              return (
                <div
                  key={`${cell.dateKey}-${idx}`}
                  className={`bg-white min-h-[145px] sm:min-h-[160px] p-2 flex flex-col transition-colors ${
                    !cell.isCurrentMonth
                      ? 'bg-slate-50/40 text-slate-300'
                      : 'hover:bg-slate-50/30'
                  }`}
                  aria-label={`Calendar cell for ${cell.monthLabel || cell.dayNumber}`}
                >
                  {/* Day Date Label */}
                  <div className="flex items-center justify-between mb-1.5 leading-none">
                    <span
                      className={`text-xs ${
                        !cell.isCurrentMonth
                          ? 'text-slate-300'
                          : cell.isToday
                          ? 'w-6 h-6 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-[11px] shadow-xs'
                          : 'font-medium text-slate-700'
                      }`}
                    >
                      {cell.monthLabel || cell.dayNumber}
                    </span>

                    {cell.isCurrentMonth && (
                      <button
                        onClick={() => {
                          setFormData({
                            ...formData,
                            dayOfWeek: cell.dayOfWeekIso,
                          });
                          setIsAddModalOpen(true);
                        }}
                        title={`Add slot on ${cell.dateKey}`}
                        className="opacity-0 hover:opacity-100 focus:opacity-100 p-0.5 text-slate-400 hover:text-brand-600 rounded transition-opacity"
                        aria-label={`Add slot on ${cell.dateKey}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Period Cards Container with conflict warnings */}
                  <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto max-h-[135px] pr-0.5 scrollbar-thin">
                    {dayEntries.length > 0 && cell.isCurrentMonth ? (
                      dayEntries.map((slot: any, slotIdx: number) => {
                        const theme = getSubjectTheme(slot.subject?.name, slotIdx);
                        const activeSub = slot.substitutions?.find(
                          (sub: any) => sub.date?.split('T')[0] === cell.dateKey
                        ) || slot.substitutions?.[0];

                        // Check for overlapping periods in the same slot
                        const hasOverlap = dayEntries.some((e: any) => {
                          if (e.id === slot.id) return false;
                          if (e.dayOfWeek !== slot.dayOfWeek) return false;
                          const newStart = parseTime(formData.startTime || slot.startTime);
                          const newEnd = parseTime(formData.endTime || slot.endTime);
                          const entryStart = parseTime(e.startTime);
                          const entryEnd = parseTime(e.endTime);
                          return Math.max(newStart, entryStart) < Math.min(newEnd, entryEnd);
                        });

                        const overlapWarning = hasOverlap && (
                          <div
                            className="absolute top-1 right-1 text-xs font-bold text-rose-600 bg-rose-50 rounded-full w-5 h-5 flex items-center justify-center"
                          >
                            ⚠
                          </div>
                        ) || null;

                        return (
                          <div
                            key={`${slot.id}-${cell.dateKey}`}
                            onClick={() => setActiveSlotDetail(slot)}
                            className={`group relative px-2.5 py-1.5 rounded-md border border-slate-200/60 ${theme.bg} ${theme.border} cursor-pointer transition-all hover:shadow-sm ${
                              hasOverlap ? 'ring-2 ring-rose-500/20' : ''
                            }`}
                            title="Click for slot details or substitution"
                          >
                            {overlapWarning}
                            <div className="flex items-start gap-1.5 min-w-0">
                              {/* Circular indicator icon */}
                              <span
                                className={`w-2.5 h-2.5 rounded-full border border-current shrink-0 mt-0.5 ${theme.dot}`}
                                aria-hidden="true"
                              />

                              <div className="min-w-0 flex-1">
                                <div
                                  className={`text-xs font-semibold leading-snug truncate ${theme.text}`}
                                >
                                  {slot.subject?.name} by {slot.teacher?.firstName}{' '}
                                  {slot.teacher?.lastName?.[0] ? `${slot.teacher.lastName[0]}` : ''}
                                </div>
                                <div
                                  className={`text-[10px] sm:text-[11px] font-mono leading-tight mt-0.5 ${theme.timeText}`}
                                >
                                  {slot.startTime}:00 - {slot.endTime}:00
                                </div>
                              </div>
                            </div>

                            {/* Active substitute indicator */}
                            {activeSub && (
                              <div className="mt-1 text-[10px] font-medium text-amber-800 bg-amber-100/70 px-1 py-0.5 rounded flex items-center gap-1">
                                <UserCheck className="w-2.5 h-2.5" aria-hidden="true" />
                                <span className="truncate">
                                  Sub: {activeSub.substituteTeacher?.firstName}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SLOT DETAIL & ACTION DRAWER */}
      {activeSlotDetail && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          aria-labelledby="slot-detail-title"
        >
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-sm text-slate-900" id="slot-detail-title">
                Period Slot Details
              </h3>
              <button
                onClick={() => setActiveSlotDetail(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                aria-label="Close slot details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Subject
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {activeSlotDetail.subject?.name} ({activeSlotDetail.subject?.code})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Time
                  </span>
                  <span className="font-medium text-slate-800">
                    {activeSlotDetail.startTime} - {activeSlotDetail.endTime}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Section
                  </span>
                  <span className="font-medium text-slate-800">
                    {activeSlotDetail.section?.class?.name} - {activeSlotDetail.section?.name}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Primary Teacher
                </span>
                <span className="font-medium text-slate-800">
                  {activeSlotDetail.teacher?.firstName} {activeSlotDetail.teacher?.lastName} (
                  {activeSlotDetail.teacher?.designation})
                </span>
              </div>

              {activeSlotDetail.classroom && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Room
                  </span>
                  <span className="font-medium text-slate-800">
                    {activeSlotDetail.classroom?.name}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => deleteMutation.mutate(activeSlotDetail.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-medium"
                aria-label={`Delete slot ${activeSlotDetail.id}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Slot</span>
              </button>

              <button
                onClick={() => {
                  setSelectedEntryForSub(activeSlotDetail);
                  setActiveSlotDetail(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium"
                aria-label="Assign substitute teacher"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Assign Substitute</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Slot Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          aria-modal="true"
          aria-label="Add timetable slot"
        >
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">
                Schedule Timetable Period
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Day of Week
                  </label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) =>
                      setFormData({ ...formData, dayOfWeek: Number(e.target.value) })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
                    aria-label="Select day of week"
                  >
                    {DAYS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Subject
                  </label>
                  <select
                    required
                    value={formData.subjectId}
                    onChange={(e) =>
                      setFormData({ ...formData, subjectId: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
                    aria-label="Select subject"
                  >
                    <option value="">Select subject...</option>
                    {classSubjects.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Teacher
                </label>
                <select
                  required
                  value={formData.teacherId}
                  onChange={(e) =>
                    setFormData({ ...formData, teacherId: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
                  aria-label="Select teacher"
                >
                  <option value="">Assign teacher...</option>
                  {staffData?.data?.map((st: any) => (
                    <option key={st.id} value={st.id}>
                      {st.firstName} {st.lastName} ({st.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Classroom (Optional)
                </label>
                <select
                  value={formData.classroomId}
                  onChange={(e) =>
                    setFormData({ ...formData, classroomId: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
                  aria-label="Select classroom"
                >
                  <option value="">No specific room / Regular section room</option>
                  {classroomsData?.data?.map((cr: any) => (
                    <option key={cr.id} value={cr.id}>
                      {cr.name} (Cap: {cr.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
                    aria-label="Start time"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
                    aria-label="End time"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  aria-label="Cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 shadow-2xs disabled:opacity-50"
                  aria-disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Verifying clashes...' : 'Confirm Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Substitute Modal */}
      {selectedEntryForSub && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          aria-modal="true"
          aria-label="Assign substitute teacher"
        >
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">
                Assign Substitute Teacher
              </h2>
              <button
                onClick={() => setSelectedEntryForSub(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-3 p-3 rounded-lg bg-slate-50 text-xs text-slate-600">
              Period:{' '}
              <span className="font-semibold text-slate-900">
                {selectedEntryForSub.subject.name}
              </span>{' '}
              ({selectedEntryForSub.startTime} - {selectedEntryForSub.endTime})
              <br />
              Original Teacher:{' '}
              <span className="font-semibold text-slate-900">
                {selectedEntryForSub.teacher.firstName} {selectedEntryForSub.teacher.lastName}
              </span>
            </div>

            <form onSubmit={handleSubstitute} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={substitutionDate}
                  onChange={(e) => setSubstitutionDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                  aria-label="Substitution date"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Substitute Teacher
                </label>
                <select
                  required
                  value={substituteTeacherId}
                  onChange={(e) => setSubstituteTeacherId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                  aria-label="Select substitute teacher"
                >
                  <option value="">Select substitute teacher...</option>
                  {staffData?.data
                    ?.filter((st: any) => st.id !== selectedEntryForSub.teacherId)
                    .map((st: any) => (
                      <option key={st.id} value={st.id}>
                        {st.firstName} {st.lastName} ({st.designation})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Medical leave, On duty"
                  value={substitutionReason}
                  onChange={(e) => setSubstitutionReason(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                  aria-label="Substitution reason"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedEntryForSub(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  aria-label="Cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={substituteMutation.isPending}
                  className="px-4 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 disabled:opacity-50"
                  aria-disabled={substituteMutation.isPending}
                >
                  {substituteMutation.isPending ? 'Assigning...' : 'Confirm Substitution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
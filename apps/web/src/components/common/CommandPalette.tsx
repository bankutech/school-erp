import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  Search,
  Command,
  ArrowRight,
  User,
  GraduationCap,
  CalendarCheck,
  Receipt,
  BookOpen,
  Calendar,
  Award,
  FileCheck,
  Bell,
  Briefcase,
  BookMarked,
  Bus,
  Boxes,
  TrendingUp,
  BarChart3,
  UserCog,
  FileText,
  PlusCircle,
  X,
  CornerDownLeft,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Academics' | 'Students' | 'Finance' | 'Institution' | 'Actions' | 'Live Students';
  icon: React.ElementType;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Live Student Search query when query is >= 2 chars
  const { data: studentResults } = useQuery({
    queryKey: ['palette-student-search', query],
    queryFn: async () => {
      if (!query || query.trim().length < 2) return [];
      const res = await api.get<any>('/students', { search: query.trim(), limit: 5 });
      return res?.data || [];
    },
    enabled: isOpen && query.trim().length >= 2,
  });

  const staticCommands: CommandItem[] = [
    // Core Academics
    {
      id: 'nav-attendance',
      title: 'Daily Attendance Register',
      subtitle: 'Mark section roster (90-second workflow)',
      category: 'Academics',
      icon: CalendarCheck,
      action: () => {
        navigate('/attendance');
        onClose();
      },
    },
    {
      id: 'nav-timetable',
      title: 'Timetable & Class Schedule',
      subtitle: 'Class weekly grid & conflict management',
      category: 'Academics',
      icon: Calendar,
      action: () => {
        navigate('/timetable');
        onClose();
      },
    },
    {
      id: 'nav-exams',
      title: 'Exams, Grading & Report Cards',
      subtitle: 'Spreadsheet marks entry & report cards',
      category: 'Academics',
      icon: Award,
      action: () => {
        navigate('/exams');
        onClose();
      },
    },
    {
      id: 'nav-lms',
      title: 'Coursework & LMS Assignments',
      subtitle: 'Homework submissions & grading',
      category: 'Academics',
      icon: FileCheck,
      action: () => {
        navigate('/lms');
        onClose();
      },
    },
    {
      id: 'nav-academics',
      title: 'Academic Structure & Curriculum',
      subtitle: 'Classes, sections, and subjects setup',
      category: 'Academics',
      icon: BookOpen,
      action: () => {
        navigate('/academics');
        onClose();
      },
    },

    // Student Lifecycle
    {
      id: 'nav-students',
      title: 'Student Information System (SIS)',
      subtitle: '360° student directory & certificates',
      category: 'Students',
      icon: User,
      action: () => {
        navigate('/students');
        onClose();
      },
    },
    {
      id: 'nav-admissions',
      title: 'Admissions Pipeline & Enrolment',
      subtitle: 'Review incoming admission applications',
      category: 'Students',
      icon: GraduationCap,
      action: () => {
        navigate('/admissions');
        onClose();
      },
    },

    // Finance & Operations
    {
      id: 'nav-fees',
      title: 'Fees, Billing & Cashier Desk',
      subtitle: 'Unified household collection & printable receipts',
      category: 'Finance',
      icon: Receipt,
      action: () => {
        navigate('/fees');
        onClose();
      },
    },
    {
      id: 'nav-accounts',
      title: 'Accounts Ledger & Expenditure',
      subtitle: 'Operational surplus & CSV report exports',
      category: 'Finance',
      icon: TrendingUp,
      action: () => {
        navigate('/accounts');
        onClose();
      },
    },
    {
      id: 'nav-analytics',
      title: 'Institutional Analytics & Cockpit',
      subtitle: 'Telemetry, fee run-rate, attendance heatmap & benchmarks',
      category: 'Finance',
      icon: BarChart3,
      action: () => {
        navigate('/analytics');
        onClose();
      },
    },
    {
      id: 'nav-library',
      title: 'Library Circulation & Fines',
      subtitle: 'Book copy barcode issues & return audits',
      category: 'Finance',
      icon: BookMarked,
      action: () => {
        navigate('/library');
        onClose();
      },
    },
    {
      id: 'nav-transport',
      title: 'Transport Fleet & Route Roster',
      subtitle: 'Vehicle capacity & student allocations',
      category: 'Finance',
      icon: Bus,
      action: () => {
        navigate('/transport');
        onClose();
      },
    },
    {
      id: 'nav-inventory',
      title: 'Asset Inventory & Stock Movements',
      subtitle: 'Warehouse inventory items & logs',
      category: 'Finance',
      icon: Boxes,
      action: () => {
        navigate('/inventory');
        onClose();
      },
    },

    // Institution & Governance
    {
      id: 'nav-staff',
      title: 'Staff HR & Monthly Payroll',
      subtitle: 'Employee directory, leave reviews & payslips',
      category: 'Institution',
      icon: Briefcase,
      action: () => {
        navigate('/staff');
        onClose();
      },
    },
    {
      id: 'nav-communication',
      title: 'Circulars & Official Broadcasts',
      subtitle: 'Targeted notices for staff, parents, students',
      category: 'Institution',
      icon: Bell,
      action: () => {
        navigate('/communication');
        onClose();
      },
    },
    {
      id: 'nav-users',
      title: 'User Accounts & Role Governance',
      subtitle: 'RBAC permissions & session revocation',
      category: 'Institution',
      icon: UserCog,
      action: () => {
        navigate('/users');
        onClose();
      },
    },
    {
      id: 'nav-audit',
      title: 'Security Audit Trail',
      subtitle: 'Tamper-evident system activity log',
      category: 'Institution',
      icon: FileText,
      action: () => {
        navigate('/audit');
        onClose();
      },
    },
  ];

  // Map student search hits to CommandItems
  const dynamicStudentCommands: CommandItem[] = (studentResults || []).map((s: any) => ({
    id: `student-${s.id}`,
    title: `${s.firstName} ${s.lastName}`,
    subtitle: `Adm: ${s.admissionNumber} • ${s.enrolments?.[0]?.class?.name || 'Class N/A'}`,
    category: 'Live Students',
    icon: User,
    action: () => {
      navigate(`/students?search=${encodeURIComponent(s.admissionNumber)}`);
      onClose();
    },
  }));

  const allFilteredCommands = [
    ...dynamicStudentCommands,
    ...staticCommands.filter((cmd) => {
      const q = query.toLowerCase();
      return (
        cmd.title.toLowerCase().includes(q) ||
        (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q)) ||
        cmd.category.toLowerCase().includes(q)
      );
    }),
  ];

  // Keyboard navigation inside palette
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, allFilteredCommands.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allFilteredCommands.length) % Math.max(1, allFilteredCommands.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allFilteredCommands[selectedIndex]) {
          allFilteredCommands[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, allFilteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[75vh] animate-in fade-in-50 zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 gap-3 bg-slate-50/50">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search students, class rosters, fee billing, or system tools..."
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <div className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-200 text-slate-600">
              ESC
            </span>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results Stream */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100">
          {allFilteredCommands.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Command className="w-6 h-6 mx-auto mb-2 text-slate-300" />
              <span>No matching records or tools found for "{query}".</span>
            </div>
          ) : (
            allFilteredCommands.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                    isSelected ? 'bg-brand-50 border border-brand-200/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate flex items-center gap-2">
                        <span>{item.title}</span>
                        {item.category === 'Live Students' && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-normal">
                            Student Profile
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-slate-500 truncate font-mono mt-0.5">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                      {item.category}
                    </span>
                    {isSelected && <CornerDownLeft className="w-3.5 h-3.5 text-brand-600" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 rounded bg-white border border-slate-300 font-mono text-[10px]">↑</kbd>{' '}
              <kbd className="px-1 py-0.5 rounded bg-white border border-slate-300 font-mono text-[10px]">↓</kbd> to
              navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded bg-white border border-slate-300 font-mono text-[10px]">↵</kbd> to
              select
            </span>
          </div>
          <span className="text-slate-400 font-medium">Search-First Navigation</span>
        </div>
      </div>
    </div>
  );
};

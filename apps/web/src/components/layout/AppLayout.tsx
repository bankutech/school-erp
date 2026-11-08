import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useAcademic } from '../../context/AcademicContext';
import { api } from '../../lib/api';
import { CommandPalette } from '../common/CommandPalette';
import { FrappeLogoMark } from '../common/FrappeLogo';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
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
  LogOut,
  Menu,
  X,
  School,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  UserCog,
  FileText,
  Check,
  CheckCheck,
  Circle,
  Clock,
  ChevronLeft,
  Search,
  AlertTriangle,
  Plus,
  Zap,
  CreditCard,
  UserPlus,
} from 'lucide-react';
import { PERMISSIONS, UserRoleType } from '@school-erp/shared';

const DEMO_PERSONAS = [
  {
    role: UserRoleType.SUPER_ADMIN,
    name: 'Dr. Amitabh Sen',
    title: 'Super Administrator',
    email: 'admin@school.erp',
    badge: 'bg-rose-50 text-rose-800 border-rose-200',
    avatar: 'A',
  },
  {
    role: UserRoleType.PRINCIPAL,
    name: 'Dr. Meenakshi Sundaram',
    title: 'Principal & Academic Head',
    email: 'principal@school.erp',
    badge: 'bg-purple-50 text-purple-800 border-purple-200',
    avatar: 'M',
  },
  {
    role: UserRoleType.TEACHER,
    name: 'Vikram Sharma',
    title: 'Senior Mathematics Teacher',
    email: 'teacher@school.erp',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    avatar: 'V',
  },
  {
    role: UserRoleType.ACCOUNTANT,
    name: 'Rajesh Verma',
    title: 'Senior Accountant / Bursar',
    email: 'accountant@school.erp',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    avatar: 'R',
  },
  {
    role: UserRoleType.PARENT,
    name: 'Suresh Patel',
    title: 'Guardian (Aarav & Priya)',
    email: 'parent@school.erp',
    badge: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    avatar: 'S',
  },
  {
    role: UserRoleType.STUDENT,
    name: 'Aarav Patel',
    title: 'Student (Grade 10-A)',
    email: 'student@school.erp',
    badge: 'bg-violet-50 text-violet-800 border-violet-200',
    avatar: 'A',
  },
];

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export const AppLayout: React.FC = () => {
  const { user, login, logout, hasPermission } = useAuth();
  const {
    academicYears,
    selectedYearId,
    selectedYear,
    setSelectedYearId,
    isCurrentYear,
    resetToActiveYear,
    isLoadingYears,
  } = useAcademic();

  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showNotificationTray, setShowNotificationTray] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isPersonaOpen, setIsPersonaOpen] = useState(false);
  const [isSwitchingPersona, setIsSwitchingPersona] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const notificationTrayRef = useRef<HTMLDivElement>(null);
  const quickActionRef = useRef<HTMLDivElement>(null);
  const personaDropdownRef = useRef<HTMLDivElement>(null);

  // Global Command + K / Ctrl + K listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        if (showNotificationTray) setShowNotificationTray(false);
        if (isMobileMenuOpen) setIsMobileMenuOpen(false);
        if (isQuickActionOpen) setIsQuickActionOpen(false);
        if (isPersonaOpen) setIsPersonaOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showNotificationTray, isMobileMenuOpen, isQuickActionOpen, isPersonaOpen]);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationTrayRef.current &&
        !notificationTrayRef.current.contains(event.target as Node)
      ) {
        setShowNotificationTray(false);
      }
      if (
        quickActionRef.current &&
        !quickActionRef.current.contains(event.target as Node)
      ) {
        setIsQuickActionOpen(false);
      }
      if (
        personaDropdownRef.current &&
        !personaDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPersonaOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSwitchPersona = async (persona: typeof DEMO_PERSONAS[0]) => {
    setIsSwitchingPersona(true);
    try {
      await login(persona.email, 'Password@123', true);
      await queryClient.invalidateQueries();
      setIsPersonaOpen(false);
    } catch (err) {
      console.error('Failed to switch persona:', err);
    } finally {
      setIsSwitchingPersona(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Live Notifications Query
  const { data: notificationData } = useQuery({
    queryKey: ['my-notifications'],
    queryFn: async () => {
      const res = await api.get<{
        success: boolean;
        data: {
          notifications: NotificationItem[];
          unreadCount: number;
        };
      }>('/notifications');
      return res.data;
    },
    refetchInterval: 20000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/mark-all-read'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-notifications'] }),
  });

  // Re-architected 4 Logical Task Clusters (Deliverable 1)
  const operationalHubs = [
    {
      id: 'academics',
      label: 'Academics',
      items: [
        {
          to: '/attendance',
          label: 'Daily Attendance',
          icon: CalendarCheck,
          visible: hasPermission(PERMISSIONS.ATTENDANCE_READ),
        },
        {
          to: '/exams',
          label: 'Gradebook & Exams',
          icon: Award,
          visible: hasPermission(PERMISSIONS.EXAMS_READ),
        },
        {
          to: '/timetable',
          label: 'Class Timetables',
          icon: Calendar,
          visible: hasPermission(PERMISSIONS.TIMETABLE_READ),
        },
        {
          to: '/lms',
          label: 'Coursework (LMS)',
          icon: FileCheck,
          visible: hasPermission(PERMISSIONS.LMS_READ),
        },
        {
          to: '/academics',
          label: 'Programs & Setup',
          icon: BookOpen,
          visible: hasPermission(PERMISSIONS.ACADEMIC_READ),
        },
      ],
    },
    {
      id: 'admissions-people',
      label: 'Admissions & People',
      items: [
        {
          to: '/admissions',
          label: 'Application Pipeline',
          icon: GraduationCap,
          visible: hasPermission(PERMISSIONS.ADMISSIONS_READ),
        },
        {
          to: '/students',
          label: 'Student Directory',
          icon: Users,
          visible: hasPermission(PERMISSIONS.STUDENTS_READ),
        },
        {
          to: '/staff',
          label: 'Faculty & Staff',
          icon: Briefcase,
          visible: hasPermission(PERMISSIONS.STAFF_READ),
        },
        {
          to: '/communication',
          label: 'Circulars & Notices',
          icon: Bell,
          visible: hasPermission(PERMISSIONS.COMMUNICATION_READ),
        },
      ],
    },
    {
      id: 'finance-bursar',
      label: 'Finance & Bursar',
      items: [
        {
          to: '/fees',
          label: 'Tuition & Invoicing',
          icon: Receipt,
          visible: hasPermission(PERMISSIONS.FEES_READ),
        },
        {
          to: '/accounts',
          label: 'Financial Ledger',
          icon: TrendingUp,
          visible: hasPermission(PERMISSIONS.ACCOUNTS_READ),
        },
        {
          to: '/analytics',
          label: 'Financial Analytics',
          icon: BarChart3,
          visible:
            hasPermission(PERMISSIONS.ACCOUNTS_READ) ||
            hasPermission(PERMISSIONS.ACADEMIC_READ) ||
            user?.role === UserRoleType.SUPER_ADMIN ||
            user?.role === UserRoleType.PRINCIPAL,
        },
      ],
    },
    {
      id: 'campus-governance',
      label: 'Campus Operations & Governance',
      items: [
        {
          to: '/transport',
          label: 'Transport & Fleet',
          icon: Bus,
          visible: hasPermission(PERMISSIONS.TRANSPORT_READ),
        },
        {
          to: '/library',
          label: 'Library & Catalog',
          icon: BookMarked,
          visible: hasPermission(PERMISSIONS.LIBRARY_READ),
        },
        {
          to: '/inventory',
          label: 'Asset Inventory',
          icon: Boxes,
          visible: hasPermission(PERMISSIONS.INVENTORY_READ),
        },
        {
          to: '/users',
          label: 'RBAC User Directory',
          icon: UserCog,
          visible:
            user?.role === UserRoleType.SUPER_ADMIN ||
            user?.role === UserRoleType.PRINCIPAL,
        },
        {
          to: '/audit',
          label: 'Security Audit Trails',
          icon: ShieldCheck,
          visible:
            user?.role === UserRoleType.SUPER_ADMIN ||
            user?.role === UserRoleType.PRINCIPAL,
        },
      ],
    },
  ];

  const roleBadgeColor: Record<string, string> = {
    [UserRoleType.SUPER_ADMIN]: 'bg-rose-50 text-rose-800 border-rose-200',
    [UserRoleType.PRINCIPAL]: 'bg-purple-50 text-purple-800 border-purple-200',
    [UserRoleType.ADMINISTRATOR]: 'bg-blue-50 text-blue-800 border-blue-200',
    [UserRoleType.TEACHER]: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    [UserRoleType.ACCOUNTANT]: 'bg-amber-50 text-amber-800 border-amber-200',
    [UserRoleType.HR_MANAGER]: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    [UserRoleType.LIBRARIAN]: 'bg-teal-50 text-teal-800 border-teal-200',
    [UserRoleType.TRANSPORT_MANAGER]: 'bg-orange-50 text-orange-800 border-orange-200',
    [UserRoleType.PARENT]: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    [UserRoleType.STUDENT]: 'bg-violet-50 text-violet-800 border-violet-200',
  };

  // Compute current route label and workspace hub for Frappe Education breadcrumbs
  const allNavFlat = [
    { to: '/dashboard', label: 'Dashboard' },
    ...operationalHubs.flatMap((h) => h.items),
  ];
  const currentNav = allNavFlat.find((item) => location.pathname.startsWith(item.to));
  const currentHub = operationalHubs.find((h) =>
    h.items.some((i) => location.pathname.startsWith(i.to))
  );
  const pageTitle = currentNav ? currentNav.label : 'Dashboard';

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-slate-50 text-slate-800 font-sans antialiased">
      {/* Search-First Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Desktop Sidebar (Fixed & Independently Scrollable) */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-200 shrink-0 select-none z-30 ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Institutional Brand Header */}
        <div className="h-14 flex items-center justify-between px-3.5 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <FrappeLogoMark size={28} />
            {!isSidebarCollapsed && (
              <div className="truncate">
                <div className="font-serif font-bold text-white text-sm tracking-tight leading-none">
                  SRM Academy
                </div>
                <div className="text-[10px] font-mono tracking-wider uppercase text-indigo-300/80 mt-1">Institutional ERP</div>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Hubs List (Independently Scrollable with bounded min-h-0) */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2.5 py-3 space-y-3 sidebar-scroll">
          {/* Dashboard root anchor */}
          <div>
            <NavLink
              to="/dashboard"
              title={isSidebarCollapsed ? 'Dashboard Overview' : undefined}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-700 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Dashboard Overview</span>}
            </NavLink>
          </div>

          {/* 4 Operational Hubs with collapsible sections */}
          {operationalHubs.map((hub) => {
            const visibleItems = hub.items.filter((item) => item.visible);
            if (visibleItems.length === 0) return null;
            const isSectionCollapsed = !!collapsedSections[hub.id];

            return (
              <div key={hub.id} className="pt-1">
                {!isSidebarCollapsed ? (
                  <button
                    onClick={() => toggleSection(hub.id)}
                    className="w-full flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 py-1 rounded hover:text-slate-200 transition-colors"
                  >
                    <span>{hub.label}</span>
                    {isSectionCollapsed ? (
                      <ChevronRight className="w-3 h-3 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-slate-500" />
                    )}
                  </button>
                ) : (
                  <div className="border-t border-slate-800/80 my-2" />
                )}

                {(!isSidebarCollapsed && !isSectionCollapsed) || isSidebarCollapsed ? (
                  <nav className="space-y-0.5 mt-0.5">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          title={isSidebarCollapsed ? item.label : undefined}
                          className={({ isActive }) =>
                            `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              isActive
                                ? 'bg-brand-700 text-white font-semibold shadow-sm'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`
                          }
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                        </NavLink>
                      );
                    })}
                  </nav>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Sidebar Fixed Footer: User Profile & Permanent Sign Out */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/90 backdrop-blur-xs shrink-0 sticky bottom-0 z-20">
          {!isSidebarCollapsed ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/80 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {user?.firstName?.[0] || 'U'}
                  {user?.lastName?.[0] || ''}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white truncate leading-tight">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate font-mono mt-0.5">
                    {user?.email}
                  </div>
                </div>
              </div>

              {/* Dedicated Fixed Sign Out Button */}
              <button
                onClick={handleLogout}
                title="Sign Out of SRM Academy"
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-900/60 transition-all cursor-pointer group shadow-2xs"
                aria-label="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-400 transition-colors shrink-0" />
                <span className="group-hover:text-rose-200 transition-colors">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="w-full flex justify-center p-2 text-slate-400 hover:text-white hover:bg-rose-950/60 border border-transparent hover:border-rose-900/60 rounded-lg transition-colors cursor-pointer"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4 text-slate-400 hover:text-rose-400" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Application Area (Fixed height with independent scroll) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 bg-white border-b border-slate-200 px-3 sm:px-4 md:px-6 flex items-center justify-between shrink-0 z-20 shadow-xs">
          {/* Left: Mobile Toggle & Frappe Breadcrumbs */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Brand Logo Mark */}
            <FrappeLogoMark size={24} className="hidden sm:inline-flex" />

            <div className="flex items-center gap-1.5 text-xs truncate">
              <span className="font-semibold text-slate-800 shrink-0">
                SRM Academy
              </span>
              {currentHub && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-500 hidden lg:inline shrink-0">{currentHub.label}</span>
                </>
              )}
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-700 truncate">{pageTitle}</span>
            </div>
          </div>

          {/* Center: Command Palette Trigger Button */}
          <div className="hidden md:flex items-center mx-2">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-100/70 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors text-xs w-56 lg:w-72 shadow-2xs"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="flex-1 text-left text-slate-500 truncate">
                Search or type a command (⌘ + K)
              </span>
            </button>
          </div>

          {/* Right: Academic Context Anchor, Quick Actions, Notification Tray & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Actions Dropdown (Deliverable 1) */}
            <div className="relative" ref={quickActionRef}>
              <button
                onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-700 hover:bg-brand-800 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                aria-label="Quick Actions"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Quick Action</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {isQuickActionOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200/90 rounded-xl shadow-xl z-50 p-1.5 text-xs">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Fast Institutional Actions
                  </div>
                  <button
                    onClick={() => {
                      navigate('/attendance');
                      setIsQuickActionOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition-colors text-left cursor-pointer"
                  >
                    <CalendarCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-semibold">Mark Attendance</div>
                      <div className="text-[10px] text-slate-400">Daily classroom roll-call</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/fees');
                      setIsQuickActionOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition-colors text-left cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4 text-brand-600 shrink-0" />
                    <div>
                      <div className="font-semibold">Collect Fee</div>
                      <div className="text-[10px] text-slate-400">Generate receipt & ledger entry</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/admissions');
                      setIsQuickActionOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition-colors text-left cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-sky-600 shrink-0" />
                    <div>
                      <div className="font-semibold">New Admission</div>
                      <div className="text-[10px] text-slate-400">Applicant intake review</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/exams');
                      setIsQuickActionOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition-colors text-left cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <div className="font-semibold">Schedule Exam</div>
                      <div className="text-[10px] text-slate-400">Gradebook & term marks</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* The Global Institutional Context Anchor */}
            <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 bg-slate-100/80 border border-slate-200 rounded-lg text-xs text-slate-700 max-w-[150px] sm:max-w-none">
              <ShieldCheck
                className={`w-3.5 h-3.5 shrink-0 ${
                  isCurrentYear ? 'text-emerald-600' : 'text-amber-600'
                }`}
              />
              <select
                value={selectedYearId}
                onChange={(e) => setSelectedYearId(e.target.value)}
                disabled={isLoadingYears || academicYears.length === 0}
                className="bg-transparent font-medium focus:outline-none cursor-pointer text-slate-800 text-xs truncate"
                aria-label="Select Academic Year"
              >
                {academicYears.length > 0 ? (
                  academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      AY {year.name} {year.isCurrent ? '(Active)' : '(Archived)'}
                    </option>
                  ))
                ) : (
                  <option value="">AY 2026-27 (Active)</option>
                )}
              </select>
            </div>

            {/* Notification Tray Popover */}
            <div className="relative" ref={notificationTrayRef}>
              <button
                onClick={() => setShowNotificationTray(!showNotificationTray)}
                className="relative p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {(notificationData?.unreadCount ?? 0) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                    {notificationData!.unreadCount > 9 ? '9+' : notificationData!.unreadCount}
                  </span>
                )}
              </button>

              {showNotificationTray && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden text-xs">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <Bell className="w-3.5 h-3.5 text-brand-700" />
                      <span>Notifications</span>
                      {(notificationData?.unreadCount ?? 0) > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-brand-100 text-brand-700 font-semibold tabular-nums">
                          {notificationData!.unreadCount} new
                        </span>
                      )}
                    </div>
                    {(notificationData?.unreadCount ?? 0) > 0 && (
                      <button
                        onClick={() => markAllReadMutation.mutate()}
                        disabled={markAllReadMutation.isPending}
                        className="inline-flex items-center gap-1 text-[11px] text-brand-700 hover:text-brand-800 font-medium cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {!notificationData?.notifications?.length ? (
                      <div className="py-8 text-center text-slate-400">
                        <Bell className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        <div>No new notifications</div>
                      </div>
                    ) : (
                      notificationData.notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 transition-colors flex items-start justify-between gap-2 ${
                            !n.isRead ? 'bg-brand-50/30' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              {!n.isRead && (
                                <Circle className="w-2 h-2 fill-brand-600 text-brand-600 shrink-0" />
                              )}
                              <span
                                className={`text-xs ${
                                  !n.isRead ? 'font-semibold text-slate-900' : 'text-slate-700'
                                }`}
                              >
                                {n.title}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                              {n.message}
                            </p>
                            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                {new Date(n.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                          {!n.isRead && (
                            <button
                              onClick={() => markReadMutation.mutate(n.id)}
                              title="Mark read"
                              className="p-1 text-slate-400 hover:text-emerald-600 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Persona Switcher Dropdown */}
            <div className="relative" ref={personaDropdownRef}>
              <button
                onClick={() => setIsPersonaOpen(!isPersonaOpen)}
                disabled={isSwitchingPersona}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all text-xs cursor-pointer shadow-2xs"
                title="Switch institutional demo persona"
                aria-label="Switch Persona"
              >
                <div className="w-6 h-6 rounded-full bg-brand-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  {isSwitchingPersona ? (
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    user?.firstName?.[0] || 'U'
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-semibold text-slate-800 text-[11px] leading-tight">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                    {user?.role}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {isPersonaOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 text-xs">
                  <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                    <div className="font-bold text-slate-900 text-xs">Demo Persona Switcher</div>
                    <div className="text-[10px] text-slate-500">Switch role instantly to test RBAC & workflows</div>
                  </div>
                  <div className="space-y-1">
                    {DEMO_PERSONAS.map((p) => {
                      const isActive = user?.email === p.email;
                      return (
                        <button
                          key={p.email}
                          onClick={() => handleSwitchPersona(p)}
                          disabled={isActive || isSwitchingPersona}
                          className={`w-full flex items-center justify-between p-2 rounded-lg transition-all text-left cursor-pointer ${
                            isActive
                              ? 'bg-brand-50 border border-brand-200'
                              : 'hover:bg-slate-50 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                              {p.avatar}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-800 text-xs truncate">
                                {p.name}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {p.title}
                              </div>
                            </div>
                          </div>
                          {isActive && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-700 text-white shrink-0">
                              Active
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between px-1">
                    <span className="text-[10px] text-slate-400 font-mono">Password@123</span>
                    <button
                      onClick={handleLogout}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Global Institutional Context Warning Banner (If Historical/Non-Active Session Selected) */}
        {!isCurrentYear && selectedYear && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-900 font-medium">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Context Warning:</strong> You are currently viewing records for{' '}
                <span className="font-semibold underline">Academic Year {selectedYear.name}</span>. Modifications
                will alter archived institutional records.
              </span>
            </div>
            <button
              onClick={resetToActiveYear}
              className="text-[11px] underline font-bold hover:text-amber-800 ml-3 shrink-0 cursor-pointer"
            >
              Reset to Active Year
            </button>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Slide-out Drawer Panel */}
            <div className="relative w-72 max-w-[85vw] bg-slate-900 text-slate-300 flex flex-col h-full shadow-2xl z-10 border-r border-slate-800">
              {/* Drawer Header */}
              <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/50">
                <div className="flex items-center gap-2.5">
                  <FrappeLogoMark size={28} />
                  <div>
                    <div className="font-serif font-bold text-white text-sm">SRM Academy</div>
                    <div className="text-[10px] font-mono tracking-wider uppercase text-indigo-300/80">Institutional ERP</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body (Independently Scrollable with min-h-0) */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4 sidebar-scroll">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsCommandPaletteOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  <Search className="w-4 h-4 text-slate-400" />
                  <span>Search tools & records (Ctrl+K)</span>
                </button>

                <div>
                  <NavLink
                    to="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-brand-700 text-white font-semibold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`
                    }
                  >
                    <LayoutDashboard className="w-4 h-4 shrink-0" />
                    <span>Dashboard Overview</span>
                  </NavLink>
                </div>

                {operationalHubs.map((hub) => {
                  const visible = hub.items.filter((i) => i.visible);
                  if (visible.length === 0) return null;

                  return (
                    <div key={hub.id}>
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 px-1">
                        {hub.label}
                      </div>
                      <div className="space-y-0.5">
                        {visible.map((item) => (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                isActive
                                  ? 'bg-brand-700 text-white font-semibold'
                                  : 'text-slate-300 hover:bg-slate-800'
                              }`
                            }
                          >
                            <item.icon className="w-4 h-4 shrink-0" />
                            <span>{item.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Drawer Fixed Footer */}
              <div className="p-3 border-t border-slate-800 bg-slate-950/90 shrink-0 sticky bottom-0 z-20">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="truncate">
                    <div className="text-xs font-semibold text-white">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{user?.email || user?.role}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-300 hover:text-white bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-900/60 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/70">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

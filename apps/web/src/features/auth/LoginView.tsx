import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { FrappeLogoMark } from '../../components/common/FrappeLogo';
import {
  School,
  Mail,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Phone,
  GraduationCap,
  Building2,
  Users,
  Award,
  HelpCircle,
  X,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Sparkles,
  Clock,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Check,
  Shield,
  Activity,
  Layers,
  FileText,
} from 'lucide-react';

type PortalRole = 'admin' | 'parent' | 'student';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSessionActive, setKeepSessionActive] = useState(false); // Unchecked by default for shared terminal safety
  const [portalCategory, setPortalCategory] = useState<PortalRole>('admin');
  const [parentAuthMode, setParentAuthMode] = useState<'otp' | 'password'>('password');

  // UI & Validation State
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [otpExpiryInfo, setOtpExpiryInfo] = useState<string | null>(null);
  const [otpTimer, setOtpTimer] = useState<number | null>(null);

  // Demo Persona Collapsible Drawer
  const [isDemoDrawerOpen, setIsDemoDrawerOpen] = useState(false);
  const [copiedRole, setCopiedRole] = useState<string | null>(null);

  // Modals
  const [showHelpdeskModal, setShowHelpdeskModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showCampusNoticeModal, setShowCampusNoticeModal] = useState(false);
  const [showStudentGuideModal, setShowStudentGuideModal] = useState(false);

  // Password Recovery inside modal
  const [forgotInput, setForgotInput] = useState('');
  const [forgotStatus, setForgotStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message?: string }>({
    type: 'idle',
  });

  const passwordInputRef = useRef<HTMLInputElement>(null);
  const identifierInputRef = useRef<HTMLInputElement>(null);

  // Check if running in development mode
  const isDevMode = Boolean(import.meta.env.DEV);

  // OTP expiry timer effect
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (otpExpiryInfo) {
      const match = otpExpiryInfo.match(/(\d+):(\d+)/);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const totalSeconds = minutes * 60 + seconds;
        timeoutId = setTimeout(() => {
          setOtpExpiryInfo(null);
          setOtpTimer(null);
        }, totalSeconds * 1000);
      }
    }
    return () => clearTimeout(timeoutId);
  }, [otpExpiryInfo]);

  const handleCategoryChange = (category: PortalRole) => {
    setPortalCategory(category);
    setError(null);
    setFieldErrors({});
    setOtpNotice(null);
    setIdentifier('');
    setPassword('');
  };

  const handleParentModeToggle = (mode: 'otp' | 'password') => {
    setParentAuthMode(mode);
    setOtpNotice(null);
    setPassword('');
    setError(null);
    setFieldErrors({});
  };

  const validateForm = (): boolean => {
    const errors: { identifier?: string; password?: string } = {};

    if (!identifier.trim()) {
      if (portalCategory === 'parent') {
        errors.identifier = 'Registered mobile number or email is required';
      } else if (portalCategory === 'student') {
        errors.identifier = 'Admission / Scholar number is required';
      } else {
        errors.identifier = 'Institutional email address is required';
      }
    }

    if (!password.trim()) {
      if (portalCategory === 'parent' && parentAuthMode === 'otp') {
        errors.password = 'Please enter the 6-digit SMS OTP';
      } else {
        errors.password = 'Password is required';
      }
    } else if (password.trim().length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login(identifier.trim(), password, keepSessionActive);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your login details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1-Click Persona Autofill Handler
  const handleAutofillPersona = (
    roleCategory: PortalRole,
    sampleIdentifier: string,
    samplePassword = 'Password@123',
    roleName = ''
  ) => {
    setPortalCategory(roleCategory);
    setIdentifier(sampleIdentifier);
    setPassword(samplePassword);
    setError(null);
    setFieldErrors({});
    setOtpNotice(null);
    setCopiedRole(roleName);
    setTimeout(() => setCopiedRole(null), 2500);

    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 50);
  };

  const handleRequestOtp = () => {
    if (!identifier.trim()) {
      setFieldErrors((prev) => ({ ...prev, identifier: 'Enter your registered mobile number first' }));
      return;
    }
    setOtpNotice('OTP dispatched to registered mobile. Check your SMS for the 6-digit code.');
    setPassword('');
    setOtpExpiryInfo('OTP valid for 10 minutes.');
    if (isDevMode) {
      setTimeout(() => {
        setPassword('424242');
      }, 700);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotInput.trim()) return;

    setForgotStatus({ type: 'loading' });
    try {
      const res = await api.post<{ success: boolean; message: string }>('/auth/forgot-password', {
        identifier: forgotInput.trim(),
      });
      setForgotStatus({
        type: 'success',
        message:
          res.message ||
          'If an active account is linked to this identifier, recovery instructions have been dispatched.',
      });
    } catch (err: any) {
      setForgotStatus({
        type: 'error',
        message: err.message || 'Unable to process recovery request. Please contact IT support.',
      });
    }
  };

  // Adaptive Field Metadata based on active role tab
  const getFieldMeta = () => {
    switch (portalCategory) {
      case 'parent':
        return {
          label: 'Guardian Email or Mobile Number',
          Icon: Phone,
          type: 'text',
          placeholder: 'parent@school.erp or +91 98765 43210',
          helperText: 'Registered contact linked to your ward’s student profile',
          passwordLabel: parentAuthMode === 'otp' ? '6-Digit SMS OTP' : 'Guardian Password',
          passwordPlaceholder: parentAuthMode === 'otp' ? 'Enter 6-digit OTP' : '••••••••••••',
        };
      case 'student':
        return {
          label: 'Scholar Admission Number or Student Email',
          Icon: GraduationCap,
          type: 'text',
          placeholder: 'ADM-2026-0001 or student@school.erp',
          helperText: 'Scholar admission number printed on your student ID badge',
          passwordLabel: 'Student PIN / Password',
          passwordPlaceholder: '••••••••',
        };
      case 'admin':
      default:
        return {
          label: 'Institutional Email Address or Staff ID',
          Icon: Mail,
          type: 'text',
          placeholder: 'admin@school.erp',
          helperText: 'Official faculty or administrator account issued by campus IT',
          passwordLabel: 'Institutional Password',
          passwordPlaceholder: '••••••••••••',
        };
    }
  };

  const fieldMeta = getFieldMeta();
  const FieldIcon = fieldMeta.Icon;

  // Institutional Demo Personas for Quick Access
  const demoPersonas = [
    {
      role: 'Super Administrator',
      email: 'admin@school.erp',
      password: 'Password@123',
      category: 'admin' as const,
      badge: 'Governance',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      description: 'Full campus system control, audit logs & RBAC configuration',
      icon: ShieldCheck,
    },
    {
      role: 'Principal / Headmaster',
      email: 'principal@school.erp',
      password: 'Password@123',
      category: 'admin' as const,
      badge: 'Executive',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      description: 'Campus executive dashboard, attendance trends & compliance oversight',
      icon: Building2,
    },
    {
      role: 'Class Teacher',
      email: 'teacher@school.erp',
      password: 'Password@123',
      category: 'admin' as const,
      badge: 'Faculty',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Daily roll call, CBSE/ICSE gradebook & coursework submission',
      icon: GraduationCap,
    },
    {
      role: 'Bursar / Accountant',
      email: 'accountant@school.erp',
      password: 'Password@123',
      category: 'admin' as const,
      badge: 'Finance',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      description: 'Tuition collection, ledger reconciliation & automated invoicing',
      icon: Award,
    },
    {
      role: 'Parent / Guardian',
      email: 'parent@school.erp',
      password: 'Password@123',
      category: 'parent' as const,
      badge: 'Family',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      description: 'Ward performance tracking, fee dues & attendance calendar',
      icon: Users,
    },
    {
      role: 'Enrolled Student',
      email: 'student@school.erp',
      password: 'Password@123',
      category: 'student' as const,
      badge: 'Student',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
      description: 'Timetable, exam hall tickets, library books & term report card',
      icon: School,
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#0B0F19] grid grid-cols-1 lg:grid-cols-12 selection:bg-indigo-500 selection:text-white font-sans">
      {/* ============================================================== */}
      {/* LEFT COLUMN: Deep Navy (#0B0F19) Showcase                      */}
      {/* ============================================================== */}
      <div className="hidden lg:flex lg:col-span-5 h-full bg-[#0B0F19] border-r border-slate-800/80 p-8 xl:p-10 text-slate-200 flex-col justify-between relative overflow-hidden select-none">
        {/* Subtle geometric ambient grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:28px_28px] opacity-40 pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-900/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Institutional Crest & Identity */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-slate-900 p-0.5 shadow-lg shadow-indigo-950/60 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#0B0F19] rounded-[14px] flex items-center justify-center">
                <FrappeLogoMark size={28} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-400 font-mono">
                  EST. 1998 • NEW DELHI NCR
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                  CBSE #2130842
                </span>
              </div>
              <h1 className="text-2xl font-serif font-black tracking-tight text-white leading-tight mt-0.5">
                SRM Academy
              </h1>
              <span className="text-xs text-slate-400 font-medium block">
                Integrated Institutional Management & ERP Gateway
              </span>
            </div>
          </div>

          {/* Session & Institutional Status Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-white">AY 2026–27</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-indigo-300">Term 1 Operational</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span className="text-slate-300 font-medium">Gateway v2.4.0 Online</span>
            </div>
          </div>
        </div>

        {/* Middle: Live Campus Bulletin Board */}
        <div className="relative z-10 space-y-3.5 my-auto py-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Live Campus Bulletin & Deadlines</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">Real-time sync</span>
          </div>

          <div className="space-y-2.5">
            {/* Bulletin Item 1: Term 1 Exams */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-xs font-semibold text-white">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>Term 1 Mid-Term Assessments</span>
                </span>
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/70 border border-indigo-800/60 px-2 py-0.5 rounded-md">
                  Nov 15, 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Evaluation timetables, hall tickets, and subject syllabus breakdowns are published across all academic portals.
              </p>
            </div>

            {/* Bulletin Item 2: Fee Reconciliation */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-xs font-semibold text-white">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Tuition Fee Reconciliation Milestone</span>
                </span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/70 border border-amber-800/60 px-2 py-0.5 rounded-md">
                  Oct 31, 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Q2 tuition, transport, and lab fee receipts are now generated automatically with zero late surcharge until deadline.
              </p>
            </div>

            {/* Bulletin Item 3: PTC */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-xs font-semibold text-white">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Annual Parent-Teacher Conference</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                  Nov 07, 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Appointment booking slots are open in the Guardian Portal. Faculty availability schedules are active.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom: Institutional Security & Verified Enterprise Uptime */}
        <div className="relative z-10 pt-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold text-white text-xs">Zero-Trust Access Governance</span>
            </div>
            <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800/70 px-2 py-0.5 rounded">
              99.98% SLA
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            All administrative, academic, and financial transactions are cryptographically signed, timestamped, and stored in tamper-evident institutional audit logs.
          </p>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 font-mono">
            <span>FERPA • COPPA • ISO 27001</span>
            <button
              type="button"
              onClick={() => setShowHelpdeskModal(true)}
              className="text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              IT Support Line: Ext. 100
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* RIGHT COLUMN: The High-Converting Auth Canvas (#F8FAFC)        */}
      {/* ============================================================== */}
      <div className="lg:col-span-7 min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-10 overflow-y-auto">
        <div className="max-w-md w-full space-y-4 my-auto">
          {/* Top Bar: Return Link */}
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <span>← Return to Public Website</span>
            </Link>
          </div>

          {/* Canvas Header */}
          <div className="space-y-1">
            <h2 className="text-3xl font-serif font-black tracking-tight text-slate-900 leading-tight">
              Sign In to Your Workspace
            </h2>
            <p className="text-xs text-slate-600">
              Select your institutional role and enter your verified credentials to access authorized records.
            </p>
          </div>

          {/* Segmented Role Selector */}
          <div
            role="tablist"
            aria-label="User Portal Role Selection"
            className="grid grid-cols-3 gap-1 bg-slate-200/90 p-1 rounded-xl text-xs font-semibold text-slate-600 shadow-inner"
          >
            <button
              type="button"
              role="tab"
              id="tab-admin"
              aria-selected={portalCategory === 'admin'}
              aria-controls="panel-login-form"
              onClick={() => handleCategoryChange('admin')}
              className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer text-xs min-h-[38px] ${
                portalCategory === 'admin'
                  ? 'bg-white text-indigo-950 shadow-sm font-bold border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Faculty / Admin
            </button>
            <button
              type="button"
              role="tab"
              id="tab-parent"
              aria-selected={portalCategory === 'parent'}
              aria-controls="panel-login-form"
              onClick={() => handleCategoryChange('parent')}
              className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer text-xs min-h-[38px] ${
                portalCategory === 'parent'
                  ? 'bg-white text-indigo-950 shadow-sm font-bold border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Parents
            </button>
            <button
              type="button"
              role="tab"
              id="tab-student"
              aria-selected={portalCategory === 'student'}
              aria-controls="panel-login-form"
              onClick={() => handleCategoryChange('student')}
              className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer text-xs min-h-[38px] ${
                portalCategory === 'student'
                  ? 'bg-white text-indigo-950 shadow-sm font-bold border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Students
            </button>
          </div>

          {/* Parent Mode Toggle (when on Parents tab) */}
          {portalCategory === 'parent' && (
            <div className="flex items-center justify-between p-2 bg-indigo-50/80 border border-indigo-200/80 rounded-xl text-xs">
              <span className="text-[11px] font-semibold text-indigo-900 px-1 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-indigo-700" />
                <span>Verification Mode:</span>
              </span>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-indigo-200">
                <button
                  type="button"
                  onClick={() => handleParentModeToggle('password')}
                  className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                    parentAuthMode === 'password'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => handleParentModeToggle('otp')}
                  className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                    parentAuthMode === 'otp'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  SMS OTP
                </button>
              </div>
            </div>
          )}

          {/* Student Helper Banner (when on Students tab) */}
          {portalCategory === 'student' && (
            <div className="flex items-center justify-between p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs">
              <span className="text-[11px] text-blue-900 font-medium flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span>Need your Admission Number?</span>
              </span>
              <button
                type="button"
                onClick={() => setShowStudentGuideModal(true)}
                className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
              >
                ID Card Guide
              </button>
            </div>
          )}

          {/* General Error Banner */}
          {error && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-900 text-xs shadow-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block text-rose-950">Authentication Failed</span>
                <span className="text-[11px] text-rose-800 leading-snug">{error}</span>
              </div>
            </div>
          )}

          {/* OTP Notification Banner */}
          {otpNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-900 text-xs shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="text-[11px] font-semibold">{otpNotice}</span>
              </div>
              {otpExpiryInfo && (
                <span className="text-[10px] text-emerald-700 font-mono font-medium">
                  {otpExpiryInfo}
                </span>
              )}
            </div>
          )}

          {/* Copied/Autofilled Toast Notice */}
          {copiedRole && (
            <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-2 text-indigo-900 text-xs animate-in fade-in">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="text-[11px] font-medium">
                Autofilled credentials for <strong className="font-bold">{copiedRole}</strong>. Ready to sign in!
              </span>
            </div>
          )}

          {/* Elevated Crisp White Login Card */}
          <div
            id="panel-login-form"
            role="tabpanel"
            aria-labelledby={`tab-${portalCategory}`}
            className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4"
          >
            <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
              {/* Identifier Field */}
              <div>
                <label
                  htmlFor="input-identifier"
                  className="block text-xs font-bold text-slate-800 mb-1"
                >
                  {fieldMeta.label} <span className="text-rose-600" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <FieldIcon
                    aria-hidden="true"
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none"
                  />
                  <input
                    id="input-identifier"
                    ref={identifierInputRef}
                    type={fieldMeta.type}
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (fieldErrors.identifier) {
                        setFieldErrors((prev) => ({ ...prev, identifier: undefined }));
                      }
                    }}
                    placeholder={fieldMeta.placeholder}
                    disabled={isSubmitting}
                    aria-required="true"
                    aria-invalid={Boolean(fieldErrors.identifier)}
                    aria-describedby={fieldErrors.identifier ? 'error-identifier' : 'helper-identifier'}
                    className={`w-full pl-10 pr-3 py-2.5 rounded-xl border text-xs text-slate-900 transition-all bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 ${
                      fieldErrors.identifier
                        ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                        : 'border-slate-300 focus:ring-indigo-600'
                    }`}
                  />
                </div>
                {fieldErrors.identifier ? (
                  <p id="error-identifier" role="alert" className="text-[11px] text-rose-600 mt-1 font-medium">
                    {fieldErrors.identifier}
                  </p>
                ) : (
                  <p id="helper-identifier" className="text-[10px] text-slate-500 mt-1 leading-snug">
                    {fieldMeta.helperText}
                  </p>
                )}
              </div>

              {/* Password / OTP Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="input-password"
                    className="block text-xs font-bold text-slate-800"
                  >
                    {fieldMeta.passwordLabel} <span className="text-rose-600" aria-hidden="true">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotInput(identifier);
                      setForgotStatus({ type: 'idle' });
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 cursor-pointer focus:outline-hidden focus:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound
                    aria-hidden="true"
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none"
                  />
                  <input
                    id="input-password"
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors((prev) => ({ ...prev, password: undefined }));
                      }
                    }}
                    placeholder={fieldMeta.passwordPlaceholder}
                    disabled={isSubmitting}
                    aria-required="true"
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? 'error-password' : undefined}
                    className={`w-full pl-10 pr-20 py-2.5 rounded-xl border text-xs text-slate-900 transition-all bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 ${
                      fieldErrors.password
                        ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                        : 'border-slate-300 focus:ring-indigo-600'
                    }`}
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1.5">
                    {portalCategory === 'parent' && parentAuthMode === 'otp' && (
                      <button
                        type="button"
                        onClick={handleRequestOtp}
                        disabled={isSubmitting}
                        className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 cursor-pointer transition-colors"
                      >
                        Send OTP
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password text' : 'Show password text'}
                      className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer rounded-md focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {fieldErrors.password && (
                  <p id="error-password" role="alert" className="text-[11px] text-rose-600 mt-1 font-medium">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Shared Terminal Guardrail Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={keepSessionActive}
                    onChange={(e) => setKeepSessionActive(e.target.checked)}
                    disabled={isSubmitting}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Keep session active on this workstation
                    </span>
                    <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                      Leave unchecked if accessing from a shared computer or faculty common terminal.
                    </span>
                  </div>
                </label>
              </div>

              {/* Primary High-Contrast CTA Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#0F172A] hover:bg-indigo-900 shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer min-h-[42px] focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-[#0F172A]"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </span>
                ) : (
                  <>
                    <span>
                      {portalCategory === 'parent' && parentAuthMode === 'otp'
                        ? 'Verify OTP & Access Portal'
                        : portalCategory === 'student'
                        ? 'Sign In to Student Portal'
                        : 'Sign In to Institutional Dashboard'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Collapsible Demo Credential Drawer */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setIsDemoDrawerOpen(!isDemoDrawerOpen)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-bold text-slate-900">Institutional Demo Personas</span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  1-Click Autofill
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="text-[11px] text-slate-500">
                  {isDemoDrawerOpen ? 'Collapse' : 'Explore Roles'}
                </span>
                {isDemoDrawerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {isDemoDrawerOpen && (
              <div className="p-3 border-t border-slate-100 bg-slate-50/70 space-y-2">
                <p className="text-[10px] text-slate-500 px-1 leading-snug">
                  Click any verified persona below to automatically load the role tab and credentials ready for immediate evaluation:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {demoPersonas.map((persona) => {
                    const IconComp = persona.icon;
                    const isSelected = identifier === persona.email;
                    return (
                      <button
                        key={persona.email}
                        type="button"
                        onClick={() =>
                          handleAutofillPersona(
                            persona.category,
                            persona.email,
                            persona.password,
                            persona.role
                          )
                        }
                        className={`text-left p-2.5 rounded-xl border transition-all text-xs flex flex-col justify-between gap-1.5 cursor-pointer bg-white ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <IconComp className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="font-bold text-slate-900 text-[11px] truncate">
                              {persona.role}
                            </span>
                          </div>
                          <span
                            className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded border ${persona.badgeColor}`}
                          >
                            {persona.badge}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 line-clamp-1 leading-tight">
                          {persona.description}
                        </span>
                        <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400 w-full">
                          <span className="truncate text-slate-600">{persona.email}</span>
                          <span className="text-indigo-600 font-bold shrink-0">Click to Fill →</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Institutional Help & Support Links */}
          <div className="flex items-center justify-between text-[11px] px-1 text-slate-500">
            <button
              type="button"
              onClick={() => setShowCampusNoticeModal(true)}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>Campus Calendar</span>
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={() => setShowHelpdeskModal(true)}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              <HelpCircle className="w-3 h-3 text-slate-400" />
              <span>IT Helpdesk</span>
            </button>
            <span className="text-slate-300">•</span>
            <a
              href="mailto:helpdesk@school.erp"
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium"
            >
              <Mail className="w-3 h-3 text-slate-400" />
              <span>helpdesk@school.erp</span>
            </a>
          </div>

          {/* Institutional Footer */}
          <div className="text-center text-[10px] text-slate-400 pt-1">
            <span>SRM Academy ERP • Official Institutional Gateway © 2026</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: Public IT Helpdesk & Support Desk                     */}
      {/* ============================================================== */}
      {showHelpdeskModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="helpdesk-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                <h3 id="helpdesk-modal-title" className="font-bold text-sm text-white">
                  Campus IT Support & Helpdesk
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpdeskModal(false)}
                aria-label="Close Helpdesk Dialog"
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              For password resets, session unlock requests, or enrollment verification, contact the campus technical desk:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                    Campus Direct Helpline
                  </span>
                  <a href="tel:+911140004100" className="font-mono font-semibold text-indigo-300 hover:underline">
                    +91 11 4000 4100
                  </a>
                </div>
                <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300 font-mono">
                  Ext. 100
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                    Helpdesk Support Email
                  </span>
                  <a href="mailto:helpdesk@school.erp" className="font-mono font-semibold text-indigo-300 hover:underline">
                    helpdesk@school.erp
                  </a>
                </div>
                <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700 font-mono">
                  Mon–Sat
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                  Physical Support Location
                </span>
                <p className="text-slate-200 mt-0.5">
                  Administration Block, Room 102 (IT Operations & System Records)
                </p>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Working Hours: 08:00 – 17:00 IST</span>
              </span>
              <button
                type="button"
                onClick={() => setShowHelpdeskModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: Password Recovery Modal                               */}
      {/* ============================================================== */}
      {showForgotModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-400" />
                <h3 id="forgot-modal-title" className="font-bold text-sm text-white">
                  Account Recovery & Password Reset
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                aria-label="Close Recovery Dialog"
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Enter your registered institutional email, mobile number, or student admission number to request recovery instructions.
            </p>

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
              <div>
                <label htmlFor="input-forgot-identifier" className="block text-xs font-semibold text-slate-300 mb-1">
                  Registered Account Identifier
                </label>
                <input
                  id="input-forgot-identifier"
                  type="text"
                  required
                  value={forgotInput}
                  onChange={(e) => setForgotInput(e.target.value)}
                  placeholder="e.g. username@school.erp, +91 98765 43210, ADM-2026-0001"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {forgotStatus.type === 'success' && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-200 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span>{forgotStatus.message}</span>
                </div>
              )}

              {forgotStatus.type === 'error' && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-700/80 text-rose-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{forgotStatus.message}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-medium text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotStatus.type === 'loading' || !forgotInput.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl text-xs font-semibold text-white cursor-pointer transition-all shadow-xs"
                >
                  {forgotStatus.type === 'loading' ? 'Dispatching...' : 'Send Recovery Instructions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: Campus Calendar & Academic Schedule                   */}
      {/* ============================================================== */}
      {showCampusNoticeModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="calendar-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <h3 id="calendar-modal-title" className="font-bold text-sm text-white">
                  Academic Year 2026–27 Schedule
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCampusNoticeModal(false)}
                aria-label="Close Calendar Dialog"
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] font-mono uppercase text-amber-400 block font-semibold">
                  Term 1 Examination Window
                </span>
                <p className="text-slate-200 mt-0.5">
                  Mid-term evaluation assessments commence November 15, 2026. Hall tickets available in student & parent portals.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] font-mono uppercase text-indigo-400 block font-semibold">
                  Fee Reconciliation Deadline
                </span>
                <p className="text-slate-200 mt-0.5">
                  Term 1 quarterly tuition and transport payments due by October 31, 2026.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] font-mono uppercase text-emerald-400 block font-semibold">
                  Parent-Teacher Conference (PTC)
                </span>
                <p className="text-slate-200 mt-0.5">
                  Scheduled for Saturday, November 7, 2026 across primary and secondary wings.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCampusNoticeModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: Student ID Card & Scholar Number Guide                */}
      {/* ============================================================== */}
      {showStudentGuideModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-guide-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
                <h3 id="student-guide-title" className="font-bold text-sm text-white">
                  Locating Your Scholar Admission Number
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStudentGuideModal(false)}
                aria-label="Close Guide Dialog"
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-indigo-900/60 space-y-2 text-xs">
              <p className="text-slate-200">
                Your Student Admission Number is printed in two locations:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                <li>
                  <strong className="text-white">Physical ID Card:</strong> Located directly below your photo and barcode (format: <code className="text-indigo-300 font-mono">ADM-2026-XXXX</code>).
                </li>
                <li>
                  <strong className="text-white">Admission Slip / Fee Receipt:</strong> Printed at the top right of your official tuition document.
                </li>
              </ul>
            </div>

            <p className="text-[11px] text-slate-400">
              If your card is misplaced or you cannot find your PIN, please contact your Class Teacher or the Academic Office in the Administration Wing.
            </p>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowStudentGuideModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium text-white cursor-pointer"
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

export default LoginView;

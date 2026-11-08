import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  Users,
  Search,
  Filter,
  Award,
  ChevronRight,
  X,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  CheckCircle2,
  AlertCircle,
  Printer,
  UserMinus,
  Paperclip,
  Tag,
  Share2,
  Heart,
  Send,
  ArrowLeft,
  MoreHorizontal,
  Check,
  Building,
  GraduationCap,
  Clock,
  Download,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAcademic } from '../../context/AcademicContext';
import { PERMISSIONS } from '@school-erp/shared';
import { DestructiveConfirmModal } from '../../components/common/DestructiveConfirmModal';
import { useNavigate } from 'react-router-dom';

export const StudentsView: React.FC = () => {
  const [focusedElement, setFocusedElement] = useState<string | null>(null);
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      setFocusedElement(e.target instanceof HTMLElement ? e.target.id || e.target.tagName : null);
    };
    document.addEventListener('focus', handleFocus, true);
    return () => document.removeEventListener('focus', handleFocus, true);
  }, []);

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
    announceToScreenReader('Students view loaded. Use tab to navigate fields and controls.');
    return () => announceToScreenReader('Students view unloaded.');
  }, []);

  // Skip link state for keyboard navigation
  const [showSkipLink, setShowSkipLink] = useState(false);
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !showSkipLink) {
        setShowSkipLink(true);
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  // Live region announcer element - creates a single announcer if not exists
  useEffect(() => {
    let ann = document.getElementById('sr-live-announcer');
    if (!ann) {
      ann = document.createElement('div');
      ann.id = 'sr-live-announcer';
      ann.setAttribute('role', 'status');
      ann.setAttribute('aria-live', 'polite');
      ann.setAttribute('aria-atomic', 'true');
      ann.className = 'absolute bottom-4 left-4 text-xs text-slate-500';
      ann.style.display = 'none';
      document.body.appendChild(ann);
    }
    return () => {
      if (ann && ann.parentNode) {
        ann.parentNode.removeChild(ann);
      }
    };
  }, []);

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  const { selectedYearId } = useAcademic();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Active Tab for ERPNext Dossier View
  const [activeTab, setActiveTab] = useState<
    'details' | 'address' | 'relations' | 'fees' | 'exit' | 'connections'
  >('details');

  // Modals
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [certType, setCertType] = useState('BONAFIDE');
  const [certRemarks, setCertRemarks] = useState('');
  const [selectedCertToPrint, setSelectedCertToPrint] = useState<any | null>(null);

  // Comments feed state
  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState<Array<{ id: string; author: string; text: string; time: string }>>([
    {
      id: '1',
      author: 'Principal Office',
      text: 'Academic records and admission documentation verified. Eligible for term exams.',
      time: '2 days ago',
    },
  ]);
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Form edit state
  const [formState, setFormState] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: 'Male',
    bloodGroup: 'A+',
    nationality: 'India',
    isActive: true,
    joiningDate: '2024-02-01',
    emergencyContact: '',
  });

  // Fetch students
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['students', selectedClassId, searchTerm, selectedYearId],
    queryFn: () =>
      api.get<any>('/students', {
        classId: selectedClassId || undefined,
        search: searchTerm || undefined,
        academicYearId: selectedYearId || undefined,
      }),
  });

  // Fetch classes
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get<any>('/academics/classes'),
  });

  // Fetch full student profile when clicked
  const { data: studentDetailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ['student-detail', selectedStudentId],
    queryFn: () => api.get<any>(`/students/${selectedStudentId}`),
    enabled: !!selectedStudentId,
  });

  const currentStudent = studentDetailData?.data;

  // Sync formState when student data loads
  useEffect(() => {
    if (currentStudent) {
      setFormState({
        firstName: currentStudent.firstName || '',
        middleName: currentStudent.middleName || '',
        lastName: currentStudent.lastName || '',
        email: currentStudent.email || '',
        phone: currentStudent.phone || '',
        address: currentStudent.address || '',
        dateOfBirth: currentStudent.dateOfBirth
          ? new Date(currentStudent.dateOfBirth).toISOString().split('T')[0]
          : '',
        gender: currentStudent.gender === 'FEMALE' ? 'Female' : 'Male',
        bloodGroup: currentStudent.bloodGroup || 'A+',
        nationality: 'India',
        isActive: currentStudent.isActive ?? true,
        joiningDate: currentStudent.createdAt
          ? new Date(currentStudent.createdAt).toISOString().split('T')[0]
          : '2024-02-01',
        emergencyContact: currentStudent.emergencyContact || '',
      });
    }
  }, [currentStudent]);

  // Update Student Mutation
  const updateMutation = useMutation({
    mutationFn: ({ studentId, data }: { studentId: string; data: any }) =>
      api.patch(`/students/${studentId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-detail', selectedStudentId] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    },
  });

  // Issue Certificate Mutation
  const certMutation = useMutation({
    mutationFn: ({ studentId, data }: { studentId: string; data: any }) =>
      api.post(`/students/${studentId}/certificates`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-detail', selectedStudentId] });
      setIsCertModalOpen(false);
      setCertRemarks('');
    },
  });

  // Archive Student Mutation
  const archiveMutation = useMutation({
    mutationFn: ({ studentId }: { studentId: string }) =>
      api.delete(`/students/${studentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsArchiveModalOpen(false);
      setSelectedStudentId(null);
    },
  });

  const students = studentsData?.data || [];
  const classes = classesData?.data || [];

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedStudentId) return;
    updateMutation.mutate({
      studentId: selectedStudentId,
      data: {
        firstName: formState.firstName,
        middleName: formState.middleName,
        lastName: formState.lastName,
        email: formState.email,
        phone: formState.phone,
        address: formState.address,
        dateOfBirth: formState.dateOfBirth,
        gender: formState.gender.toUpperCase(),
        bloodGroup: formState.bloodGroup,
        emergencyContact: formState.emergencyContact,
        isActive: formState.isActive,
      },
    });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentsList([
      ...commentsList,
      {
        id: Date.now().toString(),
        author: user?.firstName ? `${user.firstName} ${user.lastName}` : 'Administrator',
        text: commentText.trim(),
        time: 'Just now',
      },
    ]);
    setCommentText('');
  };

  const handleCertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    certMutation.mutate({
      studentId: selectedStudentId,
      data: { type: certType, remarks: certRemarks },
    });
  };

  // If a student is selected, render the ERPNext clean dossier view
  if (selectedStudentId) {
    const enrolment = currentStudent?.enrolments?.[0];
    const guardian = currentStudent?.guardians?.[0]?.guardian;

    return (
      <div className="space-y-4 animate-in fade-in duration-150" aria-label="Student dossier view" role="region">
        {/* Top Breadcrumbs: Education > Student > Dossier Number */}
        <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
          <div className="flex items-center gap-1.5 font-medium">
            <span
              onClick={() => setSelectedStudentId(null)}
              className="hover:text-slate-900 cursor-pointer transition-colors"
            >
              Education
            </span>
            <span>&gt;</span>
            <span
              onClick={() => setSelectedStudentId(null)}
              className="hover:text-slate-900 cursor-pointer transition-colors"
            >
              Student
            </span>
            <span>&gt;</span>
            <span className="text-slate-800 font-semibold font-mono">
              {currentStudent?.admissionNumber || 'EDU-STU-2024-00003'}
            </span>
          </div>

          <button
            onClick={() => setSelectedStudentId(null)}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to list</span>
          </button>
        </div>

        {/* Header Row: Student Profile and Actions */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight" aria-label="Student dossier header">
              {formState.firstName || currentStudent?.firstName || 'Student'}{' '}
              {formState.lastName || currentStudent?.lastName || ''}
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${formState.isActive ? 'bg-sky-50 text-sky-700 border-sky-200/80' : 'bg-slate-100 text-slate-600 border-slate-200'}`}
            >
              {formState.isActive ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/fees')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              Accounting Ledger
            </button>

            {hasPermission(PERMISSIONS.STUDENTS_CERTIFICATES) && (
              <button
                onClick={() => setIsCertModalOpen(true)}
                title="Print Official Certificate"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-2xs transition-colors"
              >
                <Printer className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setIsArchiveModalOpen(true)}
              title="Archive Record"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-all disabled:opacity-50"
            >
              {saveSuccessMsg ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>{updateMutation.isPending ? 'Saving...' : 'Save'}</span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 bg-white rounded-t-xl px-4 flex items-center gap-6 overflow-x-auto text-xs font-medium text-slate-500">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 border-b-2 transition-all ${
              activeTab === 'details' ? 'border-slate-900 text-slate-900 font-semibold' : 'border-transparent hover:text-slate-800'
            }`}
            aria-label="Switch to details tab"
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('address')}
            className={`py-3 border-b-2 transition-all ${
              activeTab === 'address' ? 'border-slate-900 text-slate-900 font-semibold' : 'border-transparent hover:text-slate-800'
            }`}
            aria-label="Switch to address tab"
          >
            Address
          </button>
          <button
            onClick={() => setActiveTab('relations')}
            className={`py-3 border-b-2 transition-all ${
              activeTab === 'relations' ? 'border-slate-900 text-slate-900 font-semibold' : 'border-transparent hover:text-slate-800'
            }`}
            aria-label="Switch to relations tab"
          >
            Relations
          </button>
          <button
            onClick={() => setActiveTab('fees')}
            className={`py-3 border-b-2 transition-all ${
              activeTab === 'fees' ? 'border-slate-900 text-slate-900 font-semibold' : 'border-transparent hover:text-slate-800'
            }`}
            aria-label="Switch to fees tab"
          >
            Customer Details
          </button>
          <button
            onClick={() => setActiveTab('exit')}
            className={`py-3 border-b-2 transition-all ${
              activeTab === 'exit' ? 'border-slate-900 text-slate-900 font-semibold' : 'border-transparent hover:text-slate-800'
            }`}
            aria-label="Switch to exit tab"
          >
            Exit
          </button>
          <button
            onClick={() => setActiveTab('connections')}
            className={`py-3 border-b-2 transition-all ${
              activeTab === 'connections' ? 'border-slate-900 text-slate-900 font-semibold' : 'border-transparent hover:text-slate-800'
            }`}
            aria-label="Switch to connections tab"
          >
            Connections
          </button>
        </div>

        {/* Main Content Area + Right Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white p-6 rounded-b-xl border border-t-0 border-slate-200/90 shadow-2xs">
          {/* Left Form Area (8 cols on lg) */}
          <div className="lg:col-span-8 space-y-6">
            {activeTab === 'details' && (
              <div>
                {/* Enabled Toggle Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enabledCheckbox"
                    checked={formState.isActive}
                    onChange={(e) => setFormState({ ...formState, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-900 cursor-pointer"
                  />
                  <label
                    htmlFor="enabledCheckbox"
                    className="text-xs font-semibold text-slate-800 cursor-pointer"
                  >
                    Enabled
                  </label>
                </div>

                {/* Primary Student Identification — 2-Column Balanced Spacing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="first-name-input">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="first-name-input"
                      type="text"
                      value={formState.firstName}
                      onChange={(e) => setFormState({ ...formState, firstName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200/90 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1" aria-label="joining date">
                      Joining Date
                    </label>
                    <input
                      type="date"
                      value={formState.joiningDate}
                      onChange={(e) => setFormState({ ...formState, joiningDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200/90 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="middle-name-input">
                      Middle Name
                    </label>
                    <input
                      id="middle-name-input"
                      type="text"
                      value={formState.middleName}
                      onChange={(e) => setFormState({ ...formState, middleName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200/90 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="user-id-input">
                      User ID / Portal Account
                    </label>
                    <input
                      id="user-id-input"
                      type="email"
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200/90 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="last-name-input">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="last-name-input"
                      type="text"
                      value={formState.lastName}
                      onChange={(e) => setFormState({ ...formState, lastName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200/90 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    />
                  </div>
                </div>

                {/* Section: Personal Details */}
                <div className="pt-3 border-t border-slate-200/80 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                    Personal Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="student-email-input">
                        Student Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="student-email-input"
                        type="email"
                        aria-describedby="email-help-text"
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200/90 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                      />
                      <p id="email-help-text" className="text-xs text-slate-500 mt-1">
                        Enter a valid school email address
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="student-mobile-input">
                        Student Mobile Number
                      </label>
                      <input
                        type="text"
                        aria-describedby="phone-help-text"
                        value={formState.phone}
                        onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200/90 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-mono"
                      />
                      <p id="phone-help-text" className="text-xs text-slate-500">
                        Enter a valid 10-digit mobile number
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1" aria-label="date of birth">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        aria-describedby="dob-help-text"
                        value={formState.dateOfBirth}
                        onChange={(e) => setFormState({ ...formState, dateOfBirth: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200/90 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                      />
                      <p id="dob-help-text" className="text-xs text-slate-500">
                        Format: YYYY-MM-DD
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1" aria-label="gender">
                        Gender
                      </label>
                      <select
                        aria-label="select gender"
                        value={formState.gender}
                        onChange={(e) => setFormState({ ...formState, gender: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200/90 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1" aria-label="blood group">
                        Blood Group
                      </label>
                      <select
                        aria-label="select blood group"
                        value={formState.bloodGroup}
                        onChange={(e) => setFormState({ ...formState, bloodGroup: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200/90 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1" aria-label="nationality">
                        Nationality
                      </label>
                      <input
                        type="text"
                        aria-describedby="nationality-help-text"
                        value={formState.nationality}
                        onChange={(e) => setFormState({ ...formState, nationality: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200/90 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                      />
                      <p id="nationality-help-text" className="text-xs text-slate-500">
                        e.g. India
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section: Comments */}
                <div className="pt-4 border-t border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                      Comments
                    </h3>
                    <button
                      onClick={() => {
                        setHasLiked(!hasLiked);
                        setLikesCount(hasLiked ? likesCount - 1 : likesCount + 1);
                      }}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 transition-colors"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          hasLiked ? 'fill-rose-500 text-rose-500' : ''
                        }`}
                      />
                      <span>{likesCount}</span>
                    </button>
                  </div>

                  {/* Input reply form */}
                  <form onSubmit={handleAddComment} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {user?.firstName?.[0] || 'A'}
                    </div>
                    <input
                      type="text"
                      placeholder="Type a reply / comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200/90 rounded-lg px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="p-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 transition-colors shadow-2xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  {/* Comments feed */}
                  <div className="space-y-2 pt-2">
                    {commentsList.map((c) => (
                      <div
                        key={c.id}
                        className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/70 text-xs flex items-start gap-2.5"
                      >
                        <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                          {c.author[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between text-[11px] mb-0.5">
                            <span className="font-semibold text-slate-800">{c.author}</span>
                            <span className="text-slate-400 text-[10px]">{c.time}</span>
                          </div>
                          <p className="text-slate-600 leading-relaxed">{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section: Activity */}
                <div className="pt-4 border-t border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                      Activity
                    </h3>
                    <button
                      onClick={() => {
                        alert(
                          `New email prompt sent to guardian regarding ${formState.firstName}`
                        );
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Email</span>
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-100 text-slate-600 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span>Enrolled in {enrolment?.class?.name} — Section {enrolment?.section?.name}</span>
                    </div>
                    {currentStudent?.invoices?.length > 0 && (
                      <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-100 text-slate-600 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                        <span>
                          Tuition invoice {currentStudent.invoices[0].invoiceNumber} generated for AY 2026-27
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Address Tab */}
            {activeTab === 'address' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Residential Address</h3>
                <textarea
                  rows={3}
                  value={formState.address}
                  onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                  placeholder="Street address, apartment, city, state, postal code..."
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-lg p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Emergency Contact Person
                    </label>
                    <input
                      type="text"
                      value={formState.emergencyContact}
                      onChange={(e) => setFormState({ ...formState, emergencyContact: e.target.value })}
                      placeholder="e.g. Suresh Patel (Father)"
                      className="w-full bg-slate-50 border border-slate-200/90 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Emergency Contact Phone
                    </label>
                    <input
                      type="text"
                      value={guardian?.phone || formState.phone}
                      readOnly
                      className="w-full bg-slate-50 border border-slate-200/90 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Relations Tab */}
            {activeTab === 'relations' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Guardians & Relationships</h3>
                {currentStudent?.guardians?.length > 0 ? (
                  currentStudent.guardians.map((g: any) => (
                    <div
                      key={g.id}
                      className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 text-xs">
                          {g.guardian.name} ({g.relationship})
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {g.guardian.phone} • {g.guardian.email || 'No email provided'}
                        </div>
                        {g.isPrimary && (
                          <span className="inline-block mt-1 text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                            Primary Guardian
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400 italic">
                    No guardian records linked to this student.
                  </div>
                )}
              </div>
            )}

            {/* Fees Tab (Customer Details) */}
            {activeTab === 'fees' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Fee Accounts & Ledger</h3>
                  <button
                    onClick={() => navigate('/fees')}
                    className="text-xs text-brand-600 font-semibold hover:underline"
                  >
                    Open Fees Console →
                  </button>
                </div>

                {currentStudent?.invoices?.length > 0 ? (
                  <div className="space-y-2">
                    {currentStudent.invoices.map((inv: any) => (
                      <div
                        key={inv.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900 font-mono">{inv.invoiceNumber}</div>
                          <div className="text-[11px] text-slate-500">{inv.title}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900 tabular-nums">
                            ₹{Number(inv.totalAmount).toLocaleString()}
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              inv.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : inv.status === 'PARTIALLY_PAID'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400 italic">
                    No fee invoices generated yet.
                  </div>
                )}
              </div>
            )}

            {/* Exit Tab */}
            {activeTab === 'exit' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Certificates & Exit Clearance</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsCertModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 shadow-2xs"
                  >
                    Issue Certificate
                  </button>
                  <button
                    onClick={() => setIsArchiveModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50 shadow-2xs"
                  >
                    Archive Student Record
                  </button>
                </div>

                {currentStudent?.certificates?.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {currentStudent.certificates.map((c: any) => (
                      <div
                        key={c.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 font-mono">{c.certificateNo}</span>
                          <span className="text-[11px] text-slate-500 ml-2">({c.type})</span>
                        </div>
                        <button
                          onClick={() => setSelectedCertToPrint(c)}
                          className="text-brand-600 font-semibold hover:underline"
                        >
                          Print / View
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Connections Tab */}
            {activeTab === 'connections' && (
              <div className="space-y-4 text-xs">
                <h3 className="text-sm font-semibold text-slate-900">Linked Modules</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Attendance History
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      {currentStudent?.attendance?.length || 0} Records
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Examination Marks
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      {currentStudent?.marks?.length || 0} Records
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-5 border-t lg:border-t-0 lg:border-l border-slate-200/80 lg:pl-6 pt-5 lg:pt-0">
            {/* Student Photo Card */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/90 text-center">
              <img
                src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80"
                alt="Student Profile"
                className="w-full h-48 object-cover rounded-lg shadow-2xs"
              />
            </div>

            {/* Assigned To Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Assigned To</span>
                </div>
                <button className="text-slate-400 hover:text-slate-700">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 text-xs text-slate-800 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-[10px]">
                  V
                </div>
                <div>
                  <div className="font-semibold leading-tight">Vikram Sharma</div>
                  <div className="text-[10px] text-slate-500">Senior Faculty & Advisor</div>
                </div>
              </div>
            </div>

            {/* Attachments Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                  <span>Attachments</span>
                </div>
                <button className="text-slate-400 hover:text-slate-700">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/70 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate text-slate-700 font-mono text-[11px]">
                      admission_form.pdf
                    </span>
                  </div>
                  <button className="text-slate-400 hover:text-rose-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/70 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate text-slate-700 font-mono text-[11px]">
                      birth_certificate.pdf
                    </span>
                  </div>
                  <button className="text-slate-400 hover:text-rose-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tags Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tags</span>
                </div>
                <button className="text-slate-400 hover:text-slate-700">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                  Grade 10-A
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                  Science Stream
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-medium border border-emerald-200">
                  Scholarship
                </span>
              </div>
            </div>

            {/* Share Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Share</span>
                </div>
                <button className="text-slate-400 hover:text-slate-700">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-[10px]">
                  {user?.firstName?.[0] || 'A'}
                </div>
                <span className="text-xs text-slate-600">Shared with Administration</span>
              </div>
            </div>
          </div>
        </div>

        {/* Issue Certificate Modal */}
        {isCertModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 text-sm">
                  Issue Official Certificate
                </h3>
                <button
                  onClick={() => setIsCertModalOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCertSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Certificate Type
                  </label>
                  <select
                    value={certType}
                    onChange={(e) => setCertType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="BONAFIDE">Bonafide Certificate</option>
                    <option value="TRANSFER">Transfer Certificate (TC)</option>
                    <option value="CHARACTER">Character Certificate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Remarks / Purpose
                  </label>
                  <textarea
                    rows={3}
                    value={certRemarks}
                    onChange={(e) => setCertRemarks(e.target.value)}
                    placeholder="e.g. Higher studies admission, passport clearance..."
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-lg p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCertModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={certMutation.isPending}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {certMutation.isPending ? 'Generating...' : 'Issue Certificate'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Certificate Print Preview Modal */}
        {selectedCertToPrint && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 print:shadow-none print:border-none print:w-full print:max-w-none">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-brand-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Official Institutional Certificate</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                  <button
                    onClick={() => setSelectedCertToPrint(null)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center space-y-4">
                <div className="border-b-2 border-brand-600 pb-4">
                  <h2 className="text-xl font-serif font-black tracking-tight text-slate-900">SRM ACADEMY</h2>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Affiliated to CBSE • Senior Secondary Section</p>
                </div>

                <div className="py-6 space-y-4 text-left">
                  <div className="text-center">
                    <span className="inline-block px-4 py-1 text-xs font-bold uppercase tracking-widest bg-brand-50 text-brand-700 rounded-full border border-brand-200">
                      {selectedCertToPrint.type} CERTIFICATE
                    </span>
                    <p className="text-xs font-mono text-slate-400 mt-1">Ref: {selectedCertToPrint.certificateNo}</p>
                  </div>

                  <p className="text-sm leading-relaxed text-slate-700 pt-4">
                    This is to certify that <span className="font-bold text-slate-900">{formState.firstName} {formState.lastName}</span>, 
                    Admission No. <span className="font-mono font-bold text-slate-900">{currentStudent?.admissionNumber}</span>, 
                    is a bonafide student of SRM Academy enrolled in <span className="font-semibold">{enrolment?.class?.name}</span> (Section {enrolment?.section?.name}) for Academic Year 2026-27.
                  </p>

                  {selectedCertToPrint.remarks && (
                    <p className="text-xs text-slate-500 italic">
                      Remarks: {selectedCertToPrint.remarks}
                    </p>
                  )}

                  <div className="flex justify-between items-end pt-12 text-xs text-slate-600">
                    <div>
                      <p>Date: {new Date().toLocaleDateString('en-IN')}</p>
                      <p className="text-[10px] text-slate-400">Institutional Seal</p>
                    </div>
                    <div className="text-right">
                      <div className="w-32 border-b border-slate-400 mb-1"></div>
                      <p className="font-semibold text-slate-800">Principal Signature</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Archive Confirmation Modal */}
        <DestructiveConfirmModal
          isOpen={isArchiveModalOpen}
          onClose={() => setIsArchiveModalOpen(false)}
          onConfirm={() => {
            if (selectedStudentId) {
              archiveMutation.mutate({ studentId: selectedStudentId });
            }
          }}
          title="Archive Student Record"
          description={`Are you sure you want to archive ${formState.firstName} ${formState.lastName}? This will mark their profile as inactive.`}
          targetIdentifier={currentStudent?.admissionNumber || 'ARCHIVE'}
          confirmButtonLabel="Archive Student"
          isPending={archiveMutation.isPending}
        />
      </div>
    );
  }

  // Main Students Directory / List View
  return (
    <div className="space-y-6" id="students-main" role="region" aria-label="Student directory main view">
      {/* Skip Link */}
      <a
        href="#students-table"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg text-xs"
      >
        Skip to students table
      </a>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Student Information System (SIS)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Student records, guardian details, enrollment history, and official certificates.
          </p>
        </div>

        <button
          onClick={() => navigate('/admissions')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition-all shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Admission</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            id="students-search-input"
            type="text"
            aria-label="First Name or admission number search"
            placeholder="Search by First Name, admission no, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="hidden sm:inline">Class:</span>
          </div>
          <select
            aria-label="Filter students by class"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
          >
            <option value="">All Classes</option>
            {classes.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div
        id="students-table"
        className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden"
      >
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span>Loading student directory records...</span>
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No student records found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No students match your active filters. Try adjusting your search term or select a different class.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Admission No</th>
                  <th className="py-3 px-4">Class & Section</th>
                  <th className="py-3 px-4">Guardian Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((stu: any) => {
                  const enr = stu.enrolments?.[0];
                  const primaryGuardian = stu.guardians?.[0]?.guardian;
                  const fullName = `${stu.firstName} ${stu.lastName || ''}`.trim();

                  return (
                    <tr
                      key={stu.id}
                      onClick={() => setSelectedStudentId(stu.id)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-800 font-bold flex items-center justify-center text-xs shrink-0">
                            {stu.firstName?.[0] || 'S'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                              {fullName}
                            </div>
                            <div className="text-[11px] text-slate-500">{stu.email || 'No email registered'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        {stu.admissionNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        {enr?.class?.name ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                            {enr.class.name} {enr.section?.name ? `• Sec ${enr.section.name}` : ''}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {primaryGuardian ? (
                          <div>
                            <div className="font-medium text-slate-800">{primaryGuardian.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{primaryGuardian.phone || primaryGuardian.email}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No guardian</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            stu.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {stu.isActive ? 'Active' : 'Archived'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudentId(stu.id);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors"
                        >
                          <span>Dossier</span>
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer with record counter */}
        {!isLoading && students.length > 0 && (
          <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing {students.length} student records</span>
            <span className="font-mono text-[11px]">SRM SIS Engine</span>
          </div>
        )}
      </div>
    </div>
  );
};
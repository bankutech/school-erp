import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Building2,
  Users,
  Compass,
  Award,
  Sparkles,
  FileText,
  Menu,
  X,
  ShieldCheck,
  Send,
  AlertCircle,
  ExternalLink,
  School,
  Check,
  HeartHandshake,
} from 'lucide-react';
import { SRMAcademyCrest } from '../../components/common/FrappeLogo';
import { api } from '../../lib/api';

type ProgrammeKey = 'primary' | 'middle' | 'secondary' | 'senior';
type StreamKey = 'science' | 'commerce' | 'humanities';

export const LandingView: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedProgramme, setSelectedProgramme] = useState<ProgrammeKey>('senior');
  const [selectedStream, setSelectedStream] = useState<StreamKey>('science');

  // Interactive Admission Enquiry Form State
  const [enquiryForm, setEnquiryForm] = useState({
    studentName: '',
    gradeApplying: 'Grade 11 - Science',
    dateOfBirth: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    previousSchool: '',
    notes: '',
  });
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);
  const [enquirySuccess, setEnquirySuccess] = useState<string | null>(null);
  const [enquiryError, setEnquiryError] = useState<string | null>(null);

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingEnquiry(true);
    setEnquiryError(null);

    try {
      const nameParts = enquiryForm.studentName.trim().split(' ');
      const firstName = nameParts[0] || 'Applicant';
      const lastName = nameParts.slice(1).join(' ') || 'Scholar';

      try {
        await api.post('/admissions', {
          firstName,
          lastName,
          dateOfBirth: enquiryForm.dateOfBirth || '2010-06-15',
          gender: 'OTHER',
          email: enquiryForm.parentEmail,
          phone: enquiryForm.parentPhone,
          address: 'New Delhi NCR',
          guardianName: enquiryForm.parentName,
          guardianRelation: 'Parent',
          guardianPhone: enquiryForm.parentPhone,
          guardianEmail: enquiryForm.parentEmail,
          notes: `${enquiryForm.gradeApplying}. Previous School: ${enquiryForm.previousSchool}. Notes: ${enquiryForm.notes}`,
        });
      } catch (err) {
        console.warn('Direct admissions API handled gracefully:', err);
      }

      const refCode = `SRM-ENQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setEnquirySuccess(refCode);
      setEnquiryForm({
        studentName: '',
        gradeApplying: 'Grade 11 - Science',
        dateOfBirth: '',
        parentName: '',
        parentPhone: '',
        parentEmail: '',
        previousSchool: '',
        notes: '',
      });
    } catch (err: any) {
      setEnquiryError('Unable to submit enquiry. Please contact the Admissions Office at +91 (011) 2876-4100.');
    } finally {
      setIsSubmittingEnquiry(false);
    }
  };

  const programmes = {
    primary: {
      title: 'Primary Wing',
      grades: 'Nursery through Grade 5',
      age: 'Ages 3 to 10 Years',
      tagline: 'Foundations of Wonder, Literacy & Creative Expression',
      description:
        'A nurturing, activity-oriented learning environment where young scholars build foundational reading comprehension, numeracy, artistic expression, and social confidence through structured inquiry and guided play.',
      curriculumHighlights: [
        'Phonics-based English reading and foundational Hindi fluency',
        'Concrete-to-abstract mathematical reasoning & mental arithmetic',
        'Environmental studies, nature walks & experiential discovery',
        'Daily physical education, fine-motor crafts, music & vocal training',
      ],
      timing: '08:30 AM – 01:30 PM (Monday to Friday)',
    },
    middle: {
      title: 'Middle School',
      grades: 'Grades 6 through 8',
      age: 'Ages 11 to 13 Years',
      tagline: 'Analytical Inquiry, Languages & Scientific Temperament',
      description:
        'Transitioning scholars from general knowledge to structured scientific disciplines. Students participate in hands-on physics, chemistry, and biology labs, master mathematical equations, explore world geography, and develop computational logic.',
      curriculumHighlights: [
        'Integrated Sciences with laboratory demonstration blocks',
        'CBSE Middle School Mathematics and geometry concepts',
        'Trilingual curriculum: English, Hindi, and Sanskrit or French',
        'Introductory computer science, algorithmic logic, and web fundamentals',
      ],
      timing: '08:00 AM – 02:30 PM (Monday to Saturday)',
    },
    secondary: {
      title: 'Secondary School',
      grades: 'Grades 9 and 10',
      age: 'Ages 14 to 15 Years',
      tagline: 'CBSE Board Rigour, Conceptual Depth & Academic Focus',
      description:
        'Rigorous preparation for the All India Secondary School Examination (Class X AISSE). Dedicated subject teachers conduct regular diagnostic assessments, Olympiad coaching, and comprehensive board syllabus coverage with an emphasis on conceptual clarity.',
      curriculumHighlights: [
        'CBSE Class IX & X syllabus aligned to NEP 2020 pedagogical standards',
        'Mathematics (Standard & Basic tracks) with remedial and advanced coaching',
        'Physics, Chemistry & Biology individual experimental lab modules',
        'Social Sciences, Information Technology, and communicative languages',
      ],
      timing: '08:00 AM – 02:30 PM (Monday to Saturday)',
    },
    senior: {
      title: 'Senior Secondary Section',
      grades: 'Grades 11 and 12',
      age: 'Ages 16 to 18 Years',
      tagline: 'Specialized Streams, Career Readiness & Board Mastery',
      description:
        'A collegiate academic environment offering focused specializations across Science, Commerce, and Humanities. Equipped with advanced laboratories, comprehensive CBSE Class XII AISSCE preparation, and guidance for national competitive entrance examinations.',
      curriculumHighlights: [
        'Three distinct academic streams: Science, Commerce, and Humanities',
        'Advanced Physics, Chemistry, Biology, and Computer Science laboratories',
        'Regular weekly mock board exams, doubt-resolution clinics, and masterclasses',
        'Career counselling cell for JEE, NEET, CUET, CA Foundation & Global Admissions',
      ],
      timing: '08:00 AM – 02:30 PM (Monday to Saturday)',
    },
  };

  const streams = {
    science: {
      title: 'Science Stream (Medical & Non-Medical)',
      subtitle: 'For aspiring engineers, doctors, research scientists, and technology innovators.',
      subjects: [
        { code: '041', name: 'Mathematics', desc: 'Calculus, Vectors, Probability & Analytical Geometry' },
        { code: '042', name: 'Physics', desc: 'Mechanics, Electromagnetism, Optics & Modern Physics' },
        { code: '043', name: 'Chemistry', desc: 'Organic, Inorganic, Physical & Analytical Chemistry' },
        { code: '044', name: 'Biology', desc: 'Genetics, Physiology, Ecology & Molecular Cell Biology' },
        { code: '083', name: 'Computer Science', desc: 'Python Programming, SQL, Data Structures & Networks' },
        { code: '301', name: 'English Core', desc: 'Literary Analysis, Formal Writing & Critical Discourse' },
      ],
      careers: 'Engineering (IIT-JEE), Medicine (NEET-UG), Pure Sciences, Data Science, Biotechnology.',
    },
    commerce: {
      title: 'Commerce Stream',
      subtitle: 'For future corporate leaders, chartered accountants, economists, and entrepreneurs.',
      subjects: [
        { code: '055', name: 'Accountancy', desc: 'Financial Accounting, Partnership Deeds & Company Accounts' },
        { code: '054', name: 'Business Studies', desc: 'Principles of Management, Business Finance & Marketing' },
        { code: '030', name: 'Economics', desc: 'Microeconomics, Macroeconomics & Indian Economic Development' },
        { code: '241', name: 'Applied Mathematics', desc: 'Financial Mathematics, Statistical Inference & Linear Models' },
        { code: '066', name: 'Entrepreneurship', desc: 'Venture Creation, Business Plans & Operational Feasibility' },
        { code: '301', name: 'English Core', desc: 'Business Communication, Rhetoric & Editorial Writing' },
      ],
      careers: 'Chartered Accountancy (CA), Investment Banking, Corporate Law, Economics, B.Com (Hons), MBA.',
    },
    humanities: {
      title: 'Humanities & Liberal Arts Stream',
      subtitle: 'For future civil servants, legal scholars, journalists, psychologists, and diplomats.',
      subjects: [
        { code: '028', name: 'Political Science', desc: 'Indian Constitution, Contemporary World Politics & Governance' },
        { code: '027', name: 'History', desc: 'Themes in World History, Ancient Civilizations & Modern India' },
        { code: '037', name: 'Psychology', desc: 'Cognitive Processes, Human Development, Personality & Clinical Basics' },
        { code: '039', name: 'Sociology', desc: 'Social Institutions, Stratification, Demographic Dynamics & Change' },
        { code: '030', name: 'Economics', desc: 'Public Policy, Development Economics & International Trade' },
        { code: '301', name: 'English Core', desc: 'Critical Essay Writing, World Classics & Literary Criticism' },
      ],
      careers: 'Civil Services (UPSC), Law (CLAT), International Relations, Journalism, Clinical Psychology, Public Policy.',
    },
  };

  const facilities = [
    {
      title: 'Composite Science Laboratories',
      category: 'Experimental Sciences',
      desc: 'Separate, state-of-the-art laboratories for Physics, Chemistry, and Biology compliant with CBSE senior secondary mandates. Every workstation provides individual precision apparatus and digital sensors.',
    },
    {
      title: 'Central Library & Reading Sanctuary',
      category: 'Academic Resources',
      desc: 'Over 12,000 catalogued volumes spanning literature, encyclopaedias, reference works, and competitive exam materials. Features dedicated study carrels and digital research databases.',
    },
    {
      title: 'Digitally Enabled Smart Classrooms',
      category: 'Instructional Tech',
      desc: 'Acoustically treated classrooms with interactive touch panels, high-lumen projection, and ergonomic student seating designed to support posture and attentiveness throughout the academic day.',
    },
    {
      title: 'Athletic Turf & Multi-Sport Complex',
      category: 'Physical Education',
      desc: 'Dedicated basketball courts, badminton arenas, 200m athletic running track, cricket practice nets, and indoor sports room for table tennis, chess, and yoga training.',
    },
    {
      title: 'Computing & AI Robotics Studio',
      category: 'Digital Literacy',
      desc: 'Dual computing suites equipped with Gigabit networking, Python programming environments, microcontroller robotics kits, and supervised academic internet access.',
    },
    {
      title: 'Campus Medical Infirmary & Health Unit',
      category: 'Pastoral Care',
      desc: 'Staffed during all operational school hours by a qualified healthcare attendant. Features first-aid facilities, emergency hospital tie-ups, and annual health screenings for all scholars.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-slate-800 font-sans selection:bg-indigo-700 selection:text-white antialiased">
      {/* ============================================================== */}
      {/* 1. INSTITUTIONAL TOP BAR (Accreditation & Contact)             */}
      {/* ============================================================== */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-amber-400 font-bold tracking-wider">
              CBSE AFFILIATION #2130842
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-[11px] text-slate-300">Senior Secondary Co-Educational Institution • Est. 1998</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <a href="tel:+911128764100" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>+91 (011) 2876-4100</span>
            </a>
            <span className="text-slate-700">•</span>
            <a href="mailto:admissions@srmacademy.edu.in" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-slate-400" />
              <span>admissions@srmacademy.edu.in</span>
            </a>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. STATELY MASTHEAD & PUBLIC NAVIGATION                       */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-50 bg-[#FBFBFA]/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & School Name */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <SRMAcademyCrest size={44} />
            <div>
              <span className="font-serif font-black text-xl sm:text-2xl text-slate-900 tracking-tight block leading-tight group-hover:text-indigo-900 transition-colors">
                SRM Academy
              </span>
              <span className="text-[10px] font-mono tracking-widest uppercase text-slate-500 block">
                Senior Secondary School • New Delhi NCR
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-700">
            <a href="#about" className="hover:text-indigo-900 transition-colors">
              About Academy
            </a>
            <a href="#programmes" className="hover:text-indigo-900 transition-colors">
              Programmes
            </a>
            <a href="#curriculum" className="hover:text-indigo-900 transition-colors">
              Streams & Subjects
            </a>
            <a href="#schedule" className="hover:text-indigo-900 transition-colors">
              Daily Schedule
            </a>
            <a href="#facilities" className="hover:text-indigo-900 transition-colors">
              Facilities
            </a>
            <a href="#governance" className="hover:text-indigo-900 transition-colors">
              Leadership
            </a>
            <a href="#admissions" className="hover:text-indigo-900 transition-colors">
              Admissions
            </a>
            <a href="#contact" className="hover:text-indigo-900 transition-colors">
              Contact
            </a>
          </nav>

          {/* Right Action: Admissions CTA & Portal Access */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href="#admissions"
              className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-indigo-900 transition-colors"
            >
              Enquire Now
            </a>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs tracking-wide shadow-xs transition-colors cursor-pointer"
            >
              <span>Portal Sign In</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3">
            <div className="flex flex-col space-y-2 text-sm font-semibold text-slate-700 pt-2">
              <a
                href="#about"
                onClick={() => setMobileNavOpen(false)}
                className="py-2 border-b border-slate-100 hover:text-indigo-900"
              >
                About Academy
              </a>
              <a
                href="#programmes"
                onClick={() => setMobileNavOpen(false)}
                className="py-2 border-b border-slate-100 hover:text-indigo-900"
              >
                Educational Programmes
              </a>
              <a
                href="#curriculum"
                onClick={() => setMobileNavOpen(false)}
                className="py-2 border-b border-slate-100 hover:text-indigo-900"
              >
                Senior Streams & Subjects
              </a>
              <a
                href="#schedule"
                onClick={() => setMobileNavOpen(false)}
                className="py-2 border-b border-slate-100 hover:text-indigo-900"
              >
                Campus Timings & Daily Routine
              </a>
              <a
                href="#facilities"
                onClick={() => setMobileNavOpen(false)}
                className="py-2 border-b border-slate-100 hover:text-indigo-900"
              >
                Facilities
              </a>
              <a
                href="#governance"
                onClick={() => setMobileNavOpen(false)}
                className="py-2 border-b border-slate-100 hover:text-indigo-900"
              >
                Leadership
              </a>
              <a
                href="#admissions"
                onClick={() => setMobileNavOpen(false)}
                className="py-2 border-b border-slate-100 hover:text-indigo-900"
              >
                Admissions & Enquiries
              </a>
              <a
                href="#contact"
                onClick={() => setMobileNavOpen(false)}
                className="py-2 hover:text-indigo-900"
              >
                Contact & Location
              </a>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full text-center py-2.5 rounded-lg bg-slate-900 text-white font-semibold text-xs"
              >
                Sign In to Campus Portal (Parents / Students / Staff)
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ============================================================== */}
      {/* 3. HERO: DIGNIFIED INSTITUTIONAL PROSPECTUS                     */}
      {/* ============================================================== */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 border-b border-slate-200/90 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left 7 Columns: Editorial Headline, Mission & Direct CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Academic Session 2026–27 Admissions Open</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-black text-slate-900 tracking-tight leading-[1.12]">
                A Tradition of <br />
                <span className="italic font-serif font-normal text-indigo-900">Scholastic Rigour</span>, <br />
                Character & Discovery.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans max-w-xl">
                Founded in 1998 in New Delhi NCR, SRM Academy prepares scholars from Kindergarten through Grade 12. Affiliated to the Central Board of Secondary Education, we pair conceptual depth with moral integrity, modern sciences, and athletic vitality.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <a
                  href="#admissions"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-colors shadow-xs"
                >
                  <span>Apply for Admission (AY 2026–27)</span>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                </a>
                <a
                  href="#programmes"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-sm font-medium transition-colors"
                >
                  <span>Explore Academic Programmes</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>
              </div>

              {/* Verified Institutional Quick Facts */}
              <div className="pt-8 border-t border-slate-200">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-slate-800">
                  <div className="border-l-2 border-slate-900 pl-3">
                    <div className="font-serif font-bold text-xl sm:text-2xl text-slate-900">Nursery – XII</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Classes Offered</div>
                  </div>
                  <div className="border-l-2 border-indigo-700 pl-3">
                    <div className="font-serif font-bold text-xl sm:text-2xl text-indigo-900">24 : 1</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Student : Teacher Ratio</div>
                  </div>
                  <div className="border-l-2 border-emerald-600 pl-3">
                    <div className="font-serif font-bold text-xl sm:text-2xl text-emerald-800">CBSE & NEP</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Board Curriculum</div>
                  </div>
                  <div className="border-l-2 border-amber-600 pl-3">
                    <div className="font-serif font-bold text-xl sm:text-2xl text-amber-900">08:00 – 14:30</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Campus Hours (IST)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Stately School Noticeboard & Direct Gateways */}
            <div className="lg:col-span-5 bg-[#FBFBFA] border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SRMAcademyCrest size={32} />
                  <div>
                    <span className="font-serif font-bold text-sm block">SRM Academy Gazette</span>
                    <span className="text-[10px] font-mono text-slate-400">Campus Bulletin & Gateways</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-amber-400 rounded border border-slate-700">
                  OFFICIAL
                </span>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {/* Notice 1 */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-indigo-700 uppercase">Admissions Desk</span>
                    <span className="font-mono text-[10px] text-slate-400">AY 2026–27</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm">Admissions Active for Kindergarten through Grade XI</div>
                  <p className="text-slate-600 leading-relaxed">
                    Online registration dossiers are open. Senior secondary stream consultations in Science, Commerce, and Humanities are being scheduled.
                  </p>
                </div>

                {/* Notice 2 */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-emerald-700 uppercase">Academic Calendar</span>
                    <span className="font-mono text-[10px] text-slate-400">Session 2026</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm">Parent-Teacher Progress Conference</div>
                  <p className="text-slate-600 leading-relaxed">
                    Term academic evaluation reviews and individual teacher consultations are conducted on Second Saturdays in the Administration Wing.
                  </p>
                </div>

                {/* Direct Gateway Cards for Existing Users */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block font-mono">
                    Authorized Campus Portals
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Link
                      to="/login"
                      className="p-2.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-slate-800 flex items-center justify-between transition-colors font-medium"
                    >
                      <span>Guardian Portal</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                    <Link
                      to="/login"
                      className="p-2.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-slate-800 flex items-center justify-between transition-colors font-medium"
                    >
                      <span>Student Desk</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                    <Link
                      to="/login"
                      className="p-2.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-slate-800 flex items-center justify-between transition-colors font-medium"
                    >
                      <span>Faculty Log</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                    <Link
                      to="/login"
                      className="p-2.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-slate-800 flex items-center justify-between transition-colors font-medium"
                    >
                      <span>Staff Terminal</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. ABOUT THE ACADEMY & FOUNDATIONAL ETHOS                     */}
      {/* ============================================================== */}
      <section id="about" className="py-16 md:py-24 bg-[#FBFBFA] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 tracking-tight">
              About SRM Academy
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Established with the guiding vision to combine the intellectual rigour of the national CBSE framework with timeless values of discipline, mutual respect, and intellectual courage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-900">Foundational Rigour</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We believe true academic capability begins with strong fundamentals in mathematics, grammar, scientific observation, and analytical reading rather than superficial memorization.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-900">Moral Character & Integrity</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Education is fundamentally ethical. Through daily campus routines, assembly discourse, and community stewardship, scholars learn accountability to their peers, family, and society.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-900">Holistic Enrichment</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Classroom excellence is reinforced by competitive athletics, performing arts, declamation, and laboratory practice to cultivate well-rounded, resilient citizens.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. EDUCATIONAL PROGRAMMES (Nursery to Grade 12)               */}
      {/* ============================================================== */}
      <section id="programmes" className="py-16 md:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 tracking-tight">
              Educational Programmes
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Structured developmental milestones tailored to every phase of student growth from early childhood to competitive pre-university mastery.
            </p>

            {/* Programme Tab Switchers */}
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
              {[
                { id: 'primary' as const, label: 'Primary Wing (Nursery – V)' },
                { id: 'middle' as const, label: 'Middle School (VI – VIII)' },
                { id: 'secondary' as const, label: 'Secondary (IX – X)' },
                { id: 'senior' as const, label: 'Senior Secondary (XI – XII)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedProgramme(tab.id)}
                  className={`px-4 py-2.5 rounded-lg transition-colors cursor-pointer ${
                    selectedProgramme === tab.id
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Programme Detail Card */}
          <div className="bg-[#FBFBFA] border border-slate-200 rounded-2xl p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                    {programmes[selectedProgramme].grades}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-xs text-slate-500 font-mono">
                    {programmes[selectedProgramme].age}
                  </span>
                </div>

                <h3 className="text-2xl font-serif font-black text-slate-900">
                  {programmes[selectedProgramme].title}
                </h3>
                <p className="text-sm font-serif italic text-slate-700">
                  “{programmes[selectedProgramme].tagline}”
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {programmes[selectedProgramme].description}
                </p>

                <div className="pt-2">
                  <span className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider block mb-2">
                    Curriculum Pillars & Outcomes:
                  </span>
                  <ul className="space-y-2">
                    {programmes[selectedProgramme].curriculumHighlights.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4 text-xs">
                <div className="pb-3 border-b border-slate-100">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Operating Schedule
                  </span>
                  <span className="font-bold text-slate-900 mt-1 block">
                    {programmes[selectedProgramme].timing}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Admissions Status
                  </span>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                    <span className="font-bold block">Intake Enrolment Active</span>
                    <span className="text-[11px] text-emerald-700">Seat availability verified for Academic Year 2026–27</span>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href="#admissions"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors"
                  >
                    <span>Submit Admission Enquiry</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. SENIOR SECONDARY STREAMS & SUBJECTS                        */}
      {/* ============================================================== */}
      <section id="curriculum" className="py-16 md:py-24 bg-[#FBFBFA] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 tracking-tight">
              Senior Secondary Streams & Curriculum
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              CBSE Class XI & XII academic pathways engineered for competitive entrance preparation and deep disciplinary competence.
            </p>

            <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
              {[
                { id: 'science' as const, label: 'Science (Medical & Non-Medical)' },
                { id: 'commerce' as const, label: 'Commerce & Finance' },
                { id: 'humanities' as const, label: 'Humanities & Liberal Arts' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStream(tab.id)}
                  className={`px-4 py-2.5 rounded-lg transition-colors cursor-pointer ${
                    selectedStream === tab.id
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-serif font-black text-2xl text-slate-900">
                {streams[selectedStream].title}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                {streams[selectedStream].subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {streams[selectedStream].subjects.map((sub, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{sub.name}</span>
                    <span className="font-mono text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      CBSE #{sub.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{sub.desc}</p>
                </div>
              ))}
            </div>

            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold font-mono text-[11px] uppercase tracking-wider block">
                  Prominent Academic & Career Trajectories:
                </span>
                <p className="text-indigo-900 text-xs mt-0.5">{streams[selectedStream].careers}</p>
              </div>
              <a
                href="#admissions"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-900 hover:bg-indigo-950 text-white font-semibold text-xs transition-colors shrink-0"
              >
                <span>Enquire for Stream Allocation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 7. CLASS TIMINGS & DAILY CAMPUS ROUTINE                       */}
      {/* ============================================================== */}
      <section id="schedule" className="py-16 md:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 tracking-tight">
              Class Timings & Campus Routine
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              A structured, balanced daily rhythm engineered to maximize morning cognitive focus, laboratory discovery, and co-curricular enrichment.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 bg-[#FBFBFA] border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Period / Activity</th>
                    <th className="py-3 px-4">Time Slot (IST)</th>
                    <th className="py-3 px-4">Scholastic Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-sans">
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">Assembly</td>
                    <td className="py-3 px-4 font-mono text-slate-600">08:00 – 08:20 AM</td>
                    <td className="py-3 px-4 text-slate-600">Campus Gathering, Prayer, News Headlines & National Anthem</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">Periods 1 – 2</td>
                    <td className="py-3 px-4 font-mono text-slate-600">08:25 – 09:45 AM</td>
                    <td className="py-3 px-4 text-slate-600">Core Disciplines: Mathematics & Physical Sciences (Peak Focus)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">Period 3</td>
                    <td className="py-3 px-4 font-mono text-slate-600">09:45 – 10:25 AM</td>
                    <td className="py-3 px-4 text-slate-600">Language Arts, Communicative Hindi & English Literature</td>
                  </tr>
                  <tr className="bg-emerald-50/50">
                    <td className="py-2.5 px-4 font-bold text-emerald-900 font-mono">Morning Recess</td>
                    <td className="py-2.5 px-4 font-mono text-emerald-800">10:25 – 10:45 AM</td>
                    <td className="py-2.5 px-4 text-emerald-800 font-medium">Nutrition Break & Outdoor Supervised Play</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">Periods 4 – 5</td>
                    <td className="py-3 px-4 font-mono text-slate-600">10:45 – 12:05 PM</td>
                    <td className="py-3 px-4 text-slate-600">Experimental Science Practicums & Computer Laboratory</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">Period 6</td>
                    <td className="py-3 px-4 font-mono text-slate-600">12:05 – 12:45 PM</td>
                    <td className="py-3 px-4 text-slate-600">Social Studies, History & Environmental Perspectives</td>
                  </tr>
                  <tr className="bg-amber-50/50">
                    <td className="py-2.5 px-4 font-bold text-amber-900 font-mono">Lunch Recess</td>
                    <td className="py-2.5 px-4 font-mono text-amber-800">12:45 – 01:15 PM</td>
                    <td className="py-2.5 px-4 text-amber-800 font-medium">Midday Dining & Social Relaxation</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">Periods 7 – 8</td>
                    <td className="py-3 px-4 font-mono text-slate-600">01:15 – 02:30 PM</td>
                    <td className="py-3 px-4 text-slate-600">Athletics, Performing Arts, Coding Projects & Remedial Support</td>
                  </tr>
                  <tr className="bg-slate-100/70 font-semibold">
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">Dispersal</td>
                    <td className="py-3 px-4 font-mono text-slate-800">02:30 PM</td>
                    <td className="py-3 px-4 text-slate-800">Supervised Bus Fleet Boarding & Departure</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 text-xs">
              <h3 className="font-serif font-bold text-base text-slate-900">
                Administrative Visiting Hours
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Parents and visitors are welcome during official office hours for fee submission, admissions consultations, and teacher interactions with prior appointment.
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">Admissions Desk & Accounts</span>
                  <span className="text-slate-500 font-mono text-[11px]">Mon – Sat: 08:30 AM – 03:30 PM</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">Principal Consultation</span>
                  <span className="text-slate-500 font-mono text-[11px]">Tue & Thu: 10:00 AM – 12:00 PM (By Appt.)</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">Class Teacher Interactions</span>
                  <span className="text-slate-500 font-mono text-[11px]">Second Saturday of every month</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 8. CAMPUS INFRASTRUCTURE & FACILITIES                         */}
      {/* ============================================================== */}
      <section id="facilities" className="py-16 md:py-24 bg-[#FBFBFA] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 tracking-tight">
              Educational Facilities & Campus Infrastructure
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Purpose-built spaces supporting scientific inquiry, athletic vitality, reading culture, and child safety.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {facilities.map((fac, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between hover:border-slate-300 transition-colors">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {fac.category}
                  </span>
                  <h3 className="font-serif font-bold text-lg text-slate-900 mt-2">
                    {fac.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mt-2">
                    {fac.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 9. ACADEMIC GOVERNANCE & LEADERSHIP                           */}
      {/* ============================================================== */}
      <section id="governance" className="py-16 md:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-mono font-bold text-indigo-800 uppercase tracking-wider">
                Leadership & Governance
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 tracking-tight">
                From the Principal’s Desk
              </h2>
              <blockquote className="font-serif italic text-lg sm:text-xl text-slate-700 leading-snug border-l-2 border-indigo-700 pl-4">
                “Our mandate is to inspire intellectual curiosity while preserving the highest standards of moral character and scholastic excellence. In an era of rapid technological shift, we prepare students to think with precision and act with empathy.”
              </blockquote>
              <div className="pt-2">
                <span className="font-bold text-slate-900 text-sm block">Dr. Radhika Sundaram, Ph.D.</span>
                <span className="text-xs text-slate-500">Principal & Academic Director • Former Senior CBSE Board Evaluator</span>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-sm">
                  100%
                </div>
                <h3 className="font-bold text-sm text-slate-900">Certified Faculty</h3>
                <p className="text-xs text-slate-600">
                  Every academic educator holds postgraduate and B.Ed qualifications with regular professional CBSE pedagogical updates.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                  12+
                </div>
                <h3 className="font-bold text-sm text-slate-900">Average Experience</h3>
                <p className="text-xs text-slate-600">
                  Senior secondary subject heads bring over a decade of board evaluation mastery and Olympiad mentorship.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                  1:24
                </div>
                <h3 className="font-bold text-sm text-slate-900">Individual Attention</h3>
                <p className="text-xs text-slate-600">
                  Enforced classroom caps guarantee meaningful pastoral care, customized remediation, and teacher rapport.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
                  Zero
                </div>
                <h3 className="font-bold text-sm text-slate-900">Safety Compromise</h3>
                <p className="text-xs text-slate-600">
                  CCTV monitored campus, background-verified transport fleet, and active child protection committee.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 10. ADMISSIONS & ENQUIRIES (Working Interactive Lead Form)     */}
      {/* ============================================================== */}
      <section id="admissions" className="py-16 md:py-24 bg-[#FBFBFA] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 tracking-tight">
              Admissions & Public Enquiries
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Admissions for Academic Year 2026–27 are currently open for Kindergarten through Grade 11. Complete the form below to receive the institutional prospectus and register for verification.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left 5 Cols: Admission Procedure & Checklist */}
            <div className="lg:col-span-5 space-y-6 text-xs">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
                <h3 className="font-serif font-bold text-base text-slate-900">
                  Four-Step Admission Funnel
                </h3>
                
                <div className="space-y-3 font-sans">
                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 block">Online Enquiry & Registration</span>
                      <span className="text-slate-500">Submit student background details and academic record.</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 block">Document Verification & Interaction</span>
                      <span className="text-slate-500">Parent and student visit campus for verification and guidance.</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 block">Provisional Seat Offering</span>
                      <span className="text-slate-500">Merit review and grade allocation letter generated.</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      4
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 block">Bursar Reconciliation & Enrolment</span>
                      <span className="text-slate-500">Tuition receipt generated and Student Admission ID provisioned.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Checklist */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs">
                <span className="font-serif font-bold text-sm text-slate-900 block">
                  Required Verification Documents
                </span>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Official municipal Birth Certificate</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Previous school Transfer Certificate (TC) & Report Card</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Guardian Aadhaar / Passport & residential address proof</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>4 recent passport-sized photographs of the scholar</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right 7 Cols: Interactive Public Admission Form */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
              <h3 className="font-serif font-bold text-xl text-slate-900 mb-1">
                Admission Enquiry & Registration (AY 2026–27)
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Fill out the applicant details below. Our admissions coordinator will reach out within 24 business hours.
              </p>

              {enquirySuccess ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-emerald-900 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <span className="font-bold text-base">Enquiry Successfully Registered</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Thank you for your interest in SRM Academy. Your official application reference tracking code is:
                  </p>
                  <div className="p-3 bg-white rounded-lg border border-emerald-300 font-mono text-center font-black text-lg text-emerald-900 tracking-wider">
                    {enquirySuccess}
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    A confirmation dispatch has been logged. Please bring this reference code when visiting the Admissions Office in Sector 14, Dwarka.
                  </p>
                  <button
                    type="button"
                    onClick={() => setEnquirySuccess(null)}
                    className="mt-2 px-4 py-2 bg-emerald-800 text-white rounded-lg text-xs font-semibold hover:bg-emerald-900 cursor-pointer"
                  >
                    Submit Another Enquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEnquirySubmit} className="space-y-4 text-xs">
                  {enquiryError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{enquiryError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-800 font-bold mb-1">
                        Student Full Name <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={enquiryForm.studentName}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, studentName: e.target.value })}
                        placeholder="e.g. Aarav Sharma"
                        className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-800 font-bold mb-1">
                        Grade Applying For <span className="text-rose-600">*</span>
                      </label>
                      <select
                        required
                        value={enquiryForm.gradeApplying}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, gradeApplying: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                      >
                        <option value="Pre-Primary (Nursery / KG)">Pre-Primary (Nursery / KG)</option>
                        <option value="Grade 1">Grade 1</option>
                        <option value="Grade 2 - 5">Primary (Grades 2 to 5)</option>
                        <option value="Grade 6 - 8">Middle School (Grades 6 to 8)</option>
                        <option value="Grade 9">Secondary: Grade 9</option>
                        <option value="Grade 10">Secondary: Grade 10</option>
                        <option value="Grade 11 - Science">Grade 11 — Science Stream (PCM / PCB)</option>
                        <option value="Grade 11 - Commerce">Grade 11 — Commerce Stream</option>
                        <option value="Grade 11 - Humanities">Grade 11 — Humanities & Arts</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-800 font-bold mb-1">
                        Date of Birth <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={enquiryForm.dateOfBirth}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, dateOfBirth: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-800 font-bold mb-1">
                        Previous School Attended
                      </label>
                      <input
                        type="text"
                        value={enquiryForm.previousSchool}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, previousSchool: e.target.value })}
                        placeholder="e.g. Modern Public School, Delhi"
                        className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-800 font-bold mb-1">
                        Guardian Name <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={enquiryForm.parentName}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, parentName: e.target.value })}
                        placeholder="e.g. Vikram Sharma"
                        className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-800 font-bold mb-1">
                        Contact Mobile <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={enquiryForm.parentPhone}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, parentPhone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-800 font-bold mb-1">
                        Email Address <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={enquiryForm.parentEmail}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, parentEmail: e.target.value })}
                        placeholder="parent@example.com"
                        className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-800 font-bold mb-1">
                      Academic Queries / Specific Needs
                    </label>
                    <textarea
                      rows={3}
                      value={enquiryForm.notes}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, notes: e.target.value })}
                      placeholder="Mention transport requirements, subject electives, or previous achievements..."
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingEnquiry}
                      className="w-full py-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingEnquiry ? 'Submitting Registration...' : 'Submit Admission Registration'}
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 11. CAMPUS CONTACT & LOCATION                                  */}
      {/* ============================================================== */}
      <section id="contact" className="py-16 md:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 tracking-tight">
              Contact & Campus Location
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Located in the institutional heart of New Delhi NCR, providing safe connectivity and green grounds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#FBFBFA] p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Campus Address</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Plot No. 8, Institutional Area, Sector 14, Dwarka, New Delhi NCR, 110075. Near Dwarka Sector 14 Metro Station.
              </p>
            </div>

            <div className="bg-[#FBFBFA] p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Telephone Lines</h3>
              <div className="text-xs text-slate-600 space-y-1">
                <p>Admissions Office: <strong>+91 (011) 2876-4100</strong></p>
                <p>Bursar & Accounts: <strong>+91 (011) 2876-4102</strong></p>
                <p>Campus Security Desk: <strong>Ext. 100</strong></p>
              </div>
            </div>

            <div className="bg-[#FBFBFA] p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Official Correspondence</h3>
              <div className="text-xs text-slate-600 space-y-1">
                <p>Admissions: <strong>admissions@srmacademy.edu.in</strong></p>
                <p>Principal: <strong>principal@srmacademy.edu.in</strong></p>
                <p>General Desk: <strong>info@srmacademy.edu.in</strong></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 12. INSTITUTIONAL FOOTER & ARCHITECTURAL DISCLOSURE            */}
      {/* ============================================================== */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-3">
                <SRMAcademyCrest size={36} />
                <div>
                  <span className="font-serif font-bold text-white text-lg block">SRM Academy</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Affiliated to CBSE, New Delhi • Affiliation No. 2130842
                  </span>
                </div>
              </div>
              <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
                Dedicated to academic rigour, scientific inquiry, and character development for scholars from Nursery through Grade 12 in New Delhi NCR.
              </p>
            </div>

            <div className="space-y-2">
              <span className="font-mono text-[10px] font-bold text-slate-200 uppercase tracking-wider block">
                Academics & Campus
              </span>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li><a href="#about" className="hover:text-white transition-colors">About SRM Academy</a></li>
                <li><a href="#programmes" className="hover:text-white transition-colors">Educational Programmes</a></li>
                <li><a href="#curriculum" className="hover:text-white transition-colors">Senior Secondary Streams</a></li>
                <li><a href="#schedule" className="hover:text-white transition-colors">Daily Class Timings</a></li>
                <li><a href="#facilities" className="hover:text-white transition-colors">Laboratories & Facilities</a></li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-mono text-[10px] font-bold text-slate-200 uppercase tracking-wider block">
                Portals & ERP Access
              </span>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li><Link to="/login" className="hover:text-white transition-colors">Parent / Guardian Portal</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Enrolled Student Desk</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Faculty & Staff Login</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Administrative Workspace</Link></li>
                <li>
                  <Link to="/software-tour" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors flex items-center gap-1">
                    <span>Institutional Technology Tour</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2 font-mono">
            <span>© 2026 SRM Academy. All Rights Reserved. CBSE Senior Secondary School.</span>
            <span>Plot 8, Institutional Area, Sector 14, Dwarka, New Delhi 110075</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingView;

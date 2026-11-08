import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { SRMAcademyCrest } from '../../components/common/FrappeLogo';

export const SoftwareTourView: React.FC = () => {
  // Interactive Custodian Workspace State
  const [activePersona, setActivePersona] = useState<'teacher' | 'bursar' | 'principal' | 'parent'>('teacher');

  // Teacher Workspace Interactive State
  const [teacherRoll, setTeacherRoll] = useState([
    { id: 1, name: 'Ananya Sharma', roll: '10A-01', status: 'PRESENT' as 'PRESENT' | 'ABSENT' | 'LATE' },
    { id: 2, name: 'Rohan Patel', roll: '10A-02', status: 'PRESENT' as 'PRESENT' | 'ABSENT' | 'LATE' },
    { id: 3, name: 'Kavita Iyer', roll: '10A-03', status: 'LATE' as 'PRESENT' | 'ABSENT' | 'LATE' },
    { id: 4, name: 'Arjun Mehta', roll: '10A-04', status: 'ABSENT' as 'PRESENT' | 'ABSENT' | 'LATE' },
  ]);
  const [testScore, setTestScore] = useState<number>(88);

  const calculateGrade = (score: number) => {
    if (score >= 91) return { grade: 'A1', points: '10.0', text: 'Outstanding Mastery' };
    if (score >= 81) return { grade: 'A2', points: '9.0', text: 'Excellent Performance' };
    if (score >= 71) return { grade: 'B1', points: '8.0', text: 'Proficient Understanding' };
    if (score >= 61) return { grade: 'B2', points: '7.0', text: 'Satisfactory Competence' };
    if (score >= 51) return { grade: 'C1', points: '6.0', text: 'Foundational Knowledge' };
    return { grade: 'C2', points: '5.0', text: 'Scheduled for Support' };
  };

  // Bursar Workspace Interactive State
  const [receiptGenerated, setReceiptGenerated] = useState(false);

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-slate-900 font-sans selection:bg-indigo-700 selection:text-white antialiased">
      {/* 1. MASTHEAD */}
      <header className="sticky top-0 z-50 bg-[#FDFCF9]/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3">
              <SRMAcademyCrest size={40} />
              <div>
                <span className="font-serif font-black text-xl text-slate-900 tracking-tight block leading-tight">
                  SRM Academy
                </span>
                <span className="text-[10px] font-mono tracking-widest uppercase text-slate-500 block">
                  Institutional Software & Governance Tour
                </span>
              </div>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <Link to="/" className="hover:text-slate-900 transition-colors">
              ← Return to School Homepage
            </Link>
            <a href="#disciplines" className="hover:text-slate-900 transition-colors">
              Core Disciplines
            </a>
            <a href="#consoles" className="hover:text-slate-900 transition-colors">
              Role Workspaces
            </a>
            <a href="#security" className="hover:text-slate-900 transition-colors">
              Zero-Trust Architecture
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs tracking-wide shadow-xs transition-colors"
            >
              <span>Launch ERP Terminal</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO */}
      <section className="relative pt-12 pb-16 md:pt-16 md:pb-20 border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-mono font-semibold">
            Institutional Technology Architecture
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black text-slate-900 tracking-tight leading-tight">
            The Operating Framework of <br />
            <span className="italic font-serif font-normal text-indigo-800">Campus Governance</span>
          </h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto font-sans leading-relaxed">
            Engineered exclusively for academic custodians — uniting student records, daily classroom roll call, CBSE marks moderation, and transparent bursar ledgers in one calm, role-isolated architecture.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-slate-900 hover:bg-indigo-950 text-white font-medium text-sm transition-colors"
            >
              <span>Access Institutional Portal</span>
              <ArrowRight className="w-4 h-4 text-slate-300" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-sm font-medium transition-colors"
            >
              <span>View School Website</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. THREE DISCIPLINES */}
      <section id="disciplines" className="py-16 md:py-24 bg-[#FDFCF9] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 tracking-tight">
              Three Disciplines of Campus Governance
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Every feature in SRM Academy maps directly into one of three continuous operational workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border-t-2 border-slate-900 pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-serif text-2xl font-bold text-slate-400">01</span>
                <span className="text-[10px] font-mono font-bold uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Intake & Allocation
                </span>
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-900">
                Admissions & Student Information System (SIS)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Multi-stage application review, guardian relationship mapping, automated scholar numbering (ADM-2026-XXXX), and capacity-enforced section allocation.
              </p>
            </div>

            <div className="border-t-2 border-indigo-700 pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-serif text-2xl font-bold text-indigo-300">02</span>
                <span className="text-[10px] font-mono font-bold uppercase text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded">
                  Pedagogy & Rigor
                </span>
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-900">
                Attendance, Timetable & CBSE Gradebook
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Daily classroom roll calls logged in under 20 seconds, automated clash-free timetable orchestration, curved CBSE 9-point scale grading, and cryptographically verified report cards.
              </p>
            </div>

            <div className="border-t-2 border-slate-900 pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-serif text-2xl font-bold text-slate-400">03</span>
                <span className="text-[10px] font-mono font-bold uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Fiscal Stewardship
                </span>
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-900">
                Tuition, Invoicing & Double-Entry Ledger
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Structured term fee schedules with transparent sibling concessions, partial payments, instant PDF and thermal receipts, and real-time bank ledger reconciliation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE WORKSPACES */}
      <section id="consoles" className="py-16 md:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 tracking-tight">
              Interactive Custodian Consoles
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Select an institutional role to test the actual, working components engineered for that custodian’s daily responsibilities.
            </p>

            <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
              {[
                { id: 'teacher' as const, label: 'Class Teacher Console' },
                { id: 'bursar' as const, label: 'Bursar & Treasury Console' },
                { id: 'principal' as const, label: 'Principal Overview' },
                { id: 'parent' as const, label: 'Guardian Portal' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActivePersona(tab.id)}
                  className={`px-4 py-2 rounded-md transition-colors cursor-pointer ${
                    activePersona === tab.id
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#FDFCF9] border border-slate-200 rounded-xl p-6 sm:p-8 max-w-5xl">
            {activePersona === 'teacher' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <h3 className="font-serif font-bold text-lg text-slate-900">
                    Class 10-A Attendance Register
                  </h3>
                  <button
                    onClick={() =>
                      setTeacherRoll((prev) => prev.map((s) => ({ ...s, status: 'PRESENT' as const })))
                    }
                    className="px-3.5 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer self-start sm:self-auto"
                  >
                    Mark All Present
                  </button>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider font-mono">
                      <tr>
                        <th className="py-2.5 px-4">Roll</th>
                        <th className="py-2.5 px-4">Scholar Name</th>
                        <th className="py-2.5 px-4">Current Status</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {teacherRoll.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-4 font-mono text-slate-500">{student.roll}</td>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">{student.name}</td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                                student.status === 'PRESENT'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : student.status === 'ABSENT'
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {student.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="inline-flex gap-1 font-mono text-[10px]">
                              {(['PRESENT', 'ABSENT', 'LATE'] as const).map((st) => (
                                <button
                                  key={st}
                                  onClick={() =>
                                    setTeacherRoll((prev) =>
                                      prev.map((s) => (s.id === student.id ? { ...s, status: st } : s))
                                    )
                                  }
                                  className={`px-2 py-0.5 rounded cursor-pointer ${
                                    student.status === st
                                      ? 'bg-slate-900 text-white font-bold'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {st[0]}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">CBSE Assessment Scale Preview</span>
                      <p className="text-slate-500 text-[11px]">Adjust score slider to verify automated letter grade assignment.</p>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-slate-500">Score: </span>
                      <span className="font-bold text-slate-900 text-sm">{testScore} / 100</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="35"
                    max="100"
                    value={testScore}
                    onChange={(e) => setTestScore(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-md appearance-none cursor-pointer accent-slate-900"
                  />

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="text-slate-600">{calculateGrade(testScore).text}</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-500">GPA: {calculateGrade(testScore).points}</span>
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Grade {calculateGrade(testScore).grade}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePersona === 'bursar' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <h3 className="font-serif font-bold text-lg text-slate-900">
                    Fee Receipt Generator & Ledger Post
                  </h3>
                  <button
                    onClick={() => setReceiptGenerated(true)}
                    disabled={receiptGenerated}
                    className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {receiptGenerated ? 'Receipt Reconciled' : 'Generate Sealed Receipt'}
                  </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3 text-xs">
                  <div className="flex justify-between font-mono text-[11px] pb-2 border-b border-slate-100 text-slate-500">
                    <span>Scholar: Suresh Patel (ADM-2026-0003)</span>
                    <span>Class 10-A • Term 1 Invoice</span>
                  </div>

                  <div className="space-y-1.5 py-1">
                    <div className="flex justify-between">
                      <span className="text-slate-700">Term 1 Standard Tuition Fee</span>
                      <span className="font-mono font-semibold text-slate-900">₹35,000.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700">Laboratory Materials & Chemicals Fund</span>
                      <span className="font-mono font-semibold text-slate-900">₹8,500.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700">Physical Education & Athletics Dues</span>
                      <span className="font-mono font-semibold text-slate-900">₹4,000.00</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t-2 border-slate-200 flex justify-between font-bold text-sm">
                    <span className="text-slate-900">Total Invoice Amount</span>
                    <span className="font-mono text-slate-900">₹47,500.00</span>
                  </div>

                  {receiptGenerated && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 flex items-center justify-between text-xs mt-3">
                      <div className="space-y-0.5">
                        <div className="font-bold">Official Receipt #REC-2026-00042 Issued</div>
                        <div className="font-mono text-[10px] text-emerald-700">Posted to double-entry general ledger • Cashier Account 01</div>
                      </div>
                      <span className="font-mono font-bold text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                        RECONCILED
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activePersona === 'principal' && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-slate-200">
                  <h3 className="font-serif font-bold text-lg text-slate-900">
                    Campus Administrative Velocity
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-700">Campus Attendance Rate</span>
                      <span className="font-mono text-emerald-700">94.8%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded" style={{ width: '94.8%' }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                      <span>Threshold: 85.0%</span>
                      <span>796 / 842 Present</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-700">Fee Collection Realization</span>
                      <span className="font-mono text-indigo-900">91.8%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded overflow-hidden">
                      <div className="bg-slate-900 h-full rounded" style={{ width: '91.8%' }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                      <span>Target: ₹92,00,000</span>
                      <span>₹84,50,000 Collected</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePersona === 'parent' && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-slate-200">
                  <h3 className="font-serif font-bold text-lg text-slate-900">
                    Ward Schedule & Ledger Clearance
                  </h3>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 text-xs">
                  <div className="flex justify-between font-mono text-[11px] pb-2 border-b border-slate-100 text-slate-500">
                    <span>Ward: Ananya Sharma • Class 10-A</span>
                    <span>Admission No: ADM-2026-0001</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between p-2 bg-slate-50 rounded border border-slate-100">
                      <div>
                        <span className="font-bold text-slate-900 block">English Literature</span>
                        <span className="text-slate-500 text-[11px]">Period 1 • 08:30 – 09:15 AM (Room 102)</span>
                      </div>
                      <span className="font-mono text-emerald-700 font-semibold text-[11px]">Present</span>
                    </div>

                    <div className="flex justify-between p-2 bg-slate-50 rounded border border-slate-100">
                      <div>
                        <span className="font-bold text-slate-900 block">Physics (Optics & Waves)</span>
                        <span className="text-slate-500 text-[11px]">Period 2 • 09:15 – 10:00 AM (Physics Lab)</span>
                      </div>
                      <span className="font-mono text-emerald-700 font-semibold text-[11px]">Present</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-slate-600">Outstanding Balance:</span>
                    <span className="font-mono font-bold text-emerald-700">₹0.00 (All Term 1 Dues Cleared)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. ZERO-TRUST ARCHITECTURE */}
      <section id="security" className="py-16 md:py-24 bg-[#FDFCF9] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 tracking-tight">
              Declarative Role-Based Access Governance
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Every server route enforces granular permission tokens. Parents and scholars access only authorized personal records through database-layer anti-IDOR filters.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900 uppercase font-mono text-[10px] tracking-wider">
                  Permission Matrix
                </span>
                <span className="font-mono text-[10px] text-slate-500">10 Enforced Roles</span>
              </div>

              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/50 border-b border-slate-200 font-mono text-[10px] text-slate-500 uppercase">
                  <tr>
                    <th className="py-2.5 px-3.5">Campus Role</th>
                    <th className="py-2.5 px-3.5">Attendance</th>
                    <th className="py-2.5 px-3.5">Examinations</th>
                    <th className="py-2.5 px-3.5">Tuition & Fees</th>
                    <th className="py-2.5 px-3.5">Audit Logs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  <tr>
                    <td className="py-2.5 px-3.5 font-bold text-slate-900">SUPER_ADMIN</td>
                    <td className="py-2.5 px-3.5 text-emerald-700">Full Access</td>
                    <td className="py-2.5 px-3.5 text-emerald-700">Publish</td>
                    <td className="py-2.5 px-3.5 text-emerald-700">Reconcile</td>
                    <td className="py-2.5 px-3.5 text-emerald-700">Full Immutable</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-bold text-slate-900">PRINCIPAL</td>
                    <td className="py-2.5 px-3.5 text-emerald-700">Campus View</td>
                    <td className="py-2.5 px-3.5 text-emerald-700">Approve</td>
                    <td className="py-2.5 px-3.5 text-slate-600">Ledger View</td>
                    <td className="py-2.5 px-3.5 text-slate-600">Read Only</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-bold text-slate-900">TEACHER</td>
                    <td className="py-2.5 px-3.5 text-emerald-700">Write Class</td>
                    <td className="py-2.5 px-3.5 text-indigo-700">Grade Draft</td>
                    <td className="py-2.5 px-3.5 text-slate-300">No Access</td>
                    <td className="py-2.5 px-3.5 text-slate-300">No Access</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-bold text-slate-900">BURSAR</td>
                    <td className="py-2.5 px-3.5 text-slate-300">No Access</td>
                    <td className="py-2.5 px-3.5 text-slate-300">No Access</td>
                    <td className="py-2.5 px-3.5 text-emerald-700">Full Collect</td>
                    <td className="py-2.5 px-3.5 text-slate-600">Read Only</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-bold text-slate-900">PARENT</td>
                    <td className="py-2.5 px-3.5 text-slate-600">Ward Only</td>
                    <td className="py-2.5 px-3.5 text-slate-600">Ward Card</td>
                    <td className="py-2.5 px-3.5 text-slate-600">Ward Dues</td>
                    <td className="py-2.5 px-3.5 text-slate-300">No Access</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="lg:col-span-5 bg-slate-900 text-white border border-slate-800 rounded-xl p-5 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-bold text-slate-300 uppercase">Cryptographic Audit Trail</span>
                </div>
                <span className="text-emerald-400 text-[10px]">VERIFIED</span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800 space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span className="text-emerald-400 font-bold">POST /attendance/bulk</span>
                    <span>Class 10-A</span>
                  </div>
                  <div className="text-slate-300">32 scholars roll call logged</div>
                  <div className="text-[10px] text-slate-500">Actor: teacher@school.erp • Signed SHA-256</div>
                </div>

                <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800 space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span className="text-sky-400 font-bold">POST /fees/invoices/pay</span>
                    <span>#REC-2026-0042</span>
                  </div>
                  <div className="text-slate-300">Tuition receipt reconciled</div>
                  <div className="text-[10px] text-slate-500">Actor: accountant@school.erp • Bank NEFT</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <SRMAcademyCrest size={32} />
              <div>
                <span className="font-serif font-bold text-white text-base block">SRM Academy</span>
                <span className="text-[10px] font-mono text-slate-400">
                  Affiliated to CBSE, New Delhi • Senior Secondary Section
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 font-medium">
              <Link to="/" className="text-slate-300 hover:text-white transition-colors">
                Public School Website
              </Link>
              <Link to="/login" className="hover:text-white transition-colors">
                Staff & Admin Portal
              </Link>
              <Link to="/login" className="hover:text-white transition-colors">
                Guardian Portal
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2 font-mono">
            <span>© 2026 SRM Academy. All Rights Reserved.</span>
            <span>Zero-Trust Enterprise Platform • FERPA & ISO 27001 Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SoftwareTourView;

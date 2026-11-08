import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  BookOpen,
  Calendar,
  Layers,
  GraduationCap,
  Plus,
  CheckCircle,
  X,
  UserCheck,
} from 'lucide-react';

export const AcademicsView: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'classes' | 'years' | 'subjects'>('classes');

  // Modals
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

  // Queries
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get<any>('/academics/classes'),
  });

  const { data: yearsData } = useQuery({
    queryKey: ['years'],
    queryFn: () => api.get<any>('/academics/years'),
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get<any>('/academics/subjects'),
  });

  const classes = classesData?.data || [];
  const years = yearsData?.data || [];
  const subjects = subjectsData?.data || [];

  // Form states
  const [classForm, setClassForm] = useState({ name: '', code: '', order: 1 });
  const [sectionForm, setSectionForm] = useState({ name: '', classId: '', roomNumber: '', capacity: 40 });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', classId: '', creditHours: 1.0 });

  const classMutation = useMutation({
    mutationFn: (data: any) => api.post('/academics/classes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsClassModalOpen(false);
      setClassForm({ name: '', code: '', order: 1 });
    },
  });

  const sectionMutation = useMutation({
    mutationFn: (data: any) => api.post('/academics/sections', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsSectionModalOpen(false);
      setSectionForm({ name: '', classId: '', roomNumber: '', capacity: 40 });
    },
  });

  const subjectMutation = useMutation({
    mutationFn: (data: any) => api.post('/academics/subjects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setIsSubjectModalOpen(false);
      setSubjectForm({ name: '', code: '', classId: '', creditHours: 1.0 });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Academic Structure & Setup</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure academic years, grades, class sections, course subjects, and classroom rosters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsClassModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class</span>
          </button>
          <button
            onClick={() => {
              if (classes.length > 0 && !sectionForm.classId) {
                setSectionForm((prev) => ({ ...prev, classId: classes[0].id }));
              }
              setIsSectionModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-brand-600" />
            <span>Add Section</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('classes')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'classes'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Classes & Sections ({classes.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('years')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'years'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Academic Years ({years.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'subjects'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Course Subjects ({subjects.length})</span>
        </button>
      </div>

      {/* TAB 1: CLASSES & SECTIONS */}
      {activeTab === 'classes' && (
        classes.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
            <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No classes configured yet.</p>
            <p className="text-slate-400 mt-1">Get started by creating your institution's grade levels and sections.</p>
            <button
              onClick={() => setIsClassModalOpen(true)}
              className="mt-3 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium cursor-pointer"
            >
              Add First Class
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((c: any) => (
              <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{c.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">Code: {c.code}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                    Order {c.order}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Sections ({c.sections?.length || 0})
                  </p>
                  <div className="space-y-2">
                    {c.sections?.map((s: any) => (
                      <div
                        key={s.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900">Section {s.name}</span>
                          <span className="text-slate-500 ml-2">
                            ({s.roomNumber || 'Room N/A'} • Cap: {s.capacity})
                          </span>
                          {s.classTeacher && (
                            <p className="text-[11px] text-brand-700 mt-0.5">
                              Teacher: {s.classTeacher.firstName} {s.classTeacher.lastName}
                            </p>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {s._count?.enrolments || 0} enrolled
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* TAB 2: ACADEMIC YEARS */}
      {activeTab === 'years' && (
        years.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No academic years recorded.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {years.map((y: any) => (
              <div key={y.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base">{y.name}</h3>
                  {y.isCurrent && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle className="w-3 h-3" /> Current Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(y.startDate).toLocaleDateString()} — {new Date(y.endDate).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )
      )}

      {/* TAB 3: SUBJECTS */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                if (classes.length > 0 && !subjectForm.classId) {
                  setSubjectForm((prev) => ({ ...prev, classId: classes[0].id }));
                }
                setIsSubjectModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow-sm"
            >
              Add Subject
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Subject Code</th>
                  <th className="py-3 px-4">Subject Name</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Credit Hours</th>
                  <th className="py-3 px-4">Elective</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {subjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                      No course subjects configured yet.
                    </td>
                  </tr>
                ) : (
                  subjects.map((sub: any) => (
                    <tr key={sub.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-medium text-brand-700">{sub.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{sub.name}</td>
                      <td className="py-3 px-4">{sub.class?.name}</td>
                      <td className="py-3 px-4">{sub.creditHours} hrs/week</td>
                      <td className="py-3 px-4">{sub.isElective ? 'Yes' : 'No'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD CLASS MODAL */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add New Class</h3>
              <button onClick={() => setIsClassModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                classMutation.mutate(classForm);
              }}
              className="space-y-3 mt-4 text-xs"
            >
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Class Name (e.g. Grade 11)
                </label>
                <input
                  type="text"
                  required
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Code (e.g. G11)
                </label>
                <input
                  type="text"
                  required
                  value={classForm.code}
                  onChange={(e) => setClassForm({ ...classForm, code: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={classMutation.isPending}
                  className="px-4 py-1.5 rounded-lg bg-brand-600 text-white font-semibold shadow-sm"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SECTION MODAL */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add Class Section</h3>
              <button onClick={() => setIsSectionModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sectionMutation.mutate(sectionForm);
              }}
              className="space-y-3 mt-4 text-xs"
            >
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Class</label>
                <select
                  required
                  value={sectionForm.classId}
                  onChange={(e) => setSectionForm({ ...sectionForm, classId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                >
                  {classes.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Section Name (e.g. C)
                </label>
                <input
                  type="text"
                  required
                  value={sectionForm.name}
                  onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Room Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room 302"
                  value={sectionForm.roomNumber}
                  onChange={(e) => setSectionForm({ ...sectionForm, roomNumber: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sectionMutation.isPending}
                  className="px-4 py-1.5 rounded-lg bg-brand-600 text-white font-semibold shadow-sm"
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

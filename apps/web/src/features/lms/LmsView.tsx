import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { UserRoleType } from '@school-erp/shared';
import {
  BookOpen,
  Calendar,
  Clock,
  Plus,
  FileCheck,
  CheckCircle,
  AlertCircle,
  X,
  Upload,
  User,
  Award,
} from 'lucide-react';

export const LmsView: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Announce to screen reader
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
    announceToScreenReader('LMS view loaded. Use tab to navigate assignments and submissions.');
    return () => announceToScreenReader('LMS view unloaded.');
  }, []);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAssignmentForSubmit, setSelectedAssignmentForSubmit] =
    useState<any | null>(null);
  const [selectedAssignmentForGrading, setSelectedAssignmentForGrading] =
    useState<any | null>(null);

  // Queries
  const { data: assignmentsData, isLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => api.get<any>('/lms/assignments'),
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get<any>('/academics/classes'),
  });

  const allSubjects = classesData?.data?.flatMap((c: any) =>
    c.subjects.map((s: any) => ({ ...s, className: c.name }))
  ) || [];

  // Create Assignment State
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    subjectId: '',
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    maxMarks: 100,
    fileUrl: '',
  });

  // Submit Homework State
  const [submitContent, setSubmitContent] = useState('');
  const [submitFileUrl, setSubmitFileUrl] = useState('');

  // Grading Buffer with proper typing
  const [gradingMarks, setGradingMarks] = useState<
    Record<string, { marks: number | string; feedback: string }>
  >({});

  // Initialize grading states when assignment changes
  useEffect(() => {
    if (selectedAssignmentForGrading?.submissions) {
      const initialStates: Record<string, { marks: number | string; feedback: string }> = {};
      selectedAssignmentForGrading.submissions.forEach((sub: any) => {
        initialStates[sub.id] = {
          marks: sub.marksGiven !== null ? Number(sub.marksGiven) : '',
          feedback: sub.feedback || '',
        };
      });
      setGradingMarks(initialStates);
    }
  }, [selectedAssignmentForGrading]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/lms/assignments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setIsCreateModalOpen(false);
      setCreateForm({
        title: '',
        description: '',
        subjectId: '',
        dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        maxMarks: 100,
        fileUrl: '',
      });
      showToast('Assignment published successfully!', 'success');
    },
  });

  const submitMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.post(`/lms/assignments/${id}/submit`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setSelectedAssignmentForSubmit(null);
      setSubmitContent('');
      setSubmitFileUrl('');
    },
  });

  const gradeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.patch(`/lms/submissions/${id}/grade`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      // Refresh grading states after successful grade entry
      if (selectedAssignmentForGrading?.submissions) {
        const updatedStates: Record<string, { marks: number | string; feedback: string }> = {};
        selectedAssignmentForGrading.submissions.forEach((sub: any) => {
          const state = gradingMarks[sub.id];
          if (state?.marks !== undefined) {
            updatedStates[sub.id] = {
              marks: state.marks,
              feedback: state.feedback,
            };
          }
        });
        setGradingMarks(updatedStates);
      }
      showToast('Grades recorded successfully!', 'success');
    },
  });

  const isTeacherOrAdmin =
    user?.role === UserRoleType.TEACHER ||
    user?.role === UserRoleType.SUPER_ADMIN ||
    user?.role === UserRoleType.PRINCIPAL;

  const isStudent = user?.role === UserRoleType.STUDENT;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Learning Management (LMS)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Course assignments, student homework submissions & teacher evaluations
          </p>
        </div>

        {isTeacherOrAdmin && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assignment</span>
          </button>
        )}
      </div>

      {/* Assignments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-sm text-slate-400">
            Loading coursework...
          </div>
        ) : assignmentsData?.data?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-sm text-slate-400 italic">
            No coursework or homework assignments posted yet.
          </div>
        ) : (
          assignmentsData?.data?.map((asgn: any) => {
            const isDueSoon =
              new Date(asgn.dueDate).getTime() - Date.now() < 2 * 86400000;
            const mySubmission = asgn.submissions?.[0];

            return (
              <div
                key={asgn.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-brand-700 px-2.5 py-0.5 rounded-full bg-brand-50 border border-brand-100">
                      {asgn.subject.name}
                    </span>
                    <span
                      className={`text-xs font-semibold inline-flex items-center gap-1 ${
                        isDueSoon ? 'text-amber-600' : 'text-slate-500'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Due {new Date(asgn.dueDate).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                    {asgn.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                    {asgn.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                    <span>Teacher: {asgn.teacher.firstName} {asgn.teacher.lastName}</span>
                    <span>Max Marks: {asgn.maxMarks || 100}</span>
                  </div>

                  {isStudent && (
                    <div>
                      {mySubmission ? (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-xs flex items-center justify-between">
                          <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            Submitted
                          </span>
                          {mySubmission.marksGiven !== null ? (
                            <span className="font-bold text-slate-900">
                              Grade: {mySubmission.marksGiven} / {asgn.maxMarks}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Pending review</span>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedAssignmentForSubmit(asgn)}
                          className="w-full py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 shadow-sm"
                        >
                          Submit Homework
                        </button>
                      )}
                    </div>
                  )}

                  {isTeacherOrAdmin && (
                    <button
                      onClick={() => setSelectedAssignmentForGrading(asgn)}
                      className="w-full py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center justify-center gap-2"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>View Submissions ({asgn._count?.submissions || 0})</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Assignment Modal */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Post Course Assignment</h2>
              <button onClick={() => setIsCreateModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(createForm);
              }}
              className="space-y-4 mt-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" aria-label="subject">
                  Subject
                </label>
                <select
                  required
                  aria-label="select subject"
                  value={createForm.subjectId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, subjectId: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium"
                >
                  <option value="">Select subject...</option>
                  {allSubjects.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.className}: {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" aria-label="assignment title">
                  Assignment Title
                </label>
                <input
                  type="text"
                  required
                  aria-label="assignment title"
                  placeholder="e.g. Chapter 4 Problem Set"
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" aria-label="instructions / description">
                  Instructions / Description
                </label>
                <textarea
                  required
                  aria-label="instructions / description"
                  rows={4}
                  placeholder="Provide detailed instructions for students..."
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1" aria-label="submission deadline">
                    Submission Deadline
                  </label>
                  <input
                    type="date"
                    required
                    aria-label="submission deadline"
                    value={createForm.dueDate}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, dueDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1" aria-label="max marks">
                    Max Marks
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    aria-label="max marks"
                    value={createForm.maxMarks}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, maxMarks: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 shadow-sm disabled:opacity-50"
                >
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Submit Modal */}
      {selectedAssignmentForSubmit && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Submit Homework</h2>
              <button onClick={() => setSelectedAssignmentForSubmit(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="my-3 p-3 rounded-xl bg-slate-50 text-xs text-slate-600">
              Assignment: <span className="font-semibold text-slate-900">
                {selectedAssignmentForSubmit.title}
              </span>
              <br />
              Subject: {selectedAssignmentForSubmit.subject.name}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitMutation.mutate({
                  id: selectedAssignmentForSubmit.id,
                  data: {
                    content: submitContent,
                    fileUrl: submitFileUrl,
                  },
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" aria-label="your answers / notes">
                  Your Answers / Notes
                </label>
                <textarea
                  required
                  aria-label="your answers / notes"
                  rows={5}
                  placeholder="Type your response or solutions here..."
                  value={submitContent}
                  onChange={(e) => setSubmitContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" aria-label="attachment file url">
                  Attachment File URL (Optional)
                </label>
                <input
                  type="url"
                  aria-label="attachment file url"
                  placeholder="https://drive.google.com/your-homework-doc"
                  value={submitFileUrl}
                  onChange={(e) => setSubmitFileUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedAssignmentForSubmit(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 shadow-sm"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Grading View Modal */}
      {selectedAssignmentForGrading && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Student Submissions</h2>
                <p className="text-xs text-slate-500">
                  {selectedAssignmentForGrading.title}
                </p>
              </div>
              <button onClick={() => setSelectedAssignmentForGrading(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-4">
              {selectedAssignmentForGrading.submissions?.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400 italic">
                  No students have submitted this assignment yet.
                </div>
              ) : (
                selectedAssignmentForGrading.submissions?.map((sub: any) => {
                  const state = gradingMarks[sub.id];

                  return (
                    <div key={sub.id} className="py-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {sub.student.firstName} {sub.student.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Adm: {sub.student.admissionNumber} •
                            Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                          </div>
                        </div>

                        {sub.fileUrl && (
                          <a
                            href={sub.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-brand-600 hover:underline font-semibold"
                          >
                            View Attachment
                          </a>
                        )}
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed font-mono">
                        {sub.content || '(No text content provided)'}
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          placeholder="Marks"
                          min="0"
                          max={selectedAssignmentForGrading.maxMarks || 100}
                          defaultValue={state?.marks ?? ''}
                          onChange={(e) =>
                            setGradingMarks({
                              ...gradingMarks,
                              [sub.id]: {
                                marks: Number(e.target.value),
                                feedback: state?.feedback || '',
                              },
                            })
                          }
                          className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                        />
                        <input
                          type="text"
                          placeholder="Feedback remarks..."
                          defaultValue={state?.feedback ?? ''}
                          onChange={(e =>
                            setGradingMarks({
                              ...gradingMarks,
                              [sub.id]: {
                                marks: state?.marks ?? '',
                                feedback: e.target.value,
                              },
                            })
                          )
                          }
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                        />
                        <button
                          onClick={() =>
                            gradeMutation.mutate({
                              id: sub.id,
                              data: {
                                marksGiven: Number(state?.marks ?? 0),
                                feedback: state?.feedback || '',
                              },
                            })
                          }
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                        >
                          Grade
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )};
    </div>
  );
};

// Helper toast function - in a real app this would come from a toast provider
const showToast = (message: string, type: 'success' | 'error') => {
  const colors = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
  };
  alert(message); // Placeholder - replace with actual toast implementation
};
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle,
  Clock,
  RotateCcw,
  BookMarked,
  X,
  AlertTriangle,
} from 'lucide-react';

export const LibraryView: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'catalog' | 'issues'>('catalog');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedCopyForIssue, setSelectedCopyForIssue] = useState<any | null>(null);

  // Queries
  const { data: booksData, isLoading: isBooksLoading } = useQuery({
    queryKey: ['library-books', search, categoryFilter],
    queryFn: () =>
      api.get<any>('/library/books', {
        search: search || undefined,
        category: categoryFilter || undefined,
      }),
  });

  const { data: issuesData, isLoading: isIssuesLoading } = useQuery({
    queryKey: ['library-issues'],
    queryFn: () => api.get<any>('/library/issues'),
  });

  const { data: studentsData } = useQuery({
    queryKey: ['students-brief'],
    queryFn: () => api.get<any>('/students'),
  });

  // Add Book Form
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Science',
    copiesCount: 3,
  });

  // Issue Book Form
  const [issueForm, setIssueForm] = useState({
    studentId: '',
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  });

  // Mutations
  const addBookMutation = useMutation({
    mutationFn: (data: any) => api.post('/library/books', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
      setIsAddBookModalOpen(false);
      setBookForm({ title: '', author: '', isbn: '', category: 'Science', copiesCount: 3 });
    },
  });

  const issueBookMutation = useMutation({
    mutationFn: (data: any) => api.post('/library/issues', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
      queryClient.invalidateQueries({ queryKey: ['library-issues'] });
      setIsIssueModalOpen(false);
      setSelectedCopyForIssue(null);
    },
  });

  const returnBookMutation = useMutation({
    mutationFn: (copyId: string) => api.post('/library/returns', { copyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
      queryClient.invalidateQueries({ queryKey: ['library-issues'] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Library & Circulation</h1>
          <p className="text-sm text-slate-500 mt-1">
            Book catalog management, barcode copies tracking & loan returns with overdue fine audits
          </p>
        </div>

        <button
          onClick={() => setIsAddBookModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Book</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'catalog'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Books Catalog</span>
        </button>
        <button
          onClick={() => setActiveTab('issues')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'issues'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Active Issues & Overdue</span>
        </button>
      </div>

      {/* TAB 1: CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search books by title, author, ISBN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm rounded-xl border border-slate-200"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm"
            >
              <option value="">All Categories</option>
              <option value="Science">Science</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Literature">Literature</option>
              <option value="History">History</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isBooksLoading ? (
              <div className="col-span-full py-12 text-center text-sm text-slate-400">Loading catalog...</div>
            ) : booksData?.data?.length === 0 ? (
              <div className="col-span-full py-12 text-center text-sm text-slate-400 italic">No books found.</div>
            ) : (
              booksData?.data?.map((book: any) => {
                const availableCopy = book.copies.find((c: any) => c.status === 'AVAILABLE');

                return (
                  <div
                    key={book.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {book.category}
                        </span>
                        <span className="text-xs font-bold text-slate-600 font-mono">
                          {book.availableCopies} / {book.totalCopies} Available
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base line-clamp-1">{book.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">Author: {book.author}</p>
                      {book.isbn && <p className="text-[11px] text-slate-400 font-mono mt-0.5">ISBN: {book.isbn}</p>}
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-[11px] text-slate-500">
                        {book.availableCopies > 0 ? (
                          <span className="text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> In Stock
                          </span>
                        ) : (
                          <span className="text-rose-600 font-medium flex items-center gap-1">
                            <X className="w-3.5 h-3.5" /> All Borrowed
                          </span>
                        )}
                      </div>

                      {availableCopy && (
                        <button
                          onClick={() => {
                            setSelectedCopyForIssue(availableCopy);
                            setIsIssueModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700"
                        >
                          Issue Copy
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE ISSUES */}
      {activeTab === 'issues' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold">
              <tr>
                <th className="px-4 py-3">Book Title</th>
                <th className="px-4 py-3">Barcode</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Issue Date</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isIssuesLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading loans...</td>
                </tr>
              ) : issuesData?.data?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">No book loans recorded.</td>
                </tr>
              ) : (
                issuesData?.data?.map((issue: any) => {
                  const isOverdue =
                    issue.status === 'ISSUED' && new Date() > new Date(issue.dueDate);

                  return (
                    <tr key={issue.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{issue.copy.book.title}</td>
                      <td className="px-4 py-3 font-mono text-xs text-brand-700 font-bold">{issue.copy.barcode}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {issue.student.firstName} {issue.student.lastName}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{new Date(issue.issueDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{new Date(issue.dueDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            issue.status === 'RETURNED'
                              ? 'bg-slate-100 text-slate-700'
                              : isOverdue
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {issue.status === 'RETURNED' ? 'Returned' : isOverdue ? 'OVERDUE' : 'Issued'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {issue.status !== 'RETURNED' && (
                          <button
                            onClick={() => returnBookMutation.mutate(issue.copyId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Return</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Book Modal */}
      {isAddBookModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add Book to Library</h2>
              <button onClick={() => setIsAddBookModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addBookMutation.mutate(bookForm);
              }}
              className="space-y-4 mt-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Book Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fundamentals of Modern Physics"
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Author</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. H.C. Verma"
                  value={bookForm.author}
                  onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={bookForm.category}
                    onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  >
                    <option value="Science">Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Literature">Literature</option>
                    <option value="History">History</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Copies</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={bookForm.copiesCount}
                    onChange={(e) => setBookForm({ ...bookForm, copiesCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ISBN (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 978-0-123456-47-2"
                  value={bookForm.isbn}
                  onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddBookModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addBookMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"
                >
                  Create Book & Copies
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Book Modal */}
      {isIssueModalOpen && selectedCopyForIssue && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Issue Book Copy</h2>
              <button onClick={() => setIsIssueModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="my-3 p-3 rounded-xl bg-slate-50 text-xs text-slate-600">
              Barcode: <span className="font-mono font-bold text-brand-700">{selectedCopyForIssue.barcode}</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                issueBookMutation.mutate({
                  copyId: selectedCopyForIssue.id,
                  studentId: issueForm.studentId,
                  dueDate: issueForm.dueDate,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Student</label>
                <select
                  required
                  value={issueForm.studentId}
                  onChange={(e) => setIssueForm({ ...issueForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="">Choose borrower...</option>
                  {studentsData?.data?.map((st: any) => (
                    <option key={st.id} value={st.id}>
                      {st.firstName} {st.lastName} ({st.admissionNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Due Return Date</label>
                <input
                  type="date"
                  required
                  value={issueForm.dueDate}
                  onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issueBookMutation.isPending || !issueForm.studentId}
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50"
                >
                  Confirm Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

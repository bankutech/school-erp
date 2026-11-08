import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  Bell,
  Mail,
  Send,
  Plus,
  Trash2,
  Calendar,
  Users,
  CheckCircle,
  X,
  User,
  Inbox,
} from 'lucide-react';
import { NoticeTarget } from '@school-erp/shared';

export const CommunicationView: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'notices' | 'messages'>('notices');
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  // Queries
  const { data: noticesData, isLoading: isNoticesLoading } = useQuery({
    queryKey: ['notices'],
    queryFn: () => api.get<any>('/communication/notices'),
  });

  const { data: messagesData, isLoading: isMessagesLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: () => api.get<any>('/communication/messages'),
  });

  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ['users-list-for-msg'],
    queryFn: () => api.get<any>('/users', { limit: 100 }),
    enabled: isMessageModalOpen,
  });

  // Notice Form State
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    targetAudience: NoticeTarget.ALL,
    expiresAt: '',
  });

  // Message Form State
  const [messageForm, setMessageForm] = useState({
    receiverId: '',
    subject: '',
    body: '',
  });

  // Mutations
  const createNoticeMutation = useMutation({
    mutationFn: (data: any) => api.post('/communication/notices', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      setIsNoticeModalOpen(false);
      setNoticeForm({
        title: '',
        content: '',
        targetAudience: NoticeTarget.ALL,
        expiresAt: '',
      });
    },
  });

  const deleteNoticeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/communication/notices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: any) => api.post('/communication/messages', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setIsMessageModalOpen(false);
      setMessageForm({
        receiverId: '',
        subject: '',
        body: '',
      });
    },
  });

  const audienceBadgeColor: Record<string, string> = {
    [NoticeTarget.ALL]: 'bg-purple-100 text-purple-800 border-purple-200',
    [NoticeTarget.STAFF]: 'bg-blue-100 text-blue-800 border-blue-200',
    [NoticeTarget.TEACHERS]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    [NoticeTarget.STUDENTS]: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    [NoticeTarget.PARENTS]: 'bg-amber-100 text-amber-800 border-amber-200',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Communication & Circulars</h1>
          <p className="text-sm text-slate-500 mt-1">
            School-wide announcements, targeted notifications & staff-parent direct messaging
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'notices' ? (
            <button
              onClick={() => setIsNoticeModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Notice</span>
            </button>
          ) : (
            <button
              onClick={() => setIsMessageModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 shadow-sm transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>Compose Message</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('notices')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'notices'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Circulars & Notices</span>
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'messages'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>In-App Messages</span>
        </button>
      </div>

      {/* TAB 1: NOTICES BOARD */}
      {activeTab === 'notices' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isNoticesLoading ? (
            <div className="col-span-full py-12 text-center text-sm text-slate-400">Loading notices...</div>
          ) : noticesData?.data?.length === 0 ? (
            <div className="col-span-full py-12 text-center text-sm text-slate-400 italic">
              No circulars or notices posted.
            </div>
          ) : (
            noticesData?.data?.map((notice: any) => (
              <div
                key={notice.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        audienceBadgeColor[notice.targetAudience] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Target: {notice.targetAudience}
                    </span>
                    <button
                      onClick={() => deleteNoticeMutation.mutate(notice.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg"
                      title="Delete notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">{notice.title}</h3>
                  <p className="text-xs text-slate-600 mt-2 whitespace-pre-line leading-relaxed">
                    {notice.content}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>By: {notice.publishedBy.firstName} {notice.publishedBy.lastName}</span>
                  <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: INBOX / MESSAGES */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50/80 border-b border-slate-100 font-bold text-sm text-slate-900">
            Messages Inbox ({messagesData?.data?.length || 0})
          </div>

          <div className="divide-y divide-slate-100">
            {isMessagesLoading ? (
              <div className="py-12 text-center text-sm text-slate-400">Loading inbox...</div>
            ) : messagesData?.data?.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400 italic">
                Your messaging inbox is empty.
              </div>
            ) : (
              messagesData?.data?.map((msg: any) => (
                <div key={msg.id} className="p-4 flex items-start gap-4 hover:bg-slate-50/50">
                  <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {msg.sender.firstName[0]}
                    {msg.sender.lastName[0]}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-slate-900">
                        {msg.sender.firstName} {msg.sender.lastName} ({msg.sender.role})
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {msg.subject && (
                      <div className="text-xs font-semibold text-slate-800">{msg.subject}</div>
                    )}
                    <p className="text-xs text-slate-600 leading-relaxed">{msg.body}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Publish Notice Modal */}
      {isNoticeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Publish School Circular</h2>
              <button onClick={() => setIsNoticeModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createNoticeMutation.mutate(noticeForm);
              }}
              className="space-y-4 mt-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Sports Meet 2026 Registration"
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
                <select
                  value={noticeForm.targetAudience}
                  onChange={(e) => setNoticeForm({ ...noticeForm, targetAudience: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium"
                >
                  <option value={NoticeTarget.ALL}>All School Community</option>
                  <option value={NoticeTarget.PARENTS}>Parents Only</option>
                  <option value={NoticeTarget.STUDENTS}>Students Only</option>
                  <option value={NoticeTarget.TEACHERS}>Teachers Only</option>
                  <option value={NoticeTarget.STAFF}>All Staff Members</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Circular Content</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Type the announcement announcement details here..."
                  value={noticeForm.content}
                  onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={noticeForm.expiresAt}
                  onChange={(e) => setNoticeForm({ ...noticeForm, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNoticeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createNoticeMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 shadow-sm"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compose Message Modal */}
      {isMessageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-brand-600" />
                <h2 className="text-lg font-bold text-slate-900">Compose In-App Message</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsMessageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
                aria-label="Close compose message modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessageMutation.mutate(messageForm);
              }}
              className="space-y-4 mt-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Recipient</label>
                <select
                  required
                  value={messageForm.receiverId}
                  onChange={(e) => setMessageForm({ ...messageForm, receiverId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select recipient...</option>
                  {(usersData?.data?.users || usersData?.data || []).map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.role}) — {u.email}
                    </option>
                  ))}
                </select>
                {isUsersLoading && (
                  <p className="text-[11px] text-slate-400 mt-1">Loading users directory...</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inquiry regarding examination schedule"
                  value={messageForm.subject}
                  onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message Content</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type your message content here..."
                  value={messageForm.body}
                  onChange={(e) => setMessageForm({ ...messageForm, body: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMessageModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendMessageMutation.isPending || !messageForm.receiverId}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AcademicProvider } from './context/AcademicContext';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastContainer } from './components/common/Toast';

// Code-split route components for fast on-demand loading
const LandingView = lazy(() => import('./features/landing/LandingView').then(m => ({ default: m.LandingView })));
const SoftwareTourView = lazy(() => import('./features/landing/SoftwareTourView').then(m => ({ default: m.SoftwareTourView })));
const LoginView = lazy(() => import('./features/auth/LoginView').then(m => ({ default: m.LoginView })));
const DashboardView = lazy(() => import('./features/dashboard/DashboardView').then(m => ({ default: m.DashboardView })));
const AdmissionsView = lazy(() => import('./features/admissions/AdmissionsView').then(m => ({ default: m.AdmissionsView })));
const StudentsView = lazy(() => import('./features/students/StudentsView').then(m => ({ default: m.StudentsView })));
const AttendanceView = lazy(() => import('./features/attendance/AttendanceView').then(m => ({ default: m.AttendanceView })));
const FeesView = lazy(() => import('./features/fees/FeesView').then(m => ({ default: m.FeesView })));
const AcademicsView = lazy(() => import('./features/academics/AcademicsView').then(m => ({ default: m.AcademicsView })));
const TimetableOverview = lazy(() => import('./features/timetable/TimetableOverview').then(m => ({ default: m.TimetableOverview })));
const ExamsView = lazy(() => import('./features/exams/ExamsView').then(m => ({ default: m.ExamsView })));
const LmsView = lazy(() => import('./features/lms/LmsView').then(m => ({ default: m.LmsView })));
const CommunicationView = lazy(() => import('./features/communication/CommunicationView').then(m => ({ default: m.CommunicationView })));
const StaffView = lazy(() => import('./features/staff/StaffView').then(m => ({ default: m.StaffView })));
const LibraryView = lazy(() => import('./features/library/LibraryView').then(m => ({ default: m.LibraryView })));
const TransportView = lazy(() => import('./features/transport/TransportView').then(m => ({ default: m.TransportView })));
const InventoryView = lazy(() => import('./features/inventory/InventoryView').then(m => ({ default: m.InventoryView })));
const AccountsView = lazy(() => import('./features/accounts/AccountsView').then(m => ({ default: m.AccountsView })));
const AnalyticsView = lazy(() => import('./features/analytics/AnalyticsView').then(m => ({ default: m.AnalyticsView })));
const UsersView = lazy(() => import('./features/users/UsersView').then(m => ({ default: m.UsersView })));
const AuditView = lazy(() => import('./features/audit/AuditView').then(m => ({ default: m.AuditView })));
const NotFoundView = lazy(() => import('./features/error/NotFoundView').then(m => ({ default: m.NotFoundView })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

const ViewLoader: React.FC = () => (
  <div className="flex-1 min-h-[50vh] flex flex-col items-center justify-center p-8">
    <div className="w-8 h-8 rounded-full border-2 border-brand-200 border-t-brand-700 animate-spin mb-3"></div>
    <span className="text-xs font-medium text-slate-500 tracking-wide">Loading workspace...</span>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AcademicProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Suspense fallback={<ViewLoader />}>
                <Routes>
                  <Route path="/" element={<LandingView />} />
                  <Route path="/software-tour" element={<SoftwareTourView />} />
                  <Route path="/login" element={<LoginView />} />

                  <Route
                    element={
                      <ProtectedRoute>
                        <AppLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/dashboard" element={<DashboardView />} />
                    <Route path="/admissions" element={<AdmissionsView />} />
                    <Route path="/students" element={<StudentsView />} />
                    <Route path="/attendance" element={<AttendanceView />} />
                    <Route path="/timetable" element={<TimetableOverview />} />
                    <Route path="/exams" element={<ExamsView />} />
                    <Route path="/lms" element={<LmsView />} />
                    <Route path="/communication" element={<CommunicationView />} />
                    <Route path="/fees" element={<FeesView />} />
                    <Route path="/staff" element={<StaffView />} />
                    <Route path="/library" element={<LibraryView />} />
                    <Route path="/transport" element={<TransportView />} />
                    <Route path="/inventory" element={<InventoryView />} />
                    <Route path="/accounts" element={<AccountsView />} />
                    <Route path="/analytics" element={<AnalyticsView />} />
                    <Route path="/academics" element={<AcademicsView />} />
                    <Route path="/users" element={<UsersView />} />
                    <Route path="/audit" element={<AuditView />} />
                    <Route path="*" element={<NotFoundView />} />
                  </Route>

                  <Route path="*" element={<NotFoundView />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AcademicProvider>
        </AuthProvider>
      </QueryClientProvider>
      <ToastContainer />
    </ErrorBoundary>
  );
};

export default App;

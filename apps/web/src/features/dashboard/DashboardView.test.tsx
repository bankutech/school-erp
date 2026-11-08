import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardView } from './DashboardView';

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'admin-id',
      email: 'admin@school.erp',
      firstName: 'Amitabh',
      lastName: 'Sen',
      role: 'SUPER_ADMIN',
    },
    permissions: ['ALL'],
    hasPermission: () => true,
    hasRole: () => true,
  }),
}));

// Mock AcademicContext
vi.mock('../../context/AcademicContext', () => ({
  useAcademic: () => ({
    academicYears: [{ id: 'ay-2026', name: '2026-2027', isCurrent: true }],
    selectedYearId: 'ay-2026',
    selectedYear: { id: 'ay-2026', name: '2026-2027', isCurrent: true },
    setSelectedYearId: vi.fn(),
    isLoadingYears: false,
    isCurrentYear: true,
    resetToActiveYear: vi.fn(),
  }),
}));

// Mock api
vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      success: true,
      data: {
        totalStudents: 850,
        todayAttendanceRate: 95.4,
        totalFeeCollected: 8500000,
        pendingAdmissions: 24,
        recentAudits: [],
      },
    }),
  },
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('DashboardView - Rendering & Operations Cockpit', () => {
  it('renders dashboard loading state then metrics', async () => {
    renderWithProviders(<DashboardView />);
    // In loaded state it should show stats
    expect(await screen.findByText(/850/)).toBeInTheDocument();
  });
});

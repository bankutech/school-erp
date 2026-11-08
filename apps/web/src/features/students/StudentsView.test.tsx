import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StudentsView } from './StudentsView';

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'mock-admin-id',
      email: 'admin@school.erp',
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN',
    },
    permissions: ['STUDENTS_READ', 'STUDENTS_WRITE', 'STUDENTS_PROMOTE', 'STUDENTS_ARCHIVE'],
    hasPermission: () => true,
    hasRole: () => true,
  }),
}));

// Mock AcademicContext
vi.mock('../../context/AcademicContext', () => ({
  useAcademic: () => ({
    academicYears: [{ id: 'ay-1', name: '2026-2027', isCurrent: true }],
    selectedYearId: 'ay-1',
    selectedYear: { id: 'ay-1', name: '2026-2027', isCurrent: true },
    setSelectedYearId: vi.fn(),
    isLoadingYears: false,
    isCurrentYear: true,
    resetToActiveYear: vi.fn(),
  }),
}));

// Mock api
vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url.includes('/academics/classes')) {
        return Promise.resolve({ success: true, data: [] });
      }
      if (url.includes('/students')) {
        return Promise.resolve({
          success: true,
          data: [
            {
              id: 's-1',
              admissionNumber: 'ADM-2026-0001',
              firstName: 'Aarav',
              lastName: 'Sharma',
              gender: 'MALE',
              isActive: true,
              enrolments: [{ class: { name: 'Grade 10' }, section: { name: 'A' }, academicYear: { name: '2026-2027' } }],
              guardians: [{ isPrimary: true, guardian: { name: 'Rajesh Sharma', phone: '+91 98765 43210', relation: 'Father' } }],
            },
          ],
          meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
        });
      }
      return Promise.resolve({ success: true, data: [] });
    }),
    post: vi.fn().mockResolvedValue({ success: true }),
    patch: vi.fn().mockResolvedValue({ success: true }),
    delete: vi.fn().mockResolvedValue({ success: true }),
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

describe('StudentsView - Rendering & Accessibility', () => {
  it('renders the Student Information System header and action buttons', async () => {
    renderWithProviders(<StudentsView />);
    expect(screen.getByText(/Student Information System/i)).toBeInTheDocument();
    expect(screen.getByText(/New Admission/i)).toBeInTheDocument();
  });

  it('renders search input with accessible label', async () => {
    renderWithProviders(<StudentsView />);
    const searchInput = screen.getByRole('textbox', { name: /First Name or admission number search/i });
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('placeholder', expect.stringContaining('Search by First Name'));
  });
});

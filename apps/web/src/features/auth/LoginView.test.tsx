import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginView } from './LoginView';

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    hasPermission: () => false,
    hasRole: () => false,
  }),
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

describe('LoginView - Rendering & Auth Form Integrity', () => {
  it('renders institutional login title and form inputs', () => {
    renderWithProviders(<LoginView />);
    expect(screen.getAllByText(/SRM Academy/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Sign In to Institutional Dashboard/i })).toBeInTheDocument();
  });

  it('provides quick persona credentials helper for testing', () => {
    renderWithProviders(<LoginView />);
    expect(screen.getByText(/Institutional Demo Personas/i)).toBeInTheDocument();
  });
});

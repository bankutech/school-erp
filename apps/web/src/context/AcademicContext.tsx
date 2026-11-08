import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface AcademicYearRecord {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  createdAt?: string;
  _count?: { enrolments: number };
}

interface AcademicContextType {
  academicYears: AcademicYearRecord[];
  selectedYearId: string;
  selectedYear: AcademicYearRecord | null;
  setSelectedYearId: (id: string) => void;
  isLoadingYears: boolean;
  isCurrentYear: boolean;
  resetToActiveYear: () => void;
}

const AcademicContext = createContext<AcademicContextType | undefined>(undefined);

export const AcademicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: yearsData, isLoading: isLoadingYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: AcademicYearRecord[] }>('/academics/years');
      return res.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const academicYears = yearsData || [];
  const [selectedYearId, setSelectedYearId] = useState<string>('');

  // Default to the current academic year once data is loaded
  useEffect(() => {
    if (academicYears.length > 0) {
      // If no year is selected, or currently selected year is not in the list
      const exists = academicYears.some((y) => y.id === selectedYearId);
      if (!selectedYearId || !exists) {
        const current = academicYears.find((y) => y.isCurrent) || academicYears[0];
        if (current) {
          setSelectedYearId(current.id);
        }
      }
    }
  }, [academicYears, selectedYearId]);

  const selectedYear = academicYears.find((y) => y.id === selectedYearId) || null;
  const isCurrentYear = selectedYear ? selectedYear.isCurrent : true;

  const resetToActiveYear = () => {
    const current = academicYears.find((y) => y.isCurrent);
    if (current) {
      setSelectedYearId(current.id);
    }
  };

  return (
    <AcademicContext.Provider
      value={{
        academicYears,
        selectedYearId,
        selectedYear,
        setSelectedYearId,
        isLoadingYears,
        isCurrentYear,
        resetToActiveYear,
      }}
    >
      {children}
    </AcademicContext.Provider>
  );
};

export const useAcademic = () => {
  const context = useContext(AcademicContext);
  if (!context) {
    throw new Error('useAcademic must be used within an AcademicProvider');
  }
  return context;
};

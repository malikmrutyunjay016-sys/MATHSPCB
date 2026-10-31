// Helper utilities for Student Academic Status classification and color badge rendering
import { Student } from '../types';

export type StudentStatusType = 'Active' | 'Back' | 'CLC Taken' | 'Graduated';

export interface StudentStatusInfo {
  label: StudentStatusType;
  badgeClass: string;
  dotClass: string;
  colorKey: 'active' | 'back' | 'clc' | 'graduated';
}

/**
 * Normalizes and returns canonical status information with distinctive styling colors
 * - Active: Emerald Green
 * - Back: Amber / Orange
 * - CLC Taken: Rose / Red
 * - Graduated: Indigo / Purple
 */
export function getStudentStatusInfo(rawStatus?: string): StudentStatusInfo {
  const s = (rawStatus || 'Active').trim().toLowerCase();

  if (s === 'clc taken' || s === 'clc_taken' || s === 'clc') {
    return {
      label: 'CLC Taken',
      badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 shadow-2xs',
      dotClass: 'bg-rose-600',
      colorKey: 'clc',
    };
  }

  if (s === 'back') {
    return {
      label: 'Back',
      badgeClass: 'bg-amber-100 text-amber-950 border-amber-300 shadow-2xs',
      dotClass: 'bg-amber-500',
      colorKey: 'back',
    };
  }

  if (s === 'graduated' || s === 'alumni') {
    return {
      label: 'Graduated',
      badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300 shadow-2xs',
      dotClass: 'bg-indigo-600',
      colorKey: 'graduated',
    };
  }

  // Default is Active
  return {
    label: 'Active',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs',
    dotClass: 'bg-emerald-500',
    colorKey: 'active',
  };
}

/**
 * Checks if a student has active status (only students with status 'Active' are counted)
 */
export function isStudentActive(student: { academicStatus?: string } | null | undefined): boolean {
  if (!student) return false;
  const s = (student.academicStatus || 'Active').trim().toLowerCase();
  return s === 'active';
}

/**
 * Filters a student list to return only active students
 */
export function filterActiveStudents<T extends { academicStatus?: string }>(list: T[]): T[] {
  return (list || []).filter((item) => isStudentActive(item));
}

/**
 * Counts strictly active students in a student list
 */
export function countActiveStudents(list: { academicStatus?: string }[]): number {
  return (list || []).filter((item) => isStudentActive(item)).length;
}

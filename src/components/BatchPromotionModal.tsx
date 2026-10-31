import React, { useState, useMemo } from 'react';
import {
  X,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Users,
  Calendar,
  Layers,
  Loader2,
  Check,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { Student } from '../types';
import { batchPromoteStudents } from '../services/db';

interface BatchPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onSuccess: (count: number, batch: string) => void;
}

export const BatchPromotionModal: React.FC<BatchPromotionModalProps> = ({
  isOpen,
  onClose,
  students,
  onSuccess,
}) => {
  // Extract distinct batches from existing students
  const availableBatches = useMemo(() => {
    const batchSet = new Set<string>([
      '2026–27',
      '2025–26',
      '2024–25',
      '2023–24',
      '2022–23',
    ]);
    students.forEach((s) => {
      if (s.academicYear) batchSet.add(s.academicYear.trim());
      if (s.admissionYear) {
        const y = s.admissionYear.trim();
        if (y.includes('–') || y.includes('-')) {
          batchSet.add(y);
        } else if (/^\d{4}$/.test(y)) {
          const next = (parseInt(y, 10) + 1).toString().slice(-2);
          batchSet.add(`${y}–${next}`);
        }
      }
    });
    return Array.from(batchSet).sort().reverse();
  }, [students]);

  const [selectedBatch, setSelectedBatch] = useState<string>(() => availableBatches[0] || '2026–27');
  const [customBatch, setCustomBatch] = useState<string>('');
  const [courseFilter, setCourseFilter] = useState<string>('All');

  // Target promotion settings
  const [targetSemester, setTargetSemester] = useState<string>('Semester II');
  const [targetYearLevel, setTargetYearLevel] = useState<string>('1st Year');
  const [targetAcademicYear, setTargetAcademicYear] = useState<string>('Keep Current');
  const [targetStatus, setTargetStatus] = useState<string>('Active');

  // Student selection state (mapped by student ID)
  const [selectedStudentIds, setSelectedStudentIds] = useState<Record<string, boolean>>({});
  const [previewSearch, setPreviewSearch] = useState<string>('');
  const [isPromoting, setIsPromoting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeBatch = selectedBatch === 'Custom' ? customBatch.trim() || '2026–27' : selectedBatch;

  // Filter students matching the selected admission batch
  const matchingStudents = useMemo(() => {
    const batchClean = activeBatch.toLowerCase().replace(/[^a-z0-9]/g, '');
    const batchYear = activeBatch.match(/\d{4}/)?.[0] || '';

    return students.filter((s) => {
      // 1. Batch matching
      const sAcad = (s.academicYear || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const sAdm = (s.admissionYear || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const sAdmYear = (s.admissionYear || '').match(/\d{4}/)?.[0] || '';

      const matchBatch =
        sAcad === batchClean ||
        sAdm === batchClean ||
        (batchYear && (sAdmYear === batchYear || (s.academicYear || '').includes(batchYear)));

      if (!matchBatch) return false;

      // 2. Course filtering
      if (courseFilter !== 'All') {
        const c = (s.course || '').toUpperCase();
        if (courseFilter === 'UG NEP' && !c.includes('NEP')) return false;
        if (courseFilter === 'UG AEDP' && !c.includes('AEDP')) return false;
        if (courseFilter === 'UG CBCS' && !c.includes('CBCS')) return false;
        if (courseFilter === 'PG' && !c.includes('PG') && !c.includes('M.SC')) return false;
      }

      return true;
    });
  }, [students, activeBatch, courseFilter]);

  // Determine target student state based on chosen target values
  const getTargetStudentState = (student: Student) => {
    return {
      semester: targetSemester === 'Keep Current' ? student.semester : targetSemester,
      yearLevel: targetYearLevel === 'Keep Current' ? student.yearLevel : targetYearLevel,
      academicYear: targetAcademicYear === 'Keep Current' ? student.academicYear : targetAcademicYear,
      academicStatus: targetStatus,
    };
  };

  // Pre-select all matching students by default when matching list changes or modal opens
  React.useEffect(() => {
    if (!isOpen) return;
    const initialSelection: Record<string, boolean> = {};
    matchingStudents.forEach((s) => {
      initialSelection[s.id] = true;
    });
    setSelectedStudentIds(initialSelection);
  }, [matchingStudents, isOpen]);

  // Toggle selection for a single student
  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Select all / Deselect all
  const selectAll = (val: boolean) => {
    const updated: Record<string, boolean> = {};
    matchingStudents.forEach((s) => {
      updated[s.id] = val;
    });
    setSelectedStudentIds(updated);
  };

  // Filtered preview by search term
  const displayedStudents = useMemo(() => {
    if (!previewSearch.trim()) return matchingStudents;
    const term = previewSearch.toLowerCase().trim();
    return matchingStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.rollNumber.toLowerCase().includes(term) ||
        (s.registrationNumber && s.registrationNumber.toLowerCase().includes(term))
    );
  }, [matchingStudents, previewSearch]);

  const selectedCount = matchingStudents.filter((s) => selectedStudentIds[s.id]).length;

  // Execute Batch Promotion
  const handleConfirmPromotion = async () => {
    const studentsToPromote = matchingStudents.filter((s) => selectedStudentIds[s.id]);
    if (studentsToPromote.length === 0) {
      alert('Please select at least one student to promote.');
      return;
    }

    setIsPromoting(true);
    setErrorMessage(null);

    try {
      const updatedList: Student[] = studentsToPromote.map((s) => {
        const target = getTargetStudentState(s);
        return {
          ...s,
          semester: target.semester,
          yearLevel: target.yearLevel,
          academicYear: target.academicYear,
          academicStatus: target.academicStatus,
          updatedAt: new Date().toISOString(),
        };
      });

      const res = await batchPromoteStudents(updatedList);
      if (!res.success) {
        throw new Error(res.error || 'Failed to update student records.');
      }

      onSuccess(res.count, activeBatch);
      onClose();
    } catch (err: any) {
      console.error('Batch promotion error:', err);
      setErrorMessage(err?.message || 'Failed to complete batch promotion.');
    } finally {
      setIsPromoting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#0b1a2f] text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-academic text-base sm:text-lg font-bold">
                  Batch Semester &amp; Year Level Promotion
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
                  Admin Authority
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Promote an entire admission batch to the next semester or academic year level in one click
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isPromoting}
            className="text-slate-400 hover:text-white cursor-pointer disabled:opacity-50 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-medium text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Select Admission Batch & Course Stream */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-700" />
                <span>1. Select Admission Batch &amp; Stream to Promote</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Matches enrolled students in selected admission cohort
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Admission Batch Select */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Target Admission Batch *
                </label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:border-amber-500 shadow-2xs"
                >
                  {availableBatches.map((b) => (
                    <option key={b} value={b}>
                      Admission Batch {b}
                    </option>
                  ))}
                  <option value="Custom">Custom Admission Batch...</option>
                </select>

                {selectedBatch === 'Custom' && (
                  <input
                    type="text"
                    value={customBatch}
                    onChange={(e) => setCustomBatch(e.target.value)}
                    placeholder="e.g. 2027–28 or 2025"
                    className="w-full mt-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-amber-500"
                  />
                )}
              </div>

              {/* Course Stream Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Program / Course Stream
                </label>
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:border-amber-500 shadow-2xs"
                >
                  <option value="All">All Courses in Batch (UG &amp; PG)</option>
                  <option value="UG NEP">UG NEP (B.Sc. Honors)</option>
                  <option value="UG AEDP">UG AEDP</option>
                  <option value="UG CBCS">UG CBCS</option>
                  <option value="PG">PG (M.Sc. Mathematics)</option>
                </select>
              </div>
            </div>

            {/* Quick Count Badge */}
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-950 font-medium text-[11px] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-700" />
                <span>Found <strong>{matchingStudents.length}</strong> enrolled student{matchingStudents.length !== 1 ? 's' : ''} in Batch <strong>{activeBatch}</strong></span>
              </span>
              <span className="text-[10.5px] text-blue-700 font-semibold">
                {matchingStudents.length === 0 ? 'No scholars match this cohort' : 'Ready for promotion review'}
              </span>
            </div>
          </div>

          {/* STEP 2: Configure Target Semester & Year Level */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                <span>2. Select Target Semester &amp; Year Level</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Choose the destination semester and level for all selected scholars
              </span>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Promote to Semester *
                  </label>
                  <select
                    value={targetSemester}
                    onChange={(e) => setTargetSemester(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden"
                  >
                    <option value="Semester I">Semester I</option>
                    <option value="Semester II">Semester II</option>
                    <option value="Semester III">Semester III</option>
                    <option value="Semester IV">Semester IV</option>
                    <option value="Semester V">Semester V</option>
                    <option value="Semester VI">Semester VI</option>
                    <option value="Semester VII">Semester VII</option>
                    <option value="Semester VIII">Semester VIII</option>
                    <option value="Completed">Completed / Graduated</option>
                    <option value="Keep Current">Keep Current</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Promote to Year Level *
                  </label>
                  <select
                    value={targetYearLevel}
                    onChange={(e) => setTargetYearLevel(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Graduated">Graduated</option>
                    <option value="Keep Current">Keep Current</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Academic Session
                  </label>
                  <select
                    value={targetAcademicYear}
                    onChange={(e) => setTargetAcademicYear(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-hidden"
                  >
                    <option value="Keep Current">Keep Current Session</option>
                    <option value="2026–27">2026–27</option>
                    <option value="2027–28">2027–28</option>
                    <option value="2025–26">2025–26</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-600 font-semibold">Academic Status:</span>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                  >
                    <option value="Active">Active</option>
                    <option value="Back">Back</option>
                    <option value="CLC Taken">CLC Taken</option>
                    <option value="Graduated">Graduated</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: Student Verification & Live Preview */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <span>3. Verify Students to Promote ({selectedCount} of {matchingStudents.length} selected)</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                    placeholder="Search student..."
                    className="pl-8 pr-3 py-1 bg-white border border-slate-300 rounded-lg text-[11px] focus:outline-hidden w-40"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => selectAll(true)}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-blue-300 text-blue-900 font-bold rounded text-[11px] cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => selectAll(false)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded text-[11px] cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Students Preview Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[260px] overflow-y-auto">
              <table className="w-full text-left text-[11px] text-slate-700">
                <thead className="bg-[#0c2340] text-white uppercase text-[9.5px] tracking-wider font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3 w-8 text-center">Promote</th>
                    <th className="py-2.5 px-3">Roll Number</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Program</th>
                    <th className="py-2.5 px-3">Current Status</th>
                    <th className="py-2.5 px-3">Promoted Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {displayedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                        {matchingStudents.length === 0
                          ? `No student records found in Admission Batch "${activeBatch}". Select another batch above.`
                          : 'No student matches your search term.'}
                      </td>
                    </tr>
                  ) : (
                    displayedStudents.map((s) => {
                      const isChecked = Boolean(selectedStudentIds[s.id]);
                      const target = getTargetStudentState(s);
                      return (
                        <tr
                          key={s.id}
                          className={`hover:bg-slate-50 transition ${
                            isChecked ? 'bg-blue-50/20' : 'opacity-60 bg-slate-50/50'
                          }`}
                        >
                          <td className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleStudent(s.id)}
                              className="rounded text-blue-600 cursor-pointer"
                            />
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">
                            {s.rollNumber}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            {s.name}
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[9.5px]">
                              {s.course}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600 font-medium">
                            <div>{s.yearLevel} &bull; {s.semester}</div>
                            <div className="text-[9.5px] text-slate-400 font-normal">{s.academicYear}</div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-[10px]">
                              <span>{target.yearLevel}</span>
                              <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{target.semester}</span>
                            </div>
                            <div className="text-[9.5px] text-slate-500 font-medium mt-0.5">
                              Session {target.academicYear}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 font-medium">
            {selectedCount > 0 ? (
              <span>
                Ready to promote <strong>{selectedCount}</strong> student{selectedCount !== 1 ? 's' : ''} in Batch <strong>{activeBatch}</strong>
              </span>
            ) : (
              <span className="text-rose-600">Select at least one student to promote</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPromoting}
              className="px-4 py-2 border rounded-xl text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmPromotion}
              disabled={isPromoting || selectedCount === 0}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-xs disabled:opacity-50"
            >
              {isPromoting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Promoting Batch Records...</span>
                </>
              ) : (
                <>
                  <GraduationCap className="w-4 h-4" />
                  <span>Promote {selectedCount} Student{selectedCount !== 1 ? 's' : ''}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

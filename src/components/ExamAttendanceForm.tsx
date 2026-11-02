import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Printer,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Plus,
  Trash2,
  Calendar,
  Layers,
  ArrowDownAZ,
  Eye,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Student } from '../types';
import {
  AttendanceFormConfig,
  AttendanceStudentEntry,
  ROWS_PER_PAGE,
  getStudentRollByType,
  sortAttendanceEntries,
  paginateAttendanceEntries,
  generateAttendanceFormPDF,
  printAttendanceForm,
  exportAttendanceFormCSV,
} from '../utils/attendanceFormUtils';
import { getTodayDDMMYYYY, formatDateToDDMMYYYY } from '../utils/dateFormatter';

interface ExamAttendanceFormProps {
  students: Student[];
}

export const ExamAttendanceForm: React.FC<ExamAttendanceFormProps> = ({
  students = [],
}) => {
  // Cohort Selection Controls
  const [selectedCourse, setSelectedCourse] = useState<string>('UG NEP');
  const [selectedYear, setSelectedYear] = useState<string>('2024–25');
  const [selectedSemester, setSelectedSemester] = useState<string>('Semester I');
  const [rollNumberType, setRollNumberType] = useState<'college' | 'university' | 'both'>('college');

  // Examination Metadata Configuration (Cleared by default for user entry)
  const [config, setConfig] = useState<AttendanceFormConfig>({
    centre: 'PANCHAYAT COLLEGE, BARAGADA',
    dateOfExam: '',
    className: '',
    subject: '',
    sitting: '',
    roomNo: '',
    rowsPerPage: ROWS_PER_PAGE,
  });

  // Table Entries state (editable array of candidates)
  const [entries, setEntries] = useState<AttendanceStudentEntry[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [viewAllPages, setViewAllPages] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Available Admission Batches extracted from students
  const availableYears = useMemo(() => {
    const set = new Set<string>(['2026–27', '2025–26', '2024–25', '2023–24', '2022–23']);
    students.forEach((s) => {
      if (s.admissionYear) set.add(s.admissionYear);
      if (s.academicYear) set.add(s.academicYear);
    });
    return Array.from(set).sort().reverse();
  }, [students]);

  // Filter students matching cohort and STRICTLY active status
  const cohortStudents = useMemo(() => {
    return students.filter((s) => {
      // Exclude non-active students (dropped out, clc taken, back, graduated)
      const st = (s.academicStatus || '').trim().toLowerCase();
      if (
        st === 'dropped out' ||
        st === 'dropped_out' ||
        st === 'dropped' ||
        st === 'clc taken' ||
        st === 'clc_taken' ||
        st === 'clc' ||
        st === 'back' ||
        st === 'graduated'
      ) {
        return false;
      }

      // Course match
      const matchCourse = selectedCourse === 'All' || s.course === selectedCourse;
      // Admission Year match
      const matchYear =
        selectedYear === 'All' ||
        s.admissionYear === selectedYear ||
        s.academicYear === selectedYear;
      // Semester match
      const matchSem = selectedSemester === 'All' || s.semester === selectedSemester;

      return matchCourse && matchYear && matchSem;
    });
  }, [students, selectedCourse, selectedYear, selectedSemester]);

  // Auto-populate / Insert students from cohort into entries
  const handleInsertCohortStudents = () => {
    const rawList: AttendanceStudentEntry[] = cohortStudents.map((s) => ({
      id: s.id,
      name: s.name,
      rollNumber: getStudentRollByType(s, rollNumberType),
      serialAnswerBook: '',
      serialAddlAnswerBook: '',
      timeHandingOver: '',
      candidateSignature: '',
    }));

    const sorted = sortAttendanceEntries(rawList);
    setEntries(sorted);
    setCurrentPage(0);

    // Auto-update class title suggestion
    const classSuggestion = `${selectedCourse !== 'All' ? selectedCourse : 'UG/PG'} ${selectedSemester !== 'All' ? selectedSemester : ''}`.trim();
    if (classSuggestion) {
      setConfig((prev) => ({ ...prev, className: classSuggestion }));
    }

    setStatusMessage({
      text: `Successfully inserted and sorted ${sorted.length} active candidates in dictionary order.`,
      type: 'success',
    });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Initial load: insert default cohort if entries are empty
  useEffect(() => {
    if (cohortStudents.length > 0 && entries.length === 0) {
      handleInsertCohortStudents();
    }
  }, [cohortStudents.length]);

  // Handle Roll Number Type Change
  const handleRollTypeChange = (newType: 'college' | 'university' | 'both') => {
    setRollNumberType(newType);
    if (entries.length > 0) {
      // Refresh roll numbers in the existing entries from student records
      const updated = entries.map((e) => {
        const student = students.find((s) => s.id === e.id || s.name === e.name);
        if (student) {
          return {
            ...e,
            rollNumber: getStudentRollByType(student, newType),
          };
        }
        return e;
      });
      setEntries(sortAttendanceEntries(updated));
    }
  };

  // Sort current entries
  const handleSortEntries = () => {
    const sorted = sortAttendanceEntries(entries);
    setEntries(sorted);
    setStatusMessage({
      text: 'Sorted candidates in dictionary order by roll number.',
      type: 'info',
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Clear to blank template
  const handleClearToBlank = () => {
    setEntries([]);
    setCurrentPage(0);
    setStatusMessage({
      text: 'Cleared form to blank 24-row template sheet.',
      type: 'info',
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Add single empty candidate row
  const handleAddBlankRow = () => {
    const newEntry: AttendanceStudentEntry = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      rollNumber: '',
      serialAnswerBook: '',
      serialAddlAnswerBook: '',
      timeHandingOver: '',
      candidateSignature: '',
    };
    setEntries((prev) => [...prev, newEntry]);
  };

  // Edit cell value in entries
  const handleCellChange = (
    entryIndex: number,
    field: keyof AttendanceStudentEntry,
    value: string
  ) => {
    setEntries((prev) => {
      const copy = [...prev];
      if (copy[entryIndex]) {
        copy[entryIndex] = {
          ...copy[entryIndex],
          [field]: value,
        };
      }
      return copy;
    });
  };

  // Paged entries (strictly 24 rows per page)
  const pages = useMemo(() => {
    return paginateAttendanceEntries(entries, config.rowsPerPage || ROWS_PER_PAGE);
  }, [entries, config.rowsPerPage]);

  const totalPages = pages.length;
  const safeCurrentPage = Math.min(currentPage, totalPages - 1);
  const activePageRows = pages[safeCurrentPage] || [];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            <span>Confidential Examination Module (Admin Only)</span>
          </div>
          <h2 className="font-serif-academic text-xl sm:text-2xl font-bold text-[#0c2340]">
            Exam Attendance Form (APPENDIX – A)
          </h2>
          <p className="text-xs text-slate-600 max-w-3xl mt-1">
            Generate and print official <strong>Statement of Answer Books Issued to Candidates</strong> with strict adherence to the 24-row, 5-column layout matching the examination cell specification.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => printAttendanceForm(config, entries)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            title="Open printable format in high-contrast print window"
          >
            <Printer className="w-4 h-4" />
            <span>Print Sheet</span>
          </button>

          <button
            type="button"
            onClick={() => generateAttendanceFormPDF(config, entries)}
            className="px-4 py-2 bg-[#0c2340] hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            title="Download authentic vector PDF matching Appendix A"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={() => exportAttendanceFormCSV(config, entries)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Export candidate list as CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 transition ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-blue-50 text-blue-900 border-blue-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Cohort & Roll Number Selection Card */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              1. Examination Cohort & Roll Number Type Selection
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            {cohortStudents.length} active candidates found in selected cohort
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Course */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Select Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-hidden focus:border-amber-500"
            >
              <option value="All">All Academic Programs</option>
              <option value="UG NEP">UG NEP (National Education Policy)</option>
              <option value="UG AEDP">UG AEDP (Accelerated Degree)</option>
              <option value="PG">PG (M.Sc. Mathematics)</option>
              <option value="UG CBCS">UG CBCS (Choice Based Credit)</option>
            </select>
          </div>

          {/* Admission Year */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Admission Batch / Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-hidden focus:border-amber-500"
            >
              <option value="All">All Admission Batches</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Semester */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Select Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-hidden focus:border-amber-500"
            >
              <option value="All">All Semesters</option>
              <option value="Semester I">Semester I</option>
              <option value="Semester II">Semester II</option>
              <option value="Semester III">Semester III</option>
              <option value="Semester IV">Semester IV</option>
              <option value="Semester V">Semester V</option>
              <option value="Semester VI">Semester VI</option>
            </select>
          </div>

          {/* College Roll No Type */}
          <div>
            <label className="block text-slate-700 font-bold mb-1 text-amber-900 flex items-center gap-1">
              <span>Roll Number Format</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                Required
              </span>
            </label>
            <select
              value={rollNumberType}
              onChange={(e) =>
                handleRollTypeChange(e.target.value as 'college' | 'university' | 'both')
              }
              className="w-full px-3 py-2 bg-amber-50 border border-amber-300 rounded-lg font-bold text-slate-900 focus:outline-hidden focus:border-amber-500"
            >
              <option value="college">College Roll No (e.g. BS-24-001)</option>
              <option value="university">University Roll No / Regd (e.g. 24MATH001)</option>
              <option value="both">Both (College / University)</option>
            </select>
          </div>
        </div>

        {/* Cohort Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleInsertCohortStudents}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Insert Students ({cohortStudents.length})</span>
            </button>

            <button
              type="button"
              onClick={handleSortEntries}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              title="Sort entries alphabetically/numerically"
            >
              <ArrowDownAZ className="w-4 h-4 text-blue-600" />
              <span>Sort Dictionary Order</span>
            </button>

            <button
              type="button"
              onClick={handleAddBlankRow}
              className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Blank Row</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearToBlank}
              className="px-3 py-2 text-rose-700 hover:bg-rose-50 border border-rose-200 font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              title="Clear candidates and create empty template"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear to Blank Form</span>
            </button>
          </div>
        </div>
      </div>

      {/* Examination Context & Details Config Card */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              2. Examination Context Details (Header Lines)
            </h3>
          </div>
          <button
            type="button"
            onClick={() =>
              setConfig({
                ...config,
                dateOfExam: '',
                className: '',
                subject: '',
                sitting: '',
                roomNo: '',
              })
            }
            className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer transition-colors"
            title="Clear Date of Examination, Class, Subject, Sitting, and Room No."
          >
            Clear Header Details
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Date of Exam */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Date of Examination
            </label>
            <input
              type="text"
              value={config.dateOfExam}
              onChange={(e) => setConfig({ ...config, dateOfExam: e.target.value })}
              placeholder="e.g. 15/11/2026 or 2026-11-15"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono"
            />
          </div>

          {/* Class */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Class</label>
            <input
              type="text"
              value={config.className}
              onChange={(e) => setConfig({ ...config, className: e.target.value })}
              placeholder="e.g. UG NEP 1st Year (Semester I)"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Subject</label>
            <input
              type="text"
              value={config.subject}
              onChange={(e) => setConfig({ ...config, subject: e.target.value })}
              placeholder="e.g. Mathematics"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold"
            />
          </div>

          {/* Sitting */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Sitting</label>
            <div className="flex items-center gap-2 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800">
                <input
                  type="radio"
                  name="sittingOption"
                  checked={config.sitting === '1st Sitting'}
                  onClick={() => setConfig({ ...config, sitting: config.sitting === '1st Sitting' ? '' : '1st Sitting' })}
                  onChange={() => {}}
                  className="text-amber-500 cursor-pointer"
                />
                <span>1st Sitting</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800 ml-3">
                <input
                  type="radio"
                  name="sittingOption"
                  checked={config.sitting === '2nd Sitting'}
                  onClick={() => setConfig({ ...config, sitting: config.sitting === '2nd Sitting' ? '' : '2nd Sitting' })}
                  onChange={() => {}}
                  className="text-amber-500 cursor-pointer"
                />
                <span>2nd Sitting</span>
              </label>
            </div>
          </div>

          {/* Room No */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Room No.</label>
            <input
              type="text"
              value={config.roomNo}
              onChange={(e) => setConfig({ ...config, roomNo: e.target.value })}
              placeholder="e.g. Room No. 104"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
            />
          </div>

          {/* Centre */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Examination Centre</label>
            <input
              type="text"
              value={config.centre}
              onChange={(e) => setConfig({ ...config, centre: e.target.value })}
              placeholder="PANCHAYAT COLLEGE, BARAGADA"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold"
            />
          </div>
        </div>
      </div>

      {/* Sheet Preview & Navigation Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-800">
            Total Candidates: <span className="text-amber-600 font-mono">{entries.length}</span>
          </span>
          <span className="text-xs text-slate-400">&bull;</span>
          <span className="text-xs font-bold text-slate-800">
            Pages: <span className="text-blue-600 font-mono">{totalPages}</span>
            <span className="text-[11px] text-slate-500 font-normal ml-1">
              (Strictly 24 rows / page)
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewAllPages(!viewAllPages)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
              viewAllPages
                ? 'bg-[#0c2340] text-amber-300 border-[#0c2340]'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {viewAllPages ? 'Switch to Single Page View' : 'View All Pages Continuously'}
          </button>

          {!viewAllPages && totalPages > 1 && (
            <div className="flex items-center gap-1.5 ml-2">
              <button
                type="button"
                disabled={safeCurrentPage <= 0}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                className="p-1 rounded-md border border-slate-300 disabled:opacity-30 hover:bg-slate-100 cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4 text-slate-700" />
              </button>

              <span className="text-xs font-mono font-bold text-slate-700 px-2">
                Page {safeCurrentPage + 1} of {totalPages}
              </span>

              <button
                type="button"
                disabled={safeCurrentPage >= totalPages - 1}
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                className="p-1 rounded-md border border-slate-300 disabled:opacity-30 hover:bg-slate-100 cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4 text-slate-700" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Render Official Sheet (Single Page or All Pages) */}
      <div className="bg-slate-200/80 p-4 sm:p-8 rounded-2xl border border-slate-300 flex flex-col items-center gap-8 overflow-x-auto">
        {(viewAllPages ? pages : [activePageRows]).map((pageRows, pIdx) => {
          const displayPageNum = viewAllPages ? pIdx + 1 : safeCurrentPage + 1;
          const globalRowOffset = (displayPageNum - 1) * (config.rowsPerPage || ROWS_PER_PAGE);

          return (
            <div
              key={displayPageNum}
              className="bg-white text-black p-8 sm:p-10 shadow-2xl rounded-sm w-full max-w-[840px] border border-slate-400 font-serif"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              {/* Top Header */}
              <div className="text-center space-y-1.5 mb-4">
                <h1 className="text-xl sm:text-2xl font-bold tracking-wide">
                  APPENDIX – A
                </h1>
                <h2 className="text-base sm:text-lg font-bold">
                  Statement of Answer Books Issued to the Candidate in the Examination Hall
                </h2>
                <h3 className="text-base sm:text-[17px] font-bold">
                  Examination Centre – {config.centre || 'PANCHAYAT COLLEGE, BARAGADA'}
                </h3>
              </div>

              {/* Context Lines */}
              <div className="text-sm sm:text-base space-y-1.5 mb-3.5 leading-relaxed">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-normal">Date of Examination – </span>
                    <span className="font-bold">
                      {formatDateToDDMMYYYY(config.dateOfExam) || ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-8">
                    <div>
                      <span className="font-normal">Class - </span>
                      <span className="font-bold">
                        {config.className || ''}
                      </span>
                    </div>

                    <div>
                      <span className="font-normal">Subject - </span>
                      <span className="font-bold">
                        {config.subject || ''}
                      </span>
                    </div>
                  </div>

                  {/* Sitting */}
                  <div className="flex items-start gap-2.5">
                    <span className="font-normal">Sitting</span>
                    <div className="flex flex-col text-xs sm:text-sm leading-snug">
                      <span className={config.sitting === '1st Sitting' ? 'font-bold underline' : ''}>
                        1<sup>st</sup> Sitting
                      </span>
                      <span className={config.sitting === '2nd Sitting' ? 'font-bold underline' : ''}>
                        2<sup>nd</sup> Sitting
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="font-normal">Room No. - </span>
                  <span className="font-bold">
                    {config.roomNo || ''}
                  </span>
                </div>
              </div>

              {/* Strict 5-Column, 24-Row Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-black text-xs">
                  <thead>
                    <tr className="border-b border-black">
                      <th className="border border-black p-2 text-center align-middle font-bold w-[16%]">
                        Roll No.
                      </th>
                      <th className="border border-black p-1.5 text-center align-middle font-bold w-[19%] leading-tight text-[11px]">
                        Serial No. of<br />the Answer<br />books issued to<br />the candidates
                      </th>
                      <th className="border border-black p-1.5 text-center align-middle font-bold w-[19%] leading-tight text-[11px]">
                        Serial No. of<br />Addl. Answer<br />books issued to<br />the candidates
                      </th>
                      <th className="border border-black p-1.5 text-center align-middle font-bold w-[14%] leading-tight text-[10.5px]">
                        Time of<br />handing<br />over the<br />answer<br />books
                      </th>
                      <th className="border border-black p-2 text-center align-middle font-bold w-[32%]">
                        Signature of the Candidates
                      </th>
                    </tr>
                    <tr className="border-b border-black text-center font-bold text-[11px]">
                      <th className="border border-black py-1">1</th>
                      <th className="border border-black py-1">2</th>
                      <th className="border border-black py-1">3</th>
                      <th className="border border-black py-1">4</th>
                      <th className="border border-black py-1">5</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row, rIdx) => {
                      const absoluteIndex = globalRowOffset + rIdx;
                      return (
                        <tr key={row.id || rIdx} className="border-b border-black h-[26px]">
                          {/* Col 1: Roll No (Editable on screen) */}
                          <td className="border border-black px-1.5 text-center font-bold">
                            <input
                              type="text"
                              value={row.rollNumber}
                              onChange={(e) =>
                                handleCellChange(absoluteIndex, 'rollNumber', e.target.value)
                              }
                              placeholder=""
                              className="w-full text-center font-bold bg-transparent focus:bg-amber-50 focus:outline-hidden"
                            />
                          </td>

                          {/* Col 2: Serial No. of Answer books */}
                          <td className="border border-black px-1.5 text-center">
                            <input
                              type="text"
                              value={row.serialAnswerBook || ''}
                              onChange={(e) =>
                                handleCellChange(absoluteIndex, 'serialAnswerBook', e.target.value)
                              }
                              className="w-full text-center bg-transparent focus:bg-amber-50 focus:outline-hidden font-mono"
                            />
                          </td>

                          {/* Col 3: Serial No. of Addl. Answer books */}
                          <td className="border border-black px-1.5 text-center">
                            <input
                              type="text"
                              value={row.serialAddlAnswerBook || ''}
                              onChange={(e) =>
                                handleCellChange(
                                  absoluteIndex,
                                  'serialAddlAnswerBook',
                                  e.target.value
                                )
                              }
                              className="w-full text-center bg-transparent focus:bg-amber-50 focus:outline-hidden font-mono"
                            />
                          </td>

                          {/* Col 4: Time of handing over */}
                          <td className="border border-black px-1 text-center">
                            <input
                              type="text"
                              value={row.timeHandingOver || ''}
                              onChange={(e) =>
                                handleCellChange(absoluteIndex, 'timeHandingOver', e.target.value)
                              }
                              className="w-full text-center bg-transparent focus:bg-amber-50 focus:outline-hidden font-mono text-[11px]"
                            />
                          </td>

                          {/* Col 5: Signature of Candidate (Blank line for physical exam hall signing) */}
                          <td className="border border-black px-2">
                            {row.name && (
                              <span className="text-[10px] text-slate-400 font-sans italic opacity-40">
                                {row.name}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Footer Signature */}
              <div className="flex items-end justify-between mt-12 pt-4">
                <div className="text-[11px] text-slate-500 font-sans">
                  {totalPages > 1 && `Page ${displayPageNum} of ${totalPages}`}
                </div>
                <div className="text-xs sm:text-sm font-bold text-right">
                  Signature of the Invigilator
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

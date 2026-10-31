import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Download,
  Printer,
  FileSpreadsheet,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileText,
  Filter,
  Layers,
  Save,
  HelpCircle,
  FileCode,
  Copy,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ArrowDownAZ,
} from 'lucide-react';
import { Student } from '../types';
import {
  MarkFoilConfig,
  MarkFoilStudentEntry,
  marksToWordsDigitByDigit,
  calculateMarkFoilPages,
  generateMarkFoilPDF,
  generateMarkFoilWordDocument,
  printMarkFoil,
  exportMarkFoilCSV,
  sortEntriesInDictionaryOrder,
} from '../utils/markFoilUtils';

interface MarkFoilGeneratorProps {
  students: Student[];
}

export const MarkFoilGenerator: React.FC<MarkFoilGeneratorProps> = ({
  students = [],
}) => {
  // Course, Year, Semester selection
  const [selectedCourse, setSelectedCourse] = useState<string>('PG');
  const [selectedYear, setSelectedYear] = useState<string>('2024–25');
  const [selectedSemester, setSelectedSemester] = useState<string>('Semester II');

  // Roll number format selection: 'college' (College Roll No), 'university' (University Roll No), or 'both'
  const [rollNumberType, setRollNumberType] = useState<'college' | 'university' | 'both'>('college');

  // Examination metadata configuration (default blank details)
  const [config, setConfig] = useState<MarkFoilConfig>({
    universityName: 'SAMBALPUR UNIVERSITY',
    examinationCell: 'PRIVATE EXAMINATION CELL',
    setNumber: '',
    examinationName: '',
    subject: 'Mathematics',
    paperName: '',
    fullMarks: '',
    courseNo: '',
    examinerName: '',
    date: '',
    totalRows: 25,
    layout: 'dual',
    foilMode: 'twin',
    wordCasing: 'upper',
    cellHeightPreset: 'generous',
    fontSizePreset: 'large',
  });

  // Mode for left and right slips: 'twin' (identical foils), 'continuous' (1-28 left, 29-56 right), or 'blank' (blank template with dotted lines)
  const [foilMode, setFoilMode] = useState<'twin' | 'continuous' | 'blank'>('twin');

  // Table entries (includes student name in memory for teacher convenience)
  const [entries, setEntries] = useState<MarkFoilStudentEntry[]>([]);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Pagination for Preview & Printing when students exceed single page
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [viewAllPages, setViewAllPages] = useState<boolean>(false);

  // Helper to extract the preferred roll number format
  const getStudentRollValue = (s: Student, type: 'college' | 'university' | 'both'): string => {
    const collegeRoll = (s.rollNumber || '').trim();
    const univRoll = (s.registrationNumber || '').trim();
    if (type === 'college') {
      return collegeRoll || univRoll || s.uniqueId || '';
    }
    if (type === 'university') {
      return univRoll || collegeRoll || s.uniqueId || '';
    }
    // 'both'
    if (collegeRoll && univRoll) {
      return `${collegeRoll} / ${univRoll}`;
    }
    return collegeRoll || univRoll || s.uniqueId || '';
  };

  // Enrolled students matching the chosen Course, Academic Year, and Semester (excluding students with status 'CLC Taken')
  const enrolledStudents = useMemo(() => {
    return students.filter((s) => {
      // Exclude students who have taken CLC (College Leaving Certificate)
      const st = (s.academicStatus || '').trim().toLowerCase();
      if (st === 'clc taken' || st === 'clc_taken' || st === 'clc') {
        return false;
      }

      // Course match
      const matchCourse =
        selectedCourse === 'All' ||
        (s.course && (
          selectedCourse === 'PG'
            ? s.course.toLowerCase().includes('pg') || s.course.toLowerCase().includes('m.sc')
            : selectedCourse === 'UG NEP'
            ? s.course.toLowerCase().includes('nep')
            : selectedCourse === 'UG CBCS'
            ? s.course.toLowerCase().includes('cbcs')
            : selectedCourse === 'UG AEDP'
            ? s.course.toLowerCase().includes('aedp')
            : s.course.toLowerCase().includes(selectedCourse.toLowerCase())
        ));

      // Academic Year match
      const matchYear =
        selectedYear === 'All' ||
        s.academicYear === selectedYear ||
        s.admissionYear === selectedYear.split('–')[0] ||
        (s.admissionYear && selectedYear.includes(s.admissionYear));

      // Semester match
      const matchSem =
        selectedSemester === 'All' ||
        s.semester === selectedSemester ||
        s.semester?.toLowerCase() === selectedSemester.toLowerCase();

      return matchCourse && matchYear && matchSem;
    });
  }, [students, selectedCourse, selectedYear, selectedSemester]);

  // Handle switching roll number format between College Roll No and University Roll No
  const handleRollNumberTypeChange = (newType: 'college' | 'university' | 'both') => {
    setRollNumberType(newType);
    setEntries((prev) => {
      let updated: MarkFoilStudentEntry[];
      if (prev.length === 0 && enrolledStudents.length > 0) {
        updated = enrolledStudents.map((s) => ({
          id: s.id,
          name: s.name,
          rollNumber: getStudentRollValue(s, newType),
          marksInFigures: '',
          marksInWords: '',
        }));
      } else {
        updated = prev.map((entry) => {
          const matched = enrolledStudents.find(
            (s) => s.id === entry.id || (s.name && entry.name && s.name.trim().toLowerCase() === entry.name.trim().toLowerCase())
          );
          if (matched) {
            return {
              ...entry,
              rollNumber: getStudentRollValue(matched, newType),
            };
          }
          return entry;
        });
      }
      // Sort students with college roll no / university roll no in dictionary order
      return sortEntriesInDictionaryOrder(updated);
    });

    const label =
      newType === 'college'
        ? 'College Roll No'
        : newType === 'university'
        ? 'University Roll No'
        : 'College & University Roll No';
    setStatusMessage({
      text: `Cohort roll numbers updated to ${label} and sorted in dictionary order.`,
      type: 'info',
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Sort candidate entries in dictionary (natural alphanumeric) order by active roll number
  const handleSortInDictionaryOrder = () => {
    setEntries((prev) => sortEntriesInDictionaryOrder(prev));
    const label =
      rollNumberType === 'college'
        ? 'College Roll No'
        : rollNumberType === 'university'
        ? 'University Roll No'
        : 'Roll Number';
    setStatusMessage({
      text: `Sorted candidates with ${label} in dictionary order.`,
      type: 'info',
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Initialize or populate student entries when selection changes
  useEffect(() => {
    // Try restoring saved draft for this combo from localStorage
    const draftKey = `mark_foil_${selectedCourse}_${selectedYear}_${selectedSemester}_${config.courseNo}`;
    const saved = localStorage.getItem(draftKey);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEntries(sortEntriesInDictionaryOrder(parsed));
          return;
        }
      } catch (e) {
        console.warn('Could not parse saved draft:', e);
      }
    }

    if (enrolledStudents.length > 0) {
      const initialList: MarkFoilStudentEntry[] = sortEntriesInDictionaryOrder(
        enrolledStudents.map((s) => ({
          id: s.id,
          name: s.name,
          rollNumber: getStudentRollValue(s, rollNumberType),
          marksInFigures: '',
          marksInWords: '',
        }))
      );
      setEntries(initialList);
    } else {
      setEntries([]);
    }
  }, [enrolledStudents, selectedCourse, selectedYear, selectedSemester, config.courseNo]);

  // Handle Mark Input change for a specific student row
  const handleMarkChange = (index: number, newFigure: string) => {
    setEntries((prev) => {
      const updated = [...prev];
      const target = { ...updated[index] };
      target.marksInFigures = newFigure;
      target.marksInWords = marksToWordsDigitByDigit(newFigure, config.wordCasing);
      updated[index] = target;
      return updated;
    });
  };

  // Handle direct manual edit of "in words" if teacher desires custom phrase
  const handleWordsChange = (index: number, newWords: string) => {
    setEntries((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        marksInWords: newWords,
      };
      return updated;
    });
  };

  // Handle Roll Number edit
  const handleRollChange = (index: number, newRoll: string) => {
    setEntries((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        rollNumber: newRoll,
      };
      return updated;
    });
  };

  // Add a new blank student row
  const handleAddRow = () => {
    const newEntry: MarkFoilStudentEntry = {
      id: `custom-${Date.now()}`,
      name: '',
      rollNumber: '',
      marksInFigures: '',
      marksInWords: '',
    };
    setEntries((prev) => [...prev, newEntry]);
  };

  // Delete row
  const handleDeleteRow = (index: number) => {
    setEntries((prev) => prev.filter((_, idx) => idx !== index));
  };



  // Re-run words casing transformation
  const handleToggleCasing = (casing: 'upper' | 'title' | 'lower') => {
    setConfig((prev) => ({ ...prev, wordCasing: casing }));
    setEntries((prev) =>
      prev.map((e) => ({
        ...e,
        marksInWords: e.marksInFigures ? marksToWordsDigitByDigit(e.marksInFigures, casing) : '',
      }))
    );
  };

  // Save current foil draft
  const handleSaveDraft = () => {
    const draftKey = `mark_foil_${selectedCourse}_${selectedYear}_${selectedSemester}_${config.courseNo}`;
    localStorage.setItem(draftKey, JSON.stringify(entries));
    setStatusMessage({
      text: `Draft saved locally for ${config.courseNo} (${entries.length} candidate rows).`,
      type: 'success',
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Total pages calculation based on foilMode and totalRows
  const totalPages = useMemo(() => {
    const rows = config.totalRows || 25;
    return calculateMarkFoilPages(entries.length, foilMode, rows);
  }, [entries.length, foilMode, config.totalRows]);

  // Keep currentPage valid when entries or rows change
  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [totalPages, currentPage]);

  // 1. Download Vector PDF (.pdf) with multi-page support
  const handleDownloadPDF = (modeOverride?: 'twin' | 'continuous' | 'blank') => {
    const targetMode = modeOverride || foilMode;
    const targetRows = config.totalRows || 25;
    generateMarkFoilPDF(config, entries, { mode: targetMode, totalRows: targetRows });
    const pages = calculateMarkFoilPages(entries.length, targetMode, targetRows);
    setStatusMessage({
      text: `Downloaded ${pages}-Page Mark Foil PDF (${targetMode === 'blank' ? 'Blank Template' : config.courseNo}).pdf`,
      type: 'success',
    });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // 2. Download Microsoft Word document (.doc) with multi-page support
  const handleDownloadWordDoc = (modeOverride?: 'twin' | 'continuous' | 'blank') => {
    const targetMode = modeOverride || foilMode;
    const targetRows = config.totalRows || 25;
    generateMarkFoilWordDocument(config, entries, { mode: targetMode, totalRows: targetRows });
    const pages = calculateMarkFoilPages(entries.length, targetMode, targetRows);
    setStatusMessage({
      text: `Downloaded ${pages}-Page Mark Foil Word Document (${targetMode === 'blank' ? 'Blank Template' : config.courseNo}).doc`,
      type: 'success',
    });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // 3. Print / Save as PDF with multi-page support
  const handlePrintPDF = (modeOverride?: 'twin' | 'continuous' | 'blank') => {
    const targetMode = modeOverride || foilMode;
    const targetRows = config.totalRows || 25;
    printMarkFoil(config, entries, { mode: targetMode, totalRows: targetRows });
  };

  // 4. Export CSV
  const handleExportCSV = () => {
    exportMarkFoilCSV(config, entries);
  };

  // Helper to get entries for a given page and column (0 = left foil, 1 = right counterfoil)
  const getPageEntries = (pageIdx: number, colIdx: number): (MarkFoilStudentEntry | undefined)[] => {
    const rows = config.totalRows || 25;
    if (foilMode === 'blank') return [];
    const sorted = sortEntriesInDictionaryOrder(entries);
    if (foilMode === 'continuous') {
      const start = (pageIdx * 2 + colIdx) * rows;
      return sorted.slice(start, start + rows);
    }
    // Twin mode: both slips show identical student slice for this page
    const start = pageIdx * rows;
    return sorted.slice(start, start + rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-serif-academic text-xl font-bold text-[#0c2340]">
              Official Examination Mark Foil Generator
            </h2>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded uppercase">
              Official University Format
            </span>
            <span
              className={`text-[10px] font-bold border px-2 py-0.5 rounded uppercase flex items-center gap-1 ${
                totalPages > 1
                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                  : 'bg-emerald-100 text-emerald-900 border-emerald-300'
              }`}
            >
              {totalPages > 1 ? (
                <>
                  <Layers className="w-3 h-3 text-blue-700" />
                  <span>{totalPages} Pages Required ({entries.length} Candidates)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                  <span>Fits 1 Single Page ({entries.length} Candidates)</span>
                </>
              )}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Exact dual-slip format matching examination valuation foil &bull; {totalPages > 1 ? `Accommodates all ${entries.length} candidates across ${totalPages} pages` : 'Fits on a single page'} &bull; Instant <strong>PDF (.pdf)</strong> &amp; <strong>Word (.doc)</strong> downloads &bull; Digit-by-digit marks in words
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
              previewMode
                ? 'bg-[#0c2340] text-amber-300 border-[#0c2340]'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{previewMode ? 'Return to Mark Entry' : 'Foil Preview'}</span>
          </button>

          <button
            onClick={handleSaveDraft}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Save draft marks in browser cache"
          >
            <Save className="w-3.5 h-3.5 text-slate-600" />
            <span>Save Draft</span>
          </button>

          {/* Download PDF Button */}
          <button
            onClick={() => handleDownloadPDF()}
            className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="Download vector PDF file matching the attached format (.pdf)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF{totalPages > 1 ? ` (${totalPages} Pages)` : ' (.pdf)'}</span>
          </button>

          {/* Download Word (.doc) Button */}
          <button
            onClick={() => handleDownloadWordDoc()}
            className="px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="Download formatted Microsoft Word document (.doc)"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Download Word{totalPages > 1 ? ` (${totalPages} Pages)` : ' (.doc)'}</span>
          </button>

          {/* Print / Save PDF Button */}
          <button
            onClick={() => handlePrintPDF()}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="Print or Save as PDF in exact university format"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print{totalPages > 1 ? ` (${totalPages} Pages)` : ''}</span>
          </button>
        </div>
      </div>

      {/* Status Banner */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* Controls Card: Filter by Course, Session, Semester & Exam Details */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Examination Context &amp; Cohort Selection
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Quick Blank Format Downloads */}
            <span className="text-slate-500 font-semibold mr-1">Blank Foil Templates:</span>
            <button
              onClick={() => handleDownloadPDF('blank')}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-red-300 text-red-700 font-bold rounded text-[11px] flex items-center gap-1 cursor-pointer"
              title="Download empty blank PDF sheet with dotted lines as in photo"
            >
              <Download className="w-3 h-3" />
              <span>Blank (PDF)</span>
            </button>
            <button
              onClick={() => handleDownloadWordDoc('blank')}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-blue-300 text-blue-700 font-bold rounded text-[11px] flex items-center gap-1 cursor-pointer"
              title="Download empty blank Word sheet with dotted lines as in photo"
            >
              <Download className="w-3 h-3" />
              <span>Blank (Word)</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filters: Course, Academic Session, Semester & Roll Number Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Course *
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-amber-500"
            >
              <option value="PG">PG (M.Sc. Mathematics)</option>
              <option value="UG NEP">UG NEP (B.Sc. Honors)</option>
              <option value="UG AEDP">UG AEDP (B.Sc. Honors)</option>
              <option value="UG CBCS">UG CBCS (B.Sc. Honors)</option>
              <option value="All">All Courses</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Academic Session / Year *
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-amber-500"
            >
              <option value="2026–27">2026–27</option>
              <option value="2025–26">2025–26</option>
              <option value="2024–25">2024–25</option>
              <option value="2023–24">2023–24</option>
              <option value="All">All Sessions</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Semester *
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-amber-500"
            >
              <option value="Semester I">Semester I (1st Sem)</option>
              <option value="Semester II">Semester II (2nd Sem)</option>
              <option value="Semester III">Semester III (3rd Sem)</option>
              <option value="Semester IV">Semester IV (4th Sem)</option>
              <option value="Semester V">Semester V (5th Sem)</option>
              <option value="Semester VI">Semester VI (6th Sem)</option>
              <option value="All">All Semesters</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Roll Number Type *</span>
              <span className="text-[10px] text-amber-700 font-bold lowercase">format</span>
            </label>
            <select
              value={rollNumberType}
              onChange={(e) => handleRollNumberTypeChange(e.target.value as 'college' | 'university' | 'both')}
              className="w-full px-3 py-2 bg-white border-2 border-amber-400 rounded-lg text-xs font-bold text-[#0c2340] focus:outline-hidden focus:border-amber-600 shadow-xs"
            >
              <option value="college">College Roll No</option>
              <option value="university">University Roll No</option>
              <option value="both">Both (College Roll No / University Roll No)</option>
            </select>
          </div>
        </div>

        {/* Quick Segmented Toggle for College vs University Roll No */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Choose Roll Number:
            </span>
            <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 shadow-xs">
              <button
                type="button"
                onClick={() => handleRollNumberTypeChange('college')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  rollNumberType === 'college'
                    ? 'bg-[#0c2340] text-amber-300 shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>College Roll No</span>
              </button>
              <button
                type="button"
                onClick={() => handleRollNumberTypeChange('university')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  rollNumberType === 'university'
                    ? 'bg-[#0c2340] text-amber-300 shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>University Roll No</span>
              </button>
              <button
                type="button"
                onClick={() => handleRollNumberTypeChange('both')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  rollNumberType === 'both'
                    ? 'bg-[#0c2340] text-amber-300 shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>Both (College / Univ)</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-600 font-medium flex flex-wrap items-center gap-2">
            <div>
              Active: <span className="font-bold text-[#0c2340]">{rollNumberType === 'college' ? 'College Roll No' : rollNumberType === 'university' ? 'University Roll No' : 'College & University Roll No'}</span>
              {enrolledStudents.length > 0 && (
                <span className="text-slate-500 ml-1.5">
                  ({enrolledStudents.length} candidate{enrolledStudents.length !== 1 ? 's' : ''} in cohort)
                </span>
              )}
            </div>
            <span className="text-[10.5px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded font-semibold" title="Students with status 'CLC Taken' are automatically excluded from examination mark foils">
              CLC Taken candidates excluded
            </span>
          </div>
        </div>

        {/* Examination & Paper Foil Headers */}
        <div className="pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Foil Heading &amp; Examination Fields (Printed on Slip)
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                EXAMINATION
              </label>
              <input
                type="text"
                value={config.examinationName}
                onChange={(e) => setConfig({ ...config, examinationName: e.target.value })}
                placeholder="e.g. PG 2nd semester Private 2024"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Subject
              </label>
              <input
                type="text"
                value={config.subject}
                onChange={(e) => setConfig({ ...config, subject: e.target.value })}
                placeholder="Mathematics"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Paper
              </label>
              <input
                type="text"
                value={config.paperName}
                onChange={(e) => setConfig({ ...config, paperName: e.target.value })}
                placeholder="Paper Name"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Full Marks
              </label>
              <input
                type="text"
                value={config.fullMarks}
                onChange={(e) => setConfig({ ...config, fullMarks: e.target.value })}
                placeholder="Full Marks"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Course No.
              </label>
              <input
                type="text"
                value={config.courseNo}
                onChange={(e) => setConfig({ ...config, courseNo: e.target.value })}
                placeholder="Course No."
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-[#0c2340]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Set / Year
              </label>
              <input
                type="text"
                value={config.setNumber}
                onChange={(e) => setConfig({ ...config, setNumber: e.target.value })}
                placeholder="Set / Year"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Examiner Name
              </label>
              <input
                type="text"
                value={config.examinerName}
                onChange={(e) => setConfig({ ...config, examinerName: e.target.value })}
                placeholder="Examiner Name"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Date
              </label>
              <input
                type="text"
                value={config.date}
                onChange={(e) => setConfig({ ...config, date: e.target.value })}
                placeholder="DD/MM/YYYY"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium"
              />
            </div>

            {/* Slip Fill Mode */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Dual Slips Mode
              </label>
              <select
                value={foilMode}
                onChange={(e) => setFoilMode(e.target.value as any)}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium"
              >
                <option value="twin">Twin Slips (Left &amp; Right Identical)</option>
                <option value="continuous">Continuous (1–25 Left, 26–50 Right)</option>
                <option value="blank">Blank Format (As in Photo)</option>
              </select>
            </div>

            {/* Rows per slip (single page fit) */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Rows Per Sheet
              </label>
              <select
                value={config.totalRows || 25}
                onChange={(e) => setConfig({ ...config, totalRows: parseInt(e.target.value) || 25 })}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-emerald-800"
              >
                <option value={25}>25 Rows Per Sheet (Exact Photo Format)</option>
                <option value={28}>28 Rows Per Sheet (Compact)</option>
                <option value={20}>20 Rows Per Sheet (Spacious)</option>
                <option value={30}>30 Rows Per Sheet (Dense)</option>
              </select>
            </div>

            {/* Cell Height Setting (fitting strictly to 1 page) */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Cell Height (1 Page)
              </label>
              <select
                value={config.cellHeightPreset || 'generous'}
                onChange={(e) => setConfig({ ...config, cellHeightPreset: e.target.value as any })}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-indigo-900"
              >
                <option value="generous">Generous (~9mm, Default)</option>
                <option value="extra">Extra Tall (~9.3mm, Max Page 1)</option>
                <option value="standard">Standard (~8.2mm)</option>
              </select>
            </div>

            {/* Font Size Setting */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Font Size
              </label>
              <select
                value={config.fontSizePreset || 'large'}
                onChange={(e) => setConfig({ ...config, fontSizePreset: e.target.value as any })}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-amber-900"
              >
                <option value="large">Large (11–13pt, Default)</option>
                <option value="extralarge">Extra Large (12–14pt)</option>
                <option value="standard">Standard (10–12pt)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Words Format
              </label>
              <div className="flex items-center gap-1 mt-0.5">
                <button
                  type="button"
                  onClick={() => handleToggleCasing('upper')}
                  className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                    config.wordCasing === 'upper'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-white border text-slate-600'
                  }`}
                  title="SIX FOUR (Official uppercase standard)"
                >
                  UPPER
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleCasing('lower')}
                  className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                    config.wordCasing === 'lower'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-white border text-slate-600'
                  }`}
                  title="six four"
                >
                  lower
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main View: Either Mark Entry Form or Live Foil Preview */}
      {!previewMode ? (
        /* ================= 3. MARKS ENTRY TABLE ================= */
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Candidate Mark Entry</span>
                <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-mono">
                  {entries.length} candidates
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                    totalPages > 1
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>{totalPages} Mark Foil Sheet{totalPages > 1 ? 's' : ''}</span>
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Enter mark in "In figures" &bull; "In Words" auto-converts digit-by-digit (e.g. 64 &rarr; SIX FOUR, 15 &rarr; ONE FIVE, AB &rarr; ABSENT).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSortInDictionaryOrder}
                className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Sort all candidates in dictionary (natural alphanumeric) order by active roll number"
              >
                <ArrowDownAZ className="w-3.5 h-3.5 text-amber-700" />
                <span>Sort Roll No (A&rarr;Z)</span>
              </button>
              <button
                onClick={handleAddRow}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Candidate Row</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="Export CSV of roll numbers and marks"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Multiple Pages Notice Banner when students exceed 1 sheet */}
          {totalPages > 1 && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-2.5">
                <Layers className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <strong>Multiple Sheets Active:</strong> {entries.length} candidates exceed a single sheet ({config.totalRows || 25} rows/slip).
                  They are automatically distributed across <strong>{totalPages} separate pages</strong> for printing &amp; PDF export.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shrink-0 cursor-pointer self-start sm:self-auto"
              >
                View Sheets Preview ({totalPages})
              </button>
            </div>
          )}

          {/* Confidential Notice Note */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>University Secrecy Regulation Compliance:</strong> Candidate names are shown on this entry screen to assist the examiner. The downloaded <strong>PDF (.pdf)</strong> and <strong>Word (.doc)</strong> files match the official format and contain strictly <strong>Roll / Code Number, Marks Obtained (In figures, In Words)</strong>.
            </div>
          </div>

          {/* The Interactive Marks Entry Table with Sheet/Page Dividers */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0b1a2f] text-white uppercase text-[10px] tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12">#</th>
                  <th className="py-2.5 px-4">Student Name (On Screen)</th>
                  <th className="py-2.5 px-4 w-52">
                    <div className="flex flex-col">
                      <span>Roll / Code Number *</span>
                      <span className="text-[9px] font-semibold text-amber-300 normal-case tracking-normal">
                        ({rollNumberType === 'college' ? 'College Roll No' : rollNumberType === 'university' ? 'University Roll No' : 'College / Univ Roll No'})
                      </span>
                    </div>
                  </th>
                  <th className="py-2.5 px-4 w-32 text-center">In figures *</th>
                  <th className="py-2.5 px-4 w-56">In Words (Auto Generated) *</th>
                  <th className="py-2.5 px-3 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No candidate records found for the selected session and semester. Click <strong>&quot;Add Candidate Row&quot;</strong> to add candidates.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, idx) => {
                    const rowsPerSlip = config.totalRows || 25;
                    const rowsPerPage = foilMode === 'continuous' ? rowsPerSlip * 2 : rowsPerSlip;
                    const isNewPage = idx > 0 && idx % rowsPerPage === 0;
                    const isNewSlip = foilMode === 'continuous' && idx > 0 && idx % rowsPerSlip === 0 && !isNewPage;
                    const pageNumber = Math.floor(idx / rowsPerPage) + 1;

                    return (
                      <React.Fragment key={entry.id || idx}>
                        {isNewPage && (
                          <tr className="bg-amber-100/80 border-y-2 border-amber-300">
                            <td colSpan={6} className="py-2 px-4 text-xs font-bold text-amber-950">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                  <Layers className="w-3.5 h-3.5 text-amber-700" />
                                  <span>Sheet / Page {pageNumber} of {totalPages} Starts Here (Candidates {idx + 1} to {Math.min(entries.length, idx + rowsPerPage)})</span>
                                </span>
                                <span className="text-[11px] font-medium text-amber-800 hidden sm:inline">
                                  Printed on separate sheet in PDF &amp; Print
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}
                        {isNewSlip && (
                          <tr className="bg-slate-100 border-y border-slate-300">
                            <td colSpan={6} className="py-1.5 px-4 text-[11px] font-semibold text-slate-700">
                              &rarr; Right Slip (Counterfoil) begins here for Sheet {pageNumber}
                            </td>
                          </tr>
                        )}
                        <tr className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                          <td className="py-2 px-3 text-center font-mono text-slate-500 font-bold">
                            {idx + 1}
                          </td>

                          <td className="py-2 px-4">
                            <span className="font-semibold text-slate-800">
                              {entry.name || `Candidate ${idx + 1}`}
                            </span>
                          </td>

                          <td className="py-2 px-4">
                            <input
                              type="text"
                              value={entry.rollNumber}
                              onChange={(e) => handleRollChange(idx, e.target.value)}
                              placeholder={
                                rollNumberType === 'college'
                                  ? 'College Roll No'
                                  : rollNumberType === 'university'
                                  ? 'University Roll No'
                                  : 'College / Univ Roll No'
                              }
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs font-bold text-[#0c2340] focus:outline-hidden focus:border-amber-500"
                            />
                          </td>

                          <td className="py-2 px-4 text-center">
                            <input
                              type="text"
                              value={entry.marksInFigures}
                              onChange={(e) => handleMarkChange(idx, e.target.value)}
                              placeholder="Marks"
                              maxLength={6}
                              className="w-24 text-center font-bold px-2 py-1.5 bg-amber-50 border border-amber-300 rounded text-slate-900 text-xs font-mono focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-500"
                            />
                          </td>

                          <td className="py-2 px-4">
                            <input
                              type="text"
                              value={entry.marksInWords}
                              onChange={(e) => handleWordsChange(idx, e.target.value)}
                              placeholder="e.g. SIX FOUR"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold uppercase text-slate-800 focus:outline-hidden focus:border-amber-500"
                            />
                          </td>

                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                              title="Remove row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Quick Footer Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <span className="text-xs text-slate-500">
              {entries.filter((e) => e.marksInFigures).length} of {entries.length} candidates marked &bull; {totalPages} Sheet{totalPages > 1 ? 's' : ''}
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleDownloadPDF()}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF{totalPages > 1 ? ` (${totalPages} Pages)` : ' (.pdf)'}</span>
              </button>

              <button
                onClick={() => handleDownloadWordDoc()}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Download Word{totalPages > 1 ? ` (${totalPages} Pages)` : ' (.doc)'}</span>
              </button>

              <button
                onClick={() => handlePrintPDF()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print{totalPages > 1 ? ` (${totalPages} Pages)` : ''}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ================= 4. LIVE MULTI-PAGE DUAL-FOIL PREVIEW ================= */
        <div className="bg-slate-100 border border-slate-300 rounded-2xl p-4 sm:p-6 shadow-lg space-y-5">
          {/* Preview Navigation & Control Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Live Document Preview
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1 ${
                    totalPages > 1
                      ? 'bg-blue-100 text-blue-900 border border-blue-300'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}
                >
                  <Layers className="w-3 h-3 text-blue-700" />
                  <span>{totalPages} Page{totalPages > 1 ? 's' : ''} ({entries.length} Candidates)</span>
                </span>
              </div>
              <h3 className="text-base font-serif-academic font-bold text-slate-900 mt-0.5">
                Official Examination Mark Foil (Dual-Column Slip Format)
              </h3>
            </div>

            {/* Pagination Controls when multiple pages exist */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                {/* View Mode Toggle: Single Page vs Stacked All Pages */}
                <div className="flex items-center border border-slate-300 rounded-lg p-0.5 bg-slate-50 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setViewAllPages(false)}
                    className={`px-2.5 py-1 rounded-md text-xs cursor-pointer transition ${
                      !viewAllPages
                        ? 'bg-white font-bold text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Single Sheet
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewAllPages(true)}
                    className={`px-2.5 py-1 rounded-md text-xs cursor-pointer transition flex items-center gap-1 ${
                      viewAllPages
                        ? 'bg-white font-bold text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <BookOpen className="w-3 h-3 text-blue-600" />
                    <span>All {totalPages} Sheets</span>
                  </button>
                </div>

                {!viewAllPages && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage <= 0}
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4 text-slate-700" />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }).map((_, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => setCurrentPage(pIdx)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold cursor-pointer transition ${
                            currentPage === pIdx
                              ? 'bg-[#0c2340] text-amber-300 shadow-xs'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {pIdx + 1}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={currentPage >= totalPages - 1}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                      className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                      title="Next Page"
                    >
                      <ChevronRight className="w-4 h-4 text-slate-700" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Action Download & Print Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleDownloadPDF()}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF{totalPages > 1 ? ` (${totalPages}p)` : ''}</span>
              </button>

              <button
                onClick={() => handleDownloadWordDoc()}
                className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Word{totalPages > 1 ? ` (${totalPages}p)` : ''}</span>
              </button>

              <button
                onClick={() => handlePrintPDF()}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print{totalPages > 1 ? ` (${totalPages}p)` : ''}</span>
              </button>
            </div>
          </div>

          {/* Render A4 Sheet Helper */}
          {(() => {
            const renderA4Sheet = (pageIdx: number) => {
              const leftSlipEntries = getPageEntries(pageIdx, 0);
              const rightSlipEntries = getPageEntries(pageIdx, 1);
              const totalRows = config.totalRows || 25;
              const rows = Array.from({ length: totalRows });

              const rowsPerSlip = config.totalRows || 25;
              const rowsPerPage = foilMode === 'continuous' ? rowsPerSlip * 2 : rowsPerSlip;
              const startCandidateIdx = pageIdx * rowsPerPage;
              const endCandidateIdx = Math.min(entries.length, startCandidateIdx + rowsPerPage);

              const pageIndicator = totalPages > 1 ? ` (Page ${pageIdx + 1} of ${totalPages})` : '';
              const setYearText =
                config.setNumber && config.date
                  ? `Set / Year ${config.setNumber} / ${config.date.slice(-4) || '2026'}${pageIndicator}`
                  : `Set / Year..................${pageIndicator}`;

              const examText = config.examinationName
                ? `EXAMINATION  ${config.examinationName}`
                : 'EXAMINATION ..............................................';

              const subjectText = config.subject
                ? `Subject  ${config.subject}`
                : 'Subject ....................................................';

              const paperVal = config.paperName || '.............................';
              const marksVal = config.fullMarks || '...............';
              const paperMarksText = `Paper  ${paperVal}    Full Marks  ${marksVal}`;

              const courseNoText = config.courseNo
                ? `Course No.  ${config.courseNo}`
                : 'Course No. .................................................';

              const dateStr = config.date
                ? `Date  ${config.date}`
                : 'Date .................................';

              return (
                <div key={pageIdx} className="space-y-2">
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between max-w-5xl mx-auto px-1 text-xs">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        <span>Sheet {pageIdx + 1} of {totalPages}</span>
                        {entries.length > 0 && (
                          <span className="text-slate-500 font-normal">
                            &bull; Candidates {startCandidateIdx + 1}–{endCandidateIdx} of {entries.length}
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {foilMode === 'twin'
                          ? 'Twin Slips (Identical Foil & Counterfoil)'
                          : foilMode === 'continuous'
                          ? 'Continuous Slips (Left & Right Sequential)'
                          : 'Blank Format'}
                      </span>
                    </div>
                  )}

                  {/* Authentic Centered Side-By-Side A4 Sheet Representation */}
                  <div className="bg-slate-200/70 p-3 sm:p-6 rounded-2xl flex flex-col items-center justify-center overflow-x-auto">
                    <div className="w-full max-w-[860px] bg-white border border-slate-400 shadow-xl rounded-sm p-6 sm:p-9 font-serif text-black min-w-[680px]">
                      <div className="grid grid-cols-2 gap-6 sm:gap-8 relative">
                        {/* Vertical Dashed Center Line (Cut Guide) */}
                        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-r border-dashed border-slate-400 pointer-events-none" />

                        {/* Render Slip Helper */}
                        {[leftSlipEntries, rightSlipEntries].map((slipEntries, colIdx) => {
                          const fontMetaSize =
                            config.fontSizePreset === 'extralarge'
                              ? 'text-sm sm:text-[14px]'
                              : config.fontSizePreset === 'standard'
                              ? 'text-[11px] sm:text-xs'
                              : 'text-xs sm:text-[13px]';

                          const fontThSize =
                            config.fontSizePreset === 'extralarge'
                              ? 'text-xs sm:text-[13px]'
                              : config.fontSizePreset === 'standard'
                              ? 'text-[10px] sm:text-[11px]'
                              : 'text-[11px] sm:text-xs';

                          const fontRollSize =
                            config.fontSizePreset === 'extralarge'
                              ? 'text-xs sm:text-[13.5px]'
                              : config.fontSizePreset === 'standard'
                              ? 'text-[10.5px] sm:text-[11.5px]'
                              : 'text-[11.5px] sm:text-[12.5px]';

                          const fontFiguresSize =
                            config.fontSizePreset === 'extralarge'
                              ? 'text-base sm:text-lg font-bold'
                              : config.fontSizePreset === 'standard'
                              ? 'text-xs sm:text-sm font-bold'
                              : 'text-sm sm:text-[15px] font-bold';

                          const fontWordsSize =
                            config.fontSizePreset === 'extralarge'
                              ? 'text-xs sm:text-[13px]'
                              : config.fontSizePreset === 'standard'
                              ? 'text-[10px] sm:text-[11px]'
                              : 'text-[11px] sm:text-xs';

                          const fontFooterSize =
                            config.fontSizePreset === 'extralarge'
                              ? 'text-xs sm:text-[13.5px]'
                              : config.fontSizePreset === 'standard'
                              ? 'text-[10.5px] sm:text-[11.5px]'
                              : 'text-[11.5px] sm:text-[12.5px]';

                          const rowHeightClass =
                            config.cellHeightPreset === 'extra'
                              ? 'h-9 sm:h-10'
                              : config.cellHeightPreset === 'standard'
                              ? 'h-6.5 sm:h-7'
                              : 'h-7.5 sm:h-8.5';

                          return (
                            <div key={colIdx} className={`space-y-1.5 ${fontMetaSize} leading-snug`}>
                              {/* College Header in Bold Capital */}
                              <div className="text-center font-bold text-xs sm:text-[13px] uppercase tracking-wider font-serif text-black">
                                PANCHAYAT COLLEGE, BARAGADA
                              </div>

                              {/* Header matching print and PDF exactly */}
                              <div className="text-right font-medium mb-1">
                                {setYearText}
                              </div>
                              <div>{examText}</div>
                              <div>{subjectText}</div>
                              <div>{paperMarksText}</div>
                              <div>
                                <strong>Course No.</strong> {config.courseNo ? `  ${config.courseNo}` : ' .................................................'}
                              </div>

                              {/* Solid Underline */}
                              <div className="border-b-[1.5px] border-black my-1.5" />

                              {/* Table with fixed column proportions matching print/PDF/Word exactly */}
                              <table className="w-full border-collapse border-[1.5px] border-black table-fixed">
                                <thead>
                                  <tr className="border-b border-black">
                                    <th
                                      rowSpan={2}
                                      className={`border-r border-black p-1.5 text-center font-bold w-[38%] align-middle ${fontThSize}`}
                                    >
                                      Roll / Code Number
                                    </th>
                                    <th
                                      colSpan={2}
                                      className={`border-b border-black p-1.5 text-center font-bold w-[62%] ${fontThSize}`}
                                    >
                                      Marks Obtained
                                    </th>
                                  </tr>
                                  <tr className="border-b border-black">
                                    <th className={`border-r border-black p-1 text-center font-bold w-[22%] ${fontThSize}`}>
                                      In figures
                                    </th>
                                    <th className={`p-1 text-center font-bold w-[40%] ${fontThSize}`}>
                                      In Words
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rows.map((_, rIdx) => {
                                    const entry = slipEntries[rIdx];
                                    return (
                                      <tr key={rIdx} className={`border-b border-black ${rowHeightClass}`}>
                                        <td className={`border-r border-black px-2 py-1 text-left font-serif font-medium w-[38%] align-middle ${fontRollSize}`}>
                                          {entry ? entry.rollNumber : ''}
                                        </td>
                                        <td className={`border-r border-black px-1.5 py-1 text-center font-serif w-[22%] align-middle ${fontFiguresSize}`}>
                                          {entry ? entry.marksInFigures : ''}
                                        </td>
                                        <td className={`px-2 py-1 text-left uppercase font-serif font-medium w-[40%] align-middle ${fontWordsSize}`}>
                                          {entry ? entry.marksInWords : ''}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>

                              {/* Footer matching print and PDF */}
                              <div className={`pt-2.5 ${fontFooterSize} space-y-0.5`}>
                                <div className="font-normal">Signature of the Examiner</div>
                                <div>{dateStr}</div>
                                {config.examinerName && (
                                  <div className="text-[11px] sm:text-xs text-slate-600">({config.examinerName})</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            };

            if (viewAllPages) {
              return (
                <div className="space-y-8">
                  {Array.from({ length: totalPages }).map((_, pIdx) => renderA4Sheet(pIdx))}
                </div>
              );
            }

            return renderA4Sheet(currentPage);
          })()}
        </div>
      )}
    </div>
  );
};

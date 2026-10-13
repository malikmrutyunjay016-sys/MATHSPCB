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
} from 'lucide-react';
import { Student } from '../types';
import {
  MarkFoilConfig,
  MarkFoilStudentEntry,
  marksToWordsDigitByDigit,
  generateMarkFoilWordDocument,
  printMarkFoil,
  exportMarkFoilCSV,
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

  // Examination metadata configuration
  const [config, setConfig] = useState<MarkFoilConfig>({
    universityName: 'SAMBALPUR UNIVERSITY',
    examinationCell: 'PRIVATE EXAMINATION CELL',
    setNumber: 'Set. 01',
    examinationName: 'PG 2nd semester Private 2024',
    subject: 'Mathematics',
    paperName: 'COMBINATORICS',
    fullMarks: '80',
    courseNo: 'MAT-544',
    examinerName: 'Mrutyunjay Malik',
    date: new Date().toLocaleDateString('en-GB'),
    totalRows: 25,
    layout: 'dual',
    wordCasing: 'upper',
  });

  // Table entries (includes student name in memory for teacher convenience)
  const [entries, setEntries] = useState<MarkFoilStudentEntry[]>([]);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Auto-suggest examination title when filters change
  useEffect(() => {
    const semShort = selectedSemester.replace('Semester ', '');
    const courseShort = selectedCourse === 'PG' ? 'PG' : 'UG';
    const yearMatch = selectedYear.split('–')[0] || '2026';
    setConfig((prev) => ({
      ...prev,
      examinationName: `${courseShort} ${semShort}${
        semShort === '1' ? 'st' : semShort === '2' ? 'nd' : semShort === '3' ? 'rd' : 'th'
      } semester Private ${yearMatch}`,
    }));
  }, [selectedCourse, selectedSemester, selectedYear]);

  // Enrolled students matching the chosen Course, Academic Year, and Semester
  const enrolledStudents = useMemo(() => {
    return students.filter((s) => {
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

  // Initialize or populate student entries when selection changes
  useEffect(() => {
    // Try restoring saved draft for this combo from localStorage
    const draftKey = `mark_foil_${selectedCourse}_${selectedYear}_${selectedSemester}_${config.courseNo}`;
    const saved = localStorage.getItem(draftKey);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEntries(parsed);
          return;
        }
      } catch (e) {
        console.warn('Could not parse saved draft:', e);
      }
    }

    if (enrolledStudents.length > 0) {
      const initialList: MarkFoilStudentEntry[] = enrolledStudents.map((s) => ({
        id: s.id,
        name: s.name,
        rollNumber: s.rollNumber || s.registrationNumber || s.uniqueId || '18PPG23MT385',
        marksInFigures: '',
        marksInWords: '',
      }));
      setEntries(initialList);
    } else {
      // Fallback sample entry matching the uploaded Sambalpur University Private Examination Cell image
      setEntries([
        {
          id: 'sample-1',
          name: 'Private Candidate (Sample)',
          rollNumber: '18PPG23MT385',
          marksInFigures: '64',
          marksInWords: 'SIX FOUR',
        },
      ]);
    }
  }, [enrolledStudents, selectedCourse, selectedYear, selectedSemester, config.courseNo]);

  // Handle Mark Input change for a specific student row
  const handleMarkChange = (index: number, newFigure: string) => {
    setEntries((prev) => {
      const updated = [...prev];
      const target = { ...updated[index] };
      target.marksInFigures = newFigure;
      // Real-time automatic conversion to digit-by-digit words
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
      name: `Candidate ${entries.length + 1}`,
      rollNumber: `18PPG${new Date().getFullYear().toString().slice(2)}MT${(380 + entries.length + 1)}`,
      marksInFigures: '',
      marksInWords: '',
    };
    setEntries((prev) => [...prev, newEntry]);
  };

  // Delete row
  const handleDeleteRow = (index: number) => {
    setEntries((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Load sample Sambalpur University private cohort as shown in photo
  const handleLoadSamplePrivateCohort = () => {
    const sampleCohort: MarkFoilStudentEntry[] = [
      { id: 'sample-1', name: 'M.Sc. Candidate 1', rollNumber: '18PPG23MT385', marksInFigures: '64', marksInWords: 'SIX FOUR' },
      { id: 'sample-2', name: 'M.Sc. Candidate 2', rollNumber: '18PPG23MT386', marksInFigures: '63', marksInWords: 'SIX THREE' },
      { id: 'sample-3', name: 'M.Sc. Candidate 3', rollNumber: '18PPG23MT387', marksInFigures: '15', marksInWords: 'ONE FIVE' },
      { id: 'sample-4', name: 'M.Sc. Candidate 4', rollNumber: '18PPG23MT388', marksInFigures: '72', marksInWords: 'SEVEN TWO' },
      { id: 'sample-5', name: 'M.Sc. Candidate 5', rollNumber: '18PPG23MT389', marksInFigures: '08', marksInWords: 'ZERO EIGHT' },
      { id: 'sample-6', name: 'M.Sc. Candidate 6', rollNumber: '18PPG23MT390', marksInFigures: 'AB', marksInWords: 'ABSENT' },
    ];
    setEntries(sampleCohort);
    setConfig((prev) => ({
      ...prev,
      examinationName: 'PG 2nd semester Private 2024',
      subject: 'Mathematics',
      paperName: 'COMBINATORICS',
      fullMarks: '80',
      courseNo: 'MAT-544',
      setNumber: 'Set. 01',
    }));
    setStatusMessage({
      text: 'Loaded sample Sambalpur University PG 2nd semester Private valuation cohort.',
      type: 'success',
    });
    setTimeout(() => setStatusMessage(null), 3500);
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

  // Trigger Word (.doc) Download
  const handleDownloadWordDoc = () => {
    generateMarkFoilWordDocument(config, entries);
    setStatusMessage({
      text: `Downloaded confidential Mark Foil Word document: ${config.courseNo}.doc`,
      type: 'success',
    });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Trigger Print / PDF
  const handlePrintPDF = () => {
    printMarkFoil(config, entries);
  };

  // Trigger CSV Export
  const handleExportCSV = () => {
    exportMarkFoilCSV(config, entries);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif-academic text-xl font-bold text-[#0c2340]">
              University Confidential Mark Foil Generator
            </h2>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded uppercase">
              Admin & Valuation
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official Sambalpur University Private Examination Cell format &bull; Digit-by-digit marks in words &bull; Word (.doc) &amp; PDF download
          </p>
        </div>

        {/* Action Buttons */}
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

          <button
            onClick={handlePrintPDF}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="Print or Save as PDF in exact university format"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={handleDownloadWordDoc}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="Download Word document containing roll no, marks, and in words"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download in Word (.doc)</span>
          </button>
        </div>
      </div>

      {/* Status banner */}
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
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Select Student Cohort &amp; Examination Context
            </h3>
          </div>
          <button
            onClick={handleLoadSamplePrivateCohort}
            className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold underline cursor-pointer"
          >
            Load Sample Sambalpur PG Private Cohort (18PPG23MT385)
          </button>
        </div>

        {/* Dropdown Filters: Course, Academic Session, Semester */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        </div>

        {/* Examination & Paper Foil Headers */}
        <div className="pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Official Foil Heading Details (as on Confidential Sheet)
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Examination Name
              </label>
              <input
                type="text"
                value={config.examinationName}
                onChange={(e) => setConfig({ ...config, examinationName: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Paper Name
              </label>
              <input
                type="text"
                value={config.paperName}
                onChange={(e) => setConfig({ ...config, paperName: e.target.value })}
                placeholder="e.g. COMBINATORICS"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium uppercase"
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
                placeholder="e.g. MAT-544"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium uppercase"
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
                placeholder="80"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Set No.
              </label>
              <input
                type="text"
                value={config.setNumber}
                onChange={(e) => setConfig({ ...config, setNumber: e.target.value })}
                placeholder="Set. 01"
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

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Foil Layout
              </label>
              <select
                value={config.layout}
                onChange={(e) => setConfig({ ...config, layout: e.target.value as any })}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium"
              >
                <option value="dual">Dual Counterfoil (Side-by-side as in photo)</option>
                <option value="single">Single Foil (A4 Full Page)</option>
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
                  title="SIX FOUR (Official Sambalpur University uppercase standard)"
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
                <span>Enrolled Students &amp; Marks Entry</span>
                <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-mono">
                  {entries.length} candidates
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Enter mark in "Marks (In Figures)" column &bull; "In Words" auto-converts digit-by-digit (e.g. 63 &rarr; SIX THREE, 15 &rarr; ONE FIVE, 64 &rarr; SIX FOUR).
              </p>
            </div>

            <div className="flex items-center gap-2">
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

          {/* Confidential Notice Note */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>University Confidential Foil Secrecy Compliance:</strong> Candidate names are shown on this entry screen to assist the examiner. As mandated by university valuation secrecy regulations and your instruction, the final downloaded Word (.doc) and printed Mark Foil <strong>contain strictly University Roll No, Marks (In Figures), and In Words only</strong>.
            </div>
          </div>

          {/* The Interactive Marks Entry Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0b1a2f] text-white uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12">#</th>
                  <th className="py-2.5 px-4">Student Name (On Screen)</th>
                  <th className="py-2.5 px-4 w-48">University Roll / Code No.</th>
                  <th className="py-2.5 px-4 w-32 text-center">Marks (In Figures) *</th>
                  <th className="py-2.5 px-4 w-56">In Words (Auto Generated) *</th>
                  <th className="py-2.5 px-3 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No enrolled candidates found for the selected session and semester. Click <strong>"Add Candidate Row"</strong> or <strong>"Load Sample Private Cohort"</strong>.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, idx) => (
                    <tr
                      key={entry.id || idx}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                    >
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
                          placeholder="e.g. 18PPG23MT385"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs font-bold text-[#0c2340] focus:outline-hidden focus:border-amber-500"
                        />
                      </td>

                      <td className="py-2 px-4 text-center">
                        <input
                          type="text"
                          value={entry.marksInFigures}
                          onChange={(e) => handleMarkChange(idx, e.target.value)}
                          placeholder="e.g. 64"
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
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                          title="Remove row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Quick Footer Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <span className="text-xs text-slate-500">
              {entries.filter((e) => e.marksInFigures).length} of {entries.length} candidates marked
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintPDF}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Print / Save PDF</span>
              </button>

              <button
                onClick={handleDownloadWordDoc}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download in Word (.doc)</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ================= 4. LIVE FOIL PREVIEW (AUTHENTIC SAMBALPUR FOIL FORMAT) ================= */
        <div className="bg-white border border-slate-300 rounded-2xl p-6 sm:p-8 shadow-lg space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Confidential Examination Cell Output
              </span>
              <h3 className="text-base font-serif-academic font-bold text-slate-900">
                Official Sambalpur University Mark Foil Preview
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintPDF}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Preview</span>
              </button>
              <button
                onClick={handleDownloadWordDoc}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download in Word (.doc)</span>
              </button>
            </div>
          </div>

          {/* Authentic Sambalpur University Foil Sheet Container */}
          <div className="max-w-xl mx-auto border-2 border-slate-800 p-6 sm:p-8 bg-white font-serif shadow-sm text-black">
            {/* Header */}
            <div className="text-center mb-4">
              <div className="text-xs sm:text-sm font-bold tracking-wider uppercase">
                {config.examinationCell || 'PRIVATE EXAMINATION CELL'}
              </div>
              <div className="text-base sm:text-lg font-bold tracking-widest uppercase mt-0.5">
                {config.universityName || 'SAMBALPUR UNIVERSITY'}
              </div>
            </div>

            {/* Meta info */}
            <div className="text-xs space-y-1 mb-4 leading-relaxed">
              <div className="font-bold">{config.setNumber || 'Set. 01'}</div>
              <div>
                <strong>Examination:</strong>{' '}
                <span className="underline font-semibold ml-1">
                  {config.examinationName || 'PG 2nd semester Private 2024'}
                </span>
              </div>
              <div>
                <strong>Subject:</strong>{' '}
                <span className="underline font-semibold ml-1">
                  {config.subject || 'Mathematics'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <strong>Paper:</strong>{' '}
                  <span className="underline font-semibold ml-1">
                    {config.paperName || 'COMBINATORICS'}
                  </span>
                </div>
                <div>
                  <strong>Full Marks:</strong>{' '}
                  <span className="underline font-semibold ml-1">
                    {config.fullMarks || '80'}
                  </span>
                </div>
              </div>
              <div>
                <strong>Course No.</strong>{' '}
                <span className="underline font-semibold ml-1">
                  {config.courseNo || 'MAT-544'}
                </span>
              </div>
            </div>

            {/* Confidential 3-Column Marks Table */}
            <div className="border border-black relative">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-black">
                    <th
                      rowSpan={2}
                      className="border-r border-black p-2 text-center align-middle font-bold w-[42%]"
                    >
                      Roll/Code<br />Number
                    </th>
                    <th
                      colSpan={2}
                      className="border-b border-black p-1 text-center font-bold"
                    >
                      Marks obtained
                    </th>
                  </tr>
                  <tr className="border-b border-black">
                    <th className="border-r border-black p-1 text-center font-bold w-[22%]">
                      In<br />Figures
                    </th>
                    <th className="p-1 text-center font-bold w-[36%]">
                      In Words
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: Math.max(config.totalRows || 20, entries.length) }).map(
                    (_, rowIdx) => {
                      const entry = entries[rowIdx];
                      return (
                        <tr key={rowIdx} className="border-b border-black h-6">
                          <td className="border-r border-black px-2 py-0.5 text-left font-mono font-medium">
                            {entry ? entry.rollNumber : ''}
                          </td>
                          <td className="border-r border-black px-2 py-0.5 text-center font-bold font-mono">
                            {entry ? entry.marksInFigures : ''}
                          </td>
                          <td className="px-2 py-0.5 text-left uppercase text-[11px]">
                            {entry ? entry.marksInWords : ''}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>

              {/* Diagonal red line for unused blank rows as in the photo */}
              {entries.length < (config.totalRows || 20) && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <line
                    x1="10"
                    y1={`${(entries.length / (config.totalRows || 20)) * 82 + 16}`}
                    x2="90"
                    y2="98"
                    stroke="#dc2626"
                    strokeWidth="0.6"
                  />
                </svg>
              )}
            </div>

            {/* Signatures */}
            <div className="flex justify-between items-end mt-8 text-xs pt-4">
              <div>
                <div className="font-bold">Signature of the Examiner</div>
                <div className="mt-1 text-slate-700">Date: {config.date || '........................'}</div>
                {config.examinerName && (
                  <div className="text-[11px] text-slate-500 mt-0.5">({config.examinerName})</div>
                )}
              </div>
              <div className="text-right">
                <div className="font-bold">Chief Examiner</div>
                <div className="mt-1 text-slate-700">Date: ........................</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

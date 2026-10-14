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
} from 'lucide-react';
import { Student } from '../types';
import {
  MarkFoilConfig,
  MarkFoilStudentEntry,
  marksToWordsDigitByDigit,
  generateMarkFoilPDF,
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
      // Sample entry matching the valuation cohort format
      setEntries([
        {
          id: 'sample-1',
          name: 'Candidate 1',
          rollNumber: '18PPG23MT385',
          marksInFigures: '64',
          marksInWords: 'SIX FOUR',
        },
        {
          id: 'sample-2',
          name: 'Candidate 2',
          rollNumber: '18PPG23MT386',
          marksInFigures: '63',
          marksInWords: 'SIX THREE',
        },
        {
          id: 'sample-3',
          name: 'Candidate 3',
          rollNumber: '18PPG23MT387',
          marksInFigures: '15',
          marksInWords: 'ONE FIVE',
        },
        {
          id: 'sample-4',
          name: 'Candidate 4',
          rollNumber: '18PPG23MT388',
          marksInFigures: '72',
          marksInWords: 'SEVEN TWO',
        },
        {
          id: 'sample-5',
          name: 'Candidate 5',
          rollNumber: '18PPG23MT389',
          marksInFigures: '08',
          marksInWords: 'ZERO EIGHT',
        },
        {
          id: 'sample-6',
          name: 'Candidate 6',
          rollNumber: '18PPG23MT390',
          marksInFigures: 'AB',
          marksInWords: 'ABSENT',
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
      rollNumber: `18PPG${new Date().getFullYear().toString().slice(2)}MT${380 + entries.length + 1}`,
      marksInFigures: '',
      marksInWords: '',
    };
    setEntries((prev) => [...prev, newEntry]);
  };

  // Delete row
  const handleDeleteRow = (index: number) => {
    setEntries((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Load sample valuation cohort
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
      text: 'Loaded sample PG valuation cohort (18PPG23MT385 – 390).',
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

  // 1. Download Vector PDF (.pdf) strictly fitting onto a single page
  const handleDownloadPDF = (modeOverride?: 'twin' | 'continuous' | 'blank') => {
    const targetMode = modeOverride || foilMode;
    const targetRows = config.totalRows || 25;
    generateMarkFoilPDF(config, entries, { mode: targetMode, totalRows: targetRows });
    setStatusMessage({
      text: `Downloaded Single-Page Mark Foil PDF (${targetMode === 'blank' ? 'Blank Template' : config.courseNo}).pdf`,
      type: 'success',
    });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // 2. Download Microsoft Word document (.doc) strictly fitting onto a single page
  const handleDownloadWordDoc = (modeOverride?: 'twin' | 'continuous' | 'blank') => {
    const targetMode = modeOverride || foilMode;
    const targetRows = config.totalRows || 25;
    generateMarkFoilWordDocument(config, entries, { mode: targetMode, totalRows: targetRows });
    setStatusMessage({
      text: `Downloaded Single-Page Mark Foil Word Document (${targetMode === 'blank' ? 'Blank Template' : config.courseNo}).doc`,
      type: 'success',
    });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // 3. Print / Save as PDF fitting onto a single page
  const handlePrintPDF = (modeOverride?: 'twin' | 'continuous' | 'blank') => {
    const targetMode = modeOverride || foilMode;
    const targetRows = config.totalRows || 25;
    printMarkFoil(config, entries, { mode: targetMode, totalRows: targetRows });
  };

  // 4. Export CSV
  const handleExportCSV = () => {
    exportMarkFoilCSV(config, entries);
  };

  // Compute entries for Left slip and Right slip in the on-screen preview
  const previewLeftEntries = useMemo(() => {
    const rows = config.totalRows || 25;
    if (foilMode === 'blank') return [];
    if (foilMode === 'continuous') return entries.slice(0, rows);
    return entries.slice(0, rows);
  }, [entries, foilMode, config.totalRows]);

  const previewRightEntries = useMemo(() => {
    const rows = config.totalRows || 25;
    if (foilMode === 'blank') return [];
    if (foilMode === 'continuous') return entries.slice(rows, rows * 2);
    return entries.slice(0, rows);
  }, [entries, foilMode, config.totalRows]);

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
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
              <span>Fits 1 Single Page</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Exact twin-column format matching examination valuation foil &bull; Instant <strong>PDF (.pdf)</strong> &amp; <strong>Word (.doc)</strong> downloads fitting strictly on 1 single page &bull; Digit-by-digit marks in words
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
            <span>Download PDF (.pdf)</span>
          </button>

          {/* Download Word (.doc) Button */}
          <button
            onClick={() => handleDownloadWordDoc()}
            className="px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="Download formatted Microsoft Word document (.doc)"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Download Word (.doc)</span>
          </button>

          {/* Print / Save PDF Button */}
          <button
            onClick={() => handlePrintPDF()}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="Print or Save as PDF in exact university format"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
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
            <button
              onClick={handleLoadSamplePrivateCohort}
              className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold underline cursor-pointer ml-2"
            >
              Load Sample Cohort (18PPG23MT385)
            </button>
          </div>
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
                placeholder="COMBINATORICS"
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
                placeholder="80"
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
                placeholder="MAT-544"
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
                Rows (Fits 1 Page)
              </label>
              <select
                value={config.totalRows || 25}
                onChange={(e) => setConfig({ ...config, totalRows: parseInt(e.target.value) || 25 })}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-emerald-800"
              >
                <option value={25}>25 Rows (Exact Photo Format)</option>
                <option value={28}>28 Rows (Compact Single-Page)</option>
                <option value={20}>20 Rows (Spacious Single-Page)</option>
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
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Enter mark in "In figures" &bull; "In Words" auto-converts digit-by-digit (e.g. 64 &rarr; SIX FOUR, 15 &rarr; ONE FIVE, AB &rarr; ABSENT).
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
              <strong>University Secrecy Regulation Compliance:</strong> Candidate names are shown on this entry screen to assist the examiner. The downloaded <strong>PDF (.pdf)</strong> and <strong>Word (.doc)</strong> files match the attached format and contain strictly <strong>Roll / Code Number, Marks Obtained (In figures, In Words)</strong>.
            </div>
          </div>

          {/* The Interactive Marks Entry Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0b1a2f] text-white uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12">#</th>
                  <th className="py-2.5 px-4">Student Name (On Screen)</th>
                  <th className="py-2.5 px-4 w-48">Roll / Code Number *</th>
                  <th className="py-2.5 px-4 w-32 text-center">In figures *</th>
                  <th className="py-2.5 px-4 w-56">In Words (Auto Generated) *</th>
                  <th className="py-2.5 px-3 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No enrolled candidates found for the selected session and semester. Click <strong>"Add Candidate Row"</strong> or <strong>"Load Sample Cohort"</strong>.
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
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
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

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleDownloadPDF()}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF (.pdf)</span>
              </button>

              <button
                onClick={() => handleDownloadWordDoc()}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Download Word (.doc)</span>
              </button>

              <button
                onClick={() => handlePrintPDF()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ================= 4. LIVE DUAL-FOIL PREVIEW MATCHING ATTACHED PHOTO ================= */
        <div className="bg-slate-100 border border-slate-300 rounded-2xl p-4 sm:p-6 shadow-lg space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Live Document Preview
              </span>
              <h3 className="text-base font-serif-academic font-bold text-slate-900">
                Official Examination Mark Foil (Dual-Column Slip Format)
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleDownloadPDF()}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF (.pdf)</span>
              </button>

              <button
                onClick={() => handleDownloadWordDoc()}
                className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download Word (.doc)</span>
              </button>

              <button
                onClick={() => handlePrintPDF()}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Authentic Side-By-Side A4 Sheet Representation */}
          <div className="bg-white border-2 border-slate-400 p-6 sm:p-8 max-w-5xl mx-auto shadow-md font-serif text-black overflow-x-auto">
            <div className="grid grid-cols-2 gap-8 relative min-w-[700px]">
              {/* Vertical Dashed Center Line (Cut Guide) */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-r border-dashed border-slate-400 pointer-events-none" />

              {/* Render Slip Helper */}
              {[previewLeftEntries, previewRightEntries].map((slipEntries, colIdx) => {
                const totalRows = config.totalRows || 25;
                const rows = Array.from({ length: totalRows });

                const setYearText =
                  config.setNumber && config.date
                    ? `Set / Year ${config.setNumber} / ${config.date.slice(-4) || '2026'}`
                    : 'Set / Year..................';

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
                  <div key={colIdx} className="space-y-1.5 text-xs sm:text-[13px] leading-snug">
                    {/* Header with enlarged font size */}
                    <div className="text-right text-xs sm:text-[13px] font-medium mb-1">
                      {setYearText}
                    </div>
                    <div>{examText}</div>
                    <div>{subjectText}</div>
                    <div>{paperMarksText}</div>
                    <div>{courseNoText}</div>

                    {/* Solid Underline */}
                    <div className="border-b-2 border-black my-1.5" />

                    {/* Table with increased cell height and enlarged typography */}
                    <table className="w-full border-collapse border border-black text-xs sm:text-[13px]">
                      <thead>
                        <tr className="border-b border-black">
                          <th
                            rowSpan={2}
                            className="border-r border-black p-2 text-center font-bold w-[38%] align-middle text-xs sm:text-[13px]"
                          >
                            Roll / Code Number
                          </th>
                          <th
                            colSpan={2}
                            className="border-b border-black p-1.5 text-center font-bold w-[62%] text-xs sm:text-[13px]"
                          >
                            Marks Obtained
                          </th>
                        </tr>
                        <tr className="border-b border-black">
                          <th className="border-r border-black p-1.5 text-center font-bold w-[22%] text-xs sm:text-[12px]">
                            In figures
                          </th>
                          <th className="p-1.5 text-center font-bold w-[40%] text-xs sm:text-[12px]">
                            In Words
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((_, rIdx) => {
                          const entry = slipEntries[rIdx];
                          const rowHeightClass =
                            config.cellHeightPreset === 'extra'
                              ? 'h-9 sm:h-10'
                              : config.cellHeightPreset === 'standard'
                              ? 'h-7 sm:h-8'
                              : 'h-8 sm:h-9';
                          return (
                            <tr key={rIdx} className={`border-b border-black ${rowHeightClass}`}>
                              <td className="border-r border-black px-2.5 py-1.5 text-left font-mono font-medium text-xs sm:text-[13px] align-middle">
                                {entry ? entry.rollNumber : ''}
                              </td>
                              <td className="border-r border-black px-2 py-1.5 text-center font-bold font-mono text-sm sm:text-[15px] align-middle">
                                {entry ? entry.marksInFigures : ''}
                              </td>
                              <td className="px-2.5 py-1.5 text-left uppercase text-xs sm:text-[13px] font-medium align-middle">
                                {entry ? entry.marksInWords : ''}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Footer with enlarged font size */}
                    <div className="pt-3 text-xs sm:text-[13px] space-y-1">
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
      )}
    </div>
  );
};

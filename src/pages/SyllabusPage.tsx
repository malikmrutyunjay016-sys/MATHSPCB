import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  FileText,
  Download,
  Plus,
  Edit2,
  Trash2,
  GraduationCap,
  ExternalLink,
  Layers,
  Calendar,
  CheckCircle2,
  Upload,
  Link as LinkIcon,
  X,
  FileCheck,
  Eye,
  Sparkles,
  EyeOff,
  Lock,
} from 'lucide-react';
import { Syllabus, SyllabusCategory } from '../types';
import { useAuth } from '../context/AuthContext';
import { getSafeDownloadFilename, downloadFile } from '../utils/fileDownload';

interface SyllabusPageProps {
  syllabuses: Syllabus[];
  onAddSyllabus?: (defaultCourse?: string) => void;
  onEditSyllabus: (syllabus: Syllabus) => void;
  onDeleteSyllabus: (id: string, title: string) => void;
  onSaveSyllabus?: (syllabus: Syllabus) => void;
  onViewPDF?: (title: string, url: string, category: string, fileName?: string) => void;
}

export const SyllabusPage: React.FC<SyllabusPageProps> = ({
  syllabuses,
  onEditSyllabus,
  onDeleteSyllabus,
  onSaveSyllabus,
  onViewPDF,
}) => {
  const { isAdmin } = useAuth();

  // 1. Option of Admission Batch (formerly session)
  const [selectedBatch, setSelectedBatch] = useState<string>('All');
  // 2. Option of Course: (UG NEP, UG AEDP, PG)
  const [selectedCourse, setSelectedCourse] = useState<string>('All');
  // 3. Tab of: (Major, Minor, MDC, VAC, SEC, AEC, None)
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  // Format filter (All, PDF Only, URL Only)
  const [formatFilter, setFormatFilter] = useState<'All' | 'url' | 'pdf'>('All');

  // Box Add/Upload Panel State
  const [showUploadBox, setShowUploadBox] = useState<boolean>(false);
  // Source Tab: 'url' (Provide Link in URL) or 'pdf' (Upload File in PDF Format)
  const [uploadTab, setUploadTab] = useState<'url' | 'pdf'>('url');

  // Form state for Course Syllabus Box (semester, paper code, subject/paper title REMOVED)
  const [formBatch, setFormBatch] = useState<string>('2025–26');
  const [formCourse, setFormCourse] = useState<'UG NEP' | 'UG AEDP' | 'PG'>('UG NEP');
  const [formCategory, setFormCategory] = useState<SyllabusCategory>('Major');
  const [formUrl, setFormUrl] = useState<string>('');
  const [formPdfData, setFormPdfData] = useState<string>('');
  const [formPdfName, setFormPdfName] = useState<string>('');
  const [formPdfSize, setFormPdfSize] = useState<string>('');
  const [formSuccessMessage, setFormSuccessMessage] = useState<string>('');

  const admissionBatches = ['All', '2025–26', '2024–25', '2023–24', '2026–27'];
  const courses: ('All' | 'UG NEP' | 'UG AEDP' | 'PG')[] = ['All', 'UG NEP', 'UG AEDP', 'PG'];
  const categoryTabs: { id: string; label: string; fullLabel: string; color: string }[] = [
    { id: 'All', label: 'All Tabs', fullLabel: 'All Syllabus Categories', color: 'slate' },
    { id: 'Major', label: 'Major', fullLabel: 'Major Core Discipline', color: 'blue' },
    { id: 'Minor', label: 'Minor', fullLabel: 'Minor Discipline', color: 'indigo' },
    { id: 'MDC', label: 'MDC', fullLabel: 'Multidisciplinary Course', color: 'emerald' },
    { id: 'VAC', label: 'VAC', fullLabel: 'Value Added Course', color: 'amber' },
    { id: 'SEC', label: 'SEC', fullLabel: 'Skill Enhancement Course', color: 'purple' },
    { id: 'AEC', label: 'AEC', fullLabel: 'Ability Enhancement Course', color: 'rose' },
    { id: 'None', label: 'None', fullLabel: 'None (Display nothing to public)', color: 'slate' },
  ];

  // Helper to normalize category
  const getCategory = (s: Syllabus): string => {
    if (s.category) return s.category;
    const titleLower = (s.title || '').toLowerCase();
    const codeLower = (s.paperCode || '').toLowerCase();
    if (titleLower.includes('none')) return 'None';
    if (titleLower.includes('core') || codeLower.includes('cc') || titleLower.includes('major')) return 'Major';
    if (titleLower.includes('minor') || codeLower.includes('mn')) return 'Minor';
    if (titleLower.includes('mdc') || titleLower.includes('multidisciplinary') || codeLower.includes('mdc')) return 'MDC';
    if (titleLower.includes('vac') || titleLower.includes('value') || codeLower.includes('vac')) return 'VAC';
    if (titleLower.includes('sec') || titleLower.includes('skill') || codeLower.includes('sec')) return 'SEC';
    if (titleLower.includes('aec') || titleLower.includes('ability') || codeLower.includes('aec')) return 'AEC';
    return 'Major';
  };

  // Helper to normalize admission batch (session replaced by admission batch)
  const getBatch = (s: Syllabus): string => {
    if (s.admissionBatch) return s.admissionBatch;
    if (s.session) return s.session;
    if (s.academicYear) {
      if (s.academicYear.includes('2025') || s.academicYear.includes('2026')) return '2025–26';
      if (s.academicYear.includes('2024')) return '2024–25';
      if (s.academicYear.includes('2023')) return '2023–24';
      if (s.academicYear.includes('2026') || s.academicYear.includes('2027')) return '2026–27';
    }
    return '2025–26';
  };

  // Helper to get file format
  const getFileType = (s: Syllabus): 'url' | 'pdf' => {
    if (s.fileType) return s.fileType;
    if (s.fileUrl) {
      if (s.fileUrl.startsWith('http') && !s.fileUrl.endsWith('.pdf')) return 'url';
      return 'pdf';
    }
    return 'pdf';
  };

  // Filtered syllabuses:
  // - If Course is 'PG', there will be NO category tab (all PG syllabi match without category restriction)
  // - Category tab 'None' displays NOTHING to the public
  // - Any syllabus with category 'None' is hidden from public display
  // - Admission Batch filter replaces Session
  const filteredSyllabuses = useMemo(() => {
    // If Course tab PG is chosen: no category tab is applied
    if (selectedCourse === 'PG') {
      return syllabuses.filter((s) => {
        const isPg = s.course === 'PG' || s.course.includes('PG');
        if (!isPg) return false;

        const itemBatch = getBatch(s);
        const matchBatch = selectedBatch === 'All' || itemBatch === selectedBatch;

        const itemFileType = getFileType(s);
        const matchFormat = formatFilter === 'All' || itemFileType === formatFilter;

        return matchBatch && matchFormat;
      });
    }

    // If category tab 'None' is selected and user is NOT admin: display nothing to public
    if (selectedCategory === 'None' && !isAdmin) {
      return [];
    }

    return syllabuses.filter((s) => {
      const itemCat = getCategory(s);

      // Category tab None: will display nothing to public
      if (!isAdmin && itemCat === 'None') {
        return false;
      }

      // 1. Admission Batch filter
      const itemBatch = getBatch(s);
      const matchBatch = selectedBatch === 'All' || itemBatch === selectedBatch;

      // 2. Course filter: UG NEP, UG AEDP, PG
      const matchCourse =
        selectedCourse === 'All' ||
        s.course === selectedCourse ||
        (selectedCourse === 'UG NEP' && s.course.includes('NEP')) ||
        (selectedCourse === 'UG AEDP' && s.course.includes('AEDP'));

      // 3. Category tab filter: (Major, Minor, MDC, VAC, SEC, AEC, None)
      const matchCategory =
        selectedCategory === 'All' || itemCat.toLowerCase() === selectedCategory.toLowerCase();

      // 4. Format filter (URL or PDF)
      const itemFileType = getFileType(s);
      const matchFormat = formatFilter === 'All' || itemFileType === formatFilter;

      return matchBatch && matchCourse && matchCategory && matchFormat;
    });
  }, [syllabuses, selectedBatch, selectedCourse, selectedCategory, formatFilter, isAdmin]);

  // Counts for each category tab under currently selected Admission Batch and Course
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: 0,
      Major: 0,
      Minor: 0,
      MDC: 0,
      VAC: 0,
      SEC: 0,
      AEC: 0,
      None: 0,
    };

    syllabuses.forEach((s) => {
      const itemCat = getCategory(s);
      const itemBatch = getBatch(s);
      const matchBatch = selectedBatch === 'All' || itemBatch === selectedBatch;
      const matchCourse =
        selectedCourse === 'All' ||
        s.course === selectedCourse ||
        (selectedCourse === 'UG NEP' && s.course.includes('NEP')) ||
        (selectedCourse === 'UG AEDP' && s.course.includes('AEDP')) ||
        (selectedCourse === 'PG' && s.course.includes('PG'));

      if (matchBatch && matchCourse) {
        // For public users, None items are not visible and display nothing
        if (!isAdmin && itemCat === 'None') {
          return;
        }

        counts.All += 1;
        if (counts[itemCat] !== undefined) {
          counts[itemCat] += 1;
        }
      }
    });

    if (!isAdmin) {
      counts.None = 0;
    }

    return counts;
  }, [syllabuses, selectedBatch, selectedCourse, isAdmin]);

  // Handle PDF file selection
  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      alert('Please select a valid PDF format document.');
      return;
    }

    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    setFormPdfName(file.name);
    setFormPdfSize(sizeStr);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormPdfData(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Handle Box Form Submit (No semester, No paper code, No subject/paper title)
  // If course is PG, no category tab is applied
  const handleBoxSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      alert('Only administrators are authorized to add or upload syllabus documents.');
      return;
    }

    if (uploadTab === 'url' && !formUrl) {
      alert('Please enter a valid syllabus URL link.');
      return;
    }

    if (uploadTab === 'pdf' && !formPdfData) {
      alert('Please select a PDF file to upload.');
      return;
    }

    const generatedTitle =
      formCourse === 'PG'
        ? 'PG Mathematics Syllabus'
        : formCategory === 'None'
        ? `${formCourse} Syllabus (None - Hidden from Public)`
        : `${formCourse} ${formCategory} Syllabus`;

    const newSyllabus: Syllabus = {
      id: `syl-${Date.now()}`,
      course: formCourse,
      session: formBatch,
      admissionBatch: formBatch,
      category: formCourse === 'PG' ? undefined : formCategory,
      title: generatedTitle,
      academicYear: formBatch,
      fileType: uploadTab,
      fileUrl: uploadTab === 'url' ? formUrl : formPdfData,
      fileName: uploadTab === 'url' ? 'Web Link' : (formPdfName || `${generatedTitle}.pdf`),
      fileSize: uploadTab === 'url' ? 'Web URL' : formPdfSize,
      createdAt: new Date().toISOString(),
    };

    if (onSaveSyllabus) {
      onSaveSyllabus(newSyllabus);
    }

    // Reset and show feedback
    const feedbackText =
      formCourse === 'PG'
        ? `PG Syllabus (Admission Batch ${formBatch}) saved successfully!`
        : formCategory === 'None'
        ? `${formCourse} Syllabus saved under 'None' (Hidden from public view)!`
        : `${formCourse} ${formCategory} Syllabus (Admission Batch ${formBatch}) saved successfully!`;

    setFormSuccessMessage(feedbackText);
    setFormUrl('');
    setFormPdfData('');
    setFormPdfName('');
    setFormPdfSize('');

    setTimeout(() => {
      setFormSuccessMessage('');
      setShowUploadBox(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      {/* 1. Academic Header */}
      <section className="bg-[#0b1a2f] text-white pt-10 pb-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-3">
                <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                <span>NEP Curriculum Framework</span>
              </div>
              <h1 className="font-serif-academic text-2xl sm:text-4xl font-bold tracking-tight">
                Academic Syllabi & Programs
              </h1>
              <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
                Official course curricula and syllabus repository for UG NEP, UG AEDP, and PG programs of the Department of Mathematics.
              </p>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowUploadBox(!showUploadBox);
                  }}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md shrink-0"
                >
                  {showUploadBox ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{showUploadBox ? 'Close Upload Box' : 'Add / Upload Course Syllabus'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* ============================================================== */}
        {/* 2. COURSE SYLLABUS BOX */}
        {/* ============================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden mb-8">
          {/* Box Header */}
          <div className="bg-gradient-to-r from-slate-900 via-[#0e2749] to-slate-900 text-white p-5 sm:p-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif-academic text-lg sm:text-xl font-bold tracking-wide flex items-center gap-2">
                  <span>Course Syllabus Box</span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-sans font-semibold border border-amber-400/30">
                    Official Syllabi
                  </span>
                </h2>
                <p className="text-xs text-slate-300">
                  {selectedCourse === 'PG'
                    ? 'Select Admission Batch and Course (PG curriculum without category tabs)'
                    : 'Select Admission Batch, Course (UG NEP, UG AEDP, PG), and Category Tab'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 hidden sm:inline">
                {selectedCourse !== 'PG' && selectedCategory === 'None' && !isAdmin
                  ? 'Public Display:'
                  : 'Available Syllabi:'}
              </span>
              <span className="px-3 py-1 bg-amber-400 text-slate-950 rounded-full text-xs font-bold">
                {selectedCourse !== 'PG' && selectedCategory === 'None' && !isAdmin
                  ? '0 (None / Hidden)'
                  : `${filteredSyllabuses.length} ${filteredSyllabuses.length === 1 ? 'Syllabus' : 'Syllabi'}`}
              </span>
            </div>
          </div>

          {/* Form Banner: Add Course Syllabus - ONLY visible to Admin */}
          {isAdmin && showUploadBox && (
            <div className="bg-slate-50 border-b border-slate-200 p-5 sm:p-6 animate-in fade-in duration-200">
              <div className="max-w-3xl mx-auto bg-white rounded-xl border border-slate-300 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
                  <div>
                    <h3 className="font-serif-academic text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-amber-600" />
                      <span>Add Course Syllabus</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {formCourse === 'PG'
                        ? 'Select Admission Batch, PG Course, and provide URL link or upload PDF file'
                        : 'Select Admission Batch, Course, Category tab, and provide URL link or upload PDF file'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowUploadBox(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {formSuccessMessage && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{formSuccessMessage}</span>
                  </div>
                )}

                <form onSubmit={handleBoxSubmit} className="space-y-4 text-xs">
                  {/* Options of Admission Batch, Course, and Category Tab (NO category tab if PG is chosen) */}
                  <div className={`grid grid-cols-1 ${formCourse === 'PG' ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-3`}>
                    {/* Admission Batch Option */}
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px] flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-600" />
                        <span>Admission Batch *</span>
                      </label>
                      <select
                        value={formBatch}
                        onChange={(e) => setFormBatch(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden bg-white font-medium"
                      >
                        <option value="2025–26">Batch 2025–26</option>
                        <option value="2024–25">Batch 2024–25</option>
                        <option value="2023–24">Batch 2023–24</option>
                        <option value="2026–27">Batch 2026–27</option>
                      </select>
                    </div>

                    {/* Course Option: UG NEP, UG AEDP, PG */}
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px] flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-blue-700" />
                        <span>Course (ug nep, ug aedp, pg) *</span>
                      </label>
                      <select
                        value={formCourse}
                        onChange={(e) => setFormCourse(e.target.value as 'UG NEP' | 'UG AEDP' | 'PG')}
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden bg-white font-bold text-slate-900"
                      >
                        <option value="UG NEP">UG NEP</option>
                        <option value="UG AEDP">UG AEDP</option>
                        <option value="PG">PG</option>
                      </select>
                    </div>

                    {/* Category Tab: (major, minor, mdc, vac, sec, aec, none) - HIDDEN IF COURSE IS PG */}
                    {formCourse !== 'PG' && (
                      <div>
                        <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px] flex items-center gap-1">
                          <Layers className="w-3 h-3 text-indigo-700" />
                          <span>Category Tab *</span>
                        </label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value as SyllabusCategory)}
                          className={`w-full p-2.5 rounded-lg border text-xs focus:outline-hidden bg-white font-bold ${
                            formCategory === 'None'
                              ? 'border-gray-400 text-gray-700 bg-gray-50'
                              : 'border-slate-200 text-blue-900'
                          }`}
                        >
                          <option value="Major">Major</option>
                          <option value="Minor">Minor</option>
                          <option value="MDC">MDC</option>
                          <option value="VAC">VAC</option>
                          <option value="SEC">SEC</option>
                          <option value="AEC">AEC</option>
                          <option value="None">None (Display nothing to public)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {formCourse === 'PG' && (
                    <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-[11px] text-blue-900 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-700 shrink-0" />
                      <span>
                        <strong>Postgraduate (PG) Program:</strong> Category tabs (Major, Minor, etc.) are undergraduate-specific and not applicable for PG syllabus documents.
                      </span>
                    </div>
                  )}

                  {formCourse !== 'PG' && formCategory === 'None' && (
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-center gap-2">
                      <EyeOff className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Note:</strong> Syllabi saved under the <strong>None</strong> category tab will display nothing to the public. Only logged-in administrators can inspect or manage this entry.
                      </span>
                    </div>
                  )}

                  {/* TAB OF: Provide Link in URL OR Upload File in PDF Format */}
                  <div className="pt-2 border-t border-slate-200">
                    <label className="block font-bold text-slate-800 uppercase mb-2 text-[11px]">
                      Source Format: Provide Link in URL or Upload File in PDF Format *
                    </label>

                    <div className="flex rounded-xl bg-slate-100 p-1 mb-3">
                      <button
                        type="button"
                        onClick={() => setUploadTab('url')}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
                          uploadTab === 'url'
                            ? 'bg-blue-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>Provide Link in URL</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUploadTab('pdf')}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
                          uploadTab === 'pdf'
                            ? 'bg-blue-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File in PDF Format</span>
                      </button>
                    </div>

                    {uploadTab === 'url' ? (
                      <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
                        <label className="block font-bold text-blue-950 text-xs">
                          Syllabus Web Link / URL *
                        </label>
                        <input
                          type="url"
                          required={uploadTab === 'url'}
                          value={formUrl}
                          onChange={(e) => setFormUrl(e.target.value)}
                          placeholder="https://suniv.ac.in/syllabus/nep-mathematics or https://drive.google.com/..."
                          className="w-full p-2.5 rounded-lg border border-blue-300 text-xs focus:outline-hidden font-mono bg-white"
                        />
                        <p className="text-[11px] text-blue-800/80">
                          Provide an official web link or URL to the syllabus document.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 space-y-3">
                        <label className="block font-bold text-amber-950 text-xs">
                          Upload Syllabus PDF File *
                        </label>
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          required={uploadTab === 'pdf' && !formPdfData}
                          onChange={handlePdfFileChange}
                          className="w-full p-2 bg-white rounded-lg border border-amber-300 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-900 file:text-white hover:file:bg-blue-800 cursor-pointer"
                        />
                        {formPdfName && (
                          <div className="flex items-center justify-between text-xs text-emerald-800 bg-white border border-emerald-300 p-2.5 rounded-lg font-semibold">
                            <span className="flex items-center gap-1.5">
                              <FileCheck className="w-4 h-4 text-emerald-600" />
                              <span>{formPdfName}</span>
                            </span>
                            <span className="font-mono text-[11px] text-slate-500">{formPdfSize}</span>
                          </div>
                        )}
                        <p className="text-[11px] text-amber-800/80">
                          Upload directly as a .pdf file format for instant online viewing and offline download.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setShowUploadBox(false)}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer transition shadow-xs flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Save Course Syllabus</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Controls Bar: Options of Admission Batch & Course (UG NEP, UG AEDP, PG) */}
          <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Option of Admission Batch */}
              <div className="md:col-span-4">
                <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>Admission Batch:</span>
                </label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-600 shadow-2xs"
                >
                  {admissionBatches.map((batch) => (
                    <option key={batch} value={batch}>
                      {batch === 'All' ? 'All Admission Batches' : `Admission Batch ${batch}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Option of Course: (UG NEP, UG AEDP, PG) */}
              <div className="md:col-span-5">
                <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px] flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-700" />
                  <span>Course (ug nep, ug aedp, pg):</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {courses.map((crs) => (
                    <button
                      key={crs}
                      onClick={() => setSelectedCourse(crs)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        selectedCourse === crs
                          ? 'bg-blue-900 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                      }`}
                    >
                      <span>{crs === 'All' ? 'All Courses' : crs}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Format Filter: All, PDF Only, URL Only */}
              <div className="md:col-span-3">
                <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span>Format:</span>
                </label>
                <div className="flex rounded-xl bg-white border border-slate-300 p-0.5 shadow-2xs">
                  <button
                    onClick={() => setFormatFilter('All')}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                      formatFilter === 'All' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFormatFilter('pdf')}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                      formatFilter === 'pdf' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => setFormatFilter('url')}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                      formatFilter === 'url' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    URL
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Category Tabs: (major, minor, mdc, vac, sec, aec, none) - NO CATEGORY TAB IF COURSE PG IS CHOSEN */}
          {selectedCourse !== 'PG' ? (
            <div className="px-5 sm:px-6 pt-4 pb-0 bg-white border-b border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-700" />
                  <span>Category Tabs (major, minor, mdc, vac, sec, aec, none):</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Click tab to switch category
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pb-3 overflow-x-auto">
                {categoryTabs.map((tab) => {
                  const count = categoryCounts[tab.id] || 0;
                  const isActive = selectedCategory === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedCategory(tab.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 border ${
                        isActive
                          ? tab.id === 'None'
                            ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                            : 'bg-amber-400 text-slate-950 border-amber-400 shadow-xs'
                          : tab.id === 'None'
                          ? 'bg-slate-100/80 text-slate-600 border-slate-300 hover:bg-slate-200 hover:text-slate-800'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive
                            ? tab.id === 'None'
                              ? 'bg-slate-900 text-slate-200'
                              : 'bg-slate-950 text-amber-300'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {tab.id === 'None' && !isAdmin ? 0 : count}
                      </span>
                      {tab.id === 'None' && (
                        <span className="text-[10px] opacity-75 font-normal">
                          {!isAdmin ? '(Public: None)' : '(Admin)'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="px-5 sm:px-6 py-2.5 bg-blue-50/50 border-b border-slate-200 flex items-center justify-between text-xs text-blue-900">
              <span className="flex items-center gap-2 font-semibold">
                <GraduationCap className="w-4 h-4 text-blue-700" />
                <span>Postgraduate (PG) Curricula — Showing all PG Syllabi (No undergraduate category tabs)</span>
              </span>
              <span className="text-[11px] bg-blue-100/80 text-blue-800 px-2 py-0.5 rounded font-mono font-bold border border-blue-200">
                Course: PG
              </span>
            </div>
          )}

          {/* Syllabuses Listing: Semester, Paper Code, and Subject Title REMOVED */}
          <div className="p-5 sm:p-6 bg-slate-50/40">
            {/* If Category is 'None' and user is NOT admin and selectedCourse is NOT PG -> Display NOTHING to public */}
            {selectedCourse !== 'PG' && selectedCategory === 'None' && !isAdmin ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center shadow-2xs">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <EyeOff className="w-6 h-6" />
                </div>
                <h3 className="font-serif-academic text-base font-bold text-slate-800">
                  Nothing to Display to the Public
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                  The <strong>None</strong> category tab is set to display nothing to the public. No syllabus documents are published under this view.
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Public View Mode: 0 items displayed</span>
                </div>
              </div>
            ) : filteredSyllabuses.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-600">
                  {selectedCategory === 'None' && selectedCourse !== 'PG' ? (
                    <EyeOff className="w-6 h-6" />
                  ) : (
                    <BookOpen className="w-6 h-6" />
                  )}
                </div>
                <h3 className="font-serif-academic text-base font-bold text-slate-900">
                  {selectedCourse === 'PG'
                    ? 'No PG Syllabus Found'
                    : selectedCategory === 'None'
                    ? 'No Syllabi in None Category'
                    : 'No Syllabus Found'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                  {selectedCourse === 'PG' ? (
                    <>
                      No PG syllabus found for Admission Batch <strong>{selectedBatch}</strong>.
                    </>
                  ) : selectedCategory === 'None' ? (
                    <>
                      Currently no syllabi are categorized under <strong>None</strong> for Admission Batch <strong>{selectedBatch}</strong>.
                    </>
                  ) : (
                    <>
                      No syllabus found for <strong>{selectedCourse}</strong> •{' '}
                      <strong>{selectedCategory === 'All' ? 'All Tabs' : `${selectedCategory} Tab`}</strong> • Admission Batch <strong>{selectedBatch}</strong>.
                    </>
                  )}
                </p>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setFormCourse(selectedCourse === 'All' ? 'UG NEP' : (selectedCourse as any));
                      setFormCategory(
                        selectedCourse === 'PG'
                          ? 'Major'
                          : selectedCategory === 'All'
                          ? 'Major'
                          : (selectedCategory as any)
                      );
                      setFormBatch(selectedBatch === 'All' ? '2025–26' : selectedBatch);
                      setShowUploadBox(true);
                    }}
                    className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{selectedCourse === 'PG' ? 'Add PG Syllabus' : 'Add Syllabus for This Category'}</span>
                  </button>
                )}
              </div>
            ) : (
              <div>
                {/* Admin notice if viewing category 'None' */}
                {selectedCourse !== 'PG' && selectedCategory === 'None' && isAdmin && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between font-medium">
                    <span className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>
                        <strong>Admin View:</strong> These syllabi are in category <strong>None</strong> and display <strong>nothing to the public</strong>.
                      </span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold">
                      Hidden from Public
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSyllabuses.map((item) => {
                    const itemCat = getCategory(item);
                    const itemFileType = getFileType(item);
                    const itemBatch = getBatch(item);
                    const isPgItem = item.course === 'PG' || item.course.includes('PG');
                    const isNoneCategory = !isPgItem && itemCat === 'None';

                    return (
                      <div
                        key={item.id}
                        className={`bg-white rounded-xl border transition p-5 flex flex-col justify-between group ${
                          isNoneCategory
                            ? 'border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/50'
                            : 'border-slate-200 hover:border-blue-400 hover:shadow-md'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Badges: Category Tab (only if not PG), Course, Admission Batch */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {!isPgItem && (
                              isNoneCategory ? (
                                <span className="px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-800 border border-slate-300 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                                  <EyeOff className="w-3 h-3 text-slate-600" />
                                  <span>None Tab (Hidden from Public)</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-md bg-amber-400/20 text-amber-900 border border-amber-400/40 text-[11px] font-bold uppercase tracking-wider">
                                  {itemCat} Tab
                                </span>
                              )
                            )}
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-semibold">
                              {item.course}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-mono">
                              Admission Batch: {itemBatch}
                            </span>
                          </div>

                          {/* Title: Displayed cleanly (No semester, no paper code) */}
                          <div>
                            <h3 className="font-serif-academic text-base sm:text-lg font-bold text-[#0c2340] group-hover:text-blue-900 transition leading-snug flex items-center gap-2">
                              <span>
                                {isPgItem
                                  ? (item.title || 'PG Mathematics Syllabus')
                                  : isNoneCategory
                                  ? `${item.course} Syllabus (None)`
                                  : `${item.course} ${itemCat} Syllabus`}
                              </span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Official syllabus document for admission batch {itemBatch}
                            </p>
                          </div>

                          {/* Format Indicator (URL Link vs PDF Document) */}
                          <div className="flex items-center gap-2 text-xs text-slate-500 pt-1 border-t border-slate-100">
                            {itemFileType === 'url' ? (
                              <span className="inline-flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md text-[11px] font-semibold">
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>URL Link</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md text-[11px] font-semibold">
                                <FileText className="w-3.5 h-3.5" />
                                <span>PDF Format {item.fileSize ? `(${item.fileSize})` : ''}</span>
                              </span>
                            )}
                            {item.fileName && item.fileName !== 'Web Link' && (
                              <span className="text-[11px] text-slate-400 truncate max-w-[160px]" title={item.fileName}>
                                {item.fileName}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            {itemFileType === 'url' ? (
                              <a
                                href={item.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                                <span>Open URL Link</span>
                              </a>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                {item.fileUrl && (
                                  <button
                                    onClick={() => {
                                      const modalTitle = isPgItem
                                        ? `PG Syllabus (Batch ${itemBatch})`
                                        : `${item.course} ${itemCat} Syllabus (Batch ${itemBatch})`;
                                      if (onViewPDF) {
                                        onViewPDF(modalTitle, item.fileUrl!, 'Syllabus', item.fileName);
                                      } else {
                                        window.open(item.fileUrl, '_blank');
                                      }
                                    }}
                                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                                    <span>View PDF</span>
                                  </button>
                                )}

                                {item.fileUrl && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const modalTitle = isPgItem
                                        ? `PG Syllabus (Batch ${itemBatch})`
                                        : `${item.course} ${itemCat} Syllabus (Batch ${itemBatch})`;
                                      const downloadName = getSafeDownloadFilename(item.fileName || modalTitle, item.fileUrl!, item.fileName);
                                      downloadFile(item.fileUrl!, downloadName);
                                    }}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition cursor-pointer"
                                    title="Download Syllabus in original format"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {isAdmin && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => onEditSyllabus(item)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                                title="Edit Syllabus"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  onDeleteSyllabus(
                                    item.id,
                                    isPgItem
                                      ? (item.title || 'PG Syllabus')
                                      : isNoneCategory
                                      ? `${item.course} Syllabus (None)`
                                      : `${item.course} ${itemCat} Syllabus`
                                  )
                                }
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                                title="Delete Syllabus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

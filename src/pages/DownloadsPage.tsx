import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Eye,
  Search,
  BookOpen,
  Calendar,
  FileQuestion,
  GraduationCap,
  Sparkles,
  ClipboardList,
  CheckCircle2,
  ExternalLink,
  Edit2,
  Trash2,
  Plus,
  ShieldCheck,
  Upload,
  AlertTriangle,
  X,
  File,
} from 'lucide-react';
import { DownloadItem, DownloadCategory, DownloadCourseBadge, QuestionPaper, Syllabus } from '../types';
import { initialDownloads } from '../data/initialData';
import { useAuth } from '../context/AuthContext';
import { saveDownloadItem, deleteDownloadItem } from '../services/db';

interface DownloadsPageProps {
  downloads?: DownloadItem[];
  onSaveDownload?: (item: DownloadItem) => Promise<void> | void;
  onDeleteDownload?: (id: string, title?: string) => Promise<void> | void;
  syllabuses?: Syllabus[];
  questionPapers?: QuestionPaper[];
  onViewPDF?: (title: string, url: string, category: string) => void;
  onNavigateToTab?: (tabId: string) => void;
}

export const DownloadsPage: React.FC<DownloadsPageProps> = ({
  downloads: propDownloads,
  onSaveDownload,
  onDeleteDownload,
  syllabuses = [],
  questionPapers = [],
  onViewPDF,
  onNavigateToTab,
}) => {
  const { isAdmin } = useAuth();

  // Local fallback state if prop is not supplied
  const [localDownloads, setLocalDownloads] = useState<DownloadItem[]>(() => {
    try {
      const saved = localStorage.getItem('dept_downloads');
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialDownloads;
  });

  const activeDownloadsList = propDownloads && propDownloads.length > 0 ? propDownloads : localDownloads;

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCourse, setSelectedCourse] = useState<string>('All');
  const [alertNotice, setAlertNotice] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Modal states for Admin Edit / Add / Delete
  const [editingItem, setEditingItem] = useState<DownloadItem | null>(null);
  const [isNewItem, setIsNewItem] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<DownloadItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState<DownloadCategory>('Syllabus');
  const [formCourseBadge, setFormCourseBadge] = useState<DownloadCourseBadge>('UG NEP');
  const [formSession, setFormSession] = useState('2026–27');
  const [formFileSize, setFormFileSize] = useState('1.5 MB');
  const [formDescription, setFormDescription] = useState('');
  const [formFileUrl, setFormFileUrl] = useState('');
  const [formIsImportant, setFormIsImportant] = useState(false);
  const [formUploadFileName, setFormUploadFileName] = useState('');

  // Combined downloadable list
  const allItems = useMemo(() => {
    const list = [...activeDownloadsList];

    // Add dynamic syllabuses from database if not already present
    syllabuses.forEach((s) => {
      const sylTitle = s.title || s.paperCode || `${s.course} Syllabus`;
      if (!list.some((item) => item.title.toLowerCase() === sylTitle.toLowerCase() || item.id === `syl-${s.id}`)) {
        list.push({
          id: `syl-${s.id}`,
          title: sylTitle,
          code: s.paperCode || `SYL-${(s.course || 'UG').replace(/\s+/g, '')}`,
          category: 'Syllabus',
          courseBadge: s.course?.includes('PG') ? 'PG' : s.course?.includes('NEP') ? 'UG NEP' : 'UG CBCS',
          session: s.academicYear || s.session || '2026–27',
          fileSize: s.fileSize || '1.5 MB',
          description: s.description || `${s.course} semester curriculum document approved by Sambalpur University.`,
          fileUrl: s.fileUrl || '/syllabus/default.pdf',
        });
      }
    });

    // Add sample question papers if not present
    questionPapers.slice(0, 6).forEach((p) => {
      if (!list.some((item) => item.id === `pyq-${p.id}`)) {
        list.push({
          id: `pyq-${p.id}`,
          title: `${p.title} (${p.paperCode})`,
          code: p.paperCode,
          category: 'Routine',
          courseBadge: p.course?.includes('PG') ? 'PG' : 'UG NEP',
          session: p.academicYear,
          fileSize: p.fileSize || '380 KB',
          description: `Official Sambalpur University semester examination paper (${p.semester || 'Semester VI'}).`,
          fileUrl: p.fileUrl || '/pyq/default.pdf',
        });
      }
    });

    return list;
  }, [activeDownloadsList, syllabuses, questionPapers]);

  // Filtered downloads
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const matchCat =
        selectedCategory === 'All' ||
        (selectedCategory === 'Syllabi' && item.category === 'Syllabus') ||
        (selectedCategory === 'Routines' && (item.category === 'Routine' || item.category === 'Calendar')) ||
        (selectedCategory === 'Forms' && item.category === 'Form') ||
        (selectedCategory === 'Regulations' && (item.category === 'Regulation' || item.category === 'Calendar'));

      const matchCourse =
        selectedCourse === 'All' ||
        item.courseBadge === 'All' ||
        item.courseBadge === selectedCourse;

      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        item.title.toLowerCase().includes(term) ||
        (item.code && item.code.toLowerCase().includes(term)) ||
        item.description.toLowerCase().includes(term);

      return matchCat && matchCourse && matchSearch;
    });
  }, [allItems, selectedCategory, selectedCourse, searchTerm]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setAlertNotice({ message, type });
    setTimeout(() => setAlertNotice(null), 4000);
  };

  const handleDownloadFile = (item: DownloadItem) => {
    showToast(`Downloading: ${item.title}`, 'info');

    if (onViewPDF && (item.fileUrl.endsWith('.pdf') || item.fileUrl.startsWith('data:application/pdf'))) {
      onViewPDF(item.title, item.fileUrl, item.category);
    } else {
      const link = document.createElement('a');
      link.href = item.fileUrl || '#';
      link.download = `${item.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Open Edit Modal for an existing item
  const handleOpenEdit = (item: DownloadItem) => {
    setEditingItem(item);
    setIsNewItem(false);
    setFormTitle(item.title);
    setFormCode(item.code || '');
    setFormCategory(item.category);
    setFormCourseBadge(item.courseBadge);
    setFormSession(item.session || '2026–27');
    setFormFileSize(item.fileSize || '1.2 MB');
    setFormDescription(item.description || '');
    setFormFileUrl(item.fileUrl || '');
    setFormIsImportant(Boolean(item.isImportant));
    setFormUploadFileName('');
    setIsEditModalOpen(true);
  };

  // Open Add Modal for a new item
  const handleOpenAddNew = () => {
    setEditingItem(null);
    setIsNewItem(true);
    setFormTitle('');
    setFormCode('');
    setFormCategory('Syllabus');
    setFormCourseBadge('UG NEP');
    setFormSession('2026–27');
    setFormFileSize('1.2 MB');
    setFormDescription('');
    setFormFileUrl('/documents/Department_Resource.pdf');
    setFormIsImportant(false);
    setFormUploadFileName('');
    setIsEditModalOpen(true);
  };

  // File Upload reader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormUploadFileName(file.name);
    // Auto compute formatted file size
    const sizeKB = Math.round(file.size / 1024);
    const sizeFormatted = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
    setFormFileSize(sizeFormatted);

    if (!formTitle.trim()) {
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setFormTitle(baseName);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setFormFileUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save changes (both edit & create)
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('Document Title is required', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const itemId = editingItem ? editingItem.id : `dl-${Date.now()}`;
      const updatedItem: DownloadItem = {
        id: itemId,
        title: formTitle.trim(),
        code: formCode.trim() || undefined,
        category: formCategory,
        courseBadge: formCourseBadge,
        session: formSession.trim() || '2026–27',
        fileSize: formFileSize.trim() || '1.0 MB',
        description: formDescription.trim(),
        fileUrl: formFileUrl.trim() || '/documents/Department_Resource.pdf',
        isImportant: formIsImportant,
        updatedAt: new Date().toISOString(),
        createdAt: editingItem?.createdAt || new Date().toISOString(),
      };

      if (onSaveDownload) {
        await onSaveDownload(updatedItem);
      } else {
        await saveDownloadItem(updatedItem);
        setLocalDownloads((prev) => {
          const idx = prev.findIndex((d) => d.id === itemId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updatedItem;
            return next;
          }
          return [updatedItem, ...prev];
        });
      }

      showToast(isNewItem ? 'File added to Downloads repository' : 'File updated successfully');
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error('Error saving download item:', err);
      showToast('Failed to save download item: ' + (err?.message || 'Error'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete item handler
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      if (onDeleteDownload) {
        await onDeleteDownload(itemToDelete.id, itemToDelete.title);
      } else {
        await deleteDownloadItem(itemToDelete.id);
        setLocalDownloads((prev) => prev.filter((d) => d.id !== itemToDelete.id));
      }
      showToast(`Deleted: "${itemToDelete.title}"`);
      setItemToDelete(null);
    } catch (err: any) {
      console.error('Error deleting download item:', err);
      showToast('Failed to delete download item', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Admin Bar (Only visible to authenticated Administrator) */}
        {isAdmin && (
          <div className="bg-gradient-to-r from-[#0c2340] to-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-amber-500/40 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-amber-300">
                    Administrator Controls Active (Menu &rarr; Downloads)
                  </h2>
                  <span className="text-[10px] font-mono uppercase bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded">
                    Admin
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  You have full privileges to edit descriptions, replace files/links, upload new resources, or delete documents.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleOpenAddNew}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Upload / Add File</span>
              </button>
            </div>
          </div>
        )}

        {/* Header Banner */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold uppercase tracking-wider mb-2">
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                <span>Public Document Repository</span>
              </div>
              <h1 className="font-serif-academic text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0c2340]">
                Downloads & Academic Resources
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1.5 leading-relaxed">
                Official Sambalpur University syllabi, departmental class routines, previous year question paper archives, academic calendar, and downloadable student proformas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab('pyq')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <FileQuestion className="w-4 h-4 text-amber-400" />
                  <span>Question Papers</span>
                </button>
              )}
              {onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab('syllabus')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>View All Syllabi</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Feedback alert */}
        {alertNotice && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 shadow-xs animate-in fade-in ${
              alertNotice.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : alertNotice.type === 'info'
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-medium">{alertNotice.message}</span>
            </div>
            <button
              onClick={() => setAlertNotice(null)}
              className="text-slate-400 hover:text-slate-600 p-1 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search syllabi, forms, routines, paper codes..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Course Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                Course:
              </span>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:border-amber-500"
              >
                <option value="All">All Courses</option>
                <option value="UG NEP">UG NEP (B.Sc.)</option>
                <option value="UG CBCS">UG CBCS</option>
                <option value="PG">PG (M.Sc.)</option>
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-slate-100 pt-3">
            {[
              { id: 'All', label: 'All Downloads', count: allItems.length },
              {
                id: 'Syllabi',
                label: 'Curriculum & Syllabi',
                count: allItems.filter((i) => i.category === 'Syllabus').length,
              },
              {
                id: 'Routines',
                label: 'Timetables & Calendars',
                count: allItems.filter((i) => i.category === 'Routine' || i.category === 'Calendar').length,
              },
              {
                id: 'Forms',
                label: 'Department Forms & Proformas',
                count: allItems.filter((i) => i.category === 'Form').length,
              },
              {
                id: 'Regulations',
                label: 'Academic Regulations',
                count: allItems.filter((i) => i.category === 'Regulation' || i.category === 'Calendar').length,
              },
            ].map((tab) => {
              const active = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? 'bg-[#0c2340] text-amber-300 shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      active ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Count Banner */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Showing <strong>{filteredItems.length}</strong> official resources available for download
          </span>
          <span className="text-[11px] text-slate-400">
            Panchayat College, Baragada • Affiliated to Sambalpur University
          </span>
        </div>

        {/* Downloads Grid */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No resources found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No download documents matched your current search and filter criteria. Try searching for "NEP", "Routine", or "Form".
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setSelectedCourse('All');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-5 border transition-all hover:shadow-md flex flex-col justify-between relative group ${
                  item.isImportant
                    ? 'border-amber-300 ring-1 ring-amber-200/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                          item.courseBadge === 'UG NEP'
                            ? 'bg-blue-100 text-blue-800'
                            : item.courseBadge === 'PG'
                            ? 'bg-purple-100 text-purple-800'
                            : item.courseBadge === 'UG CBCS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.courseBadge}
                      </span>

                      {item.isImportant && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Important
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {item.fileSize}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-serif-academic font-bold text-slate-900 text-sm leading-snug group-hover:text-amber-700 transition">
                      {item.title}
                    </h3>
                    {item.code && (
                      <span className="text-[10px] font-mono font-semibold text-amber-700 block mt-0.5">
                        {item.code} &bull; Session {item.session}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 space-y-2.5">
                  {/* Public Action row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-slate-400">
                      {item.category} Document
                    </span>

                    <div className="flex items-center gap-1.5">
                      {onViewPDF && (
                        <button
                          type="button"
                          onClick={() => onViewPDF(item.title, item.fileUrl, item.category)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="View Document Preview"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>View</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDownloadFile(item)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>

                  {/* ADMIN ACTION CONTROLS: EDIT & DELETE */}
                  {isAdmin && (
                    <div className="pt-2 border-t border-dashed border-amber-200 bg-amber-50/60 -mx-5 -mb-5 p-2.5 px-4 rounded-b-2xl flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-amber-700" />
                        Admin Controls
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-slate-800 hover:text-amber-900 border border-amber-300 text-xs font-semibold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                          title="Edit file details, code, description, or replacement URL"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setItemToDelete(item)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-semibold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                          title="Permanently delete this file from Downloads"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Institutional Academic Guidance Footer Note */}
        <div className="bg-[#0b1a2f] text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif-academic text-base font-bold">
              Sambalpur University Academic Compliance
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
            All course curricula and evaluation regulations conform to the National Education Policy (NEP 2020) and Sambalpur University CBCS guidelines. For physical copies or certified attestations, contact the Department Office in Room 32, Panchayat College, Baragada.
          </p>
        </div>
      </div>

      {/* ================= EDIT / ADD FILE MODAL (FOR ADMIN) ================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-8 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900">
                  {isNewItem ? <Plus className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-serif-academic text-lg font-bold text-[#0c2340]">
                    {isNewItem ? 'Upload / Add Download File' : 'Edit Download Resource'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isNewItem
                      ? 'Add a new syllabus, routine sheet, application form, or official calendar to menu &rarr; downloads'
                      : 'Update document metadata, category, course level, or replacement document link'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* Document Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Document Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Sambalpur University B.Sc. (NEP) Mathematics Honors Syllabus"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              {/* Grid 1: Code and Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Document / Paper Code
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. NEP-MATH-UG-2026 or FORM-SEM-2026"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as DownloadCategory)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-amber-500"
                  >
                    <option value="Syllabus">Curriculum & Syllabus</option>
                    <option value="Routine">Time Table / Routine</option>
                    <option value="Form">Department Proforma / Form</option>
                    <option value="Calendar">Academic Calendar</option>
                    <option value="Regulation">Academic Regulation</option>
                  </select>
                </div>
              </div>

              {/* Grid 2: Course Badge, Session, File Size */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Course
                  </label>
                  <select
                    value={formCourseBadge}
                    onChange={(e) => setFormCourseBadge(e.target.value as DownloadCourseBadge)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-amber-500"
                  >
                    <option value="UG NEP">UG NEP (B.Sc.)</option>
                    <option value="UG CBCS">UG CBCS</option>
                    <option value="PG">PG (M.Sc.)</option>
                    <option value="All">All Courses</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Academic Session
                  </label>
                  <input
                    type="text"
                    value={formSession}
                    onChange={(e) => setFormSession(e.target.value)}
                    placeholder="2026–27"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    File Size Label
                  </label>
                  <input
                    type="text"
                    value={formFileSize}
                    onChange={(e) => setFormFileSize(e.target.value)}
                    placeholder="e.g. 1.8 MB or 420 KB"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description & Instructions
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief synopsis of what this file contains for students, examinees, or research scholars."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-amber-500 resize-none"
                />
              </div>

              {/* Document File / URL Attachment */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Document File Attachment
                  </label>
                  <span className="text-[11px] text-slate-500">PDF, DOC, DOCX, XLS or Link</span>
                </div>

                {/* Option A: Direct File Upload */}
                <div className="flex items-center gap-3">
                  <label className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-amber-600" />
                    <span>Upload Local File</span>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                      className="hidden"
                    />
                  </label>
                  {formUploadFileName && (
                    <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Uploaded: {formUploadFileName} ({formFileSize})
                    </span>
                  )}
                </div>

                {/* Option B: Direct File URL */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                    Or specify File URL / Path:
                  </label>
                  <input
                    type="text"
                    value={formFileUrl}
                    onChange={(e) => setFormFileUrl(e.target.value)}
                    placeholder="/documents/filename.pdf or https://..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Important Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formIsImportant"
                  checked={formIsImportant}
                  onChange={(e) => setFormIsImportant(e.target.checked)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="formIsImportant" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Feature with Urgent / Important Highlight Badge
                </label>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : isNewItem ? 'Add Document' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL (FOR ADMIN) ================= */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-2xl shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-serif-academic text-base font-bold text-slate-900">
                  Delete Download File?
                </h3>
                <p className="text-xs text-slate-500">This action will remove the document from the public repository.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800">{itemToDelete.title}</div>
              <div className="text-slate-500 text-[11px]">
                {itemToDelete.category} &bull; {itemToDelete.courseBadge} &bull; {itemToDelete.fileSize}
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete this resource? Students and visitors will no longer be able to download this document from menu &rarr; downloads.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

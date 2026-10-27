import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { FacultyPage } from './pages/FacultyPage';
import { StudentsPage } from './pages/StudentsPage';
import { SyllabusPage } from './pages/SyllabusPage';
import { TimeTablePage } from './pages/TimeTablePage';
import { GalleryPage } from './pages/GalleryPage';
import { PYQPage } from './pages/PYQPage';
import { LibraryPage } from './pages/LibraryPage';
import { NoticesPage } from './pages/NoticesPage';
import { DownloadsPage } from './pages/DownloadsPage';
import { CommitteesPage } from './pages/CommitteesPage';
import { ImportantContactsPage } from './pages/ImportantContactsPage';
import { ContactPage } from './pages/ContactPage';
import { StudentPortalPage } from './pages/StudentPortalPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { SearchModal } from './components/SearchModal';
import { FAQModal } from './components/FAQModal';
import { PDFModal } from './components/PDFModal';
import { StudentPortalModal } from './components/StudentPortalModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import {
  ConfirmDeleteModal,
  FacultyModal,
  StudentModal,
} from './components/AdminModals';
import {
  FacilityModal,
  BookModal,
  QuestionPaperModal,
  NoticeModal,
  CommitteeModal,
  ContactModal,
  TimeTableSlotModal,
  SyllabusModal,
} from './components/AdminEntityModals';
import {
  Faculty,
  Student,
  StudentCredential,
  Facility,
  Book,
  QuestionPaper,
  Notice,
  Committee,
  ImportantContact,
  ContactMessage,
  DepartmentSettings,
  TimeTableSlot,
  TimeTablePeriod,
  TimeTableClassRow,
  Syllabus,
  GalleryPhoto,
  DayOfWeek,
  DownloadItem,
} from './types';
import {
  initialFaculty,
  initialStudents,
  initialCredentials,
  initialFacilities,
  initialBooks,
  initialQuestionPapers,
  initialNotices,
  initialCommittees,
  initialContacts,
  initialSettings,
  initialPeriods,
  initialClassRows,
  initialTimeTable,
  initialSyllabus,
  initialGallery,
  initialDownloads,
} from './data/initialData';
import {
  subscribeToFaculty,
  ensureDatabaseSeeded,
  saveFacultyMember,
  deleteFacultyMember,
  subscribeToStudents,
  saveStudent,
  deleteStudent,
  subscribeToStudentCredentials,
  saveStudentCredential,
  deleteStudentCredential,
  subscribeToFacilities,
  saveFacility,
  deleteFacility,
  subscribeToBooks,
  saveBook,
  deleteBook,
  subscribeToPYQ,
  saveQuestionPaper,
  deleteQuestionPaper,
  subscribeToNotices,
  saveNotice,
  deleteNotice,
  subscribeToCommittees,
  saveCommittee,
  deleteCommittee,
  subscribeToContacts,
  saveContact,
  deleteContact,
  subscribeToInquiries,
  subscribeToSettings,
  updateDepartmentSettings,
  seedInitialDatabase,
  subscribeToTimeTable,
  saveTimeTableSlot,
  deleteTimeTableSlot,
  clearAllTimeTableSlots,
  subscribeToTimeTableConfig,
  saveTimeTableConfig,
  subscribeToSyllabuses,
  saveSyllabus,
  deleteSyllabus,
  subscribeToGallery,
  saveGalleryPhoto,
  deleteGalleryPhoto,
  subscribeToDownloads,
  saveDownloadItem,
  deleteDownloadItem,
} from './services/db';
import { testConnection, subscribeToQuotaExceeded } from './firebase/config';

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [quotaExceededInfo, setQuotaExceededInfo] = useState<{ isExceeded: boolean; upgradeUrl: string } | null>(null);

  useEffect(() => {
    const unsub = subscribeToQuotaExceeded((isExceeded, upgradeUrl) => {
      setQuotaExceededInfo({ isExceeded, upgradeUrl });
    });
    return () => unsub();
  }, []);

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const {
    isAdmin,
    isAdminLoginModalOpen,
    openAdminLoginModal,
    closeAdminLoginModal,
    adminModalMode,
  } = useAuth();

  // State for all collections with initial data fallbacks
  const [faculty, setFaculty] = useState<Faculty[]>(initialFaculty);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [credentials, setCredentials] = useState<StudentCredential[]>(initialCredentials);
  const [facilities, setFacilities] = useState<Facility[]>(initialFacilities);
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [pyq, setPYQ] = useState<QuestionPaper[]>(initialQuestionPapers);
  const [notices, setNotices] = useState<Notice[]>(() => {
    try {
      const saved = localStorage.getItem('dept_notices');
      if (saved) {
        const parsed: Notice[] = JSON.parse(saved);
        const dummyIds = new Set(['not-1', 'not-2', 'not-3', 'not-4', 'not-5', 'not-6']);
        return parsed.filter((n) => !dummyIds.has(n.id));
      }
      return [];
    } catch {
      return [];
    }
  });
  const [committees, setCommittees] = useState<Committee[]>(initialCommittees);
  const [contacts, setContacts] = useState<ImportantContact[]>(initialContacts);
  const [timeTable, setTimeTable] = useState<TimeTableSlot[]>(initialTimeTable);
  const [periods, setPeriods] = useState<TimeTablePeriod[]>(() => {
    try {
      const saved = localStorage.getItem('dept_periods');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 11 && parsed[0]?.startTime === '09:15 AM') {
          return parsed;
        }
      }
      localStorage.setItem('dept_periods', JSON.stringify(initialPeriods));
      return initialPeriods;
    } catch {
      return initialPeriods;
    }
  });
  const [classRows, setClassRows] = useState<TimeTableClassRow[]>(() => {
    try {
      const saved = localStorage.getItem('dept_class_rows');
      return saved ? JSON.parse(saved) : initialClassRows;
    } catch {
      return initialClassRows;
    }
  });

  // Timetable History for Undo / Redo
  const [ttHistory, setTtHistory] = useState<
    Array<{
      slots: TimeTableSlot[];
      periods: TimeTablePeriod[];
      classRows: TimeTableClassRow[];
    }>
  >([]);
  const [ttHistoryIndex, setTtHistoryIndex] = useState<number>(-1);
  const isHistoryRestoringRef = useRef(false);

  // Initialize first snapshot when timetable loads
  useEffect(() => {
    if (ttHistory.length === 0 && (periods.length > 0 || classRows.length > 0)) {
      setTtHistory([{ slots: timeTable, periods, classRows }]);
      setTtHistoryIndex(0);
    }
  }, [timeTable, periods, classRows, ttHistory.length]);
  const [syllabuses, setSyllabuses] = useState<Syllabus[]>(initialSyllabus);
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>(initialGallery);
  const [downloads, setDownloads] = useState<DownloadItem[]>(() => {
    try {
      const saved = localStorage.getItem('dept_downloads');
      return saved ? JSON.parse(saved) : initialDownloads;
    } catch {
      return initialDownloads;
    }
  });
  const [inquiries, setInquiries] = useState<ContactMessage[]>([]);
  const [settings, setSettings] = useState<DepartmentSettings>(initialSettings);

  // Modals state
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [studentPortalModal, setStudentPortalModal] = useState<{
    isOpen: boolean;
    mode: 'register' | 'login';
  }>({ isOpen: false, mode: 'register' });
  const [pdfModalData, setPdfModalData] = useState<{
    isOpen: boolean;
    title: string;
    category?: string;
    fileUrl?: string;
    fileName?: string;
    metadata?: any;
  }>({
    isOpen: false,
    title: '',
  });

  // Admin Modals state
  const [logoModalOpen, setLogoModalOpen] = useState(false);
  const [logoInputUrl, setLogoInputUrl] = useState('');
  const [logoSuccessMsg, setLogoSuccessMsg] = useState('');

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    title: string;
    itemName: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    itemName: '',
    onConfirm: () => {},
  });

  const [facultyModal, setFacultyModal] = useState<{
    isOpen: boolean;
    item: Faculty | null;
  }>({ isOpen: false, item: null });

  const [studentModal, setStudentModal] = useState<{
    isOpen: boolean;
    item: Student | null;
  }>({ isOpen: false, item: null });

  const [facilityModal, setFacilityModal] = useState<{
    isOpen: boolean;
    item: Facility | null;
  }>({ isOpen: false, item: null });

  const [bookModal, setBookModal] = useState<{
    isOpen: boolean;
    item: Book | null;
  }>({ isOpen: false, item: null });

  const [pyqModal, setPYQModal] = useState<{
    isOpen: boolean;
    item: QuestionPaper | null;
  }>({ isOpen: false, item: null });

  const [noticeModal, setNoticeModal] = useState<{
    isOpen: boolean;
    item: Notice | null;
  }>({ isOpen: false, item: null });

  const [committeeModal, setCommitteeModal] = useState<{
    isOpen: boolean;
    item: Committee | null;
  }>({ isOpen: false, item: null });

  const [contactModal, setContactModal] = useState<{
    isOpen: boolean;
    item: ImportantContact | null;
  }>({ isOpen: false, item: null });

  const [timeTableModal, setTimeTableModal] = useState<{
    isOpen: boolean;
    item: TimeTableSlot | null;
    defaultCourse?: string;
    defaultYear?: string;
    defaultSemester?: string;
    defaultDay?: string;
    defaultPeriod?: number;
  }>({ isOpen: false, item: null });

  const [syllabusModal, setSyllabusModal] = useState<{
    isOpen: boolean;
    item: Syllabus | null;
    defaultCourse?: string;
  }>({ isOpen: false, item: null });

  // Boot connection check & Firestore subscribers
  useEffect(() => {
    testConnection();
    ensureDatabaseSeeded();

    // Subscribe to Firestore collections
    const unsubFaculty = subscribeToFaculty(
      (data) => setFaculty(data),
      () => setFaculty(initialFaculty)
    );
    const unsubStudents = subscribeToStudents(
      (data) => setStudents(data),
      () => setStudents(initialStudents)
    );
    const unsubCredentials = subscribeToStudentCredentials(
      (data) => setCredentials(data),
      () => setCredentials(initialCredentials)
    );
    const unsubFacilities = subscribeToFacilities(
      (data) => setFacilities(data),
      () => setFacilities(initialFacilities)
    );
    const unsubBooks = subscribeToBooks(
      (data) => setBooks(data),
      () => setBooks(initialBooks)
    );
    const unsubPYQ = subscribeToPYQ(
      (data) => setPYQ(data),
      () => setPYQ(initialQuestionPapers)
    );
    const unsubNotices = subscribeToNotices(
      (data) => {
        setNotices(data);
        try {
          localStorage.setItem('dept_notices', JSON.stringify(data));
        } catch {}
      },
      () => {
        try {
          const saved = localStorage.getItem('dept_notices');
          if (saved) {
            const parsed: Notice[] = JSON.parse(saved);
            const dummyIds = new Set(['not-1', 'not-2', 'not-3', 'not-4', 'not-5', 'not-6']);
            setNotices(parsed.filter((n) => !dummyIds.has(n.id)));
          } else {
            setNotices([]);
          }
        } catch {
          setNotices([]);
        }
      }
    );
    const unsubCommittees = subscribeToCommittees(
      (data) => setCommittees(data),
      () => setCommittees(initialCommittees)
    );
    const unsubContacts = subscribeToContacts(
      (data) => setContacts(data),
      () => setContacts(initialContacts)
    );
    const unsubTimeTable = subscribeToTimeTable(
      (data) => setTimeTable(data),
      () => setTimeTable(initialTimeTable)
    );
    const unsubSyllabuses = subscribeToSyllabuses(
      (data) => setSyllabuses(data),
      () => setSyllabuses(initialSyllabus)
    );
    const unsubGallery = subscribeToGallery(
      (data) => setGalleryPhotos(data),
      () => setGalleryPhotos(initialGallery)
    );
    const unsubDownloads = subscribeToDownloads(
      (data) => setDownloads(data),
      () => setDownloads(initialDownloads)
    );
    const unsubInquiries = subscribeToInquiries(
      (data) => setInquiries(data),
      () => {}
    );
    const unsubSettings = subscribeToSettings(
      (data) => setSettings(data),
      () => setSettings(initialSettings)
    );
    const unsubTimeTableConfig = subscribeToTimeTableConfig(
      (cfg) => {
        if (cfg.periods && cfg.periods.length > 0) {
          setPeriods(cfg.periods);
        }
        if (cfg.classRows && cfg.classRows.length > 0) {
          setClassRows(cfg.classRows);
        }
      },
      () => {}
    );

    return () => {
      unsubFaculty();
      unsubStudents();
      unsubCredentials();
      unsubFacilities();
      unsubBooks();
      unsubPYQ();
      unsubNotices();
      unsubCommittees();
      unsubContacts();
      unsubTimeTable();
      unsubTimeTableConfig();
      unsubSyllabuses();
      unsubGallery();
      unsubDownloads();
      unsubInquiries();
      unsubSettings();
    };
  }, []);

  // Delete Credential Handler
  const handleDeleteCredential = (id: string, name: string) => {
    const credToDelete = credentials.find((c) => c.id === id || c.uniqueId === id);
    const roll = credToDelete?.rollNumber;
    const studentId = credToDelete?.studentId;

    setDeleteModal({
      isOpen: true,
      title: 'Remove Student Login & Record',
      itemName: name,
      onConfirm: async () => {
        // Optimistic UI update (0ms delay)
        setCredentials((prev) => prev.filter((c) => c.id !== id && c.uniqueId !== id));
        setStudents((prev) =>
          prev.filter(
            (s) =>
              s.id !== id &&
              s.uniqueId !== id &&
              (studentId ? s.id !== studentId : true) &&
              (roll ? s.rollNumber !== roll : true)
          )
        );
        setDeleteModal((prev) => ({ ...prev, isOpen: false }));
        // Async background deletion
        deleteStudentCredential(id).catch((err) => console.warn('deleteStudentCredential note:', err));
      },
    });
  };

  // Handlers for PDF Modal
  const openNoticePDF = (notice: Notice) => {
    setPdfModalData({
      isOpen: true,
      title: notice.title,
      category: notice.category,
      fileUrl: notice.attachmentUrl,
      fileName: notice.attachmentName,
      metadata: {
        date: notice.date,
        size: '1.2 MB',
        fileName: notice.attachmentName,
        originalFileName: notice.attachmentName,
      },
    });
  };

  const openQuestionPaperPDF = (paper: QuestionPaper) => {
    setPdfModalData({
      isOpen: true,
      title: `${paper.title} (${paper.paperCode})`,
      category: 'Previous Year Question Paper',
      fileUrl: paper.fileUrl,
      fileName: paper.fileName,
      metadata: {
        course: paper.course || 'UG',
        academicYear: paper.academicYear,
        semester: paper.semester,
        paperCode: paper.paperCode,
        size: paper.fileSize || '350 KB',
        fileName: paper.fileName,
        originalFileName: paper.fileName,
        uploadedByRole: paper.uploadedByRole,
        uploaderName: paper.uploaderName,
        uploaderBatch: paper.uploaderBatch,
      },
    });
  };

  // CRUD Trigger Handlers
  const handleReorderFaculty = async (updatedList: Faculty[]) => {
    setFaculty(updatedList);
    for (const f of updatedList) {
      await saveFacultyMember(f);
    }
  };

  const handleDeleteFaculty = (id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Faculty Member',
      itemName: name,
      onConfirm: async () => {
        // Optimistic instant UI update
        setFaculty((prev) => prev.filter((f) => f.id !== id));
        setDeleteModal((prev) => ({ ...prev, isOpen: false }));
        deleteFacultyMember(id).catch((err) => console.warn('deleteFacultyMember error:', err));
      },
    });
  };

  const handleDeleteStudent = (id: string, name: string) => {
    const studentToDelete = students.find((s) => s.id === id);
    const roll = studentToDelete?.rollNumber;
    const uid = studentToDelete?.uniqueId || roll;

    setDeleteModal({
      isOpen: true,
      title: 'Remove Student from Department Records',
      itemName: name,
      onConfirm: async () => {
        // Optimistic instant UI update
        setStudents((prev) => prev.filter((s) => s.id !== id && (roll ? s.rollNumber !== roll : true)));
        setCredentials((prev) =>
          prev.filter(
            (c) =>
              c.studentId !== id &&
              c.id !== id &&
              (uid ? c.uniqueId !== uid && c.id !== uid : true) &&
              (roll ? c.rollNumber !== roll : true)
          )
        );
        setDeleteModal((prev) => ({ ...prev, isOpen: false }));
        deleteStudent(id).catch((err) => console.warn('deleteStudent note:', err));
      },
    });
  };

  const handleDeleteFacility = (id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Facility',
      itemName: name,
      onConfirm: async () => {
        // Optimistic instant UI update
        setFacilities((prev) => prev.filter((f) => f.id !== id));
        setDeleteModal((prev) => ({ ...prev, isOpen: false }));
        deleteFacility(id).catch((err) => console.warn('deleteFacility error:', err));
      },
    });
  };

  const handleDeleteBook = (id: string, title: string) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Book from Catalogue',
      itemName: title,
      onConfirm: async () => {
        // Optimistic instant UI update
        setBooks((prev) => prev.filter((b) => b.id !== id));
        setDeleteModal((prev) => ({ ...prev, isOpen: false }));
        deleteBook(id).catch((err) => console.warn('deleteBook error:', err));
      },
    });
  };

  const handleDeletePaper = (id: string, title: string) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Question Paper',
      itemName: title,
      onConfirm: async () => {
        // Optimistic instant UI update
        setPYQ((prev) => prev.filter((p) => p.id !== id));
        setDeleteModal((prev) => ({ ...prev, isOpen: false }));
        deleteQuestionPaper(id).catch((err) => console.warn('deleteQuestionPaper error:', err));
      },
    });
  };

  const handleDeleteNotice = (id: string, title: string) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Notice',
      itemName: title,
      onConfirm: async () => {
        // Optimistic instant UI update
        setNotices((prev) => {
          const next = prev.filter((n) => n.id !== id);
          try {
            localStorage.setItem('dept_notices', JSON.stringify(next));
          } catch {}
          return next;
        });
        setDeleteModal((prev) => ({ ...prev, isOpen: false }));
        deleteNotice(id).catch((err) => console.warn('deleteNotice error:', err));
      },
    });
  };

  const handleDeleteCommittee = (id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Committee',
      itemName: name,
      onConfirm: async () => {
        // Optimistic instant UI update
        setCommittees((prev) => prev.filter((c) => c.id !== id));
        setDeleteModal((prev) => ({ ...prev, isOpen: false }));
        deleteCommittee(id).catch((err) => console.warn('deleteCommittee error:', err));
      },
    });
  };

  const handleDeleteContact = (id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Contact Entry',
      itemName: name,
      onConfirm: async () => {
        // Optimistic instant UI update
        setContacts((prev) => prev.filter((c) => c.id !== id));
        setDeleteModal((prev) => ({ ...prev, isOpen: false }));
        deleteContact(id).catch((err) => console.warn('deleteContact error:', err));
      },
    });
  };

  const handleSaveDownload = async (item: DownloadItem) => {
    try {
      await saveDownloadItem(item);
      setDownloads((prev) => {
        const idx = prev.findIndex((d) => d.id === item.id);
        const next = idx >= 0 ? prev.map((d) => (d.id === item.id ? item : d)) : [item, ...prev];
        try {
          localStorage.setItem('dept_downloads', JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch (err) {
      console.error('Failed to save download:', err);
      throw err;
    }
  };

  const handleDeleteDownload = (id: string, title?: string) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Download Resource',
      itemName: title || 'Selected Document',
      onConfirm: async () => {
        setDownloads((prev) => {
          const next = prev.filter((d) => d.id !== id);
          try {
            localStorage.setItem('dept_downloads', JSON.stringify(next));
          } catch {}
          return next;
        });
        setDeleteModal((prev) => ({ ...prev, isOpen: false }));
        deleteDownloadItem(id).catch((err) => console.warn('deleteDownload error:', err));
      },
    });
  };

  // Helper to record an undoable timetable state
  const pushTimeTableHistory = (
    newSlots: TimeTableSlot[],
    newPeriods: TimeTablePeriod[],
    newClassRows: TimeTableClassRow[]
  ) => {
    if (isHistoryRestoringRef.current) return;
    setTtHistory((prev) => {
      const upToCurrent = prev.slice(0, ttHistoryIndex + 1);
      const next = [
        ...upToCurrent,
        {
          slots: [...newSlots],
          periods: [...newPeriods],
          classRows: [...newClassRows],
        },
      ];
      if (next.length > 40) next.shift();
      return next;
    });
    setTtHistoryIndex((prev) => Math.min(prev + 1, 39));
  };

  const applyTimeTableSnapshot = async (target: {
    slots: TimeTableSlot[];
    periods: TimeTablePeriod[];
    classRows: TimeTableClassRow[];
  }) => {
    isHistoryRestoringRef.current = true;
    try {
      setTimeTable(target.slots);
      setPeriods(target.periods);
      setClassRows(target.classRows);

      localStorage.setItem('dept_periods', JSON.stringify(target.periods));
      localStorage.setItem('dept_class_rows', JSON.stringify(target.classRows));
      await saveTimeTableConfig({ periods: target.periods, classRows: target.classRows });

      const targetIds = new Set(target.slots.map((s) => s.id));
      const slotsToDelete = timeTable.filter((s) => !targetIds.has(s.id));
      for (const s of slotsToDelete) {
        await deleteTimeTableSlot(s.id);
      }
      for (const s of target.slots) {
        await saveTimeTableSlot(s);
      }
    } finally {
      setTimeout(() => {
        isHistoryRestoringRef.current = false;
      }, 300);
    }
  };

  const handleUndoTimeTable = async () => {
    if (ttHistoryIndex <= 0) return;
    const targetIdx = ttHistoryIndex - 1;
    const target = ttHistory[targetIdx];
    if (!target) return;
    setTtHistoryIndex(targetIdx);
    await applyTimeTableSnapshot(target);
  };

  const handleRedoTimeTable = async () => {
    if (ttHistoryIndex < 0 || ttHistoryIndex >= ttHistory.length - 1) return;
    const targetIdx = ttHistoryIndex + 1;
    const target = ttHistory[targetIdx];
    if (!target) return;
    setTtHistoryIndex(targetIdx);
    await applyTimeTableSnapshot(target);
  };

  const handleDeleteTimeTableSlot = (id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Timetable Period',
      itemName: name,
      onConfirm: async () => {
        // Optimistic instant UI update
        const updated = timeTable.filter((s) => s.id !== id);
        setTimeTable(updated);
        pushTimeTableHistory(updated, periods, classRows);
        setDeleteModal((prev) => ({ ...prev, isOpen: false }));
        deleteTimeTableSlot(id).catch((err) => console.warn('deleteTimeTableSlot error:', err));
      },
    });
  };

  const handleSavePeriod = (period: TimeTablePeriod) => {
    setPeriods((prev) => {
      const idx = prev.findIndex((p) => p.id === period.id);
      let updated: TimeTablePeriod[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = period;
      } else {
        updated = [...prev, period].sort((a, b) => a.periodNumber - b.periodNumber);
      }
      localStorage.setItem('dept_periods', JSON.stringify(updated));
      saveTimeTableConfig({ periods: updated, classRows });
      pushTimeTableHistory(timeTable, updated, classRows);
      return updated;
    });
  };

  const handleDeletePeriod = (id: string) => {
    setPeriods((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem('dept_periods', JSON.stringify(updated));
      saveTimeTableConfig({ periods: updated, classRows });
      pushTimeTableHistory(timeTable, updated, classRows);
      return updated;
    });
  };

  const handleSaveClassRow = (row: TimeTableClassRow) => {
    setClassRows((prev) => {
      const idx = prev.findIndex((r) => r.id === row.id);
      let updated: TimeTableClassRow[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = row;
      } else {
        updated = [...prev, row];
      }
      localStorage.setItem('dept_class_rows', JSON.stringify(updated));
      saveTimeTableConfig({ periods, classRows: updated });
      pushTimeTableHistory(timeTable, periods, updated);
      return updated;
    });
  };

  const handleDeleteClassRow = (id: string) => {
    setClassRows((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      localStorage.setItem('dept_class_rows', JSON.stringify(updated));
      saveTimeTableConfig({ periods, classRows: updated });
      pushTimeTableHistory(timeTable, periods, updated);
      return updated;
    });
  };

  const handleClearAllSlots = async () => {
    await clearAllTimeTableSlots();
    setTimeTable([]);
    pushTimeTableHistory([], periods, classRows);
  };

  const handleDeleteSyllabus = (id: string, title: string) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Course Syllabus',
      itemName: title,
      onConfirm: async () => {
        // Optimistic instant UI update
        setSyllabuses((prev) => prev.filter((s) => s.id !== id));
        setDeleteModal((prev) => ({ ...prev, isOpen: false }));
        deleteSyllabus(id).catch((err) => console.warn('deleteSyllabus error:', err));
      },
    });
  };

  const handleSaveGalleryPhoto = async (photo: GalleryPhoto) => {
    await saveGalleryPhoto(photo);
    setGalleryPhotos((prev) => {
      const idx = prev.findIndex((p) => p.id === photo.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = photo;
        return copy;
      }
      return [photo, ...prev];
    });
  };

  const handleDeleteGalleryPhoto = async (id: string, title: string) => {
    await deleteGalleryPhoto(id);
    setGalleryPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleToggleBookStatus = async (book: Book) => {
    const nextStatus: 'Available' | 'Issued' | 'Reference Only' =
      book.status === 'Available'
        ? 'Issued'
        : book.status === 'Issued'
        ? 'Reference Only'
        : 'Available';
    const updated: Book = { ...book, status: nextStatus };
    await saveBook(updated);
    setBooks((prev) => prev.map((b) => (b.id === book.id ? updated : b)));
  };

  const handleToggleNoticeArchive = async (notice: Notice) => {
    const updated = { ...notice, isArchived: !notice.isArchived };
    await saveNotice(updated);
    setNotices((prev) => {
      const next = prev.map((n) => (n.id === notice.id ? updated : n));
      try {
        localStorage.setItem('dept_notices', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleSaveNotice = async (notice: Notice) => {
    await saveNotice(notice);
    setNotices((prev) => {
      const idx = prev.findIndex((n) => n.id === notice.id);
      const next = idx >= 0 ? prev.map((n) => (n.id === notice.id ? notice : n)) : [notice, ...prev];
      try {
        localStorage.setItem('dept_notices', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {quotaExceededInfo?.isExceeded && (
        <div className="bg-amber-600 text-white px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between shadow-md z-50">
          <div className="flex items-center space-x-2">
            <span className="font-bold uppercase tracking-wider bg-amber-800 px-2 py-0.5 rounded text-[10px]">Notice</span>
            <span>Firestore daily free quota limit reached. App is running seamlessly on local storage cache.</span>
          </div>
          <a
            href={quotaExceededInfo.upgradeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold hover:text-amber-100 transition flex items-center space-x-1 shrink-0 ml-2"
          >
            <span>Firebase Console</span>
          </a>
        </div>
      )}
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSearch={() => setSearchModalOpen(true)}
        onOpenStudentPortal={(mode = 'register') =>
          setStudentPortalModal({ isOpen: true, mode })
        }
        marqueeText={settings.announcementMarquee}
        notices={notices}
        onOpenLogoEditor={() => {
          if (isAdmin) {
            setLogoInputUrl(settings.logoUrl || '');
            setLogoModalOpen(true);
          } else {
            openAdminLoginModal();
          }
        }}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            notices={notices}
            faculty={faculty}
            students={students}
            books={books}
            settings={settings}
            facilities={facilities}
            onAddFacility={() => setFacilityModal({ isOpen: true, item: null })}
            onEditFacility={(f) => setFacilityModal({ isOpen: true, item: f })}
            onDeleteFacility={handleDeleteFacility}
            onSelectNoticePDF={openNoticePDF}
            onOpenFAQModal={() => setFaqModalOpen(true)}
            onSaveNotice={handleSaveNotice}
          />
        )}

        {activeTab === 'faculty' && (
          <FacultyPage
            faculty={faculty}
            timeTable={timeTable}
            periods={periods}
            onAddFaculty={() => setFacultyModal({ isOpen: true, item: null })}
            onEditFaculty={(f) => setFacultyModal({ isOpen: true, item: f })}
            onDeleteFaculty={handleDeleteFaculty}
            onReorderFaculty={handleReorderFaculty}
          />
        )}

        {activeTab === 'students' && (
          <StudentsPage
            students={students}
            privacyEnabled={settings.studentPublicPrivacy ?? true}
            onAddStudent={() => setStudentModal({ isOpen: true, item: null })}
            onEditStudent={(s) => setStudentModal({ isOpen: true, item: s })}
            onDeleteStudent={handleDeleteStudent}
            onOpenRegisterModal={() =>
              setStudentPortalModal({ isOpen: true, mode: 'register' })
            }
            onOpenLoginModal={() =>
              setStudentPortalModal({ isOpen: true, mode: 'login' })
            }
          />
        )}

        {activeTab === 'student-portal' && (
          <StudentPortalPage
            onStudentSaved={(savedStudent, cred) => {
              setStudents((prev) => {
                const idx = prev.findIndex(
                  (s) => s.id === savedStudent.id || s.rollNumber === savedStudent.rollNumber
                );
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = savedStudent;
                  return copy;
                }
                return [savedStudent, ...prev];
              });
              if (cred) {
                setCredentials((prev) => {
                  const idx = prev.findIndex((c) => c.uniqueId === cred.uniqueId);
                  if (idx >= 0) {
                    const copy = [...prev];
                    copy[idx] = cred;
                    return copy;
                  }
                  return [cred, ...prev];
                });
              }
            }}
            onNavigateHome={() => setActiveTab('home')}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'syllabus' && (
          <SyllabusPage
            syllabuses={syllabuses}
            onSaveSyllabus={async (syl) => {
              await saveSyllabus(syl);
              setSyllabuses((prev) => {
                const idx = prev.findIndex((s) => s.id === syl.id);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = syl;
                  return copy;
                }
                return [...prev, syl];
              });
            }}
            onAddSyllabus={(defCourse) =>
              setSyllabusModal({ isOpen: true, item: null, defaultCourse: defCourse })
            }
            onEditSyllabus={(s) => setSyllabusModal({ isOpen: true, item: s })}
            onDeleteSyllabus={handleDeleteSyllabus}
            onViewPDF={(title, url, category, fileName) =>
              setPdfModalData({
                isOpen: true,
                title,
                category,
                fileUrl: url,
                fileName,
                metadata: {
                  fileName,
                },
              })
            }
          />
        )}

        {activeTab === 'timetable' && (
          <TimeTablePage
            slots={timeTable}
            periods={periods}
            classRows={classRows}
            facultyList={faculty}
            canUndo={ttHistoryIndex > 0}
            canRedo={ttHistoryIndex >= 0 && ttHistoryIndex < ttHistory.length - 1}
            onUndo={handleUndoTimeTable}
            onRedo={handleRedoTimeTable}
            onAddSlot={(defaults) =>
              setTimeTableModal({
                isOpen: true,
                item: null,
                defaultCourse: defaults?.course,
                defaultYear: defaults?.yearLevel,
                defaultSemester: defaults?.semester,
                defaultDay: defaults?.dayOfWeek,
                defaultPeriod: defaults?.periodNumber,
              })
            }
            onEditSlot={(slot) => setTimeTableModal({ isOpen: true, item: slot })}
            onDeleteSlot={handleDeleteTimeTableSlot}
            onClearAllSlots={handleClearAllSlots}
            onSavePeriod={handleSavePeriod}
            onDeletePeriod={handleDeletePeriod}
            onSaveClassRow={handleSaveClassRow}
            onDeleteClassRow={handleDeleteClassRow}
          />
        )}

        {activeTab === 'gallery' && (
          <GalleryPage
            photos={galleryPhotos}
            onSavePhoto={handleSaveGalleryPhoto}
            onDeletePhoto={handleDeleteGalleryPhoto}
          />
        )}

        {activeTab === 'pyq' && (
          <PYQPage
            papers={pyq}
            onSelectPaper={openQuestionPaperPDF}
            onAddPaper={() => setPYQModal({ isOpen: true, item: null })}
            onEditPaper={(p) => setPYQModal({ isOpen: true, item: p })}
            onDeletePaper={handleDeletePaper}
            onSavePaper={async (p) => {
              await saveQuestionPaper(p);
              setPYQ((prev) => {
                const idx = prev.findIndex((item) => item.id === p.id);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = p;
                  return copy;
                }
                return [p, ...prev];
              });
            }}
            settings={settings}
            onUpdateSettings={async (updated) => {
              await updateDepartmentSettings(updated);
              setSettings((prev) => ({ ...prev, ...updated }));
            }}
            students={students}
            credentials={credentials}
            onOpenAdminLogin={() => openAdminLoginModal({ startMode: 'login' })}
          />
        )}

        {activeTab === 'library' && (
          <LibraryPage
            books={books}
            onAddBook={() => setBookModal({ isOpen: true, item: null })}
            onEditBook={(b) => setBookModal({ isOpen: true, item: b })}
            onDeleteBook={handleDeleteBook}
            onToggleStatus={handleToggleBookStatus}
          />
        )}

        {activeTab === 'notices' && (
          <NoticesPage
            notices={notices}
            onSelectNoticePDF={openNoticePDF}
            onAddNotice={() => setNoticeModal({ isOpen: true, item: null })}
            onEditNotice={(n) => setNoticeModal({ isOpen: true, item: n })}
            onDeleteNotice={handleDeleteNotice}
            onToggleArchive={handleToggleNoticeArchive}
          />
        )}

        {activeTab === 'downloads' && (
          <DownloadsPage
            downloads={downloads}
            onSaveDownload={handleSaveDownload}
            onDeleteDownload={(id, title) => handleDeleteDownload(id, title)}
            onViewPDF={(title, url, category, fileName) =>
              setPdfModalData({
                isOpen: true,
                title,
                category,
                fileUrl: url,
                fileName,
                metadata: {
                  fileName,
                },
              })
            }
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'committees' && (
          <CommitteesPage
            committees={committees}
            onAddCommittee={() => setCommitteeModal({ isOpen: true, item: null })}
            onEditCommittee={(c) => setCommitteeModal({ isOpen: true, item: c })}
            onDeleteCommittee={handleDeleteCommittee}
          />
        )}

        {activeTab === 'contacts' && (
          <ImportantContactsPage
            contacts={contacts}
            onAddContact={() => setContactModal({ isOpen: true, item: null })}
            onEditContact={(c) => setContactModal({ isOpen: true, item: c })}
            onDeleteContact={handleDeleteContact}
          />
        )}

        {activeTab === 'contact' && <ContactPage />}

        {activeTab === 'admin' && (
          <AdminDashboard
            faculty={faculty}
            students={students}
            credentials={credentials}
            facilities={facilities}
            books={books}
            pyq={pyq}
            notices={notices}
            committees={committees}
            contacts={contacts}
            inquiries={inquiries}
            settings={settings}
            galleryPhotos={galleryPhotos}
            onAddFaculty={() => setFacultyModal({ isOpen: true, item: null })}
            onEditFaculty={(f) => setFacultyModal({ isOpen: true, item: f })}
            onDeleteFaculty={handleDeleteFaculty}
            onUpdateFacultyPhoto={async (facultyId, newPhotoUrl) => {
              const target = faculty.find((item) => item.id === facultyId);
              if (!target) return;
              const updated = { ...target, photoUrl: newPhotoUrl };
              await saveFacultyMember(updated);
              setFaculty((prev) => {
                const idx = prev.findIndex((item) => item.id === facultyId);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = updated;
                  return copy;
                }
                return prev;
              });
            }}
            onAddStudent={() => setStudentModal({ isOpen: true, item: null })}
            onEditStudent={(s) => setStudentModal({ isOpen: true, item: s })}
            onDeleteStudent={handleDeleteStudent}
            onSaveCredential={async (cred) => {
              await saveStudentCredential(cred);
              setCredentials((prev) => {
                const idx = prev.findIndex((item) => item.uniqueId === cred.uniqueId);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = cred;
                  return copy;
                }
                return [...prev, cred];
              });
              // Keep students state in sync with credentials
              setStudents((prev) => {
                const idx = prev.findIndex(
                  (s) => s.id === cred.studentId || s.rollNumber === cred.rollNumber || s.uniqueId === cred.uniqueId
                );
                const studentId = cred.studentId || (idx >= 0 ? prev[idx].id : `stu-${cred.uniqueId}`);
                const studentObj: Student = {
                  academicYear: `${cred.admissionYear}–${(parseInt(cred.admissionYear, 10) + 1).toString().slice(-2)}`,
                  yearLevel: '1st Year',
                  semester: 'Semester I',
                  admissionYear: cred.admissionYear,
                  academicStatus: 'Active',
                  createdAt: cred.createdAt || new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  ...(idx >= 0 ? prev[idx] : {}),
                  id: studentId,
                  uniqueId: cred.uniqueId,
                  name: cred.studentName,
                  rollNumber: cred.rollNumber,
                  course: cred.course,
                };
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = studentObj;
                  return copy;
                }
                return [...prev, studentObj];
              });
            }}
            onDeleteCredential={handleDeleteCredential}
            onAddFacility={() => setFacilityModal({ isOpen: true, item: null })}
            onEditFacility={(f) => setFacilityModal({ isOpen: true, item: f })}
            onDeleteFacility={handleDeleteFacility}
            onAddBook={() => setBookModal({ isOpen: true, item: null })}
            onEditBook={(b) => setBookModal({ isOpen: true, item: b })}
            onDeleteBook={handleDeleteBook}
            onAddPaper={() => setPYQModal({ isOpen: true, item: null })}
            onEditPaper={(p) => setPYQModal({ isOpen: true, item: p })}
            onDeletePaper={handleDeletePaper}
            onAddNotice={() => setNoticeModal({ isOpen: true, item: null })}
            onEditNotice={(n) => setNoticeModal({ isOpen: true, item: n })}
            onDeleteNotice={handleDeleteNotice}
            onAddCommittee={() => setCommitteeModal({ isOpen: true, item: null })}
            onEditCommittee={(c) => setCommitteeModal({ isOpen: true, item: c })}
            onDeleteCommittee={handleDeleteCommittee}
            onAddContact={() => setContactModal({ isOpen: true, item: null })}
            onEditContact={(c) => setContactModal({ isOpen: true, item: c })}
            onDeleteContact={handleDeleteContact}
            timeTable={timeTable}
            syllabuses={syllabuses}
            onAddTimeTableSlot={(defaults) =>
              setTimeTableModal({
                isOpen: true,
                item: null,
                defaultCourse: defaults?.course || 'UG NEP',
                defaultYear: defaults?.yearLevel || '1st Year',
                defaultSemester: defaults?.semester || 'Semester I',
                defaultDay: defaults?.dayOfWeek || 'Monday',
                defaultPeriod: defaults?.periodNumber || 1,
              })
            }
            onEditTimeTableSlot={(slot) =>
              setTimeTableModal({ isOpen: true, item: slot })
            }
            onDeleteTimeTableSlot={handleDeleteTimeTableSlot}
            onAddSyllabus={() =>
              setSyllabusModal({ isOpen: true, item: null, defaultCourse: 'UG NEP' })
            }
            onEditSyllabus={(s) => setSyllabusModal({ isOpen: true, item: s })}
            onDeleteSyllabus={handleDeleteSyllabus}
            downloads={downloads}
            onSaveDownload={handleSaveDownload}
            onDeleteDownload={(id, title) => handleDeleteDownload(id, title)}
            onNavigateToDownloads={() => setActiveTab('downloads')}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        faculty={faculty}
        students={students}
        books={books}
        pyq={pyq}
        notices={notices}
        committees={committees}
        onNavigate={handleNavigate}
      />

      {/* FAQ Modal */}
      <FAQModal
        isOpen={faqModalOpen}
        onClose={() => setFaqModalOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Admin Login & Master Password Change Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={closeAdminLoginModal}
        initialMode={adminModalMode}
        onLoginSuccess={() => setActiveTab('admin')}
      />

      {/* Logo Edit Modal */}
      {logoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-[#0b1a2f] text-white p-5 flex items-center justify-between border-b border-slate-800">
              <h3 className="font-serif-academic text-lg font-bold">Edit Department Emblem / Logo</h3>
              <button
                onClick={() => setLogoModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white border border-slate-300 p-1 flex items-center justify-center shrink-0 shadow-xs">
                  <img
                    src={logoInputUrl || settings.logoUrl || '/college-logo.svg'}
                    alt="Logo Preview"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 text-xs text-slate-600">
                  <p className="font-bold text-slate-800 mb-1">Upload or URL</p>
                  <p>Provide an image URL or upload a new image file to update the department logo across the website instantly.</p>
                </div>
              </div>

              {logoSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold">
                  {logoSuccessMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Logo Image URL</label>
                <input
                  type="text"
                  value={logoInputUrl}
                  onChange={(e) => setLogoInputUrl(e.target.value)}
                  placeholder="https://example.com/logo.png..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Or Upload Image File</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setLogoInputUrl(ev.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer w-full"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLogoInputUrl('')}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Reset Default
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const updatedSettings = { ...settings, logoUrl: logoInputUrl };
                    await updateDepartmentSettings(updatedSettings);
                    setSettings(updatedSettings);
                    setLogoSuccessMsg('Logo updated successfully!');
                    setTimeout(() => {
                      setLogoSuccessMsg('');
                      setLogoModalOpen(false);
                    }, 1200);
                  }}
                  className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Save Logo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      <PDFModal
        isOpen={pdfModalData.isOpen}
        onClose={() => setPdfModalData((prev) => ({ ...prev, isOpen: false }))}
        title={pdfModalData.title}
        category={pdfModalData.category}
        fileUrl={pdfModalData.fileUrl}
        fileName={pdfModalData.fileName}
        metadata={pdfModalData.metadata}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.title}
        itemName={deleteModal.itemName}
        onConfirm={deleteModal.onConfirm}
        onCancel={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Faculty Add/Edit Modal */}
      <FacultyModal
        isOpen={facultyModal.isOpen}
        faculty={facultyModal.item}
        existingFaculty={faculty}
        onSave={async (f) => {
          await saveFacultyMember(f);
          setFaculty((prev) => {
            const idx = prev.findIndex((item) => item.id === f.id);
            let updated: Faculty[];
            if (idx >= 0) {
              updated = [...prev];
              updated[idx] = f;
            } else {
              updated = [...prev, f];
            }
            return updated.sort((a, b) => (a.order || 999) - (b.order || 999));
          });
        }}
        onClose={() => setFacultyModal({ isOpen: false, item: null })}
      />

      {/* Student Add/Edit Modal */}
      <StudentModal
        isOpen={studentModal.isOpen}
        student={studentModal.item}
        onSave={async (s) => {
          await saveStudent(s);
          setStudents((prev) => {
            const idx = prev.findIndex((item) => item.id === s.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = s;
              return copy;
            }
            return [...prev, s];
          });
          // Also keep credentials state in sync with students
          const uid = s.uniqueId || s.rollNumber.trim();
          setCredentials((prev) => {
            const idx = prev.findIndex((c) => c.uniqueId === uid || c.studentId === s.id || c.rollNumber === s.rollNumber);
            const credObj: StudentCredential = {
              id: uid,
              uniqueId: uid,
              studentId: s.id,
              rollNumber: s.rollNumber.trim(),
              studentName: s.name.trim(),
              password: idx >= 0 ? prev[idx].password : `Math@${s.admissionYear || '2026'}`,
              course: s.course,
              admissionYear: s.admissionYear || '2026',
              createdAt: idx >= 0 ? prev[idx].createdAt : new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = credObj;
              return copy;
            }
            return [...prev, credObj];
          });
        }}
        onClose={() => setStudentModal({ isOpen: false, item: null })}
      />

      {/* Facility Add/Edit Modal */}
      <FacilityModal
        isOpen={facilityModal.isOpen}
        facility={facilityModal.item}
        onSave={async (f) => {
          await saveFacility(f);
          setFacilities((prev) => {
            const idx = prev.findIndex((item) => item.id === f.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = f;
              return copy;
            }
            return [...prev, f];
          });
        }}
        onClose={() => setFacilityModal({ isOpen: false, item: null })}
      />

      {/* Book Add/Edit Modal */}
      <BookModal
        isOpen={bookModal.isOpen}
        book={bookModal.item}
        onSave={async (b) => {
          await saveBook(b);
          setBooks((prev) => {
            const idx = prev.findIndex((item) => item.id === b.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = b;
              return copy;
            }
            return [...prev, b];
          });
        }}
        onClose={() => setBookModal({ isOpen: false, item: null })}
      />

      {/* PYQ Add/Edit Modal */}
      <QuestionPaperModal
        isOpen={pyqModal.isOpen}
        paper={pyqModal.item}
        onSave={async (p) => {
          await saveQuestionPaper(p);
          setPYQ((prev) => {
            const idx = prev.findIndex((item) => item.id === p.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = p;
              return copy;
            }
            return [...prev, p];
          });
        }}
        onClose={() => setPYQModal({ isOpen: false, item: null })}
      />

      {/* Notice Add/Edit Modal */}
      <NoticeModal
        isOpen={noticeModal.isOpen}
        notice={noticeModal.item}
        onSave={async (n) => {
          await saveNotice(n);
          setNotices((prev) => {
            const idx = prev.findIndex((item) => item.id === n.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = n;
              return copy;
            }
            return [...prev, n];
          });
        }}
        onClose={() => setNoticeModal({ isOpen: false, item: null })}
      />

      {/* Committee Add/Edit Modal */}
      <CommitteeModal
        isOpen={committeeModal.isOpen}
        committee={committeeModal.item}
        onSave={async (c) => {
          await saveCommittee(c);
          setCommittees((prev) => {
            const idx = prev.findIndex((item) => item.id === c.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = c;
              return copy;
            }
            return [...prev, c];
          });
        }}
        onClose={() => setCommitteeModal({ isOpen: false, item: null })}
      />

      {/* Contact Add/Edit Modal */}
      <ContactModal
        isOpen={contactModal.isOpen}
        contact={contactModal.item}
        onSave={async (c) => {
          await saveContact(c);
          setContacts((prev) => {
            const idx = prev.findIndex((item) => item.id === c.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = c;
              return copy;
            }
            return [...prev, c];
          });
        }}
        onClose={() => setContactModal({ isOpen: false, item: null })}
      />

      {/* Timetable Slot Add/Edit Modal */}
      <TimeTableSlotModal
        isOpen={timeTableModal.isOpen}
        slot={timeTableModal.item}
        defaultCourse={timeTableModal.defaultCourse}
        defaultYear={timeTableModal.defaultYear}
        defaultSemester={timeTableModal.defaultSemester}
        defaultDay={timeTableModal.defaultDay}
        defaultPeriod={timeTableModal.defaultPeriod}
        existingSlots={timeTable}
        facultyList={faculty}
        periodsList={periods}
        onSave={async (slot, targetDays) => {
          const daysToSave = targetDays && targetDays.length > 0 ? targetDays : [slot.dayOfWeek];
          const newSlots: TimeTableSlot[] = [];

          for (const day of daysToSave) {
            if (day === slot.dayOfWeek) {
              await saveTimeTableSlot(slot);
              newSlots.push(slot);
            } else {
              const replicateId = `tt-${slot.course.replace(/\s+/g, '').toLowerCase()}-${day.toLowerCase()}-${slot.periodNumber}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
              const replicatedSlot: TimeTableSlot = {
                ...slot,
                id: replicateId,
                dayOfWeek: day,
              };
              await saveTimeTableSlot(replicatedSlot);
              newSlots.push(replicatedSlot);
            }
          }

          setTimeTable((prev) => {
            let copy = [...prev];
            for (const s of newSlots) {
              const idx = copy.findIndex((item) => item.id === s.id);
              if (idx >= 0) {
                copy[idx] = s;
              } else {
                copy.push(s);
              }
            }
            pushTimeTableHistory(copy, periods, classRows);
            return copy;
          });
        }}
        onClose={() => setTimeTableModal({ isOpen: false, item: null })}
      />

      {/* Syllabus Add/Edit Modal */}
      <SyllabusModal
        isOpen={syllabusModal.isOpen}
        syllabus={syllabusModal.item}
        defaultCourse={syllabusModal.defaultCourse}
        onSave={async (syl) => {
          await saveSyllabus(syl);
          setSyllabuses((prev) => {
            const idx = prev.findIndex((s) => s.id === syl.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = syl;
              return copy;
            }
            return [...prev, syl];
          });
        }}
        onClose={() => setSyllabusModal({ isOpen: false, item: null })}
      />

      {/* Student Portal (Registration & Login/Edit Self-Service) */}
      <StudentPortalModal
        isOpen={studentPortalModal.isOpen}
        initialMode={studentPortalModal.mode}
        onClose={() => setStudentPortalModal((prev) => ({ ...prev, isOpen: false }))}
        onStudentSaved={(savedStudent, cred) => {
          setStudents((prev) => {
            const idx = prev.findIndex(
              (s) => s.id === savedStudent.id || s.rollNumber === savedStudent.rollNumber
            );
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = savedStudent;
              return copy;
            }
            return [savedStudent, ...prev];
          });
          const uid = cred?.uniqueId || savedStudent.uniqueId || savedStudent.rollNumber.trim();
          setCredentials((prev) => {
            const idx = prev.findIndex((c) => c.uniqueId === uid || c.studentId === savedStudent.id || c.rollNumber === savedStudent.rollNumber);
            const credObj: StudentCredential = cred || {
              id: uid,
              uniqueId: uid,
              studentId: savedStudent.id,
              rollNumber: savedStudent.rollNumber.trim(),
              studentName: savedStudent.name.trim(),
              password: idx >= 0 ? prev[idx].password : `Math@${savedStudent.admissionYear || '2026'}`,
              course: savedStudent.course,
              admissionYear: savedStudent.admissionYear || '2026',
              createdAt: idx >= 0 ? prev[idx].createdAt : new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = credObj;
              return copy;
            }
            return [credObj, ...prev];
          });
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

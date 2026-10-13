import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  GraduationCap,
  BookOpen,
  FileQuestion,
  Building2,
  Bell,
  Scale,
  PhoneCall,
  Settings,
  Mail,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  LogOut,
  LogIn,
  Lock,
  Unlock,
  CheckCircle2,
  Sliders,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Search,
  FileSpreadsheet,
  X,
  Camera,
  Calendar,
  BookMarked,
  Clock,
  CloudUpload,
  Award,
  ExternalLink,
} from 'lucide-react';
import { DriveBackupTab } from '../components/DriveBackupTab';
import { MarkFoilGenerator } from '../components/MarkFoilGenerator';
import { DownloadsPage } from './DownloadsPage';
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
  Syllabus,
  GalleryPhoto,
  DownloadItem,
} from '../types';
import { useAuth } from '../context/AuthContext';
import {
  updateDepartmentSettings,
  saveFacultyMember,
  DEFAULT_ADMIN_ID,
  MASTER_ADMIN_KEY,
} from '../services/db';
import { FacultyPhotoModal } from '../components/FacultyPhotoPicker';

interface AdminDashboardProps {
  faculty: Faculty[];
  students: Student[];
  credentials: StudentCredential[];
  facilities: Facility[];
  books: Book[];
  pyq: QuestionPaper[];
  notices: Notice[];
  committees: Committee[];
  contacts: ImportantContact[];
  inquiries: ContactMessage[];
  settings: DepartmentSettings;
  timeTable?: TimeTableSlot[];
  syllabuses?: Syllabus[];
  galleryPhotos?: GalleryPhoto[];
  onRefreshData?: () => void;
  onAddFaculty: () => void;
  onEditFaculty: (f: Faculty) => void;
  onDeleteFaculty: (id: string, name: string) => void;
  onUpdateFacultyPhoto?: (facultyId: string, newPhotoUrl: string) => Promise<void>;
  onAddStudent: () => void;
  onEditStudent: (s: Student) => void;
  onDeleteStudent: (id: string, name: string) => void;
  onSaveCredential: (cred: StudentCredential) => Promise<void>;
  onDeleteCredential: (id: string, name: string) => void;
  onAddFacility: () => void;
  onEditFacility: (f: Facility) => void;
  onDeleteFacility: (id: string, name: string) => void;
  onAddBook: () => void;
  onEditBook: (b: Book) => void;
  onDeleteBook: (id: string, name: string) => void;
  onAddPaper: () => void;
  onEditPaper: (p: QuestionPaper) => void;
  onDeletePaper: (id: string, name: string) => void;
  onAddNotice: () => void;
  onEditNotice: (n: Notice) => void;
  onDeleteNotice: (id: string, name: string) => void;
  onAddCommittee: () => void;
  onEditCommittee: (c: Committee) => void;
  onDeleteCommittee: (id: string, name: string) => void;
  onAddContact: () => void;
  onEditContact: (c: ImportantContact) => void;
  onDeleteContact: (id: string, name: string) => void;
  onAddTimeTableSlot?: (defaults?: {
    course?: string;
    yearLevel?: string;
    semester?: string;
    dayOfWeek?: any;
    periodNumber?: number;
  }) => void;
  onEditTimeTableSlot?: (slot: TimeTableSlot) => void;
  onDeleteTimeTableSlot?: (id: string, name: string) => void;
  onAddSyllabus?: () => void;
  onEditSyllabus?: (s: Syllabus) => void;
  onDeleteSyllabus?: (id: string, name: string) => void;
  downloads?: DownloadItem[];
  onSaveDownload?: (item: DownloadItem) => Promise<void> | void;
  onDeleteDownload?: (id: string, title?: string) => void;
  onNavigateToDownloads?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  faculty,
  students,
  credentials,
  facilities,
  books,
  pyq,
  notices,
  committees,
  contacts,
  inquiries,
  settings,
  timeTable = [],
  syllabuses = [],
  galleryPhotos = [],
  downloads = [],
  onSaveDownload,
  onDeleteDownload,
  onNavigateToDownloads,
  onRefreshData,
  onAddFaculty,
  onEditFaculty,
  onDeleteFaculty,
  onUpdateFacultyPhoto,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onSaveCredential,
  onDeleteCredential,
  onAddFacility,
  onEditFacility,
  onDeleteFacility,
  onAddBook,
  onEditBook,
  onDeleteBook,
  onAddPaper,
  onEditPaper,
  onDeletePaper,
  onAddNotice,
  onEditNotice,
  onDeleteNotice,
  onAddCommittee,
  onEditCommittee,
  onDeleteCommittee,
  onAddContact,
  onEditContact,
  onDeleteContact,
  onAddTimeTableSlot,
  onEditTimeTableSlot,
  onDeleteTimeTableSlot,
  onAddSyllabus,
  onEditSyllabus,
  onDeleteSyllabus,
}) => {
  const {
    user,
    isAdmin,
    signInWithGoogle,
    signOut,
    loginAsAdmin,
    changeAdminPassword,
    openAdminLoginModal,
  } = useAuth();

  const [activeSection, setActiveSection] = useState<
    | 'overview'
    | 'credentials'
    | 'faculty'
    | 'students'
    | 'markFoil'
    | 'downloads'
    | 'syllabus'
    | 'timetable'
    | 'pyq'
    | 'library'
    | 'facilities'
    | 'notices'
    | 'committees'
    | 'contacts'
    | 'inquiries'
    | 'settings'
    | 'driveBackup'
  >('overview');

  // Time Table admin filters
  const [adminTTFilterCourse, setAdminTTFilterCourse] = useState<string>('All');
  const [adminTTFilterYear, setAdminTTFilterYear] = useState<string>('All');
  const [adminTTSearch, setAdminTTSearch] = useState<string>('');

  // Syllabus admin filters
  const [adminSylCourse, setAdminSylCourse] = useState<string>('All');
  const [adminSylSearch, setAdminSylSearch] = useState<string>('');

  // Gate states when !isAdmin
  const [gateAdminId, setGateAdminId] = useState('');
  const [gateAdminPassword, setGateAdminPassword] = useState('');
  const [gateShowPassword, setGateShowPassword] = useState(false);
  const [gateError, setGateError] = useState('');
  const [gateSuccess, setGateSuccess] = useState('');
  const [gateLoading, setGateLoading] = useState(false);
  const [gateMode, setGateMode] = useState<'login' | 'change_password'>('login');
  const [gateMasterKey, setGateMasterKey] = useState('');
  const [gateNewPassword, setGateNewPassword] = useState('');
  const [gateConfirmPassword, setGateConfirmPassword] = useState('');
  const [gateShowNewPassword, setGateShowNewPassword] = useState(false);

  // Settings Section Admin Password Change state
  const [settingsMasterKey, setSettingsMasterKey] = useState('');
  const [settingsNewPassword, setSettingsNewPassword] = useState('');
  const [settingsConfirmPassword, setSettingsConfirmPassword] = useState('');
  const [settingsShowPass, setSettingsShowPass] = useState(false);
  const [settingsPassSuccess, setSettingsPassSuccess] = useState('');
  const [settingsPassError, setSettingsPassError] = useState('');
  const [settingsPassLoading, setSettingsPassLoading] = useState(false);

  // Faculty Photo Import Modal State
  const [photoFacultyModal, setPhotoFacultyModal] = useState<Faculty | null>(null);

  // Credentials Vault State
  const [credSearchTerm, setCredSearchTerm] = useState('');
  const [credCourseFilter, setCredCourseFilter] = useState('All');
  const [credYearFilter, setCredYearFilter] = useState('All');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [allPasswordsRevealed, setAllPasswordsRevealed] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Student Records Management State
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentCourseFilter, setStudentCourseFilter] = useState('All');
  const [studentYearFilter, setStudentYearFilter] = useState('All');
  const [studentLevelFilter, setStudentLevelFilter] = useState('All');
  const [editCredModal, setEditCredModal] = useState<{
    isOpen: boolean;
    cred: StudentCredential | null;
    password: string;
  }>({ isOpen: false, cred: null, password: '' });
  const [addCredModal, setAddCredModal] = useState<{
    isOpen: boolean;
    studentName: string;
    rollNumber: string;
    course: string;
    admissionYear: string;
    password: string;
    uniqueId: string;
  }>({
    isOpen: false,
    studentName: '',
    rollNumber: '',
    course: 'UG NEP',
    admissionYear: '2026',
    password: '',
    uniqueId: '',
  });

  const liveBookCount = useMemo(
    () => (books || []).reduce((acc, b) => acc + (Number(b.copies) || 1), 0),
    [books]
  );

  const [statsForm, setStatsForm] = useState({
    facultyCount: (faculty && faculty.length) || settings.facultyCount || 6,
    studentCount: (students && students.length) || settings.studentCount || 192,
    courseCount: settings.courseCount || 3,
    bookCount: liveBookCount || settings.bookCount || 116,
    yearsOfService: settings.yearsOfService || 52,
    announcementMarquee: settings.announcementMarquee || '',
    studentPublicPrivacy: settings.studentPublicPrivacy ?? true,
    pyqUploadCode: settings.pyqUploadCode || 'Mathematics',
  });

  useEffect(() => {
    setStatsForm((prev) => ({
      ...prev,
      facultyCount: faculty.length,
      studentCount: students.length,
      bookCount: liveBookCount,
    }));
  }, [faculty.length, students.length, liveBookCount]);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDepartmentSettings(statsForm);
      setSaveSuccessMsg('Department settings & live statistics successfully updated!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch {
      alert('Error updating department settings.');
    }
  };

  // Filtered student credentials for the admin database
  const filteredCredentials = useMemo(() => {
    return (credentials || []).filter((c) => {
      const matchCourse =
        credCourseFilter === 'All' ||
        (c.course && c.course.toLowerCase().includes(credCourseFilter.toLowerCase()));
      const matchYear =
        credYearFilter === 'All' || c.admissionYear === credYearFilter;
      const term = credSearchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        c.studentName.toLowerCase().includes(term) ||
        c.rollNumber.toLowerCase().includes(term) ||
        c.uniqueId.toLowerCase().includes(term) ||
        (c.course && c.course.toLowerCase().includes(term));

      return matchCourse && matchYear && matchSearch;
    });
  }, [credentials, credCourseFilter, credYearFilter, credSearchTerm]);

  const handleCopyPassword = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleExportCredentialsCSV = () => {
    const headers = [
      'Roll Number',
      'Unique Login ID',
      'Student Name',
      'Course',
      'Joining Year',
      'Password',
      'Created Date',
    ];
    const rows = filteredCredentials.map((c) => [
      `"${c.rollNumber}"`,
      `"${c.uniqueId}"`,
      `"${c.studentName}"`,
      `"${c.course}"`,
      `"${c.admissionYear}"`,
      `"${c.password}"`,
      `"${c.createdAt}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Student_ID_Password_Database_Baragada_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Unique Academic Years for student filter
  const availableStudentYears = useMemo(() => {
    const set = new Set<string>(['2026–27', '2025–26', '2024–25']);
    students.forEach((s) => {
      if (s.academicYear) set.add(s.academicYear);
    });
    return Array.from(set).sort().reverse();
  }, [students]);

  // Filtered Students for the admin records table
  const filteredAdminStudents = useMemo(() => {
    return (students || []).filter((s) => {
      const matchCourse =
        studentCourseFilter === 'All' ||
        (s.course && (
          studentCourseFilter === 'UG NEP'
            ? s.course.toLowerCase().includes('nep')
            : studentCourseFilter === 'UG AEDP'
            ? s.course.toLowerCase().includes('aedp')
            : studentCourseFilter === 'UG CBCS'
            ? s.course.toLowerCase().includes('cbcs')
            : studentCourseFilter === 'PG'
            ? s.course.toLowerCase().includes('pg') || s.course.toLowerCase().includes('m.sc')
            : s.course.toLowerCase().includes(studentCourseFilter.toLowerCase())
        ));
      const matchYear =
        studentYearFilter === 'All' ||
        s.academicYear === studentYearFilter ||
        s.admissionYear === studentYearFilter;
      const matchLevel =
        studentLevelFilter === 'All' || s.yearLevel === studentLevelFilter;
      const term = studentSearchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        s.name.toLowerCase().includes(term) ||
        s.rollNumber.toLowerCase().includes(term) ||
        (s.registrationNumber && s.registrationNumber.toLowerCase().includes(term)) ||
        (s.uniqueId && s.uniqueId.toLowerCase().includes(term));

      return matchCourse && matchYear && matchLevel && matchSearch;
    });
  }, [students, studentCourseFilter, studentYearFilter, studentLevelFilter, studentSearchTerm]);

  const handleExportStudentsCSV = () => {
    const headers = [
      'Roll Number',
      'Registration Number',
      'Student Name',
      'Guardian',
      'Course',
      'Academic Session',
      'Year Level',
      'Semester',
      'Category',
      'Gender',
      'Mobile',
      'Email',
      'Address',
    ];
    const rows = filteredAdminStudents.map((s) => [
      `"${s.rollNumber}"`,
      `"${s.registrationNumber || ''}"`,
      `"${s.name}"`,
      `"${s.fatherMotherName || ''}"`,
      `"${s.course}"`,
      `"${s.academicYear}"`,
      `"${s.yearLevel}"`,
      `"${s.semester}"`,
      `"${s.category || ''}"`,
      `"${s.gender || ''}"`,
      `"${s.mobile || ''}"`,
      `"${s.email || ''}"`,
      `"${s.address || ''}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Enrolled_Students_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If visitor is not authenticated:
  if (!isAdmin) {
    const handleGateLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setGateError('');
      setGateSuccess('');
      if (!gateAdminId.trim()) {
        setGateError('Please enter Administrator ID.');
        return;
      }
      if (!gateAdminPassword.trim()) {
        setGateError('Please enter Administrator Password.');
        return;
      }
      setGateLoading(true);
      try {
        const res = await loginAsAdmin(gateAdminId.trim(), gateAdminPassword.trim());
        if (res.success) {
          setGateSuccess('Authentication successful. Loading administrator console...');
        } else {
          setGateError(res.error || 'Authentication failed. Please verify credentials.');
        }
      } catch (err: any) {
        setGateError(err.message || 'An error occurred during authentication.');
      } finally {
        setGateLoading(false);
      }
    };

    const handleGateChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setGateError('');
      setGateSuccess('');
      if (gateMasterKey.trim() !== MASTER_ADMIN_KEY) {
        setGateError(
          'Invalid Master Permission Key. Please provide the authorized key.'
        );
        return;
      }
      if (!gateNewPassword.trim() || gateNewPassword.trim().length < 6) {
        setGateError('New password must be at least 6 characters long.');
        return;
      }
      if (gateNewPassword !== gateConfirmPassword) {
        setGateError('New password and confirmation do not match.');
        return;
      }
      setGateLoading(true);
      try {
        const res = await changeAdminPassword(gateMasterKey.trim(), gateNewPassword.trim());
        if (res.success) {
          setGateSuccess('Admin password updated successfully! You can now log in.');
          setGateAdminId(DEFAULT_ADMIN_ID);
          setGateAdminPassword(gateNewPassword.trim());
          setGateMasterKey('');
          setGateNewPassword('');
          setGateConfirmPassword('');
          setTimeout(() => {
            setGateMode('login');
          }, 1500);
        } else {
          setGateError(res.error || 'Failed to update password.');
        }
      } catch (err: any) {
        setGateError(err.message || 'Failed to update password.');
      } finally {
        setGateLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 max-w-md w-full text-slate-100 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="h-1.5 bg-linear-to-r from-amber-500 via-amber-400 to-amber-600 absolute top-0 left-0 right-0" />

          <div className="text-center space-y-2 pt-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-inner">
              {gateMode === 'login' ? (
                <ShieldCheck className="w-7 h-7" />
              ) : (
                <KeyRound className="w-7 h-7" />
              )}
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block">
              Department Portal Security
            </span>
            <h2 className="font-serif-academic text-xl font-bold text-white">
              {gateMode === 'login'
                ? 'Administrator Authentication'
                : 'Change Administrator Password'}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              {gateMode === 'login'
                ? 'Access to this console is strictly restricted to department administrators possessing verified credentials.'
                : 'Confidential Master Permission Key is required to change or reset the administrator password.'}
            </p>
          </div>

          {/* Feedback messages */}
          {gateError && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex flex-col gap-1.5">
              <div className="flex items-start gap-2">
                <span className="font-bold text-rose-400">✕</span>
                <span className="leading-relaxed">{gateError}</span>
              </div>
              {gateError.includes('Authorized Domains') && (
                <div className="mt-1 pt-1.5 border-t border-rose-800/60 text-[11px] text-amber-300">
                  Tip: You can log in right now using Administrator ID <strong>Admin123</strong> and your password below.
                </div>
              )}
            </div>
          )}

          {gateSuccess && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{gateSuccess}</span>
            </div>
          )}

          {gateMode === 'login' ? (
            <form onSubmit={handleGateLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Admin ID *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={gateAdminId}
                    onChange={(e) => setGateAdminId(e.target.value)}
                    placeholder="Enter Admin ID"
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setGateMode('change_password');
                      setGateError('');
                      setGateSuccess('');
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline transition cursor-pointer flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Change Password</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={gateShowPassword ? 'text' : 'password'}
                    required
                    value={gateAdminPassword}
                    onChange={(e) => setGateAdminPassword(e.target.value)}
                    placeholder="Enter Admin Password"
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setGateShowPassword(!gateShowPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200 p-0.5"
                    title={gateShowPassword ? 'Hide password' : 'Show password'}
                  >
                    {gateShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={gateLoading}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {gateLoading ? (
                  <span className="animate-pulse">Verifying Credentials...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Sign In to Admin Console</span>
                  </>
                )}
              </button>

              <div className="pt-2 border-t border-slate-700/80 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setGateMode('change_password');
                    setGateError('');
                    setGateSuccess('');
                  }}
                  className="text-xs text-slate-400 hover:text-amber-300 transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Need to change or reset password?</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-700/80">
                <button
                  type="button"
                  disabled={gateLoading}
                  onClick={async () => {
                    setGateError('');
                    setGateSuccess('');
                    setGateLoading(true);
                    try {
                      const res = await signInWithGoogle();
                      if (res.success) {
                        setGateSuccess('Signed in with Google successfully! Loading dashboard...');
                      } else if (res.error) {
                        setGateError(res.error);
                      }
                    } catch (err: any) {
                      setGateError(err?.message || 'Google Sign-In failed.');
                    } finally {
                      setGateLoading(false);
                    }
                  }}
                  className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="w-3.5 h-3.5 text-blue-400" />
                  <span>Google Sign In</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleGateChangePassword} className="space-y-4">
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/70 text-xs text-amber-200 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 text-amber-300 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Master Authorization Required</span>
                </div>
                Enter the confidential Master Permission Key provided to the department administrator.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Master Permission Key *
                </label>
                <input
                  type="text"
                  required
                  value={gateMasterKey}
                  onChange={(e) => setGateMasterKey(e.target.value)}
                  placeholder="Enter Master Permission Key"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono tracking-wider placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  New Administrator Password *
                </label>
                <div className="relative">
                  <input
                    type={gateShowNewPassword ? 'text' : 'password'}
                    required
                    value={gateNewPassword}
                    onChange={(e) => setGateNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full pl-3 pr-10 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setGateShowNewPassword(!gateShowNewPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200 p-0.5"
                  >
                    {gateShowNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Confirm New Password *
                </label>
                <input
                  type={gateShowNewPassword ? 'text' : 'password'}
                  required
                  value={gateConfirmPassword}
                  onChange={(e) => setGateConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setGateMode('login');
                    setGateError('');
                    setGateSuccess('');
                  }}
                  className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 cursor-pointer"
                >
                  Back to Login
                </button>
                <button
                  type="submit"
                  disabled={gateLoading}
                  className="flex-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50"
                >
                  {gateLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  const navMenuItems = [
    { id: 'overview', label: 'Overview & Stats', icon: Sliders },
    {
      id: 'credentials',
      label: `Student ID & Passwords (${credentials?.length || 0})`,
      icon: KeyRound,
    },
    { id: 'faculty', label: `Faculty (${faculty.length})`, icon: Users },
    { id: 'students', label: `Students (${students.length})`, icon: GraduationCap },
    { id: 'markFoil', label: 'Mark Foil Generator', icon: Award },
    {
      id: 'downloads',
      label: `Public Downloads (${downloads?.length || 0})`,
      icon: Download,
    },
    { id: 'syllabus', label: `Course Syllabi (${syllabuses.length})`, icon: BookMarked },
    { id: 'timetable', label: `Time Table (${timeTable.length})`, icon: Calendar },
    { id: 'pyq', label: `Question Papers (${pyq.length})`, icon: FileQuestion },
    { id: 'library', label: `Library Books (${books.length})`, icon: BookOpen },
    { id: 'facilities', label: `Showcase Photos (${facilities.length})`, icon: Building2 },
    { id: 'notices', label: `Notices (${notices.length})`, icon: Bell },
    { id: 'committees', label: `Committees (${committees.length})`, icon: Scale },
    { id: 'contacts', label: `Directory (${contacts.length})`, icon: PhoneCall },
    { id: 'inquiries', label: `Inquiries (${inquiries.length})`, icon: Mail },
    { id: 'driveBackup', label: 'Google Drive Backup & Sync', icon: CloudUpload },
    { id: 'settings', label: 'Portal Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Admin Ribbon */}
      <div className="bg-[#0b1a2f] text-white px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500 text-slate-950">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif-academic text-lg font-bold text-white">
                Department Management Console
              </h1>
              <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded uppercase">
                Authorized Administrator
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Department of Mathematics • Panchayat College, Baragada
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveSection('settings')}
            className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            title="Change administrator password"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Change Password</span>
          </button>

          <button
            onClick={async () => {
              await signOut();
            }}
            className="px-3.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Admin</span>
          </button>
        </div>
      </div>

      {/* Main Admin Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Admin Navigation Sidebar */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-3 shadow-xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2 block">
              Content Modules
            </span>
            {navMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as any)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#0c2340] text-amber-300 font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-9 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs min-h-[600px]">
            {/* SECTION: OVERVIEW */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif-academic text-xl font-bold text-[#0c2340]">
                    Portal Overview & Real-Time Record Counts
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Live tally of database documents stored persistently in Cloud Firestore.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                  {[
                    { label: 'Student IDs & Passwords', count: credentials?.length || 0, tab: 'credentials', highlight: true },
                    { label: 'Enrolled Students', count: students.length, tab: 'students' },
                    { label: 'Mark Foil Generator', count: students.length, tab: 'markFoil', highlight: true },
                    { label: 'Faculty Members', count: faculty.length, tab: 'faculty' },
                    { label: 'Course Syllabi', count: syllabuses.length, tab: 'syllabus' },
                    { label: 'Time Table Periods', count: timeTable.length, tab: 'timetable' },
                    { label: 'Question Papers', count: pyq.length, tab: 'pyq' },
                    { label: 'Library Books', count: books.length, tab: 'library' },
                    { label: 'Showcase Photos', count: facilities.length, tab: 'facilities' },
                    { label: 'Active Notices', count: notices.length, tab: 'notices' },
                    { label: 'Committees', count: committees.length, tab: 'committees' },
                    { label: 'Inquiries Received', count: inquiries.length, tab: 'inquiries' },
                  ].map((card, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveSection(card.tab as any)}
                      className={`p-4 rounded-xl border transition cursor-pointer ${
                        card.highlight
                          ? 'border-amber-400 bg-amber-50/60 hover:bg-amber-100/60'
                          : 'border-slate-200 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-serif-academic text-2xl font-bold text-slate-900">
                        {card.count}
                      </div>
                      <div className="text-xs text-slate-700 font-semibold mt-1 flex items-center justify-between">
                        <span>{card.label}</span>
                        {card.highlight && <KeyRound className="w-3.5 h-3.5 text-amber-600" />}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <h3 className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    How Content Management Works
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    All edits made through these panels are instantly synced to your live Firestore database. When new academic sessions begin (e.g. 2026–27, 2027–28), you can add students and papers directly without altering code.
                  </p>
                </div>
              </div>
            )}

            {/* SECTION: FACULTY */}
            {activeSection === 'faculty' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="font-serif-academic text-xl font-bold text-[#0c2340]">
                      Manage Faculty Directory
                    </h2>
                    <p className="text-xs text-slate-500">
                      Add, edit, or remove professors &bull; Import photos from Computer or Google Drive
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onAddFaculty}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Faculty</span>
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs bg-white shadow-2xs">
                  {[...faculty].sort((a, b) => (a.order || 999) - (b.order || 999)).map((f, index) => (
                    <div key={f.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Interactive Photo Avatar with Hover Camera Overlay */}
                        <div
                          onClick={() => setPhotoFacultyModal(f)}
                          className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-slate-200 group cursor-pointer shadow-xs bg-slate-100"
                          title="Click to import photo from Computer or Google Drive"
                        >
                          <img
                            src={f.photoUrl}
                            alt={f.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Camera className="w-4 h-4" />
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-2 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded bg-[#0c2340] text-amber-300 font-mono text-[10px] font-black">
                              #{f.order || index + 1}
                            </span>
                            <span>{f.name}</span>
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                              {f.designation}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {f.qualification} &bull; {f.specialization}
                          </div>
                          <div className="text-[10.5px] text-slate-400 truncate">
                            {f.email} {f.phone ? `&bull; ${f.phone}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => setPhotoFacultyModal(f)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                          title="Import photo from Computer or Google Drive"
                        >
                          <Camera className="w-3.5 h-3.5 text-blue-600" />
                          <span>Import Photo</span>
                        </button>
                        <button
                          onClick={() => onEditFaculty(f)}
                          className="p-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                          title="Edit Full Profile"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteFaculty(f.id, f.name)}
                          className="p-2 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-rose-600 hover:text-rose-700 transition cursor-pointer"
                          title="Delete Faculty Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION: STUDENTS */}
            {activeSection === 'students' && (
              <div className="space-y-6">
                {/* Header & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                  <div className="space-y-1">
                    <h2 className="font-serif-academic text-xl sm:text-2xl font-bold text-[#0c2340]">
                      Manage Student Records
                    </h2>
                    <p className="text-xs text-slate-600 max-w-2xl">
                      Search, view, update, or remove any enrolled student across academic sessions. Administrators have complete authority to manage student records and remove students from the department database.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={onAddStudent}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Student</span>
                    </button>

                    <button
                      onClick={handleExportStudentsCSV}
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                      title="Export student records to CSV"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* Course Stream Breakdown Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">
                      Total Enrolled
                    </span>
                    <span className="text-xl font-bold text-slate-900 mt-0.5 block font-serif-academic">
                      {students.length}
                    </span>
                    <span className="text-[10px] text-slate-400">All registered scholars</span>
                  </div>

                  <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl">
                    <span className="text-[10px] text-blue-700 uppercase font-bold block">
                      UG NEP Stream
                    </span>
                    <span className="text-xl font-bold text-blue-900 mt-0.5 block font-serif-academic">
                      {students.filter((s) => s.course?.toLowerCase().includes('nep')).length}
                    </span>
                    <span className="text-[10px] text-blue-500">Under Graduate NEP</span>
                  </div>

                  <div className="p-3.5 bg-teal-50/50 border border-teal-200 rounded-xl">
                    <span className="text-[10px] text-teal-700 uppercase font-bold block">
                      UG AEDP Stream
                    </span>
                    <span className="text-xl font-bold text-teal-900 mt-0.5 block font-serif-academic">
                      {students.filter((s) => s.course?.toLowerCase().includes('aedp')).length}
                    </span>
                    <span className="text-[10px] text-teal-500">Under Graduate AEDP</span>
                  </div>

                  <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                    <span className="text-[10px] text-emerald-700 uppercase font-bold block">
                      UG CBCS Stream
                    </span>
                    <span className="text-xl font-bold text-emerald-900 mt-0.5 block font-serif-academic">
                      {students.filter((s) => s.course?.toLowerCase().includes('cbcs')).length}
                    </span>
                    <span className="text-[10px] text-emerald-500">Under Graduate CBCS</span>
                  </div>

                  <div className="p-3.5 bg-purple-50/50 border border-purple-200 rounded-xl">
                    <span className="text-[10px] text-purple-700 uppercase font-bold block">
                      PG Stream
                    </span>
                    <span className="text-xl font-bold text-purple-900 mt-0.5 block font-serif-academic">
                      {students.filter((s) => s.course?.toLowerCase().includes('pg') || s.course?.toLowerCase().includes('m.sc')).length}
                    </span>
                    <span className="text-[10px] text-purple-500">Post Graduate Scholars</span>
                  </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    {/* Search */}
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={studentSearchTerm}
                        onChange={(e) => setStudentSearchTerm(e.target.value)}
                        placeholder="Search student by name, roll no, or reg no..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-hidden focus:border-blue-500"
                      />
                    </div>

                    {/* Course Filter */}
                    <select
                      value={studentCourseFilter}
                      onChange={(e) => setStudentCourseFilter(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-hidden"
                    >
                      <option value="All">All Courses</option>
                      <option value="UG NEP">UG NEP</option>
                      <option value="UG AEDP">UG AEDP</option>
                      <option value="UG CBCS">UG CBCS</option>
                      <option value="PG">PG</option>
                    </select>

                    {/* Session Filter */}
                    <select
                      value={studentYearFilter}
                      onChange={(e) => setStudentYearFilter(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-hidden"
                    >
                      <option value="All">All Sessions</option>
                      {availableStudentYears.map((yr) => (
                        <option key={yr} value={yr}>Session {yr}</option>
                      ))}
                    </select>

                    {/* Level Filter */}
                    <select
                      value={studentLevelFilter}
                      onChange={(e) => setStudentLevelFilter(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-hidden"
                    >
                      <option value="All">All Year Levels</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                    </select>
                  </div>

                  <div className="text-[11px] font-semibold text-slate-500 shrink-0 text-right">
                    Showing <strong className="text-slate-900">{filteredAdminStudents.length}</strong> of {students.length} students
                  </div>
                </div>

                {/* Students Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-[#0c2340] text-white uppercase text-[10px] tracking-wider font-semibold">
                        <tr>
                          <th className="py-3 px-4">Roll No / Reg</th>
                          <th className="py-3 px-4">Student Name & Photo</th>
                          <th className="py-3 px-4">Course</th>
                          <th className="py-3 px-4">Session & Term</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Contact</th>
                          <th className="py-3 px-4 text-right">Admin Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAdminStudents.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-12 text-slate-400">
                              <p className="font-medium text-slate-600">No students match the current criteria.</p>
                              {(studentSearchTerm || studentCourseFilter !== 'All' || studentYearFilter !== 'All' || studentLevelFilter !== 'All') && (
                                <button
                                  onClick={() => {
                                    setStudentSearchTerm('');
                                    setStudentCourseFilter('All');
                                    setStudentYearFilter('All');
                                    setStudentLevelFilter('All');
                                  }}
                                  className="mt-2 text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                                >
                                  Clear Filters
                                </button>
                              )}
                            </td>
                          </tr>
                        ) : (
                          filteredAdminStudents.map((s) => (
                            <tr key={s.id} className="hover:bg-blue-50/30 transition group">
                              {/* Roll / Reg */}
                              <td className="py-3 px-4 font-mono font-bold text-slate-900">
                                <div>{s.rollNumber}</div>
                                <div className="text-[10px] text-slate-400 font-normal">
                                  {s.registrationNumber || 'Pending'}
                                </div>
                              </td>

                              {/* Name & Photo */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={
                                      s.photoUrl ||
                                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                                    }
                                    alt={s.name}
                                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                                  />
                                  <div>
                                    <div className="font-bold text-slate-900">{s.name}</div>
                                    <div className="text-[10px] text-slate-400">
                                      {s.fatherMotherName ? `Guardian: ${s.fatherMotherName}` : ''}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Course */}
                              <td className="py-3 px-4">
                                <span className="font-semibold text-blue-900">{s.course}</span>
                              </td>

                              {/* Session & Term */}
                              <td className="py-3 px-4">
                                <div className="font-medium text-slate-800">
                                  {s.yearLevel} ({s.academicYear})
                                </div>
                                <div className="text-[11px] text-amber-700 font-semibold">
                                  {s.semester}
                                </div>
                              </td>

                              {/* Category */}
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900 font-semibold text-[10px]">
                                  {s.category || 'GEN'}
                                </span>
                              </td>

                              {/* Contact */}
                              <td className="py-3 px-4">
                                <div className="space-y-0.5 font-mono text-[11px] text-slate-800">
                                  <div>{s.mobile || 'N/A'}</div>
                                  <div className="text-[10px] text-slate-500 font-sans truncate max-w-[120px]">{s.email || 'N/A'}</div>
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => onEditStudent(s)}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                                    title={`Edit record for ${s.name}`}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => onDeleteStudent(s.id, `${s.name} (${s.rollNumber})`)}
                                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-2xs"
                                    title={`Remove ${s.name} from student list`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                    <span>Remove</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION: UNIVERSITY CONFIDENTIAL MARK FOIL GENERATOR (ADMIN ONLY) */}
            {activeSection === 'markFoil' && (
              <MarkFoilGenerator students={students} />
            )}

            {/* SECTION: PUBLIC DOWNLOADS MANAGEMENT (ADMIN ONLY) */}
            {activeSection === 'downloads' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold uppercase tracking-wider mb-2">
                      <Download className="w-3.5 h-3.5 text-amber-700" />
                      <span>Menu &rarr; Downloads Repository Management</span>
                    </div>
                    <h2 className="font-serif-academic text-xl sm:text-2xl font-bold text-[#0c2340]">
                      Public Download Resources & Syllabi
                    </h2>
                    <p className="text-xs text-slate-600 max-w-2xl mt-1">
                      Manage syllabi, timetable routine sheets, seminar forms, academic calendars, and departmental guidelines published for students and the public under menu &rarr; downloads.
                    </p>
                  </div>

                  {onNavigateToDownloads && (
                    <button
                      type="button"
                      onClick={onNavigateToDownloads}
                      className="px-4 py-2.5 bg-[#0c2340] hover:bg-slate-800 text-amber-300 font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-xs cursor-pointer shrink-0"
                    >
                      <ExternalLink className="w-4 h-4 text-amber-400" />
                      <span>View Public Downloads Page</span>
                    </button>
                  )}
                </div>

                <DownloadsPage
                  downloads={downloads}
                  onSaveDownload={onSaveDownload}
                  onDeleteDownload={onDeleteDownload}
                  syllabuses={syllabuses}
                  questionPapers={pyq}
                />
              </div>
            )}

            {/* SECTION: CREDENTIALS (STUDENT ID & PASSWORD VAULT - ONLY SEEN TO ADMIN) */}
            {activeSection === 'credentials' && (
              <div className="space-y-6">
                {/* Header & Security Notice */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold">
                      <Lock className="w-3 h-3 text-rose-600" />
                      <span>Confidential Database (Admin Eyes Only)</span>
                    </div>
                    <h2 className="font-serif-academic text-xl sm:text-2xl font-bold text-[#0c2340]">
                      Student ID & Password Database
                    </h2>
                    <p className="text-xs text-slate-600 max-w-2xl">
                      Master administrative vault of registered student login IDs and passwords. Students use these credentials to fill and edit their profiles as per their joining year and course (UG NEP, UG AEDP, PG). This repository is strictly restricted to department administrators.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() =>
                        setAddCredModal({
                          isOpen: true,
                          studentName: '',
                          rollNumber: '',
                          course: 'UG NEP',
                          admissionYear: '2026',
                          password: `Math@${new Date().getFullYear()}`,
                          uniqueId: '',
                        })
                      }
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Student Login</span>
                    </button>

                    <button
                      onClick={handleExportCredentialsCSV}
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                      title="Download full encrypted credential list as CSV"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* Course Stream Breakdown Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">
                      Total Credentials
                    </span>
                    <span className="text-xl font-bold text-slate-900 mt-0.5 block font-serif-academic">
                      {credentials?.length || 0}
                    </span>
                    <span className="text-[10px] text-slate-400">All registered scholars</span>
                  </div>

                  <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl">
                    <span className="text-[10px] text-blue-700 uppercase font-bold block">
                      UG NEP Stream
                    </span>
                    <span className="text-xl font-bold text-blue-900 mt-0.5 block font-serif-academic">
                      {credentials?.filter((c) => c.course?.includes('NEP')).length || 0}
                    </span>
                    <span className="text-[10px] text-blue-500">Under Graduate NEP</span>
                  </div>

                  <div className="p-3.5 bg-teal-50/50 border border-teal-200 rounded-xl">
                    <span className="text-[10px] text-teal-700 uppercase font-bold block">
                      UG AEDP Stream
                    </span>
                    <span className="text-xl font-bold text-teal-900 mt-0.5 block font-serif-academic">
                      {credentials?.filter((c) => c.course?.includes('AEDP')).length || 0}
                    </span>
                    <span className="text-[10px] text-teal-500">Under Graduate AEDP</span>
                  </div>

                  <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                    <span className="text-[10px] text-emerald-700 uppercase font-bold block">
                      UG CBCS Stream
                    </span>
                    <span className="text-xl font-bold text-emerald-900 mt-0.5 block font-serif-academic">
                      {credentials?.filter((c) => c.course?.includes('CBCS')).length || 0}
                    </span>
                    <span className="text-[10px] text-emerald-500">Under Graduate CBCS</span>
                  </div>

                  <div className="p-3.5 bg-purple-50/50 border border-purple-200 rounded-xl">
                    <span className="text-[10px] text-purple-700 uppercase font-bold block">
                      PG Stream
                    </span>
                    <span className="text-xl font-bold text-purple-900 mt-0.5 block font-serif-academic">
                      {credentials?.filter((c) => c.course?.includes('PG')).length || 0}
                    </span>
                    <span className="text-[10px] text-purple-500">Post Graduate Scholars</span>
                  </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    {/* Search */}
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={credSearchTerm}
                        onChange={(e) => setCredSearchTerm(e.target.value)}
                        placeholder="Search student name, roll number, or unique ID..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-hidden focus:border-blue-500"
                      />
                    </div>

                    {/* Course Filter */}
                    <select
                      value={credCourseFilter}
                      onChange={(e) => setCredCourseFilter(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-hidden"
                    >
                      <option value="All">All Courses</option>
                      <option value="UG NEP">UG NEP</option>
                      <option value="UG AEDP">UG AEDP</option>
                      <option value="UG CBCS">UG CBCS</option>
                      <option value="PG">PG</option>
                    </select>

                    {/* Joining Year Filter */}
                    <select
                      value={credYearFilter}
                      onChange={(e) => setCredYearFilter(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-hidden"
                    >
                      <option value="All">All Joining Years</option>
                      <option value="2027">2027</option>
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const next = !allPasswordsRevealed;
                        setAllPasswordsRevealed(next);
                        const newMap: Record<string, boolean> = {};
                        credentials.forEach((c) => {
                          newMap[c.id] = next;
                        });
                        setRevealedPasswords(newMap);
                      }}
                      className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-medium text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {allPasswordsRevealed ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                          <span>Mask All Passwords</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Reveal All Passwords</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Database Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0c2340] text-white uppercase text-[10px] tracking-wider font-semibold">
                        <tr>
                          <th className="py-3 px-4">Roll Number</th>
                          <th className="py-3 px-4">Unique Login ID</th>
                          <th className="py-3 px-4">Student Name</th>
                          <th className="py-3 px-4">Course</th>
                          <th className="py-3 px-4">Joining Year</th>
                          <th className="py-3 px-4">Password (Admin View)</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {filteredCredentials.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-400">
                              No student credentials match the selected query.
                            </td>
                          </tr>
                        ) : (
                          filteredCredentials.map((c) => {
                            const isRevealed =
                              allPasswordsRevealed || !!revealedPasswords[c.id];
                            return (
                              <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3.5 px-4">
                                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                    {c.rollNumber}
                                  </span>
                                </td>

                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-semibold text-blue-800">
                                      {c.uniqueId}
                                    </span>
                                    <button
                                      onClick={() => handleCopyPassword(c.uniqueId, `id-${c.id}`)}
                                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                                      title="Copy Login ID"
                                    >
                                      {copiedId === `id-${c.id}` ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </td>

                                <td className="py-3.5 px-4 font-bold text-slate-900">
                                  {c.studentName}
                                </td>

                                <td className="py-3.5 px-4">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                      c.course?.includes('NEP')
                                        ? 'bg-blue-100 text-blue-800'
                                        : c.course?.includes('AEDP')
                                        ? 'bg-teal-100 text-teal-800'
                                        : c.course?.includes('PG')
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {c.course}
                                  </span>
                                </td>

                                <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">
                                  {c.admissionYear}
                                </td>

                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`font-mono px-2 py-0.5 rounded border text-xs font-semibold ${
                                        isRevealed
                                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                          : 'bg-slate-100 text-slate-500 border-slate-200 tracking-widest'
                                      }`}
                                    >
                                      {isRevealed ? c.password : '••••••••'}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setRevealedPasswords((prev) => ({
                                          ...prev,
                                          [c.id]: !prev[c.id],
                                        }))
                                      }
                                      className="p-1 rounded text-slate-400 hover:text-slate-700 transition"
                                      title={isRevealed ? 'Hide Password' : 'Show Password'}
                                    >
                                      {isRevealed ? (
                                        <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                                      ) : (
                                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleCopyPassword(c.password, `pw-${c.id}`)}
                                      className="p-1 rounded text-slate-400 hover:text-slate-700 transition"
                                      title="Copy Password to Clipboard"
                                    >
                                      {copiedId === `pw-${c.id}` ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </td>

                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() =>
                                        setEditCredModal({
                                          isOpen: true,
                                          cred: c,
                                          password: c.password,
                                        })
                                      }
                                      className="p-1.5 rounded hover:bg-slate-100 text-blue-700 transition"
                                      title="Reset or Edit Password"
                                    >
                                      <KeyRound className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => onDeleteCredential(c.id, `${c.studentName} (${c.rollNumber})`)}
                                      className="px-2 py-1 rounded hover:bg-rose-50 text-rose-600 transition flex items-center gap-1 font-bold text-xs"
                                      title="Delete Credential and Student Record"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                      <span>Remove</span>
                                    </button>
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
            )}

            {/* SECTION: SYLLABUS */}
            {activeSection === 'syllabus' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="font-serif-academic text-xl font-bold text-[#0c2340]">
                      Manage Course Syllabi & Curriculum
                    </h2>
                    <p className="text-xs text-slate-500">
                      Add, update, or remove official syllabi for UG NEP, UG AEDP, PG, and CBCS programs
                    </p>
                  </div>
                  {onAddSyllabus && (
                    <button
                      onClick={onAddSyllabus}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Course Syllabus</span>
                    </button>
                  )}
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Course Filter:</span>
                    {['All', 'UG NEP', 'UG AEDP', 'PG', 'UG CBCS'].map((course) => (
                      <button
                        key={course}
                        onClick={() => setAdminSylCourse(course)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          adminSylCourse === course
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {course}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search syllabus..."
                      value={adminSylSearch}
                      onChange={(e) => setAdminSylSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Syllabi List */}
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs bg-white shadow-2xs">
                  {syllabuses
                    .filter((s) => {
                      const matchCourse = adminSylCourse === 'All' || s.course === adminSylCourse;
                      const term = adminSylSearch.toLowerCase();
                      const matchSearch =
                        !term ||
                        (s.title && s.title.toLowerCase().includes(term)) ||
                        (s.category && s.category.toLowerCase().includes(term)) ||
                        (s.paperCode && s.paperCode.toLowerCase().includes(term)) ||
                        (s.description && s.description.toLowerCase().includes(term));
                      return matchCourse && matchSearch;
                    })
                    .map((s) => (
                      <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200">
                              {s.course}
                            </span>
                            {s.category && (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                                  s.category === 'None'
                                    ? 'bg-gray-100 text-gray-700 border-gray-300'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                {s.category === 'None' ? 'None (Hidden)' : s.category}
                              </span>
                            )}
                            {(s.admissionBatch || s.session) && (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                                Batch {s.admissionBatch || s.session}
                              </span>
                            )}
                            {s.fileType && (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200 uppercase">
                                {s.fileType}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm">
                            {s.title || `${s.course} ${s.category || ''} Syllabus`}
                          </h4>
                          <p className="text-slate-500 text-xs line-clamp-1">{s.description}</p>
                          <div className="text-[11px] text-slate-400">
                            Units: {s.units?.length || 0} modules {s.fileUrl ? '• PDF Attached' : ''}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          {onEditSyllabus && (
                            <button
                              onClick={() => onEditSyllabus(s)}
                              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                              title="Edit Syllabus"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteSyllabus && (
                            <button
                              onClick={() => onDeleteSyllabus(s.id, s.title || `${s.course} ${s.category || ''} Syllabus`)}
                              className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 border border-slate-200 transition cursor-pointer"
                              title="Delete Syllabus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* SECTION: TIME TABLE */}
            {activeSection === 'timetable' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="font-serif-academic text-xl font-bold text-[#0c2340]">
                      Class Time Table
                    </h2>
                    <p className="text-xs text-slate-500">
                      Configure and adjust lecture, tutorial, and laboratory schedules for students of UG NEP, UG AEDP, and PG by year
                    </p>
                  </div>
                  {onAddTimeTableSlot && (
                    <button
                      onClick={() =>
                        onAddTimeTableSlot({
                          course: adminTTFilterCourse === 'All' ? 'UG NEP' : adminTTFilterCourse,
                          yearLevel: adminTTFilterYear === 'All' ? '1st Year' : adminTTFilterYear,
                        })
                      }
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Timetable Period</span>
                    </button>
                  )}
                </div>

                {/* Filters & Search Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Course:</span>
                    {['All', 'UG NEP', 'UG AEDP', 'PG'].map((course) => (
                      <button
                        key={course}
                        onClick={() => setAdminTTFilterCourse(course)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          adminTTFilterCourse === course
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {course}
                      </button>
                    ))}

                    <span className="text-xs font-bold text-slate-600 ml-2">Year:</span>
                    {['All', '1st Year', '2nd Year', '3rd Year', '4th Year'].map((year) => (
                      <button
                        key={year}
                        onClick={() => setAdminTTFilterYear(year)}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          adminTTFilterYear === year
                            ? 'bg-[#0b1a2f] text-white font-bold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search subject, faculty, room..."
                      value={adminTTSearch}
                      onChange={(e) => setAdminTTSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Slots List */}
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs bg-white shadow-2xs">
                  {timeTable
                    .filter((slot) => {
                      const matchCourse = adminTTFilterCourse === 'All' || slot.course === adminTTFilterCourse;
                      const matchYear = adminTTFilterYear === 'All' || slot.yearLevel === adminTTFilterYear;
                      const term = adminTTSearch.toLowerCase();
                      const matchSearch =
                        !term ||
                        slot.subjectName.toLowerCase().includes(term) ||
                        slot.paperCode.toLowerCase().includes(term) ||
                        slot.facultyName.toLowerCase().includes(term) ||
                        slot.roomNo.toLowerCase().includes(term);
                      return matchCourse && matchYear && matchSearch;
                    })
                    .map((slot) => (
                      <div key={slot.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200">
                              {slot.course}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-200">
                              {slot.yearLevel} • {slot.semester}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                              {slot.dayOfWeek}
                            </span>
                            <span className="font-mono text-[11px] font-bold text-slate-600 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-500" />
                              {slot.startTime} – {slot.endTime}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              {slot.type}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm">
                            {slot.paperCode && <span className="text-amber-700 font-mono mr-1.5">{slot.paperCode}:</span>}
                            {slot.subjectName}
                          </h4>
                          <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-3">
                            <span>Faculty: <strong>{slot.facultyName}</strong></span>
                            <span>Room: <strong>{slot.roomNo}</strong></span>
                            {slot.notes && <span className="italic text-slate-400">({slot.notes})</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          {onEditTimeTableSlot && (
                            <button
                              onClick={() => onEditTimeTableSlot(slot)}
                              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                              title="Edit Timetable Slot"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteTimeTableSlot && (
                            <button
                              onClick={() => onDeleteTimeTableSlot(slot.id, slot.subjectName)}
                              className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 border border-slate-200 transition cursor-pointer"
                              title="Delete Timetable Slot"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* SECTION: QUESTION PAPERS */}
            {activeSection === 'pyq' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-serif-academic text-xl font-bold text-[#0c2340]">
                      Manage Previous Year Question Papers
                    </h2>
                    <p className="text-xs text-slate-500">CBCS examination paper catalog & student contributions</p>
                  </div>
                  <button
                    onClick={onAddPaper}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Question Paper</span>
                  </button>
                </div>

                {/* Security Code Banner in PYQ section */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-900 shrink-0">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">
                        Student Upload Security Code:{' '}
                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300 text-amber-900">
                          {settings.pyqUploadCode || 'Mathematics'}
                        </span>
                      </span>
                      <span className="text-[11px] text-slate-600">
                        Students must enter this secret code along with their Student ID & password to add question papers.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSection('settings')}
                    className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-slate-900 rounded-lg font-bold text-xs shrink-0 cursor-pointer transition"
                  >
                    Change Security Code
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs bg-white">
                  {pyq.map((p) => (
                    <div key={p.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 text-sm">{p.title}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {p.course || (p.title.includes('PG') ? 'PG' : 'UG')}
                          </span>
                          <span>Code: <span className="font-mono font-bold text-slate-700">{p.paperCode}</span> • Session {p.academicYear} • {p.semester}</span>
                        </div>
                        {p.uploadedByRole === 'student' && p.uploaderName ? (
                          <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5 pt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                              Student Upload
                            </span>
                            <span>
                              Contributed by: <strong>{p.uploaderName}</strong> {p.uploaderBatch && `(${p.uploaderBatch})`}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-800 text-[10px] font-bold">
                              Department Archive
                            </span>
                            <span className="text-slate-500">
                              (Admin identity hidden from public)
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditPaper(p)}
                          className="p-1.5 rounded hover:bg-slate-200 text-slate-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeletePaper(p.id, p.title)}
                          className="p-1.5 rounded hover:bg-rose-100 text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION: LIBRARY */}
            {activeSection === 'library' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif-academic text-xl font-bold text-[#0c2340]">
                      Manage Department Library
                    </h2>
                    <p className="text-xs text-slate-500">Book catalog and stock availability</p>
                  </div>
                  <button
                    onClick={onAddBook}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Book</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  {books.map((b) => (
                    <div key={b.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-900">{b.title}</div>
                        <div className="text-[11px] text-slate-500">
                          By {b.author} • {b.subject} • Status: {b.status}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditBook(b)}
                          className="p-1.5 rounded hover:bg-slate-200 text-slate-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteBook(b.id, b.title)}
                          className="p-1.5 rounded hover:bg-rose-100 text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION: FACILITIES */}
            {activeSection === 'facilities' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif-academic text-xl font-bold text-[#0c2340]">
                      Department Photographs & Showcase
                    </h2>
                    <p className="text-xs text-slate-500">Showcase photos, campus view & descriptions</p>
                  </div>
                  <button
                    onClick={onAddFacility}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Photo</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  {facilities.map((fac) => (
                    <div key={fac.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50">
                      <div className="flex items-center gap-3 min-w-0">
                        {fac.photoUrl ? (
                          <img
                            src={fac.photoUrl}
                            alt={fac.name}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                            <Building2 className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">{fac.name}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            {fac.description || 'No description provided.'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onEditFacility(fac)}
                          className="p-1.5 rounded hover:bg-slate-200 text-slate-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteFacility(fac.id, fac.name)}
                          className="p-1.5 rounded hover:bg-rose-100 text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION: NOTICES */}
            {activeSection === 'notices' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif-academic text-xl font-bold text-[#0c2340]">
                      Manage Circulars & Notices
                    </h2>
                    <p className="text-xs text-slate-500">Official department announcements</p>
                  </div>
                  <button
                    onClick={onAddNotice}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Publish Notice</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  {notices.map((n) => (
                    <div key={n.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50">
                      <div className="flex items-center gap-3 min-w-0">
                        {n.attachmentUrl &&
                        (n.attachmentUrl.startsWith('data:image/') ||
                          Boolean(n.attachmentUrl.match(/\.(jpeg|jpg|png|webp|gif)($|\?)/i))) ? (
                          <div
                            style={{ width: '1.2cm', height: '1.8cm' }}
                            className="rounded-lg border border-slate-300 overflow-hidden bg-slate-100 shrink-0 shadow-2xs"
                          >
                            <img src={n.attachmentUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : null}
                        <div>
                          <div className="font-bold text-slate-900">{n.title}</div>
                          <div className="text-[11px] text-slate-500">
                            {n.date} • {n.category} {n.isArchived ? '(Archived)' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onEditNotice(n)}
                          className="p-1.5 rounded hover:bg-slate-200 text-slate-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteNotice(n.id, n.title)}
                          className="p-1.5 rounded hover:bg-rose-100 text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION: COMMITTEES */}
            {activeSection === 'committees' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif-academic text-xl font-bold text-[#0c2340]">
                      Manage College Committees
                    </h2>
                    <p className="text-xs text-slate-500">Anti-Ragging, ICC, IQAC & Welfare</p>
                  </div>
                  <button
                    onClick={onAddCommittee}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Committee</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  {committees.map((c) => (
                    <div key={c.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-500">
                          Convener: {c.convener} ({c.designation})
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditCommittee(c)}
                          className="p-1.5 rounded hover:bg-slate-200 text-slate-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteCommittee(c.id, c.name)}
                          className="p-1.5 rounded hover:bg-rose-100 text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION: IMPORTANT CONTACTS */}
            {activeSection === 'contacts' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif-academic text-xl font-bold text-[#0c2340]">
                      Manage Important Contacts Directory
                    </h2>
                    <p className="text-xs text-slate-500">Official office and emergency telephone list</p>
                  </div>
                  <button
                    onClick={onAddContact}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Contact</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  {contacts.map((cnt) => (
                    <div key={cnt.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-900">{cnt.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {cnt.designation} • Tel: {cnt.phone}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditContact(cnt)}
                          className="p-1.5 rounded hover:bg-slate-200 text-slate-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteContact(cnt.id, cnt.name)}
                          className="p-1.5 rounded hover:bg-rose-100 text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION: INQUIRIES */}
            {activeSection === 'inquiries' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif-academic text-xl font-bold text-[#0c2340]">
                    Inquiries & Contact Form Submissions
                  </h2>
                  <p className="text-xs text-slate-500">
                    Messages submitted by students and visitors via the Contact page
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  {inquiries.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl">
                      No visitor messages received yet.
                    </div>
                  ) : (
                    inquiries.map((msg) => (
                      <div
                        key={msg.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">{msg.subject}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                          {msg.message}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                          <span>
                            <strong>From:</strong> {msg.name}
                          </span>
                          <span>
                            <strong>Email:</strong> {msg.email}
                          </span>
                          {msg.phone && (
                            <span>
                              <strong>Phone:</strong> {msg.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* SECTION: GOOGLE DRIVE BACKUP & RESTORE */}
            {activeSection === 'driveBackup' && (
              <DriveBackupTab
                faculty={faculty}
                students={students}
                credentials={credentials}
                syllabuses={syllabuses}
                timeTable={timeTable}
                pyq={pyq}
                books={books}
                facilities={facilities}
                galleryPhotos={galleryPhotos}
                notices={notices}
                committees={committees}
                contacts={contacts}
                inquiries={inquiries}
                settings={settings}
                onRestoreSuccess={onRefreshData}
              />
            )}

            {/* SECTION: SETTINGS & STATS */}
            {activeSection === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif-academic text-xl font-bold text-[#0c2340]">
                    Department Statistics & Security Configuration
                  </h2>
                  <p className="text-xs text-slate-500">
                    Update the homepage numbers, announcement banner, and student privacy guard
                  </p>
                </div>

                {saveSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateSettings} className="space-y-5 text-xs">
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                      Homepage Highlight Counters
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-slate-700 font-semibold">
                            Faculty Members
                          </label>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded" title="Auto-synced from live Faculty database">
                            Real-Time: {faculty.length}
                          </span>
                        </div>
                        <input
                          type="number"
                          value={statsForm.facultyCount}
                          onChange={(e) =>
                            setStatsForm({ ...statsForm, facultyCount: parseInt(e.target.value) || 0 })
                          }
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-white"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-slate-700 font-semibold">
                            Enrolled Students
                          </label>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded" title="Auto-synced from live Student database">
                            Real-Time: {students.length}
                          </span>
                        </div>
                        <input
                          type="number"
                          value={statsForm.studentCount}
                          onChange={(e) =>
                            setStatsForm({ ...statsForm, studentCount: parseInt(e.target.value) || 0 })
                          }
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Academic Programs
                        </label>
                        <input
                          type="number"
                          value={statsForm.courseCount}
                          onChange={(e) =>
                            setStatsForm({ ...statsForm, courseCount: parseInt(e.target.value) || 0 })
                          }
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-white"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-slate-700 font-semibold">
                            Library Volumes
                          </label>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded" title="Auto-synced from live Library book records">
                            Real-Time: {liveBookCount}
                          </span>
                        </div>
                        <input
                          type="number"
                          value={statsForm.bookCount}
                          onChange={(e) =>
                            setStatsForm({ ...statsForm, bookCount: parseInt(e.target.value) || 0 })
                          }
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Years of Service
                        </label>
                        <input
                          type="number"
                          value={statsForm.yearsOfService}
                          onChange={(e) =>
                            setStatsForm({
                              ...statsForm,
                              yearsOfService: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                      Announcement Marquee Banner
                    </h3>
                    <input
                      type="text"
                      value={statsForm.announcementMarquee}
                      onChange={(e) =>
                        setStatsForm({ ...statsForm, announcementMarquee: e.target.value })
                      }
                      placeholder="Text to display in the top announcement ticker..."
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                  </div>

                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                      Student Privacy Protection Guard
                    </h3>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={statsForm.studentPublicPrivacy}
                        onChange={(e) =>
                          setStatsForm({ ...statsForm, studentPublicPrivacy: e.target.checked })
                        }
                        className="w-4 h-4 text-amber-500 rounded"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">
                          Mask Private Student Information for Public Visitors
                        </span>
                        <span className="text-[11px] text-slate-500">
                          When checked, telephone numbers and physical home addresses are hidden from unauthorized visitors and only revealed to authenticated administrators.
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* QUESTION PAPERS UPLOAD SECURITY CODE */}
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-amber-600" />
                        <span>Question Papers Upload Security Code</span>
                      </h3>
                      <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded font-mono">
                        Active: {statsForm.pyqUploadCode}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Code required for student question paper contributions in the Previous Year Question Papers section. You can change this code at any time.
                    </p>
                    <div className="max-w-xs">
                      <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                        Security Code (Default: Mathematics)
                      </label>
                      <input
                        type="text"
                        required
                        value={statsForm.pyqUploadCode}
                        onChange={(e) =>
                          setStatsForm({ ...statsForm, pyqUploadCode: e.target.value })
                        }
                        placeholder="e.g. Mathematics"
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-white font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg uppercase tracking-wider text-xs shadow-md transition cursor-pointer"
                    >
                      Save Settings Changes
                    </button>
                  </div>
                </form>

                {/* ADMIN CREDENTIALS & PASSWORD SECURITY PANEL */}
                <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 text-slate-100 space-y-5 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-serif-academic text-base font-bold text-white">
                          Administrator Credentials & Password Vault
                        </h3>
                        <p className="text-xs text-slate-400">
                          Configure administrative access and update your login password
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
                        Administrator Access Active
                      </span>
                    </div>
                  </div>

                  {settingsPassSuccess && (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-200 rounded-lg text-xs flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{settingsPassSuccess}</span>
                    </div>
                  )}

                  {settingsPassError && (
                    <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-200 rounded-lg text-xs flex items-center gap-2">
                      <span className="font-bold text-rose-400">✕</span>
                      <span>{settingsPassError}</span>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 space-y-2">
                    <div className="font-semibold text-amber-300 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Master Key Protection Policy</span>
                    </div>
                    <p className="leading-relaxed">
                      To prevent unauthorized changes, only administrators with the confidential master verification key are permitted to change or reset the administrator password. No one without this authorized key and credentials can access or modify administrative privileges.
                    </p>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setSettingsPassError('');
                      setSettingsPassSuccess('');
                      if (settingsMasterKey.trim() !== MASTER_ADMIN_KEY) {
                        setSettingsPassError(
                          'Invalid Master Permission Key. Please provide the authorized master key.'
                        );
                        return;
                      }
                      if (!settingsNewPassword.trim() || settingsNewPassword.trim().length < 6) {
                        setSettingsPassError('New password must be at least 6 characters long.');
                        return;
                      }
                      if (settingsNewPassword !== settingsConfirmPassword) {
                        setSettingsPassError('New password and confirmation do not match.');
                        return;
                      }
                      setSettingsPassLoading(true);
                      try {
                        const res = await changeAdminPassword(
                          settingsMasterKey.trim(),
                          settingsNewPassword.trim()
                        );
                        if (res.success) {
                          setSettingsPassSuccess(
                            'Administrator password successfully updated in Firestore and local security vault!'
                          );
                          setSettingsMasterKey('');
                          setSettingsNewPassword('');
                          setSettingsConfirmPassword('');
                        } else {
                          setSettingsPassError(res.error || 'Failed to update administrator password.');
                        }
                      } catch (err: any) {
                        setSettingsPassError(err.message || 'Failed to update administrator password.');
                      } finally {
                        setSettingsPassLoading(false);
                      }
                    }}
                    className="space-y-4 text-xs"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
                          Master Permission Key *
                        </label>
                        <input
                          type="text"
                          required
                          value={settingsMasterKey}
                          onChange={(e) => setSettingsMasterKey(e.target.value)}
                          placeholder="Enter Master Permission Key"
                          className="w-full p-2.5 rounded-lg border border-slate-700 bg-slate-950 text-white font-mono tracking-wider focus:border-amber-400 focus:outline-hidden"
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Confidential administrator authorization key required
                        </span>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
                          New Admin Password *
                        </label>
                        <div className="relative">
                          <input
                            type={settingsShowPass ? 'text' : 'password'}
                            required
                            value={settingsNewPassword}
                            onChange={(e) => setSettingsNewPassword(e.target.value)}
                            placeholder="Enter new password (min. 6 chars)"
                            className="w-full p-2.5 pr-9 rounded-lg border border-slate-700 bg-slate-950 text-white focus:border-amber-400 focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => setSettingsShowPass(!settingsShowPass)}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                          >
                            {settingsShowPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
                          Confirm New Password *
                        </label>
                        <input
                          type={settingsShowPass ? 'text' : 'password'}
                          required
                          value={settingsConfirmPassword}
                          onChange={(e) => setSettingsConfirmPassword(e.target.value)}
                          placeholder="Re-type new password"
                          className="w-full p-2.5 rounded-lg border border-slate-700 bg-slate-950 text-white focus:border-amber-400 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={settingsPassLoading}
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg uppercase tracking-wider text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>{settingsPassLoading ? 'Updating Password...' : 'Save New Admin Password'}</span>
                      </button>
                    </div>
                  </form>

                  {/* Published Site & Google Auth Domain Guide */}
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                      <LogIn className="w-4 h-4 text-blue-400" />
                      <span>Google Sign-In & Published Site Domain Settings</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-slate-300">Current Site Domain:</span>
                        <code className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-amber-300 text-[11px]">
                          {typeof window !== 'undefined' ? window.location.hostname : 'localhost'}
                        </code>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        To enable Google Sign-In on published sites (e.g. Cloud Run, Vercel, or custom domains), Firebase requires the domain to be listed in Authorized Domains.
                      </p>
                      <div className="p-2.5 rounded bg-blue-950/40 border border-blue-900/60 text-[11px] text-blue-200 space-y-1">
                        <div className="font-semibold text-blue-300">How to authorize your published domain:</div>
                        <ol className="list-decimal list-inside space-y-0.5 text-slate-300">
                          <li>Open <span className="font-mono text-white">Firebase Console &gt; Authentication</span></li>
                          <li>Click the <span className="font-semibold text-white">Settings</span> tab &gt; <span className="font-semibold text-white">Authorized domains</span></li>
                          <li>Click <span className="font-semibold text-white">Add domain</span> and paste: <span className="font-mono text-amber-300">{typeof window !== 'undefined' ? window.location.hostname : 'your-domain'}</span></li>
                        </ol>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        ✨ <em>Note:</em> Administrator ID (<span className="font-mono text-amber-300">Admin123</span>) and password authentication works unconditionally across all environments and does not require domain registration.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: RESET / EDIT STUDENT PASSWORD */}
      {editCredModal.isOpen && editCredModal.cred && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-academic font-bold text-slate-900 text-base">
                    Reset Student Password
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Update student login credential in Admin Vault
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditCredModal({ isOpen: false, cred: null, password: '' })}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student:</span>
                  <strong className="text-slate-900">{editCredModal.cred.studentName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Roll Number:</span>
                  <span className="font-mono font-semibold">{editCredModal.cred.rollNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Unique Login ID:</span>
                  <span className="font-mono text-blue-800 font-semibold">{editCredModal.cred.uniqueId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Course Stream:</span>
                  <span className="font-semibold">{editCredModal.cred.course}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  New Password (Admin Assigned) *
                </label>
                <input
                  type="text"
                  required
                  value={editCredModal.password}
                  onChange={(e) =>
                    setEditCredModal((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Enter new password..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-xs focus:outline-hidden focus:border-blue-600 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditCredModal({ isOpen: false, cred: null, password: '' })}
                  className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!editCredModal.password.trim()) {
                      alert('Password cannot be empty.');
                      return;
                    }
                    const updated: StudentCredential = {
                      ...editCredModal.cred!,
                      password: editCredModal.password.trim(),
                      updatedAt: new Date().toISOString(),
                    };
                    await onSaveCredential(updated);
                    setEditCredModal({ isOpen: false, cred: null, password: '' });
                  }}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition shadow-xs cursor-pointer"
                >
                  Save New Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD STUDENT LOGIN CREDENTIAL */}
      {addCredModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-academic font-bold text-slate-900 text-base">
                    Issue Student Login Credential
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Create unique ID and password record in Admin Vault
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAddCredModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (
                  !addCredModal.studentName.trim() ||
                  !addCredModal.rollNumber.trim() ||
                  !addCredModal.password.trim()
                ) {
                  alert('Student Name, Roll Number, and Password are compulsory.');
                  return;
                }
                const assignedUniqueId =
                  addCredModal.uniqueId.trim() ||
                  addCredModal.rollNumber.trim().toUpperCase();

                const newCred: StudentCredential = {
                  id: assignedUniqueId,
                  uniqueId: assignedUniqueId,
                  studentId: `stu-${Date.now()}`,
                  rollNumber: addCredModal.rollNumber.trim().toUpperCase(),
                  studentName: addCredModal.studentName.trim(),
                  course: addCredModal.course,
                  admissionYear: addCredModal.admissionYear,
                  password: addCredModal.password.trim(),
                  createdAt: new Date().toISOString(),
                };

                await onSaveCredential(newCred);
                setAddCredModal((prev) => ({ ...prev, isOpen: false }));
              }}
              className="space-y-3.5 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={addCredModal.studentName}
                    onChange={(e) =>
                      setAddCredModal((prev) => ({ ...prev, studentName: e.target.value }))
                    }
                    placeholder="e.g. Rahul Sharma"
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Roll Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={addCredModal.rollNumber}
                    onChange={(e) =>
                      setAddCredModal((prev) => ({ ...prev, rollNumber: e.target.value }))
                    }
                    placeholder="e.g. MATH26-045"
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Course / Stream *
                  </label>
                  <select
                    value={addCredModal.course}
                    onChange={(e) =>
                      setAddCredModal((prev) => ({ ...prev, course: e.target.value }))
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs bg-white font-semibold text-blue-900"
                  >
                    <option value="UG NEP">UG NEP (Under Graduate NEP)</option>
                    <option value="UG AEDP">UG AEDP (Under Graduate AEDP)</option>
                    <option value="UG CBCS">UG CBCS (Under Graduate CBCS)</option>
                    <option value="PG">PG (Post Graduate M.Sc)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Joining Year *
                  </label>
                  <select
                    value={addCredModal.admissionYear}
                    onChange={(e) =>
                      setAddCredModal((prev) => ({ ...prev, admissionYear: e.target.value }))
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="2027">2027</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Unique Login ID (Optional, defaults to Roll No)
                  </label>
                  <input
                    type="text"
                    value={addCredModal.uniqueId}
                    onChange={(e) =>
                      setAddCredModal((prev) => ({ ...prev, uniqueId: e.target.value }))
                    }
                    placeholder="Leave blank to use Roll No"
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={addCredModal.password}
                    onChange={(e) =>
                      setAddCredModal((prev) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder="e.g. Math@2026#User"
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAddCredModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition shadow-xs cursor-pointer"
                >
                  Save Student Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Faculty Photo Import Modal (Drive / Computer) */}
      <FacultyPhotoModal
        isOpen={!!photoFacultyModal}
        faculty={photoFacultyModal}
        onSave={async (id, newPhotoUrl) => {
          if (onUpdateFacultyPhoto) {
            await onUpdateFacultyPhoto(id, newPhotoUrl);
          } else {
            const target = faculty.find((f) => f.id === id);
            if (target) {
              await saveFacultyMember({ ...target, photoUrl: newPhotoUrl });
            }
          }
        }}
        onClose={() => setPhotoFacultyModal(null)}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  CloudUpload,
  CloudDownload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  ExternalLink,
  ShieldCheck,
  Database,
  Lock,
  Download,
  Users,
  GraduationCap,
  KeyRound,
  BookMarked,
  Calendar,
  FileQuestion,
  BookOpen,
  Building2,
  Bell,
  Scale,
  PhoneCall,
  Mail,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  DepartmentBackupData,
  DriveFileInfo,
  BACKUP_FILE_NAME,
  findDriveBackupFile,
  syncBackupToGoogleDrive,
  downloadBackupFromGoogleDrive,
  restoreAllDataToFirestore,
} from '../services/driveBackup';
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
} from '../types';

interface DriveBackupTabProps {
  faculty: Faculty[];
  students: Student[];
  credentials: StudentCredential[];
  syllabuses: Syllabus[];
  timeTable: TimeTableSlot[];
  pyq: QuestionPaper[];
  books: Book[];
  facilities: Facility[];
  galleryPhotos?: GalleryPhoto[];
  notices: Notice[];
  committees: Committee[];
  contacts: ImportantContact[];
  inquiries: ContactMessage[];
  settings?: DepartmentSettings;
  onRestoreSuccess?: () => void;
}

export const DriveBackupTab: React.FC<DriveBackupTabProps> = ({
  faculty,
  students,
  credentials,
  syllabuses,
  timeTable,
  pyq,
  books,
  facilities,
  galleryPhotos = [],
  notices,
  committees,
  contacts,
  inquiries,
  settings,
  onRestoreSuccess,
}) => {
  const { user, connectGoogleDrive, getDriveToken } = useAuth();
  const [driveToken, setDriveToken] = useState<string | null>(getDriveToken());
  const [driveFile, setDriveFile] = useState<DriveFileInfo | null>(null);
  const [isCheckingDrive, setIsCheckingDrive] = useState(false);

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Restore Confirmation Modal
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // Check Drive for existing backup when token changes
  useEffect(() => {
    const token = getDriveToken();
    setDriveToken(token);
    if (token) {
      checkDriveStatus(token);
    }
  }, [user]);

  const checkDriveStatus = async (token: string) => {
    try {
      setIsCheckingDrive(true);
      const file = await findDriveBackupFile(token);
      setDriveFile(file);
    } catch (err: any) {
      console.warn('Drive file check note:', err);
    } finally {
      setIsCheckingDrive(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      setIsConnecting(true);
      setStatusMessage(null);
      const token = await connectGoogleDrive();
      setDriveToken(token);
      await checkDriveStatus(token);
      setStatusMessage({
        type: 'success',
        text: 'Google Drive successfully connected and authorized.',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to connect Google account. Please try again.',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const prepareBackupPayload = (): DepartmentBackupData => {
    return {
      version: '2.0',
      backupDate: new Date().toISOString(),
      departmentName: 'Department of Mathematics',
      collegeName: 'Panchayat College, Baragada',
      data: {
        credentials,
        faculty,
        students,
        syllabuses,
        timeTable,
        pyq,
        books,
        facilities,
        galleryPhotos,
        notices,
        committees,
        contacts,
        inquiries,
        settings,
      },
    };
  };

  // Perform Backup / Sync
  const handleBackup = async () => {
    setStatusMessage(null);
    let token = driveToken || getDriveToken();
    if (!token) {
      try {
        setIsConnecting(true);
        token = await connectGoogleDrive();
        setDriveToken(token);
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: 'Google authentication required before backing up to Drive.',
        });
        setIsConnecting(false);
        return;
      } finally {
        setIsConnecting(false);
      }
    }

    try {
      setIsBackingUp(true);
      const payload = prepareBackupPayload();
      const result = await syncBackupToGoogleDrive(token, payload);
      await checkDriveStatus(token);
      setStatusMessage({
        type: 'success',
        text: result.isNew
          ? 'Full department database successfully created and synced to Google Drive!'
          : 'Google Drive backup successfully updated with latest live department records!',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Backup failed: ${err?.message || 'Unknown network error'}`,
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  // Confirm and Execute Restore
  const handleConfirmRestore = async () => {
    setShowRestoreModal(false);
    setStatusMessage(null);
    let token = driveToken || getDriveToken();
    if (!token) {
      try {
        setIsConnecting(true);
        token = await connectGoogleDrive();
        setDriveToken(token);
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: 'Google authentication required to download Drive backup.',
        });
        setIsConnecting(false);
        return;
      } finally {
        setIsConnecting(false);
      }
    }

    try {
      setIsRestoring(true);
      const existingFile = await findDriveBackupFile(token);
      if (!existingFile) {
        setStatusMessage({
          type: 'error',
          text: 'No backup file named "math_dept_database_backup.json" found in your Google Drive. Click "Backup to Drive" first to create one.',
        });
        return;
      }

      const backup = await downloadBackupFromGoogleDrive(token, existingFile.id);
      const { counts } = await restoreAllDataToFirestore(backup);

      setStatusMessage({
        type: 'success',
        text: `Data successfully restored from Google Drive! Restored ${counts.credentials} Student Passwords, ${counts.faculty} Faculty, ${counts.students} Students, ${counts.timeTable} Timetable slots, ${counts.syllabuses} Syllabi, ${counts.pyq} PYQs, ${counts.books} Books, ${counts.facilities} Photos, ${counts.notices} Notices, ${counts.committees} Committees, and ${counts.contacts} Directory entries.`,
      });

      if (onRestoreSuccess) {
        onRestoreSuccess();
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Restore failed: ${err?.message || 'Unknown network error'}`,
      });
    } finally {
      setIsRestoring(false);
    }
  };

  // Offline JSON Download safety net
  const handleDownloadLocalCopy = () => {
    const payload = prepareBackupPayload();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `math_dept_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const recordMetrics = [
    { label: 'Student IDs & Passwords', count: credentials?.length || 0, icon: KeyRound, color: 'text-amber-600 bg-amber-50' },
    { label: 'Faculty Members', count: faculty.length, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Students Directory', count: students.length, icon: GraduationCap, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Course Syllabi', count: syllabuses.length, icon: BookMarked, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Time Table Periods', count: timeTable.length, icon: Calendar, color: 'text-sky-600 bg-sky-50' },
    { label: 'Question Papers (PYQ)', count: pyq.length, icon: FileQuestion, color: 'text-purple-600 bg-purple-50' },
    { label: 'Library Books', count: books.length, icon: BookOpen, color: 'text-teal-600 bg-teal-50' },
    { label: 'Showcase Photos', count: facilities.length, icon: Building2, color: 'text-rose-600 bg-rose-50' },
    { label: 'Official Notices', count: notices.length, icon: Bell, color: 'text-amber-600 bg-amber-50' },
    { label: 'Committees', count: committees.length, icon: Scale, color: 'text-violet-600 bg-violet-50' },
    { label: 'Directory Contacts', count: contacts.length, icon: PhoneCall, color: 'text-cyan-600 bg-cyan-50' },
    { label: 'Inquiries Received', count: inquiries.length, icon: Mail, color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0c2340] to-[#173a66] rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold border border-amber-400/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Official Google Drive Cloud Backup & Restore</span>
          </div>
          <h2 className="font-serif-academic text-2xl font-bold tracking-tight">
            Google Drive Synchronizer
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Backup and restore your entire department database directly to and from your personal Google Drive account.
            When you click backup, current records are synced into <code className="text-amber-300 font-mono text-[11px] bg-white/10 px-1 py-0.5 rounded">{BACKUP_FILE_NAME}</code>.
          </p>
        </div>

        {/* Google Connection Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex flex-col gap-3 min-w-[280px]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Google Drive Status:</span>
            {driveToken || user ? (
              <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                Not Connected
              </span>
            )}
          </div>

          {user?.email && (
            <div className="text-[11px] text-slate-200 truncate font-mono bg-black/20 px-2.5 py-1 rounded">
              Account: {user.email}
            </div>
          )}

          {/* Official Google Sign-In Styled Button if not connected or reconnect */}
          {(!driveToken || !user) && (
            <button
              onClick={handleConnectGoogle}
              disabled={isConnecting}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg py-2 px-3 flex items-center justify-center gap-2.5 text-xs font-medium shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isConnecting ? 'Authorizing Drive...' : 'Sign in with Google'}</span>
            </button>
          )}

          {driveToken && (
            <button
              onClick={handleConnectGoogle}
              disabled={isConnecting}
              className="text-[11px] text-slate-300 hover:text-white underline text-left transition"
            >
              Switch or Re-authorize Google Account
            </button>
          )}
        </div>
      </div>

      {/* Status Alert Notification */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-medium border flex items-start gap-3 transition ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-300'
              : 'bg-blue-50 text-blue-900 border-blue-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 leading-relaxed">{statusMessage.text}</div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-700 text-xs ml-2 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Action Center Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Backup Button Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
                <CloudUpload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Backup to Google Drive</h3>
                <p className="text-[11px] text-slate-500">Sync current live records to Google Drive</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mt-2">
              Exports all 12 modules into your Google Drive under <span className="font-mono font-medium text-slate-800">{BACKUP_FILE_NAME}</span>. If the file already exists, it is automatically updated in-place.
            </p>
          </div>

          <button
            onClick={handleBackup}
            disabled={isBackingUp || isRestoring}
            className="w-full py-3 px-4 bg-[#0c2340] hover:bg-[#143966] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm disabled:opacity-60"
          >
            <CloudUpload className={`w-4 h-4 ${isBackingUp ? 'animate-bounce' : ''}`} />
            <span>{isBackingUp ? 'Syncing to Google Drive...' : 'Backup to Google Drive'}</span>
          </button>
        </div>

        {/* Restore Button Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <CloudDownload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Restore from Google Drive</h3>
                <p className="text-[11px] text-slate-500">Retrieve and apply saved backup</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mt-2">
              Downloads your saved <span className="font-mono font-medium text-slate-800">{BACKUP_FILE_NAME}</span> from Google Drive and updates Firestore so all changes immediately propagate.
            </p>
          </div>

          <button
            onClick={() => setShowRestoreModal(true)}
            disabled={isBackingUp || isRestoring}
            className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm disabled:opacity-60"
          >
            <CloudDownload className={`w-4 h-4 ${isRestoring ? 'animate-bounce' : ''}`} />
            <span>{isRestoring ? 'Restoring from Drive...' : 'Restore from Google Drive'}</span>
          </button>
        </div>
      </div>

      {/* Drive File Metadata & Status */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-700 shadow-2xs">
            <FileJson className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-900">{BACKUP_FILE_NAME}</span>
              {driveFile ? (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Synced in Drive
                </span>
              ) : (
                <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                  Not Synced Yet
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {driveFile?.modifiedTime
                ? `Last modified in Drive: ${new Date(driveFile.modifiedTime).toLocaleString()}`
                : 'No existing file detected in connected Google Drive. Click "Backup to Google Drive" to sync.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {driveFile?.webViewLink && (
            <a
              href={driveFile.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <span>View in Drive</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          )}

          <button
            onClick={handleDownloadLocalCopy}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Download a local JSON copy to your computer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download Local Copy</span>
          </button>
        </div>
      </div>

      {/* Grid of All 12 Collections Included in Backup */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" />
            <span>Records Included in Backup & Sync ({recordMetrics.reduce((acc, m) => acc + m.count, 0)} total entries)</span>
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {recordMetrics.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center gap-3 shadow-2xs"
              >
                <div className={`p-2.5 rounded-lg shrink-0 ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-base font-bold text-slate-900 leading-tight">
                    {item.count}
                  </div>
                  <div className="text-[11px] text-slate-600 truncate font-medium">
                    {item.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RESTORE CONFIRMATION MODAL (Mandatory for destructive/modifying operations) */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif-academic text-lg font-bold text-slate-900">
                  Confirm Database Restore from Google Drive
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to restore all department records from your Google Drive backup file?
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-2 leading-relaxed">
              <p className="font-semibold">This action will sync and overwrite database records with the saved Drive backup:</p>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                <li>Student ID & Passwords credentials</li>
                <li>Faculty and student directories</li>
                <li>Master timetable schedule & periods</li>
                <li>Question papers, books, and course syllabi</li>
                <li>Notices, committees, directory contacts & inquiries</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRestoreModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm flex items-center gap-2"
              >
                <CloudDownload className="w-4 h-4" />
                <span>Confirm & Restore from Drive</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

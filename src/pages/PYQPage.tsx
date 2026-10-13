import React, { useState, useMemo } from 'react';
import {
  FileQuestion,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Download,
  Eye,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  Shield,
  KeyRound,
  GraduationCap,
  Building2,
  CheckCircle2,
  AlertCircle,
  Upload,
  Lock,
  Unlock,
  EyeOff,
  RefreshCw,
  BookOpen,
  PlusCircle,
  Check,
} from 'lucide-react';
import { QuestionPaper, DepartmentSettings, Student, StudentCredential } from '../types';
import { useAuth } from '../context/AuthContext';
import { loginStudentPortal, updateDepartmentSettings } from '../services/db';

interface PYQPageProps {
  papers: QuestionPaper[];
  onSelectPaper: (paper: QuestionPaper) => void;
  onAddPaper?: () => void;
  onEditPaper: (paper: QuestionPaper) => void;
  onDeletePaper: (id: string, title: string) => void;
  onSavePaper: (paper: QuestionPaper) => Promise<void>;
  settings?: DepartmentSettings;
  onUpdateSettings?: (settings: Partial<DepartmentSettings>) => Promise<void>;
  students?: Student[];
  credentials?: StudentCredential[];
  onOpenAdminLogin?: () => void;
}

const DEFAULT_SUBJECTS = [
  'Calculus',
  'Algebra',
  'Real Analysis',
  'Differential Equations',
  'Numerical Methods',
  'Complex Analysis',
  'Linear Algebra',
  'Probability & Statistics',
  'Discrete Mathematics',
  'Topology',
  'Mathematical Physics',
  'Operations Research',
];

export const PYQPage: React.FC<PYQPageProps> = ({
  papers,
  onSelectPaper,
  onAddPaper,
  onEditPaper,
  onDeletePaper,
  onSavePaper,
  settings,
  onUpdateSettings,
  students = [],
  credentials = [],
  onOpenAdminLogin,
}) => {
  const { isAdmin } = useAuth();

  // Active Sub-Tab: 'browse' or 'add'
  const [activeSubTab, setActiveSubTab] = useState<'browse' | 'add'>('browse');

  // Filter States
  const [selectedCourse, setSelectedCourse] = useState<'All' | 'UG' | 'PG'>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedSemester, setSelectedSemester] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Expandable Subject List
  const [availableSubjects, setAvailableSubjects] = useState<string[]>(() => {
    const set = new Set<string>(DEFAULT_SUBJECTS);
    papers.forEach((p) => {
      if (p.subject) set.add(p.subject);
    });
    return Array.from(set);
  });
  const [newCustomSubjectInput, setNewCustomSubjectInput] = useState('');
  const [isAddingOtherSubject, setIsAddingOtherSubject] = useState(false);

  // Available sessions from papers
  const availableYears = useMemo(() => {
    const set = new Set<string>(['2025–26', '2024–25', '2023–24', '2022–23']);
    papers.forEach((p) => {
      if (p.academicYear) set.add(p.academicYear);
    });
    return Array.from(set).sort().reverse();
  }, [papers]);

  // Security Code state (visible & editable ONLY by Admin)
  const currentSecurityCode = settings?.pyqUploadCode || 'Mathematics';
  const [isEditingSecurityCode, setIsEditingSecurityCode] = useState(false);
  const [securityCodeInput, setSecurityCodeInput] = useState(currentSecurityCode);
  const [securityCodeSaveMsg, setSecurityCodeSaveMsg] = useState('');

  // Student Authentication form state for upload
  const [studentLoginId, setStudentLoginId] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentSecurityCode, setStudentSecurityCode] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [studentAuthError, setStudentAuthError] = useState('');
  const [verifiedStudent, setVerifiedStudent] = useState<{
    id: string;
    name: string;
    rollNumber: string;
    course: string;
    admissionBatch: string;
  } | null>(null);
  const [isVerifyingStudent, setIsVerifyingStudent] = useState(false);

  // New Question Paper form state
  const [paperTitle, setPaperTitle] = useState('');
  const [paperCourse, setPaperCourse] = useState<'UG' | 'PG'>('UG');
  const [paperSubject, setPaperSubject] = useState('Calculus');
  const [paperCode, setPaperCode] = useState('MATH-CC-101');
  const [paperAcademicYear, setPaperAcademicYear] = useState('2025–26');
  const [paperSemester, setPaperSemester] = useState('Semester I');
  const [paperYearLevel, setPaperYearLevel] = useState('1st Year');
  const [paperExamination, setPaperExamination] = useState('Semester End Examination (CBCS)');
  const [paperFileUrl, setPaperFileUrl] = useState('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
  const [paperFileSize, setPaperFileSize] = useState('320 KB');
  const [fileCompressionNotice, setFileCompressionNotice] = useState('');
  const [fileUploadError, setFileUploadError] = useState('');
  const [isSubmittingPaper, setIsSubmittingPaper] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');

  // Filtered papers logic
  const filteredPapers = papers.filter((p) => {
    // Course filter
    const paperCourseDerived = p.course || (p.title.toLowerCase().includes('pg') ? 'PG' : 'UG');
    const matchCourse = selectedCourse === 'All' || paperCourseDerived === selectedCourse;

    // Academic Year filter
    const matchYear = selectedYear === 'All' || p.academicYear === selectedYear;

    // Semester filter
    const matchSem = selectedSemester === 'All' || p.semester === selectedSemester;

    // Subject filter
    const matchSubj = selectedSubject === 'All' || p.subject.toLowerCase() === selectedSubject.toLowerCase();

    // Search query
    const term = searchTerm.toLowerCase().trim();
    const matchSearch =
      !term ||
      p.title.toLowerCase().includes(term) ||
      p.paperCode.toLowerCase().includes(term) ||
      p.examination.toLowerCase().includes(term) ||
      (p.uploaderName && p.uploaderName.toLowerCase().includes(term));

    return matchCourse && matchYear && matchSem && matchSubj && matchSearch;
  });

  // Handle Admin Saving New Security Code
  const handleSaveSecurityCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = securityCodeInput.trim();
    if (!clean) return;
    try {
      if (onUpdateSettings) {
        await onUpdateSettings({ pyqUploadCode: clean });
      } else {
        await updateDepartmentSettings({ pyqUploadCode: clean });
      }
      setIsEditingSecurityCode(false);
      setSecurityCodeSaveMsg(`Security code successfully updated!`);
      setTimeout(() => setSecurityCodeSaveMsg(''), 4000);
    } catch {
      alert('Failed to update upload security code.');
    }
  };

  // Helper to resolve student admission batch
  const deriveAdmissionBatch = (student: Student): string => {
    if (student.admissionYear) {
      const yearNum = parseInt(student.admissionYear, 10);
      if (!isNaN(yearNum)) {
        const isPg = student.course?.toLowerCase().includes('pg');
        const endYear = isPg ? yearNum + 2 : yearNum + 4;
        return `${yearNum} Admission Batch (${yearNum}–${endYear})`;
      }
      return `${student.admissionYear} Admission Batch`;
    }
    if (student.academicYear) {
      return `${student.academicYear} Batch`;
    }
    return 'Regular Batch';
  };

  // Handle Adding New Subject
  const handleAddCustomSubject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newCustomSubjectInput.trim();
    if (!clean) return;

    if (!availableSubjects.includes(clean)) {
      setAvailableSubjects((prev) => [...prev, clean]);
    }
    setPaperSubject(clean);
    setNewCustomSubjectInput('');
    setIsAddingOtherSubject(false);
  };

  // Handle Student Verification (NO security code revealed in error)
  const handleVerifyStudent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStudentAuthError('');

    const cleanId = studentLoginId.trim();
    const cleanPass = studentPassword.trim();
    const cleanCode = studentSecurityCode.trim();

    if (!cleanId) {
      setStudentAuthError('Please enter your Student ID or Roll Number.');
      return false;
    }
    if (!cleanPass) {
      setStudentAuthError('Please enter your Student Portal Password.');
      return false;
    }
    if (!cleanCode) {
      setStudentAuthError('Please enter the upload security code provided by the department.');
      return false;
    }

    // Verify security code (DO NOT reveal what the code is)
    const requiredCode = (settings?.pyqUploadCode || 'Mathematics').trim();
    if (cleanCode.toLowerCase() !== requiredCode.toLowerCase()) {
      setStudentAuthError(
        'Incorrect upload security code. Please enter the valid security code provided by your department faculty or administrator.'
      );
      return false;
    }

    setIsVerifyingStudent(true);
    try {
      // 1. Try Firestore loginStudentPortal
      const res = await loginStudentPortal(cleanId, cleanPass);
      if (res.success && res.student) {
        const batch = deriveAdmissionBatch(res.student);
        setVerifiedStudent({
          id: res.student.id,
          name: res.student.name,
          rollNumber: res.student.rollNumber || res.student.uniqueId || cleanId,
          course: res.student.course,
          admissionBatch: batch,
        });
        setStudentAuthError('');
        setIsVerifyingStudent(false);
        return true;
      }

      // 2. Fallback check against local credentials & students props
      const foundCred = credentials.find(
        (c) =>
          (c.uniqueId?.toLowerCase() === cleanId.toLowerCase() ||
            c.rollNumber?.toLowerCase() === cleanId.toLowerCase() ||
            c.id?.toLowerCase() === cleanId.toLowerCase()) &&
          c.password === cleanPass
      );

      if (foundCred) {
        const linkedStudent = students.find(
          (s) =>
            s.id === foundCred.studentId ||
            s.rollNumber?.toLowerCase() === foundCred.rollNumber?.toLowerCase() ||
            s.uniqueId?.toLowerCase() === foundCred.uniqueId?.toLowerCase()
        );

        const name = linkedStudent?.name || foundCred.studentName || 'Department Student';
        const course = linkedStudent?.course || foundCred.course || 'UG';
        const batch = linkedStudent
          ? deriveAdmissionBatch(linkedStudent)
          : `${foundCred.admissionYear || '2024'} Admission Batch`;

        setVerifiedStudent({
          id: foundCred.studentId || foundCred.id,
          name,
          rollNumber: foundCred.rollNumber || cleanId,
          course,
          admissionBatch: batch,
        });
        setStudentAuthError('');
        setIsVerifyingStudent(false);
        return true;
      }

      setStudentAuthError(
        res.error || 'Student credentials not found or incorrect password. Please check your Student ID and Password.'
      );
      setIsVerifyingStudent(false);
      return false;
    } catch (err: any) {
      setStudentAuthError(err?.message || 'Authentication failed. Please verify credentials.');
      setIsVerifyingStudent(false);
      return false;
    }
  };

  // Handle File Upload from Local Device with max 500 KB limit & compression
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileCompressionNotice('');
    setFileUploadError('');
    const MAX_SIZE_BYTES = 500 * 1024; // 500 KB

    // If it's an image scan of the question paper, auto-compress if > 500 KB
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          let quality = 0.85;

          const maxDim = 1500;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            let dataUrl = canvas.toDataURL('image/jpeg', quality);
            let byteSize = Math.round((dataUrl.length * 3) / 4);

            while (byteSize > MAX_SIZE_BYTES && quality > 0.25) {
              quality -= 0.15;
              dataUrl = canvas.toDataURL('image/jpeg', quality);
              byteSize = Math.round((dataUrl.length * 3) / 4);
            }

            const finalKb = Math.round(byteSize / 1024);
            setPaperFileUrl(dataUrl);
            setPaperFileSize(`${finalKb} KB`);
            setFileCompressionNotice(`Image scan successfully optimized to ${finalKb} KB (within 500 KB limit).`);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
      return;
    }

    // For PDF files:
    if (file.size > MAX_SIZE_BYTES) {
      setFileUploadError(
        `Selected PDF is ${Math.round(file.size / 1024)} KB, which exceeds the maximum limit of 500 KB. Please compress your PDF to 500 KB or less before uploading, or upload as a photo/scan which is auto-compressed.`
      );
      e.target.value = '';
      return;
    }

    // File is within 500 KB limit
    const sizeFormatted = `${Math.round(file.size / 1024)} KB`;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPaperFileUrl(reader.result);
        setPaperFileSize(sizeFormatted);
        setFileCompressionNotice(`Document accepted: ${sizeFormatted} (within 500 KB limit).`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Final Submission of Question Paper
  const handleSubmitQuestionPaper = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadSuccessMsg('');

    if (!paperTitle.trim()) {
      alert('Please enter the question paper title.');
      return;
    }
    if (!paperCode.trim()) {
      alert('Please enter the paper code (e.g. MATH-CC-101).');
      return;
    }
    if (!paperFileUrl.trim()) {
      alert('Please provide a PDF file or link.');
      return;
    }

    // If not admin, verify student authentication first
    let studentData = verifiedStudent;
    if (!isAdmin) {
      if (!studentData) {
        const verified = await handleVerifyStudent();
        if (!verified) return;
        studentData = verifiedStudent;
      }
    }

    setIsSubmittingPaper(true);
    try {
      const newId = `pyq-${Date.now()}`;

      // User rules:
      // - Admin: role is 'admin', uploaderName is NOT shown (undefined), uploaderBatch is undefined.
      // - Student: role is 'student', show student name and admission batch to the public!
      const newPaper: QuestionPaper = {
        id: newId,
        title: paperTitle.trim(),
        subject: paperSubject,
        course: paperCourse,
        paperCode: paperCode.trim().toUpperCase(),
        academicYear: paperAcademicYear,
        semester: paperSemester,
        yearLevel: paperYearLevel,
        examination: paperExamination.trim(),
        fileUrl: paperFileUrl.trim(),
        fileSize: paperFileSize || '350 KB',
        uploadedByRole: isAdmin ? 'admin' : 'student',
        uploaderName: isAdmin ? undefined : studentData?.name,
        uploaderBatch: isAdmin ? undefined : studentData?.admissionBatch,
        uploaderStudentId: isAdmin ? undefined : studentData?.rollNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSavePaper(newPaper);

      setUploadSuccessMsg(
        isAdmin
          ? `Question paper "${newPaper.title}" successfully published by Department of Mathematics!`
          : `Question paper "${newPaper.title}" successfully contributed by ${studentData?.name} (${studentData?.admissionBatch})!`
      );

      // Reset form
      setPaperTitle('');
      setPaperCode('MATH-CC-101');
      setPaperExamination('Semester End Examination (CBCS)');
      setIsSubmittingPaper(false);

      // Switch to browse after a short delay
      setTimeout(() => {
        setActiveSubTab('browse');
        setUploadSuccessMsg('');
      }, 2500);
    } catch (err: any) {
      console.error('Error submitting paper:', err);
      alert('Error saving question paper. Please try again.');
      setIsSubmittingPaper(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-900 border border-indigo-200 text-xs font-bold uppercase tracking-wider">
              <FileQuestion className="w-3.5 h-3.5 text-indigo-700" />
              <span>Academic Repository</span>
            </div>
            <h1 className="font-serif-academic text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0c2340]">
              Previous Year Question Papers
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Archived Sambalpur University CBCS examination question papers for UG and PG Mathematics programs. Anyone can view or download question papers freely.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              onClick={() => setActiveSubTab('browse')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
                activeSubTab === 'browse'
                  ? 'bg-[#0c2340] text-amber-300 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Browse Repository ({papers.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('add')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
                activeSubTab === 'add'
                  ? 'bg-amber-500 text-slate-950 shadow-sm ring-2 ring-amber-400'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{isAdmin ? 'Add Paper (Admin)' : 'Add Question Paper'}</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SUB-TAB 1: ADD QUESTION PAPER TAB                        */}
        {/* ======================================================== */}
        {activeSubTab === 'add' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Description & Security Code (Admin Only) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Academic Paper Deposit</span>
                  </div>
                  <h2 className="font-serif-academic text-xl font-bold text-[#0c2340]">
                    Upload & Add Question Paper
                  </h2>
                  <p className="text-xs text-slate-600 max-w-2xl mt-1">
                    Department administrators can add papers directly. Students can deposit university question papers using their Student ID, password, and the departmental security code. Maximum file size is 500 KB.
                  </p>
                </div>

                {/* Security Code Manager - ONLY VISIBLE TO LOGGED IN ADMIN */}
                {isAdmin && (
                  <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-3.5 sm:p-4 text-xs space-y-2 lg:min-w-[320px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-amber-950 flex items-center gap-1.5">
                        <KeyRound className="w-4 h-4 text-amber-700" />
                        <span>Security Code (Admin Only)</span>
                      </span>
                      <button
                        onClick={() => {
                          setIsEditingSecurityCode(!isEditingSecurityCode);
                          setSecurityCodeInput(currentSecurityCode);
                        }}
                        className="text-[11px] font-bold text-indigo-700 hover:underline cursor-pointer"
                      >
                        {isEditingSecurityCode ? 'Cancel' : 'Change Code'}
                      </button>
                    </div>

                    {isEditingSecurityCode ? (
                      <form onSubmit={handleSaveSecurityCode} className="space-y-2 pt-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            required
                            value={securityCodeInput}
                            onChange={(e) => setSecurityCodeInput(e.target.value)}
                            placeholder="Enter new code"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold focus:outline-hidden"
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded text-xs font-bold shrink-0 cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Students will need this code to upload papers. It is hidden from the public.
                        </p>
                      </form>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-600">Active Code:</span>
                          <span className="px-2 py-0.5 rounded bg-white text-slate-900 border border-amber-300 font-mono font-bold text-xs">
                            {currentSecurityCode}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          🔒 Hidden from public site. Only you can view or change this code.
                        </p>
                      </div>
                    )}

                    {securityCodeSaveMsg && (
                      <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{securityCodeSaveMsg}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Status Banner */}
              {isAdmin ? (
                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start gap-3">
                  <Shield className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-emerald-950 flex items-center gap-2">
                      <span>Admin Mode Active (Logged in as Administrator)</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-bold">
                        No login required
                      </span>
                    </div>
                    <p className="text-emerald-800 leading-relaxed">
                      You are authenticated as department administrator. You can add question papers directly below without entering student credentials.
                    </p>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      🔒 Official Attribution: Your personal name is <strong>not</strong> displayed to the public; papers will display as <strong>"Department of Mathematics"</strong>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <GraduationCap className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-indigo-950">
                        Student Upload Authentication
                      </div>
                      <p className="text-indigo-800 leading-relaxed">
                        To maintain academic repository integrity, students must authenticate with their <strong>Student ID</strong>, <strong>Student Portal Password</strong>, and the <strong>Upload Security Code</strong> provided by the department.
                      </p>
                      <p className="text-[11px] text-indigo-700 font-medium">
                        ⭐ Public Recognition: Your <strong>Full Name</strong> and <strong>Admission Batch</strong> will be prominently showcased on your published paper!
                      </p>
                    </div>
                  </div>

                  {onOpenAdminLogin && (
                    <button
                      type="button"
                      onClick={onOpenAdminLogin}
                      className="px-3.5 py-1.5 rounded-lg bg-white border border-indigo-300 hover:bg-indigo-100 text-indigo-900 text-xs font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer shadow-2xs self-start md:self-center"
                    >
                      <Lock className="w-3.5 h-3.5 text-indigo-700" />
                      <span>Are you Admin? Log In</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* If NOT Admin, Show Student Verification Form (NO security code revealed) */}
            {!isAdmin && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif-academic text-base font-bold text-[#0c2340] flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-700" />
                    <span>Step 1: Student Verification</span>
                  </h3>
                  {verifiedStudent && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Student Verified</span>
                    </span>
                  )}
                </div>

                {verifiedStudent ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-emerald-950 text-sm">
                        {verifiedStudent.name}
                      </div>
                      <div className="text-emerald-800 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                        <span>
                          <strong>Roll No / ID:</strong> {verifiedStudent.rollNumber}
                        </span>
                        <span>
                          <strong>Batch:</strong> {verifiedStudent.admissionBatch}
                        </span>
                        <span>
                          <strong>Course:</strong> {verifiedStudent.course}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-700 italic pt-1">
                        ✓ Your name and admission batch will be displayed to the public on this question paper.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setVerifiedStudent(null);
                        setStudentPassword('');
                        setStudentSecurityCode('');
                      }}
                      className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
                    >
                      Change Student
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                          Student ID / Roll No *
                        </label>
                        <input
                          type="text"
                          required
                          value={studentLoginId}
                          onChange={(e) => setStudentLoginId(e.target.value)}
                          placeholder="e.g. MATH24-001 or MATH25-011"
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                          Student Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showStudentPassword ? 'text' : 'password'}
                            required
                            value={studentPassword}
                            onChange={(e) => setStudentPassword(e.target.value)}
                            placeholder="Enter portal password"
                            className="w-full p-2.5 pr-9 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => setShowStudentPassword(!showStudentPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                          Upload Security Code *
                        </label>
                        <input
                          type="password"
                          required
                          value={studentSecurityCode}
                          onChange={(e) => setStudentSecurityCode(e.target.value)}
                          placeholder="Enter security code provided by department"
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-1">
                      <p className="text-[11px] text-slate-500">
                        Please obtain the upload security code from your mathematics department teacher or office.
                      </p>
                      <button
                        type="button"
                        disabled={isVerifyingStudent}
                        onClick={() => handleVerifyStudent()}
                        className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        {isVerifyingStudent ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verify My Student Credentials</span>
                          </>
                        )}
                      </button>
                    </div>

                    {studentAuthError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{studentAuthError}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Question Paper Details Form */}
            <form
              onSubmit={handleSubmitQuestionPaper}
              className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5 text-xs"
            >
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-serif-academic text-base font-bold text-[#0c2340] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>{isAdmin ? 'Question Paper Details' : 'Step 2: Question Paper Details'}</span>
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Select program course (UG or PG), subject, examination session, and attach the PDF (maximum 500 KB).
                </p>
              </div>

              {/* COURSE TAB / RADIO (UG vs PG) */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5 text-[11px]">
                  Program / Course Level *
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPaperCourse('UG');
                      setPaperYearLevel('1st Year');
                      setPaperSemester('Semester I');
                    }}
                    className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                      paperCourse === 'UG'
                        ? 'bg-[#0c2340] text-amber-300 border-[#0c2340] shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>Undergraduate (UG) - B.Sc. (Hons) Mathematics</span>
                    {paperCourse === 'UG' && <Check className="w-4 h-4 text-amber-300" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaperCourse('PG');
                      setPaperYearLevel('1st Year');
                      setPaperSemester('Semester I');
                    }}
                    className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                      paperCourse === 'PG'
                        ? 'bg-[#0c2340] text-amber-300 border-[#0c2340] shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>Postgraduate (PG) - M.Sc. Mathematics</span>
                    {paperCourse === 'PG' && <Check className="w-4 h-4 text-amber-300" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                  Paper Title / Name *
                </label>
                <input
                  type="text"
                  required
                  value={paperTitle}
                  onChange={(e) => setPaperTitle(e.target.value)}
                  placeholder={
                    paperCourse === 'UG'
                      ? 'e.g. Core Course 1: Calculus and Analytical Geometry'
                      : 'e.g. PG Course 1: Advanced Complex Analysis & Conformal Mappings'
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
                />
              </div>

              {/* SUBJECT WITH 'OTHER' OPTION TO ADD MORE SUBJECTS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 uppercase text-[11px]">
                      Subject *
                    </label>
                    {!isAddingOtherSubject && (
                      <button
                        type="button"
                        onClick={() => setIsAddingOtherSubject(true)}
                        className="text-[11px] text-indigo-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <PlusCircle className="w-3 h-3" />
                        <span>Add Subject</span>
                      </button>
                    )}
                  </div>

                  {!isAddingOtherSubject ? (
                    <select
                      value={paperSubject}
                      onChange={(e) => {
                        if (e.target.value === '__OTHER__') {
                          setIsAddingOtherSubject(true);
                        } else {
                          setPaperSubject(e.target.value);
                        }
                      }}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden bg-white"
                    >
                      {availableSubjects.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                      <option value="__OTHER__">+ Other (Add New Subject...)</option>
                    </select>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          required
                          value={newCustomSubjectInput}
                          onChange={(e) => setNewCustomSubjectInput(e.target.value)}
                          placeholder="Type new subject name (e.g. Topology)"
                          className="w-full p-2.5 rounded-lg border border-indigo-300 text-xs focus:outline-hidden bg-indigo-50/30"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddCustomSubject()}
                          className="px-3 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingOtherSubject(false)}
                          className="px-2.5 py-2.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs text-slate-600 shrink-0 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        This subject will be added to the departmental subjects list and selected.
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                    Paper Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={paperCode}
                    onChange={(e) => setPaperCode(e.target.value)}
                    placeholder={paperCourse === 'UG' ? 'e.g. MATH-CC-101' : 'e.g. MATH-PG-101'}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                    Academic Session / Year *
                  </label>
                  <select
                    value={paperAcademicYear}
                    onChange={(e) => setPaperAcademicYear(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden bg-white font-mono"
                  >
                    <option value="2025–26">2025–26</option>
                    <option value="2024–25">2024–25</option>
                    <option value="2023–24">2023–24</option>
                    <option value="2022–23">2022–23</option>
                    <option value="2021–22">2021–22</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                    Year Level *
                  </label>
                  <select
                    value={paperYearLevel}
                    onChange={(e) => setPaperYearLevel(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden bg-white"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    {paperCourse === 'UG' && <option value="3rd Year">3rd Year</option>}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                    Semester *
                  </label>
                  <select
                    value={paperSemester}
                    onChange={(e) => setPaperSemester(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden bg-white"
                  >
                    <option value="Semester I">Semester I</option>
                    <option value="Semester II">Semester II</option>
                    <option value="Semester III">Semester III</option>
                    <option value="Semester IV">Semester IV</option>
                    {paperCourse === 'UG' && (
                      <>
                        <option value="Semester V">Semester V</option>
                        <option value="Semester VI">Semester VI</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                  Examination Name *
                </label>
                <input
                  type="text"
                  required
                  value={paperExamination}
                  onChange={(e) => setPaperExamination(e.target.value)}
                  placeholder="e.g. Semester End Examination (CBCS)"
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
                />
              </div>

              {/* PDF DOCUMENT UPLOAD UP TO 500 KB WITH COMPRESSION */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 uppercase text-[11px]">
                    Question Paper PDF / Scan (Max 500 KB) *
                  </label>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    Limit: 500 KB
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* File Selector */}
                  <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-400 bg-slate-50 transition flex flex-col items-center justify-center text-center">
                    <Upload className="w-6 h-6 text-indigo-600 mb-2" />
                    <span className="font-bold text-slate-800 text-xs">
                      Upload PDF or Scanned Photo
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      Strict limit: 500 KB (Photo scans auto-compressed)
                    </span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf,image/*"
                      onChange={handleFileUpload}
                      className="mt-2 text-xs file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                    {fileCompressionNotice && (
                      <span className="mt-2 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {fileCompressionNotice}
                      </span>
                    )}
                    {fileUploadError && (
                      <span className="mt-2 text-[11px] text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {fileUploadError}
                      </span>
                    )}
                  </div>

                  {/* Or Direct URL Input */}
                  <div className="space-y-2">
                    <span className="font-semibold text-slate-700 text-xs block">
                      Or Direct Document / PDF URL:
                    </span>
                    <input
                      type="url"
                      required
                      value={paperFileUrl}
                      onChange={(e) => setPaperFileUrl(e.target.value)}
                      placeholder="https://example.com/question-paper.pdf"
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">File Size Tag:</span>
                      <input
                        type="text"
                        value={paperFileSize}
                        onChange={(e) => setPaperFileSize(e.target.value)}
                        placeholder="e.g. 350 KB"
                        className="w-28 p-1.5 rounded border border-slate-200 text-xs font-mono"
                      />
                      <span className="text-[10px] text-slate-500">Must be ≤ 500 KB</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attribution Preview */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                <div className="text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Public Attribution Preview
                  </span>
                  {isAdmin ? (
                    <div className="flex items-center gap-2 text-slate-800">
                      <Building2 className="w-4 h-4 text-slate-600" />
                      <span>
                        Uploaded by: <strong className="font-bold">Department of Mathematics</strong>
                      </span>
                      <span className="text-[11px] text-slate-500 italic">
                        (Admin personal identity is hidden from the public)
                      </span>
                    </div>
                  ) : verifiedStudent ? (
                    <div className="flex items-center gap-2 text-emerald-900">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                      <span>
                        Uploaded by Student: <strong className="font-bold">{verifiedStudent.name}</strong> ({verifiedStudent.admissionBatch})
                      </span>
                    </div>
                  ) : (
                    <div className="text-slate-500 italic text-[11px]">
                      Student attribution will appear here once verified above.
                    </div>
                  )}
                </div>
              </div>

              {/* Success Banner */}
              {uploadSuccessMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{uploadSuccessMsg}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('browse')}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingPaper || (!isAdmin && !verifiedStudent)}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg uppercase tracking-wider transition flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  {isSubmittingPaper ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Publishing Paper...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>
                        {isAdmin
                          ? 'Publish Paper as Department'
                          : verifiedStudent
                          ? `Publish Paper (as ${verifiedStudent.name})`
                          : 'Verify Student First to Publish'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* SUB-TAB 2: BROWSE QUESTION PAPERS REPOSITORY             */}
        {/* ======================================================== */}
        {activeSubTab === 'browse' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Filters */}
            <div className="space-y-4">
              {/* COURSE TABS (All, UG, PG) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2 shrink-0">
                  Course:
                </span>
                <button
                  onClick={() => setSelectedCourse('All')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedCourse === 'All'
                      ? 'bg-[#0c2340] text-amber-300'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  All Courses
                </button>
                <button
                  onClick={() => setSelectedCourse('UG')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedCourse === 'UG'
                      ? 'bg-sky-700 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  UG (B.Sc. Hons)
                </button>
                <button
                  onClick={() => setSelectedCourse('PG')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedCourse === 'PG'
                      ? 'bg-purple-700 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  PG (M.Sc.)
                </button>
              </div>

              {/* Year Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2 shrink-0">
                  Session:
                </span>
                <button
                  onClick={() => setSelectedYear('All')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedYear === 'All'
                      ? 'bg-[#0c2340] text-amber-300 font-bold'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  All Sessions
                </button>
                {availableYears.map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setSelectedYear(yr)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      selectedYear === yr
                        ? 'bg-[#0c2340] text-amber-300 font-bold'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>

              {/* Subject & Semester Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
                  Semester:
                </span>
                {['All', 'Semester I', 'Semester II', 'Semester III', 'Semester IV', 'Semester V', 'Semester VI'].map(
                  (sem) => (
                    <button
                      key={sem}
                      onClick={() => setSelectedSemester(sem)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                        selectedSemester === sem
                          ? 'bg-indigo-700 text-white font-bold'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {sem}
                    </button>
                  )
                )}
              </div>

              {/* Search Bar & Subject Filter */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-96">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by title, paper code, student contributor..."
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-slate-500">Subject:</span>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden"
                  >
                    <option value="All">All Subjects</option>
                    {availableSubjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Question Papers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPapers.length === 0 ? (
                <div className="col-span-2 bg-white rounded-2xl p-12 text-center text-slate-400 text-xs border border-slate-200 space-y-3">
                  <FileQuestion className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>No previous year question papers match the selected criteria.</p>
                  <button
                    onClick={() => setActiveSubTab('add')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Be the First to Upload a Question Paper</span>
                  </button>
                </div>
              ) : (
                filteredPapers.map((paper) => (
                  <div
                    key={paper.id}
                    className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              paper.course === 'PG'
                                ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                : 'bg-sky-100 text-sky-900 border border-sky-200'
                            }`}
                          >
                            {paper.course || (paper.title.includes('PG') ? 'PG' : 'UG')}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider font-mono">
                            {paper.paperCode}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                          Session {paper.academicYear}
                        </span>
                      </div>

                      <h3 className="font-serif-academic text-base font-bold text-slate-900 group-hover:text-indigo-900 transition leading-snug">
                        {paper.title}
                      </h3>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">
                            Subject
                          </span>
                          <span className="font-semibold text-slate-800">{paper.subject}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">
                            Term & Examination
                          </span>
                          <span className="font-medium text-slate-800">
                            {paper.semester} ({paper.yearLevel})
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 italic">
                        {paper.examination} • {paper.fileSize || '350 KB'}
                      </p>

                      {/* Prominent Contributor Attribution Strip */}
                      {paper.uploadedByRole === 'student' && paper.uploaderName ? (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50/90 border border-emerald-200 text-xs">
                          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                            🎓
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-bold text-emerald-800 block tracking-wider">
                              Uploaded by Student
                            </span>
                            <div className="flex flex-wrap items-center gap-x-2">
                              <span className="font-bold text-emerald-950">
                                {paper.uploaderName}
                              </span>
                              {paper.uploaderBatch && (
                                <span className="text-[11px] text-emerald-700 font-medium">
                                  ({paper.uploaderBatch})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                          <div className="w-6 h-6 rounded-full bg-[#0c2340] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                            🏛️
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
                              Uploaded by
                            </span>
                            <span className="font-bold text-slate-900 block">
                              Department of Mathematics
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Official Academic Repository
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* View and Download Action Buttons - Open to EVERYONE */}
                    <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectPaper(paper)}
                          className="px-3.5 py-1.5 rounded-lg bg-[#0c2340] hover:bg-blue-950 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                          title="View Question Paper PDF Online"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View PDF</span>
                        </button>

                        <a
                          href={paper.fileUrl}
                          download={`${paper.paperCode || 'Question_Paper'}_${paper.academicYear || ''}.pdf`}
                          className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                          title="Download Question Paper PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEditPaper(paper)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 cursor-pointer"
                            title="Edit Paper"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeletePaper(paper.id, paper.title)}
                            className="p-1.5 rounded-md hover:bg-rose-100 text-rose-600 cursor-pointer"
                            title="Delete Paper"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

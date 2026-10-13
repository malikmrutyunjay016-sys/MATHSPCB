import React, { useState } from 'react';
import {
  GraduationCap,
  KeyRound,
  UserPlus,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Upload,
  Camera,
  Eye,
  EyeOff,
  Copy,
  Check,
  ShieldCheck,
  Calendar,
  BookOpen,
  Mail,
  Phone,
  MapPin,
  Lock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Student, StudentCredential } from '../types';
import {
  registerNewStudentWithCredentials,
  loginStudentPortal,
  saveStudent,
  saveStudentCredential,
} from '../services/db';

interface StudentPortalPageProps {
  onStudentSaved?: (student: Student, cred?: StudentCredential) => void;
  onNavigateHome?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

const COURSE_OPTIONS = [
  'UG NEP',
  'UG AEDP',
  'UG CBCS',
  'PG',
];

const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
];

export const StudentPortalPage: React.FC<StudentPortalPageProps> = ({
  onStudentSaved,
  onNavigateHome,
  onNavigateToTab,
}) => {
  const [activeTab, setActiveTab] = useState<'register' | 'login' | 'dashboard'>('register');

  // Register Form State
  const [regForm, setRegForm] = useState({
    joiningYear: '2026',
    course: 'UG NEP',
    rollNumber: '',
    name: '',
    photoUrl: SAMPLE_AVATARS[0],
    password: '',
    confirmPassword: '',
    registrationNumber: '',
    semester: 'Semester I',
    yearLevel: '1st Year',
    mobile: '',
    email: '',
    address: '',
    category: 'General',
  });

  // Login Form State
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);

  // Logged-in State
  const [loggedInStudent, setLoggedInStudent] = useState<Student | null>(null);
  const [loggedInCred, setLoggedInCred] = useState<StudentCredential | null>(null);
  const [editForm, setEditForm] = useState<Student | null>(null);
  const [newPasswordUpdate, setNewPasswordUpdate] = useState('');
  const [showNewPasswordUpdate, setShowNewPasswordUpdate] = useState(false);

  // Status & Messages
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [registeredInfo, setRegisteredInfo] = useState<{
    uniqueId: string;
    rollNumber: string;
    password: string;
    name: string;
  } | null>(null);

  // Handle Device File Upload for Photograph
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 2.5 * 1024 * 1024) {
      setErrorMessage('Photo file size exceeds 2.5 MB. Please select a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (isEdit && editForm) {
        setEditForm({ ...editForm, photoUrl: base64 });
      } else {
        setRegForm((prev) => ({ ...prev, photoUrl: base64 }));
      }
      setErrorMessage('');
    };
    reader.readAsDataURL(file);
  };

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regForm.rollNumber.trim()) {
      setErrorMessage('Roll Number is compulsory.');
      return;
    }
    if (!regForm.name.trim()) {
      setErrorMessage('Student Full Name is compulsory.');
      return;
    }
    if (!regForm.photoUrl.trim()) {
      setErrorMessage('Student Photograph is compulsory.');
      return;
    }
    if (!regForm.password.trim() || regForm.password.trim().length < 4) {
      setErrorMessage('Password must be at least 4 characters.');
      return;
    }
    if (regForm.password !== regForm.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const studentDocId = `stu-reg-${Date.now()}`;
      const yearSuffix = regForm.joiningYear.slice(-2);
      const cleanRoll = regForm.rollNumber.trim().toUpperCase();
      const assignedUniqueId = `MTH${yearSuffix}-${cleanRoll.replace(/[^A-Z0-9]/gi, '')}`;

      const academicYear = `${regForm.joiningYear}–${parseInt(regForm.joiningYear, 10) + 1}`;

      const studentData: Student = {
        id: studentDocId,
        uniqueId: assignedUniqueId,
        rollNumber: cleanRoll,
        name: regForm.name.trim(),
        course: regForm.course,
        academicYear,
        yearLevel: regForm.yearLevel || '1st Year',
        semester: regForm.semester || 'Semester I',
        admissionYear: regForm.joiningYear,
        category: regForm.category,
        photoUrl: regForm.photoUrl.trim(),
        academicStatus: 'Active',
      };

      if (regForm.registrationNumber.trim()) {
        studentData.registrationNumber = regForm.registrationNumber.trim();
      }
      if (regForm.mobile.trim()) {
        studentData.mobile = regForm.mobile.trim();
      }
      if (regForm.email.trim()) {
        studentData.email = regForm.email.trim();
      }
      if (regForm.address.trim()) {
        studentData.address = regForm.address.trim();
      }

      const result = await registerNewStudentWithCredentials(studentData, regForm.password.trim());

      if (result.success && result.student && result.credential) {
        setRegisteredInfo({
          uniqueId: assignedUniqueId,
          rollNumber: studentData.rollNumber,
          password: regForm.password.trim(),
          name: studentData.name,
        });
        setSuccessMessage('Student details and login credentials successfully registered in database!');
        if (onStudentSaved) onStudentSaved(result.student, result.credential);
      } else {
        setErrorMessage(result.error || 'Failed to complete registration.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error creating student account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginId.trim() || !loginPass.trim()) {
      setErrorMessage('Please provide your Unique ID or Roll Number and Password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginStudentPortal(loginId.trim(), loginPass.trim());
      if (res.success && res.student && res.credential) {
        setLoggedInStudent(res.student);
        setLoggedInCred(res.credential);
        setEditForm({ ...res.student });
        setActiveTab('dashboard');
        setSuccessMessage('Signed in successfully! You can now edit your details.');
      } else {
        setErrorMessage(res.error || 'Invalid credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Profile Update
  const handleSaveProfileUpdates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    if (!editForm.name.trim() || !editForm.rollNumber.trim() || !editForm.photoUrl?.trim()) {
      setErrorMessage('Name, Roll Number, and Photo are compulsory.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await saveStudent(editForm);

      // If new password was entered, update credentials vault
      if (newPasswordUpdate.trim() && loggedInCred) {
        const updatedCred: StudentCredential = {
          ...loggedInCred,
          studentName: editForm.name,
          rollNumber: editForm.rollNumber,
          course: editForm.course,
          admissionYear: editForm.admissionYear || loggedInCred.admissionYear,
          password: newPasswordUpdate.trim(),
          updatedAt: new Date().toISOString(),
        };
        await saveStudentCredential(updatedCred);
        setLoggedInCred(updatedCred);
        setNewPasswordUpdate('');
      }

      setLoggedInStudent({ ...editForm });
      setSuccessMessage('Your student details have been saved and synced successfully!');
      if (onStudentSaved) onStudentSaved(editForm, loggedInCred || undefined);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error updating profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStudentLogout = () => {
    setLoggedInStudent(null);
    setLoggedInCred(null);
    setEditForm(null);
    setActiveTab('login');
    setSuccessMessage('You have been logged out safely.');
  };

  const handleCopyCredentials = () => {
    if (!registeredInfo) return;
    const text = `Student Portal Credentials\nName: ${registeredInfo.name}\nRoll No: ${registeredInfo.rollNumber}\nUnique ID: ${registeredInfo.uniqueId}\nPassword: ${registeredInfo.password}\nPortal: Department of Mathematics, Panchayat College, Baragada`;
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Hero Banner */}
        <div className="bg-gradient-to-r from-[#0a192f] via-[#0c2340] to-[#1e3a8a] text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-700/60 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Student Self-Service Portal</span>
              </div>
              <h1 className="font-serif-academic text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight">
                Department Student Portal
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Welcome to the official student admission & academic records portal for the Department of Mathematics, Panchayat College, Baragada. Register initial details, receive your unique student credentials, and log in anytime to update your records.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {loggedInStudent ? (
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20">
                  <img
                    src={loggedInStudent.photoUrl || SAMPLE_AVATARS[0]}
                    alt={loggedInStudent.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-amber-400"
                  />
                  <div className="text-left text-xs">
                    <div className="font-bold text-white">{loggedInStudent.name}</div>
                    <div className="text-amber-300 font-mono text-[11px]">{loggedInStudent.rollNumber}</div>
                  </div>
                  <button
                    onClick={handleStudentLogout}
                    className="ml-2 p-1.5 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4 text-red-300" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveTab('register');
                      setRegisteredInfo(null);
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'register'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>New Student Registration</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('login');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'login'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Student Login & Edit</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Notice Pill */}
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Available Streams: <strong>UG NEP</strong> • <strong>UG AEDP</strong> • <strong>PG</strong></span>
            </div>
            <div className="flex items-center gap-2 text-amber-300">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Credentials Vault: Admin Protected & Verified</span>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 text-xs sm:text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs sm:text-sm animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* TAB 1: NEW STUDENT REGISTRATION */}
        {activeTab === 'register' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8">
            {/* Header Description */}
            <div className="border-b border-slate-100 pb-5">
              <h2 className="font-serif-academic text-xl sm:text-2xl font-bold text-[#0c2340]">
                New Student Registration Form
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-1">
                Please fill the required compulsory information below. Your Unique Student ID will be generated upon submission, and your login password will be saved for editing other details later.
              </p>
            </div>

            {/* Registration Success Receipt Screen */}
            {registeredInfo ? (
              <div className="space-y-6">
                <div className="p-6 sm:p-8 bg-emerald-50 border-2 border-emerald-300 rounded-2xl space-y-4">
                  <div className="flex items-center gap-3 text-emerald-900 font-bold text-base sm:text-lg">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <span>Registration Successful! Keep Your Credentials Safe</span>
                  </div>

                  <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
                    Welcome <strong>{registeredInfo.name}</strong>! Your record has been created in the department database. Please write down or copy your unique credentials below. You can log in at any time to edit or complete other details.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 bg-white rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Assigned Unique ID</span>
                      <span className="text-base font-mono font-bold text-slate-900">{registeredInfo.uniqueId}</span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Class Roll Number</span>
                      <span className="text-base font-mono font-bold text-slate-900">{registeredInfo.rollNumber}</span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Portal Password</span>
                      <span className="text-base font-mono font-bold text-amber-700">{registeredInfo.password}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={handleCopyCredentials}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                    >
                      {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedKey ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setLoginId(registeredInfo.uniqueId);
                        setLoginPass(registeredInfo.password);
                        setActiveTab('login');
                      }}
                      className="px-4 py-2 bg-[#0c2340] hover:bg-blue-950 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Proceed to Student Login</span>
                    </button>

                    <button
                      onClick={() => {
                        setRegisteredInfo(null);
                        setRegForm({
                          joiningYear: '2026',
                          course: 'UG NEP',
                          rollNumber: '',
                          name: '',
                          photoUrl: SAMPLE_AVATARS[0],
                          password: '',
                          confirmPassword: '',
                          registrationNumber: '',
                          semester: 'Semester I',
                          yearLevel: '1st Year',
                          mobile: '',
                          email: '',
                          address: '',
                          category: 'General',
                        });
                      }}
                      className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      <span>Register Another Student</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-8">
                {/* 1. Compulsory Initial Academic Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">1</span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      Compulsory Academic & Identity Fields
                    </h3>
                    <span className="text-rose-600 text-xs font-semibold">* Required</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    {/* Joining Year */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Joining Year (Admission Session) *
                      </label>
                      <select
                        value={regForm.joiningYear}
                        onChange={(e) => setRegForm({ ...regForm, joiningYear: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:border-blue-500 font-semibold"
                        required
                      >
                        <option value="2027">2027 (Upcoming Session)</option>
                        <option value="2026">2026 (Current Academic Session)</option>
                        <option value="2025">2025 (Previous Session)</option>
                        <option value="2024">2024 (Batch 2024–27)</option>
                        <option value="2023">2023</option>
                      </select>
                    </div>

                    {/* Course: UG NEP / UG AEDP / PG */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Course Stream *
                      </label>
                      <select
                        value={regForm.course}
                        onChange={(e) => setRegForm({ ...regForm, course: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:border-blue-500 font-semibold"
                        required
                      >
                        {COURSE_OPTIONS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Class Roll Number */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Roll Number * (Compulsory)
                      </label>
                      <input
                        type="text"
                        value={regForm.rollNumber}
                        onChange={(e) => setRegForm({ ...regForm, rollNumber: e.target.value })}
                        placeholder="e.g. MATH26-001 or 26MTH045"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-500 uppercase font-mono font-bold"
                        required
                      />
                    </div>

                    {/* Student Full Name */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Student Full Name * (Compulsory)
                      </label>
                      <input
                        type="text"
                        value={regForm.name}
                        onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                        placeholder="As per Matriculation Certificate"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-500 font-semibold"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Compulsory Student Photograph Upload */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">2</span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      Student Photograph (Compulsory) *
                    </h3>
                  </div>

                  <div className="flex flex-col md:flex-row items-start gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    {/* Photo Preview */}
                    <div className="shrink-0 flex flex-col items-center gap-2">
                      <img
                        src={regForm.photoUrl}
                        alt="Photo Preview"
                        className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
                      />
                      <span className="text-[11px] text-slate-500 font-medium">Selected Photo</span>
                    </div>

                    {/* Upload Controls */}
                    <div className="space-y-3 flex-1 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Option A: Upload Image File from Your Device
                        </label>
                        <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl cursor-pointer shadow-xs transition">
                          <Upload className="w-4 h-4" />
                          <span>Choose Photo from Device / Phone</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(e, false)}
                            className="hidden"
                          />
                        </label>
                        <span className="block text-[11px] text-slate-500 mt-1">Supports JPG, PNG, WEBP (Max 2.5 MB)</span>
                      </div>

                      <div className="pt-2">
                        <label className="block font-bold text-slate-700 mb-1">
                          Option B: Or Enter Direct Photo Image URL
                        </label>
                        <input
                          type="url"
                          value={regForm.photoUrl}
                          onChange={(e) => setRegForm({ ...regForm, photoUrl: e.target.value })}
                          placeholder="https://..."
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden"
                          required
                        />
                      </div>

                      <div className="pt-2">
                        <span className="block font-bold text-slate-700 mb-1.5">
                          Option C: Or Select Quick Sample Avatar
                        </span>
                        <div className="flex items-center gap-2">
                          {SAMPLE_AVATARS.map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt={`Sample ${i}`}
                              onClick={() => setRegForm({ ...regForm, photoUrl: url })}
                              className={`w-9 h-9 rounded-full object-cover cursor-pointer border-2 transition hover:scale-110 ${
                                regForm.photoUrl === url ? 'border-amber-500 ring-2 ring-amber-300' : 'border-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Password Creation for Future Edits */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">3</span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      Create Password for Student Portal Access *
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500">
                    Set a secure password. You will use this password alongside your generated Unique ID or Roll Number to log in and edit your details anytime.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Portal Password * (Min. 4 characters)
                      </label>
                      <div className="relative">
                        <input
                          type={showRegPass ? 'text' : 'password'}
                          value={regForm.password}
                          onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                          placeholder="Enter your confidential password"
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-500 font-mono"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPass(!showRegPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                        >
                          {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type={showRegPass ? 'text' : 'password'}
                        value={regForm.confirmPassword}
                        onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                        placeholder="Re-type password to verify"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-500 font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Optional Academic & Contact Details (Can be filled later) */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center">4</span>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        Other Details (Can be filled now or updated later with your ID & Password)
                      </h3>
                    </div>
                    <span className="text-slate-400 text-xs italic">Optional for initial save</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">University Registration No.</label>
                      <input
                        type="text"
                        value={regForm.registrationNumber}
                        onChange={(e) => setRegForm({ ...regForm, registrationNumber: e.target.value })}
                        placeholder="e.g. SU26MTH001"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Semester Level</label>
                      <select
                        value={regForm.semester}
                        onChange={(e) => setRegForm({ ...regForm, semester: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden"
                      >
                        <option value="Semester I">Semester I</option>
                        <option value="Semester II">Semester II</option>
                        <option value="Semester III">Semester III</option>
                        <option value="Semester IV">Semester IV</option>
                        <option value="Semester V">Semester V</option>
                        <option value="Semester VI">Semester VI</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Year Level</label>
                      <select
                        value={regForm.yearLevel}
                        onChange={(e) => setRegForm({ ...regForm, yearLevel: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden"
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="PG 1st Year">PG 1st Year</option>
                        <option value="PG 2nd Year">PG 2nd Year</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Mobile Number</label>
                      <input
                        type="tel"
                        value={regForm.mobile}
                        onChange={(e) => setRegForm({ ...regForm, mobile: e.target.value })}
                        placeholder="10-digit phone number"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={regForm.email}
                        onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                        placeholder="student@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Social Category</label>
                      <select
                        value={regForm.category}
                        onChange={(e) => setRegForm({ ...regForm, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden"
                      >
                        <option value="General">General</option>
                        <option value="OBC">OBC</option>
                        <option value="SEBC">SEBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="EWS">EWS</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block font-medium text-slate-700 mb-1">Permanent / Residential Address</label>
                      <input
                        type="text"
                        value={regForm.address}
                        onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                        placeholder="Village / Town, Post, District, State, PIN"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Your ID & password will be automatically linked to your student record and visible to admin.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3.5 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Registering Student...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Complete Registration & Generate Unique ID</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: STUDENT LOGIN */}
        {activeTab === 'login' && !loggedInStudent && (
          <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-[#0c2340] text-amber-400 flex items-center justify-center mx-auto shadow-md">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="font-serif-academic text-2xl font-bold text-[#0c2340]">
                Student Portal Login
              </h2>
              <p className="text-xs text-slate-600">
                Sign in with your Unique ID or Roll Number and Password to edit or complete your details.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Unique Student ID or Roll Number *
                </label>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. MTH26-001 or MATH26-021"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-500 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="Enter your student password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-500 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#0c2340] hover:bg-blue-950 disabled:bg-blue-900 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-amber-400" />
                    <span>Log In to Student Portal</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Helper */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
              <span className="font-bold text-slate-800 block">Sample Credentials for Testing:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginId('MATH26-021');
                    setLoginPass('Panchayat@2026');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-mono text-slate-700 cursor-pointer"
                >
                  MATH26-021 (UG NEP)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginId('MATH26-022');
                    setLoginPass('Baragada#2026');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-mono text-slate-700 cursor-pointer"
                >
                  MATH26-022 (UG AEDP)
                </button>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  setActiveTab('register');
                  setRegisteredInfo(null);
                }}
                className="text-xs text-blue-700 hover:text-blue-900 font-semibold cursor-pointer"
              >
                Haven't registered yet? Click here to register as a new student &rarr;
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: LOGGED-IN STUDENT PROFILE DASHBOARD & EDITING */}
        {(activeTab === 'dashboard' || loggedInStudent) && editForm && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8">
            {/* Student ID Card Header */}
            <div className="bg-gradient-to-r from-slate-900 via-[#0c2340] to-blue-950 text-white p-6 sm:p-8 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <img
                    src={editForm.photoUrl || SAMPLE_AVATARS[0]}
                    alt={editForm.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-amber-400 shadow-lg bg-slate-800"
                  />
                  <label
                    className="absolute -bottom-1 -right-1 p-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full cursor-pointer shadow-md"
                    title="Change Photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, true)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] uppercase">
                      {editForm.course}
                    </span>
                    <span className="text-slate-400 text-xs">
                      Joining Year: {editForm.admissionYear || '2026'}
                    </span>
                  </div>
                  <h2 className="font-serif-academic text-xl sm:text-2xl font-bold text-white">
                    {editForm.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 font-mono">
                    <span>Roll No: <strong>{editForm.rollNumber}</strong></span>
                    {loggedInCred && <span>Unique ID: <strong>{loggedInCred.uniqueId}</strong></span>}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {onNavigateToTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateToTab('timetable')}
                    className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>My Time Table</span>
                  </button>
                )}
                {onNavigateToTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateToTab('syllabus')}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>My Syllabus</span>
                  </button>
                )}
                <button
                  onClick={handleStudentLogout}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>

            {/* Profile Edit Form */}
            <form onSubmit={handleSaveProfileUpdates} className="space-y-8">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Edit Your Student Information
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update personal and academic records. Name, Roll Number, and Photo remain compulsory.
                  </p>
                </div>
                <span className="text-emerald-700 text-xs font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  ✓ Active Scholar Profile
                </span>
              </div>

              {/* Compulsory Fields in Edit Mode */}
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  1. Core Identifiers (Compulsory)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Student Full Name *
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-hidden focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Class Roll Number *
                    </label>
                    <input
                      type="text"
                      value={editForm.rollNumber}
                      onChange={(e) => setEditForm({ ...editForm, rollNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold uppercase focus:outline-hidden focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Course Stream *
                    </label>
                    <select
                      value={editForm.course}
                      onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold focus:outline-hidden"
                      required
                    >
                      {COURSE_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Joining Year (Admission) *
                    </label>
                    <select
                      value={editForm.admissionYear || '2026'}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          admissionYear: e.target.value,
                          academicYear: `${e.target.value}–${parseInt(e.target.value, 10) + 1}`,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold focus:outline-hidden"
                    >
                      <option value="2027">2027</option>
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Photograph Update */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  2. Student Photograph *
                </span>
                <div className="flex flex-col sm:flex-row items-center gap-4 text-xs">
                  <label className="px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 font-bold rounded-xl cursor-pointer flex items-center gap-2">
                    <Upload className="w-4 h-4 text-blue-700" />
                    <span>Upload New Photo from Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, true)}
                      className="hidden"
                    />
                  </label>

                  <div className="flex-1 w-full sm:w-auto">
                    <input
                      type="url"
                      value={editForm.photoUrl || ''}
                      onChange={(e) => setEditForm({ ...editForm, photoUrl: e.target.value })}
                      placeholder="Or enter image URL"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Extended Details */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  3. Academic & Contact Information
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">University Registration No.</label>
                    <input
                      type="text"
                      value={editForm.registrationNumber || ''}
                      onChange={(e) => setEditForm({ ...editForm, registrationNumber: e.target.value })}
                      placeholder="e.g. SU26MTH001"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Semester Level</label>
                    <select
                      value={editForm.semester || 'Semester I'}
                      onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden"
                    >
                      <option value="Semester I">Semester I</option>
                      <option value="Semester II">Semester II</option>
                      <option value="Semester III">Semester III</option>
                      <option value="Semester IV">Semester IV</option>
                      <option value="Semester V">Semester V</option>
                      <option value="Semester VI">Semester VI</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Year Level</label>
                    <select
                      value={editForm.yearLevel || '1st Year'}
                      onChange={(e) => setEditForm({ ...editForm, yearLevel: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="PG 1st Year">PG 1st Year</option>
                      <option value="PG 2nd Year">PG 2nd Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Mobile Contact</label>
                    <input
                      type="tel"
                      value={editForm.mobile || ''}
                      onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                      placeholder="10-digit mobile number"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editForm.email || ''}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="student@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Social Category</label>
                    <select
                      value={editForm.category || 'General'}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden"
                    >
                      <option value="General">General</option>
                      <option value="OBC">OBC</option>
                      <option value="SEBC">SEBC</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="EWS">EWS</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block font-medium text-slate-700 mb-1">Permanent Residential Address</label>
                    <input
                      type="text"
                      value={editForm.address || ''}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="At/PO, District, State, PIN"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Password Change Option */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  4. Change Portal Password (Optional)
                </span>
                <div className="max-w-md text-xs">
                  <label className="block font-medium text-slate-700 mb-1">
                    New Password (Leave blank to keep current password)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPasswordUpdate ? 'text' : 'password'}
                      value={newPasswordUpdate}
                      onChange={(e) => setNewPasswordUpdate(e.target.value)}
                      placeholder="Enter new password if desired"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPasswordUpdate(!showNewPasswordUpdate)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showNewPasswordUpdate ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Edits */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white font-bold rounded-xl text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-md transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Profile Updates...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save & Synchronize All Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Informational Guidance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5 text-blue-800" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">NEP & AEDP Framework</h4>
            <p className="text-slate-600 leading-relaxed">
              Curriculum follows Sambalpur University NEP 2020 guidelines and AEDP credit modules. Ensure you pick your exact enrolled stream for syllabus tracking.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5 text-amber-800" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Confidential Admin Vault</h4>
            <p className="text-slate-600 leading-relaxed">
              Your password and unique ID are stored in the department administrative vault. If you ever misplace your password, the department administrator can securely assist.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-emerald-800" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Self-Service Editing</h4>
            <p className="text-slate-600 leading-relaxed">
              Whenever your mobile number, address, or semester changes, simply log in and update your profile without waiting in college administrative lines.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

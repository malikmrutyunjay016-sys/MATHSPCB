import React, { useState } from 'react';
import {
  X,
  UserCheck,
  UserPlus,
  LogIn,
  LogOut,
  Lock,
  Unlock,
  KeyRound,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Image,
  Upload,
  Calendar,
  Layers,
  Phone,
  Mail,
  MapPin,
  Save,
} from 'lucide-react';
import { Student, StudentCredential } from '../types';
import {
  registerNewStudentWithCredentials,
  loginStudentPortal,
  saveStudent,
  saveStudentCredential,
} from '../services/db';

interface StudentPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentSaved?: (student: Student, credential?: StudentCredential) => void;
  initialMode?: 'register' | 'login';
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
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
];

export const StudentPortalModal: React.FC<StudentPortalModalProps> = ({
  isOpen,
  onClose,
  onStudentSaved,
  initialMode = 'register',
}) => {
  const [mode, setMode] = useState<'register' | 'login' | 'dashboard'>(initialMode);

  // Registration Form State (Compulsory: Name, Roll No, Photo, Course, Joining Year, Password)
  const [regForm, setRegForm] = useState({
    name: '',
    rollNumber: '',
    photoUrl: SAMPLE_AVATARS[0],
    course: 'UG NEP',
    joiningYear: '2026',
    password: '',
    confirmPassword: '',
    uniqueId: '',
    // Optional details that can be filled now or later
    registrationNumber: '',
    fatherMotherName: '',
    gender: 'Female',
    dob: '',
    mobile: '',
    email: '',
    address: '',
    category: 'GEN',
    yearLevel: '1st Year',
    semester: 'Semester I',
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditMode = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Photograph size must be less than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (isEditMode) {
          if (editForm) setEditForm({ ...editForm, photoUrl: result });
        } else {
          setRegForm((prev) => ({ ...prev, photoUrl: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Login Form State
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Logged-in Student Session State
  const [loggedInStudent, setLoggedInStudent] = useState<Student | null>(null);
  const [loggedInCred, setLoggedInCred] = useState<StudentCredential | null>(null);
  const [editForm, setEditForm] = useState<Student | null>(null);
  const [newPasswordUpdate, setNewPasswordUpdate] = useState('');

  // Status & Messages
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [registeredInfo, setRegisteredInfo] = useState<{
    uniqueId: string;
    rollNumber: string;
    password: string;
    name: string;
  } | null>(null);

  if (!isOpen) return null;

  // Handle New Student Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regForm.name.trim() || !regForm.rollNumber.trim() || !regForm.photoUrl.trim()) {
      setErrorMessage('Roll Number, Full Name, and Photograph are compulsory.');
      return;
    }

    if (!regForm.password.trim() || regForm.password.length < 4) {
      setErrorMessage('Password must be at least 4 characters.');
      return;
    }

    if (regForm.password !== regForm.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const assignedUniqueId = regForm.uniqueId.trim() || regForm.rollNumber.trim().toUpperCase();
      const academicYear = `${regForm.joiningYear}–${(parseInt(regForm.joiningYear) + 1).toString().slice(-2)}`;

      const studentData: Student = {
        id: `stu-${Date.now()}`,
        uniqueId: assignedUniqueId,
        rollNumber: regForm.rollNumber.trim().toUpperCase(),
        name: regForm.name.trim(),
        gender: regForm.gender,
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
      if (regForm.fatherMotherName?.trim()) {
        studentData.fatherMotherName = regForm.fatherMotherName.trim();
      }
      if (regForm.dob?.trim()) {
        studentData.dob = regForm.dob.trim();
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
        setSuccessMessage('Student details and login credentials successfully registered!');
        if (onStudentSaved && result.student) onStudentSaved(result.student, result.credential);
      } else {
        setErrorMessage(result.error || 'Failed to complete registration.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error creating student account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Student Login
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
        setMode('dashboard');
      } else {
        setErrorMessage(res.error || 'Invalid credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Student Self-Service Profile Update
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

      // If new password was entered, update student_credentials
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
      setSuccessMessage('Your student details have been saved successfully!');
      if (onStudentSaved) onStudentSaved(editForm);
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
    setMode('login');
    setLoginPass('');
    setSuccessMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#0b1a2f] text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white p-0.5 border border-amber-400/50 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
              <img
                src="/college-logo.svg"
                alt="Panchayat College, Baragada Official Emblem"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block">
                Department of Mathematics • Panchayat College
              </span>
              <h3 className="font-serif-academic text-base sm:text-lg font-bold text-white">
                {mode === 'register'
                  ? 'New Student Registration Portal'
                  : mode === 'login'
                  ? 'Student Portal Sign In'
                  : `Student Dashboard: ${loggedInStudent?.name}`}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (When not in dashboard) */}
        {mode !== 'dashboard' && (
          <div className="bg-slate-100 p-1.5 border-b border-slate-200 flex text-xs">
            <button
              onClick={() => {
                setMode('register');
                setErrorMessage('');
                setSuccessMessage('');
                setRegisteredInfo(null);
              }}
              className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-[#0c2340] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4 text-amber-600" />
              <span>New Student Registration</span>
            </button>
            <button
              onClick={() => {
                setMode('login');
                setErrorMessage('');
                setSuccessMessage('');
                setRegisteredInfo(null);
              }}
              className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-[#0c2340] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-4 h-4 text-blue-700" />
              <span>Login with ID & Password</span>
            </button>
          </div>
        )}

        {/* Error / Success Notifications */}
        {errorMessage && (
          <div className="m-4 mb-0 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="m-4 mb-0 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ================= MODE: REGISTER ================= */}
        {mode === 'register' && (
          <div className="p-6 overflow-y-auto space-y-5 text-xs">
            {registeredInfo ? (
              <div className="p-6 bg-slate-50 border border-emerald-300 rounded-2xl text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-serif-academic text-base font-bold text-slate-900">
                    Registration Completed Successfully!
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Your details have been saved to the department database. Save your login credentials below:
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 text-left max-w-md mx-auto space-y-2 text-xs">
                  <div className="flex justify-between border-b pb-1.5">
                    <span className="text-slate-500 font-semibold">Student Name:</span>
                    <strong className="text-slate-900">{registeredInfo.name}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1.5">
                    <span className="text-slate-500 font-semibold">Unique Student ID / Login ID:</span>
                    <strong className="font-mono text-blue-700">{registeredInfo.uniqueId}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1.5">
                    <span className="text-slate-500 font-semibold">Roll Number:</span>
                    <strong className="font-mono text-slate-900">{registeredInfo.rollNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Your Password:</span>
                    <strong className="font-mono text-emerald-800">{registeredInfo.password}</strong>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  Note: A master record of your Unique ID and password is securely saved and visible to the department administrator in case you need password assistance.
                </p>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setLoginId(registeredInfo.uniqueId);
                      setLoginPass(registeredInfo.password);
                      setRegisteredInfo(null);
                      setMode('login');
                    }}
                    className="px-5 py-2.5 bg-[#0c2340] hover:bg-blue-950 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Proceed to Login</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-5">
                {/* Notice banner */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 text-xs">
                  <span className="font-bold block">Important Enrollment Notice:</span>
                  <span>
                    Roll number, name, course, joining year, photo, and password are <strong>compulsory</strong>. Other details can be completed now or updated anytime using your Unique ID and Password.
                  </span>
                </div>

                {/* Section 1: Compulsory Fields */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                    1. Compulsory Initial Details
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        Student Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={regForm.name}
                        onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                        placeholder="e.g. Subhashree Barik"
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-hidden focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        Roll Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={regForm.rollNumber}
                        onChange={(e) => setRegForm({ ...regForm, rollNumber: e.target.value })}
                        placeholder="e.g. MATH26-001"
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-white font-mono focus:outline-hidden focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        Course / Program *
                      </label>
                      <select
                        required
                        value={regForm.course}
                        onChange={(e) => setRegForm({ ...regForm, course: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-hidden focus:border-blue-600 font-semibold text-blue-900"
                      >
                        {COURSE_OPTIONS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        Joining / Admission Year *
                      </label>
                      <select
                        required
                        value={regForm.joiningYear}
                        onChange={(e) => setRegForm({ ...regForm, joiningYear: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-hidden focus:border-blue-600 font-semibold"
                      >
                        <option value="2027">2027</option>
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                      </select>
                    </div>
                  </div>

                  {/* Compulsory Photo Selection */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Student Photograph (Compulsory) *
                    </label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                      {regForm.photoUrl ? (
                        <img
                          src={regForm.photoUrl}
                          alt="Preview"
                          className="w-16 h-16 rounded-xl object-cover border-2 border-amber-500 shrink-0 shadow-xs"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                          <Image className="w-6 h-6" />
                        </div>
                      )}

                      <div className="flex-1 space-y-2 w-full">
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition shadow-xs">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload from Device</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePhotoUpload(e, false)}
                              className="hidden"
                            />
                          </label>
                          <span className="text-[11px] text-slate-400">or enter URL below</span>
                        </div>

                        <input
                          type="url"
                          required
                          value={regForm.photoUrl}
                          onChange={(e) => setRegForm({ ...regForm, photoUrl: e.target.value })}
                          placeholder="Paste image URL (https://...)"
                          className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:border-blue-600"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-slate-500">Quick avatars:</span>
                      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                        {SAMPLE_AVATARS.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt="Sample"
                            onClick={() => setRegForm({ ...regForm, photoUrl: url })}
                            className={`w-7 h-7 rounded-full object-cover cursor-pointer border-2 transition ${
                              regForm.photoUrl === url
                                ? 'border-amber-500 scale-110'
                                : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Password & Confirm */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        Portal Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={regForm.password}
                        onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                        placeholder="At least 4 characters"
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-hidden focus:border-blue-600 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={regForm.confirmPassword}
                        onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                        placeholder="Re-enter password"
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-hidden focus:border-blue-600 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Optional Details to Fill Now or Later */}
                <details className="bg-slate-50 p-4 rounded-xl border border-slate-200 group">
                  <summary className="font-bold text-slate-700 cursor-pointer text-xs flex items-center justify-between">
                    <span className="text-amber-800">
                      + Additional Profile Details (Optional - Can be filled later with ID & Password)
                    </span>
                    <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </summary>

                  <div className="space-y-3 pt-3 mt-2 border-t border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 mb-1">Registration Number</label>
                        <input
                          type="text"
                          value={regForm.registrationNumber}
                          onChange={(e) =>
                            setRegForm({ ...regForm, registrationNumber: e.target.value })
                          }
                          placeholder="e.g. SU26MTH001"
                          className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1">Father / Mother / Guardian</label>
                        <input
                          type="text"
                          value={regForm.fatherMotherName}
                          onChange={(e) =>
                            setRegForm({ ...regForm, fatherMotherName: e.target.value })
                          }
                          placeholder="Guardian Name"
                          className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-600 mb-1">Gender</label>
                        <select
                          value={regForm.gender}
                          onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white"
                        >
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1">Date of Birth</label>
                        <input
                          type="date"
                          value={regForm.dob}
                          onChange={(e) => setRegForm({ ...regForm, dob: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1">Category</label>
                        <select
                          value={regForm.category}
                          onChange={(e) => setRegForm({ ...regForm, category: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white"
                        >
                          <option value="GEN">GEN</option>
                          <option value="OBC">OBC</option>
                          <option value="SEBC">SEBC</option>
                          <option value="SC">SC</option>
                          <option value="ST">ST</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 mb-1">Mobile Phone Number</label>
                        <input
                          type="tel"
                          value={regForm.mobile}
                          onChange={(e) => setRegForm({ ...regForm, mobile: e.target.value })}
                          placeholder="+91 94370 00000"
                          className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={regForm.email}
                          onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                          placeholder="student@example.com"
                          className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1">Home / Postal Address</label>
                      <input
                        type="text"
                        value={regForm.address}
                        onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                        placeholder="Village / Town, District, PIN Code"
                        className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white"
                      />
                    </div>
                  </div>
                </details>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Registering Details...' : 'Submit & Create Student Account'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ================= MODE: LOGIN ================= */}
        {mode === 'login' && (
          <div className="p-6 overflow-y-auto space-y-6 text-xs max-w-md mx-auto w-full">
            <div className="text-center space-y-1">
              <h4 className="font-serif-academic text-base font-bold text-slate-900">
                Sign In to Your Student Profile
              </h4>
              <p className="text-xs text-slate-500">
                Enter your Unique Student ID or Roll Number and password to view and edit your records.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                  Unique ID or Roll Number *
                </label>
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. MATH26-001"
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden focus:border-blue-600 font-mono"
                  autoFocus
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 uppercase text-[11px]">
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="Enter your student password"
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden focus:border-blue-600 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#0c2340] hover:bg-blue-950 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Access My Student Profile</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2 text-[11px] text-slate-500">
                Don&apos;t have an ID yet?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-amber-700 font-bold hover:underline"
                >
                  Register here
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= MODE: DASHBOARD / SELF-SERVICE EDIT ================= */}
        {mode === 'dashboard' && editForm && (
          <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
            {/* Student Session Banner */}
            <div className="p-4 bg-gradient-to-r from-[#0c2340] to-blue-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <img
                  src={
                    editForm.photoUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
                  }
                  alt={editForm.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-amber-400"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{editForm.name}</span>
                    <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold px-2 py-0.5 rounded">
                      {editForm.course}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                    Unique ID: {editForm.uniqueId || editForm.rollNumber} • Roll: {editForm.rollNumber}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Joining Year: {editForm.admissionYear} • Session {editForm.academicYear}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStudentLogout}
                className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>

            {/* Editable Profile Form */}
            <form onSubmit={handleSaveProfileUpdates} className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <span className="font-bold text-slate-800 text-xs">
                  Edit & Complete Your Academic Records
                </span>
                <span className="text-[11px] text-slate-500">
                  You can update any field below anytime
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Roll Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.rollNumber}
                    onChange={(e) => setEditForm({ ...editForm, rollNumber: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Course / Stream *
                  </label>
                  <select
                    value={editForm.course}
                    onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-blue-900"
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
                    Joining Year *
                  </label>
                  <input
                    type="text"
                    value={editForm.admissionYear || '2026'}
                    onChange={(e) =>
                      setEditForm({ ...editForm, admissionYear: e.target.value })
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Photo URL & Device Upload */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Student Photograph *
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                  {editForm.photoUrl ? (
                    <img
                      src={editForm.photoUrl}
                      alt="Preview"
                      className="w-14 h-14 rounded-xl object-cover border border-slate-300 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                      <Image className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex-1 space-y-2 w-full">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload New Photo from Device</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, true)}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="url"
                      required
                      value={editForm.photoUrl || ''}
                      onChange={(e) => setEditForm({ ...editForm, photoUrl: e.target.value })}
                      placeholder="Or update via image URL (https://...)"
                      className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    value={editForm.registrationNumber || ''}
                    onChange={(e) =>
                      setEditForm({ ...editForm, registrationNumber: e.target.value })
                    }
                    placeholder="e.g. SU26MTH001"
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Father / Mother / Guardian
                  </label>
                  <input
                    type="text"
                    value={editForm.fatherMotherName || ''}
                    onChange={(e) =>
                      setEditForm({ ...editForm, fatherMotherName: e.target.value })
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Gender</label>
                  <select
                    value={editForm.gender || 'Female'}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editForm.dob || ''}
                    onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={editForm.category || 'GEN'}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs"
                  >
                    <option value="GEN">GEN</option>
                    <option value="OBC">OBC</option>
                    <option value="SEBC">SEBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Mobile Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editForm.mobile || ''}
                    onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Residential / Home Address
                </label>
                <input
                  type="text"
                  value={editForm.address || ''}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              {/* Password change option */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <label className="block font-bold text-slate-800 text-[11px]">
                  Change Password (Optional)
                </label>
                <input
                  type="password"
                  value={newPasswordUpdate}
                  onChange={(e) => setNewPasswordUpdate(e.target.value)}
                  placeholder="Leave empty to keep existing password"
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition shadow-md disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving Changes...' : 'Save Profile Details'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

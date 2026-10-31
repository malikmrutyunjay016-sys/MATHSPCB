import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Download,
  Eye,
  ShieldAlert,
  Lock,
  Unlock,
  CheckCircle,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Sparkles,
  X,
} from 'lucide-react';
import { Student } from '../types';
import { useAuth } from '../context/AuthContext';
import { printStudentDirectory } from '../utils/studentPrintUtils';
import {
  getStudentStatusInfo,
  isStudentActive,
  countActiveStudents,
  filterActiveStudents,
} from '../utils/studentStatusUtils';

interface StudentsPageProps {
  students: Student[];
  privacyEnabled: boolean;
  onAddStudent: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (id: string, name: string) => void;
  onOpenRegisterModal?: () => void;
  onOpenLoginModal?: () => void;
}

export const StudentsPage: React.FC<StudentsPageProps> = ({
  students,
  privacyEnabled,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onOpenRegisterModal,
  onOpenLoginModal,
}) => {
  const { isAdmin, openAdminLoginModal } = useAuth();

  // Official student count in database (only counts students whose status is 'Active')
  const activeStudentCount = useMemo(() => countActiveStudents(students), [students]);

  // Non-admins can strictly ONLY access/view active students.
  // Admins can access and view all students (Active, Back, Dropped Out, Graduated).
  const accessibleStudents = useMemo(() => {
    if (isAdmin) return students;
    return filterActiveStudents(students);
  }, [students, isAdmin]);

  // Extract unique academic years dynamically from accessible students + default defaults
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>(['2026–27', '2025–26', '2024–25']);
    accessibleStudents.forEach((s) => {
      if (s.academicYear) yearsSet.add(s.academicYear);
    });
    return Array.from(yearsSet).sort().reverse();
  }, [accessibleStudents]);

  const [activeYearTab, setActiveYearTab] = useState<string>('All');
  const [activeYearLevel, setActiveYearLevel] = useState<string>('All');
  const [selectedCourse, setSelectedCourse] = useState<string>('All');
  const [selectedSemester, setSelectedSemester] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('Active');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Filter students: non-admin can only access active students; admin can filter by all statuses
  const filteredStudents = useMemo(() => {
    return accessibleStudents.filter((s) => {
      // Security check: non-admin can NEVER access non-active students
      if (!isAdmin && !isStudentActive(s)) {
        return false;
      }

      // Admin status filter
      if (isAdmin && selectedStatus !== 'All') {
        const info = getStudentStatusInfo(s.academicStatus);
        if (info.label !== selectedStatus) return false;
      }

      const matchYear = activeYearTab === 'All' || s.academicYear === activeYearTab || s.admissionYear === activeYearTab;
      const matchLevel = activeYearLevel === 'All' || s.yearLevel === activeYearLevel;
      const matchCourse =
        selectedCourse === 'All' ||
        (s.course && (
          selectedCourse === 'UG NEP'
            ? s.course.toLowerCase().includes('nep')
            : selectedCourse === 'UG AEDP'
            ? s.course.toLowerCase().includes('aedp')
            : selectedCourse === 'UG CBCS'
            ? s.course.toLowerCase().includes('cbcs')
            : selectedCourse === 'PG'
            ? s.course.toLowerCase().includes('pg') || s.course.toLowerCase().includes('m.sc')
            : s.course.toLowerCase().includes(selectedCourse.toLowerCase())
        ));
      const matchSem = selectedSemester === 'All' || s.semester === selectedSemester;
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        s.name.toLowerCase().includes(term) ||
        s.rollNumber.toLowerCase().includes(term) ||
        (s.uniqueId && s.uniqueId.toLowerCase().includes(term)) ||
        (s.registrationNumber && s.registrationNumber.toLowerCase().includes(term));

      return matchYear && matchLevel && matchCourse && matchSem && matchSearch;
    });
  }, [accessibleStudents, isAdmin, selectedStatus, activeYearTab, activeYearLevel, selectedCourse, selectedSemester, searchTerm]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'College Roll No',
      'University Roll No',
      'Student Name',
      'Course',
      'Academic Year',
      'Year Level',
      'Semester',
      'Category',
      'Academic Status',
    ];
    if (isAdmin) {
      headers.push('Mobile', 'Email', 'Address');
    }

    const rows = filteredStudents.map((s) => {
      const base = [
        `"${s.rollNumber}"`,
        `"${s.registrationNumber || ''}"`,
        `"${s.name}"`,
        `"${s.course}"`,
        `"${s.academicYear}"`,
        `"${s.yearLevel}"`,
        `"${s.semester}"`,
        isAdmin ? `"${s.category || ''}"` : `"•••• (Masked)"`,
        `"${s.academicStatus}"`,
      ];
      if (isAdmin) {
        base.push(`"${s.mobile || ''}"`, `"${s.email || ''}"`, `"${s.address || ''}"`);
      }
      return base.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Students_Mathematics_${activeYearTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    setIsPrintModalOpen(true);
    printStudentDirectory(
      filteredStudents,
      {
        batch: activeYearTab,
        course: selectedCourse,
        yearLevel: activeYearLevel,
        semester: selectedSemester,
        searchTerm,
      },
      isAdmin
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Page Top Title Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold uppercase tracking-wider">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Department Student Database &bull; {activeStudentCount} Enrolled Active Students</span>
            </div>
            <h1 className="font-serif-academic text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0c2340]">
              Student Records & Academic Batches
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Explore enrolled mathematics scholars across academic sessions. Public inquiries display verified academic credentials, while personal contact details are securely protected.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isAdmin && (
              <button
                onClick={onAddStudent}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Student</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Export Current Filter to CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Print Student Directory"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* New Student Self-Service & Registration Action Banner */}
        <div className="bg-gradient-to-r from-[#0c2340] via-[#102a4c] to-[#1e3a8a] text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Online Student Enrollment & Profile Self-Service
            </span>
            <h3 className="font-serif-academic text-lg sm:text-xl font-bold text-white leading-snug">
              New to the Department? Register or Edit Your Details Online
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              New students can submit initial records by selecting joining year and course (<strong>UG NEP</strong>, <strong>UG AEDP</strong>, <strong>UG CBCS</strong>, <strong>PG</strong>). Roll number, name, and photograph are compulsory. Use your Unique Student ID & Password to edit or complete other details anytime!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {onOpenLoginModal && (
              <button
                onClick={onOpenLoginModal}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 border border-white/20 transition cursor-pointer"
              >
                <Lock className="w-4 h-4 text-amber-300" />
                <span>Student Login & Edit</span>
              </button>
            )}
          </div>
        </div>

        {/* Privacy Status Alert Strip */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:px-4 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-blue-900">
            <Lock className="w-4 h-4 text-blue-700 shrink-0" />
            <span>
              Student Privacy Guard: Active. Social categories of students are masked across the site. Sensitive telephone numbers and street addresses are protected for privacy.
            </span>
          </div>

          {isAdmin ? (
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-md shrink-0 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
              <span>Admin Mode Active (Full Records Access & Deletion Rights)</span>
            </span>
          ) : (
            <button
              onClick={() => openAdminLoginModal({ startMode: 'login' })}
              className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white border border-blue-300 hover:bg-blue-50 px-2.5 py-1 rounded-md shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5 transition"
              title="Admin Login (Requires Admin ID & Password)"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
              <span>Admin Mode</span>
            </button>
          )}
        </div>

        {/* 1. Academic Session Tabs & Course Filter (Directly as required by prompt) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2 shrink-0">
              Session / Joining Year:
            </span>
            <button
              onClick={() => setActiveYearTab('All')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                activeYearTab === 'All'
                  ? 'bg-[#0c2340] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Sessions
            </button>
            {availableYears.map((yr) => (
              <button
                key={yr}
                onClick={() => setActiveYearTab(yr)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                  activeYearTab === yr
                    ? 'bg-[#0c2340] text-amber-300 shadow-xs border border-[#0c2340]'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Session {yr}
              </button>
            ))}
          </div>

          {/* Course Stream Filter: UG NEP / UG AEDP / UG CBCS / PG */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
              Course / Curriculum:
            </span>
            {['All', 'UG NEP', 'UG AEDP', 'UG CBCS', 'PG'].map((course) => (
              <button
                key={course}
                onClick={() => setSelectedCourse(course)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedCourse === course
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {course}
              </button>
            ))}
          </div>

          {/* 2. Year Level Sub-Tabs ([1st Year] [2nd Year] [3rd Year]) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
              Year Level:
            </span>
            {['All', '1st Year', '2nd Year', '3rd Year'].map((level) => (
              <button
                key={level}
                onClick={() => setActiveYearLevel(level)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeYearLevel === level
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {level}
              </button>
            ))}

            {/* Semester Filter Dropdown */}
            <div className="ml-auto flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <span className="text-xs text-slate-500 font-semibold">Semester:</span>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden"
              >
                <option value="All">All Semesters</option>
                <option value="Semester I">Semester I</option>
                <option value="Semester II">Semester II</option>
                <option value="Semester III">Semester III</option>
                <option value="Semester IV">Semester IV</option>
                <option value="Semester V">Semester V</option>
                <option value="Semester VI">Semester VI</option>
              </select>
            </div>
          </div>

          {/* Admin Status Filter (Only visible to Admin) */}
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider mr-2 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                <span>Status Filter (Admin Exclusive Access):</span>
              </span>
              {(['All', 'Active', 'Back', 'Dropped Out', 'Graduated'] as const).map((status) => {
                const info = status !== 'All' ? getStudentStatusInfo(status) : null;
                const count =
                  status === 'All'
                    ? students.length
                    : students.filter((s) => getStudentStatusInfo(s.academicStatus).label === status).length;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSelectedStatus(status)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      selectedStatus === status
                        ? 'bg-[#0c2340] text-amber-300 shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {info && <span className={`w-2 h-2 rounded-full ${info.dotClass}`} />}
                    <span>{status === 'All' ? 'All Statuses' : status}</span>
                    <span className="text-[10px] opacity-80">({count})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Search Input Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, college roll no, or university roll no..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-blue-600"
            />
          </div>

          <div className="text-xs text-slate-500">
            Found <strong className="text-slate-900">{filteredStudents.length}</strong> student record{filteredStudents.length === 1 ? '' : 's'}
            {!isAdmin ? (
              <span className="text-emerald-700 font-semibold ml-1.5 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                Active Enrolled Students Only
              </span>
            ) : (
              <span className="text-amber-800 font-semibold ml-1.5 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                Admin Access: Full Status View
              </span>
            )}
          </div>
        </div>

        {/* Student Database Table / Grid */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-[#0f223d] text-white uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">College Roll No / University Roll No</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Program / Course</th>
                  <th className="py-3.5 px-4">Year, Admission Batch & Semester</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">
                    <span className="flex items-center gap-1">
                      <span>Category</span>
                      <span className="text-[9px] text-amber-300 font-normal lowercase tracking-normal bg-slate-800/80 px-1 py-0.2 rounded border border-slate-700">masked</span>
                    </span>
                  </th>
                  <th className="py-3.5 px-4">
                    <span className="flex items-center gap-1">
                      <span>Contact Info</span>
                      {!isAdmin && (
                        <span className="text-[9px] text-amber-300 font-normal lowercase tracking-normal bg-slate-800/80 px-1 py-0.2 rounded border border-slate-700">masked</span>
                      )}
                    </span>
                  </th>
                  <th className="py-3.5 px-4 text-right">
                    {isAdmin ? 'Actions (Edit / Remove)' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      No student records found matching the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* College Roll No / University Roll No */}
                      <td className="py-3.5 px-4 font-mono text-slate-900">
                        <div className="font-bold text-slate-900 leading-snug" title="College Roll No">
                          {student.rollNumber}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium leading-snug" title="University Roll No">
                          {student.registrationNumber || <span className="text-slate-400 font-normal italic">Pending University Roll</span>}
                        </div>
                      </td>

                      {/* Name & Photo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              student.photoUrl ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                            }
                            alt={student.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{student.name}</div>
                            <div className="text-[10px] text-slate-400">
                              {student.fatherMotherName ? `Guardian: ${student.fatherMotherName}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Course */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-blue-900">{student.course}</span>
                      </td>

                      {/* Year, Admission Batch & Semester */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {student.yearLevel} {student.academicYear ? `(${student.academicYear})` : student.admissionYear ? `(${student.admissionYear})` : ''}
                        </div>
                        <div className="text-[11px] text-amber-700 font-semibold">
                          {student.semester}
                        </div>
                      </td>

                      {/* Academic Status with Color Coding */}
                      <td className="py-3.5 px-4">
                        {(() => {
                          const stInfo = getStudentStatusInfo(student.academicStatus);
                          return (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${stInfo.badgeClass}`}
                              title={`Status: ${stInfo.label}`}
                            >
                              <span className={`w-2 h-2 rounded-full ${stInfo.dotClass}`} />
                              <span>{stInfo.label}</span>
                            </span>
                          );
                        })()}
                      </td>

                      {/* Category (Masked on site) */}
                      <td className="py-3.5 px-4">
                        {isAdmin ? (
                          <div className="flex items-center gap-1">
                            <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900 font-semibold text-[10px]">
                              {student.category || 'GEN'}
                            </span>
                            <span className="text-[9px] text-amber-700 font-mono font-bold">(Admin)</span>
                          </div>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-500 font-mono text-[11px] font-bold tracking-widest border border-slate-200"
                            title="Student social category is masked for privacy"
                          >
                            <Lock className="w-2.5 h-2.5 text-slate-400" />
                            <span>••••</span>
                          </span>
                        )}
                      </td>

                      {/* Contact Info (Masked for Public) */}
                      <td className="py-3.5 px-4">
                        {!isAdmin ? (
                          <div className="flex flex-col gap-1">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-[11px] font-bold tracking-widest border border-slate-200 w-fit"
                              title="Phone number masked for student privacy"
                            >
                              <Lock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              <span>••••••••••</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ••••@••••
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="text-[11px] font-mono text-slate-800">
                              {student.mobile || 'N/A'}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                              {student.email || 'N/A'}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-blue-700 transition cursor-pointer"
                            title="View Student Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                onClick={() => onEditStudent(student)}
                                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                                title="Edit Student Record"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteStudent(student.id, `${student.name} (${student.rollNumber})`)}
                                className="px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                                title={`Remove ${student.name} from student list`}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span className="hidden sm:inline">Remove</span>
                              </button>
                            </>
                          )}
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

      {/* Student Profile Card / Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#0b1a2f] text-white p-5 flex items-start justify-between border-b border-slate-800">
              <div className="flex items-center gap-4">
                <img
                  src={
                    selectedStudent.photoUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                  }
                  alt={selectedStudent.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-amber-400"
                />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                    Student Profile Card
                  </span>
                  <h3 className="font-serif-academic text-lg font-bold text-white">
                    {selectedStudent.name}
                  </h3>
                  <p className="text-xs text-slate-300 font-mono">
                    Roll: {selectedStudent.rollNumber} • Reg: {selectedStudent.registrationNumber || 'N/A'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Course / Degree
                  </span>
                  <p className="font-semibold text-slate-900">{selectedStudent.course}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Academic Session
                  </span>
                  <p className="font-semibold text-slate-900">{selectedStudent.academicYear}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Year & Semester
                  </span>
                  <p className="font-semibold text-amber-800">
                    {selectedStudent.yearLevel} • {selectedStudent.semester}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Admission Year
                  </span>
                  <p className="font-semibold text-slate-900">
                    {selectedStudent.admissionYear || 'N/A'}
                  </p>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500">
                    Academic Status
                  </span>
                  <div>
                    {(() => {
                      const stInfo = getStudentStatusInfo(selectedStudent.academicStatus);
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${stInfo.badgeClass}`}>
                          <span className={`w-2 h-2 rounded-full ${stInfo.dotClass}`} />
                          <span>{stInfo.label}</span>
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Guardian Name
                  </span>
                  <p className="font-semibold text-slate-900">
                    {selectedStudent.fatherMotherName || 'Not specified'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Category & Gender
                  </span>
                  <p className="font-semibold text-slate-900">
                    {isAdmin ? (
                      <span>
                        <span className="text-amber-800 font-bold">{selectedStudent.category || 'GEN'} (Admin view)</span>
                        <span> • {selectedStudent.gender || 'Not specified'}</span>
                      </span>
                    ) : (
                      <span>
                        <span className="text-slate-500 font-mono tracking-widest inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px] font-bold">
                          <Lock className="w-3 h-3 text-slate-400 inline" />
                          •••• (Masked)
                        </span>
                        <span> • {selectedStudent.gender || 'Not specified'}</span>
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Contact Information Box (Guarded by Privacy) */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Communication Details
                </span>

                {!isAdmin ? (
                  <div className="p-3 bg-slate-50 rounded-lg text-slate-500 text-[11px] flex items-center gap-2 border border-slate-200">
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Contact details (phone number, email, and residential address) are masked to safeguard student privacy.</span>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-blue-700" />
                      <span>{selectedStudent.mobile || 'No phone provided'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-amber-700" />
                      <span>{selectedStudent.email || 'No email provided'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-700 mt-0.5" />
                      <span>{selectedStudent.address || 'Address not listed'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              {isAdmin ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const toDelete = selectedStudent;
                      setSelectedStudent(null);
                      onDeleteStudent(toDelete.id, `${toDelete.name} (${toDelete.rollNumber})`);
                    }}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
                    title="Remove this student record from department database"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Remove Student</span>
                  </button>
                  <button
                    onClick={() => {
                      const toEdit = selectedStudent;
                      setSelectedStudent(null);
                      onEditStudent(toEdit);
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Edit Record</span>
                  </button>
                </div>
              ) : (
                <div />
              )}

              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 bg-[#0c2340] hover:bg-blue-950 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview & Direct Print Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-[#0c2340] text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-academic text-base sm:text-lg font-bold">
                    Print Student Directory &amp; Academic Roll Sheet
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Official format &bull; {filteredStudents.length} Students &bull; Batch: {activeYearTab} &bull; Course: {selectedCourse}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    printStudentDirectory(
                      filteredStudents,
                      {
                        batch: activeYearTab,
                        course: selectedCourse,
                        yearLevel: activeYearLevel,
                        semester: selectedSemester,
                        searchTerm,
                      },
                      isAdmin
                    )
                  }
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
                  title="Close Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Action Toolbar */}
            <div className="bg-slate-100 px-5 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center gap-2 text-slate-600">
                <span className="font-semibold text-slate-900">Print Preview:</span>
                <span>A4 Landscape Academic Format with Department Letterhead</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-md text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() =>
                    printStudentDirectory(
                      filteredStudents,
                      {
                        batch: activeYearTab,
                        course: selectedCourse,
                        yearLevel: activeYearLevel,
                        semester: selectedSemester,
                        searchTerm,
                      },
                      isAdmin
                    )
                  }
                  className="px-3.5 py-1.5 bg-[#0c2340] hover:bg-blue-950 text-white font-bold rounded-md text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open Print Dialog</span>
                </button>
              </div>
            </div>

            {/* Document Paper Preview */}
            <div className="p-4 sm:p-6 overflow-y-auto bg-slate-200/60 flex-1">
              <div className="bg-white border border-slate-300 shadow-lg rounded-sm p-6 sm:p-8 max-w-4xl mx-auto font-serif text-black space-y-4">
                {/* Letterhead */}
                <div className="text-center border-b-2 border-black pb-3 space-y-0.5">
                  <div className="text-sm sm:text-base font-bold tracking-wide uppercase">
                    PANCHAYAT COLLEGE, BARAGADA
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-blue-900">
                    Department of Mathematics
                  </div>
                  <div className="text-[11px] sm:text-xs font-bold uppercase underline tracking-wider pt-1">
                    Enrolled Student Directory &amp; Academic Batch Roll Sheet
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap items-center justify-between text-[11px] bg-slate-50 p-2.5 border border-slate-200 rounded font-sans gap-2">
                  <div>
                    <span className="text-slate-500">Batch:</span>{' '}
                    <strong>{activeYearTab !== 'All' ? activeYearTab : 'All Batches'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Course:</span>{' '}
                    <strong>{selectedCourse !== 'All' ? selectedCourse : 'All Courses'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Year Level:</span>{' '}
                    <strong>{activeYearLevel !== 'All' ? activeYearLevel : 'All Levels'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Semester:</span>{' '}
                    <strong>{selectedSemester !== 'All' ? selectedSemester : 'All Semesters'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Scholars:</span>{' '}
                    <strong>{filteredStudents.length}</strong>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-black text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-black text-center font-bold">
                        <th className="border-r border-black p-1.5 w-8">#</th>
                        <th className="border-r border-black p-1.5 w-28">College Roll No</th>
                        <th className="border-r border-black p-1.5 w-28">University Roll No</th>
                        <th className="border-r border-black p-1.5 text-left pl-2">Student Name</th>
                        <th className="border-r border-black p-1.5 w-20">Course</th>
                        <th className="border-r border-black p-1.5 w-24">Session &amp; Sem</th>
                        <th className="border-r border-black p-1.5 w-16">Category</th>
                        <th className="p-1.5 w-32 text-left pl-2">Contact Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-4 text-center text-slate-500">
                            No student records found matching current filters.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((s, idx) => (
                          <tr key={s.id} className="border-b border-black">
                            <td className="border-r border-black p-1 text-center">{idx + 1}</td>
                            <td className="border-r border-black p-1 font-mono font-bold">{s.rollNumber}</td>
                            <td className="border-r border-black p-1 font-mono text-[10px] text-slate-600">
                              {s.registrationNumber || 'Pending'}
                            </td>
                            <td className="border-r border-black p-1 text-left font-semibold">
                              <div>{s.name}</div>
                              {s.fatherMotherName && (
                                <div className="text-[9.5px] font-normal text-slate-500 font-sans">
                                  G: {s.fatherMotherName}
                                </div>
                              )}
                            </td>
                            <td className="border-r border-black p-1 text-center font-medium">{s.course}</td>
                            <td className="border-r border-black p-1 text-center text-[10px]">
                              {s.yearLevel} {s.semester && s.semester !== 'All' ? `(${s.semester})` : ''}
                            </td>
                            <td className="border-r border-black p-1 text-center text-[10px]">
                              {isAdmin ? s.category || 'GEN' : '••••'}
                            </td>
                            <td className="p-1 text-[10px] text-slate-600">
                              {isAdmin ? (
                                <div>
                                  <div>{s.mobile || '—'}</div>
                                  <div className="truncate max-w-[120px]">{s.email || '—'}</div>
                                </div>
                              ) : (
                                '•••••••• (Masked)'
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Signatures */}
                <div className="pt-8 flex items-end justify-between px-4 text-xs">
                  <div className="text-center">
                    <div className="border-t border-black w-36 mb-1" />
                    <div className="font-bold">Faculty Academic Advisor</div>
                    <div className="text-[10px] text-slate-600 font-sans">Dept. of Mathematics</div>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-black w-36 mb-1" />
                    <div className="font-bold">Head of Department</div>
                    <div className="text-[10px] text-slate-600 font-sans">Dept. of Mathematics</div>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-black w-36 mb-1" />
                    <div className="font-bold">Principal / Officer-in-Charge</div>
                    <div className="text-[10px] text-slate-600 font-sans">Panchayat College, Baragada</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
              <span className="text-slate-500 text-[11px]">
                Tip: In the print dialog, choose &quot;Save as PDF&quot; or select your connected printer.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() =>
                    printStudentDirectory(
                      filteredStudents,
                      {
                        batch: activeYearTab,
                        course: selectedCourse,
                        yearLevel: activeYearLevel,
                        semester: selectedSemester,
                        searchTerm,
                      },
                      isAdmin
                    )
                  }
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

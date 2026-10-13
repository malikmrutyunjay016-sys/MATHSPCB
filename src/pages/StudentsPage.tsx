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
} from 'lucide-react';
import { Student } from '../types';
import { useAuth } from '../context/AuthContext';

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

  // Extract unique academic years dynamically from database + default defaults
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>(['2026–27', '2025–26', '2024–25']);
    students.forEach((s) => {
      if (s.academicYear) yearsSet.add(s.academicYear);
    });
    return Array.from(yearsSet).sort().reverse();
  }, [students]);

  const [activeYearTab, setActiveYearTab] = useState<string>('All');
  const [activeYearLevel, setActiveYearLevel] = useState<string>('All');
  const [selectedCourse, setSelectedCourse] = useState<string>('All');
  const [selectedSemester, setSelectedSemester] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
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
  }, [students, activeYearTab, activeYearLevel, selectedCourse, selectedSemester, searchTerm]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Roll Number',
      'Registration Number',
      'Student Name',
      'Course',
      'Academic Year',
      'Year Level',
      'Semester',
      'Category',
      'Academic Status',
    ];
    if (isAdmin || !privacyEnabled) {
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
      if (isAdmin || !privacyEnabled) {
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
    window.print();
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Page Top Title Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold uppercase tracking-wider">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Department Student Database</span>
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
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer hidden sm:flex"
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
            {onOpenRegisterModal && (
              <button
                onClick={onOpenRegisterModal}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Register as New Student</span>
              </button>
            )}

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
        </div>

        {/* Search Input Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, roll number, or reg no..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-blue-600"
            />
          </div>

          <div className="text-xs text-slate-500">
            Found <strong className="text-slate-900">{filteredStudents.length}</strong> student record{filteredStudents.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Student Database Table / Grid */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-[#0f223d] text-white uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Roll No / Reg</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Program / Course</th>
                  <th className="py-3.5 px-4">Session & Term</th>
                  <th className="py-3.5 px-4">
                    <span className="flex items-center gap-1">
                      <span>Category</span>
                      <span className="text-[9px] text-amber-300 font-normal lowercase tracking-normal bg-slate-800/80 px-1 py-0.2 rounded border border-slate-700">masked</span>
                    </span>
                  </th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4 text-right">
                    {isAdmin ? 'Actions (Edit / Remove)' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      No student records found matching the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* Roll / Reg */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <div>{student.rollNumber}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {student.registrationNumber || 'Pending'}
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

                      {/* Year & Semester */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {student.yearLevel} ({student.academicYear})
                        </div>
                        <div className="text-[11px] text-amber-700 font-semibold">
                          {student.semester}
                        </div>
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

                      {/* Contact Info (Masked if Privacy Enabled) */}
                      <td className="py-3.5 px-4">
                        {privacyEnabled && !isAdmin ? (
                          <div className="text-slate-400 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span className="font-mono text-[11px]">••••••••••</span>
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

                {privacyEnabled && !isAdmin ? (
                  <div className="p-3 bg-slate-50 rounded-lg text-slate-500 italic text-[11px] flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Contact details are restricted under the College Privacy Directive.</span>
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
    </div>
  );
};

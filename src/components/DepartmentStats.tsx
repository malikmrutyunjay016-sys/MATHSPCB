import React, { useMemo } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  Award,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { DepartmentSettings, Faculty, Student, Book, getFacultyCategory } from '../types';

interface DepartmentStatsProps {
  settings: DepartmentSettings;
  faculty?: Faculty[];
  students?: Student[];
  books?: Book[];
  onNavigate: (tabId: string) => void;
}

export const DepartmentStats: React.FC<DepartmentStatsProps> = ({
  settings,
  faculty = [],
  students = [],
  books = [],
  onNavigate,
}) => {
  const facultyCount = faculty && faculty.length > 0 ? faculty.length : (settings.facultyCount || 6);
  const permanentFacultyList = useMemo(
    () => (faculty || []).filter((f) => getFacultyCategory(f) === 'regular'),
    [faculty]
  );
  const guestFacultyList = useMemo(
    () => (faculty || []).filter((f) => getFacultyCategory(f) !== 'regular'),
    [faculty]
  );

  const permanentFacultyCount = permanentFacultyList.length;
  const guestFacultyCount = guestFacultyList.length;

  const currentStudents = useMemo(() => {
    return students || [];
  }, [students]);

  const studentCount = currentStudents.length;

  const ugStudentsCount = useMemo(
    () =>
      currentStudents.filter((s) => {
        const c = (s?.course || '').toUpperCase();
        return (
          c.includes('UG') ||
          c.includes('B.SC') ||
          c.includes('NEP') ||
          c.includes('AEDP') ||
          c.includes('CBCS')
        );
      }).length,
    [currentStudents]
  );
  const pgStudentsCount = useMemo(
    () =>
      currentStudents.filter((s) => {
        const c = (s?.course || '').toUpperCase();
        return c.includes('PG') || c.includes('M.SC');
      }).length,
    [currentStudents]
  );
  const studentBatchesCount = useMemo(() => {
    if (currentStudents.length === 0) return 0;
    const yearsSet = new Set<string>();
    currentStudents.forEach((s) => {
      if (s.academicYear) yearsSet.add(s.academicYear);
      else if (s.admissionYear) yearsSet.add(s.admissionYear);
    });
    return yearsSet.size;
  }, [currentStudents]);

  const totalBookVolumes = useMemo(
    () =>
      books && books.length > 0
        ? books.reduce((acc, b) => acc + (Number(b.copies) || 1), 0)
        : (settings.bookCount || 10),
    [books, settings.bookCount]
  );
  const bookTitlesCount = useMemo(
    () => (books && books.length > 0 ? books.length : (settings.bookCount || 10)),
    [books, settings.bookCount]
  );

  const statItems = [
    {
      id: 'faculty',
      label: 'Regular & Guest Faculty',
      value: facultyCount,
      suffix: '',
      desc: `${permanentFacultyCount} Regular • ${guestFacultyCount} Guest Faculty`,
      badge: `${facultyCount} In Directory`,
      icon: Users,
      tab: 'faculty',
      color: 'from-blue-600 to-indigo-700',
    },
    {
      id: 'students',
      label: 'Enrolled Mathematics Scholars',
      value: studentCount,
      suffix: '',
      desc:
        studentCount > 0
          ? `${ugStudentsCount} UG Scholars • ${pgStudentsCount} PG Scholars`
          : '0 UG Scholars • 0 PG Scholars',
      badge:
        studentCount > 0
          ? `${studentCount} Enrolled (${studentBatchesCount} ${studentBatchesCount === 1 ? 'Batch' : 'Batches'})`
          : '0 Enrolled',
      icon: GraduationCap,
      tab: 'students',
      color: 'from-amber-600 to-yellow-600',
    },
    {
      id: 'books',
      label: 'Department Library Volumes',
      value: totalBookVolumes,
      suffix: '',
      desc: `${bookTitlesCount} Titles • ${totalBookVolumes} Physical Copies`,
      badge: `${totalBookVolumes} Volumes (${bookTitlesCount} Titles)`,
      icon: BookOpen,
      tab: 'library',
      color: 'from-emerald-600 to-teal-700',
    },
    {
      id: 'syllabus',
      label: 'Academic Programs Offered',
      value: settings.courseCount || 3,
      suffix: '',
      desc: 'B.Sc. (Hons NEP), UG AEDP & Post Graduate',
      badge: '3 Programs',
      icon: Layers,
      tab: 'syllabus',
      color: 'from-emerald-600 to-teal-700',
    },
    {
      id: 'legacy',
      label: 'Years of Academic Service',
      value: settings.yearsOfService || 52,
      suffix: ' Yrs',
      desc: 'Legacy of mathematical excellence since 1974',
      badge: 'Est. 1974',
      icon: Award,
      tab: 'home',
      color: 'from-rose-600 to-pink-700',
    },
  ];

  return (
    <section className="bg-gradient-to-b from-[#0c2340] via-[#0b1f38] to-[#08172b] text-white py-14 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Department Highlights &amp; Academic Overview</span>
          </div>
          <h2 className="font-serif-academic text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Panchayat College Department of Mathematics
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Official departmental metrics for the faculty roster, enrolled mathematics scholars, and cataloged library volumes.
          </p>
        </div>

        {/* 5 Department Highlight Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {statItems.map((stat, idx) => {
            const Icon = stat.icon;
            const isFaculty = stat.id === 'faculty';
            const isStudents = stat.id === 'students';
            const isBooks = stat.id === 'books';
            return (
              <div
                key={idx}
                onClick={() => onNavigate(stat.tab)}
                className={`bg-white/5 hover:bg-white/10 border ${
                  isFaculty
                    ? 'border-blue-400/40 hover:border-blue-300/80 bg-blue-950/20 ring-1 ring-blue-500/20'
                    : isStudents
                    ? 'border-amber-400/50 hover:border-amber-300/90 bg-amber-950/25 ring-1 ring-amber-500/30 shadow-lg shadow-amber-950/20'
                    : isBooks
                    ? 'border-emerald-400/50 hover:border-emerald-300/90 bg-emerald-950/25 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-950/20'
                    : 'border-white/10 hover:border-amber-400/50'
                } rounded-xl p-5 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between group shadow-sm relative overflow-hidden`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-slate-300 text-[10px] font-mono font-bold tracking-wide"
                  >
                    <span>OFFICIAL</span>
                  </div>
                </div>

                <div>
                  <div className="font-serif-academic text-2xl sm:text-3xl font-extrabold text-white group-hover:text-amber-300 transition-colors flex items-baseline gap-1">
                    <span>{stat.value}</span>
                    {stat.suffix && (
                      <span className="text-amber-400 text-xl font-normal">
                        {stat.suffix}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-slate-200 mt-1 line-clamp-1 group-hover:text-white transition-colors">
                    {stat.label}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                    {stat.desc}
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span
                      className={
                        isStudents
                          ? 'text-amber-300 font-semibold'
                          : isBooks
                          ? 'text-emerald-300 font-semibold'
                          : isFaculty
                          ? 'text-blue-300 font-semibold'
                          : 'text-amber-300/90'
                      }
                    >
                      {stat.badge}
                    </span>
                    <span className="text-slate-400 group-hover:text-amber-300 transition-colors flex items-center gap-0.5">
                      Explore <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

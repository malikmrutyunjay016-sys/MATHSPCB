import React from 'react';
import {
  Users,
  GraduationCap,
  FileQuestion,
  BookOpen,
  Building2,
  Bell,
  Scale,
  PhoneCall,
  ArrowRight,
  Calendar,
  BookMarked,
  Images,
} from 'lucide-react';

interface QuickAccessCardsProps {
  onNavigate: (tabId: string) => void;
  facultyCount?: number;
  studentCount?: number;
}

export const QuickAccessCards: React.FC<QuickAccessCardsProps> = ({
  onNavigate,
  facultyCount,
  studentCount,
}) => {
  const cards = [
    {
      id: 'faculty',
      title: 'Faculty Profiles',
      desc: 'Meet our professors, research specializations, qualifications & publications.',
      icon: Users,
      badge: facultyCount ? `${facultyCount} Faculty Members` : 'Faculty Profiles',
      accent: 'border-l-blue-600',
      iconBg: 'bg-blue-50 text-blue-700',
    },
    {
      id: 'students',
      title: 'Student Database',
      desc: 'Organized records by academic years (2024–27), roll numbers & semesters.',
      icon: GraduationCap,
      badge: studentCount ? `${studentCount} Enrolled Scholars` : 'Academic Sessions',
      accent: 'border-l-amber-500',
      iconBg: 'bg-amber-50 text-amber-700',
    },
    {
      id: 'syllabus',
      title: 'Course Syllabus',
      desc: 'Semester-wise NEP 2020 & AEDP curriculum, credits, outcomes & reading lists.',
      icon: BookMarked,
      badge: 'UG NEP • AEDP • PG',
      accent: 'border-l-blue-600',
      iconBg: 'bg-blue-50 text-blue-700',
    },
    {
      id: 'timetable',
      title: 'Time Table',
      desc: 'Interactive lecture routine, lab schedules & room allotments for all classes.',
      icon: Calendar,
      badge: 'Weekly Schedule',
      accent: 'border-l-teal-600',
      iconBg: 'bg-teal-50 text-teal-700',
    },
    {
      id: 'gallery',
      title: 'Department Gallery',
      desc: 'Visual archives of departmental seminars, Ramanujan Day, workshops & events.',
      icon: Images,
      badge: 'Protected Event Photos',
      accent: 'border-l-amber-500',
      iconBg: 'bg-amber-50 text-amber-700',
    },
    {
      id: 'pyq',
      title: 'Previous Year Questions',
      desc: 'Browse and download semester question papers by year and subject.',
      icon: FileQuestion,
      badge: 'CBCS Question Bank',
      accent: 'border-l-indigo-600',
      iconBg: 'bg-indigo-50 text-indigo-700',
    },
    {
      id: 'library',
      title: 'Department Library',
      desc: 'Search 1,250+ books across Real Analysis, Algebra, Calculus & Differential Equations.',
      icon: BookOpen,
      badge: 'Searchable Catalog',
      accent: 'border-l-emerald-600',
      iconBg: 'bg-emerald-50 text-emerald-700',
    },
    {
      id: 'notices',
      title: 'Notices & Circulars',
      desc: 'Important examination dates, seminar schedules, and university announcements.',
      icon: Bell,
      badge: 'Daily Updates',
      accent: 'border-l-rose-500',
      iconBg: 'bg-rose-50 text-rose-700',
    },
    {
      id: 'committees',
      title: 'College Committees',
      desc: 'Anti-Ragging, ICC, Grievance Cell, IQAC, Student Welfare and conveners.',
      icon: Scale,
      badge: 'Institutional Bodies',
      accent: 'border-l-purple-600',
      iconBg: 'bg-purple-50 text-purple-700',
    },
    {
      id: 'contacts',
      title: 'Directory & Helpdesk',
      desc: 'Emergency helplines, Principal office, HoD, examination and admission desks.',
      icon: PhoneCall,
      badge: 'Direct Phone / Email',
      accent: 'border-l-amber-600',
      iconBg: 'bg-amber-50 text-amber-800',
    },
  ];

  return (
    <section className="bg-slate-50 py-16 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-amber-700 text-xs font-bold uppercase tracking-wider">
              Quick Portals
            </span>
            <h2 className="font-serif-academic text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Explore Department Resources
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Direct access for students, researchers, alumni, and guardians.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => {
                  onNavigate(card.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`group bg-white rounded-xl p-5 border border-slate-200 hover:border-blue-400 border-l-4 ${card.accent} shadow-2xs hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-lg ${card.iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="font-serif-academic text-base font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-semibold text-blue-900 group-hover:text-amber-600 transition-colors">
                  <span>Enter Portal</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

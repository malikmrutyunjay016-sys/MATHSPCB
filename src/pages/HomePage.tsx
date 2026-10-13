import React from 'react';
import { HeroSection } from '../components/HeroSection';
import { DepartmentStats } from '../components/DepartmentStats';
import { QuickAccessCards } from '../components/QuickAccessCards';
import { CalendarNoticesSection } from '../components/CalendarNoticesSection';
import {
  Faculty,
  Student,
  Book,
  QuestionPaper,
  Notice,
  DepartmentSettings,
  Facility,
} from '../types';
import {
  GraduationCap,
  BookOpen,
  Award,
  Compass,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Users,
  Edit3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HomePageProps {
  onNavigate: (tabId: string) => void;
  notices: Notice[];
  faculty: Faculty[];
  students?: Student[];
  books?: Book[];
  settings: DepartmentSettings;
  facilities?: Facility[];
  onAddFacility?: () => void;
  onEditFacility?: (facility: Facility) => void;
  onDeleteFacility?: (id: string, name: string) => void;
  onSelectNoticePDF: (notice: Notice) => void;
  onOpenFAQModal: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  notices,
  faculty,
  students = [],
  books = [],
  settings,
  facilities = [],
  onAddFacility,
  onEditFacility,
  onDeleteFacility,
  onSelectNoticePDF,
  onOpenFAQModal,
}) => {
  const { isAdmin } = useAuth();

  const hodFaculty =
    faculty.find(
      (f) =>
        f.name.toLowerCase().includes('mrutyunjay') ||
        f.designation.toLowerCase().includes('head') ||
        f.designation.toLowerCase().includes('hod') ||
        f.order === 1
    ) || faculty[0];

  return (
    <div className="space-y-0">
      {/* 1. Hero Section (Mirroring photo banner) */}
      <HeroSection
        onNavigate={onNavigate}
        facilities={facilities}
        onAddFacility={onAddFacility}
        onEditFacility={onEditFacility}
        onDeleteFacility={onDeleteFacility}
      />

      {/* 2. Welcome & Department Philosophy Section */}
      <section className="bg-white py-16 border-b border-slate-200 relative group">
        {isAdmin && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => onNavigate('admin')}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
              title="Edit Welcome & Philosophy Section in Admin Settings"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Section
            </button>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-blue-700" />
                <span>Welcome to the Department of Mathematics</span>
              </div>

              <h2 className="font-serif-academic text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0c2340] leading-tight">
                {settings.welcomeTitle || 'Shaping Analytical Thinkers & Mathematical Pioneers Since 1960'}
              </h2>

              <p className="text-slate-700 text-sm leading-relaxed">
                {settings.welcomeDescription ||
                  'The Department of Mathematics at Panchayat College, Baragada stands as a beacon of academic distinction in Western Odisha. Affiliated to Sambalpur University, our department provides a comprehensive pedagogical framework blending classical pure mathematics — including Real Analysis, Modern Algebra, Topology, and Complex Variables — with cutting-edge computational mathematics, numerical simulation, and mathematical modeling.'}
              </p>

              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Our mission is to foster intellectual curiosity, analytical precision, and research competencies among undergraduate and postgraduate scholars. With experienced doctoral faculty, a smart seminar classroom, an in-house reference library with over 1,250 books, and dedicated computational laboratories, we equip students to excel in national competitive examinations such as IIT-JAM, CUET-PG, CSIR-NET, GATE, as well as high-growth technology and financial careers.
              </p>

              {/* Three Core Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-blue-800 font-bold text-sm flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Rigorous Pedagogy
                  </div>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    NEP curriculum with continuous assessment, tutorials, and seminar colloquiums.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-blue-800 font-bold text-sm flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Computing Lab
                  </div>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Hands-on practical training with MATLAB, Python SciPy, and LaTeX typesetting.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-blue-800 font-bold text-sm flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Research & JAM
                  </div>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Mentorship for IIT-JAM, NBHM, CUET, and higher doctoral research opportunities.
                  </p>
                </div>
              </div>
            </div>

            {/* Department Head / Leadership Message Card */}
            <div className="lg:col-span-5">
              <div className="bg-[#0b1d35] text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 font-serif text-9xl pointer-events-none">
                  ∑
                </div>

                <span className="text-amber-400 text-xs font-bold uppercase tracking-wider block mb-2">
                  Message from the Head of Department
                </span>

                <blockquote className="font-playfair italic text-slate-200 text-sm sm:text-base leading-relaxed mb-6">
                  &ldquo;{settings.hodQuote ||
                    'Mathematics is not merely a collection of formulas; it is the universal language through which humanity articulates natural laws and builds technological marvels. At Panchayat College, we inspire our learners to look beyond exams and discover the intrinsic beauty of mathematical truth.'}&rdquo;
                </blockquote>

                <div className="pt-4 border-t border-slate-800 flex items-center gap-4">
                  <img
                    src={hodFaculty?.photoUrl || '/faculty/mrutyunjay-malik.svg'}
                    alt="Mr. Mrutyunjay Malik - Assistant Professor & Head of Department"
                    className="w-14 h-14 rounded-full object-cover border-2 border-amber-400 shadow-md bg-slate-800 shrink-0"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/faculty/mrutyunjay-malik.svg';
                    }}
                  />
                  <div>
                    <h4 className="font-serif-academic text-sm sm:text-base font-bold text-white tracking-wide">
                      {hodFaculty?.name || 'Mr. Mrutyunjay Malik'}
                    </h4>
                    <p className="text-xs text-amber-300 font-semibold">
                      {hodFaculty?.designation || 'Assistant Professor & Head of Department'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {hodFaculty?.qualification || 'M.Sc, M.Tech'} • {hodFaculty?.phone || '+91 70088 19698'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Department Statistics Banner */}
      <DepartmentStats settings={settings} onNavigate={onNavigate} />

      {/* 4. Quick Academic Access Cards */}
      <QuickAccessCards onNavigate={onNavigate} />

      {/* 5. Calendar, Notice Board & Announcements Section */}
      <CalendarNoticesSection
        notices={notices}
        onNavigate={onNavigate}
        onSelectNoticePDF={onSelectNoticePDF}
      />
    </div>
  );
};

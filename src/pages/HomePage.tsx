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
} from 'lucide-react';

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
      <section className="bg-white py-16 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-blue-700" />
                <span>Welcome to the Department of Mathematics</span>
              </div>

              <h2 className="font-serif-academic text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0c2340] leading-tight">
                Shaping Analytical Thinkers & Mathematical Pioneers Since 1960
              </h2>

              <p className="text-slate-700 text-sm leading-relaxed">
                The Department of Mathematics at Panchayat College, Baragada stands as a beacon of academic distinction in Western Odisha. Affiliated to Sambalpur University, our department provides a comprehensive pedagogical framework blending classical pure mathematics — including Real Analysis, Modern Algebra, Topology, and Complex Variables — with cutting-edge computational mathematics, numerical simulation, and mathematical modeling.
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
                  &ldquo;Mathematics is not merely a collection of formulas; it is the universal language through which humanity articulates natural laws and builds technological marvels. At Panchayat College, we inspire our learners to look beyond exams and discover the intrinsic beauty of mathematical truth.&rdquo;
                </blockquote>

                <div className="pt-4 border-t border-slate-800 flex items-center gap-4">
                  <img
                    src={hodFaculty?.photoUrl || "/faculty/mrutyunjay-malik.svg"}
                    alt="Mr. Mrutyunjay Malik - Assistant Professor & Head of Department"
                    className="w-14 h-14 rounded-full object-cover border-2 border-amber-400 shadow-md bg-slate-800 shrink-0"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/faculty/mrutyunjay-malik.svg';
                    }}
                  />
                  <div>
                    <h4 className="font-serif-academic text-sm sm:text-base font-bold text-white tracking-wide">
                      Mr. Mrutyunjay Malik
                    </h4>
                    <p className="text-xs text-amber-300 font-semibold">
                      Assistant Professor &amp; Head of Department
                    </p>
                    <p className="text-[11px] text-slate-300">
                      M.Sc, M.Tech
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <button
                    onClick={() => onNavigate('faculty')}
                    className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Faculty Profiles</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-slate-400 text-[11px]">Department Office</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Quick Access Cards */}
      <QuickAccessCards onNavigate={onNavigate} />

      {/* 5. Department Highlights & Statistics */}
      <DepartmentStats
        settings={settings}
        faculty={faculty}
        students={students}
        books={books}
        onNavigate={onNavigate}
      />

      {/* 6. Calendar & Notices Section (Directly mirroring the user's photo) */}
      <CalendarNoticesSection
        notices={notices}
        onSelectNoticePDF={onSelectNoticePDF}
        onNavigate={onNavigate}
      />

      {/* 7. Faculty Highlights Preview */}
      <section className="bg-white py-16 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Academic Pedagogy
              </span>
              <h2 className="font-serif-academic text-2xl sm:text-3xl font-bold text-[#0c2340] mt-1">
                Distinguished Faculty Members
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Mentoring students through rigorous lecture seminars, problem-solving clinics, and research projects.
              </p>
            </div>

            <button
              onClick={() => onNavigate('faculty')}
              className="px-4 py-2 bg-[#0c2340] hover:bg-blue-950 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>Full Faculty Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {faculty.slice(0, 3).map((fac) => (
              <div
                key={fac.id}
                className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition group"
              >
                <div className="flex items-center gap-4 p-5">
                  <img
                    src={fac.photoUrl}
                    alt={fac.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 group-hover:border-amber-400 transition"
                  />
                  <div>
                    <h3 className="font-serif-academic text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-900 transition">
                      {fac.name}
                    </h3>
                    <p className="text-xs font-semibold text-amber-700">{fac.designation}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{fac.qualification}</p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-0 space-y-2 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-700 block text-[11px]">
                      Specialization:
                    </span>
                    <span className="text-slate-600 line-clamp-1">{fac.specialization}</span>
                  </div>

                  <p className="text-slate-600 text-[11px] line-clamp-2 italic">
                    &ldquo;{fac.profile}&rdquo;
                  </p>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate">{fac.email}</span>
                    <button
                      onClick={() => onNavigate('faculty')}
                      className="text-blue-700 hover:text-blue-900 font-semibold cursor-pointer shrink-0"
                    >
                      Profile &rarr;
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Official College Portals & External Resources */}
      <section className="bg-slate-50 py-14 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Institutional Portals
            </span>
            <h2 className="font-serif-academic text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Important External Academic Links
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {
                title: 'College Main Site',
                url: 'https://panchayatcollege.in/',
                desc: 'Official College Website',
              },
              {
                title: 'SAMS Odisha Portal',
                url: 'https://www.samsodisha.gov.in/',
                desc: 'Student Degree Admissions',
              },
              {
                title: 'Sambalpur University',
                url: 'https://www.suniv.ac.in/',
                desc: 'Affiliating University (Burla)',
              },
              {
                title: 'Exam Portal',
                url: 'https://www.suniv.ac.in/examination.php',
                desc: 'Form Fill-Up & Results',
              },
              {
                title: 'State Scholarship',
                url: 'https://scholarship.odisha.gov.in',
                desc: 'e-Medhabruti Portal',
              },
              {
                title: 'Swayam / NPTEL',
                url: 'https://swayam.gov.in',
                desc: 'Online Credit Courses',
              },
            ].map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="group p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition text-center flex flex-col items-center justify-between"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-900 flex items-center justify-center transition mb-2">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-900">
                  {link.title}
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">{link.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

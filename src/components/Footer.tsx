import React from 'react';
import {
  GraduationCap,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  ArrowUp,
  ShieldCheck,
} from 'lucide-react';

interface FooterProps {
  onNavigate: (tabId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#071324] text-slate-300 border-t border-slate-800 print:hidden">
      {/* Upper Footer Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Col 1: College & Department Identity */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white p-0.5 shadow-md border border-amber-400/50 flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src="/college-logo.svg"
                  alt="Panchayat College, Baragada Official Emblem"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h3 className="font-serif-academic text-base font-bold text-white tracking-wide">
                  Department of Mathematics
                </h3>
                <p className="text-xs text-amber-400 font-semibold">
                  Panchayat College, Baragada, Odisha
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Established in 1960. The Department of Mathematics has fostered generations of academicians, scientists, civil servants, and analytical leaders through rigorous education, mentorship, and high-impact scholarship.
            </p>

            <div className="pt-2 text-xs space-y-2 text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Panchayat College Campus, Ruhunia, Baragada - 768028, Odisha, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>+91 70088 19698 (HoD) | +91 7978520047 (Principal)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>mathoffice.pcb@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Col 2: Academic & Student Portals */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-serif-academic text-xs font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-2">
              Academic & Student Resources
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('students')}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  Student Database & Year Records
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('syllabus')}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  Course Curriculum & Syllabus
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('timetable')}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  Class Time Table & Schedule
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('gallery')}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  Department Photo Gallery & Events
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('pyq')}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  Previous Year Questions (CBCS)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('library')}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  Department Reference Library
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('notices')}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  Exam Notices & Circulars
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Institutional Committees & Governance */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-serif-academic text-xs font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-2">
              Governance & Committees
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('committees')}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  Anti-Ragging Squad & Committee
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('committees')}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  Internal Complaints Committee (ICC)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('committees')}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  Students Grievance Redressal
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('committees')}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  Internal Quality Assurance Cell (IQAC)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('contacts')}
                  className="hover:text-amber-300 transition cursor-pointer"
                >
                  Emergency Helplines & Health Centre
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: External State & University Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-serif-academic text-xs font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-2">
              Important Links
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a
                  href="https://panchayatcollege.in/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-amber-300 transition flex items-center gap-1"
                >
                  <span>College Main Site</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.suniv.ac.in/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-amber-300 transition flex items-center gap-1"
                >
                  <span>Sambalpur University</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.samsodisha.gov.in/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-amber-300 transition flex items-center gap-1"
                >
                  <span>SAMS Odisha Portal</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://scholarship.odisha.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-amber-300 transition flex items-center gap-1"
                >
                  <span>Odisha State Scholarship</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://swayam.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-amber-300 transition flex items-center gap-1"
                >
                  <span>Swayam NPTEL Modules</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Legal, Map & TOP Button Ribbon (Directly mirroring bottom strip from photo) */}
      <div className="border-t border-slate-800 bg-[#050e1a] py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="text-center sm:text-left space-y-0.5">
            <p className="font-medium text-slate-300">
              Department Helpline: +91 70088 19698 (HoD) | +91 7978520047 (Principal)
            </p>
            <p className="text-slate-500 text-[11px]">
              &copy; 2026 Department of Mathematics, Panchayat College, Baragada. All Rights Reserved.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('contact')}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white rounded text-xs font-semibold transition cursor-pointer"
            >
              Directions / Map
            </button>
            <button
              onClick={scrollToTop}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 hover:text-amber-300 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <span>TOP</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

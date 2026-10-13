import React, { useState } from 'react';
import {
  GraduationCap,
  Calendar,
  FileText,
  MessageSquare,
  HelpCircle,
  Mail,
  MapPin,
  Phone,
  Plus,
  ArrowRight,
  Sparkles,
  BookMarked,
  CheckCircle2,
} from 'lucide-react';

interface GatewaySectionProps {
  onNavigate: (tabId: string) => void;
  onOpenFAQModal: () => void;
}

export const GatewaySection: React.FC<GatewaySectionProps> = ({
  onNavigate,
  onOpenFAQModal,
}) => {
  const [activeVoiceIdx, setActiveVoiceIdx] = useState(0);

  const studentVoices = [
    {
      quote:
        'The rigorous foundation in Real Analysis and Abstract Algebra helped me crack IIT-JAM with an All India Rank. The faculty support here is unparalleled.',
      author: 'Subham Pradhan',
      badge: 'Alumnus (Batch 2024) • Now at IIT Bombay',
      date: '2026.04.12',
    },
    {
      quote:
        'Our smart classroom and computing lab with MATLAB gave us hands-on experience in numerical modeling. Panchayat College Mathematics Dept is truly premier.',
      author: 'Priyanka Sahoo',
      badge: 'B.Sc Honours Final Year Student',
      date: '2026.09.18',
    },
    {
      quote:
        'The Departmental Reference Library with over 1,200 specialized books and regular seminar presentations shaped my passion for higher research.',
      author: 'Abhilash Hota',
      badge: 'Research Scholar, Sambalpur University',
      date: '2026.07.05',
    },
  ];

  const handleNextVoice = () => {
    setActiveVoiceIdx((prev) => (prev + 1) % studentVoices.length);
  };

  return (
    <section id="gateway-section" className="bg-white py-14 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Main Split Grid (Directly mirroring the user's photo middle section) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Department Gateway & Academic Streams */}
          <div className="lg:col-span-6 bg-gradient-to-br from-slate-50 to-blue-50/40 p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="font-serif-academic text-2xl sm:text-3xl font-bold text-[#0c2340] leading-snug tracking-tight">
                Academic Programs &<br />
                Admission Guidelines
              </h2>
              <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                Affiliated to Sambalpur University, the Department of Mathematics provides robust pedagogical training combining foundational pure mathematics with contemporary computational modeling.
              </p>
            </div>

            {/* Quick Links Row */}
            <div className="pt-8 border-t border-slate-200/80 mt-6 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-semibold text-slate-700">
              <button
                onClick={() => onNavigate('students')}
                className="hover:text-blue-900 transition flex items-center gap-1 cursor-pointer"
              >
                <span>B.Sc. (Hons) Mathematics</span>
                <span className="text-slate-300">|</span>
              </button>
              <button
                onClick={() => onNavigate('library')}
                className="hover:text-blue-900 transition flex items-center gap-1 cursor-pointer"
              >
                <span>Department Reference Library</span>
                <span className="text-slate-300">|</span>
              </button>
              <button
                onClick={() => onNavigate('pyq')}
                className="hover:text-blue-900 transition flex items-center gap-1 cursor-pointer"
              >
                <span>Question Bank & CBCS Syllabus</span>
              </button>
            </div>
          </div>

          {/* Right Column: Two Sub-Cards (Calendar/Apply and Student Voice) */}
          <div className="lg:col-span-6 space-y-6 flex flex-col justify-between">
            {/* Upper Right Box: Academic Schedule & Syllabus Actions */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  Academic Calendar 2026–27
                </span>
                <h3 className="font-serif-academic text-lg font-bold text-slate-900 mt-1">
                  Examination & Term Schedules
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Odd & Even semester lesson plans, mid-term dates, and university form fill-up.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onNavigate('notices')}
                  className="px-4 py-2 border border-slate-300 hover:border-slate-800 text-slate-800 text-xs font-semibold rounded transition cursor-pointer"
                >
                  Schedule
                </button>
                <button
                  onClick={() => onNavigate('contact')}
                  className="px-4 py-2 bg-[#0c2340] hover:bg-blue-950 text-white text-xs font-semibold rounded transition cursor-pointer"
                >
                  Inquire
                </button>
              </div>
            </div>

            {/* Lower Right Box: Student Voice / Campus Experience (Mirroring Photo) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Student Voice & Testimonials
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed font-playfair">
                    &ldquo;{studentVoices[activeVoiceIdx].quote}&rdquo;
                  </p>
                  <div className="pt-2 text-xs">
                    <p className="font-bold text-slate-900">
                      {studentVoices[activeVoiceIdx].author}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {studentVoices[activeVoiceIdx].badge} • {studentVoices[activeVoiceIdx].date}
                    </p>
                  </div>
                </div>

                {/* Circular Plus Button to Cycle Testimonials (Directly from Photo) */}
                <button
                  onClick={handleNextVoice}
                  className="w-10 h-10 rounded-full border border-slate-300 hover:border-slate-800 flex items-center justify-center text-slate-700 hover:text-black transition shrink-0 cursor-pointer shadow-xs"
                  title="Next Testimonial"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Icon Action Strip (Directly from Photo: FAQ | Contact Us | Location | Directory) */}
        <div className="pt-6 border-t border-slate-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={onOpenFAQModal}
              className="group p-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-white transition flex flex-col items-center text-center cursor-pointer shadow-2xs hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 group-hover:bg-[#0c2340] text-blue-800 group-hover:text-amber-300 flex items-center justify-center transition-colors mb-2">
                <HelpCircle className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-900">
                Frequently Asked Questions
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">Admissions, SAMS & CBCS</span>
            </button>

            <button
              onClick={() => onNavigate('contact')}
              className="group p-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-white transition flex flex-col items-center text-center cursor-pointer shadow-2xs hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 group-hover:bg-[#0c2340] text-blue-800 group-hover:text-amber-300 flex items-center justify-center transition-colors mb-2">
                <Mail className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-900">
                Contact Department
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">Direct Message & Inquiries</span>
            </button>

            <button
              onClick={() => onNavigate('contact')}
              className="group p-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-white transition flex flex-col items-center text-center cursor-pointer shadow-2xs hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 group-hover:bg-[#0c2340] text-blue-800 group-hover:text-amber-300 flex items-center justify-center transition-colors mb-2">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-900">
                Campus Location
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">Baragada, Odisha 768028</span>
            </button>

            <button
              onClick={() => onNavigate('contacts')}
              className="group p-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-white transition flex flex-col items-center text-center cursor-pointer shadow-2xs hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 group-hover:bg-[#0c2340] text-blue-800 group-hover:text-amber-300 flex items-center justify-center transition-colors mb-2">
                <Phone className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-900">
                Telephone Directory
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">HoD, Principal & Offices</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Calendar as CalendarIcon,
  Download,
  Search,
  BellRing,
  ArrowRight,
} from 'lucide-react';
import { Notice } from '../types';

interface CalendarNoticesSectionProps {
  notices: Notice[];
  onSelectNoticePDF: (notice: Notice) => void;
  onNavigate: (tabId: string) => void;
}

export const CalendarNoticesSection: React.FC<CalendarNoticesSectionProps> = ({
  notices,
  onSelectNoticePDF,
  onNavigate,
}) => {
  const [selectedMonth, setSelectedMonth] = useState('October 2026');
  const [selectedDay, setSelectedDay] = useState<number | null>(16);

  // Calendar dates for October 2026 (Starts on Thursday)
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);
  const startOffset = 4; // Thursday

  // Notable event dates
  const eventDays: { [key: number]: string } = {
    2: 'Assessment Guidelines',
    10: 'Guest Lecture by Sambalpur Univ Prof',
    16: 'Internal Assessment Tests Begin',
    25: 'Swayam Registration Deadline',
    30: 'Library Stock Circulation',
  };

  const handlePrevMonth = () => {
    setSelectedMonth('September 2026');
    setSelectedDay(28);
  };

  const handleNextMonth = () => {
    setSelectedMonth('November 2026');
    setSelectedDay(5);
  };

  return (
    <section className="bg-[#071324] text-white py-16 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Ribbon (Directly matching photo: "Public Notices / Department Events") */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest">
              <BellRing className="w-4 h-4 text-amber-400" />
              <span>Department Notices & Academic Calendar</span>
            </div>
            <h2 className="font-serif-academic text-3xl sm:text-4xl font-extrabold text-white mt-1">
              {selectedMonth}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="w-10 h-10 rounded-full border border-slate-700 hover:border-slate-500 bg-slate-900/60 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="w-10 h-10 rounded-full border border-slate-700 hover:border-slate-500 bg-slate-900/60 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Two-Column Grid: Left Calendar / Right Notices List (Mirroring Photo) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Calendar Grid & Quick Export Tools */}
          <div className="lg:col-span-5 bg-[#0b1a2f] border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
                <span>Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium">
                {/* Empty prefix boxes */}
                {Array.from({ length: startOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className="py-2 text-slate-700 select-none text-xs">
                    {27 + i}
                  </div>
                ))}

                {daysInMonth.map((day) => {
                  const hasEvent = Boolean(eventDays[day]);
                  const isSelected = selectedDay === day;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`relative py-2 text-xs sm:text-sm rounded-lg transition cursor-pointer flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 font-bold shadow-md scale-105'
                          : hasEvent
                          ? 'text-white hover:bg-slate-800 font-semibold'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      }`}
                    >
                      <span>{day}</span>
                      {hasEvent && !isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute bottom-1"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Indicator Banner */}
            {selectedDay && eventDays[selectedDay] && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs">
                <span className="font-bold text-amber-300 block">
                  Event on {selectedMonth.split(' ')[0]} {selectedDay}:
                </span>
                <span className="text-slate-200">{eventDays[selectedDay]}</span>
              </div>
            )}
          </div>

          {/* Right Column: Notices List (Mirroring Photo) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-3">
              {notices.slice(0, 5).map((notice) => (
                <div
                  key={notice.id}
                  className="group bg-[#0b1a2f]/80 hover:bg-[#0f2442] border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded shrink-0 uppercase tracking-wider ${
                        notice.category === 'Examination'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/50'
                          : notice.category === 'Seminar'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800/50'
                          : notice.category === 'Scholarship'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                          : 'bg-blue-950 text-blue-300 border border-blue-800/50'
                      }`}
                    >
                      {notice.category}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {notice.isImportant && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                        )}
                        <h4 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                          {notice.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-1">
                        {notice.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <span className="text-xs text-slate-400 font-mono">{notice.date}</span>

                    <div className="flex items-center gap-1.5">
                      {notice.attachmentUrl ? (() => {
                        const isPhoto =
                          notice.attachmentUrl.startsWith('data:image/') ||
                          Boolean(notice.attachmentUrl.match(/\.(jpeg|jpg|png|webp|gif)($|\?)/i));
                        return (
                          <button
                            onClick={() => onSelectNoticePDF(notice)}
                            className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                            title={isPhoto ? 'View / Download Attached Photo' : 'View / Download Attached PDF'}
                          >
                            <Download className="w-3 h-3" />
                            <span>{isPhoto ? 'Photo' : 'PDF'}</span>
                          </button>
                        );
                      })() : (
                        <button
                          onClick={() => onNavigate('notices')}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="View Details"
                        >
                          <Search className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Right: Button to Notice Board Archive (Directly from Photo) */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => onNavigate('notices')}
                className="px-5 py-2.5 rounded border border-slate-700 hover:border-amber-400 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-bold tracking-wider uppercase transition flex items-center gap-2 cursor-pointer"
              >
                <span>View Full Notice Board & Archive</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

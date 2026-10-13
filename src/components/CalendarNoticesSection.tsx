import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Calendar as CalendarIcon,
  Download,
  Search,
  BellRing,
  ArrowRight,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  X,
  Zap,
  UserCheck,
} from 'lucide-react';
import { Notice, Faculty } from '../types';

interface CalendarNoticesSectionProps {
  notices: Notice[];
  onSelectNoticePDF: (notice: Notice) => void;
  onNavigate: (tabId: string) => void;
  isAdmin?: boolean;
  onSaveNotice?: (notice: Notice) => void;
  faculty?: Faculty[];
}

interface CalendarEvent {
  id: string;
  year: number;
  month: number; // 0-11
  day: number;
  title: string;
  isHoliday: boolean;
  isDoingNow: boolean;
  source?: 'extracted' | 'custom' | 'faculty-leave';
  facultyName?: string;
  leaveType?: string;
}

const facultyColors = [
  { bg: 'bg-purple-950', text: 'text-purple-300', border: 'border-purple-700', badge: 'bg-purple-600 text-white' },
  { bg: 'bg-teal-950', text: 'text-teal-300', border: 'border-teal-700', badge: 'bg-teal-600 text-white' },
  { bg: 'bg-indigo-950', text: 'text-indigo-300', border: 'border-indigo-700', badge: 'bg-indigo-600 text-white' },
  { bg: 'bg-rose-950', text: 'text-rose-300', border: 'border-rose-700', badge: 'bg-rose-600 text-white' },
  { bg: 'bg-cyan-950', text: 'text-cyan-300', border: 'border-cyan-700', badge: 'bg-cyan-600 text-white' },
  { bg: 'bg-amber-950', text: 'text-amber-300', border: 'border-amber-700', badge: 'bg-amber-600 text-slate-950' },
];

const facultyColorHexes = ['#9333ea', '#0d9488', '#4f46e5', '#e11d48', '#0891b2', '#d97706'];

const getFacultyColor = (name: string, facultyList: Faculty[] = []) => {
  const index = facultyList.findIndex((f) => f.name === name);
  const colorIndex =
    index >= 0
      ? index % facultyColors.length
      : Math.abs(name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % facultyColors.length;
  return facultyColors[colorIndex];
};

const getFacultyHex = (name: string, facultyList: Faculty[] = []) => {
  const index = facultyList.findIndex((f) => f.name === name);
  return index >= 0 ? facultyColorHexes[index % facultyColorHexes.length] : '#9333ea';
};

export const CalendarNoticesSection: React.FC<CalendarNoticesSectionProps> = ({
  notices,
  onSelectNoticePDF,
  onNavigate,
  isAdmin = false,
  onSaveNotice,
  faculty = [],
}) => {
  // Current date navigation (supports any month/year across previous, current, next)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2026, 9, 1)); // Default to Oct 2026
  const [selectedDay, setSelectedDay] = useState<number>(16);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11

  // Days in active month & start offset (0 = Sunday, 1 = Monday, etc.)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = new Date(year, month, 1).getDay();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const activeMonthName = `${monthNames[month]} ${year}`;

  // Stored calendar events & holidays (persisted in localStorage)
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem('dept_calendar_events_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isFacultyLeaveModalOpen, setIsFacultyLeaveModalOpen] = useState(false);

  const [extractedPreviewText, setExtractedPreviewText] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // New event form state
  const [newEventDay, setNewEventDay] = useState<number>(1);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventIsHoliday, setNewEventIsHoliday] = useState(false);
  const [newEventIsDoingNow, setNewEventIsDoingNow] = useState(false);

  // Faculty leave form state
  const [leaveFacultyName, setLeaveFacultyName] = useState(faculty[0]?.name || '');
  const [leaveType, setLeaveType] = useState<'CL' | 'DL' | 'Academic Leave' | 'Additional Casual Leave'>('CL');
  const [leaveStartDate, setLeaveStartDate] = useState('2026-10-14');
  const [leaveEndDate, setLeaveEndDate] = useState('2026-10-15');
  const [leaveDateRangeText, setLeaveDateRangeText] = useState('14/10/2026 to 15/10/2026');

  const formatDateToDDMMYYYY = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLeaveStartDate(val);
    const startFormatted = formatDateToDDMMYYYY(val);
    const endFormatted = formatDateToDDMMYYYY(leaveEndDate);
    if (val && leaveEndDate) {
      setLeaveDateRangeText(`${startFormatted} to ${endFormatted}`);
    } else if (val) {
      setLeaveDateRangeText(startFormatted);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLeaveEndDate(val);
    const startFormatted = formatDateToDDMMYYYY(leaveStartDate);
    const endFormatted = formatDateToDDMMYYYY(val);
    if (leaveStartDate && val) {
      setLeaveDateRangeText(`${startFormatted} to ${endFormatted}`);
    } else if (val) {
      setLeaveDateRangeText(endFormatted);
    }
  };

  // Save events to localStorage
  const saveEventsToStorage = (updated: CalendarEvent[]) => {
    setEvents(updated);
    try {
      localStorage.setItem('dept_calendar_events_v2', JSON.stringify(updated));
    } catch {}
  };

  const isSunday = (day: number) => {
    const d = new Date(year, month, day);
    return d.getDay() === 0;
  };

  const isHoliday = (day: number) => {
    if (isSunday(day)) return true;
    return events.some(
      (e) => e.year === year && e.month === month && e.day === day && e.isHoliday && (e.source !== 'faculty-leave' || isAdmin)
    );
  };

  const getEventsForDay = (day: number) => {
    const list: { title: string; isHoliday: boolean; isDoingNow: boolean; id?: string; source?: string; facultyName?: string; leaveType?: string }[] = [];
    if (isSunday(day)) {
      list.push({ title: 'Sunday (Weekly Holiday)', isHoliday: true, isDoingNow: false });
    }
    events
      .filter((e) => e.year === year && e.month === month && e.day === day)
      .forEach((e) => {
        if (e.source === 'faculty-leave' && !isAdmin) return;
        if (!list.some((l) => l.title === e.title && l.facultyName === e.facultyName)) {
          list.push({
            title: e.title,
            isHoliday: e.isHoliday,
            isDoingNow: e.isDoingNow,
            id: e.id,
            source: e.source,
            facultyName: e.facultyName,
            leaveType: e.leaveType,
          });
        }
      });
    return list;
  };

  // Add Faculty Leave Handler
  const handleAddFacultyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveFacultyName) return;

    const rangeMatch = leaveDateRangeText.match(
      /\b([0-3]?[0-9])\/([0-1]?[0-9])\/(\d{4})\s+(?:to|\-)\s+([0-3]?[0-9])\/([0-1]?[0-9])\/(\d{4})\b/i
    );

    const newFacultyEvents: CalendarEvent[] = [];

    if (rangeMatch) {
      const startDay = Number(rangeMatch[1]);
      const startMonth = Number(rangeMatch[2]) - 1;
      const startYear = Number(rangeMatch[3]);
      const endDay = Number(rangeMatch[4]);
      const endMonth = Number(rangeMatch[5]) - 1;
      const endYear = Number(rangeMatch[6]);

      const startDate = new Date(startYear, startMonth, startDay);
      const endDate = new Date(endYear, endMonth, endDay);

      let curr = new Date(startDate);
      while (curr <= endDate) {
        newFacultyEvents.push({
          id: `leave-${leaveFacultyName}-${curr.getFullYear()}-${curr.getMonth()}-${curr.getDate()}-${Math.random()}`,
          year: curr.getFullYear(),
          month: curr.getMonth(),
          day: curr.getDate(),
          title: `${leaveFacultyName} on ${leaveType}`,
          isHoliday: true,
          isDoingNow: false,
          source: 'faculty-leave',
          facultyName: leaveFacultyName,
          leaveType,
        });
        curr.setDate(curr.getDate() + 1);
      }
    } else {
      const dateMatch = leaveDateRangeText.match(/\b([0-3]?[0-9])\/([0-1]?[0-9])\/(\d{4})\b/);
      if (dateMatch) {
        const day = Number(dateMatch[1]);
        const month = Number(dateMatch[2]) - 1;
        const year = Number(dateMatch[3]);

        newFacultyEvents.push({
          id: `leave-${leaveFacultyName}-${year}-${month}-${day}-${Math.random()}`,
          year,
          month,
          day,
          title: `${leaveFacultyName} on ${leaveType}`,
          isHoliday: true,
          isDoingNow: false,
          source: 'faculty-leave',
          facultyName: leaveFacultyName,
          leaveType,
        });
      }
    }

    if (newFacultyEvents.length > 0) {
      saveEventsToStorage([...events, ...newFacultyEvents]);
      setSuccessMsg(`Successfully added ${leaveType} for ${leaveFacultyName} (Admin View Only)!`);
      setTimeout(() => {
        setSuccessMsg('');
        setIsFacultyLeaveModalOpen(false);
      }, 1500);
    }
  };

  const confirmExtractAndFeed = () => {
    const lines = extractedPreviewText.split('\n');
    const parsedEvents: CalendarEvent[] = [];

    lines.forEach((line) => {
      if (!line.trim()) return;

      const rangeMatch = line.match(
        /\b([0-3]?[0-9])\/([0-1]?[0-9])\/(\d{4})\s+(?:to|\-)\s+([0-3]?[0-9])\/([0-1]?[0-9])\/(\d{4})\b/i
      );

      if (rangeMatch) {
        const startDay = Number(rangeMatch[1]);
        const startMonth = Number(rangeMatch[2]) - 1;
        const startYear = Number(rangeMatch[3]);
        const endDay = Number(rangeMatch[4]);
        const endMonth = Number(rangeMatch[5]) - 1;
        const endYear = Number(rangeMatch[6]);

        let title = line.substring(0, line.indexOf(rangeMatch[0])).trim();
        title = title.replace(/[\-\:\,\s]+$/, '').trim();
        if (!title) title = 'Holiday Vacation';

        const startDate = new Date(startYear, startMonth, startDay);
        const endDate = new Date(endYear, endMonth, endDay);

        let curr = new Date(startDate);
        while (curr <= endDate) {
          parsedEvents.push({
            id: `parsed-range-${curr.getFullYear()}-${curr.getMonth()}-${curr.getDate()}-${Math.random()}`,
            year: curr.getFullYear(),
            month: curr.getMonth(),
            day: curr.getDate(),
            title,
            isHoliday: true,
            isDoingNow: false,
            source: 'extracted',
          });
          curr.setDate(curr.getDate() + 1);
        }
      } else {
        const dateMatch = line.match(/\b([0-3]?[0-9])\/([0-1]?[0-9])\/(\d{4})\b/);
        if (dateMatch) {
          const day = Number(dateMatch[1]);
          const month = Number(dateMatch[2]) - 1;
          const year = Number(dateMatch[3]);

          let title = line.substring(0, line.indexOf(dateMatch[0])).trim();
          title = title.replace(/[\-\:\,\s]+$/, '').trim();
          if (!title) {
            title = 'Holiday';
          }

          parsedEvents.push({
            id: `parsed-${year}-${month}-${day}-${Math.random()}`,
            year,
            month,
            day,
            title,
            isHoliday: true,
            isDoingNow: false,
            source: 'extracted',
          });
        }
      }
    });

    const finalEvents: CalendarEvent[] = parsedEvents.length > 0 ? parsedEvents : [
      {
        id: `parsed-2026-9-2-${Math.random()}`,
        year: 2026,
        month: 9,
        day: 2,
        title: 'Gandhi Jayanti',
        isHoliday: true,
        isDoingNow: false,
        source: 'extracted' as const,
      }
    ];

    if (finalEvents.length > 0) {
      setCurrentDate(new Date(finalEvents[0].year, finalEvents[0].month, 1));
      setSelectedDay(finalEvents[0].day);
    }

    const filtered = events.filter((e) => e.source !== 'extracted');
    saveEventsToStorage([...filtered, ...finalEvents]);
    setSuccessMsg(`Successfully created holiday list with ${finalEvents.length} items!`);
    setTimeout(() => {
      setSuccessMsg('');
      setIsUploadModalOpen(false);
    }, 1500);
  };

  const handleUndoExtractedHolidays = () => {
    const filtered = events.filter((e) => e.source !== 'extracted');
    saveEventsToStorage(filtered);
    setSuccessMsg('Holiday list cleared / undone.');
    setTimeout(() => setSuccessMsg(''), 1500);
  };

  const handleClearAllMonthEvents = () => {
    if (!window.confirm(`Are you sure you want to clear all added events and holidays for ${activeMonthName}?`)) return;
    const filtered = events.filter((e) => !(e.year === year && e.month === month));
    saveEventsToStorage(filtered);
    setSuccessMsg('All events cleared from calendar for this month.');
    setTimeout(() => setSuccessMsg(''), 1500);
  };

  const handleAddCustomEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    const ev: CalendarEvent = {
      id: Date.now().toString(),
      year,
      month,
      day: Number(newEventDay),
      title: newEventTitle.trim(),
      isHoliday: newEventIsHoliday,
      isDoingNow: newEventIsDoingNow,
      source: 'custom',
    };
    saveEventsToStorage([...events, ev]);
    setNewEventTitle('');
    setNewEventIsHoliday(false);
    setNewEventIsDoingNow(false);
    setIsAddEventModalOpen(false);
  };

  const handleDeleteEvent = (id: string) => {
    saveEventsToStorage(events.filter((e) => e.id !== id));
  };

  const handleToggleNoticeDoingNow = (notice: Notice) => {
    if (!onSaveNotice) return;
    const updated: Notice = { ...notice, isDoingNow: !notice.isDoingNow };
    onSaveNotice(updated);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <section className="bg-[#071324] text-white py-16 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Ribbon & Admin Tools */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest">
              <BellRing className="w-4 h-4 text-amber-400" />
              <span>Department Notices & Academic Calendar</span>
            </div>
            <h2 className="font-serif-academic text-3xl sm:text-4xl font-extrabold text-white mt-1">
              {activeMonthName}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isAdmin && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  title="Add occasion and dates in dd/mm/yyyy format"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Add Occasion & Dates</span>
                </button>
                <button
                  onClick={() => setIsFacultyLeaveModalOpen(true)}
                  className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  title="Add Faculty CL/DL/Academic Leave (Admin Only)"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Add Faculty Leave (CL/DL)</span>
                </button>
                <button
                  onClick={() => setIsAddEventModalOpen(true)}
                  className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Event / Holiday</span>
                </button>
                <button
                  onClick={handleClearAllMonthEvents}
                  className="px-3 py-2 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Clear all events from calendar for this month"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Events</span>
                </button>
              </div>
            )}

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
        </div>

        {/* Two-Column Grid: Left Calendar / Right Notices List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: True Dynamic Calendar Grid */}
          <div className="lg:col-span-5 bg-[#0b1a2f] border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  <span className="text-emerald-300 font-semibold">Holiday / Sunday</span>
                </span>
                {isAdmin && (
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
                    <span className="text-purple-300 font-semibold">Faculty Leave (Admin)</span>
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
                <span className="text-emerald-400">Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium">
                {Array.from({ length: startOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className="py-2 text-slate-700 select-none text-xs">
                    {new Date(year, month, 0).getDate() - startOffset + i + 1}
                  </div>
                ))}

                {daysArray.map((day) => {
                  const holiday = isHoliday(day);
                  const eventsList = getEventsForDay(day);
                  const hasEvents = eventsList.length > 0;
                  const isSelected = selectedDay === day;
                  const facultyLeavesToday = isAdmin ? eventsList.filter((e) => e.source === 'faculty-leave' && e.facultyName) : [];
                  const hasFacultyLeave = facultyLeavesToday.length > 0;

                  let buttonStyle: React.CSSProperties = {};
                  let buttonClassName = '';

                  if (isSelected) {
                    buttonClassName = holiday ? 'bg-emerald-600 text-white ring-2 ring-white font-bold scale-105 shadow-md' : 'bg-amber-400 text-slate-950 ring-2 ring-white font-bold scale-105 shadow-md';
                  } else if (hasFacultyLeave) {
                    if (facultyLeavesToday.length === 1) {
                      const hex = getFacultyHex(facultyLeavesToday[0].facultyName!, faculty);
                      buttonStyle = {
                        borderColor: hex,
                        borderWidth: '2px',
                        backgroundColor: `${hex}22`,
                      };
                      buttonClassName = 'text-white font-bold';
                    } else {
                      // 2 or more faculty on leave on the same day: divide the box diagonally (upper half first person, lower half second person)
                      const hex1 = getFacultyHex(facultyLeavesToday[0].facultyName!, faculty);
                      const hex2 = getFacultyHex(facultyLeavesToday[1].facultyName!, faculty);
                      buttonStyle = {
                        backgroundImage: `linear-gradient(135deg, ${hex1} 50%, ${hex2} 50%)`,
                        borderWidth: '2px',
                        borderColor: hex1,
                      };
                      buttonClassName = 'text-white font-bold shadow-md';
                    }
                  } else if (holiday) {
                    buttonClassName = 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-bold hover:bg-emerald-900/80';
                  } else if (hasEvents) {
                    buttonClassName = 'text-white bg-slate-800/80 hover:bg-slate-700 font-semibold';
                  } else {
                    buttonClassName = 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200';
                  }

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      style={buttonStyle}
                      className={`relative py-2.5 text-xs sm:text-sm rounded-lg transition cursor-pointer flex flex-col items-center justify-center ${buttonClassName}`}
                    >
                      <span>{day}</span>
                      {holiday && !isSelected && !hasFacultyLeave && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute bottom-1"></span>
                      )}
                      {hasFacultyLeave && !isSelected && (
                        <div className="absolute bottom-1 flex items-center gap-0.5">
                          {facultyLeavesToday.map((fl, idx) => (
                            <span
                              key={idx}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: getFacultyHex(fl.facultyName!, faculty) }}
                              title={`${fl.facultyName} on ${fl.leaveType}`}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Indicator Banner */}
            <div className="rounded-lg p-3.5 text-xs border bg-slate-900/80 border-slate-700">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold uppercase tracking-wider text-[10px] text-amber-400">
                  {monthNames[month]} {selectedDay}, {year}
                </span>
                {isHoliday(selectedDay) && (
                  <span className="px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 font-bold text-[10px]">
                    Holiday
                  </span>
                )}
              </div>
              {getEventsForDay(selectedDay).length > 0 ? (
                <ul className="space-y-1.5 mt-2">
                  {getEventsForDay(selectedDay).map((ev, idx) => {
                    const isLeave = ev.source === 'faculty-leave';
                    const facultyColor = isLeave && ev.facultyName ? getFacultyColor(ev.facultyName, faculty) : null;
                    const facultyHex = isLeave && ev.facultyName ? getFacultyHex(ev.facultyName, faculty) : '#9333ea';

                    return (
                      <li key={idx} className="flex items-center justify-between font-semibold">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: isLeave ? facultyHex : ev.isHoliday ? '#34d399' : '#fbbf24' }}
                          />
                          <span
                            className={
                              isLeave
                                ? `px-2 py-0.5 rounded text-[11px] font-bold border ${facultyColor?.bg} ${facultyColor?.text} ${facultyColor?.border}`
                                : ev.isHoliday
                                ? 'text-emerald-300'
                                : 'text-slate-200'
                            }
                          >
                            {ev.title} {isLeave && `(${ev.leaveType})`}
                          </span>
                        </div>
                        {isAdmin && ev.id && (
                          <button
                            onClick={() => handleDeleteEvent(ev.id!)}
                            className="text-rose-400 hover:text-rose-300 text-[10px] p-1 cursor-pointer"
                            title="Delete Event / Leave"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-slate-400 italic mt-1">No events or holidays scheduled on this date.</p>
              )}
            </div>
          </div>

          {/* Right Column: Notices List & "Doing Now" management */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif-academic text-lg font-bold text-white">Recent Notices & Active Events</h3>
              {isAdmin && (
                <span className="text-[11px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                  Admin Mode: Faculty leaves visible to admin only
                </span>
              )}
            </div>

            <div className="space-y-3">
              {notices.slice(0, 5).map((notice) => (
                <div
                  key={notice.id}
                  className={`group rounded-xl p-4 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${
                    notice.isDoingNow
                      ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg ring-1 ring-emerald-500/30'
                      : 'bg-[#0b1a2f]/80 hover:bg-[#0f2442] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded uppercase tracking-wider text-center ${
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
                      {notice.isDoingNow && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500 text-slate-950 animate-pulse text-center tracking-wider">
                          DOING NOW
                        </span>
                      )}
                    </div>

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

                    <div className="flex items-center gap-2">
                      {isAdmin && onSaveNotice && (
                        <button
                          onClick={() => handleToggleNoticeDoingNow(notice)}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                            notice.isDoingNow
                              ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                          title="Mark or unmark as Doing Now / Active"
                        >
                          <Zap className="w-3 h-3" />
                          <span>{notice.isDoingNow ? 'Active Now' : 'Mark Doing Now'}</span>
                        </button>
                      )}

                      {notice.attachmentUrl ? (() => {
                        const isPhoto =
                          notice.attachmentUrl.startsWith('data:image/') ||
                          Boolean(notice.attachmentUrl.match(/\.(jpeg|jpg|png|webp|gif)($|\?)/i));
                        return (
                          <button
                            onClick={() => onSelectNoticePDF(notice)}
                            className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                            title={isPhoto ? 'View Attached Photo' : 'View Attached PDF'}
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

            {/* Bottom Right: Button to Notice Board Archive */}
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

        {/* Add Faculty Leave Modal (Admin Only) */}
        {isFacultyLeaveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-[#0b1a2f] text-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-700 overflow-hidden flex flex-col">
              <div className="bg-[#071324] p-5 flex items-center justify-between border-b border-slate-800">
                <h3 className="font-serif-academic text-lg font-bold flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-purple-400" />
                  <span>Add Faculty Leave (CL / DL / Academic Leave)</span>
                </h3>
                <button
                  onClick={() => setIsFacultyLeaveModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddFacultyLeave} className="p-6 space-y-4">
                {successMsg && (
                  <div className="p-3 bg-purple-950/80 border border-purple-500/50 text-purple-300 rounded-lg text-xs font-semibold">
                    {successMsg}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Select Faculty Member</label>
                  <select
                    value={leaveFacultyName}
                    onChange={(e) => setLeaveFacultyName(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-700 text-xs bg-slate-900 text-white"
                    required
                  >
                    {faculty.map((f) => (
                      <option key={f.id || f.name} value={f.name}>
                        {f.name} ({f.designation})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Leave Type</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-slate-700 text-xs bg-slate-900 text-white"
                  >
                    <option value="CL">CL (Casual Leave)</option>
                    <option value="DL">DL (Duty Leave)</option>
                    <option value="Academic Leave">Academic Leave</option>
                    <option value="Additional Casual Leave">Additional Casual Leave</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Choose Dates from Calendar
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-400">Start Date</label>
                      <input
                        type="date"
                        value={leaveStartDate}
                        onChange={handleStartDateChange}
                        className="w-full p-2 rounded-lg border border-slate-700 text-xs bg-slate-900 text-white cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-400">End Date</label>
                      <input
                        type="date"
                        value={leaveEndDate}
                        onChange={handleEndDateChange}
                        className="w-full p-2 rounded-lg border border-slate-700 text-xs bg-slate-900 text-white cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Date Range (Format: <span className="text-amber-300">dd/mm/yyyy to dd/mm/yyyy</span>)
                  </label>
                  <input
                    type="text"
                    value={leaveDateRangeText}
                    onChange={(e) => setLeaveDateRangeText(e.target.value)}
                    placeholder="e.g. 14/10/2026 to 16/10/2026"
                    className="w-full p-2.5 rounded-lg border border-slate-700 text-xs bg-slate-900 text-white font-mono"
                    required
                  />
                  <p className="text-[11px] text-slate-400">
                    Faculty leaves are private and visible <b>only to admin</b>. If multiple faculty are on leave on the same day, the date box divides into their respective colors.
                  </p>
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsFacultyLeaveModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md cursor-pointer"
                  >
                    Save Faculty Leave
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Occasions & Dates Text / Upload Modal */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-[#0b1a2f] text-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-700 overflow-hidden flex flex-col">
              <div className="bg-[#071324] p-5 flex items-center justify-between border-b border-slate-800">
                <h3 className="font-serif-academic text-lg font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <span>Add Occasion & Dates (dd/mm/yyyy)</span>
                </h3>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {successMsg && (
                  <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-lg text-xs font-semibold">
                    {successMsg}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Occasion and Dates (Format: <span className="text-amber-300">Occasion - dd/mm/yyyy</span>)
                  </label>
                  <textarea
                    rows={6}
                    value={extractedPreviewText}
                    onChange={(e) => setExtractedPreviewText(e.target.value)}
                    placeholder="e.g.&#10;Gandhi Jayanti - 02/10/2026&#10;Durga Puja Vacation - 18/10/2026 to 22/10/2026&#10;Diwali - 31/10/2026"
                    className="w-full p-3 rounded-lg border border-slate-700 text-xs bg-slate-900 text-emerald-300 font-mono leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400">
                    Type or paste line by line. The <b>first part is the occasion</b>, and the <b>date is in dd/mm/yyyy format</b>.
                  </p>
                </div>

                <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleUndoExtractedHolidays}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-rose-300 hover:bg-rose-950/50 transition cursor-pointer"
                  >
                    Undo Holiday List
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsUploadModalOpen(false)}
                      className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:bg-slate-800 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmExtractAndFeed}
                      className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md cursor-pointer flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Create Holiday List</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Custom Event / Holiday Modal */}
        {isAddEventModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-[#0b1a2f] text-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-700 overflow-hidden flex flex-col">
              <div className="bg-[#071324] p-5 flex items-center justify-between border-b border-slate-800">
                <h3 className="font-serif-academic text-lg font-bold flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-amber-400" />
                  <span>Add Event / Holiday for {activeMonthName}</span>
                </h3>
                <button
                  onClick={() => setIsAddEventModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddCustomEvent} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Day (1 - {daysInMonth})</label>
                  <input
                    type="number"
                    min={1}
                    max={daysInMonth}
                    value={newEventDay}
                    onChange={(e) => setNewEventDay(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-700 text-xs bg-slate-900 text-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Event or Holiday Title</label>
                  <input
                    type="text"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="e.g. Department Seminar / Holiday"
                    className="w-full p-2.5 rounded-lg border border-slate-700 text-xs bg-slate-900 text-white"
                    required
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newEventIsHoliday}
                      onChange={(e) => setNewEventIsHoliday(e.target.checked)}
                      className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>Mark as Holiday (Show in Green on Calendar)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newEventIsDoingNow}
                      onChange={(e) => setNewEventIsDoingNow(e.target.checked)}
                      className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>Mark as "Doing Now" (Active Ongoing Event)</span>
                  </label>
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddEventModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-md cursor-pointer"
                  >
                    Save Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

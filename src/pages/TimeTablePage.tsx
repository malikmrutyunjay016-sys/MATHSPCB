import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Printer,
  Download,
  CheckCircle,
  AlertTriangle,
  Search,
  LayoutGrid,
  X,
  FileText,
  Building,
  Sparkles,
  Settings,
  Undo2,
  Redo2,
  ExternalLink,
} from 'lucide-react';
import { TimeTableSlot, DayOfWeek, TimeTablePeriod, TimeTableClassRow, Faculty } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  generatePrintableScheduleHtml,
  generatePrintableMasterDayHtml,
  generatePrintableAllDaysMasterHtml,
  generatePrintableFacultyScheduleHtml,
  triggerDirectPrint,
  openHtmlInNewTab,
  checkFacultyConflict,
  areTimesOverlapping,
  getMasterCellSpanInfo,
  getSemesterCellSpanInfo,
  getFacultyDesignation,
  calculateFacultyTotalClasses,
  countSlotClasses,
} from '../utils/timeTableUtils';
import { TimeTablePeriodModal, TimeTableClassRowModal } from '../components/AdminEntityModals';
import { initialPeriods, initialClassRows } from '../data/initialData';

interface TimeTablePageProps {
  slots: TimeTableSlot[];
  periods?: TimeTablePeriod[];
  classRows?: TimeTableClassRow[];
  facultyList?: Faculty[];
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onAddSlot: (defaults?: {
    course: string;
    yearLevel: string;
    semester: string;
    dayOfWeek: DayOfWeek;
    periodNumber?: number;
    startTime?: string;
    endTime?: string;
  }) => void;
  onEditSlot: (slot: TimeTableSlot) => void;
  onDeleteSlot: (id: string, name: string) => void;
  onClearAllSlots?: () => void;
  onSavePeriod?: (period: TimeTablePeriod) => void;
  onDeletePeriod?: (id: string, label: string) => void;
  onSaveClassRow?: (row: TimeTableClassRow) => void;
  onDeleteClassRow?: (id: string, label: string) => void;
}

const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const TimeTablePage: React.FC<TimeTablePageProps> = ({
  slots,
  periods: propPeriods,
  classRows: propClassRows,
  facultyList,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onAddSlot,
  onEditSlot,
  onDeleteSlot,
  onClearAllSlots,
  onSavePeriod,
  onDeletePeriod,
  onSaveClassRow,
  onDeleteClassRow,
}) => {
  const { isAdmin } = useAuth();

  // Undo / Redo keyboard shortcuts (Ctrl+Z, Ctrl+Y, Cmd+Z, Cmd+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        if (e.key === 'z' || e.key === 'Z') {
          if (e.shiftKey) {
            if (canRedo && onRedo) {
              e.preventDefault();
              onRedo();
            }
          } else {
            if (canUndo && onUndo) {
              e.preventDefault();
              onUndo();
            }
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          if (canRedo && onRedo) {
            e.preventDefault();
            onRedo();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, onUndo, onRedo]);

  // Internal state fallback if not controlled from parent
  const [localPeriods, setLocalPeriods] = useState<TimeTablePeriod[]>(() => {
    try {
      const saved = localStorage.getItem('dept_periods');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 11 && parsed[0]?.startTime === '09:15 AM') {
          return parsed;
        }
      }
      return initialPeriods;
    } catch {
      return initialPeriods;
    }
  });

  const [localClassRows, setLocalClassRows] = useState<TimeTableClassRow[]>(() => {
    const saved = localStorage.getItem('dept_class_rows');
    return saved ? JSON.parse(saved) : initialClassRows;
  });

  const periods = propPeriods || localPeriods;
  const classRows = propClassRows || localClassRows;

  // View state: 'master-grid' (requested by user) or 'student-routine'
  const [viewMode, setViewMode] = useState<'master-grid' | 'student-routine'>('master-grid');

  // Active Day for the Master Grid
  const [activeDay, setActiveDay] = useState<DayOfWeek>('Monday');

  // Filters for Student Routine View
  const [selectedCourse, setSelectedCourse] = useState<string>('UG NEP');
  const [selectedYear, setSelectedYear] = useState<string>('1st Year');
  const [selectedSemester, setSelectedSemester] = useState<string>('Semester I');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Modals state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [printOption, setPrintOption] = useState<
    'all-days-master' | 'day-master' | 'semester' | 'faculty'
  >('all-days-master');
  const [selectedFacultyForPrint, setSelectedFacultyForPrint] = useState<string>('');

  // Extract list of all unique faculty names for individual faculty routine downloads
  const availableFacultyNames = useMemo(() => {
    const set = new Set<string>();
    if (facultyList && facultyList.length > 0) {
      facultyList.forEach((f) => {
        if (f.name?.trim()) set.add(f.name.trim());
      });
    }
    slots.forEach((s) => {
      if (s.facultyName?.trim()) set.add(s.facultyName.trim());
    });
    return Array.from(set).sort();
  }, [facultyList, slots]);

  const [periodModal, setPeriodModal] = useState<{
    isOpen: boolean;
    period: TimeTablePeriod | null;
  }>({ isOpen: false, period: null });

  const [rowModalOpen, setRowModalOpen] = useState<boolean>(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'slot' | 'period' | 'row' | 'all-slots';
    id: string;
    name: string;
  } | null>(null);

  // Period management handlers
  const handleSavePeriodInternal = (period: TimeTablePeriod) => {
    if (onSavePeriod) {
      onSavePeriod(period);
    } else {
      setLocalPeriods((prev) => {
        const idx = prev.findIndex((p) => p.id === period.id);
        let updated: TimeTablePeriod[];
        if (idx >= 0) {
          updated = [...prev];
          updated[idx] = period;
        } else {
          updated = [...prev, period].sort((a, b) => a.periodNumber - b.periodNumber);
        }
        localStorage.setItem('dept_periods', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleDeletePeriodInternal = (id: string, label: string) => {
    if (periods.length <= 1) {
      alert('You must keep at least one period column in the timetable.');
      return;
    }
    if (onDeletePeriod) {
      onDeletePeriod(id, label);
    } else {
      setLocalPeriods((prev) => {
        const updated = prev.filter((p) => p.id !== id);
        localStorage.setItem('dept_periods', JSON.stringify(updated));
        return updated;
      });
    }
    setDeleteConfirm(null);
  };

  // Class Row management handlers
  const handleSaveClassRowInternal = (row: TimeTableClassRow) => {
    if (onSaveClassRow) {
      onSaveClassRow(row);
    } else {
      setLocalClassRows((prev) => {
        const idx = prev.findIndex((r) => r.id === row.id);
        let updated: TimeTableClassRow[];
        if (idx >= 0) {
          updated = [...prev];
          updated[idx] = row;
        } else {
          updated = [...prev, row];
        }
        localStorage.setItem('dept_class_rows', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleDeleteClassRowInternal = (id: string, label: string) => {
    if (classRows.length <= 1) {
      alert('You must keep at least one class row in the timetable.');
      return;
    }
    if (onDeleteClassRow) {
      onDeleteClassRow(id, label);
    } else {
      setLocalClassRows((prev) => {
        const updated = prev.filter((r) => r.id !== id);
        localStorage.setItem('dept_class_rows', JSON.stringify(updated));
        return updated;
      });
    }
    setDeleteConfirm(null);
  };

  // Dynamic Year Level & Semester for student view
  const yearLevels = useMemo(() => {
    if (selectedCourse === 'PG') return ['1st Year', '2nd Year'];
    return ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  }, [selectedCourse]);

  const semestersForYear = useMemo(() => {
    switch (selectedYear) {
      case '1st Year':
        return ['Semester I', 'Semester II'];
      case '2nd Year':
        return ['Semester III', 'Semester IV'];
      case '3rd Year':
        return ['Semester V', 'Semester VI'];
      case '4th Year':
        return ['Semester VII', 'Semester VIII'];
      default:
        return ['Semester I', 'Semester II'];
    }
  }, [selectedYear]);

  // Total department-wide conflict count
  const facultyConflicts = useMemo(() => {
    const conflictItems: { slotA: TimeTableSlot; slotB: TimeTableSlot; message: string }[] = [];
    for (let i = 0; i < slots.length; i++) {
      const slotA = slots[i];
      const others = slots.filter((_, idx) => idx !== i);
      const res = checkFacultyConflict(others, slotA);
      if (res.hasConflict && res.conflictSlot) {
        const alreadyAdded = conflictItems.some(
          (c) =>
            (c.slotA.id === slotA.id && c.slotB.id === res.conflictSlot!.id) ||
            (c.slotA.id === res.conflictSlot!.id && c.slotB.id === slotA.id)
        );
        if (!alreadyAdded) {
          conflictItems.push({
            slotA,
            slotB: res.conflictSlot,
            message: res.message || 'Clash in faculty schedule',
          });
        }
      }
    }
    return conflictItems;
  }, [slots]);

  // Check if a specific slot has a conflict
  const isSlotInConflict = (slotId: string) => {
    return facultyConflicts.some((c) => c.slotA.id === slotId || c.slotB.id === slotId);
  };

  // Helper to find slots matching a grid cell
  const getSlotsForMasterCell = (row: TimeTableClassRow, period: TimeTablePeriod) => {
    return slots.filter((s) => {
      if (s.dayOfWeek !== activeDay) return false;
      if (s.course !== row.course || s.yearLevel !== row.yearLevel || s.semester !== row.semester) {
        return false;
      }
      if (s.periodNumber === period.periodNumber) return true;
      return areTimesOverlapping(s.startTime, s.endTime, period.startTime, period.endTime);
    });
  };

  // Helper for student routine cell (Day vs Period)
  const getSlotsForSemesterCell = (day: DayOfWeek, period: TimeTablePeriod) => {
    return slots.filter((s) => {
      if (s.dayOfWeek !== day) return false;
      if (
        s.course !== selectedCourse ||
        s.yearLevel !== selectedYear ||
        s.semester !== selectedSemester
      ) {
        return false;
      }
      if (s.periodNumber === period.periodNumber) return true;
      return areTimesOverlapping(s.startTime, s.endTime, period.startTime, period.endTime);
    });
  };

  // PRINT EXECUTION HANDLERS (Rock-solid, never blocked)
  const getActivePrintHtml = () => {
    if (printOption === 'all-days-master') {
      return generatePrintableAllDaysMasterHtml(slots, classRows, periods);
    }
    if (printOption === 'day-master') {
      return generatePrintableMasterDayHtml(slots, activeDay, classRows, periods);
    }
    if (printOption === 'faculty') {
      const targetFac = selectedFacultyForPrint || availableFacultyNames[0] || 'Faculty Member';
      return generatePrintableFacultyScheduleHtml(
        targetFac,
        slots,
        periods,
        '2026–2027',
        undefined,
        facultyList
      );
    }
    return generatePrintableScheduleHtml(
      slots,
      selectedCourse,
      selectedYear,
      selectedSemester,
      periods
    );
  };

  const handlePrintNow = () => {
    const htmlContent = getActivePrintHtml();
    triggerDirectPrint(htmlContent);
  };

  const handleDownloadHtml = () => {
    const htmlContent = getActivePrintHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const targetFac = selectedFacultyForPrint || availableFacultyNames[0] || 'Faculty';
    const filename =
      printOption === 'all-days-master'
        ? `Master_TimeTable_AllDays_AllClasses_SinglePage.html`
        : printOption === 'day-master'
        ? `Routine_${activeDay}_MasterGrid.html`
        : printOption === 'faculty'
        ? `Faculty_Routine_${targetFac.replace(/[^a-zA-Z0-9]/g, '_')}.html`
        : `Routine_${selectedCourse.replace(/\s+/g, '_')}_${selectedSemester.replace(/\s+/g, '_')}.html`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 print:bg-white print:p-0">
      {/* Top Academic Breadcrumb / Header */}
      <section className="bg-[#0b1a2f] text-white pt-10 pb-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800 print:hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-3">
                <Calendar className="w-3.5 h-3.5" />
                <span>Department Academic Time Table</span>
              </div>
              <h1 className="font-serif-academic text-2xl sm:text-4xl font-bold tracking-tight">
                Time Table
              </h1>
              <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
                Official departmental timetable with classes organized in rows for each semester by day.
                {isAdmin ? (
                  <span className="text-amber-300 font-semibold block mt-0.5">
                    Admin Access: Edit and add periods, add/remove semester rows, and manage conflict-free class slots.
                  </span>
                ) : (
                  <span className="text-slate-400 block mt-0.5">
                    Student View: Updated daily routines for UG NEP, UG AEDP, and PG programs.
                  </span>
                )}
              </p>
            </div>

            {/* Quick Actions Header Toolbar */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* PRIMARY MASTER TIME TABLE PRINT BUTTON (SINGLE PAGE ALL DAYS) */}
              <button
                onClick={() => {
                  setPrintOption('all-days-master');
                  setIsPrintModalOpen(true);
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-md hover:shadow-lg uppercase tracking-wider border border-amber-300"
                title="Print the Master Time Table with all details of all days and every class in a single page"
              >
                <Printer className="w-4 h-4 text-slate-950" />
                <span>Print Master Time Table (1 Page)</span>
              </button>

              {/* INDIVIDUAL FACULTY TIMETABLE DOWNLOAD BUTTON */}
              <button
                onClick={() => {
                  setPrintOption('faculty');
                  if (!selectedFacultyForPrint && availableFacultyNames.length > 0) {
                    setSelectedFacultyForPrint(availableFacultyNames[0]);
                  }
                  setIsPrintModalOpen(true);
                }}
                className="px-3.5 py-2.5 bg-sky-950/80 hover:bg-sky-900 text-sky-200 border border-sky-600/40 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
                title="Download or print individual faculty timetable containing only his/her classes"
              >
                <User className="w-4 h-4 text-sky-400" />
                <span>Faculty Routine Download</span>
              </button>

              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs"
                title="Print or customize time table routine"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Print Options</span>
              </button>

              <button
                onClick={handleDownloadHtml}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title="Export HTML Routine"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Export HTML</span>
              </button>

              {isAdmin && (
                <>
                  <button
                    onClick={() => setRowModalOpen(true)}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    title="Add a new class/semester row"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Row</span>
                  </button>

                  <button
                    onClick={() => setPeriodModal({ isOpen: true, period: null })}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    title="Add or edit periods"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Add Period</span>
                  </button>

                  <button
                    onClick={() =>
                      setDeleteConfirm({
                        type: 'all-slots',
                        id: 'all',
                        name: 'All Classes (All Days)',
                      })
                    }
                    className="px-3.5 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    title="Clear all classes across all days"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Clear Classes</span>
                  </button>

                  {/* Undo & Redo Header Toolbar Buttons */}
                  <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
                    <button
                      type="button"
                      onClick={onUndo}
                      disabled={!canUndo}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        canUndo
                          ? 'bg-slate-700 hover:bg-slate-600 text-amber-300 cursor-pointer shadow-xs'
                          : 'text-slate-500 cursor-not-allowed opacity-50'
                      }`}
                      title={canUndo ? 'Undo last timetable change (Ctrl+Z)' : 'Nothing to undo'}
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>Undo</span>
                    </button>
                    <button
                      type="button"
                      onClick={onRedo}
                      disabled={!canRedo}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        canRedo
                          ? 'bg-slate-700 hover:bg-slate-600 text-amber-300 cursor-pointer shadow-xs'
                          : 'text-slate-500 cursor-not-allowed opacity-50'
                      }`}
                      title={canRedo ? 'Redo last undone change (Ctrl+Y)' : 'Nothing to redo'}
                    >
                      <Redo2 className="w-3.5 h-3.5" />
                      <span>Redo</span>
                    </button>
                  </div>

                  <button
                    onClick={() =>
                      onAddSlot({
                        course: classRows[0]?.course || 'UG NEP',
                        yearLevel: classRows[0]?.yearLevel || '1st Year',
                        semester: classRows[0]?.semester || 'Semester I',
                        dayOfWeek: activeDay,
                        periodNumber: periods[0]?.periodNumber || 1,
                        startTime: periods[0]?.startTime,
                        endTime: periods[0]?.endTime,
                      })
                    }
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Slot</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Conflict Notification Banner if any exists */}
          {facultyConflicts.length > 0 && (
            <div className="mt-5 p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">
                  ⚠️ {facultyConflicts.length} Faculty Schedule Clash{facultyConflicts.length > 1 ? 'es' : ''} Detected
                </strong>
                <span>
                  A faculty is assigned to multiple classes at the same time. Check the flagged cards below and adjust periods.
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main View Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Navigation Tabs: Master Grid vs Semester Schedule */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
          <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('master-grid')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                viewMode === 'master-grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4 text-amber-600" />
              <span>Day Master Grid (Classes in Rows)</span>
            </button>
            <button
              onClick={() => setViewMode('student-routine')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                viewMode === 'student-routine'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-sky-600" />
              <span>Single Class Routine (Mon – Sat)</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search subject, faculty, room..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ================= VIEW 1: MASTER DAY GRID (CLASSES IN ROWS) ================= */}
        {viewMode === 'master-grid' && (
          <div className="space-y-4">
            {/* Day Selector Pills & Admin Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2 hidden sm:inline">
                  Select Day:
                </span>
                {DAYS_OF_WEEK.map((day) => {
                  const daySlotsCount = slots.filter((s) => s.dayOfWeek === day).length;
                  const isActive = activeDay === day;
                  return (
                    <button
                      key={day}
                      onClick={() => setActiveDay(day)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-[#0b1a2f] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{day}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isActive ? 'bg-amber-400 text-slate-950 font-mono font-bold' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {daySlotsCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {classRows.length} rows • {periods.length} periods
                  </span>
                  <button
                    onClick={() => setRowModalOpen(true)}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>
                  <button
                    onClick={() => setPeriodModal({ isOpen: true, period: null })}
                    className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Add Period</span>
                  </button>
                  {/* Undo & Redo Options */}
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={onUndo}
                      disabled={!canUndo}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition ${
                        canUndo
                          ? 'bg-white text-slate-800 shadow-2xs hover:bg-slate-50 hover:text-blue-900 cursor-pointer'
                          : 'text-slate-300 cursor-not-allowed'
                      }`}
                      title={canUndo ? 'Undo last timetable change (Ctrl+Z)' : 'Nothing to undo'}
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>Undo</span>
                    </button>
                    <button
                      type="button"
                      onClick={onRedo}
                      disabled={!canRedo}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition ${
                        canRedo
                          ? 'bg-white text-slate-800 shadow-2xs hover:bg-slate-50 hover:text-blue-900 cursor-pointer'
                          : 'text-slate-300 cursor-not-allowed'
                      }`}
                      title={canRedo ? 'Redo last undone change (Ctrl+Y)' : 'Nothing to redo'}
                    >
                      <Redo2 className="w-3.5 h-3.5" />
                      <span>Redo</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* THE MASTER GRID TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left min-w-[900px]">
                  <thead>
                    <tr className="bg-[#0b1a2f] text-white divide-x divide-slate-800">
                      {/* Left Header: Class / Semester */}
                      <th className="p-3.5 sm:p-4 text-xs font-bold uppercase tracking-wider sticky left-0 z-20 bg-[#0b1a2f] min-w-[200px] w-[220px] shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-amber-400 font-mono">CLASS / SEMESTER</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            Rows: {classRows.length}
                          </span>
                        </div>
                      </th>

                      {/* Period Columns Header */}
                      {periods.map((period) => (
                        <th
                          key={period.id || period.periodNumber}
                          className="p-3 text-center min-w-[170px] w-[200px] align-top relative group"
                        >
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-bold text-white tracking-wide">
                              {period.label}
                            </span>
                            <span className="text-[11px] font-mono text-amber-300 font-medium mt-0.5">
                              {period.startTime} – {period.endTime}
                            </span>

                            {/* Admin Period Quick Controls */}
                            {isAdmin && (
                              <div className="flex items-center gap-1 mt-1 opacity-80 group-hover:opacity-100 transition">
                                <button
                                  onClick={() =>
                                    onAddSlot({
                                      course: classRows[0]?.course || 'UG NEP',
                                      yearLevel: classRows[0]?.yearLevel || '1st Year',
                                      semester: classRows[0]?.semester || 'Semester I',
                                      dayOfWeek: activeDay,
                                      periodNumber: period.periodNumber,
                                      startTime: period.startTime,
                                      endTime: period.endTime,
                                    })
                                  }
                                  className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-emerald-300 cursor-pointer"
                                  title={`Add class in ${period.label} (option to apply on multiple days)`}
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setPeriodModal({ isOpen: true, period })}
                                  className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-amber-300 cursor-pointer"
                                  title={`Edit ${period.label} timings`}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() =>
                                    setDeleteConfirm({
                                      type: 'period',
                                      id: period.id,
                                      name: period.label,
                                    })
                                  }
                                  className="p-1 rounded hover:bg-rose-950 text-slate-400 hover:text-rose-400 cursor-pointer"
                                  title={`Delete ${period.label} column`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </th>
                      ))}

                      {/* Header button to Add Period Column */}
                      {isAdmin && (
                        <th className="p-2 text-center w-14 bg-slate-900/60 align-middle">
                          <button
                            onClick={() => setPeriodModal({ isOpen: true, period: null })}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 border border-slate-700 transition cursor-pointer mx-auto block"
                            title="Add a new period column"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {classRows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-slate-50/70 transition divide-x divide-slate-200"
                      >
                        {/* Sticky Row Header for Class / Semester */}
                        <td className="p-3 sm:p-4 bg-slate-50/90 sticky left-0 z-10 font-medium text-xs text-slate-900 shadow-2xs border-r border-slate-200">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    row.course === 'PG'
                                      ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                      : row.course === 'UG AEDP'
                                      ? 'bg-sky-100 text-sky-900 border border-sky-200'
                                      : 'bg-blue-100 text-blue-900 border border-blue-200'
                                  }`}
                                >
                                  {row.course}
                                </span>
                                <span className="font-bold text-slate-800">{row.yearLevel}</span>
                              </div>

                              <div className="text-[11px] font-semibold text-slate-700 mt-1">
                                {row.semester}
                                {row.section && (
                                  <span className="text-slate-500 font-normal ml-1">
                                    • {row.section}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Admin Row Remove Button */}
                            {isAdmin && (
                              <button
                                onClick={() =>
                                  setDeleteConfirm({
                                    type: 'row',
                                    id: row.id,
                                    name: row.label || `${row.course} - ${row.yearLevel} (${row.semester})`,
                                  })
                                }
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
                                title="Remove this semester row from the timetable"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Period Cells in this Row */}
                        {periods.map((period) => {
                          const spanInfo = getMasterCellSpanInfo(slots, row, period, activeDay);
                          if (spanInfo.shouldSkip) {
                            return null;
                          }

                          const matchingSlots = spanInfo.matchingSlots;
                          const colSpan = spanInfo.span;

                          const searchFilterMatched =
                            !searchKeyword ||
                            matchingSlots.some(
                              (s) =>
                                s.subjectName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                                s.paperCode.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                                s.facultyName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                                s.roomNo.toLowerCase().includes(searchKeyword.toLowerCase())
                            );

                          if (searchKeyword && !searchFilterMatched) {
                            return (
                              <td
                                key={period.id || period.periodNumber}
                                colSpan={colSpan}
                                className="p-2 text-center text-slate-300 text-xs bg-slate-50/50"
                              >
                                —
                              </td>
                            );
                          }

                          return (
                            <td
                              key={period.id || period.periodNumber}
                              colSpan={colSpan}
                              className={`p-2 sm:p-2.5 align-top h-full ${
                                colSpan > 1 ? 'bg-amber-50/40 border-amber-200/80' : ''
                              }`}
                            >
                              {matchingSlots.length > 0 ? (
                                <div className="space-y-2">
                                  {matchingSlots.map((slot) => {
                                    const hasConflict = isSlotInConflict(slot.id);
                                    const isMerged = (slot.spanPeriods || 1) > 1;
                                    return (
                                      <div
                                        key={slot.id}
                                        className={`p-2.5 rounded-xl border text-xs transition relative group shadow-2xs ${
                                          hasConflict
                                            ? 'bg-rose-50/90 border-rose-400 text-rose-950 ring-2 ring-rose-400/50'
                                            : isMerged
                                            ? 'bg-gradient-to-br from-amber-50 via-white to-amber-100/50 border-amber-300 text-slate-900 hover:border-amber-500 shadow-xs'
                                            : 'bg-white hover:bg-slate-50/90 border-slate-200 text-slate-900 hover:border-amber-400'
                                        }`}
                                      >
                                        {/* Paper Code & Type */}
                                        <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                                          <span className="font-mono font-bold text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 uppercase">
                                            {slot.paperCode || 'CODE'}
                                          </span>
                                          <div className="flex items-center gap-1">
                                            {isMerged && (
                                              <span className="text-[9px] font-black text-amber-950 bg-amber-200 px-1.5 py-0.5 rounded border border-amber-300 flex items-center gap-0.5">
                                                <span>🔗 {slot.spanPeriods} Cells Merged</span>
                                              </span>
                                            )}
                                            <span className="text-[10px] text-slate-500 font-medium">
                                              {slot.type}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Subject Title */}
                                        <h4 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2">
                                          {slot.subjectName}
                                        </h4>

                                        {/* Faculty In Charge */}
                                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-700 mt-1.5">
                                          <User className="w-3 h-3 text-amber-600 shrink-0" />
                                          <span className="truncate">{slot.facultyName}</span>
                                        </div>

                                        {/* Room / Classroom */}
                                        <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                          <span className="truncate">{slot.roomNo}</span>
                                        </div>

                                        {/* Conflict Banner if Clash */}
                                        {hasConflict && (
                                          <div className="mt-1.5 p-1 bg-rose-200/80 rounded text-[9px] text-rose-900 font-bold flex items-center gap-1">
                                            <AlertTriangle className="w-2.5 h-2.5 text-rose-700" />
                                            <span>Faculty Clash!</span>
                                          </div>
                                        )}

                                        {/* Admin Action Overlay Buttons */}
                                        {isAdmin && (
                                          <div className="flex items-center gap-1 pt-1.5 mt-1.5 border-t border-slate-100 justify-end">
                                            {isMerged && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const startP = slot.periodNumber || 1;
                                                  const pFound = periods.find((p) => p.periodNumber === startP);
                                                  const endTime = pFound?.endTime || slot.endTime;
                                                  onEditSlot({
                                                    ...slot,
                                                    spanPeriods: 1,
                                                    endTime,
                                                  });
                                                }}
                                                className="px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-950 bg-amber-200 hover:bg-amber-300 transition cursor-pointer border border-amber-300/80 flex items-center gap-0.5 mr-auto"
                                                title="Unmerge cells and revert to single period cell"
                                              >
                                                <span>✂️ Unmerge</span>
                                              </button>
                                            )}
                                            <button
                                              onClick={() => onEditSlot(slot)}
                                              className="p-1 rounded text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                                              title="Edit Slot"
                                            >
                                              <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={() =>
                                                setDeleteConfirm({
                                                  type: 'slot',
                                                  id: slot.id,
                                                  name: `${slot.subjectName} (${slot.dayOfWeek})`,
                                                })
                                              }
                                              className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                              title="Delete Slot (unmerges spanned cells)"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                /* Empty Cell: Show + Add Class for Admin or Free indicator for student */
                                <div className="h-full min-h-[90px] flex items-center justify-center">
                                  {isAdmin ? (
                                    <button
                                      onClick={() =>
                                        onAddSlot({
                                          course: row.course,
                                          yearLevel: row.yearLevel,
                                          semester: row.semester,
                                          dayOfWeek: activeDay,
                                          periodNumber: period.periodNumber,
                                          startTime: period.startTime,
                                          endTime: period.endTime,
                                        })
                                      }
                                      className="w-full h-full min-h-[75px] rounded-xl border-2 border-dashed border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-slate-400 hover:text-amber-800 transition flex flex-col items-center justify-center gap-1 cursor-pointer group"
                                      title={`Schedule class for ${row.course} ${row.semester} in ${period.label}`}
                                    >
                                      <Plus className="w-4 h-4 text-slate-300 group-hover:text-amber-600 transition" />
                                      <span className="text-[10px] font-bold tracking-wide">
                                        + Add Class
                                      </span>
                                    </button>
                                  ) : (
                                    <span className="text-slate-300 text-xs font-mono">—</span>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}

                        {/* Extra spacer column for Admin Add Period header */}
                        {isAdmin && <td className="bg-slate-50/30"></td>}
                      </tr>
                    ))}

                    {/* Bottom Admin Row to Add New Semester Row */}
                    {isAdmin && (
                      <tr className="bg-amber-50/40 hover:bg-amber-50/70 transition">
                        <td
                          colSpan={periods.length + 2}
                          className="p-3 text-center border-t border-dashed border-amber-300"
                        >
                          <button
                            onClick={() => setRowModalOpen(true)}
                            className="px-4 py-2 rounded-xl bg-white border border-amber-300 hover:border-amber-400 text-slate-900 font-bold text-xs inline-flex items-center gap-2 shadow-2xs hover:shadow-xs transition cursor-pointer"
                          >
                            <Plus className="w-4 h-4 text-amber-600" />
                            <span>Add New Class / Semester Row to Grid</span>
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= VIEW 2: SINGLE CLASS ROUTINE (MON – SAT) ================= */}
        {viewMode === 'student-routine' && (
          <div className="space-y-4">
            {/* Class Selectors Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Course:
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => {
                      const c = e.target.value;
                      setSelectedCourse(c);
                      if (c === 'PG' && selectedYear !== '1st Year' && selectedYear !== '2nd Year') {
                        setSelectedYear('1st Year');
                        setSelectedSemester('Semester I');
                      }
                    }}
                    className="p-2 rounded-lg border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                  >
                    <option value="UG NEP">UG NEP</option>
                    <option value="UG AEDP">UG AEDP</option>
                    <option value="PG">PG (M.Sc.)</option>
                    <option value="UG CBCS">UG CBCS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Year Level:
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      const y = e.target.value;
                      setSelectedYear(y);
                      switch (y) {
                        case '1st Year':
                          setSelectedSemester('Semester I');
                          break;
                        case '2nd Year':
                          setSelectedSemester('Semester III');
                          break;
                        case '3rd Year':
                          setSelectedSemester('Semester V');
                          break;
                        case '4th Year':
                          setSelectedSemester('Semester VII');
                          break;
                      }
                    }}
                    className="p-2 rounded-lg border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                  >
                    {yearLevels.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Semester:
                  </label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="p-2 rounded-lg border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                  >
                    {semestersForYear.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPrintOption('semester');
                    setIsPrintModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Print This Semester</span>
                </button>
              </div>
            </div>

            {/* Mon-Sat Routine Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left min-w-[850px]">
                  <thead>
                    <tr className="bg-[#0b1a2f] text-white divide-x divide-slate-800">
                      <th className="p-3 text-xs font-bold text-amber-400 w-28 text-center">DAY</th>
                      {periods.map((p) => (
                        <th key={p.id} className="p-3 text-center min-w-[150px]">
                          <div className="font-bold text-xs">{p.label}</div>
                          <div className="text-[10px] text-amber-300 font-mono font-medium">
                            {p.startTime} – {p.endTime}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {DAYS_OF_WEEK.map((day) => (
                      <tr key={day} className="hover:bg-slate-50/70 transition divide-x divide-slate-200">
                        <td className="p-3 bg-slate-100/80 font-bold text-xs text-center text-slate-800">
                          {day.toUpperCase()}
                        </td>
                        {periods.map((period) => {
                          const spanInfo = getSemesterCellSpanInfo(
                            slots,
                            day,
                            period,
                            selectedCourse,
                            selectedYear,
                            selectedSemester
                          );
                          if (spanInfo.shouldSkip) {
                            return null;
                          }

                          const cellSlots = spanInfo.matchingSlots;
                          const colSpan = spanInfo.span;

                          return (
                            <td
                              key={period.id}
                              colSpan={colSpan}
                              className={`p-2 align-top ${
                                colSpan > 1 ? 'bg-amber-50/50 border-amber-200' : ''
                              }`}
                            >
                              {cellSlots.length > 0 ? (
                                cellSlots.map((s) => (
                                  <div
                                    key={s.id}
                                    className={`p-2 rounded-lg text-xs mb-1 border ${
                                      (s.spanPeriods || 1) > 1
                                        ? 'bg-amber-100/70 border-amber-300 text-slate-900 shadow-2xs'
                                        : 'bg-amber-50/40 border-amber-200/80'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1 mb-0.5">
                                      <span className="font-mono font-bold text-[10px] text-amber-800">
                                        {s.paperCode}
                                      </span>
                                      {(s.spanPeriods || 1) > 1 && (
                                        <span className="text-[9px] font-black text-amber-950 bg-amber-200 px-1 rounded">
                                          🔗 Merged {s.spanPeriods} Cells
                                        </span>
                                      )}
                                    </div>
                                    <div className="font-bold text-slate-900">{s.subjectName}</div>
                                    <div className="text-[10px] text-slate-600">👤 {s.facultyName}</div>
                                    <div className="text-[9px] text-slate-500">🏛️ {s.roomNo} ({s.type})</div>
                                    {isAdmin && (
                                      <div className="flex items-center gap-1 pt-1 mt-1 border-t border-amber-200/60 justify-end">
                                        {(s.spanPeriods || 1) > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const startP = s.periodNumber || 1;
                                              const pFound = periods.find((p) => p.periodNumber === startP);
                                              const endTime = pFound?.endTime || s.endTime;
                                              onEditSlot({
                                                ...s,
                                                spanPeriods: 1,
                                                endTime,
                                              });
                                            }}
                                            className="px-1.5 py-0.5 rounded text-[9px] font-bold text-amber-950 bg-amber-200 hover:bg-amber-300 transition cursor-pointer border border-amber-300 mr-auto"
                                            title="Unmerge cells and revert to single period"
                                          >
                                            ✂️ Unmerge
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => onEditSlot(s)}
                                          className="p-0.5 rounded text-slate-500 hover:text-amber-700 hover:bg-amber-100 transition cursor-pointer"
                                          title="Edit Slot"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setDeleteConfirm({
                                              type: 'slot',
                                              id: s.id,
                                              name: `${s.subjectName} (${s.dayOfWeek})`,
                                            })
                                          }
                                          className="p-0.5 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                                          title="Delete Practical/Slot"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <span className="text-slate-300 text-center block">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= PRINT PREVIEW & EXPORT MODAL ================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn print:hidden">
          <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[96vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-[#0b1a2f] text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-academic text-base sm:text-lg font-bold">
                    Official Time Table • Print &amp; Export
                  </h3>
                  <p className="text-xs text-slate-300">
                    Panchayat College, Baragada • Department of Mathematics
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
                title="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Ribbon */}
            <div className="bg-slate-50 border-b border-slate-200 p-3.5 sm:px-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-bold text-slate-700">Format:</span>
                <select
                  value={printOption}
                  onChange={(e) => setPrintOption(e.target.value as any)}
                  className="p-2 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-900 shadow-2xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  <option value="all-days-master">
                    🌟 Grand Master Time Table: All Days &amp; Every Class (Single Page A3)
                  </option>
                  <option value="faculty">
                    👤 Individual Faculty Routine: Filtered for Specific Teacher (A4 Landscape)
                  </option>
                  <option value="day-master">
                    📅 Day Master Grid: {activeDay} ({classRows.length} Classes in Rows)
                  </option>
                  <option value="semester">
                    🎓 Weekly Cohort Routine: {selectedCourse} {selectedYear} ({selectedSemester})
                  </option>
                </select>

                {printOption === 'faculty' && (
                  <div className="flex items-center gap-2 bg-amber-50/80 p-1 px-2.5 rounded-xl border border-amber-300 shadow-2xs">
                    <span className="text-xs font-bold text-amber-950">Faculty:</span>
                    <select
                      value={selectedFacultyForPrint || availableFacultyNames[0] || ''}
                      onChange={(e) => setSelectedFacultyForPrint(e.target.value)}
                      className="p-1 rounded-lg text-xs font-bold bg-white border border-amber-300 text-slate-900 focus:outline-hidden cursor-pointer"
                    >
                      {availableFacultyNames.map((fac) => (
                        <option key={fac} value={fac}>
                          {fac}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Print Now Primary Button */}
                <button
                  onClick={handlePrintNow}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-md uppercase tracking-wider border border-amber-300"
                  title="Print official routine immediately"
                >
                  <Printer className="w-4 h-4 text-slate-950" />
                  <span>Print Now (1 Page)</span>
                </button>

                {/* Open in Full Browser Tab */}
                <button
                  onClick={() => openHtmlInNewTab(getActivePrintHtml())}
                  className="px-3 py-2 bg-sky-900 hover:bg-sky-800 text-sky-200 border border-sky-600/40 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
                  title="Open standalone document in new full browser tab"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                  <span>Open in Full Tab</span>
                </button>

                {/* Download HTML */}
                <button
                  onClick={handleDownloadHtml}
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
                  title="Download as standalone HTML document"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download HTML</span>
                </button>
              </div>
            </div>

            {/* High-Fidelity Print Preview Canvas */}
            <div className="flex-1 p-2 sm:p-4 bg-slate-100 flex flex-col min-h-[580px] overflow-hidden">
              <div className="bg-white rounded-xl shadow-inner border border-slate-300 overflow-hidden flex-1 flex flex-col">
                <iframe
                  key={`${printOption}-${selectedFacultyForPrint || ''}-${selectedCourse}-${selectedSemester}-${activeDay}-${slots.length}`}
                  srcDoc={getActivePrintHtml()}
                  title="Official Academic Class Routine Preview"
                  className="w-full flex-1 border-0 min-h-[560px] bg-white"
                />
              </div>
            </div>

            {/* Footer with helpful tips */}
            <div className="p-3.5 px-6 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2">
              <div className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
                <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Official Academic Format • Grand Master fits strictly on 1 sheet (A3 landscape). Faculty routine fits on 1 sheet (A4 landscape).
                </span>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= PERIOD ADD / EDIT MODAL ================= */}
      <TimeTablePeriodModal
        isOpen={periodModal.isOpen}
        period={periodModal.period}
        existingPeriods={periods}
        onSave={handleSavePeriodInternal}
        onClose={() => setPeriodModal({ isOpen: false, period: null })}
      />

      {/* ================= CLASS ROW ADD MODAL ================= */}
      <TimeTableClassRowModal
        isOpen={rowModalOpen}
        existingRows={classRows}
        onSave={handleSaveClassRowInternal}
        onClose={() => setRowModalOpen(false)}
      />

      {/* ================= DELETE CONFIRMATION DIALOG ================= */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-full bg-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {deleteConfirm.type === 'period'
                    ? 'Delete Period Column?'
                    : deleteConfirm.type === 'row'
                    ? 'Remove Class Row?'
                    : deleteConfirm.type === 'all-slots'
                    ? 'Clear All Classes?'
                    : 'Delete Timetable Slot?'}
                </h3>
                <p className="text-xs text-slate-500">
                  {deleteConfirm.type === 'all-slots'
                    ? 'Are you sure you want to clear all classes across all days?'
                    : `Are you sure you want to remove "${deleteConfirm.name}"?`}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              {deleteConfirm.type === 'period'
                ? 'This will remove the period column from the daily routine view. Slots in this period will not be deleted from the database.'
                : deleteConfirm.type === 'row'
                ? 'This removes this semester row from the daily grid view. Any classes scheduled in this row will remain in the database unless deleted.'
                : deleteConfirm.type === 'all-slots'
                ? 'This will permanently remove all scheduled classes across Monday through Saturday. The period headers (Period I to XI) and semester rows will remain ready for new classes.'
                : 'This will permanently delete this scheduled class period from the timetable.'}
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'period') {
                    handleDeletePeriodInternal(deleteConfirm.id, deleteConfirm.name);
                  } else if (deleteConfirm.type === 'row') {
                    handleDeleteClassRowInternal(deleteConfirm.id, deleteConfirm.name);
                  } else if (deleteConfirm.type === 'all-slots') {
                    if (onClearAllSlots) onClearAllSlots();
                    setDeleteConfirm(null);
                  } else {
                    onDeleteSlot(deleteConfirm.id, deleteConfirm.name);
                    setDeleteConfirm(null);
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md transition"
              >
                {deleteConfirm.type === 'all-slots' ? 'Confirm Clear All' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

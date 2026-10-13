import { TimeTableSlot, DayOfWeek, TimeTablePeriod, TimeTableClassRow, Faculty } from '../types';
import { initialFaculty } from '../data/initialData';

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const cleaned = timeStr.trim().toUpperCase();
  const match = cleaned.match(/(\d+):(\d+)\s*(AM|PM)?/);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3];

  if (ampm === 'PM' && hours < 12) {
    hours += 12;
  }
  if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }
  return hours * 60 + minutes;
}

export function areTimesOverlapping(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = parseTimeToMinutes(start1);
  const e1 = parseTimeToMinutes(end1);
  const s2 = parseTimeToMinutes(start2);
  const e2 = parseTimeToMinutes(end2);

  if (s1 === 0 || e1 === 0 || s2 === 0 || e2 === 0) {
    // If times couldn't be parsed, fallback to string equality
    return start1.trim().toLowerCase() === start2.trim().toLowerCase();
  }

  // Interval overlap: max(start1, start2) < min(end1, end2)
  return Math.max(s1, s2) < Math.min(e1, e2);
}

export interface CellSpanResult {
  shouldSkip: boolean;
  span: number;
  matchingSlots: TimeTableSlot[];
}

export function getMasterCellSpanInfo(
  slots: TimeTableSlot[],
  row: TimeTableClassRow,
  period: TimeTablePeriod,
  day: DayOfWeek
): CellSpanResult {
  const currentPNum = period.periodNumber;

  // 1. Check if covered by a previous period slot that merged across this period
  const coveringSlot = slots.find((s) => {
    if (s.dayOfWeek !== day) return false;
    if (s.course !== row.course || s.yearLevel !== row.yearLevel || s.semester !== row.semester) return false;
    const startP = s.periodNumber || 1;
    const span = getSlotPeriodSpan(s);
    return startP < currentPNum && startP + span > currentPNum;
  });

  if (coveringSlot) {
    return { shouldSkip: true, span: 1, matchingSlots: [] };
  }

  // 2. Find slots starting at this period or overlapping
  const matchingSlots = slots.filter((s) => {
    if (s.dayOfWeek !== day) return false;
    if (s.course !== row.course || s.yearLevel !== row.yearLevel || s.semester !== row.semester) return false;
    const startP = s.periodNumber || 1;
    if (startP === currentPNum) return true;
    return areTimesOverlapping(s.startTime, s.endTime, period.startTime, period.endTime);
  });

  const span = matchingSlots.reduce((max, s) => Math.max(max, getSlotPeriodSpan(s)), 1);

  return { shouldSkip: false, span, matchingSlots };
}

export function getSemesterCellSpanInfo(
  slots: TimeTableSlot[],
  day: DayOfWeek,
  period: TimeTablePeriod,
  course: string,
  yearLevel: string,
  semester: string
): CellSpanResult {
  const currentPNum = period.periodNumber;

  // 1. Check if covered by a previous period slot
  const coveringSlot = slots.find((s) => {
    if (s.dayOfWeek !== day) return false;
    if (s.course !== course || s.yearLevel !== yearLevel || s.semester !== semester) return false;
    const startP = s.periodNumber || 1;
    const span = getSlotPeriodSpan(s);
    return startP < currentPNum && startP + span > currentPNum;
  });

  if (coveringSlot) {
    return { shouldSkip: true, span: 1, matchingSlots: [] };
  }

  // 2. Find slots starting at this period or overlapping
  const matchingSlots = slots.filter((s) => {
    if (s.dayOfWeek !== day) return false;
    if (s.course !== course || s.yearLevel !== yearLevel || s.semester !== semester) return false;
    const startP = s.periodNumber || 1;
    if (startP === currentPNum) return true;
    return areTimesOverlapping(s.startTime, s.endTime, period.startTime, period.endTime);
  });

  const span = matchingSlots.reduce((max, s) => Math.max(max, getSlotPeriodSpan(s)), 1);

  return { shouldSkip: false, span, matchingSlots };
}

export interface FacultyConflictCheck {
  hasConflict: boolean;
  conflictSlot?: TimeTableSlot;
  message?: string;
}

export function checkFacultyConflict(
  allSlots: TimeTableSlot[],
  candidate: {
    id?: string;
    facultyName: string;
    dayOfWeek: DayOfWeek;
    periodNumber?: number;
    startTime: string;
    endTime: string;
    course?: string;
    yearLevel?: string;
    semester?: string;
  }
): FacultyConflictCheck {
  const normalizedCandidateFaculty = candidate.facultyName?.trim().toLowerCase();

  // If no faculty or generic guest faculty, do not block
  if (
    !normalizedCandidateFaculty ||
    normalizedCandidateFaculty === 'guest faculty' ||
    normalizedCandidateFaculty === 'department faculty' ||
    normalizedCandidateFaculty === 'tbd' ||
    normalizedCandidateFaculty === 'vacant'
  ) {
    return { hasConflict: false };
  }

  // Find if another slot with same faculty on the same day overlaps
  const conflict = allSlots.find((s) => {
    // Skip if it's the same slot being edited
    if (candidate.id && s.id === candidate.id) return false;

    // Check same faculty (exact match or partial matching by surname / identifier)
    const slotFaculty = s.facultyName?.trim().toLowerCase();
    if (!slotFaculty) return false;
    if (
      slotFaculty === 'guest faculty' ||
      slotFaculty === 'department faculty' ||
      slotFaculty === 'tbd' ||
      slotFaculty === 'vacant'
    ) {
      return false;
    }

    // Exact match or primary faculty surname matching
    const isSameFaculty =
      slotFaculty === normalizedCandidateFaculty ||
      (slotFaculty.includes('malik') && normalizedCandidateFaculty.includes('malik')) ||
      (slotFaculty.includes('sahoo') && normalizedCandidateFaculty.includes('sahoo')) ||
      (slotFaculty.includes('pradhan') && normalizedCandidateFaculty.includes('pradhan')) ||
      (slotFaculty.includes('dash') && normalizedCandidateFaculty.includes('dash')) ||
      (slotFaculty.includes('meher') && normalizedCandidateFaculty.includes('meher')) ||
      (slotFaculty.includes('behera') && normalizedCandidateFaculty.includes('behera')) ||
      (slotFaculty.includes('nayak') && normalizedCandidateFaculty.includes('nayak'));

    if (!isSameFaculty) return false;

    // Must be same day of week
    if (s.dayOfWeek !== candidate.dayOfWeek) return false;

    // Check period number match if both defined
    if (candidate.periodNumber && s.periodNumber && candidate.periodNumber === s.periodNumber) {
      return true;
    }

    // Check time range overlap
    return areTimesOverlapping(candidate.startTime, candidate.endTime, s.startTime, s.endTime);
  });

  if (conflict) {
    return {
      hasConflict: true,
      conflictSlot: conflict,
      message: `${candidate.facultyName} is already assigned to "${conflict.subjectName}" (${conflict.course} - ${conflict.yearLevel} ${conflict.semester}, ${conflict.roomNo}) on ${conflict.dayOfWeek} at ${conflict.startTime} – ${conflict.endTime}! A faculty cannot be assigned two classes at the same time.`,
    };
  }

  return { hasConflict: false };
}

export function getFacultyStatusForPeriod(
  allSlots: TimeTableSlot[],
  facultyName: string,
  day: DayOfWeek,
  startTime: string,
  endTime: string,
  periodNumber?: number,
  excludeSlotId?: string
): { isAvailable: boolean; conflictSlot?: TimeTableSlot } {
  const result = checkFacultyConflict(allSlots, {
    id: excludeSlotId,
    facultyName,
    dayOfWeek: day,
    startTime,
    endTime,
    periodNumber,
  });

  return {
    isAvailable: !result.hasConflict,
    conflictSlot: result.conflictSlot,
  };
}

/**
 * Triggers a completely reliable direct browser print using an isolated iframe.
 * This guarantees proper printing in iframe/sandboxed environments where window.print() might be constrained.
 */
export function triggerDirectPrint(htmlContent: string): void {
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          window.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 3000);
        }
      }, 350);
    } else {
      window.print();
    }
  } catch {
    window.print();
  }
}

/**
 * Generates an official standalone printable HTML document for the Master Routine of a specific day
 * with Classes in each Row and Periods in each Column.
 */
export function generatePrintableMasterDayHtml(
  slots: TimeTableSlot[],
  day: DayOfWeek,
  rows: TimeTableClassRow[],
  periods: TimeTablePeriod[],
  academicSession = '2026–2027'
): string {
  const periodColsHtml = periods
    .map(
      (p) => `
      <th style="border: 1px solid #1e293b; background-color: #0b1a2f; color: #ffffff; padding: 8px 6px; font-size: 11px; text-align: center;">
        ${p.label}
        <br>
        <span style="font-weight: 400; font-size: 9px; opacity: 0.85;">${p.startTime} – ${p.endTime}</span>
      </th>
    `
    )
    .join('');

  const rowsHtml = rows
    .map((r) => {
      const cells = periods
        .map((p) => {
          const spanInfo = getMasterCellSpanInfo(slots, r, p, day);
          if (spanInfo.shouldSkip) {
            return '';
          }

          const matchingSlots = spanInfo.matchingSlots;
          const colSpanAttr = spanInfo.span > 1 ? `colspan="${spanInfo.span}"` : '';

          if (matchingSlots.length === 0) {
            return `<td ${colSpanAttr} style="padding: 10px; border: 1px solid #334155; text-align: center; color: #94a3b8; font-size: 11px;">—</td>`;
          }

          const slotContent = matchingSlots
            .map(
              (s) => `
              <div style="font-size: 11px; margin-bottom: 4px;">
                <div style="font-weight: 700; color: #b45309; font-family: monospace; font-size: 10px;">${s.paperCode || ''}</div>
                <div style="font-weight: 600; color: #0f172a; line-height: 1.2;">${s.subjectName}</div>
                <div style="color: #334155; font-size: 10px; margin-top: 2px;">👤 ${s.facultyName}</div>
                <div style="color: #64748b; font-size: 9px;">🏛️ ${s.roomNo} <span style="font-style: italic;">(${s.type || 'Lecture'})</span></div>
              </div>
            `
            )
            .join('<hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 4px 0;" />');

          return `<td ${colSpanAttr} style="padding: 8px 6px; border: 1px solid #334155; vertical-align: top; background-color: ${spanInfo.span > 1 ? '#fef3c7' : '#f8fafc'};">${slotContent}</td>`;
        })
        .join('');

      return `
        <tr>
          <td style="padding: 10px 8px; border: 1px solid #334155; font-weight: 700; text-align: left; background-color: #f1f5f9; color: #0f172a; font-size: 11px;">
            <div style="font-size: 11px; color: #0f172a;">${r.label || `${r.course} - ${r.yearLevel}`}</div>
            <div style="font-size: 9px; font-weight: normal; color: #475569; margin-top: 2px;">${r.semester}</div>
          </td>
          ${cells}
        </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Department Time Table - ${day} (${academicSession})</title>
  <style>
    @page { size: landscape; margin: 8mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 15px; color: #0f172a; background: #fff; }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px; }
    .title-college { font-size: 17px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    .title-dept { font-size: 13px; font-weight: 700; color: #334155; margin-top: 2px; }
    .meta-bar { display: flex; justify-content: space-between; margin-top: 6px; font-size: 11px; font-weight: 600; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; table-layout: fixed; }
    th { border: 1px solid #334155; background-color: #0b1a2f; color: #ffffff; padding: 8px 6px; font-size: 11px; text-transform: uppercase; }
    .signatures { display: flex; justify-content: space-between; margin-top: 36px; padding-top: 8px; font-size: 11px; font-weight: 700; color: #1e293b; text-align: center; }
    .sig-box { width: 180px; border-top: 1px solid #0f172a; padding-top: 4px; }
    .print-btn { background: #0b1a2f; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; margin-bottom: 12px; }
    @media print { .print-btn { display: none; } body { padding: 0; } }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>

  <div class="header">
    <div class="title-college">PANCHAYAT COLLEGE, BARAGADA (AUTONOMOUS)</div>
    <div class="title-dept">DEPARTMENT OF MATHEMATICS • OFFICIAL MASTER TIME TABLE</div>
    <div class="meta-bar">
      <span>DAY: <strong style="color: #b45309;">${day.toUpperCase()}</strong></span>
      <span>CLASSES: <strong>${rows.length} Active Semester Cohorts</strong></span>
      <span>PERIODS: <strong>${periods.length} Daily Sessions</strong></span>
      <span>SESSION: <strong>${academicSession}</strong></span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 140px; text-align: left; padding-left: 8px;">CLASS / SEMESTER</th>
        ${periodColsHtml}
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="signatures">
    <div class="sig-box">Head of Department<br><span style="font-weight: normal; font-size: 10px;">Dept. of Mathematics</span></div>
    <div class="sig-box">Academic Bursar<br><span style="font-weight: normal; font-size: 10px;">Panchayat College</span></div>
    <div class="sig-box">Principal<br><span style="font-weight: normal; font-size: 10px;">Panchayat College, Baragada</span></div>
  </div>
</body>
</html>`;
}

/**
 * Generates an official standalone printable HTML document for the academic routine
 */
export function generatePrintableScheduleHtml(
  slots: TimeTableSlot[],
  course: string,
  yearLevel: string,
  semester: string,
  periodsInput?: TimeTablePeriod[],
  academicSession = '2026–2027'
): string {
  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const periods = periodsInput && periodsInput.length > 0 ? periodsInput : [
    { id: 'p1', periodNumber: 1, label: 'Period I', startTime: '09:15 AM', endTime: '10:00 AM' },
    { id: 'p2', periodNumber: 2, label: 'Period II', startTime: '10:00 AM', endTime: '10:45 AM' },
    { id: 'p3', periodNumber: 3, label: 'Period III', startTime: '10:45 AM', endTime: '11:30 AM' },
    { id: 'p4', periodNumber: 4, label: 'Period IV', startTime: '11:30 AM', endTime: '12:15 PM' },
    { id: 'p5', periodNumber: 5, label: 'Period V', startTime: '12:15 PM', endTime: '01:00 PM' },
    { id: 'p6', periodNumber: 6, label: 'Period VI', startTime: '01:00 PM', endTime: '01:45 PM' },
    { id: 'p7', periodNumber: 7, label: 'Period VII', startTime: '01:45 PM', endTime: '02:30 PM' },
    { id: 'p8', periodNumber: 8, label: 'Period VIII', startTime: '02:30 PM', endTime: '03:15 PM' },
    { id: 'p9', periodNumber: 9, label: 'Period IX', startTime: '03:15 PM', endTime: '04:00 PM' },
    { id: 'p10', periodNumber: 10, label: 'Period X', startTime: '04:00 PM', endTime: '04:45 PM' },
    { id: 'p11', periodNumber: 11, label: 'Period XI', startTime: '04:45 PM', endTime: '05:30 PM' },
  ];

  const rowsHtml = days
    .map((day) => {
      const cells = periods
        .map((p) => {
          const spanInfo = getSemesterCellSpanInfo(slots, day, p, course, yearLevel, semester);
          if (spanInfo.shouldSkip) {
            return '';
          }

          const matchingSlots = spanInfo.matchingSlots;
          const colSpanAttr = spanInfo.span > 1 ? `colspan="${spanInfo.span}"` : '';

          if (matchingSlots.length === 0) {
            return `<td ${colSpanAttr} style="padding: 10px; border: 1px solid #334155; text-align: center; color: #94a3b8; font-size: 11px;">—</td>`;
          }

          const slotContent = matchingSlots
            .map(
              (s) => `
              <div style="font-size: 11px; margin-bottom: 4px;">
                <div style="font-weight: 700; color: #0f172a; font-family: monospace;">${s.paperCode || ''}</div>
                <div style="font-weight: 600; color: #1e293b;">${s.subjectName}</div>
                <div style="color: #475569; font-size: 10px; margin-top: 2px;">👤 ${s.facultyName}</div>
                <div style="color: #64748b; font-size: 9px;">🏛️ ${s.roomNo} | <span style="font-style: italic;">${s.type || 'Lecture'}</span></div>
              </div>
            `
            )
            .join('<hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 4px 0;" />');

          return `<td ${colSpanAttr} style="padding: 8px 10px; border: 1px solid #334155; vertical-align: top; background-color: ${spanInfo.span > 1 ? '#fef3c7' : '#f8fafc'};">${slotContent}</td>`;
        })
        .join('');

      return `
        <tr>
          <td style="padding: 12px 10px; border: 1px solid #334155; font-weight: 700; text-align: center; background-color: #f1f5f9; color: #0f172a; font-size: 12px;">
            ${day.toUpperCase()}
          </td>
          ${cells}
        </tr>
      `;
    })
    .join('');

  const periodColsHtml = periods
    .map(
      (p) => `
      <th>${p.label}<br><span style="font-weight: 400; font-size: 10px; text-transform: none;">${p.startTime} – ${p.endTime}</span></th>
    `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Time Table - ${course} ${yearLevel} (${semester})</title>
  <style>
    @page { size: landscape; margin: 8mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 15px; color: #0f172a; background: #fff; }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 15px; }
    .title-college { font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    .title-dept { font-size: 14px; font-weight: 700; color: #334155; margin-top: 2px; }
    .meta-bar { display: flex; justify-content: space-between; margin-top: 8px; font-size: 12px; font-weight: 600; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: fixed; }
    th { border: 1px solid #334155; background-color: #0b1a2f; color: #ffffff; padding: 10px 8px; font-size: 11px; text-transform: uppercase; }
    .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 10px; font-size: 11px; font-weight: 700; color: #1e293b; text-align: center; }
    .sig-box { width: 200px; border-top: 1px solid #0f172a; padding-top: 5px; }
    .print-btn { background: #0b1a2f; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; margin-bottom: 15px; }
    @media print { .print-btn { display: none; } body { padding: 0; } }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>

  <div class="header">
    <div class="title-college">PANCHAYAT COLLEGE, BARAGADA (AUTONOMOUS)</div>
    <div class="title-dept">DEPARTMENT OF MATHEMATICS • MASTER CLASS TIME TABLE</div>
    <div class="meta-bar">
      <span>PROGRAM: <strong>${course}</strong></span>
      <span>YEAR: <strong>${yearLevel}</strong></span>
      <span>SEMESTER: <strong>${semester}</strong></span>
      <span>SESSION: <strong>${academicSession}</strong></span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 100px;">DAY</th>
        ${periodColsHtml}
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="signatures">
    <div class="sig-box">Head of Department<br><span style="font-weight: normal; font-size: 10px;">Dept. of Mathematics</span></div>
    <div class="sig-box">Academic Bursar<br><span style="font-weight: normal; font-size: 10px;">Panchayat College</span></div>
    <div class="sig-box">Principal<br><span style="font-weight: normal; font-size: 10px;">Panchayat College, Baragada</span></div>
  </div>
</body>
</html>`;
}

/**
 * Generates an official standalone printable HTML document for the Grand Master Routine
 * containing ALL DETAILS OF ALL DAYS (Mon-Sat) and EVERY CLASS in a SINGLE PAGE.
 */
export function generatePrintableAllDaysMasterHtml(
  slots: TimeTableSlot[],
  rows: TimeTableClassRow[],
  periodsInput?: TimeTablePeriod[],
  academicSession = '2026–2027'
): string {
  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const periods = periodsInput && periodsInput.length > 0 ? periodsInput : [
    { id: 'p1', periodNumber: 1, label: 'Period I', startTime: '09:15 AM', endTime: '10:00 AM' },
    { id: 'p2', periodNumber: 2, label: 'Period II', startTime: '10:00 AM', endTime: '10:45 AM' },
    { id: 'p3', periodNumber: 3, label: 'Period III', startTime: '10:45 AM', endTime: '11:30 AM' },
    { id: 'p4', periodNumber: 4, label: 'Period IV', startTime: '11:30 AM', endTime: '12:15 PM' },
    { id: 'p5', periodNumber: 5, label: 'Period V', startTime: '12:15 PM', endTime: '01:00 PM' },
    { id: 'p6', periodNumber: 6, label: 'Period VI', startTime: '01:00 PM', endTime: '01:45 PM' },
    { id: 'p7', periodNumber: 7, label: 'Period VII', startTime: '01:45 PM', endTime: '02:30 PM' },
    { id: 'p8', periodNumber: 8, label: 'Period VIII', startTime: '02:30 PM', endTime: '03:15 PM' },
    { id: 'p9', periodNumber: 9, label: 'Period IX', startTime: '03:15 PM', endTime: '04:00 PM' },
    { id: 'p10', periodNumber: 10, label: 'Period X', startTime: '04:00 PM', endTime: '04:45 PM' },
    { id: 'p11', periodNumber: 11, label: 'Period XI', startTime: '04:45 PM', endTime: '05:30 PM' },
  ];

  const periodColsHtml = periods
    .map(
      (p) => `
      <th style="padding: 2px 2px; border: 1px solid #1e293b; background-color: #0b1a2f; color: #ffffff; text-align: center; font-size: 7.5px;">
        <div style="font-weight: 800;">${p.label}</div>
        <div style="font-size: 6.5px; font-weight: normal; opacity: 0.9; font-family: monospace;">${p.startTime}–${p.endTime}</div>
      </th>
    `
    )
    .join('');

  const totalClassesCount = slots.length;

  const dayRowsHtml = days
    .map((day, dayIndex) => {
      const dayColor = dayIndex % 2 === 0 ? '#0f274a' : '#1e3a8a';
      return rows
        .map((row, rowIndex) => {
          const isFirstRowOfDay = rowIndex === 0;
          const dayCellHtml = isFirstRowOfDay
            ? `<td rowspan="${rows.length}" style="width: 22px; max-width: 24px; background-color: ${dayColor}; color: #fef08a; font-weight: 900; font-size: 8px; text-align: center; vertical-align: middle; padding: 2px 1px; border: 1px solid #334155; writing-mode: vertical-rl; transform: rotate(180deg); letter-spacing: 1px;">
                ${day.toUpperCase()}
              </td>`
            : '';

          const cells = periods
            .map((p) => {
              const spanInfo = getMasterCellSpanInfo(slots, row, p, day);
              if (spanInfo.shouldSkip) {
                return '';
              }

              const matchingSlots = spanInfo.matchingSlots;
              const colSpanAttr = spanInfo.span > 1 ? `colspan="${spanInfo.span}"` : '';

              if (matchingSlots.length === 0) {
                return `<td ${colSpanAttr} style="padding: 1px 2px; border: 1px solid #cbd5e1; text-align: center; color: #cbd5e1; font-size: 7px; background-color: ${rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc'};">—</td>`;
              }

              const slotContent = matchingSlots
                .map(
                  (s) => `
                  <div style="font-size: 6.5px; line-height: 1.1; margin: 0; padding: 0.5px 0;">
                    <span style="font-weight: 800; color: #b45309; font-family: monospace; font-size: 6.5px;">${s.paperCode || ''}</span>
                    <div style="font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${s.subjectName}">${s.subjectName}</div>
                    <div style="color: #1e40af; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">👤 ${s.facultyName || 'Faculty'}</div>
                    <div style="color: #64748b; font-size: 6px;">🏛️ ${s.roomNo || 'Room'} <span style="font-style: italic;">(${s.type || 'Lec'})</span></div>
                  </div>
                `
                )
                .join('<div style="border-top: 1px dashed #cbd5e1; margin: 1px 0;"></div>');

              return `<td ${colSpanAttr} style="padding: 1px 2px; border: 1px solid #94a3b8; vertical-align: top; background-color: ${spanInfo.span > 1 ? '#fef3c7' : '#fffbeb'};">${slotContent}</td>`;
            })
            .join('');

          return `
            <tr style="height: 13px;">
              ${dayCellHtml}
              <td style="width: 85px; max-width: 90px; padding: 1.5px 3px; border: 1px solid #94a3b8; font-weight: 700; background-color: ${rowIndex % 2 === 0 ? '#f1f5f9' : '#e2e8f0'}; color: #0f172a; font-size: 7px; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${row.label || `${row.course} - ${row.semester}`}">
                <div style="font-weight: 800; color: #0b1a2f;">${row.label || `${row.course} - ${row.semester}`}</div>
                <div style="font-size: 6px; font-weight: normal; color: #475569;">${row.semester} (${row.yearLevel})</div>
              </td>
              ${cells}
            </tr>
          `;
        })
        .join('');
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Master Time Table - All Days & Classes (Single Page)</title>
  <style>
    @page {
      size: A3 landscape;
      margin: 4mm 5mm;
    }
    @media print {
      body {
        margin: 0 !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .no-print {
        display: none !important;
      }
      .single-page-wrapper {
        width: 100% !important;
        height: 98vh !important;
        max-height: 98vh !important;
        overflow: hidden !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
      }
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      margin: 0;
      padding: 6px;
      color: #0f172a;
      background: #f1f5f9;
    }
    .no-print-toolbar {
      max-width: 1350px;
      margin: 0 auto 6px auto;
      background: #0b1a2f;
      color: #fff;
      padding: 6px 12px;
      border-radius: 6px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 11px;
    }
    .btn-print {
      background: #f59e0b;
      color: #000;
      border: none;
      padding: 5px 12px;
      border-radius: 5px;
      font-size: 11px;
      font-weight: 800;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .btn-print:hover {
      background: #fbbf24;
    }
    .single-page-wrapper {
      background: #ffffff;
      max-width: 1350px;
      margin: 0 auto;
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: calc(100vh - 55px);
      min-height: 600px;
      overflow: hidden;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #0b1a2f;
      padding-bottom: 2px;
      margin-bottom: 3px;
    }
    .title-college {
      font-size: 13px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0b1a2f;
    }
    .title-dept {
      font-size: 10px;
      font-weight: 800;
      color: #b45309;
      text-transform: uppercase;
      margin-top: 1px;
    }
    .meta-bar {
      display: flex;
      justify-content: space-between;
      margin-top: 2px;
      font-size: 8px;
      font-weight: 700;
      color: #334155;
      background: #f8fafc;
      padding: 1px 4px;
      border-radius: 3px;
    }
    table.master-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 7px;
    }
    table.master-table th, table.master-table td {
      border: 1px solid #475569;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 4px;
      padding-top: 2px;
      font-size: 8px;
      font-weight: 800;
      color: #0b1a2f;
      text-align: center;
    }
    .sig-box {
      width: 140px;
      border-top: 1px solid #0b1a2f;
      padding-top: 2px;
    }
  </style>
</head>
<body>
  <div class="no-print-toolbar no-print">
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-weight: 800; color: #f59e0b;">MASTER TIME TABLE (ALL DAYS &amp; CLASSES)</span>
      <span style="opacity: 0.8;">• Single Page Mode (Fits on 1 sheet of paper)</span>
    </div>
    <div style="display: flex; align-items: center; gap: 6px;">
      <button class="btn-print" onclick="window.print()">
        🖨️ Print / Save as PDF (1 Page)
      </button>
      <button style="background: #334155; color: #fff; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 11px;" onclick="document.querySelector('.single-page-wrapper').style.transform = (document.querySelector('.single-page-wrapper').style.transform === 'scale(0.9)' ? 'scale(1)' : 'scale(0.9)'); document.querySelector('.single-page-wrapper').style.transformOrigin = 'top center';">
        🔍 Toggle Zoom (Fit Check)
      </button>
    </div>
  </div>

  <div class="single-page-wrapper">
    <div>
      <div class="header">
        <div class="title-college">PANCHAYAT COLLEGE, BARAGADA (AUTONOMOUS)</div>
        <div class="title-dept">DEPARTMENT OF MATHEMATICS • ALL-DAYS MASTER CLASS TIME TABLE</div>
        <div class="meta-bar">
          <span>WORKING DAYS: <strong>MONDAY – SATURDAY (6 DAYS)</strong></span>
          <span>PROGRAMS: <strong>UG NEP, UG AEDP &amp; PG (${rows.length} COHORTS)</strong></span>
          <span>PERIODS: <strong>11 DAILY SESSIONS (09:15 AM – 05:30 PM)</strong></span>
          <span>SESSION: <strong>${academicSession}</strong></span>
          <span>TOTAL CLASSES: <strong>${totalClassesCount} SCHEDULED</strong></span>
        </div>
      </div>

      <table class="master-table">
        <thead>
          <tr>
            <th style="width: 22px; max-width: 24px; background-color: #0b1a2f; color: #fef08a; font-size: 7.5px; padding: 2px 1px;">DAY</th>
            <th style="width: 85px; max-width: 90px; background-color: #0b1a2f; color: #ffffff; text-align: left; padding: 2px 4px; font-size: 7.5px;">CLASS / PROGRAM</th>
            ${periodColsHtml}
          </tr>
        </thead>
        <tbody>
          ${dayRowsHtml}
        </tbody>
      </table>
    </div>

    <div class="signatures">
      <div class="sig-box">Head of Department<br><span style="font-weight: normal; font-size: 7px; color: #475569;">Dept. of Mathematics</span></div>
      <div class="sig-box">Academic Bursar<br><span style="font-weight: normal; font-size: 7px; color: #475569;">Panchayat College</span></div>
      <div class="sig-box">Principal<br><span style="font-weight: normal; font-size: 7px; color: #475569;">Panchayat College, Baragada</span></div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Resolves faculty designation from faculty name using provided facultyList or initialFaculty fallback.
 */
export function getFacultyDesignation(facultyName: string, facultyList?: Faculty[]): string {
  if (!facultyName) return 'Faculty Member';
  const norm = facultyName.trim().toLowerCase();

  const searchIn = facultyList && facultyList.length > 0 ? facultyList : initialFaculty;
  const found = searchIn.find((f) => {
    const fNorm = f.name.trim().toLowerCase();
    return fNorm === norm || fNorm.includes(norm) || norm.includes(fNorm);
  });
  if (found && found.designation) {
    return found.designation;
  }

  // Check common prefixes or keywords in name
  if (norm.includes('guest') || norm.includes('consultant')) {
    return 'Guest Faculty / Academic Consultant';
  }
  if (
    norm.includes('prof') ||
    norm.includes('malik') ||
    norm.includes('sahoo') ||
    norm.includes('pradhan') ||
    norm.includes('dash') ||
    norm.includes('meher')
  ) {
    return 'Assistant Professor';
  }
  return 'Assistant Professor';
}

/**
 * Checks whether a faculty designation represents a Guest Faculty.
 */
export function isGuestFaculty(designation: string, name?: string): boolean {
  const d = (designation || '').toLowerCase();
  const n = (name || '').toLowerCase();
  return (
    d.includes('guest') ||
    d.includes('consultant') ||
    d.includes('ad hoc') ||
    d.includes('adhoc') ||
    n.includes('guest') ||
    n.includes('consultant')
  );
}

/**
 * Checks whether a faculty designation represents Assistant Professor, Associate Professor,
 * Professor, Assistant Professor TE, Associate Professor TE, Professor TE, or regular teacher.
 */
export function isProfessorOrTEFaculty(designation: string, name?: string): boolean {
  if (isGuestFaculty(designation, name)) return false;
  const d = (designation || '').toLowerCase();
  return (
    d.includes('professor') ||
    d.includes('prof') ||
    d.includes('lecturer') ||
    d.includes('reader') ||
    d.includes('te') ||
    d.includes('teacher educator') ||
    d.includes('head') ||
    d.includes('hod') ||
    !d
  );
}

/**
 * Returns number of consecutive periods spanned by a timetable slot.
 */
export function getSlotPeriodSpan(slot: TimeTableSlot): number {
  if (slot.spanPeriods && slot.spanPeriods > 0) {
    return slot.spanPeriods;
  }
  const isLab = slot.type === 'Practical / Lab';

  if (isLab) {
    const startM = parseTimeToMinutes(slot.startTime);
    const endM = parseTimeToMinutes(slot.endTime);
    const diff = endM - startM;
    if (diff > 45) {
      return Math.max(2, Math.round(diff / 45));
    }
    return 2; // Standard Department practical lab sessions span 2 periods
  }
  return 1;
}

/**
 * Calculates the number of classes represented by a slot:
 * - For Assistant Professor / Associate Professor / Professor / Assistant Professor TE / Associate Professor TE / Professor TE:
 *   Practical / Lab classes count EACH PERIOD as a class (e.g. 2 periods = 2 classes).
 * - For Guest Faculties:
 *   Practical / Lab classes count as it is existing (1 class per session).
 * - Lectures, Tutorials, Seminars count as filled (1 class per period).
 */
export function countSlotClasses(
  slot: TimeTableSlot,
  facultyDesignation?: string,
  facultyList?: Faculty[]
): number {
  const isPractical = slot.type === 'Practical / Lab';

  if (!isPractical) {
    return slot.spanPeriods && slot.spanPeriods > 0 ? slot.spanPeriods : 1;
  }

  const designation =
    facultyDesignation || getFacultyDesignation(slot.facultyName, facultyList);
  const isGuest = isGuestFaculty(designation, slot.facultyName);

  if (isGuest) {
    // Existing count for guest faculties: 1 class per practical session
    return 1;
  }

  // For Assistant Professor / Associate Professor / Professor / Assistant Professor TE / Associate Professor TE / Professor TE:
  // Count EACH PERIOD as 1 class (e.g. 2 periods = 2 classes)
  return getSlotPeriodSpan(slot);
}

/**
 * Calculates total weekly classes for a faculty member's slots.
 */
export function calculateFacultyTotalClasses(
  facultySlots: TimeTableSlot[],
  facultyDesignation?: string,
  facultyList?: Faculty[]
): number {
  return facultySlots.reduce((sum, slot) => {
    return sum + countSlotClasses(slot, facultyDesignation, facultyList);
  }, 0);
}

/**
 * Generates an official standalone printable HTML document for an Individual Faculty Member's weekly routine and workload.
 */
export function generatePrintableFacultyScheduleHtml(
  facultyName: string,
  slots: TimeTableSlot[],
  periods: TimeTablePeriod[],
  academicSession = '2026–2027',
  facultyDesignationInput?: string,
  facultyList?: Faculty[]
): string {
  const normalizedFaculty = facultyName.trim().toLowerCase();
  const facultySlots = slots.filter((s) => {
    const slotFac = s.facultyName?.trim().toLowerCase() || '';
    if (!slotFac) return false;
    return (
      slotFac === normalizedFaculty ||
      slotFac.includes(normalizedFaculty) ||
      normalizedFaculty.includes(slotFac)
    );
  });

  const facultyDesignation =
    facultyDesignationInput || getFacultyDesignation(facultyName, facultyList);
  const isGuest = isGuestFaculty(facultyDesignation, facultyName);

  // Total classes calculated according to the academic rule:
  // - Assistant Professor / Associate Professor / Professor / TE: each period of a practical class counts as 1 class
  // - Guest Faculty: practical class counts as it is existing (1 class per session)
  const totalClassesCount = calculateFacultyTotalClasses(facultySlots, facultyDesignation);

  const totalMinutes = facultySlots.reduce(
    (acc, s) => acc + getSlotPeriodSpan(s) * 45,
    0
  );
  const totalHours = (totalMinutes / 60).toFixed(1);

  const practicalSlots = facultySlots.filter(
    (s) => s.type === 'Practical / Lab'
  );
  const theorySlots = facultySlots.filter(
    (s) => s.type !== 'Practical / Lab'
  );
  const practicalCount = practicalSlots.reduce(
    (sum, s) => sum + countSlotClasses(s, facultyDesignation),
    0
  );

  const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const periodHeaderHtml = periods
    .map(
      (p) => `
    <th style="border: 1px solid #1e293b; background-color: #0b1a2f; color: #ffffff; padding: 6px 4px; text-align: center; font-size: 8px;">
      ${p.label}
      <br>
      <span style="font-size: 7px; opacity: 0.85; font-weight: normal;">${p.startTime} – ${p.endTime}</span>
    </th>
  `
    )
    .join('');

  const dayRowsHtml = DAYS.map((day) => {
    const daySlots = facultySlots.filter((s) => s.dayOfWeek === day);
    const dayClassesCount = daySlots.reduce(
      (sum, s) => sum + countSlotClasses(s, facultyDesignation),
      0
    );

    const cellsHtml = periods
      .map((p) => {
        // Check if covered by a previous period slot in this day for this faculty
        const coveringSlot = facultySlots.find((s) => {
          if (s.dayOfWeek !== day) return false;
          const startP = s.periodNumber || 1;
          const span = getSlotPeriodSpan(s);
          return startP < p.periodNumber && startP + span > p.periodNumber;
        });

        if (coveringSlot) return '';

        const match = facultySlots.find((s) => {
          if (s.dayOfWeek !== day) return false;
          const startP = s.periodNumber || 1;
          if (startP === p.periodNumber) return true;
          return areTimesOverlapping(s.startTime, s.endTime, p.startTime, p.endTime);
        });

        if (match) {
          const span = getSlotPeriodSpan(match);
          const colSpanAttr = span > 1 ? `colspan="${span}"` : '';
          const isLab = match.type === 'Practical / Lab';
          const slotClassWeight = countSlotClasses(match, facultyDesignation);

          return `
            <td ${colSpanAttr} style="border: 1px solid #475569; padding: 4px; text-align: left; vertical-align: top; background-color: ${
              isLab ? '#fef3c7' : '#ffffff'
            };">
              <div style="font-weight: 800; font-size: 8.5px; color: #0b1a2f; line-height: 1.1;">${match.subjectName}</div>
              <div style="font-size: 7.5px; font-weight: 700; color: #b45309; margin-top: 2px;">
                ${
                  match.paperCode
                    ? `<span style="font-family: monospace; background: #fef08a; padding: 1px 3px; border-radius: 2px; border: 1px solid #fde047;">${match.paperCode}</span> `
                    : ''
                }
                ${match.course} (${match.yearLevel} - ${match.semester})
              </div>
              <div style="font-size: 7.5px; color: #334155; margin-top: 2px;">
                🏛️ ${match.roomNo} <span style="font-weight: 600;">(${match.type}${
            span > 1 ? ` • ${span} Periods = ${slotClassWeight} Class${slotClassWeight > 1 ? 'es' : ''}` : ''
          })</span>
              </div>
            </td>
          `;
        }

        return `<td style="border: 1px solid #cbd5e1; text-align: center; color: #cbd5e1; font-size: 8px; vertical-align: middle;">—</td>`;
      })
      .join('');

    return `
      <tr>
        <td style="border: 1px solid #1e293b; background-color: #f1f5f9; font-weight: 800; font-size: 8.5px; text-align: center; color: #0b1a2f; padding: 6px 2px;">
          ${day.toUpperCase()}
          <br>
          <span style="font-size: 7px; color: #64748b; font-weight: normal;">(${dayClassesCount} class${
      dayClassesCount === 1 ? '' : 'es'
    })</span>
        </td>
        ${cellsHtml}
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Faculty Routine - ${facultyName}</title>
  <style>
    @page { size: A4 landscape; margin: 6mm; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      margin: 0; padding: 0; background-color: #f8fafc; color: #0f172a;
    }
    .no-print-toolbar {
      background: #0b1a2f; color: #ffffff; padding: 8px 16px;
      display: flex; justify-content: space-between; align-items: center;
      font-size: 12px; border-bottom: 2px solid #f59e0b; position: sticky; top: 0; z-index: 100;
    }
    .btn-print {
      background: #f59e0b; color: #0f172a; font-weight: 800; border: none;
      padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 11px;
    }
    @media print {
      .no-print { display: none !important; }
      body { background: white; }
      .wrapper { border: none !important; box-shadow: none !important; height: auto !important; margin: 0 !important; }
    }
    .wrapper {
      background: #ffffff; max-width: 1250px; margin: 10px auto; padding: 12px 16px;
      border: 1px solid #cbd5e1; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center; border-bottom: 2px solid #0b1a2f; padding-bottom: 6px; margin-bottom: 8px;
    }
    .title-college { font-size: 14px; font-weight: 900; text-transform: uppercase; color: #0b1a2f; }
    .title-dept { font-size: 11px; font-weight: 800; color: #b45309; text-transform: uppercase; margin-top: 2px; }
    .faculty-title-box {
      background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 6px;
      margin-top: 6px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;
    }
    .fac-name { font-size: 13px; font-weight: 900; color: #0b1a2f; }
    .fac-desig { font-size: 10px; font-weight: 700; color: #b45309; margin-left: 6px; }
    .meta-pills { font-size: 9px; font-weight: 700; color: #334155; display: flex; flex-wrap: wrap; gap: 10px; }
    .counting-rule-note {
      background: #eef2ff; border: 1px solid #c7d2fe; padding: 4px 8px; border-radius: 4px;
      font-size: 8px; color: #3730a3; font-weight: 600; margin-top: 4px;
    }
    table.routine-table { width: 100%; border-collapse: collapse; margin-top: 8px; table-layout: fixed; }
    .signatures {
      display: flex; justify-content: space-between; margin-top: 20px; padding-top: 4px;
      font-size: 9px; font-weight: 800; color: #0b1a2f; text-align: center;
    }
    .sig-box { width: 160px; border-top: 1px solid #0b1a2f; padding-top: 3px; }
  </style>
</head>
<body>
  <div class="no-print-toolbar no-print">
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-weight: 800; color: #f59e0b;">INDIVIDUAL FACULTY CLASS TIME TABLE</span>
      <span style="opacity: 0.8;">• ${facultyName} (${facultyDesignation})</span>
    </div>
    <div style="display: flex; align-items: center; gap: 6px;">
      <button class="btn-print" onclick="window.print()">
        🖨️ Print / Save as PDF
      </button>
    </div>
  </div>

  <div class="wrapper">
    <div class="header">
      <div class="title-college">PANCHAYAT COLLEGE, BARAGADA (AUTONOMOUS)</div>
      <div class="title-dept">DEPARTMENT OF MATHEMATICS • INDIVIDUAL FACULTY WORKLOAD &amp; ROUTINE</div>
      
      <div class="faculty-title-box">
        <div>
          <span style="font-size: 8px; text-transform: uppercase; color: #64748b; font-weight: 800; display: block;">FACULTY MEMBER &amp; CADRE:</span>
          <span class="fac-name">${facultyName}</span>
          <span class="fac-desig">• ${facultyDesignation}</span>
        </div>
        <div class="meta-pills">
          <span>WEEKLY CLASSES: <strong style="color: #b45309; font-size: 11px;">${totalClassesCount} CLASSES</strong></span>
          <span>HOURS: <strong>${totalHours} HRS/WK</strong></span>
          <span>BREAKDOWN: <strong>${theorySlots.length} Theory + ${practicalCount} Practical Periods</strong></span>
          <span>SESSION: <strong>${academicSession}</strong></span>
          <span>DAYS: <strong>MON – SAT</strong></span>
        </div>
      </div>
      <div class="counting-rule-note">
        ℹ️ Workload Counting: ${
          isGuest
            ? 'Guest Faculty — Practical lab sessions counted as existing (1 class per practical session).'
            : `${facultyDesignation} — Each period of a practical class is counted as 1 class (${practicalCount} classes across practical periods).`
        }
      </div>
    </div>

    <table class="routine-table">
      <thead>
        <tr>
          <th style="width: 75px; background-color: #0b1a2f; color: #fef08a; font-size: 8.5px; padding: 6px 2px;">DAY</th>
          ${periodHeaderHtml}
        </tr>
      </thead>
      <tbody>
        ${dayRowsHtml}
      </tbody>
    </table>

    <div class="signatures">
      <div class="sig-box">Faculty Member<br><span style="font-weight: normal; font-size: 8px; color: #475569;">${facultyName}<br>(${facultyDesignation})</span></div>
      <div class="sig-box">Head of Department<br><span style="font-weight: normal; font-size: 8px; color: #475569;">Dept. of Mathematics</span></div>
      <div class="sig-box">Principal<br><span style="font-weight: normal; font-size: 8px; color: #475569;">Panchayat College, Baragada</span></div>
    </div>
  </div>
</body>
</html>`;
}

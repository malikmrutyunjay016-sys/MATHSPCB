// Utility functions for Exam Attendance Form (APPENDIX - A)
// Strictly matching the official format, dimensions, 24 rows per page, 5 columns, and metadata from the Panchayat College examination template
import { jsPDF } from 'jspdf';
import { Student } from '../types';
import { formatDateToDDMMYYYY } from './dateFormatter';

export interface AttendanceFormConfig {
  centre: string; // "PANCHAYAT COLLEGE, BARAGADA"
  dateOfExam: string; // e.g. "2026-11-15" or "15/11/2026"
  className: string; // e.g. "UG NEP 1st Year (B.Sc. Mathematics)"
  subject: string; // e.g. "Mathematics"
  sitting: '1st Sitting' | '2nd Sitting' | 'Both' | '';
  roomNo: string; // e.g. "Room No. 104"
  rowsPerPage: number; // Strictly 24 rows per page
}

export interface AttendanceStudentEntry {
  id: string;
  name?: string;
  rollNumber: string;
  serialAnswerBook?: string;
  serialAddlAnswerBook?: string;
  timeHandingOver?: string;
  candidateSignature?: string;
}

export const ROWS_PER_PAGE = 24;

/**
 * Extracts preferred roll number for student based on type selection:
 * - 'college': College Roll No
 * - 'university': University Roll No / Registration No
 * - 'both': Both (College / University)
 */
export function getStudentRollByType(
  s: Student,
  type: 'college' | 'university' | 'both'
): string {
  const collegeRoll = (s.rollNumber || '').trim();
  const univRoll = (s.registrationNumber || '').trim();

  if (type === 'college') {
    return collegeRoll || univRoll || s.uniqueId || '';
  }
  if (type === 'university') {
    return univRoll || collegeRoll || s.uniqueId || '';
  }
  // 'both'
  if (collegeRoll && univRoll) {
    return `${collegeRoll} / ${univRoll}`;
  }
  return collegeRoll || univRoll || s.uniqueId || '';
}

/**
 * Sorts student entries in natural dictionary / alphanumeric order by roll number.
 */
export function sortAttendanceEntries(
  list: AttendanceStudentEntry[]
): AttendanceStudentEntry[] {
  return [...list].sort((a, b) => {
    const rollA = (a.rollNumber || '').trim();
    const rollB = (b.rollNumber || '').trim();
    if (!rollA && !rollB) {
      const nameA = (a.name || '').trim();
      const nameB = (b.name || '').trim();
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    }
    if (!rollA) return 1;
    if (!rollB) return -1;
    return rollA.localeCompare(rollB, undefined, { numeric: true, sensitivity: 'base' });
  });
}

/**
 * Partitions entries into pages of exactly 24 rows each.
 * If entries on the last page are fewer than 24, fills up to 24 blank rows.
 */
export function paginateAttendanceEntries(
  entries: AttendanceStudentEntry[],
  rowsPerPage: number = ROWS_PER_PAGE
): AttendanceStudentEntry[][] {
  const totalEntries = entries.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / rowsPerPage));
  const pages: AttendanceStudentEntry[][] = [];

  for (let p = 0; p < totalPages; p++) {
    const pageRows: AttendanceStudentEntry[] = [];
    const startIndex = p * rowsPerPage;

    for (let r = 0; r < rowsPerPage; r++) {
      const entryIndex = startIndex + r;
      if (entryIndex < totalEntries) {
        pageRows.push(entries[entryIndex]);
      } else {
        // Blank row to satisfy strict 24 rows requirement
        pageRows.push({
          id: `blank-${p}-${r}`,
          rollNumber: '',
          serialAnswerBook: '',
          serialAddlAnswerBook: '',
          timeHandingOver: '',
          candidateSignature: '',
        });
      }
    }
    pages.push(pageRows);
  }

  return pages;
}

/**
 * Generates an authentic downloadable vector PDF matching the official APPENDIX - A format
 */
export function generateAttendanceFormPDF(
  config: AttendanceFormConfig,
  entries: AttendanceStudentEntry[]
): void {
  const sortedEntries = sortAttendanceEntries(entries);
  const pages = paginateAttendanceEntries(sortedEntries, config.rowsPerPage || ROWS_PER_PAGE);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // A4 dimensions: 210 x 297 mm
  const marginX = 14; // Left/Right margins = 14mm
  const tableWidth = 210 - marginX * 2; // 182mm
  // Column widths matching the PDF coordinate ratios:
  // Total: 182mm -> Col 1: 28mm (Roll No), Col 2: 32mm, Col 3: 32mm, Col 4: 25mm, Col 5: 65mm
  const colW = [28, 32, 32, 25, 65];

  pages.forEach((pageRows, pageIdx) => {
    if (pageIdx > 0) {
      doc.addPage('a4', 'portrait');
    }

    // Top Header: APPENDIX - A
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('APPENDIX – A', 105, 13, { align: 'center' });

    doc.setFontSize(12.5);
    doc.text(
      'Statement of Answer Books Issued to the Candidate in the Examination Hall',
      105,
      19.5,
      { align: 'center' }
    );

    doc.setFontSize(12);
    doc.text(
      `Examination Centre – ${config.centre || 'PANCHAYAT COLLEGE, BARAGADA'}`,
      105,
      25.5,
      { align: 'center' }
    );

    // Examination Context Metadata
    const fontMeta = 11.5;
    doc.setFont('times', 'normal');
    doc.setFontSize(fontMeta);

    // Date of Examination
    doc.text('Date of Examination – ', marginX, 33);
    const dateLabelW = doc.getTextWidth('Date of Examination – ');
    doc.setFont('times', 'bold');
    doc.text(config.dateOfExam ? formatDateToDDMMYYYY(config.dateOfExam) : '', marginX + dateLabelW, 33);

    // Class & Subject & Sitting
    doc.setFont('times', 'normal');
    doc.text('Class - ', marginX, 40);
    const classLabelW = doc.getTextWidth('Class - ');
    doc.setFont('times', 'bold');
    doc.text(config.className || '', marginX + classLabelW, 40);

    doc.setFont('times', 'normal');
    doc.text('Subject - ', marginX + 62, 40);
    const subjectLabelW = doc.getTextWidth('Subject - ');
    doc.setFont('times', 'bold');
    doc.text(config.subject || '', marginX + 62 + subjectLabelW, 40);

    // Sitting on right side
    doc.setFont('times', 'normal');
    doc.text('Sitting', marginX + 130, 39.5);
    const isFirst = config.sitting === '1st Sitting';
    const isSecond = config.sitting === '2nd Sitting';

    doc.setFont('times', isFirst ? 'bold' : 'normal');
    doc.text('1st Sitting', marginX + 148, 39.5);
    if (isFirst) {
      doc.setLineWidth(0.35);
      doc.line(marginX + 148, 40.2, marginX + 167, 40.2);
    }

    doc.setFont('times', isSecond ? 'bold' : 'normal');
    doc.text('2nd Sitting', marginX + 148, 44.5);
    if (isSecond) {
      doc.setLineWidth(0.35);
      doc.line(marginX + 148, 45.2, marginX + 167, 45.2);
    }

    // Room No.
    doc.setFont('times', 'normal');
    doc.text('Room No. - ', marginX, 47);
    const roomLabelW = doc.getTextWidth('Room No. - ');
    doc.setFont('times', 'bold');
    doc.text(config.roomNo || '', marginX + roomLabelW, 47);

    // TABLE
    const tableStartY = 50.5;
    const headerH1 = 15; // 4-line header
    const headerH2 = 5; // row with 1, 2, 3, 4, 5
    const rowH = 8.35; // Exactly 24 rows * 8.35mm = 200.4mm

    // Draw Header 1
    doc.setLineWidth(0.3);
    doc.setDrawColor(0, 0, 0);
    doc.rect(marginX, tableStartY, tableWidth, headerH1);

    // Vertical column divider lines in Header 1
    let curX = marginX;
    for (let c = 0; c < 4; c++) {
      curX += colW[c];
      doc.line(curX, tableStartY, curX, tableStartY + headerH1);
    }

    doc.setFont('times', 'bold');
    doc.setFontSize(8.5);

    // Col 1: Roll No.
    doc.text('Roll No.', marginX + colW[0] / 2, tableStartY + 9, { align: 'center' });

    // Col 2: Serial No. of the Answer books issued to the candidates
    const col2X = marginX + colW[0] + colW[1] / 2;
    doc.text('Serial No. of', col2X, tableStartY + 3.8, { align: 'center' });
    doc.text('the Answer', col2X, tableStartY + 7.2, { align: 'center' });
    doc.text('books issued to', col2X, tableStartY + 10.6, { align: 'center' });
    doc.text('the candidates', col2X, tableStartY + 14.0, { align: 'center' });

    // Col 3: Serial No. of Addl. Answer books issued to the candidates
    const col3X = marginX + colW[0] + colW[1] + colW[2] / 2;
    doc.text('Serial No. of', col3X, tableStartY + 3.8, { align: 'center' });
    doc.text('Addl. Answer', col3X, tableStartY + 7.2, { align: 'center' });
    doc.text('books issued to', col3X, tableStartY + 10.6, { align: 'center' });
    doc.text('the candidates', col3X, tableStartY + 14.0, { align: 'center' });

    // Col 4: Time of handing over the answer books
    const col4X = marginX + colW[0] + colW[1] + colW[2] + colW[3] / 2;
    doc.setFontSize(7.5);
    doc.text('Time of', col4X, tableStartY + 3.5, { align: 'center' });
    doc.text('handing', col4X, tableStartY + 6.3, { align: 'center' });
    doc.text('over the', col4X, tableStartY + 9.1, { align: 'center' });
    doc.text('answer', col4X, tableStartY + 11.9, { align: 'center' });
    doc.text('books', col4X, tableStartY + 14.5, { align: 'center' });

    // Col 5: Signature of the Candidates
    doc.setFontSize(8.5);
    const col5X = marginX + colW[0] + colW[1] + colW[2] + colW[3] + colW[4] / 2;
    doc.text('Signature of the Candidates', col5X, tableStartY + 9, { align: 'center' });

    // Header 2: [ 1 | 2 | 3 | 4 | 5 ]
    const h2Y = tableStartY + headerH1;
    doc.rect(marginX, h2Y, tableWidth, headerH2);
    curX = marginX;
    for (let c = 0; c < 4; c++) {
      curX += colW[c];
      doc.line(curX, h2Y, curX, h2Y + headerH2);
    }
    doc.setFont('times', 'bold');
    doc.setFontSize(8.5);
    doc.text('1', marginX + colW[0] / 2, h2Y + 3.6, { align: 'center' });
    doc.text('2', col2X, h2Y + 3.6, { align: 'center' });
    doc.text('3', col3X, h2Y + 3.6, { align: 'center' });
    doc.text('4', col4X, h2Y + 3.6, { align: 'center' });
    doc.text('5', col5X, h2Y + 3.6, { align: 'center' });

    // DATA ROWS: Exactly 24 rows
    let currentY = h2Y + headerH2;
    doc.setFont('times', 'normal');

    for (let r = 0; r < pageRows.length; r++) {
      const row = pageRows[r];
      doc.rect(marginX, currentY, tableWidth, rowH);

      // Vertical dividers
      let x = marginX;
      for (let c = 0; c < 4; c++) {
        x += colW[c];
        doc.line(x, currentY, x, currentY + rowH);
      }

      // Roll No (Col 1)
      if (row.rollNumber) {
        doc.setFont('times', 'bold');
        doc.setFontSize(8.5);
        doc.text(row.rollNumber, marginX + colW[0] / 2, currentY + 5.5, { align: 'center' });
      }

      // Pre-filled serial answer books if present
      if (row.serialAnswerBook) {
        doc.setFont('times', 'normal');
        doc.setFontSize(8);
        doc.text(row.serialAnswerBook, col2X, currentY + 5.5, { align: 'center' });
      }
      if (row.serialAddlAnswerBook) {
        doc.setFont('times', 'normal');
        doc.setFontSize(8);
        doc.text(row.serialAddlAnswerBook, col3X, currentY + 5.5, { align: 'center' });
      }
      if (row.timeHandingOver) {
        doc.setFont('times', 'normal');
        doc.setFontSize(8);
        doc.text(row.timeHandingOver, col4X, currentY + 5.5, { align: 'center' });
      }

      currentY += rowH;
    }

    // Bottom Footer: Signature of the Invigilator
    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.text('Signature of the Invigilator', 210 - marginX, currentY + 10.5, { align: 'right' });

    // Page indicator at bottom left if multi-page
    if (pages.length > 1) {
      doc.setFont('times', 'normal');
      doc.setFontSize(8.5);
      doc.text(`Page ${pageIdx + 1} of ${pages.length}`, marginX, currentY + 10.5);
    }
  });

  const safeFilename = `Exam_Attendance_Form_${config.className ? config.className.replace(/[^a-zA-Z0-9_-]/g, '_') : 'Class'}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(safeFilename);
}

/**
 * Generates structured HTML and triggers browser printing
 */
export function printAttendanceForm(
  config: AttendanceFormConfig,
  entries: AttendanceStudentEntry[]
): void {
  const sortedEntries = sortAttendanceEntries(entries);
  const pages = paginateAttendanceEntries(sortedEntries, config.rowsPerPage || ROWS_PER_PAGE);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to open the official printable attendance sheet.');
    return;
  }

  const pagesHtml = pages.map((pageRows, pageIdx) => `
    <div class="attendance-page">
      <div class="header-container">
        <div class="appendix-title">APPENDIX – A</div>
        <div class="main-title">Statement of Answer Books Issued to the Candidate in the Examination Hall</div>
        <div class="centre-title">Examination Centre – ${config.centre || 'PANCHAYAT COLLEGE, BARAGADA'}</div>
      </div>

      <div class="meta-section">
        <div class="meta-row">
          <div class="meta-item">
            <span class="meta-label">Date of Examination –</span>
            <span class="meta-val">${config.dateOfExam ? formatDateToDDMMYYYY(config.dateOfExam) : ''}</span>
          </div>
        </div>

        <div class="meta-row">
          <div class="meta-item">
            <span class="meta-label">Class -</span>
            <span class="meta-val">${config.className || ''}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Subject -</span>
            <span class="meta-val">${config.subject || ''}</span>
          </div>
          <div class="sitting-block">
            <span class="sitting-label">Sitting</span>
            <div class="sitting-options">
              <span class="sitting-opt ${config.sitting === '1st Sitting' ? 'selected' : ''}">1<sup>st</sup> Sitting</span>
              <span class="sitting-opt ${config.sitting === '2nd Sitting' ? 'selected' : ''}">2<sup>nd</sup> Sitting</span>
            </div>
          </div>
        </div>

        <div class="meta-row">
          <div class="meta-item">
            <span class="meta-label">Room No. -</span>
            <span class="meta-val">${config.roomNo || ''}</span>
          </div>
        </div>
      </div>

      <table class="attendance-table">
        <thead>
          <tr class="header-row-1">
            <th class="col-roll">Roll No.</th>
            <th class="col-main">
              Serial No. of<br />
              the Answer<br />
              books issued to<br />
              the candidates
            </th>
            <th class="col-addl">
              Serial No. of<br />
              Addl. Answer<br />
              books issued to<br />
              the candidates
            </th>
            <th class="col-time">
              Time of<br />
              handing<br />
              over the<br />
              answer<br />
              books
            </th>
            <th class="col-sig">Signature of the Candidates</th>
          </tr>
          <tr class="header-row-2">
            <th>1</th>
            <th>2</th>
            <th>3</th>
            <th>4</th>
            <th>5</th>
          </tr>
        </thead>
        <tbody>
          ${pageRows
            .map(
              (r) => `
            <tr>
              <td class="col-roll-cell">${r.rollNumber || '&nbsp;'}</td>
              <td class="col-center-cell">${r.serialAnswerBook || '&nbsp;'}</td>
              <td class="col-center-cell">${r.serialAddlAnswerBook || '&nbsp;'}</td>
              <td class="col-center-cell">${r.timeHandingOver || '&nbsp;'}</td>
              <td class="col-sig-cell">&nbsp;</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <div class="footer-section">
        ${pages.length > 1 ? `<div class="page-no">Page ${pageIdx + 1} of ${pages.length}</div>` : '<div></div>'}
        <div class="invigilator-sig">Signature of the Invigilator</div>
      </div>
    </div>
  `);

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Exam Attendance Form (Appendix - A) - Panchayat College</title>
      <meta charset="utf-8" />
      <style>
        @page {
          size: A4 portrait;
          margin: 8mm 10mm 8mm 10mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          font-family: 'Times New Roman', Times, serif;
          color: #000;
          background: #fff;
        }
        .no-print {
          padding: 12px 18px;
          background: #0f172a;
          color: #fff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: sans-serif;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .print-btn {
          background: #f59e0b;
          color: #000;
          font-weight: bold;
          padding: 8px 18px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-size: 13px;
        }
        .attendance-page {
          width: 100%;
          max-width: 190mm;
          margin: 0 auto 12mm auto;
          background: #fff;
          min-height: 274mm;
          box-sizing: border-box;
          padding: 2mm 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          page-break-after: always;
          break-after: page;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .attendance-page:last-child {
          page-break-after: auto;
          break-after: auto;
        }
        .header-container {
          text-align: center;
          margin-bottom: 6px;
        }
        .appendix-title {
          font-size: 21px;
          font-weight: bold;
          letter-spacing: 0.5px;
          margin-bottom: 3px;
        }
        .main-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 3px;
        }
        .centre-title {
          font-size: 15.5px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .meta-section {
          font-size: 14.5px;
          margin-bottom: 8px;
          line-height: 1.4;
        }
        .meta-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .meta-item {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }
        .meta-label {
          font-weight: normal;
        }
        .meta-val {
          font-weight: bold;
        }
        .sitting-block {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-right: 10px;
          font-size: 14.5px;
        }
        .sitting-label {
          font-weight: normal;
        }
        .sitting-options {
          display: flex;
          flex-direction: column;
          font-weight: normal;
          line-height: 1.25;
          font-size: 13.5px;
        }
        .sitting-opt.selected {
          font-weight: bold;
          text-decoration: underline;
        }
        table.attendance-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.2px solid #000;
          font-size: 11.5px;
          margin-top: 4px;
          margin-bottom: 4px;
          flex-grow: 1;
        }
        table.attendance-table th, table.attendance-table td {
          border: 1px solid #000;
          padding: 3px 5px;
          height: 28.5px;
        }
        .header-row-1 th {
          font-size: 11.5px;
          font-weight: bold;
          line-height: 1.15;
          text-align: center;
          vertical-align: middle;
          padding: 6px 3px;
        }
        .header-row-2 th {
          font-size: 11px;
          font-weight: bold;
          text-align: center;
          padding: 2px;
          height: 20px;
        }
        .col-roll { width: 16%; }
        .col-main { width: 18%; }
        .col-addl { width: 18%; }
        .col-time { width: 13%; }
        .col-sig { width: 35%; }
        .col-roll-cell {
          text-align: center;
          font-weight: bold;
          font-size: 11.5px;
        }
        .col-center-cell {
          text-align: center;
          font-size: 11.5px;
        }
        .col-sig-cell {
          height: 28.5px;
        }
        .footer-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 28px;
          font-size: 12px;
          font-weight: bold;
          padding-top: 8px;
        }
        .invigilator-sig {
          text-align: right;
          font-weight: bold;
        }
        .page-no {
          font-size: 10.5px;
          font-weight: normal;
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
          }
          html, body {
            width: 100%;
            margin: 0;
            padding: 0;
            background: #fff;
          }
          .no-print {
            display: none !important;
          }
          .attendance-page {
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 190mm !important;
            min-height: 275mm !important;
            padding: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .attendance-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <div>
          <strong>APPENDIX – A: Exam Attendance Sheet</strong>
          <span style="font-size: 12px; color: #cbd5e1; margin-left: 12px;">
            ${entries.length} Candidate${entries.length === 1 ? '' : 's'} &bull; ${pages.length} Page${pages.length === 1 ? '' : 's'} (Strictly 24 rows / page)
          </span>
        </div>
        <button class="print-btn" onclick="window.print()">
          Print Form (${pages.length} Page${pages.length > 1 ? 's' : ''})
        </button>
      </div>

      ${pagesHtml.join('')}
    </body>
    </html>
  `);

  printWindow.document.close();
}

/**
 * Exports CSV format of attendance sheet
 */
export function exportAttendanceFormCSV(
  config: AttendanceFormConfig,
  entries: AttendanceStudentEntry[]
): void {
  const sortedEntries = sortAttendanceEntries(entries);
  const headers = [
    'Roll No.',
    'Serial No. of Answer books issued',
    'Serial No. of Addl. Answer books issued',
    'Time of handing over',
    'Candidate Name / Reference',
  ];

  const rows = sortedEntries.map((e) => [
    `"${e.rollNumber || ''}"`,
    `"${e.serialAnswerBook || ''}"`,
    `"${e.serialAddlAnswerBook || ''}"`,
    `"${e.timeHandingOver || ''}"`,
    `"${e.name || ''}"`,
  ]);

  const metaRows = [
    `"APPENDIX – A: Statement of Answer Books Issued to Candidates"`,
    `"Examination Centre: ${config.centre || 'PANCHAYAT COLLEGE, BARAGADA'}"`,
    `"Date: ${formatDateToDDMMYYYY(config.dateOfExam) || ''}"`,
    `"Class: ${config.className || ''}"`,
    `"Subject: ${config.subject || ''}"`,
    `"Sitting: ${config.sitting || ''}"`,
    `"Room No.: ${config.roomNo || ''}"`,
    `""`,
  ];

  const csvContent = [...metaRows, headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute(
    'download',
    `Exam_Attendance_Appendix_A_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

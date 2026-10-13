// Utility functions for Sambalpur University / Department Mark Foil Generation

export interface MarkFoilStudentEntry {
  id: string;
  name?: string; // Kept in state for teacher convenience, omitted in final foil output
  rollNumber: string;
  marksInFigures: string;
  marksInWords: string;
}

export interface MarkFoilConfig {
  universityName: string;
  examinationCell: string;
  setNumber: string;
  examinationName: string;
  subject: string;
  paperName: string;
  fullMarks: string;
  courseNo: string;
  examinerName: string;
  date: string;
  totalRows: number; // e.g. 25 or 30 rows on a standard foil
  layout: 'single' | 'dual'; // Dual counterfoil side-by-side or single foil
  wordCasing: 'upper' | 'title' | 'lower';
}

const DIGIT_WORDS_UPPER: Record<string, string> = {
  '0': 'ZERO',
  '1': 'ONE',
  '2': 'TWO',
  '3': 'THREE',
  '4': 'FOUR',
  '5': 'FIVE',
  '6': 'SIX',
  '7': 'SEVEN',
  '8': 'EIGHT',
  '9': 'NINE',
};

const DIGIT_WORDS_LOWER: Record<string, string> = {
  '0': 'zero',
  '1': 'one',
  '2': 'two',
  '3': 'three',
  '4': 'four',
  '5': 'five',
  '6': 'six',
  '7': 'seven',
  '8': 'eight',
  '9': 'nine',
};

const DIGIT_WORDS_TITLE: Record<string, string> = {
  '0': 'Zero',
  '1': 'One',
  '2': 'Two',
  '3': 'Three',
  '4': 'Four',
  '5': 'Five',
  '6': 'Six',
  '7': 'Seven',
  '8': 'Eight',
  '9': 'Nine',
};

/**
 * Converts a numerical mark string to digit-by-digit words representation
 * e.g. "63" -> "SIX THREE" (or "six three")
 *      "15" -> "ONE FIVE"
 *      "64" -> "SIX FOUR"
 *      "08" -> "ZERO EIGHT"
 *      "AB" -> "ABSENT"
 */
export function marksToWordsDigitByDigit(
  marks: string | number,
  casing: 'upper' | 'title' | 'lower' = 'upper'
): string {
  const trimmed = String(marks ?? '').trim();
  if (!trimmed) return '';

  const upper = trimmed.toUpperCase();
  if (upper === 'AB' || upper === 'ABS' || upper === 'ABSENT') {
    if (casing === 'lower') return 'absent';
    if (casing === 'title') return 'Absent';
    return 'ABSENT';
  }

  const lookup =
    casing === 'lower'
      ? DIGIT_WORDS_LOWER
      : casing === 'title'
      ? DIGIT_WORDS_TITLE
      : DIGIT_WORDS_UPPER;

  const pointWord = casing === 'lower' ? 'point' : casing === 'title' ? 'Point' : 'POINT';

  const parts: string[] = [];
  for (const ch of trimmed) {
    if (lookup[ch]) {
      parts.push(lookup[ch]);
    } else if (ch === '.') {
      parts.push(pointWord);
    } else if (ch === ' ' || ch === '-') {
      // skip
    } else {
      parts.push(casing === 'lower' ? ch.toLowerCase() : ch.toUpperCase());
    }
  }

  return parts.join(' ');
}

/**
 * Generates an authentic Microsoft Word (.doc) document that opens directly
 * in MS Word with formatted tables, university headers, roll numbers, and marks in words.
 * ONLY contains Roll/Code Number, In Figures, In Words (no student names) as required.
 */
export function generateMarkFoilWordDocument(
  config: MarkFoilConfig,
  entries: MarkFoilStudentEntry[]
): void {
  const minRows = Math.max(config.totalRows || 25, entries.length);
  const rowsHtml: string[] = [];

  for (let i = 0; i < minRows; i++) {
    const entry = entries[i];
    const roll = entry ? entry.rollNumber : '&nbsp;';
    const figures = entry && entry.marksInFigures ? entry.marksInFigures : '&nbsp;';
    const words = entry && entry.marksInWords ? entry.marksInWords : '&nbsp;';

    rowsHtml.push(`
      <tr style="height: 24px;">
        <td style="border: 1px solid #000000; padding: 4px 8px; font-family: 'Times New Roman', serif; font-size: 11pt; text-align: left;">
          ${roll}
        </td>
        <td style="border: 1px solid #000000; padding: 4px 8px; font-family: 'Times New Roman', serif; font-size: 11pt; text-align: center; width: 90px;">
          ${figures}
        </td>
        <td style="border: 1px solid #000000; padding: 4px 8px; font-family: 'Times New Roman', serif; font-size: 11pt; text-align: left; width: 220px;">
          ${words}
        </td>
      </tr>
    `);
  }

  const singleFoilHtml = `
    <div style="width: 100%; margin-bottom: 30px; font-family: 'Times New Roman', serif;">
      <!-- University Header -->
      <div style="text-align: center; margin-bottom: 12px;">
        <div style="font-size: 13pt; font-weight: bold; letter-spacing: 0.5pt; text-transform: uppercase;">
          ${config.examinationCell || 'PRIVATE EXAMINATION CELL'}
        </div>
        <div style="font-size: 15pt; font-weight: bold; letter-spacing: 1pt; text-transform: uppercase;">
          ${config.universityName || 'SAMBALPUR UNIVERSITY'}
        </div>
      </div>

      <!-- Set & Metadata info -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11pt; font-family: 'Times New Roman', serif;">
        <tr>
          <td style="padding: 2px 0; font-weight: bold; width: 50%;">
            ${config.setNumber || 'Set. 01'}
          </td>
          <td style="padding: 2px 0; text-align: right; width: 50%;">
            &nbsp;
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 2px 0;">
            <strong>Examination:</strong> <u>&nbsp;${config.examinationName || 'PG 2nd semester Private 2026'}&nbsp;</u>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 2px 0;">
            <strong>Subject:</strong> <u>&nbsp;${config.subject || 'Mathematics'}&nbsp;</u>
          </td>
        </tr>
        <tr>
          <td style="padding: 2px 0;">
            <strong>Paper:</strong> <u>&nbsp;${config.paperName || 'COMBINATORICS'}&nbsp;</u>
          </td>
          <td style="padding: 2px 0; text-align: right;">
            <strong>Full Marks:</strong> <u>&nbsp;${config.fullMarks || '80'}&nbsp;</u>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 2px 0;">
            <strong>Course No.:</strong> <u>&nbsp;${config.courseNo || 'MAT-544'}&nbsp;</u>
          </td>
        </tr>
      </table>

      <!-- Confidential Marks Table -->
      <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000000; margin-bottom: 25px;">
        <thead>
          <tr style="background-color: #f8f8f8;">
            <th rowspan="2" style="border: 1px solid #000000; padding: 6px; font-family: 'Times New Roman', serif; font-size: 11pt; font-weight: bold; text-align: center; vertical-align: middle;">
              Roll/Code Number
            </th>
            <th colspan="2" style="border: 1px solid #000000; padding: 6px; font-family: 'Times New Roman', serif; font-size: 11pt; font-weight: bold; text-align: center;">
              Marks obtained
            </th>
          </tr>
          <tr style="background-color: #f8f8f8;">
            <th style="border: 1px solid #000000; padding: 5px; font-family: 'Times New Roman', serif; font-size: 10pt; font-weight: bold; text-align: center; width: 90px;">
              In Figures
            </th>
            <th style="border: 1px solid #000000; padding: 5px; font-family: 'Times New Roman', serif; font-size: 10pt; font-weight: bold; text-align: center; width: 220px;">
              In Words
            </th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml.join('')}
        </tbody>
      </table>

      <!-- Signatures Footer -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 25px; font-size: 11pt; font-family: 'Times New Roman', serif;">
        <tr>
          <td style="width: 60%; vertical-align: top;">
            <div style="font-weight: bold; margin-bottom: 12px;">Signature of the Examiner</div>
            <div>Date: ${config.date || '........................................'}</div>
            ${config.examinerName ? `<div style="font-size: 10pt; color: #333333; margin-top: 4px;">(${config.examinerName})</div>` : ''}
          </td>
          <td style="width: 40%; vertical-align: top; text-align: right;">
            <div style="font-weight: bold; margin-bottom: 12px;">Chief Examiner</div>
            <div>Date: ........................................</div>
          </td>
        </tr>
      </table>
    </div>
  `;

  const wordDocumentContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${config.universityName} Mark Foil - ${config.courseNo}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: A4 portrait;
          margin: 1.5cm 1.5cm 1.5cm 1.5cm;
          mso-page-orientation: portrait;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 11pt;
          line-height: 1.2;
          color: #000;
          background: #fff;
        }
        table {
          mso-displayed-decimal-separator: ".";
          mso-displayed-thousand-separator: ",";
        }
      </style>
    </head>
    <body>
      ${singleFoilHtml}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + wordDocumentContent], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeFilename = `${config.universityName.replace(/\s+/g, '_')}_Mark_Foil_${(config.courseNo || 'EXAM').replace(/\s+/g, '_')}_${(config.setNumber || 'Set01').replace(/\s+/g, '_')}.doc`;
  link.setAttribute('download', safeFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers sharp browser print window / Save as PDF matching the exact uploaded image format
 */
export function printMarkFoil(
  config: MarkFoilConfig,
  entries: MarkFoilStudentEntry[]
): void {
  const minRows = Math.max(config.totalRows || 25, entries.length);

  const generateFoilTableHtml = (foilTitleSuffix: string = '') => {
    const rowsHtml: string[] = [];
    const filledCount = entries.length;

    for (let i = 0; i < minRows; i++) {
      const entry = entries[i];
      const roll = entry ? entry.rollNumber : '';
      const figures = entry && entry.marksInFigures ? entry.marksInFigures : '';
      const words = entry && entry.marksInWords ? entry.marksInWords : '';

      rowsHtml.push(`
        <tr>
          <td class="col-roll">${roll}</td>
          <td class="col-figures">${figures}</td>
          <td class="col-words">${words}</td>
        </tr>
      `);
    }

    return `
      <div class="foil-sheet">
        <!-- University Header -->
        <div class="foil-header">
          <div class="header-cell-title">${config.examinationCell || 'PRIVATE EXAMINATION CELL'}</div>
          <div class="header-univ-title">${config.universityName || 'SAMBALPUR UNIVERSITY'}</div>
        </div>

        <!-- Meta Grid -->
        <div class="foil-meta">
          <div class="meta-row meta-row-top">
            <span class="set-label">${config.setNumber || 'Set. 01'}${foilTitleSuffix}</span>
          </div>
          <div class="meta-row">
            <span class="meta-field">Examination:</span>
            <span class="meta-value">${config.examinationName || 'PG 2nd semester Private 2026'}</span>
          </div>
          <div class="meta-row">
            <span class="meta-field">Subject:</span>
            <span class="meta-value">${config.subject || 'Mathematics'}</span>
          </div>
          <div class="meta-row split">
            <div>
              <span class="meta-field">Paper:</span>
              <span class="meta-value">${config.paperName || 'COMBINATORICS'}</span>
            </div>
            <div style="text-align: right;">
              <span class="meta-field">Full Marks:</span>
              <span class="meta-value">${config.fullMarks || '80'}</span>
            </div>
          </div>
          <div class="meta-row">
            <span class="meta-field">Course No.</span>
            <span class="meta-value">${config.courseNo || 'MAT-544'}</span>
          </div>
        </div>

        <!-- Table -->
        <div class="table-container">
          <table class="marks-table">
            <thead>
              <tr>
                <th rowspan="2" class="th-roll">Roll/Code<br>Number</th>
                <th colspan="2" class="th-marks">Marks obtained</th>
              </tr>
              <tr>
                <th class="th-figures">In<br>Figures</th>
                <th class="th-words">In Words</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml.join('')}
            </tbody>
          </table>
          ${
            filledCount < minRows
              ? `<svg class="diagonal-cancel-line" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <line x1="5" y1="${(filledCount / minRows) * 85 + 12}" x2="95" y2="98" stroke="#dc2626" stroke-width="0.8" />
                </svg>`
              : ''
          }
        </div>

        <!-- Signatures -->
        <div class="foil-footer">
          <div class="sig-left">
            <div class="sig-title">Signature of the Examiner</div>
            <div class="sig-date">Date................................</div>
            ${config.examinerName ? `<div class="sig-name">(${config.examinerName})</div>` : ''}
          </div>
          <div class="sig-right">
            <div class="sig-title">Chief Examiner</div>
            <div class="sig-date">Date................................</div>
          </div>
        </div>
      </div>
    `;
  };

  const isDual = config.layout === 'dual';

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to view and print the Mark Foil.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${config.universityName} Confidential Mark Foil - ${config.courseNo}</title>
      <style>
        @page {
          size: ${isDual ? 'A4 landscape' : 'A4 portrait'};
          margin: 10mm 12mm 10mm 12mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body {
          margin: 0;
          padding: ${isDual ? '10px' : '20px'};
          font-family: 'Times New Roman', Times, serif;
          color: #000000;
          background: #ffffff;
        }
        .foils-container {
          display: flex;
          gap: 20px;
          justify-content: ${isDual ? 'space-between' : 'center'};
        }
        .foil-sheet {
          flex: 1;
          max-width: ${isDual ? '48%' : '100%'};
          border: ${isDual ? '1px dashed #94a3b8' : 'none'};
          padding: ${isDual ? '12px' : '0'};
          position: relative;
        }
        .foil-header {
          text-align: center;
          margin-bottom: 8px;
        }
        .header-cell-title {
          font-size: 11pt;
          font-weight: bold;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .header-univ-title {
          font-size: 13pt;
          font-weight: bold;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-top: 1px;
        }
        .foil-meta {
          font-size: 10pt;
          margin-bottom: 8px;
          line-height: 1.4;
        }
        .meta-row {
          margin-bottom: 3px;
        }
        .meta-row-top {
          font-weight: bold;
          font-size: 10.5pt;
        }
        .meta-row.split {
          display: flex;
          justify-content: space-between;
        }
        .meta-field {
          font-weight: bold;
          margin-right: 4px;
        }
        .meta-value {
          border-bottom: 1px solid #000;
          padding-bottom: 0px;
          padding-left: 3px;
          padding-right: 3px;
        }
        .table-container {
          position: relative;
        }
        .diagonal-cancel-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        table.marks-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid #000000;
          font-size: 9.5pt;
        }
        table.marks-table th, table.marks-table td {
          border: 1px solid #000000;
          padding: 2.5px 5px;
        }
        table.marks-table th {
          font-weight: bold;
          text-align: center;
          vertical-align: middle;
        }
        .th-roll {
          width: 38%;
        }
        .th-marks {
          width: 62%;
        }
        .th-figures {
          width: 22%;
        }
        .th-words {
          width: 40%;
        }
        .col-roll {
          text-align: left;
          font-family: 'Times New Roman', serif;
          font-size: 9.5pt;
          letter-spacing: 0.3px;
          height: 22px;
        }
        .col-figures {
          text-align: center;
          font-weight: bold;
          font-size: 10pt;
          width: 22%;
        }
        .col-words {
          text-align: left;
          font-size: 9pt;
          text-transform: uppercase;
          width: 40%;
        }
        .foil-footer {
          margin-top: 20px;
          display: flex;
          justify-content: space-between;
          font-size: 9.5pt;
        }
        .sig-title {
          font-weight: bold;
          margin-bottom: 8px;
        }
        .sig-date {
          color: #111;
        }
        .sig-name {
          font-size: 8.5pt;
          color: #444;
          margin-top: 3px;
        }
        @media print {
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="background: #0f172a; color: #fff; padding: 12px 18px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; border-radius: 6px; font-family: sans-serif;">
        <div>
          <strong>Sambalpur University Mark Foil Print Preview</strong>
          <span style="font-size: 12px; color: #94a3b8; margin-left: 10px;">Select Destination: "Save as PDF" or your printer</span>
        </div>
        <button onclick="window.print()" style="background: #f59e0b; color: #000; border: none; font-weight: bold; padding: 6px 16px; border-radius: 4px; cursor: pointer; font-size: 13px;">
          🖨️ Print / Save as PDF
        </button>
      </div>

      <div class="foils-container">
        ${generateFoilTableHtml('')}
        ${isDual ? generateFoilTableHtml(' (Counterfoil)') : ''}
      </div>
    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
}

/**
 * Exports CSV with Roll/Code Number, In Figures, In Words
 */
export function exportMarkFoilCSV(
  config: MarkFoilConfig,
  entries: MarkFoilStudentEntry[]
): void {
  const headers = ['Roll/Code Number', 'Marks In Figures', 'Marks In Words'];
  const rows = entries.map((e) => [
    `"${e.rollNumber}"`,
    `"${e.marksInFigures || ''}"`,
    `"${e.marksInWords || ''}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute(
    'download',
    `Mark_Foil_${config.courseNo || 'EXAM'}_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Utility functions for Sambalpur University / Department Mark Foil Generation
// Guaranteed single-page A4 output matching the official dual-column University Mark Foil format
// Calibrated with increased cell height and enlarged font sizes for optimal legibility & secrecy compliance
import { jsPDF } from 'jspdf';

export interface MarkFoilStudentEntry {
  id: string;
  name?: string; // Kept in state for teacher convenience, omitted in final confidential foil output
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
  totalRows: number; // e.g. 25 rows per column (exact match to photo)
  layout: 'dual' | 'single';
  foilMode?: 'twin' | 'continuous' | 'blank';
  wordCasing: 'upper' | 'title' | 'lower';
  cellHeightPreset?: 'standard' | 'generous' | 'extra';
  fontSizePreset?: 'standard' | 'large' | 'extralarge';
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
 * e.g. "63" -> "SIX THREE"
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
 * Generates an authentic downloadable vector PDF (.pdf) strictly fitting onto a
 * SINGLE A4 PORTRAIT PAGE with increased cell height and enlarged font sizes:
 * - A4 Portrait sheet with two identical vertical slips side by side (Left & Right)
 * - Increased cell height (8.95mm - 9.25mm per row for 25 rows) for generous writing & readability space
 * - Enlarged typography: 11.5pt headers, 11-13pt table entries, 11.5pt signatures
 * - Hard zero-overflow guarantee: strictly 1 page
 */
export function generateMarkFoilPDF(
  config: MarkFoilConfig,
  entries: MarkFoilStudentEntry[],
  options?: {
    mode?: 'twin' | 'continuous' | 'blank';
    totalRows?: number;
    cellHeightPreset?: 'standard' | 'generous' | 'extra';
    fontSizePreset?: 'standard' | 'large' | 'extralarge';
  }
): void {
  const mode = options?.mode || config.foilMode || 'twin';
  const totalRows = options?.totalRows || config.totalRows || 25;
  const cellHeightPreset = options?.cellHeightPreset || config.cellHeightPreset || 'generous';
  const fontSizePreset = options?.fontSizePreset || config.fontSizePreset || 'large';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const colWidth = 91;
  const leftX = 9;
  const rightX = 110;
  const topY = 6.5; // 6.5mm top margin maximizes available height for tall cells

  // Calibrated available height for table data rows while guaranteeing single page (A4 = 297mm)
  // Total height: topY (6.5) + header (28.5) + table headers (11.5) + data rows + footer (14.5) + margin (12) = 297
  const baseAvailableH = cellHeightPreset === 'extra' ? 232 : cellHeightPreset === 'standard' ? 212 : 224;
  const th1Height = 6.0;
  const th2Height = 5.5;
  const rowHeight = Math.min(11.5, Math.max(7.2, (baseAvailableH - (th1Height + th2Height)) / totalRows));
  const totalTableH = th1Height + th2Height + totalRows * rowHeight;

  // Enlarged Typography sizes in pt
  const fontMeta = fontSizePreset === 'extralarge' ? 12 : fontSizePreset === 'standard' ? 10.5 : 11.5;
  const fontTh1 = fontSizePreset === 'extralarge' ? 11 : fontSizePreset === 'standard' ? 9.5 : 10.5;
  const fontTh2 = fontSizePreset === 'extralarge' ? 10 : fontSizePreset === 'standard' ? 8.5 : 9.5;
  const fontRoll = fontSizePreset === 'extralarge' ? 11.5 : fontSizePreset === 'standard' ? 10 : 11;
  const fontFigures = fontSizePreset === 'extralarge' ? 14 : fontSizePreset === 'standard' ? 11.5 : 13;
  const fontWords = fontSizePreset === 'extralarge' ? 11 : fontSizePreset === 'standard' ? 9.5 : 10.5;
  const fontFooter = fontSizePreset === 'extralarge' ? 12 : fontSizePreset === 'standard' ? 10.5 : 11.5;

  const colRollW = 36;
  const colFigW = 20;
  const colWordW = 35;

  // Decide candidate slice for each column based on mode
  const getEntriesForColumn = (colIndex: number): (MarkFoilStudentEntry | undefined)[] => {
    if (mode === 'blank') {
      return [];
    }
    if (mode === 'continuous') {
      const start = colIndex * totalRows;
      return entries.slice(start, start + totalRows);
    }
    // 'twin' mode: both left & right show the same cohort (first totalRows)
    return entries.slice(0, totalRows);
  };

  const columns = [
    { x: leftX, index: 0, label: 'Foil' },
    { x: rightX, index: 1, label: 'Counterfoil' },
  ];

  columns.forEach(({ x, index }) => {
    const colEntries = getEntriesForColumn(index);

    // 1. Header Metadata Section (Enlarged font size: 11.5pt Times)
    doc.setFont('times', 'normal');
    doc.setFontSize(fontMeta);

    // Set / Year (top right of column)
    const setYearText =
      config.setNumber && config.date
        ? `Set / Year ${config.setNumber} / ${config.date.slice(-4) || '2026'}`
        : 'Set / Year..................';
    doc.text(setYearText, x + colWidth - 1, topY + 4, { align: 'right' });

    // Examination
    const examText = config.examinationName
      ? `EXAMINATION  ${config.examinationName}`
      : 'EXAMINATION ..............................................';
    doc.text(examText, x, topY + 9);

    // Subject
    const subjectText = config.subject
      ? `Subject  ${config.subject}`
      : 'Subject ....................................................';
    doc.text(subjectText, x, topY + 14);

    // Paper & Full Marks
    const paperVal = config.paperName || '.............................';
    const marksVal = config.fullMarks || '...............';
    const paperFullMarksText = `Paper  ${paperVal}   Full Marks  ${marksVal}`;
    doc.text(paperFullMarksText, x, topY + 19);

    // Course No.
    doc.setFont('times', 'bold');
    const courseNoText = config.courseNo
      ? `Course No.  ${config.courseNo}`
      : 'Course No. .................................................';
    doc.text(courseNoText, x, topY + 24);

    // Solid horizontal line below Course No.
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(x, topY + 26.5, x + colWidth, topY + 26.5);

    // 2. Marks Table (Enlarged headers and increased cell height)
    const tableY = topY + 28.5;

    // Outer table rectangle
    doc.setLineWidth(0.35);
    doc.rect(x, tableY, colWidth, totalTableH);

    // Table Header horizontal lines
    doc.line(x, tableY + th1Height, x + colWidth, tableY + th1Height);
    doc.line(x, tableY + th1Height + th2Height, x + colWidth, tableY + th1Height + th2Height);

    // Table Header vertical lines
    // Vertical line separating Roll/Code Number from Marks Obtained
    doc.line(x + colRollW, tableY, x + colRollW, tableY + totalTableH);
    // Vertical line separating In figures from In Words
    doc.line(x + colRollW + colFigW, tableY + th1Height, x + colRollW + colFigW, tableY + totalTableH);

    // Table Header text (Enlarged to 10.5pt and 9.5pt bold)
    doc.setFont('times', 'bold');
    doc.setFontSize(fontTh1);
    doc.text('Roll / Code Number', x + colRollW / 2, tableY + 4.2, { align: 'center' });
    doc.text('Marks Obtained', x + colRollW + (colFigW + colWordW) / 2, tableY + 4.2, { align: 'center' });

    doc.setFontSize(fontTh2);
    doc.text('In figures', x + colRollW + colFigW / 2, tableY + th1Height + 4.0, { align: 'center' });
    doc.text('In Words', x + colRollW + colFigW + colWordW / 2, tableY + th1Height + 4.0, { align: 'center' });

    // Table Data Rows with increased height and enlarged typography
    for (let r = 0; r < totalRows; r++) {
      const curY = tableY + th1Height + th2Height + r * rowHeight;

      // Horizontal border for this row
      doc.setLineWidth(0.2);
      doc.line(x, curY + rowHeight, x + colWidth, curY + rowHeight);

      // Populate student data if present with enlarged fonts and vertically centered positioning
      const entry = colEntries[r];
      if (entry) {
        // Roll number (enlarged font size: 11pt)
        doc.setFont('times', 'normal');
        doc.setFontSize(fontRoll);
        doc.text(String(entry.rollNumber || ''), x + 2, curY + (rowHeight * 0.67));

        // In figures (enlarged font size: 13pt bold)
        doc.setFont('times', 'bold');
        doc.setFontSize(fontFigures);
        doc.text(String(entry.marksInFigures || ''), x + colRollW + colFigW / 2, curY + (rowHeight * 0.68), { align: 'center' });

        // In Words (enlarged font size: 10.5pt)
        doc.setFont('times', 'normal');
        const words = String(entry.marksInWords || '');
        if (words) {
          doc.setFontSize(fontWords);
          const textWidth = doc.getTextWidth(words);
          const maxAllowedW = colWordW - 3;
          if (textWidth > maxAllowedW) {
            // Auto scale font size down smoothly so it never overflows or clips
            const scaledSize = Math.max(8.5, fontWords * (maxAllowedW / textWidth));
            doc.setFontSize(scaledSize);
          }
          doc.text(words, x + colRollW + colFigW + 2, curY + (rowHeight * 0.67));
        }
      }
    }

    // 3. Footer Section below table (Enlarged font size: 11.5pt)
    const footerY = tableY + totalTableH + 5.0;
    doc.setFont('times', 'normal');
    doc.setFontSize(fontFooter);
    doc.text('Signature of the Examiner', x, footerY);

    const dateStr = config.date
      ? `Date  ${config.date}`
      : 'Date .................................';
    doc.text(dateStr, x, footerY + 5.0);

    if (config.examinerName) {
      doc.setFontSize(Math.max(9, fontFooter - 1.5));
      doc.text(`(${config.examinerName})`, x, footerY + 9.5);
    }
  });

  // Central dashed cut guideline between the two slips (stops cleanly above footer)
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(105, 6.5, 105, topY + 28.5 + totalTableH + 12);

  // STRICT SINGLE PAGE SAFEGUARD: Remove any accidental page overflow
  while (doc.getNumberOfPages() > 1) {
    doc.deletePage(doc.getNumberOfPages());
  }

  const safeFilename =
    mode === 'blank'
      ? `Blank_Mark_Foil_${(config.courseNo || 'EXAM').replace(/\s+/g, '_')}.pdf`
      : `Mark_Foil_${(config.courseNo || 'EXAM').replace(/\s+/g, '_')}_${(config.setNumber || 'Set01').replace(/\s+/g, '_')}.pdf`;

  doc.save(safeFilename);
}

/**
 * Generates an authentic Microsoft Word (.doc) document with enlarged cell height
 * and enlarged fonts strictly configured to fit on a SINGLE PAGE WITHOUT SPILLOVER.
 */
export function generateMarkFoilWordDocument(
  config: MarkFoilConfig,
  entries: MarkFoilStudentEntry[],
  options?: {
    mode?: 'twin' | 'continuous' | 'blank';
    totalRows?: number;
    cellHeightPreset?: 'standard' | 'generous' | 'extra';
    fontSizePreset?: 'standard' | 'large' | 'extralarge';
  }
): void {
  const mode = options?.mode || config.foilMode || 'twin';
  const totalRows = options?.totalRows || config.totalRows || 25;
  const cellHeightPreset = options?.cellHeightPreset || config.cellHeightPreset || 'generous';
  const fontSizePreset = options?.fontSizePreset || config.fontSizePreset || 'large';

  // Calibrate generous row height in pt while guaranteeing single page in MS Word
  // Available height in Word on A4 (841.9pt) with 12pt top/bottom margins is ~818pt.
  // 25 rows * 25pt = 625pt + 140pt header/footer = 765pt < 818pt (fits strictly on page 1 of 1).
  const baseTargetPt = cellHeightPreset === 'extra' ? 640 : cellHeightPreset === 'standard' ? 570 : 625;
  const rowPt = Math.max(18, Math.min(30, Math.floor(baseTargetPt / totalRows)));

  const fontMeta = fontSizePreset === 'extralarge' ? '12pt' : fontSizePreset === 'standard' ? '10.5pt' : '11.5pt';
  const fontLineHeight = fontSizePreset === 'extralarge' ? '14.5pt' : fontSizePreset === 'standard' ? '13pt' : '14pt';
  const fontTh1 = fontSizePreset === 'extralarge' ? '11pt' : fontSizePreset === 'standard' ? '9.5pt' : '10.5pt';
  const fontTh2 = fontSizePreset === 'extralarge' ? '10pt' : fontSizePreset === 'standard' ? '8.5pt' : '9.5pt';
  const fontRoll = fontSizePreset === 'extralarge' ? '11.5pt' : fontSizePreset === 'standard' ? '10pt' : '11pt';
  const fontFigures = fontSizePreset === 'extralarge' ? '14pt' : fontSizePreset === 'standard' ? '11.5pt' : '13pt';
  const fontWords = fontSizePreset === 'extralarge' ? '11pt' : fontSizePreset === 'standard' ? '9.5pt' : '10.5pt';
  const fontFooter = fontSizePreset === 'extralarge' ? '12pt' : fontSizePreset === 'standard' ? '10.5pt' : '11.5pt';

  const getEntriesForColumn = (colIndex: number): (MarkFoilStudentEntry | undefined)[] => {
    if (mode === 'blank') return [];
    if (mode === 'continuous') {
      const start = colIndex * totalRows;
      return entries.slice(start, start + totalRows);
    }
    return entries.slice(0, totalRows);
  };

  const renderSingleSlipHtml = (colIndex: number): string => {
    const colEntries = getEntriesForColumn(colIndex);
    const rowsHtml: string[] = [];

    for (let r = 0; r < totalRows; r++) {
      const entry = colEntries[r];
      const roll = entry ? entry.rollNumber : '&nbsp;';
      const figures = entry && entry.marksInFigures ? entry.marksInFigures : '&nbsp;';
      const words = entry && entry.marksInWords ? entry.marksInWords : '&nbsp;';

      rowsHtml.push(`
        <tr style="height: ${rowPt}pt; mso-height-rule: exactly; page-break-inside: avoid;">
          <td style="border: 1pt solid #000000; padding: 3pt 5pt; font-family: 'Times New Roman', serif; font-size: ${fontRoll}; font-weight: 500; text-align: left; width: 38%; vertical-align: middle; mso-line-height-rule: exactly; line-height: 13pt;">
            ${roll}
          </td>
          <td style="border: 1pt solid #000000; padding: 3pt 4pt; font-family: 'Times New Roman', serif; font-size: ${fontFigures}; font-weight: bold; text-align: center; width: 22%; vertical-align: middle; mso-line-height-rule: exactly; line-height: 14pt;">
            ${figures}
          </td>
          <td style="border: 1pt solid #000000; padding: 3pt 5pt; font-family: 'Times New Roman', serif; font-size: ${fontWords}; font-weight: 500; text-align: left; width: 40%; text-transform: uppercase; vertical-align: middle; mso-line-height-rule: exactly; line-height: 12pt;">
            ${words}
          </td>
        </tr>
      `);
    }

    const setYearText =
      config.setNumber && config.date
        ? `Set / Year ${config.setNumber} / ${config.date.slice(-4) || '2026'}`
        : 'Set / Year..................';

    const examText = config.examinationName
      ? `EXAMINATION  ${config.examinationName}`
      : 'EXAMINATION ..............................................';

    const subjectText = config.subject
      ? `Subject  ${config.subject}`
      : 'Subject ....................................................';

    const paperVal = config.paperName || '.............................';
    const marksVal = config.fullMarks || '...............';
    const paperMarksText = `Paper  ${paperVal} &nbsp;&nbsp;&nbsp;&nbsp; Full Marks  ${marksVal}`;

    const courseNoText = config.courseNo
      ? `<strong>Course No.  ${config.courseNo}</strong>`
      : 'Course No. .................................................';

    const dateStr = config.date
      ? `Date  ${config.date}`
      : 'Date .................................';

    return `
      <div style="font-family: 'Times New Roman', Times, serif; color: #000000; margin: 0; padding: 0;">
        <!-- Header with enlarged font size -->
        <div style="text-align: right; font-size: ${fontMeta}; margin-bottom: 2pt; mso-line-height-rule: exactly; line-height: ${fontLineHeight};">
          ${setYearText}
        </div>
        <div style="font-size: ${fontMeta}; margin-bottom: 2pt; mso-line-height-rule: exactly; line-height: ${fontLineHeight};">
          ${examText}
        </div>
        <div style="font-size: ${fontMeta}; margin-bottom: 2pt; mso-line-height-rule: exactly; line-height: ${fontLineHeight};">
          ${subjectText}
        </div>
        <div style="font-size: ${fontMeta}; margin-bottom: 2pt; mso-line-height-rule: exactly; line-height: ${fontLineHeight};">
          ${paperMarksText}
        </div>
        <div style="font-size: ${fontMeta}; margin-bottom: 3.5pt; mso-line-height-rule: exactly; line-height: ${fontLineHeight};">
          ${courseNoText}
        </div>

        <!-- Solid rule under course no -->
        <div style="border-bottom: 1.5pt solid #000000; margin-bottom: 3.5pt; width: 100%; height: 1pt;"></div>

        <!-- Table with increased cell heights and enlarged fonts -->
        <table style="width: 100%; border-collapse: collapse; border: 1.5pt solid #000000; margin-bottom: 5pt; table-layout: fixed; page-break-inside: avoid;">
          <thead>
            <tr style="height: 18pt; mso-height-rule: exactly; page-break-inside: avoid;">
              <th rowspan="2" style="border: 1pt solid #000000; padding: 2.5pt; font-family: 'Times New Roman', serif; font-size: ${fontTh1}; font-weight: bold; text-align: center; vertical-align: middle; width: 38%; mso-line-height-rule: exactly; line-height: 12pt;">
                Roll / Code Number
              </th>
              <th colspan="2" style="border: 1pt solid #000000; padding: 2.5pt; font-family: 'Times New Roman', serif; font-size: ${fontTh1}; font-weight: bold; text-align: center; width: 62%; mso-line-height-rule: exactly; line-height: 12pt;">
                Marks Obtained
              </th>
            </tr>
            <tr style="height: 16pt; mso-height-rule: exactly; page-break-inside: avoid;">
              <th style="border: 1pt solid #000000; padding: 2pt; font-family: 'Times New Roman', serif; font-size: ${fontTh2}; font-weight: bold; text-align: center; width: 22%; mso-line-height-rule: exactly; line-height: 11pt;">
                In figures
              </th>
              <th style="border: 1pt solid #000000; padding: 2pt; font-family: 'Times New Roman', serif; font-size: ${fontTh2}; font-weight: bold; text-align: center; width: 40%; mso-line-height-rule: exactly; line-height: 11pt;">
                In Words
              </th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml.join('')}
          </tbody>
        </table>

        <!-- Footer with enlarged font size -->
        <div style="font-size: ${fontFooter}; margin-top: 4pt; mso-line-height-rule: exactly; line-height: 15pt;">
          <div>Signature of the Examiner</div>
          <div>${dateStr}</div>
          ${config.examinerName ? `<div style="font-size: 10pt; color: #444;">(${config.examinerName})</div>` : ''}
        </div>
      </div>
    `;
  };

  const wordDocumentContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Mark Foil - ${config.courseNo}</title>
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
        @page Section1 {
          size: 595.3pt 841.9pt;
          margin: 12pt 16pt 10pt 16pt;
          mso-header-margin: 0pt;
          mso-footer-margin: 0pt;
          mso-paper-source: 0;
        }
        div.Section1 {
          page: Section1;
          mso-pagination: none;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 11pt;
          line-height: 1.15;
          color: #000;
          background: #fff;
          margin: 0;
          padding: 0;
        }
        table {
          mso-displayed-decimal-separator: ".";
          mso-displayed-thousand-separator: ",";
          page-break-inside: avoid;
        }
        tr {
          page-break-inside: avoid;
        }
        p, div {
          margin: 0;
          padding: 0;
        }
      </style>
    </head>
    <body>
      <div class="Section1">
        <table style="width: 100%; border-collapse: collapse; border: none; table-layout: fixed; page-break-inside: avoid;">
          <tr>
            <td style="width: 48%; vertical-align: top; padding-right: 10pt;">
              ${renderSingleSlipHtml(0)}
            </td>
            <td style="width: 4%; border-left: 1pt dashed #999999; vertical-align: top;">&nbsp;</td>
            <td style="width: 48%; vertical-align: top; padding-left: 10pt;">
              ${renderSingleSlipHtml(1)}
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + wordDocumentContent], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeFilename =
    mode === 'blank'
      ? `Blank_Mark_Foil_${(config.courseNo || 'EXAM').replace(/\s+/g, '_')}.doc`
      : `Mark_Foil_${(config.courseNo || 'EXAM').replace(/\s+/g, '_')}_${(config.setNumber || 'Set01').replace(/\s+/g, '_')}.doc`;

  link.setAttribute('download', safeFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers sharp browser print window / Save as PDF strictly fitting onto a
 * SINGLE A4 PORTRAIT PAGE with increased cell height and enlarged font sizes
 */
export function printMarkFoil(
  config: MarkFoilConfig,
  entries: MarkFoilStudentEntry[],
  options?: {
    mode?: 'twin' | 'continuous' | 'blank';
    totalRows?: number;
    cellHeightPreset?: 'standard' | 'generous' | 'extra';
    fontSizePreset?: 'standard' | 'large' | 'extralarge';
  }
): void {
  const mode = options?.mode || config.foilMode || 'twin';
  const totalRows = options?.totalRows || config.totalRows || 25;
  const cellHeightPreset = options?.cellHeightPreset || config.cellHeightPreset || 'generous';
  const fontSizePreset = options?.fontSizePreset || config.fontSizePreset || 'large';

  // Calibrate generous row height in px (e.g. 31px for 25 rows) while strictly preventing 2nd page printing
  const baseTargetPx = cellHeightPreset === 'extra' ? 790 : cellHeightPreset === 'standard' ? 700 : 765;
  const rowPx = Math.max(24, Math.min(38, Math.floor(baseTargetPx / totalRows)));

  const fontMeta = fontSizePreset === 'extralarge' ? '12pt' : fontSizePreset === 'standard' ? '10.5pt' : '11.5pt';
  const fontTh1 = fontSizePreset === 'extralarge' ? '11pt' : fontSizePreset === 'standard' ? '9.5pt' : '10.5pt';
  const fontTh2 = fontSizePreset === 'extralarge' ? '10pt' : fontSizePreset === 'standard' ? '8.5pt' : '9.5pt';
  const fontRoll = fontSizePreset === 'extralarge' ? '11.5pt' : fontSizePreset === 'standard' ? '10pt' : '11pt';
  const fontFigures = fontSizePreset === 'extralarge' ? '14pt' : fontSizePreset === 'standard' ? '11.5pt' : '13pt';
  const fontWords = fontSizePreset === 'extralarge' ? '11pt' : fontSizePreset === 'standard' ? '9.5pt' : '10.5pt';
  const fontFooter = fontSizePreset === 'extralarge' ? '12pt' : fontSizePreset === 'standard' ? '10.5pt' : '11.5pt';

  const getEntriesForColumn = (colIndex: number): (MarkFoilStudentEntry | undefined)[] => {
    if (mode === 'blank') return [];
    if (mode === 'continuous') {
      const start = colIndex * totalRows;
      return entries.slice(start, start + totalRows);
    }
    return entries.slice(0, totalRows);
  };

  const renderFoilSlipHtml = (colIndex: number) => {
    const colEntries = getEntriesForColumn(colIndex);
    const rowsHtml: string[] = [];

    for (let r = 0; r < totalRows; r++) {
      const entry = colEntries[r];
      const roll = entry ? entry.rollNumber : '';
      const figures = entry && entry.marksInFigures ? entry.marksInFigures : '';
      const words = entry && entry.marksInWords ? entry.marksInWords : '';

      rowsHtml.push(`
        <tr style="height: ${rowPx}px;">
          <td class="col-roll">${roll}</td>
          <td class="col-figures">${figures}</td>
          <td class="col-words">${words}</td>
        </tr>
      `);
    }

    const setYearText =
      config.setNumber && config.date
        ? `Set / Year ${config.setNumber} / ${config.date.slice(-4) || '2026'}`
        : 'Set / Year..................';

    const examText = config.examinationName
      ? `EXAMINATION  ${config.examinationName}`
      : 'EXAMINATION ..............................................';

    const subjectText = config.subject
      ? `Subject  ${config.subject}`
      : 'Subject ....................................................';

    const paperVal = config.paperName || '.............................';
    const marksVal = config.fullMarks || '...............';
    const paperMarksText = `Paper  ${paperVal} &nbsp;&nbsp;&nbsp;&nbsp; Full Marks  ${marksVal}`;

    const courseNoText = config.courseNo
      ? `<strong>Course No.  ${config.courseNo}</strong>`
      : 'Course No. .................................................';

    const dateStr = config.date
      ? `Date  ${config.date}`
      : 'Date .................................';

    return `
      <div class="foil-sheet">
        <!-- Header with enlarged font size -->
        <div class="foil-top-right">${setYearText}</div>
        <div class="foil-meta-line">${examText}</div>
        <div class="foil-meta-line">${subjectText}</div>
        <div class="foil-meta-line">${paperMarksText}</div>
        <div class="foil-meta-line">${courseNoText}</div>

        <!-- Solid Rule -->
        <div class="foil-rule"></div>

        <!-- Marks Table with increased cell height and enlarged fonts -->
        <table class="marks-table">
          <thead>
            <tr>
              <th rowspan="2" class="th-roll">Roll / Code Number</th>
              <th colspan="2" class="th-marks">Marks Obtained</th>
            </tr>
            <tr>
              <th class="th-figures">In figures</th>
              <th class="th-words">In Words</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml.join('')}
          </tbody>
        </table>

        <!-- Footer with enlarged font size -->
        <div class="foil-footer">
          <div>Signature of the Examiner</div>
          <div>${dateStr}</div>
          ${config.examinerName ? `<div class="sig-name">(${config.examinerName})</div>` : ''}
        </div>
      </div>
    `;
  };

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Mark Foil - ${config.courseNo}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 5mm 6mm 4mm 6mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          margin: 0;
          padding: 0;
        }
        html, body {
          height: 100%;
          max-height: 297mm;
          margin: 0;
          padding: 2px;
          font-family: 'Times New Roman', Times, serif;
          color: #000000;
          background: #ffffff;
          overflow: hidden;
        }
        .no-print {
          background: #0f172a;
          color: #fff;
          padding: 8px 14px;
          margin-bottom: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-radius: 6px;
          font-family: sans-serif;
          font-size: 12px;
        }
        .print-btn {
          background: #f59e0b;
          color: #000;
          border: none;
          font-weight: bold;
          padding: 5px 14px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        .single-page-badge {
          background: #059669;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          margin-left: 8px;
        }
        .foils-container {
          display: flex;
          justify-content: space-between;
          width: 100%;
          gap: 14px;
          page-break-inside: avoid;
          page-break-after: avoid;
        }
        .foil-sheet {
          flex: 1;
          max-width: 48.5%;
        }
        .cut-line {
          width: 1px;
          border-left: 1px dashed #999;
          height: 100%;
        }
        .foil-top-right {
          text-align: right;
          font-size: ${fontMeta};
          margin-bottom: 2px;
        }
        .foil-meta-line {
          font-size: ${fontMeta};
          margin-bottom: 2px;
          line-height: 1.25;
        }
        .foil-rule {
          border-bottom: 1.5px solid #000000;
          margin: 3.5px 0 3.5px 0;
          width: 100%;
        }
        table.marks-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid #000000;
          page-break-inside: avoid;
        }
        table.marks-table th, table.marks-table td {
          border: 1px solid #000000;
          padding: 3px 5px;
        }
        table.marks-table th {
          font-weight: bold;
          text-align: center;
          vertical-align: middle;
          font-size: ${fontTh1};
        }
        .th-roll {
          width: 38%;
        }
        .th-marks {
          width: 62%;
        }
        .th-figures {
          width: 22%;
          font-size: ${fontTh2};
        }
        .th-words {
          width: 40%;
          font-size: ${fontTh2};
        }
        .col-roll {
          text-align: left;
          font-size: ${fontRoll};
          font-weight: 500;
          vertical-align: middle;
        }
        .col-figures {
          text-align: center;
          font-weight: bold;
          font-size: ${fontFigures};
          vertical-align: middle;
        }
        .col-words {
          text-align: left;
          font-size: ${fontWords};
          font-weight: 500;
          text-transform: uppercase;
          vertical-align: middle;
        }
        .foil-footer {
          margin-top: 5px;
          font-size: ${fontFooter};
          line-height: 1.35;
        }
        .sig-name {
          font-size: 10pt;
          color: #444;
        }
        @media print {
          .no-print {
            display: none !important;
          }
          html, body {
            padding: 0;
            margin: 0;
            height: 100%;
            overflow: hidden;
          }
          .foils-container {
            page-break-inside: avoid;
            page-break-after: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <div>
          <strong>Official Examination Mark Foil (Dual-Slip Format)</strong>
          <span class="single-page-badge">FITS 1 SINGLE PAGE GUARANTEED</span>
          <span style="font-size: 11px; color: #94a3b8; margin-left: 10px;">A4 Portrait &bull; Page 1 of 1</span>
        </div>
        <button class="print-btn" onclick="window.print()">
          Print / Save as PDF
        </button>
      </div>

      <div class="foils-container">
        ${renderFoilSlipHtml(0)}
        <div class="cut-line"></div>
        ${renderFoilSlipHtml(1)}
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

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
 * Calculates the total number of mark foil sheets/pages required based on student count and mode
 */
export function calculateMarkFoilPages(
  entriesCount: number,
  mode: 'twin' | 'continuous' | 'blank' = 'twin',
  totalRows: number = 25
): number {
  if (mode === 'blank' || entriesCount === 0) return 1;
  const capacityPerPage = mode === 'continuous' ? totalRows * 2 : totalRows;
  return Math.max(1, Math.ceil(entriesCount / capacityPerPage));
}

/**
 * Sorts student entries in dictionary (natural alphanumeric) order by roll number.
 * e.g. "24MAT001", "24MAT002", "24MAT010"
 * Empty roll numbers are placed at the end.
 */
export function sortEntriesInDictionaryOrder(
  list: MarkFoilStudentEntry[]
): MarkFoilStudentEntry[] {
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
 * Generates an authentic downloadable vector PDF (.pdf) matching the official
 * dual-column University Mark Foil format. If students exceed one sheet (e.g. >25 in twin mode
 * or >50 in continuous mode), multiple pages (Page 1 of N, Page 2 of N...) are automatically generated.
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

  // Ensure entries are sorted in dictionary order by roll number
  const sortedEntries = mode === 'blank' ? [] : sortEntriesInDictionaryOrder(entries);

  const totalPages = calculateMarkFoilPages(sortedEntries.length, mode, totalRows);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // A4 dimensions: 210mm wide x 297mm high
  // Exactly centered horizontally:
  // Each slip: 92mm. Gap: 6mm. Total width: 190mm.
  // Left margin = (210 - 190) / 2 = 10mm. Right margin = 10mm. Center cut line = 105mm.
  const colWidth = 92;
  const gap = 6;
  const totalWidth = colWidth * 2 + gap;
  const leftX = (210 - totalWidth) / 2; // 10mm
  const rightX = leftX + colWidth + gap; // 108mm
  const cutLineX = 105;

  // Calibrated available height for table data rows while maintaining centered A4 portrait fit
  const baseAvailableH = cellHeightPreset === 'extra' ? 222 : cellHeightPreset === 'standard' ? 200 : 212;
  const th1Height = 6.0;
  const th2Height = 5.5;
  const rowHeight = Math.min(10.5, Math.max(7.0, (baseAvailableH - (th1Height + th2Height)) / totalRows));
  const totalTableH = th1Height + th2Height + totalRows * rowHeight;

  // Calculate total vertical height of printing area for vertical centering on A4 (297mm)
  // Header: 32mm (including College Name), Table: totalTableH, Footer: 13.5mm (or 17.5mm with examiner name)
  const headerHeight = 32.0;
  const footerHeight = config.examinerName ? 17.5 : 13.5;
  const totalContentH = headerHeight + totalTableH + footerHeight;
  const startY = Math.max(6, Math.round(((297 - totalContentH) / 2) * 10) / 10);

  // Typography sizes in pt matching official university format and on-screen preview
  const fontMeta = fontSizePreset === 'extralarge' ? 12 : fontSizePreset === 'standard' ? 10 : 11;
  const fontTh1 = fontSizePreset === 'extralarge' ? 11 : fontSizePreset === 'standard' ? 9.5 : 10.5;
  const fontTh2 = fontSizePreset === 'extralarge' ? 10 : fontSizePreset === 'standard' ? 8.5 : 9.5;
  const fontRoll = fontSizePreset === 'extralarge' ? 11.5 : fontSizePreset === 'standard' ? 9.5 : 10.5;
  const fontFigures = fontSizePreset === 'extralarge' ? 14 : fontSizePreset === 'standard' ? 12 : 13;
  const fontWords = fontSizePreset === 'extralarge' ? 11 : fontSizePreset === 'standard' ? 9.5 : 10.5;
  const fontFooter = fontSizePreset === 'extralarge' ? 12 : fontSizePreset === 'standard' ? 10 : 11;

  // Precise column widths totaling 92mm: Roll (38%) = 35mm, Figures (22%) = 20mm, Words (40%) = 37mm
  const colRollW = 35;
  const colFigW = 20;
  const colWordW = 37;

  // Helper to slice entries for each page and column
  const getEntriesForColumn = (pageIdx: number, colIndex: number): (MarkFoilStudentEntry | undefined)[] => {
    if (mode === 'blank') {
      return [];
    }
    if (mode === 'continuous') {
      const start = (pageIdx * 2 + colIndex) * totalRows;
      return sortedEntries.slice(start, start + totalRows);
    }
    // 'twin' mode: both left & right show the same cohort for this page
    const start = pageIdx * totalRows;
    return sortedEntries.slice(start, start + totalRows);
  };

  const columns = [
    { x: leftX, index: 0, label: 'Foil' },
    { x: rightX, index: 1, label: 'Counterfoil' },
  ];

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    if (pageIdx > 0) {
      doc.addPage('a4', 'portrait');
    }

    columns.forEach(({ x, index }) => {
      const colEntries = getEntriesForColumn(pageIdx, index);

      // 0. College Header in Bold Capital at top of both halves
      doc.setFont('times', 'bold');
      doc.setFontSize(fontMeta + 1.5);
      doc.text('PANCHAYAT COLLEGE, BARAGADA', x + colWidth / 2, startY + 3.2, { align: 'center' });

      // 1. Header Metadata Section
      doc.setFont('times', 'normal');
      doc.setFontSize(fontMeta);

      // Set / Year with multi-page indicator if more than 1 page
      const pageIndicator = totalPages > 1 ? ` (Page ${pageIdx + 1} of ${totalPages})` : '';
      const setYearText =
        config.setNumber && config.date
          ? `Set / Year ${config.setNumber} / ${config.date.slice(-4) || '2026'}${pageIndicator}`
          : `Set / Year..................${pageIndicator}`;
      doc.text(setYearText, x + colWidth - 1, startY + 7.8, { align: 'right' });

      // Examination
      const examText = config.examinationName
        ? `EXAMINATION  ${config.examinationName}`
        : 'EXAMINATION ..............................................';
      doc.text(examText, x, startY + 12.8);

      // Subject
      const subjectText = config.subject
        ? `Subject  ${config.subject}`
        : 'Subject ....................................................';
      doc.text(subjectText, x, startY + 17.8);

      // Paper & Full Marks
      const paperVal = config.paperName || '.............................';
      const marksVal = config.fullMarks || '...............';
      const paperFullMarksText = `Paper  ${paperVal}   Full Marks  ${marksVal}`;
      doc.text(paperFullMarksText, x, startY + 22.8);

      // Course No.
      doc.setFont('times', 'bold');
      const courseNoText = config.courseNo
        ? `Course No.  ${config.courseNo}`
        : 'Course No. .................................................';
      doc.text(courseNoText, x, startY + 27.8);

      // Solid horizontal line below Course No.
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);
      doc.line(x, startY + 29.8, x + colWidth, startY + 29.8);

      // 2. Marks Table
      const tableY = startY + 32.0;

      // Outer table rectangle
      doc.setLineWidth(0.35);
      doc.rect(x, tableY, colWidth, totalTableH);

      // Table Header horizontal lines
      doc.line(x, tableY + th1Height, x + colWidth, tableY + th1Height);
      doc.line(x, tableY + th1Height + th2Height, x + colWidth, tableY + th1Height + th2Height);

      // Table Header vertical lines
      doc.line(x + colRollW, tableY, x + colRollW, tableY + totalTableH);
      doc.line(x + colRollW + colFigW, tableY + th1Height, x + colRollW + colFigW, tableY + totalTableH);

      // Table Header text
      doc.setFont('times', 'bold');
      doc.setFontSize(fontTh1);
      doc.text('Roll / Code Number', x + colRollW / 2, tableY + 4.2, { align: 'center' });
      doc.text('Marks Obtained', x + colRollW + (colFigW + colWordW) / 2, tableY + 4.2, { align: 'center' });

      doc.setFontSize(fontTh2);
      doc.text('In figures', x + colRollW + colFigW / 2, tableY + th1Height + 4.0, { align: 'center' });
      doc.text('In Words', x + colRollW + colFigW + colWordW / 2, tableY + th1Height + 4.0, { align: 'center' });

      // Table Data Rows
      for (let r = 0; r < totalRows; r++) {
        const curY = tableY + th1Height + th2Height + r * rowHeight;

        // Horizontal border for this row
        doc.setLineWidth(0.2);
        doc.line(x, curY + rowHeight, x + colWidth, curY + rowHeight);

        // Populate student data if present
        const entry = colEntries[r];
        if (entry) {
          // Roll number
          doc.setFont('times', 'normal');
          doc.setFontSize(fontRoll);
          doc.text(String(entry.rollNumber || ''), x + 2, curY + (rowHeight * 0.67));

          // In figures
          doc.setFont('times', 'bold');
          doc.setFontSize(fontFigures);
          doc.text(String(entry.marksInFigures || ''), x + colRollW + colFigW / 2, curY + (rowHeight * 0.68), { align: 'center' });

          // In Words
          doc.setFont('times', 'normal');
          const words = String(entry.marksInWords || '');
          if (words) {
            doc.setFontSize(fontWords);
            const textWidth = doc.getTextWidth(words);
            const maxAllowedW = colWordW - 3;
            if (textWidth > maxAllowedW) {
              const scaledSize = Math.max(8.5, fontWords * (maxAllowedW / textWidth));
              doc.setFontSize(scaledSize);
            }
            doc.text(words, x + colRollW + colFigW + 2, curY + (rowHeight * 0.67));
          }
        }
      }

      // 3. Footer Section below table
      const footerY = tableY + totalTableH + 5.0;
      doc.setFont('times', 'normal');
      doc.setFontSize(fontFooter);
      doc.text('Signature of the Examiner', x, footerY);

      const dateStr = config.date
        ? `Date  ${config.date}`
        : 'Date .................................';
      doc.text(dateStr, x, footerY + 4.5);

      if (config.examinerName) {
        doc.setFontSize(Math.max(9, fontFooter - 1.5));
        doc.text(`(${config.examinerName})`, x, footerY + 9.0);
      }
    });

    // Central dashed cut guideline between the two slips (centered on page and height)
    doc.setDrawColor(160, 160, 160);
    doc.setLineWidth(0.25);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(cutLineX, startY, cutLineX, startY + totalContentH);
  }

  // Remove any accidental extra pages beyond totalPages
  while (doc.getNumberOfPages() > totalPages) {
    doc.deletePage(doc.getNumberOfPages());
  }

  const pagesSuffix = totalPages > 1 ? `_${totalPages}pages` : '';
  const safeFilename =
    mode === 'blank'
      ? `Blank_Mark_Foil_${(config.courseNo || 'EXAM').replace(/\s+/g, '_')}.pdf`
      : `Mark_Foil_${(config.courseNo || 'EXAM').replace(/\s+/g, '_')}_${(config.setNumber || 'Set01').replace(/\s+/g, '_')}${pagesSuffix}.pdf`;

  doc.save(safeFilename);
}

/**
 * Generates an authentic Microsoft Word (.doc) document centered vertically and horizontally
 * on A4 page with identical typography and layout to preview and printed mark foil.
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

  // Ensure entries are sorted in dictionary order by roll number
  const sortedEntries = mode === 'blank' ? [] : sortEntriesInDictionaryOrder(entries);

  const totalPages = calculateMarkFoilPages(sortedEntries.length, mode, totalRows);

  const baseTargetPt = cellHeightPreset === 'extra' ? 620 : cellHeightPreset === 'standard' ? 550 : 585;
  const rowPt = Math.max(18, Math.min(28, Math.floor(baseTargetPt / totalRows)));

  const fontMeta = fontSizePreset === 'extralarge' ? '12pt' : fontSizePreset === 'standard' ? '10pt' : '11pt';
  const fontLineHeight = fontSizePreset === 'extralarge' ? '15pt' : fontSizePreset === 'standard' ? '13pt' : '14pt';
  const fontTh1 = fontSizePreset === 'extralarge' ? '11pt' : fontSizePreset === 'standard' ? '9.5pt' : '10.5pt';
  const fontTh2 = fontSizePreset === 'extralarge' ? '10pt' : fontSizePreset === 'standard' ? '8.5pt' : '9.5pt';
  const fontRoll = fontSizePreset === 'extralarge' ? '11.5pt' : fontSizePreset === 'standard' ? '9.5pt' : '10.5pt';
  const fontFigures = fontSizePreset === 'extralarge' ? '14pt' : fontSizePreset === 'standard' ? '12pt' : '13pt';
  const fontWords = fontSizePreset === 'extralarge' ? '11pt' : fontSizePreset === 'standard' ? '9.5pt' : '10.5pt';
  const fontFooter = fontSizePreset === 'extralarge' ? '12pt' : fontSizePreset === 'standard' ? '10pt' : '11pt';

  // Calculate dynamic vertical margin for Word to center content vertically on A4 (841.9pt height)
  const estimatedContentPt = 80 + 34 + (totalRows * rowPt) + (config.examinerName ? 55 : 42);
  const vMarginPt = Math.max(18, Math.floor((841.9 - estimatedContentPt) / 2));

  const getEntriesForColumn = (pageIdx: number, colIndex: number): (MarkFoilStudentEntry | undefined)[] => {
    if (mode === 'blank') return [];
    if (mode === 'continuous') {
      const start = (pageIdx * 2 + colIndex) * totalRows;
      return sortedEntries.slice(start, start + totalRows);
    }
    const start = pageIdx * totalRows;
    return sortedEntries.slice(start, start + totalRows);
  };

  const renderSingleSlipHtml = (pageIdx: number, colIndex: number): string => {
    const colEntries = getEntriesForColumn(pageIdx, colIndex);
    const rowsHtml: string[] = [];

    for (let r = 0; r < totalRows; r++) {
      const entry = colEntries[r];
      const roll = entry ? entry.rollNumber : '&nbsp;';
      const figures = entry && entry.marksInFigures ? entry.marksInFigures : '&nbsp;';
      const words = entry && entry.marksInWords ? entry.marksInWords : '&nbsp;';

      rowsHtml.push(`
        <tr style="height: ${rowPt}pt; mso-height-rule: exactly; page-break-inside: avoid;">
          <td style="border: 1pt solid #000000; padding: 2.5pt 4pt; font-family: 'Times New Roman', serif; font-size: ${fontRoll}; font-weight: 500; text-align: left; width: 38%; vertical-align: middle; mso-line-height-rule: exactly; line-height: 13pt;">
            ${roll}
          </td>
          <td style="border: 1pt solid #000000; padding: 2.5pt 3pt; font-family: 'Times New Roman', serif; font-size: ${fontFigures}; font-weight: bold; text-align: center; width: 22%; vertical-align: middle; mso-line-height-rule: exactly; line-height: 14pt;">
            ${figures}
          </td>
          <td style="border: 1pt solid #000000; padding: 2.5pt 4pt; font-family: 'Times New Roman', serif; font-size: ${fontWords}; font-weight: 500; text-align: left; width: 40%; text-transform: uppercase; vertical-align: middle; mso-line-height-rule: exactly; line-height: 12pt;">
            ${words}
          </td>
        </tr>
      `);
    }

    const pageIndicator = totalPages > 1 ? ` (Page ${pageIdx + 1} of ${totalPages})` : '';
    const setYearText =
      config.setNumber && config.date
        ? `Set / Year ${config.setNumber} / ${config.date.slice(-4) || '2026'}${pageIndicator}`
        : `Set / Year..................${pageIndicator}`;

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
        <!-- College Header in Bold Capital -->
        <div style="text-align: center; font-size: ${fontMeta}; font-weight: bold; text-transform: uppercase; margin-bottom: 3pt; letter-spacing: 0.5px; mso-line-height-rule: exactly; line-height: ${fontLineHeight};">
          PANCHAYAT COLLEGE, BARAGADA
        </div>
        <!-- Header -->
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
        <div style="font-size: ${fontMeta}; margin-bottom: 3pt; mso-line-height-rule: exactly; line-height: ${fontLineHeight};">
          ${courseNoText}
        </div>

        <!-- Solid rule under course no -->
        <div style="border-bottom: 1.5pt solid #000000; margin-bottom: 3.5pt; width: 100%; height: 1pt;"></div>

        <!-- Marks Table -->
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

        <!-- Footer -->
        <div style="font-size: ${fontFooter}; margin-top: 4pt; mso-line-height-rule: exactly; line-height: 15pt;">
          <div>Signature of the Examiner</div>
          <div>${dateStr}</div>
          ${config.examinerName ? `<div style="font-size: 10pt; color: #444;">(${config.examinerName})</div>` : ''}
        </div>
      </div>
    `;
  };

  const pagesHtml: string[] = [];
  for (let p = 0; p < totalPages; p++) {
    pagesHtml.push(`
      <div class="Section1" style="${p > 0 ? 'page-break-before: always; mso-break-type: section-break;' : ''}">
        <table align="center" style="width: 100%; max-width: 535pt; margin: 0 auto; border-collapse: collapse; border: none; table-layout: fixed; page-break-inside: avoid;">
          <tr>
            <td style="width: 48%; vertical-align: top; padding-right: 8pt;">
              ${renderSingleSlipHtml(p, 0)}
            </td>
            <td style="width: 4%; border-left: 1pt dashed #888888; vertical-align: top; text-align: center;">&nbsp;</td>
            <td style="width: 48%; vertical-align: top; padding-left: 8pt;">
              ${renderSingleSlipHtml(p, 1)}
            </td>
          </tr>
        </table>
      </div>
    `);
  }

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
          margin: ${vMarginPt}pt 24pt ${vMarginPt}pt 24pt;
          mso-header-margin: 0pt;
          mso-footer-margin: 0pt;
          mso-paper-source: 0;
          mso-page-orientation: portrait;
          mso-vertical-page-align: middle;
        }
        div.Section1 {
          page: Section1;
          mso-pagination: none;
          mso-vertical-page-align: middle;
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
      ${pagesHtml.join('')}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + wordDocumentContent], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const pagesSuffix = totalPages > 1 ? `_${totalPages}pages` : '';
  const safeFilename =
    mode === 'blank'
      ? `Blank_Mark_Foil_${(config.courseNo || 'EXAM').replace(/\s+/g, '_')}.doc`
      : `Mark_Foil_${(config.courseNo || 'EXAM').replace(/\s+/g, '_')}_${(config.setNumber || 'Set01').replace(/\s+/g, '_')}${pagesSuffix}.doc`;

  link.setAttribute('download', safeFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers sharp browser print window / Save as PDF.
 * Centers the printing area both vertically and horizontally on A4 portrait,
 * matching the on-screen preview typography and slip format.
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

  // Ensure entries are sorted in dictionary order by roll number
  const sortedEntries = mode === 'blank' ? [] : sortEntriesInDictionaryOrder(entries);

  const totalPages = calculateMarkFoilPages(sortedEntries.length, mode, totalRows);

  const baseTargetPx = cellHeightPreset === 'extra' ? 760 : cellHeightPreset === 'standard' ? 670 : 720;
  const rowPx = Math.max(22, Math.min(36, Math.floor(baseTargetPx / totalRows)));

  const fontMeta = fontSizePreset === 'extralarge' ? '12pt' : fontSizePreset === 'standard' ? '10pt' : '11pt';
  const fontTh1 = fontSizePreset === 'extralarge' ? '11pt' : fontSizePreset === 'standard' ? '9.5pt' : '10.5pt';
  const fontTh2 = fontSizePreset === 'extralarge' ? '10pt' : fontSizePreset === 'standard' ? '8.5pt' : '9.5pt';
  const fontRoll = fontSizePreset === 'extralarge' ? '11.5pt' : fontSizePreset === 'standard' ? '9.5pt' : '10.5pt';
  const fontFigures = fontSizePreset === 'extralarge' ? '14pt' : fontSizePreset === 'standard' ? '12pt' : '13pt';
  const fontWords = fontSizePreset === 'extralarge' ? '11pt' : fontSizePreset === 'standard' ? '9.5pt' : '10.5pt';
  const fontFooter = fontSizePreset === 'extralarge' ? '12pt' : fontSizePreset === 'standard' ? '10pt' : '11pt';

  const getEntriesForColumn = (pageIdx: number, colIndex: number): (MarkFoilStudentEntry | undefined)[] => {
    if (mode === 'blank') return [];
    if (mode === 'continuous') {
      const start = (pageIdx * 2 + colIndex) * totalRows;
      return sortedEntries.slice(start, start + totalRows);
    }
    const start = pageIdx * totalRows;
    return sortedEntries.slice(start, start + totalRows);
  };

  const renderFoilSlipHtml = (pageIdx: number, colIndex: number) => {
    const colEntries = getEntriesForColumn(pageIdx, colIndex);
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

    const pageIndicator = totalPages > 1 ? ` (Page ${pageIdx + 1} of ${totalPages})` : '';
    const setYearText =
      config.setNumber && config.date
        ? `Set / Year ${config.setNumber} / ${config.date.slice(-4) || '2026'}${pageIndicator}`
        : `Set / Year..................${pageIndicator}`;

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
        <!-- College Header in Bold Capital -->
        <div class="foil-college-header">PANCHAYAT COLLEGE, BARAGADA</div>
        <!-- Header -->
        <div class="foil-top-right">${setYearText}</div>
        <div class="foil-meta-line">${examText}</div>
        <div class="foil-meta-line">${subjectText}</div>
        <div class="foil-meta-line">${paperMarksText}</div>
        <div class="foil-meta-line">${courseNoText}</div>

        <!-- Solid Rule -->
        <div class="foil-rule"></div>

        <!-- Marks Table -->
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

        <!-- Footer -->
        <div class="foil-footer">
          <div>Signature of the Examiner</div>
          <div>${dateStr}</div>
          ${config.examinerName ? `<div class="sig-name">(${config.examinerName})</div>` : ''}
        </div>
      </div>
    `;
  };

  const pagesHtml: string[] = [];
  for (let p = 0; p < totalPages; p++) {
    pagesHtml.push(`
      <div class="mark-foil-page">
        <div class="foils-container">
          ${renderFoilSlipHtml(p, 0)}
          <div class="cut-line"></div>
          ${renderFoilSlipHtml(p, 1)}
        </div>
      </div>
    `);
  }

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
          margin: 0;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          margin: 0;
          padding: 0;
        }
        html, body {
          margin: 0;
          padding: 0;
          font-family: 'Times New Roman', Times, serif;
          color: #000000;
          background: #ffffff;
        }
        .no-print {
          background: #0f172a;
          color: #fff;
          padding: 8px 14px;
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
          padding: 6px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: 0.2s;
        }
        .print-btn:hover {
          background: #fbbf24;
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
        .multi-page-badge {
          background: #2563eb;
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
          align-items: stretch;
          width: 190mm;
          max-width: 190mm;
          gap: 12px;
          page-break-inside: avoid;
        }
        .foil-sheet {
          flex: 1;
          max-width: 48%;
          font-family: 'Times New Roman', Times, serif;
        }
        .cut-line {
          width: 1px;
          border-left: 1px dashed #777;
          align-self: stretch;
        }
        .foil-college-header {
          text-align: center;
          font-size: ${fontMeta};
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 3px;
          line-height: 1.2;
        }
        .foil-top-right {
          text-align: right;
          font-size: ${fontMeta};
          margin-bottom: 2px;
          line-height: 1.25;
        }
        .foil-meta-line {
          font-size: ${fontMeta};
          margin-bottom: 2px;
          line-height: 1.25;
        }
        .foil-rule {
          border-bottom: 1.5px solid #000000;
          margin: 3.5px 0 4.5px 0;
          width: 100%;
        }
        table.marks-table {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
          border: 1.5px solid #000000;
          page-break-inside: avoid;
        }
        table.marks-table th, table.marks-table td {
          border: 1px solid #000000;
        }
        table.marks-table th {
          font-weight: bold;
          text-align: center;
          vertical-align: middle;
          font-size: ${fontTh1};
          padding: 2.5px 4px;
        }
        .th-roll, .col-roll {
          width: 38%;
        }
        .th-marks {
          width: 62%;
        }
        .th-figures, .col-figures {
          width: 22%;
        }
        .th-words, .col-words {
          width: 40%;
        }
        .th-figures, .th-words {
          font-size: ${fontTh2};
          padding: 2px 3px;
        }
        .col-roll {
          text-align: left;
          font-size: ${fontRoll};
          font-weight: 500;
          padding: 2px 5px;
          vertical-align: middle;
        }
        .col-figures {
          text-align: center;
          font-weight: bold;
          font-size: ${fontFigures};
          padding: 2px 3px;
          vertical-align: middle;
        }
        .col-words {
          text-align: left;
          font-size: ${fontWords};
          font-weight: 500;
          text-transform: uppercase;
          padding: 2px 5px;
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
        @media screen {
          body {
            background: #e2e8f0;
            padding: 20px 0;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .no-print {
            width: 210mm;
            margin-bottom: 16px;
          }
          .mark-foil-page {
            width: 210mm;
            min-height: 297mm;
            background: #ffffff;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.18);
            margin-bottom: 24px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            box-sizing: border-box;
            padding: 16mm 10mm;
          }
        }
        @media print {
          .no-print {
            display: none !important;
          }
          html, body {
            padding: 0 !important;
            margin: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            background: #ffffff !important;
          }
          .mark-foil-page {
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            page-break-after: always;
            break-after: page;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            box-sizing: border-box !important;
            padding: 0 10mm !important;
            margin: 0 auto !important;
            overflow: hidden !important;
          }
          .mark-foil-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .foils-container {
            width: 190mm !important;
            max-width: 190mm !important;
            margin: 0 auto !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <div>
          <strong>Official Examination Mark Foil (Dual-Slip Format)</strong>
          <span class="${totalPages > 1 ? 'multi-page-badge' : 'single-page-badge'}">
            ${totalPages > 1 ? `${totalPages} PAGES GENERATED` : 'FITS 1 SINGLE PAGE'}
          </span>
          <span style="font-size: 11px; color: #94a3b8; margin-left: 10px;">
            A4 Portrait &bull; Candidates: ${entries.length} &bull; ${totalPages} Sheet${totalPages > 1 ? 's' : ''} (${mode === 'twin' ? 'Twin Slips' : mode === 'continuous' ? 'Continuous' : 'Blank'})
          </span>
        </div>
        <button class="print-btn" onclick="window.print()">
          Print / Save as PDF (${totalPages} Page${totalPages > 1 ? 's' : ''})
        </button>
      </div>

      ${pagesHtml.join('')}
    </body>
    </html>
  `);

  printWindow.document.close();
}


/**
 * Exports CSV with Roll/Code Number, In Figures, In Words
 */
export function exportMarkFoilCSV(
  config: MarkFoilConfig,
  entries: MarkFoilStudentEntry[]
): void {
  const sortedEntries = sortEntriesInDictionaryOrder(entries);
  const headers = ['Roll/Code Number', 'Marks In Figures', 'Marks In Words'];
  const rows = sortedEntries.map((e) => [
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

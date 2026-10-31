import { Student } from '../types';

export interface StudentPrintFilters {
  batch?: string;
  course?: string;
  yearLevel?: string;
  semester?: string;
  searchTerm?: string;
}

/**
 * Generates an authentic, high-quality, printable HTML document for the Student Directory
 * tailored specifically for academic records, notice boards, and administrative archives.
 */
export function generateStudentDirectoryHtml(
  students: Student[],
  filters: StudentPrintFilters,
  isAdmin: boolean = false
): string {
  const generatedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const generatedTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const batchLabel = filters.batch && filters.batch !== 'All' ? filters.batch : 'All Admission Batches';
  const courseLabel = filters.course && filters.course !== 'All' ? filters.course : 'All Courses (UG / PG)';
  const levelLabel = filters.yearLevel && filters.yearLevel !== 'All' ? filters.yearLevel : 'All Year Levels';
  const semLabel = filters.semester && filters.semester !== 'All' ? filters.semester : 'All Semesters';

  const rowsHtml = students
    .map((s, idx) => {
      const categoryDisplay = isAdmin
        ? s.category || 'GEN'
        : '•••• (Masked)';
      const contactDisplay = isAdmin
        ? [s.mobile, s.email].filter(Boolean).join(' • ') || 'N/A'
        : '•••••••••• (Protected)';

      return `
        <tr>
          <td class="col-center col-sl">${idx + 1}</td>
          <td class="col-roll">
            <strong>${s.rollNumber || 'N/A'}</strong>
          </td>
          <td class="col-univ">
            ${s.registrationNumber || '<span class="text-muted">Pending</span>'}
          </td>
          <td class="col-name">
            <strong>${s.name}</strong>
            ${s.fatherMotherName ? `<div class="sub-text">Guardian: ${s.fatherMotherName}</div>` : ''}
          </td>
          <td class="col-course">${s.course || 'UG NEP'}</td>
          <td class="col-center">
            ${s.yearLevel || ''} ${s.semester && s.semester !== 'All' ? `(${s.semester})` : ''}
            <div class="sub-text">${s.academicYear || ''}</div>
          </td>
          <td class="col-center">${categoryDisplay}</td>
          <td class="col-contact">${contactDisplay}</td>
        </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Student Directory - Department of Mathematics</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: 'Times New Roman', Times, Georgia, serif;
      color: #000000;
      background: #ffffff;
      padding: 10px;
      font-size: 11pt;
      line-height: 1.25;
    }

    /* Interactive Top Action Bar (hidden when printing) */
    .no-print {
      background: #0c2340;
      color: #ffffff;
      padding: 10px 16px;
      margin-bottom: 16px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .no-print .actions {
      display: flex;
      gap: 10px;
    }
    .btn-print {
      background: #f59e0b;
      color: #0c2340;
      border: none;
      font-weight: 700;
      padding: 7px 18px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
    }
    .btn-print:hover {
      background: #fbbf24;
    }
    .btn-close {
      background: #334155;
      color: #ffffff;
      border: none;
      padding: 7px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
    }
    .btn-close:hover {
      background: #475569;
    }

    /* Official Letterhead Header */
    .header-box {
      text-align: center;
      border-bottom: 2px solid #000000;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .inst-name {
      font-size: 16pt;
      font-weight: bold;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .dept-name {
      font-size: 13pt;
      font-weight: bold;
      color: #1e3a8a;
      margin-top: 2px;
    }
    .doc-title {
      font-size: 12pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 5px;
      letter-spacing: 0.3px;
      text-decoration: underline;
    }

    /* Filter & Metadata Summary Bar */
    .meta-bar {
      display: flex;
      justify-content: space-between;
      font-size: 10pt;
      margin-bottom: 10px;
      background: #f1f5f9;
      padding: 6px 10px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .meta-item strong {
      color: #0c2340;
    }

    /* Table Styles */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 9.5pt;
      border: 1.5px solid #000000;
      margin-bottom: 14px;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #000000;
      padding: 5px 6px;
      vertical-align: middle;
      word-wrap: break-word;
    }
    table.data-table th {
      background: #0c2340 !important;
      color: #ffffff !important;
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
      font-size: 9pt;
      letter-spacing: 0.2px;
    }
    .col-sl { width: 4.5%; }
    .col-roll { width: 14%; font-family: monospace; }
    .col-univ { width: 14%; font-family: monospace; }
    .col-name { width: 22%; }
    .col-course { width: 11%; }
    .col-batch { width: 12.5%; }
    .col-cat { width: 8%; }
    .col-contact { width: 14%; font-size: 8.5pt; }

    .col-center { text-align: center; }
    .sub-text {
      font-size: 8pt;
      color: #475569;
      margin-top: 2px;
      font-family: sans-serif;
    }
    .text-muted {
      color: #94a3b8;
      font-style: italic;
    }

    /* Signatures Footer */
    .footer-signatures {
      margin-top: 25px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 0 20px;
      page-break-inside: avoid;
    }
    .sig-block {
      text-align: center;
      min-width: 180px;
    }
    .sig-line {
      border-top: 1px dashed #000000;
      margin-bottom: 4px;
      width: 100%;
    }
    .sig-title {
      font-size: 9.5pt;
      font-weight: bold;
    }
    .sig-sub {
      font-size: 8pt;
      color: #475569;
    }

    .confidential-notice {
      margin-top: 14px;
      font-size: 8pt;
      color: #64748b;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 4px;
      font-family: sans-serif;
    }

    @media print {
      .no-print {
        display: none !important;
      }
      body {
        padding: 0 !important;
        margin: 0 !important;
      }
      table.data-table th {
        background: #e2e8f0 !important;
        color: #000000 !important;
      }
    }
  </style>
</head>
<body>
  <!-- Print Controls -->
  <div class="no-print">
    <div>
      <strong>Department Student Database &bull; Official Directory Sheet</strong>
      <span style="font-size: 11px; opacity: 0.8; margin-left: 8px;">
        Total Records: ${students.length} &bull; Generated on ${generatedDate}
      </span>
    </div>
    <div class="actions">
      <button class="btn-print" onclick="window.print()">
        🖨️ Print / Save as PDF
      </button>
      <button class="btn-close" onclick="window.close()">
        Close
      </button>
    </div>
  </div>

  <!-- Letterhead Header -->
  <div class="header-box">
    <div class="inst-name">PANCHAYAT COLLEGE, BARAGADA</div>
    <div class="dept-name">DEPARTMENT OF MATHEMATICS</div>
    <div class="doc-title">ENROLLED STUDENT DIRECTORY &amp; ACADEMIC BATCH ROLL SHEET</div>
  </div>

  <!-- Filter & Metadata Summary -->
  <div class="meta-bar">
    <div class="meta-item">
      <span>Batch:</span> <strong>${batchLabel}</strong>
    </div>
    <div class="meta-item">
      <span>Course:</span> <strong>${courseLabel}</strong>
    </div>
    <div class="meta-item">
      <span>Year Level:</span> <strong>${levelLabel}</strong>
    </div>
    <div class="meta-item">
      <span>Semester:</span> <strong>${semLabel}</strong>
    </div>
    <div class="meta-item">
      <span>Total Enrolled:</span> <strong>${students.length} Scholar${students.length === 1 ? '' : 's'}</strong>
    </div>
    <div class="meta-item">
      <span>Date:</span> <strong>${generatedDate} ${generatedTime}</strong>
    </div>
  </div>

  <!-- Data Table -->
  <table class="data-table">
    <thead>
      <tr>
        <th class="col-sl">#</th>
        <th class="col-roll">College Roll No</th>
        <th class="col-univ">University Roll No</th>
        <th class="col-name">Student Full Name</th>
        <th class="col-course">Course</th>
        <th class="col-batch">Session &amp; Sem</th>
        <th class="col-cat">Category</th>
        <th class="col-contact">Contact Details</th>
      </tr>
    </thead>
    <tbody>
      ${
        students.length === 0
          ? `<tr><td colspan="8" style="text-align: center; padding: 20px; color: #64748b;">No student records found matching the current filters.</td></tr>`
          : rowsHtml
      }
    </tbody>
  </table>

  <!-- Official Signatures -->
  <div class="footer-signatures">
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-title">Faculty Academic Advisor</div>
      <div class="sig-sub">Department of Mathematics</div>
    </div>
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-title">Head of Department</div>
      <div class="sig-sub">Department of Mathematics</div>
    </div>
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-title">Principal / Officer-in-Charge</div>
      <div class="sig-sub">Panchayat College, Baragada</div>
    </div>
  </div>

  <div class="confidential-notice">
    Official Academic Record &bull; Panchayat College, Baragada &bull; System Generated Document
  </div>

  <script>
    // Auto-trigger print dialog after slight delay for assets to render
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.print();
        } catch(e) {
          console.warn('Auto print error:', e);
        }
      }, 350);
    });
  </script>
</body>
</html>`;
}

/**
 * Triggers printing of the student directory.
 * Bypasses iframe sandbox restrictions by creating a Blob URL and opening it
 * in a top-level tab or utilizing an isolated printable iframe.
 */
export function printStudentDirectory(
  students: Student[],
  filters: StudentPrintFilters,
  isAdmin: boolean = false
): boolean {
  try {
    const html = generateStudentDirectoryHtml(students, filters, isAdmin);

    // 1. Primary Method: Blob URL in new window/tab
    // This bypasses iframe sandbox restrictions because Blob URLs open in top-level context
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');

    if (printWindow) {
      printWindow.focus();
      return true;
    }

    // 2. Secondary Method: Hidden iframe print
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
      doc.write(html);
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
          }, 4000);
        }
      }, 400);
      return true;
    }

    // 3. Last fallback
    window.print();
    return true;
  } catch (err) {
    console.error('Error printing student directory:', err);
    try {
      window.print();
      return true;
    } catch {
      return false;
    }
  }
}

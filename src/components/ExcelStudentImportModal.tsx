import React, { useState, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Download,
  Loader2,
  Check,
  FileText,
  Users,
  Calendar,
  CreditCard,
  UserCheck,
  GraduationCap,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student } from '../types';
import { saveStudent } from '../services/db';

interface ExcelStudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
  existingStudents?: Student[];
}

export const ExcelStudentImportModal: React.FC<ExcelStudentImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingStudents = [],
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Ask Admin the Admission Batch & Program/Course
  const [admissionBatch, setAdmissionBatch] = useState<string>('2026–27');
  const [customBatch, setCustomBatch] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('UG NEP');

  const [parsedStudents, setParsedStudents] = useState<
    Array<{
      student: Student;
      selected: boolean;
      isValid: boolean;
      validationErrors: string[];
    }>
  >([]);

  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Active batch string derived from selection
  const activeBatch = admissionBatch === 'Custom' ? customBatch.trim() || '2026–27' : admissionBatch;

  // Handlers for instant updates to parsed students when options change
  const handleBatchChange = (newBatch: string) => {
    setAdmissionBatch(newBatch);
    const active = newBatch === 'Custom' ? customBatch.trim() || '2026–27' : newBatch;
    const fbYear = getYearFromBatch(active);
    setParsedStudents((prev) =>
      prev.map((item) => ({
        ...item,
        student: {
          ...item.student,
          academicYear: active,
          admissionYear: fbYear,
        },
      }))
    );
  };

  const handleCustomBatchChange = (val: string) => {
    setCustomBatch(val);
    const active = val.trim() || '2026–27';
    const fbYear = getYearFromBatch(active);
    setParsedStudents((prev) =>
      prev.map((item) => ({
        ...item,
        student: {
          ...item.student,
          academicYear: active,
          admissionYear: fbYear,
        },
      }))
    );
  };

  const handleCourseChange = (newCourse: string) => {
    setSelectedCourse(newCourse);
    if (newCourse === 'Auto') {
      setParsedStudents((prev) =>
        prev.map((item) => ({
          ...item,
          student: {
            ...item.student,
            course: autoDetectCourse(item.student.rollNumber, item.student.course),
          },
        }))
      );
    } else {
      setParsedStudents((prev) =>
        prev.map((item) => ({
          ...item,
          student: {
            ...item.student,
            course: newCourse,
          },
        }))
      );
    }
  };

  // Helper to extract raw values from ambiguous Excel header names
  const findRawValue = (row: Record<string, any>, candidates: string[]): any => {
    const rowKeys = Object.keys(row);

    // 1. Direct candidate matching (strip non-alphanumeric)
    for (const cand of candidates) {
      const matchedKey = rowKeys.find((k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === cand);
      if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null && String(row[matchedKey]).trim() !== '') {
        return row[matchedKey];
      }
    }

    // 2. Fuzzy fallback matching for barcode / applicant name / roll number
    if (candidates.includes('barcode') || candidates.includes('barcodenumber')) {
      const fuzzyKey = rowKeys.find((k) => {
        const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanK.includes('barcode') || cleanK.includes('barc') || cleanK.includes('bcode');
      });
      if (fuzzyKey && row[fuzzyKey] !== undefined && row[fuzzyKey] !== null && String(row[fuzzyKey]).trim() !== '') {
        return row[fuzzyKey];
      }
    }

    return '';
  };

  // Helper to extract string values from ambiguous Excel header names
  const findValue = (row: Record<string, any>, candidates: string[]): string => {
    const val = findRawValue(row, candidates);
    return val !== '' ? String(val).trim() : '';
  };

  /**
   * Formats any Date of Birth input (Excel serial number, ISO string, yyyy-mm-dd, dd/mm/yyyy, text)
   * into strictly `dd-mm-yyyy` format.
   */
  const formatDobToDDMMYYYY = (rawVal: any): string => {
    if (rawVal === undefined || rawVal === null || rawVal === '') return '';

    // 1. Handle numeric Excel serial date numbers (e.g. 38518)
    if (typeof rawVal === 'number' || (!isNaN(Number(rawVal)) && Number(rawVal) > 1000 && Number(rawVal) < 100000 && !String(rawVal).includes('-') && !String(rawVal).includes('/'))) {
      const num = Number(rawVal);
      // Excel base date offset calculation
      const dateObj = new Date(Math.round((num - (25567 + 2)) * 86400 * 1000));
      if (!isNaN(dateObj.getTime())) {
        const day = String(dateObj.getUTCDate()).padStart(2, '0');
        const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
        const year = dateObj.getUTCFullYear();
        return `${day}-${month}-${year}`;
      }
    }

    const str = String(rawVal).trim();

    // 2. Handle dd-mm-yyyy, dd/mm/yyyy, or dd.mm.yyyy (e.g. "15-06-2005", "15/06/2005", "5/6/2005")
    const ddMmYyyyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (ddMmYyyyMatch) {
      const p1 = parseInt(ddMmYyyyMatch[1], 10);
      const p2 = parseInt(ddMmYyyyMatch[2], 10);
      const yr = ddMmYyyyMatch[3];

      let day = p1;
      let month = p2;
      // If p1 <= 12 and p2 > 12, it's MM-DD-YYYY
      if (p1 <= 12 && p2 > 12) {
        day = p2;
        month = p1;
      }
      return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${yr}`;
    }

    // 3. Handle yyyy-mm-dd or yyyy/mm/dd (e.g. "2005-06-15" or "2005/06/15")
    const yyyyMmDdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (yyyyMmDdMatch) {
      const yr = yyyyMmDdMatch[1];
      const month = String(parseInt(yyyyMmDdMatch[2], 10)).padStart(2, '0');
      const day = String(parseInt(yyyyMmDdMatch[3], 10)).padStart(2, '0');
      return `${day}-${month}-${yr}`;
    }

    // 4. Try JS Date parsing for ISO timestamps or textual dates (e.g. "15 Jun 2005")
    const parsedDate = new Date(str);
    if (!isNaN(parsedDate.getTime())) {
      const day = String(parsedDate.getDate()).padStart(2, '0');
      const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
      const year = parsedDate.getFullYear();
      return `${day}-${month}-${year}`;
    }

    return str;
  };

  // Normalize Course stream
  const normalizeCourse = (val: string): 'UG NEP' | 'UG AEDP' | 'UG CBCS' | 'PG' => {
    const lower = val.toLowerCase();
    if (lower.includes('aedp')) return 'UG AEDP';
    if (lower.includes('cbcs')) return 'UG CBCS';
    if (lower.includes('pg') || lower.includes('m.sc') || lower.includes('msc')) return 'PG';
    return 'UG NEP';
  };

  // Auto-detect Course: if roll number contains 'AEDP' -> 'UG AEDP', and the rest as 'UG NEP'
  const autoDetectCourse = (roll: string = '', rawCourseVal: string = ''): 'UG NEP' | 'UG AEDP' | 'UG CBCS' | 'PG' => {
    const rollUpper = (roll || '').toUpperCase();
    const courseUpper = (rawCourseVal || '').toUpperCase();

    // Check if roll number contains 'AEDP' or course column contains 'AEDP' -> Fix as 'UG AEDP'
    if (rollUpper.includes('AEDP') || courseUpper.includes('AEDP')) {
      return 'UG AEDP';
    }

    // Preserve PG if course column or roll number specifically denotes PG
    if (courseUpper.includes('PG') || courseUpper.includes('M.SC') || courseUpper.includes('MSC') || rollUpper.startsWith('PG')) {
      return 'PG';
    }

    // Preserve CBCS if course column explicitly specifies CBCS
    if (courseUpper.includes('CBCS') || rollUpper.includes('CBCS')) {
      return 'UG CBCS';
    }

    // Rest as 'UG NEP'
    return 'UG NEP';
  };

  // Extract starting year from batch string e.g. "2026–27" -> "2026"
  const getYearFromBatch = (batchStr: string): string => {
    const match = batchStr.match(/\d{4}/);
    return match ? match[0] : new Date().getFullYear().toString();
  };

  // Handle File Upload and Parse Excel
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessingFile(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];

        if (!firstSheetName) {
          throw new Error('The uploaded Excel workbook contains no sheets.');
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        if (rows.length === 0) {
          throw new Error('The uploaded sheet is empty or contains no readable data rows.');
        }

        const fallbackYear = getYearFromBatch(activeBatch);
        const existingRolls = new Set(existingStudents.map((s) => s.rollNumber.trim().toLowerCase()));

        const items = rows.map((row, idx) => {
          // 1. Applicant Name (as student name)
          const applicantName = findValue(row, [
            'applicantname',
            'applicant',
            'studentname',
            'candidate',
            'candidatename',
            'fullname',
            'name',
            'student',
          ]);

          // 2. Roll Number
          const rawRoll = findValue(row, [
            'rollnumber',
            'rollno',
            'roll',
            'universityrollno',
            'rollnum',
            'id',
          ]);

          // 3. Barcode - Search extensive barcode header candidates
          const barcode = findValue(row, [
            'barcode',
            'barcodenumber',
            'barcodeno',
            'barcodeid',
            'barcodenum',
            'studentbarcode',
            'applicantbarcode',
            'applicationbarcode',
            'samsbarcode',
            'samsbarcodeno',
            'samsbarcodenumber',
            'formbarcode',
            'bcode',
            'cardno',
            'cardnumber',
            'indexno',
            'indexnumber',
            'bar',
            'code',
          ]);

          // 4. Father Name
          const fatherName = findValue(row, [
            'fathername',
            'fathersname',
            'father',
            'fathername1',
          ]);

          // 5. Mother Name
          const motherName = findValue(row, [
            'mothername',
            'mothersname',
            'mother',
            'mothername1',
          ]);

          // Synthesized Father / Mother / Guardian string
          const combinedGuardian =
            fatherName || motherName
              ? `${fatherName}${fatherName && motherName ? ' & ' : ''}${motherName}`
              : findValue(row, ['fathermothername', 'guardian', 'parentname', 'parent']);

          // 6. Aadhaar Number
          const aadhaarNumber = findValue(row, [
            'aadhaarnumber',
            'aadhaar',
            'aadhar',
            'aadharno',
            'aadharnumber',
            'uid',
            'aadhaarno',
          ]);

          // 7. Mobile Number
          const mobile = findValue(row, [
            'mobilenumber',
            'mobile',
            'phone',
            'contact',
            'cell',
            'whatsapp',
            'mobilenumber1',
          ]);

          // 8. Email ID
          const email = findValue(row, [
            'emailid',
            'email',
            'studentemail',
            'mail',
            'emailaddress',
          ]);

          // 9. Date of Birth (DOB) - Formatted strictly to dd-mm-yyyy
          const rawDob = findRawValue(row, [
            'dob',
            'dateofbirth',
            'birthdate',
            'dobdate',
            'dateofbirthddmmyyyy',
          ]);
          const dob = formatDobToDDMMYYYY(rawDob);

          // 10. Address
          const address = findValue(row, [
            'address',
            'permanentaddress',
            'presentaddress',
            'city',
            'location',
          ]);

          // 11. Category
          const category = findValue(row, [
            'category',
            'caste',
            'reservation',
            'socialcategory',
          ]);

          // 12. Gender
          const gender = findValue(row, ['gender', 'sex']);

          // Additional Metadata
          const regNo = findValue(row, [
            'registrationnumber',
            'regno',
            'registrationno',
            'regnumber',
          ]);
          const rawCourse = findValue(row, ['course', 'stream', 'program', 'branch', 'degree']);
          const session = findValue(row, ['academicyear', 'session', 'batch', 'admissionbatch', 'year']) || activeBatch;
          const yearLevel = findValue(row, ['yearlevel', 'year', 'level']);
          const semester = findValue(row, ['semester', 'sem', 'term']);
          const admissionYear = findValue(row, ['admissionyear', 'joiningyear']) || fallbackYear;

          const errors: string[] = [];
          if (!applicantName) errors.push('Missing Applicant Name');
          if (!rawRoll) errors.push('Missing Roll Number');

          if (rawRoll && existingRolls.has(rawRoll.toLowerCase())) {
            errors.push('Roll Number already exists in database (Will update record)');
          }

          const rollNumber = rawRoll || `MATH${fallbackYear.slice(-2)}-${(idx + 1).toString().padStart(3, '0')}`;
          const name = applicantName || `Student ${idx + 1}`;
          const course = selectedCourse === 'Auto' ? autoDetectCourse(rollNumber, rawCourse) : selectedCourse;
          const uniqueId = rollNumber.replace(/[^a-zA-Z0-9]/g, '');

          const student: Student = {
            id: `stu-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
            uniqueId,
            rollNumber,
            barcode: barcode || undefined,
            registrationNumber: regNo || undefined,
            name,
            fatherName: fatherName || undefined,
            motherName: motherName || undefined,
            fatherMotherName: combinedGuardian || undefined,
            aadhaarNumber: aadhaarNumber || undefined,
            gender: gender || 'Male',
            dob: dob || undefined,
            course,
            academicYear: session,
            yearLevel: yearLevel || '1st Year',
            semester: semester || 'Semester I',
            mobile: mobile || undefined,
            email: email || `${uniqueId.toLowerCase()}@panchayatcollege.edu.in`,
            address: address || 'Baragada, Odisha',
            admissionYear,
            category: category || 'GEN',
            academicStatus: 'Active',
            createdAt: new Date().toISOString(),
          };

          const isValid = !!applicantName && !!rawRoll;

          return {
            student,
            selected: isValid,
            isValid,
            validationErrors: errors,
          };
        });

        setParsedStudents(items);
      } catch (err: any) {
        setErrorMessage(
          err?.message || 'Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.'
        );
        setParsedStudents([]);
      } finally {
        setIsProcessingFile(false);
      }
    };

    reader.onerror = () => {
      setErrorMessage('Error reading Excel file. Please try again.');
      setIsProcessingFile(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // Toggle selection of student
  const toggleSelectStudent = (index: number) => {
    setParsedStudents((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], selected: !copy[index].selected };
      return copy;
    });
  };

  // Select/Deselect All
  const toggleSelectAll = (select: boolean) => {
    setParsedStudents((prev) => prev.map((item) => ({ ...item, selected: select })));
  };

  // Download Standard Excel Template containing all requested fields
  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        'Roll Number': 'MATH26-001',
        'Barcode': '26BC1001',
        'Applicant Name': 'Siddharth Mohapatra',
        'Father Name': 'Mr. Ramesh Mohapatra',
        'Mother Name': 'Mrs. Sunita Mohapatra',
        'Aadhaar Number': '1234-5678-9012',
        'Mobile Number': '+91 94370 12345',
        'Email ID': 'siddharth@example.com',
        'Date of Birth': '15-06-2005',
        'Address': 'At/Po Baragada, Bargarh, Odisha',
        'Category': 'GEN',
        'Gender': 'Male',
        'Course': 'UG NEP',
        'Admission Batch': activeBatch,
        'Registration Number': 'REG2026001',
      },
      {
        'Roll Number': 'MATH26-002',
        'Barcode': '26BC1002',
        'Applicant Name': 'Ananya Dash',
        'Father Name': 'Dr. Pravat Dash',
        'Mother Name': 'Mrs. Minati Dash',
        'Aadhaar Number': '2345-6789-0123',
        'Mobile Number': '+91 94370 67890',
        'Email ID': 'ananya@example.com',
        'Date of Birth': '20-09-2005',
        'Address': 'Bargarh Town, Odisha',
        'Category': 'OBC',
        'Gender': 'Female',
        'Course': 'UG NEP',
        'Admission Batch': activeBatch,
        'Registration Number': 'REG2026002',
      },
      {
        'Roll Number': 'PGMATH26-01',
        'Barcode': '26BC2001',
        'Applicant Name': 'Rohan Kumar Meher',
        'Father Name': 'Sri Biranchi Meher',
        'Mother Name': 'Smt. Sabita Meher',
        'Aadhaar Number': '3456-7890-1234',
        'Mobile Number': '+91 70088 12345',
        'Email ID': 'rohan@example.com',
        'Date of Birth': '10-03-2003',
        'Address': 'Padampur, Bargarh, Odisha',
        'Category': 'ST',
        'Gender': 'Male',
        'Course': 'PG',
        'Admission Batch': activeBatch,
        'Registration Number': 'SU2026PG001',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student_Import');
    XLSX.writeFile(workbook, `Students_Import_Template_${activeBatch.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
  };

  // Perform Batch Import into Database
  const handleImport = async () => {
    const selectedItems = parsedStudents.filter((item) => item.selected);
    if (selectedItems.length === 0) {
      alert('Please select at least one valid student record to import.');
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: selectedItems.length });
    let successCount = 0;

    for (let i = 0; i < selectedItems.length; i++) {
      try {
        const item = selectedItems[i];
        // Save student and synchronize credentials
        await saveStudent(item.student);
        successCount++;
      } catch (err) {
        console.warn(`Failed to import student ${selectedItems[i].student.name}:`, err);
      }
      setImportProgress({ current: i + 1, total: selectedItems.length });
    }

    setIsImporting(false);
    onSuccess(successCount);
    onClose();
  };

  const selectedCount = parsedStudents.filter((item) => item.selected).length;
  const validCount = parsedStudents.filter((item) => item.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#0b1a2f] text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-academic text-base font-bold">
                Import Student Records from Excel Sheet
              </h3>
              <p className="text-[11px] text-slate-300">
                Batch import Roll No, Barcode, Applicant Name, Father Name, Mother Name, Aadhaar, Mobile, Email, DOB, Category, Gender &amp; Address
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isImporting}
            className="text-slate-400 hover:text-white cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-medium text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 1: Admission Batch Selection & Excel Upload */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            {/* Admission Batch & Program/Course Selection */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Admission Batch Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5 uppercase tracking-wide">
                    <Calendar className="w-4 h-4 text-amber-700" />
                    <span>Select Admission Batch *</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <select
                      value={admissionBatch}
                      onChange={(e) => handleBatchChange(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-amber-300 bg-white text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs"
                    >
                      <option value="2026–27">2026–27 Admission Batch</option>
                      <option value="2025–26">2025–26 Admission Batch</option>
                      <option value="2024–25">2024–25 Admission Batch</option>
                      <option value="2023–24">2023–24 Admission Batch</option>
                      <option value="2022–23">2022–23 Admission Batch</option>
                      <option value="Custom">Custom Admission Batch...</option>
                    </select>

                    {admissionBatch === 'Custom' && (
                      <input
                        type="text"
                        value={customBatch}
                        onChange={(e) => handleCustomBatchChange(e.target.value)}
                        placeholder="e.g. 2027–28"
                        className="px-3.5 py-2 rounded-lg border border-amber-300 bg-white text-xs font-semibold text-slate-900 w-32 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      />
                    )}
                  </div>
                </div>

                {/* 2. Program / Course Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5 uppercase tracking-wide">
                    <GraduationCap className="w-4 h-4 text-amber-700" />
                    <span>Select Program / Course *</span>
                  </label>

                  <select
                    value={selectedCourse}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-amber-300 bg-white text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs"
                  >
                    <option value="UG NEP">UG NEP (Undergraduate Honours - NEP 2020)</option>
                    <option value="UG AEDP">UG AEDP (Undergraduate AEDP)</option>
                    <option value="UG CBCS">UG CBCS (Undergraduate CBCS)</option>
                    <option value="PG">PG (M.Sc. Mathematics)</option>
                    <option value="Auto">Auto-Detect from Excel (Roll No containing 'AEDP' &rarr; UG AEDP, rest &rarr; UG NEP)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-amber-900">
                <span>
                  Target Import Settings: Batch <strong>{activeBatch}</strong> &bull; Program <strong>{selectedCourse === 'Auto' ? 'Auto-Detect' : selectedCourse}</strong>
                </span>
                <span className="text-[10.5px] text-amber-800">
                  Applied to all imported records (customizable per student in preview)
                </span>
              </div>
            </div>

            {/* Excel File Dropzone / Template Download */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <span className="font-bold text-slate-900 text-sm block">
                  1. Choose Excel Spreadsheet (.xlsx / .csv)
                </span>
                <span className="text-[11px] text-slate-500">
                  Maps Roll No, Barcode, Applicant Name, Father &amp; Mother Name, Aadhaar, Mobile, Email, DOB, Category, Gender &amp; Address
                </span>
              </div>

              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-lg text-[11px] inline-flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Download Sample Excel Template</span>
              </button>
            </div>

            {/* Dropzone */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 text-center bg-white cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-slate-800 text-xs">
                  {selectedFile ? selectedFile.name : 'Click to Browse & Upload Excel Sheet'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) files
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: Processing / Preview Table */}
          {isProcessingFile && (
            <div className="py-12 text-center space-y-2">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="font-bold text-slate-800 text-xs">Parsing Excel Sheet &amp; Mapping Student Fields...</p>
            </div>
          )}

          {!isProcessingFile && parsedStudents.length > 0 && (
            <div className="space-y-3">
              {/* Summary Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-blue-50 p-3 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 text-blue-900 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Parsed <strong>{parsedStudents.length}</strong> total records from sheet. (<strong>{validCount}</strong> valid) &bull; Admission Batch: <strong>{activeBatch}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(true)}
                    className="px-2.5 py-1 bg-white hover:bg-blue-100 border border-blue-300 text-blue-900 font-bold rounded text-[11px] cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(false)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded text-[11px] cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Preview Table displaying all requested columns */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white max-h-[320px] overflow-y-auto">
                <table className="w-full text-left text-[11px] text-slate-700 min-w-[900px]">
                  <thead className="bg-[#0c2340] text-white uppercase text-[9.5px] tracking-wider font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-8 text-center">Import</th>
                      <th className="py-2.5 px-3">Roll No &amp; Barcode</th>
                      <th className="py-2.5 px-3">Applicant Name</th>
                      <th className="py-2.5 px-3">Father &amp; Mother Name</th>
                      <th className="py-2.5 px-3">Aadhaar No &amp; DOB</th>
                      <th className="py-2.5 px-3">Mobile &amp; Email ID</th>
                      <th className="py-2.5 px-3">Category &amp; Gender</th>
                      <th className="py-2.5 px-3">Course &amp; Batch</th>
                      <th className="py-2.5 px-3">Address</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {parsedStudents.map((item, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-50 transition ${
                          !item.isValid ? 'bg-rose-50/40' : item.selected ? 'bg-blue-50/20' : ''
                        }`}
                      >
                        <td className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => toggleSelectStudent(idx)}
                            className="rounded text-blue-600 cursor-pointer"
                          />
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">
                          <div>{item.student.rollNumber}</div>
                          {item.student.barcode && (
                            <div className="text-[9.5px] text-indigo-600 font-semibold">
                              BC: {item.student.barcode}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {item.student.name}
                        </td>
                        <td className="py-2 px-3 text-slate-800">
                          {item.student.fatherName || item.student.motherName ? (
                            <div>
                              {item.student.fatherName && <div>F: {item.student.fatherName}</div>}
                              {item.student.motherName && <div className="text-slate-500 text-[10px]">M: {item.student.motherName}</div>}
                            </div>
                          ) : (
                            item.student.fatherMotherName || 'N/A'
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono text-[10.5px]">
                          <div>{item.student.aadhaarNumber || 'N/A'}</div>
                          {item.student.dob && (
                            <div className="text-[9.5px] text-slate-500 font-sans">
                              DOB: {item.student.dob}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono text-[10.5px]">
                          <div>{item.student.mobile || 'N/A'}</div>
                          <div className="text-[9.5px] text-slate-400 font-sans truncate max-w-[120px]">
                            {item.student.email}
                          </div>
                        </td>
                        <td className="py-2 px-3 font-medium">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[9.5px]">
                            {item.student.category || 'GEN'}
                          </span>{' '}
                          <span className="text-slate-500">({item.student.gender || 'Male'})</span>
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={item.student.course}
                            onChange={(e) => {
                              const updated = [...parsedStudents];
                              updated[idx] = {
                                ...updated[idx],
                                student: {
                                  ...updated[idx].student,
                                  course: e.target.value,
                                },
                              };
                              setParsedStudents(updated);
                            }}
                            className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-950 font-bold text-[10px] focus:outline-hidden"
                          >
                            <option value="UG NEP">UG NEP</option>
                            <option value="UG AEDP">UG AEDP</option>
                            <option value="UG CBCS">UG CBCS</option>
                            <option value="PG">PG</option>
                          </select>
                          <span className="text-[9.5px] text-slate-500 font-semibold block mt-0.5">
                            {item.student.academicYear || activeBatch}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600 max-w-[130px] truncate" title={item.student.address}>
                          {item.student.address || 'Baragada, Odisha'}
                        </td>
                        <td className="py-2 px-3">
                          {item.isValid ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px] inline-flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" /> Valid
                            </span>
                          ) : (
                            <span
                              className="px-2 py-0.5 rounded bg-rose-100 text-rose-900 font-bold text-[10px] inline-flex items-center gap-1"
                              title={item.validationErrors.join(', ')}
                            >
                              <AlertTriangle className="w-3 h-3 text-rose-600" /> Missing
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 font-medium">
            {selectedCount > 0 && (
              <span>
                Ready to import <strong>{selectedCount}</strong> student record{selectedCount > 1 ? 's' : ''} for <strong>{activeBatch}</strong> into database
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2 border rounded-xl text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleImport}
              disabled={isImporting || selectedCount === 0}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-xs disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    Importing ({importProgress.current}/{importProgress.total})...
                  </span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Import {selectedCount} Record{selectedCount !== 1 ? 's' : ''}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

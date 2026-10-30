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

  // Helper to extract values from ambiguous Excel header names
  const findValue = (row: Record<string, any>, candidates: string[]): string => {
    const rowKeys = Object.keys(row);
    for (const cand of candidates) {
      const matchedKey = rowKeys.find((k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === cand);
      if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
        return String(row[matchedKey]).trim();
      }
    }
    return '';
  };

  // Normalize Course stream
  const normalizeCourse = (val: string): 'UG NEP' | 'UG AEDP' | 'UG CBCS' | 'PG' => {
    const lower = val.toLowerCase();
    if (lower.includes('aedp')) return 'UG AEDP';
    if (lower.includes('cbcs')) return 'UG CBCS';
    if (lower.includes('pg') || lower.includes('m.sc') || lower.includes('msc')) return 'PG';
    return 'UG NEP';
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

        const currentYearStr = new Date().getFullYear().toString();
        const existingRolls = new Set(existingStudents.map((s) => s.rollNumber.trim().toLowerCase()));

        const items = rows.map((row, idx) => {
          const rawName = findValue(row, [
            'name',
            'studentname',
            'fullname',
            'candidate',
            'candidatename',
            'student',
          ]);
          const rawRoll = findValue(row, [
            'rollnumber',
            'rollno',
            'roll',
            'universityrollno',
            'rollnum',
            'id',
          ]);
          const regNo = findValue(row, [
            'registrationnumber',
            'regno',
            'registrationno',
            'regnumber',
          ]);
          const rawCourse = findValue(row, ['course', 'stream', 'program', 'branch', 'degree']);
          const session = findValue(row, ['academicyear', 'session', 'batch', 'year']);
          const yearLevel = findValue(row, ['yearlevel', 'year', 'level']);
          const semester = findValue(row, ['semester', 'sem', 'term']);
          const fatherMotherName = findValue(row, [
            'fathermothername',
            'guardian',
            'fathername',
            'mothername',
            'parentname',
            'parent',
          ]);
          const mobile = findValue(row, ['mobile', 'phone', 'contact', 'mobilenumber', 'cell']);
          const email = findValue(row, ['email', 'studentemail', 'mail', 'emailaddress']);
          const category = findValue(row, ['category', 'caste', 'reservation']);
          const gender = findValue(row, ['gender', 'sex']);
          const address = findValue(row, ['address', 'city', 'location']);
          const admissionYear = findValue(row, ['admissionyear', 'joiningyear']) || currentYearStr;

          const errors: string[] = [];
          if (!rawName) errors.push('Missing Student Name');
          if (!rawRoll) errors.push('Missing Roll Number');

          if (rawRoll && existingRolls.has(rawRoll.toLowerCase())) {
            errors.push('Roll Number already exists in database (Will update record)');
          }

          const rollNumber = rawRoll || `MATH${currentYearStr.slice(-2)}-${(idx + 1).toString().padStart(3, '0')}`;
          const name = rawName || `Student ${idx + 1}`;
          const course = normalizeCourse(rawCourse);
          const uniqueId = rollNumber.replace(/[^a-zA-Z0-9]/g, '');

          const student: Student = {
            id: `stu-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
            uniqueId,
            rollNumber,
            registrationNumber: regNo || undefined,
            name,
            fatherMotherName: fatherMotherName || undefined,
            gender: gender || 'Male',
            course,
            academicYear: session || `${admissionYear}–${(parseInt(admissionYear, 10) + 1).toString().slice(-2)}`,
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

          const isValid = !!rawName && !!rawRoll;

          return {
            student,
            selected: isValid,
            isValid,
            validationErrors: errors,
          };
        });

        setParsedStudents(items);
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.');
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

  // Download Standard Excel Template
  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        'Roll Number': 'MATH26-001',
        'Student Name': 'Siddharth Mohapatra',
        'Registration Number': 'REG2026001',
        'Course': 'UG NEP',
        'Session': '2026–27',
        'Year Level': '1st Year',
        'Semester': 'Semester I',
        'Guardian Name': 'Mr. Ramesh Mohapatra',
        'Gender': 'Male',
        'Mobile Number': '+91 94370 12345',
        'Email Address': 'siddharth@example.com',
        'Category': 'GEN',
        'Admission Year': '2026',
        'Address': 'Baragada, Odisha',
      },
      {
        'Roll Number': 'MATH26-002',
        'Student Name': 'Ananya Dash',
        'Registration Number': 'REG2026002',
        'Course': 'UG NEP',
        'Session': '2026–27',
        'Year Level': '1st Year',
        'Semester': 'Semester I',
        'Guardian Name': 'Dr. P. Dash',
        'Gender': 'Female',
        'Mobile Number': '+91 94370 67890',
        'Email Address': 'ananya@example.com',
        'Category': 'OBC',
        'Admission Year': '2026',
        'Address': 'Baragada, Odisha',
      },
      {
        'Roll Number': 'PGMATH26-01',
        'Student Name': 'Rohan Kumar Meher',
        'Registration Number': 'SU2026PG001',
        'Course': 'PG',
        'Session': '2026–27',
        'Year Level': '1st Year',
        'Semester': 'Semester I',
        'Guardian Name': 'Sri B. Meher',
        'Gender': 'Male',
        'Mobile Number': '+91 70088 12345',
        'Email Address': 'rohan@example.com',
        'Category': 'ST',
        'Admission Year': '2026',
        'Address': 'Bargarh, Odisha',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, 'Students_Import_Template.xlsx');
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
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
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
                Upload .xlsx / .csv spreadsheet to batch add students into department database
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

          {/* Step 1: File Dropzone / Template Download */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <span className="font-bold text-slate-900 text-sm block">
                  1. Select Excel File (.xlsx / .csv)
                </span>
                <span className="text-[11px] text-slate-500">
                  Spreadsheet columns like Roll Number, Student Name, Course, Session, Mobile, Email, etc.
                </span>
              </div>

              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-lg text-[11px] inline-flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Download Excel Template</span>
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
              <p className="font-bold text-slate-800 text-xs">Parsing Excel Sheet & Mapping Columns...</p>
            </div>
          )}

          {!isProcessingFile && parsedStudents.length > 0 && (
            <div className="space-y-3">
              {/* Summary Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-blue-50 p-3 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 text-blue-900 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Parsed <strong>{parsedStudents.length}</strong> total records from sheet. (<strong>{validCount}</strong> valid)
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

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[300px] overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-[#0c2340] text-white uppercase text-[10px] tracking-wider font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-8 text-center">Import</th>
                      <th className="py-2.5 px-3">Roll Number</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Course Stream</th>
                      <th className="py-2.5 px-3">Session & Semester</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Mobile & Email</th>
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
                          {item.student.rollNumber}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {item.student.name}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[10px]">
                            {item.student.course}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          {item.student.academicYear} ({item.student.semester})
                        </td>
                        <td className="py-2 px-3 font-medium">
                          {item.student.category || 'GEN'}
                        </td>
                        <td className="py-2 px-3 font-mono text-[10.5px]">
                          <div>{item.student.mobile || 'N/A'}</div>
                          <div className="text-[9.5px] text-slate-400 font-sans truncate max-w-[120px]">
                            {item.student.email}
                          </div>
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
                Ready to import <strong>{selectedCount}</strong> student record{selectedCount > 1 ? 's' : ''} into database
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

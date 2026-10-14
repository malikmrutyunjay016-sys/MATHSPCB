import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  CheckCircle,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Link as LinkIcon,
  Loader2,
} from 'lucide-react';
import { FacultyPhotoPicker } from './FacultyPhotoPicker';
import { processSyllabusFile, MAX_SYLLABUS_FILE_BYTES } from '../utils/fileCompressor';
import {
  Facility,
  Book,
  QuestionPaper,
  Notice,
  Committee,
  ImportantContact,
  DepartmentSettings,
  TimeTableSlot,
  TimeTablePeriod,
  TimeTableClassRow,
  DayOfWeek,
  Syllabus,
  Faculty,
} from '../types';
import { checkFacultyConflict, getFacultyStatusForPeriod } from '../utils/timeTableUtils';

// Facility Modal
export const FacilityModal: React.FC<{
  isOpen: boolean;
  facility: Facility | null;
  onSave: (data: Facility) => void;
  onClose: () => void;
}> = ({ isOpen, facility, onSave, onClose }) => {
  const [form, setForm] = useState<Facility>({
    id: '',
    name: '',
    category: 'Smart Classroom',
    description: '',
    status: 'Fully Operational',
    equipment: '',
    photoUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
    order: 1,
  });

  useEffect(() => {
    if (facility) {
      setForm(facility);
    } else {
      setForm({
        id: `fac-${Date.now()}`,
        name: '',
        category: 'Department Photo',
        description: '',
        status: 'Active',
        equipment: '',
        photoUrl: '',
        order: 1,
      });
    }
  }, [facility, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-[#0b1a2f] text-white p-5 flex items-center justify-between">
          <h3 className="font-serif-academic text-base font-bold">
            {facility ? 'Edit Photo & Description' : 'Add Department Photo'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
            onClose();
          }}
          className="p-6 overflow-y-auto space-y-4 text-xs"
        >
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
              Photo Title / Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Ramanujan Smart Classroom, Mathematics Computing Lab"
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
            />
          </div>

          {/* Photograph Picker (Computer / Google Drive / URL / Presets) */}
          <FacultyPhotoPicker
            value={form.photoUrl}
            onChange={(url) => setForm({ ...form, photoUrl: url })}
            label="Photograph *"
            helperText="Import photo from Computer, paste Google Drive link, or image URL"
          />

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
              Description
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Add details or description about this photograph if needed..."
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
            />
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 -mx-6 -mb-6 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer"
            >
              Save Photo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Book Modal
export const BookModal: React.FC<{
  isOpen: boolean;
  book: Book | null;
  onSave: (data: Book) => void;
  onClose: () => void;
}> = ({ isOpen, book, onSave, onClose }) => {
  const [form, setForm] = useState<Book>({
    id: '',
    title: '',
    author: '',
    publisher: '',
    edition: '1st Edition',
    isbn: '',
    subject: 'Real Analysis',
    accessionNumber: '',
    copies: 5,
    status: 'Available',
    shelfRack: 'Rack A-1',
  });

  useEffect(() => {
    if (book) {
      setForm(book);
    } else {
      setForm({
        id: `bk-${Date.now()}`,
        title: '',
        author: '',
        publisher: 'McGraw-Hill / PHI',
        edition: 'Latest Edition',
        isbn: '',
        subject: 'Real Analysis',
        accessionNumber: `MTH-${Math.floor(1000 + Math.random() * 9000)}`,
        copies: 5,
        status: 'Available',
        shelfRack: 'Rack A-1',
      });
    }
  }, [book, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-[#0b1a2f] text-white p-5 flex items-center justify-between">
          <h3 className="font-serif-academic text-base font-bold">
            {book ? 'Edit Book Record' : 'Add Book to Catalogue'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
            onClose();
          }}
          className="p-6 overflow-y-auto space-y-4 text-xs"
        >
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
              Book Title *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Author(s) *
              </label>
              <input
                type="text"
                required
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Subject / Category *
              </label>
              <select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              >
                <option value="Real Analysis">Real Analysis</option>
                <option value="Algebra">Algebra</option>
                <option value="Calculus">Calculus</option>
                <option value="Complex Analysis">Complex Analysis</option>
                <option value="Linear Algebra">Linear Algebra</option>
                <option value="Differential Equations">Differential Equations</option>
                <option value="Numerical Methods">Numerical Methods</option>
                <option value="Statistics">Statistics</option>
                <option value="Topology">Topology</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Publisher
              </label>
              <input
                type="text"
                value={form.publisher || ''}
                onChange={(e) => setForm({ ...form, publisher: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Edition
              </label>
              <input
                type="text"
                value={form.edition || ''}
                onChange={(e) => setForm({ ...form, edition: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Accession No
              </label>
              <input
                type="text"
                value={form.accessionNumber || ''}
                onChange={(e) => setForm({ ...form, accessionNumber: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Copies
              </label>
              <input
                type="number"
                min="1"
                value={form.copies}
                onChange={(e) => setForm({ ...form, copies: parseInt(e.target.value) || 1 })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as 'Available' | 'Issued' | 'Reference Only' })
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              >
                <option value="Available">Available</option>
                <option value="Issued">Issued</option>
                <option value="Reference Only">Reference Only</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                ISBN
              </label>
              <input
                type="text"
                value={form.isbn || ''}
                onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Shelf / Rack Location
              </label>
              <input
                type="text"
                value={form.shelfRack || ''}
                onChange={(e) => setForm({ ...form, shelfRack: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
              Book Cover Image URL
            </label>
            <input
              type="text"
              value={form.photoUrl || ''}
              onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
              placeholder="e.g. https://images.unsplash.com/..."
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden font-mono"
            />
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 -mx-6 -mb-6 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg"
            >
              Save Book Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Question Paper Modal
export const QuestionPaperModal: React.FC<{
  isOpen: boolean;
  paper: QuestionPaper | null;
  onSave: (data: QuestionPaper) => void;
  onClose: () => void;
}> = ({ isOpen, paper, onSave, onClose }) => {
  const [form, setForm] = useState<QuestionPaper>({
    id: '',
    title: '',
    course: 'UG',
    subject: 'Calculus',
    paperCode: 'MATH-CC-101',
    academicYear: '2025–26',
    semester: 'Semester I',
    yearLevel: '1st Year',
    examination: 'Semester End Examination (CBCS)',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileSize: '350 KB',
  });

  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);

  useEffect(() => {
    if (paper) {
      setForm(paper);
      setIsCustomSubject(false);
    } else {
      setForm({
        id: `pyq-${Date.now()}`,
        title: '',
        course: 'UG',
        subject: 'Calculus',
        paperCode: 'MATH-CC-101',
        academicYear: '2025–26',
        semester: 'Semester I',
        yearLevel: '1st Year',
        examination: 'Semester End Examination (CBCS)',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileSize: '350 KB',
        uploadedByRole: 'admin',
      });
      setIsCustomSubject(false);
    }
    setUploadStatus('');
    setUploadError('');
    setIsProcessingFile(false);
  }, [paper, isOpen]);

  if (!isOpen) return null;

  const handlePaperFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus('');
    setUploadError('');
    setIsProcessingFile(true);

    const MAX_ALLOWED_BYTES = 500 * 1024; // 500 KB
    const originalKb = Math.round(file.size / 1024);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          let quality = 0.88;

          const maxDim = 1600;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setUploadError('Failed to initialize canvas.');
            setIsProcessingFile(false);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          let byteSize = Math.round((dataUrl.length * 3) / 4);

          while (byteSize > MAX_ALLOWED_BYTES && quality > 0.15) {
            quality -= 0.12;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
            byteSize = Math.round((dataUrl.length * 3) / 4);
          }

          if (byteSize > MAX_ALLOWED_BYTES) {
            let scale = 0.8;
            while (byteSize > MAX_ALLOWED_BYTES && scale > 0.25) {
              const scaledCanvas = document.createElement('canvas');
              scaledCanvas.width = Math.max(200, Math.round(width * scale));
              scaledCanvas.height = Math.max(200, Math.round(height * scale));
              const sCtx = scaledCanvas.getContext('2d');
              if (sCtx) {
                sCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
                dataUrl = scaledCanvas.toDataURL('image/jpeg', 0.65);
                byteSize = Math.round((dataUrl.length * 3) / 4);
              }
              scale -= 0.15;
            }
          }

          const finalKb = Math.round(byteSize / 1024);
          setForm((prev) => ({
            ...prev,
            fileUrl: dataUrl,
            fileSize: `${finalKb} KB`,
          }));

          if (originalKb > 500) {
            setUploadStatus(
              `⚡ Compressed scan from ${originalKb} KB to ${finalKb} KB (within 500 KB limit).`
            );
          } else {
            setUploadStatus(`✓ Scan accepted: ${finalKb} KB (within 500 KB limit).`);
          }
          setIsProcessingFile(false);
        };
        img.onerror = () => {
          setUploadError('Could not process image scan.');
          setIsProcessingFile(false);
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        setUploadError('Could not read file.');
        setIsProcessingFile(false);
      };
      reader.readAsDataURL(file);
      return;
    }

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      if (file.size > MAX_ALLOWED_BYTES) {
        setUploadError(
          `Selected PDF is ${originalKb} KB, exceeding 500 KB limit. Please compress the PDF or upload a scanned image, which will be auto-compressed.`
        );
        setIsProcessingFile(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setForm((prev) => ({
            ...prev,
            fileUrl: reader.result as string,
            fileSize: `${originalKb} KB`,
          }));
          setUploadStatus(`✓ PDF accepted: ${originalKb} KB (within 500 KB limit).`);
          setIsProcessingFile(false);
        }
      };
      reader.onerror = () => {
        setUploadError('Could not read PDF.');
        setIsProcessingFile(false);
      };
      reader.readAsDataURL(file);
      return;
    }

    setUploadError('Supported formats: PDF, JPG, JPEG, PNG (max 500 KB).');
    setIsProcessingFile(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-[#0b1a2f] text-white p-5 flex items-center justify-between">
          <h3 className="font-serif-academic text-base font-bold">
            {paper ? 'Edit Question Paper' : 'Add Question Paper (PYQ)'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const finalSubject = isCustomSubject && customSubjectInput.trim() ? customSubjectInput.trim() : form.subject;
            onSave({ ...form, subject: finalSubject });
            onClose();
          }}
          className="p-6 overflow-y-auto space-y-4 text-xs"
        >
          {/* Course Level (UG vs PG) */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
              Course Level *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, course: 'UG' })}
                className={`py-2 px-3 rounded-lg border font-bold text-xs text-center transition cursor-pointer ${
                  (form.course || 'UG') === 'UG'
                    ? 'bg-[#0c2340] text-amber-300 border-[#0c2340]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                UG (B.Sc. Hons)
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, course: 'PG' })}
                className={`py-2 px-3 rounded-lg border font-bold text-xs text-center transition cursor-pointer ${
                  form.course === 'PG'
                    ? 'bg-[#0c2340] text-amber-300 border-[#0c2340]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                PG (M.Sc. Mathematics)
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
              Paper Title / Name *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Subject *
              </label>
              {!isCustomSubject ? (
                <select
                  value={form.subject}
                  onChange={(e) => {
                    if (e.target.value === '__OTHER__') {
                      setIsCustomSubject(true);
                    } else {
                      setForm({ ...form, subject: e.target.value });
                    }
                  }}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
                >
                  <option value="Calculus">Calculus</option>
                  <option value="Algebra">Algebra</option>
                  <option value="Real Analysis">Real Analysis</option>
                  <option value="Differential Equations">Differential Equations</option>
                  <option value="Numerical Methods">Numerical Methods</option>
                  <option value="Complex Analysis">Complex Analysis</option>
                  <option value="Linear Algebra">Linear Algebra</option>
                  <option value="Probability & Statistics">Probability & Statistics</option>
                  <option value="Discrete Mathematics">Discrete Mathematics</option>
                  <option value="Topology">Topology</option>
                  <option value="__OTHER__">+ Other (Add Custom Subject...)</option>
                </select>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    required
                    value={customSubjectInput}
                    onChange={(e) => setCustomSubjectInput(e.target.value)}
                    placeholder="Enter custom subject"
                    className="w-full p-2 rounded-lg border border-indigo-300 text-xs focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomSubject(false)}
                    className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 border rounded"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Paper Code *
              </label>
              <input
                type="text"
                required
                value={form.paperCode}
                onChange={(e) => setForm({ ...form, paperCode: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Academic Year *
              </label>
              <input
                type="text"
                required
                value={form.academicYear}
                onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Year Level
              </label>
              <select
                value={form.yearLevel}
                onChange={(e) => setForm({ ...form, yearLevel: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Semester *
              </label>
              <select
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              >
                <option value="Semester I">Semester I</option>
                <option value="Semester II">Semester II</option>
                <option value="Semester III">Semester III</option>
                <option value="Semester IV">Semester IV</option>
                <option value="Semester V">Semester V</option>
                <option value="Semester VI">Semester VI</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
              Examination Name *
            </label>
            <input
              type="text"
              required
              value={form.examination}
              onChange={(e) => setForm({ ...form, examination: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
            />
          </div>

          {/* Upload Paper Document / Scan (Max 500 KB) */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-2.5">
            <label className="block font-bold text-slate-800 uppercase text-[11px] flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Attach Question Paper File (Max 500 KB)</span>
            </label>

            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-3 bg-white text-center transition">
              <input
                type="file"
                id="pyq-admin-file-input"
                accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
                onChange={handlePaperFileUpload}
                className="hidden"
              />
              <label
                htmlFor="pyq-admin-file-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-1"
              >
                <div className="p-1.5 rounded-full bg-blue-50 text-blue-700">
                  {isProcessingFile ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                </div>
                <span className="font-bold text-slate-800 text-xs">
                  {isProcessingFile ? 'Compressing document scan...' : 'Upload Question Paper PDF or Scan'}
                </span>
                <span className="text-[10px] text-slate-500">
                  Max 500 KB • Scans/Photos auto-compressed
                </span>
              </label>
            </div>

            {uploadStatus && (
              <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{uploadStatus}</span>
              </div>
            )}

            {uploadError && (
              <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                  Document URL / Data Source *
                </label>
                <input
                  type="text"
                  required
                  value={form.fileUrl}
                  onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                  File Size (Max 500 KB)
                </label>
                <input
                  type="text"
                  value={form.fileSize || '350 KB'}
                  onChange={(e) => setForm({ ...form, fileSize: e.target.value })}
                  placeholder="e.g. 350 KB"
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden font-mono bg-white"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 -mx-6 -mb-6 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg"
            >
              Save Question Paper
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Notice Modal
export const NoticeModal: React.FC<{
  isOpen: boolean;
  notice: Notice | null;
  onSave: (data: Notice) => void;
  onClose: () => void;
}> = ({ isOpen, notice, onSave, onClose }) => {
  const [form, setForm] = useState<Notice>({
    id: '',
    title: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Academic',
    description: '',
    attachmentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    attachmentName: 'Official_Notification.pdf',
    isImportant: false,
    isArchived: false,
  });

  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [showManualUrl, setShowManualUrl] = useState<boolean>(false);

  useEffect(() => {
    if (notice) {
      setForm(notice);
      setShowManualUrl(!notice.attachmentUrl?.startsWith('data:'));
    } else {
      setForm({
        id: `not-${Date.now()}`,
        title: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Academic',
        description: '',
        attachmentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        attachmentName: 'Official_Notification.pdf',
        isImportant: false,
        isArchived: false,
      });
      setShowManualUrl(false);
    }
    setUploadStatus('');
    setUploadError('');
    setIsProcessingFile(false);
  }, [notice, isOpen]);

  if (!isOpen) return null;

  // Handle Photo / PDF Upload with 350 KB limit & auto-compression for images
  const handleNoticeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus('');
    setUploadError('');
    setIsProcessingFile(true);

    const MAX_ALLOWED_BYTES = 350 * 1024; // 350 KB
    const originalKb = Math.round(file.size / 1024);

    // If it's an image/photo (jpg, jpeg, png, webp, gif)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          let quality = 0.88;

          // Dimension scaling if photo is huge
          const maxDim = 1500;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          // If already within 350 KB limit, preserve original image data and format untouched
          if (originalKb <= 350) {
            setForm((prev) => ({
              ...prev,
              attachmentUrl: event.target?.result as string,
              attachmentName: file.name,
            }));
            setUploadStatus(`✓ Photo attached in original format (${file.name}): ${originalKb} KB.`);
            setIsProcessingFile(false);
            return;
          }

          const outputMime = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
          if (!ctx) {
            setUploadError('Failed to initialize canvas for image compression.');
            setIsProcessingFile(false);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          let dataUrl = canvas.toDataURL(outputMime, quality);
          let byteSize = Math.round((dataUrl.length * 3) / 4);

          // Compress down iteratively until <= 350 KB
          while (byteSize > MAX_ALLOWED_BYTES && quality > 0.15) {
            quality -= 0.12;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
            byteSize = Math.round((dataUrl.length * 3) / 4);
          }

          // If still slightly over, scale down dimensions
          if (byteSize > MAX_ALLOWED_BYTES) {
            let scale = 0.8;
            while (byteSize > MAX_ALLOWED_BYTES && scale > 0.25) {
              const scaledCanvas = document.createElement('canvas');
              scaledCanvas.width = Math.max(200, Math.round(width * scale));
              scaledCanvas.height = Math.max(200, Math.round(height * scale));
              const sCtx = scaledCanvas.getContext('2d');
              if (sCtx) {
                sCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
                dataUrl = scaledCanvas.toDataURL('image/jpeg', 0.65);
                byteSize = Math.round((dataUrl.length * 3) / 4);
              }
              scale -= 0.15;
            }
          }

          const finalKb = Math.round(byteSize / 1024);
          setForm((prev) => ({
            ...prev,
            attachmentUrl: dataUrl,
            attachmentName: file.name || `Notice_Photo_${Date.now()}.jpg`,
          }));

          if (originalKb > 350) {
            setUploadStatus(
              `⚡ Compressed photo from ${originalKb} KB to ${finalKb} KB (within 350 KB limit).`
            );
          } else {
            setUploadStatus(`✓ Photo attached successfully: ${finalKb} KB (within 350 KB limit).`);
          }
          setIsProcessingFile(false);
        };

        img.onerror = () => {
          setUploadError('Could not process image file. Please try another JPG/PNG photo.');
          setIsProcessingFile(false);
        };
        img.src = event.target?.result as string;
      };

      reader.onerror = () => {
        setUploadError('Could not read file from disk.');
        setIsProcessingFile(false);
      };
      reader.readAsDataURL(file);
      return;
    }

    // If it's a PDF file
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      if (file.size > MAX_ALLOWED_BYTES) {
        setUploadError(
          `Selected PDF is ${originalKb} KB, which exceeds the maximum limit of 350 KB. Please select a compressed PDF (≤ 350 KB) or upload as a photo/scan (JPG/PNG), which is automatically compressed.`
        );
        setIsProcessingFile(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setForm((prev) => ({
            ...prev,
            attachmentUrl: reader.result as string,
            attachmentName: file.name || `Notice_Document_${Date.now()}.pdf`,
          }));
          setUploadStatus(`✓ PDF document attached: ${originalKb} KB (within 350 KB limit).`);
          setIsProcessingFile(false);
        }
      };
      reader.onerror = () => {
        setUploadError('Could not read PDF file.');
        setIsProcessingFile(false);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Unsupported type
    setUploadError(
      `Unsupported format (${file.type || 'unknown'}). Supported formats: PDF, JPG, JPEG, PNG, WEBP.`
    );
    setIsProcessingFile(false);
  };

  const isCurrentAttachmentImage =
    form.attachmentUrl?.startsWith('data:image/') ||
    Boolean(form.attachmentUrl?.match(/\.(jpeg|jpg|png|webp|gif)($|\?)/i));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-[#0b1a2f] text-white p-5 flex items-center justify-between">
          <h3 className="font-serif-academic text-base font-bold">
            {notice ? 'Edit Notice' : 'Publish Department Notice'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
            onClose();
          }}
          className="p-6 overflow-y-auto space-y-4 text-xs"
        >
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
              Notice Title *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              placeholder="e.g. Schedule for Mid-Term Examination 2026"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Date *
              </label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value as 'Academic' | 'Examination' | 'Seminar' | 'Notice' | 'Scholarship',
                  })
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              >
                <option value="Academic">Academic</option>
                <option value="Examination">Examination</option>
                <option value="Seminar">Seminar</option>
                <option value="Notice">Notice</option>
                <option value="Scholarship">Scholarship</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
              Description / Circular Body *
            </label>
            <textarea
              rows={4}
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Provide complete circular details, instructions, venue, and eligibility..."
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
            />
          </div>

          {/* NOTICE ATTACHMENT / PHOTO UPLOAD (PDF/JPG/JPEG/PNG UP TO 350 KB WITH AUTO-COMPRESSION) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block font-bold text-slate-800 uppercase text-[11px] flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Attach Notice Photo / Document (Max 350 KB)</span>
                </label>
                <span className="text-[10px] text-slate-500">
                  Supported formats: <strong>PDF, JPG, JPEG, PNG, WEBP</strong> (auto-compressed if required)
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowManualUrl(!showManualUrl)}
                className="text-[10px] text-blue-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <LinkIcon className="w-3 h-3" />
                <span>{showManualUrl ? 'Use File Upload' : 'Enter URL instead'}</span>
              </button>
            </div>

            {!showManualUrl ? (
              <div className="space-y-3">
                {/* Upload Input Dropzone */}
                <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 bg-white text-center transition">
                  <input
                    type="file"
                    id="notice-file-input"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,image/*,application/pdf"
                    onChange={handleNoticeFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="notice-file-input"
                    className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                  >
                    <div className="p-2 rounded-full bg-blue-50 text-blue-700">
                      {isProcessingFile ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                    </div>
                    <span className="font-bold text-slate-800 text-xs">
                      {isProcessingFile
                        ? 'Optimizing and compressing file...'
                        : 'Click to upload Photo or PDF'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Upload from phone or PC • Photos over 350 KB are automatically compressed
                    </span>
                  </label>
                </div>

                {/* Upload Status / Error feedback */}
                {uploadStatus && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{uploadStatus}</span>
                  </div>
                )}

                {uploadError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Active Attachment Preview */}
                {form.attachmentUrl && (
                  <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      {isCurrentAttachmentImage ? (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          <img
                            src={form.attachmentUrl}
                            alt="Notice Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {form.attachmentName || (isCurrentAttachmentImage ? 'Notice_Photo.jpg' : 'Notice_Document.pdf')}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                              isCurrentAttachmentImage
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {isCurrentAttachmentImage ? 'Photo' : 'PDF'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate">
                          Attached and ready to publish (Max 350 KB)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <label
                        htmlFor="notice-file-input"
                        className="px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-50 border border-blue-200 rounded cursor-pointer"
                      >
                        Change
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForm({ ...form, attachmentUrl: '', attachmentName: '' });
                          setUploadStatus('');
                          setUploadError('');
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Remove Attachment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700 text-[11px]">
                  Direct File / Document URL
                </label>
                <input
                  type="url"
                  value={form.attachmentUrl || ''}
                  onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
                  placeholder="https://example.com/notice.pdf"
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden bg-white"
                />
              </div>
            )}

            {/* Display Name Input */}
            <div>
              <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                Attachment Display Name
              </label>
              <input
                type="text"
                value={form.attachmentName || ''}
                onChange={(e) => setForm({ ...form, attachmentName: e.target.value })}
                placeholder="e.g. Official_Notice_Midterm_Assessment.pdf"
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isImportant}
                onChange={(e) => setForm({ ...form, isImportant: e.target.checked })}
                className="rounded text-amber-500"
              />
              <span className="font-bold text-slate-800">Mark as Urgent / Important</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isArchived}
                onChange={(e) => setForm({ ...form, isArchived: e.target.checked })}
                className="rounded text-slate-600"
              />
              <span className="font-semibold text-slate-600">Send to Archive</span>
            </label>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 -mx-6 -mb-6 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer transition shadow-xs"
            >
              {notice ? 'Save Changes' : 'Publish Department Notice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Committee Modal
export const CommitteeModal: React.FC<{
  isOpen: boolean;
  committee: Committee | null;
  onSave: (data: Committee) => void;
  onClose: () => void;
}> = ({ isOpen, committee, onSave, onClose }) => {
  const [form, setForm] = useState<Committee>({
    id: '',
    name: '',
    convener: '',
    members: '',
    designation: 'Convener',
    contactNumber: '',
    email: '',
    responsibilities: '',
    office: 'Department Office',
  });

  useEffect(() => {
    if (committee) {
      setForm(committee);
    } else {
      setForm({
        id: `com-${Date.now()}`,
        name: '',
        convener: '',
        members: '',
        designation: 'Convener',
        contactNumber: '+91 6646 230101',
        email: 'committee@panchayatcollege.edu.in',
        responsibilities: '',
        office: 'Department Office / Admin Block',
      });
    }
  }, [committee, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-[#0b1a2f] text-white p-5 flex items-center justify-between">
          <h3 className="font-serif-academic text-base font-bold">
            {committee ? 'Edit Committee' : 'Add Committee'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
            onClose();
          }}
          className="p-6 overflow-y-auto space-y-4 text-xs"
        >
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
              Committee Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Convener / Chairperson *
              </label>
              <input
                type="text"
                required
                value={form.convener}
                onChange={(e) => setForm({ ...form, convener: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Convener Designation
              </label>
              <input
                type="text"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
              Members & Representatives
            </label>
            <textarea
              rows={2}
              value={form.members}
              onChange={(e) => setForm({ ...form, members: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
              Core Responsibilities & Mandate *
            </label>
            <textarea
              rows={3}
              required
              value={form.responsibilities}
              onChange={(e) => setForm({ ...form, responsibilities: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Contact Number
              </label>
              <input
                type="text"
                value={form.contactNumber || ''}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Official Email
              </label>
              <input
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Office / Location
              </label>
              <input
                type="text"
                value={form.office}
                onChange={(e) => setForm({ ...form, office: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 -mx-6 -mb-6 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg"
            >
              Save Committee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Important Contact Modal
export const ContactModal: React.FC<{
  isOpen: boolean;
  contact: ImportantContact | null;
  onSave: (data: ImportantContact) => void;
  onClose: () => void;
}> = ({ isOpen, contact, onSave, onClose }) => {
  const [form, setForm] = useState<ImportantContact>({
    id: '',
    name: '',
    designation: '',
    office: '',
    phone: '',
    email: '',
    order: 1,
  });

  useEffect(() => {
    if (contact) {
      setForm(contact);
    } else {
      setForm({
        id: `cnt-${Date.now()}`,
        name: '',
        designation: '',
        office: '',
        phone: '+91 6646 230100',
        email: 'office@panchayatcollege.edu.in',
        order: 1,
      });
    }
  }, [contact, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-[#0b1a2f] text-white p-5 flex items-center justify-between">
          <h3 className="font-serif-academic text-base font-bold">
            {contact ? 'Edit Contact Entry' : 'Add Directory Contact'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
            onClose();
          }}
          className="p-6 overflow-y-auto space-y-4 text-xs"
        >
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
              Office or Official Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Designation *
              </label>
              <input
                type="text"
                required
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Office / Building *
              </label>
              <input
                type="text"
                required
                value={form.office}
                onChange={(e) => setForm({ ...form, office: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 -mx-6 -mb-6 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg"
            >
              Save Contact
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================= TIME TABLE SLOT MODAL =================
export const TimeTableSlotModal: React.FC<{
  isOpen: boolean;
  slot: TimeTableSlot | null;
  defaultCourse?: string;
  defaultYear?: string;
  defaultSemester?: string;
  defaultDay?: string;
  defaultPeriod?: number;
  existingSlots?: TimeTableSlot[];
  facultyList?: Faculty[];
  periodsList?: TimeTablePeriod[];
  onSave: (data: TimeTableSlot, targetDays?: DayOfWeek[]) => void;
  onClose: () => void;
}> = ({
  isOpen,
  slot,
  defaultCourse = 'UG NEP',
  defaultYear = '1st Year',
  defaultSemester = 'Semester I',
  defaultDay = 'Monday',
  defaultPeriod = 1,
  existingSlots = [],
  facultyList = [],
  periodsList = [],
  onSave,
  onClose,
}) => {
  const getTimesForPeriod = (pNum: number) => {
    if (periodsList && periodsList.length > 0) {
      const found = periodsList.find((p) => p.periodNumber === pNum);
      if (found) {
        return { start: found.startTime, end: found.endTime };
      }
    }
    switch (pNum) {
      case 1:
        return { start: '09:15 AM', end: '10:00 AM' };
      case 2:
        return { start: '10:00 AM', end: '10:45 AM' };
      case 3:
        return { start: '10:45 AM', end: '11:30 AM' };
      case 4:
        return { start: '11:30 AM', end: '12:15 PM' };
      case 5:
        return { start: '12:15 PM', end: '01:00 PM' };
      case 6:
        return { start: '01:00 PM', end: '01:45 PM' };
      case 7:
        return { start: '01:45 PM', end: '02:30 PM' };
      case 8:
        return { start: '02:30 PM', end: '03:15 PM' };
      case 9:
        return { start: '03:15 PM', end: '04:00 PM' };
      case 10:
        return { start: '04:00 PM', end: '04:45 PM' };
      case 11:
        return { start: '04:45 PM', end: '05:30 PM' };
      default:
        return { start: '09:15 AM', end: '10:00 AM' };
    }
  };

  const initialTimes = getTimesForPeriod(defaultPeriod || 1);

  const availableFacultyNames = useMemo(() => {
    // Keep ONLY the names available in faculty page, remove all other faculty names
    if (facultyList && facultyList.length > 0) {
      const names = facultyList.map((f) => f.name.trim()).filter(Boolean);
      return Array.from(new Set(names));
    }
    // Fallback to the initial faculty page names if facultyList is not yet loaded
    return [
      'Mr. Mrutyunjay Malik (Head of Department)',
      'Dr. (Mrs.) S. R. Sahoo',
      'Sri B. C. Pradhan',
      'Dr. P. K. Dash',
      'Ms. M. K. Meher',
      'Sri D. N. Behera',
    ];
  }, [facultyList]);

  const defaultFacultyName = availableFacultyNames[0] || 'Mr. Mrutyunjay Malik (Head of Department)';

  const [form, setForm] = useState<TimeTableSlot>({
    id: '',
    course: defaultCourse,
    yearLevel: defaultYear,
    semester: defaultSemester,
    dayOfWeek: (defaultDay as any) || 'Monday',
    periodNumber: defaultPeriod || 1,
    startTime: initialTimes.start,
    endTime: initialTimes.end,
    paperCode: '',
    subjectName: '',
    roomNo: 'Room 104',
    facultyName: defaultFacultyName,
    type: 'Lecture',
    notes: '',
  });

  // Multiple days selection for scheduling same class on multiple days
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([
    (defaultDay as any) || 'Monday',
  ]);

  // Dynamic semesters according to Year Level
  const availableSemesters = useMemo(() => {
    switch (form.yearLevel) {
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
  }, [form.yearLevel]);

  // Live multi-day conflict detection
  const conflictsByDay = useMemo(() => {
    if (!existingSlots || existingSlots.length === 0) return [];
    const results: { day: DayOfWeek; message: string; conflictSlot: TimeTableSlot }[] = [];
    for (const d of selectedDays) {
      const res = checkFacultyConflict(existingSlots, {
        id: slot && slot.dayOfWeek === d ? slot.id : undefined,
        facultyName: form.facultyName,
        dayOfWeek: d,
        periodNumber: form.periodNumber,
        startTime: form.startTime,
        endTime: form.endTime,
        course: form.course,
        yearLevel: form.yearLevel,
        semester: form.semester,
      });
      if (res.hasConflict && res.conflictSlot) {
        results.push({
          day: d,
          message: res.message || `${form.facultyName} has a clash on ${d}`,
          conflictSlot: res.conflictSlot,
        });
      }
    }
    return results;
  }, [
    existingSlots,
    selectedDays,
    slot,
    form.facultyName,
    form.periodNumber,
    form.startTime,
    form.endTime,
    form.course,
    form.yearLevel,
    form.semester,
  ]);

  useEffect(() => {
    if (slot) {
      setForm(slot);
      setSelectedDays([slot.dayOfWeek]);
    } else {
      const times = getTimesForPeriod(defaultPeriod || 1);
      const chosenDay = (defaultDay as any) || 'Monday';
      setForm({
        id: `tt-${Date.now()}`,
        course: defaultCourse,
        yearLevel: defaultYear,
        semester: defaultSemester,
        dayOfWeek: chosenDay,
        periodNumber: defaultPeriod || 1,
        startTime: times.start,
        endTime: times.end,
        paperCode: '',
        subjectName: '',
        roomNo: 'Room 104',
        facultyName: defaultFacultyName,
        type: 'Lecture',
        notes: '',
      });
      setSelectedDays([chosenDay]);
    }
  }, [slot, isOpen, defaultCourse, defaultYear, defaultSemester, defaultDay, defaultPeriod]);

  if (!isOpen) return null;

  const ALL_DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="bg-[#0b1a2f] text-white p-5 flex items-center justify-between">
          <div>
            <h3 className="font-serif-academic text-base font-bold">
              {slot ? 'Edit Timetable Slot' : 'Add Timetable Slot / Class'}
            </h3>
            <p className="text-xs text-slate-300">
              Department of Mathematics • Class Schedule & Multi-Day Allocation
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (conflictsByDay.length > 0) {
              return;
            }
            if (selectedDays.length === 0) {
              alert('Please select at least one day for this class.');
              return;
            }
            // Ensure form.dayOfWeek matches the first selected day
            const submission = { ...form, dayOfWeek: selectedDays[0] };
            onSave(submission, selectedDays);
            onClose();
          }}
          className="p-6 overflow-y-auto space-y-4 text-xs"
        >
          {/* Multi-Day Conflict Alert Banner */}
          {conflictsByDay.length > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs space-y-2 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-rose-950 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  Faculty Schedule Conflict Detected on {conflictsByDay.length} Day
                  {conflictsByDay.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-rose-800">
                {conflictsByDay.map((c) => (
                  <div
                    key={c.day}
                    className="flex items-start justify-between gap-2 bg-white/70 p-2 rounded-lg border border-rose-200"
                  >
                    <div>
                      <strong className="text-rose-950 block">{c.day}:</strong>
                      <span>{c.message}</span>
                    </div>
                    {selectedDays.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSelectedDays((prev) => prev.filter((d) => d !== c.day))}
                        className="text-[10px] font-bold text-rose-700 hover:text-rose-900 underline shrink-0 mt-0.5"
                      >
                        Uncheck {c.day}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-rose-700 italic">
                Rule: A faculty cannot be assigned two classes at the same time. Uncheck the conflicting day(s) or adjust timings to proceed.
              </div>
            </div>
          )}

          {/* Academic Program Hierarchy */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Course *
              </label>
              <select
                value={form.course}
                onChange={(e) => {
                  const newCourse = e.target.value;
                  const newYear =
                    newCourse === 'PG' && (form.yearLevel === '3rd Year' || form.yearLevel === '4th Year')
                      ? '1st Year'
                      : form.yearLevel;
                  setForm({ ...form, course: newCourse, yearLevel: newYear });
                }}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden bg-white"
              >
                <option value="UG NEP">UG NEP (4-Yr)</option>
                <option value="UG AEDP">UG AEDP</option>
                <option value="PG">PG (M.Sc.)</option>
                <option value="UG CBCS">UG CBCS</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Year Level *
              </label>
              <select
                value={form.yearLevel}
                onChange={(e) => {
                  const y = e.target.value;
                  const defaultSem =
                    y === '1st Year'
                      ? 'Semester I'
                      : y === '2nd Year'
                      ? 'Semester III'
                      : y === '3rd Year'
                      ? 'Semester V'
                      : 'Semester VII';
                  setForm({ ...form, yearLevel: y, semester: defaultSem });
                }}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden bg-white"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                {form.course !== 'PG' && <option value="3rd Year">3rd Year</option>}
                {form.course !== 'PG' && <option value="4th Year">4th Year</option>}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Semester *
              </label>
              <select
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden bg-white"
              >
                {availableSemesters.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* MULTI-DAY SELECTION SECTION */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block font-bold text-slate-800 uppercase text-[11px]">
                📅 Select Day(s) for this Class * ({selectedDays.length} day{selectedDays.length === 1 ? '' : 's'} selected)
              </label>
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setSelectedDays([...ALL_DAYS])}
                  className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold border border-amber-300 transition cursor-pointer"
                >
                  All 6 Days (Mon–Sat)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDays(['Monday', 'Wednesday', 'Friday'])}
                  className="px-1.5 py-0.5 rounded bg-white hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200 transition cursor-pointer"
                >
                  MWF
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDays(['Tuesday', 'Thursday', 'Saturday'])}
                  className="px-1.5 py-0.5 rounded bg-white hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200 transition cursor-pointer"
                >
                  TTS
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])}
                  className="px-1.5 py-0.5 rounded bg-white hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200 transition cursor-pointer"
                >
                  Mon–Fri
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
              {ALL_DAYS.map((d) => {
                const isSelected = selectedDays.includes(d);
                const hasDayConflict = conflictsByDay.some((c) => c.day === d);
                return (
                  <button
                    type="button"
                    key={d}
                    onClick={() => {
                      if (isSelected) {
                        if (selectedDays.length === 1) return; // Must keep at least one
                        setSelectedDays(selectedDays.filter((x) => x !== d));
                      } else {
                        setSelectedDays([...selectedDays, d]);
                      }
                    }}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition flex flex-col items-center gap-0.5 cursor-pointer border ${
                      hasDayConflict
                        ? 'bg-rose-100 text-rose-900 border-rose-400 ring-1 ring-rose-400'
                        : isSelected
                        ? 'bg-[#0b1a2f] text-white border-[#0b1a2f] shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <span>{d.slice(0, 3)}</span>
                    <span className="text-[9px] font-normal opacity-85">
                      {isSelected ? '✓ Added' : '+ Add'}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500">
              💡 Option: Select multiple days above to instantly schedule this exact class across all selected days without re-entering details!
            </p>
          </div>

          {/* Period & Session Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Period # (I to XI) *
              </label>
              <select
                value={form.periodNumber || 1}
                onChange={(e) => {
                  const pNum = parseInt(e.target.value) || 1;
                  const times = getTimesForPeriod(pNum);
                  setForm({
                    ...form,
                    periodNumber: pNum,
                    startTime: times.start,
                    endTime: times.end,
                  });
                }}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden bg-white"
              >
                {periodsList && periodsList.length > 0 ? (
                  periodsList.map((p) => (
                    <option key={p.id || p.periodNumber} value={p.periodNumber}>
                      {p.label} ({p.startTime} – {p.endTime})
                    </option>
                  ))
                ) : (
                  <>
                    <option value={1}>Period I (09:15 - 10:00 AM)</option>
                    <option value={2}>Period II (10:00 - 10:45 AM)</option>
                    <option value={3}>Period III (10:45 - 11:30 AM)</option>
                    <option value={4}>Period IV (11:30 - 12:15 PM)</option>
                    <option value={5}>Period V (12:15 - 01:00 PM)</option>
                    <option value={6}>Period VI (01:00 - 01:45 PM)</option>
                    <option value={7}>Period VII (01:45 - 02:30 PM)</option>
                    <option value={8}>Period VIII (02:30 - 03:15 PM)</option>
                    <option value={9}>Period IX (03:15 - 04:00 PM)</option>
                    <option value={10}>Period X (04:00 - 04:45 PM)</option>
                    <option value={11}>Period XI (04:45 - 05:30 PM)</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Session Type *
              </label>
              <select
                value={form.type}
                onChange={(e) => {
                  const newType = e.target.value as any;
                  const startP = form.periodNumber || 1;
                  if (newType === 'Practical / Lab') {
                    const spanToUse = (!form.spanPeriods || form.spanPeriods === 1) ? 2 : form.spanPeriods;
                    const endP = startP + spanToUse - 1;
                    const endTimes = getTimesForPeriod(endP);
                    setForm({
                      ...form,
                      type: newType,
                      spanPeriods: spanToUse,
                      endTime: endTimes.end,
                    });
                  } else {
                    // Switching away from Practical/Lab restores single period cell
                    const singleTimes = getTimesForPeriod(startP);
                    setForm({
                      ...form,
                      type: newType,
                      spanPeriods: 1,
                      endTime: singleTimes.end,
                    });
                  }
                }}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden bg-white font-semibold text-slate-800"
              >
                <option value="Lecture">Lecture (1 Cell)</option>
                <option value="Practical / Lab">Practical / Lab (2+ Merged Cells)</option>
                <option value="Tutorial">Tutorial (1 Cell)</option>
                <option value="Seminar">Seminar (1 Cell)</option>
              </select>
            </div>
          </div>

          {/* CELL MERGING & DURATION SPAN CONTROL - ONLY DISPLAYED FOR PRACTICAL / LAB SESSIONS */}
          {form.type === 'Practical / Lab' ? (
            <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200/90 space-y-2 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block font-bold text-amber-950 uppercase text-[11px] flex items-center gap-1.5">
                  <span>🧪 Practical / Lab Cell Merger &amp; Span</span>
                  {(form.spanPeriods || 1) > 1 ? (
                    <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-950 font-extrabold text-[10px]">
                      Merged Across {form.spanPeriods} Consecutive Cells
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium text-[10px]">
                      Single Cell (1 Period)
                    </span>
                  )}
                </label>

                {(form.spanPeriods || 1) > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const times = getTimesForPeriod(form.periodNumber || 1);
                      setForm({
                        ...form,
                        spanPeriods: 1,
                        endTime: times.end,
                      });
                    }}
                    className="px-2.5 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] font-bold border border-rose-300 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="Unmerge cells and revert back to 1 period cell"
                  >
                    <span>✂️ Unmerge Cells (Restore 1 Period)</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 pt-1">
                {[1, 2, 3, 4, 5, 6].map((span) => {
                  const isSelected = (form.spanPeriods || 1) === span;
                  return (
                    <button
                      type="button"
                      key={span}
                      onClick={() => {
                        const startP = form.periodNumber || 1;
                        const endP = startP + span - 1;
                        const endTimes = getTimesForPeriod(endP);
                        setForm({
                          ...form,
                          spanPeriods: span,
                          endTime: endTimes.end,
                        });
                      }}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition flex flex-col items-center gap-0.5 cursor-pointer border ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs font-black'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <span>{span === 1 ? '1 Cell' : `Merge ${span}`}</span>
                      <span className="text-[10px] font-mono opacity-85">
                        {span === 1 ? '45 min' : `${span * 45} mins`}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-amber-900 font-medium">
                💡 Practical / Lab classes can merge 2, 3, 4, 5 or 6 cells across consecutive periods (e.g. Period III &amp; IV). Unmerging or removing a practical class automatically restores individual 1-period cells for all spanned periods.
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-500 text-[11px] flex items-center gap-2">
              <span>ℹ️ Cell merging option is exclusively available for <strong>Practical / Lab</strong> sessions.</span>
            </div>
          )}

          {/* Time Slot Interval */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Start Time *
              </label>
              <input
                type="text"
                required
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                placeholder="e.g. 10:00 AM"
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                End Time *
              </label>
              <input
                type="text"
                required
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                placeholder="e.g. 10:45 AM"
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden font-semibold"
              />
            </div>
          </div>

          {/* Paper Code & Subject Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Paper / Course Code *
              </label>
              <input
                type="text"
                required
                value={form.paperCode}
                onChange={(e) => setForm({ ...form, paperCode: e.target.value })}
                placeholder="e.g. MATH-CC-101"
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden font-mono uppercase"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Subject / Paper Title *
              </label>
              <input
                type="text"
                required
                value={form.subjectName}
                onChange={(e) => setForm({ ...form, subjectName: e.target.value })}
                placeholder="e.g. Calculus & Analytical Geometry"
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
          </div>

          {/* Room & Faculty In Charge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Classroom / Lab *
              </label>
              <input
                type="text"
                required
                value={form.roomNo}
                onChange={(e) => setForm({ ...form, roomNo: e.target.value })}
                placeholder="e.g. Room 104, Ramanujan Smart Classroom, Comp Lab"
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Faculty In Charge (From Faculty Page) *
              </label>
              <select
                value={form.facultyName}
                onChange={(e) => setForm({ ...form, facultyName: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden bg-white"
              >
                {availableFacultyNames.map((fn) => (
                  <option key={fn} value={fn}>
                    {fn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Faculty Availability Status Note */}
          {conflictsByDay.length === 0 && form.facultyName && (
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                <strong>{form.facultyName}</strong> is available on all <strong>{selectedDays.length} selected day{selectedDays.length === 1 ? '' : 's'}</strong> at <strong>{form.startTime} – {form.endTime}</strong>.
              </span>
            </div>
          )}

          {/* Optional Notes */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
              Classroom Notes / Topic Details
            </label>
            <input
              type="text"
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Unit-I Problem solving, Bring scientific calculators"
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
            />
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 -mx-6 -mb-6 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={conflictsByDay.length > 0}
              className={`px-5 py-2 font-bold rounded-lg transition ${
                conflictsByDay.length > 0
                  ? 'bg-rose-200 text-rose-700 border border-rose-300 cursor-not-allowed opacity-75'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-md'
              }`}
              title={
                conflictsByDay.length > 0
                  ? 'Cannot save: Resolve faculty conflict first'
                  : 'Save Slot'
              }
            >
              {conflictsByDay.length > 0
                ? 'Fix Faculty Conflict to Save'
                : selectedDays.length > 1
                ? `Save Class to ${selectedDays.length} Days (${selectedDays.map((d) => d.slice(0, 3)).join(', ')})`
                : `Save Class (${selectedDays[0]})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================= TIME TABLE PERIOD MODAL (ADD / EDIT) =================
export const TimeTablePeriodModal: React.FC<{
  isOpen: boolean;
  period: TimeTablePeriod | null;
  existingPeriods: TimeTablePeriod[];
  onSave: (period: TimeTablePeriod) => void;
  onClose: () => void;
}> = ({ isOpen, period, existingPeriods, onSave, onClose }) => {
  const toRoman = (num: number) => {
    const romanNumerals: [number, string][] = [
      [10, 'X'],
      [9, 'IX'],
      [5, 'V'],
      [4, 'IV'],
      [1, 'I'],
    ];
    let result = '';
    let n = num;
    if (n === 11) return 'XI';
    if (n === 12) return 'XII';
    for (const [val, sym] of romanNumerals) {
      while (n >= val) {
        result += sym;
        n -= val;
      }
    }
    return result || `${num}`;
  };

  const nextNumber = useMemo(() => {
    if (period) return period.periodNumber;
    if (existingPeriods.length === 0) return 1;
    return Math.max(...existingPeriods.map((p) => p.periodNumber)) + 1;
  }, [period, existingPeriods]);

  const [form, setForm] = useState<TimeTablePeriod>({
    id: '',
    periodNumber: nextNumber,
    label: `Period ${toRoman(nextNumber)}`,
    startTime: '09:15 AM',
    endTime: '10:00 AM',
  });

  useEffect(() => {
    if (period) {
      setForm(period);
    } else {
      setForm({
        id: `period-${Date.now()}`,
        periodNumber: nextNumber,
        label: `Period ${toRoman(nextNumber)}`,
        startTime: '09:15 AM',
        endTime: '10:00 AM',
      });
    }
  }, [period, isOpen, nextNumber]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="bg-[#0b1a2f] text-white p-5 flex items-center justify-between">
          <div>
            <h3 className="font-serif-academic text-base font-bold">
              {period ? 'Edit Period Column' : 'Add New Period Column'}
            </h3>
            <p className="text-xs text-slate-300">
              Department Routine • Consistent for Monday through Saturday
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
            onClose();
          }}
          className="p-6 space-y-4 text-xs"
        >
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
              Period Order Number *
            </label>
            <input
              type="number"
              min={1}
              max={15}
              required
              value={form.periodNumber}
              onChange={(e) => {
                const num = parseInt(e.target.value) || 1;
                setForm({
                  ...form,
                  periodNumber: num,
                  label: period ? form.label : `Period ${toRoman(num)}`,
                });
              }}
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
              Period Label / Header Title *
            </label>
            <input
              type="text"
              required
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="e.g. Period I, Period VII, Period XI"
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Start Time *
              </label>
              <input
                type="text"
                required
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                placeholder="e.g. 10:00 AM"
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                End Time *
              </label>
              <input
                type="text"
                required
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                placeholder="e.g. 10:45 AM"
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
          </div>

          {/* Multi-day notice */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-[11px] flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              This period column will apply consistently across <strong>Monday through Saturday</strong> in the timetable.
            </span>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 -mx-6 -mb-6 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-md"
            >
              {period ? 'Update Period' : 'Add Period Column'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================= TIME TABLE CLASS ROW MODAL (ADD ROW) =================
export const TimeTableClassRowModal: React.FC<{
  isOpen: boolean;
  existingRows: TimeTableClassRow[];
  onSave: (row: TimeTableClassRow) => void;
  onClose: () => void;
}> = ({ isOpen, existingRows, onSave, onClose }) => {
  const [course, setCourse] = useState<string>('UG NEP');
  const [yearLevel, setYearLevel] = useState<string>('1st Year');
  const [semester, setSemester] = useState<string>('Semester I');
  const [section, setSection] = useState<string>('');

  const yearOptions = useMemo(() => {
    if (course === 'PG') return ['1st Year', '2nd Year'];
    return ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  }, [course]);

  const semesterOptions = useMemo(() => {
    switch (yearLevel) {
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
  }, [yearLevel]);

  const handleCourseChange = (newCourse: string) => {
    setCourse(newCourse);
    if (newCourse === 'PG' && yearLevel !== '1st Year' && yearLevel !== '2nd Year') {
      setYearLevel('1st Year');
      setSemester('Semester I');
    }
  };

  const handleYearChange = (newYear: string) => {
    setYearLevel(newYear);
    switch (newYear) {
      case '1st Year':
        setSemester('Semester I');
        break;
      case '2nd Year':
        setSemester('Semester III');
        break;
      case '3rd Year':
        setSemester('Semester V');
        break;
      case '4th Year':
        setSemester('Semester VII');
        break;
    }
  };

  const generatedLabel = `${course} - ${yearLevel} (${semester})${
    section.trim() ? ` [${section.trim()}]` : ''
  }`;

  const isDuplicate = existingRows.some(
    (r) =>
      r.course === course &&
      r.yearLevel === yearLevel &&
      r.semester === semester &&
      (r.section || '') === (section.trim() || '')
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="bg-[#0b1a2f] text-white p-5 flex items-center justify-between">
          <div>
            <h3 className="font-serif-academic text-base font-bold">
              Add Class / Semester Row
            </h3>
            <p className="text-xs text-slate-300">
              Add a new class row to the daily timetable grid
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (isDuplicate) return;
            onSave({
              id: `row-${Date.now()}`,
              course,
              yearLevel,
              semester,
              section: section.trim() || undefined,
              label: generatedLabel,
            });
            onClose();
          }}
          className="p-6 space-y-4 text-xs"
        >
          {isDuplicate && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>A row for this class, year, and semester already exists in the grid.</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
              Course / Academic Program *
            </label>
            <select
              value={course}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden bg-white"
            >
              <option value="UG NEP">UG NEP (4-Year Honours)</option>
              <option value="UG AEDP">UG AEDP</option>
              <option value="PG">PG (M.Sc. Mathematics)</option>
              <option value="UG CBCS">UG CBCS</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Year Level *
              </label>
              <select
                value={yearLevel}
                onChange={(e) => handleYearChange(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden bg-white"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Semester *
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden bg-white"
              >
                {semesterOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
              Section / Batch Tag (Optional)
            </label>
            <input
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="e.g. Section A, Honours Group, Practical Lab Batch"
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
            <span className="font-semibold block mb-0.5 text-[11px] text-slate-500 uppercase">
              Row Header Preview:
            </span>
            <span className="font-bold text-slate-900">{generatedLabel}</span>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 -mx-6 -mb-6 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDuplicate}
              className="px-5 py-2 font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Row to Grid
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================= SYLLABUS MODAL =================
export const SyllabusModal: React.FC<{
  isOpen: boolean;
  syllabus: Syllabus | null;
  defaultCourse?: string;
  onSave: (data: Syllabus) => void;
  onClose: () => void;
}> = ({ isOpen, syllabus, defaultCourse = 'UG NEP', onSave, onClose }) => {
  const [sourceType, setSourceType] = useState<'url' | 'pdf'>('url');
  const [form, setForm] = useState<Syllabus>({
    id: '',
    course: defaultCourse,
    yearLevel: '1st Year',
    semester: 'Semester I',
    session: '2025–26',
    admissionBatch: '2025–26',
    category: 'Major',
    title: '',
    paperCode: '',
    academicYear: '2025–26',
    credits: '4 Credits',
    fileType: 'url',
    fileUrl: '',
    fileName: '',
    fileSize: '',
  });

  const [pdfUploadName, setPdfUploadName] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compressionStatus, setCompressionStatus] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    setIsCompressing(false);
    setCompressionStatus(null);
    if (syllabus) {
      setForm(syllabus);
      setSourceType(syllabus.fileType === 'pdf' ? 'pdf' : 'url');
      setPdfUploadName(syllabus.fileName || '');
    } else {
      setForm({
        id: `syl-${Date.now()}`,
        course: defaultCourse === 'UG CBCS' ? 'UG NEP' : defaultCourse,
        yearLevel: '1st Year',
        semester: 'Semester I',
        session: '2025–26',
        admissionBatch: '2025–26',
        category: 'Major',
        title: '',
        paperCode: '',
        academicYear: '2025–26',
        credits: '4 Credits',
        fileType: 'url',
        fileUrl: '',
        fileName: '',
        fileSize: '',
      });
      setSourceType('url');
      setPdfUploadName('');
    }
  }, [syllabus, isOpen, defaultCourse]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressionStatus(null);
    setIsCompressing(true);

    try {
      const result = await processSyllabusFile(file, MAX_SYLLABUS_FILE_BYTES);
      if (result.success && result.dataUrl) {
        setPdfUploadName(result.fileName);
        setForm((prev) => ({
          ...prev,
          fileUrl: result.dataUrl!,
          fileName: result.fileName,
          fileSize: result.sizeStr,
          fileType: 'pdf',
          title: prev.title || result.fileName.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '),
        }));

        if (result.wasCompressed) {
          setCompressionStatus({
            type: 'success',
            message: `File auto-compressed from ${result.originalSizeStr} to ${result.sizeStr} (${result.compressionRatio || 0}% smaller) to fit strictly within 500 KB limit!`,
          });
        } else {
          setCompressionStatus({
            type: 'info',
            message: `File size: ${result.sizeStr} (Within 500 KB limit).`,
          });
        }
      } else {
        setPdfUploadName('');
        setForm((prev) => ({
          ...prev,
          fileUrl: '',
          fileName: '',
          fileSize: '',
        }));
        setCompressionStatus({
          type: 'error',
          message:
            result.errorMessage ||
            `File exceeds the 500 KB limit (${result.originalSizeStr}). Please select a document under 500 KB or use the URL Link option.`,
        });
      }
    } catch (err: any) {
      setPdfUploadName('');
      setForm((prev) => ({
        ...prev,
        fileUrl: '',
        fileName: '',
        fileSize: '',
      }));
      setCompressionStatus({
        type: 'error',
        message: `Error processing file: ${err?.message || 'Upload failed'}.`,
      });
    } finally {
      setIsCompressing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-[#0b1a2f] text-white p-5 flex items-center justify-between">
          <div>
            <h3 className="font-serif-academic text-base font-bold">
              {syllabus ? 'Edit Course Syllabus' : 'Add Course Syllabus'}
            </h3>
            <p className="text-xs text-slate-300">
              Academic Syllabi & Programs • NEP Curriculum Repository
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({
              ...form,
              title: `${form.course} ${form.category || 'Major'} Syllabus`,
              academicYear: form.admissionBatch || form.session || '2025–26',
              session: form.admissionBatch || form.session || '2025–26',
              admissionBatch: form.admissionBatch || form.session || '2025–26',
              fileType: sourceType,
            });
            onClose();
          }}
          className="p-6 overflow-y-auto space-y-4 text-xs"
        >
          {/* Options of Admission Batch, Course, Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Admission Batch *
              </label>
              <select
                value={form.admissionBatch || form.session || '2025–26'}
                onChange={(e) => setForm({ ...form, session: e.target.value, admissionBatch: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden bg-white"
              >
                <option value="2025–26">Batch 2025–26</option>
                <option value="2024–25">Batch 2024–25</option>
                <option value="2023–24">Batch 2023–24</option>
                <option value="2026–27">Batch 2026–27</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Course (UG NEP, UG AEDP, PG) *
              </label>
              <select
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden bg-white font-semibold"
              >
                <option value="UG NEP">UG NEP</option>
                <option value="UG AEDP">UG AEDP</option>
                <option value="PG">PG</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Category Tab *
              </label>
              <select
                value={form.category || 'Major'}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden bg-white font-semibold text-blue-900"
              >
                <option value="Major">Major</option>
                <option value="Minor">Minor</option>
                <option value="MDC">MDC</option>
                <option value="VAC">VAC</option>
                <option value="SEC">SEC</option>
                <option value="AEC">AEC</option>
                <option value="None">None (Display nothing to public)</option>
              </select>
            </div>
          </div>

          {/* TABS: Link in URL vs Upload PDF */}
          <div className="pt-2 border-t border-slate-200">
            <label className="block font-bold text-slate-700 uppercase mb-2 text-[11px]">
              Syllabus Source Format *
            </label>
            <div className="flex rounded-xl bg-slate-100 p-1 mb-3">
              <button
                type="button"
                onClick={() => setSourceType('url')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  sourceType === 'url'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Provide Link in URL</span>
              </button>
              <button
                type="button"
                onClick={() => setSourceType('pdf')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  sourceType === 'pdf'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Upload File in PDF Format</span>
              </button>
            </div>

            {sourceType === 'url' ? (
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <label className="block font-semibold text-slate-700 text-xs">
                  Syllabus Web Link / URL *
                </label>
                <input
                  type="url"
                  required={sourceType === 'url'}
                  value={form.fileUrl || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      fileUrl: e.target.value,
                      fileType: 'url',
                      fileName: 'Web Resource',
                      fileSize: 'Online URL',
                    })
                  }
                  placeholder="https://suniv.ac.in/syllabus/math-nep.pdf or https://drive.google.com/..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden font-mono bg-white"
                />
                <p className="text-[11px] text-slate-500">
                  Provide an official URL from Sambalpur University, SAMS, or cloud repository.
                </p>
              </div>
            ) : (
              <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <label className="block font-semibold text-slate-700 text-xs">
                    Choose Syllabus PDF File *
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    Max Limit: 500 KB • Auto-Compress
                  </span>
                </div>

                <input
                  type="file"
                  accept=".pdf,application/pdf,image/*"
                  disabled={isCompressing}
                  required={sourceType === 'pdf' && !form.fileUrl}
                  onChange={handleFileUpload}
                  className="w-full p-2 bg-white rounded-lg border border-slate-200 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-900 file:text-white hover:file:bg-blue-800 cursor-pointer disabled:opacity-50"
                />

                {/* Compression Progress */}
                {isCompressing && (
                  <div className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-xs font-semibold animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-700 shrink-0" />
                    <span>Compressing syllabus document to fit 500 KB limit...</span>
                  </div>
                )}

                {/* Compression Status Alert */}
                {compressionStatus && !isCompressing && (
                  <div
                    className={`p-2.5 rounded-lg text-xs flex items-start gap-2 border font-medium ${
                      compressionStatus.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : compressionStatus.type === 'info'
                        ? 'bg-blue-50 border-blue-200 text-blue-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    {compressionStatus.type === 'error' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    <div className="leading-relaxed">{compressionStatus.message}</div>
                  </div>
                )}

                {pdfUploadName && !isCompressing && (
                  <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-lg font-semibold">
                    <span className="truncate">📄 {pdfUploadName}</span>
                    <span className="font-mono text-[11px] text-emerald-800 bg-white border border-emerald-300 px-2 py-0.5 rounded ml-2 shrink-0">
                      {form.fileSize}
                    </span>
                  </div>
                )}
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  <strong>500 KB Limit:</strong> Documents over 500 KB are automatically compressed in-browser before saving to ensure rapid loading.
                </p>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 -mx-6 -mb-6 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isCompressing}
              className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCompressing || (sourceType === 'pdf' && !form.fileUrl)}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
            >
              {isCompressing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Compressing...</span>
                </>
              ) : (
                <span>Save Course Syllabus</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


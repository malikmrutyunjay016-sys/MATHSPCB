import React, { useState, useEffect } from 'react';
import { X, Check, AlertTriangle, Upload, Image } from 'lucide-react';
import { FacultyPhotoPicker } from './FacultyPhotoPicker';
import {
  Faculty,
  FacultyCategory,
  getFacultyCategory,
  Student,
  Facility,
  Book,
  QuestionPaper,
  Notice,
  Committee,
  ImportantContact,
} from '../types';

// Generic Delete Confirmation Modal
interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  itemName,
  onConfirm,
  onCancel,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
    } catch (err) {
      console.warn('ConfirmDeleteModal error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to permanently delete <strong>&ldquo;{itemName}&rdquo;</strong>? This action cannot be undone.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Permanently'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Faculty Modal
export const FacultyModal: React.FC<{
  isOpen: boolean;
  faculty: Faculty | null;
  existingFaculty?: Faculty[];
  onSave: (data: Faculty) => Promise<void> | void;
  onClose: () => void;
}> = ({ isOpen, faculty, existingFaculty = [], onSave, onClose }) => {
  const [form, setForm] = useState<Faculty>({
    id: '',
    name: '',
    designation: 'Assistant Professor',
    facultyType: 'regular',
    qualification: 'M.Sc., Ph.D.',
    specialization: 'Analysis / Algebra',
    email: '',
    phone: '',
    profile: '',
    publications: '',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    order: 1,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);
    setIsSubmitting(false);

    if (faculty) {
      const detectedCategory = getFacultyCategory(faculty);
      setForm({
        ...faculty,
        facultyType: faculty.facultyType || detectedCategory,
      });
    } else {
      const nextOrder =
        existingFaculty && existingFaculty.length > 0
          ? Math.max(...existingFaculty.map((f) => f.order || 0)) + 1
          : 1;
      setForm({
        id: `fac-${Date.now()}`,
        name: '',
        designation: 'Assistant Professor',
        facultyType: 'regular',
        qualification: 'M.Sc., Ph.D.',
        specialization: 'Analysis / Algebra',
        email: '',
        phone: '+91 6646 230101',
        profile: '',
        publications: '',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        order: nextOrder,
      });
    }
  }, [faculty, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = (form.name || '').trim();
    if (!cleanName) {
      setErrorMessage('Faculty member full name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const cleanDesignation = (form.designation || '').trim() || 'Assistant Professor';
      const cleanQualification = (form.qualification || '').trim() || 'M.Sc., Ph.D.';
      const cleanSpecialization = (form.specialization || '').trim() || 'Pure & Applied Mathematics';
      const cleanEmail = (form.email || '').trim() || `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}@pcollege.edu.in`;
      const detectedCategory = form.facultyType || getFacultyCategory({ designation: cleanDesignation });

      const finalFaculty: Faculty = {
        ...form,
        id: form.id || `fac-${Date.now()}`,
        name: cleanName,
        designation: cleanDesignation,
        facultyType: detectedCategory,
        qualification: cleanQualification,
        specialization: cleanSpecialization,
        email: cleanEmail,
        phone: (form.phone || '').trim(),
        profile: (form.profile || '').trim(),
        publications: (form.publications || '').trim(),
        photoUrl: form.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        order: Number(form.order) || 1,
      };

      await onSave(finalFaculty);
      onClose();
    } catch (err: any) {
      setErrorMessage(`Failed to save faculty record: ${err?.message || 'Please check network connection.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-[#0b1a2f] text-white p-5 flex items-center justify-between border-b border-slate-800">
          <h3 className="font-serif-academic text-base font-bold">
            {faculty ? 'Edit Faculty Member' : 'Add New Faculty Member'}
          </h3>
          <button onClick={onClose} disabled={isSubmitting} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-medium text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Faculty Category / Appointment Cadre Selector */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="block font-bold text-slate-700 uppercase text-[11px] tracking-wider">
                Faculty Cadre / Appointment Type *
              </label>
              <span className="text-[10.5px] text-slate-500">
                Choose appointment type
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Regular Faculty */}
              <button
                type="button"
                onClick={() => {
                  setForm((prev) => ({
                    ...prev,
                    facultyType: 'regular',
                    designation:
                      prev.designation.toLowerCase().includes('guest')
                        ? 'Assistant Professor'
                        : prev.designation,
                  }));
                }}
                className={`p-3 rounded-lg border text-left transition cursor-pointer flex items-center justify-between ${
                  form.facultyType === 'regular'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span className="font-bold text-xs">Regular</span>
                {form.facultyType === 'regular' && <Check className="w-4 h-4 text-blue-600" />}
              </button>

              {/* Guest Faculty */}
              <button
                type="button"
                onClick={() => {
                  setForm((prev) => ({
                    ...prev,
                    facultyType: 'guest',
                    designation:
                      prev.designation === 'Assistant Professor' ||
                      prev.designation.toLowerCase().includes('professor')
                        ? 'Guest Faculty'
                        : prev.designation || 'Guest Faculty',
                  }));
                }}
                className={`p-3 rounded-lg border text-left transition cursor-pointer flex items-center justify-between ${
                  form.facultyType === 'guest'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span className="font-bold text-xs">Guest Faculty</span>
                {form.facultyType === 'guest' && <Check className="w-4 h-4 text-amber-600" />}
              </button>
            </div>
          </div>

          {/* Order and Name */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Order # *
              </label>
              <input
                type="number"
                min={1}
                max={99}
                required
                value={form.order || 1}
                onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 1 })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:outline-hidden focus:bg-white"
                placeholder="1, 2, 3..."
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Card sequence
              </span>
            </div>
            <div className="sm:col-span-3">
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Dr. Ramesh Chandra Malik"
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
              Designation *
            </label>
            <input
              type="text"
              required
              value={form.designation}
              onChange={(e) => {
                const val = e.target.value;
                const cat = getFacultyCategory({ designation: val, facultyType: form.facultyType });
                setForm({ ...form, designation: val, facultyType: cat });
              }}
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              placeholder="e.g. Assistant Professor, Guest Faculty, etc."
            />

            {/* Quick Designation Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Quick Select:</span>
              {[
                { title: 'Assistant Professor', val: 'Assistant Professor', cat: 'regular' as FacultyCategory },
                { title: 'Associate Professor', val: 'Associate Professor', cat: 'regular' as FacultyCategory },
                { title: 'Professor', val: 'Professor', cat: 'regular' as FacultyCategory },
                { title: 'Assistant Professor & HOD', val: 'Assistant Professor & Head of Department', cat: 'regular' as FacultyCategory },
                { title: 'Guest Faculty', val: 'Guest Faculty', cat: 'guest' as FacultyCategory },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      designation: item.val,
                      facultyType: item.cat,
                    }));
                  }}
                  className={`text-[10.5px] px-2.5 py-1 rounded-full border transition cursor-pointer font-medium ${
                    form.designation === item.val
                      ? 'bg-blue-100 border-blue-500 text-blue-950 font-bold ring-1 ring-blue-400 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Qualifications
              </label>
              <input
                type="text"
                value={form.qualification || ''}
                onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                placeholder="e.g. M.Sc., Ph.D."
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Specialization / Research Area
              </label>
              <input
                type="text"
                value={form.specialization || ''}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                placeholder="e.g. Functional Analysis & Topology"
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Official Email
              </label>
              <input
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="e.g. ramesh.malik@pcollege.edu.in"
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Phone Number
              </label>
              <input
                type="text"
                value={form.phone || ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. +91 94370 12345"
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
          </div>

          {/* Faculty Photograph Picker (Computer / Google Drive / URL) */}
          <FacultyPhotoPicker
            value={form.photoUrl}
            onChange={(url) => setForm({ ...form, photoUrl: url })}
            label="Faculty Photograph"
            helperText="Import photo from Computer or paste Google Drive link"
          />

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
              Short Profile / Academic Overview
            </label>
            <textarea
              rows={3}
              value={form.profile || ''}
              onChange={(e) => setForm({ ...form, profile: e.target.value })}
              placeholder="Academic background, teaching experience, department duties..."
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
              Publications & Research Info
            </label>
            <textarea
              rows={2}
              value={form.publications || ''}
              onChange={(e) => setForm({ ...form, publications: e.target.value })}
              placeholder="Books authored, international journals, conferences..."
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
            />
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 -mx-6 -mb-6 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  <span>Saving Profile...</span>
                </>
              ) : (
                <span>Save Faculty Profile</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Student Modal
export const StudentModal: React.FC<{
  isOpen: boolean;
  student: Student | null;
  onSave: (data: Student) => void;
  onClose: () => void;
}> = ({ isOpen, student, onSave, onClose }) => {
  const [form, setForm] = useState<Student>({
    id: '',
    rollNumber: '',
    registrationNumber: '',
    name: '',
    fatherMotherName: '',
    gender: 'Female',
    dob: '2005-01-01',
    course: 'UG NEP',
    academicYear: '2026–27',
    yearLevel: '1st Year',
    semester: 'Semester I',
    mobile: '',
    email: '',
    address: 'Baragada, Odisha',
    admissionYear: '2024',
    category: 'GEN',
    academicStatus: 'Active',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  });

  useEffect(() => {
    if (student) {
      setForm(student);
    } else {
      setForm({
        id: `stu-${Date.now()}`,
        rollNumber: `MATH${new Date().getFullYear().toString().slice(-2)}-001`,
        registrationNumber: '',
        name: '',
        fatherMotherName: '',
        gender: 'Male',
        dob: '2005-01-01',
        course: 'UG NEP',
        academicYear: '2026–27',
        yearLevel: '1st Year',
        semester: 'Semester I',
        mobile: '+91 94370 00000',
        email: '',
        address: 'Baragada, Odisha',
        admissionYear: '2026',
        category: 'GEN',
        academicStatus: 'Active',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      });
    }
  }, [student, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-[#0b1a2f] text-white p-5 flex items-center justify-between border-b border-slate-800">
          <h3 className="font-serif-academic text-base font-bold">
            {student ? 'Edit Student Record' : 'Add New Student Record'}
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
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Roll Number *
              </label>
              <input
                type="text"
                required
                value={form.rollNumber}
                onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Barcode
              </label>
              <input
                type="text"
                value={form.barcode || ''}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                placeholder="e.g. 26BC1001"
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden font-mono text-indigo-700"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Registration Number
              </label>
              <input
                type="text"
                value={form.registrationNumber || ''}
                onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
              Applicant Name (Student Full Name) *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden font-semibold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Father Name
              </label>
              <input
                type="text"
                value={form.fatherName || ''}
                onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                placeholder="Father's full name"
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Mother Name
              </label>
              <input
                type="text"
                value={form.motherName || ''}
                onChange={(e) => setForm({ ...form, motherName: e.target.value })}
                placeholder="Mother's full name"
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Guardian / Combined Parent Name
              </label>
              <input
                type="text"
                value={form.fatherMotherName || ''}
                onChange={(e) => setForm({ ...form, fatherMotherName: e.target.value })}
                placeholder="e.g. Ramesh & Sunita Mohapatra"
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Aadhaar Number
              </label>
              <input
                type="text"
                value={form.aadhaarNumber || ''}
                onChange={(e) => setForm({ ...form, aadhaarNumber: e.target.value })}
                placeholder="e.g. 1234-5678-9012"
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Course / Program *
              </label>
              <select
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden font-bold text-blue-900"
              >
                <option value="UG NEP">UG NEP</option>
                <option value="UG AEDP">UG AEDP</option>
                <option value="UG CBCS">UG CBCS</option>
                <option value="PG">PG</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Academic Session *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 2026–27"
                value={form.academicYear}
                onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Year Level *
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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Gender
              </label>
              <select
                value={form.gender || 'Female'}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Category
              </label>
              <select
                value={form.category || 'GEN'}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              >
                <option value="GEN">GEN</option>
                <option value="OBC">OBC</option>
                <option value="SEBC">SEBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Status
              </label>
              <select
                value={form.academicStatus}
                onChange={(e) => setForm({ ...form, academicStatus: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              >
                <option value="Active">Active</option>
                <option value="Alumni">Alumni</option>
                <option value="Graduated">Graduated</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Mobile Phone
              </label>
              <input
                type="text"
                value={form.mobile || ''}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                Email Address
              </label>
              <input
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
              Residential Address
            </label>
            <input
              type="text"
              value={form.address || ''}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden"
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
              Save Student Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

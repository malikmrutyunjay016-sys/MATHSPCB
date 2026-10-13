import React, { useState, useMemo } from 'react';
import {
  Users,
  Mail,
  Phone,
  BookOpen,
  Award,
  Plus,
  Edit2,
  Trash2,
  Search,
  ExternalLink,
  GraduationCap,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Printer,
  Download,
  Calendar,
} from 'lucide-react';
import { Faculty, TimeTableSlot, TimeTablePeriod } from '../types';
import { useAuth } from '../context/AuthContext';
import { generatePrintableFacultyScheduleHtml, triggerDirectPrint } from '../utils/timeTableUtils';
import { initialPeriods } from '../data/initialData';

interface FacultyPageProps {
  faculty: Faculty[];
  timeTable?: TimeTableSlot[];
  periods?: TimeTablePeriod[];
  onAddFaculty: () => void;
  onEditFaculty: (faculty: Faculty) => void;
  onDeleteFaculty: (id: string, name: string) => void;
  onReorderFaculty?: (updatedList: Faculty[]) => void;
}

export const FacultyPage: React.FC<FacultyPageProps> = ({
  faculty,
  timeTable = [],
  periods = initialPeriods,
  onAddFaculty,
  onEditFaculty,
  onDeleteFaculty,
  onReorderFaculty,
}) => {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);

  // Strictly sort faculty by their order number
  const sortedFaculty = useMemo(() => {
    return [...faculty].sort((a, b) => {
      const orderA = typeof a.order === 'number' ? a.order : 999;
      const orderB = typeof b.order === 'number' ? b.order : 999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [faculty]);

  const filteredFaculty = useMemo(() => {
    return sortedFaculty.filter(
      (f) =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.qualification.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedFaculty, searchTerm]);

  const handleMoveOrder = (member: Faculty, direction: 'up' | 'down') => {
    const currentIndex = sortedFaculty.findIndex((f) => f.id === member.id);
    if (currentIndex < 0) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedFaculty.length) return;

    const currentItem = sortedFaculty[currentIndex];
    const targetItem = sortedFaculty[targetIndex];

    const currentOrder = currentItem.order || currentIndex + 1;
    const targetOrder = targetItem.order || targetIndex + 1;

    // Swap orders
    const newCurrent = { ...currentItem, order: targetOrder };
    const newTarget = { ...targetItem, order: currentOrder };

    const updated = sortedFaculty.map((f) => {
      if (f.id === currentItem.id) return newCurrent;
      if (f.id === targetItem.id) return newTarget;
      return f;
    });

    if (onReorderFaculty) {
      onReorderFaculty(updated);
    }
  };

  const handleDirectOrderChange = (member: Faculty, newOrder: number) => {
    if (isNaN(newOrder) || newOrder < 1) return;
    const updated = faculty.map((f) => {
      if (f.id === member.id) {
        return { ...f, order: newOrder };
      }
      return f;
    });
    if (onReorderFaculty) {
      onReorderFaculty(updated);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              <span>Department Faculty Directory</span>
            </div>
            <h1 className="font-serif-academic text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0c2340]">
              Faculty Members & Academicians
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Our faculty members possess deep pedagogical dedication and specialized research expertise in pure and applied mathematics, nurturing students from core undergraduate fundamentals to advanced research.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isAdmin && (
              <button
                onClick={onAddFaculty}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Faculty Member</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, specialization, qualification..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-blue-600"
            />
          </div>

          <div className="text-xs text-slate-500">
            Showing <strong className="text-slate-900">{filteredFaculty.length}</strong> faculty profile{filteredFaculty.length === 1 ? '' : 's'} in order
          </div>
        </div>

        {/* Faculty Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFaculty.map((member, index) => (
            <div
              key={member.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between group relative"
            >
              <div>
                {/* Order Header Ribbon */}
                <div className="px-6 pt-4 pb-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isAdmin ? (
                      <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        <span className="text-[10px] font-black text-amber-950 uppercase tracking-wider">
                          Order #
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={member.order || index + 1}
                          onChange={(e) =>
                            handleDirectOrderChange(member, parseInt(e.target.value) || 1)
                          }
                          className="w-12 h-6 px-1 text-center font-mono font-bold text-xs bg-white text-slate-900 border border-amber-300 rounded focus:outline-hidden focus:ring-1 focus:ring-amber-500 shadow-2xs"
                          title="Enter number to order this faculty and keep cards in this order"
                        />
                      </div>
                    ) : (
                      <>
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-[#0c2340] text-amber-300 font-mono text-xs font-black tracking-wider shadow-2xs">
                          #{member.order || index + 1}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                          Faculty #{member.order || index + 1}
                        </span>
                      </>
                    )}
                  </div>

                  {isAdmin && onReorderFaculty && (
                    <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(member, 'up')}
                        disabled={index === 0}
                        className={`p-1 rounded text-slate-600 hover:text-blue-900 transition ${
                          index === 0 ? 'opacity-25 cursor-not-allowed' : 'hover:bg-slate-100 cursor-pointer'
                        }`}
                        title="Move Up in order"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(member, 'down')}
                        disabled={index === filteredFaculty.length - 1}
                        className={`p-1 rounded text-slate-600 hover:text-blue-900 transition ${
                          index === filteredFaculty.length - 1 ? 'opacity-25 cursor-not-allowed' : 'hover:bg-slate-100 cursor-pointer'
                        }`}
                        title="Move Down in order"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Photo & Profile Bar (NO NUMBERS ON PHOTO) */}
                <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/40 border-b border-slate-100 flex items-start gap-4">
                  <div className="shrink-0">
                    <img
                      src={member.photoUrl || '/faculty/mrutyunjay-malik.svg'}
                      alt={member.name}
                      className="w-20 h-20 rounded-xl object-cover border-2 border-white shadow-md group-hover:scale-105 transition-transform bg-slate-100"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/faculty/mrutyunjay-malik.svg';
                      }}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded inline-block mb-1">
                      {member.designation}
                    </span>
                    <h3 className="font-serif-academic text-base sm:text-lg font-bold text-[#0c2340] leading-snug">
                      {member.name}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      {member.qualification}
                    </p>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="p-6 space-y-4 text-xs">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Area of Specialization
                    </span>
                    <p className="text-slate-800 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {member.specialization}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Academic Overview
                    </span>
                    <p className="text-slate-600 leading-relaxed line-clamp-3">
                      {member.profile}
                    </p>
                  </div>

                  {member.publications && (
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        Research & Publications
                      </span>
                      <p className="text-slate-600 text-[11px] line-clamp-2 italic">
                        {member.publications}
                      </p>
                    </div>
                  )}

                  {/* Contact Badges */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5 text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                      <a
                        href={`mailto:${member.email}`}
                        className="truncate hover:text-blue-900 hover:underline"
                      >
                        {member.email}
                      </a>
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <a
                          href={`tel:${member.phone}`}
                          className="hover:text-emerald-900"
                        >
                          {member.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedFaculty(member)}
                    className="text-xs font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Full Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const html = generatePrintableFacultyScheduleHtml(member.name, timeTable, periods);
                      triggerDirectPrint(html);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-950 font-bold text-[11px] border border-sky-300/80 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    title={`Print or save ${member.name}'s individual weekly routine`}
                  >
                    <Printer className="w-3 h-3 text-sky-800" />
                    <span>Download Routine</span>
                  </button>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEditFaculty(member)}
                      className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
                      title="Edit Faculty & Order"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteFaculty(member.id, member.name)}
                      className="p-1.5 rounded-md hover:bg-rose-100 text-rose-600 transition"
                      title="Delete Faculty"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Faculty Profile Modal */}
      {selectedFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#0b1a2f] text-white p-6 flex items-start justify-between border-b border-slate-800">
              <div className="flex items-start gap-4">
                <img
                  src={selectedFaculty.photoUrl}
                  alt={selectedFaculty.name}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-amber-400"
                />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                    {selectedFaculty.designation}
                  </span>
                  <h3 className="font-serif-academic text-xl font-bold text-white">
                    {selectedFaculty.name}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {selectedFaculty.qualification}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedFaculty(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                  Specialization & Areas of Interest
                </h4>
                <p className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-blue-950 font-medium">
                  {selectedFaculty.specialization}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                  Academic & Professional Biography
                </h4>
                <p className="leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600">
                  {selectedFaculty.profile}
                </p>
              </div>

              {selectedFaculty.publications && (
                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600" />
                    Publications & Scholarly Research
                  </h4>
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 text-slate-800 leading-relaxed">
                    {selectedFaculty.publications}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Official Email
                  </span>
                  <a
                    href={`mailto:${selectedFaculty.email}`}
                    className="font-medium text-blue-800 hover:underline"
                  >
                    {selectedFaculty.email}
                  </a>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Contact Phone
                  </span>
                  <a
                    href={`tel:${selectedFaculty.phone}`}
                    className="font-medium text-emerald-800 hover:underline"
                  >
                    {selectedFaculty.phone || 'Available via Department Office'}
                  </a>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedFaculty(null)}
                className="px-5 py-2 bg-[#0c2340] hover:bg-blue-950 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

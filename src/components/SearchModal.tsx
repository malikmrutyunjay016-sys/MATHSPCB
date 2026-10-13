import React, { useState } from 'react';
import {
  X,
  Search,
  Users,
  GraduationCap,
  FileQuestion,
  BookOpen,
  Bell,
  Building2,
  Scale,
  ArrowRight,
} from 'lucide-react';
import {
  Faculty,
  Student,
  Book,
  QuestionPaper,
  Notice,
  Committee,
  Syllabus,
  TimeTableSlot,
} from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  faculty: Faculty[];
  students: Student[];
  books: Book[];
  pyq: QuestionPaper[];
  notices: Notice[];
  committees: Committee[];
  syllabuses?: Syllabus[];
  timeTable?: TimeTableSlot[];
  onNavigate: (tabId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  faculty,
  students,
  books,
  pyq,
  notices,
  committees,
  syllabuses = [],
  timeTable = [],
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const term = searchTerm.toLowerCase().trim();

  const filteredFaculty = term
    ? faculty.filter(
        (f) =>
          f.name.toLowerCase().includes(term) ||
          f.designation.toLowerCase().includes(term) ||
          f.specialization.toLowerCase().includes(term)
      )
    : [];

  const filteredStudents = term
    ? students.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.rollNumber.toLowerCase().includes(term) ||
          s.academicYear.toLowerCase().includes(term)
      )
    : [];

  const filteredBooks = term
    ? books.filter(
        (b) =>
          b.title.toLowerCase().includes(term) ||
          b.author.toLowerCase().includes(term) ||
          b.subject.toLowerCase().includes(term)
      )
    : [];

  const filteredPYQ = term
    ? pyq.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.subject.toLowerCase().includes(term) ||
          p.academicYear.toLowerCase().includes(term) ||
          p.paperCode.toLowerCase().includes(term)
      )
    : [];

  const filteredNotices = term
    ? notices.filter(
        (n) =>
          n.title.toLowerCase().includes(term) ||
          n.category.toLowerCase().includes(term) ||
          n.description.toLowerCase().includes(term)
      )
    : [];

  const filteredCommittees = term
    ? committees.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.convener.toLowerCase().includes(term)
      )
    : [];

  const filteredSyllabuses = term
    ? syllabuses.filter(
        (s) =>
          s.category !== 'None' &&
          ((s.title && s.title.toLowerCase().includes(term)) ||
            (s.category && s.category.toLowerCase().includes(term)) ||
            (s.paperCode && s.paperCode.toLowerCase().includes(term)) ||
            s.course.toLowerCase().includes(term) ||
            (s.description && s.description.toLowerCase().includes(term)))
      )
    : [];

  const filteredTimeTable = term
    ? timeTable.filter(
        (t) =>
          t.subjectName.toLowerCase().includes(term) ||
          t.paperCode.toLowerCase().includes(term) ||
          t.facultyName.toLowerCase().includes(term) ||
          t.roomNo.toLowerCase().includes(term)
      )
    : [];

  const totalResults =
    filteredFaculty.length +
    filteredStudents.length +
    filteredBooks.length +
    filteredPYQ.length +
    filteredNotices.length +
    filteredCommittees.length +
    filteredSyllabuses.length +
    filteredTimeTable.length;

  const handleSelectResult = (tabId: string) => {
    onNavigate(tabId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search faculty, students, question papers, library books..."
            className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden"
            autoFocus
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-slate-400 hover:text-slate-600 px-1"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!term ? (
            <div className="text-center py-10 text-slate-400 text-xs space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-300" />
              <p>Type keywords to search across the entire Mathematics portal</p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <span
                  onClick={() => setSearchTerm('Real Analysis')}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] cursor-pointer"
                >
                  Real Analysis
                </span>
                <span
                  onClick={() => setSearchTerm('Calculus')}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] cursor-pointer"
                >
                  Calculus
                </span>
                <span
                  onClick={() => setSearchTerm('Assessment')}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] cursor-pointer"
                >
                  Assessment
                </span>
                <span
                  onClick={() => setSearchTerm('2026')}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] cursor-pointer"
                >
                  2026 Batch
                </span>
              </div>
            </div>
          ) : totalResults === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No results found for &ldquo;{searchTerm}&rdquo;. Try another term.
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Faculty Matches */}
              {filteredFaculty.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    Faculty ({filteredFaculty.length})
                  </h4>
                  <div className="space-y-1">
                    {filteredFaculty.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => handleSelectResult('faculty')}
                        className="p-2.5 rounded-lg hover:bg-blue-50 border border-slate-100 hover:border-blue-200 cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{f.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {f.designation} • {f.specialization}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Student Matches */}
              {filteredStudents.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                    Students ({filteredStudents.length})
                  </h4>
                  <div className="space-y-1">
                    {filteredStudents.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => handleSelectResult('students')}
                        className="p-2.5 rounded-lg hover:bg-amber-50 border border-slate-100 hover:border-amber-200 cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{s.name}</p>
                          <p className="text-[11px] text-slate-500">
                            Roll: {s.rollNumber} • {s.yearLevel} ({s.academicYear})
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Syllabus Matches */}
              {filteredSyllabuses.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    Course Syllabi ({filteredSyllabuses.length})
                  </h4>
                  <div className="space-y-1">
                    {filteredSyllabuses.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => handleSelectResult('syllabus')}
                        className="p-2.5 rounded-lg hover:bg-blue-50 border border-slate-100 hover:border-blue-200 cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">
                            {s.course} {s.category ? `${s.category} Syllabus` : s.title}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {s.course} {s.category ? `• ${s.category}` : ''} {(s.admissionBatch || s.session) ? `• Batch ${s.admissionBatch || s.session}` : ''}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Time Table Matches */}
              {filteredTimeTable.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
                    <FileQuestion className="w-3.5 h-3.5 text-teal-600" />
                    Time Table Periods ({filteredTimeTable.length})
                  </h4>
                  <div className="space-y-1">
                    {filteredTimeTable.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleSelectResult('timetable')}
                        className="p-2.5 rounded-lg hover:bg-teal-50 border border-slate-100 hover:border-teal-200 cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">
                            {t.subjectName} ({t.paperCode})
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {t.course} • {t.dayOfWeek} • {t.startTime}–{t.endTime} ({t.facultyName})
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PYQ Matches */}
              {filteredPYQ.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
                    <FileQuestion className="w-3.5 h-3.5 text-indigo-600" />
                    Previous Year Questions ({filteredPYQ.length})
                  </h4>
                  <div className="space-y-1">
                    {filteredPYQ.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectResult('pyq')}
                        className="p-2.5 rounded-lg hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{p.title}</p>
                          <p className="text-[11px] text-slate-500">
                            {p.academicYear} • {p.semester} ({p.paperCode})
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Books Matches */}
              {filteredBooks.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    Library Books ({filteredBooks.length})
                  </h4>
                  <div className="space-y-1">
                    {filteredBooks.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => handleSelectResult('library')}
                        className="p-2.5 rounded-lg hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{b.title}</p>
                          <p className="text-[11px] text-slate-500">
                            By {b.author} • Subject: {b.subject}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notices Matches */}
              {filteredNotices.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-rose-600" />
                    Notices ({filteredNotices.length})
                  </h4>
                  <div className="space-y-1">
                    {filteredNotices.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleSelectResult('notices')}
                        className="p-2.5 rounded-lg hover:bg-rose-50 border border-slate-100 hover:border-rose-200 cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{n.title}</p>
                          <p className="text-[11px] text-slate-500">
                            {n.date} • {n.category}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Committees Matches */}
              {filteredCommittees.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-purple-600" />
                    Committees ({filteredCommittees.length})
                  </h4>
                  <div className="space-y-1">
                    {filteredCommittees.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectResult('committees')}
                        className="p-2.5 rounded-lg hover:bg-purple-50 border border-slate-100 hover:border-purple-200 cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{c.name}</p>
                          <p className="text-[11px] text-slate-500">Convener: {c.convener}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-3 border-t border-slate-200 text-center text-[11px] text-slate-400">
          Showing results from live Department Firestore database
        </div>
      </div>
    </div>
  );
};

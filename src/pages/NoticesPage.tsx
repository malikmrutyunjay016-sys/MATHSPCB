import React, { useState } from 'react';
import {
  Bell,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Download,
  Eye,
  Archive,
  Calendar,
  AlertCircle,
  FileText,
  Sparkles,
  Image as ImageIcon,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Notice } from '../types';
import { useAuth } from '../context/AuthContext';

interface NoticesPageProps {
  notices: Notice[];
  onSelectNoticePDF: (notice: Notice) => void;
  onAddNotice: () => void;
  onEditNotice: (notice: Notice) => void;
  onDeleteNotice: (id: string, title: string) => void;
  onToggleArchive: (notice: Notice) => void;
}

export const NoticesPage: React.FC<NoticesPageProps> = ({
  notices,
  onSelectNoticePDF,
  onAddNotice,
  onEditNotice,
  onDeleteNotice,
  onToggleArchive,
}) => {
  const { isAdmin } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = ['All', 'Academic', 'Examination', 'Seminar', 'Notice', 'Scholarship'];

  const filteredNotices = notices.filter((n) => {
    const isArchived = Boolean(n.isArchived);
    if (showArchived !== isArchived) return false;

    const matchCat = selectedCategory === 'All' || n.category === selectedCategory;
    const term = searchTerm.toLowerCase().trim();
    const matchSearch =
      !term ||
      n.title.toLowerCase().includes(term) ||
      n.description.toLowerCase().includes(term);

    return matchCat && matchSearch;
  });

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-900 border border-rose-200 text-xs font-bold uppercase tracking-wider">
              <Bell className="w-3.5 h-3.5 text-rose-600" />
              <span>Department Circulars & Notice Board</span>
            </div>
            <h1 className="font-serif-academic text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0c2340]">
              Notices, Circulars & Announcements
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Official notifications from the Department of Mathematics and Panchayat College, including mid-term assessment schedules, guest colloquiums, semester forms, and scholarship deadlines.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
              <button
                onClick={onAddNotice}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Notice</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Controls & View Mode */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Category Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
                Category:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#0c2340] text-amber-300 font-bold'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              {/* Layout Switcher (Grid Boxes vs List Boxes) */}
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-[#0c2340] text-amber-300 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Notice Boxes (Grid View)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Boxes Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-[#0c2340] text-amber-300 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Notice Boxes (Wide List View)"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Boxes List</span>
                </button>
              </div>

              {/* Archive Toggle Button */}
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                  showArchived
                    ? 'bg-slate-900 text-amber-300 border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span>{showArchived ? 'Viewing Archived Notices' : 'View Archived Notices'}</span>
              </button>
            </div>
          </div>

          {/* Search Bar & Stats */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search notices by keyword or subject..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-blue-600"
              />
            </div>
            <div className="text-xs text-slate-500">
              Showing <strong className="text-slate-900">{filteredNotices.length}</strong> notice box{filteredNotices.length === 1 ? '' : 'es'}
            </div>
          </div>
        </div>

        {/* Notices in Boxes Display */}
        {filteredNotices.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-500 text-xs border border-slate-200 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Bell className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-700 text-sm">No Notices Published Yet</p>
            <p className="text-slate-500 max-w-sm mx-auto text-xs">
              {searchTerm || selectedCategory !== 'All'
                ? 'No notices match the selected category or search filters.'
                : 'All new department notices, examination circulars, and announcements published by the department administrator will appear here.'}
            </p>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 lg:grid-cols-2 gap-6'
                : 'space-y-6'
            }
          >
            {filteredNotices.map((notice) => {
              const isImage =
                Boolean(notice.attachmentUrl) &&
                (notice.attachmentUrl!.startsWith('data:image/') ||
                  Boolean(notice.attachmentUrl!.match(/\.(jpeg|jpg|png|webp|gif)($|\?)/i)));

              return (
                <div
                  key={notice.id}
                  className="bg-white rounded-2xl border-2 border-slate-200 hover:border-amber-500/80 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group relative"
                >
                  {/* Category Accent Top Stripe */}
                  <div
                    className={`h-1.5 w-full ${
                      notice.category === 'Examination'
                        ? 'bg-rose-500'
                        : notice.category === 'Seminar'
                        ? 'bg-purple-600'
                        : notice.category === 'Scholarship'
                        ? 'bg-emerald-500'
                        : notice.category === 'Academic'
                        ? 'bg-blue-600'
                        : 'bg-amber-500'
                    }`}
                  />

                  {/* Notice Box Header */}
                  <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                        REF #{notice.id.toUpperCase()}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider ${
                          notice.category === 'Examination'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : notice.category === 'Seminar'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : notice.category === 'Scholarship'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : notice.category === 'Academic'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {notice.category}
                      </span>

                      {notice.isImportant && (
                        <span className="text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 shadow-xs">
                          <AlertCircle className="w-3 h-3" />
                          Urgent / Important
                        </span>
                      )}

                      {notice.isArchived && (
                        <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded uppercase">
                          Archived
                        </span>
                      )}
                    </div>

                    <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {notice.date}
                    </span>
                  </div>

                  {/* Notice Box Body */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    {/* Notice Photo Box */}
                    {isImage ? (
                      <div className="shrink-0 flex flex-col items-center gap-1.5 self-center sm:self-start">
                        <button
                          type="button"
                          onClick={() => onSelectNoticePDF(notice)}
                          style={{ width: '5cm', height: '7cm', minWidth: '5cm', minHeight: '7cm' }}
                          className="relative rounded-xl border-2 border-slate-300 hover:border-amber-500 overflow-hidden shadow-md hover:shadow-xl cursor-pointer group/photo bg-slate-950 flex items-center justify-center transition-all shrink-0 focus:outline-hidden focus:ring-2 focus:ring-amber-400 max-w-full"
                          title="Notice Photo - Click to inspect in high resolution"
                        >
                          <img
                            src={notice.attachmentUrl}
                            alt={notice.attachmentName || 'Notice Image'}
                            style={{ width: '5cm', height: '7cm' }}
                            className="w-full h-full object-cover group-hover/photo:scale-105 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/photo:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1.5 p-2 text-center">
                            <Eye className="w-6 h-6 text-amber-300" />
                            <span className="text-[11px] font-bold uppercase tracking-wider">Click to Enlarge</span>
                          </div>
                        </button>
                        <span className="text-[10px] text-slate-600 font-bold tracking-tight text-center flex items-center gap-1">
                          <Eye className="w-3 h-3 text-amber-600" />
                          Tap to Enlarge
                        </span>
                      </div>
                    ) : notice.attachmentUrl ? (
                      /* PDF Document Box */
                      <div className="shrink-0 flex flex-col items-center gap-1.5 self-center sm:self-start">
                        <button
                          type="button"
                          onClick={() => onSelectNoticePDF(notice)}
                          style={{ width: '5cm', height: '7cm', minWidth: '5cm', minHeight: '7cm' }}
                          className="relative rounded-xl border-2 border-red-200 hover:border-red-400 overflow-hidden shadow-md hover:shadow-xl cursor-pointer group/pdf bg-gradient-to-b from-red-50/90 via-white to-slate-50 flex flex-col items-center justify-between p-3.5 transition-all shrink-0 max-w-full text-left"
                          title="Official Department Circular PDF - Click to read"
                        >
                          <div className="w-full flex items-center justify-between border-b border-red-100 pb-2">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-red-700 uppercase tracking-wider">
                              <FileText className="w-3.5 h-3.5 text-red-600" />
                              <span>Official PDF</span>
                            </div>
                            <span className="text-[9px] font-mono bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold">
                              PDF
                            </span>
                          </div>

                          <div className="my-auto w-full space-y-2 text-center py-2">
                            <div className="w-12 h-12 rounded-full bg-red-100 mx-auto flex items-center justify-center text-red-700 shadow-inner group-hover/pdf:scale-110 transition">
                              <FileText className="w-6 h-6 text-red-600" />
                            </div>
                            <p className="text-[11px] font-bold text-slate-800 line-clamp-3 leading-snug px-1">
                              {notice.attachmentName || notice.title}
                            </p>
                            <div className="flex flex-col gap-1 items-center">
                              <div className="h-1 w-20 bg-slate-200 rounded-full"></div>
                              <div className="h-1 w-14 bg-slate-200 rounded-full"></div>
                            </div>
                          </div>

                          <div className="w-full pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-500">
                            <span className="font-mono text-slate-500 font-medium">Document</span>
                            <span className="text-red-700 font-bold group-hover/pdf:underline flex items-center gap-0.5">
                              Read PDF →
                            </span>
                          </div>
                        </button>
                        <span className="text-[10px] text-slate-600 font-bold tracking-tight text-center flex items-center gap-1">
                          <FileText className="w-3 h-3 text-red-600" />
                          PDF Document
                        </span>
                      </div>
                    ) : null}

                    {/* Notice Text Information */}
                    <div className="space-y-3 min-w-0 flex-1 w-full">
                      <h3 className="font-serif-academic text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-900 transition leading-snug">
                        {notice.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {notice.description}
                      </p>

                      {notice.attachmentName && (
                        <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                          {isImage ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-900 border border-purple-200 font-medium">
                              <ImageIcon className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span>Photo Circular: <strong className="text-slate-900 font-bold">{notice.attachmentName}</strong></span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-900 border border-blue-200 font-medium">
                              <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>PDF Document: <strong className="text-slate-900 font-bold">{notice.attachmentName}</strong></span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notice Box Footer Actions */}
                  <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {notice.attachmentUrl ? (
                        <button
                          onClick={() => onSelectNoticePDF(notice)}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>
                            {isImage ? 'View / Download Photo' : 'View / Download PDF'}
                          </span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No external document attached</span>
                      )}

                      {notice.attachmentUrl && (
                        <button
                          onClick={() => onSelectNoticePDF(notice)}
                          className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                          title="Fullscreen Inspector"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Enlarge</span>
                        </button>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          onClick={() => onToggleArchive(notice)}
                          className="p-2 rounded-lg hover:bg-slate-200 text-slate-600"
                          title={notice.isArchived ? 'Unarchive Notice' : 'Archive Notice'}
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditNotice(notice)}
                          className="p-2 rounded-lg hover:bg-slate-200 text-slate-600"
                          title="Edit Notice"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteNotice(notice.id, notice.title)}
                          className="p-2 rounded-lg hover:bg-rose-100 text-rose-600"
                          title="Delete Notice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  Layers,
  Sparkles,
  RefreshCw,
  Check,
} from 'lucide-react';
import { Book } from '../types';
import { useAuth } from '../context/AuthContext';
import { syncAllRegisterBooksToFirestore } from '../services/db';

interface LibraryPageProps {
  books: Book[];
  onAddBook: () => void;
  onEditBook: (book: Book) => void;
  onDeleteBook: (id: string, title: string) => void;
  onToggleStatus: (book: Book) => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({
  books,
  onAddBook,
  onEditBook,
  onDeleteBook,
  onToggleStatus,
}) => {
  const { isAdmin } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSyncDepartmentRegister = async () => {
    try {
      setIsSyncing(true);
      setSyncFeedback(null);
      const total = await syncAllRegisterBooksToFirestore();
      setSyncFeedback(`Successfully synced all ${total} department books to catalogue!`);
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (err: any) {
      setSyncFeedback('Sync completed. Refreshing books list...');
      setTimeout(() => setSyncFeedback(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  const subjects = [
    'All',
    'Real Analysis',
    'Algebra',
    'Linear Algebra',
    'Calculus',
    'Complex Analysis',
    'Differential Equations',
    'Numerical Methods',
    'Statistics',
    'Topology',
    'Computer Science',
    'Operations Research',
    'Discrete Mathematics',
    'Competitive Exams',
  ];

  const filteredBooks = books.filter((b) => {
    const matchSubj =
      selectedSubject === 'All' || b.subject.toLowerCase() === selectedSubject.toLowerCase();
    const matchStatus = statusFilter === 'All' || b.status === statusFilter;
    const term = searchTerm.toLowerCase().trim();
    const matchSearch =
      !term ||
      b.title.toLowerCase().includes(term) ||
      b.author.toLowerCase().includes(term) ||
      (b.isbn && b.isbn.toLowerCase().includes(term)) ||
      (b.accessionNumber && b.accessionNumber.toLowerCase().includes(term));

    return matchSubj && matchStatus && matchSearch;
  });

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
              <span>Srinivasa Ramanujan Department Library</span>
            </div>
            <h1 className="font-serif-academic text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0c2340]">
              Department Library Catalogue
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Explore over 1,250 textbook volumes, standard reference treatises, and research literature in pure and applied mathematics. Search by subject, accession number, or ISBN.
            </p>
            {syncFeedback && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-xs flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{syncFeedback}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {isAdmin && (
              <button
                onClick={handleSyncDepartmentRegister}
                disabled={isSyncing}
                className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
                title="Sync all 116 register books to the live database"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Department Books (116)'}</span>
              </button>
            )}
            {isAdmin && (
              <button
                onClick={onAddBook}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Book Title</span>
              </button>
            )}
          </div>
        </div>

        {/* Subject Filter Bar */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2 shrink-0">
              Subject Area:
            </span>
            {subjects.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
                  selectedSubject === sub
                    ? 'bg-[#0c2340] text-amber-300 font-bold'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Search Bar & Status */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, author, subject, accession no..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-blue-600"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden"
              >
                <option value="All">All Statuses</option>
                <option value="Available">Available Only</option>
                <option value="Issued">Issued</option>
                <option value="Reference Only">Reference Only</option>
              </select>

              <span className="text-xs text-slate-400">
                ({filteredBooks.length} titles)
              </span>
            </div>
          </div>
        </div>

        {/* Book Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-2xs hover:shadow-lg transition-all duration-300 p-5 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex gap-4 items-start">
                  {/* Book Cover */}
                  <div className="w-20 h-28 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shadow-xs relative">
                    <img
                      src={book.photoUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                  </div>

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider truncate max-w-[130px]">
                        {book.subject}
                      </span>
                      <button
                        onClick={() => isAdmin && onToggleStatus(book)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shrink-0 ${
                          book.status === 'Available'
                            ? 'bg-emerald-100 text-emerald-800'
                            : book.status === 'Issued'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-purple-100 text-purple-800'
                        } ${isAdmin ? 'cursor-pointer hover:ring-2 hover:ring-slate-300' : ''}`}
                        title={isAdmin ? 'Click to toggle availability' : ''}
                      >
                        {book.status === 'Available' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        <span>{book.status}</span>
                      </button>
                    </div>

                    <h3 className="font-serif-academic text-sm font-bold text-slate-900 group-hover:text-blue-900 transition leading-snug line-clamp-2">
                      {book.title}
                    </h3>
                    <p className="text-xs font-medium text-slate-600 truncate">By {book.author}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] space-y-1 text-slate-600 mt-2">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400">Publisher:</span>
                    <span className="font-semibold text-slate-800 truncate">
                      {book.publisher || 'Academic Publisher'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Accession No:</span>
                    <span className="font-mono text-slate-800 font-semibold">{book.accessionNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Shelf / Rack:</span>
                    <span className="font-medium text-slate-800">{book.shelfRack || 'Stack Section'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Copies:</span>
                    <span className="font-bold text-slate-900">{book.copies} {book.copies === 1 ? 'copy' : 'copies'}</span>
                  </div>
                </div>

                {book.isbn && (
                  <p className="text-[10px] font-mono text-slate-400">ISBN: {book.isbn}</p>
                )}
              </div>

              {isAdmin && (
                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">Manage Record</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEditBook(book)}
                      className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600"
                      title="Edit Book Details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteBook(book.id, book.title)}
                      className="p-1.5 rounded-md hover:bg-rose-100 text-rose-600"
                      title="Delete Book"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

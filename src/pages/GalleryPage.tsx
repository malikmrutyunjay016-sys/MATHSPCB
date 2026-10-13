import React, { useState, useEffect, useRef } from 'react';
import {
  Images,
  Plus,
  Trash2,
  Calendar,
  Shield,
  ShieldAlert,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Camera,
  Layers,
  Upload,
  Sparkles,
  Lock,
  Pencil,
  Edit3,
} from 'lucide-react';
import { GalleryPhoto } from '../types';
import { useAuth } from '../context/AuthContext';

interface GalleryPageProps {
  photos: GalleryPhoto[];
  onSavePhoto: (photo: GalleryPhoto) => Promise<void>;
  onDeletePhoto: (id: string, title: string) => Promise<void>;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({
  photos,
  onSavePhoto,
  onDeletePhoto,
}) => {
  const { isAdmin } = useAuth();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'grid'>('grouped');

  // Anti-download security toast state
  const [showSecurityToast, setShowSecurityToast] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSecurityWarning = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowSecurityToast(true);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setShowSecurityToast(false);
    }, 3200);
  };

  // Lightbox Modal state
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  // Admin Photo Modal state (Add or Edit)
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formEventMode, setFormEventMode] = useState<'existing' | 'new'>('existing');
  const [formSelectedEvent, setFormSelectedEvent] = useState('');
  const [formNewEventName, setFormNewEventName] = useState('');
  const [formEventDate, setFormEventDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formAcademicYear, setFormAcademicYear] = useState('2026–27');
  const [formCaption, setFormCaption] = useState('');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [formFileSizeBytes, setFormFileSizeBytes] = useState<number>(0);
  const [formFileSizeFormatted, setFormFileSizeFormatted] = useState<string>('');
  const [fileError, setFileError] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin Delete Confirmation Modal state
  const [photoToDelete, setPhotoToDelete] = useState<{ id: string; title: string } | null>(null);

  const openAddModal = (presetEventName?: string, presetDate?: string, presetSession?: string) => {
    setEditingPhoto(null);
    setFormTitle('');
    setFormEventMode('existing');
    setFormSelectedEvent(presetEventName || (distinctEvents[0]?.name || ''));
    setFormNewEventName('');
    setFormEventDate(presetDate || new Date().toISOString().split('T')[0]);
    setFormAcademicYear(presetSession || '2026–27');
    setFormCaption('');
    setFormPhotoUrl('');
    setFormFileSizeBytes(0);
    setFormFileSizeFormatted('');
    setFileError('');
    setShowPhotoModal(true);
  };

  const openEditModal = (photo: GalleryPhoto) => {
    setEditingPhoto(photo);
    setFormTitle(photo.title);
    setFormEventMode('existing');
    setFormSelectedEvent(photo.eventName);
    setFormNewEventName('');
    setFormEventDate(photo.eventDate || '');
    setFormAcademicYear(photo.academicYear || '2026–27');
    setFormCaption(photo.caption || '');
    setFormPhotoUrl(photo.photoUrl);
    setFormFileSizeBytes(photo.fileSizeBytes || 0);
    setFormFileSizeFormatted(photo.fileSizeFormatted || '');
    setFileError('');
    setShowPhotoModal(true);
  };

  // Extract distinct events list
  const distinctEvents = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number; date?: string }>();
    photos.forEach((p) => {
      const eId = p.eventId || 'general-event';
      const eName = p.eventName || 'Department Activities';
      const existing = map.get(eId);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(eId, {
          id: eId,
          name: eName,
          count: 1,
          date: p.eventDate,
        });
      }
    });
    return Array.from(map.values());
  }, [photos]);

  // Set default selected existing event when opening add modal
  useEffect(() => {
    if (distinctEvents.length > 0 && !formSelectedEvent) {
      setFormSelectedEvent(distinctEvents[0].name);
    }
  }, [distinctEvents, formSelectedEvent]);

  // Filter photos
  const filteredPhotos = React.useMemo(() => {
    return photos.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.caption && p.caption.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.academicYear && p.academicYear.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesEvent = selectedEventId === 'all' || p.eventId === selectedEventId;

      return matchesSearch && matchesEvent;
    });
  }, [photos, searchTerm, selectedEventId]);

  // Photos grouped by event for "Grouped" view
  const groupedPhotos = React.useMemo(() => {
    const groups: { [eventId: string]: { eventName: string; eventDate?: string; academicYear?: string; items: GalleryPhoto[] } } = {};
    filteredPhotos.forEach((photo) => {
      const eId = photo.eventId || 'general';
      if (!groups[eId]) {
        groups[eId] = {
          eventName: photo.eventName,
          eventDate: photo.eventDate,
          academicYear: photo.academicYear,
          items: [],
        };
      }
      groups[eId].items.push(photo);
    });
    return Object.entries(groups).map(([eventId, data]) => ({
      eventId,
      ...data,
    }));
  }, [filteredPhotos]);

  // Handle client-side file selection with strict 500 KB validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError('');
    const MAX_ALLOWED_BYTES = 500 * 1024; // 500 KB = 512,000 bytes

    const formattedSize =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    if (file.size > MAX_ALLOWED_BYTES) {
      setFileError(
        `Selected file size is ${formattedSize}, which exceeds the strictly enforced 500 KB maximum limit. You can use our instant compression button below to optimize it under 500 KB.`
      );
      // Read temporarily to allow preview & compression
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawUrl = event.target?.result as string;
        setFormPhotoUrl(rawUrl);
        setFormFileSizeBytes(file.size);
        setFormFileSizeFormatted(formattedSize);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Size is valid (<= 500 KB)
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawUrl = event.target?.result as string;
      setFormPhotoUrl(rawUrl);
      setFormFileSizeBytes(file.size);
      setFormFileSizeFormatted(formattedSize);
      setFileError('');
    };
    reader.readAsDataURL(file);
  };

  // Built-in Canvas Compressor to ensure image is strictly <= 500 KB
  const compressImageUnder500KB = () => {
    if (!formPhotoUrl) return;
    setIsCompressing(true);

    const img = new Image();
    img.src = formPhotoUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Max dimensions: cap to 1280px wide/tall for optimal web gallery view
      const maxDim = 1280;
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
        setIsCompressing(false);
        return;
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Try progressively lower JPEG quality until strictly <= 500 KB
      let quality = 0.85;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      let byteLength = Math.round((dataUrl.length * 3) / 4);

      while (byteLength > 490 * 1024 && quality > 0.2) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
        byteLength = Math.round((dataUrl.length * 3) / 4);
      }

      const finalKb = Math.round(byteLength / 1024);
      setFormPhotoUrl(dataUrl);
      setFormFileSizeBytes(byteLength);
      setFormFileSizeFormatted(`${finalKb} KB`);
      setFileError('');
      setIsCompressing(false);
    };

    img.onerror = () => {
      setIsCompressing(false);
      setFileError('Could not process the selected image.');
    };
  };

  // Submit Photo (Add or Edit) - Admin only
  const handleSavePhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Only administrators can add or edit photos in the department gallery.');
      return;
    }

    if (!formTitle.trim()) {
      alert('Please enter a photo title.');
      return;
    }

    const eventName =
      formEventMode === 'existing'
        ? formSelectedEvent.trim() || 'General Department Event'
        : formNewEventName.trim();

    if (!eventName) {
      alert('Please select or specify a department event.');
      return;
    }

    if (!formPhotoUrl) {
      alert('Please upload a photo file.');
      return;
    }

    // Strict 500 KB limit validation
    const MAX_ALLOWED_BYTES = 500 * 1024;
    if (formFileSizeBytes > MAX_ALLOWED_BYTES) {
      alert(
        `Photo size (${formFileSizeFormatted}) exceeds the 500 KB maximum limit. Please click 'Compress & Optimize to < 500 KB' before saving.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const generatedEventId =
        formEventMode === 'existing'
          ? distinctEvents.find((e) => e.name === formSelectedEvent)?.id ||
            (editingPhoto?.eventName === eventName ? editingPhoto.eventId : `event-${eventName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)
          : `event-${eventName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

      if (editingPhoto) {
        // Update existing photo
        const updatedPhoto: GalleryPhoto = {
          ...editingPhoto,
          title: formTitle.trim(),
          eventId: generatedEventId,
          eventName: eventName,
          eventDate: formEventDate,
          academicYear: formAcademicYear,
          caption: formCaption.trim() || undefined,
          photoUrl: formPhotoUrl,
          fileSizeBytes: formFileSizeBytes,
          fileSizeFormatted: formFileSizeFormatted || `${Math.round(formFileSizeBytes / 1024)} KB`,
          updatedAt: new Date().toISOString(),
        };
        await onSavePhoto(updatedPhoto);
      } else {
        // Create new photo
        const newPhoto: GalleryPhoto = {
          id: `gal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: formTitle.trim(),
          eventId: generatedEventId,
          eventName: eventName,
          eventDate: formEventDate,
          academicYear: formAcademicYear,
          caption: formCaption.trim() || undefined,
          photoUrl: formPhotoUrl,
          fileSizeBytes: formFileSizeBytes,
          fileSizeFormatted: formFileSizeFormatted || `${Math.round(formFileSizeBytes / 1024)} KB`,
          uploadedBy: 'Department Administrator',
          order: photos.length + 1,
          createdAt: new Date().toISOString(),
        };
        await onSavePhoto(newPhoto);
      }

      // Reset form & close modal
      setEditingPhoto(null);
      setFormTitle('');
      setFormNewEventName('');
      setFormCaption('');
      setFormPhotoUrl('');
      setFormFileSizeBytes(0);
      setFormFileSizeFormatted('');
      setFileError('');
      setShowPhotoModal(false);
    } catch (err: any) {
      alert(`Error saving photo: ${err?.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard navigation & anti-copy shortcuts blocking in Lightbox
  useEffect(() => {
    if (activePhotoIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disallow copy / save keys
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'c' || e.key === 'u' || e.key === 'p')) {
        e.preventDefault();
        triggerSecurityWarning();
        return;
      }

      if (e.key === 'Escape') {
        setActivePhotoIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setActivePhotoIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredPhotos.length - 1));
      } else if (e.key === 'ArrowRight') {
        setActivePhotoIndex((prev) => (prev !== null && prev < filteredPhotos.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhotoIndex, filteredPhotos.length]);

  return (
    <div
      className="bg-slate-50 min-h-screen py-10 select-none"
      onContextMenu={triggerSecurityWarning}
    >
      {/* Anti-Download & Anti-Copy Security Notification Toast */}
      {showSecurityToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900/95 text-white p-4 rounded-xl shadow-2xl border border-amber-500/40 flex items-start gap-3 backdrop-blur-md animate-in fade-in slide-in-from-bottom duration-200">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40 mt-0.5">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
              <span>Protected Academic Media</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Downloading, right-clicking, or copying photos from the Department of Mathematics is disabled for public visitors in accordance with institutional copyright policy.
            </p>
          </div>
          <button
            onClick={() => setShowSecurityToast(false)}
            className="text-slate-400 hover:text-white p-1 ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-100/50 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-sky-100/40 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold uppercase tracking-wider">
                  <Images className="w-3.5 h-3.5 text-amber-600" />
                  <span>Visual Archives & Events</span>
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>Protected Gallery (Copy & Download Disabled)</span>
                </span>
              </div>

              <h1 className="font-serif-academic text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0c2340] tracking-tight">
                Department Event Photo Gallery
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Chronological photo documentation of departmental seminars, National Mathematics Day celebrations, freshers’ orientations, student workshops, and academic milestones at Panchayat College, Baragada.
              </p>

              {/* Department stats pills */}
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
                  <Camera className="w-4 h-4 text-amber-500" />
                  <strong className="text-slate-900">{photos.length}</strong> Total Photos
                </span>
                <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
                  <Calendar className="w-4 h-4 text-sky-500" />
                  <strong className="text-slate-900">{distinctEvents.length}</strong> Department Events
                </span>
                <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span>Max File Size: <strong>500 KB</strong></span>
                </span>
              </div>
            </div>

            {/* Admin Add Photo Action Button */}
            {isAdmin ? (
              <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={() => openAddModal()}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer text-sm"
                >
                  <Plus className="w-5 h-5 text-slate-950" />
                  <span>Add Photo to Event</span>
                </button>
              </div>
            ) : (
              <div className="shrink-0 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 max-w-xs flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Admin authentication is required to upload or remove department gallery photos. Photos are protected against copying and downloading.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Filter and Event Selector Bar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search event, topic, or photo title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60 text-xs">
                <button
                  onClick={() => setViewMode('grouped')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    viewMode === 'grouped'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                  <span>Grouped by Event</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-sky-500" />
                  <span>All Photos Grid</span>
                </button>
              </div>
            </div>
          </div>

          {/* Department Events Filter Ribbon */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-xs font-bold text-slate-500 shrink-0 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3 text-slate-400" /> Events:
            </span>

            <button
              onClick={() => setSelectedEventId('all')}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedEventId === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Events ({photos.length})
            </button>

            {distinctEvents.map((evt) => (
              <button
                key={evt.id}
                onClick={() => setSelectedEventId(evt.id)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  selectedEventId === evt.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{evt.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    selectedEventId === evt.id ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {evt.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Photos Content View */}
        {filteredPhotos.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center border border-amber-200">
              <Images className="w-8 h-8" />
            </div>
            <h3 className="font-serif-academic text-lg font-bold text-slate-800">No Photos Found</h3>
            <p className="text-xs text-slate-500">
              No gallery photos match your current search query or event filter.
            </p>
            {isAdmin && (
              <button
                onClick={() => openAddModal()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Upload New Event Photo</span>
              </button>
            )}
          </div>
        ) : viewMode === 'grouped' ? (
          /* Grouped by Department Event View */
          <div className="space-y-10">
            {groupedPhotos.map((group) => (
              <div
                key={group.eventId}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6"
              >
                {/* Event Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200/60">
                        <Calendar className="w-3 h-3 text-amber-600" />
                        {group.eventDate || 'Department Event'}
                      </span>
                      {group.academicYear && (
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Session: {group.academicYear}
                        </span>
                      )}
                    </div>
                    <h2 className="font-serif-academic text-xl sm:text-2xl font-bold text-[#0c2340]">
                      {group.eventName}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      {group.items.length} {group.items.length === 1 ? 'Photo' : 'Photos'}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => openAddModal(group.eventName, group.eventDate, group.academicYear)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300/50 text-xs font-bold transition cursor-pointer"
                        title="Add another photo to this event"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-700" />
                        <span>Add Photo</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Event Photo Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {group.items.map((photo) => {
                    const globalIdx = filteredPhotos.findIndex((p) => p.id === photo.id);
                    return (
                      <PhotoCard
                        key={photo.id}
                        photo={photo}
                        isAdmin={isAdmin}
                        onClick={() => setActivePhotoIndex(globalIdx >= 0 ? globalIdx : 0)}
                        onEdit={() => openEditModal(photo)}
                        onDelete={() => setPhotoToDelete({ id: photo.id, title: photo.title })}
                        onTriggerSecurity={triggerSecurityWarning}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Grid View of all photos */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredPhotos.map((photo, idx) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                isAdmin={isAdmin}
                onClick={() => setActivePhotoIndex(idx)}
                onEdit={() => openEditModal(photo)}
                onDelete={() => setPhotoToDelete({ id: photo.id, title: photo.title })}
                onTriggerSecurity={triggerSecurityWarning}
              />
            ))}
          </div>
        )}
      </div>

      {/* ---------------- LIGHTBOX MODAL WITH ANTI-COPY / ANTI-DOWNLOAD SHIELD ---------------- */}
      {activePhotoIndex !== null && filteredPhotos[activePhotoIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 select-none"
          onContextMenu={triggerSecurityWarning}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold shrink-0">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Protected View</span>
              </span>
              <div className="truncate">
                <h3 className="text-sm sm:text-base font-bold truncate text-white">
                  {filteredPhotos[activePhotoIndex].title}
                </h3>
                <p className="text-xs text-slate-400 truncate">
                  {filteredPhotos[activePhotoIndex].eventName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isAdmin && (
                <>
                  <button
                    onClick={() => {
                      const current = filteredPhotos[activePhotoIndex];
                      openEditModal(current);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition cursor-pointer"
                    title="Edit photo details & event"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-950" />
                    <span>Edit Details</span>
                  </button>
                  <button
                    onClick={() => {
                      const current = filteredPhotos[activePhotoIndex];
                      setPhotoToDelete({ id: current.id, title: current.title });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold transition cursor-pointer"
                    title="Remove this photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </>
              )}
              <button
                onClick={() => setActivePhotoIndex(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                title="Close Lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Central Protected Image Area */}
          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            {/* Previous Button */}
            <button
              onClick={() =>
                setActivePhotoIndex((prev) =>
                  prev !== null && prev > 0 ? prev - 1 : filteredPhotos.length - 1
                )
              }
              className="absolute left-2 sm:left-4 z-30 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition cursor-pointer border border-white/20 shadow-lg"
              title="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Next Button */}
            <button
              onClick={() =>
                setActivePhotoIndex((prev) =>
                  prev !== null && prev < filteredPhotos.length - 1 ? prev + 1 : 0
                )
              }
              className="absolute right-2 sm:right-4 z-30 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition cursor-pointer border border-white/20 shadow-lg"
              title="Next photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Protected Image Container */}
            <div className="relative max-w-5xl max-h-[75vh] w-auto h-auto flex items-center justify-center">
              {/* TRANSPARENT SHIELD OVERLAY: intercepts right-click, save-as, drags, touches */}
              <div
                className="absolute inset-0 z-20 bg-transparent select-none cursor-default"
                onContextMenu={triggerSecurityWarning}
                onDragStart={(e) => e.preventDefault()}
                title="Department of Mathematics - Protected Visual Media"
              />

              <img
                src={filteredPhotos[activePhotoIndex].photoUrl}
                alt={filteredPhotos[activePhotoIndex].title}
                className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl pointer-events-none select-none"
                draggable={false}
              />

              {/* Watermark Branding Ribbon */}
              <div className="absolute bottom-3 right-3 z-20 pointer-events-none bg-black/70 backdrop-blur-xs text-white/90 text-[10px] font-semibold px-2.5 py-1 rounded-md border border-white/10 flex items-center gap-1.5 shadow-md">
                <Shield className="w-3 h-3 text-amber-400" />
                <span>Panchayat College Baragada • Department of Mathematics</span>
              </div>
            </div>
          </div>

          {/* Modal Footer: Photo Metadata */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-amber-400">
                  {filteredPhotos[activePhotoIndex].eventName}
                </span>
                {filteredPhotos[activePhotoIndex].eventDate && (
                  <span className="text-slate-400">
                    • Date: {filteredPhotos[activePhotoIndex].eventDate}
                  </span>
                )}
                {filteredPhotos[activePhotoIndex].fileSizeFormatted && (
                  <span className="bg-white/10 text-slate-300 px-2 py-0.5 rounded text-[11px]">
                    Size: {filteredPhotos[activePhotoIndex].fileSizeFormatted} (Max 500 KB limit enforced)
                  </span>
                )}
              </div>
              {filteredPhotos[activePhotoIndex].caption && (
                <p className="text-slate-200 text-xs sm:text-sm">
                  {filteredPhotos[activePhotoIndex].caption}
                </p>
              )}
            </div>

            <div className="text-slate-400 text-right shrink-0">
              Photo {activePhotoIndex + 1} of {filteredPhotos.length}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- ADMIN ADD / EDIT PHOTO MODAL (STRICT ≤ 500 KB LIMIT) ---------------- */}
      {showPhotoModal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200 my-8">
            <button
              onClick={() => {
                setShowPhotoModal(false);
                setEditingPhoto(null);
                setFileError('');
              }}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold uppercase tracking-wider">
                {editingPhoto ? (
                  <Pencil className="w-3.5 h-3.5 text-amber-600" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>{editingPhoto ? 'Edit Photo Details' : 'Admin Photo Upload'}</span>
              </div>
              <h2 className="font-serif-academic text-xl sm:text-2xl font-bold text-[#0c2340]">
                {editingPhoto ? 'Edit Department Event Photo' : 'Add Department Event Photo'}
              </h2>
              <p className="text-xs text-slate-600">
                {editingPhoto
                  ? 'Update event details, title, session, or replace the photo file (strictly ≤ 500 KB).'
                  : 'Photos are cataloged under specific department events. Maximum allowed file size is strictly 500 KB.'}
              </p>
            </div>

            <form onSubmit={handleSavePhotoSubmit} className="space-y-4">
              {/* Event Assignment Mode */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Department Event
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setFormEventMode('existing')}
                    className={`py-2 rounded-lg transition ${
                      formEventMode === 'existing'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Select Existing Event
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormEventMode('new')}
                    className={`py-2 rounded-lg transition ${
                      formEventMode === 'new'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    + Create New Event
                  </button>
                </div>

                {formEventMode === 'existing' ? (
                  <div>
                    {distinctEvents.length > 0 ? (
                      <select
                        value={formSelectedEvent}
                        onChange={(e) => {
                          setFormSelectedEvent(e.target.value);
                          const matched = distinctEvents.find((evt) => evt.name === e.target.value);
                          if (matched?.date) setFormEventDate(matched.date);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                      >
                        {distinctEvents.map((evt) => (
                          <option key={evt.id} value={evt.name}>
                            {evt.name} ({evt.count} photos)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Enter Event Name"
                        value={formNewEventName}
                        onChange={(e) => setFormNewEventName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm"
                      />
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      placeholder="e.g. National Mathematics Day 2026, Pi Day Celebration, Workshop..."
                      value={formNewEventName}
                      onChange={(e) => setFormNewEventName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                    />
                  </div>
                )}
              </div>

              {/* Event Date & Academic Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={formEventDate}
                    onChange={(e) => setFormEventDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Academic Year / Session
                  </label>
                  <select
                    value={formAcademicYear}
                    onChange={(e) => setFormAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                  >
                    <option value="2026–27">2026–27</option>
                    <option value="2025–26">2025–26</option>
                    <option value="2024–25">2024–25</option>
                    <option value="2023–24">2023–24</option>
                  </select>
                </div>
              </div>

              {/* Photo Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Photo Title / Description Header *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Keynote Address by HoD Mr. Mrutyunjay Malik"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                />
              </div>

              {/* Photo Caption */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Caption / Details (Optional)
                </label>
                <textarea
                  placeholder="Brief note about what was taking place in this photo..."
                  rows={2}
                  value={formCaption}
                  onChange={(e) => setFormCaption(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition resize-none"
                />
              </div>

              {/* Photo File Upload Box with 500 KB limit validation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {editingPhoto ? 'Photo Image (Keep or Replace ≤ 500 KB)' : 'Upload Photo File (Max 500 KB) *'}
                  </label>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Max size: 500 KB
                  </span>
                </div>

                <div className="border-2 border-dashed border-slate-300 hover:border-amber-500/70 rounded-2xl p-4 sm:p-5 text-center transition bg-slate-50/50">
                  <input
                    type="file"
                    accept="image/*"
                    id="gallery-file-input"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="gallery-file-input"
                    className="flex flex-col items-center justify-center cursor-pointer space-y-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-800">
                      {editingPhoto ? 'Click to replace photo with a new file or drag & drop' : 'Click to choose photo or drag & drop'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      PNG, JPG, WEBP • File size strictly ≤ 500 KB
                    </div>
                  </label>
                </div>

                {/* File Size Status / Error Feedback */}
                {fileError && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">{fileError}</div>
                    </div>
                    {formPhotoUrl && (
                      <button
                        type="button"
                        onClick={compressImageUnder500KB}
                        disabled={isCompressing}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isCompressing ? 'Compressing...' : 'Auto-Compress & Optimize to < 500 KB'}</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Valid File Size Indicator */}
                {!fileError && formPhotoUrl && formFileSizeBytes > 0 && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Size: <strong>{formFileSizeFormatted}</strong> (Within 500 KB limit)</span>
                    </span>
                    <label
                      htmlFor="gallery-file-input"
                      className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold cursor-pointer underline"
                    >
                      Replace File
                    </label>
                  </div>
                )}

                {/* Photo Preview */}
                {formPhotoUrl && (
                  <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-48 flex items-center justify-center">
                    <img
                      src={formPhotoUrl}
                      alt="Preview"
                      className="max-h-48 w-auto object-contain"
                    />
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                      {formFileSizeFormatted}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPhotoModal(false);
                    setEditingPhoto(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !!fileError || !formPhotoUrl}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {editingPhoto ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{isSubmitting ? 'Saving...' : editingPhoto ? 'Save Photo Changes' : 'Add to Department Gallery'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- ADMIN DELETE CONFIRMATION MODAL ---------------- */}
      {photoToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif-academic text-lg font-bold text-slate-900">
                Remove Photo from Gallery?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to permanently remove <strong>"{photoToDelete.title}"</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setPhotoToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await onDeletePhoto(photoToDelete.id, photoToDelete.title);
                    setPhotoToDelete(null);
                    if (activePhotoIndex !== null) {
                      setActivePhotoIndex(null);
                    }
                  } catch (err: any) {
                    alert(`Failed to delete: ${err?.message || 'Please try again.'}`);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-md cursor-pointer"
              >
                Yes, Delete Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------- PHOTO CARD COMPONENT WITH TRANSPARENT ANTI-COPY SHIELD ----------------
interface PhotoCardProps {
  photo: GalleryPhoto;
  isAdmin: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTriggerSecurity: (e?: React.MouseEvent) => void;
}

const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  isAdmin,
  onClick,
  onEdit,
  onDelete,
  onTriggerSecurity,
}) => {
  return (
    <div
      className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer select-none"
      onClick={onClick}
      onContextMenu={onTriggerSecurity}
    >
      {/* Protected Image Container */}
      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
        {/* TRANSPARENT SHIELD OVERLAY: Prevents right-click 'Save image as' and drag & drop */}
        <div
          className="absolute inset-0 z-10 bg-transparent select-none"
          onContextMenu={onTriggerSecurity}
          onDragStart={(e) => e.preventDefault()}
        />

        <img
          src={photo.photoUrl}
          alt={photo.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none"
          draggable={false}
          loading="lazy"
        />

        {/* Anti-Copy Protection Pill */}
        <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none bg-slate-950/70 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 shadow-xs">
          <Lock className="w-2.5 h-2.5 text-amber-400" />
          <span>Protected</span>
        </div>

        {/* File Size Badge (strictly <= 500 KB) */}
        {photo.fileSizeFormatted && (
          <div className="absolute bottom-2.5 left-2.5 z-20 pointer-events-none bg-black/60 backdrop-blur-xs text-white/90 text-[10px] font-mono px-2 py-0.5 rounded shadow-xs">
            {photo.fileSizeFormatted}
          </div>
        )}

        {/* Admin Action Buttons (Edit & Delete) */}
        {isAdmin && (
          <div className="absolute top-2.5 right-2.5 z-30 flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center justify-center shadow-md transition cursor-pointer"
              title="Edit Photo Details & Event"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="w-7 h-7 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center shadow-md transition cursor-pointer"
              title="Remove Photo"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
            <Calendar className="w-3 h-3 text-amber-600" />
            <span>{photo.eventDate || photo.academicYear || 'Department Event'}</span>
          </div>
          <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 group-hover:text-amber-600 transition">
            {photo.title}
          </h3>
          {photo.caption && (
            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
              {photo.caption}
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
          <span className="truncate max-w-[140px]">{photo.eventName}</span>
          <span className="text-amber-600 font-semibold group-hover:underline">View Photo</span>
        </div>
      </div>
    </div>
  );
};

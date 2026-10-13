import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  HardDrive,
  Link as LinkIcon,
  Check,
  AlertCircle,
  X,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Info,
} from 'lucide-react';

export interface PhotoImportResult {
  photoUrl: string;
  sourceType?: 'computer' | 'drive' | 'url' | 'preset';
  fileName?: string;
  sizeKb?: number;
}

interface FacultyPhotoPickerProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
}

// Helper to extract Google Drive direct embed URL
export function parseGoogleDriveUrl(rawUrl: string): {
  isDrive: boolean;
  directUrl: string;
  fileId?: string;
} {
  const url = (rawUrl || '').trim();
  if (!url) return { isDrive: false, directUrl: '' };

  // If user pasted a Google Drive alphanumeric ID directly (typically 28-55 chars)
  if (/^[a-zA-Z0-9_-]{25,60}$/.test(url)) {
    return {
      isDrive: true,
      directUrl: `https://lh3.googleusercontent.com/d/${url}`,
      fileId: url,
    };
  }

  // Common Google Drive link variations
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i,
    /drive\.google\.com\/open\?(?:.*&)?id=([a-zA-Z0-9_-]+)/i,
    /drive\.google\.com\/uc\?(?:.*&)?id=([a-zA-Z0-9_-]+)/i,
    /drive\.google\.com\/thumbnail\?(?:.*&)?id=([a-zA-Z0-9_-]+)/i,
    /lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i,
    /docs\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const fileId = match[1];
      return {
        isDrive: true,
        directUrl: `https://lh3.googleusercontent.com/d/${fileId}`,
        fileId,
      };
    }
  }

  return { isDrive: false, directUrl: url };
}

// Compress and resize image file to lightweight, high-res data URL for fast Firestore storage
export function processImageFile(file: File): Promise<{
  dataUrl: string;
  fileName: string;
  sizeKb: number;
}> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image. Please choose JPG, PNG, WEBP, or GIF.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read selected file from computer.'));
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image format.'));
      img.onload = () => {
        // Limit max dimensions to 800px for faculty portrait
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            dataUrl: rawDataUrl,
            fileName: file.name,
            sizeKb: Math.round(file.size / 1024),
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // High quality JPEG
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.86);
        const approxSizeKb = Math.round((compressedDataUrl.length * 3) / 4 / 1024);

        resolve({
          dataUrl: compressedDataUrl,
          fileName: file.name,
          sizeKb: approxSizeKb,
        });
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

// Academic faculty avatar presets
const PRESET_PHOTOS = [
  {
    name: 'Academic Portrait 1',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Academic Portrait 2',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Academic Portrait 3',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Academic Portrait 4',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
  },
];

export const FacultyPhotoPicker: React.FC<FacultyPhotoPickerProps> = ({
  value,
  onChange,
  label = 'Faculty Photograph',
  helperText,
}) => {
  const [activeTab, setActiveTab] = useState<'computer' | 'drive' | 'url'>('computer');
  const [driveInput, setDriveInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fileDetails, setFileDetails] = useState<{ name: string; sizeKb: number } | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize url input with current value
  useEffect(() => {
    setImageLoadError(false);
    if (value && value.startsWith('http')) {
      setUrlInput(value);
      if (value.includes('googleusercontent') || value.includes('drive.google')) {
        setDriveInput(value);
      }
    }
  }, [value]);

  const handleFile = async (file: File) => {
    setErrorMsg('');
    setIsProcessing(true);
    try {
      if (file.size > 15 * 1024 * 1024) {
        throw new Error('File size exceeds 15MB. Please choose a smaller photo.');
      }
      const result = await processImageFile(file);
      setFileDetails({ name: result.fileName, sizeKb: result.sizeKb });
      onChange(result.dataUrl);
      setImageLoadError(false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to import photo from computer.');
    } finally {
      setIsProcessing(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // reset input so the same file can be re-selected if desired
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleApplyDriveLink = () => {
    setErrorMsg('');
    if (!driveInput.trim()) {
      setErrorMsg('Please paste a Google Drive file link or File ID.');
      return;
    }

    const parsed = parseGoogleDriveUrl(driveInput);
    if (!parsed.isDrive) {
      setErrorMsg('The link does not appear to be a recognized Google Drive URL. Ensure it contains /file/d/... or an ID.');
      return;
    }

    setFileDetails({ name: `Google Drive File (${parsed.fileId?.slice(0, 8)}...)`, sizeKb: 0 });
    onChange(parsed.directUrl);
    setImageLoadError(false);
  };

  const handleApplyUrl = () => {
    setErrorMsg('');
    if (!urlInput.trim()) {
      setErrorMsg('Please enter a valid image web URL.');
      return;
    }
    // If user pasted a drive link in the URL box, auto-convert it!
    const parsed = parseGoogleDriveUrl(urlInput);
    if (parsed.isDrive) {
      onChange(parsed.directUrl);
      setFileDetails({ name: 'Google Drive Direct Photo', sizeKb: 0 });
    } else {
      onChange(urlInput.trim());
      setFileDetails(null);
    }
    setImageLoadError(false);
  };

  const determineSourceBadge = () => {
    if (!value) return null;
    if (value.startsWith('data:image')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
          <HardDrive className="w-3 h-3" />
          <span>Imported from Computer</span>
        </span>
      );
    }
    if (value.includes('googleusercontent') || value.includes('drive.google')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
          <ExternalLink className="w-3 h-3" />
          <span>Google Drive Cloud Photo</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
        <LinkIcon className="w-3 h-3" />
        <span>Web URL / External</span>
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {/* Label and Helper */}
      <div className="flex items-center justify-between">
        <label className="block font-bold text-slate-800 uppercase text-[11px] tracking-wider">
          {label} *
        </label>
        {determineSourceBadge()}
      </div>

      {/* Main Container */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
        {/* Current Preview Card */}
        <div className="flex items-center gap-3.5 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="relative w-16 h-16 rounded-lg bg-slate-100 overflow-hidden border border-slate-300 shrink-0 flex items-center justify-center">
            {value && !imageLoadError ? (
              <img
                src={value}
                alt="Faculty Preview"
                className="w-full h-full object-cover"
                onError={() => setImageLoadError(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 p-1 text-center">
                <Upload className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] leading-tight font-medium">No Photo</span>
              </div>
            )}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center text-white">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-900 truncate">
                {fileDetails?.name || (value ? 'Faculty Photograph Selected' : 'No photo uploaded yet')}
              </span>
              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setFileDetails(null);
                    setImageLoadError(false);
                  }}
                  className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                  title="Remove photograph"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-500 leading-tight">
              {fileDetails?.sizeKb ? (
                <span>Optimized size: {fileDetails.sizeKb} KB</span>
              ) : value.startsWith('data:image') ? (
                <span>Local file compressed for database</span>
              ) : value.includes('lh3.googleusercontent') ? (
                <span>Linked directly from Google Drive CDN</span>
              ) : (
                helperText || 'Import a formal photo from your Computer or Google Drive'
              )}
            </p>

            {imageLoadError && (
              <div className="text-[10px] text-rose-600 flex items-center gap-1 font-semibold">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>Unable to load photo preview. Please verify URL or Drive link access.</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-lg bg-slate-200/80 p-1 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('computer');
              setErrorMsg('');
            }}
            className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'computer'
                ? 'bg-white text-[#0c2340] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-blue-600" />
            <span>From Computer</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('drive');
              setErrorMsg('');
            }}
            className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'drive'
                ? 'bg-white text-[#0c2340] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 87.3 78" fill="none">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3L1.2 45.45c-.8 1.4-1.2 2.95-1.2 4.55h27.5z" fill="#00ac47"/>
              <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.15z" fill="#ea4335"/>
              <path d="M43.65 25 57.4 1.2c-1.35-.8-2.9-1.2-4.5-1.2H34.4c-1.6 0-3.15.4-4.5 1.2z" fill="#00832d"/>
              <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.4 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.15 28h27.5c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
            <span>From Google Drive</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('url');
              setErrorMsg('');
            }}
            className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'url'
                ? 'bg-white text-[#0c2340] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5 text-amber-600" />
            <span>Web URL / Presets</span>
          </button>
        </div>

        {/* Tab 1: Computer Upload */}
        {activeTab === 'computer' && (
          <div className="space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileInputChange}
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              className="hidden"
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/70'
                  : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/80'
              }`}
            >
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Click to browse files on your computer
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    or drag and drop photo file here (JPG, PNG, WEBP)
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Auto-optimized & resized for fast web viewing</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Google Drive Import */}
        {activeTab === 'drive' && (
          <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Paste Google Drive Share Link or File ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={driveInput}
                  onChange={(e) => {
                    setDriveInput(e.target.value);
                    setErrorMsg('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyDriveLink();
                    }
                  }}
                  placeholder="https://drive.google.com/file/d/1A2B3C.../view?usp=sharing"
                  className="flex-1 p-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleApplyDriveLink}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Import Photo</span>
                </button>
              </div>
            </div>

            {/* Instruction Box for Google Drive */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-2.5 text-[11px] text-blue-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-blue-950">
                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>How to import from Google Drive:</span>
              </div>
              <ol className="list-decimal list-inside space-y-0.5 text-slate-700 pl-1 text-[10.5px]">
                <li>In Google Drive, right-click the faculty photo &rarr; select <strong>Share</strong>.</li>
                <li>Under <em>General access</em>, change to <strong>&ldquo;Anyone with the link&rdquo;</strong> (Viewer).</li>
                <li>Click <strong>Copy link</strong> and paste it into the box above.</li>
              </ol>
              <p className="text-[10px] text-slate-500 pt-1 border-t border-blue-200/60">
                &bull; We automatically convert it into a direct Google CDN image URL for high-speed rendering.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Web URL & Presets */}
        {activeTab === 'url' && (
          <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Direct Image Web URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    setErrorMsg('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyUrl();
                    }
                  }}
                  placeholder="https://example.com/faculty-photo.jpg"
                  className="flex-1 p-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold shrink-0 cursor-pointer shadow-xs transition"
                >
                  Set URL
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Or pick a sample academic portrait:
              </span>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_PHOTOS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onChange(preset.url);
                      setUrlInput(preset.url);
                      setFileDetails({ name: preset.name, sizeKb: 0 });
                      setImageLoadError(false);
                      setErrorMsg('');
                    }}
                    className={`group relative rounded-lg overflow-hidden border p-1 transition cursor-pointer flex flex-col items-center gap-1 ${
                      value === preset.url
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-300 bg-white'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="text-[9.5px] text-slate-600 font-medium truncate w-full text-center">
                      Preset #{idx + 1}
                    </span>
                    {value === preset.url && (
                      <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Modal specifically for quick photo updating in Manage Faculty Directory
export const FacultyPhotoModal: React.FC<{
  isOpen: boolean;
  faculty: { id: string; name: string; designation: string; photoUrl: string } | null;
  onSave: (facultyId: string, newPhotoUrl: string) => Promise<void> | void;
  onClose: () => void;
}> = ({ isOpen, faculty, onSave, onClose }) => {
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (faculty) {
      setPhotoUrl(faculty.photoUrl || '');
      setSaveSuccess(false);
    }
  }, [faculty, isOpen]);

  if (!isOpen || !faculty) return null;

  const handleSave = async () => {
    if (!photoUrl) return;
    setIsSaving(true);
    try {
      await onSave(faculty.id, photoUrl);
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 600);
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="bg-[#0c2340] text-white p-4.5 px-6 flex items-center justify-between border-b border-slate-800">
          <div>
            <h3 className="font-serif-academic text-base font-bold text-white">
              Import Photo: {faculty.name}
            </h3>
            <p className="text-[11px] text-slate-400">
              {faculty.designation} &bull; Manage Faculty Directory
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <FacultyPhotoPicker
            value={photoUrl}
            onChange={setPhotoUrl}
            label={`Photograph for ${faculty.name}`}
            helperText="Import from Computer or paste Google Drive link"
          />
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between px-6">
          <div className="text-[11px] text-slate-500">
            {saveSuccess && (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Photo updated successfully!
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !photoUrl}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving to Directory...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Update Faculty Photo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

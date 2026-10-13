import React from 'react';
import { X, Download, FileText, ExternalLink, Printer, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { detectFormatInfo, getSafeDownloadFilename, downloadFile } from '../utils/fileDownload';

interface PDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  category?: string;
  fileUrl?: string;
  fileName?: string;
  metadata?: {
    course?: string;
    academicYear?: string;
    semester?: string;
    paperCode?: string;
    date?: string;
    size?: string;
    fileName?: string;
    originalFileName?: string;
    uploadedByRole?: 'admin' | 'student';
    uploaderName?: string;
    uploaderBatch?: string;
  };
}

export const PDFModal: React.FC<PDFModalProps> = ({
  isOpen,
  onClose,
  title,
  category = 'Document',
  fileUrl,
  fileName,
  metadata,
}) => {
  if (!isOpen) return null;

  const samplePdf =
    fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

  const effectiveFileName = fileName || metadata?.fileName || metadata?.originalFileName;
  const formatInfo = detectFormatInfo(samplePdf, effectiveFileName);
  const isImage = formatInfo.isImage;
  const downloadFileName = getSafeDownloadFilename(title, samplePdf, effectiveFileName);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    await downloadFile(samplePdf, downloadFileName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="bg-[#0b1a2f] text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {isImage ? <ImageIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 block">
                {category} • {isImage ? 'Official Attachment / Photo Viewer' : 'Official PDF Viewer'}
              </span>
              <h3 className="text-base sm:text-lg font-bold truncate text-white">
                {title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close Viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata Strip */}
        {metadata && (
          <div className="bg-slate-100 px-5 py-2.5 border-b border-slate-200 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-600">
            {metadata.course && (
              <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-900 font-bold border border-sky-300 text-[11px]">
                {metadata.course}
              </span>
            )}
            {metadata.academicYear && (
              <span>
                <strong className="text-slate-800">Session:</strong> {metadata.academicYear}
              </span>
            )}
            {metadata.semester && (
              <span>
                <strong className="text-slate-800">Term:</strong> {metadata.semester}
              </span>
            )}
            {metadata.paperCode && (
              <span>
                <strong className="text-slate-800">Paper Code:</strong> {metadata.paperCode}
              </span>
            )}
            {metadata.date && (
              <span>
                <strong className="text-slate-800">Date:</strong> {metadata.date}
              </span>
            )}
            {metadata.size && (
              <span>
                <strong className="text-slate-800">File Size:</strong> {metadata.size}
              </span>
            )}
            {metadata.uploadedByRole === 'student' && metadata.uploaderName && (
              <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                <span>Contributed by Student:</span>
                <strong className="text-emerald-950 font-bold">{metadata.uploaderName}</strong>
                {metadata.uploaderBatch && (
                  <span className="text-emerald-700">({metadata.uploaderBatch})</span>
                )}
              </span>
            )}
            {metadata.uploadedByRole === 'admin' && (
              <span className="inline-flex items-center gap-1 text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-medium">
                <span>Contributed by:</span>
                <strong className="text-indigo-950 font-bold">Department of Mathematics</strong>
              </span>
            )}
          </div>
        )}

        {/* Modal Body / Embedded PDF or Image */}
        <div className="flex-1 bg-slate-200 p-2 sm:p-4 min-h-[420px] flex flex-col items-center justify-center relative overflow-hidden">
          {isImage ? (
            <div className="w-full h-[520px] rounded-lg border border-slate-300 shadow-inner bg-slate-900/95 flex items-center justify-center p-3 overflow-auto">
              <img
                src={samplePdf}
                alt={title}
                className="max-h-full max-w-full object-contain rounded shadow-lg"
              />
            </div>
          ) : (
            <iframe
              src={samplePdf}
              title={title}
              className="w-full h-[520px] rounded-lg border border-slate-300 shadow-inner bg-white"
            />
          )}

          <div className="mt-3 text-center text-xs text-slate-500 flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {isImage
                ? 'Official department circular photo. You can view in high resolution or download below.'
                : 'If preview is blocked by your browser settings, use the \'Open in New Window\' or \'Download PDF\' button below.'}
            </span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Panchayat College, Baragada • Department Digital Archive
          </div>

          <div className="flex items-center gap-2">
            <a
              href={samplePdf}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in New Window</span>
            </a>

            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              title={`Download in original format (${formatInfo.extension})`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {isImage
                  ? `Download Photo (${formatInfo.extension.replace('.', '').toUpperCase()})`
                  : `Download Document (${formatInfo.extension.replace('.', '').toUpperCase()})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

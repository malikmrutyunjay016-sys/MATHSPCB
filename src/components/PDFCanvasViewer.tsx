import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  FileText,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { dataUrlToBlob } from '../utils/fileDownload';

// Set up pdfjs worker using unpkg CDN matching the installed pdfjs-dist version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface PDFCanvasViewerProps {
  rawUrlOrData: string;
  title: string;
  onDownload?: () => void;
}

export const PDFCanvasViewer: React.FC<PDFCanvasViewerProps> = ({
  rawUrlOrData,
  title,
  onDownload,
}) => {
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<any>(null);

  // Load PDF Document from rawUrlOrData
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setCurrentPage(1);

    async function loadPdfDoc() {
      try {
        let uint8Array: Uint8Array;

        if (rawUrlOrData.startsWith('data:')) {
          const blob = dataUrlToBlob(rawUrlOrData);
          const arrayBuffer = await blob.arrayBuffer();
          uint8Array = new Uint8Array(arrayBuffer);
        } else if (rawUrlOrData.startsWith('blob:')) {
          const res = await fetch(rawUrlOrData);
          const arrayBuffer = await res.arrayBuffer();
          uint8Array = new Uint8Array(arrayBuffer);
        } else {
          // HTTP/HTTPS URL
          const res = await fetch(rawUrlOrData);
          if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
          const arrayBuffer = await res.arrayBuffer();
          uint8Array = new Uint8Array(arrayBuffer);
        }

        const loadingTask = pdfjsLib.getDocument({
          data: uint8Array,
          cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        if (!isMounted) return;

        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setLoading(false);
      } catch (err: any) {
        console.warn('PDF.js failed to load document:', err);
        if (isMounted) {
          setError(
            err?.message || 'Unable to parse PDF preview inline. Please use the Download button below.'
          );
          setLoading(false);
        }
      }
    }

    loadPdfDoc();

    return () => {
      isMounted = false;
      if (pdfDocRef.current) {
        if (typeof (pdfDocRef.current as any).destroy === 'function') {
          (pdfDocRef.current as any).destroy();
        } else if (typeof (pdfDocRef.current as any).cleanup === 'function') {
          (pdfDocRef.current as any).cleanup();
        }
        pdfDocRef.current = null;
      }
    };
  }, [rawUrlOrData]);

  // Render Current Page onto Canvas
  useEffect(() => {
    if (!pdfDocRef.current || loading || error) return;

    let isCancelled = false;

    async function renderPage() {
      try {
        if (!pdfDocRef.current) return;
        const page = await pdfDocRef.current.getPage(currentPage);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Cancel previous render task if active
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {}
        }

        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale });

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.scale(dpr, dpr);

        const renderContext: any = {
          canvasContext: context,
          viewport,
          canvas,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn('PDF page render error:', err);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [currentPage, scale, loading, error]);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, numPages));
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.6));
  };

  const handleResetZoom = () => {
    setScale(1.2);
  };

  if (loading) {
    return (
      <div className="w-full h-[520px] rounded-lg border border-slate-300 bg-white flex flex-col items-center justify-center space-y-3 p-6 shadow-inner">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-xs font-bold text-slate-700">Rendering Question Paper PDF...</p>
        <span className="text-[11px] text-slate-400">Loading document pages safely for inline viewing</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[520px] rounded-lg border border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-4 shadow-inner">
        <div className="p-3 bg-amber-100 text-amber-800 rounded-full">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="max-w-md space-y-1">
          <h4 className="text-sm font-bold text-slate-800">Inline Frame Preview Restricted</h4>
          <p className="text-xs text-slate-600">{error}</p>
        </div>
        {onDownload && (
          <button
            onClick={onDownload}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download & Open PDF File</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-[520px] rounded-lg border border-slate-300 bg-slate-800 shadow-inner flex flex-col overflow-hidden relative">
      {/* Control Bar */}
      <div className="bg-[#071322] text-slate-200 px-4 py-2 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-amber-400 font-bold">
            Page {currentPage} of {numPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage >= numPages}
            className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 cursor-pointer"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-1 rounded hover:bg-slate-700 text-slate-300 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-300 min-w-[45px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1 rounded hover:bg-slate-700 text-slate-300 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-[11px] font-semibold text-slate-200 cursor-pointer ml-1"
            title="Fit Page"
          >
            Fit Page
          </button>
        </div>
      </div>

      {/* Canvas Display Area */}
      <div className="flex-1 bg-slate-900/90 overflow-auto p-4 flex justify-center items-start">
        <div className="bg-white shadow-2xl rounded p-1 inline-block">
          <canvas ref={canvasRef} className="block max-w-full" />
        </div>
      </div>
    </div>
  );
};

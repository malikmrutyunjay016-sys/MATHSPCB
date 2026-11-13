import React from 'react';
import { CollegeLogo } from './CollegeLogo';
import { Database, Sparkles, CheckCircle2, RefreshCw, Users, FileText } from 'lucide-react';

interface DataLoadingBoxProps {
  loadedCount: number;
  totalCount: number;
  isStudentsLoaded?: boolean;
  isPYQLoaded?: boolean;
  deptName?: string;
  collegeName?: string;
  logoUrl?: string;
}

export const DataLoadingBox: React.FC<DataLoadingBoxProps> = ({
  loadedCount,
  totalCount,
  isStudentsLoaded = false,
  isPYQLoaded = false,
  deptName = 'Department of Mathematics',
  collegeName = 'Panchayat College, Baragada',
  logoUrl,
}) => {
  const rawPercentage = Math.round((loadedCount / Math.max(1, totalCount)) * 100);
  const allRequiredLoaded = isStudentsLoaded && isPYQLoaded && loadedCount >= totalCount;
  const percentage = allRequiredLoaded
    ? 100
    : Math.min(95, Math.max(8, rawPercentage));

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-500 animate-fadeIn">
      {/* Background Decorative Glow Effect */}
      <div className="absolute w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-x-32 translate-y-32" />

      {/* Main Loading Box */}
      <div className="relative w-full max-w-md bg-slate-900/95 text-slate-100 rounded-3xl p-7 md:p-8 shadow-2xl border border-amber-500/30 overflow-hidden text-center flex flex-col items-center">
        {/* Top Gradient Shimmer Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-indigo-500 to-amber-400 animate-pulse" />

        {/* Logo Container Box */}
        <div className="relative mb-6 group">
          {/* Glowing Aura Ring */}
          <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-amber-500 to-indigo-600 opacity-40 blur-md animate-pulse" />
          
          {/* Rotating Dashed Spinner Outer Ring */}
          <div className="absolute -inset-2.5 rounded-full border-2 border-dashed border-amber-400/60 animate-[spin_10s_linear_infinite]" />

          {/* Logo Frame Box */}
          <div className="relative w-24 h-24 rounded-2xl bg-slate-950/90 border border-amber-400/40 p-3 flex items-center justify-center shadow-inner">
            <CollegeLogo className="w-full h-full object-contain" logoUrl={logoUrl} />
          </div>

          {/* Floating Sparkle Badge */}
          <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-1.5 rounded-full shadow-lg border border-slate-900 animate-bounce">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* College & Department Title */}
        <h2 className="text-xl md:text-2xl font-serif-academic font-bold text-amber-300 tracking-wide mb-1 drop-shadow-sm">
          {deptName}
        </h2>
        <p className="text-xs md:text-sm text-slate-400 font-medium mb-6">
          {collegeName}
        </p>

        {/* Loading Message & Progress */}
        <div className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-5 shadow-inner">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-amber-400 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              {!isStudentsLoaded
                ? 'Loading Student Data...'
                : !isPYQLoaded
                ? 'Loading Previous Year Questions...'
                : 'Finalizing Portal Data...'}
            </span>
            <span className="text-slate-300 font-mono bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
              {percentage}%
            </span>
          </div>

          {/* Progress Bar Track */}
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/80">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-indigo-500 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(245,158,11,0.6)]"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Detailed Dataset Checklist */}
          <div className="mt-3.5 space-y-2 border-t border-slate-800/80 pt-3 text-left">
            {/* Student Data Status */}
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-slate-300">
                <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>All Student Data</span>
              </span>
              {isStudentsLoaded ? (
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Loaded
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-400/90 font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Loading...
                </span>
              )}
            </div>

            {/* Previous Year Questions Status */}
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-slate-300">
                <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Previous Year Questions Data</span>
              </span>
              {isPYQLoaded ? (
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Loaded
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-400/90 font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Loading...
                </span>
              )}
            </div>

            {/* Total Modules Counter */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
              <span className="flex items-center gap-1.5">
                <Database className="w-3 h-3 text-indigo-400" />
                Department Modules Synced:
              </span>
              <span className="font-semibold text-slate-200">
                {loadedCount} of {totalCount}
              </span>
            </div>
          </div>
        </div>

        {/* Status Indicator Dots */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Please wait while student &amp; question bank records load...</span>
        </div>
      </div>
    </div>
  );
};


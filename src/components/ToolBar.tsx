import React from 'react';
import {
  LineChart,
  BarChart3,
  ZoomIn,
  RotateCcw,
  Sparkles,
  Layers,
  Wand2,
  FolderOpen,
  Printer,
  SlidersHorizontal,
} from 'lucide-react';
import { SignalMode } from '../lib/dget';

interface ToolBarProps {
  showDeconvolution: boolean;
  onToggleDeconvolution: () => void;
  showIsotopologues: boolean;
  onToggleIsotopologues: () => void;
  onZoomToD: () => void;
  onResetZoom: () => void;
  signalMode: SignalMode;
  onSignalModeChange: (mode: SignalMode) => void;
  onAutoAlign: () => void;
  onAutoAdduct: () => void;
  onOpenFile: () => void;
  onGenerateReport: () => void;
  onOpenSettings: () => void;
}

export const ToolBar: React.FC<ToolBarProps> = ({
  showDeconvolution,
  onToggleDeconvolution,
  showIsotopologues,
  onToggleIsotopologues,
  onZoomToD,
  onResetZoom,
  signalMode,
  onSignalModeChange,
  onAutoAlign,
  onAutoAdduct,
  onOpenFile,
  onGenerateReport,
  onOpenSettings,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto text-xs select-none">
      {/* File Quick Actions */}
      <button
        onClick={onOpenFile}
        className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-xs transition active:scale-95 font-medium"
        title="Open HRMS Data File (.txt, .csv, .tsv)"
      >
        <FolderOpen className="w-3.5 h-3.5 text-sky-600" />
        <span>Open Data</span>
      </button>

      <button
        onClick={onGenerateReport}
        className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-xs transition active:scale-95 font-medium"
        title="Generate PDF or Printable Report (Ctrl+R)"
      >
        <Printer className="w-3.5 h-3.5 text-amber-600" />
        <span>Report</span>
      </button>

      <div className="h-4 w-px bg-slate-200 mx-1" />

      {/* Plot Toggles matching Qt6 Toolbar */}
      <button
        onClick={onToggleDeconvolution}
        className={`flex items-center gap-1 px-2.5 py-1 rounded border shadow-xs transition ${
          showDeconvolution
            ? 'bg-rose-50 border-rose-300 text-rose-800 font-semibold'
            : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
        }`}
        title="Toggle deconvolution reconstruction model curve overlay"
      >
        <LineChart className="w-3.5 h-3.5 text-rose-600" />
        <span>Deconv Fit</span>
      </button>

      <button
        onClick={onToggleIsotopologues}
        className={`flex items-center gap-1 px-2.5 py-1 rounded border shadow-xs transition ${
          showIsotopologues
            ? 'bg-purple-50 border-purple-300 text-purple-800 font-semibold'
            : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
        }`}
        title="Toggle isotopologue integration window highlights"
      >
        <Layers className="w-3.5 h-3.5 text-purple-600" />
        <span>Isotopologues</span>
      </button>

      <div className="h-4 w-px bg-slate-200 mx-1" />

      {/* Zoom controls */}
      <button
        onClick={onZoomToD}
        className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-xs transition"
        title="Zoom viewport to target deuterated envelope"
      >
        <ZoomIn className="w-3.5 h-3.5 text-emerald-600" />
        <span>Zoom to D</span>
      </button>

      <button
        onClick={onResetZoom}
        className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-xs transition"
        title="Reset zoom to full m/z range"
      >
        <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
        <span>Reset Zoom</span>
      </button>

      <div className="h-4 w-px bg-slate-200 mx-1" />

      {/* Signal Extraction Mode (Peak Height vs Area) */}
      <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-300">
        <button
          onClick={() => onSignalModeChange('peak height')}
          className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
            signalMode === 'peak height'
              ? 'bg-white text-sky-800 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Extract signals using maximum peak height within window"
        >
          Peak Height
        </button>
        <button
          onClick={() => onSignalModeChange('peak area')}
          className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
            signalMode === 'peak area'
              ? 'bg-white text-sky-800 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Extract signals using trapezoidal area integration within window"
        >
          Peak Area
        </button>
      </div>

      <div className="h-4 w-px bg-slate-200 mx-1" />

      {/* Scientific Automation Tools */}
      <button
        onClick={onAutoAlign}
        className="flex items-center gap-1 px-2 py-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 shadow-xs transition"
        title="Auto-detect baseline m/z shift against highest envelope peak"
      >
        <Wand2 className="w-3.5 h-3.5 text-sky-600" />
        <span>Auto-Align m/z</span>
      </button>

      <button
        onClick={onAutoAdduct}
        className="flex items-center gap-1 px-2 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 shadow-xs transition"
        title="Probe raw spectrum base peak to identify best candidate adduct"
      >
        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
        <span>Auto-Adduct</span>
      </button>

      {/* Settings at far right */}
      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-transparent hover:border-slate-300 transition"
          title="Analytical preferences"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

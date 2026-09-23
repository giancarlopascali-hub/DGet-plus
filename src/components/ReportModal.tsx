import React, { useEffect } from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import { DGetResult } from '../lib/dget';
import { AppSettings } from './SettingsDialog';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: DGetResult | null;
  fileName: string;
  settings: AppSettings;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  result,
  fileName,
  settings,
}) => {
  // Listen for Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !result) return null;

  const currentDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none overflow-y-auto cursor-pointer"
      title="Click outside to close"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col text-slate-800 my-8 cursor-default overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* STICKY Top Action Bar */}
        <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between sticky top-0 z-30 shadow-xs print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-amber-600" />
            <span className="font-bold text-sm text-slate-900">Deuteration Analysis Certificate & Report</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-semibold text-xs transition flex items-center gap-1"
              title="Close report (Esc)"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close (Esc)</span>
            </button>
          </div>
        </div>

        {/* Printable Document Sheet (Pure White Background) */}
        <div className="p-8 bg-white text-slate-900 font-sans space-y-6 print:p-0">
          {/* Header Branding */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">
                DEUTERIUM INCORPORATION REPORT
              </h1>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold">
                High-Resolution Mass Spectrometry Deconvolution
              </p>
            </div>
            <div className="text-right text-xs font-mono text-slate-600">
              <p>Generated: {currentDate}</p>
              <p className="font-semibold text-slate-900">DGet+ Analytical Suite v2.0</p>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="space-y-1.5">
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500">Sample Data File:</span>
                <span className="font-mono font-bold text-slate-900">{fileName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500">Target Formula:</span>
                <span className="font-mono font-bold text-sky-700">{result.formulaString}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500">Adduct Form:</span>
                <span className="font-mono font-bold text-slate-900">{result.adductString}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500">Analyst:</span>
                <span className="font-semibold text-slate-900">{settings.reportAuthor}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500">Laboratory:</span>
                <span className="font-semibold text-slate-900">{settings.reportInstitution}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500">Signal Extraction:</span>
                <span className="font-mono text-slate-900">Peak Height (±0.33 Da)</span>
              </div>
            </div>
          </div>

          {/* Key Analytical Result Banner */}
          <div className="bg-emerald-50 border-2 border-emerald-500/40 p-5 rounded-xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Overall Deuterium Incorporation</span>
              </div>
              <div className="text-4xl font-black font-mono text-emerald-950 mt-1">
                {result.deuterationPercent.toFixed(2)} %
              </div>
            </div>

            <div className="text-right font-mono">
              <div className="text-xs text-slate-600">Model Fit Residual Error</div>
              <div className="text-xl font-bold text-slate-800">
                {result.residualErrorPercent.toFixed(2)} %
              </div>
              <div className="text-[10px] text-slate-600 mt-0.5">
                {result.residualErrorPercent < 5
                  ? 'Excellent fit (Error < 5%)'
                  : 'Acceptable fit'}
              </div>
            </div>
          </div>

          {/* Isotopic States Breakdown Table */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Deuteration Distribution (Isotopologue States D0 - Dn)
            </h2>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs font-mono border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-left">
                    <th className="p-2">State</th>
                    <th className="p-2 text-right">Target m/z</th>
                    <th className="p-2 text-right">Probability</th>
                    <th className="p-2 text-right">Abundance (%)</th>
                    <th className="p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.stateDetails.map((state) => (
                    <tr
                      key={state.state}
                      className={state.isActive ? 'hover:bg-slate-50' : 'bg-slate-50/50 text-slate-400'}
                    >
                      <td className="p-2 font-bold text-slate-900">{state.label}</td>
                      <td className="p-2 text-right">{state.monoisotopicMz.toFixed(4)}</td>
                      <td className="p-2 text-right">{state.fraction.toFixed(5)}</td>
                      <td className="p-2 text-right font-bold text-sky-700">
                        {state.percent.toFixed(2)} %
                      </td>
                      <td className="p-2 text-center">
                        {state.isActive ? (
                          <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-sans font-semibold">
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-sans font-semibold">
                            Cutoff Excluded
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Graphical Summary in Report */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Distribution Histogram
            </h2>
            <div className="h-28 border border-slate-200 rounded-lg p-2 flex items-end gap-2 bg-slate-50">
              {result.stateDetails.map((state) => {
                const maxPct = Math.max(...result.stateDetails.map((s) => s.percent), 1);
                const heightPct = (state.percent / maxPct) * 100;
                return (
                  <div key={state.state} className="flex-1 flex flex-col items-center h-full justify-end">
                    <span className="text-[9px] font-mono text-slate-600 mb-0.5">
                      {state.percent.toFixed(1)}%
                    </span>
                    <div
                      style={{ height: `${Math.max(4, heightPct * 0.75)}%` }}
                      className={`w-full rounded-t transition-all ${
                        state.isActive ? 'bg-sky-600' : 'bg-slate-300'
                      }`}
                    />
                    <span className="text-[9px] font-mono font-bold text-slate-700 mt-1">
                      {state.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Notice */}
          <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-400 flex justify-between">
            <span>DGet+ Fast Fourier Transform & Deconvolution Methodology</span>
            <span>https://github.com/giancarlopascali-hub/DGet-plus</span>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="bg-slate-100 px-4 py-2.5 border-t border-slate-200 flex justify-end gap-2 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-xs shadow-xs"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  Sliders,
  ChevronLeft,
  ChevronRight,
  Info,
  Layers,
  Atom,
  Hash,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Formula } from '../lib/formula';
import { COMMON_ADDUCTS } from '../lib/adduct';

interface ControlsDockProps {
  formulaInput: string;
  onFormulaChange: (val: string) => void;
  formulaError: string | null;
  parsedFormula: Formula | null;

  adductInput: string;
  onAdductChange: (val: string) => void;
  calculatedAdductMz: number | null;

  cutoffInput: string;
  onCutoffChange: (val: string) => void;

  massShift: number;
  onMassShiftChange: (val: number) => void;

  signalMassWidth: number;
  onSignalMassWidthChange: (val: number) => void;

  totalD: number;
  activeCount: number;
}

export const ControlsDock: React.FC<ControlsDockProps> = ({
  formulaInput,
  onFormulaChange,
  formulaError,
  parsedFormula,
  adductInput,
  onAdductChange,
  calculatedAdductMz,
  cutoffInput,
  onCutoffChange,
  massShift,
  onMassShiftChange,
  signalMassWidth,
  onSignalMassWidthChange,
  totalD,
  activeCount,
}) => {
  // Generate list of possible cutoff options
  const cutoffOptions = React.useMemo(() => {
    const list = ['Auto', 'None'];
    if (totalD > 0) {
      for (let i = 0; i <= totalD; i++) {
        list.push(`D${i}`);
      }
    }
    return list;
  }, [totalD]);

  return (
    <div className="bg-white w-full flex flex-col h-full text-xs select-none min-h-0">
      {/* Dock Header */}
      <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 font-semibold text-slate-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-sky-600" />
          <span>Analytical Parameters</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">DGet Engine</span>
      </div>

      {/* Dock Content */}
      <div className="p-3 space-y-3.5 overflow-y-auto flex-1">
        {/* 1. Formula Input */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-700 flex items-center gap-1">
              <Atom className="w-3.5 h-3.5 text-sky-600" />
              <span>Target Formula</span>
            </label>
            {parsedFormula && (
              <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                {totalD} Deuterium {totalD === 1 ? 'atom' : 'atoms'}
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              value={formulaInput}
              onChange={(e) => onFormulaChange(e.target.value)}
              placeholder="e.g. C12HD8N"
              className={`w-full bg-white border ${
                formulaError ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-sky-500'
              } rounded-md px-2.5 py-1 text-slate-900 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-xs`}
            />
          </div>

          {formulaError ? (
            <div className="flex items-center gap-1 text-[11px] text-rose-600 mt-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <span>{formulaError}</span>
            </div>
          ) : parsedFormula ? (
            <div className="text-[10px] text-slate-500 flex justify-between px-0.5 font-mono">
              <span>Mono: {parsedFormula.monoisotopicMass.toFixed(4)} Da</span>
              <span>Avg: {parsedFormula.averageMass.toFixed(4)} Da</span>
            </div>
          ) : null}
        </div>

        {/* 2. Adduct Form */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-700 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>Adduct Form</span>
            </label>
            {calculatedAdductMz && (
              <span className="text-[10px] font-mono text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                Target: {calculatedAdductMz.toFixed(4)} m/z
              </span>
            )}
          </div>

          <div className="flex gap-1.5">
            <input
              type="text"
              value={adductInput}
              onChange={(e) => onAdductChange(e.target.value)}
              placeholder="[M-H]-"
              className="flex-1 bg-white border border-slate-300 rounded-md px-2.5 py-1 text-slate-900 font-mono text-xs focus:outline-none focus:border-sky-500 shadow-xs"
            />
            <select
              value={COMMON_ADDUCTS.includes(adductInput) ? adductInput : ''}
              onChange={(e) => {
                if (e.target.value) onAdductChange(e.target.value);
              }}
              className="bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-slate-700 text-xs focus:outline-none cursor-pointer"
            >
              <option value="" disabled>
                Preset...
              </option>
              {COMMON_ADDUCTS.map((ad) => (
                <option key={ad} value={ad}>
                  {ad}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Cutoff Selection */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-700 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-amber-600" />
              <span>Calculation Cutoff</span>
            </label>
            <span className="text-[10px] text-slate-500 font-mono">
              Active states: <strong className="text-slate-800">{activeCount}</strong>/{totalD + 1}
            </span>
          </div>

          <select
            value={cutoffInput}
            onChange={(e) => onCutoffChange(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1 text-slate-900 text-xs focus:outline-none focus:border-sky-500 shadow-xs cursor-pointer font-mono"
          >
            {cutoffOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt === 'Auto'
                  ? 'Auto (Recommended - noise threshold)'
                  : opt === 'None'
                  ? 'None (Include all states D0 - Dn)'
                  : `Cutoff at ${opt} (Exclude < ${opt})`}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Mass Shift (Alignment Calibration) */}
        <div className="space-y-1 border-t border-slate-200 pt-3">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-700">Mass Shift (m/z Offset)</label>
            <span className="font-mono text-slate-900 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
              {massShift > 0 ? `+${massShift.toFixed(4)}` : massShift.toFixed(4)} Da
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onMassShiftChange(Number((massShift - 0.01).toFixed(4)))}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition text-[11px] font-mono shadow-xs"
              title="Nudge mass shift down 0.01 Da"
            >
              -0.01
            </button>
            <button
              onClick={() => onMassShiftChange(Number((massShift - 0.001).toFixed(4)))}
              className="px-1.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition text-[11px] font-mono shadow-xs"
              title="Nudge mass shift down 0.001 Da"
            >
              -0.001
            </button>

            <input
              type="range"
              min="-0.2"
              max="0.2"
              step="0.001"
              value={massShift}
              onChange={(e) => onMassShiftChange(parseFloat(e.target.value))}
              className="flex-1 accent-sky-600 cursor-pointer h-1.5 bg-slate-200 rounded"
            />

            <button
              onClick={() => onMassShiftChange(Number((massShift + 0.001).toFixed(4)))}
              className="px-1.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition text-[11px] font-mono shadow-xs"
              title="Nudge mass shift up 0.001 Da"
            >
              +0.001
            </button>
            <button
              onClick={() => onMassShiftChange(Number((massShift + 0.01).toFixed(4)))}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition text-[11px] font-mono shadow-xs"
              title="Nudge mass shift up 0.01 Da"
            >
              +0.01
            </button>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400">
            <span>Calibrate target envelope offset</span>
            {massShift !== 0 && (
              <button
                onClick={() => onMassShiftChange(0)}
                className="text-sky-600 hover:text-sky-700 underline"
              >
                Reset to 0
              </button>
            )}
          </div>
        </div>

        {/* 5. Signal Mass Width (Integration Window) */}
        <div className="space-y-1 border-t border-slate-200 pt-3">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-700">Integration Window (± m/z)</label>
            <span className="font-mono text-slate-800 font-bold text-[11px]">
              ± {signalMassWidth.toFixed(2)} m/z
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0.05"
              max="1.0"
              step="0.01"
              value={signalMassWidth}
              onChange={(e) => onSignalMassWidthChange(parseFloat(e.target.value))}
              className="flex-1 accent-sky-600 cursor-pointer h-1.5 bg-slate-200 rounded"
            />
            <input
              type="number"
              min="0.05"
              max="2.0"
              step="0.01"
              value={signalMassWidth}
              onChange={(e) => onSignalMassWidthChange(parseFloat(e.target.value) || 0.33)}
              className="w-16 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono text-xs focus:outline-none focus:border-sky-500 shadow-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

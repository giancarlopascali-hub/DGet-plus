import React, { useState } from 'react';
import { Terminal, Copy, Check, Download } from 'lucide-react';
import { DGetResult } from '../lib/dget';

interface ResultsTextDockProps {
  result: DGetResult | null;
}

export const ResultsTextDock: React.FC<ResultsTextDockProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);

  const formattedText = React.useMemo(() => {
    if (!result) return 'No calculation performed yet.';

    const lines: string[] = [];
    lines.push(`Deuteration:   ${result.deuterationPercent.toFixed(2).padStart(10, ' ')} %`);
    lines.push(`Residual error:${result.residualErrorPercent.toFixed(2).padStart(9, ' ')} %`);
    lines.push('');
    lines.push('Deuteration Ratio Spectra');

    for (const state of result.stateDetails) {
      const stateStr = state.label.padEnd(4, ' ');
      const pctStr = state.percent.toFixed(2).padStart(16, ' ');
      const status = state.isActive ? '' : ' (excluded by cutoff)';
      lines.push(`${stateStr}: ${pctStr} %${status}`);
    }

    return lines.join('\n');
  }, [result]);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([formattedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dget_results_${result?.formulaString || 'analysis'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white flex-1 flex flex-col h-full min-h-0 text-xs select-none border-r border-slate-200">
      <div className="bg-slate-100 px-3 py-1 border-b border-slate-200 font-semibold text-slate-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-emerald-600" />
          <span>Results Text</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            disabled={!result}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[11px] shadow-xs disabled:opacity-50 transition"
            title="Copy Results Text to Clipboard"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={!result}
            className="p-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-xs disabled:opacity-50 transition"
            title="Download text file"
          >
            <Download className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="p-3 flex-1 overflow-y-auto font-mono text-[11px] text-slate-800 bg-slate-50 selection:bg-sky-200">
        <pre className="whitespace-pre font-mono leading-relaxed">{formattedText}</pre>
      </div>
    </div>
  );
};

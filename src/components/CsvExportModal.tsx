import React, { useState, useMemo } from 'react';
import { X, Download, FileSpreadsheet, CheckSquare, Square, Filter } from 'lucide-react';
import { LoadedFile } from '../types/session';

interface CsvExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: LoadedFile[];
  activeFileId: string;
}

export const CsvExportModal: React.FC<CsvExportModalProps> = ({
  isOpen,
  onClose,
  files,
  activeFileId,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set([activeFileId]));
  const [includeStateBreakdown, setIncludeStateBreakdown] = useState<boolean>(true);

  // Synchronize when active file changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set([activeFileId]));
    }
  }, [isOpen, activeFileId]);

  if (!isOpen) return null;

  const toggleSelectAll = () => {
    if (selectedIds.size === files.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(files.map((f) => f.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleExportSelected = () => {
    const exportFiles = files.filter((f) => selectedIds.has(f.id));
    if (exportFiles.length === 0) return;

    // Collect all unique states across files
    let maxD = 0;
    exportFiles.forEach((f) => {
      if (f.result) {
        maxD = Math.max(maxD, f.result.deuteriumCount);
      }
    });

    const headers = [
      'File_Name',
      'Target_Formula',
      'Adduct',
      'Cutoff',
      'Signal_Mode',
      'Mass_Width_Da',
      'Mass_Shift_Da',
      'Data_Points',
      'Deuteration_Percent',
      'Residual_Error_Percent',
      'Active_States_Count',
    ];

    if (includeStateBreakdown) {
      for (let i = 0; i <= maxD; i++) {
        headers.push(`D${i}_Prob_Fraction`, `D${i}_Percent_Abundance`, `D${i}_Active`);
      }
    }

    const rows = exportFiles.map((f) => {
      const res = f.result;
      const baseRow = [
        `"${f.fileName}"`,
        `"${f.formula}"`,
        `"${f.adduct}"`,
        `"${f.cutoff}"`,
        `"${f.signalMode}"`,
        f.signalMassWidth.toFixed(3),
        f.massShift.toFixed(4),
        f.rowCount,
        res ? res.deuterationPercent.toFixed(4) : 'N/A',
        res ? res.residualErrorPercent.toFixed(4) : 'N/A',
        res ? res.activeStates.length : 'N/A',
      ];

      if (includeStateBreakdown) {
        for (let i = 0; i <= maxD; i++) {
          if (!res) {
            baseRow.push('N/A', 'N/A', 'N/A');
          } else {
            const st = res.stateDetails.find((s) => s.state === i);
            if (st) {
              baseRow.push(
                st.fraction.toFixed(6),
                st.percent.toFixed(4),
                st.isActive ? 'Included' : 'Cutoff_Excluded'
              );
            } else {
              baseRow.push('0.000000', '0.0000', 'N/A');
            }
          }
        }
      }

      return baseRow.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    const scopeName = exportFiles.length === 1 ? exportFiles[0].fileName.replace(/\.[^/.]+$/, '') : `${exportFiles.length}_files`;
    link.download = `dget_report_${scopeName}_${timestamp}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-xs select-none">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden text-slate-800">
        {/* Modal Header */}
        <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-sm text-slate-900">Export CSV Analytical Report</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3 bg-slate-50/50">
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Select files to export. The exported CSV contains comprehensive analytical parameters, deuteration percentages, model residuals, and individual D0–Dn isotopologue state ratios.
          </p>

          {/* Quick Selection Buttons */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-300 font-medium text-slate-700 shadow-xs"
              >
                {selectedIds.size === files.length ? (
                  <CheckSquare className="w-3.5 h-3.5 text-sky-600" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{selectedIds.size === files.length ? 'Deselect All' : 'Select All Files'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set([activeFileId]))}
                className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-300 font-medium text-slate-700 shadow-xs"
              >
                Only Active File
              </button>
            </div>
            <span className="text-slate-500 font-mono text-[11px]">
              {selectedIds.size} of {files.length} selected
            </span>
          </div>

          {/* Files Checkbox List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white shadow-inner">
            {files.map((file, idx) => {
              const isChecked = selectedIds.has(file.id);
              const res = file.result;
              return (
                <label
                  key={file.id}
                  className={`flex items-center justify-between p-2.5 cursor-pointer transition ${
                    isChecked ? 'bg-sky-50/70 hover:bg-sky-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelectOne(file.id)}
                      className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                    />
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: file.color }} />
                    <div className="truncate">
                      <div className="font-bold text-slate-900 truncate font-mono text-[11px]">{file.fileName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {file.formula} • {file.adduct}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    {res ? (
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">
                        {res.deuterationPercent.toFixed(2)} % D
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[10px]">Pending</span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          {/* Export Options */}
          <div className="bg-white p-2.5 rounded border border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeStateBreakdown}
                onChange={(e) => setIncludeStateBreakdown(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
              />
              <span className="text-slate-700 font-medium text-[11px]">
                Include individual deuteration states breakdown (D0 – Dn probabilities & abundances)
              </span>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-4 py-2.5 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded hover:bg-slate-200 text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={selectedIds.size === 0}
            onClick={handleExportSelected}
            className={`px-4 py-1.5 rounded font-semibold flex items-center gap-1.5 shadow-sm transition ${
              selectedIds.size === 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV ({selectedIds.size} file{selectedIds.size === 1 ? '' : 's'})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

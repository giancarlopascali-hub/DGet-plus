import React, { useState, useMemo } from 'react';
import {
  Files,
  Plus,
  Trash2,
  Search,
  CheckCircle,
  FileSpreadsheet,
  Download,
  Filter,
  ArrowDownUp,
  X,
} from 'lucide-react';
import { LoadedFile } from '../types/session';

interface FilesDockProps {
  files: LoadedFile[];
  activeFileId: string;
  onSelectActiveFile: (id: string) => void;
  onRemoveFile: (id: string) => void;
  onOpenImport: () => void;
  onOpenExportModal: () => void;
}

export const FilesDock: React.FC<FilesDockProps> = ({
  files,
  activeFileId,
  onSelectActiveFile,
  onRemoveFile,
  onOpenImport,
  onOpenExportModal,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'default' | 'name' | 'deuteration'>('default');

  // Filtered and sorted files
  const displayedFiles = useMemo(() => {
    let list = [...files];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (f) =>
          f.fileName.toLowerCase().includes(q) ||
          f.formula.toLowerCase().includes(q) ||
          f.adduct.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'name') {
      list.sort((a, b) => a.fileName.localeCompare(b.fileName));
    } else if (sortBy === 'deuteration') {
      list.sort((a, b) => {
        const da = a.result?.deuterationPercent ?? -1;
        const db = b.result?.deuterationPercent ?? -1;
        return db - da;
      });
    }
    return list;
  }, [files, searchQuery, sortBy]);

  return (
    <div className="bg-white w-full h-full flex flex-col text-xs select-none border-r border-slate-300 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 font-semibold text-slate-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Files className="w-4 h-4 text-sky-600" />
          <span className="font-bold text-slate-900">Files Under Analysis</span>
          <span className="bg-sky-100 text-sky-800 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full border border-sky-300">
            {files.length}
          </span>
        </div>

        <button
          onClick={onOpenImport}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-medium text-[11px] shadow-sm transition active:scale-95"
          title="Add / Import more HRMS files (.txt, .csv, .tsv)"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add File</span>
        </button>
      </div>

      {/* Search & Sort Toolbar */}
      <div className="p-2 border-b border-slate-200 bg-slate-50 flex flex-col gap-1.5 flex-shrink-0">
        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search filename, formula..."
            className="w-full bg-white border border-slate-300 rounded pl-7 pr-6 py-1 text-[11px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-1.5 top-1.5 text-slate-400 hover:text-slate-600 p-0.5 rounded"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Quick controls row */}
        <div className="flex items-center justify-between text-[10px] text-slate-600 px-0.5">
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-slate-200 rounded px-1 py-0.5 text-[10px] text-slate-700"
            >
              <option value="default">Import Order</option>
              <option value="name">Name</option>
              <option value="deuteration">% Deuteration</option>
            </select>
          </div>

          <span className="text-[10px] text-slate-500">
            Click file to select & view profile
          </span>
        </div>
      </div>

      {/* Files Scrollable List (Taking full available vertical height) */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white min-h-0">
        {displayedFiles.length === 0 ? (
          <div className="p-6 text-center text-slate-400 italic text-[11px] flex flex-col items-center gap-2">
            <Files className="w-6 h-6 text-slate-300" />
            <span>{searchQuery ? 'No matching files found' : 'No files loaded'}</span>
          </div>
        ) : (
          displayedFiles.map((file) => {
            const isActive = file.id === activeFileId;
            return (
              <div
                key={file.id}
                onClick={() => onSelectActiveFile(file.id)}
                className={`px-3 py-2 flex items-center justify-between cursor-pointer transition select-none ${
                  isActive
                    ? 'bg-sky-50/90 border-l-4 border-l-sky-600'
                    : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                }`}
              >
                {/* Left: Swatch and File Info */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Active Indicator Swatch */}
                  <span
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-xs border ${
                      isActive ? 'bg-sky-600 ring-2 ring-sky-300' : 'bg-slate-300'
                    }`}
                  />

                  {/* Name and Metadata */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`truncate font-medium text-[11px] ${
                          isActive ? 'text-sky-950 font-bold' : 'text-slate-800'
                        }`}
                        title={file.fileName}
                      >
                        {file.fileName}
                      </span>
                      {isActive && (
                        <span className="bg-sky-600 text-white text-[8.5px] px-1 py-0.2 rounded font-bold uppercase tracking-wider flex-shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5 truncate">
                      <span className="truncate text-sky-700 font-semibold">{file.formula}</span>
                      <span>•</span>
                      <span>{file.adduct}</span>
                      <span>•</span>
                      <span>{file.rowCount.toLocaleString()} pts</span>
                    </div>
                  </div>
                </div>

                {/* Right: Deuteration Result Badge & Delete */}
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  {file.result ? (
                    <div className="text-right">
                      <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block">
                        {file.result.deuterationPercent.toFixed(1)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Pending</span>
                  )}

                  {files.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFile(file.id);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Remove file from session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Export CSV Action */}
      <div className="bg-slate-100 p-2.5 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
        <span className="text-slate-500 text-[10px] font-mono">
          {files.length} sample{files.length === 1 ? '' : 's'}
        </span>
        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] shadow-xs transition active:scale-95"
          title="Export CSV report for one, selected, or all files"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Export CSV...</span>
        </button>
      </div>
    </div>
  );
};

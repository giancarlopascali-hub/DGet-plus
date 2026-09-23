import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  Sliders,
  Layers,
  Trash2,
  Check,
} from 'lucide-react';
import { detectTextFormat, parseMsText, ParseResult, LoadOptions, FormatDetection } from '../lib/io';

export interface BatchParsedFile {
  fileName: string;
  result: ParseResult;
}

interface StagedFile {
  file: File;
  content: string;
  name: string;
  detection: FormatDetection;
  customOptions?: LoadOptions;
  parseError?: string | null;
}

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchDataLoaded: (files: BatchParsedFile[]) => void;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({
  isOpen,
  onClose,
  onBatchDataLoaded,
}) => {
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [applyGlobalToAll, setApplyGlobalToAll] = useState<boolean>(true);

  // Common options
  const [globalDelimiter, setGlobalDelimiter] = useState<string>('\t');
  const [globalSkipRows, setGlobalSkipRows] = useState<number>(0);
  const [globalMassCol, setGlobalMassCol] = useState<number>(0);
  const [globalSignalCol, setGlobalSignalCol] = useState<number>(1);

  // Error message
  const [dialogError, setDialogError] = useState<string | null>(null);

  // Reset when opened
  useEffect(() => {
    if (!isOpen) {
      setStagedFiles([]);
      setSelectedIndex(0);
      setDialogError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const filesArray = Array.from(fileList);

    const newStaged: StagedFile[] = [];

    filesArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        try {
          const detection = detectTextFormat(text);
          newStaged.push({
            file,
            content: text,
            name: file.name,
            detection,
          });

          // If this is the first file loaded, set initial global options
          if (newStaged.length === 1) {
            setGlobalDelimiter(detection.delimiter);
            setGlobalSkipRows(detection.skipRows);
            setGlobalMassCol(detection.massCol);
            setGlobalSignalCol(detection.signalCol);
          }

          setStagedFiles([...newStaged]);
        } catch (err: any) {
          newStaged.push({
            file,
            content: text,
            name: file.name,
            detection: {
              delimiter: '\t',
              skipRows: 0,
              massCol: 0,
              signalCol: 1,
              sampleRows: [],
              isShimadzu: false,
            },
            parseError: err.message || 'Detection failed',
          });
          setStagedFiles([...newStaged]);
        }
      };
      reader.readAsText(file);
    });
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (index: number) => {
    const updated = stagedFiles.filter((_, idx) => idx !== index);
    setStagedFiles(updated);
    if (selectedIndex >= updated.length) {
      setSelectedIndex(Math.max(0, updated.length - 1));
    }
  };

  const selectedStaged = stagedFiles[selectedIndex] || null;

  const handleConfirmImport = () => {
    if (stagedFiles.length === 0) return;

    const parsedBatch: BatchParsedFile[] = [];
    const errors: string[] = [];

    for (const item of stagedFiles) {
      try {
        const options: LoadOptions = applyGlobalToAll
          ? {
              delimiter: globalDelimiter,
              skipRows: globalSkipRows,
              massCol: globalMassCol,
              signalCol: globalSignalCol,
            }
          : item.customOptions || {
              delimiter: item.detection.delimiter,
              skipRows: item.detection.skipRows,
              massCol: item.detection.massCol,
              signalCol: item.detection.signalCol,
            };

        const result = parseMsText(item.content, options);
        result.fileName = item.name;
        parsedBatch.push({ fileName: item.name, result });
      } catch (err: any) {
        errors.push(`${item.name}: ${err.message || 'Failed to parse'}`);
      }
    }

    if (errors.length > 0 && parsedBatch.length === 0) {
      setDialogError(errors.join('; '));
      return;
    }

    onBatchDataLoaded(parsedBatch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-xs select-none">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header - Bright theme */}
        <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-sky-600" />
            <span className="font-bold text-sm text-slate-900">
              Import HRMS Data Files (Single or Batch)
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto bg-slate-50/50">
          {stagedFiles.length === 0 ? (
            /* Dropzone */
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition bg-white hover:bg-sky-50/30"
              onClick={() => document.getElementById('batch-file-upload-input')?.click()}
            >
              <Upload className="w-12 h-12 text-sky-600 mb-3" />
              <p className="text-sm font-semibold text-slate-800">
                Drag and drop your mass spectrometry file(s) here
              </p>
              <p className="text-xs text-slate-500 mt-1">
                You can select one or multiple files (.txt, .csv, .tsv, Shimadzu exports)
              </p>
              <button
                type="button"
                className="mt-4 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-sm transition"
              >
                Browse Files...
              </button>
              <input
                id="batch-file-upload-input"
                type="file"
                multiple
                accept=".txt,.csv,.tsv,.dat"
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Batch files management strip */}
              <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-sky-600" />
                    <span>Selected Files ({stagedFiles.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => document.getElementById('batch-file-upload-input')?.click()}
                    className="text-xs text-sky-600 hover:text-sky-700 font-medium"
                  >
                    + Add more files
                  </button>
                  <input
                    id="batch-file-upload-input"
                    type="file"
                    multiple
                    accept=".txt,.csv,.tsv,.dat"
                    className="hidden"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                  />
                </div>

                {/* Staged file chips */}
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {stagedFiles.map((sf, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedIndex(idx)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition ${
                        selectedIndex === idx
                          ? 'bg-sky-50 border-sky-400 text-sky-950 font-semibold shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 text-sky-600" />
                      <span className="truncate max-w-[150px]">{sf.name}</span>
                      {sf.detection.isShimadzu && (
                        <span className="bg-purple-100 text-purple-800 text-[9px] px-1 rounded">
                          Shimadzu
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(idx);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Parsing Settings Banner */}
              <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-semibold text-slate-800">
                    Format & Column Parsing Settings
                  </span>
                  <label className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyGlobalToAll}
                      onChange={(e) => setApplyGlobalToAll(e.target.checked)}
                      className="rounded accent-sky-600 cursor-pointer"
                    />
                    <span>Apply these settings to all {stagedFiles.length} files</span>
                  </label>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1 font-medium">Delimiter</label>
                    <select
                      value={globalDelimiter}
                      onChange={(e) => setGlobalDelimiter(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:outline-none"
                    >
                      <option value="\t">Tab (\t)</option>
                      <option value=",">Comma (,)</option>
                      <option value=";">Semicolon (;)</option>
                      <option value=" ">Whitespace (Space)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1 font-medium">Skip Header Rows</label>
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      value={globalSkipRows}
                      onChange={(e) => setGlobalSkipRows(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1 font-medium">m/z Column</label>
                    <select
                      value={globalMassCol}
                      onChange={(e) => setGlobalMassCol(parseInt(e.target.value, 10))}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:outline-none"
                    >
                      <option value={0}>Col 1 (Index 0)</option>
                      <option value={1}>Col 2 (Index 1)</option>
                      <option value={2}>Col 3 (Index 2)</option>
                      <option value={3}>Col 4 (Index 3)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1 font-medium">Intensity Column</label>
                    <select
                      value={globalSignalCol}
                      onChange={(e) => setGlobalSignalCol(parseInt(e.target.value, 10))}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:outline-none"
                    >
                      <option value={0}>Col 1 (Index 0)</option>
                      <option value={1}>Col 2 (Index 1)</option>
                      <option value={2}>Col 3 (Index 2)</option>
                      <option value={3}>Col 4 (Index 3)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Data Preview Table for Selected File */}
              {selectedStaged && (
                <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-slate-700">
                      Preview: <strong className="font-mono text-slate-900">{selectedStaged.name}</strong>
                    </span>
                    <span className="text-slate-400 text-[10px]">Showing first 6 data lines</span>
                  </div>

                  <div className="border border-slate-200 rounded overflow-x-auto max-h-36">
                    <table className="w-full text-left text-[11px] font-mono border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                          <th className="p-1.5 w-12 text-center">Row</th>
                          {selectedStaged.detection.sampleRows[0]?.map((_cell: string, colIdx: number) => (
                            <th
                              key={colIdx}
                              className={`p-1.5 ${
                                colIdx === globalMassCol
                                  ? 'bg-sky-100 text-sky-900 font-bold border-b-2 border-sky-600'
                                  : colIdx === globalSignalCol
                                  ? 'bg-emerald-100 text-emerald-900 font-bold border-b-2 border-emerald-600'
                                  : ''
                              }`}
                            >
                              Col {colIdx + 1}{' '}
                              {colIdx === globalMassCol
                                ? '(m/z)'
                                : colIdx === globalSignalCol
                                ? '(Intensity)'
                                : ''}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStaged.detection.sampleRows.slice(0, 6).map((row: string[], rIdx: number) => (
                          <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-1.5 text-center text-slate-400 text-[10px]">
                              {globalSkipRows + rIdx + 1}
                            </td>
                            {row.map((cell: string, cIdx: number) => (
                              <td
                                key={cIdx}
                                className={`p-1.5 truncate max-w-[130px] ${
                                  cIdx === globalMassCol
                                    ? 'text-sky-800 font-semibold bg-sky-50/50'
                                    : cIdx === globalSignalCol
                                    ? 'text-emerald-800 font-semibold bg-emerald-50/50'
                                    : 'text-slate-600'
                                }`}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {dialogError && (
                <div className="bg-rose-50 border border-rose-300 p-2.5 rounded-lg flex items-center gap-2 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{dialogError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-4 py-2.5 border-t border-slate-200 flex items-center justify-between">
          <span className="text-slate-500 text-[11px]">
            {stagedFiles.length > 0 && `${stagedFiles.length} file(s) staged for analysis`}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={stagedFiles.length === 0}
              className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition disabled:opacity-50 shadow-sm"
            >
              {stagedFiles.length > 1
                ? `Import All ${stagedFiles.length} Files`
                : 'Import File into Session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

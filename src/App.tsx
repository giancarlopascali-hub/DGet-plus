import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Terminal,
  BarChart3,
  Files,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { MenuBar } from './components/MenuBar';
import { ToolBar } from './components/ToolBar';
import { FilesDock } from './components/FilesDock';
import { ControlsDock } from './components/ControlsDock';
import { FormulaSpectraDock } from './components/FormulaSpectraDock';
import { MainSpectraCanvas } from './components/MainSpectraCanvas';
import { ResultsTextDock } from './components/ResultsTextDock';
import { ResultsGraphDock } from './components/ResultsGraphDock';
import { ImportDialog, BatchParsedFile } from './components/ImportDialog';
import { SettingsDialog, AppSettings } from './components/SettingsDialog';
import { ReportModal } from './components/ReportModal';
import { AboutModal } from './components/AboutModal';
import { CsvExportModal } from './components/CsvExportModal';
import { Formula } from './lib/formula';
import { Adduct } from './lib/adduct';
import { DGet, DGetResult, SignalMode } from './lib/dget';
import { SampleDataset, parseMsText } from './lib/io';
import { LoadedFile, FILE_COLORS } from './types/session';
import defaultSampleData from './data/sample_ndf_b030.json';

const DEFAULT_SETTINGS: AppSettings = {
  defaultAdduct: '[M-H]-',
  defaultSignalMode: 'peak height',
  defaultMassWidth: 0.33,
  reportAuthor: 'Dr. Giancarlo Pascali',
  reportInstitution: 'Mass Spectrometry Laboratory',
};

// Initial default sample file
const INITIAL_FILE_ID = 'file_initial_ndf_b030';
const INITIAL_FILE: LoadedFile = {
  id: INITIAL_FILE_ID,
  fileName: 'NDF-B-030.txt',
  data: defaultSampleData,
  rowCount: defaultSampleData.x.length,
  minMz: defaultSampleData.x[0] || 0,
  maxMz: defaultSampleData.x[defaultSampleData.x.length - 1] || 100,
  maxIntensity: Math.max(...defaultSampleData.y),
  formula: 'C12HD8N',
  adduct: '[M-H]-',
  cutoff: 'Auto',
  massShift: 0.0,
  signalMassWidth: 0.33,
  signalMode: 'peak height',
  color: FILE_COLORS[0],
  isVisible: true,
  zoomDEnabled: false,
};

export const App: React.FC = () => {
  // Session Files State
  const [files, setFiles] = useState<LoadedFile[]>([INITIAL_FILE]);
  const [activeFileId, setActiveFileId] = useState<string>(INITIAL_FILE_ID);

  // Active File reference
  const activeFile = useMemo(() => {
    return files.find((f) => f.id === activeFileId) || files[0] || null;
  }, [files, activeFileId]);

  // Active File analytical parameter state
  const [formulaInput, setFormulaInput] = useState<string>(INITIAL_FILE.formula);
  const [adductInput, setAdductInput] = useState<string>(INITIAL_FILE.adduct);
  const [cutoffInput, setCutoffInput] = useState<string>(INITIAL_FILE.cutoff);
  const [massShift, setMassShift] = useState<number>(INITIAL_FILE.massShift);
  const [signalMassWidth, setSignalMassWidth] = useState<number>(INITIAL_FILE.signalMassWidth);
  const [signalMode, setSignalMode] = useState<SignalMode>(INITIAL_FILE.signalMode);

  // Sync inputs when active file changes
  useEffect(() => {
    if (activeFile) {
      setFormulaInput(activeFile.formula);
      setAdductInput(activeFile.adduct);
      setCutoffInput(activeFile.cutoff);
      setMassShift(activeFile.massShift);
      setSignalMassWidth(activeFile.signalMassWidth);
      setSignalMode(activeFile.signalMode);
    }
  }, [activeFile?.id]);

  // Update file object with cascading strategy to all files below it
  const updateActiveFileParams = useCallback(
    (updates: Partial<LoadedFile>) => {
      setFiles((prev) => {
        const activeIdx = prev.findIndex((f) => f.id === activeFileId);
        if (activeIdx === -1) return prev;

        return prev.map((file, idx) => {
          // Update active file and cascade to all files below it
          if (idx >= activeIdx) {
            return { ...file, ...updates };
          }
          return file;
        });
      });
    },
    [activeFileId]
  );

  // Visualization Options
  const [showDeconvolution, setShowDeconvolution] = useState<boolean>(true);
  const [showIsotopologues, setShowIsotopologues] = useState<boolean>(true);
  const [isPlotMaximized, setIsPlotMaximized] = useState<boolean>(false);
  const [isBottomCollapsed, setIsBottomCollapsed] = useState<boolean>(false);

  // Dock Visibility State
  const [docksVisibility, setDocksVisibility] = useState({
    files: true,
    controls: true,
    formulaSpectra: true,
    resultsText: true,
    resultsGraph: true,
  });

  // Dialog / Modal Visibility
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isCsvExportOpen, setIsCsvExportOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Status Bar Notification
  const [statusMessage, setStatusMessage] = useState<string>('Ready • Loaded NDF-B-030.txt');

  // Parse Formula
  const { parsedFormula, formulaError } = useMemo(() => {
    if (!formulaInput.trim()) {
      return { parsedFormula: null, formulaError: 'Please enter a chemical formula' };
    }
    try {
      const f = new Formula(formulaInput);
      if (f.deuteriumCount === 0) {
        return {
          parsedFormula: f,
          formulaError: 'Formula must contain deuterium (D or [2H])',
        };
      }
      return { parsedFormula: f, formulaError: null };
    } catch (err: any) {
      return { parsedFormula: null, formulaError: err.message || 'Invalid formula' };
    }
  }, [formulaInput]);

  // Calculate Adduct target base m/z
  const calculatedAdductMz = useMemo(() => {
    if (!parsedFormula) return null;
    try {
      const ad = new Adduct(parsedFormula, adductInput);
      return ad.mz;
    } catch {
      return null;
    }
  }, [parsedFormula, adductInput]);

  // Cache of calculation results per file ID to avoid triggering re-renders via state updates
  const resultsCacheRef = useRef<Record<string, DGetResult>>({});

  // Execute DGet Calculation for Active File
  const calculationResult: DGetResult | null = useMemo(() => {
    if (
      !parsedFormula ||
      !activeFile ||
      activeFile.data.x.length === 0 ||
      formulaError
    ) {
      return null;
    }

    try {
      const dget = new DGet({
        formula: parsedFormula,
        data: activeFile.data,
        adduct: adductInput,
        cutoff: cutoffInput,
        signalMassWidth,
        signalMode,
        massShift,
      });
      const res = dget.calculate();
      if (activeFileId) {
        resultsCacheRef.current[activeFileId] = res;
      }
      return res;
    } catch (err: any) {
      console.warn('Calculation error:', err);
      return null;
    }
  }, [activeFile?.data, activeFileId, parsedFormula, adductInput, cutoffInput, signalMassWidth, signalMode, massShift, formulaError]);

  // Files merged with their latest calculation results for FilesDock & summary exports
  const filesWithResults = useMemo(() => {
    return files.map((f) => {
      let r = f.id === activeFileId ? (calculationResult || resultsCacheRef.current[f.id]) : resultsCacheRef.current[f.id];
      if (!r) {
        // Compute on-the-fly for any other file using its parameters
        try {
          const form = new Formula(f.formula);
          if (form.deuteriumCount > 0 && f.data.x.length > 0) {
            const dg = new DGet({
              formula: form,
              data: f.data,
              adduct: f.adduct,
              cutoff: f.cutoff,
              signalMassWidth: f.signalMassWidth,
              signalMode: f.signalMode,
              massShift: f.massShift,
            });
            r = dg.calculate();
            resultsCacheRef.current[f.id] = r;
          }
        } catch {
          // ignore
        }
      }
      return { ...f, result: r || undefined };
    });
  }, [files, activeFileId, calculationResult]);

  // Toggle dock visibility
  const handleToggleDock = (dock: 'files' | 'controls' | 'formulaSpectra' | 'resultsText' | 'resultsGraph') => {
    setDocksVisibility((prev) => ({
      ...prev,
      [dock]: !prev[dock],
    }));
  };

  const handleResetLayout = () => {
    setDocksVisibility({
      files: true,
      controls: true,
      formulaSpectra: true,
      resultsText: true,
      resultsGraph: true,
    });
    setIsPlotMaximized(false);
    setIsBottomCollapsed(false);
    setStatusMessage('Layout restored to default');
  };

  // Multi-File Batch Data Loaded with cascading parameters
  const handleBatchDataLoaded = (batch: BatchParsedFile[]) => {
    if (batch.length === 0) return;

    // Use current active parameters as baseline for newly imported files
    const newFiles: LoadedFile[] = batch.map((item, idx) => {
      const colorIndex = (files.length + idx) % FILE_COLORS.length;
      return {
        id: `file_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
        fileName: item.fileName,
        data: { x: item.result.x, y: item.result.y },
        rowCount: item.result.rowCount,
        minMz: item.result.minMz,
        maxMz: item.result.maxMz,
        maxIntensity: item.result.maxSignal,
        formula: formulaInput,
        adduct: adductInput,
        cutoff: cutoffInput,
        massShift,
        signalMassWidth,
        signalMode,
        color: FILE_COLORS[colorIndex],
        isVisible: true,
        zoomDEnabled: activeFile?.zoomDEnabled ?? false,
      };
    });

    setFiles((prev) => [...prev, ...newFiles]);
    // Switch to first newly loaded file
    setActiveFileId(newFiles[0].id);
    setStatusMessage(`Imported ${newFiles.length} file(s) into session with current analytical parameters`);
  };

  // Load Single Sample File from literature presets
  const handleLoadSample = async (sample: SampleDataset) => {
    try {
      setStatusMessage(`Loading sample ${sample.name}...`);
      const resp = await fetch(sample.path);
      if (!resp.ok) {
        throw new Error(`Failed to fetch sample: ${resp.statusText}`);
      }
      const text = await resp.text();
      const parsed = parseMsText(text);

      const newFileId = `file_sample_${sample.id}_${Date.now()}`;
      const newFile: LoadedFile = {
        id: newFileId,
        fileName: `${sample.name}.txt`,
        data: { x: parsed.x, y: parsed.y },
        rowCount: parsed.rowCount,
        minMz: parsed.minMz,
        maxMz: parsed.maxMz,
        maxIntensity: parsed.maxSignal,
        formula: sample.formula,
        adduct: sample.adduct,
        cutoff: 'Auto',
        massShift: 0.0,
        signalMassWidth: 0.33,
        signalMode: 'peak height',
        color: FILE_COLORS[files.length % FILE_COLORS.length],
        isVisible: true,
        zoomDEnabled: false,
      };

      setFiles((prev) => [...prev, newFile]);
      setActiveFileId(newFileId);
      setFormulaInput(sample.formula);
      setAdductInput(sample.adduct);
      setCutoffInput('Auto');
      setMassShift(0);
      setStatusMessage(`Loaded sample ${sample.name}`);
    } catch (err: any) {
      setStatusMessage(`Error loading sample: ${err.message}`);
    }
  };

  const handleRemoveFile = (id: string) => {
    if (files.length <= 1) return;
    const remaining = files.filter((f) => f.id !== id);
    setFiles(remaining);
    if (activeFileId === id) {
      setActiveFileId(remaining[0].id);
    }
  };

  // Auto-Align & Auto-Adduct on active file (cascades to files below)
  const handleAutoAlign = () => {
    if (!parsedFormula || !activeFile || activeFile.data.x.length === 0) return;
    try {
      const dget = new DGet({
        formula: parsedFormula,
        data: activeFile.data,
        adduct: adductInput,
        signalMassWidth,
      });
      const offset = dget.findOptimalAlignmentOffset();
      const rounded = Number(offset.toFixed(4));
      setMassShift(rounded);
      updateActiveFileParams({ massShift: rounded });
      setStatusMessage(`Aligned spectrum: applied m/z offset of ${rounded > 0 ? '+' : ''}${rounded} Da (cascaded to subsequent files)`);
    } catch (err: any) {
      setStatusMessage(`Alignment failed: ${err.message}`);
    }
  };

  const handleAutoAdduct = () => {
    if (!parsedFormula || !activeFile || activeFile.data.x.length === 0) return;
    try {
      const dget = new DGet({
        formula: parsedFormula,
        data: activeFile.data,
        adduct: adductInput,
        signalMassWidth,
      });
      const best = dget.guessBestAdduct();
      setAdductInput(best);
      updateActiveFileParams({ adduct: best });
      setStatusMessage(`Identified best adduct candidate: ${best} (cascaded to subsequent files)`);
    } catch (err: any) {
      setStatusMessage(`Auto adduct search failed: ${err.message}`);
    }
  };

  // Zoom D cascade handler
  const handleToggleZoomD = (enabled: boolean) => {
    updateActiveFileParams({ zoomDEnabled: enabled });
    setStatusMessage(
      enabled
        ? 'Zoom D enabled for active file and cascaded to files below'
        : 'Zoom D reset for active file and cascaded to files below'
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800 antialiased select-none">
      {/* 1. Menu Bar - Bright Theme */}
      <MenuBar
        onOpenFile={() => setIsImportOpen(true)}
        onLoadSample={handleLoadSample}
        onGenerateReport={() => setIsReportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onResetLayout={handleResetLayout}
        onExportCsv={() => setIsCsvExportOpen(true)}
        docksVisibility={docksVisibility}
        onToggleDock={handleToggleDock}
      />

      {/* 2. Action Toolbar - Bright Theme */}
      <ToolBar
        showDeconvolution={showDeconvolution}
        onToggleDeconvolution={() => setShowDeconvolution(!showDeconvolution)}
        showIsotopologues={showIsotopologues}
        onToggleIsotopologues={() => setShowIsotopologues(!showIsotopologues)}
        onZoomToD={() => handleToggleZoomD(true)}
        onResetZoom={() => handleToggleZoomD(false)}
        signalMode={signalMode}
        onSignalModeChange={(mode) => {
          setSignalMode(mode);
          updateActiveFileParams({ signalMode: mode });
        }}
        onAutoAlign={handleAutoAlign}
        onAutoAdduct={handleAutoAdduct}
        onOpenFile={() => setIsImportOpen(true)}
        onGenerateReport={() => setIsReportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 3. Main Desktop Workspace (Dockable Layout) */}
      <div className="flex-1 flex overflow-hidden min-h-0 w-full bg-slate-200">
        {/* Leftmost Full-Height Vertical Panel: Files Under Analysis */}
        {docksVisibility.files && !isPlotMaximized && (
          <div className="w-80 flex-shrink-0 flex flex-col h-full bg-white border-r border-slate-300 z-10">
            <FilesDock
              files={filesWithResults}
              activeFileId={activeFileId}
              onSelectActiveFile={(id) => {
                setActiveFileId(id);
                const f = files.find((item) => item.id === id);
                if (f) {
                  setStatusMessage(`Switched active file to ${f.fileName}`);
                }
              }}
              onRemoveFile={handleRemoveFile}
              onOpenImport={() => setIsImportOpen(true)}
              onOpenExportModal={() => setIsCsvExportOpen(true)}
            />
          </div>
        )}

        {/* Secondary Vertical Panel: Analytical Controls & Formula Spectra Dock */}
        {!isPlotMaximized && (docksVisibility.controls || docksVisibility.formulaSpectra) && (
          <div className="w-80 flex-shrink-0 flex flex-col h-full border-r border-slate-300 bg-white overflow-hidden shadow-xs">
            {/* Controls Dock */}
            {docksVisibility.controls && (
              <div className="flex-1 min-h-0 overflow-y-auto border-b border-slate-200">
                <ControlsDock
                  formulaInput={formulaInput}
                  onFormulaChange={(val) => {
                    setFormulaInput(val);
                    updateActiveFileParams({ formula: val });
                  }}
                  formulaError={formulaError}
                  parsedFormula={parsedFormula}
                  adductInput={adductInput}
                  onAdductChange={(val) => {
                    setAdductInput(val);
                    updateActiveFileParams({ adduct: val });
                  }}
                  calculatedAdductMz={calculatedAdductMz}
                  cutoffInput={cutoffInput}
                  onCutoffChange={(val) => {
                    setCutoffInput(val);
                    updateActiveFileParams({ cutoff: val });
                  }}
                  massShift={massShift}
                  onMassShiftChange={(val) => {
                    setMassShift(val);
                    updateActiveFileParams({ massShift: val });
                  }}
                  signalMassWidth={signalMassWidth}
                  onSignalMassWidthChange={(val) => {
                    setSignalMassWidth(val);
                    updateActiveFileParams({ signalMassWidth: val });
                  }}
                  totalD={parsedFormula?.deuteriumCount || 0}
                  activeCount={calculationResult?.activeStates.length || 0}
                />
              </div>
            )}

            {/* Formula Spectra Dock with Sliders */}
            {docksVisibility.formulaSpectra && (
              <div className="h-48 flex-shrink-0 overflow-hidden">
                <FormulaSpectraDock
                  formula={parsedFormula}
                  adductString={adductInput}
                />
              </div>
            )}
          </div>
        )}

        {/* Center / Right: Main Canvas + Bottom Results Docks */}
        <div className="flex-1 flex flex-col h-full min-w-0 min-h-0 overflow-hidden bg-white">
          {/* Main High-Resolution Canvas (Bright Theme) */}
          <div className="flex-1 relative min-h-0 w-full overflow-hidden">
            <MainSpectraCanvas
              result={calculationResult}
              rawData={activeFile?.data || { x: [], y: [] }}
              showDeconvolution={showDeconvolution}
              showIsotopologues={showIsotopologues}
              onSetCutoff={(label) => {
                setCutoffInput(label);
                updateActiveFileParams({ cutoff: label });
              }}
              signalMassWidth={signalMassWidth}
              isMaximized={isPlotMaximized}
              onToggleMaximize={() => setIsPlotMaximized(!isPlotMaximized)}
              activeFileName={activeFile?.fileName}
              zoomDEnabled={activeFile?.zoomDEnabled}
              onToggleZoomD={handleToggleZoomD}
            />
          </div>

          {/* Bottom Docks: Results Text + Results Graph */}
          {!isPlotMaximized && (docksVisibility.resultsText || docksVisibility.resultsGraph) && (
            <div className="flex flex-col flex-shrink-0 border-t border-slate-300 bg-white">
              {/* Bottom Dock Header / Collapse Toggle Bar */}
              <div className="bg-slate-100 px-3 py-1 border-b border-slate-200 flex items-center justify-between text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsBottomCollapsed(!isBottomCollapsed)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition font-medium text-[11px] shadow-xs"
                    title={isBottomCollapsed ? 'Expand results dock' : 'Collapse results dock to maximize plot'}
                  >
                    {isBottomCollapsed ? <ChevronUp className="w-3.5 h-3.5 text-sky-600" /> : <ChevronDown className="w-3.5 h-3.5 text-sky-600" />}
                    <span>{isBottomCollapsed ? 'Expand Results' : 'Results Panel'}</span>
                  </button>

                  {calculationResult && (
                    <span className="text-[11px] font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 shadow-xs">
                      Deuteration: {calculationResult.deuterationPercent.toFixed(2)}% | Error: {calculationResult.residualErrorPercent.toFixed(2)}%
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1 font-medium">
                    <Terminal className="w-3 h-3 text-emerald-600" />
                    <span>Summary Text</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium">
                    <BarChart3 className="w-3 h-3 text-sky-600" />
                    <span>States Histogram</span>
                  </span>
                </div>
              </div>

              {/* Bottom Dock Content Area with horizontal sliders */}
              {!isBottomCollapsed && (
                <div className="flex h-52 w-full bg-white overflow-hidden">
                  {docksVisibility.resultsText && (
                    <ResultsTextDock result={calculationResult} />
                  )}
                  {docksVisibility.resultsGraph && (
                    <ResultsGraphDock
                      result={calculationResult}
                      onSetCutoff={(label) => {
                        setCutoffInput(label);
                        updateActiveFileParams({ cutoff: label });
                      }}
                      activeFileName={activeFile?.fileName}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. Desktop Status Bar - Bright Theme */}
      <div className="bg-slate-200 border-t border-slate-300 px-3 py-1 text-[11px] text-slate-600 flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span className="text-slate-800 font-medium">{statusMessage}</span>
          </span>
          <span className="text-slate-400">|</span>
          <span>
            Active: <strong className="text-slate-900 font-mono">{activeFile?.fileName}</strong> (
            {activeFile?.data.x.length.toLocaleString()} points)
          </span>
          <span className="text-slate-400">|</span>
          <span>
            Target: <strong className="text-sky-700 font-mono">{formulaInput}</strong> ({adductInput})
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px]">
          {calculationResult && (
            <span className="text-emerald-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-300 shadow-xs">
              Deuteration: {calculationResult.deuterationPercent.toFixed(2)} %
            </span>
          )}
        </div>
      </div>

      {/* Modals */}
      <ImportDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onBatchDataLoaded={handleBatchDataLoaded}
      />

      <CsvExportModal
        isOpen={isCsvExportOpen}
        onClose={() => setIsCsvExportOpen(false)}
        files={filesWithResults}
        activeFileId={activeFileId}
      />

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        result={calculationResult}
        fileName={activeFile?.fileName || 'Spectrum'}
        settings={settings}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
};

export default App;

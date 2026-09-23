import React, { useState } from 'react';
import {
  FileText,
  FolderOpen,
  Download,
  Settings,
  HelpCircle,
  RotateCcw,
  Printer,
  Sparkles,
  ExternalLink,
  Github,
  Check,
  Eye,
  Files,
  BookOpen,
  Mail,
  AlertCircle,
} from 'lucide-react';
import { SAMPLE_DATASETS, SampleDataset } from '../lib/io';

interface MenuBarProps {
  onOpenFile: () => void;
  onLoadSample: (sample: SampleDataset) => void;
  onGenerateReport: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  onResetLayout: () => void;
  onExportCsv: () => void;
  docksVisibility: {
    files: boolean;
    controls: boolean;
    formulaSpectra: boolean;
    resultsText: boolean;
    resultsGraph: boolean;
  };
  onToggleDock: (dock: 'files' | 'controls' | 'formulaSpectra' | 'resultsText' | 'resultsGraph') => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  onOpenFile,
  onLoadSample,
  onGenerateReport,
  onOpenSettings,
  onOpenAbout,
  onResetLayout,
  onExportCsv,
  docksVisibility,
  onToggleDock,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const closeMenu = () => setActiveMenu(null);

  return (
    <div className="bg-slate-200 text-slate-800 border-b border-slate-300 text-xs select-none flex items-center justify-between px-2 py-0.5 z-40 relative">
      {/* Left side: Branding + Menus */}
      <div className="flex items-center gap-1">
        {/* App Branding Badge */}
        <div className="flex items-center gap-1.5 font-bold text-sky-700 mr-2 px-2 py-0.5 rounded bg-white border border-slate-300 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="tracking-wide text-sm font-black text-slate-900">
            DGet<span className="text-amber-500 font-extrabold">+</span>
          </span>
        </div>

        {/* FILE MENU */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
            className={`px-2 py-1 rounded transition ${
              activeMenu === 'file' ? 'bg-white shadow-xs font-semibold text-slate-900' : 'hover:bg-slate-300 text-slate-700'
            }`}
          >
            File
          </button>
          {activeMenu === 'file' && (
            <div
              className="absolute left-0 mt-1 w-56 bg-white border border-slate-200 rounded-md shadow-xl py-1 z-50 text-slate-700 divide-y divide-slate-100"
              onMouseLeave={closeMenu}
            >
              <div className="py-1">
                <button
                  onClick={() => {
                    onOpenFile();
                    closeMenu();
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-sky-50 hover:text-sky-900"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-sky-600" />
                  <span>Open HRMS Spectrum File...</span>
                </button>
              </div>

              {/* Sample Files Submenu */}
              <div className="py-1">
                <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Load Standard Benchmark Samples
                </div>
                {SAMPLE_DATASETS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => {
                      onLoadSample(sample);
                      closeMenu();
                    }}
                    className="w-full px-3 py-1 text-left flex items-center justify-between hover:bg-sky-50 hover:text-sky-900"
                  >
                    <span>{sample.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{sample.formula}</span>
                  </button>
                ))}
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    onGenerateReport();
                    closeMenu();
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-sky-50 hover:text-sky-900"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-600" />
                  <span>Generate Certificate Report...</span>
                </button>
                <button
                  onClick={() => {
                    onExportCsv();
                    closeMenu();
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-sky-50 hover:text-sky-900"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export CSV Results...</span>
                </button>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    onOpenSettings();
                    closeMenu();
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-sky-50 hover:text-sky-900"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span>Preferences & Report Setup...</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* VIEW / DOCKS MENU */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
            className={`px-2 py-1 rounded transition ${
              activeMenu === 'view' ? 'bg-white shadow-xs font-semibold text-slate-900' : 'hover:bg-slate-300 text-slate-700'
            }`}
          >
            View
          </button>
          {activeMenu === 'view' && (
            <div
              className="absolute left-0 mt-1 w-56 bg-white border border-slate-200 rounded-md shadow-xl py-1 z-50 text-slate-700 divide-y divide-slate-100"
              onMouseLeave={closeMenu}
            >
              <div className="py-1">
                <button
                  onClick={() => onToggleDock('files')}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-sky-50 hover:text-sky-900"
                >
                  <span className="flex items-center gap-2">
                    <Files className="w-3.5 h-3.5 text-sky-600" />
                    <span>Files Panel</span>
                  </span>
                  {docksVisibility.files && <Check className="w-3.5 h-3.5 text-sky-600" />}
                </button>

                <button
                  onClick={() => onToggleDock('controls')}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-sky-50 hover:text-sky-900"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-sky-600" />
                    <span>Analytical Controls Dock</span>
                  </span>
                  {docksVisibility.controls && <Check className="w-3.5 h-3.5 text-sky-600" />}
                </button>

                <button
                  onClick={() => onToggleDock('formulaSpectra')}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-sky-50 hover:text-sky-900"
                >
                  <span className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-amber-600" />
                    <span>Formula Spectra Dock</span>
                  </span>
                  {docksVisibility.formulaSpectra && <Check className="w-3.5 h-3.5 text-sky-600" />}
                </button>

                <button
                  onClick={() => onToggleDock('resultsText')}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-sky-50 hover:text-sky-900"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Results Summary Dock</span>
                  </span>
                  {docksVisibility.resultsText && <Check className="w-3.5 h-3.5 text-sky-600" />}
                </button>

                <button
                  onClick={() => onToggleDock('resultsGraph')}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-sky-50 hover:text-sky-900"
                >
                  <span className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-sky-600" />
                    <span>Deuteration States Dock</span>
                  </span>
                  {docksVisibility.resultsGraph && <Check className="w-3.5 h-3.5 text-sky-600" />}
                </button>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    onResetLayout();
                    closeMenu();
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-sky-50 hover:text-sky-900"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Restore Default Dock Layout</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* HELP MENU */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'help' ? null : 'help')}
            className={`px-2 py-1 rounded transition ${
              activeMenu === 'help' ? 'bg-white shadow-xs font-semibold text-slate-900' : 'hover:bg-slate-300 text-slate-700'
            }`}
          >
            Help
          </button>
          {activeMenu === 'help' && (
            <div
              className="absolute left-0 mt-1 w-72 bg-white border border-slate-200 rounded-md shadow-xl py-1 z-50 text-slate-700 divide-y divide-slate-100"
              onMouseLeave={closeMenu}
            >
              <div className="py-1">
                <button
                  onClick={() => {
                    onOpenAbout();
                    closeMenu();
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-sky-50 hover:text-sky-900"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>About DGet+</span>
                </button>
              </div>

              <div className="py-1">
                <a
                  href="https://doi.org/10.1186/s13321-024-00828-x"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-sky-50 hover:text-sky-900"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                    <span>Original Paper (J. Cheminform. 2024)</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>

                <a
                  href="mailto:g.pascali@unsw.edu.au?subject=DGet%2B%20Issue%20Report"
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-sky-50 hover:text-sky-900"
                >
                  <span className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-rose-500" />
                    <span>Report an Issue (g.pascali@unsw.edu.au)</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>

              <div className="py-1">
                <a
                  href="https://github.com/giancarlopascali-hub/DGet-plus"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-sky-50 hover:text-sky-900"
                >
                  <span className="flex items-center gap-2">
                    <Github className="w-3.5 h-3.5" />
                    <span>GitHub: giancarlopascali-hub/DGet-plus</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
                <a
                  href="https://github.com/djdt/dget"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-sky-50 hover:text-sky-900"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                    <span>Original Python DGet Repository</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side: Direct Quick Links for Original Paper & Report an Issue */}
      <div className="flex items-center gap-2 text-[11px]">
        {/* Original Paper link */}
        <a
          href="https://doi.org/10.1186/s13321-024-00828-x"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-white hover:bg-slate-50 text-sky-800 border border-slate-300 shadow-xs transition font-medium"
          title="Open original paper: 'DGet! An open source deuteration calculator for mass spectrometry data' (J. Cheminform. 2024)"
        >
          <BookOpen className="w-3.5 h-3.5 text-sky-600" />
          <span>Original Paper</span>
          <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
        </a>

        {/* Report an Issue button */}
        <a
          href="mailto:g.pascali@unsw.edu.au?subject=DGet%2B%20Issue%20Report&body=Dear%20Dr.%20Pascali,%0A%0AI%20would%20like%20to%20report%20an%20issue%20with%20DGet%2B:%0A%0A-%20Description:%20%0A-%20File%20name:%20%0A-%20Formula:%20%0A-%20Adduct:%20%0A%0AThank%20you!"
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-slate-300 hover:border-rose-300 shadow-xs transition font-medium"
          title="Report an issue to Dr. Giancarlo Pascali (g.pascali@unsw.edu.au)"
        >
          <Mail className="w-3.5 h-3.5 text-rose-600" />
          <span>Report an Issue</span>
        </a>
      </div>
    </div>
  );
};

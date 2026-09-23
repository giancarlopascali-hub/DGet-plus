import React from 'react';
import { X, Sliders, Check } from 'lucide-react';
import { SignalMode } from '../lib/dget';
import { COMMON_ADDUCTS } from '../lib/adduct';

export interface AppSettings {
  defaultAdduct: string;
  defaultSignalMode: SignalMode;
  defaultMassWidth: number;
  reportAuthor: string;
  reportInstitution: string;
}

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [localSettings, setLocalSettings] = React.useState<AppSettings>(settings);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-xs select-none">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden text-slate-800">
        <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-600" />
            <span className="font-bold text-sm text-slate-900">Settings & Preferences</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 bg-slate-50/50">
          <div>
            <label className="text-slate-700 font-semibold block mb-1">Default Adduct Form</label>
            <select
              value={localSettings.defaultAdduct}
              onChange={(e) => setLocalSettings({ ...localSettings, defaultAdduct: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none"
            >
              {COMMON_ADDUCTS.map((ad) => (
                <option key={ad} value={ad}>
                  {ad}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">Default Signal Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, defaultSignalMode: 'peak height' })}
                className={`py-1.5 px-3 rounded border text-center transition ${
                  localSettings.defaultSignalMode === 'peak height'
                    ? 'bg-sky-50 border-sky-400 text-sky-900 font-bold'
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Peak Height (Max)
              </button>
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, defaultSignalMode: 'peak area' })}
                className={`py-1.5 px-3 rounded border text-center transition ${
                  localSettings.defaultSignalMode === 'peak area'
                    ? 'bg-sky-50 border-sky-400 text-sky-900 font-bold'
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Peak Area (Trapezoid)
              </button>
            </div>
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">Default Integration Width (± m/z)</label>
            <input
              type="number"
              step="0.01"
              min="0.05"
              max="2.0"
              value={localSettings.defaultMassWidth}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, defaultMassWidth: parseFloat(e.target.value) || 0.33 })
              }
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none font-mono"
            />
          </div>

          <div className="border-t border-slate-200 pt-3 space-y-3">
            <span className="font-semibold text-slate-800 block">Report Header Defaults</span>
            <div>
              <label className="text-slate-600 text-[11px] block mb-1">Analyst / Author</label>
              <input
                type="text"
                value={localSettings.reportAuthor}
                onChange={(e) => setLocalSettings({ ...localSettings, reportAuthor: e.target.value })}
                placeholder="e.g. Dr. G. Pascali"
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-600 text-[11px] block mb-1">Laboratory / Institution</label>
              <input
                type="text"
                value={localSettings.reportInstitution}
                onChange={(e) => setLocalSettings({ ...localSettings, reportInstitution: e.target.value })}
                placeholder="e.g. Mass Spectrometry Core Facility"
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-800 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-100 px-4 py-2.5 border-t border-slate-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded hover:bg-slate-200 text-slate-700">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};

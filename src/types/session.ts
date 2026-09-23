import { DGetResult, SignalMode } from '../lib/dget';

export interface LoadedFile {
  id: string;
  fileName: string;
  data: { x: number[]; y: number[] };
  rowCount: number;
  minMz: number;
  maxMz: number;
  maxIntensity: number;
  formula: string;
  adduct: string;
  cutoff: string;
  massShift: number;
  signalMassWidth: number;
  signalMode: SignalMode;
  color: string;
  isVisible: boolean; // overlay on spectra canvas
  zoomDEnabled?: boolean; // independent zoom to D setting per file
  result?: DGetResult | null;
}

export const FILE_COLORS = [
  '#0284c7', // Sky blue (default active)
  '#d97706', // Amber
  '#16a34a', // Emerald green
  '#9333ea', // Purple
  '#ea580c', // Orange
  '#0d9488', // Teal
  '#e11d48', // Rose
  '#4f46e5', // Indigo
];

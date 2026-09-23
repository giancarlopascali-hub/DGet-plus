/**
 * Core DGet calculation engine.
 * Computes deuteration level, isotopologue state probabilities,
 * and residuals via frequency-domain deconvolution.
 */
import { Adduct, COMMON_ADDUCTS } from './adduct';
import { deconvolve } from './convolve';
import { Formula } from './formula';

export type SignalMode = 'peak area' | 'peak height' | 'raw';

export interface DGetOptions {
  formula: string | Formula;
  data: { x: number[]; y: number[] };
  adduct?: string;
  cutoff?: string | number | null; // e.g. 'D0', 'D2', 174.1, or null for auto
  signalMassWidth?: number; // default 0.33 m/z
  signalMode?: SignalMode; // 'peak area' | 'peak height' | 'raw'
  massShift?: number; // m/z offset applied to data
}

export interface StateTargetInfo {
  state: number; // 0 to N
  label: string; // "D0", "D1", etc.
  monoisotopicMz: number;
  fraction: number; // probability (0 to 1)
  percent: number; // 0 to 100
  isActive: boolean; // included in deuteration % calculation
}

export interface DGetResult {
  formulaString: string;
  adductString: string;
  deuteriumCount: number;
  monoisotopicMz: number;
  adductMz: number;
  deuteration: number; // 0.0 to 1.0
  deuterationPercent: number; // e.g. 93.73
  residualError: number; // normalized residual error
  residualErrorPercent: number;
  allStates: number[]; // 0 ... N
  activeStates: number[]; // included in calculation
  probabilities: number[]; // raw probabilities for D0...Dn
  normalizedProbabilities: number[]; // normalized over active states
  stateDetails: StateTargetInfo[];
  targetMasses: number[];
  targetSignals: number[];
  reconstructedSignals: number[]; // synthetic fit for plotting overlay
  effectiveCutoffState: number; // the D-index cutoff (inclusive)
  psf: number[];
  xShifted: number[];
  y: number[];
  minRegionMz: number;
  maxRegionMz: number;
}

export class DGet {
  public baseFormula: Formula;
  public adduct: Adduct;
  public x: number[];
  public y: number[];
  public cutoff: string | number | null;
  public signalMassWidth: number;
  public signalMode: SignalMode;
  public massShift: number;

  constructor(options: DGetOptions) {
    this.baseFormula =
      typeof options.formula === 'string'
        ? new Formula(options.formula)
        : options.formula;

    const adductStr = options.adduct || '[M]+';
    this.adduct = new Adduct(this.baseFormula, adductStr);

    if (this.baseFormula.deuteriumCount === 0) {
      throw new Error(
        `Formula "${this.baseFormula.raw}" does not contain any deuterium (D or [2H]).`
      );
    }

    this.massShift = options.massShift || 0;
    this.x = options.data.x.map((val) => val + this.massShift);
    this.y = options.data.y;

    this.cutoff = options.cutoff ?? null;
    this.signalMassWidth = options.signalMassWidth ?? 0.33;
    this.signalMode = options.signalMode || 'peak height';
  }

  public get deuteriumCount(): number {
    return this.baseFormula.deuteriumCount;
  }

  /**
   * Find index using binary search
   */
  private static binarySearch(arr: number[], target: number): number {
    let low = 0;
    let high = arr.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (arr[mid] < target) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return low;
  }

  /**
   * Generates target m/z values by combining all state spectra across the envelope
   * matching Python's spectra_mz_spread(spectra)
   */
  public getTargetMasses(): { targetMasses: number[]; stateNominals: number[] } {
    const totalD = this.deuteriumCount;
    const combined: Record<number, { sumMz: number; sumFrac: number }> = {};
    const stateNominals: number[] = [];

    // For state k from 0 to totalD:
    for (let k = 0; k <= totalD; k++) {
      const stateFormula = this.baseFormula.getDeuteratedStateFormula(k, totalD);
      const stateAdduct = new Adduct(stateFormula, this.adduct.adductString);
      const spec = stateAdduct.formula.spectrum(1e-3);

      if (spec.length > 0) {
        stateNominals.push(Math.round(spec[0].mass));
      }

      for (const entry of spec) {
        const nom = Math.round(entry.mass);
        if (!combined[nom]) combined[nom] = { sumMz: 0, sumFrac: 0 };
        combined[nom].sumMz += entry.mass * entry.fraction;
        combined[nom].sumFrac += entry.fraction;
      }
    }

    const nominals = Object.keys(combined)
      .map(Number)
      .sort((a, b) => a - b);

    const targetMasses = nominals.map(
      (nom) => combined[nom].sumMz / combined[nom].sumFrac
    );

    return { targetMasses, stateNominals };
  }

  /**
   * Get point spread function (PSF) from the theoretical isotopic spectrum of the adduct
   */
  public getPsf(): number[] {
    const baseSpec = this.adduct.formula.spectrum(1e-3);
    const psf = baseSpec.map((p) => p.fraction);
    const psfSum = psf.reduce((a, b) => a + b, 0);
    return psf.map((p) => (psfSum > 0 ? p / psfSum : 0));
  }

  /**
   * Extract signals from mass spectrum data at target masses
   */
  public getTargetSignals(targetMasses: number[]): number[] {
    const x = this.x;
    const y = this.y;
    const width = this.signalMassWidth;
    const signals = new Array<number>(targetMasses.length).fill(0);

    for (let i = 0; i < targetMasses.length; i++) {
      const tm = targetMasses[i];
      const startIdx = DGet.binarySearch(x, tm - width);
      const endIdx = DGet.binarySearch(x, tm + width);

      if (startIdx >= endIdx || startIdx >= x.length) {
        signals[i] = 0;
        continue;
      }

      if (this.signalMode === 'peak height') {
        let maxVal = 0;
        for (let j = startIdx; j < endIdx; j++) {
          if (y[j] > maxVal) maxVal = y[j];
        }
        signals[i] = maxVal;
      } else {
        // Peak area integration using trapezoidal rule
        let area = 0;
        for (let j = startIdx; j < endIdx - 1; j++) {
          const dx = x[j + 1] - x[j];
          const avgY = (y[j] + y[j + 1]) / 2;
          area += avgY * dx;
        }
        signals[i] = area > 0 ? area : (y[startIdx] || 0) * (2 * width);
      }
    }

    return signals;
  }

  /**
   * Perform calculation
   */
  public calculate(): DGetResult {
    const totalD = this.deuteriumCount;
    const { targetMasses } = this.getTargetMasses();
    const targetSignals = this.getTargetSignals(targetMasses);
    const psf = this.getPsf();

    // 1D Deconvolution
    const { recovered, residuals } = deconvolve(targetSignals, psf);

    // Filter negative probabilities
    const rawProbabilities = new Array<number>(totalD + 1).fill(0);
    for (let i = 0; i <= totalD; i++) {
      rawProbabilities[i] = Math.max(0, recovered[i] || 0);
    }

    const probSum = rawProbabilities.reduce((a, b) => a + b, 0);
    const probabilities =
      probSum > 0 ? rawProbabilities.map((p) => p / probSum) : rawProbabilities;

    // Determine cutoff state
    let cutoffState = 0;

    if (this.cutoff === null || this.cutoff === undefined || this.cutoff === 'Auto') {
      // Default auto cutoff: reverse scan, first where 2 consecutive states are < 1%
      // and accumulated probability is > 10%
      const reversed = [...probabilities].reverse();
      let cumSum = 0;
      let argMaxCum10 = -1;

      for (let i = 0; i < reversed.length; i++) {
        cumSum += reversed[i];
        if (cumSum > 0.1 && argMaxCum10 === -1) {
          argMaxCum10 = i;
        }
      }

      let foundIdx = -1;
      for (let i = 0; i < reversed.length - 1; i++) {
        if (reversed[i] < 0.01 && reversed[i + 1] < 0.01) {
          if (argMaxCum10 !== -1 && i > argMaxCum10) {
            foundIdx = i;
            break;
          }
        }
      }

      cutoffState = foundIdx !== -1 ? Math.max(0, totalD - foundIdx) : 0;
    } else if (typeof this.cutoff === 'string' && this.cutoff.toUpperCase().startsWith('D')) {
      const parsed = parseInt(this.cutoff.slice(1), 10);
      cutoffState = isNaN(parsed) ? 0 : Math.max(0, Math.min(totalD, parsed));
    } else {
      const numCutoff = typeof this.cutoff === 'number' ? this.cutoff : parseFloat(this.cutoff);
      if (!isNaN(numCutoff)) {
        // Find closest target mass index
        cutoffState = DGet.binarySearch(targetMasses, numCutoff);
        cutoffState = Math.max(0, Math.min(totalD, cutoffState));
      }
    }

    // Active states: from cutoffState to totalD
    const activeStates: number[] = [];
    for (let k = cutoffState; k <= totalD; k++) {
      activeStates.push(k);
    }

    // Active probabilities re-normalized
    const activeProbSum = activeStates.reduce((acc, st) => acc + probabilities[st], 0);
    const normalizedProbabilities = probabilities.map((p, idx) => {
      if (idx < cutoffState || activeProbSum <= 0) return 0;
      return p / activeProbSum;
    });

    // % Deuteration = sum(normalizedProb * state) / totalD
    let deuterationFraction = 0;
    for (const state of activeStates) {
      deuterationFraction += normalizedProbabilities[state] * state;
    }
    const deuteration = totalD > 0 ? deuterationFraction / totalD : 0;

    // Residual error
    const sumResiduals = residuals.reduce((a, b) => a + Math.abs(b), 0);
    const sumSignals = targetSignals.reduce((a, b) => a + Math.abs(b), 0);
    const residualError = sumSignals > 0 ? sumResiduals / sumSignals : 0;

    // Reconstruct predicted fit signals for overlay
    const reconstructedSignals = new Array<number>(targetSignals.length).fill(0);
    for (let i = 0; i < probabilities.length; i++) {
      const p = probabilities[i];
      if (p <= 0) continue;
      for (let j = 0; j < psf.length; j++) {
        if (i + j < reconstructedSignals.length) {
          reconstructedSignals[i + j] += p * psf[j] * sumSignals;
        }
      }
    }

    // State details for UI
    const stateDetails: StateTargetInfo[] = [];
    for (let k = 0; k <= totalD; k++) {
      const stFormula = this.baseFormula.getDeuteratedStateFormula(k, totalD);
      const stAdduct = new Adduct(stFormula, this.adduct.adductString);
      stateDetails.push({
        state: k,
        label: `D${k}`,
        monoisotopicMz: stAdduct.mz,
        fraction: normalizedProbabilities[k],
        percent: normalizedProbabilities[k] * 100,
        isActive: k >= cutoffState,
      });
    }

    const minRegionMz = Math.min(...targetMasses) - 1.5;
    const maxRegionMz = Math.max(...targetMasses) + 1.5;

    return {
      formulaString: this.baseFormula.toHillString(),
      adductString: this.adduct.adductString,
      deuteriumCount: totalD,
      monoisotopicMz: this.baseFormula.monoisotopicMass,
      adductMz: this.adduct.mz,
      deuteration,
      deuterationPercent: deuteration * 100,
      residualError,
      residualErrorPercent: residualError * 100,
      allStates: Array.from({ length: totalD + 1 }, (_, i) => i),
      activeStates,
      probabilities,
      normalizedProbabilities,
      stateDetails,
      targetMasses,
      targetSignals,
      reconstructedSignals,
      effectiveCutoffState: cutoffState,
      psf,
      xShifted: this.x,
      y: this.y,
      minRegionMz,
      maxRegionMz,
    };
  }

  /**
   * Search for optimal alignment offset to calibrate instrument drift
   */
  public findOptimalAlignmentOffset(): number {
    const targetMz = this.adduct.mz;
    const width = this.signalMassWidth * 2;
    const startIdx = DGet.binarySearch(this.x, targetMz - width);
    const endIdx = DGet.binarySearch(this.x, targetMz + width);

    if (startIdx >= endIdx || startIdx >= this.x.length) return 0;

    let maxIdx = startIdx;
    let maxVal = this.y[startIdx];
    for (let i = startIdx; i < endIdx; i++) {
      if (this.y[i] > maxVal) {
        maxVal = this.y[i];
        maxIdx = i;
      }
    }

    return targetMz - this.x[maxIdx];
  }

  /**
   * Screen common adducts to guess the most likely adduct from the base peak
   */
  public guessBestAdduct(): string {
    let bestAdduct = this.adduct.adductString;
    let highestIntensity = -1;

    for (const adStr of COMMON_ADDUCTS) {
      try {
        const testAdduct = new Adduct(this.baseFormula, adStr);
        const mz = testAdduct.mz;
        const sIdx = DGet.binarySearch(this.x, mz - this.signalMassWidth);
        const eIdx = DGet.binarySearch(this.x, mz + this.signalMassWidth);

        let maxVal = 0;
        for (let i = sIdx; i < eIdx; i++) {
          if (this.y[i] > maxVal) maxVal = this.y[i];
        }

        if (maxVal > highestIntensity) {
          highestIntensity = maxVal;
          bestAdduct = adStr;
        }
      } catch {
        // ignore invalid adducts
      }
    }

    return bestAdduct;
  }
}

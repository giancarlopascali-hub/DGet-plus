/**
 * Formula parsing and isotopic envelope calculation
 */
import { ELEMENTS, Isotope } from './elements';

export interface IsotopePeak {
  mass: number;
  fraction: number; // 0 to 1
  nominalMass?: number;
}

export interface CompositionEntry {
  element: string;
  count: number;
  massFraction: number;
}

export class Formula {
  public raw: string;
  public counts: Record<string, number>;

  constructor(formulaStr: string) {
    this.raw = formulaStr.trim();
    this.counts = Formula.parseFormula(formulaStr);
  }

  /**
   * Parse a formula string like 'C12HD8N', 'C12H[2H]8N', 'C8D15HO2', etc.
   */
  public static parseFormula(formulaStr: string): Record<string, number> {
    if (!formulaStr || !formulaStr.trim()) {
      return {};
    }

    // Standardize [2H] or [2h] to D
    let sanitized = formulaStr.replace(/\[2H\]/gi, 'D').trim();

    // Regex for chemical elements and optional counts
    // Matches standard elements like C, H, Na, Cl, Fe, D, etc.
    const regex = /([A-Z][a-z]?|D)(\d*)/g;
    const counts: Record<string, number> = {};

    let match: RegExpExecArray | null;
    let matchedLength = 0;

    // Check for parenthesized groups or invalid characters
    // Simple expansion for nested formulas like (CH2)3 -> C3H6 if present
    sanitized = Formula.expandParentheses(sanitized);

    while ((match = regex.exec(sanitized)) !== null) {
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      matchedLength += match[0].length;
      const el = match[1];
      const count = match[2] ? parseInt(match[2], 10) : 1;
      counts[el] = (counts[el] || 0) + count;
    }

    if (matchedLength !== sanitized.length) {
      // Check if there are unrecognized characters
      const unrecognized = sanitized.replace(/([A-Z][a-z]?|D)\d*/g, '').trim();
      if (unrecognized.length > 0) {
        throw new Error(`Unrecognized characters in formula: "${unrecognized}"`);
      }
    }

    return counts;
  }

  private static expandParentheses(formula: string): string {
    let result = formula;
    const parenRegex = /\(([^()]+)\)(\d+)/;
    while (parenRegex.test(result)) {
      result = result.replace(parenRegex, (_, inner, countStr) => {
        const factor = parseInt(countStr, 10);
        return Formula.multiplySubformula(inner, factor);
      });
    }
    return result;
  }

  private static multiplySubformula(inner: string, factor: number): string {
    const regex = /([A-Z][a-z]?|D)(\d*)/g;
    let expanded = '';
    let match: RegExpExecArray | null;
    while ((match = regex.exec(inner)) !== null) {
      const el = match[1];
      const count = (match[2] ? parseInt(match[2], 10) : 1) * factor;
      expanded += `${el}${count}`;
    }
    return expanded;
  }

  public get deuteriumCount(): number {
    return this.counts['D'] || 0;
  }

  public get hydrogenCount(): number {
    return this.counts['H'] || 0;
  }

  public get monoisotopicMass(): number {
    let mass = 0;
    for (const [el, count] of Object.entries(this.counts)) {
      const elementData = ELEMENTS[el];
      if (!elementData) {
        throw new Error(`Unknown element: ${el}`);
      }
      // Monoisotopic mass uses the most abundant isotope
      const mono = elementData.isotopes.reduce((prev, curr) =>
        curr.abundance > prev.abundance ? curr : prev
      );
      mass += mono.mass * count;
    }
    return mass;
  }

  public get averageMass(): number {
    let mass = 0;
    for (const [el, count] of Object.entries(this.counts)) {
      const elementData = ELEMENTS[el];
      if (elementData) {
        mass += elementData.standardWeight * count;
      }
    }
    return mass;
  }

  public get composition(): CompositionEntry[] {
    const totalMass = this.averageMass || 1;
    return Object.entries(this.counts).map(([el, count]) => {
      const elementData = ELEMENTS[el];
      const mass = (elementData?.standardWeight || 0) * count;
      return {
        element: el,
        count,
        massFraction: mass / totalMass,
      };
    });
  }

  /**
   * Return formula formatted in Hill system (C first, then H/D, then others alphabetically)
   */
  public toHillString(): string {
    const keys = Object.keys(this.counts);
    const sortedKeys: string[] = [];

    if (keys.includes('C')) sortedKeys.push('C');
    if (keys.includes('H')) sortedKeys.push('H');
    if (keys.includes('D')) sortedKeys.push('D');

    keys
      .filter((k) => k !== 'C' && k !== 'H' && k !== 'D')
      .sort()
      .forEach((k) => sortedKeys.push(k));

    return sortedKeys
      .map((k) => {
        const c = this.counts[k];
        return c === 1 ? k : `${k}${c}`;
      })
      .join('');
  }

  /**
   * Generates a new Formula where `state` deuterium atoms are present,
   * and the remaining (totalD - state) deuterium atoms are converted back to hydrogen.
   */
  public getDeuteratedStateFormula(state: number, totalD: number): Formula {
    const newCounts = { ...this.counts };
    const hExisting = newCounts['H'] || 0;
    const dExisting = totalD;

    const dInState = Math.max(0, Math.min(state, dExisting));
    const hAdded = dExisting - dInState;

    if (dInState > 0) {
      newCounts['D'] = dInState;
    } else {
      delete newCounts['D'];
    }

    newCounts['H'] = hExisting + hAdded;
    if (newCounts['H'] === 0) {
      delete newCounts['H'];
    }

    // construct string
    const fStr = Object.entries(newCounts)
      .map(([el, cnt]) => (cnt === 1 ? el : `${el}${cnt}`))
      .join('');
    return new Formula(fStr);
  }

  /**
   * Calculate theoretical isotopic distribution envelope (similar to molmass spectrum)
   * Using polynomial convolution of elemental isotope distributions.
   * minFraction: minimum relative abundance to retain (e.g. 0.001)
   */
  public spectrum(minFraction: number = 1e-4): IsotopePeak[] {
    // Start with a single peak at mass 0, fraction 1.0
    let currentPeaks: IsotopePeak[] = [{ mass: 0, fraction: 1.0 }];

    for (const [el, count] of Object.entries(this.counts)) {
      const elementData = ELEMENTS[el];
      if (!elementData) continue;

      const isotopes: Isotope[] = elementData.isotopes;

      // Repeat convolution for `count` atoms of this element
      for (let c = 0; c < count; c++) {
        const nextPeaksMap = new Map<number, { mass: number; fraction: number; weightSum: number }>();

        for (const p of currentPeaks) {
          for (const iso of isotopes) {
            const newMass = p.mass + iso.mass;
            const newFrac = p.fraction * iso.abundance;
            if (newFrac < 1e-9) continue;

            // Group close isotopic masses (within 0.3 Da nominal binning for deconvolution point spread function)
            const nominalBin = Math.round(newMass);
            const existing = nextPeaksMap.get(nominalBin);
            if (existing) {
              const totalFrac = existing.fraction + newFrac;
              // Weighted average mass
              existing.mass = (existing.mass * existing.fraction + newMass * newFrac) / totalFrac;
              existing.fraction = totalFrac;
            } else {
              nextPeaksMap.set(nominalBin, {
                mass: newMass,
                fraction: newFrac,
                weightSum: newFrac,
              });
            }
          }
        }

        // Prune peaks with tiny abundance to keep performance rapid
        const maxF = Math.max(...Array.from(nextPeaksMap.values()).map((v) => v.fraction), 1e-12);
        currentPeaks = Array.from(nextPeaksMap.values())
          .filter((v) => v.fraction / maxF > 1e-7)
          .map((v) => ({ mass: v.mass, fraction: v.fraction }));
      }
    }

    // Sort by mass
    currentPeaks.sort((a, b) => a.mass - b.mass);

    // Normalize so highest peak = 1.0 or sum = 1.0
    const maxFrac = Math.max(...currentPeaks.map((p) => p.fraction), 1e-12);
    const filtered = currentPeaks.filter((p) => p.fraction / maxFrac >= minFraction);

    return filtered;
  }
}

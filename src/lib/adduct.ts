/**
 * Adduct definitions, parsing and m/z calculation
 */
import { ELECTRON_MASS } from './elements';
import { Formula } from './formula';

export interface AdductSpec {
  multiplier: number; // e.g. 2 for [2M+H]+
  addElements: Record<string, number>;
  subElements: Record<string, number>;
  charge: number; // e.g. +1, -1, +2, -2
}

export const COMMON_ADDUCTS: string[] = [
  '[M]+',
  '[M+H]+',
  '[M+Na]+',
  '[M+K]+',
  '[M+NH4]+',
  '[M+2H]2+',
  '[2M+H]+',
  '[2M+Na]+',
  '[M]-',
  '[M-H]-',
  '[2M-H]-',
  '[M-2H]2-',
  '[M+Cl]-',
  '[M+HCOO]-',
  '[M-H3O]-',
];

export class Adduct {
  public baseFormula: Formula;
  public adductString: string;
  public spec: AdductSpec;

  constructor(baseFormula: Formula, adductString: string = '[M]+') {
    this.baseFormula = baseFormula;
    this.adductString = adductString.trim();
    this.spec = Adduct.parseAdduct(this.adductString);
  }

  /**
   * Parse adduct strings like "[M+H]+", "[M-H]-", "[2M+Na]+", "[M+2H]2+", "[M]+"
   */
  public static parseAdduct(adductStr: string): AdductSpec {
    const trimmed = adductStr.trim();
    // Match pattern: [nM +- parts]z(+-)? or similar
    const mainMatch = trimmed.match(/^\[(.*)\](\d*)([+-])?$/);

    let content = trimmed;
    let chargeMag = 1;
    let chargeSign = 1;

    if (mainMatch) {
      content = mainMatch[1];
      const magStr = mainMatch[2];
      const signStr = mainMatch[3];
      if (signStr === '-') chargeSign = -1;
      if (signStr === '+') chargeSign = 1;
      if (magStr) chargeMag = parseInt(magStr, 10);
    } else {
      // Check trailing +/-
      if (trimmed.endsWith('+')) chargeSign = 1;
      else if (trimmed.endsWith('-')) chargeSign = -1;
    }

    const netCharge = chargeSign * chargeMag;

    // Inside brackets: e.g. "M+H", "2M+Na", "M-H", "M-H2", "M+2H", "M"
    // Match leading multiplier
    let multiplier = 1;
    let rest = content;
    const multMatch = content.match(/^(\d*)M(.*)$/);
    if (multMatch) {
      multiplier = multMatch[1] ? parseInt(multMatch[1], 10) : 1;
      rest = multMatch[2];
    }

    const addElements: Record<string, number> = {};
    const subElements: Record<string, number> = {};

    // Parse +/- fragments, e.g. +H, -H, +Na, +2H, -2H, +Cl, -H3O
    const partRegex = /([+-])([A-Za-z0-9]+)/g;
    let pMatch: RegExpExecArray | null;

    while ((pMatch = partRegex.exec(rest)) !== null) {
      const sign = pMatch[1];
      const part = pMatch[2];

      try {
        const counts = Formula.parseFormula(part);
        for (const [el, cnt] of Object.entries(counts)) {
          if (sign === '+') {
            addElements[el] = (addElements[el] || 0) + cnt;
          } else {
            subElements[el] = (subElements[el] || 0) + cnt;
          }
        }
      } catch {
        // If not valid chemical formula, ignore
      }
    }

    return {
      multiplier,
      addElements,
      subElements,
      charge: netCharge === 0 ? 1 : netCharge,
    };
  }

  public static isValidAdduct(adductStr: string): boolean {
    try {
      const s = Adduct.parseAdduct(adductStr);
      return s.multiplier > 0 && Math.abs(s.charge) >= 1;
    } catch {
      return false;
    }
  }

  /**
   * Generates the resulting total Formula for this adduct
   */
  public get formula(): Formula {
    const totalCounts: Record<string, number> = {};

    // Multiply base counts
    for (const [el, cnt] of Object.entries(this.baseFormula.counts)) {
      totalCounts[el] = (totalCounts[el] || 0) + cnt * this.spec.multiplier;
    }

    // Add elements
    for (const [el, cnt] of Object.entries(this.spec.addElements)) {
      totalCounts[el] = (totalCounts[el] || 0) + cnt;
    }

    // Subtract elements
    for (const [el, cnt] of Object.entries(this.spec.subElements)) {
      const current = totalCounts[el] || 0;
      const remaining = current - cnt;
      if (remaining > 0) {
        totalCounts[el] = remaining;
      } else {
        delete totalCounts[el];
      }
    }

    const fStr = Object.entries(totalCounts)
      .map(([el, cnt]) => (cnt === 1 ? el : `${el}${cnt}`))
      .join('');
    return new Formula(fStr);
  }

  /**
   * Calculate exact m/z for this adduct ion
   */
  public calculateMz(neutralMass: number): number {
    const z = Math.abs(this.spec.charge);
    let deltaMass = 0;

    for (const [el, cnt] of Object.entries(this.spec.addElements)) {
      const f = new Formula(el);
      deltaMass += f.monoisotopicMass * cnt;
    }
    for (const [el, cnt] of Object.entries(this.spec.subElements)) {
      const f = new Formula(el);
      deltaMass -= f.monoisotopicMass * cnt;
    }

    // Remove or add electron mass depending on charge
    const electronDelta = this.spec.charge * ELECTRON_MASS;
    const ionMass = neutralMass * this.spec.multiplier + deltaMass - electronDelta;

    return ionMass / z;
  }

  public get mz(): number {
    return this.calculateMz(this.baseFormula.monoisotopicMass);
  }
}

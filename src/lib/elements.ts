/**
 * Exact atomic masses and isotopic abundances for high-resolution mass spectrometry.
 * Standard IUPAC values.
 */

export interface Isotope {
  mass: number;
  abundance: number; // 0 to 1
  nominal: number;
}

export interface ElementData {
  name: string;
  symbol: string;
  atomicNumber: number;
  standardWeight: number;
  isotopes: Isotope[];
}

export const ELECTRON_MASS = 0.000548579909067; // Da

export const ELEMENTS: Record<string, ElementData> = {
  H: {
    name: 'Hydrogen',
    symbol: 'H',
    atomicNumber: 1,
    standardWeight: 1.008,
    isotopes: [
      { mass: 1.00782503223, abundance: 0.999885, nominal: 1 },
      { mass: 2.01410177812, abundance: 0.000115, nominal: 2 },
    ],
  },
  D: {
    name: 'Deuterium',
    symbol: 'D',
    atomicNumber: 1,
    standardWeight: 2.014101778,
    isotopes: [
      { mass: 2.01410177812, abundance: 1.0, nominal: 2 },
    ],
  },
  C: {
    name: 'Carbon',
    symbol: 'C',
    atomicNumber: 6,
    standardWeight: 12.011,
    isotopes: [
      { mass: 12.000000000, abundance: 0.9893, nominal: 12 },
      { mass: 13.003354835, abundance: 0.0107, nominal: 13 },
    ],
  },
  N: {
    name: 'Nitrogen',
    symbol: 'N',
    atomicNumber: 7,
    standardWeight: 14.007,
    isotopes: [
      { mass: 14.0030740044, abundance: 0.99636, nominal: 14 },
      { mass: 15.0001088989, abundance: 0.00364, nominal: 15 },
    ],
  },
  O: {
    name: 'Oxygen',
    symbol: 'O',
    atomicNumber: 8,
    standardWeight: 15.999,
    isotopes: [
      { mass: 15.9949146196, abundance: 0.99757, nominal: 16 },
      { mass: 16.9991317565, abundance: 0.00038, nominal: 17 },
      { mass: 17.9991596129, abundance: 0.00205, nominal: 18 },
    ],
  },
  F: {
    name: 'Fluorine',
    symbol: 'F',
    atomicNumber: 9,
    standardWeight: 18.9984,
    isotopes: [
      { mass: 18.998403163, abundance: 1.0, nominal: 19 },
    ],
  },
  Na: {
    name: 'Sodium',
    symbol: 'Na',
    atomicNumber: 11,
    standardWeight: 22.98977,
    isotopes: [
      { mass: 22.989769282, abundance: 1.0, nominal: 23 },
    ],
  },
  Si: {
    name: 'Silicon',
    symbol: 'Si',
    atomicNumber: 14,
    standardWeight: 28.085,
    isotopes: [
      { mass: 27.976926535, abundance: 0.92223, nominal: 28 },
      { mass: 28.97649472, abundance: 0.04685, nominal: 29 },
      { mass: 29.97377017, abundance: 0.03092, nominal: 30 },
    ],
  },
  P: {
    name: 'Phosphorus',
    symbol: 'P',
    atomicNumber: 15,
    standardWeight: 30.97376,
    isotopes: [
      { mass: 30.973761998, abundance: 1.0, nominal: 31 },
    ],
  },
  S: {
    name: 'Sulfur',
    symbol: 'S',
    atomicNumber: 16,
    standardWeight: 32.06,
    isotopes: [
      { mass: 31.972071174, abundance: 0.9499, nominal: 32 },
      { mass: 32.971458910, abundance: 0.0075, nominal: 33 },
      { mass: 33.96786701, abundance: 0.0425, nominal: 34 },
      { mass: 35.9670812, abundance: 0.0001, nominal: 36 },
    ],
  },
  Cl: {
    name: 'Chlorine',
    symbol: 'Cl',
    atomicNumber: 17,
    standardWeight: 35.45,
    isotopes: [
      { mass: 34.96885272, abundance: 0.7576, nominal: 35 },
      { mass: 36.96590262, abundance: 0.2424, nominal: 37 },
    ],
  },
  K: {
    name: 'Potassium',
    symbol: 'K',
    atomicNumber: 19,
    standardWeight: 39.0983,
    isotopes: [
      { mass: 38.96370668, abundance: 0.93258, nominal: 39 },
      { mass: 40.96182576, abundance: 0.06730, nominal: 41 },
    ],
  },
  Br: {
    name: 'Bromine',
    symbol: 'Br',
    atomicNumber: 35,
    standardWeight: 79.904,
    isotopes: [
      { mass: 78.9183376, abundance: 0.5069, nominal: 79 },
      { mass: 80.916291, abundance: 0.4931, nominal: 81 },
    ],
  },
  I: {
    name: 'Iodine',
    symbol: 'I',
    atomicNumber: 53,
    standardWeight: 126.9045,
    isotopes: [
      { mass: 126.904477, abundance: 1.0, nominal: 127 },
    ],
  },
  B: {
    name: 'Boron',
    symbol: 'B',
    atomicNumber: 5,
    standardWeight: 10.81,
    isotopes: [
      { mass: 10.0129370, abundance: 0.199, nominal: 10 },
      { mass: 11.0093054, abundance: 0.801, nominal: 11 },
    ],
  },
  Fe: {
    name: 'Iron',
    symbol: 'Fe',
    atomicNumber: 26,
    standardWeight: 55.845,
    isotopes: [
      { mass: 53.9396105, abundance: 0.05845, nominal: 54 },
      { mass: 55.9349375, abundance: 0.91754, nominal: 56 },
      { mass: 56.9353940, abundance: 0.02119, nominal: 57 },
      { mass: 57.933276, abundance: 0.00282, nominal: 58 },
    ],
  },
};

/**
 * Mass Spectrometry file reading, sniffing, and parsing utilities.
 * Supports delimited text (.txt, .csv, .tsv) and Shimadzu exports.
 */

export interface LoadOptions {
  delimiter?: string;
  skipRows?: number;
  massCol?: number; // 0-indexed
  signalCol?: number; // 0-indexed
}

export interface ParseResult {
  x: number[];
  y: number[];
  fileName?: string;
  rowCount: number;
  minMz: number;
  maxMz: number;
  maxSignal: number;
}

export interface FormatDetection {
  delimiter: string;
  skipRows: number;
  massCol: number;
  signalCol: number;
  isShimadzu: boolean;
  sampleRows: string[][];
}

export interface SampleDataset {
  id: string;
  name: string;
  formula: string;
  adduct: string;
  expectedDeuteration: number;
  path: string;
  notes?: string;
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'NDF-B-030',
    name: 'NDF-B-030 (C12HD8N)',
    formula: 'C12HD8N',
    adduct: '[M-H]-',
    expectedDeuteration: 94.4,
    path: './samples/NDF-B-030.txt',
    notes: '8-deuterated carbazole derivative. Theoretical envelope at m/z ~174.12.',
  },
  {
    id: 'NDF-A-009',
    name: 'NDF-A-009 (C8D15HO2)',
    formula: 'C8D15HO2',
    adduct: '[M-H]-',
    expectedDeuteration: 96.3,
    path: './samples/NDF-A-009.txt',
    notes: 'Octanoic acid d15. High deuteration envelope at m/z ~158.2.',
  },
];

/**
 * Sniffs delimiters, header rows, and data columns from text content
 */
export function detectTextFormat(text: string): FormatDetection {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const isShimadzu =
    lines.length > 1 &&
    lines[0].startsWith('[Header]') &&
    lines.some((l, idx) => idx < 10 && l.includes('LabSolutions'));

  let skipRows = 0;
  let delimiter = '\t';
  let massCol = 0;
  let signalCol = 1;

  if (isShimadzu) {
    // Find [Spectrum Data] or header table
    for (let i = 0; i < Math.min(lines.length, 100); i++) {
      if (
        lines[i].includes('[Spectrum Data]') ||
        lines[i].includes('[Profile Data]') ||
        lines[i].toLowerCase().includes('m/z')
      ) {
        skipRows = i + 1;
        break;
      }
    }
  }

  // Sniff delimiter on lines after candidate skip
  const testLines = lines.slice(skipRows, skipRows + 15);
  const delims = ['\t', ',', ';', ' '];
  let bestDelim = '\t';
  let highestConsistentCount = 0;

  for (const d of delims) {
    const counts = testLines.map((l) => (d === ' ' ? l.trim().split(/\s+/).length - 1 : l.split(d).length - 1));
    const avgCount = counts.reduce((a, b) => a + b, 0) / (counts.length || 1);
    if (avgCount >= 1 && avgCount > highestConsistentCount) {
      highestConsistentCount = avgCount;
      bestDelim = d;
    }
  }
  delimiter = bestDelim;

  // Find first row that contains valid numeric columns
  for (let i = skipRows; i < Math.min(lines.length, 50); i++) {
    const row = splitLine(lines[i], delimiter);
    const nums = row.map((c) => parseFloat(c));
    const validCount = nums.filter((n) => !isNaN(n)).length;

    if (validCount >= 2) {
      skipRows = i;
      break;
    }
  }

  // Sample candidate rows
  const parsedRows: string[][] = [];
  for (let i = skipRows; i < Math.min(lines.length, skipRows + 10); i++) {
    parsedRows.push(splitLine(lines[i], delimiter));
  }

  // Guess columns: which column is increasing floats (m/z) and which has intensities
  if (parsedRows.length >= 2) {
    const colCount = parsedRows[0].length;
    let bestMzCol = 0;
    let bestSignalCol = 1;

    for (let c = 0; c < colCount; c++) {
      const vals = parsedRows.map((r) => parseFloat(r[c])).filter((v) => !isNaN(v));
      if (vals.length >= 2) {
        // check monotonicity
        let isIncreasing = true;
        for (let k = 0; k < vals.length - 1; k++) {
          if (vals[k + 1] <= vals[k]) {
            isIncreasing = false;
            break;
          }
        }
        if (isIncreasing && vals[0] > 0 && vals[0] < 5000) {
          bestMzCol = c;
          bestSignalCol = c === 0 ? 1 : 0;
        }
      }
    }
    massCol = bestMzCol;
    signalCol = bestSignalCol;
  }

  return {
    delimiter,
    skipRows,
    massCol,
    signalCol,
    isShimadzu,
    sampleRows: parsedRows,
  };
}

function splitLine(line: string, delimiter: string): string[] {
  if (delimiter === ' ') {
    return line.trim().split(/\s+/);
  }
  return line.split(delimiter).map((c) => c.trim());
}

/**
 * Parse delimited mass spectrometry data text
 */
export function parseMsText(text: string, options?: LoadOptions): ParseResult {
  const detection = detectTextFormat(text);
  const delimiter = options?.delimiter ?? detection.delimiter;
  const skipRows = options?.skipRows ?? detection.skipRows;
  const massCol = options?.massCol ?? detection.massCol;
  const signalCol = options?.signalCol ?? detection.signalCol;

  const rawLines = text.split(/\r?\n/);
  const x: number[] = [];
  const y: number[] = [];

  for (let i = skipRows; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line || line.startsWith('#') || line.startsWith('[')) continue;

    const parts = splitLine(line, delimiter);
    if (parts.length <= Math.max(massCol, signalCol)) continue;

    const mzVal = parseFloat(parts[massCol]);
    const sigVal = parseFloat(parts[signalCol]);

    if (!isNaN(mzVal) && !isNaN(sigVal)) {
      x.push(mzVal);
      y.push(sigVal);
    }
  }

  if (x.length === 0) {
    throw new Error('No valid numeric m/z and intensity data points could be parsed from this file.');
  }

  // Ensure sorting by m/z ascending
  let needsSort = false;
  for (let i = 0; i < x.length - 1; i++) {
    if (x[i + 1] < x[i]) {
      needsSort = true;
      break;
    }
  }

  if (needsSort) {
    const indices = Array.from({ length: x.length }, (_, i) => i);
    indices.sort((a, b) => x[a] - x[b]);
    const sortedX = indices.map((i) => x[i]);
    const sortedY = indices.map((i) => y[i]);
    return {
      x: sortedX,
      y: sortedY,
      rowCount: sortedX.length,
      minMz: sortedX[0],
      maxMz: sortedX[sortedX.length - 1],
      maxSignal: Math.max(...sortedY),
    };
  }

  return {
    x,
    y,
    rowCount: x.length,
    minMz: x[0],
    maxMz: x[x.length - 1],
    maxSignal: Math.max(...y),
  };
}

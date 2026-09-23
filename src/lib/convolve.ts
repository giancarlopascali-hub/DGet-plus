/**
 * Deconvolution algorithm used by DGet to recover true deuteration pattern.
 * Port of DGet convolve.py
 */
import { complexDiv, convolveFull, irfft, rfft } from './fft';

export interface DeconvolveResult {
  recovered: number[];
  residuals: number[];
}

/**
 * Inverse of convolution performed in the frequency domain.
 * @param x Extracted peak signals array
 * @param psf Point spread function (normalized isotopic envelope fractions)
 */
export function deconvolve(x: number[], psf: number[]): DeconvolveResult {
  if (x.length === 0 || psf.length === 0) {
    return { recovered: [], residuals: [] };
  }

  const r = Math.max(x.length, psf.length);
  const X = rfft(x, r);
  const P = rfft(psf, r);

  // Divide in frequency domain: Y = X / P
  const Y = X.map((xVal, idx) => complexDiv(xVal, P[idx] || { re: 1e-9, im: 0 }));

  // Inverse FFT
  const y = irfft(Y, r);

  // recovered data length: x.length - (psf.length - 1)
  const recoveredLen = Math.max(1, x.length - (psf.length - 1));
  const recovered = y.slice(0, recoveredLen);

  // Calculate residuals: rem = x - convolve(rec, psf, mode="full")
  const reconvolved = convolveFull(recovered, psf);
  const residuals = x.map((xVal, i) => xVal - (reconvolved[i] || 0));

  return { recovered, residuals };
}

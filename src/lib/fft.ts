/**
 * Real-valued Fast / Discrete Fourier Transform matching NumPy's rfft and irfft.
 * Provides exact deconvolution in the frequency domain.
 */

export interface Complex {
  re: number;
  im: number;
}

export function complexDiv(a: Complex, b: Complex, epsilon: number = 1e-12): Complex {
  const denom = b.re * b.re + b.im * b.im;
  if (denom < epsilon) {
    return { re: 0, im: 0 };
  }
  return {
    re: (a.re * b.re + a.im * b.im) / denom,
    im: (a.im * b.re - a.re * b.im) / denom,
  };
}

/**
 * Compute the 1D discrete Fourier transform of a real-valued array.
 * Output length is floor(r / 2) + 1, exactly like numpy.fft.rfft(x, r).
 */
export function rfft(x: number[], r: number): Complex[] {
  const padded = new Float64Array(r);
  for (let i = 0; i < Math.min(x.length, r); i++) {
    padded[i] = x[i];
  }

  const outLen = Math.floor(r / 2) + 1;
  const result: Complex[] = new Array(outLen);

  const twoPiOverR = (2 * Math.PI) / r;

  for (let k = 0; k < outLen; k++) {
    let sumRe = 0;
    let sumIm = 0;
    const angleBase = twoPiOverR * k;

    for (let n = 0; n < r; n++) {
      const angle = angleBase * n;
      const val = padded[n];
      sumRe += val * Math.cos(angle);
      sumIm -= val * Math.sin(angle);
    }

    result[k] = { re: sumRe, im: sumIm };
  }

  return result;
}

/**
 * Compute the inverse of rfft, returning a real-valued array of length r.
 * Exactly matches numpy.fft.irfft(X, r).
 */
export function irfft(X: Complex[], r: number): number[] {
  const result = new Array<number>(r);
  const twoPiOverR = (2 * Math.PI) / r;
  const isEven = r % 2 === 0;
  const lastIndex = Math.floor(r / 2);

  for (let n = 0; n < r; n++) {
    // k = 0 term
    let val = X[0].re;

    // Interior terms (multiplied by 2 because of conjugate symmetry)
    const upperK = isEven ? lastIndex - 1 : lastIndex;
    for (let k = 1; k <= upperK; k++) {
      const angle = twoPiOverR * k * n;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      // 2 * Re(X[k] * e^(i * angle)) = 2 * (re * cos - im * sin)
      val += 2 * (X[k].re * cosA - X[k].im * sinA);
    }

    // Nyquist term if r is even: k = r/2 (angle = pi * n)
    if (isEven && lastIndex < X.length) {
      const angle = Math.PI * n;
      val += X[lastIndex].re * Math.cos(angle);
    }

    result[n] = val / r;
  }

  return result;
}

/**
 * Direct 1D discrete convolution matching numpy.convolve(a, b, mode='full')
 */
export function convolveFull(a: number[], b: number[]): number[] {
  const n = a.length;
  const m = b.length;
  if (n === 0 || m === 0) return [];
  const out = new Array<number>(n + m - 1).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      out[i + j] += a[i] * b[j];
    }
  }

  return out;
}

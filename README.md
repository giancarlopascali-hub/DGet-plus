# DGet+ (DGet Plus)

**DGet+** is an enhanced, pure client-side web and desktop suite for determining the percentage and distribution of deuterium in labeled molecules from high-resolution mass spectrometry (HRMS) data.

This project is hosted at [https://github.com/giancarlopascali-hub/DGet-plus](https://github.com/giancarlopascali-hub/DGet-plus) and deployed statically via GitHub Pages.

---

## 🔬 Scientific Background

DGet+ implements the numerical deconvolution method established by Thomas E. Lockwood and Alexander Angeloski in the original *DGet!* package ([djdt/dget](https://github.com/djdt/dget)).

The observed mass spectrum envelope is a convolution of:
1. The **isotopologue distribution** (proportions of $D_0, D_1, \dots, D_n$ incorporation)
2. The **isotopic envelope / point spread function (PSF)** of the molecular adduct ion (natural abundance contributions of $^{13}\text{C}$, $^{15}\text{N}$, $^{18}\text{O}$, etc.)

By extracting the signal intensities at each nominal isotopologue position and deconvolving against the theoretical adduct PSF using 1D real-valued Fourier transforms (FFT / DFT), DGet+ mathematically isolates the true deuteration probabilities.

---

## ✨ Enhancements in DGet+

- **100% Client-Side & Static**: Runs entirely in the browser with zero server roundtrips, zero telemetry, and immediate reactivity.
- **Desktop GUI Layout**: Faithfully reproduces the Qt6 desktop layout (`QMainWindow` + dock widgets: Controls, Formula Spectra, High-Res Canvas, Results Text, Results Graph).
- **Interactive Cutoff Pin Selection**: Click directly on any $D_x$ pin in the mass spectrum to set the calculation cutoff immediately. Active states are marked in red (`dget_state_used`), excluded states in green (`dget_state_unused`).
- **Real-Time Formula Parsing**: Built-in chemical formula parser with support for standard isotopes, Hill notation, and explicit $[2\text{H}]$ or $\text{D}$.
- **Comprehensive Adduct Engine**: Automatic mass calculation for $[M]^+$, $[M+H]^+$, $[M+Na]^+$, $[M+K]^+$, $[2M+H]^+$, $[M-H]^-$, $[2M-H]^-$, $[M+Cl]^-$, and customizable adduct stoichiometry.
- **Smart Delimiter & Format Sniffer**: Automatically detects Tab, Comma, Semicolon, Space delimiters, skip rows, and parses Shimadzu HRMS exports.
- **One-Click Analytical Reports**: Generate formatted PDF / printable Certificates of Deuteration Analysis.
- **CSV & Text Export**: Export state abundance tables and summary text files directly to your device.
- **GitHub Pages Ready**: Includes pre-configured GitHub Actions workflow (`deploy.yml`) for seamless deployment.

---

## 🚀 Running Locally

```bash
# 1. Clone the repository
git clone https://github.com/giancarlopascali-hub/DGet-plus.git
cd DGet-plus

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open your browser at `http://localhost:3000`.

---

## 📦 Building for GitHub Pages

To build the static distribution:

```bash
npm run build
```

The compiled files will be output to `./dist/` with relative asset paths ready for hosting on GitHub Pages or any static web host.

---

## 📚 References & Attribution

- Original DGet! algorithm and package by Thomas E. Lockwood & Alexander Angeloski: [https://github.com/djdt/dget](https://github.com/djdt/dget)
- Documentation: [https://dget.readthedocs.io](https://dget.readthedocs.io)

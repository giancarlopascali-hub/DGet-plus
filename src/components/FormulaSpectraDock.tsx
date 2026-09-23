import React, { useMemo, useState, useRef } from 'react';
import { BarChart2, Image as ImageIcon, FileSpreadsheet } from 'lucide-react';
import { Formula } from '../lib/formula';
import { Adduct } from '../lib/adduct';

interface FormulaSpectraDockProps {
  formula: Formula | null;
  adductString: string;
}

export const FormulaSpectraDock: React.FC<FormulaSpectraDockProps> = ({
  formula,
  adductString,
}) => {
  // Sliders for full view of plots and minor peaks
  const [gain, setGain] = useState<number>(1.0); // 1.0x to 10.0x zoom on small peaks
  const [spacing, setSpacing] = useState<number>(45); // pixel width per peak bin
  const svgRef = useRef<SVGSVGElement>(null);

  const spectrum = useMemo(() => {
    if (!formula) return [];
    try {
      const ad = new Adduct(formula, adductString);
      return ad.formula.spectrum(1e-4);
    } catch {
      return [];
    }
  }, [formula, adductString]);

  const maxFraction = useMemo(() => {
    if (spectrum.length === 0) return 1;
    return Math.max(...spectrum.map((p) => p.fraction));
  }, [spectrum]);

  const totalPlotWidth = Math.max(260, 40 + spectrum.length * spacing);

  // Download Formula PSF Plot as PNG Image
  const handleDownloadImage = () => {
    const svg = svgRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const URLObj = window.URL || window.webkitURL || window;
    const blobURL = URLObj.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = totalPlotWidth * 2;
      canvas.height = 115 * 2;
      const context = canvas.getContext('2d');
      if (context) {
        context.scale(2, 2);
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, totalPlotWidth, 115);
        context.drawImage(image, 0, 0);
        const png = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `formula_psf_${formula?.raw || 'spectrum'}.png`;
        downloadLink.href = png;
        downloadLink.click();
      }
      URLObj.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  };

  // Download Formula PSF Data as CSV
  const handleDownloadCsv = () => {
    if (spectrum.length === 0) return;
    const headers = ['m/z', 'Probability_Fraction', 'Relative_Abundance_Percent'];
    const rows = spectrum.map((p) => {
      const relPct = ((p.fraction / maxFraction) * 100).toFixed(4);
      return `${p.mass.toFixed(4)},${p.fraction.toFixed(6)},${relPct}%`;
    });

    const csvContent = [
      `# Formula Theoretical PSF Export - ${formula?.raw || ''} (${adductString})`,
      headers.join(','),
      ...rows,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `formula_psf_${formula?.raw || 'spectrum'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white w-full flex flex-col h-full text-xs select-none min-h-0 border-t border-slate-200">
      {/* Header */}
      <div className="bg-slate-100 px-2 py-1 border-b border-slate-200 font-semibold text-slate-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <BarChart2 className="w-3.5 h-3.5 text-amber-600" />
          <span className="font-bold text-slate-900 text-xs">Formula Spectra</span>
        </div>

        {/* Sliders stacked vertically + Download actions to the right */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Stacked sliders: Gain (height) on top, Width (spacing) below */}
          <div className="flex flex-col gap-0.5 text-[9.5px] text-slate-600">
            {/* Row 1: Height / Gain */}
            <div className="flex items-center gap-1" title="Vertical Gain / Height of peaks">
              <span className="font-mono text-slate-500 w-6">Gain:</span>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.5"
                value={gain}
                onChange={(e) => setGain(parseFloat(e.target.value))}
                className="w-12 accent-amber-600 cursor-pointer h-1.5 bg-slate-200 rounded"
              />
              <span className="font-mono text-amber-700 font-bold w-5 text-right">{gain.toFixed(1)}x</span>
            </div>

            {/* Row 2: Width / Spacing */}
            <div className="flex items-center gap-1" title="Horizontal Width / Peak bin spacing">
              <span className="font-mono text-slate-500 w-6">Width:</span>
              <input
                type="range"
                min="30"
                max="90"
                step="5"
                value={spacing}
                onChange={(e) => setSpacing(parseInt(e.target.value, 10))}
                className="w-12 accent-sky-600 cursor-pointer h-1.5 bg-slate-200 rounded"
              />
              <span className="font-mono text-sky-700 font-semibold w-5 text-right">{spacing}</span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-300" />

          {/* Download buttons */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleDownloadImage}
              className="p-1 rounded hover:bg-slate-200 text-slate-700 transition"
              title="Download Formula PSF Plot as PNG Image"
            >
              <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
            </button>
            <button
              onClick={handleDownloadCsv}
              className="p-1 rounded hover:bg-slate-200 text-slate-700 transition"
              title="Download Formula PSF Peak Values as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Body with horizontal scroll */}
      <div className="p-2 flex-1 flex flex-col justify-between overflow-x-auto overflow-y-hidden bg-white">
        {spectrum.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 italic">
            Enter a valid formula & adduct
          </div>
        ) : (
          <div className="h-full flex flex-col justify-between min-w-full">
            {/* SVG Bar Chart with dynamic width based on spacing slider */}
            <div className="flex-1 w-full relative min-h-[90px] overflow-x-auto">
              <svg
                ref={svgRef}
                style={{ width: `${totalPlotWidth}px`, height: '100%' }}
                viewBox={`0 0 ${totalPlotWidth} 105`}
                preserveAspectRatio="none"
              >
                {/* Horizontal grid lines */}
                <line x1="30" y1="18" x2={totalPlotWidth - 10} y2="18" stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="0.8" />
                <line x1="30" y1="52" x2={totalPlotWidth - 10} y2="52" stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="0.8" />
                <line x1="30" y1="86" x2={totalPlotWidth - 10} y2="86" stroke="#94a3b8" strokeWidth="1" />

                {/* Y-axis labels */}
                <text x="26" y="21" fill="#64748b" fontSize="8" textAnchor="end">
                  {(100 / gain).toFixed(0)}%
                </text>
                <text x="26" y="55" fill="#64748b" fontSize="8" textAnchor="end">
                  {(50 / gain).toFixed(0)}%
                </text>
                <text x="26" y="89" fill="#64748b" fontSize="8" textAnchor="end">0%</text>

                {/* Bars */}
                {spectrum.map((peak, idx) => {
                  const x = 45 + idx * spacing;
                  const scaledRatio = Math.min(1.0, (peak.fraction / maxFraction) * gain);
                  const height = scaledRatio * 68;
                  const y = 86 - height;
                  const realPct = ((peak.fraction / maxFraction) * 100).toFixed(2);

                  return (
                    <g key={idx} className="group cursor-pointer">
                      <rect
                        x={x - 8}
                        y={y}
                        width="16"
                        height={Math.max(2, height)}
                        fill="#d97706"
                        rx="1.5"
                        className="transition-all hover:fill-amber-500"
                      />
                      {/* Percent label on top */}
                      <text
                        x={x}
                        y={Math.max(12, y - 3)}
                        fill="#451a03"
                        fontSize="7.5"
                        textAnchor="middle"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {realPct}%
                      </text>
                      {/* m/z label below */}
                      <text
                        x={x}
                        y="97"
                        fill="#475569"
                        fontSize="8"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {peak.mass.toFixed(2)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Sub-bar */}
            <div className="text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1 flex-shrink-0">
              <span>{spectrum.length} isotopic peaks</span>
              <span className="font-mono text-amber-800 font-semibold">
                Base: {spectrum[0]?.mass.toFixed(3)} m/z
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

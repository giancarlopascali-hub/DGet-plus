import React, { useState, useRef } from 'react';
import { BarChart3, Sliders, ArrowUpDown, Image as ImageIcon, FileSpreadsheet } from 'lucide-react';
import { DGetResult } from '../lib/dget';

interface ResultsGraphDockProps {
  result: DGetResult | null;
  onSetCutoff: (cutoffStr: string) => void;
  activeFileName?: string;
}

export const ResultsGraphDock: React.FC<ResultsGraphDockProps> = ({
  result,
  onSetCutoff,
  activeFileName = '',
}) => {
  // Sliders for full view of all states and small abundance zoom
  const [barSpacing, setBarSpacing] = useState<number>(44); // Bar spacing slider
  const [yScaleMultiplier, setYScaleMultiplier] = useState<number>(1.0); // Y-axis zoom slider
  const svgRef = useRef<SVGSVGElement>(null);

  const maxPercent = React.useMemo(() => {
    if (!result || result.stateDetails.length === 0) return 100;
    const maxVal = Math.max(...result.stateDetails.map((s) => s.percent));
    const base = Math.max(10, Math.ceil(maxVal / 10) * 10);
    return Math.max(5, base / yScaleMultiplier);
  }, [result, yScaleMultiplier]);

  const stateCount = result?.stateDetails.length || 0;
  const totalSvgWidth = Math.max(340, 50 + stateCount * barSpacing);

  // Download Deuteration Histogram as PNG Image
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
      canvas.width = totalSvgWidth * 2;
      canvas.height = 115 * 2;
      const context = canvas.getContext('2d');
      if (context) {
        context.scale(2, 2);
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, totalSvgWidth, 115);
        context.drawImage(image, 0, 0);
        const png = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `deuteration_histogram_${activeFileName.replace(/\.[^/.]+$/, '')}.png`;
        downloadLink.href = png;
        downloadLink.click();
      }
      URLObj.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  };

  // Download Deuteration States as CSV
  const handleDownloadCsv = () => {
    if (!result) return;
    const headers = ['State', 'Label', 'Centroid_m/z', 'Probability_Fraction', 'Abundance_Percent', 'Cutoff_Status'];
    const rows = result.stateDetails.map((s) =>
      [
        s.state,
        `"${s.label}"`,
        s.monoisotopicMz.toFixed(4),
        s.fraction.toFixed(6),
        s.percent.toFixed(4),
        s.isActive ? 'Active' : 'Excluded',
      ].join(',')
    );

    const csvContent = [
      `# Deuteration Distribution Export - ${activeFileName}`,
      `# Deuteration Percentage: ${result.deuterationPercent.toFixed(4)}%`,
      `# Residual Error: ${result.residualErrorPercent.toFixed(4)}%`,
      headers.join(','),
      ...rows,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deuteration_states_${activeFileName.replace(/\.[^/.]+$/, '')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white flex-1 flex flex-col h-full min-h-0 text-xs select-none">
      {/* Header */}
      <div className="bg-slate-100 px-3 py-1 border-b border-slate-200 font-semibold text-slate-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-sky-600" />
          <span>Deuteration States</span>
          {result && (
            <span className="text-[11px] font-mono text-emerald-700 font-bold ml-1">
              • Total: {result.deuterationPercent.toFixed(2)} %
            </span>
          )}
        </div>

        {/* Sliders & Action Controls for Full Data View */}
        <div className="flex items-center gap-2 text-[10px] text-slate-600">
          {/* Y-Axis Zoom Slider */}
          <div className="flex items-center gap-1" title="Y-Axis Zoom / Magnify low-abundance states">
            <span className="font-mono">Y-Zoom:</span>
            <input
              type="range"
              min="1.0"
              max="5.0"
              step="0.5"
              value={yScaleMultiplier}
              onChange={(e) => setYScaleMultiplier(parseFloat(e.target.value))}
              className="w-14 accent-sky-600 cursor-pointer h-1.5 bg-slate-200 rounded"
            />
            <span className="font-mono text-sky-800 font-bold">{yScaleMultiplier.toFixed(1)}x</span>
          </div>

          {/* Bar Width Slider */}
          <div className="flex items-center gap-1" title="Bar spacing & width slider">
            <span className="font-mono">Width:</span>
            <input
              type="range"
              min="28"
              max="80"
              step="4"
              value={barSpacing}
              onChange={(e) => setBarSpacing(parseInt(e.target.value, 10))}
              className="w-12 accent-sky-600 cursor-pointer h-1.5 bg-slate-200 rounded"
            />
          </div>

          <div className="h-3 w-px bg-slate-300 mx-0.5" />

          {/* Download Plot Image & CSV */}
          <button
            onClick={handleDownloadImage}
            disabled={!result}
            className="p-1 rounded hover:bg-slate-200 text-slate-700 transition disabled:opacity-40"
            title="Download Deuteration Histogram as PNG Image"
          >
            <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
          </button>
          <button
            onClick={handleDownloadCsv}
            disabled={!result}
            className="p-1 rounded hover:bg-slate-200 text-slate-700 transition disabled:opacity-40"
            title="Download Deuteration Distribution Data as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          </button>
        </div>
      </div>

      {/* Body with Horizontal Scrolling */}
      <div className="p-2 flex-1 flex flex-col justify-between overflow-x-auto overflow-y-hidden bg-white">
        {!result || result.stateDetails.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 italic">
            Awaiting calculation results...
          </div>
        ) : (
          <div className="h-full flex flex-col justify-between min-w-full">
            {/* Histogram SVG with dynamic scroll width */}
            <div className="flex-1 w-full relative min-h-[95px] overflow-x-auto">
              <svg
                ref={svgRef}
                style={{ width: `${totalSvgWidth}px`, height: '100%' }}
                viewBox={`0 0 ${totalSvgWidth} 115`}
                preserveAspectRatio="none"
              >
                {/* Horizontal reference lines */}
                <line x1="35" y1="18" x2={totalSvgWidth - 10} y2="18" stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="0.8" />
                <line x1="35" y1="52" x2={totalSvgWidth - 10} y2="52" stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="0.8" />
                <line x1="35" y1="86" x2={totalSvgWidth - 10} y2="86" stroke="#94a3b8" strokeWidth="1" />

                {/* Y-axis Labels */}
                <text x="30" y="21" fill="#64748b" fontSize="8" textAnchor="end">
                  {maxPercent.toFixed(0)}%
                </text>
                <text x="30" y="55" fill="#64748b" fontSize="8" textAnchor="end">
                  {(maxPercent / 2).toFixed(0)}%
                </text>
                <text x="30" y="89" fill="#64748b" fontSize="8" textAnchor="end">
                  0%
                </text>

                {/* Bars */}
                {result.stateDetails.map((state, idx) => {
                  const x = 50 + idx * barSpacing;
                  const barWidth = Math.min(32, Math.max(12, barSpacing * 0.65));

                  const ratio = Math.min(1.0, state.percent / maxPercent);
                  const height = ratio * 68;
                  const y = 86 - height;
                  const isUsed = state.isActive;
                  const barFill = isUsed ? '#ef4444' : '#10b981';

                  return (
                    <g
                      key={state.state}
                      onClick={() => onSetCutoff(state.label)}
                      className="cursor-pointer group"
                    >
                      {/* Bar rect */}
                      <rect
                        x={x - barWidth / 2}
                        y={y}
                        width={barWidth}
                        height={Math.max(1.5, height)}
                        fill={barFill}
                        rx="2"
                        className="transition-all hover:opacity-85"
                      />

                      {/* Percent label on top */}
                      <text
                        x={x}
                        y={Math.max(11, y - 3)}
                        fill={isUsed ? '#991b1b' : '#065f46'}
                        fontSize="8"
                        textAnchor="middle"
                        fontFamily="monospace"
                        fontWeight={isUsed ? 'bold' : 'normal'}
                      >
                        {state.percent > 0 ? `${state.percent.toFixed(1)}%` : '0%'}
                      </text>

                      {/* State label below baseline */}
                      <text
                        x={x}
                        y="99"
                        fill={isUsed ? '#b91c1c' : '#047857'}
                        fontSize="9"
                        textAnchor="middle"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {state.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Bottom Status & Legend */}
            <div className="text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1 flex-shrink-0">
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-red-500 inline-block shadow-xs" />
                  <span className="font-medium text-slate-700">Active State</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block shadow-xs" />
                  <span className="font-medium text-slate-700">Excluded (Cutoff)</span>
                </span>
              </span>
              <span className="italic text-slate-500">Click any state bar to set cutoff</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

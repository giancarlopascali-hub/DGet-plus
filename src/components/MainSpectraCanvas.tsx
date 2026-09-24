import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  ZoomIn,
  RotateCcw,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  FileSpreadsheet,
} from 'lucide-react';
import { DGetResult } from '../lib/dget';

interface MainSpectraCanvasProps {
  result: DGetResult | null;
  rawData: { x: number[]; y: number[] };
  showDeconvolution: boolean;
  showIsotopologues: boolean;
  onSetCutoff: (cutoffStr: string) => void;
  signalMassWidth: number;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  activeFileName?: string;
  zoomDEnabled?: boolean;
  onToggleZoomD?: (enabled: boolean) => void;
}

export const MainSpectraCanvas: React.FC<MainSpectraCanvasProps> = ({
  result,
  rawData,
  showDeconvolution,
  showIsotopologues,
  onSetCutoff,
  signalMassWidth,
  isMaximized = false,
  onToggleMaximize,
  activeFileName = '',
  zoomDEnabled = false,
  onToggleZoomD,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Exact dynamic canvas dimensions tracked via ResizeObserver
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 400,
  });

  // Margins & Padding: Generous space to guarantee labels and axes are never cut off
  const padding = useMemo(() => ({
    left: 82,
    right: 32,
    top: 48,
    bottom: 56,
  }), []);

  // Viewport domain: [minMz, maxMz], [minY, maxY]
  const [viewX, setViewX] = useState<[number, number]>([0, 100]);
  const [viewY, setViewY] = useState<[number, number]>([0, 100]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const lastActiveFileRef = useRef<string>('');

  // Interaction state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragDomainStart, setDragDomainStart] = useState<[number, number]>([0, 100]);
  const [hoverInfo, setHoverInfo] = useState<{
    xVal: number;
    yVal: number;
    pixelX: number;
    pixelY: number;
  } | null>(null);

  // Track wrapper size changes dynamically
  useEffect(() => {
    const el = canvasWrapperRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 20 && height > 20) {
          setCanvasDimensions({
            width: Math.floor(width),
            height: Math.floor(height),
          });
        }
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Calculate full bounds
  const fullBounds = useMemo(() => {
    if (rawData.x.length === 0) return { minX: 0, maxX: 100, maxY: 100 };
    const minX = rawData.x[0];
    const maxX = rawData.x[rawData.x.length - 1];
    let maxY = 0;
    for (let i = 0; i < rawData.y.length; i++) {
      if (rawData.y[i] > maxY) maxY = rawData.y[i];
    }
    return { minX, maxX, maxY: maxY || 1 };
  }, [rawData]);

  // Reset to full bounds
  const resetToFullZoom = useCallback(() => {
    setViewX([fullBounds.minX, fullBounds.maxX]);
    setViewY([0, fullBounds.maxY * 1.15]);
    if (onToggleZoomD) {
      onToggleZoomD(false);
    }
  }, [fullBounds, onToggleZoomD]);

  // Zoom directly to deuterated envelope ("Zoom to D")
  const zoomToDeuteratedEnvelope = useCallback(() => {
    if (!result || result.targetMasses.length === 0) {
      resetToFullZoom();
      return;
    }
    const minD = Math.min(...result.targetMasses) - 1.5;
    const maxD = Math.max(...result.targetMasses) + 2.0;

    // Find max local intensity in this region
    let localMaxY = 0;
    for (let i = 0; i < rawData.x.length; i++) {
      if (rawData.x[i] >= minD && rawData.x[i] <= maxD) {
        if (rawData.y[i] > localMaxY) localMaxY = rawData.y[i];
      }
    }

    setViewX([minD, maxD]);
    setViewY([0, (localMaxY || fullBounds.maxY) * 1.15]);
    if (onToggleZoomD) {
      onToggleZoomD(true);
    }
  }, [result, rawData, fullBounds, resetToFullZoom, onToggleZoomD]);

  // Handle active file switch or zoomDEnabled change
  useEffect(() => {
    if (rawData.x.length === 0) return;

    const fileChanged = lastActiveFileRef.current !== activeFileName;
    lastActiveFileRef.current = activeFileName;

    // Whenever a file is clicked/switched, always open in "reset" (full) view
    if (fileChanged) {
      setViewX([fullBounds.minX, fullBounds.maxX]);
      setViewY([0, fullBounds.maxY * 1.15]);
      if (onToggleZoomD) {
        onToggleZoomD(false);
      }
      setIsInitialized(true);
      return;
    }

    if (!isInitialized) {
      if (zoomDEnabled && result && result.targetMasses.length > 0) {
        const minD = Math.min(...result.targetMasses) - 1.5;
        const maxD = Math.max(...result.targetMasses) + 2.0;
        let localMaxY = 0;
        for (let i = 0; i < rawData.x.length; i++) {
          if (rawData.x[i] >= minD && rawData.x[i] <= maxD) {
            if (rawData.y[i] > localMaxY) localMaxY = rawData.y[i];
          }
        }
        setViewX([minD, maxD]);
        setViewY([0, (localMaxY || fullBounds.maxY) * 1.15]);
      } else {
        setViewX([fullBounds.minX, fullBounds.maxX]);
        setViewY([0, fullBounds.maxY * 1.15]);
      }
      setIsInitialized(true);
    }
  }, [activeFileName, zoomDEnabled, rawData, result, fullBounds, isInitialized, onToggleZoomD]);

  // Coordinate transforms
  const coordToPixel = useCallback(
    (mz: number, intensity: number, width: number, height: number, pad = padding) => {
      const plotW = width - pad.left - pad.right;
      const plotH = height - pad.top - pad.bottom;
      const px = pad.left + ((mz - viewX[0]) / (viewX[1] - viewX[0])) * plotW;
      const py = height - pad.bottom - ((intensity - viewY[0]) / (viewY[1] - viewY[0])) * plotH;
      return { px, py };
    },
    [viewX, viewY, padding]
  );

  const pixelToCoord = useCallback(
    (px: number, py: number, width: number, height: number, pad = padding) => {
      const plotW = width - pad.left - pad.right;
      const plotH = height - pad.top - pad.bottom;
      const mz = viewX[0] + ((px - pad.left) / plotW) * (viewX[1] - viewX[0]);
      const intensity = viewY[0] + ((height - pad.bottom - py) / plotH) * (viewY[1] - viewY[0]);
      return { mz, intensity };
    },
    [viewX, viewY, padding]
  );

  // High-Resolution Canvas Rendering
  const drawPlot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasDimensions;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    // 1. Clear background (Pure White)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (plotW <= 0 || plotH <= 0) return;

    // 2. Subtle Grid Lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#f1f5f9';

    // Horizontal grid (Intensity)
    const yTicks = 5;
    ctx.font = '10px monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= yTicks; i++) {
      const val = viewY[0] + (i / yTicks) * (viewY[1] - viewY[0]);
      const yPos = height - padding.bottom - (i / yTicks) * plotH;
      ctx.beginPath();
      ctx.moveTo(padding.left, yPos);
      ctx.lineTo(width - padding.right, yPos);
      ctx.stroke();

      let label = val.toFixed(0);
      if (val >= 1e6) label = `${(val / 1e6).toFixed(2)}M`;
      else if (val >= 1e3) label = `${(val / 1e3).toFixed(1)}k`;
      // Generous 12px margin to ensure intensity numbers are fully visible
      ctx.fillText(label, padding.left - 12, yPos);
    }

    // Vertical grid (m/z)
    const xTicks = 8;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = 0; i <= xTicks; i++) {
      const mz = viewX[0] + (i / xTicks) * (viewX[1] - viewX[0]);
      const xPos = padding.left + (i / xTicks) * plotW;
      ctx.beginPath();
      ctx.moveTo(xPos, padding.top);
      ctx.lineTo(xPos, height - padding.bottom);
      ctx.stroke();

      // m/z tick value numbers under baseline
      ctx.fillText(mz.toFixed(2), xPos, height - padding.bottom + 8);
    }

    // Clip to plot area
    ctx.save();
    ctx.beginPath();
    ctx.rect(padding.left, padding.top, plotW, plotH);
    ctx.clip();

    // 3. Draw Isotopologue Integration Window Bands
    if (showIsotopologues && result) {
      const halfW = (signalMassWidth || 0.33) / 2;
      result.stateDetails.forEach((state) => {
        const xStart = coordToPixel(state.monoisotopicMz - halfW, 0, width, height, padding).px;
        const xEnd = coordToPixel(state.monoisotopicMz + halfW, 0, width, height, padding).px;
        const bw = Math.max(1, xEnd - xStart);

        // Fill window band
        ctx.fillStyle = state.isActive ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)';
        ctx.fillRect(xStart, padding.top, bw, plotH);

        // Window boundary line
        ctx.strokeStyle = state.isActive ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(xStart, padding.top, bw, plotH);
      });
    }

    // 4. Draw Active File Raw MS Profile
    if (rawData.x.length > 0) {
      let startIndex = 0;
      let endIndex = rawData.x.length - 1;

      for (let i = 0; i < rawData.x.length; i++) {
        if (rawData.x[i] >= viewX[0]) {
          startIndex = Math.max(0, i - 1);
          break;
        }
      }
      for (let i = rawData.x.length - 1; i >= 0; i--) {
        if (rawData.x[i] <= viewX[1]) {
          endIndex = Math.min(rawData.x.length - 1, i + 1);
          break;
        }
      }

      ctx.beginPath();
      ctx.strokeStyle = '#0284c7'; // Sky Blue
      ctx.lineWidth = 1.8;

      let started = false;
      for (let i = startIndex; i <= endIndex; i++) {
        const { px, py } = coordToPixel(rawData.x[i], rawData.y[i], width, height, padding);
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    }

    // 5. Draw Synthetic Deconvolution Reconstruction Curve
    if (showDeconvolution && result && result.reconstructedSignals.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#e11d48'; // Rose Red
      ctx.lineWidth = 2.0;

      let started = false;
      for (let i = 0; i < result.targetMasses.length; i++) {
        const mz = result.targetMasses[i];
        const reconY = result.reconstructedSignals[i];
        if (mz >= viewX[0] - 1 && mz <= viewX[1] + 1) {
          const { px, py } = coordToPixel(mz, reconY, width, height, padding);
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
      }
      ctx.stroke();
    }

    // 6. Draw State Centroid Pins & Labels (D0 ... Dn)
    if (result) {
      result.stateDetails.forEach((state) => {
        const { px, py } = coordToPixel(state.monoisotopicMz, 0, width, height, padding);

        if (px >= padding.left - 20 && px <= width - padding.right + 20) {
          // Find local max height at this target mass
          let peakIntensity = 0;
          const halfW = (signalMassWidth || 0.33) / 2;
          for (let i = 0; i < rawData.x.length; i++) {
            if (
              rawData.x[i] >= state.monoisotopicMz - halfW &&
              rawData.x[i] <= state.monoisotopicMz + halfW
            ) {
              if (rawData.y[i] > peakIntensity) peakIntensity = rawData.y[i];
            }
          }

          const topCoord = coordToPixel(state.monoisotopicMz, peakIntensity, width, height, padding);

          // Vertical centroid pin
          ctx.beginPath();
          ctx.strokeStyle = state.isActive ? '#dc2626' : '#16a34a';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([2, 2]);
          ctx.moveTo(px, padding.top + 26);
          ctx.lineTo(px, py);
          ctx.stroke();
          ctx.setLineDash([]);

          // Pin head dot
          ctx.beginPath();
          ctx.fillStyle = state.isActive ? '#dc2626' : '#16a34a';
          ctx.arc(px, Math.max(padding.top + 28, topCoord.py), 3.5, 0, Math.PI * 2);
          ctx.fill();

          // 1. State Label (e.g. D0, D1)
          ctx.fillStyle = state.isActive ? '#991b1b' : '#166534';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(state.label, px, padding.top + 4);

          // 2. Centroid m/z value
          ctx.fillStyle = state.isActive ? '#7f1d1d' : '#14532d';
          ctx.font = '9px monospace';
          ctx.fillText(`${state.monoisotopicMz.toFixed(3)}`, px, padding.top + 14);

          // 3. Abundance % under centroid m/z
          ctx.fillStyle = state.isActive ? '#b91c1c' : '#15803d';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`${state.percent.toFixed(1)}%`, px, padding.top + 24);
        }
      });
    }

    ctx.restore();

    // 7. Draw Border around plot area
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(padding.left, padding.top, plotW, plotH);

    // 8. Axes Title Labels with safe spacing from borders
    ctx.fillStyle = '#334155';
    ctx.font = '600 11px sans-serif';
    ctx.textAlign = 'center';
    // Positioned safely in bottom margin (height - 14)
    ctx.fillText('m/z (Mass-to-Charge Ratio)', padding.left + plotW / 2, height - 14);

    ctx.save();
    // Positioned safely in left margin at x=20
    ctx.translate(22, padding.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Relative Intensity', 0, 0);
    ctx.restore();
  }, [
    canvasDimensions,
    viewX,
    viewY,
    rawData,
    result,
    showDeconvolution,
    showIsotopologues,
    signalMassWidth,
    padding,
    coordToPixel,
  ]);

  // Redraw when view or data changes
  useEffect(() => {
    drawPlot();
  }, [drawPlot]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = canvasWrapperRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const plotW = canvasDimensions.width - padding.left - padding.right;

    const mouseRatio = Math.max(0, Math.min(1, (mouseX - padding.left) / plotW));
    const currentSpan = viewX[1] - viewX[0];
    const zoomFactor = e.deltaY < 0 ? 0.8 : 1.25;
    const newSpan = Math.max(0.5, Math.min(fullBounds.maxX - fullBounds.minX, currentSpan * zoomFactor));

    const cursorMz = viewX[0] + mouseRatio * currentSpan;
    const newMin = Math.max(fullBounds.minX - 5, cursorMz - mouseRatio * newSpan);
    const newMax = Math.min(fullBounds.maxX + 5, newMin + newSpan);

    setViewX([newMin, newMax]);
  };

  // Drag pan
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragDomainStart([...viewX] as [number, number]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = canvasWrapperRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const { mz, intensity } = pixelToCoord(mouseX, mouseY, canvasDimensions.width, canvasDimensions.height);

    setHoverInfo({
      xVal: mz,
      yVal: intensity,
      pixelX: mouseX,
      pixelY: mouseY,
    });

    if (isDragging && dragStart) {
      const dx = e.clientX - dragStart.x;
      const plotW = canvasDimensions.width - padding.left - padding.right;
      const span = dragDomainStart[1] - dragDomainStart[0];
      const deltaMz = (dx / plotW) * span;

      setViewX([dragDomainStart[0] - deltaMz, dragDomainStart[1] - deltaMz]);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  // Export Canvas Image as PNG
  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `spectrum_${activeFileName ? activeFileName.replace(/\.[^/.]+$/, '') : 'plot'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Export Canvas Data as CSV (Current View m/z and Intensity)
  const handleDownloadCsv = () => {
    if (rawData.x.length === 0) return;
    const header = ['m/z', 'Intensity'];
    const rows: string[] = [];

    for (let i = 0; i < rawData.x.length; i++) {
      const mz = rawData.x[i];
      if (mz >= viewX[0] && mz <= viewX[1]) {
        rows.push(`${mz.toFixed(4)},${rawData.y[i].toFixed(2)}`);
      }
    }

    const csvContent = [
      `# Spectrum View Export - ${activeFileName || 'Selected Sample'}`,
      `# m/z Range: ${viewX[0].toFixed(2)} to ${viewX[1].toFixed(2)}`,
      header.join(','),
      ...rows,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spectrum_data_${activeFileName ? activeFileName.replace(/\.[^/.]+$/, '') : 'view'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full w-full select-none bg-white overflow-hidden relative"
    >
      {/* Top Plot Header Bar (No redundant filename, concise title & cursor data) */}
      <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs text-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900">
            Mass Spectrum
          </span>

          {hoverInfo && (
            <span className="font-mono text-[11px] text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded ml-2">
              m/z: <strong className="text-slate-900">{hoverInfo.xVal.toFixed(3)}</strong> | Int:{' '}
              <strong className="text-slate-900">{hoverInfo.yVal.toFixed(0)}</strong>
            </span>
          )}
        </div>

        {/* Legend & Action Controls (Simplified: only shows selected file profile) */}
        <div className="flex items-center gap-2 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block shadow-xs" />
            <span className="text-slate-700 font-medium">Spectrum Profile</span>
          </div>
          {showDeconvolution && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block shadow-xs" />
              <span className="text-slate-700 font-medium">Deconv Fit</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block shadow-xs" />
            <span className="text-slate-700 font-medium">Active D</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block shadow-xs" />
            <span className="text-slate-700 font-medium">Cutoff</span>
          </div>

          <div className="h-3 w-px bg-slate-300 mx-1" />

          {/* Quick Zoom Buttons */}
          <button
            onClick={zoomToDeuteratedEnvelope}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border shadow-xs transition ${
              zoomDEnabled
                ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
            }`}
            title="Zoom to Deuteration Envelope for selected file"
          >
            <ZoomIn className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zoom D</span>
          </button>
          <button
            onClick={resetToFullZoom}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs transition"
            title="Reset to Full Spectrum View"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>Reset</span>
          </button>

          <div className="h-3 w-px bg-slate-300 mx-0.5" />

          {/* Download Plot as Image & CSV */}
          <button
            onClick={handleDownloadPng}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs transition"
            title="Download Spectrum Plot as PNG Image"
          >
            <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
            <span>Image</span>
          </button>
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs transition"
            title="Download Visible Spectrum Coordinates as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>CSV</span>
          </button>

          {/* Maximize Plot View Toggle */}
          {onToggleMaximize && (
            <button
              onClick={onToggleMaximize}
              className={`p-1 rounded border shadow-xs transition ${
                isMaximized
                  ? 'bg-sky-600 border-sky-600 text-white'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
              title={isMaximized ? 'Restore Docks (Normal View)' : 'Maximize Plot View (Hide Docks)'}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        ref={canvasWrapperRef}
        className="flex-1 relative cursor-crosshair min-h-0 overflow-hidden w-full h-full bg-white"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          handleMouseUp();
          setHoverInfo(null);
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      </div>
    </div>
  );
};

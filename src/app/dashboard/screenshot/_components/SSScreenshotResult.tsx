"use client";

import { useRef, useState, useCallback, WheelEvent } from "react";
import { RotateCcw, ZoomIn, Minus, Maximize2 } from "lucide-react";
import { useSSAnnotation } from "@/hooks/useSSAnnotation";
import SSAnnotationCanvas, { SSAnnotationCanvasRef } from "./SSAnnotationCanvas";
import SSAnnotationToolbar from "./SSAnnotationToolbar";
import SSExportShare from "./SSExportShare";

interface SSScreenshotResultProps {
  screenshotUrl: string;
  onReset: () => void;
  deviceLabel: string;
  url: string;
}

const ZOOM_STEPS = [0.1, 0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 3, 4];

export default function SSScreenshotResult({ screenshotUrl, onReset, deviceLabel, url }: SSScreenshotResultProps) {
  const [currentImage, setCurrentImage] = useState(screenshotUrl);
  const [zoom, setZoom] = useState(0.5);
  const canvasRef = useRef<SSAnnotationCanvasRef>(null);
  const annotation = useSSAnnotation();

  let hostname = url;
  try { hostname = new URL(url).hostname.replace("www.", ""); } catch {}

  const handleCropApply = (newDataUrl: string) => {
    setCurrentImage(newDataUrl);
    annotation.setCropRect(null);
    annotation.clear();
  };

  const zoomIn = useCallback(() => setZoom((z) => ZOOM_STEPS.find((s) => s > z) ?? z), []);
  const zoomOut = useCallback(() => setZoom((z) => [...ZOOM_STEPS].reverse().find((s) => s < z) ?? z), []);

  const handleWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    e.deltaY < 0 ? zoomIn() : zoomOut();
  }, [zoomIn, zoomOut]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#111]">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#252525] bg-[#161616] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#6ee7b7]" />
          <span className="text-xs text-[#999] font-mono">{hostname}</span>
          <span className="text-xs text-[#444]">—</span>
          <span className="text-xs text-[#6ee7b7] font-medium">{deviceLabel}</span>
        </div>
        <button onClick={onReset}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-[#1e1e1e] text-[#777] border border-[#2e2e2e] text-xs hover:text-[#ddd] hover:border-[#444] active:scale-95 transition-all">
          <RotateCcw className="w-3 h-3" /> New
        </button>
      </div>

      {/* ── Annotation toolbar ───────────────────────────────────────────────── */}
      <SSAnnotationToolbar
        tool={annotation.tool} color={annotation.color} strokeSize={annotation.strokeSize}
        canUndo={annotation.canUndo} canRedo={annotation.canRedo}
        onToolChange={annotation.setTool} onColorChange={annotation.setColor}
        onStrokeSizeChange={annotation.setStrokeSize}
        onUndo={annotation.undo} onRedo={annotation.redo} onClear={annotation.clear}
      />

      {/* ── Zoom bar ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-1.5 bg-[#161616] border-b border-[#252525]">
        <button onClick={zoomOut} disabled={zoom <= ZOOM_STEPS[0]} title="Zoom out"
          className="flex items-center justify-center w-6 h-6 rounded text-[#777] hover:text-[#ccc] hover:bg-[#222] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <Minus className="w-3 h-3" />
        </button>

        <div className="flex items-center bg-[#1a1a1a] border border-[#2e2e2e] rounded-md px-2 h-6 min-w-[56px] justify-center">
          <span className="text-xs text-[#bbb] font-mono tabular-nums">{Math.round(zoom * 100)}%</span>
        </div>

        <button onClick={zoomIn} disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]} title="Zoom in"
          className="flex items-center justify-center w-6 h-6 rounded text-[#777] hover:text-[#ccc] hover:bg-[#222] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ZoomIn className="w-3 h-3" />
        </button>

        <div className="w-px h-4 bg-[#2e2e2e]" />

        {[{ label: "Fit", val: 0.5 }, { label: "1:1", val: 1 }, { label: "25%", val: 0.25 }].map(({ label, val }) => (
          <button key={val} onClick={() => setZoom(val)} title={label}
            className={`flex items-center gap-1 h-6 px-2 rounded text-xs transition-all
              ${zoom === val ? "text-[#6ee7b7] bg-[#6ee7b7]/10" : "text-[#666] hover:text-[#bbb] hover:bg-[#222]"}`}>
            {label === "Fit" && <Maximize2 className="w-3 h-3" />}
            {label}
          </button>
        ))}

        <span className="ml-auto text-[10px] text-[#444] font-mono hidden lg:block">Ctrl+Scroll to zoom</span>
      </div>

      {/* ── Canvas scroll area ────────────────────────────────────────────────
           overflow: auto on both axes so wide screenshots (1920px) scroll correctly.
           The canvas CSS size = naturalWidth * zoom, so layout is correct. ──── */}
      <div
        onWheel={handleWheel}
        className="flex-1 overflow-auto bg-[#0e0e0e]"
        style={{
          backgroundImage: "radial-gradient(circle, #252525 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        {/* Padding wrapper — adds breathing room around canvas */}
        <div className="inline-flex p-8 min-w-full min-h-full items-start justify-center">
          <div className="shadow-2xl shadow-black/80 rounded-lg overflow-hidden border border-[#282828] inline-block">
            <SSAnnotationCanvas
              ref={canvasRef}
              imageUrl={currentImage}
              tool={annotation.tool}
              color={annotation.color}
              strokeSize={annotation.strokeSize}
              operations={annotation.operations}
              cropRect={annotation.cropRect}
              onAddOperation={annotation.addOperation}
              onUpdateOperation={annotation.updateOperation}
              onCropRectChange={annotation.setCropRect}
              zoom={zoom}
            />
          </div>
        </div>
      </div>

      {/* Hints */}
      {annotation.tool === "crop" && !annotation.cropRect && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-[#6ee7b7] text-xs px-3 py-1.5 rounded-full border border-[#6ee7b7]/20 pointer-events-none z-50">
          Drag to select crop area
        </div>
      )}
      {annotation.tool === "crop" && annotation.cropRect && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-[#6ee7b7] text-xs px-3 py-1.5 rounded-full border border-[#6ee7b7]/20 pointer-events-none z-50">
          Click &quot;Apply Crop&quot; below to confirm
        </div>
      )}

      {/* ── Export bar ────────────────────────────────────────────────────────── */}
      <SSExportShare
        canvasRef={canvasRef} cropRect={annotation.cropRect}
        websiteUrl={url} deviceLabel={deviceLabel} onCropApply={handleCropApply}
      />
    </div>
  );
}

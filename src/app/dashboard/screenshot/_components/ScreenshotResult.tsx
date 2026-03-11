"use client";

import { Download, RotateCcw, CheckCircle } from "lucide-react";

interface ScreenshotResultProps {
  screenshotUrl: string;
  onDownload: () => void;
  onReset: () => void;
  deviceLabel: string;
  url: string;
}

export default function ScreenshotResult({
  screenshotUrl,
  onDownload,
  onReset,
  deviceLabel,
  url,
}: ScreenshotResultProps) {
  let hostname = url;
  try {
    hostname = new URL(url).hostname.replace("www.", "");
  } catch {}

  return (
    <div className="flex flex-col items-center gap-5 py-6 h-full overflow-auto">
      {/* Success header */}
      <div className="flex items-center gap-2 text-[#6ee7b7]">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Screenshot captured</span>
      </div>

      {/* Screenshot preview */}
      <div className="relative rounded-xl overflow-hidden border border-[#2a2a2a] shadow-2xl shadow-black/60 max-w-full">
        <img
          src={screenshotUrl}
          alt={`Screenshot of ${hostname}`}
          className="block max-w-full max-h-[55vh] object-contain"
        />
        {/* Overlay badge */}
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1.5">
          <span className="text-[10px] text-[#6ee7b7] font-mono">{deviceLabel}</span>
          <span className="text-[10px] text-[#555]">—</span>
          <span className="text-[10px] text-[#aaa] font-mono truncate max-w-[120px]">{hostname}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onDownload}
          className="flex items-center gap-2 h-10 px-5 rounded-xl bg-[#6ee7b7] text-[#0a0a0a] text-sm font-semibold hover:bg-[#5dd4a4] active:scale-95 transition-all"
        >
          <Download className="w-4 h-4" />
          Download PNG
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[#1a1a1a] text-[#888] border border-[#2a2a2a] text-sm hover:text-[#ccc] hover:border-[#444] active:scale-95 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          New
        </button>
      </div>
    </div>
  );
}

"use client";

import { AlertTriangle, Globe } from "lucide-react";
import { DeviceConfig } from "@/hooks/useScreenshot";

interface PreviewFrameProps {
  url: string;
  deviceConfig: DeviceConfig;
  isLoading: boolean;
  previewLoaded: boolean;
  hasError: boolean;
  onLoad: () => void;
  onError: () => void;
}

export default function PreviewFrame({
  url,
  deviceConfig,
  isLoading,
  previewLoaded,
  hasError,
  onLoad,
  onError,
}: PreviewFrameProps) {
  const scale = deviceConfig.scale ?? 0.5;
  const frameW = deviceConfig.width;
  const frameH = deviceConfig.height;

  // Container dimensions after scale
  const displayW = frameW * scale;
  const displayH = frameH * scale;

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-[#333]">
        <Globe className="w-12 h-12" />
        <div className="text-center">
          <p className="text-sm font-medium text-[#555]">Enter a URL to preview</p>
          <p className="text-xs text-[#333] mt-1">Supports any public website</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start h-full overflow-auto py-6 gap-4">
      {/* Device label */}
      <div className="flex items-center gap-2 text-xs text-[#555] font-mono shrink-0">
        <span className="text-[#6ee7b7]">{deviceConfig.label}</span>
        <span>—</span>
        <span>
          {frameW} × {frameH}
        </span>
        <span>—</span>
        <span>scale {Math.round(scale * 100)}%</span>
      </div>

      {/* Browser chrome wrapper */}
      <div
        className="shrink-0 rounded-xl overflow-hidden border border-[#2a2a2a] shadow-2xl shadow-black/60"
        style={{ width: displayW, height: displayH + 36 }}
      >
        {/* Browser chrome bar */}
        <div className="h-9 bg-[#1a1a1a] border-b border-[#2a2a2a] flex items-center px-3 gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 mx-2 h-5 bg-[#111] rounded-md flex items-center px-2 gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#333]" />
            <span className="text-[10px] text-[#555] font-mono truncate">{url}</span>
          </div>
        </div>

        {/* Iframe container */}
        <div
          className="relative bg-white overflow-hidden"
          style={{ width: displayW, height: displayH }}
        >
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-[#0a0a0a] flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-[#2a2a2a] border-t-[#6ee7b7] rounded-full animate-spin" />
                <span className="text-xs text-[#555] font-mono">Loading preview...</span>
              </div>
            </div>
          )}

          {/* CORS blocked warning */}
          {hasError && !isLoading && (
            <div className="absolute inset-0 bg-[#0f0f0f] flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-3 text-center px-6">
                <AlertTriangle className="w-8 h-8 text-[#f59e0b]" />
                <div>
                  <p className="text-sm text-[#aaa] font-medium">Preview blocked by site</p>
                  <p className="text-xs text-[#555] mt-1">
                    This site restricts iframe embedding.
                    <br />
                    Screenshot capture will still work.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* The actual iframe — scaled down */}
          <iframe
            key={`${url}-${deviceConfig.width}`}
            src={url}
            title="Website Preview"
            onLoad={onLoad}
            onError={onError}
            sandbox="allow-scripts allow-same-origin allow-forms"
            style={{
              width: frameW,
              height: frameH,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              border: "none",
              display: "block",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import { Camera, AlertTriangle } from "lucide-react";
import { useScreenshot } from "@/hooks/useScreenshot";
import UrlInput from "./_components/UrlInput";
import SizeSelector from "./_components/SizeSelector";
import PreviewFrame from "./_components/PreviewFrame";
import ScreenshotResult from "./_components/ScreenshotResult";

export default function ScreenshotPage() {
  const {
    state,
    setUrl,
    setSelectedSize,
    loadPreview,
    captureScreenshot,
    downloadScreenshot,
    reset,
    onPreviewLoad,
    onPreviewError,
    deviceConfig,
  } = useScreenshot();

  const { url, selectedSize, isLoading, isCapturing, error, screenshotUrl, previewLoaded } = state;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0]">
      {/* Top bar */}
      <div className="border-b border-[#1a1a1a] px-6 h-14 flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#6ee7b7]/10 flex items-center justify-center">
            <Camera className="w-3.5 h-3.5 text-[#6ee7b7]" />
          </div>
          <h1 className="text-sm font-semibold text-[#e0e0e0]">Screenshot</h1>
        </div>
        <div className="w-px h-4 bg-[#2a2a2a]" />
        <span className="text-xs text-[#555]">Capture any website at any viewport</span>
      </div>

      <div className="flex flex-col h-[calc(100vh-56px)]">
        {/* Controls strip */}
        <div className="border-b border-[#1a1a1a] px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* URL Input */}
          <div className="flex-1 w-full">
            <UrlInput
              value={url}
              onChange={setUrl}
              onLoad={loadPreview}
              isLoading={isLoading}
            />
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-8 bg-[#2a2a2a]" />

          {/* Size Selector */}
          <SizeSelector selected={selectedSize} onChange={setSelectedSize} />
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-6 py-2 bg-[#f59e0b]/5 border-b border-[#f59e0b]/20 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-[#f59e0b] shrink-0" />
            <span className="text-xs text-[#f59e0b]">{error}</span>
          </div>
        )}

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Preview panel */}
          <div className="flex-1 overflow-hidden bg-[#080808] relative">
            {/* Grid background */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "linear-gradient(#6ee7b7 1px, transparent 1px), linear-gradient(90deg, #6ee7b7 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />

            <div className="relative h-full">
              {screenshotUrl ? (
                <ScreenshotResult
                  screenshotUrl={screenshotUrl}
                  onDownload={downloadScreenshot}
                  onReset={reset}
                  deviceLabel={deviceConfig.label}
                  url={url}
                />
              ) : (
                <PreviewFrame
                  url={isLoading || previewLoaded ? url : ""}
                  deviceConfig={deviceConfig}
                  isLoading={isLoading}
                  previewLoaded={previewLoaded}
                  hasError={!!error && !isLoading}
                  onLoad={onPreviewLoad}
                  onError={onPreviewError}
                />
              )}
            </div>
          </div>

          {/* Right action panel */}
          {url && !screenshotUrl && (
            <div className="w-64 border-l border-[#1a1a1a] flex flex-col p-5 gap-4">
              <div>
                <h3 className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-3">
                  Capture Settings
                </h3>

                {/* Device summary */}
                <div className="bg-[#0f0f0f] rounded-lg border border-[#1e1e1e] p-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#555]">Device</span>
                    <span className="text-[#aaa] font-medium">{deviceConfig.label}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#555]">Width</span>
                    <span className="text-[#aaa] font-mono">{deviceConfig.width}px</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#555]">Height</span>
                    <span className="text-[#aaa] font-mono">{deviceConfig.height}px</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#555]">Format</span>
                    <span className="text-[#6ee7b7] font-mono">PNG</span>
                  </div>
                </div>
              </div>

              {/* URL info */}
              <div>
                <span className="text-xs text-[#555] block mb-1.5">Target URL</span>
                <div className="bg-[#0f0f0f] rounded-lg border border-[#1e1e1e] p-2.5">
                  <p className="text-xs text-[#888] font-mono break-all line-clamp-3">{url}</p>
                </div>
              </div>

              <div className="mt-auto">
                {/* Capture button */}
                <button
                  onClick={captureScreenshot}
                  disabled={isCapturing || isLoading}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-[#6ee7b7] text-[#0a0a0a] text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#5dd4a4] active:scale-95 transition-all duration-150"
                >
                  {isCapturing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a] rounded-full animate-spin" />
                      Capturing...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      Capture Screenshot
                    </>
                  )}
                </button>

                <p className="text-[10px] text-[#444] text-center mt-2">
                  Uses Puppeteer headless browser
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

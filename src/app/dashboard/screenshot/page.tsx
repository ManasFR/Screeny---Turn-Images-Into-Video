"use client";

import { Camera, AlertTriangle } from "lucide-react";
import { useSSScreenshot } from "@/hooks/useSSScreenshot";
import SSUrlInput from "./_components/SSUrlInput";
import SSSizeSelector from "./_components/SSSizeSelector";
import SSPreviewFrame from "./_components/SSPreviewFrame";
import SSScreenshotResult from "./_components/SSScreenshotResult";

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
  } = useSSScreenshot();

  const { url, selectedSize, isLoading, isCapturing, error, screenshotUrl, previewLoaded } = state;

  return (
    <div className="min-h-screen bg-[#111] text-[#eee]">
      {/* Top bar */}
      <div className="border-b border-[#252525] px-6 h-14 flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#6ee7b7]/10 flex items-center justify-center">
            <Camera className="w-3.5 h-3.5 text-[#6ee7b7]" />
          </div>
          <h1 className="text-sm font-semibold text-[#eee]">Screenshot</h1>
        </div>
        <div className="w-px h-4 bg-[#2a2a2a]" />
        <span className="text-xs text-[#777]">Capture any website at any viewport</span>
      </div>

      <div className="flex flex-col h-[calc(100vh-56px)]">
        {/* Controls strip */}
        <div className="border-b border-[#252525] px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1 w-full">
            <SSUrlInput value={url} onChange={setUrl} onLoad={loadPreview} isLoading={isLoading} />
          </div>
          <div className="hidden sm:block w-px h-8 bg-[#2a2a2a]" />
          <SSSizeSelector selected={selectedSize} onChange={setSelectedSize} />
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-6 py-2 bg-[#f59e0b]/5 border-b border-[#f59e0b]/20 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-[#f59e0b] shrink-0" />
            <span className="text-xs text-[#f59e0b]">{error}</span>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-hidden bg-[#0e0e0e] relative">
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: "linear-gradient(#6ee7b7 1px, transparent 1px), linear-gradient(90deg, #6ee7b7 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            <div className="relative h-full">
              {screenshotUrl ? (
                <SSScreenshotResult
                  screenshotUrl={screenshotUrl}
                  onReset={reset}
                  deviceLabel={deviceConfig.label}
                  url={url}
                />
              ) : (
                <SSPreviewFrame
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

          {/* Right panel */}
          {url && !screenshotUrl && (
            <div className="w-64 border-l border-[#252525] flex flex-col p-5 gap-4">
              <div>
                <h3 className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-3">Capture Settings</h3>
                <div className="bg-[#161616] rounded-lg border border-[#282828] p-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#777]">Device</span>
                    <span className="text-[#aaa] font-medium">{deviceConfig.label}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#777]">Width</span>
                    <span className="text-[#aaa] font-mono">{deviceConfig.width}px</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#777]">Height</span>
                    <span className="text-[#aaa] font-mono">{deviceConfig.height}px</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#777]">Format</span>
                    <span className="text-[#6ee7b7] font-mono">PNG</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs text-[#777] block mb-1.5">Target URL</span>
                <div className="bg-[#161616] rounded-lg border border-[#282828] p-2.5">
                  <p className="text-xs text-[#888] font-mono break-all line-clamp-3">{url}</p>
                </div>
              </div>

              <div className="mt-auto">
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
                <p className="text-[10px] text-[#555] text-center mt-2">Uses Puppeteer headless browser</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

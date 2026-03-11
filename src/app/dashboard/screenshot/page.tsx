"use client";

import { Camera, AlertTriangle } from "lucide-react";
import { useSSScreenshot } from "@/hooks/useSSScreenshot";
import SSUrlInput from "./_components/SSUrlInput";
import SSSizeSelector from "./_components/SSSizeSelector";
import SSPreviewFrame from "./_components/SSPreviewFrame";
import SSScreenshotResult from "./_components/SSScreenshotResult";
import SSCapturePanel from "./_components/SSCapturePanel";
import SSProgressBar from "./_components/SSProgressBar";

export default function ScreenshotPage() {
  const {
    state, setUrl, setSelectedSize, loadPreview,
    captureScreenshot, reset, setCaptureOptions,
    onPreviewLoad, onPreviewError, deviceConfig,
  } = useSSScreenshot();

  const { url, selectedSize, isLoading, isCapturing, error, screenshotUrl, previewLoaded, captureOptions, progress } = state;

  return (
    <div className="min-h-screen bg-[#111] text-[#eee]">

      {/* Top bar */}
      <div className="border-b border-[#252525] px-6 h-14 flex items-center gap-3 bg-[#141414]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#6ee7b7]/10 flex items-center justify-center">
            <Camera className="w-3.5 h-3.5 text-[#6ee7b7]"/>
          </div>
          <h1 className="text-sm font-semibold text-[#eee]">Screenshot</h1>
        </div>
        <div className="w-px h-4 bg-[#2a2a2a]"/>
        <span className="text-xs text-[#666]">Capture any website at any viewport</span>
      </div>

      <div className="flex flex-col h-[calc(100vh-56px)]">

        {/* Controls strip */}
        <div className="border-b border-[#252525] px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-[#141414]">
          <div className="flex-1 w-full">
            <SSUrlInput value={url} onChange={setUrl} onLoad={loadPreview} isLoading={isLoading}/>
          </div>
          <div className="hidden sm:block w-px h-8 bg-[#2a2a2a]"/>
          <SSSizeSelector selected={selectedSize} onChange={setSelectedSize}/>
        </div>

        {/* Progress bar */}
        {isCapturing && progress && (
          <SSProgressBar step={progress.step} pct={progress.pct} message={progress.message}/>
        )}

        {/* Error banner */}
        {error && (
          <div className="px-6 py-2 bg-[#f59e0b]/5 border-b border-[#f59e0b]/20 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-[#f59e0b] shrink-0"/>
            <span className="text-xs text-[#f59e0b]">{error}</span>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">

          {/* Preview / Result panel */}
          <div className="flex-1 overflow-hidden relative">
            {screenshotUrl ? (
              <SSScreenshotResult
                screenshotUrl={screenshotUrl} onReset={reset}
                deviceLabel={deviceConfig.label} url={url}
              />
            ) : (
              <div className="h-full" style={{ background:"#0e0e0e", backgroundImage:"radial-gradient(circle,#1e1e1e 1px,transparent 1px)", backgroundSize:"28px 28px" }}>
                <SSPreviewFrame
                  url={isLoading || previewLoaded ? url : ""}
                  deviceConfig={deviceConfig} isLoading={isLoading}
                  previewLoaded={previewLoaded} hasError={!!error && !isLoading}
                  onLoad={onPreviewLoad} onError={onPreviewError}
                />
              </div>
            )}
          </div>

          {/* Capture panel — only show when not showing result */}
          {url && !screenshotUrl && (
            <SSCapturePanel
              deviceConfig={deviceConfig} captureOptions={captureOptions}
              url={url} isCapturing={isCapturing} isLoading={isLoading}
              onOptionsChange={setCaptureOptions} onCapture={captureScreenshot}
            />
          )}
        </div>
      </div>
    </div>
  );
}

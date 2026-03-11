"use client";

import { useState } from "react";
import { Camera, Clock, Cookie, MousePointer, ChevronDown, ChevronUp, Info } from "lucide-react";
import { DeviceConfig, SSCaptureOptions } from "@/hooks/useSSScreenshot";

interface Props {
  deviceConfig: DeviceConfig;
  captureOptions: SSCaptureOptions;
  url: string;
  isCapturing: boolean;
  isLoading: boolean;
  onOptionsChange: (opts: Partial<SSCaptureOptions>) => void;
  onCapture: () => void;
}

export default function SSCapturePanel({
  deviceConfig, captureOptions, url, isCapturing, isLoading,
  onOptionsChange, onCapture,
}: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="w-72 border-l border-[#252525] flex flex-col bg-[#141414]">

      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-xs font-semibold text-[#888] uppercase tracking-wider">Capture Settings</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">

        {/* Device info */}
        <div className="bg-[#1a1a1a] rounded-xl border border-[#282828] p-3 space-y-2">
          {[
            ["Device",  deviceConfig.label],
            ["Width",   `${deviceConfig.width}px`],
            ["Height",  `${deviceConfig.height}px`],
            ["Format",  "PNG"],
          ].map(([k,v]) => (
            <div key={k} className="flex justify-between text-xs">
              <span className="text-[#666]">{k}</span>
              <span className={k==="Format" ? "text-[#6ee7b7] font-mono" : "text-[#bbb] font-medium"}>{v}</span>
            </div>
          ))}
        </div>

        {/* ── Auto-hide Cookie Banners ── */}
        <div className="space-y-1.5">
          <button
            onClick={() => onOptionsChange({ hideCookies: !captureOptions.hideCookies })}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-[#1a1a1a] border border-[#282828] hover:border-[#3a3a3a] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Cookie className="w-3.5 h-3.5 text-[#f59e0b]"/>
              <div className="text-left">
                <p className="text-xs font-medium text-[#ccc]">Auto-hide Cookies</p>
                <p className="text-[10px] text-[#666]">Remove popups before capture</p>
              </div>
            </div>
            <div className={`w-8 h-4.5 rounded-full transition-colors flex items-center px-0.5 ${captureOptions.hideCookies ? "bg-[#6ee7b7]" : "bg-[#333]"}`}
              style={{height:"18px"}}>
              <div className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${captureOptions.hideCookies ? "translate-x-3.5" : "translate-x-0"}`}/>
            </div>
          </button>
        </div>

        {/* ── Delay ── */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#6ee7b7]"/>
            <span className="text-xs font-medium text-[#ccc]">Capture Delay</span>
            <span className="ml-auto text-xs text-[#6ee7b7] font-mono font-bold">{captureOptions.delay}s</span>
          </div>
          <input
            type="range" min={0} max={10} step={1}
            value={captureOptions.delay}
            onChange={e => onOptionsChange({ delay: Number(e.target.value) })}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#6ee7b7]"
            style={{ background: `linear-gradient(to right,#6ee7b7 ${captureOptions.delay*10}%,#2e2e2e ${captureOptions.delay*10}%)` }}
          />
          <div className="flex justify-between text-[10px] text-[#555] font-mono">
            <span>0s</span><span>5s</span><span>10s</span>
          </div>
          {captureOptions.delay > 0 && (
            <p className="text-[10px] text-[#777]">
              Page will load, then wait {captureOptions.delay}s before capturing (good for animations)
            </p>
          )}
        </div>

        {/* ── Advanced toggle ── */}
        <button
          onClick={() => setShowAdvanced(v => !v)}
          className="flex items-center gap-1.5 text-xs text-[#666] hover:text-[#aaa] transition-colors w-full"
        >
          {showAdvanced ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
          Advanced options
        </button>

        {showAdvanced && (
          <div className="space-y-3">
            {/* ── Element Selector ── */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MousePointer className="w-3.5 h-3.5 text-[#a78bfa]"/>
                <span className="text-xs font-medium text-[#ccc]">Element Selector</span>
              </div>
              <p className="text-[10px] text-[#666]">
                CSS selector to capture only one element. Leave empty for full page.
              </p>
              <div className="relative">
                <input
                  type="text"
                  value={captureOptions.elementSelector}
                  onChange={e => onOptionsChange({ elementSelector: e.target.value })}
                  placeholder="#hero, .navbar, main"
                  className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 h-8 text-xs text-[#ccc] font-mono placeholder-[#444] outline-none focus:border-[#6ee7b7] transition-colors"
                />
              </div>
              {captureOptions.elementSelector && (
                <div className="flex items-start gap-1.5 bg-[#a78bfa]/5 border border-[#a78bfa]/20 rounded-lg p-2">
                  <Info className="w-3 h-3 text-[#a78bfa] shrink-0 mt-0.5"/>
                  <p className="text-[10px] text-[#a78bfa]">
                    Only the matched element will be screenshotted. It must exist on the page.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Target URL */}
        <div>
          <span className="text-xs text-[#666] block mb-1.5">Target URL</span>
          <div className="bg-[#111] rounded-lg border border-[#282828] p-2.5">
            <p className="text-xs text-[#888] font-mono break-all line-clamp-3">{url}</p>
          </div>
        </div>
      </div>

      {/* Capture button */}
      <div className="p-4 border-t border-[#222]">
        <button
          onClick={onCapture}
          disabled={isCapturing || isLoading}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-[#6ee7b7] text-[#0a0a0a] text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#5dd4a4] active:scale-95 transition-all duration-150"
        >
          {isCapturing ? (
            <><span className="w-4 h-4 border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a] rounded-full animate-spin"/>Capturing...</>
          ) : (
            <><Camera className="w-4 h-4"/>Capture Screenshot</>
          )}
        </button>
        {captureOptions.delay > 0 && !isCapturing && (
          <p className="text-[10px] text-[#555] text-center mt-1.5">+{captureOptions.delay}s delay after page load</p>
        )}
      </div>
    </div>
  );
}

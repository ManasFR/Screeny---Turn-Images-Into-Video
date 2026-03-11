import { useState, useCallback, useRef } from "react";

export type DeviceSize = "mobile" | "tablet" | "laptop" | "desktop";

export interface DeviceConfig {
  label: string; width: number; height: number; icon: string; scale?: number;
}

export const SS_DEVICE_SIZES: Record<DeviceSize, DeviceConfig> = {
  mobile:  { label: "Mobile",  width: 390,  height: 844,  icon: "smartphone", scale: 0.6  },
  tablet:  { label: "Tablet",  width: 768,  height: 1024, icon: "tablet",     scale: 0.55 },
  laptop:  { label: "Laptop",  width: 1280, height: 800,  icon: "laptop",     scale: 0.5  },
  desktop: { label: "Desktop", width: 1920, height: 1080, icon: "monitor",    scale: 0.4  },
};

// Capture options
export interface SSCaptureOptions {
  delay: number;           // 0–10 sec delay before capture
  hideCookies: boolean;    // auto-hide cookie banners
  elementSelector: string; // CSS selector for element screenshot (empty = full page)
}

export interface CaptureProgress {
  step: string;
  pct: number;
  message: string;
}

export interface SSScreenshotState {
  url: string;
  selectedSize: DeviceSize;
  isLoading: boolean;
  isCapturing: boolean;
  error: string | null;
  screenshotUrl: string | null;
  previewLoaded: boolean;
  captureOptions: SSCaptureOptions;
  progress: CaptureProgress | null;
}

const DEFAULT_CAPTURE_OPTIONS: SSCaptureOptions = {
  delay: 0,
  hideCookies: true,
  elementSelector: "",
};

export function useSSScreenshot() {
  const [state, setState] = useState<SSScreenshotState>({
    url: "", selectedSize: "laptop",
    isLoading: false, isCapturing: false,
    error: null, screenshotUrl: null, previewLoaded: false,
    captureOptions: DEFAULT_CAPTURE_OPTIONS,
    progress: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const setUrl = useCallback((url: string) => {
    setState((p) => ({ ...p, url, error: null, screenshotUrl: null, previewLoaded: false }));
  }, []);

  const setSelectedSize = useCallback((size: DeviceSize) => {
    setState((p) => ({ ...p, selectedSize: size, previewLoaded: false }));
  }, []);

  const setPreviewLoaded = useCallback((loaded: boolean) => {
    setState((p) => ({ ...p, previewLoaded: loaded }));
  }, []);

  const setCaptureOptions = useCallback((opts: Partial<SSCaptureOptions>) => {
    setState((p) => ({ ...p, captureOptions: { ...p.captureOptions, ...opts } }));
  }, []);

  const normalizeUrl = (raw: string) => {
    const t = raw.trim();
    if (!t) return "";
    return /^https?:\/\//i.test(t) ? t : `https://${t}`;
  };

  const loadPreview = useCallback(() => {
    const url = normalizeUrl(state.url);
    if (!url) { setState((p) => ({ ...p, error: "Please enter a valid URL" })); return; }
    setState((p) => ({ ...p, url, isLoading: true, error: null, screenshotUrl: null, previewLoaded: false }));
  }, [state.url]);

  const captureScreenshot = useCallback(async () => {
    const url = normalizeUrl(state.url);
    if (!url) { setState((p) => ({ ...p, error: "Please enter a valid URL" })); return; }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState((p) => ({ ...p, isCapturing: true, error: null, progress: { step: "init", pct: 0, message: "Starting capture..." } }));

    try {
      const device = SS_DEVICE_SIZES[state.selectedSize];
      const response = await fetch("/api/screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          url, width: device.width, height: device.height,
          deviceSize: state.selectedSize,
          delay: state.captureOptions.delay,
          hideCookies: state.captureOptions.hideCookies,
          elementSelector: state.captureOptions.elementSelector || null,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Request failed: ${response.status}`);
      }

      if (!response.body) throw new Error("No response body");

      // Read streaming NDJSON progress
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const msg = JSON.parse(trimmed);
            if (msg.type === "progress") {
              setState((p) => ({ ...p, progress: { step: msg.step, pct: msg.pct, message: msg.message } }));
            } else if (msg.type === "done") {
              // Convert base64 to blob URL
              const base64 = msg.image.replace("data:image/png;base64,", "");
              const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
              const blob = new Blob([bytes], { type: "image/png" });
              const objectUrl = URL.createObjectURL(blob);
              setState((p) => ({ ...p, screenshotUrl: objectUrl, isCapturing: false, progress: null }));
            } else if (msg.type === "error") {
              throw new Error(msg.error);
            }
          } catch (parseErr) {
            // ignore malformed lines
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") return;
      setState((p) => ({
        ...p,
        error: err instanceof Error ? err.message : "Screenshot failed",
        isCapturing: false, progress: null,
      }));
    }
  }, [state.url, state.selectedSize, state.captureOptions]);

  const downloadScreenshot = useCallback(() => {
    if (!state.screenshotUrl) return;
    const a = document.createElement("a");
    a.href = state.screenshotUrl;
    const domain = new URL(state.url).hostname.replace("www.", "");
    a.download = `screenshot-${domain}-${state.selectedSize}-${Date.now()}.png`;
    a.click();
  }, [state.screenshotUrl, state.url, state.selectedSize]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    if (state.screenshotUrl) URL.revokeObjectURL(state.screenshotUrl);
    setState({
      url: "", selectedSize: "laptop",
      isLoading: false, isCapturing: false,
      error: null, screenshotUrl: null, previewLoaded: false,
      captureOptions: DEFAULT_CAPTURE_OPTIONS, progress: null,
    });
  }, [state.screenshotUrl]);

  const onPreviewLoad  = useCallback(() => setState((p) => ({ ...p, isLoading: false, previewLoaded: true })), []);
  const onPreviewError = useCallback(() => setState((p) => ({
    ...p, isLoading: false, previewLoaded: false,
    error: "Preview blocked by site (X-Frame-Options). Screenshot will still work.",
  })), []);

  return {
    state, setUrl, setSelectedSize, setPreviewLoaded, setCaptureOptions,
    loadPreview, captureScreenshot, downloadScreenshot, reset,
    onPreviewLoad, onPreviewError,
    deviceConfig: SS_DEVICE_SIZES[state.selectedSize],
  };
}

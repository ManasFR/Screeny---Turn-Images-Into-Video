import { useState, useCallback } from "react";

export type DeviceSize = "mobile" | "tablet" | "laptop" | "desktop";

export interface DeviceConfig {
  label: string;
  width: number;
  height: number;
  icon: string;
  scale?: number;
}

export const DEVICE_SIZES: Record<DeviceSize, DeviceConfig> = {
  mobile: {
    label: "Mobile",
    width: 390,
    height: 844,
    icon: "smartphone",
    scale: 0.6,
  },
  tablet: {
    label: "Tablet",
    width: 768,
    height: 1024,
    icon: "tablet",
    scale: 0.55,
  },
  laptop: {
    label: "Laptop",
    width: 1280,
    height: 800,
    icon: "laptop",
    scale: 0.5,
  },
  desktop: {
    label: "Desktop",
    width: 1920,
    height: 1080,
    icon: "monitor",
    scale: 0.4,
  },
};

export interface ScreenshotState {
  url: string;
  selectedSize: DeviceSize;
  isLoading: boolean;
  isCapturing: boolean;
  error: string | null;
  screenshotUrl: string | null;
  previewLoaded: boolean;
}

export function useScreenshot() {
  const [state, setState] = useState<ScreenshotState>({
    url: "",
    selectedSize: "laptop",
    isLoading: false,
    isCapturing: false,
    error: null,
    screenshotUrl: null,
    previewLoaded: false,
  });

  const setUrl = useCallback((url: string) => {
    setState((prev) => ({ ...prev, url, error: null, screenshotUrl: null, previewLoaded: false }));
  }, []);

  const setSelectedSize = useCallback((size: DeviceSize) => {
    setState((prev) => ({ ...prev, selectedSize: size, previewLoaded: false }));
  }, []);

  const setPreviewLoaded = useCallback((loaded: boolean) => {
    setState((prev) => ({ ...prev, previewLoaded: loaded }));
  }, []);

  const normalizeUrl = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return "";
    if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
    return trimmed;
  };

  const loadPreview = useCallback(() => {
    const normalized = normalizeUrl(state.url);
    if (!normalized) {
      setState((prev) => ({ ...prev, error: "Please enter a valid URL" }));
      return;
    }
    setState((prev) => ({
      ...prev,
      url: normalized,
      isLoading: true,
      error: null,
      screenshotUrl: null,
      previewLoaded: false,
    }));
  }, [state.url]);

  const captureScreenshot = useCallback(async () => {
    const normalized = normalizeUrl(state.url);
    if (!normalized) {
      setState((prev) => ({ ...prev, error: "Please enter a valid URL" }));
      return;
    }

    setState((prev) => ({ ...prev, isCapturing: true, error: null }));

    try {
      const device = DEVICE_SIZES[state.selectedSize];
      const response = await fetch("/api/screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: normalized,
          width: device.width,
          height: device.height,
          deviceSize: state.selectedSize,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed: ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setState((prev) => ({ ...prev, screenshotUrl: objectUrl, isCapturing: false }));
    } catch (err: unknown) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Screenshot failed",
        isCapturing: false,
      }));
    }
  }, [state.url, state.selectedSize]);

  const downloadScreenshot = useCallback(() => {
    if (!state.screenshotUrl) return;
    const a = document.createElement("a");
    a.href = state.screenshotUrl;
    const domain = new URL(state.url).hostname.replace("www.", "");
    a.download = `screenshot-${domain}-${state.selectedSize}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [state.screenshotUrl, state.url, state.selectedSize]);

  const reset = useCallback(() => {
    if (state.screenshotUrl) URL.revokeObjectURL(state.screenshotUrl);
    setState({
      url: "",
      selectedSize: "laptop",
      isLoading: false,
      isCapturing: false,
      error: null,
      screenshotUrl: null,
      previewLoaded: false,
    });
  }, [state.screenshotUrl]);

  const onPreviewLoad = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: false, previewLoaded: true }));
  }, []);

  const onPreviewError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isLoading: false,
      previewLoaded: false,
      error: "Preview blocked by site (X-Frame-Options). Screenshot will still work.",
    }));
  }, []);

  return {
    state,
    setUrl,
    setSelectedSize,
    setPreviewLoaded,
    loadPreview,
    captureScreenshot,
    downloadScreenshot,
    reset,
    onPreviewLoad,
    onPreviewError,
    deviceConfig: DEVICE_SIZES[state.selectedSize],
  };
}

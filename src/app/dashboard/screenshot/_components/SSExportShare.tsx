"use client";

import { useState, RefObject } from "react";
import { Copy, Download, Link2, FileText, Scissors, Check, Loader2, ExternalLink } from "lucide-react";
import { SSCropRect } from "@/hooks/useSSAnnotation";
import { SSAnnotationCanvasRef } from "./SSAnnotationCanvas";

interface SSExportShareProps {
  canvasRef: RefObject<SSAnnotationCanvasRef>;
  cropRect: SSCropRect | null;
  websiteUrl: string;
  deviceLabel: string;
  onCropApply: (newDataUrl: string) => void;
}

type Status = "idle" | "loading" | "success" | "error";

interface ButtonState {
  clipboard: Status;
  share: Status;
  pdf: Status;
  crop: Status;
}

export default function SSExportShare({ canvasRef, cropRect, websiteUrl, deviceLabel, onCropApply }: SSExportShareProps) {
  const [status, setStatus] = useState<ButtonState>({ clipboard: "idle", share: "idle", pdf: "idle", crop: "idle" });
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const setS = (key: keyof ButtonState, val: Status) => setStatus((p) => ({ ...p, [key]: val }));

  const getFilename = (ext: string) => {
    let host = websiteUrl;
    try { host = new URL(websiteUrl).hostname.replace("www.", ""); } catch {}
    return `screenshot-${host}-${deviceLabel.toLowerCase()}-${Date.now()}.${ext}`;
  };

  const handleCopyClipboard = async () => {
    try {
      setS("clipboard", "loading");
      const dataUrl = canvasRef.current?.getDataUrl();
      if (!dataUrl) throw new Error("Canvas not ready");
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setS("clipboard", "success");
      setTimeout(() => setS("clipboard", "idle"), 2000);
    } catch { setS("clipboard", "error"); setTimeout(() => setS("clipboard", "idle"), 2000); }
  };

  const handleDownload = () => {
    const dataUrl = canvasRef.current?.getDataUrl();
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = getFilename("png");
    a.click();
  };

  const handleShare = async () => {
    try {
      setS("share", "loading");
      const dataUrl = canvasRef.current?.getDataUrl();
      if (!dataUrl) throw new Error("Canvas not ready");
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      if (!res.ok) throw new Error("Share failed");
      const { url } = await res.json();
      setShareUrl(url);
      setS("share", "success");
    } catch { setS("share", "error"); setTimeout(() => setS("share", "idle"), 2000); }
  };

  const handleCopyShareUrl = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPdf = async () => {
    try {
      setS("pdf", "loading");
      const dataUrl = canvasRef.current?.getDataUrl();
      if (!dataUrl) throw new Error("Canvas not ready");
      const img = new window.Image();
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = dataUrl; });
      const { default: jsPDF } = await import("jspdf");
      const isLandscape = img.naturalWidth > img.naturalHeight;
      const pdf = new jsPDF({ orientation: isLandscape ? "landscape" : "portrait", unit: "px", format: [img.naturalWidth, img.naturalHeight], hotfixes: ["px_scaling"] });
      pdf.addImage(dataUrl, "PNG", 0, 0, img.naturalWidth, img.naturalHeight);
      pdf.save(getFilename("pdf"));
      setS("pdf", "success");
      setTimeout(() => setS("pdf", "idle"), 2000);
    } catch { setS("pdf", "error"); setTimeout(() => setS("pdf", "idle"), 2000); }
  };

  const handleApplyCrop = () => {
    if (!cropRect || !canvasRef.current) return;
    try {
      setS("crop", "loading");
      const newDataUrl = canvasRef.current.applyCrop(cropRect);
      onCropApply(newDataUrl);
      setS("crop", "success");
      setTimeout(() => setS("crop", "idle"), 1500);
    } catch { setS("crop", "error"); setTimeout(() => setS("crop", "idle"), 2000); }
  };

  const btnIcon = (s: Status, idle: React.ReactNode) => {
    if (s === "loading") return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
    if (s === "success") return <Check className="w-3.5 h-3.5" />;
    if (s === "error") return <span className="text-xs">✕</span>;
    return idle;
  };

  const btnCls = (s: Status, base: string) =>
    `${base} ${s === "success" ? "!bg-[#6ee7b7]/20 !text-[#6ee7b7] !border-[#6ee7b7]/30" : ""} ${s === "error" ? "!bg-red-500/10 !text-red-400 !border-red-500/20" : ""}`;

  return (
    <div className="border-t border-[#282828] bg-[#0c0c0c] px-4 py-3 flex items-center gap-2 flex-wrap">

      {cropRect && (
        <>
          <button onClick={handleApplyCrop} disabled={status.crop === "loading"}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#6ee7b7]/15 text-[#6ee7b7] border border-[#6ee7b7]/30 text-xs font-semibold hover:bg-[#6ee7b7]/25 disabled:opacity-50 transition-all active:scale-95">
            {btnIcon(status.crop, <Scissors className="w-3.5 h-3.5" />)}
            Apply Crop
          </button>
          <div className="w-px h-5 bg-[#2a2a2a]" />
        </>
      )}

      <button onClick={handleCopyClipboard} disabled={status.clipboard === "loading"}
        className={btnCls(status.clipboard, "flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#161616] text-[#888] border border-[#2e2e2e] text-xs font-medium hover:text-[#ccc] hover:border-[#444] disabled:opacity-50 transition-all active:scale-95")}>
        {btnIcon(status.clipboard, <Copy className="w-3.5 h-3.5" />)}
        {status.clipboard === "success" ? "Copied!" : "Copy"}
      </button>

      <button onClick={handleDownload}
        className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#161616] text-[#888] border border-[#2e2e2e] text-xs font-medium hover:text-[#ccc] hover:border-[#444] transition-all active:scale-95">
        <Download className="w-3.5 h-3.5" />
        Download PNG
      </button>

      <button onClick={handleExportPdf} disabled={status.pdf === "loading"}
        className={btnCls(status.pdf, "flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#161616] text-[#888] border border-[#2e2e2e] text-xs font-medium hover:text-[#ccc] hover:border-[#444] disabled:opacity-50 transition-all active:scale-95")}>
        {btnIcon(status.pdf, <FileText className="w-3.5 h-3.5" />)}
        {status.pdf === "loading" ? "Generating..." : status.pdf === "success" ? "Saved!" : "Export PDF"}
      </button>

      {!shareUrl ? (
        <button onClick={handleShare} disabled={status.share === "loading"}
          className={btnCls(status.share, "flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#161616] text-[#888] border border-[#2e2e2e] text-xs font-medium hover:text-[#ccc] hover:border-[#444] disabled:opacity-50 transition-all active:scale-95")}>
          {btnIcon(status.share, <Link2 className="w-3.5 h-3.5" />)}
          {status.share === "loading" ? "Uploading..." : "Share Link"}
        </button>
      ) : (
        <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg bg-[#6ee7b7]/10 border border-[#6ee7b7]/25 max-w-xs">
          <span className="text-[10px] text-[#6ee7b7] font-mono truncate max-w-[180px]">{shareUrl}</span>
          <button onClick={handleCopyShareUrl} title="Copy link" className="shrink-0 text-[#6ee7b7]/70 hover:text-[#6ee7b7] transition-colors">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
          <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[#6ee7b7]/70 hover:text-[#6ee7b7] transition-colors">
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}

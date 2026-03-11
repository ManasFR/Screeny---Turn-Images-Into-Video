"use client";

import React, {
  useRef, useEffect, useState, forwardRef, useImperativeHandle,
  useCallback, MouseEvent,
} from "react";
import { SSAnnotationTool, SSDrawOperation, SSCropRect, SSPoint } from "@/hooks/useSSAnnotation";

interface SSAnnotationCanvasProps {
  imageUrl: string;
  tool: SSAnnotationTool;
  color: string;
  strokeSize: number;
  operations: SSDrawOperation[];
  cropRect: SSCropRect | null;
  onAddOperation: (op: SSDrawOperation) => void;
  onUpdateOperation: (id: string, updater: (op: SSDrawOperation) => SSDrawOperation) => void;
  onCropRectChange: (rect: SSCropRect | null) => void;
  zoom?: number;
}

export interface SSAnnotationCanvasRef {
  getDataUrl: () => string;
  applyCrop: (rect: SSCropRect) => string;
}

// ─── Render helpers ───────────────────────────────────────────────────────────

function renderOperation(ctx: CanvasRenderingContext2D, op: SSDrawOperation, selected = false) {
  ctx.save();

  // Selection highlight
  if (selected) {
    ctx.shadowColor = "#6ee7b7";
    ctx.shadowBlur = 12;
  }

  switch (op.type) {
    case "pencil": {
      if (!op.points || op.points.length < 2) break;
      ctx.beginPath();
      ctx.strokeStyle = op.color; ctx.lineWidth = op.size;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.moveTo(op.points[0].x, op.points[0].y);
      for (let i = 1; i < op.points.length; i++) ctx.lineTo(op.points[i].x, op.points[i].y);
      ctx.stroke(); break;
    }
    case "arrow": {
      const { from, to } = op;
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      const headLen = 14 + op.size * 2.5;
      ctx.strokeStyle = op.color; ctx.fillStyle = op.color;
      ctx.lineWidth = op.size; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x - headLen * 0.6 * Math.cos(angle), to.y - headLen * 0.6 * Math.sin(angle));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(to.x, to.y);
      ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI / 7), to.y - headLen * Math.sin(angle - Math.PI / 7));
      ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI / 7), to.y - headLen * Math.sin(angle + Math.PI / 7));
      ctx.closePath(); ctx.fill(); break;
    }
    case "highlight": {
      const x = Math.min(op.from.x, op.to.x), y = Math.min(op.from.y, op.to.y);
      const w = Math.abs(op.to.x - op.from.x), h = Math.abs(op.to.y - op.from.y);
      ctx.globalAlpha = 0.35; ctx.fillStyle = op.color; ctx.fillRect(x, y, w, h); break;
    }
    case "rect": {
      const x = Math.min(op.from.x, op.to.x), y = Math.min(op.from.y, op.to.y);
      const w = Math.abs(op.to.x - op.from.x), h = Math.abs(op.to.y - op.from.y);
      ctx.strokeStyle = op.color; ctx.lineWidth = op.size; ctx.lineJoin = "round";
      ctx.strokeRect(x, y, w, h); break;
    }
    case "text": {
      ctx.fillStyle = op.color;
      ctx.font = `bold ${op.fontSize}px 'Segoe UI', system-ui, sans-serif`;
      ctx.shadowColor = selected ? "#6ee7b7" : "rgba(0,0,0,0.6)";
      ctx.shadowBlur = selected ? 12 : 4;
      ctx.fillText(op.text, op.pos.x, op.pos.y); break;
    }
  }
  ctx.restore();
}

function drawCropOverlay(ctx: CanvasRenderingContext2D, cr: SSCropRect, cw: number, ch: number) {
  const { x, y, w, h } = cr;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, cw, y);
  ctx.fillRect(0, y + h, cw, ch - (y + h));
  ctx.fillRect(0, y, x, h);
  ctx.fillRect(x + w, y, cw - (x + w), h);
  ctx.strokeStyle = "#6ee7b7"; ctx.lineWidth = 2; ctx.setLineDash([6, 3]);
  ctx.strokeRect(x, y, w, h); ctx.setLineDash([]);
  [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([cx, cy]) => {
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#6ee7b7"; ctx.fill();
  });
  ctx.restore();
}

// ─── Hit testing ─────────────────────────────────────────────────────────────

function getBoundingBox(op: SSDrawOperation): { x: number; y: number; w: number; h: number } | null {
  switch (op.type) {
    case "pencil": {
      if (!op.points.length) return null;
      const xs = op.points.map((p) => p.x), ys = op.points.map((p) => p.y);
      const x = Math.min(...xs), y = Math.min(...ys);
      return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
    }
    case "arrow":
      return {
        x: Math.min(op.from.x, op.to.x), y: Math.min(op.from.y, op.to.y),
        w: Math.abs(op.to.x - op.from.x), h: Math.abs(op.to.y - op.from.y),
      };
    case "text":
      return { x: op.pos.x - 4, y: op.pos.y - op.fontSize - 4, w: op.text.length * op.fontSize * 0.65, h: op.fontSize + 8 };
    case "highlight":
    case "rect":
      return {
        x: Math.min(op.from.x, op.to.x), y: Math.min(op.from.y, op.to.y),
        w: Math.abs(op.to.x - op.from.x), h: Math.abs(op.to.y - op.from.y),
      };
  }
}

function hitTest(op: SSDrawOperation, pt: SSPoint, pad = 12): boolean {
  const bb = getBoundingBox(op);
  if (!bb) return false;
  return (
    pt.x >= bb.x - pad && pt.x <= bb.x + bb.w + pad &&
    pt.y >= bb.y - pad && pt.y <= bb.y + bb.h + pad
  );
}

// ─── Translate helper ─────────────────────────────────────────────────────────

function translateOp(op: SSDrawOperation, dx: number, dy: number): SSDrawOperation {
  switch (op.type) {
    case "pencil":    return { ...op, points: op.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
    case "arrow":     return { ...op, from: { x: op.from.x + dx, y: op.from.y + dy }, to: { x: op.to.x + dx, y: op.to.y + dy } };
    case "text":      return { ...op, pos: { x: op.pos.x + dx, y: op.pos.y + dy } };
    case "highlight":
    case "rect":      return { ...op, from: { x: op.from.x + dx, y: op.from.y + dy }, to: { x: op.to.x + dx, y: op.to.y + dy } };
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

const SSAnnotationCanvas = forwardRef<SSAnnotationCanvasRef, SSAnnotationCanvasProps>(
  ({ imageUrl, tool, color, strokeSize, operations, cropRect, onAddOperation, onUpdateOperation, onCropRectChange, zoom = 1 }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef    = useRef<HTMLImageElement | null>(null);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [imgDims, setImgDims]     = useState({ w: 0, h: 0 });

    // Drawing state
    const isDrawing      = useRef(false);
    const currentStart   = useRef<SSPoint | null>(null);
    const currentPoints  = useRef<SSPoint[]>([]);

    // Drag/select state
    const [selectedId, setSelectedId]   = useState<string | null>(null);
    const isDragging      = useRef(false);
    const dragStart       = useRef<SSPoint | null>(null);
    const dragOriginalOp  = useRef<SSDrawOperation | null>(null);

    // Text input
    const [textInput, setTextInput] = useState<{ cssX: number; cssY: number; canvasX: number; canvasY: number } | null>(null);
    const [textValue, setTextValue] = useState("");
    const textInputRef = useRef<HTMLInputElement>(null);

    // ── Load image ────────────────────────────────────────────────────────────
    useEffect(() => {
      setImgLoaded(false);
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => { imgRef.current = img; setImgDims({ w: img.naturalWidth, h: img.naturalHeight }); setImgLoaded(true); };
      img.src = imageUrl;
    }, [imageUrl]);

    // ── Render ────────────────────────────────────────────────────────────────
    const render = useCallback((liveOp?: SSDrawOperation, liveDragOp?: { id: string; op: SSDrawOperation }) => {
      const canvas = canvasRef.current; const img = imgRef.current;
      if (!canvas || !img || !imgLoaded) return;
      const ctx = canvas.getContext("2d"); if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      operations.forEach((op) => {
        if (liveDragOp && op.id === liveDragOp.id) {
          renderOperation(ctx, liveDragOp.op, true);
        } else {
          renderOperation(ctx, op, op.id === selectedId);
        }
      });
      if (liveOp) renderOperation(ctx, liveOp);
      if (tool === "crop" && cropRect) drawCropOverlay(ctx, cropRect, canvas.width, canvas.height);
    }, [imgLoaded, operations, tool, cropRect, selectedId]);

    useEffect(() => { render(); }, [render]);

    // ── Coordinates ───────────────────────────────────────────────────────────
    // Canvas CSS size = naturalWidth * zoom  →  canvas.width / rect.width = 1/zoom
    // so (clientX - rect.left) * (canvas.width / rect.width) = correct canvas pixel
    const getPoint = (e: MouseEvent<HTMLCanvasElement>): SSPoint => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top)  * (canvas.height / rect.height),
      };
    };

    // ── Mouse events ──────────────────────────────────────────────────────────
    const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const pt = getPoint(e);

      // ── SELECT / DRAG mode ──
      if (tool === "select") {
        // Find topmost op that was hit (iterate in reverse for top-first)
        const hit = [...operations].reverse().find((op) => hitTest(op, pt));
        if (hit) {
          setSelectedId(hit.id);
          isDragging.current    = true;
          dragStart.current     = pt;
          dragOriginalOp.current = hit;
        } else {
          setSelectedId(null);
        }
        return;
      }

      // ── TEXT mode ──
      if (tool === "text") {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        // CSS position relative to canvas div (already accounts for zoom since CSS size = w*zoom)
        const cssX = e.clientX - rect.left;
        const cssY = e.clientY - rect.top;
        setTextInput({ cssX, cssY, canvasX: pt.x, canvasY: pt.y });
        setTextValue("");
        setTimeout(() => textInputRef.current?.focus(), 30);
        return;
      }

      isDrawing.current = true;
      currentStart.current = pt;
      currentPoints.current = [pt];
    };

    const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
      const pt = getPoint(e);

      // ── Drag ──
      if (isDragging.current && dragStart.current && dragOriginalOp.current) {
        const dx = pt.x - dragStart.current.x;
        const dy = pt.y - dragStart.current.y;
        const moved = translateOp(dragOriginalOp.current, dx, dy);
        render(undefined, { id: dragOriginalOp.current.id, op: moved });
        return;
      }

      if (!isDrawing.current || !currentStart.current) return;
      currentPoints.current.push(pt);

      if (tool === "crop") {
        onCropRectChange({ x: Math.min(currentStart.current.x, pt.x), y: Math.min(currentStart.current.y, pt.y), w: Math.abs(pt.x - currentStart.current.x), h: Math.abs(pt.y - currentStart.current.y) });
        return;
      }

      let liveOp: SSDrawOperation | undefined;
      if (tool === "pencil")    liveOp = { id: "__live__", type: "pencil",    color, size: strokeSize, points: [...currentPoints.current] };
      else if (tool === "arrow")     liveOp = { id: "__live__", type: "arrow",     color, size: strokeSize, from: currentStart.current, to: pt };
      else if (tool === "highlight") liveOp = { id: "__live__", type: "highlight", color, size: strokeSize, from: currentStart.current, to: pt };
      else if (tool === "rect")      liveOp = { id: "__live__", type: "rect",      color, size: strokeSize, from: currentStart.current, to: pt };
      render(liveOp);
    };

    const handleMouseUp = (e: MouseEvent<HTMLCanvasElement>) => {
      const pt = getPoint(e);

      // ── Drag end ──
      if (isDragging.current && dragStart.current && dragOriginalOp.current) {
        const dx = pt.x - dragStart.current.x;
        const dy = pt.y - dragStart.current.y;
        const originalId = dragOriginalOp.current.id;
        onUpdateOperation(originalId, (op) => translateOp(op, dx, dy));
        isDragging.current     = false;
        dragStart.current      = null;
        dragOriginalOp.current = null;
        return;
      }

      if (!isDrawing.current) return;
      isDrawing.current = false;
      const id = `op-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      if (tool === "pencil" && currentPoints.current.length > 1)
        onAddOperation({ id, type: "pencil", color, size: strokeSize, points: [...currentPoints.current] });
      else if (tool === "arrow" && currentStart.current && Math.hypot(pt.x - currentStart.current.x, pt.y - currentStart.current.y) > 5)
        onAddOperation({ id, type: "arrow", color, size: strokeSize, from: currentStart.current, to: pt });
      else if (tool === "highlight" && currentStart.current) {
        const w = Math.abs(pt.x - currentStart.current.x), h = Math.abs(pt.y - currentStart.current.y);
        if (w > 5 && h > 5) onAddOperation({ id, type: "highlight", color, size: strokeSize, from: currentStart.current, to: pt });
      } else if (tool === "rect" && currentStart.current) {
        const w = Math.abs(pt.x - currentStart.current.x), h = Math.abs(pt.y - currentStart.current.y);
        if (w > 5 && h > 5) onAddOperation({ id, type: "rect", color, size: strokeSize, from: currentStart.current, to: pt });
      }
      currentPoints.current = [];
      currentStart.current  = null;
    };

    const finalizeText = () => {
      if (textValue.trim() && textInput) {
        const canvas = canvasRef.current!;
        // fontSize in canvas pixels = desired visual px / zoom * (canvas.width / cssWidth)
        // Since CSS width = naturalWidth * zoom → canvas.width / rect.width = 1/zoom
        // We want fontSize to look like ~(14 + strokeSize*3)px at zoom=1
        const baseFontSize = 14 + strokeSize * 3;
        onAddOperation({
          id: `op-${Date.now()}`,
          type: "text", color, size: strokeSize,
          pos: { x: textInput.canvasX, y: textInput.canvasY },
          text: textValue.trim(),
          fontSize: baseFontSize / zoom, // compensate for zoom so it looks consistent
        });
      }
      setTextInput(null);
      setTextValue("");
    };

    // ── Export ────────────────────────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      getDataUrl() {
        const canvas = canvasRef.current; const img = imgRef.current;
        if (!canvas || !img) return "";
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        operations.forEach((op) => renderOperation(ctx, op));
        return canvas.toDataURL("image/png");
      },
      applyCrop(rect: SSCropRect) {
        const canvas = canvasRef.current!; const img = imgRef.current!;
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        operations.forEach((op) => renderOperation(ctx, op));
        const out = document.createElement("canvas");
        out.width  = Math.round(rect.w);
        out.height = Math.round(rect.h);
        out.getContext("2d")!.drawImage(canvas, Math.round(rect.x), Math.round(rect.y), Math.round(rect.w), Math.round(rect.h), 0, 0, Math.round(rect.w), Math.round(rect.h));
        return out.toDataURL("image/png");
      },
    }));

    // ── Cursor ────────────────────────────────────────────────────────────────
    const cursors: Record<SSAnnotationTool, string> = {
      select: "default", pencil: "crosshair", arrow: "crosshair",
      text: "text", highlight: "crosshair", rect: "crosshair", crop: "crosshair",
    };

    // CSS size of canvas = natural size * zoom → layout reflects actual visual size → scroll works ✓
    const cssWidth  = imgDims.w * zoom;
    const cssHeight = imgDims.h * zoom;

    return (
      <div className="relative inline-block select-none" style={{ width: cssWidth, height: cssHeight }}>
        {!imgLoaded && (
          <div className="flex items-center justify-center bg-[#141414]" style={{ width: cssWidth || 800, height: cssHeight || 600 }}>
            <div className="w-6 h-6 border-2 border-[#333] border-t-[#6ee7b7] rounded-full animate-spin" />
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={imgDims.w || undefined}
          height={imgDims.h || undefined}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            cursor: isDragging.current ? "grabbing" : (tool === "select" ? "default" : cursors[tool]),
            display: imgLoaded ? "block" : "none",
            // KEY FIX: CSS size = natural * zoom → affects layout → scroll container correct
            width:  cssWidth,
            height: cssHeight,
          }}
        />

        {/* Text input — cssX/cssY are already in canvas-div CSS space (0 to cssWidth) */}
        {textInput && (
          <input
            ref={textInputRef}
            type="text"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") finalizeText();
              if (e.key === "Escape") { setTextInput(null); setTextValue(""); }
            }}
            onBlur={finalizeText}
            placeholder="Type here..."
            autoComplete="off"
            className="absolute z-20 bg-black/80 backdrop-blur-sm border-b-2 px-2 py-1 text-sm font-bold outline-none rounded-sm min-w-[140px] pointer-events-auto"
            style={{
              // Position exactly at click point in CSS space
              left: textInput.cssX,
              top:  textInput.cssY - 32,
              color,
              borderColor: color,
              // Font size matches what will be drawn on canvas
              fontSize: (14 + strokeSize * 3),
            }}
          />
        )}
      </div>
    );
  }
);

SSAnnotationCanvas.displayName = "SSAnnotationCanvas";
export default SSAnnotationCanvas;

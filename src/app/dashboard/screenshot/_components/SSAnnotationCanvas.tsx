"use client";

import React, {
  useRef, useEffect, useState, forwardRef, useImperativeHandle,
  useCallback, MouseEvent,
} from "react";
import {
  SSAnnotationTool, SSDrawOperation, SSCropRect, SSPoint,
  SSBlurOp, SSEraserOp,
} from "@/hooks/useSSAnnotation";

interface Props {
  imageUrl: string;
  tool: SSAnnotationTool;
  color: string;
  strokeSize: number;
  opacity: number;
  badgeCount: number;
  operations: SSDrawOperation[];
  cropRect: SSCropRect | null;
  onAddOperation: (op: SSDrawOperation) => void;
  onUpdateOperation: (id: string, upd: (op: SSDrawOperation) => SSDrawOperation) => void;
  onCropRectChange: (rect: SSCropRect | null) => void;
  zoom?: number;
}

export interface SSAnnotationCanvasRef {
  getDataUrl: () => string;
  applyCrop: (rect: SSCropRect) => string;
}

// ─── Mosaic/blur helper ───────────────────────────────────────────────────────
function applyMosaic(
  ctx: CanvasRenderingContext2D,
  srcCanvas: HTMLCanvasElement,
  x: number, y: number, w: number, h: number,
  pixelSize: number
) {
  const px = Math.max(4, pixelSize);
  const sx = Math.round(x), sy = Math.round(y), sw = Math.round(w), sh = Math.round(h);
  if (sw <= 0 || sh <= 0) return;
  // Draw pixelated version
  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width  = Math.ceil(sw / px);
  tmpCanvas.height = Math.ceil(sh / px);
  const tmpCtx = tmpCanvas.getContext("2d")!;
  tmpCtx.drawImage(srcCanvas, sx, sy, sw, sh, 0, 0, tmpCanvas.width, tmpCanvas.height);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tmpCanvas, 0, 0, tmpCanvas.width, tmpCanvas.height, sx, sy, sw, sh);
  ctx.restore();
}

// ─── Render ───────────────────────────────────────────────────────────────────
function renderOperation(
  ctx: CanvasRenderingContext2D,
  op: SSDrawOperation,
  srcCanvas: HTMLCanvasElement | null,
  selected = false
) {
  ctx.save();
  ctx.globalAlpha = op.opacity ?? 1;
  if (selected) { ctx.shadowColor = "#6ee7b7"; ctx.shadowBlur = 14; }

  switch (op.type) {
    case "pencil": {
      if (op.points.length < 2) break;
      ctx.strokeStyle = op.color; ctx.lineWidth = op.size;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(op.points[0].x, op.points[0].y);
      op.points.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke(); break;
    }
    case "eraser": {
      if (op.points.length < 2 || !srcCanvas) break;
      // clip to eraser path, then restore original image pixels
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = op.size * 4;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(op.points[0].x, op.points[0].y);
      op.points.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke(); break;
    }
    case "arrow": {
      const { from, to } = op;
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      const hl = 14 + op.size * 2.5;
      ctx.strokeStyle = op.color; ctx.fillStyle = op.color;
      ctx.lineWidth = op.size; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x - hl * 0.6 * Math.cos(angle), to.y - hl * 0.6 * Math.sin(angle));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(to.x, to.y);
      ctx.lineTo(to.x - hl * Math.cos(angle - Math.PI/7), to.y - hl * Math.sin(angle - Math.PI/7));
      ctx.lineTo(to.x - hl * Math.cos(angle + Math.PI/7), to.y - hl * Math.sin(angle + Math.PI/7));
      ctx.closePath(); ctx.fill(); break;
    }
    case "highlight": {
      const x = Math.min(op.from.x, op.to.x), y = Math.min(op.from.y, op.to.y);
      const w = Math.abs(op.to.x - op.from.x), h = Math.abs(op.to.y - op.from.y);
      ctx.globalAlpha = (op.opacity ?? 1) * 0.4;
      ctx.fillStyle = op.color; ctx.fillRect(x, y, w, h); break;
    }
    case "rect": {
      const x = Math.min(op.from.x, op.to.x), y = Math.min(op.from.y, op.to.y);
      const w = Math.abs(op.to.x - op.from.x), h = Math.abs(op.to.y - op.from.y);
      ctx.strokeStyle = op.color; ctx.lineWidth = op.size; ctx.lineJoin = "round";
      ctx.strokeRect(x, y, w, h); break;
    }
    case "circle": {
      const cx = (op.from.x + op.to.x) / 2, cy = (op.from.y + op.to.y) / 2;
      const rx = Math.abs(op.to.x - op.from.x) / 2, ry = Math.abs(op.to.y - op.from.y) / 2;
      ctx.strokeStyle = op.color; ctx.lineWidth = op.size;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke(); break;
    }
    case "badge": {
      const r = 18 + op.size * 2;
      // Circle fill
      ctx.fillStyle = op.color;
      ctx.beginPath(); ctx.arc(op.pos.x, op.pos.y, r, 0, Math.PI * 2); ctx.fill();
      // Border
      ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(op.pos.x, op.pos.y, r, 0, Math.PI * 2); ctx.stroke();
      // Number
      const fontSize = r * 1.1;
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${fontSize}px 'Segoe UI', system-ui, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(op.number), op.pos.x, op.pos.y);
      ctx.textAlign = "start"; ctx.textBaseline = "alphabetic"; break;
    }
    case "blur": {
      if (!srcCanvas) break;
      const x = Math.min(op.from.x, op.to.x), y = Math.min(op.from.y, op.to.y);
      const w = Math.abs(op.to.x - op.from.x), h = Math.abs(op.to.y - op.from.y);
      ctx.globalAlpha = 1;
      applyMosaic(ctx, srcCanvas, x, y, w, h, op.pixelSize); break;
    }
    case "text": {
      ctx.fillStyle = op.color;
      ctx.font = `bold ${op.fontSize}px 'Segoe UI', system-ui, sans-serif`;
      ctx.shadowColor = selected ? "#6ee7b7" : "rgba(0,0,0,0.7)";
      ctx.shadowBlur = selected ? 14 : 5;
      ctx.fillText(op.text, op.pos.x, op.pos.y); break;
    }
  }
  ctx.restore();
}

function drawCropOverlay(ctx: CanvasRenderingContext2D, cr: SSCropRect, cw: number, ch: number) {
  const { x, y, w, h } = cr;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, cw, y); ctx.fillRect(0, y+h, cw, ch-(y+h));
  ctx.fillRect(0, y, x, h); ctx.fillRect(x+w, y, cw-(x+w), h);
  ctx.strokeStyle = "#6ee7b7"; ctx.lineWidth = 2; ctx.setLineDash([6, 3]);
  ctx.strokeRect(x, y, w, h); ctx.setLineDash([]);
  [[x,y],[x+w,y],[x,y+h],[x+w,y+h]].forEach(([cx,cy]) => {
    ctx.beginPath(); ctx.arc(cx,cy,5,0,Math.PI*2); ctx.fillStyle="#6ee7b7"; ctx.fill();
  });
  ctx.restore();
}

// ─── Hit testing ─────────────────────────────────────────────────────────────
function getBBox(op: SSDrawOperation) {
  switch (op.type) {
    case "pencil": case "eraser": {
      if (!op.points.length) return null;
      const xs = op.points.map(p=>p.x), ys = op.points.map(p=>p.y);
      const x=Math.min(...xs), y=Math.min(...ys);
      return { x, y, w: Math.max(...xs)-x, h: Math.max(...ys)-y };
    }
    case "arrow":  return { x:Math.min(op.from.x,op.to.x), y:Math.min(op.from.y,op.to.y), w:Math.abs(op.to.x-op.from.x), h:Math.abs(op.to.y-op.from.y) };
    case "text":   return { x:op.pos.x-4, y:op.pos.y-op.fontSize-4, w:op.text.length*op.fontSize*0.65, h:op.fontSize+8 };
    case "highlight": case "rect": case "circle": case "blur":
      return { x:Math.min(op.from.x,op.to.x), y:Math.min(op.from.y,op.to.y), w:Math.abs(op.to.x-op.from.x), h:Math.abs(op.to.y-op.from.y) };
    case "badge":  return { x:op.pos.x-28, y:op.pos.y-28, w:56, h:56 };
  }
}
const hitTest = (op: SSDrawOperation, pt: SSPoint, pad=12) => {
  const bb = getBBox(op); if (!bb) return false;
  return pt.x>=bb.x-pad && pt.x<=bb.x+bb.w+pad && pt.y>=bb.y-pad && pt.y<=bb.y+bb.h+pad;
};

function translateOp(op: SSDrawOperation, dx: number, dy: number): SSDrawOperation {
  switch (op.type) {
    case "pencil": case "eraser": return { ...op, points: op.points.map(p=>({x:p.x+dx,y:p.y+dy})) };
    case "arrow":     return { ...op, from:{x:op.from.x+dx,y:op.from.y+dy}, to:{x:op.to.x+dx,y:op.to.y+dy} };
    case "text":      return { ...op, pos:{x:op.pos.x+dx,y:op.pos.y+dy} };
    case "badge":     return { ...op, pos:{x:op.pos.x+dx,y:op.pos.y+dy} };
    case "highlight": case "rect": case "circle": case "blur":
      return { ...op, from:{x:op.from.x+dx,y:op.from.y+dy}, to:{x:op.to.x+dx,y:op.to.y+dy} };
  }
}

// ─── Component ───────────────────────────────────────────────────────────────
const SSAnnotationCanvas = forwardRef<SSAnnotationCanvasRef, Props>(
  ({ imageUrl, tool, color, strokeSize, opacity, badgeCount, operations,
     cropRect, onAddOperation, onUpdateOperation, onCropRectChange, zoom=1 }, ref) => {

  const canvasRef  = useRef<HTMLCanvasElement>(null);
  // srcCanvas always has just the original image, used for blur & eraser
  const srcCanvas  = useRef<HTMLCanvasElement | null>(null);
  const imgRef     = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgDims, setImgDims]     = useState({ w: 0, h: 0 });

  const isDrawing     = useRef(false);
  const currentStart  = useRef<SSPoint | null>(null);
  const currentPoints = useRef<SSPoint[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isDragging    = useRef(false);
  const dragStart     = useRef<SSPoint | null>(null);
  const dragOriginal  = useRef<SSDrawOperation | null>(null);

  const [textInput, setTextInput] = useState<{cssX:number;cssY:number;canvasX:number;canvasY:number}|null>(null);
  const [textValue, setTextValue] = useState("");
  const textRef = useRef<HTMLInputElement>(null);

  // ── Load image ──
  useEffect(() => {
    setImgLoaded(false);
    const img = new window.Image(); img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImgDims({ w: img.naturalWidth, h: img.naturalHeight });
      // Build srcCanvas (original image only, used for blur/eraser)
      const sc = document.createElement("canvas");
      sc.width = img.naturalWidth; sc.height = img.naturalHeight;
      sc.getContext("2d")!.drawImage(img, 0, 0);
      srcCanvas.current = sc;
      setImgLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // ── Render ──
  const render = useCallback((liveOp?: SSDrawOperation, liveDrag?: {id:string;op:SSDrawOperation}) => {
    const canvas = canvasRef.current; const img = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // Render non-eraser ops normally, then eraser with destination-out on annotation layer
    operations.forEach((op) => {
      if (liveDrag && op.id === liveDrag.id) renderOperation(ctx, liveDrag.op, srcCanvas.current, true);
      else renderOperation(ctx, op, srcCanvas.current, op.id === selectedId);
    });
    if (liveOp) renderOperation(ctx, liveOp, srcCanvas.current);
    if (tool === "crop" && cropRect) drawCropOverlay(ctx, cropRect, canvas.width, canvas.height);
  }, [imgLoaded, operations, tool, cropRect, selectedId]);

  useEffect(() => { render(); }, [render]);

  const getPoint = (e: MouseEvent<HTMLCanvasElement>): SSPoint => {
    const canvas = canvasRef.current!; const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top)  * (canvas.height / rect.height),
    };
  };

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pt = getPoint(e);

    if (tool === "select") {
      const hit = [...operations].reverse().find((op) => hitTest(op, pt));
      setSelectedId(hit?.id ?? null);
      if (hit) { isDragging.current=true; dragStart.current=pt; dragOriginal.current=hit; }
      return;
    }
    if (tool === "text") {
      const rect = canvasRef.current!.getBoundingClientRect();
      setTextInput({ cssX: e.clientX-rect.left, cssY: e.clientY-rect.top, canvasX: pt.x, canvasY: pt.y });
      setTextValue(""); setTimeout(() => textRef.current?.focus(), 30); return;
    }
    if (tool === "badge") {
      const id = `op-${Date.now()}`;
      onAddOperation({ id, type:"badge", color, size:strokeSize, opacity, pos:pt, number:badgeCount });
      return;
    }
    isDrawing.current=true; currentStart.current=pt; currentPoints.current=[pt];
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const pt = getPoint(e);
    if (isDragging.current && dragStart.current && dragOriginal.current) {
      const dx=pt.x-dragStart.current.x, dy=pt.y-dragStart.current.y;
      render(undefined, { id:dragOriginal.current.id, op:translateOp(dragOriginal.current,dx,dy) });
      return;
    }
    if (!isDrawing.current || !currentStart.current) return;
    currentPoints.current.push(pt);

    if (tool === "crop") {
      onCropRectChange({ x:Math.min(currentStart.current.x,pt.x), y:Math.min(currentStart.current.y,pt.y), w:Math.abs(pt.x-currentStart.current.x), h:Math.abs(pt.y-currentStart.current.y) });
      return;
    }

    const base = { id:"__live__", color, size:strokeSize, opacity };
    let liveOp: SSDrawOperation | undefined;
    if (tool==="pencil")    liveOp={...base,type:"pencil",    points:[...currentPoints.current]};
    else if(tool==="eraser")liveOp={...base,type:"eraser",    points:[...currentPoints.current]};
    else if(tool==="arrow") liveOp={...base,type:"arrow",     from:currentStart.current,to:pt};
    else if(tool==="highlight")liveOp={...base,type:"highlight",from:currentStart.current,to:pt};
    else if(tool==="rect")  liveOp={...base,type:"rect",      from:currentStart.current,to:pt};
    else if(tool==="circle")liveOp={...base,type:"circle",    from:currentStart.current,to:pt};
    else if(tool==="blur")  liveOp={...base,type:"blur",      from:currentStart.current,to:pt,pixelSize:strokeSize*3};
    render(liveOp);
  };

  const handleMouseUp = (e: MouseEvent<HTMLCanvasElement>) => {
    const pt = getPoint(e);
    if (isDragging.current && dragStart.current && dragOriginal.current) {
      const dx=pt.x-dragStart.current.x, dy=pt.y-dragStart.current.y;
      onUpdateOperation(dragOriginal.current.id, (op)=>translateOp(op,dx,dy));
      isDragging.current=false; dragStart.current=null; dragOriginal.current=null; return;
    }
    if (!isDrawing.current) return; isDrawing.current=false;
    const id=`op-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const base={id,color,size:strokeSize,opacity};
    const start = currentStart.current!;

    if((tool==="pencil"||tool==="eraser") && currentPoints.current.length>1)
      onAddOperation({...base,type:tool,points:[...currentPoints.current]});
    else if(tool==="arrow" && Math.hypot(pt.x-start.x,pt.y-start.y)>5)
      onAddOperation({...base,type:"arrow",from:start,to:pt});
    else {
      const w=Math.abs(pt.x-start.x),h=Math.abs(pt.y-start.y);
      if(w>5&&h>5){
        if(tool==="highlight")onAddOperation({...base,type:"highlight",from:start,to:pt});
        else if(tool==="rect") onAddOperation({...base,type:"rect",from:start,to:pt});
        else if(tool==="circle")onAddOperation({...base,type:"circle",from:start,to:pt});
        else if(tool==="blur")  onAddOperation({...base,type:"blur",from:start,to:pt,pixelSize:strokeSize*3} as SSBlurOp);
      }
    }
    currentPoints.current=[]; currentStart.current=null;
  };

  const finalizeText = () => {
    if (textValue.trim() && textInput) {
      onAddOperation({
        id:`op-${Date.now()}`, type:"text", color, size:strokeSize, opacity,
        pos:{x:textInput.canvasX, y:textInput.canvasY},
        text:textValue.trim(),
        fontSize:(14+strokeSize*3)/zoom,
      });
    }
    setTextInput(null); setTextValue("");
  };

  useImperativeHandle(ref, () => ({
    getDataUrl() {
      const canvas=canvasRef.current; const img=imgRef.current;
      if(!canvas||!img) return "";
      const ctx=canvas.getContext("2d")!;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img,0,0);
      operations.forEach(op=>renderOperation(ctx,op,srcCanvas.current));
      return canvas.toDataURL("image/png");
    },
    applyCrop(rect:SSCropRect){
      const canvas=canvasRef.current!; const img=imgRef.current!;
      const ctx=canvas.getContext("2d")!;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img,0,0);
      operations.forEach(op=>renderOperation(ctx,op,srcCanvas.current));
      const out=document.createElement("canvas");
      out.width=Math.round(rect.w); out.height=Math.round(rect.h);
      out.getContext("2d")!.drawImage(canvas,Math.round(rect.x),Math.round(rect.y),Math.round(rect.w),Math.round(rect.h),0,0,Math.round(rect.w),Math.round(rect.h));
      return out.toDataURL("image/png");
    },
  }));

  const cursors: Record<SSAnnotationTool,"crosshair"|"text"|"default"|"cell"|"not-allowed"> = {
    select:"default", pencil:"crosshair", arrow:"crosshair", text:"text",
    highlight:"crosshair", rect:"crosshair", circle:"crosshair",
    badge:"cell", blur:"crosshair", eraser:"crosshair", crop:"crosshair",
  };

  const cssW = imgDims.w * zoom;
  const cssH = imgDims.h * zoom;

  return (
    <div className="relative inline-block select-none" style={{width:cssW,height:cssH}}>
      {!imgLoaded && (
        <div className="flex items-center justify-center bg-[#141414]" style={{width:cssW||800,height:cssH||500}}>
          <div className="w-6 h-6 border-2 border-[#333] border-t-[#6ee7b7] rounded-full animate-spin"/>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={imgDims.w||undefined} height={imgDims.h||undefined}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
        style={{
          cursor: isDragging.current ? "grabbing" : cursors[tool],
          display: imgLoaded ? "block" : "none",
          width: cssW, height: cssH,
        }}
      />
      {textInput && (
        <input
          ref={textRef} type="text" value={textValue}
          onChange={e=>setTextValue(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter")finalizeText(); if(e.key==="Escape"){setTextInput(null);setTextValue("");} }}
          onBlur={finalizeText}
          placeholder="Type here, press Enter"
          autoComplete="off"
          className="absolute z-20 bg-black/80 backdrop-blur-sm border-b-2 px-2 py-1 font-bold outline-none rounded-sm min-w-[160px]"
          style={{
            left: textInput.cssX, top: textInput.cssY - 36,
            color, borderColor: color,
            fontSize: (14 + strokeSize * 3),
          }}
        />
      )}
    </div>
  );
});

SSAnnotationCanvas.displayName = "SSAnnotationCanvas";
export default SSAnnotationCanvas;

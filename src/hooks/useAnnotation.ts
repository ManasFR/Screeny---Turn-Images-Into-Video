'use client';

import { useState, useRef, useCallback } from 'react';

export type ToolType =
  | 'none' | 'pen' | 'highlighter' | 'text'
  | 'arrow' | 'rectangle' | 'circle' | 'eraser' | 'blur';

const HIGHLIGHT_COLORS = ['#FACC15', '#34D399', '#60A5FA', '#F472B6', '#FB923C'];
const PEN_COLORS       = ['#FFFFFF', '#EF4444', '#3B82F6', '#22C55E', '#FACC15', '#A855F7'];

export const useAnnotation = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const [tool,           setTool]           = useState<ToolType>('none');
  const [color,          setColor]          = useState('#FFFFFF');
  const [size,           setSize]           = useState(3);
  const [isDrawing,      setIsDrawing]      = useState(false);
  const [textInput,      setTextInput]      = useState('');
  const [textPos,        setTextPos]        = useState<{ x: number; y: number } | null>(null);
  const [showTextInput,  setShowTextInput]  = useState(false);

  const lastPos     = useRef<{ x: number; y: number } | null>(null);
  const startPos    = useRef<{ x: number; y: number } | null>(null);
  const snapshotRef = useRef<ImageData | null>(null);

  const getPos = (e: React.MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width  / rect.width),
      y: (e.clientY - rect.top)  * (canvas.height / rect.height),
    };
  };

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [canvasRef]);

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'none') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);

    if (tool === 'text') {
      setTextPos(pos);
      setShowTextInput(true);
      return;
    }

    setIsDrawing(true);
    lastPos.current  = pos;
    startPos.current = pos;
    snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
  }, [tool, canvasRef]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool === 'none' || tool === 'text') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);

    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle     = tool === 'eraser' ? 'rgba(0,0,0,0)' : color;
      ctx.lineWidth       = tool === 'eraser' ? size * 5 : size;
      ctx.lineCap         = 'round';
      ctx.lineJoin        = 'round';
      ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.stroke();
      lastPos.current = pos;

    } else if (tool === 'highlighter') {
      ctx.beginPath();
      ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle     = color;
      ctx.lineWidth       = size * 6;
      ctx.lineCap         = 'round';
      ctx.globalAlpha     = 0.35;
      ctx.globalCompositeOperation = 'source-over';
      ctx.stroke();
      ctx.globalAlpha = 1;
      lastPos.current = pos;

    } else if (tool === 'blur') {
      // Live blur preview: restore snapshot then draw frosted rect
      if (snapshotRef.current) ctx.putImageData(snapshotRef.current, 0, 0);
      const sx = startPos.current!.x, sy = startPos.current!.y;
      const w = pos.x - sx, h = pos.y - sy;

      // Draw the blurred region using a temp canvas trick
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width  = canvas.width;
      tmpCanvas.height = canvas.height;
      const tmpCtx = tmpCanvas.getContext('2d')!;
      tmpCtx.drawImage(canvas, 0, 0);
      tmpCtx.filter = `blur(${size * 2 + 4}px)`;
      tmpCtx.drawImage(canvas, sx, sy, Math.abs(w), Math.abs(h), sx, sy, Math.abs(w), Math.abs(h));

      ctx.drawImage(tmpCanvas, sx, sy, Math.abs(w), Math.abs(h), sx, sy, Math.abs(w), Math.abs(h));

      // Selection border
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(sx, sy, w, h);
      ctx.setLineDash([]);

    } else if (['arrow', 'rectangle', 'circle'].includes(tool)) {
      if (snapshotRef.current) ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth   = size;
      ctx.lineCap     = 'round';
      const sx = startPos.current!.x, sy = startPos.current!.y;

      if (tool === 'rectangle') {
        ctx.beginPath();
        ctx.strokeRect(sx, sy, pos.x - sx, pos.y - sy);

      } else if (tool === 'circle') {
        const rx = Math.abs(pos.x - sx) / 2, ry = Math.abs(pos.y - sy) / 2;
        ctx.beginPath();
        ctx.ellipse(sx + (pos.x - sx) / 2, sy + (pos.y - sy) / 2, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();

      } else if (tool === 'arrow') {
        const headlen = 18;
        const angle   = Math.atan2(pos.y - sy, pos.x - sx);
        ctx.beginPath();
        ctx.moveTo(sx, sy); ctx.lineTo(pos.x, pos.y); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x - headlen * Math.cos(angle - Math.PI / 6), pos.y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x - headlen * Math.cos(angle + Math.PI / 6), pos.y - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      }
    }
  }, [isDrawing, tool, color, size, canvasRef]);

  const onMouseUp = useCallback(() => {
    setIsDrawing(false);
    lastPos.current     = null;
    snapshotRef.current = null;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.globalCompositeOperation = 'source-over'; ctx.setLineDash([]); }
    }
  }, [canvasRef]);

  const commitText = useCallback(() => {
    if (!textPos || !textInput.trim()) {
      setShowTextInput(false); setTextInput(''); setTextPos(null); return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.font        = `bold ${size * 6 + 12}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle   = color;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillText(textInput, textPos.x, textPos.y);
    setShowTextInput(false); setTextInput(''); setTextPos(null);
  }, [textPos, textInput, color, size, canvasRef]);

  return {
    tool, setTool, color, setColor, size, setSize, isDrawing,
    showTextInput, setShowTextInput, textInput, setTextInput, textPos,
    onMouseDown, onMouseMove, onMouseUp, clearCanvas, commitText,
    HIGHLIGHT_COLORS, PEN_COLORS,
  };
};

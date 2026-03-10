'use client';

import { useRef, useEffect, useState, useCallback, MouseEvent } from 'react';
import {
  X, Pen, Square, Circle, Minus, ArrowUpRight,
  Type, Eraser, Trash2, Download, RotateCcw, Redo,
} from 'lucide-react';

type WBTool = 'pen' | 'rect' | 'circle' | 'line' | 'arrow' | 'text' | 'eraser';
interface Point { x: number; y: number }
interface WBObj {
  id: string; type: WBTool;
  points?: Point[]; start?: Point; end?: Point;
  text?: string; x?: number; y?: number;
  color: string; size: number;
}

const TOOLS: { type: WBTool; icon: any; label: string }[] = [
  { type: 'pen',    icon: Pen,          label: 'Pen' },
  { type: 'rect',   icon: Square,       label: 'Rect' },
  { type: 'circle', icon: Circle,       label: 'Circle' },
  { type: 'line',   icon: Minus,        label: 'Line' },
  { type: 'arrow',  icon: ArrowUpRight, label: 'Arrow' },
  { type: 'text',   icon: Type,         label: 'Text' },
  { type: 'eraser', icon: Eraser,       label: 'Erase' },
];

const COLORS = [
  '#111111','#e74c3c','#e67e22','#f1c40f',
  '#2ecc71','#3498db','#9b59b6','#e91e63','#ffffff',
];

const drawArrow = (ctx: CanvasRenderingContext2D, from: Point, to: Point) => {
  const head = 16;
  const dx = to.x - from.x, dy = to.y - from.y;
  const angle = Math.atan2(dy, dx);
  ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - head * Math.cos(angle - Math.PI / 6), to.y - head * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - head * Math.cos(angle + Math.PI / 6), to.y - head * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
};

const renderObj = (ctx: CanvasRenderingContext2D, obj: WBObj) => {
  ctx.save();
  if (obj.type === 'eraser') {
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = obj.size * 5;
  } else {
    ctx.strokeStyle = obj.color; ctx.fillStyle = obj.color; ctx.lineWidth = obj.size;
  }
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if ((obj.type === 'pen' || obj.type === 'eraser') && obj.points && obj.points.length > 1) {
    ctx.beginPath(); ctx.moveTo(obj.points[0].x, obj.points[0].y);
    for (let i = 1; i < obj.points.length; i++) ctx.lineTo(obj.points[i].x, obj.points[i].y);
    ctx.stroke();
  } else if (obj.type === 'rect' && obj.start && obj.end) {
    ctx.strokeRect(obj.start.x, obj.start.y, obj.end.x - obj.start.x, obj.end.y - obj.start.y);
  } else if (obj.type === 'circle' && obj.start && obj.end) {
    const cx = (obj.start.x + obj.end.x) / 2, cy = (obj.start.y + obj.end.y) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.abs(obj.end.x - obj.start.x) / 2, Math.abs(obj.end.y - obj.start.y) / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (obj.type === 'line' && obj.start && obj.end) {
    ctx.beginPath(); ctx.moveTo(obj.start.x, obj.start.y); ctx.lineTo(obj.end.x, obj.end.y); ctx.stroke();
  } else if (obj.type === 'arrow' && obj.start && obj.end) {
    drawArrow(ctx, obj.start, obj.end);
  } else if (obj.type === 'text' && obj.text && obj.x !== undefined && obj.y !== undefined) {
    ctx.font = `${Math.max(16, obj.size * 5)}px "Segoe UI", sans-serif`;
    ctx.fillText(obj.text, obj.x, obj.y);
  }
  ctx.restore();
};

export default function WhiteboardModal({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<WBTool>('pen');
  const [color, setColor] = useState('#111111');
  const [size, setSize] = useState(3);
  const [objs, setObjs] = useState<WBObj[]>([]);
  const [redoStack, setRedoStack] = useState<WBObj[][]>([]);
  const [drawing, setDrawing] = useState(false);
  const [current, setCurrent] = useState<WBObj | null>(null);

  const [showText, setShowText] = useState(false);
  const [textPos, setTextPos] = useState<Point>({ x: 0, y: 0 });
  const [textVal, setTextVal] = useState('');
  const textRef = useRef<HTMLInputElement>(null);

  // ── Redraw
  const redraw = useCallback((list: WBObj[], cur: WBObj | null = null) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    list.forEach(o => renderObj(ctx, o));
    if (cur) renderObj(ctx, cur);
  }, []);

  useEffect(() => { redraw(objs, current); }, [objs, current, redraw]);

  // ── Resize
  useEffect(() => {
    const el = containerRef.current; const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width = el.clientWidth; canvas.height = el.clientHeight;
      redraw(objs);
    });
    canvas.width = el.clientWidth; canvas.height = el.clientHeight;
    redraw(objs);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const getPos = (e: MouseEvent<HTMLCanvasElement>): Point => {
    const r = canvasRef.current!.getBoundingClientRect();
    const c = canvasRef.current!;
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  };

  const onMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    const pos = getPos(e);
    if (tool === 'text') { setTextPos(pos); setShowText(true); setTextVal(''); setTimeout(() => textRef.current?.focus(), 30); return; }
    setDrawing(true);
    const id = Math.random().toString(36).slice(2);
    if (tool === 'pen' || tool === 'eraser') setCurrent({ id, type: tool, points: [pos], color, size });
    else setCurrent({ id, type: tool, start: pos, end: pos, color, size });
  };

  const onMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!drawing || !current) return;
    const pos = getPos(e);
    if (current.type === 'pen' || current.type === 'eraser')
      setCurrent(o => o ? { ...o, points: [...(o.points || []), pos] } : null);
    else
      setCurrent(o => o ? { ...o, end: pos } : null);
  };

  const onMouseUp = () => {
    if (!drawing || !current) return;
    setDrawing(false);
    setObjs(prev => { setRedoStack([]); return [...prev, current]; });
    setCurrent(null);
  };

  const commitText = () => {
    if (!textVal.trim()) { setShowText(false); return; }
    const id = Math.random().toString(36).slice(2);
    setObjs(prev => { setRedoStack([]); return [...prev, { id, type: 'text', text: textVal, x: textPos.x, y: textPos.y, color, size }]; });
    setShowText(false); setTextVal('');
  };

  const undo = () => { if (!objs.length) return; setRedoStack(s => [[...objs], ...s]); setObjs(prev => prev.slice(0, -1)); };
  const redo = () => { if (!redoStack.length) return; const [next, ...rest] = redoStack; setObjs(next); setRedoStack(rest); };
  const clear = () => { setRedoStack(s => [objs, ...s]); setObjs([]); };

  const download = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const a = document.createElement('a');
    a.download = `whiteboard-${Date.now()}.png`;
    a.href = canvas.toDataURL('image/png'); a.click();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !showText) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showText, onClose]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', flexDirection: 'column',
      background: '#ffffff',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      {/* ── Toolbar ── */}
      <div style={{
        height: '46px', flexShrink: 0,
        background: 'linear-gradient(180deg,#f4f4f4,#ebebeb)',
        borderBottom: '1px solid #d0d0d0',
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '0 12px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '10px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pen style={{ width: '12px', height: '12px', color: '#fff' }} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#333' }}>Whiteboard</span>
        </div>

        <div style={{ width: '1px', height: '26px', background: '#ccc', marginRight: '4px' }} />

        {/* Drawing tools */}
        {TOOLS.map(({ type: t, icon: Icon, label }) => (
          <button key={t} onClick={() => { setTool(t); setShowText(false); }} title={label}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '5px 8px', borderRadius: '5px', cursor: 'pointer',
              background: tool === t ? '#6366f1' : 'rgba(0,0,0,0.05)',
              border: `1px solid ${tool === t ? '#6366f1' : '#ddd'}`,
              color: tool === t ? '#fff' : '#555',
              fontSize: '10px', fontWeight: 600, transition: 'all 0.12s',
              boxShadow: tool === t ? '0 2px 8px rgba(99,102,241,0.35)' : 'none',
            }}
          >
            <Icon style={{ width: '13px', height: '13px' }} />
            <span style={{ display: 'none' }}>{label}</span>
          </button>
        ))}

        <div style={{ width: '1px', height: '26px', background: '#ccc', margin: '0 4px' }} />

        {/* Colors */}
        {COLORS.map(c => (
          <button key={c} onClick={() => setColor(c)}
            style={{
              width: '22px', height: '22px', borderRadius: '50%', cursor: 'pointer',
              background: c,
              border: color === c ? '3px solid #6366f1' : '2px solid rgba(0,0,0,0.15)',
              boxShadow: color === c ? '0 0 0 2px rgba(99,102,241,0.25)' : 'none',
              transform: color === c ? 'scale(1.2)' : 'scale(1)',
              transition: 'all 0.12s', flexShrink: 0,
            }}
          />
        ))}

        {/* Custom color */}
        <label style={{ position: 'relative', width: '22px', height: '22px', cursor: 'pointer', flexShrink: 0 }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'conic-gradient(red,yellow,green,cyan,blue,magenta,red)', border: '2px solid rgba(0,0,0,0.15)' }} />
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
        </label>

        <div style={{ width: '1px', height: '26px', background: '#ccc', margin: '0 4px' }} />

        {/* Size */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px', color: '#888', fontWeight: 600 }}>Size</span>
          <input type="range" min={1} max={14} value={size} onChange={e => setSize(parseInt(e.target.value))}
            style={{ width: '80px', accentColor: '#6366f1', cursor: 'pointer' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#555', minWidth: '18px' }}>{size}</span>
        </div>

        <div style={{ width: '1px', height: '26px', background: '#ccc', margin: '0 4px' }} />

        {/* Action buttons */}
        <button onClick={undo} disabled={!objs.length} title="Undo" style={tbtnStyle(!objs.length)}>
          <RotateCcw style={{ width: '13px', height: '13px' }} />
        </button>
        <button onClick={redo} disabled={!redoStack.length} title="Redo" style={tbtnStyle(!redoStack.length)}>
          <Redo style={{ width: '13px', height: '13px' }} />
        </button>
        <button onClick={download} title="Download" style={tbtnStyle(false, '#2ecc71')}>
          <Download style={{ width: '13px', height: '13px' }} />
        </button>
        <button onClick={clear} disabled={!objs.length} title="Clear all" style={tbtnStyle(!objs.length, '#e74c3c')}>
          <Trash2 style={{ width: '13px', height: '13px' }} />
        </button>

        <div style={{ flex: 1 }} />

        {/* Close */}
        <button onClick={onClose} title="Close (Esc)"
          style={{
            display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '5px',
            cursor: 'pointer', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)',
            color: '#e74c3c', fontSize: '11px', fontWeight: 700,
          }}
        >
          <X style={{ width: '13px', height: '13px' }} />
          Close
        </button>
      </div>

      {/* ── Canvas ── */}
      <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#ffffff' }}>
        {/* Subtle dot grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, #ddd 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.6,
        }} />

        <canvas
          ref={canvasRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            cursor: tool === 'text' ? 'text' : tool === 'eraser' ? 'cell' : 'crosshair',
          }}
        />

        {/* Floating text input */}
        {showText && (
          <div style={{ position: 'absolute', left: textPos.x, top: textPos.y - 22, zIndex: 10 }}>
            <input
              ref={textRef}
              value={textVal}
              onChange={e => setTextVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commitText(); if (e.key === 'Escape') { setShowText(false); setTextVal(''); } }}
              onBlur={commitText}
              placeholder="Type here…"
              style={{
                background: 'rgba(255,255,255,0.95)', border: `2px solid ${color}`,
                borderRadius: '4px', padding: '4px 8px',
                color, fontSize: `${Math.max(16, size * 5)}px`,
                fontFamily: "'Segoe UI', sans-serif",
                outline: 'none', minWidth: '140px',
                boxShadow: `0 2px 12px ${color}33`,
              }}
            />
            <div style={{ fontSize: '10px', color: '#aaa', marginTop: '3px' }}>Enter → commit · Esc → cancel</div>
          </div>
        )}

        {/* Empty hint */}
        {objs.length === 0 && !drawing && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{ textAlign: 'center' }}>
              <Pen style={{ width: '32px', height: '32px', color: '#ddd', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#ccc' }}>Start drawing</p>
              <p style={{ fontSize: '12px', color: '#ddd', marginTop: '5px' }}>Pick a tool above and draw anything</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const tbtnStyle = (dis: boolean, activeColor?: string): React.CSSProperties => ({
  padding: '5px', borderRadius: '5px', cursor: dis ? 'not-allowed' : 'pointer',
  background: 'rgba(0,0,0,0.04)', border: '1px solid #ddd',
  color: dis ? '#ccc' : (activeColor || '#555'),
  opacity: dis ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.12s',
});

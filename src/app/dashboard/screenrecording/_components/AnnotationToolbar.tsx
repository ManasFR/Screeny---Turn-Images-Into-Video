'use client';

import { Pen, Highlighter, Type, ArrowUpRight, Square, Circle, Eraser, Trash2, Minus, Plus } from 'lucide-react';
import { ToolType } from '@/hooks/useAnnotation';

interface AnnotationToolbarProps {
  tool: ToolType;
  color: string;
  size: number;
  onToolChange: (t: ToolType) => void;
  onColorChange: (c: string) => void;
  onSizeChange: (s: number) => void;
  onClear: () => void;
  penColors: string[];
  highlightColors: string[];
}

const TOOLS: { type: ToolType; icon: React.ElementType; label: string; accent: string }[] = [
  { type: 'pen',         icon: Pen,         label: 'Pen',    accent: '#818cf8' },
  { type: 'highlighter', icon: Highlighter,  label: 'HL',     accent: '#facc15' },
  { type: 'text',        icon: Type,         label: 'Text',   accent: '#34d399' },
  { type: 'arrow',       icon: ArrowUpRight, label: 'Arrow',  accent: '#60a5fa' },
  { type: 'rectangle',   icon: Square,       label: 'Rect',   accent: '#f472b6' },
  { type: 'circle',      icon: Circle,       label: 'Circle', accent: '#fb923c' },
  { type: 'eraser',      icon: Eraser,       label: 'Erase',  accent: '#94a3b8' },
];

const AnnotationToolbar = ({
  tool, color, size,
  onToolChange, onColorChange, onSizeChange,
  onClear, penColors, highlightColors,
}: AnnotationToolbarProps) => {
  const isHighlighter = tool === 'highlighter';
  const colors = isHighlighter ? highlightColors : penColors;

  return (
    <div style={{
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 0',
      }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Tools
        </span>
        <button onClick={onClear} style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '4px 8px', borderRadius: '6px', cursor: 'pointer',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          color: '#f87171', fontSize: '10px', fontWeight: 600, transition: 'all 0.2s ease',
        }}>
          <Trash2 style={{ width: '10px', height: '10px' }} />
          Clear
        </button>
      </div>

      {/* Tool grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
        {TOOLS.map(({ type, icon: Icon, label, accent }) => {
          const isActive = tool === type;
          return (
            <button key={type} onClick={() => onToolChange(isActive ? 'none' : type)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                padding: '8px 4px', borderRadius: '8px', cursor: 'pointer',
                background: isActive ? `${accent}15` : '#27272a',
                border: `1px solid ${isActive ? accent + '50' : '#3f3f46'}`,
                color: isActive ? accent : '#a1a1aa',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? `0 0 12px ${accent}10` : '0 1px 2px rgba(0,0,0,0.2)',
              }}
            >
              <Icon style={{ width: '14px', height: '14px' }} />
              <span style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.02em' }}>{label}</span>
            </button>
          );
        })}

        {/* Off */}
        <button onClick={() => onToolChange('none')}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
            padding: '8px 4px', borderRadius: '8px', cursor: 'pointer',
            background: tool === 'none' ? '#3f3f46' : '#27272a',
            border: `1px solid ${tool === 'none' ? '#52525b' : '#3f3f46'}`,
            color: tool === 'none' ? '#f4f4f5' : '#a1a1aa', transition: 'all 0.15s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}
        >
          <span style={{ fontSize: '14px', lineHeight: 1, fontWeight: 300 }}>✕</span>
          <span style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.02em' }}>Off</span>
        </button>
      </div>

      <div style={{ height: '1px', background: '#27272a', margin: '4px 0' }} />

      {/* Colors */}
      {tool !== 'none' && tool !== 'eraser' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Color</p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {colors.map(c => (
              <button key={c} onClick={() => onColorChange(c)}
                style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: c, cursor: 'pointer',
                  border: `2px solid ${color === c ? '#ffffff' : 'transparent'}`,
                  boxShadow: color === c ? `0 0 0 2px ${c}80` : '0 2px 4px rgba(0,0,0,0.4)',
                  transform: color === c ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            ))}
            <label style={{ position: 'relative', width: '20px', height: '20px', cursor: 'pointer' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'conic-gradient(red,yellow,green,cyan,blue,magenta,red)', border: '1px solid rgba(255,255,255,0.2)' }} />
              <input type="color" value={color} onChange={e => onColorChange(e.target.value)}
                style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
            </label>
          </div>
        </div>
      )}

      {/* Size */}
      {tool !== 'none' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Stroke Size</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => onSizeChange(Math.max(1, size - 1))}
              style={{ width: '24px', height: '24px', borderRadius: '6px', cursor: 'pointer', background: '#27272a', border: '1px solid #3f3f46', color: '#a1a1aa', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}>
              <Minus style={{ width: '12px', height: '12px' }} />
            </button>
            <div style={{ flex: 1, position: 'relative', height: '20px', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', width: '100%', height: '4px', borderRadius: '2px', background: '#27272a' }} />
              <div style={{ position: 'absolute', height: '4px', borderRadius: '2px', background: '#6366f1', width: `${((size - 1) / 9) * 100}%` }} />
              <input type="range" min={1} max={10} value={size} onChange={e => onSizeChange(parseInt(e.target.value))}
                style={{ position: 'absolute', width: '100%', opacity: 0, cursor: 'pointer', height: '20px', zIndex: 2 }} />
              <div style={{
                position: 'absolute', left: `calc(${((size - 1) / 9) * 100}% - 7px)`,
                width: '14px', height: '14px', borderRadius: '50%',
                background: '#ffffff', border: '2px solid #6366f1', pointerEvents: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }} />
            </div>
            <button onClick={() => onSizeChange(Math.min(10, size + 1))}
              style={{ width: '24px', height: '24px', borderRadius: '6px', cursor: 'pointer', background: '#27272a', border: '1px solid #3f3f46', color: '#a1a1aa', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}>
              <Plus style={{ width: '12px', height: '12px' }} />
            </button>
            <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'monospace', color: '#f4f4f5', minWidth: '16px', textAlign: 'right' }}>{size}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnotationToolbar;
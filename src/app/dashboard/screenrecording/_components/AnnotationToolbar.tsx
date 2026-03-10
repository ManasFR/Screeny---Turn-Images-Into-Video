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
  { type: 'pen',         icon: Pen,         label: 'Pen',    accent: '#6366f1' },
  { type: 'highlighter', icon: Highlighter,  label: 'HL',     accent: '#FACC15' },
  { type: 'text',        icon: Type,         label: 'Text',   accent: '#34D399' },
  { type: 'arrow',       icon: ArrowUpRight, label: 'Arrow',  accent: '#60A5FA' },
  { type: 'rectangle',   icon: Square,       label: 'Rect',   accent: '#F472B6' },
  { type: 'circle',      icon: Circle,       label: 'Circle', accent: '#FB923C' },
  { type: 'eraser',      icon: Eraser,       label: 'Erase',  accent: '#94A3B8' },
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
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      display: 'flex', flexDirection: 'column', gap: '6px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '2px 0',
      }}>
        <span style={{ fontSize: '9px', fontWeight: 700, color: '#666', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
          Annotations
        </span>
        <button onClick={onClear} style={{
          display: 'flex', alignItems: 'center', gap: '3px',
          padding: '2px 6px', borderRadius: '3px', cursor: 'pointer',
          background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)',
          color: 'rgba(231,76,60,0.9)', fontSize: '9px', fontWeight: 600,
        }}>
          <Trash2 style={{ width: '9px', height: '9px' }} />
          Clear
        </button>
      </div>

      {/* Tool grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '3px' }}>
        {TOOLS.map(({ type, icon: Icon, label, accent }) => {
          const isActive = tool === type;
          return (
            <button key={type} onClick={() => onToolChange(isActive ? 'none' : type)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                padding: '5px 3px', borderRadius: '4px', cursor: 'pointer',
                background: isActive ? `${accent}20` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isActive ? accent + '60' : '#333'}`,
                color: isActive ? accent : '#666',
                transition: 'all 0.12s',
                boxShadow: isActive ? `0 0 6px ${accent}25` : 'none',
              }}
            >
              <Icon style={{ width: '11px', height: '11px' }} />
              <span style={{ fontSize: '8px', fontWeight: 600 }}>{label}</span>
            </button>
          );
        })}

        {/* Off */}
        <button onClick={() => onToolChange('none')}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
            padding: '5px 3px', borderRadius: '4px', cursor: 'pointer',
            background: tool === 'none' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${tool === 'none' ? '#555' : '#333'}`,
            color: tool === 'none' ? '#ccc' : '#555', transition: 'all 0.12s',
          }}
        >
          <span style={{ fontSize: '11px', lineHeight: 1 }}>✕</span>
          <span style={{ fontSize: '8px', fontWeight: 600 }}>Off</span>
        </button>
      </div>

      {/* Colors */}
      {tool !== 'none' && tool !== 'eraser' && (
        <div>
          <p style={{ fontSize: '9px', fontWeight: 700, color: '#555', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '4px' }}>Color</p>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' as const }}>
            {colors.map(c => (
              <button key={c} onClick={() => onColorChange(c)}
                style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: c, cursor: 'pointer',
                  border: `2px solid ${color === c ? '#fff' : 'transparent'}`,
                  boxShadow: color === c ? `0 0 0 1px ${c}` : '0 1px 2px rgba(0,0,0,0.4)',
                  transform: color === c ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.12s',
                }}
              />
            ))}
            <label style={{ position: 'relative', width: '18px', height: '18px', cursor: 'pointer' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'conic-gradient(red,yellow,green,cyan,blue,magenta,red)', border: '2px solid rgba(255,255,255,0.2)' }} />
              <input type="color" value={color} onChange={e => onColorChange(e.target.value)}
                style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
            </label>
          </div>
        </div>
      )}

      {/* Size */}
      {tool !== 'none' && (
        <div>
          <p style={{ fontSize: '9px', fontWeight: 700, color: '#555', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '4px' }}>Size</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button onClick={() => onSizeChange(Math.max(1, size - 1))}
              style={{ width: '20px', height: '20px', borderRadius: '3px', cursor: 'pointer', background: '#252525', border: '1px solid #3a3a3a', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Minus style={{ width: '9px', height: '9px' }} />
            </button>
            <div style={{ flex: 1, position: 'relative', height: '16px', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', width: '100%', height: '3px', borderRadius: '2px', background: '#2a2a2a' }} />
              <div style={{ position: 'absolute', height: '3px', borderRadius: '2px', background: '#6366f1', width: `${((size - 1) / 9) * 100}%` }} />
              <input type="range" min={1} max={10} value={size} onChange={e => onSizeChange(parseInt(e.target.value))}
                style={{ position: 'absolute', width: '100%', opacity: 0, cursor: 'pointer', height: '16px', zIndex: 2 }} />
              <div style={{
                position: 'absolute', left: `calc(${((size - 1) / 9) * 100}% - 6px)`,
                width: '12px', height: '12px', borderRadius: '50%',
                background: '#fff', border: '2px solid #6366f1', pointerEvents: 'none',
              }} />
            </div>
            <button onClick={() => onSizeChange(Math.min(10, size + 1))}
              style={{ width: '20px', height: '20px', borderRadius: '3px', cursor: 'pointer', background: '#252525', border: '1px solid #3a3a3a', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus style={{ width: '9px', height: '9px' }} />
            </button>
            <span style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'monospace', color: '#555', minWidth: '14px', textAlign: 'right' }}>{size}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnotationToolbar;

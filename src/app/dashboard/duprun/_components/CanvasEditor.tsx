'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus } from 'lucide-react';
import { Slide, ZoomPoint } from '@/types/duprun';
import { useAnnotation } from '@/hooks/useAnnotation';

// Annotation toolbar inline
const TOOLS = [
  { type: 'pen' as const,       label: 'Pen',       icon: '✏️' },
  { type: 'highlighter' as const, label: 'Highlight', icon: '🖍️' },
  { type: 'arrow' as const,     label: 'Arrow',     icon: '↗️' },
  { type: 'rectangle' as const, label: 'Rect',      icon: '▭'  },
  { type: 'circle' as const,    label: 'Circle',    icon: '⬤'  },
  { type: 'text' as const,      label: 'Text',      icon: 'T'  },
  { type: 'blur' as const,      label: 'Blur',      icon: '◫'  },
  { type: 'eraser' as const,    label: 'Erase',     icon: '⌫'  },
];

const QUICK_COLORS = ['#FFFFFF', '#EF4444', '#FACC15', '#22C55E', '#3B82F6', '#A855F7', '#F97316'];

interface CanvasEditorProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  slides: Slide[];
  currentSlide: Slide | null;
  currentSlideIndex: number;
  currentPointIndex: number;
  isPlaying: boolean;
  slideTransition: number;
  onCanvasClick: (event: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (event: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
  onPointMouseDown: (event: React.MouseEvent<HTMLDivElement>, pointId: number) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  // annotation canvas ref (passed up so recording can composite)
  annotationCanvasRef?: React.RefObject<HTMLCanvasElement>;
}

const NavBtn = ({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) => (
  <button onClick={onClick} disabled={disabled} style={{
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '6px 14px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
    background: disabled ? 'transparent' : 'rgba(255,255,255,0.05)',
    border: '1px solid', borderColor: disabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)',
    color: disabled ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.7)',
  }}>
    {children}
  </button>
);

const CanvasEditor = ({
  canvasRef, slides, currentSlide, currentSlideIndex, currentPointIndex,
  isPlaying, slideTransition, onCanvasClick, onMouseMove, onMouseUp,
  onPointMouseDown, onNavigate, annotationCanvasRef: externalAnnotRef,
}: CanvasEditorProps) => {
  const internalAnnotRef = useRef<HTMLCanvasElement>(null);
  const annotRef = externalAnnotRef ?? internalAnnotRef;
  const annot = useAnnotation(annotRef as React.RefObject<HTMLCanvasElement>);

  const isFirst = currentSlideIndex === 0;
  const isLast  = currentSlideIndex === slides.length - 1;
  const annotActive = annot.tool !== 'none';

  const cursor = annotActive
    ? annot.tool === 'eraser' ? 'cell'
    : annot.tool === 'text'   ? 'text'
    : annot.tool === 'blur'   ? 'crosshair'
    : 'crosshair'
    : 'crosshair';

  return (
    <div style={{ borderRadius: '20px', overflow: 'hidden', background: 'linear-gradient(160deg,#111114,#0a0a0d)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 28px 70px rgba(0,0,0,0.7)' }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {slides.length > 1 ? (
          <>
            <NavBtn onClick={() => onNavigate('prev')} disabled={isFirst}>
              <ChevronLeft style={{ width: '14px', height: '14px' }} /> Prev
            </NavBtn>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {slides.map((_, i) => (
                  <div key={i} style={{
                    height: '5px', width: i === currentSlideIndex ? '20px' : '5px',
                    borderRadius: '99px', transition: 'all 0.25s',
                    background: i === currentSlideIndex ? 'rgba(99,102,241,0.9)' : 'rgba(255,255,255,0.14)',
                    boxShadow: i === currentSlideIndex ? '0 0 6px rgba(99,102,241,0.5)' : 'none',
                  }} />
                ))}
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>
                {currentSlideIndex + 1} / {slides.length}
              </span>
            </div>
            <NavBtn onClick={() => onNavigate('next')} disabled={isLast}>
              Next <ChevronRight style={{ width: '14px', height: '14px' }} />
            </NavBtn>
          </>
        ) : (
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em' }}>
              STUDIO CANVAS
            </span>
          </div>
        )}
      </div>

      {/* ── Annotation toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        flexWrap: 'wrap',
      }}>
        {/* Tool pills */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {/* None */}
          <button
            onClick={() => annot.setTool('none')}
            title="Pointer (disable drawing)"
            style={{
              padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '10px', fontWeight: 600,
              background: annot.tool === 'none' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
              border: '1px solid', borderColor: annot.tool === 'none' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)',
              color: annot.tool === 'none' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)',
              transition: 'all 0.12s',
            }}
          >
            ↖ Off
          </button>

          {TOOLS.map(({ type, label, icon }) => {
            const isActive = annot.tool === type;
            return (
              <button key={type} onClick={() => annot.setTool(type)} title={label} style={{
                padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: isActive ? 700 : 500,
                background: isActive ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                border: '1px solid', borderColor: isActive ? 'rgba(99,102,241,0.55)' : 'rgba(255,255,255,0.07)',
                color: isActive ? 'rgba(165,180,252,1)' : 'rgba(255,255,255,0.4)',
                boxShadow: isActive ? '0 0 10px rgba(99,102,241,0.2)' : 'none',
                transition: 'all 0.12s',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                <span style={{ fontSize: '12px' }}>{icon}</span>
                <span style={{ fontSize: '10px' }}>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Separator */}
        <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

        {/* Colors */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {QUICK_COLORS.map(c => (
            <button key={c} onClick={() => annot.setColor(c)} style={{
              width: '18px', height: '18px', borderRadius: '50%', background: c, cursor: 'pointer',
              border: '2px solid', borderColor: annot.color === c ? '#fff' : 'transparent',
              transform: annot.color === c ? 'scale(1.2)' : 'scale(1)',
              boxShadow: annot.color === c ? `0 0 6px ${c}` : 'none',
              transition: 'all 0.12s',
            }} />
          ))}
          <label style={{ position: 'relative', cursor: 'pointer' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'conic-gradient(red,yellow,green,cyan,blue,magenta,red)', border: '1.5px solid rgba(255,255,255,0.2)' }} />
            <input type="color" value={annot.color} onChange={e => annot.setColor(e.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
          </label>
        </div>

        {/* Separator */}
        <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

        {/* Size */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <button onClick={() => annot.setSize(Math.max(1, annot.size - 1))} style={{ width: '22px', height: '22px', borderRadius: '6px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.5)', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)', minWidth: '18px', textAlign: 'center' as const }}>{annot.size}</span>
          <button onClick={() => annot.setSize(Math.min(16, annot.size + 1))} style={{ width: '22px', height: '22px', borderRadius: '6px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.5)', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
        </div>

        {/* Clear */}
        {annotActive && (
          <button onClick={annot.clearCanvas} style={{
            marginLeft: 'auto', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            color: 'rgba(252,165,165,0.8)', fontSize: '10px', fontWeight: 600,
          }}>
            Clear
          </button>
        )}
      </div>

      {/* ── Canvas area ── */}
      <div style={{ padding: '16px', position: 'relative' }}>
        <div style={{ position: 'relative', width: '100%' }}>

          {/* Main canvas */}
          <canvas
            ref={canvasRef}
            onClick={annotActive ? undefined : onCanvasClick}
            onMouseMove={annotActive ? undefined : onMouseMove}
            onMouseUp={annotActive ? undefined : onMouseUp}
            onMouseLeave={annotActive ? undefined : onMouseUp}
            width={1440} height={810}
            style={{
              width: '100%', height: 'auto', display: 'block',
              borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)',
              background: '#000', cursor: annotActive ? 'default' : 'crosshair',
              boxShadow: '0 6px 30px rgba(0,0,0,0.6)',
            }}
          />

          {/* Annotation overlay canvas */}
          <canvas
            ref={annotRef}
            width={1440} height={810}
            onClick={!annotActive ? onCanvasClick : undefined}
            onMouseDown={annotActive ? annot.onMouseDown : undefined}
            onMouseMove={annotActive ? annot.onMouseMove : onMouseMove}
            onMouseUp={e => { annot.onMouseUp(); if (!annotActive) onMouseUp(); }}
            onMouseLeave={e => { annot.onMouseUp(); if (!annotActive) onMouseUp(); }}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              borderRadius: '12px', cursor, pointerEvents: 'all',
            }}
          />

          {/* Text input for annotation */}
          {annot.showTextInput && annot.textPos && (
            <div style={{
              position: 'absolute',
              left: `${(annot.textPos.x / 1440) * 100}%`,
              top:  `${(annot.textPos.y / 810)  * 100}%`,
              zIndex: 20, display: 'flex', gap: '6px', transform: 'translateY(-100%)',
            }}>
              <input
                autoFocus type="text" value={annot.textInput}
                onChange={e => annot.setTextInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') annot.commitText(); }}
                placeholder="Type text…"
                style={{
                  padding: '6px 10px', borderRadius: '9px',
                  background: 'rgba(0,0,0,0.9)', border: '1.5px solid rgba(99,102,241,0.6)',
                  color: '#fff', fontSize: '13px', fontFamily: "'Plus Jakarta Sans',sans-serif",
                  outline: 'none', minWidth: '140px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                }}
              />
              <button onClick={annot.commitText} style={{ padding: '6px 12px', borderRadius: '9px', background: 'rgba(99,102,241,0.85)', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Add</button>
            </div>
          )}

          {/* Zoom point markers */}
          {!isPlaying && currentSlide && slideTransition === 0 &&
            currentSlide.zoomPoints.map((point: ZoomPoint, index: number) => {
              const isActive = index === currentPointIndex;
              return (
                <div key={point.id} onMouseDown={e => onPointMouseDown(e, point.id)} style={{
                  position: 'absolute',
                  left: `${point.x * 100}%`, top: `${point.y * 100}%`,
                  transform: 'translate(-50%,-50%)',
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: isActive ? 'rgba(239,68,68,0.95)' : 'rgba(255,255,255,0.92)',
                  border: `2px solid ${isActive ? 'rgba(239,68,68,0.4)' : 'rgba(0,0,0,0.25)'}`,
                  boxShadow: isActive ? '0 0 0 4px rgba(239,68,68,0.25), 0 3px 10px rgba(0,0,0,0.5)' : '0 0 0 3px rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'move', userSelect: 'none' as const,
                  color: isActive ? '#fff' : '#000',
                  fontSize: '9px', fontWeight: 800,
                  zIndex: 10,
                  transition: 'transform 0.15s',
                }}>
                  {index + 1}
                </div>
              );
            })
          }

          {/* Empty state */}
          {slides.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', pointerEvents: 'none' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImagePlus style={{ width: '22px', height: '22px', color: 'rgba(99,102,241,0.65)' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>No slides yet</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>Upload images from the panel on the left</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom hint */}
      {slides.length > 0 && !isPlaying && (
        <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' as const }}>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.03em' }}>
            {annotActive
              ? `Drawing mode — ${annot.tool} tool active · Click canvas to annotate`
              : 'Click canvas to place zoom points · Drag markers to reposition'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default CanvasEditor;

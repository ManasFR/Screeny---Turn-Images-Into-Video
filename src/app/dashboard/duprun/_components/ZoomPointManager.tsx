'use client';

import { Trash2, MapPin } from 'lucide-react';
import { Slide } from '@/types/duprun';

interface ZoomPointManagerProps {
  currentSlide: Slide;
  onUpdateText: (pointId: number, text: string, slideId: number) => void;
  onRemovePoint: (pointId: number, slideId: number) => void;
  onClearAll: (slideId: number) => void;
}

const ZoomPointManager = ({
  currentSlide, onUpdateText, onRemovePoint, onClearAll,
}: ZoomPointManagerProps) => {
  const pts = currentSlide.zoomPoints;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '3px', height: '18px', borderRadius: '2px', background: 'linear-gradient(180deg,#ef4444,#f87171)', boxShadow: '0 0 8px rgba(239,68,68,0.5)' }} />
          <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.65)' }}>
            Zoom Points
          </span>
          {pts.length > 0 && (
            <span style={{
              fontSize: '10px', fontWeight: 700,
              color: 'rgba(248,113,113,0.8)',
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.2)',
              padding: '1px 8px', borderRadius: '99px',
            }}>
              {pts.length}
            </span>
          )}
        </div>
        {pts.length > 0 && (
          <button
            onClick={() => onClearAll(currentSlide.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 10px', borderRadius: '8px', cursor: 'pointer',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              color: 'rgba(248,113,113,0.7)', fontSize: '10px', fontWeight: 600,
              transition: 'all 0.15s',
            }}
          >
            <Trash2 style={{ width: '10px', height: '10px' }} /> Clear All
          </button>
        )}
      </div>

      {pts.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '24px 16px', borderRadius: '14px',
          background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)',
          gap: '8px',
        }}>
          <MapPin style={{ width: '20px', height: '20px', color: 'rgba(255,255,255,0.2)' }} />
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textAlign: 'center' as const }}>
            No zoom points yet
          </p>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.18)', textAlign: 'center' as const }}>
            Click anywhere on the canvas to add a zoom point
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', paddingRight: '2px' }}>
          {pts.map((point, index) => (
            <div key={point.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '13px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              transition: 'all 0.15s',
            }}>
              {/* Number badge */}
              <div style={{
                width: '26px', height: '26px', borderRadius: '8px', flexShrink: 0,
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 800, color: 'rgba(248,113,113,0.9)',
              }}>
                {index + 1}
              </div>

              {/* Text input */}
              <input
                type="text"
                value={point.text}
                onChange={e => onUpdateText(point.id, e.target.value, currentSlide.id)}
                placeholder={`Label for point ${index + 1}`}
                style={{
                  flex: 1, padding: '7px 10px', borderRadius: '9px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '12px', fontWeight: 500,
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                  outline: 'none', transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
              />

              {/* Coords hint */}
              <span style={{
                fontSize: '9px', fontFamily: 'monospace',
                color: 'rgba(255,255,255,0.2)', flexShrink: 0,
                whiteSpace: 'nowrap' as const,
              }}>
                {(point.x * 100).toFixed(0)}%,{(point.y * 100).toFixed(0)}%
              </span>

              {/* Remove */}
              <button
                onClick={() => onRemovePoint(point.id, currentSlide.id)}
                style={{
                  width: '24px', height: '24px', borderRadius: '7px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', border: '1px solid transparent',
                  color: 'rgba(248,113,113,0.45)', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.25)'; (e.currentTarget as HTMLElement).style.color = 'rgba(248,113,113,0.9)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(248,113,113,0.45)'; }}
              >
                <Trash2 style={{ width: '11px', height: '11px' }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ZoomPointManager;

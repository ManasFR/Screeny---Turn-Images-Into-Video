'use client';

import { ChevronLeft, ChevronRight, ImagePlus } from 'lucide-react';
import { Slide, ZoomPoint } from '@/types/duprun';

interface CanvasEditorProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
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
}

const NavBtn = ({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      padding: '5px 12px',
      borderRadius: '9px',
      fontSize: '11px',
      fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.15s',
      background: disabled ? 'transparent' : 'rgba(255,255,255,0.05)',
      border: '1px solid',
      borderColor: disabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
      color: disabled ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.65)',
    }}
  >
    {children}
  </button>
);

const CanvasEditor = ({
  canvasRef,
  slides,
  currentSlide,
  currentSlideIndex,
  currentPointIndex,
  isPlaying,
  slideTransition,
  onCanvasClick,
  onMouseMove,
  onMouseUp,
  onPointMouseDown,
  onNavigate,
}: CanvasEditorProps) => {
  const isFirst = currentSlideIndex === 0;
  const isLast = currentSlideIndex === slides.length - 1;

  return (
    <div
      className="h-full flex flex-col"
      style={{
        borderRadius: '18px',
        overflow: 'hidden',
        background: 'linear-gradient(160deg, #111114 0%, #0a0a0d 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.65)',
      }}
    >
      {/* Navigation bar */}
      {slides.length > 1 && (
        <div
          className="flex items-center justify-between flex-shrink-0"
          style={{
            padding: '10px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <NavBtn onClick={() => onNavigate('prev')} disabled={isFirst}>
            <ChevronLeft style={{ width: '13px', height: '13px' }} />
            Prev
          </NavBtn>

          {/* Pill dots + counter */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1">
              {slides.map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: '5px',
                    width: i === currentSlideIndex ? '18px' : '5px',
                    borderRadius: '99px',
                    background: i === currentSlideIndex
                      ? 'rgba(99,102,241,0.9)'
                      : 'rgba(255,255,255,0.14)',
                    transition: 'all 0.25s ease',
                    boxShadow: i === currentSlideIndex ? '0 0 6px rgba(99,102,241,0.5)' : 'none',
                  }}
                />
              ))}
            </div>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.05em',
            }}>
              {currentSlideIndex + 1} / {slides.length}
            </span>
          </div>

          <NavBtn onClick={() => onNavigate('next')} disabled={isLast}>
            Next
            <ChevronRight style={{ width: '13px', height: '13px' }} />
          </NavBtn>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center min-h-0" style={{ padding: '14px' }}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <canvas
            ref={canvasRef}
            onClick={onCanvasClick}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            width={1440}
            height={810}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '100%',
              display: 'block',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: '#000',
              cursor: 'crosshair',
              boxShadow: '0 4px 24px rgba(0,0,0,0.55)',
            }}
          />

          {/* Zoom point markers */}
          {!isPlaying &&
            currentSlide &&
            slideTransition === 0 &&
            currentSlide.zoomPoints.map((point: ZoomPoint, index: number) => {
              const isActive = index === currentPointIndex;
              return (
                <div
                  key={point.id}
                  onMouseDown={e => onPointMouseDown(e, point.id)}
                  style={{
                    position: 'absolute',
                    left: `${point.x * 100}%`,
                    top: `${point.y * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: isActive ? 'rgba(239,68,68,0.95)' : 'rgba(255,255,255,0.92)',
                    border: `2px solid ${isActive ? 'rgba(239,68,68,0.4)' : 'rgba(0,0,0,0.25)'}`,
                    boxShadow: isActive
                      ? '0 0 0 3px rgba(239,68,68,0.25), 0 2px 8px rgba(0,0,0,0.5)'
                      : '0 0 0 3px rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'move',
                    userSelect: 'none',
                    color: isActive ? '#fff' : '#000',
                    fontSize: '9px',
                    fontWeight: 800,
                    transition: 'transform 0.15s',
                  }}
                >
                  {index + 1}
                </div>
              );
            })}

          {/* Empty state */}
          {slides.length === 0 && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '10px', pointerEvents: 'none',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '14px',
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ImagePlus style={{ width: '18px', height: '18px', color: 'rgba(99,102,241,0.65)' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.38)', marginBottom: '3px' }}>
                  No slides yet
                </p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>
                  Upload images from the panel
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom hint */}
      {slides.length > 0 && !isPlaying && (
        <div style={{
          padding: '7px 14px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <p style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.2)',
            letterSpacing: '0.02em',
          }}>
            Click to place zoom points · Drag markers to reposition
          </p>
        </div>
      )}
    </div>
  );
};

export default CanvasEditor;

'use client';

import { useEffect } from 'react';
import { ToolType } from '@/hooks/useAnnotation';

interface CanvasOverlayProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  tool: ToolType;
  showTextInput: boolean;
  textInput: string;
  textPos: { x: number; y: number } | null;
  onTextChange: (v: string) => void;
  onTextCommit: () => void;
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
}

const cursorForTool = (tool: ToolType): string => {
  switch (tool) {
    case 'pen': return 'crosshair';
    case 'highlighter': return 'cell';
    case 'text': return 'text';
    case 'eraser': return 'cell';
    case 'arrow':
    case 'rectangle':
    case 'circle': return 'crosshair';
    default: return 'default';
  }
};

const CanvasOverlay = ({
  canvasRef, tool,
  showTextInput, textInput, textPos,
  onTextChange, onTextCommit,
  onMouseDown, onMouseMove, onMouseUp,
}: CanvasOverlayProps) => {
  // Resize canvas to match container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [canvasRef]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: tool === 'none' ? 'none' : 'all', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          cursor: cursorForTool(tool),
          touchAction: 'none',
        }}
      />

      {/* Text input floating box */}
      {showTextInput && textPos && (
        <div style={{
          position: 'absolute',
          left: textPos.x,
          top: textPos.y - 40,
          zIndex: 10,
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          background: 'rgba(9,9,11,0.85)',
          padding: '4px',
          borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(99,102,241,0.4)',
          transform: 'translateY(-10px)',
        }}>
          <input
            autoFocus
            type="text"
            value={textInput}
            onChange={e => onTextChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onTextCommit(); if (e.key === 'Escape') onTextCommit(); }}
            placeholder="Type here…"
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '13px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 500,
              outline: 'none',
              minWidth: '160px',
            }}
          />
          <button
            onClick={onTextCommit}
            style={{
              padding: '8px 14px', borderRadius: '6px',
              background: '#6366f1',
              border: 'none', color: '#ffffff',
              fontSize: '12px', fontWeight: 600,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              cursor: 'pointer', transition: 'background 0.2s ease',
            }}
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
};

export default CanvasOverlay;
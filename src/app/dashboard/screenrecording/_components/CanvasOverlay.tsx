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
    <div style={{ position: 'absolute', inset: 0, pointerEvents: tool === 'none' ? 'none' : 'all' }}>
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
          top: textPos.y - 36,
          zIndex: 10,
          display: 'flex',
          gap: '6px',
          alignItems: 'center',
        }}>
          <input
            autoFocus
            type="text"
            value={textInput}
            onChange={e => onTextChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onTextCommit(); if (e.key === 'Escape') onTextCommit(); }}
            placeholder="Type here…"
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              background: 'rgba(0,0,0,0.85)',
              border: '1.5px solid rgba(99,102,241,0.6)',
              color: '#fff',
              fontSize: '13px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 500,
              outline: 'none',
              minWidth: '140px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            }}
          />
          <button
            onClick={onTextCommit}
            style={{
              padding: '6px 12px', borderRadius: '8px',
              background: 'rgba(99,102,241,0.8)',
              border: 'none', color: '#fff',
              fontSize: '11px', fontWeight: 700,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              cursor: 'pointer',
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

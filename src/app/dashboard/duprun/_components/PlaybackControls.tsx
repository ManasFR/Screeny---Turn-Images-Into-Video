'use client';

import { Play, Pause, Download, RotateCcw, Loader2 } from 'lucide-react';
import { PlanLimits } from '@/types/duprun';

interface PlaybackControlsProps {
  isPlaying: boolean;
  isRecording: boolean;
  totalZoomPoints: number;
  planLimits: PlanLimits | null;
  currentSlideIndex: number;
  slidesCount: number;
  progress: number;
  totalDuration: number;
  onPlay: () => void;
  onStop: () => void;
  onReset: () => void;
  onExport: () => void;
}

const PlaybackControls = ({
  isPlaying,
  isRecording,
  totalZoomPoints,
  planLimits,
  currentSlideIndex,
  slidesCount,
  progress,
  totalDuration,
  onPlay,
  onStop,
  onReset,
  onExport,
}: PlaybackControlsProps) => {
  const noPoints = totalZoomPoints === 0;
  const exportDisabled = noPoints || isPlaying || isRecording || !planLimits?.hasAccess;
  const progressPct = slidesCount > 0
    ? ((currentSlideIndex * 100 + progress * 100) / slidesCount)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Play + Reset */}
      <div className="flex gap-2">
        <button
          onClick={isPlaying ? onStop : onPlay}
          disabled={noPoints}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: noPoints ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            background: noPoints
              ? 'rgba(255,255,255,0.04)'
              : isPlaying
              ? 'rgba(239,68,68,0.18)'
              : 'rgba(99,102,241,0.22)',
            border: '1px solid',
            borderColor: noPoints
              ? 'rgba(255,255,255,0.07)'
              : isPlaying
              ? 'rgba(239,68,68,0.5)'
              : 'rgba(99,102,241,0.55)',
            color: noPoints
              ? 'rgba(255,255,255,0.2)'
              : isPlaying
              ? 'rgba(252,165,165,1)'
              : 'rgba(165,180,252,1)',
            boxShadow: noPoints
              ? 'none'
              : isPlaying
              ? '0 0 16px rgba(239,68,68,0.15)'
              : '0 0 16px rgba(99,102,241,0.2)',
          }}
        >
          {isPlaying
            ? <Pause style={{ width: '14px', height: '14px' }} />
            : <Play style={{ width: '14px', height: '14px' }} />
          }
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <button
          onClick={onReset}
          disabled={noPoints}
          style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            cursor: noPoints ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            color: noPoints ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.55)',
          }}
        >
          <RotateCcw style={{ width: '14px', height: '14px' }} />
        </button>
      </div>

      {/* Export */}
      <button
        onClick={onExport}
        disabled={exportDisabled}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '7px',
          padding: '10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 700,
          cursor: exportDisabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          background: exportDisabled
            ? 'rgba(255,255,255,0.04)'
            : 'linear-gradient(135deg, rgba(99,102,241,0.28), rgba(139,92,246,0.28))',
          border: '1px solid',
          borderColor: exportDisabled ? 'rgba(255,255,255,0.07)' : 'rgba(139,92,246,0.5)',
          color: exportDisabled ? 'rgba(255,255,255,0.2)' : 'rgba(196,181,253,1)',
          boxShadow: exportDisabled ? 'none' : '0 0 20px rgba(139,92,246,0.15)',
        }}
      >
        {isRecording
          ? <Loader2 style={{ width: '14px', height: '14px' }} className="animate-spin" />
          : <Download style={{ width: '14px', height: '14px' }} />
        }
        {isRecording ? 'Recording...' : 'Export Video'}
      </button>

      {/* Progress */}
      {(isPlaying || progress > 0) && (
        <div style={{
          borderRadius: '12px',
          padding: '10px 12px',
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)' }}>
              Progress
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 600, color: 'rgba(255,255,255,0.4)',
            }}>
              {currentSlideIndex + 1} / {slidesCount}
            </span>
          </div>

          {/* Track */}
          <div style={{
            position: 'relative', width: '100%', height: '4px',
            borderRadius: '4px', background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, height: '100%',
              width: `${progressPct.toFixed(1)}%`,
              background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
              borderRadius: '4px',
              transition: 'width 0.3s ease',
            }} />
          </div>

          <div className="flex items-center justify-between mt-2">
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.22)' }}>
              ~{Math.round(totalDuration / 1000)}s total
            </span>
            <span style={{
              fontSize: '10px',
              color: 'rgba(255,255,255,0.22)',
            }}>
              {progressPct.toFixed(0)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaybackControls;

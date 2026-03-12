'use client';

import { Play, Pause, Download, RotateCcw, Loader2, Camera, CameraOff, FlipHorizontal } from 'lucide-react';
import { PlanLimits, ExportFormat } from '@/types/duprun';

interface PlaybackControlsProps {
  isPlaying: boolean;
  isRecording: boolean;
  totalZoomPoints: number;
  planLimits: PlanLimits | null;
  currentSlideIndex: number;
  slidesCount: number;
  progress: number;
  totalDuration: number;
  formatDuration?: (ms: number) => string;
  // Export format
  exportFormat: ExportFormat;
  onExportFormatChange: (f: ExportFormat) => void;
  // Webcam
  webcamEnabled: boolean;
  webcamX: number;              setWebcamX: (v: number) => void;
  webcamY: number;              setWebcamY: (v: number) => void;
  webcamSize: number;           setWebcamSize: (v: number) => void;
  webcamMirror: boolean;        setWebcamMirror: (v: boolean) => void;
  onToggleWebcam: () => void;
  // Actions
  onPlay: () => void;
  onStop: () => void;
  onReset: () => void;
  onExport: () => void;
}

const EXPORT_FORMATS: { value: ExportFormat; label: string; sub: string; color: string }[] = [
  { value: 'webm',    label: 'WebM',     sub: 'Fast · Standard',  color: '#6366f1' },
  { value: '4k-webm', label: '4K WebM',  sub: 'Ultra HD',         color: '#8b5cf6' },
  { value: 'gif',     label: 'GIF',      sub: 'Animated · Loop',  color: '#f59e0b' },
];

const MiniSlider = ({ label, value, min, max, step = 1, onChange, unit = '', accent = '#6366f1' }: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; unit?: string; accent?: string;
}) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
        <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.3)' }}>{label}</span>
        <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.07)', padding: '1px 6px', borderRadius: '5px' }}>{value}{unit}</span>
      </div>
      <div style={{ position: 'relative', height: '16px', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', width: '100%', height: '3px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', height: '3px', borderRadius: '3px', width: `${pct}%`, background: accent }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value))}
          style={{ position: 'absolute', width: '100%', opacity: 0, height: '16px', cursor: 'pointer', zIndex: 2 }} />
        <div style={{ position: 'absolute', left: `calc(${pct}% - 6px)`, width: '12px', height: '12px', borderRadius: '50%', background: '#fff', border: `2px solid ${accent}`, pointerEvents: 'none' }} />
      </div>
    </div>
  );
};

const PlaybackControls = ({
  isPlaying, isRecording, totalZoomPoints, planLimits,
  currentSlideIndex, slidesCount, progress, totalDuration,
  exportFormat, onExportFormatChange,
  webcamEnabled, webcamX, setWebcamX, webcamY, setWebcamY,
  webcamSize, setWebcamSize, webcamMirror, setWebcamMirror, onToggleWebcam,
  onPlay, onStop, onReset, onExport,
}: PlaybackControlsProps) => {
  const noPoints       = totalZoomPoints === 0;
  const exportDisabled = noPoints || isPlaying || isRecording || !planLimits?.hasAccess;
  const progressPct    = slidesCount > 0 ? ((currentSlideIndex * 100 + progress * 100) / slidesCount) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* ── Webcam Section ── */}
      <div style={{
        borderRadius: '13px', padding: '12px',
        background: webcamEnabled ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.025)',
        border: '1px solid', borderColor: webcamEnabled ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.07)',
        transition: 'all 0.2s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: webcamEnabled ? '12px' : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: webcamEnabled ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
              border: '1px solid', borderColor: webcamEnabled ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.09)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {webcamEnabled
                ? <Camera style={{ width: '13px', height: '13px', color: 'rgba(165,180,252,0.9)' }} />
                : <CameraOff style={{ width: '13px', height: '13px', color: 'rgba(255,255,255,0.35)' }} />
              }
            </div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: webcamEnabled ? 'rgba(165,180,252,0.95)' : 'rgba(255,255,255,0.5)' }}>
                Face Cam
              </p>
              <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>
                {webcamEnabled ? '● Live — baked into video' : 'Circle webcam overlay'}
              </p>
            </div>
          </div>

          <button onClick={onToggleWebcam} style={{
            padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 700,
            background: webcamEnabled ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.15)',
            border: '1px solid', borderColor: webcamEnabled ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.35)',
            color: webcamEnabled ? 'rgba(252,165,165,0.9)' : 'rgba(165,180,252,0.9)',
            transition: 'all 0.15s',
          }}>
            {webcamEnabled ? 'Off' : 'On'}
          </button>
        </div>

        {webcamEnabled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            <MiniSlider label="X Position" value={Math.round(webcamX * 100)} min={5} max={95} onChange={v => setWebcamX(v / 100)} unit="%" accent="#6366f1" />
            <MiniSlider label="Y Position" value={Math.round(webcamY * 100)} min={5} max={95} onChange={v => setWebcamY(v / 100)} unit="%" accent="#818cf8" />
            <MiniSlider label="Size (radius)" value={webcamSize} min={40} max={180} onChange={setWebcamSize} unit="px" accent="#a78bfa" />
            <button onClick={() => setWebcamMirror(!webcamMirror)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 10px', borderRadius: '8px', cursor: 'pointer',
              background: webcamMirror ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
              border: '1px solid', borderColor: webcamMirror ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.08)',
              color: webcamMirror ? 'rgba(165,180,252,0.9)' : 'rgba(255,255,255,0.35)',
              fontSize: '11px', fontWeight: 600, transition: 'all 0.15s',
            }}>
              <FlipHorizontal style={{ width: '12px', height: '12px' }} />
              Mirror {webcamMirror ? 'ON' : 'OFF'}
            </button>
          </div>
        )}
      </div>

      {/* ── Export Format ── */}
      <div>
        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)', marginBottom: '7px' }}>
          Export Format
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {EXPORT_FORMATS.map(({ value, label, sub, color }) => {
            const isActive = exportFormat === value;
            return (
              <button key={value} onClick={() => onExportFormatChange(value)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 11px', borderRadius: '11px', cursor: 'pointer', textAlign: 'left' as const,
                background: isActive ? `${color}18` : 'rgba(255,255,255,0.03)',
                border: '1px solid', borderColor: isActive ? `${color}50` : 'rgba(255,255,255,0.07)',
                transition: 'all 0.15s',
              }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                  background: isActive ? color : 'rgba(255,255,255,0.15)',
                  boxShadow: isActive ? `0 0 8px ${color}` : 'none',
                }} />
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: isActive ? '#fff' : 'rgba(255,255,255,0.5)', display: 'block' }}>{label}</span>
                  <span style={{ fontSize: '9px', color: isActive ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)' }}>{sub}</span>
                </div>
                
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Play + Reset ── */}
      <div className="flex gap-2">
        <button onClick={isPlaying ? onStop : onPlay} disabled={noPoints} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          padding: '10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700,
          cursor: noPoints ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
          background: noPoints ? 'rgba(255,255,255,0.04)' : isPlaying ? 'rgba(239,68,68,0.18)' : 'rgba(99,102,241,0.22)',
          border: '1px solid', borderColor: noPoints ? 'rgba(255,255,255,0.07)' : isPlaying ? 'rgba(239,68,68,0.5)' : 'rgba(99,102,241,0.55)',
          color: noPoints ? 'rgba(255,255,255,0.2)' : isPlaying ? 'rgba(252,165,165,1)' : 'rgba(165,180,252,1)',
          boxShadow: noPoints ? 'none' : isPlaying ? '0 0 16px rgba(239,68,68,0.15)' : '0 0 16px rgba(99,102,241,0.2)',
        }}>
          {isPlaying ? <Pause style={{ width: '14px', height: '14px' }} /> : <Play style={{ width: '14px', height: '14px' }} />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <button onClick={onReset} disabled={noPoints} style={{
          width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '12px', cursor: noPoints ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
          color: noPoints ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.55)',
        }}>
          <RotateCcw style={{ width: '14px', height: '14px' }} />
        </button>
      </div>

      {/* ── Export ── */}
      <button onClick={onExport} disabled={exportDisabled} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
        padding: '10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700,
        cursor: exportDisabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
        background: exportDisabled ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg, rgba(99,102,241,0.28), rgba(139,92,246,0.28))',
        border: '1px solid', borderColor: exportDisabled ? 'rgba(255,255,255,0.07)' : 'rgba(139,92,246,0.5)',
        color: exportDisabled ? 'rgba(255,255,255,0.2)' : 'rgba(196,181,253,1)',
        boxShadow: exportDisabled ? 'none' : '0 0 20px rgba(139,92,246,0.15)',
      }}>
        {isRecording
          ? <Loader2 style={{ width: '14px', height: '14px' }} className="animate-spin" />
          : <Download style={{ width: '14px', height: '14px' }} />
        }
        {isRecording
          ? `Recording ${exportFormat.toUpperCase()}…`
          : `Export as ${EXPORT_FORMATS.find(f => f.value === exportFormat)?.label}`
        }
      </button>

      {/* ── Progress ── */}
      {(isPlaying || progress > 0) && (
        <div style={{ borderRadius: '12px', padding: '10px 12px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)' }}>Progress</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>{currentSlideIndex + 1} / {slidesCount}</span>
          </div>
          <div style={{ position: 'relative', width: '100%', height: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${progressPct.toFixed(1)}%`, background: 'linear-gradient(90deg, #6366f1, #a78bfa)', borderRadius: '4px', transition: 'width 0.3s ease' }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.22)' }}>~{Math.round(totalDuration / 1000)}s total</span>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.22)' }}>{progressPct.toFixed(0)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaybackControls;

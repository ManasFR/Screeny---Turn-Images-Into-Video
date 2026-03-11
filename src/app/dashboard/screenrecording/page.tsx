'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Video, ChevronLeft, PenLine, Square, Pause, Play,
  RotateCcw, Download, Monitor, GripHorizontal,
} from 'lucide-react';
import { useScreenRecorder } from '@/hooks/useScreenRecorder';
import { useAnnotation } from '@/hooks/useAnnotation';
import AudioSettings from './_components/AudioSettings';
import AnnotationToolbar from './_components/AnnotationToolbar';
import CanvasOverlay from './_components/CanvasOverlay';
import WhiteboardModal from './_components/WhiteboardModal';

export default function ScreenRecordingPage() {
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const cameraVideoRef  = useRef<HTMLVideoElement>(null);
  const screenVideoRef  = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const [micAudio,         setMicAudio]         = useState(true);
  const [systemAudio,      setSystemAudio]       = useState(false);
  const [selectedMicId,    setSelectedMicId]     = useState('');
  const [selectedCameraId, setSelectedCameraId]  = useState('none');
  const [isPreviewActive,  setIsPreviewActive]   = useState(false);
  const [showWhiteboard,   setShowWhiteboard]    = useState(false);

  // ── Draggable camera bubble ──────────────────────────────────────────────
  const [camPos,     setCamPos]     = useState({ x: 16, y: 16 }); // distance from bottom-right
  const [isDragging, setIsDragging] = useState(false);
  const dragStart   = useRef({ mx: 0, my: 0, bx: 0, by: 0 });
  const previewRef  = useRef<HTMLDivElement>(null);

  const CAM_SIZE = 140; // diameter in px

  const onCamMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, bx: camPos.x, by: camPos.y };
  }, [camPos]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      const dx = dragStart.current.mx - e.clientX;
      const dy = dragStart.current.my - e.clientY;
      const container = previewRef.current;
      if (!container) return;
      const { width, height } = container.getBoundingClientRect();
      const newX = Math.max(8, Math.min(width  - CAM_SIZE - 8, dragStart.current.bx + dx));
      const newY = Math.max(8, Math.min(height - CAM_SIZE - 8, dragStart.current.by + dy));
      setCamPos({ x: newX, y: newY });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [isDragging]);

  // Touch support for mobile
  const onCamTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    dragStart.current = { mx: t.clientX, my: t.clientY, bx: camPos.x, by: camPos.y };
    setIsDragging(true);
  }, [camPos]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: TouchEvent) => {
      const t = e.touches[0];
      const dx = dragStart.current.mx - t.clientX;
      const dy = dragStart.current.my - t.clientY;
      const container = previewRef.current;
      if (!container) return;
      const { width, height } = container.getBoundingClientRect();
      const newX = Math.max(8, Math.min(width  - CAM_SIZE - 8, dragStart.current.bx + dx));
      const newY = Math.max(8, Math.min(height - CAM_SIZE - 8, dragStart.current.by + dy));
      setCamPos({ x: newX, y: newY });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => { window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp); };
  }, [isDragging]);

  const recorder   = useScreenRecorder();
  const annotation = useAnnotation(canvasRef as React.RefObject<HTMLCanvasElement>);

  // Wire display stream → screen preview <video>
  useEffect(() => {
    recorder.onStreamReadyRef.current = (stream: MediaStream) => {
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
        screenVideoRef.current.play().catch(() => {});
        setIsPreviewActive(true);
      }
    };
    recorder.onStreamStopRef.current = () => {
      if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
      setIsPreviewActive(false);
    };
  }, []);

  const isActive    = recorder.recordingState === 'recording' || recorder.recordingState === 'paused';
  const isRecording = recorder.recordingState === 'recording';
  const isPaused    = recorder.recordingState === 'paused';
  const isStopped   = recorder.recordingState === 'stopped';
  const isIdle      = recorder.recordingState === 'idle' || isStopped;

  // ── Camera live preview ──────────────────────────────────────────────────
  const startCamera = useCallback(async (id: string) => {
    // Stop old stream first
    cameraStreamRef.current?.getTracks().forEach(t => t.stop());
    cameraStreamRef.current = null;
    if (cameraVideoRef.current) cameraVideoRef.current.srcObject = null;
    if (!id || id === 'none') return;

    try {
      const videoConstraint =
        id && id !== 'default' && id !== ''
          ? { deviceId: { exact: id }, width: { ideal: 640 }, height: { ideal: 480 } }
          : { width: { ideal: 640 }, height: { ideal: 480 } };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraint,
        audio: false,
      });
      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        await cameraVideoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error('Camera failed to start:', err);
    }
  }, []);

  useEffect(() => {
    if (selectedCameraId && selectedCameraId !== 'none') {
      startCamera(selectedCameraId);
    } else {
      cameraStreamRef.current?.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
      if (cameraVideoRef.current) cameraVideoRef.current.srcObject = null;
    }
    return () => {
      cameraStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [selectedCameraId]);

  // ── Recording controls ───────────────────────────────────────────────────
  const handleStart = async () => {
    await recorder.startRecording({
      micAudio,
      systemAudio,
      micDeviceId: selectedMicId,
      cameraStream: cameraStreamRef.current, // ← pass camera into recorder
    });
  };

  const handleStop  = () => { recorder.stopRecording();  annotation.clearCanvas(); };
  const handleReset = () => { recorder.resetRecording(); annotation.clearCanvas(); };

  const hasCamera = selectedCameraId && selectedCameraId !== 'none';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        @keyframes blink  { 0%,100%{opacity:1}  50%{opacity:0.3} }
        @keyframes pulse  { 0%,100%{transform:scale(1)} 50%{transform:scale(0.85)} }
        @keyframes camPop { 0%{transform:scale(0.7);opacity:0} 100%{transform:scale(1);opacity:1} }
        select, input, button { font-family: 'Plus Jakarta Sans', sans-serif; outline: none; border: none; }
      `}</style>

      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        background: '#1a1a1a', color: '#ccc', overflow: 'hidden',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>

        {/* ── Title bar ───────────────────────────────────────────────────── */}
        <div style={{
          height: '38px', flexShrink: 0,
          background: 'linear-gradient(180deg,#3a3a3a 0%,#2d2d2d 100%)',
          borderBottom: '2px solid #141414',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link href="/dashboard/duprun" style={{ color: '#666', display: 'flex', alignItems: 'center' }}>
              <ChevronLeft style={{ width: '16px', height: '16px' }} />
            </Link>
            <div style={{ width: '1px', height: '18px', background: '#3e3e3e' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '6px',
                background: 'linear-gradient(135deg,#e74c3c,#c0392b)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 10px rgba(231,76,60,0.35)',
              }}>
                <Video style={{ width: '12px', height: '12px', color: '#fff' }} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#d8d8d8', letterSpacing: '-0.01em' }}>
                Screen Recorder
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Live status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: isRecording ? '#e74c3c' : isPaused ? '#f39c12' : '#4a4a4a',
                boxShadow: isRecording ? '0 0 8px #e74c3c' : 'none',
                animation: isRecording ? 'blink 1.2s infinite' : 'none',
              }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: isRecording ? '#e8a0a0' : isPaused ? '#f5c842' : '#555', letterSpacing: '0.06em' }}>
                {isRecording ? 'REC' : isPaused ? 'PAUSED' : 'READY'}
              </span>
              {isActive && (
                <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#999', marginLeft: '2px' }}>
                  {recorder.formatDuration(recorder.duration)}
                </span>
              )}
            </div>

            {/* Whiteboard button */}
            <button
              onClick={() => setShowWhiteboard(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '4px 11px', borderRadius: '5px', cursor: 'pointer',
                background: showWhiteboard ? 'rgba(99,102,241,0.25)' : '#2e2e2e',
                border: `1px solid ${showWhiteboard ? '#6366f1' : '#454545'}`,
                color: showWhiteboard ? '#a5b4fc' : '#999',
                fontSize: '11px', fontWeight: 600,
                boxShadow: showWhiteboard ? '0 0 10px rgba(99,102,241,0.3)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <PenLine style={{ width: '12px', height: '12px' }} />
              Whiteboard
            </button>
          </div>
        </div>

        {/* ── Main preview ─────────────────────────────────────────────────── */}
        <div
          ref={previewRef}
          style={{
            flex: 1, minHeight: 0, position: 'relative',
            background: '#0a0a0a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Screen capture live preview */}
          <video
            ref={screenVideoRef}
            autoPlay playsInline muted
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'contain', background: '#000',
              display: isPreviewActive ? 'block' : 'none',
            }}
          />

          {/* ── Draggable circular camera bubble ── */}
          {hasCamera && (
            <div
              onMouseDown={onCamMouseDown}
              onTouchStart={onCamTouchStart}
              style={{
                position: 'absolute',
                // position from bottom-right corner
                right:  camPos.x,
                bottom: camPos.y,
                width:  `${CAM_SIZE}px`,
                height: `${CAM_SIZE}px`,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid rgba(255,255,255,0.2)',
                boxShadow: `
                  0 0 0 1px rgba(0,0,0,0.4),
                  0 8px 32px rgba(0,0,0,0.6),
                  ${isRecording ? '0 0 20px rgba(231,76,60,0.5)' : ''}
                `,
                cursor: isDragging ? 'grabbing' : 'grab',
                zIndex: 10,
                userSelect: 'none',
                animation: 'camPop 0.25s ease',
                background: '#111',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            >
              <video
                ref={cameraVideoRef}
                autoPlay playsInline muted
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)', // mirror like a selfie cam
                  pointerEvents: 'none',
                }}
              />

              {/* Drag handle hint */}
              <div style={{
                position: 'absolute', bottom: '6px', left: '50%', transform: 'translateX(-50%)',
                opacity: 0.35, pointerEvents: 'none',
              }}>
                <GripHorizontal style={{ width: '14px', height: '14px', color: '#fff' }} />
              </div>

              {/* Recording ring pulse */}
              {isRecording && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  border: '2px solid rgba(231,76,60,0.7)',
                  animation: 'pulse 1.2s infinite',
                  pointerEvents: 'none',
                }} />
              )}
            </div>
          )}

          {/* Empty state */}
          {!isPreviewActive && !hasCamera && (
            <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '14px', margin: '0 auto 14px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Monitor style={{ width: '24px', height: '24px', color: 'rgba(255,255,255,0.15)' }} />
              </div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.2)' }}>No source selected</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.1)', marginTop: '5px' }}>
                Enable camera below or start recording
              </p>
            </div>
          )}

          {/* Recording indicator badge */}
          {isPreviewActive && (
            <div style={{
              position: 'absolute', top: 12, left: 12, zIndex: 10,
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '5px 11px', borderRadius: '5px',
              background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(231,76,60,0.35)',
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e74c3c', boxShadow: '0 0 8px #e74c3c', animation: 'blink 1.2s infinite' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#e8a0a0', letterSpacing: '0.06em' }}>REC</span>
              <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#ddd' }}>
                {recorder.formatDuration(recorder.duration)}
              </span>
            </div>
          )}

          {/* Countdown overlay */}
          {recorder.recordingState === 'countdown' && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '110px', fontWeight: 800, color: '#e74c3c', textShadow: '0 0 40px rgba(231,76,60,0.5)', lineHeight: 1 }}>
                  {recorder.countdown}
                </div>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', marginTop: '10px', fontWeight: 500 }}>
                  Recording starts in…
                </p>
              </div>
            </div>
          )}

          {/* Red border glow while recording */}
          {isRecording && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: 'inset 0 0 0 3px rgba(231,76,60,0.55)' }} />
          )}

          {/* Canvas annotation overlay */}
          <CanvasOverlay
            canvasRef={canvasRef as React.RefObject<HTMLCanvasElement>}
            tool={annotation.tool}
            showTextInput={annotation.showTextInput}
            textInput={annotation.textInput}
            textPos={annotation.textPos}
            onTextChange={annotation.setTextInput}
            onTextCommit={annotation.commitText}
            onMouseDown={annotation.onMouseDown}
            onMouseMove={annotation.onMouseMove}
            onMouseUp={annotation.onMouseUp}
          />
        </div>

        {/* ── Bottom panels ─────────────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0,
          display: 'flex',
          height: '280px',
          background: '#1e1e1e',
          borderTop: '2px solid #111',
        }}>

          {/* Annotation panel */}
          <div style={{ width: '190px', flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #111' }}>
            <PanelHeader label="Annotation" />
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px', background: '#1a1a1a' }}>
              <AnnotationToolbar
                tool={annotation.tool}
                color={annotation.color}
                size={annotation.size}
                onToolChange={annotation.setTool}
                onColorChange={annotation.setColor}
                onSizeChange={annotation.setSize}
                onClear={annotation.clearCanvas}
                penColors={annotation.PEN_COLORS}
                highlightColors={annotation.HIGHLIGHT_COLORS}
              />
            </div>
          </div>

          {/* Audio Mixer panel */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #111' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px', background: '#1a1a1a' }}>
              <AudioSettings
                micAudio={micAudio}
                systemAudio={systemAudio}
                selectedMicId={selectedMicId}
                selectedCameraId={selectedCameraId}
                onMicToggle={() => setMicAudio(v => !v)}
                onSystemToggle={() => setSystemAudio(v => !v)}
                onMicDeviceChange={setSelectedMicId}
                onCameraDeviceChange={setSelectedCameraId}
                disabled={isActive}
              />
            </div>
          </div>

          {/* Controls panel */}
          <div style={{ width: '156px', flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#1e1e1e' }}>
            <PanelHeader label="Controls" />
            <div style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: '5px', background: '#1a1a1a' }}>

              {isIdle && (
                <button onClick={handleStart} style={ctrlBtn('#c0392b', true)}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 6px rgba(255,255,255,0.8)', flexShrink: 0 }} />
                  Start Recording
                </button>
              )}

              {isActive && (
                <button onClick={handleStop} style={ctrlBtn('#7a1f1f')}>
                  <Square style={{ width: '11px', height: '11px', flexShrink: 0 }} />
                  Stop & Save
                </button>
              )}

              {isRecording && (
                <button onClick={recorder.pauseRecording} style={ctrlBtn('#3a3a3a')}>
                  <Pause style={{ width: '11px', height: '11px', flexShrink: 0 }} />
                  Pause
                </button>
              )}
              {isPaused && (
                <button onClick={recorder.resumeRecording} style={ctrlBtn('#1a3a1a')}>
                  <Play style={{ width: '11px', height: '11px', flexShrink: 0 }} />
                  Resume
                </button>
              )}

              {isActive && (
                <button onClick={handleReset} style={ctrlBtn('#2a2a2a')}>
                  <RotateCcw style={{ width: '11px', height: '11px', flexShrink: 0 }} />
                  Discard
                </button>
              )}

              {isStopped && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 10px', borderRadius: '4px',
                  background: '#0d2e1a', border: '1px solid #1a5c30',
                }}>
                  <Download style={{ width: '12px', height: '12px', color: '#4caf50', flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: '#4caf50', fontWeight: 600 }}>Saved to Downloads</span>
                </div>
              )}

              {recorder.error && (
                <div style={{
                  padding: '6px 8px', borderRadius: '4px',
                  background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)',
                  fontSize: '10px', color: '#e8a0a0', fontWeight: 500, lineHeight: 1.4,
                }}>
                  {recorder.error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Status bar ────────────────────────────────────────────────────── */}
        <div style={{
          height: '22px', flexShrink: 0,
          background: '#141414', borderTop: '1px solid #0e0e0e',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 14px',
        }}>
          <span style={{ fontSize: '10px', color: '#3a3a3a', fontFamily: 'monospace' }}>
            ⏺ REC: {recorder.formatDuration(isActive ? recorder.duration : 0)}
          </span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ fontSize: '10px', color: '#3a3a3a', fontFamily: 'monospace' }}>
              {hasCamera ? '📷 CAM ON' : 'CAM OFF'}
            </span>
            <span style={{ fontSize: '10px', color: '#3a3a3a', fontFamily: 'monospace' }}>
              {micAudio ? '🎤 MIC ON' : 'MIC OFF'} · {systemAudio ? '🔊 SYS ON' : 'SYS OFF'}
            </span>
          </div>
        </div>
      </div>

      {showWhiteboard && <WhiteboardModal onClose={() => setShowWhiteboard(false)} />}
    </>
  );
}

function PanelHeader({ label }: { label: string }) {
  return (
    <div style={{
      height: '26px', flexShrink: 0,
      background: 'linear-gradient(180deg,#383838,#2e2e2e)',
      borderBottom: '1px solid #1e1e1e',
      display: 'flex', alignItems: 'center', padding: '0 10px',
    }}>
      <span style={{
        fontSize: '10px', fontWeight: 700, color: '#aaa',
        textTransform: 'uppercase' as const, letterSpacing: '0.09em',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        {label}
      </span>
    </div>
  );
}

const ctrlBtn = (bg: string, glow?: boolean): React.CSSProperties => ({
  width: '100%', padding: '7px 10px', borderRadius: '4px', cursor: 'pointer',
  background: bg, border: '1px solid rgba(255,255,255,0.07)',
  color: '#ddd', fontSize: '11px', fontWeight: 600,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
  boxShadow: glow ? `0 0 12px ${bg}99` : 'none',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  transition: 'filter 0.1s',
});
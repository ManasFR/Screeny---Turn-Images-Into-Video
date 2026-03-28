'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Video, ChevronLeft, MonitorPlay, Camera, PenLine, Square, Pause, Play,
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
  const [camPos,     setCamPos]     = useState({ x: 24, y: 24 }); // distance from bottom-right
  const [isDragging, setIsDragging] = useState(false);
  const dragStart   = useRef({ mx: 0, my: 0, bx: 0, by: 0 });
  const previewRef  = useRef<HTMLDivElement>(null);

  const CAM_SIZE = 160; // Slightly larger for modern feel

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
      const newX = Math.max(16, Math.min(width  - CAM_SIZE - 16, dragStart.current.bx + dx));
      const newY = Math.max(16, Math.min(height - CAM_SIZE - 16, dragStart.current.by + dy));
      setCamPos({ x: newX, y: newY });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [isDragging]);

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
      const newX = Math.max(16, Math.min(width  - CAM_SIZE - 16, dragStart.current.bx + dx));
      const newY = Math.max(16, Math.min(height - CAM_SIZE - 16, dragStart.current.by + dy));
      setCamPos({ x: newX, y: newY });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => { window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp); };
  }, [isDragging]);

  const recorder   = useScreenRecorder();
  const annotation = useAnnotation(canvasRef as React.RefObject<HTMLCanvasElement>);

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

  const startCamera = useCallback(async (id: string) => {
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
  }, [selectedCameraId, startCamera]);

  const handleStart = async () => {
    await recorder.startRecording({
      micAudio,
      systemAudio,
      micDeviceId: selectedMicId,
      cameraStream: cameraStreamRef.current,
    });
  };

  const handleStop  = () => { recorder.stopRecording();  annotation.clearCanvas(); };
  const handleReset = () => { recorder.resetRecording(); annotation.clearCanvas(); };

  const hasCamera = selectedCameraId && selectedCameraId !== 'none';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #09090b; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        @keyframes blink  { 0%,100%{opacity:1}  50%{opacity:0.3} }
        @keyframes pulse  { 0%,100%{transform:scale(1)} 50%{transform:scale(0.85)} }
        @keyframes camPop { 0%{transform:scale(0.7);opacity:0} 100%{transform:scale(1);opacity:1} }
        select, input, button { font-family: 'Plus Jakarta Sans', sans-serif; outline: none; border: none; }
      `}</style>

      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        background: '#09090b', color: '#e4e4e7', overflow: 'hidden',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>

        {/* ── Header Bar ───────────────────────────────────────────────────── */}
        <div style={{
          height: '56px', flexShrink: 0,
          background: '#18181b',
          borderBottom: '1px solid #27272a',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }}>
<div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
  <Link href="/dashboard/duprun" style={{ color: '#a1a1aa', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}>
    <ChevronLeft style={{ width: '20px', height: '20px' }} />
  </Link>
  <div style={{ width: '1px', height: '24px', background: '#3f3f46' }} />
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <div style={{
      width: '32px', height: '32px', borderRadius: '8px',
      background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 0 12px rgba(239,68,68,0.4)',
    }}>
      <Video style={{ width: '16px', height: '16px', color: '#ffffff' }} />
    </div>
    <span style={{ fontSize: '16px', fontWeight: 700, color: '#f4f4f5', letterSpacing: '-0.02em' }}>
      Studio Recorder
    </span>
  </div>

  <div style={{ width: '1px', height: '24px', background: '#3f3f46' }} />

  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    <Link href="/dashboard/screenshot" style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '4px 12px', borderRadius: '6px', fontSize: '12px',
      color: '#a1a1aa', transition: 'all 0.2s', textDecoration: 'none',
    }}>
      <Camera style={{ width: '14px', height: '14px' }} />
      Screenshot
    </Link>
    <Link href="/dashboard/duprun" style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '4px 12px', borderRadius: '6px', fontSize: '12px',
      color: '#a1a1aa', transition: 'all 0.2s', textDecoration: 'none',
    }}>
      <MonitorPlay style={{ width: '14px', height: '14px' }} />
      Duprun
    </Link>
  </div>
</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Live status indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: '#09090b', borderRadius: '20px', border: '1px solid #27272a' }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: isRecording ? '#ef4444' : isPaused ? '#f59e0b' : '#52525b',
                boxShadow: isRecording ? '0 0 10px #ef4444' : 'none',
                animation: isRecording ? 'blink 1.2s infinite' : 'none',
              }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: isRecording ? '#fca5a5' : isPaused ? '#fcd34d' : '#a1a1aa', letterSpacing: '0.05em' }}>
                {isRecording ? 'RECORDING' : isPaused ? 'PAUSED' : 'READY'}
              </span>
              {isActive && (
                <>
                  <div style={{ width: '1px', height: '12px', background: '#3f3f46' }} />
                  <span style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 600, color: '#d4d4d8' }}>
                    {recorder.formatDuration(recorder.duration)}
                  </span>
                </>
              )}
            </div>

            {/* Whiteboard button */}
            <button
              onClick={() => setShowWhiteboard(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                background: showWhiteboard ? 'rgba(99,102,241,0.2)' : '#27272a',
                border: `1px solid ${showWhiteboard ? '#6366f1' : '#3f3f46'}`,
                color: showWhiteboard ? '#c7d2fe' : '#e4e4e7',
                fontSize: '13px', fontWeight: 600,
                boxShadow: showWhiteboard ? '0 0 15px rgba(99,102,241,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <PenLine style={{ width: '16px', height: '16px' }} />
              Whiteboard
            </button>
          </div>
        </div>

        {/* ── Main Layout (Preview + Panels) ─────────────────────────────────── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Left Area: Main Preview Screen */}
          <div
            ref={previewRef}
            style={{
              flex: 1, position: 'relative',
              background: '#000000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', margin: '20px', borderRadius: '16px',
              border: '1px solid #27272a', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
          >
            {/* Screen capture live preview */}
            <video
              ref={screenVideoRef}
              autoPlay playsInline muted
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'contain', background: 'transparent',
                display: isPreviewActive ? 'block' : 'none',
              }}
            />

            {/* ── Draggable Circular Camera Bubble ── */}
            {hasCamera && (
              <div
                onMouseDown={onCamMouseDown}
                onTouchStart={onCamTouchStart}
                style={{
                  position: 'absolute',
                  right:  camPos.x,
                  bottom: camPos.y,
                  width:  `${CAM_SIZE}px`,
                  height: `${CAM_SIZE}px`,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '4px solid rgba(255,255,255,0.15)',
                  boxShadow: `
                    0 0 0 1px rgba(0,0,0,0.5),
                    0 10px 40px rgba(0,0,0,0.6),
                    ${isRecording ? '0 0 25px rgba(239,68,68,0.6)' : ''}
                  `,
                  cursor: isDragging ? 'grabbing' : 'grab',
                  zIndex: 20,
                  userSelect: 'none',
                  animation: 'camPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  background: '#09090b',
                  backdropFilter: 'blur(10px)',
                  transition: isDragging ? 'none' : 'box-shadow 0.2s, border-color 0.2s',
                }}
              >
                <video
                  ref={cameraVideoRef}
                  autoPlay playsInline muted
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)', // mirror selfie view
                    pointerEvents: 'none',
                  }}
                />

                <div style={{
                  position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
                  opacity: 0.5, pointerEvents: 'none', background: 'rgba(0,0,0,0.4)',
                  padding: '2px 8px', borderRadius: '10px', backdropFilter: 'blur(4px)'
                }}>
                  <GripHorizontal style={{ width: '16px', height: '16px', color: '#ffffff' }} />
                </div>

                {/* Recording outer glow indicator */}
                {isRecording && (
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    border: '3px solid rgba(239,68,68,0.8)',
                    animation: 'pulse 1.5s infinite',
                    pointerEvents: 'none',
                  }} />
                )}
              </div>
            )}

            {/* Empty state */}
            {!isPreviewActive && !hasCamera && (
              <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '20px', margin: '0 auto 20px',
                  background: '#18181b', border: '1px solid #27272a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.4)'
                }}>
                  <Monitor style={{ width: '36px', height: '36px', color: '#52525b' }} />
                </div>
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#a1a1aa' }}>Ready to Record</p>
                <p style={{ fontSize: '13px', color: '#71717a', marginTop: '8px', fontWeight: 500 }}>
                  Start recording or preview a source below
                </p>
              </div>
            )}

            {/* Recording badge (Top left overlay) */}
            {isPreviewActive && (
              <div style={{
                position: 'absolute', top: 16, left: 16, zIndex: 10,
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '6px 14px', borderRadius: '8px',
                background: 'rgba(9,9,11,0.8)', border: '1px solid rgba(239,68,68,0.4)',
                backdropFilter: 'blur(12px)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
              }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444', animation: 'blink 1.2s infinite' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#fca5a5', letterSpacing: '0.08em' }}>REC</span>
                <span style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 600, color: '#f4f4f5' }}>
                  {recorder.formatDuration(recorder.duration)}
                </span>
              </div>
            )}

            {/* Countdown Screen */}
            {recorder.recordingState === 'countdown' && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 40,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(8px)',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '140px', fontWeight: 800, color: '#ef4444', textShadow: '0 0 50px rgba(239,68,68,0.6)', lineHeight: 1 }}>
                    {recorder.countdown}
                  </div>
                  <p style={{ fontSize: '18px', color: '#a1a1aa', marginTop: '16px', fontWeight: 600, letterSpacing: '0.05em' }}>
                    Recording starting...
                  </p>
                </div>
              </div>
            )}

            {/* Red recording frame */}
            {isRecording && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', border: '3px solid rgba(239,68,68,0.7)', borderRadius: '16px' }} />
            )}

            {/* Annotation Overlay Canvas */}
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

          {/* Right Area: Control Panels Container */}
          <div style={{
            width: '380px', flexShrink: 0,
            background: '#18181b', borderLeft: '1px solid #27272a',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Scrollable Settings Panel */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Audio Mixer Module */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

              {/* Annotation Module */}
              <div style={{ display: 'flex', flexDirection: 'column', background: '#09090b', borderRadius: '12px', border: '1px solid #27272a', padding: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
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

            {/* Sticky Bottom Recording Actions */}
            <div style={{
              padding: '20px',
              background: '#18181b',
              borderTop: '1px solid #27272a',
              display: 'flex', flexDirection: 'column', gap: '10px'
            }}>
              
              {isIdle && (
                <button onClick={handleStart} style={primaryBtn('#ef4444', '#b91c1c')}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffffff', boxShadow: '0 0 8px rgba(255,255,255,0.8)', flexShrink: 0 }} />
                  Start Recording
                </button>
              )}

              {isActive && (
                <button onClick={handleStop} style={primaryBtn('#18181b', '#27272a', true)}>
                  <Square style={{ width: '14px', height: '14px', color: '#ef4444', flexShrink: 0 }} />
                  Stop & Save
                </button>
              )}

              {isActive && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {isRecording ? (
                    <button onClick={recorder.pauseRecording} style={secondaryBtn('#27272a')}>
                      <Pause style={{ width: '14px', height: '14px' }} />
                      Pause
                    </button>
                  ) : (
                    <button onClick={recorder.resumeRecording} style={secondaryBtn('#065f46', '#10b981')}>
                      <Play style={{ width: '14px', height: '14px' }} />
                      Resume
                    </button>
                  )}
                  <button onClick={handleReset} style={secondaryBtn('#27272a')}>
                    <RotateCcw style={{ width: '14px', height: '14px' }} />
                    Discard
                  </button>
                </div>
              )}

              {isStopped && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '12px', borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)',
                }}>
                  <Download style={{ width: '16px', height: '16px', color: '#34d399', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: '#34d399', fontWeight: 600 }}>Video Saved Successfully</span>
                </div>
              )}

              {recorder.error && (
                <div style={{
                  padding: '10px 12px', borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontSize: '12px', color: '#fca5a5', fontWeight: 500, lineHeight: 1.5,
                  textAlign: 'center'
                }}>
                  {recorder.error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Minimal Footer Status Bar ────────────────────────────────────────────── */}
        <div style={{
          height: '28px', flexShrink: 0,
          background: '#09090b', borderTop: '1px solid #27272a',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px',
        }}>
          <span style={{ fontSize: '11px', color: '#71717a', fontFamily: 'monospace', fontWeight: 600 }}>
            {isActive ? <span style={{ color: '#ef4444' }}>⏺ REC: {recorder.formatDuration(recorder.duration)}</span> : 'Idle State'}
          </span>
          <div style={{ display: 'flex', gap: '24px' }}>
            <span style={{ fontSize: '11px', color: hasCamera ? '#34d399' : '#71717a', fontFamily: 'monospace', fontWeight: 600 }}>
              {hasCamera ? '📷 CAM ACTIVE' : '📷 CAM OFF'}
            </span>
            <span style={{ fontSize: '11px', color: '#71717a', fontFamily: 'monospace', fontWeight: 600 }}>
              <span style={{ color: micAudio ? '#34d399' : 'inherit' }}>🎤 MIC {micAudio ? 'ON' : 'OFF'}</span> 
              {' • '} 
              <span style={{ color: systemAudio ? '#34d399' : 'inherit' }}>🔊 SYS {systemAudio ? 'ON' : 'OFF'}</span>
            </span>
          </div>
        </div>
      </div>

      {showWhiteboard && <WhiteboardModal onClose={() => setShowWhiteboard(false)} />}
    </>
  );
}

// Helper Button Styles
const primaryBtn = (bg: string, hoverBg: string, isBordered = false): React.CSSProperties => ({
  width: '100%', padding: '12px', borderRadius: '8px', cursor: 'pointer',
  background: bg, border: isBordered ? `1px solid #3f3f46` : 'none',
  color: '#ffffff', fontSize: '14px', fontWeight: 700,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  boxShadow: isBordered ? '0 2px 4px rgba(0,0,0,0.1)' : `0 4px 14px ${bg}60`,
  fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '0.02em',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
});

const secondaryBtn = (bg: string, color = '#e4e4e7'): React.CSSProperties => ({
  width: '100%', padding: '10px', borderRadius: '8px', cursor: 'pointer',
  background: bg, border: `1px solid ${bg === '#27272a' ? '#3f3f46' : 'transparent'}`,
  color: color, fontSize: '13px', fontWeight: 600,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  transition: 'all 0.2s ease',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
});
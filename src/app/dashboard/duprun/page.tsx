'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Settings2, Film, Mic2, Music2 } from 'lucide-react';

import { usePlanLimits }            from '@/hooks/usePlanLimits';
import { useSlides }                from '@/hooks/useSlides';
import { useCanvasAnimation, CANVAS_SIZES } from '@/hooks/useCanvasAnimation';
import { useMixer }                 from '@/hooks/useMixer';
import { AspectRatio, ExportFormat } from '@/types/duprun';

import Header            from './_components/Header';
import LimitErrorBanner  from './_components/LimitErrorBanner';
import AnimationSettings from './_components/AnimationSettings';
import StyleSettings     from './_components/StyleSettings';
import BackgroundSettings from './_components/BackgroundSettings';
import SlideManager      from './_components/SlideManager';
import ZoomPointManager  from './_components/ZoomPointManager';
import PlaybackControls  from './_components/PlaybackControls';
import CanvasEditor      from './_components/CanvasEditor';
import MixerPanel        from './_components/MixerPanel';

type SidebarTab = 'slides' | 'settings' | 'mixer';

const TABS: { id: SidebarTab; label: string; icon: React.ElementType }[] = [
  { id: 'slides',   label: 'Slides',    icon: Film      },
  { id: 'settings', label: 'Settings',  icon: Settings2 },
  { id: 'mixer',    label: 'Mixer',     icon: Mic2      },
];

const ZoomVideoApp = () => {
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('slides');

  // ── Animation settings ───────────────────────────────────────────
  const [zoomLevel,          setZoomLevel]          = useState(1.5);
  const [zoomDuration,       setZoomDuration]       = useState(3000);
  const [transitionDuration, setTransitionDuration] = useState(1000);
  const [transitionType,     setTransitionType]     = useState('fade');
  const [cursorType,         setCursorType]         = useState('arrow');
  const [aspectRatio,        setAspectRatio]        = useState<AspectRatio>('16:9');
  const [exportFormat,       setExportFormat]       = useState<ExportFormat>('webm');

  // ── Style settings ───────────────────────────────────────────────
  const [textColor,          setTextColor]          = useState('#ffffff');
  const [textBgColor,        setTextBgColor]        = useState('transparent');
  const [textAnimation,      setTextAnimation]      = useState('none');
  const [textFontFamily,     setTextFontFamily]     = useState('Poppins');
  const [textPadding,        setTextPadding]        = useState(10);
  const [textBorderRadius,   setTextBorderRadius]   = useState(5);

  // ── Background ───────────────────────────────────────────────────
  const [backgroundType,     setBackgroundType]     = useState('none');
  const [backgroundValue,    setBackgroundValue]    = useState('');
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);

  // ── Webcam ───────────────────────────────────────────────────────
  const [webcamEnabled,  setWebcamEnabled]  = useState(false);
  const [webcamX,        setWebcamX]        = useState(0.88);
  const [webcamY,        setWebcamY]        = useState(0.82);
  const [webcamSize,     setWebcamSize]     = useState(90);
  const [webcamMirror,   setWebcamMirror]   = useState(true);
  const webcamVideoRef  = useRef<HTMLVideoElement | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);

  const toggleWebcam = useCallback(async () => {
    if (webcamEnabled) {
      webcamStreamRef.current?.getTracks().forEach(t => t.stop());
      webcamStreamRef.current = null;
      if (webcamVideoRef.current) webcamVideoRef.current.srcObject = null;
      setWebcamEnabled(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        webcamStreamRef.current = stream;
        if (!webcamVideoRef.current) webcamVideoRef.current = document.createElement('video');
        webcamVideoRef.current.srcObject = stream;
        webcamVideoRef.current.muted = true;
        await webcamVideoRef.current.play();
        setWebcamEnabled(true);
      } catch {
        alert('Camera access denied. Please allow camera permissions.');
      }
    }
  }, [webcamEnabled]);

  useEffect(() => () => { webcamStreamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  // ── Hooks ─────────────────────────────────────────────────────────
  const { planLimits, showLimitError, fetchPlanLimits, triggerLimitError } = usePlanLimits();
  const mixer = useMixer();

  const {
    slides, currentSlideIndex, setCurrentSlideIndex, currentSlide,
    audioRefs, imageRefs, addSlide, removeSlide, addSlideMusic,
    updateSlideDuration, updatePointText, removeZoomPoint, clearAllPoints,
    navigateSlide, addZoomPoint, startDragPoint, moveDragPoint, stopDragPoint,
  } = useSlides();

  const {
    isPlaying, currentPointIndex, progress, isRecording, slideTransition,
    canvasRef, drawFrame, startAnimation, stopAnimation, resetAnimation,
    createAndDownloadVideo, getTotalAnimationTime,
  } = useCanvasAnimation({
    slides, currentSlideIndex, setCurrentSlideIndex,
    audioRefs, imageRefs, backgroundImageRef,
    webcamRef: webcamVideoRef,
    settings: {
      zoomLevel, zoomDuration, transitionDuration, transitionType, cursorType,
      textColor, textBgColor, textAnimation, textFontFamily, textPadding, textBorderRadius,
      backgroundType, backgroundValue, aspectRatio, exportFormat,
      webcamEnabled, webcamX, webcamY, webcamSize, webcamMirror,
    },
    planLimits, fetchPlanLimits, triggerLimitError,
  });

  useEffect(() => { fetchPlanLimits(); }, [fetchPlanLimits]);

  // Load images
  useEffect(() => {
    slides.forEach(slide => {
      if (slide.image && !imageRefs.current[slide.id]) {
        const img = new Image();
        img.onload = () => {
          imageRefs.current[slide.id] = img;
          if (slide.id === currentSlide?.id) {
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext('2d');
              const size = CANVAS_SIZES[aspectRatio];
              if (ctx) { canvas.width = size.w; canvas.height = size.h; drawFrame(ctx, currentSlideIndex, currentPointIndex, progress, slideTransition); }
            }
          }
        };
        img.src = slide.image;
      }
    });
  }, [slides, currentSlide, drawFrame, currentSlideIndex, currentPointIndex, progress, slideTransition, canvasRef, imageRefs, aspectRatio]);

  // Redraw on state change
  useEffect(() => {
    if (currentSlide && imageRefs.current[currentSlide.id] && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      const size = CANVAS_SIZES[aspectRatio];
      if (ctx) {
        canvasRef.current.width  = size.w;
        canvasRef.current.height = size.h;
        drawFrame(ctx, currentSlideIndex, currentPointIndex, progress, slideTransition, isPlaying);
      }
    }
  }, [
    currentSlideIndex, currentPointIndex, progress, slideTransition, slides, drawFrame,
    textColor, textBgColor, textAnimation, textFontFamily, textPadding, textBorderRadius,
    backgroundType, backgroundValue, isPlaying, currentSlide, canvasRef, imageRefs,
    webcamEnabled, webcamX, webcamY, webcamSize, webcamMirror, aspectRatio,
  ]);

  const handleBackgroundTypeChange = (type: string) => {
    setBackgroundType(type);
    if (type !== 'custom') { setBackgroundValue(''); backgroundImageRef.current = null; }
  };

  const handleCustomBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => {
        setBackgroundValue(ev.target?.result as string);
        const img = new Image(); img.src = ev.target?.result as string;
        backgroundImageRef.current = img;
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentSlide || isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * (canvas.width  / rect.width))  / canvas.width;
    const y = ((e.clientY - rect.top)  * (canvas.height / rect.height)) / canvas.height;
    addZoomPoint(x, y, currentSlide.id);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentSlide || isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const normX = ((e.clientX - rect.left) * (canvas.width  / rect.width))  / canvas.width;
    const normY = ((e.clientY - rect.top)  * (canvas.height / rect.height)) / canvas.height;
    moveDragPoint(normX, normY, currentSlide.id);
  };

  const handleMouseUp = () => { if (currentSlide) stopDragPoint(currentSlide.id); };
  const handlePointMouseDown = (e: React.MouseEvent<HTMLDivElement>, pointId: number) => {
    e.stopPropagation(); e.preventDefault();
    if (currentSlide) startDragPoint(pointId, currentSlide.id);
  };

  const totalZoomPoints = slides.reduce((s, sl) => s + sl.zoomPoints.length, 0);
  const { w: cW, h: cH } = CANVAS_SIZES[aspectRatio];

  return (
    <div className="min-h-screen bg-[#050507] text-white" style={{ fontFamily: 'var(--font-jakarta), sans-serif' }}>

      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '45%', height: '45%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '-10%', width: '45%', height: '45%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Header />

        <main style={{ maxWidth: '1800px', margin: '0 auto', padding: '0 32px 80px' }}>

          {/* Hero */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '48px 0 40px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '5px 16px', borderRadius: '99px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.22)', marginBottom: '20px' }}>
              <Sparkles style={{ width: '13px', height: '13px', color: '#818cf8' }} />
              <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#818cf8' }}>Next Gen Production Studio</span>
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', fontStyle: 'italic', textTransform: 'uppercase', marginBottom: '16px', maxWidth: '760px' }}>
              Transform Static Frames{' '}
              <span style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                into Cinematic Motion
              </span>
            </h1>
            {planLimits && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', padding: '7px 18px', borderRadius: '99px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {planLimits.planName || 'Free'} Plan
                </span>
              </div>
            )}
          </div>

          {showLimitError && <LimitErrorBanner planLimits={planLimits} />}

          {/* ── MAIN GRID: sidebar + canvas ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '28px', alignItems: 'start' }}>

            {/* ─────── SIDEBAR ─────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'sticky', top: '24px' }}>

              {/* Tab bar */}
              <div style={{
                display: 'flex', borderRadius: '18px 18px 0 0', overflow: 'hidden',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none',
              }}>
                {TABS.map(({ id, label, icon: Icon }) => {
                  const active = sidebarTab === id;
                  return (
                    <button key={id} onClick={() => setSidebarTab(id)} style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                      padding: '14px 10px', cursor: 'pointer', transition: 'all 0.18s',
                      background: active ? 'rgba(99,102,241,0.16)' : 'transparent',
                      borderBottom: active ? '2px solid rgba(99,102,241,0.8)' : '2px solid transparent',
                      color: active ? 'rgba(165,180,252,1)' : 'rgba(255,255,255,0.35)',
                      fontWeight: active ? 700 : 500, fontSize: '12px',
                    }}>
                      <Icon style={{ width: '14px', height: '14px' }} />
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Tab content */}
              <div style={{
                borderRadius: '0 0 18px 18px',
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderTop: 'none',
                maxHeight: 'calc(100vh - 200px)',
                overflowY: 'auto',
                padding: '20px',
              }}
                className="custom-scrollbar"
              >

                {/* ── SLIDES TAB ── */}
                {sidebarTab === 'slides' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <SlideManager
                      slides={slides}
                      currentSlideIndex={currentSlideIndex}
                      onAddSlide={addSlide}
                      onRemoveSlide={removeSlide}
                      onSelectSlide={setCurrentSlideIndex}
                      onAddMusic={addSlideMusic}
                      onUpdateDuration={updateSlideDuration}
                      currentSlide={currentSlide}
                    />

                    {currentSlide && (
                      <div style={{ paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <ZoomPointManager
                          currentSlide={currentSlide}
                          onUpdateText={updatePointText}
                          onRemovePoint={removeZoomPoint}
                          onClearAll={id => { clearAllPoints(id); resetAnimation(); }}
                        />
                      </div>
                    )}

                    <div style={{ paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <PlaybackControls
                        isPlaying={isPlaying}
                        isRecording={isRecording}
                        totalZoomPoints={totalZoomPoints}
                        planLimits={planLimits}
                        currentSlideIndex={currentSlideIndex}
                        slidesCount={slides.length}
                        progress={progress}
                        totalDuration={getTotalAnimationTime()}
                        exportFormat={exportFormat}
                        onExportFormatChange={setExportFormat}
                        webcamEnabled={webcamEnabled}
                        webcamX={webcamX}         setWebcamX={setWebcamX}
                        webcamY={webcamY}         setWebcamY={setWebcamY}
                        webcamSize={webcamSize}   setWebcamSize={setWebcamSize}
                        webcamMirror={webcamMirror} setWebcamMirror={setWebcamMirror}
                        onToggleWebcam={toggleWebcam}
                        onPlay={startAnimation}
                        onStop={stopAnimation}
                        onReset={resetAnimation}
                        onExport={createAndDownloadVideo}
                      />
                    </div>
                  </div>
                )}

                {/* ── SETTINGS TAB ── */}
                {sidebarTab === 'settings' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <AnimationSettings
                      zoomLevel={zoomLevel}               setZoomLevel={setZoomLevel}
                      zoomDuration={zoomDuration}         setZoomDuration={setZoomDuration}
                      transitionDuration={transitionDuration} setTransitionDuration={setTransitionDuration}
                      transitionType={transitionType}     setTransitionType={setTransitionType}
                      cursorType={cursorType}             setCursorType={setCursorType}
                      aspectRatio={aspectRatio}           setAspectRatio={setAspectRatio}
                    />
                    <StyleSettings
                      textColor={textColor}               setTextColor={setTextColor}
                      textBgColor={textBgColor}           setTextBgColor={setTextBgColor}
                      textAnimation={textAnimation}       setTextAnimation={setTextAnimation}
                      textFontFamily={textFontFamily}     setTextFontFamily={setTextFontFamily}
                      textPadding={textPadding}           setTextPadding={setTextPadding}
                      textBorderRadius={textBorderRadius} setTextBorderRadius={setTextBorderRadius}
                    />
                    <BackgroundSettings
                      backgroundType={backgroundType}
                      backgroundValue={backgroundValue}
                      onBackgroundTypeChange={handleBackgroundTypeChange}
                      onCustomImageUpload={handleCustomBackgroundUpload}
                    />
                  </div>
                )}

                {/* ── MIXER TAB ── */}
                {sidebarTab === 'mixer' && (
                  <MixerPanel mixer={mixer} />
                )}

              </div>
            </div>

            {/* ─────── CANVAS AREA ─────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '24px' }}>
              <CanvasEditor
                canvasRef={canvasRef}
                slides={slides}
                currentSlide={currentSlide}
                currentSlideIndex={currentSlideIndex}
                currentPointIndex={currentPointIndex}
                isPlaying={isPlaying}
                slideTransition={slideTransition}
                onCanvasClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onPointMouseDown={handlePointMouseDown}
                onNavigate={navigateSlide}
              />

              {/* Canvas meta bar */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              }}>
                <div style={{ display: 'flex', gap: '24px' }}>
                  {[
                    { label: 'Resolution',    value: `${cW} × ${cH}` },
                    { label: 'Aspect Ratio',  value: aspectRatio      },
                    { label: 'Zoom Points',   value: `${totalZoomPoints}` },
                    { label: 'Slides',        value: `${slides.length}` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '2px' }}>{label}</p>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>{value}</p>
                    </div>
                  ))}
                  {webcamEnabled && (
                    <div>
                      <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '2px' }}>Face Cam</p>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#22c55e', fontFamily: 'monospace' }}>● Live</p>
                    </div>
                  )}
                  {mixer.micEnabled && (
                    <div>
                      <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '2px' }}>Mic</p>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#6366f1', fontFamily: 'monospace' }}>● Active</p>
                    </div>
                  )}
                  {mixer.selectedTrack && (
                    <div>
                      <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '2px' }}>Music</p>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mixer.selectedTrack.name}</p>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#818cf8', background: 'rgba(99,102,241,0.1)', padding: '6px 14px', borderRadius: '9px', border: '1px solid rgba(99,102,241,0.2)' }}>
                  Live Preview
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.09); border-radius: 99px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.45); }
      `}</style>
    </div>
  );
};

export default ZoomVideoApp;

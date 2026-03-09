'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Layout } from 'lucide-react';

// Hooks
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useSlides } from '@/hooks/useSlides';
import { useCanvasAnimation } from '@/hooks/useCanvasAnimation';

// Components
import Header from './_components/Header';
import LimitErrorBanner from './_components/LimitErrorBanner';
import AnimationSettings from './_components/AnimationSettings';
import StyleSettings from './_components/StyleSettings';
import BackgroundSettings from './_components/BackgroundSettings';
import SlideManager from './_components/SlideManager';
import ZoomPointManager from './_components/ZoomPointManager';
import PlaybackControls from './_components/PlaybackControls';
import CanvasEditor from './_components/CanvasEditor';

const ZoomVideoApp = () => {
  // ── Animation settings ──────────────────────────────────────────
  const [zoomLevel, setZoomLevel] = useState(1.5);
  const [zoomDuration, setZoomDuration] = useState(3000);
  const [transitionDuration, setTransitionDuration] = useState(1000);
  const [transitionType, setTransitionType] = useState('fade');
  const [cursorType, setCursorType] = useState('arrow');

  // ── Style settings ───────────────────────────────────────────────
  const [textColor, setTextColor] = useState('#ffffff');
  const [textBgColor, setTextBgColor] = useState('transparent');
  const [textAnimation, setTextAnimation] = useState('none');
  const [textFontFamily, setTextFontFamily] = useState('Poppins');
  const [textPadding, setTextPadding] = useState(10);
  const [textBorderRadius, setTextBorderRadius] = useState(5);

  // ── Background settings ──────────────────────────────────────────
  const [backgroundType, setBackgroundType] = useState('none');
  const [backgroundValue, setBackgroundValue] = useState('');
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);

  // ── Hooks ────────────────────────────────────────────────────────
  const { planLimits, showLimitError, fetchPlanLimits, triggerLimitError } =
    usePlanLimits();

  const {
    slides,
    currentSlideIndex,
    setCurrentSlideIndex,
    currentSlide,
    audioRefs,
    imageRefs,
    addSlide,
    removeSlide,
    addSlideMusic,
    updatePointText,
    removeZoomPoint,
    clearAllPoints,
    navigateSlide,
    addZoomPoint,
    startDragPoint,
    moveDragPoint,
    stopDragPoint,
  } = useSlides();

  const {
    isPlaying,
    currentPointIndex,
    progress,
    isRecording,
    slideTransition,
    canvasRef,
    drawFrame,
    startAnimation,
    stopAnimation,
    resetAnimation,
    createAndDownloadVideo,
    getTotalAnimationTime,
  } = useCanvasAnimation({
    slides,
    currentSlideIndex,
    setCurrentSlideIndex,
    audioRefs,
    imageRefs,
    backgroundImageRef,
    settings: {
      zoomLevel,
      zoomDuration,
      transitionDuration,
      transitionType,
      cursorType,
      textColor,
      textBgColor,
      textAnimation,
      textFontFamily,
      textPadding,
      textBorderRadius,
      backgroundType,
      backgroundValue,
    },
    planLimits,
    fetchPlanLimits,
    triggerLimitError,
  });

  // ── Fetch plan limits on mount ───────────────────────────────────
  useEffect(() => {
    fetchPlanLimits();
  }, [fetchPlanLimits]);

  // ── Load images into imageRefs and redraw canvas ─────────────────
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
              if (ctx) {
                canvas.width = 1440;
                canvas.height = 810;
                drawFrame(ctx, currentSlideIndex, currentPointIndex, progress, slideTransition);
              }
            }
          }
        };
        img.src = slide.image;
      }
    });
  }, [slides, currentSlide, drawFrame, currentSlideIndex, currentPointIndex, progress, slideTransition, canvasRef, imageRefs]);

  // ── Redraw canvas when settings or state changes ─────────────────
  useEffect(() => {
    if (currentSlide && imageRefs.current[currentSlide.id] && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        canvasRef.current.width = 1440;
        canvasRef.current.height = 810;
        drawFrame(ctx, currentSlideIndex, currentPointIndex, progress, slideTransition, isPlaying);
      }
    }
  }, [
    currentSlideIndex,
    currentPointIndex,
    progress,
    slideTransition,
    slides,
    drawFrame,
    textColor,
    textBgColor,
    textAnimation,
    textFontFamily,
    textPadding,
    textBorderRadius,
    backgroundType,
    backgroundValue,
    isPlaying,
    currentSlide,
    canvasRef,
    imageRefs,
  ]);

  // ── Background handler ────────────────────────────────────────────
  const handleBackgroundTypeChange = (type: string) => {
    setBackgroundType(type);
    if (type !== 'custom') {
      setBackgroundValue('');
      backgroundImageRef.current = null;
    }
  };

  const handleCustomBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => {
        setBackgroundValue(e.target?.result as string);
        const img = new Image();
        img.src = e.target?.result as string;
        backgroundImageRef.current = img;
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  // ── Canvas interaction handlers ───────────────────────────────────
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentSlide || isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = ((event.clientX - rect.left) * scaleX) / canvas.width;
    const y = ((event.clientY - rect.top) * scaleY) / canvas.height;
    addZoomPoint(x, y, currentSlide.id);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentSlide || isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const normX = ((event.clientX - rect.left) * scaleX) / canvas.width;
    const normY = ((event.clientY - rect.top) * scaleY) / canvas.height;
    moveDragPoint(normX, normY, currentSlide.id);
  };

  const handleMouseUp = () => {
    if (!currentSlide) return;
    stopDragPoint(currentSlide.id);
  };

  const handlePointMouseDown = (
    event: React.MouseEvent<HTMLDivElement>,
    pointId: number
  ) => {
    event.stopPropagation();
    event.preventDefault();
    if (!currentSlide) return;
    startDragPoint(pointId, currentSlide.id);
  };

  // ── Derived values ────────────────────────────────────────────────
  const totalZoomPoints = slides.reduce((sum, s) => sum + s.zoomPoints.length, 0);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30">
      {/* Dynamic Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>
      <Header />
      <main className="max-w-[1600px] mx-auto px-6 pb-20 relative z-10">
        {/* Hero Section */}
        <div className="flex flex-col items-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Next Gen Production</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-center max-w-3xl leading-tight tracking-tighter italic uppercase">
            Transform Static Frames <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
              into Cinematic Motion
            </span>
          </h1>
          
          {planLimits && (
            <div className="mt-6 flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Active Tier: <span className="text-white ml-1">{planLimits.planName || 'Free'}</span>
              </span>
            </div>
          )}
        </div>

        {showLimitError && <LimitErrorBanner planLimits={planLimits} />}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── Sidebar: Config & Tools (4 cols) ────────────────────── */}
          <div className="lg:col-span-4 space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar pr-2">
            
            {/* Section Label */}
            <div className="flex items-center gap-2 mb-2">
              <Layout className="w-4 h-4 text-indigo-500" />
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-500">Studio Configuration</h2>
            </div>

            <AnimationSettings
              zoomLevel={zoomLevel}
              setZoomLevel={setZoomLevel}
              zoomDuration={zoomDuration}
              setZoomDuration={setZoomDuration}
              transitionDuration={transitionDuration}
              setTransitionDuration={setTransitionDuration}
              transitionType={transitionType}
              setTransitionType={setTransitionType}
              cursorType={cursorType}
              setCursorType={setCursorType}
            />

            <StyleSettings
              textColor={textColor}
              setTextColor={setTextColor}
              textBgColor={textBgColor}
              setTextBgColor={setTextBgColor}
              textAnimation={textAnimation}
              setTextAnimation={setTextAnimation}
              textFontFamily={textFontFamily}
              setTextFontFamily={setTextFontFamily}
              textPadding={textPadding}
              setTextPadding={setTextPadding}
              textBorderRadius={textBorderRadius}
              setTextBorderRadius={setTextBorderRadius}
            />

            <BackgroundSettings
              backgroundType={backgroundType}
              backgroundValue={backgroundValue}
              onBackgroundTypeChange={handleBackgroundTypeChange}
              onCustomImageUpload={handleCustomBackgroundUpload}
            />

            {/* Media & Playback Card */}
            <div className="bg-[#0f111a] rounded-[2rem] p-6 border border-white/10 shadow-2xl space-y-8">
              <div>
                <SlideManager
                  slides={slides}
                  currentSlideIndex={currentSlideIndex}
                  onAddSlide={addSlide}
                  onRemoveSlide={removeSlide}
                  onSelectSlide={setCurrentSlideIndex}
                  onAddMusic={addSlideMusic}
                  currentSlide={currentSlide}
                />
              </div>

              {currentSlide && (
                <div className="pt-6 border-t border-white/5">
                  <ZoomPointManager
                    currentSlide={currentSlide}
                    onUpdateText={updatePointText}
                    onRemovePoint={removeZoomPoint}
                    onClearAll={(slideId) => {
                      clearAllPoints(slideId);
                      resetAnimation();
                    }}
                  />
                </div>
              )}

              <div className="pt-6 border-t border-white/5">
                <PlaybackControls
                  isPlaying={isPlaying}
                  isRecording={isRecording}
                  totalZoomPoints={totalZoomPoints}
                  planLimits={planLimits}
                  currentSlideIndex={currentSlideIndex}
                  slidesCount={slides.length}
                  progress={progress}
                  totalDuration={getTotalAnimationTime()}
                  onPlay={startAnimation}
                  onStop={stopAnimation}
                  onReset={resetAnimation}
                  onExport={createAndDownloadVideo}
                />
              </div>
            </div>
          </div>

          {/* ── Center: Canvas Studio (8 cols) ─────────────────────── */}
          <div className="lg:col-span-8 sticky top-6">
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
            
            <div className="mt-6 flex justify-between items-center px-4 py-3 bg-white/5 border border-white/5 rounded-2xl">
               <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Resolution</span>
                    <span className="text-xs font-mono">1440 x 810 (16:9)</span>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Total Points</span>
                    <span className="text-xs font-mono">{totalZoomPoints} Markers</span>
                  </div>
               </div>
               <div className="text-[10px] text-indigo-400 font-black tracking-widest bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                  LIVE STUDIO PREVIEW
               </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Styles for the custom scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.4);
        }
      `}</style>
    </div>
  );
};

export default ZoomVideoApp;
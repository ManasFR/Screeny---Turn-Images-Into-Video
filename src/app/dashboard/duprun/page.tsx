'use client';

import { useState, useRef, useEffect } from 'react';

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
    <div className="min-h-screen bg-black p-4 font-[Poppins] text-white">
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <Header />

      <div className="max-w-full mx-auto">
        {/* Hero text */}
        <div className="text-center mb-10">
          <h2 className="text-5xl font-bold tracking-tight mb-2">
            Turn your plain screenshots into eye-catching videos.
          </h2>
          {planLimits && (
            <div className="mt-4 inline-block bg-gray-900 px-6 py-3 rounded-2xl border border-gray-800">
              <p className="text-sm text-gray-300">
                {planLimits.planName && (
                  <span className="font-semibold text-white">{planLimits.planName}</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Export limit error */}
        {showLimitError && <LimitErrorBanner planLimits={planLimits} />}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* ── Left sidebar ─────────────────────────────────────── */}
          <div className="col-span-1 space-y-6">
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

            {/* Controls card */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4">Controls</h2>

              <SlideManager
                slides={slides}
                currentSlideIndex={currentSlideIndex}
                onAddSlide={addSlide}
                onRemoveSlide={removeSlide}
                onSelectSlide={setCurrentSlideIndex}
                onAddMusic={addSlideMusic}
                currentSlide={currentSlide}
              />

              {currentSlide && (
                <ZoomPointManager
                  currentSlide={currentSlide}
                  onUpdateText={updatePointText}
                  onRemovePoint={removeZoomPoint}
                  onClearAll={(slideId) => {
                    clearAllPoints(slideId);
                    resetAnimation();
                  }}
                />
              )}

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

          {/* ── Canvas editor ─────────────────────────────────────── */}
          <div className="col-span-3 sticky top-0 h-[calc(100vh-2rem)] overflow-hidden">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoomVideoApp;

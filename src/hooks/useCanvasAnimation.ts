'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Slide, PlanLimits, VideoSettings } from '@/types/duprun';

interface UseCanvasAnimationParams {
  slides: Slide[];
  currentSlideIndex: number;
  setCurrentSlideIndex: (idx: number) => void;
  audioRefs: React.MutableRefObject<Record<string, HTMLAudioElement>>;
  imageRefs: React.MutableRefObject<Record<string, HTMLImageElement>>;
  backgroundImageRef: React.MutableRefObject<HTMLImageElement | null>;
  settings: VideoSettings;
  planLimits: PlanLimits | null;
  fetchPlanLimits: () => Promise<void>;
  triggerLimitError: () => void;
}

const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const useCanvasAnimation = ({
  slides,
  currentSlideIndex,
  setCurrentSlideIndex,
  audioRefs,
  imageRefs,
  backgroundImageRef,
  settings,
  planLimits,
  fetchPlanLimits,
  triggerLimitError,
}: UseCanvasAnimationParams) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [slideTransition, setSlideTransition] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const isRecordingRef = useRef<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const {
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
  } = settings;

  const drawBackground = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      if (backgroundType === 'none') return;

      if (backgroundType === 'custom' && backgroundImageRef.current) {
        ctx.drawImage(backgroundImageRef.current, 0, 0, width, height);
        return;
      }

      let gradient: CanvasGradient | undefined;
      switch (backgroundType) {
        case 'gradient1':
          gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, '#000000');
          gradient.addColorStop(1, '#434343');
          break;
        case 'gradient2':
          gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, '#0000ff');
          gradient.addColorStop(1, '#800080');
          break;
        case 'gradient3':
          gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, '#008000');
          gradient.addColorStop(1, '#0000ff');
          break;
        case 'gradient4':
          gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, '#ff0000');
          gradient.addColorStop(1, '#ffa500');
          break;
        default:
          return;
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    },
    [backgroundType, backgroundImageRef]
  );

  const drawCursor = useCallback(
    (ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
      ctx.beginPath();
      switch (cursorType) {
        case 'arrow':
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx - 10, cy + 15);
          ctx.lineTo(cx - 4, cy + 12);
          ctx.lineTo(cx, cy + 24);
          ctx.lineTo(cx + 4, cy + 12);
          ctx.lineTo(cx + 10, cy + 15);
          ctx.lineTo(cx, cy);
          break;
        case 'pointer':
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + 10, cy + 10);
          ctx.lineTo(cx + 5, cy + 15);
          ctx.lineTo(cx, cy + 10);
          ctx.lineTo(cx - 5, cy + 15);
          ctx.lineTo(cx - 10, cy + 10);
          ctx.lineTo(cx, cy);
          break;
        case 'hand':
          ctx.arc(cx, cy + 10, 8, 0, Math.PI * 2);
          ctx.moveTo(cx - 4, cy + 10);
          ctx.lineTo(cx - 4, cy - 5);
          ctx.lineTo(cx, cy - 10);
          ctx.lineTo(cx + 4, cy - 5);
          ctx.lineTo(cx + 4, cy + 10);
          break;
        case 'crosshair':
          ctx.moveTo(cx - 10, cy);
          ctx.lineTo(cx + 10, cy);
          ctx.moveTo(cx, cy - 10);
          ctx.lineTo(cx, cy + 10);
          break;
        default:
          break;
      }
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1;
      ctx.stroke();
    },
    [cursorType]
  );

  const drawFrame = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      slideIndex: number,
      pointIndex: number,
      prog: number,
      transitionProg: number = 0,
      playing: boolean = false
    ) => {
      const canvas = canvasRef.current;
      if (!canvas || !slides[slideIndex]) return;

      const slide = slides[slideIndex];
      const img = imageRefs.current[slide.id];
      if (!img) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBackground(ctx, canvas.width, canvas.height);

      let currentZoom = 1;
      let centerX = canvas.width / 2;
      let centerY = canvas.height / 2;

      if (playing || transitionProg > 0) {
        if (slide.zoomPoints.length > 0) {
          if (pointIndex === 0) {
            currentZoom = lerp(1, zoomLevel, easeInOutCubic(prog));
            const fp = slide.zoomPoints[0];
            centerX = lerp(canvas.width / 2, fp.x * canvas.width, easeInOutCubic(prog));
            centerY = lerp(canvas.height / 2, fp.y * canvas.height, easeInOutCubic(prog));
          } else if (pointIndex < slide.zoomPoints.length) {
            currentZoom = zoomLevel;
            const prev = slide.zoomPoints[pointIndex - 1];
            const curr = slide.zoomPoints[pointIndex];
            const sp = easeInOutCubic(prog);
            centerX = lerp(prev.x * canvas.width, curr.x * canvas.width, sp);
            centerY = lerp(prev.y * canvas.height, curr.y * canvas.height, sp);
          } else {
            currentZoom = lerp(zoomLevel, 1, easeInOutCubic(prog));
            const last = slide.zoomPoints[slide.zoomPoints.length - 1];
            centerX = lerp(last.x * canvas.width, canvas.width / 2, easeInOutCubic(prog));
            centerY = lerp(last.y * canvas.height, canvas.height / 2, easeInOutCubic(prog));
          }
        }
      }

      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const drawWidth = img.width * scale;
      const drawHeight = img.height * scale;
      const offsetX = (canvas.width - drawWidth) / 2;
      const offsetY = (canvas.height - drawHeight) / 2;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(currentZoom, currentZoom);
      ctx.translate(-centerX, -centerY);

      if (transitionProg > 0 && slideIndex > 0) {
        const prevSlide = slides[slideIndex - 1];
        const prevImg = imageRefs.current[prevSlide.id];

        if (prevImg) {
          const ps = Math.min(canvas.width / prevImg.width, canvas.height / prevImg.height);
          const pdw = prevImg.width * ps;
          const pdh = prevImg.height * ps;
          const pox = (canvas.width - pdw) / 2;
          const poy = (canvas.height - pdh) / 2;

          if (transitionType === 'fade') {
            ctx.globalAlpha = 1 - transitionProg;
            ctx.drawImage(prevImg, pox, poy, pdw, pdh);
            ctx.globalAlpha = transitionProg;
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            ctx.globalAlpha = 1;
          } else if (transitionType === 'slide') {
            ctx.drawImage(prevImg, pox - canvas.width * transitionProg, poy, pdw, pdh);
            ctx.drawImage(img, offsetX + canvas.width * (1 - transitionProg), offsetY, drawWidth, drawHeight);
          } else {
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          }
        } else {
          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        }
      } else {
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      }

      ctx.restore();

      // Draw text overlay during playback
      if (playing && pointIndex < slide.zoomPoints.length) {
        const text = slide.zoomPoints[pointIndex].text;
        if (text) {
          ctx.font = `bold 30px ${textFontFamily}`;
          ctx.fillStyle = textColor;
          ctx.textAlign = 'center';

          if (textBgColor !== 'transparent') {
            const textWidth = ctx.measureText(text).width;
            ctx.fillStyle = textBgColor;
            ctx.beginPath();
            ctx.roundRect(
              canvas.width / 2 - textWidth / 2 - textPadding,
              canvas.height - 70,
              textWidth + textPadding * 2,
              40,
              textBorderRadius
            );
            ctx.fill();
            ctx.fillStyle = textColor;
          }

          let textOpacity = 1;
          let textY = canvas.height - 50;

          if (textAnimation === 'fade-in' && prog < 0.5) {
            textOpacity = prog / 0.5;
          } else if (textAnimation === 'slide-in' && prog < 0.5) {
            textY = canvas.height - 50 + (50 * (0.5 - prog)) / 0.5;
          }

          ctx.globalAlpha = textOpacity;
          ctx.fillText(text, canvas.width / 2, textY);
          ctx.globalAlpha = 1;
        }
      }

      // Draw zoom point markers when not playing
      if (!playing && transitionProg === 0) {
        slide.zoomPoints.forEach((point, index) => {
          const x = point.x * canvas.width;
          const y = point.y * canvas.height;
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, 2 * Math.PI);
          ctx.fillStyle = index === pointIndex ? '#ef4444' : '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 14px Poppins';
          ctx.textAlign = 'center';
          ctx.fillText((index + 1).toString(), x, y + 5);
        });
      }

      // Slide counter
      if (!playing && slides.length > 1) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(10, 10, 200, 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Poppins';
        ctx.textAlign = 'left';
        ctx.fillText(`Slide ${slideIndex + 1} of ${slides.length}`, 20, 30);
      }

      // Click ripple + cursor during playback
      if (playing && transitionProg === 0 && slide.zoomPoints.length > 0) {
        if (prog < 0.2 && pointIndex < slide.zoomPoints.length) {
          const clickP = prog / 0.2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, 15 * clickP, 0, 2 * Math.PI);
          ctx.strokeStyle = `rgba(255, 255, 255, ${1 - clickP})`;
          ctx.lineWidth = 3 * (1 - clickP) + 1;
          ctx.stroke();
        }
        drawCursor(ctx, centerX, centerY);
      }
    },
    [
      slides,
      zoomLevel,
      transitionType,
      textColor,
      textBgColor,
      textAnimation,
      textFontFamily,
      textPadding,
      textBorderRadius,
      drawBackground,
      drawCursor,
      imageRefs,
    ]
  );

  const getTotalAnimationTime = useCallback(() => {
    let total = 0;
    slides.forEach((slide, index) => {
      if (index > 0) total += transitionDuration;
      const segments = slide.zoomPoints.length > 0 ? slide.zoomPoints.length + 1 : 0;
      total += segments * zoomDuration;
    });
    return total;
  }, [slides, transitionDuration, zoomDuration]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecordingRef.current) {
      mediaRecorderRef.current.stop();
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  }, []);

  const animate = useCallback(() => {
    if (slides.length === 0) {
      setIsPlaying(false);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const startTime = Date.now();
    const totalDuration = getTotalAnimationTime();
    let currentAudio: HTMLAudioElement | null = null;

    const step = () => {
      const elapsed = Date.now() - startTime;
      const totalProgress = elapsed / totalDuration;

      if (totalProgress >= 1) {
        setProgress(1);
        setCurrentPointIndex(slides[slides.length - 1]?.zoomPoints.length - 1 || 0);
        setCurrentSlideIndex(slides.length - 1);
        setSlideTransition(0);
        setIsPlaying(false);
        if (isRecordingRef.current) stopRecording();
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
        return;
      }

      let accumulatedTime = 0;
      let currentSlideIdx = 0;
      let currentPoint = 0;
      let pointProgress = 0;
      let slideTransitionProg = 0;

      for (let slideIdx = 0; slideIdx < slides.length; slideIdx++) {
        const slide = slides[slideIdx];

        if (slideIdx > 0) {
          if (elapsed <= accumulatedTime + transitionDuration) {
            currentSlideIdx = slideIdx;
            slideTransitionProg = (elapsed - accumulatedTime) / transitionDuration;
            break;
          }
          accumulatedTime += transitionDuration;
        }

        const numSegments = slide.zoomPoints.length > 0 ? slide.zoomPoints.length + 1 : 0;
        const slideZoomTime = numSegments * zoomDuration;

        if (elapsed <= accumulatedTime + slideZoomTime) {
          currentSlideIdx = slideIdx;
          const slideElapsed = elapsed - accumulatedTime;
          currentPoint = Math.floor(slideElapsed / zoomDuration);
          pointProgress = (slideElapsed % zoomDuration) / zoomDuration;
          break;
        }
        accumulatedTime += slideZoomTime;
      }

      setCurrentSlideIndex(currentSlideIdx);
      setCurrentPointIndex(currentPoint);
      setProgress(pointProgress);
      setSlideTransition(slideTransitionProg);

      drawFrame(ctx, currentSlideIdx, currentPoint, pointProgress, slideTransitionProg, true);

      const newAudio = audioRefs.current[slides[currentSlideIdx].id];
      if (newAudio && newAudio !== currentAudio) {
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
        newAudio.currentTime = 0;
        newAudio.play().catch(err => console.error('Audio play error:', err));
        currentAudio = newAudio;
      }

      animationRef.current = requestAnimationFrame(step);
    };

    step();
  }, [
    slides,
    getTotalAnimationTime,
    drawFrame,
    zoomDuration,
    transitionDuration,
    setCurrentSlideIndex,
    audioRefs,
    stopRecording,
  ]);

  const startAnimation = useCallback(() => {
    const hasAnyZoomPoints = slides.some(slide => slide.zoomPoints.length > 0);
    if (!hasAnyZoomPoints) return;
    setIsPlaying(true);
    setCurrentSlideIndex(0);
    setCurrentPointIndex(0);
    setProgress(0);
    setSlideTransition(0);
  }, [slides, setCurrentSlideIndex]);

  const stopAnimation = useCallback(() => {
    setIsPlaying(false);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    Object.values(audioRefs.current).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }, [audioRefs]);

  const resetAnimation = useCallback(() => {
    stopAnimation();
    setCurrentSlideIndex(0);
    setCurrentPointIndex(0);
    setProgress(0);
    setSlideTransition(0);
    Object.values(audioRefs.current).forEach(audio => (audio.currentTime = 0));

    if (slides.length > 0 && imageRefs.current) {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) drawFrame(ctx, 0, 0, 0, 0, false);
    }
  }, [stopAnimation, setCurrentSlideIndex, audioRefs, slides, drawFrame]);

  const startRecording = useCallback(() => {
    if (isRecordingRef.current) return;
    isRecordingRef.current = true;
    setIsRecording(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasStream = canvas.captureStream(30);
    const audioStreams: MediaStream[] = [];

    audioContextRef.current = new AudioContext();
    const audioContext = audioContextRef.current;

    slides.forEach(slide => {
      if (slide.audio && audioRefs.current[slide.id]) {
        const audio = audioRefs.current[slide.id];
        audio.currentTime = 0;
        const source = audioContext.createMediaElementSource(audio);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        source.connect(audioContext.destination);
        audioStreams.push(destination.stream);
      }
    });

    const stream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioStreams.flatMap(s => s.getAudioTracks()),
    ]);

    mediaRecorderRef.current = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
    });
    recordedChunks.current = [];

    mediaRecorderRef.current.ondataavailable = event => {
      if (event.data.size > 0) recordedChunks.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'duprun-video.webm';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      isRecordingRef.current = false;
      setIsRecording(false);

      try {
        const res = await fetch('/api/user/record-export', { method: 'POST' });
        const data = await res.json();
        if (data.success) await fetchPlanLimits();
      } catch (err) {
        console.error('Failed to record export:', err);
      }
    };

    mediaRecorderRef.current.start();
  }, [slides, audioRefs, fetchPlanLimits]);

  const createAndDownloadVideo = useCallback(() => {
    const hasAnyZoomPoints = slides.some(slide => slide.zoomPoints.length > 0);
    if (!hasAnyZoomPoints || isRecordingRef.current) return;

    if (!planLimits?.hasAccess) {
      triggerLimitError();
      return;
    }

    startRecording();
    startAnimation();
  }, [slides, planLimits, triggerLimitError, startRecording, startAnimation]);

  // Start/stop animation loop when isPlaying changes
  useEffect(() => {
    if (isPlaying) animate();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, animate]);

  // Reset point/progress when slide changes
  useEffect(() => {
    setCurrentPointIndex(0);
    setProgress(0);
    setSlideTransition(0);
  }, [currentSlideIndex]);

  return {
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
  };
};

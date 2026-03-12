'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Slide, PlanLimits, VideoSettings, AspectRatio } from '@/types/duprun';

interface UseCanvasAnimationParams {
  slides: Slide[];
  currentSlideIndex: number;
  setCurrentSlideIndex: (idx: number) => void;
  audioRefs: React.MutableRefObject<Record<string, HTMLAudioElement>>;
  imageRefs: React.MutableRefObject<Record<string, HTMLImageElement>>;
  backgroundImageRef: React.MutableRefObject<HTMLImageElement | null>;
  webcamRef: React.MutableRefObject<HTMLVideoElement | null>;
  settings: VideoSettings;
  planLimits: PlanLimits | null;
  fetchPlanLimits: () => Promise<void>;
  triggerLimitError: () => void;
}

const lerp = (start: number, end: number, t: number) => start + (end - start) * t;
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// Canvas dimensions per aspect ratio
export const CANVAS_SIZES: Record<AspectRatio, { w: number; h: number }> = {
  '16:9': { w: 1440, h: 810 },
  '9:16': { w: 810, h: 1440 },
  '1:1':  { w: 1080, h: 1080 },
  '4:3':  { w: 1440, h: 1080 },
};

export const CANVAS_SIZES_4K: Record<AspectRatio, { w: number; h: number }> = {
  '16:9': { w: 3840, h: 2160 },
  '9:16': { w: 2160, h: 3840 },
  '1:1':  { w: 2160, h: 2160 },
  '4:3':  { w: 2880, h: 2160 },
};

export const useCanvasAnimation = ({
  slides,
  currentSlideIndex,
  setCurrentSlideIndex,
  audioRefs,
  imageRefs,
  backgroundImageRef,
  webcamRef,
  settings,
  planLimits,
  fetchPlanLimits,
  triggerLimitError,
}: UseCanvasAnimationParams) => {
  const [isPlaying, setIsPlaying]           = useState(false);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [progress, setProgress]             = useState(0);
  const [isRecording, setIsRecording]       = useState(false);
  const [slideTransition, setSlideTransition] = useState(0);

  const canvasRef        = useRef<HTMLCanvasElement>(null);
  const animationRef     = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks   = useRef<Blob[]>([]);
  const isRecordingRef   = useRef<boolean>(false);
  const audioContextRef  = useRef<AudioContext | null>(null);
  // For GIF export — frame snapshots
  const gifFramesRef     = useRef<ImageData[]>([]);
  const gifCapturingRef  = useRef<boolean>(false);

  const {
    zoomLevel, zoomDuration, transitionDuration, transitionType,
    cursorType, textColor, textBgColor, textAnimation,
    textFontFamily, textPadding, textBorderRadius,
    backgroundType, aspectRatio, exportFormat,
    webcamEnabled, webcamX, webcamY, webcamSize, webcamMirror,
  } = settings;

  // ─── Canvas size from aspect ratio ─────────────────────────────────────────
  const getCanvasSize = useCallback((fourK = false) => {
    const map = fourK ? CANVAS_SIZES_4K : CANVAS_SIZES;
    return map[aspectRatio] ?? { w: 1440, h: 810 };
  }, [aspectRatio]);

  // ─── Background ────────────────────────────────────────────────────────────
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (backgroundType === 'none') return;
    if (backgroundType === 'custom' && backgroundImageRef.current) {
      ctx.drawImage(backgroundImageRef.current, 0, 0, width, height);
      return;
    }
    const gradients: Record<string, [string, string]> = {
      gradient1: ['#000000', '#434343'],
      gradient2: ['#0000ff', '#800080'],
      gradient3: ['#008000', '#0000ff'],
      gradient4: ['#ff0000', '#ffa500'],
    };
    const colors = gradients[backgroundType];
    if (!colors) return;
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, colors[0]);
    g.addColorStop(1, colors[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }, [backgroundType, backgroundImageRef]);

  // ─── Cursor ────────────────────────────────────────────────────────────────
  const drawCursor = useCallback((ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
    ctx.beginPath();
    switch (cursorType) {
      case 'arrow':
        ctx.moveTo(cx, cy); ctx.lineTo(cx - 10, cy + 15); ctx.lineTo(cx - 4, cy + 12);
        ctx.lineTo(cx, cy + 24); ctx.lineTo(cx + 4, cy + 12); ctx.lineTo(cx + 10, cy + 15);
        ctx.lineTo(cx, cy); break;
      case 'pointer':
        ctx.moveTo(cx, cy); ctx.lineTo(cx + 10, cy + 10); ctx.lineTo(cx + 5, cy + 15);
        ctx.lineTo(cx, cy + 10); ctx.lineTo(cx - 5, cy + 15); ctx.lineTo(cx - 10, cy + 10);
        ctx.lineTo(cx, cy); break;
      case 'hand':
        ctx.arc(cx, cy + 10, 8, 0, Math.PI * 2); ctx.moveTo(cx - 4, cy + 10);
        ctx.lineTo(cx - 4, cy - 5); ctx.lineTo(cx, cy - 10); ctx.lineTo(cx + 4, cy - 5);
        ctx.lineTo(cx + 4, cy + 10); break;
      case 'crosshair':
        ctx.moveTo(cx - 10, cy); ctx.lineTo(cx + 10, cy);
        ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy + 10); break;
    }
    ctx.fillStyle = 'white'; ctx.fill();
    ctx.strokeStyle = 'black'; ctx.lineWidth = 1; ctx.stroke();
  }, [cursorType]);

  // ─── Webcam circle ─────────────────────────────────────────────────────────
  const drawWebcam = useCallback((ctx: CanvasRenderingContext2D, cw: number, ch: number) => {
    const video = webcamRef.current;
    if (!video || video.readyState < 2) return;

    const cx = webcamX * cw;
    const cy = webcamY * ch;
    const r  = webcamSize;

    ctx.save();

    // Shadow ring
    ctx.beginPath();
    ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fill();

    // Clip circle
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Mirror or normal draw
    if (webcamMirror) {
      ctx.translate(cx * 2, 0);
      ctx.scale(-1, 1);
    }

    // Cover-fit video into circle
    const vw = video.videoWidth  || 640;
    const vh = video.videoHeight || 480;
    const scale = (r * 2) / Math.min(vw, vh);
    const dw = vw * scale;
    const dh = vh * scale;
    ctx.drawImage(video, cx - dw / 2, cy - dh / 2, dw, dh);

    ctx.restore();

    // Glowing border
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Subtle indigo glow
    ctx.beginPath();
    ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(99,102,241,0.45)';
    ctx.lineWidth = 4;
    ctx.stroke();
  }, [webcamRef, webcamX, webcamY, webcamSize, webcamMirror]);

  // ─── Enhanced Click Ripple ─────────────────────────────────────────────────
  const drawRipple = useCallback((ctx: CanvasRenderingContext2D, cx: number, cy: number, prog: number) => {
    // 3 concentric rings at staggered phases
    const rings = [
      { delay: 0.0,  maxR: 40, color: '255,255,255' },
      { delay: 0.08, maxR: 60, color: '165,180,252' },
      { delay: 0.16, maxR: 80, color: '99,102,241'  },
    ];
    rings.forEach(({ delay, maxR, color }) => {
      const p = Math.max(0, Math.min(1, (prog - delay) / 0.3));
      if (p <= 0) return;
      const radius = maxR * easeInOutCubic(p);
      const alpha  = (1 - p) * 0.7;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${color},${alpha})`;
      ctx.lineWidth = 2.5 * (1 - p) + 0.5;
      ctx.stroke();
    });
    // Centre dot pulse
    const dotP = Math.min(1, prog / 0.15);
    ctx.beginPath();
    ctx.arc(cx, cy, 6 * dotP, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${(1 - dotP) * 0.9})`;
    ctx.fill();
  }, []);

  // ─── Draw Frame ────────────────────────────────────────────────────────────
  const drawFrame = useCallback((
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
    const img   = imageRefs.current[slide.id];
    if (!img) return;

    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);
    drawBackground(ctx, W, H);

    // Zoom / pan calculation
    let currentZoom = 1;
    let centerX = W / 2;
    let centerY = H / 2;

    if (playing || transitionProg > 0) {
      if (slide.zoomPoints.length > 0) {
        if (pointIndex === 0) {
          currentZoom = lerp(1, zoomLevel, easeInOutCubic(prog));
          const fp = slide.zoomPoints[0];
          centerX = lerp(W / 2, fp.x * W, easeInOutCubic(prog));
          centerY = lerp(H / 2, fp.y * H, easeInOutCubic(prog));
        } else if (pointIndex < slide.zoomPoints.length) {
          currentZoom = zoomLevel;
          const prev = slide.zoomPoints[pointIndex - 1];
          const curr = slide.zoomPoints[pointIndex];
          const sp = easeInOutCubic(prog);
          centerX = lerp(prev.x * W, curr.x * W, sp);
          centerY = lerp(prev.y * H, curr.y * H, sp);
        } else {
          currentZoom = lerp(zoomLevel, 1, easeInOutCubic(prog));
          const last = slide.zoomPoints[slide.zoomPoints.length - 1];
          centerX = lerp(last.x * W, W / 2, easeInOutCubic(prog));
          centerY = lerp(last.y * H, H / 2, easeInOutCubic(prog));
        }
      }
    }

    // Image draw helper
    const drawImg = (image: HTMLImageElement, alpha = 1, offsetXExtra = 0) => {
      const s   = Math.min(W / image.width, H / image.height);
      const dw  = image.width * s;
      const dh  = image.height * s;
      const ox  = (W - dw) / 2 + offsetXExtra;
      const oy  = (H - dh) / 2;
      ctx.globalAlpha = alpha;
      ctx.drawImage(image, ox, oy, dw, dh);
      ctx.globalAlpha = 1;
    };

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(currentZoom, currentZoom);
    ctx.translate(-centerX, -centerY);

    if (transitionProg > 0 && slideIndex > 0) {
      const prevSlide = slides[slideIndex - 1];
      const prevImg   = imageRefs.current[prevSlide.id];
      if (prevImg) {
        if (transitionType === 'fade') {
          drawImg(prevImg, 1 - transitionProg);
          drawImg(img, transitionProg);
        } else if (transitionType === 'slide') {
          drawImg(prevImg, 1, -W * transitionProg);
          drawImg(img, 1, W * (1 - transitionProg));
        } else {
          drawImg(img);
        }
      } else {
        drawImg(img);
      }
    } else {
      drawImg(img);
    }

    ctx.restore();

    // Text overlay
    if (playing && pointIndex < slide.zoomPoints.length) {
      const text = slide.zoomPoints[pointIndex].text;
      if (text) {
        ctx.font = `bold 30px ${textFontFamily}`;
        ctx.textAlign = 'center';
        let textOpacity = 1;
        let textY = H - 50;
        if (textAnimation === 'fade-in' && prog < 0.5) textOpacity = prog / 0.5;
        else if (textAnimation === 'slide-in' && prog < 0.5) textY = H - 50 + (50 * (0.5 - prog)) / 0.5;

        if (textBgColor !== 'transparent') {
          const tw = ctx.measureText(text).width;
          ctx.globalAlpha = textOpacity;
          ctx.fillStyle = textBgColor;
          ctx.beginPath();
          (ctx as any).roundRect(W / 2 - tw / 2 - textPadding, H - 70, tw + textPadding * 2, 40, textBorderRadius);
          ctx.fill();
        }
        ctx.globalAlpha = textOpacity;
        ctx.fillStyle = textColor;
        ctx.fillText(text, W / 2, textY);
        ctx.globalAlpha = 1;
      }
    }

    // Zoom point markers (edit mode)
    if (!playing && transitionProg === 0) {
      slide.zoomPoints.forEach((point, index) => {
        const x = point.x * W;
        const y = point.y * H;
        // Outer glow ring
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.fillStyle = index === currentPointIndex
          ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)';
        ctx.fill();
        // Main dot
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fillStyle = index === currentPointIndex ? '#ef4444' : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Number
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 13px Poppins';
        ctx.textAlign = 'center';
        ctx.fillText((index + 1).toString(), x, y + 4.5);
      });
    }

    // Slide counter (edit mode)
    if (!playing && slides.length > 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(10, 10, 200, 30);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Poppins';
      ctx.textAlign = 'left';
      ctx.fillText(`Slide ${slideIndex + 1} of ${slides.length}`, 20, 30);
    }

    // Ripple + cursor (playback)
    if (playing && transitionProg === 0 && slide.zoomPoints.length > 0) {
      if (prog < 0.45 && pointIndex < slide.zoomPoints.length) {
        drawRipple(ctx, centerX, centerY, prog / 0.45);
      }
      drawCursor(ctx, centerX, centerY);
    }

    // Webcam circle (drawn last — always on top)
    if (webcamEnabled) {
      drawWebcam(ctx, W, H);
    }

    // GIF frame capture
    if (gifCapturingRef.current && canvasRef.current) {
      gifFramesRef.current.push(ctx.getImageData(0, 0, W, H));
    }
  }, [
    slides, zoomLevel, transitionType,
    textColor, textBgColor, textAnimation, textFontFamily, textPadding, textBorderRadius,
    drawBackground, drawCursor, drawRipple, drawWebcam,
    imageRefs, webcamEnabled,
  ]);

  // ─── Per-slide segment duration helper ─────────────────────────────────────
  const getSegmentDuration = useCallback((slide: Slide) => {
    return slide.slideDuration ?? zoomDuration;
  }, [zoomDuration]);

  const getTotalAnimationTime = useCallback(() => {
    let total = 0;
    slides.forEach((slide, index) => {
      if (index > 0) total += transitionDuration;
      const segments = slide.zoomPoints.length > 0 ? slide.zoomPoints.length + 1 : 0;
      total += segments * getSegmentDuration(slide);
    });
    return total;
  }, [slides, transitionDuration, getSegmentDuration]);

  // ─── Stop recording ─────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecordingRef.current) {
      mediaRecorderRef.current.stop();
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  }, []);

  // ─── Animation loop ─────────────────────────────────────────────────────────
  const animate = useCallback(() => {
    if (slides.length === 0) { setIsPlaying(false); return; }
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
        if (gifCapturingRef.current) { gifCapturingRef.current = false; }
        if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; }
        return;
      }

      let accTime = 0;
      let curSlideIdx = 0;
      let curPoint = 0;
      let pointProg = 0;
      let slideTrans = 0;

      for (let si = 0; si < slides.length; si++) {
        const slide = slides[si];
        const segDur = getSegmentDuration(slide);

        if (si > 0) {
          if (elapsed <= accTime + transitionDuration) {
            curSlideIdx = si;
            slideTrans = (elapsed - accTime) / transitionDuration;
            break;
          }
          accTime += transitionDuration;
        }

        const numSegments = slide.zoomPoints.length > 0 ? slide.zoomPoints.length + 1 : 0;
        const slideZoomTime = numSegments * segDur;

        if (elapsed <= accTime + slideZoomTime) {
          curSlideIdx = si;
          const slideElapsed = elapsed - accTime;
          curPoint = Math.floor(slideElapsed / segDur);
          pointProg = (slideElapsed % segDur) / segDur;
          break;
        }
        accTime += slideZoomTime;
      }

      setCurrentSlideIndex(curSlideIdx);
      setCurrentPointIndex(curPoint);
      setProgress(pointProg);
      setSlideTransition(slideTrans);
      drawFrame(ctx, curSlideIdx, curPoint, pointProg, slideTrans, true);

      const newAudio = audioRefs.current[slides[curSlideIdx].id];
      if (newAudio && newAudio !== currentAudio) {
        if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; }
        newAudio.currentTime = 0;
        newAudio.play().catch(err => console.error('Audio play error:', err));
        currentAudio = newAudio;
      }

      animationRef.current = requestAnimationFrame(step);
    };

    step();
  }, [
    slides, getTotalAnimationTime, drawFrame, transitionDuration,
    getSegmentDuration, setCurrentSlideIndex, audioRefs, stopRecording,
  ]);

  // ─── Start / Stop / Reset ───────────────────────────────────────────────────
  const startAnimation = useCallback(() => {
    const hasAnyZoomPoints = slides.some(s => s.zoomPoints.length > 0);
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
    Object.values(audioRefs.current).forEach(a => { a.pause(); a.currentTime = 0; });
  }, [audioRefs]);

  const resetAnimation = useCallback(() => {
    stopAnimation();
    setCurrentSlideIndex(0);
    setCurrentPointIndex(0);
    setProgress(0);
    setSlideTransition(0);
    Object.values(audioRefs.current).forEach(a => (a.currentTime = 0));
    if (slides.length > 0) {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) drawFrame(ctx, 0, 0, 0, 0, false);
    }
  }, [stopAnimation, setCurrentSlideIndex, audioRefs, slides, drawFrame]);

  // ─── WebM / 4K WebM Recording ───────────────────────────────────────────────
  const startWebMRecording = useCallback((fourK = false) => {
    if (isRecordingRef.current) return;
    isRecordingRef.current = true;
    setIsRecording(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Resize canvas for 4K if needed
    if (fourK) {
      const size = getCanvasSize(true);
      canvas.width  = size.w;
      canvas.height = size.h;
    }

    const canvasStream = canvas.captureStream(30);
    audioContextRef.current = new AudioContext();
    const audioContext = audioContextRef.current;
    const audioStreams: MediaStream[] = [];

    slides.forEach(slide => {
      if (slide.audio && audioRefs.current[slide.id]) {
        const audio = audioRefs.current[slide.id];
        audio.currentTime = 0;
        const source = audioContext.createMediaElementSource(audio);
        const dest   = audioContext.createMediaStreamDestination();
        source.connect(dest);
        source.connect(audioContext.destination);
        audioStreams.push(dest.stream);
      }
    });

    const stream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioStreams.flatMap(s => s.getAudioTracks()),
    ]);

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9' : 'video/webm';

    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
    recordedChunks.current = [];

    mediaRecorderRef.current.ondataavailable = e => {
      if (e.data.size > 0) recordedChunks.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = fourK ? 'duprun-video-4k.webm' : 'duprun-video.webm';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);

      Object.values(audioRefs.current).forEach(a => { a.pause(); a.currentTime = 0; });
      if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }

      // Restore normal canvas size if 4K
      if (fourK) {
        const size = getCanvasSize(false);
        if (canvasRef.current) {
          canvasRef.current.width  = size.w;
          canvasRef.current.height = size.h;
        }
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
  }, [slides, audioRefs, fetchPlanLimits, getCanvasSize]);

  // ─── GIF Export ─────────────────────────────────────────────────────────────
  // Uses gif.js — npm install gif.js
  // Worker file must be at /public/gif.worker.js (copy from node_modules/gif.js/dist/)
  const startGifRecording = useCallback(() => {
    if (isRecordingRef.current) return;
    isRecordingRef.current = true;
    setIsRecording(true);
    gifFramesRef.current = [];
    gifCapturingRef.current = true;
  }, []);

  const finishGifExport = useCallback(async () => {
    gifCapturingRef.current = false;
    const frames = gifFramesRef.current;
    if (frames.length === 0) { setIsRecording(false); isRecordingRef.current = false; return; }

    const canvas = canvasRef.current;
    if (!canvas) { setIsRecording(false); isRecordingRef.current = false; return; }

    try {
      // Dynamic import gif.js
      const GIF = (await import('gif.js')).default;
      const gif = new GIF({
        workers: 2,
        quality: 8,
        width: canvas.width,
        height: canvas.height,
        workerScript: '/gif.worker.js',
      });

      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = canvas.width;
      tmpCanvas.height = canvas.height;
      const tmpCtx = tmpCanvas.getContext('2d')!;

      const frameDelay = Math.round(1000 / 24); // 24fps
      const step = Math.max(1, Math.floor(frames.length / 200)); // cap at ~200 frames
      for (let i = 0; i < frames.length; i += step) {
        tmpCtx.putImageData(frames[i], 0, 0);
        gif.addFrame(tmpCanvas, { copy: true, delay: frameDelay });
      }

      gif.on('finished', (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href = url; a.download = 'duprun-animation.gif';
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        setIsRecording(false);
        isRecordingRef.current = false;
        gifFramesRef.current = [];
      });

      gif.render();
    } catch (err) {
      console.error('GIF export failed. Did you run: npm install gif.js ?', err);
      alert('GIF export needs: npm install gif.js\nAlso copy gif.worker.js to /public/');
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  }, []);

  // ─── Master export dispatcher ───────────────────────────────────────────────
  const createAndDownloadVideo = useCallback(() => {
    const hasAnyZoomPoints = slides.some(s => s.zoomPoints.length > 0);
    if (!hasAnyZoomPoints || isRecordingRef.current) return;
    if (!planLimits?.hasAccess) { triggerLimitError(); return; }

    if (exportFormat === 'gif') {
      startGifRecording();
      startAnimation();
      // When animation ends, isPlaying goes false — finishGifExport is triggered via useEffect below
    } else if (exportFormat === '4k-webm') {
      startWebMRecording(true);
      startAnimation();
    } else {
      startWebMRecording(false);
      startAnimation();
    }
  }, [slides, planLimits, triggerLimitError, exportFormat, startGifRecording, startWebMRecording, startAnimation]);

  // ─── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isPlaying) animate();
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isPlaying, animate]);

  useEffect(() => {
    setCurrentPointIndex(0);
    setProgress(0);
    setSlideTransition(0);
  }, [currentSlideIndex]);

  // Trigger GIF finish when animation stops
  useEffect(() => {
    if (!isPlaying && gifCapturingRef.current) {
      finishGifExport();
    }
  }, [isPlaying, finishGifExport]);

  // Resize canvas when aspect ratio changes
  useEffect(() => {
    const size = getCanvasSize(false);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width  = size.w;
      canvas.height = size.h;
    }
  }, [aspectRatio, getCanvasSize]);

  return {
    isPlaying, currentPointIndex, progress, isRecording, slideTransition,
    canvasRef, drawFrame, startAnimation, stopAnimation, resetAnimation,
    createAndDownloadVideo, getTotalAnimationTime,
  };
};

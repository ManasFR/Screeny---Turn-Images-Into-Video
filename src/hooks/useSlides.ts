'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Slide, ZoomPoint } from '@/types/duprun';

export const useSlides = () => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const imageRefs = useRef<Record<string, HTMLImageElement>>({});

  const currentSlide = slides[currentSlideIndex] ?? null;

  useEffect(() => {
    const slidesWithoutMedia = slides.map(slide => ({
      id: slide.id,
      title: slide.title,
      zoomPoints: slide.zoomPoints,
      slideDuration: slide.slideDuration,
    }));
    try {
      localStorage.setItem('duprunSlidesMetadata', JSON.stringify(slidesWithoutMedia));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [slides]);

  const addSlide = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    files.forEach(file => {
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newSlide: Slide = {
            id: Date.now() + Math.random(),
            image: e.target?.result as string,
            zoomPoints: [],
            title: file.name,
            audio: null,
            slideDuration: undefined, // uses global zoomDuration
          };
          setSlides(prev => [...prev, newSlide]);
        };
        reader.readAsDataURL(file);
      }
    });
    event.target.value = '';
  }, []);

  const removeSlide = useCallback((slideId: number, currentIdx: number) => {
    setSlides(prev => {
      const newSlides = prev.filter(slide => slide.id !== slideId);
      const newIndex = currentIdx >= newSlides.length
        ? Math.max(0, newSlides.length - 1)
        : currentIdx;
      setCurrentSlideIndex(newIndex);
      return newSlides;
    });
    delete audioRefs.current[slideId];
    delete imageRefs.current[slideId];
  }, []);

  const addSlideMusic = useCallback((event: React.ChangeEvent<HTMLInputElement>, slideId: number) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSlides(prev =>
          prev.map(slide =>
            slide.id === slideId
              ? { ...slide, audio: e.target?.result as string }
              : slide
          )
        );
        if (!audioRefs.current[slideId]) audioRefs.current[slideId] = new Audio();
        audioRefs.current[slideId].src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  }, []);

  // ── NEW: per-slide duration override ────────────────────────────
  const updateSlideDuration = useCallback((slideId: number, duration: number | undefined) => {
    setSlides(prev =>
      prev.map(slide =>
        slide.id === slideId ? { ...slide, slideDuration: duration } : slide
      )
    );
  }, []);

  const updatePointText = useCallback((pointId: number, newText: string, slideId: number) => {
    setSlides(prev =>
      prev.map(slide =>
        slide.id === slideId
          ? {
              ...slide,
              zoomPoints: slide.zoomPoints.map(point =>
                point.id === pointId ? { ...point, text: newText } : point
              ),
            }
          : slide
      )
    );
  }, []);

  const removeZoomPoint = useCallback((pointId: number, slideId: number) => {
    setSlides(prev =>
      prev.map(slide =>
        slide.id === slideId
          ? { ...slide, zoomPoints: slide.zoomPoints.filter(point => point.id !== pointId) }
          : slide
      )
    );
  }, []);

  const clearAllPoints = useCallback((slideId: number) => {
    setSlides(prev =>
      prev.map(slide => slide.id === slideId ? { ...slide, zoomPoints: [] } : slide)
    );
  }, []);

  const navigateSlide = useCallback((direction: 'prev' | 'next') => {
    setCurrentSlideIndex(prev => {
      if (direction === 'prev' && prev > 0) return prev - 1;
      if (direction === 'next' && prev < slides.length - 1) return prev + 1;
      return prev;
    });
  }, [slides.length]);

  const addZoomPoint = useCallback((x: number, y: number, slideId: number) => {
    const newPoint: ZoomPoint = { id: Date.now(), x, y, isDragging: false, text: '' };
    setSlides(prev =>
      prev.map(slide =>
        slide.id === slideId
          ? { ...slide, zoomPoints: [...slide.zoomPoints, newPoint] }
          : slide
      )
    );
  }, []);

  const startDragPoint = useCallback((pointId: number, slideId: number) => {
    setSlides(prev =>
      prev.map(slide =>
        slide.id === slideId
          ? {
              ...slide,
              zoomPoints: slide.zoomPoints.map(point =>
                point.id === pointId
                  ? { ...point, isDragging: true }
                  : { ...point, isDragging: false }
              ),
            }
          : slide
      )
    );
  }, []);

  const moveDragPoint = useCallback((normX: number, normY: number, slideId: number) => {
    setSlides(prev =>
      prev.map(slide => {
        if (slide.id !== slideId) return slide;
        const dragging = slide.zoomPoints.find(p => p.isDragging);
        if (!dragging) return slide;
        return {
          ...slide,
          zoomPoints: slide.zoomPoints.map(point =>
            point.id === dragging.id
              ? { ...point, x: Math.max(0, Math.min(1, normX)), y: Math.max(0, Math.min(1, normY)) }
              : point
          ),
        };
      })
    );
  }, []);

  const stopDragPoint = useCallback((slideId: number) => {
    setSlides(prev =>
      prev.map(slide =>
        slide.id === slideId
          ? { ...slide, zoomPoints: slide.zoomPoints.map(point => ({ ...point, isDragging: false })) }
          : slide
      )
    );
  }, []);

  return {
    slides, setSlides,
    currentSlideIndex, setCurrentSlideIndex,
    currentSlide, audioRefs, imageRefs,
    addSlide, removeSlide, addSlideMusic,
    updateSlideDuration,
    updatePointText, removeZoomPoint, clearAllPoints,
    navigateSlide, addZoomPoint,
    startDragPoint, moveDragPoint, stopDragPoint,
  };
};

'use client';

import { useState } from 'react';
import { Plus, Trash2, Music2, Clock } from 'lucide-react';
import { Slide } from '@/types/duprun';

interface SlideManagerProps {
  slides: Slide[];
  currentSlideIndex: number;
  onAddSlide: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveSlide: (slideId: number, currentIdx: number) => void;
  onSelectSlide: (index: number) => void;
  onAddMusic: (event: React.ChangeEvent<HTMLInputElement>, slideId: number) => void;
  onUpdateDuration: (slideId: number, duration: number | undefined) => void;
  currentSlide: Slide | null;
}

const sectionTitle: React.CSSProperties = {
  fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.38)',
};

const SlideManager = ({
  slides, currentSlideIndex, onAddSlide, onRemoveSlide, onSelectSlide,
  onAddMusic, onUpdateDuration, currentSlide,
}: SlideManagerProps) => {
  // Track which slide is showing the duration editor
  const [editingDurationId, setEditingDurationId] = useState<number | null>(null);

  return (
    <div>
      {/* Add Images */}
      <label
        className="flex flex-col items-center justify-center w-full cursor-pointer transition-all duration-200 mb-4"
        style={{ height: '76px', borderRadius: '14px', border: '1.5px dashed rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.05)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.6)'; (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.1)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.05)'; }}
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-1.5" style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.35)' }}>
          <Plus className="w-3.5 h-3.5" style={{ color: 'rgba(129,140,248,0.9)' }} />
        </div>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(199,210,254,0.85)' }}>Add Images</span>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', marginTop: '2px' }}>Multiple selection supported</span>
        <input type="file" accept="image/*" multiple onChange={onAddSlide} className="hidden" />
      </label>

      {/* Slide list */}
      {slides.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span style={sectionTitle}>Slides</span>
            <span className="tabular-nums px-2 py-0.5 rounded-md" style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(129,140,248,0.8)', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
              {slides.length}
            </span>
          </div>

          <div className="flex flex-col gap-1.5" style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {slides.map((slide, index) => {
              const isActive = index === currentSlideIndex;
              const isEditingDuration = editingDurationId === slide.id;
              const hasCustomDuration = slide.slideDuration !== undefined;

              return (
                <div key={slide.id}>
                  <div
                    onClick={() => onSelectSlide(index)}
                    className="flex items-center justify-between cursor-pointer transition-all duration-150"
                    style={{
                      padding: '8px 10px', borderRadius: isEditingDuration ? '12px 12px 0 0' : '12px',
                      background: isActive ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                      border: '1px solid', borderBottom: isEditingDuration ? 'none' : undefined,
                      borderColor: isActive ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Thumbnail */}
                      <div className="flex-shrink-0 overflow-hidden" style={{ width: '38px', height: '24px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <img src={slide.image} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: isActive ? 'rgba(199,210,254,0.95)' : 'rgba(255,255,255,0.7)' }}>
                          Slide {index + 1}
                        </span>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                          {slide.zoomPoints.length} pts{slide.audio ? ' · ♪' : ''}{hasCustomDuration ? ` · ${(slide.slideDuration! / 1000).toFixed(1)}s` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Duration toggle */}
                      <button
                        onClick={e => { e.stopPropagation(); setEditingDurationId(isEditingDuration ? null : slide.id); }}
                        title="Custom duration"
                        style={{
                          width: '24px', height: '24px', borderRadius: '7px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: hasCustomDuration ? 'rgba(251,191,36,0.15)' : 'transparent',
                          border: '1px solid', borderColor: hasCustomDuration ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.08)',
                          color: hasCustomDuration ? 'rgba(251,191,36,0.85)' : 'rgba(255,255,255,0.3)',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        <Clock style={{ width: '11px', height: '11px' }} />
                      </button>

                      <button
                        onClick={e => { e.stopPropagation(); onRemoveSlide(slide.id, currentSlideIndex); }}
                        className="transition-opacity duration-150 opacity-40 hover:opacity-100"
                        style={{ color: 'rgba(248,113,113,0.9)' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* ── Per-slide duration editor ── */}
                  {isEditingDuration && (
                    <div style={{
                      padding: '10px 12px', borderRadius: '0 0 12px 12px',
                      background: 'rgba(251,191,36,0.06)',
                      border: '1px solid rgba(251,191,36,0.2)', borderTop: 'none',
                    }}>
                      <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'rgba(251,191,36,0.6)', marginBottom: '8px' }}>
                        Custom Duration per Zoom Point
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={500}
                          max={15000}
                          step={100}
                          value={slide.slideDuration ?? 3000}
                          onChange={e => onUpdateDuration(slide.id, parseInt(e.target.value))}
                          style={{
                            flex: 1, padding: '7px 10px', borderRadius: '9px',
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(251,191,36,0.25)',
                            color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: 600,
                            fontFamily: 'monospace', outline: 'none',
                          }}
                        />
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>ms</span>
                        <button
                          onClick={() => onUpdateDuration(slide.id, undefined)}
                          style={{
                            padding: '7px 10px', borderRadius: '9px', cursor: 'pointer',
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                            color: 'rgba(255,255,255,0.35)', fontSize: '10px', fontWeight: 600,
                          }}
                        >
                          Reset
                        </button>
                      </div>
                      <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', marginTop: '6px' }}>
                        Overrides global zoom duration for this slide only
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Music */}
      {currentSlide && (
        <label
          className="flex items-center gap-2.5 w-full cursor-pointer transition-all duration-200"
          style={{
            padding: '10px 12px', borderRadius: '12px',
            border: '1px dashed',
            background: currentSlide.audio ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.02)',
            borderColor: currentSlide.audio ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)',
          }}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: currentSlide.audio ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', border: '1px solid', borderColor: currentSlide.audio ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)' }}>
            <Music2 className="w-3.5 h-3.5" style={{ color: currentSlide.audio ? 'rgba(52,211,153,0.9)' : 'rgba(255,255,255,0.3)' }} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: currentSlide.audio ? 'rgba(52,211,153,0.9)' : 'rgba(255,255,255,0.5)' }}>
              {currentSlide.audio ? 'Music Added ✓' : 'Add Music to Slide'}
            </span>
            {!currentSlide.audio && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.22)' }}>MP3, WAV supported</span>}
          </div>
          <input type="file" accept="audio/*" onChange={e => onAddMusic(e, currentSlide.id)} className="hidden" />
        </label>
      )}
    </div>
  );
};

export default SlideManager;

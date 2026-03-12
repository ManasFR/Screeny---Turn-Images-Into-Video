'use client';

import { AspectRatio } from '@/types/duprun';

const TRANSITION_TYPES = ['fade', 'slide', 'none'];
const CURSOR_TYPES     = ['arrow', 'pointer', 'hand', 'crosshair'];

const ASPECT_RATIOS: { value: AspectRatio; label: string; icon: string; sub: string }[] = [
  { value: '16:9', label: '16:9',  icon: '🖥️', sub: 'Widescreen'   },
  { value: '9:16', label: '9:16',  icon: '📱', sub: 'Reels/Shorts' },
  { value: '1:1',  label: '1:1',   icon: '⬛', sub: 'Instagram'    },
  { value: '4:3',  label: '4:3',   icon: '📺', sub: 'Classic'      },
];

interface AnimationSettingsProps {
  zoomLevel: number;           setZoomLevel: (v: number) => void;
  zoomDuration: number;        setZoomDuration: (v: number) => void;
  transitionDuration: number;  setTransitionDuration: (v: number) => void;
  transitionType: string;      setTransitionType: (v: string) => void;
  cursorType: string;          setCursorType: (v: string) => void;
  aspectRatio: AspectRatio;    setAspectRatio: (v: AspectRatio) => void;
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.38)', marginBottom: '8px' }}>
    {children}
  </p>
);

const PillGroup = ({ options, value, onChange, accent = 'indigo' }: {
  options: string[]; value: string; onChange: (v: string) => void; accent?: 'indigo' | 'violet';
}) => {
  const activeColor  = accent === 'indigo' ? 'rgba(99,102,241,0.22)'  : 'rgba(139,92,246,0.22)';
  const activeBorder = accent === 'indigo' ? 'rgba(99,102,241,0.6)'   : 'rgba(139,92,246,0.6)';
  const activeText   = accent === 'indigo' ? 'rgba(165,180,252,1)'    : 'rgba(196,181,253,1)';
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map(opt => (
        <button key={opt} onClick={() => onChange(opt)} style={{
          padding: '5px 12px', borderRadius: '8px', fontSize: '11px',
          fontWeight: value === opt ? 700 : 500, textTransform: 'capitalize' as const,
          background: value === opt ? activeColor : 'rgba(255,255,255,0.04)',
          border: '1px solid', borderColor: value === opt ? activeBorder : 'rgba(255,255,255,0.09)',
          color: value === opt ? activeText : 'rgba(255,255,255,0.42)',
          cursor: 'pointer', transition: 'all 0.15s',
          boxShadow: value === opt ? `0 0 12px ${activeColor}` : 'none',
        }}>{opt}</button>
      ))}
    </div>
  );
};

const SliderInput = ({ value, min, max, step = 1, onChange, unit = '', accent = '#6366f1' }: {
  value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; unit?: string; accent?: string;
}) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="inline-flex items-center px-2 py-0.5 rounded-md mb-2" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.02em' }}>{value}{unit}</span>
      </div>
      <div className="relative h-5 flex items-center">
        <div className="absolute w-full h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="absolute h-1 rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accent}, ${accent}cc)` }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value))}
          className="absolute w-full cursor-pointer" style={{ opacity: 0, height: '20px', zIndex: 2 }} />
        <div className="absolute pointer-events-none" style={{
          left: `calc(${pct}% - 7px)`, width: '14px', height: '14px', borderRadius: '50%',
          background: '#fff', border: `2.5px solid ${accent}`,
          boxShadow: `0 0 0 3px ${accent}30, 0 2px 6px rgba(0,0,0,0.4)`,
        }} />
      </div>
    </div>
  );
};

const AnimationSettings = ({
  zoomLevel, setZoomLevel, zoomDuration, setZoomDuration,
  transitionDuration, setTransitionDuration, transitionType, setTransitionType,
  cursorType, setCursorType, aspectRatio, setAspectRatio,
}: AnimationSettingsProps) => {
  return (
    <div style={{ borderRadius: '16px', padding: '16px', background: 'linear-gradient(160deg, #111114 0%, #0c0c0f 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div style={{ width: '3px', height: '18px', borderRadius: '2px', background: 'linear-gradient(180deg, #6366f1, #818cf8)', boxShadow: '0 0 8px rgba(99,102,241,0.5)' }} />
        <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.65)' }}>Animation</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ── NEW: Aspect Ratio ── */}
        <div>
          <Label>Canvas Size</Label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {ASPECT_RATIOS.map(({ value, label, icon, sub }) => {
              const isActive = aspectRatio === value;
              return (
                <button key={value} onClick={() => setAspectRatio(value)} style={{
                  padding: '9px 8px', borderRadius: '11px', cursor: 'pointer', textAlign: 'left' as const,
                  background: isActive ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.03)',
                  border: '1px solid', borderColor: isActive ? 'rgba(99,102,241,0.55)' : 'rgba(255,255,255,0.07)',
                  transition: 'all 0.15s', boxShadow: isActive ? '0 0 14px rgba(99,102,241,0.15)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '14px' }}>{icon}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: isActive ? 'rgba(165,180,252,0.95)' : 'rgba(255,255,255,0.6)' }}>{label}</span>
                  </div>
                  <span style={{ fontSize: '9px', color: isActive ? 'rgba(165,180,252,0.5)' : 'rgba(255,255,255,0.22)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>{sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Zoom Level */}
        <div style={{ borderRadius: '12px', padding: '12px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Label>Zoom Level</Label>
          <SliderInput value={zoomLevel} min={1} max={10} step={0.1} onChange={setZoomLevel} unit="×" accent="#6366f1" />
        </div>

        {/* Zoom Duration */}
        <div style={{ borderRadius: '12px', padding: '12px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Label>Zoom Duration (per point)</Label>
          <SliderInput value={zoomDuration} min={1000} max={10000} step={100} onChange={setZoomDuration} unit="ms" accent="#818cf8" />
        </div>

        {/* Transition Duration */}
        <div style={{ borderRadius: '12px', padding: '12px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Label>Transition Duration</Label>
          <SliderInput value={transitionDuration} min={500} max={5000} step={100} onChange={setTransitionDuration} unit="ms" accent="#a78bfa" />
        </div>

        {/* Transition Type */}
        <div>
          <Label>Transition Type</Label>
          <PillGroup options={TRANSITION_TYPES} value={transitionType} onChange={setTransitionType} accent="indigo" />
        </div>

        {/* Cursor Style */}
        <div>
          <Label>Cursor Style</Label>
          <PillGroup options={CURSOR_TYPES} value={cursorType} onChange={setCursorType} accent="violet" />
        </div>

      </div>
    </div>
  );
};

export default AnimationSettings;

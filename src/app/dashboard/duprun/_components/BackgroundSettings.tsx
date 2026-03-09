'use client';

import { ImagePlus, Check } from 'lucide-react';

const GRADIENT_OPTIONS = [
  { value: 'none',      label: 'None',          preview: null },
  { value: 'gradient1', label: 'Black → Gray',  preview: 'linear-gradient(135deg,#000,#434343)' },
  { value: 'gradient2', label: 'Blue → Purple', preview: 'linear-gradient(135deg,#0000ff,#800080)' },
  { value: 'gradient3', label: 'Green → Blue',  preview: 'linear-gradient(135deg,#008000,#0000ff)' },
  { value: 'gradient4', label: 'Red → Orange',  preview: 'linear-gradient(135deg,#ff0000,#ffa500)' },
  { value: 'custom',    label: 'Custom',        preview: null },
];

interface BackgroundSettingsProps {
  backgroundType: string;
  backgroundValue: string;
  onBackgroundTypeChange: (type: string) => void;
  onCustomImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const BackgroundSettings = ({
  backgroundType,
  backgroundValue,
  onBackgroundTypeChange,
  onCustomImageUpload,
}: BackgroundSettingsProps) => {
  return (
    <div
      style={{
        borderRadius: '16px',
        padding: '16px',
        background: 'linear-gradient(160deg, #111114 0%, #0c0c0f 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div style={{
          width: '3px', height: '18px', borderRadius: '2px',
          background: 'linear-gradient(180deg, #06b6d4, #0ea5e9)',
          boxShadow: '0 0 8px rgba(6,182,212,0.45)',
        }} />
        <span style={{
          fontSize: '11px', fontWeight: 800, letterSpacing: '0.14em',
          textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.65)',
        }}>
          Background
        </span>
      </div>

      <p style={{
        fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.38)',
        marginBottom: '10px',
      }}>
        Select Style
      </p>

      {/* Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {GRADIENT_OPTIONS.map(opt => {
          const isActive = backgroundType === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onBackgroundTypeChange(opt.value)}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                padding: '6px',
                borderRadius: '12px',
                border: '1px solid',
                borderColor: isActive ? 'rgba(99,102,241,0.65)' : 'rgba(255,255,255,0.08)',
                background: isActive ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.025)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: isActive ? '0 0 14px rgba(99,102,241,0.15)' : 'none',
              }}
            >
              {/* Preview tile */}
              <div style={{
                width: '100%',
                height: '34px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: opt.preview
                  ? opt.preview
                  : opt.value === 'custom'
                  ? 'rgba(255,255,255,0.05)'
                  : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {opt.value === 'none' && (
                  <div style={{
                    width: '20px', height: '1px',
                    background: 'rgba(255,255,255,0.25)',
                  }} />
                )}
                {opt.value === 'custom' && (
                  <ImagePlus style={{ width: '13px', height: '13px', color: 'rgba(255,255,255,0.35)' }} />
                )}
              </div>

              {/* Label */}
              <span style={{
                fontSize: '9px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'rgba(165,180,252,0.95)' : 'rgba(255,255,255,0.38)',
                textAlign: 'center',
                lineHeight: 1.2,
              }}>
                {opt.label}
              </span>

              {/* Active check */}
              {isActive && (
                <div style={{
                  position: 'absolute', top: '4px', right: '4px',
                  width: '14px', height: '14px', borderRadius: '50%',
                  background: 'rgba(99,102,241,0.9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check style={{ width: '8px', height: '8px', color: '#fff', strokeWidth: 3 }} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom upload */}
      {backgroundType === 'custom' && (
        <label
          className="flex items-center gap-2.5 w-full cursor-pointer transition-all duration-150 mt-3"
          style={{
            padding: '10px 12px',
            borderRadius: '12px',
            border: '1px dashed',
            borderColor: backgroundValue ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.12)',
            background: backgroundValue ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.025)',
          }}
        >
          <ImagePlus style={{
            width: '14px', height: '14px', flexShrink: 0,
            color: backgroundValue ? 'rgba(129,140,248,0.9)' : 'rgba(255,255,255,0.35)',
          }} />
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            color: backgroundValue ? 'rgba(165,180,252,0.9)' : 'rgba(255,255,255,0.42)',
          }}>
            {backgroundValue ? 'Image uploaded ✓' : 'Upload background image'}
          </span>
          <input type="file" accept="image/*" onChange={onCustomImageUpload} className="hidden" />
        </label>
      )}
    </div>
  );
};

export default BackgroundSettings;

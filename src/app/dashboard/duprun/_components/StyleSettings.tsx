'use client';

const FONT_FAMILIES = [
  'Arial', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Poppins', 'Raleway', 'Inter', 'Noto Sans', 'Source Sans Pro',
];

const ANIMATIONS = [
  { value: 'none', label: 'None' },
  { value: 'fade-in', label: 'Fade In' },
  { value: 'slide-in', label: 'Slide In' },
];

interface StyleSettingsProps {
  textColor: string;
  setTextColor: (v: string) => void;
  textBgColor: string;
  setTextBgColor: (v: string) => void;
  textAnimation: string;
  setTextAnimation: (v: string) => void;
  textFontFamily: string;
  setTextFontFamily: (v: string) => void;
  textPadding: number;
  setTextPadding: (v: number) => void;
  textBorderRadius: number;
  setTextBorderRadius: (v: number) => void;
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <p style={{
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,0.38)',
    marginBottom: '8px',
  }}>
    {children}
  </p>
);

const numberInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 28px 7px 10px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  color: 'rgba(255,255,255,0.8)',
  fontSize: '12px',
  fontWeight: 600,
  outline: 'none',
};

const StyleSettings = ({
  textColor,
  setTextColor,
  textBgColor,
  setTextBgColor,
  textAnimation,
  setTextAnimation,
  textFontFamily,
  setTextFontFamily,
  textPadding,
  setTextPadding,
  textBorderRadius,
  setTextBorderRadius,
}: StyleSettingsProps) => {
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
          background: 'linear-gradient(180deg, #8b5cf6, #a78bfa)',
          boxShadow: '0 0 8px rgba(139,92,246,0.5)',
        }} />
        <span style={{
          fontSize: '11px', fontWeight: 800, letterSpacing: '0.14em',
          textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.65)',
        }}>
          Text Style
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Colors */}
        <div style={{
          borderRadius: '12px', padding: '12px',
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <Label>Colors</Label>
          <div className="flex gap-3">
            {[
              { label: 'Text', value: textColor, onChange: setTextColor },
              { label: 'Background', value: textBgColor, onChange: setTextBgColor },
            ].map(({ label, value, onChange }) => (
              <div key={label} className="flex-1">
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', marginBottom: '6px' }}>
                  {label}
                </p>
                <label className="flex items-center gap-2 cursor-pointer group relative">
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: value,
                    border: '1.5px solid rgba(255,255,255,0.15)',
                    flexShrink: 0,
                    boxShadow: `0 0 12px ${value}60`,
                    transition: 'transform 0.15s',
                  }} />
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.5)',
                    textTransform: 'uppercase' as const,
                  }}>
                    {value.replace('#', '')}
                  </span>
                  <input
                    type="color"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Font Family */}
        <div>
          <Label>Font Family</Label>
          <div className="relative">
            <select
              value={textFontFamily}
              onChange={e => setTextFontFamily(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 32px 7px 10px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '12px',
                fontWeight: 600,
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
                cursor: 'pointer',
              }}
            >
              {FONT_FAMILIES.map(font => (
                <option key={font} value={font} style={{ background: '#111114' }}>
                  {font}
                </option>
              ))}
            </select>
            <svg
              width="10" height="6" viewBox="0 0 10 6" fill="none"
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(255,255,255,0.35)' }}
            >
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Animation */}
        <div>
          <Label>Text Animation</Label>
          <div className="flex gap-1.5">
            {ANIMATIONS.map(anim => {
              const isActive = textAnimation === anim.value;
              return (
                <button
                  key={anim.value}
                  onClick={() => setTextAnimation(anim.value)}
                  style={{
                    flex: 1,
                    padding: '5px 0',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: isActive ? 700 : 500,
                    background: isActive ? 'rgba(139,92,246,0.22)' : 'rgba(255,255,255,0.04)',
                    border: '1px solid',
                    borderColor: isActive ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.09)',
                    color: isActive ? 'rgba(196,181,253,1)' : 'rgba(255,255,255,0.42)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: isActive ? '0 0 12px rgba(139,92,246,0.2)' : 'none',
                  }}
                >
                  {anim.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Padding + Radius */}
        <div className="flex gap-2">
          {[
            { label: 'Padding', value: textPadding, onChange: setTextPadding },
            { label: 'Radius', value: textBorderRadius, onChange: setTextBorderRadius },
          ].map(({ label, value, onChange }) => (
            <div key={label} style={{ flex: 1 }}>
              <Label>{label}</Label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={value}
                  onChange={e => onChange(parseInt(e.target.value))}
                  style={numberInputStyle}
                />
                <span style={{
                  position: 'absolute', right: '8px', top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '10px', color: 'rgba(255,255,255,0.25)',
                  pointerEvents: 'none',
                }}>px</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default StyleSettings;

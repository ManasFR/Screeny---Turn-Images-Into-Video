'use client';

import { useMixer, MusicTrack, MUSIC_LIBRARY } from '@/hooks/useMixer';
import { Mic, MicOff, Play, Pause, Upload, Music, Volume2, VolumeX } from 'lucide-react';

const GENRE_COLORS: Record<string, string> = {
  Ambient: '#6366f1', Corporate: '#22c55e', Cinematic: '#f59e0b',
  Lofi: '#ec4899', Electronic: '#06b6d4', Inspirational: '#a855f7', Custom: '#6366f1',
};

interface MixerPanelProps {
  mixer: ReturnType<typeof useMixer>;
}

const GainSlider = ({
  label, value, onChange, color, level, icon: Icon,
}: {
  label: string; value: number; onChange: (v: number) => void;
  color: string; level: number; icon: React.ElementType;
}) => {
  const pct = value;
  const levelColor = level > 70 ? '#ef4444' : level > 40 ? '#f59e0b' : color;

  return (
    <div style={{
      padding: '14px', borderRadius: '14px',
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.07)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Icon style={{ width: '13px', height: '13px', color }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.05em' }}>
            {label}
          </span>
        </div>
        <span style={{
          fontSize: '11px', fontFamily: 'monospace', fontWeight: 700,
          color, background: `${color}18`,
          padding: '2px 8px', borderRadius: '7px',
          border: `1px solid ${color}30`,
        }}>
          {value}%
        </span>
      </div>

      {/* Level bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '28px', marginBottom: '10px' }}>
        {Array.from({ length: 24 }).map((_, i) => {
          const threshold = (i / 24) * 100;
          const active = level > threshold;
          return (
            <div key={i} style={{
              flex: 1, borderRadius: '2px',
              height: `${Math.round(((Math.sin(i * 0.5) + 1) * 0.5) * 70 + 30)}%`,
              background: active
                ? i > 19 ? '#ef4444' : i > 14 ? '#f59e0b' : color
                : 'rgba(255,255,255,0.07)',
              transition: 'background 0.06s ease',
              opacity: active ? 0.9 : 0.4,
            }} />
          );
        })}
      </div>

      {/* Gain slider */}
      <div style={{ position: 'relative', height: '20px', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', width: '100%', height: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', height: '4px', borderRadius: '4px', width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }} />
        <input
          type="range" min={0} max={100} value={value}
          onChange={e => onChange(parseInt(e.target.value))}
          style={{ position: 'absolute', width: '100%', opacity: 0, height: '20px', cursor: 'pointer', zIndex: 2 }}
        />
        <div style={{
          position: 'absolute', left: `calc(${pct}% - 8px)`,
          width: '16px', height: '16px', borderRadius: '50%',
          background: '#fff', border: `2.5px solid ${color}`,
          boxShadow: `0 0 0 3px ${color}30, 0 2px 5px rgba(0,0,0,0.4)`,
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
};

const MixerPanel = ({ mixer }: MixerPanelProps) => {
  const [activeGenre, setActiveGenre] = useState<string>('All');
  const genres = ['All', ...Array.from(new Set(MUSIC_LIBRARY.map(t => t.genre)))];
  const filtered = activeGenre === 'All'
    ? MUSIC_LIBRARY
    : MUSIC_LIBRARY.filter(t => t.genre === activeGenre);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Mic Section ── */}
      <div style={{
        borderRadius: '16px', padding: '16px',
        background: 'linear-gradient(160deg,#111114,#0c0c0f)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '3px', height: '18px', borderRadius: '2px', background: 'linear-gradient(180deg,#6366f1,#818cf8)', boxShadow: '0 0 8px rgba(99,102,241,0.5)' }} />
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.65)' }}>Microphone</span>
          </div>
          <button onClick={mixer.toggleMic} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px', borderRadius: '10px', cursor: 'pointer',
            background: mixer.micEnabled ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.15)',
            border: '1px solid',
            borderColor: mixer.micEnabled ? 'rgba(239,68,68,0.35)' : 'rgba(99,102,241,0.35)',
            color: mixer.micEnabled ? 'rgba(252,165,165,0.9)' : 'rgba(165,180,252,0.9)',
            fontSize: '11px', fontWeight: 700, transition: 'all 0.15s',
          }}>
            {mixer.micEnabled
              ? <><MicOff style={{ width: '12px', height: '12px' }} /> Mute</>
              : <><Mic style={{ width: '12px', height: '12px' }} /> Enable</>
            }
          </button>
        </div>

        <GainSlider
          label="Mic Level"
          value={mixer.micGain}
          onChange={mixer.setMicGain}
          color="#6366f1"
          level={mixer.micEnabled ? mixer.micLevel : 0}
          icon={Mic}
        />

        {!mixer.micEnabled && (
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.22)', marginTop: '10px', textAlign: 'center' as const }}>
            Click Enable to start microphone monitoring
          </p>
        )}
      </div>

      {/* ── Music Section ── */}
      <div style={{
        borderRadius: '16px', padding: '16px',
        background: 'linear-gradient(160deg,#111114,#0c0c0f)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '3px', height: '18px', borderRadius: '2px', background: 'linear-gradient(180deg,#f59e0b,#fbbf24)', boxShadow: '0 0 8px rgba(245,158,11,0.5)' }} />
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.65)' }}>Music Library</span>
          </div>
          <label style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '5px 10px', borderRadius: '9px', cursor: 'pointer',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
            color: 'rgba(255,255,255,0.45)', fontSize: '10px', fontWeight: 600,
          }}>
            <Upload style={{ width: '11px', height: '11px' }} /> Upload
            <input type="file" accept="audio/*" onChange={mixer.uploadCustomMusic} style={{ display: 'none' }} />
          </label>
        </div>

        {/* Genre filter */}
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {genres.map(g => (
            <button key={g} onClick={() => setActiveGenre(g)} style={{
              padding: '3px 10px', borderRadius: '7px', cursor: 'pointer', fontSize: '10px', fontWeight: 600,
              background: activeGenre === g ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
              border: '1px solid', borderColor: activeGenre === g ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.07)',
              color: activeGenre === g ? 'rgba(251,191,36,0.9)' : 'rgba(255,255,255,0.38)',
              transition: 'all 0.12s',
            }}>{g}</button>
          ))}
        </div>

        {/* Track list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '260px', overflowY: 'auto' }}>
          {filtered.map(track => {
            const isSelected = mixer.selectedTrack?.id === track.id;
            const color = GENRE_COLORS[track.genre] || '#6366f1';
            return (
              <div
                key={track.id}
                onClick={() => mixer.selectTrack(track)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: '12px', cursor: 'pointer',
                  background: isSelected ? `${color}12` : 'rgba(255,255,255,0.025)',
                  border: '1px solid',
                  borderColor: isSelected ? `${color}40` : 'rgba(255,255,255,0.06)',
                  transition: 'all 0.15s',
                }}
              >
                {/* Color dot */}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                  background: `${color}20`, border: `1px solid ${color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Music style={{ width: '14px', height: '14px', color }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? '#fff' : 'rgba(255,255,255,0.75)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {track.name}
                  </p>
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                    {track.genre} {track.bpm > 0 ? `· ${track.bpm} BPM` : ''} · {track.duration}
                  </p>
                </div>

                {/* Play preview btn */}
                {isSelected && (
                  <button
                    onClick={e => { e.stopPropagation(); mixer.togglePreview(); }}
                    style={{
                      width: '30px', height: '30px', borderRadius: '9px', cursor: 'pointer', flexShrink: 0,
                      background: mixer.isPreviewPlaying ? `${color}20` : 'rgba(255,255,255,0.07)',
                      border: `1px solid ${mixer.isPreviewPlaying ? color + '50' : 'rgba(255,255,255,0.1)'}`,
                      color: mixer.isPreviewPlaying ? color : 'rgba(255,255,255,0.55)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    {mixer.isPreviewPlaying
                      ? <Pause style={{ width: '12px', height: '12px' }} />
                      : <Play  style={{ width: '12px', height: '12px' }} />
                    }
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Music gain */}
        {mixer.selectedTrack && (
          <div style={{ marginTop: '14px' }}>
            <GainSlider
              label={`${mixer.selectedTrack.name} — Volume`}
              value={mixer.musicGain}
              onChange={mixer.setMusicGain}
              color={GENRE_COLORS[mixer.selectedTrack.genre] || '#f59e0b'}
              level={mixer.isPreviewPlaying ? mixer.musicLevel : 0}
              icon={Volume2}
            />
          </div>
        )}
      </div>

      {/* Mix preview */}
      {(mixer.micEnabled || mixer.selectedTrack) && (
        <div style={{
          padding: '12px 14px', borderRadius: '12px',
          background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)',
        }}>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(165,180,252,0.7)', marginBottom: '8px' }}>
            Mix Preview
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {mixer.micEnabled && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 6px #6366f1', animation: 'pulse 1.2s ease-in-out infinite' }} />
                <span style={{ fontSize: '10px', color: 'rgba(165,180,252,0.7)' }}>Mic {mixer.micGain}%</span>
              </div>
            )}
            {mixer.micEnabled && mixer.selectedTrack && (
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>+</span>
            )}
            {mixer.selectedTrack && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 6px #f59e0b' }} />
                <span style={{ fontSize: '10px', color: 'rgba(251,191,36,0.7)' }}>Music {mixer.musicGain}%</span>
              </div>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>→ Baked into export</span>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}`}</style>
    </div>
  );
};

// Need this for useState inside component
import { useState } from 'react';
export default MixerPanel;

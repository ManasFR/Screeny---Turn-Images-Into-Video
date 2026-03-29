'use client';
import React from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, Monitor, Camera, CameraOff, ChevronDown, Volume2, VolumeX, Settings2 } from 'lucide-react';

interface AudioSettingsProps {
  micAudio: boolean;
  systemAudio: boolean;
  selectedMicId: string;
  selectedCameraId: string;
  onMicToggle: () => void;
  onSystemToggle: () => void;
  onMicDeviceChange: (id: string) => void;
  onCameraDeviceChange: (id: string) => void;
  disabled?: boolean;
}

interface DeviceInfo { deviceId: string; label: string; }

const DB_MARKERS = ['-∞', '-50', '-40', '-30', '-20', '-10', '-3', '0'];
const SEG_COUNT = 52;

const dbToPos = (db: number) => Math.max(0, Math.min(1, (db + 60) / 60));

const getSegColor = (ratio: number): string => {
  if (ratio >= dbToPos(-3)) return '#ef4444';
  if (ratio >= dbToPos(-9)) return '#f59e0b';
  return '#10b981';
};

// ─── OBS-style VU Channel Strip ──────────────────────────────────────────────
interface ChannelStripProps {
  label: string;
  subLabel: string;
  icon: React.ElementType;
  iconOff: React.ElementType;
  active: boolean;
  onToggle: () => void;
  devices: DeviceInfo[];
  selectedId: string;
  onDeviceChange: (id: string) => void;
  accent: string;
  disabled?: boolean;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  dbLevel: number;
  volume: number;
  onVolumeChange: (v: number) => void;
  muted: boolean;
  onMuteToggle: () => void;
  isSystemAudio?: boolean;
  onRequestSystemPreview?: () => void;
  systemPreviewActive?: boolean;
}

const ChannelStrip = ({
  label, subLabel, icon: Icon, iconOff: IconOff,
  active, onToggle,
  devices, selectedId, onDeviceChange,
  accent, disabled,
  analyserRef, dbLevel,
  volume, onVolumeChange,
  muted, onMuteToggle,
  isSystemAudio, onRequestSystemPreview, systemPreviewActive,
}: ChannelStripProps) => {
  const [dropOpen, setDropOpen] = useState(false);
  const [segs, setSegs] = useState<number[]>(new Array(SEG_COUNT).fill(0));
  const [peak, setPeak] = useState(0);
  const peakTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);
  const dataRef = useRef<Uint8Array>(new Uint8Array(256));
  const levelRef = useRef(0);

  const selected = devices.find(d => d.deviceId === selectedId) || devices[0];

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (!active || muted) {
      const decay = () => {
        levelRef.current = Math.max(0, levelRef.current - 0.04);
        const p = levelRef.current;
        setSegs(Array.from({ length: SEG_COUNT }, (_, i) => (i / SEG_COUNT <= p ? 1 : 0)));
        if (levelRef.current > 0) rafRef.current = requestAnimationFrame(decay);
        else { setSegs(new Array(SEG_COUNT).fill(0)); setPeak(0); }
      };
      rafRef.current = requestAnimationFrame(decay);
      return;
    }

    const tick = () => {
      const analyser = analyserRef.current;
      if (analyser) {
        if (dataRef.current.length !== analyser.frequencyBinCount) {
          dataRef.current = new Uint8Array(analyser.frequencyBinCount);
        }
        analyser.getByteTimeDomainData(dataRef.current);
        let sumSq = 0;
        for (let i = 0; i < dataRef.current.length; i++) {
          const n = (dataRef.current[i] - 128) / 128;
          sumSq += n * n;
        }
        const rms = Math.sqrt(sumSq / dataRef.current.length);
        const db = rms > 0.0001 ? 20 * Math.log10(rms) : -60;
        const pos = dbToPos(Math.max(-60, Math.min(0, db)));

        levelRef.current = Math.max(pos, levelRef.current * 0.92);
        const p = levelRef.current;

        setSegs(Array.from({ length: SEG_COUNT }, (_, i) => (i / SEG_COUNT <= p ? 1 : 0)));

        if (p > peak) {
          setPeak(p);
          if (peakTimerRef.current) clearTimeout(peakTimerRef.current);
          peakTimerRef.current = setTimeout(() => setPeak(0), 1800);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active, muted, analyserRef]);

  const dbDisplay = dbLevel <= -59 ? '-∞' : `${dbLevel.toFixed(1)}`;
  const dbColor = dbLevel >= -3 ? '#ef4444' : dbLevel >= -9 ? '#f59e0b' : '#10b981';

  return (
    <div style={{
      background: '#18181b', border: '1px solid #27272a',
      borderRadius: '8px', overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 12px',
        background: active ? `linear-gradient(90deg, ${accent}15 0%, transparent 100%)` : 'transparent',
        borderBottom: '1px solid #27272a',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '6px',
            background: active ? `${accent}20` : '#27272a',
            border: `1px solid ${active ? accent + '40' : '#3f3f46'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            transition: 'all 0.2s ease',
          }}>
            {active
              ? <Icon style={{ width: '14px', height: '14px', color: accent }} />
              : <IconOff style={{ width: '14px', height: '14px', color: '#71717a' }} />
            }
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: active ? '#f4f4f5' : '#a1a1aa', lineHeight: 1.2 }}>{label}</div>
            <div style={{ fontSize: '10px', color: '#71717a', marginTop: '2px', fontWeight: 500 }}>{subLabel}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {active && !muted && (
            <span style={{
              fontSize: '10px', fontWeight: 700, fontFamily: 'monospace',
              color: dbColor, padding: '2px 6px',
              background: '#09090b', borderRadius: '4px',
              border: `1px solid ${dbColor}30`,
            }}>
              {dbDisplay} dB
            </span>
          )}
          <button
            onClick={onToggle}
            disabled={disabled}
            style={{
              padding: '4px 10px', borderRadius: '5px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              background: active ? accent : '#27272a',
              border: `1px solid ${active ? accent : '#3f3f46'}`,
              color: active ? '#ffffff' : '#a1a1aa', fontSize: '10px', fontWeight: 700,
              opacity: disabled ? 0.5 : 1, transition: 'all 0.2s ease',
              boxShadow: active ? `0 0 10px ${accent}40` : 'none',
              letterSpacing: '0.05em', textTransform: 'uppercase',
            }}
          >
            {active ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* ── Device selector ── */}
      {active && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #27272a', position: 'relative' }}>
          <button
            onClick={() => !isSystemAudio && setDropOpen(o => !o)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 10px', borderRadius: '6px',
              cursor: isSystemAudio ? 'default' : 'pointer',
              background: '#09090b', border: '1px solid #3f3f46',
              color: '#e4e4e7', fontSize: '11px', fontFamily: 'inherit', fontWeight: 500, gap: '6px',
              transition: 'border-color 0.2s ease',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left', maxWidth: '190px' }}>
              {isSystemAudio
                ? (systemPreviewActive ? '● Capturing system audio' : 'System Default')
                : (selected?.label || 'Default – Microphone')
              }
            </span>
            {!isSystemAudio && (
              <ChevronDown style={{ width: '12px', height: '12px', color: '#71717a', flexShrink: 0, transform: dropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
            )}
          </button>
          {dropOpen && !isSystemAudio && devices.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: '12px', right: '12px', zIndex: 200, marginTop: '4px',
              background: '#18181b', border: '1px solid #3f3f46', borderRadius: '6px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)', overflow: 'hidden'
            }}>
              {devices.map(d => (
                <button key={d.deviceId}
                  onClick={() => { onDeviceChange(d.deviceId); setDropOpen(false); }}
                  style={{
                    width: '100%', display: 'block', textAlign: 'left', padding: '8px 10px',
                    background: d.deviceId === (selectedId || devices[0]?.deviceId) ? `${accent}15` : 'transparent',
                    color: d.deviceId === (selectedId || devices[0]?.deviceId) ? accent : '#a1a1aa',
                    fontSize: '11px', fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
                    borderBottom: '1px solid #27272a',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    transition: 'background 0.15s ease'
                  }}
                >{d.label}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── OBS VU Meter ── */}
      <div style={{ padding: '10px 12px', background: '#09090b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          {DB_MARKERS.map((m, i) => (
            <span key={i} style={{
              fontSize: '8px', fontFamily: 'monospace', fontWeight: 600,
              color: i >= 6 ? '#ef4444' : i === 5 ? '#f59e0b' : '#52525b',
              letterSpacing: '-0.02em',
            }}>{m}</span>
          ))}
        </div>

        {[0, 1].map(row => (
          <div key={row} style={{
            height: '6px', borderRadius: '3px',
            background: '#000000', border: '1px solid #27272a',
            display: 'flex', alignItems: 'stretch', overflow: 'hidden',
            gap: '1px', padding: '1px',
            marginBottom: row === 0 ? '4px' : '0',
            position: 'relative',
          }}>
            {active && !muted ? (
              <>
                {Array.from({ length: SEG_COUNT }, (_, i) => {
                  const ratio = i / SEG_COUNT;
                  const lit = segs[i] > 0;
                  const color = getSegColor(ratio);
                  return (
                    <div key={i} style={{
                      flex: 1, borderRadius: '1px',
                      background: lit ? color : `${color}15`,
                      boxShadow: lit && ratio >= dbToPos(-3) ? `0 0 4px ${color}` : 'none',
                      transition: 'background 0.05s',
                    }} />
                  );
                })}
                {peak > 0 && (
                  <div style={{
                    position: 'absolute', top: '1px', bottom: '1px', width: '2px',
                    left: `calc(${peak * 100}% - 2px)`,
                    background: peak >= dbToPos(-3) ? '#f87171' : peak >= dbToPos(-9) ? '#fbbf24' : '#f4f4f5',
                    borderRadius: '1px',
                    boxShadow: '0 0 4px rgba(255,255,255,0.6)',
                    transition: 'left 0.05s',
                  }} />
                )}
              </>
            ) : (
              Array.from({ length: SEG_COUNT }, (_, i) => (
                <div key={i} style={{
                  flex: 1, borderRadius: '1px',
                  background: getSegColor(i / SEG_COUNT) + '10',
                }} />
              ))
            )}
          </div>
        ))}

        {isSystemAudio && active && !systemPreviewActive && (
          <button
            onClick={onRequestSystemPreview}
            style={{
              marginTop: '10px', width: '100%', padding: '6px 8px', borderRadius: '5px',
              cursor: 'pointer', background: '#052e16', border: '1px solid #064e3b',
              color: '#34d399', fontSize: '10px', fontWeight: 600,
              fontFamily: 'inherit', letterSpacing: '0.04em', transition: 'all 0.2s ease'
            }}
          >
            ▶ Preview System Audio (Click to capture)
          </button>
        )}
        {isSystemAudio && systemPreviewActive && (
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px', background: '#09090b', borderRadius: '4px', border: '1px solid #27272a' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444', animation: 'pulse 1.5s infinite ease-in-out' }} />
            <span style={{ fontSize: '10px', color: '#a1a1aa', fontWeight: 500 }}>Live preview active</span>
          </div>
        )}
      </div>

      {/* ── Volume fader row ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '8px 12px 10px', background: '#18181b', borderTop: '1px solid #27272a',
      }}>
        <button
          onClick={onMuteToggle}
          disabled={!active}
          title={muted ? 'Unmute' : 'Mute'}
          style={{
            width: '28px', height: '28px', borderRadius: '6px',
            cursor: active ? 'pointer' : 'not-allowed',
            background: muted ? 'rgba(239,68,68,0.1)' : '#27272a',
            border: `1px solid ${muted ? 'rgba(239,68,68,0.3)' : '#3f3f46'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.2s ease',
            opacity: active ? 1 : 0.4,
          }}
        >
          {muted
            ? <VolumeX style={{ width: '14px', height: '14px', color: '#ef4444' }} />
            : <Volume2 style={{ width: '14px', height: '14px', color: '#a1a1aa' }} />
          }
        </button>

        <div style={{ flex: 1, position: 'relative', height: '20px', display: 'flex', alignItems: 'center' }}>
          <div style={{
            position: 'absolute', width: '100%', height: '4px',
            borderRadius: '2px', background: '#09090b', border: '1px solid #27272a',
          }}>
            <div style={{
              height: '100%', borderRadius: '2px', width: `${volume}%`,
              background: volume > 90 ? 'linear-gradient(90deg,#10b981 60%,#f59e0b 80%,#ef4444)' : '#10b981',
            }} />
          </div>
          <div style={{
            position: 'absolute', left: `calc(${volume}% - 6px)`,
            width: '12px', height: '16px', borderRadius: '4px',
            background: 'linear-gradient(180deg,#f4f4f5,#d4d4d8)',
            border: '1px solid #71717a',
            boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
          }} />
          <input
            type="range" min={0} max={100} value={volume}
            onChange={e => onVolumeChange(parseInt(e.target.value))}
            disabled={!active || muted}
            style={{
              position: 'absolute', width: '100%', opacity: 0, height: '20px', zIndex: 2,
              cursor: (!active || muted) ? 'not-allowed' : 'ew-resize',
            }}
          />
        </div>

        <span style={{
          fontSize: '11px', fontWeight: 700, fontFamily: 'monospace',
          color: muted ? '#ef4444' : '#a1a1aa', minWidth: '36px', textAlign: 'right',
        }}>
          {muted ? 'MUTE' : `${volume}%`}
        </span>

        <button title="Settings" style={{
          width: '24px', height: '24px', borderRadius: '6px',
          background: 'transparent', border: '1px solid #3f3f46',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease'
        }}>
          <Settings2 style={{ width: '12px', height: '12px', color: '#a1a1aa' }} />
        </button>
      </div>
    </div>
  );
};


// ─── Main AudioSettings wrapper ───────────────────────────────────────────────
const AudioSettings = ({
  micAudio, systemAudio,
  selectedMicId, selectedCameraId,
  onMicToggle, onSystemToggle,
  onMicDeviceChange, onCameraDeviceChange,
  disabled,
}: AudioSettingsProps) => {
  const [mics, setMics] = useState<DeviceInfo[]>([]);
  const [cameras, setCameras] = useState<DeviceInfo[]>([]);
  const [camDropOpen, setCamDropOpen] = useState(false);
  const [localCamId, setLocalCamId] = useState(selectedCameraId);

  const [micDb, setMicDb] = useState(-60);
  const [sysDb, setSysDb] = useState(-60);
  const [micVolume, setMicVolume] = useState(100);
  const [sysVolume, setSysVolume] = useState(100);
  const [micMuted, setMicMuted] = useState(false);
  const [sysMuted, setSysMuted] = useState(false);
  const [systemPreviewActive, setSystemPreviewActive] = useState(false);

  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const sysAnalyserRef = useRef<AnalyserNode | null>(null);
  const micCtxRef = useRef<AudioContext | null>(null);
  const sysCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const sysStreamRef = useRef<MediaStream | null>(null);
  const micRafRef = useRef<number | null>(null);
  const sysRafRef = useRef<number | null>(null);

  // Enumerate
  const enumerateDevices = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then(s => s.getTracks().forEach(t => t.stop()))
        .catch(() => {
          return navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(s => s.getTracks().forEach(t => t.stop()))
            .catch(() => {});
        });
      const all = await navigator.mediaDevices.enumerateDevices();
      setMics(all.filter(d => d.kind === 'audioinput').map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${i + 1}` })));
      setCameras(all.filter(d => d.kind === 'videoinput').map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Camera ${i + 1}` })));
    } catch {}
  }, []);

  useEffect(() => {
    enumerateDevices();
    navigator.mediaDevices.addEventListener('devicechange', enumerateDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', enumerateDevices);
  }, [enumerateDevices]);

  // dB poll
  const pollDb = (analyser: AnalyserNode, setDb: (v: number) => void, rafRef: React.MutableRefObject<number | null>) => {
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sumSq = 0;
      for (let i = 0; i < data.length; i++) { const n = (data[i] - 128) / 128; sumSq += n * n; }
      const rms = Math.sqrt(sumSq / data.length);
      setDb(rms > 0.0001 ? Math.max(-60, Math.min(0, 20 * Math.log10(rms))) : -60);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  // Mic
  const stopMic = useCallback(() => {
    if (micRafRef.current) cancelAnimationFrame(micRafRef.current);
    micAnalyserRef.current?.disconnect(); micCtxRef.current?.close();
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    micAnalyserRef.current = null; micCtxRef.current = null; micStreamRef.current = null;
    setMicDb(-60);
  }, []);

  const startMic = useCallback(async (deviceId?: string) => {
    stopMic();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: deviceId && deviceId !== 'default' && deviceId !== '' ? { deviceId: { exact: deviceId } } : true,
        video: false,
      });
      micStreamRef.current = stream;
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256; analyser.smoothingTimeConstant = 0.55;
      ctx.createMediaStreamSource(stream).connect(analyser);
      micCtxRef.current = ctx; micAnalyserRef.current = analyser;
      pollDb(analyser, setMicDb, micRafRef);
    } catch {}
  }, [stopMic]);

  useEffect(() => {
    if (micAudio && !disabled && !micMuted) startMic(selectedMicId || undefined);
    else stopMic();
  }, [micAudio, selectedMicId, disabled, micMuted]);

  // System audio
  const stopSys = useCallback(() => {
    if (sysRafRef.current) cancelAnimationFrame(sysRafRef.current);
    sysAnalyserRef.current?.disconnect(); sysCtxRef.current?.close();
    sysStreamRef.current?.getTracks().forEach(t => t.stop());
    sysAnalyserRef.current = null; sysCtxRef.current = null; sysStreamRef.current = null;
    setSystemPreviewActive(false); setSysDb(-60);
  }, []);

  const requestSysPreview = useCallback(async () => {
    stopSys();
    try {
      const stream = await (navigator.mediaDevices as MediaDevices & { getDisplayMedia: (c: object) => Promise<MediaStream> }).getDisplayMedia({ video: true, audio: true });
      const audioTracks = stream.getAudioTracks();
      if (!audioTracks.length) { stream.getTracks().forEach((t: MediaStreamTrack) => t.stop()); return; }
      stream.getVideoTracks().forEach((t: MediaStreamTrack) => t.stop());
      const audioStream = new MediaStream(audioTracks);
      sysStreamRef.current = audioStream;
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256; analyser.smoothingTimeConstant = 0.55;
      ctx.createMediaStreamSource(audioStream).connect(analyser);
      sysCtxRef.current = ctx; sysAnalyserRef.current = analyser;
      setSystemPreviewActive(true);
      pollDb(analyser, setSysDb, sysRafRef);
      audioTracks[0].onended = stopSys;
    } catch {}
  }, [stopSys]);

  useEffect(() => { if (!systemAudio) stopSys(); }, [systemAudio]);
  useEffect(() => () => { stopMic(); stopSys(); }, []);

  const cameraActive = !!localCamId && localCamId !== 'none';

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Panel title bar */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderBottom: 'none',
        borderRadius: '8px 8px 0 0',
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#f4f4f5', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Audio & Camera Mixer
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3f3f46' }} />
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3f3f46' }} />
        </div>
      </div>

      <div style={{
        background: '#09090b', border: '1px solid #27272a',
        borderTop: 'none', borderRadius: '0 0 8px 8px',
        padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        {/* Desktop Audio */}
        <ChannelStrip
          label="Desktop Audio" subLabel="Capture system sounds"
          icon={Monitor} iconOff={Monitor}
          active={systemAudio} onToggle={onSystemToggle}
          devices={[]} selectedId="" onDeviceChange={() => {}}
          accent="#f59e0b" disabled={disabled}
          analyserRef={sysAnalyserRef} dbLevel={sysDb}
          volume={sysVolume} onVolumeChange={setSysVolume}
          muted={sysMuted} onMuteToggle={() => setSysMuted(v => !v)}
          isSystemAudio onRequestSystemPreview={requestSysPreview}
          systemPreviewActive={systemPreviewActive}
        />

        {/* Mic / Aux */}
        <ChannelStrip
          label="Mic / Aux Input" subLabel="Default communication device"
          icon={Mic} iconOff={MicOff}
          active={micAudio} onToggle={onMicToggle}
          devices={mics} selectedId={selectedMicId} onDeviceChange={onMicDeviceChange}
          accent="#10b981" disabled={disabled}
          analyserRef={micAnalyserRef} dbLevel={micDb}
          volume={micVolume} onVolumeChange={setMicVolume}
          muted={micMuted} onMuteToggle={() => setMicMuted(v => !v)}
        />

        {/* Video Capture */}
        <div style={{
          background: '#18181b', border: '1px solid #27272a',
          borderRadius: '8px', overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 12px',
            background: cameraActive ? 'linear-gradient(90deg, rgba(6,182,212,0.1) 0%, transparent 100%)' : 'transparent',
            borderBottom: cameraActive ? '1px solid #27272a' : 'none',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '6px',
                background: cameraActive ? 'rgba(6,182,212,0.15)' : '#27272a',
                border: `1px solid ${cameraActive ? 'rgba(6,182,212,0.3)' : '#3f3f46'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease'
              }}>
                {cameraActive
                  ? <Camera style={{ width: '14px', height: '14px', color: '#06b6d4' }} />
                  : <CameraOff style={{ width: '14px', height: '14px', color: '#71717a' }} />
                }
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: cameraActive ? '#f4f4f5' : '#a1a1aa', lineHeight: 1.2 }}>Video Capture</div>
                <div style={{ fontSize: '10px', color: '#71717a', marginTop: '2px', fontWeight: 500 }}>Select camera feed</div>
              </div>
            </div>
            <button
              onClick={async () => {
                if (cameraActive) {
                  setLocalCamId('none');
                  onCameraDeviceChange('none');
                } else {
                  let camList = cameras;
                  if (camList.length === 0) {
                    try {
                      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                      s.getTracks().forEach(t => t.stop());
                      const all = await navigator.mediaDevices.enumerateDevices();
                      camList = all
                        .filter(d => d.kind === 'videoinput')
                        .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Camera ${i + 1}` }));
                      setCameras(camList);
                    } catch (err) {
                      console.error('Camera permission denied:', err);
                      return; 
                    }
                  }
                  const firstId = camList[0]?.deviceId || 'default';
                  setLocalCamId(firstId);
                  onCameraDeviceChange(firstId);
                }
              }}
              disabled={disabled}
              style={{
                padding: '4px 10px', borderRadius: '5px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                background: cameraActive ? '#06b6d4' : '#27272a',
                border: `1px solid ${cameraActive ? '#06b6d4' : '#3f3f46'}`,
                color: cameraActive ? '#ffffff' : '#a1a1aa', fontSize: '10px', fontWeight: 700,
                opacity: disabled ? 0.5 : 1, transition: 'all 0.2s ease',
                boxShadow: cameraActive ? '0 0 10px rgba(6,182,212,0.4)' : 'none', letterSpacing: '0.05em'
              }}
            >
              {cameraActive ? 'ON' : 'OFF'}
            </button>
          </div>

          {cameraActive && cameras.length > 0 && (
            <div style={{ padding: '8px 12px 10px', background: '#09090b', position: 'relative' }}>
              <button
                onClick={() => setCamDropOpen(o => !o)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 10px', borderRadius: '6px', cursor: 'pointer',
                  background: '#18181b', border: '1px solid #3f3f46',
                  color: '#e4e4e7', fontSize: '11px', fontWeight: 500, fontFamily: 'inherit',
                  transition: 'border-color 0.2s ease'
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '190px', textAlign: 'left' }}>
                  {cameras.find(c => c.deviceId === localCamId)?.label || cameras[0]?.label}
                </span>
                <ChevronDown style={{ width: '12px', height: '12px', color: '#71717a', transform: camDropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
              </button>
              {camDropOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: '12px', right: '12px', zIndex: 200, marginTop: '4px',
                  background: '#18181b', border: '1px solid #3f3f46', borderRadius: '6px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)', overflow: 'hidden'
                }}>
                  {cameras.map(c => (
                    <button key={c.deviceId}
                      onClick={() => { setLocalCamId(c.deviceId); onCameraDeviceChange(c.deviceId); setCamDropOpen(false); }}
                      style={{
                        width: '100%', display: 'block', textAlign: 'left', padding: '8px 10px',
                        background: c.deviceId === localCamId ? 'rgba(6,182,212,0.1)' : 'transparent',
                        color: c.deviceId === localCamId ? '#06b6d4' : '#a1a1aa',
                        fontSize: '11px', fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
                        borderBottom: '1px solid #27272a',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        transition: 'background 0.15s ease'
                      }}
                    >{c.label}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%,100%{opacity:1;transform:scale(1)}
          50%{opacity:0.6;transform:scale(0.85)}
        }
      `}</style>
    </div>
  );
};

export default AudioSettings;
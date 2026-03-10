'use client';

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
  if (ratio >= dbToPos(-3)) return '#c0392b';
  if (ratio >= dbToPos(-9)) return '#d4890a';
  return '#27a645';
};

// ─── OBS-style VU Channel Strip ──────────────────────────────────────────────
interface ChannelStripProps {
  label: string;
  subLabel: string;
  icon: any;
  iconOff: any;
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
      // Decay animation
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

        // Smooth rise, fast attack
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
  const dbColor = dbLevel >= -3 ? '#e74c3c' : dbLevel >= -9 ? '#f39c12' : '#2ecc71';

  return (
    <div style={{
      background: '#1c1c1c', border: '1px solid #363636',
      borderRadius: '5px', overflow: 'hidden',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 9px',
        background: active ? `linear-gradient(90deg, ${accent}18 0%, #222 100%)` : '#222',
        borderBottom: '1px solid #2c2c2c',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '22px', height: '22px', borderRadius: '4px',
            background: active ? `${accent}20` : '#2e2e2e',
            border: `1px solid ${active ? accent + '50' : '#404040'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {active
              ? <Icon style={{ width: '11px', height: '11px', color: accent }} />
              : <IconOff style={{ width: '11px', height: '11px', color: '#555' }} />
            }
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: active ? '#ddd' : '#777', lineHeight: 1.1 }}>{label}</div>
            <div style={{ fontSize: '9px', color: '#484848', marginTop: '1px' }}>{subLabel}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {active && !muted && (
            <span style={{
              fontSize: '9px', fontWeight: 700, fontFamily: 'monospace',
              color: dbColor, padding: '1px 4px',
              background: '#111', borderRadius: '3px',
              border: `1px solid ${dbColor}44`,
            }}>
              {dbDisplay} dB
            </span>
          )}
          <button
            onClick={onToggle}
            disabled={disabled}
            style={{
              padding: '2px 8px', borderRadius: '3px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              background: active ? accent : '#333',
              border: `1px solid ${active ? accent : '#505050'}`,
              color: '#fff', fontSize: '10px', fontWeight: 700,
              opacity: disabled ? 0.45 : 1, transition: 'all 0.15s',
              boxShadow: active ? `0 0 7px ${accent}55` : 'none',
              letterSpacing: '0.04em',
            }}
          >
            {active ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* ── Device selector ── */}
      {active && (
        <div style={{ padding: '5px 9px', borderBottom: '1px solid #252525', position: 'relative' }}>
          <button
            onClick={() => !isSystemAudio && setDropOpen(o => !o)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '4px 7px', borderRadius: '3px',
              cursor: isSystemAudio ? 'default' : 'pointer',
              background: '#252525', border: '1px solid #383838',
              color: '#b0b0b0', fontSize: '10px', fontFamily: 'inherit', gap: '4px',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left', maxWidth: '175px' }}>
              {isSystemAudio
                ? (systemPreviewActive ? '● Capturing system audio' : 'System Default')
                : (selected?.label || 'Default – Microphone')
              }
            </span>
            {!isSystemAudio && (
              <ChevronDown style={{ width: '10px', height: '10px', color: '#555', flexShrink: 0, transform: dropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            )}
          </button>
          {dropOpen && !isSystemAudio && devices.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: '9px', right: '9px', zIndex: 200, marginTop: '2px',
              background: '#222', border: '1px solid #444', borderRadius: '4px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
            }}>
              {devices.map(d => (
                <button key={d.deviceId}
                  onClick={() => { onDeviceChange(d.deviceId); setDropOpen(false); }}
                  style={{
                    width: '100%', display: 'block', textAlign: 'left', padding: '6px 9px',
                    background: d.deviceId === (selectedId || devices[0]?.deviceId) ? `${accent}1a` : 'transparent',
                    color: d.deviceId === (selectedId || devices[0]?.deviceId) ? accent : '#aaa',
                    fontSize: '10px', fontFamily: 'inherit', cursor: 'pointer',
                    borderBottom: '1px solid #2e2e2e',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >{d.label}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── OBS VU Meter ── */}
      <div style={{ padding: '7px 9px 5px', background: '#0f0f0f' }}>
        {/* dB scale */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          {DB_MARKERS.map((m, i) => (
            <span key={i} style={{
              fontSize: '7.5px', fontFamily: 'monospace',
              color: i >= 6 ? '#8b2020' : i === 5 ? '#7a6010' : '#3a3a3a',
              letterSpacing: '-0.04em',
            }}>{m}</span>
          ))}
        </div>

        {/* Meter track — 2 rows like OBS stereo */}
        {[0, 1].map(row => (
          <div key={row} style={{
            height: '8px', borderRadius: '1px',
            background: '#080808', border: '1px solid #1e1e1e',
            display: 'flex', alignItems: 'stretch', overflow: 'hidden',
            gap: '1px', padding: '1px',
            marginBottom: row === 0 ? '2px' : '0',
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
                      flex: 1, borderRadius: '0.5px',
                      background: lit ? color : `${color}1a`,
                      boxShadow: lit && ratio >= dbToPos(-3) ? `0 0 2px ${color}` : 'none',
                      transition: 'background 0.03s',
                    }} />
                  );
                })}
                {/* Peak hold */}
                {peak > 0 && (
                  <div style={{
                    position: 'absolute', top: '1px', bottom: '1px', width: '2px',
                    left: `calc(${peak * 100}% - 2px)`,
                    background: peak >= dbToPos(-3) ? '#ff4444' : peak >= dbToPos(-9) ? '#ffaa00' : '#eee',
                    borderRadius: '1px',
                    boxShadow: '0 0 3px rgba(255,255,255,0.5)',
                    transition: 'left 0.04s',
                  }} />
                )}
              </>
            ) : (
              // Inactive: show dim segments
              Array.from({ length: SEG_COUNT }, (_, i) => (
                <div key={i} style={{
                  flex: 1, borderRadius: '0.5px',
                  background: getSegColor(i / SEG_COUNT) + '12',
                }} />
              ))
            )}
          </div>
        ))}

        {/* System audio preview button */}
        {isSystemAudio && active && !systemPreviewActive && (
          <button
            onClick={onRequestSystemPreview}
            style={{
              marginTop: '6px', width: '100%', padding: '4px 8px', borderRadius: '3px',
              cursor: 'pointer', background: '#1a2b1a', border: '1px solid #2d4d2d',
              color: '#4caf50', fontSize: '9px', fontWeight: 600,
              fontFamily: 'inherit', letterSpacing: '0.03em',
            }}
          >
            ▶ Preview System Audio (click to capture)
          </button>
        )}
        {isSystemAudio && systemPreviewActive && (
          <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e74c3c', boxShadow: '0 0 4px #e74c3c', animation: 'pulse 1s infinite' }} />
            <span style={{ fontSize: '9px', color: '#888', fontFamily: 'inherit' }}>Live system audio preview active</span>
          </div>
        )}
      </div>

      {/* ── Volume fader row ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '5px 9px 7px', background: '#141414', borderTop: '1px solid #1e1e1e',
      }}>
        <button
          onClick={onMuteToggle}
          disabled={!active}
          title={muted ? 'Unmute' : 'Mute'}
          style={{
            width: '24px', height: '24px', borderRadius: '3px',
            cursor: active ? 'pointer' : 'not-allowed',
            background: muted ? 'rgba(192,57,43,0.25)' : '#252525',
            border: `1px solid ${muted ? '#c0392b88' : '#3c3c3c'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.12s',
            opacity: active ? 1 : 0.35,
          }}
        >
          {muted
            ? <VolumeX style={{ width: '12px', height: '12px', color: '#e74c3c' }} />
            : <Volume2 style={{ width: '12px', height: '12px', color: '#888' }} />
          }
        </button>

        {/* Fader */}
        <div style={{ flex: 1, position: 'relative', height: '18px', display: 'flex', alignItems: 'center' }}>
          <div style={{
            position: 'absolute', width: '100%', height: '3px',
            borderRadius: '1.5px', background: '#1e1e1e', border: '1px solid #2e2e2e',
          }}>
            <div style={{
              height: '100%', borderRadius: '1.5px', width: `${volume}%`,
              background: volume > 90 ? 'linear-gradient(90deg,#27a645 60%,#d4890a 80%,#c0392b)' : '#27a645',
            }} />
          </div>
          {/* OBS-style square thumb */}
          <div style={{
            position: 'absolute', left: `calc(${volume}% - 6px)`,
            width: '12px', height: '18px', borderRadius: '2px',
            background: 'linear-gradient(180deg,#d0d0d0,#a0a0a0)',
            border: '1px solid #707070',
            boxShadow: '0 1px 3px rgba(0,0,0,0.6)',
            pointerEvents: 'none',
          }} />
          <input
            type="range" min={0} max={100} value={volume}
            onChange={e => onVolumeChange(parseInt(e.target.value))}
            disabled={!active || muted}
            style={{
              position: 'absolute', width: '100%', opacity: 0, height: '18px', zIndex: 2,
              cursor: (!active || muted) ? 'not-allowed' : 'ew-resize',
            }}
          />
        </div>

        <span style={{
          fontSize: '9px', fontWeight: 700, fontFamily: 'monospace',
          color: muted ? '#c0392b' : '#585858', minWidth: '28px', textAlign: 'right',
        }}>
          {muted ? 'MUTE' : `${volume}%`}
        </span>

        <button title="Settings" style={{
          width: '20px', height: '20px', borderRadius: '3px',
          background: 'transparent', border: '1px solid #2e2e2e',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <Settings2 style={{ width: '10px', height: '10px', color: '#444' }} />
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
      await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(s => s.getTracks().forEach(t => t.stop())).catch(() => {});
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
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: true });
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
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Panel title bar — OBS style */}
      <div style={{
        background: 'linear-gradient(180deg, #3a3a3a, #2e2e2e)',
        border: '1px solid #484848',
        borderBottom: 'none',
        borderRadius: '5px 5px 0 0',
        padding: '5px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#c8c8c8', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
          Audio Mixer
        </span>
        <div style={{ display: 'flex', gap: '5px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '1px', background: '#404040', border: '1px solid #555' }} />
          <div style={{ width: '8px', height: '8px', borderRadius: '1px', background: '#404040', border: '1px solid #555' }} />
        </div>
      </div>

      <div style={{
        background: '#181818', border: '1px solid #363636',
        borderTop: 'none', borderRadius: '0 0 5px 5px',
        padding: '8px', display: 'flex', flexDirection: 'column', gap: '7px',
      }}>
        {/* Desktop Audio */}
        <ChannelStrip
          label="Desktop Audio" subLabel="System sound"
          icon={Monitor} iconOff={Monitor}
          active={systemAudio} onToggle={onSystemToggle}
          devices={[]} selectedId="" onDeviceChange={() => {}}
          accent="#d4890a" disabled={disabled}
          analyserRef={sysAnalyserRef} dbLevel={sysDb}
          volume={sysVolume} onVolumeChange={setSysVolume}
          muted={sysMuted} onMuteToggle={() => setSysMuted(v => !v)}
          isSystemAudio onRequestSystemPreview={requestSysPreview}
          systemPreviewActive={systemPreviewActive}
        />

        {/* Mic / Aux */}
        <ChannelStrip
          label="Mic / Aux" subLabel="Microphone input"
          icon={Mic} iconOff={MicOff}
          active={micAudio} onToggle={onMicToggle}
          devices={mics} selectedId={selectedMicId} onDeviceChange={onMicDeviceChange}
          accent="#27a645" disabled={disabled}
          analyserRef={micAnalyserRef} dbLevel={micDb}
          volume={micVolume} onVolumeChange={setMicVolume}
          muted={micMuted} onMuteToggle={() => setMicMuted(v => !v)}
        />

        {/* Video Capture */}
        <div style={{
          background: '#1c1c1c', border: '1px solid #363636',
          borderRadius: '5px', overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 9px',
            background: cameraActive ? 'linear-gradient(90deg, rgba(6,182,212,0.1) 0%, #222 100%)' : '#222',
            borderBottom: cameraActive ? '1px solid #2c2c2c' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '4px',
                background: cameraActive ? 'rgba(6,182,212,0.18)' : '#2e2e2e',
                border: `1px solid ${cameraActive ? 'rgba(6,182,212,0.45)' : '#404040'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {cameraActive
                  ? <Camera style={{ width: '11px', height: '11px', color: '#06b6d4' }} />
                  : <CameraOff style={{ width: '11px', height: '11px', color: '#555' }} />
                }
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: cameraActive ? '#ddd' : '#777', lineHeight: 1.1 }}>Video Capture</div>
                <div style={{ fontSize: '9px', color: '#484848', marginTop: '1px' }}>Camera device</div>
              </div>
            </div>
            <button
              onClick={() => {
                const next = cameraActive ? 'none' : (cameras[0]?.deviceId || 'none');
                setLocalCamId(next);
                onCameraDeviceChange(next);
              }}
              disabled={disabled}
              style={{
                padding: '2px 8px', borderRadius: '3px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                background: cameraActive ? '#06b6d4' : '#333',
                border: `1px solid ${cameraActive ? '#06b6d4' : '#505050'}`,
                color: '#fff', fontSize: '10px', fontWeight: 700,
                opacity: disabled ? 0.45 : 1, transition: 'all 0.15s',
                boxShadow: cameraActive ? '0 0 7px rgba(6,182,212,0.4)' : 'none',
              }}
            >
              {cameraActive ? 'ON' : 'OFF'}
            </button>
          </div>

          {cameraActive && cameras.length > 0 && (
            <div style={{ padding: '5px 9px 7px', background: '#111', position: 'relative' }}>
              <button
                onClick={() => setCamDropOpen(o => !o)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '4px 7px', borderRadius: '3px', cursor: 'pointer',
                  background: '#252525', border: '1px solid #383838',
                  color: '#b0b0b0', fontSize: '10px', fontFamily: 'inherit',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '175px', textAlign: 'left' }}>
                  {cameras.find(c => c.deviceId === localCamId)?.label || cameras[0]?.label}
                </span>
                <ChevronDown style={{ width: '10px', height: '10px', color: '#555', transform: camDropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>
              {camDropOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: '9px', right: '9px', zIndex: 200, marginTop: '2px',
                  background: '#222', border: '1px solid #444', borderRadius: '4px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
                }}>
                  {cameras.map(c => (
                    <button key={c.deviceId}
                      onClick={() => { setLocalCamId(c.deviceId); onCameraDeviceChange(c.deviceId); setCamDropOpen(false); }}
                      style={{
                        width: '100%', display: 'block', textAlign: 'left', padding: '6px 9px',
                        background: c.deviceId === localCamId ? 'rgba(6,182,212,0.12)' : 'transparent',
                        color: c.deviceId === localCamId ? '#06b6d4' : '#aaa',
                        fontSize: '10px', fontFamily: 'inherit', cursor: 'pointer',
                        borderBottom: '1px solid #2e2e2e',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
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
          50%{opacity:0.4;transform:scale(0.8)}
        }
      `}</style>
    </div>
  );
};

export default AudioSettings;

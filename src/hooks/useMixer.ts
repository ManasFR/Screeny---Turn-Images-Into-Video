'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  genre: string;
  bpm: number;
  duration: string;
  url: string;
  color: string;
}

// Royalty-free tracks — direct MP3 links from Pixabay / Free Music Archive
export const MUSIC_LIBRARY: MusicTrack[] = [
  {
    id: 'calm-1',
    name: 'Ambient Flow',
    artist: 'Pixabay',
    genre: 'Ambient',
    bpm: 80,
    duration: '2:30',
    url: 'https://cdn.pixabay.com/audio/2023/08/10/audio_6966b832f7.mp3',
    color: '#6366f1',
  },
  {
    id: 'upbeat-1',
    name: 'Corporate Upbeat',
    artist: 'Pixabay',
    genre: 'Corporate',
    bpm: 120,
    duration: '2:00',
    url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_946b4f13b0.mp3',
    color: '#22c55e',
  },
  {
    id: 'cinematic-1',
    name: 'Epic Cinematic',
    artist: 'Pixabay',
    genre: 'Cinematic',
    bpm: 95,
    duration: '3:10',
    url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_1e1a0c9bd7.mp3',
    color: '#f59e0b',
  },
  {
    id: 'lofi-1',
    name: 'Lofi Chill',
    artist: 'Pixabay',
    genre: 'Lofi',
    bpm: 85,
    duration: '2:45',
    url: 'https://cdn.pixabay.com/audio/2022/11/22/audio_febc508520.mp3',
    color: '#ec4899',
  },
  {
    id: 'tech-1',
    name: 'Tech Minimal',
    artist: 'Pixabay',
    genre: 'Electronic',
    bpm: 130,
    duration: '2:15',
    url: 'https://cdn.pixabay.com/audio/2023/04/18/audio_19f5dc7c39.mp3',
    color: '#06b6d4',
  },
  {
    id: 'inspirational-1',
    name: 'Inspiring Rise',
    artist: 'Pixabay',
    genre: 'Inspirational',
    bpm: 100,
    duration: '2:50',
    url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_655e0bc06e.mp3',
    color: '#a855f7',
  },
];

export const useMixer = () => {
  const [micEnabled,     setMicEnabled]     = useState(false);
  const [micGain,        setMicGain]        = useState(75);  // 0-100
  const [musicGain,      setMusicGain]      = useState(60);  // 0-100
  const [selectedTrack,  setSelectedTrack]  = useState<MusicTrack | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [micLevel,       setMicLevel]       = useState(0);   // 0-100 for visualizer
  const [musicLevel,     setMusicLevel]     = useState(0);   // 0-100 for visualizer
  const [micBars,        setMicBars]        = useState<number[]>(new Array(16).fill(0));

  const audioCtxRef        = useRef<AudioContext | null>(null);
  const micStreamRef       = useRef<MediaStream | null>(null);
  const micSourceRef       = useRef<MediaStreamAudioSourceNode | null>(null);
  const micGainNodeRef     = useRef<GainNode | null>(null);
  const micAnalyserRef     = useRef<AnalyserNode | null>(null);
  const musicElementRef    = useRef<HTMLAudioElement | null>(null);
  const musicSourceRef     = useRef<MediaElementAudioSourceNode | null>(null);
  const musicGainNodeRef   = useRef<GainNode | null>(null);
  const musicAnalyserRef   = useRef<AnalyserNode | null>(null);
  const destinationRef     = useRef<MediaStreamAudioDestinationNode | null>(null);
  const animRef            = useRef<number | null>(null);
  const musicConnectedRef  = useRef(false);

  // ── Ensure AudioContext exists ───────────────────────────────────
  const ensureCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  // ── Mic toggle ───────────────────────────────────────────────────
  const toggleMic = useCallback(async () => {
    if (micEnabled) {
      micStreamRef.current?.getTracks().forEach(t => t.stop());
      micSourceRef.current?.disconnect();
      micStreamRef.current = null;
      micSourceRef.current = null;
      if (animRef.current) cancelAnimationFrame(animRef.current);
      setMicEnabled(false);
      setMicLevel(0);
      setMicBars(new Array(16).fill(0));
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        micStreamRef.current = stream;
        const ctx = ensureCtx();

        if (!destinationRef.current) {
          destinationRef.current = ctx.createMediaStreamDestination();
        }

        const source   = ctx.createMediaStreamSource(stream);
        const gainNode = ctx.createGain();
        gainNode.gain.value = micGain / 100;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.7;

        source.connect(gainNode);
        gainNode.connect(analyser);
        gainNode.connect(destinationRef.current);

        micSourceRef.current   = source;
        micGainNodeRef.current = gainNode;
        micAnalyserRef.current = analyser;
        setMicEnabled(true);
        startVisualizer();
      } catch (err) {
        console.error('Mic access denied', err);
        alert('Microphone access denied.');
      }
    }
  }, [micEnabled, micGain, ensureCtx]);

  // ── Mic gain live update ─────────────────────────────────────────
  useEffect(() => {
    if (micGainNodeRef.current) micGainNodeRef.current.gain.value = micGain / 100;
  }, [micGain]);

  // ── Music gain live update ───────────────────────────────────────
  useEffect(() => {
    if (musicGainNodeRef.current) musicGainNodeRef.current.gain.value = musicGain / 100;
  }, [musicGain]);

  // ── Load a library track for preview ────────────────────────────
  const selectTrack = useCallback((track: MusicTrack) => {
    // Stop existing preview
    if (musicElementRef.current) {
      musicElementRef.current.pause();
      musicElementRef.current.currentTime = 0;
    }
    setIsPreviewPlaying(false);
    setSelectedTrack(track);
    musicConnectedRef.current = false;

    if (!musicElementRef.current) musicElementRef.current = new Audio();
    musicElementRef.current.src = track.url;
    musicElementRef.current.loop = true;
    musicElementRef.current.crossOrigin = 'anonymous';
  }, []);

  // ── Connect music element to Web Audio ──────────────────────────
  const connectMusicToCtx = useCallback(() => {
    if (musicConnectedRef.current || !musicElementRef.current) return;
    const ctx = ensureCtx();

    if (!destinationRef.current) {
      destinationRef.current = ctx.createMediaStreamDestination();
    }

    const source   = ctx.createMediaElementSource(musicElementRef.current);
    const gainNode = ctx.createGain();
    gainNode.gain.value = musicGain / 100;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.7;

    source.connect(gainNode);
    gainNode.connect(analyser);
    gainNode.connect(destinationRef.current);
    gainNode.connect(ctx.destination); // also play through speakers

    musicSourceRef.current   = source;
    musicGainNodeRef.current = gainNode;
    musicAnalyserRef.current = analyser;
    musicConnectedRef.current = true;
  }, [musicGain, ensureCtx]);

  // ── Preview toggle ───────────────────────────────────────────────
  const togglePreview = useCallback(async () => {
    if (!musicElementRef.current || !selectedTrack) return;
    if (isPreviewPlaying) {
      musicElementRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      connectMusicToCtx();
      await musicElementRef.current.play();
      setIsPreviewPlaying(true);
    }
  }, [isPreviewPlaying, selectedTrack, connectMusicToCtx]);

  // ── Upload custom music ─────────────────────────────────────────
  const uploadCustomMusic = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const customTrack: MusicTrack = {
      id: 'custom-' + Date.now(),
      name: file.name.replace(/\.[^.]+$/, ''),
      artist: 'Uploaded',
      genre: 'Custom',
      bpm: 0,
      duration: '?',
      url,
      color: '#6366f1',
    };
    selectTrack(customTrack);
    event.target.value = '';
  }, [selectTrack]);

  // ── Visualizer loop ──────────────────────────────────────────────
  const startVisualizer = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const tick = () => {
      // Mic level
      if (micAnalyserRef.current) {
        const data = new Uint8Array(micAnalyserRef.current.frequencyBinCount);
        micAnalyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setMicLevel(Math.round((avg / 255) * 100));
        const step = Math.floor(data.length / 16);
        const bars: number[] = [];
        for (let i = 0; i < 16; i++) {
          const slice = data.slice(i * step, (i + 1) * step);
          bars.push(Math.round((slice.reduce((a, b) => a + b, 0) / slice.length / 255) * 100));
        }
        setMicBars(bars);
      }
      // Music level
      if (musicAnalyserRef.current && isPreviewPlaying) {
        const data = new Uint8Array(musicAnalyserRef.current.frequencyBinCount);
        musicAnalyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setMusicLevel(Math.round((avg / 255) * 100));
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  }, [isPreviewPlaying]);

  useEffect(() => {
    if (micEnabled || isPreviewPlaying) startVisualizer();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [micEnabled, isPreviewPlaying, startVisualizer]);

  // ── Get mixed output stream (for recording) ──────────────────────
  const getMixedStream = useCallback((): MediaStream | null => {
    return destinationRef.current?.stream ?? null;
  }, []);

  const cleanup = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    musicElementRef.current?.pause();
    audioCtxRef.current?.close();
    audioCtxRef.current  = null;
    destinationRef.current = null;
    musicConnectedRef.current = false;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  return {
    micEnabled, toggleMic,
    micGain, setMicGain,
    musicGain, setMusicGain,
    selectedTrack, selectTrack,
    isPreviewPlaying, togglePreview,
    micLevel, musicLevel,
    micBars,
    uploadCustomMusic,
    getMixedStream,
    MUSIC_LIBRARY,
  };
};

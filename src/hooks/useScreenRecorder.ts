'use client';

import { useState, useRef, useCallback } from 'react';

export type RecordingState = 'idle' | 'countdown' | 'recording' | 'paused' | 'stopped';

export interface RecorderOptions {
  micAudio: boolean;
  systemAudio: boolean;
  micDeviceId?: string;
  cameraStream?: MediaStream | null;
  existingMicStream?: MediaStream | null;
  existingSysStream?: MediaStream | null;
}

export const useScreenRecorder = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration, setDuration]             = useState(0);
  const [countdown, setCountdown]           = useState(3);
  const [error, setError]                   = useState<string | null>(null);

  const mediaRecorderRef  = useRef<MediaRecorder | null>(null);
  const chunksRef         = useRef<Blob[]>([]);
  const streamRef         = useRef<MediaStream | null>(null);
  const displayStreamRef  = useRef<MediaStream | null>(null);
  const mixingAudioCtxRef = useRef<AudioContext | null>(null);
  const timerRef          = useRef<NodeJS.Timeout | null>(null);
  const durationRef       = useRef(0);

  const onStreamReadyRef = useRef<((s: MediaStream) => void) | null>(null);
  const onStreamStopRef  = useRef<(() => void) | null>(null);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      durationRef.current += 1;
      setDuration(durationRef.current);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const cleanupStreams = useCallback(() => {
    mixingAudioCtxRef.current?.close().catch(() => {});
    mixingAudioCtxRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    displayStreamRef.current?.getTracks().forEach(t => t.stop());
    displayStreamRef.current = null;
  }, []);

  const startRecording = useCallback(async (options: RecorderOptions) => {
    setError(null);
    try {
      // 1. Screen capture — always audio:true so browser shows "Share audio" checkbox
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });

      // Video-only stream for preview
      const videoOnlyStream = new MediaStream(displayStream.getVideoTracks());
      displayStreamRef.current = videoOnlyStream;
      onStreamReadyRef.current?.(videoOnlyStream);

      // 2. Create AudioContext mixer — ALL audio sources feed into ONE mixed track
      //    This is the only way to record mic + system audio at the same time.
      const audioCtx    = new AudioContext({ sampleRate: 48000 });
      mixingAudioCtxRef.current = audioCtx;
      const destination = audioCtx.createMediaStreamDestination();
      let hasAudio      = false;

      const connectSource = (stream: MediaStream, gain = 1.0) => {
        const liveTracks = stream.getAudioTracks().filter(t => t.readyState === 'live');
        if (!liveTracks.length) return;
        try {
          const src  = audioCtx.createMediaStreamSource(new MediaStream(liveTracks));
          const gainNode = audioCtx.createGain();
          gainNode.gain.value = gain;
          src.connect(gainNode);
          gainNode.connect(destination);
          hasAudio = true;
        } catch (e) { console.warn('Mixer connect failed:', e); }
      };

      // System audio from display stream (user ticked "Share audio" in browser dialog)
      const displayAudioTracks = displayStream.getAudioTracks().filter(t => t.readyState === 'live');
      if (options.systemAudio && displayAudioTracks.length > 0) {
        connectSource(new MediaStream(displayAudioTracks), 1.0);
      }

      // System audio from AudioSettings preview stream (if user opened it there separately)
      if (options.systemAudio && options.existingSysStream) {
        const sysTracks = options.existingSysStream.getAudioTracks().filter(t => t.readyState === 'live');
        if (sysTracks.length > 0) connectSource(new MediaStream(sysTracks), 1.0);
      }

      // Mic audio — reuse the already-open stream from AudioSettings preview
      if (options.micAudio) {
        const existingTracks = options.existingMicStream
          ?.getAudioTracks().filter(t => t.readyState === 'live') ?? [];

        if (existingTracks.length > 0) {
          connectSource(new MediaStream(existingTracks), 1.0);
        } else {
          // Fallback: open a fresh mic stream
          try {
            const constraints: MediaTrackConstraints =
              options.micDeviceId && options.micDeviceId !== 'default' && options.micDeviceId !== ''
                ? { deviceId: { exact: options.micDeviceId }, echoCancellation: true, noiseSuppression: true }
                : { echoCancellation: true, noiseSuppression: true };
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: constraints, video: false });
            connectSource(micStream, 1.0);
          } catch (err) {
            console.warn('Mic denied:', err);
          }
        }
      }

      // 3. Build final stream: screen video + camera video + ONE mixed audio track
      const finalTracks: MediaStreamTrack[] = [...displayStream.getVideoTracks()];

      if (options.cameraStream) {
        options.cameraStream.getVideoTracks()
          .filter(t => t.readyState === 'live')
          .forEach(t => finalTracks.push(t));
      }

      if (hasAudio) {
        const mixedTrack = destination.stream.getAudioTracks()[0];
        if (mixedTrack) finalTracks.push(mixedTrack);
      }

      const combinedStream = new MediaStream(finalTracks);
      streamRef.current = combinedStream;

      // 4. Countdown
      setRecordingState('countdown');
      setCountdown(3);
      await new Promise<void>(resolve => {
        let count = 3;
        const cd = setInterval(() => {
          count--;
          setCountdown(count);
          if (count <= 0) { clearInterval(cd); resolve(); }
        }, 1000);
      });

      // 5. Start MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current   = [];
      durationRef.current = 0;

      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `screeny-recording-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        cleanupStreams();
        stopTimer();
        setRecordingState('stopped');
        setDuration(0);
        durationRef.current = 0;
        onStreamStopRef.current?.();
      };

      displayStream.getVideoTracks()[0].addEventListener('ended', () => stopRecording());
      recorder.start(1000);
      setRecordingState('recording');
      startTimer();

    } catch (err: unknown) {
      const msg = (err as Error)?.message || '';
      if (!msg.includes('Permission denied') && !msg.includes('cancelled') && !msg.includes('abort')) {
        setError(msg || 'Could not start recording');
      }
      setRecordingState('idle');
      cleanupStreams();
      onStreamStopRef.current?.();
    }
  }, [startTimer, stopTimer, cleanupStreams]);

  const stopRecording = useCallback(() => {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.requestData();
      mediaRecorderRef.current.stop();
    } else {
      cleanupStreams();
      setRecordingState('stopped');
      onStreamStopRef.current?.();
    }
  }, [stopTimer, cleanupStreams]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      stopTimer();
      setRecordingState('paused');
    }
  }, [stopTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      startTimer();
      setRecordingState('recording');
    }
  }, [startTimer]);

  const resetRecording = useCallback(() => {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = () => { cleanupStreams(); onStreamStopRef.current?.(); };
      mediaRecorderRef.current.stop();
    } else {
      cleanupStreams();
      onStreamStopRef.current?.();
    }
    chunksRef.current = [];
    setRecordingState('idle');
    setDuration(0);
    setError(null);
    durationRef.current = 0;
  }, [stopTimer, cleanupStreams]);

  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return {
    recordingState, duration, countdown, error,
    startRecording, stopRecording, pauseRecording, resumeRecording, resetRecording,
    formatDuration, onStreamReadyRef, onStreamStopRef,
  };
};
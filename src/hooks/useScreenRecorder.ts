'use client';

import { useState, useRef, useCallback } from 'react';

export type RecordingState = 'idle' | 'countdown' | 'recording' | 'paused' | 'stopped';

export interface RecorderOptions {
  micAudio: boolean;
  systemAudio: boolean;
  micDeviceId?: string;
}

export const useScreenRecorder = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const streamRef        = useRef<MediaStream | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null); // ← video-only for preview
  const timerRef         = useRef<NodeJS.Timeout | null>(null);
  const durationRef      = useRef(0);

  // Callback so page can receive the display stream for preview
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

  const startRecording = useCallback(async (options: RecorderOptions) => {
    setError(null);
    try {
      // 1. Capture screen (with optional system audio)
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: options.systemAudio,
      });

      // Save video-only stream for preview
      const videoOnlyStream = new MediaStream(displayStream.getVideoTracks());
      displayStreamRef.current = videoOnlyStream;

      // Fire callback so page.tsx can attach to <video>
      onStreamReadyRef.current?.(videoOnlyStream);

      const tracks: MediaStreamTrack[] = [...displayStream.getTracks()];

      // 2. Mic audio
      if (options.micAudio) {
        try {
          const audioConstraints: MediaTrackConstraints =
            options.micDeviceId && options.micDeviceId !== 'default' && options.micDeviceId !== ''
              ? { deviceId: { exact: options.micDeviceId } }
              : {};
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints, video: false });
          micStream.getAudioTracks().forEach(t => tracks.push(t));
        } catch { /* mic denied — continue */ }
      }

      const combinedStream = new MediaStream(tracks);
      streamRef.current = combinedStream;

      // 3. Countdown
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

      // 4. Start MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9' : 'video/webm';

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      durationRef.current = 0;

      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = `screeny-recording-${Date.now()}.webm`;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        stopTimer();
        setRecordingState('stopped');
        setDuration(0);
        durationRef.current = 0;
        onStreamStopRef.current?.();
      };

      // User stops sharing via browser's native UI
      displayStream.getVideoTracks()[0].onended = () => { stopRecording(); };

      recorder.start(1000);
      setRecordingState('recording');
      startTimer();
    } catch (err: any) {
      setError(err?.message || 'Could not start recording');
      setRecordingState('idle');
      onStreamStopRef.current?.();
    }
  }, [startTimer, stopTimer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    displayStreamRef.current?.getTracks().forEach(t => t.stop());
    displayStreamRef.current = null;
    stopTimer();
    setRecordingState('stopped');
    onStreamStopRef.current?.();
  }, [stopTimer]);

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
    stopRecording();
    setRecordingState('idle');
    setDuration(0);
    setError(null);
    durationRef.current = 0;
  }, [stopRecording]);

  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return {
    recordingState,
    duration,
    countdown,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    formatDuration,
    // Register callbacks from page.tsx
    onStreamReadyRef,
    onStreamStopRef,
  };
};

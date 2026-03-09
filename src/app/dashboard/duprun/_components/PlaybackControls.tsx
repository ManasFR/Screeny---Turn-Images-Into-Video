'use client';

import { Play, Pause, Download, RotateCcw } from 'lucide-react';
import { PlanLimits } from '@/types/duprun';

interface PlaybackControlsProps {
  isPlaying: boolean;
  isRecording: boolean;
  totalZoomPoints: number;
  planLimits: PlanLimits | null;
  currentSlideIndex: number;
  slidesCount: number;
  progress: number;
  totalDuration: number;
  onPlay: () => void;
  onStop: () => void;
  onReset: () => void;
  onExport: () => void;
}

const PlaybackControls = ({
  isPlaying,
  isRecording,
  totalZoomPoints,
  planLimits,
  currentSlideIndex,
  slidesCount,
  progress,
  totalDuration,
  onPlay,
  onStop,
  onReset,
  onExport,
}: PlaybackControlsProps) => {
  const noPoints = totalZoomPoints === 0;
  const exportDisabled = noPoints || isPlaying || isRecording || !planLimits?.hasAccess;

  return (
    <div className="space-y-3">
      {/* Play / Reset row */}
      <div className="flex gap-3">
        <button
          onClick={isPlaying ? onStop : onPlay}
          disabled={noPoints}
          className={`flex-1 ${
            noPoints
              ? 'bg-gray-800 cursor-not-allowed'
              : 'bg-white text-black hover:bg-gray-200'
          } py-2 px-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition shadow-md`}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <button
          onClick={onReset}
          disabled={noPoints}
          className={`${
            noPoints ? 'bg-gray-800 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-700'
          } text-white py-2 px-4 rounded-2xl transition shadow-md`}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Export button */}
      <button
        onClick={onExport}
        disabled={exportDisabled}
        className={`w-full ${
          exportDisabled
            ? 'bg-gray-800 cursor-not-allowed'
            : 'bg-white text-black hover:bg-gray-200'
        } py-2 px-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition shadow-md`}
      >
        <Download className="w-4 h-4" />
        {isRecording ? 'Recording...' : 'Create & Download Full Video'}
      </button>

      {/* Progress bar */}
      {(isPlaying || progress > 0) && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-300 mb-2 font-medium">
            <span>Progress</span>
            <span>
              Slide {currentSlideIndex + 1} of {slidesCount}
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentSlideIndex * 100 + progress * 100) / slidesCount).toFixed(1)}%`,
              }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Total Duration: ~{Math.round(totalDuration / 1000)}s
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaybackControls;

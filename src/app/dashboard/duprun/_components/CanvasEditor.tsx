'use client';

import { ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { Slide, ZoomPoint } from '@/types/duprun';

interface CanvasEditorProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  slides: Slide[];
  currentSlide: Slide | null;
  currentSlideIndex: number;
  currentPointIndex: number;
  isPlaying: boolean;
  slideTransition: number;
  onCanvasClick: (event: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (event: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
  onPointMouseDown: (event: React.MouseEvent<HTMLDivElement>, pointId: number) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

const CanvasEditor = ({
  canvasRef,
  slides,
  currentSlide,
  currentSlideIndex,
  currentPointIndex,
  isPlaying,
  slideTransition,
  onCanvasClick,
  onMouseMove,
  onMouseUp,
  onPointMouseDown,
  onNavigate,
}: CanvasEditorProps) => {
  return (
    <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 shadow-2xl h-full">
      {/* Slide navigation */}
      {slides.length > 1 && (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => onNavigate('prev')}
            disabled={currentSlideIndex === 0}
            className={`${
              currentSlideIndex === 0
                ? 'bg-gray-800 cursor-not-allowed'
                : 'bg-gray-800 hover:bg-gray-700'
            } text-white py-2 px-4 rounded-2xl flex items-center gap-2 transition shadow-md`}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <span className="text-lg font-semibold text-white">
            Slide {currentSlideIndex + 1} of {slides.length}
          </span>

          <button
            onClick={() => onNavigate('next')}
            disabled={currentSlideIndex === slides.length - 1}
            className={`${
              currentSlideIndex === slides.length - 1
                ? 'bg-gray-800 cursor-not-allowed'
                : 'bg-gray-800 hover:bg-gray-700'
            } text-white py-2 px-4 rounded-2xl flex items-center gap-2 transition shadow-md`}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Canvas + overlay */}
      <div className="flex justify-center h-[calc(100%-4rem)]">
        <div className="relative w-full h-full">
          <canvas
            ref={canvasRef}
            onClick={onCanvasClick}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            className="border border-gray-700 rounded-2xl cursor-crosshair w-full h-auto max-h-full bg-black shadow-xl"
            width={1440}
            height={810}
          />

          {/* Draggable zoom point markers */}
          {!isPlaying &&
            currentSlide &&
            slideTransition === 0 &&
            currentSlide.zoomPoints.map((point: ZoomPoint, index: number) => (
              <div
                key={point.id}
                onMouseDown={e => onPointMouseDown(e, point.id)}
                className={`absolute w-6 h-6 ${
                  index === currentPointIndex ? 'bg-red-500' : 'bg-white'
                } border-2 border-gray-900 rounded-full cursor-move flex items-center justify-center text-black text-sm font-bold shadow-md hover:scale-110 transition`}
                style={{
                  left: `${point.x * 100}%`,
                  top: `${point.y * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {index + 1}
              </div>
            ))}

          {/* Empty state */}
          {slides.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Upload className="w-14 h-14 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">Add images to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CanvasEditor;

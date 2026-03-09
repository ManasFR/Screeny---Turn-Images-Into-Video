'use client';

import { Trash2 } from 'lucide-react';
import { Slide } from '@/types/duprun';

interface ZoomPointManagerProps {
  currentSlide: Slide;
  onUpdateText: (pointId: number, text: string, slideId: number) => void;
  onRemovePoint: (pointId: number, slideId: number) => void;
  onClearAll: (slideId: number) => void;
}

const ZoomPointManager = ({
  currentSlide,
  onUpdateText,
  onRemovePoint,
  onClearAll,
}: ZoomPointManagerProps) => {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">
          Zoom Points ({currentSlide.zoomPoints.length})
        </h3>
        {currentSlide.zoomPoints.length > 0 && (
          <button
            onClick={() => onClearAll(currentSlide.id)}
            className="text-red-500 hover:text-red-400 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-3">
        Click on the image to add zoom points
      </p>

      <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2">
        {currentSlide.zoomPoints.map((point, index) => (
          <div
            key={point.id}
            className="flex items-center justify-between bg-gray-800/50 rounded-2xl p-3"
          >
            <span className="text-sm font-medium text-white">Point {index + 1}</span>
            <input
              type="text"
              value={point.text}
              onChange={e => onUpdateText(point.id, e.target.value, currentSlide.id)}
              placeholder="Add text"
              className="w-1/2 p-2 bg-gray-800 text-white border border-gray-700 rounded-xl focus:outline-none focus:border-white transition"
            />
            <button
              onClick={() => onRemovePoint(point.id, currentSlide.id)}
              className="text-red-500 hover:text-red-400 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ZoomPointManager;

'use client';

import { Plus, Trash2, Upload } from 'lucide-react';
import { Slide } from '@/types/duprun';

interface SlideManagerProps {
  slides: Slide[];
  currentSlideIndex: number;
  onAddSlide: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveSlide: (slideId: number, currentIdx: number) => void;
  onSelectSlide: (index: number) => void;
  onAddMusic: (event: React.ChangeEvent<HTMLInputElement>, slideId: number) => void;
  currentSlide: Slide | null;
}

const SlideManager = ({
  slides,
  currentSlideIndex,
  onAddSlide,
  onRemoveSlide,
  onSelectSlide,
  onAddMusic,
  currentSlide,
}: SlideManagerProps) => {
  return (
    <>
      {/* Add Images */}
      <div className="mb-4">
        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-700 rounded-2xl cursor-pointer hover:border-white transition">
          <Plus className="w-6 h-6 text-gray-400 mb-1" />
          <span className="text-base text-gray-300 font-medium">Add Images</span>
          <span className="text-sm text-gray-500">Multiple selection supported</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onAddSlide}
            className="hidden"
          />
        </label>
      </div>

      {/* Slide List */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Slides ({slides.length})</h3>
        </div>

        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`flex items-center justify-between rounded-2xl p-3 cursor-pointer transition ${
                index === currentSlideIndex
                  ? 'bg-gray-800'
                  : 'bg-gray-800/50 hover:bg-gray-800'
              }`}
              onClick={() => onSelectSlide(index)}
            >
              <div className="flex items-center gap-2">
                <img
                  src={slide.image}
                  alt="thumbnail"
                  className="w-10 h-6 object-cover rounded-lg border border-gray-700"
                />
                <div>
                  <span className="text-sm font-medium text-white block">
                    Slide {index + 1}
                  </span>
                  <span className="text-xs text-gray-500">
                    {slide.zoomPoints.length} points{slide.audio ? ' · Music Added' : ''}
                  </span>
                </div>
              </div>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onRemoveSlide(slide.id, currentSlideIndex);
                }}
                className="text-red-500 hover:text-red-400 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Music to Current Slide */}
      {currentSlide && (
        <div className="mb-4">
          <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-gray-700 rounded-2xl cursor-pointer hover:border-white transition">
            <Upload className="w-5 h-5 text-gray-400 mb-1" />
            <span className="text-sm text-gray-300 font-medium">
              Add Music to Current Slide
            </span>
            <input
              type="file"
              accept="audio/*"
              onChange={e => onAddMusic(e, currentSlide.id)}
              className="hidden"
            />
          </label>
          {currentSlide.audio && (
            <p className="text-xs text-gray-500 mt-2">Music added to this slide</p>
          )}
        </div>
      )}
    </>
  );
};

export default SlideManager;

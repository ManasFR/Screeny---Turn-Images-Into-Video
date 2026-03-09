'use client';

import { Upload } from 'lucide-react';

const GRADIENT_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'gradient1', label: 'Black to Gray' },
  { value: 'gradient2', label: 'Blue to Purple' },
  { value: 'gradient3', label: 'Green to Blue' },
  { value: 'gradient4', label: 'Red to Orange' },
  { value: 'custom', label: 'Custom Image' },
];

interface BackgroundSettingsProps {
  backgroundType: string;
  backgroundValue: string;
  onBackgroundTypeChange: (type: string) => void;
  onCustomImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const BackgroundSettings = ({
  backgroundType,
  backgroundValue,
  onBackgroundTypeChange,
  onCustomImageUpload,
}: BackgroundSettingsProps) => {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-2xl">
      <h2 className="text-xl font-bold text-white mb-4">Background Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="text-gray-300 block mb-1 font-medium">
            Background Type:
          </label>
          <select
            value={backgroundType}
            onChange={e => onBackgroundTypeChange(e.target.value)}
            className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-xl focus:outline-none focus:border-white transition"
          >
            {GRADIENT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {backgroundType === 'custom' && (
          <div>
            <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-gray-700 rounded-2xl cursor-pointer hover:border-white transition">
              <Upload className="w-5 h-5 text-gray-400 mb-1" />
              <span className="text-sm text-gray-300 font-medium">
                Upload Custom Background Image
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={onCustomImageUpload}
                className="hidden"
              />
            </label>
            {backgroundValue && (
              <p className="text-xs text-gray-500 mt-2">Custom background added</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BackgroundSettings;

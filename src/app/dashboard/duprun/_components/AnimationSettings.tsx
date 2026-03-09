'use client';

interface AnimationSettingsProps {
  zoomLevel: number;
  setZoomLevel: (v: number) => void;
  zoomDuration: number;
  setZoomDuration: (v: number) => void;
  transitionDuration: number;
  setTransitionDuration: (v: number) => void;
  transitionType: string;
  setTransitionType: (v: string) => void;
  cursorType: string;
  setCursorType: (v: string) => void;
}

const AnimationSettings = ({
  zoomLevel,
  setZoomLevel,
  zoomDuration,
  setZoomDuration,
  transitionDuration,
  setTransitionDuration,
  transitionType,
  setTransitionType,
  cursorType,
  setCursorType,
}: AnimationSettingsProps) => {
  const inputClass =
    'w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-xl focus:outline-none focus:border-white transition';

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-2xl">
      <h2 className="text-xl font-bold text-white mb-4">Animation Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="text-gray-300 block mb-1 font-medium">
            Zoom Level (1-10):
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={zoomLevel}
            onChange={e =>
              setZoomLevel(Math.max(1, Math.min(10, parseFloat(e.target.value))))
            }
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-gray-300 block mb-1 font-medium">
            Zoom Duration (ms):
          </label>
          <input
            type="number"
            min="1000"
            max="10000"
            value={zoomDuration}
            onChange={e => setZoomDuration(parseInt(e.target.value))}
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-gray-300 block mb-1 font-medium">
            Transition Duration (ms):
          </label>
          <input
            type="number"
            min="500"
            max="5000"
            value={transitionDuration}
            onChange={e => setTransitionDuration(parseInt(e.target.value))}
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-gray-300 block mb-1 font-medium">
            Transition Type:
          </label>
          <select
            value={transitionType}
            onChange={e => setTransitionType(e.target.value)}
            className={inputClass}
          >
            <option value="fade">Fade</option>
            <option value="slide">Slide</option>
            <option value="none">None</option>
          </select>
        </div>

        <div>
          <label className="text-gray-300 block mb-1 font-medium">
            Cursor Type:
          </label>
          <select
            value={cursorType}
            onChange={e => setCursorType(e.target.value)}
            className={inputClass}
          >
            <option value="arrow">Arrow</option>
            <option value="pointer">Pointer</option>
            <option value="hand">Hand</option>
            <option value="crosshair">Crosshair</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default AnimationSettings;

'use client';

const FONT_FAMILIES = [
  'Arial', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Poppins', 'Raleway', 'Inter', 'Noto Sans', 'Source Sans Pro',
];

interface StyleSettingsProps {
  textColor: string;
  setTextColor: (v: string) => void;
  textBgColor: string;
  setTextBgColor: (v: string) => void;
  textAnimation: string;
  setTextAnimation: (v: string) => void;
  textFontFamily: string;
  setTextFontFamily: (v: string) => void;
  textPadding: number;
  setTextPadding: (v: number) => void;
  textBorderRadius: number;
  setTextBorderRadius: (v: number) => void;
}

const StyleSettings = ({
  textColor,
  setTextColor,
  textBgColor,
  setTextBgColor,
  textAnimation,
  setTextAnimation,
  textFontFamily,
  setTextFontFamily,
  textPadding,
  setTextPadding,
  textBorderRadius,
  setTextBorderRadius,
}: StyleSettingsProps) => {
  const inputClass =
    'w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-xl focus:outline-none focus:border-white transition';

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-2xl">
      <h2 className="text-xl font-bold text-white mb-4">Style Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="text-gray-300 block mb-1 font-medium">Text Color:</label>
          <input
            type="color"
            value={textColor}
            onChange={e => setTextColor(e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-white transition"
          />
        </div>

        <div>
          <label className="text-gray-300 block mb-1 font-medium">
            Text Background Color:
          </label>
          <input
            type="color"
            value={textBgColor}
            onChange={e => setTextBgColor(e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-white transition"
          />
        </div>

        <div>
          <label className="text-gray-300 block mb-1 font-medium">Text Animation:</label>
          <select
            value={textAnimation}
            onChange={e => setTextAnimation(e.target.value)}
            className={inputClass}
          >
            <option value="none">None</option>
            <option value="fade-in">Fade In</option>
            <option value="slide-in">Slide In</option>
          </select>
        </div>

        <div>
          <label className="text-gray-300 block mb-1 font-medium">Text Font Family:</label>
          <select
            value={textFontFamily}
            onChange={e => setTextFontFamily(e.target.value)}
            className={inputClass}
          >
            {FONT_FAMILIES.map(font => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-gray-300 block mb-1 font-medium">
            Text Padding (px):
          </label>
          <input
            type="number"
            min="0"
            max="50"
            value={textPadding}
            onChange={e => setTextPadding(parseInt(e.target.value))}
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-gray-300 block mb-1 font-medium">
            Text Border Radius (px):
          </label>
          <input
            type="number"
            min="0"
            max="50"
            value={textBorderRadius}
            onChange={e => setTextBorderRadius(parseInt(e.target.value))}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
};

export default StyleSettings;

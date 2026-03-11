"use client";

import { MousePointer2, Pencil, ArrowRight, Type, Highlighter, Square, Crop, Undo2, Redo2, Trash2 } from "lucide-react";
import { SSAnnotationTool, SS_PRESET_COLORS, SS_STROKE_SIZES } from "@/hooks/useSSAnnotation";

interface SSAnnotationToolbarProps {
  tool: SSAnnotationTool;
  color: string;
  strokeSize: number;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (t: SSAnnotationTool) => void;
  onColorChange: (c: string) => void;
  onStrokeSizeChange: (s: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}

const TOOLS: { id: SSAnnotationTool; icon: React.ReactNode; title: string }[] = [
  { id: "select",    icon: <MousePointer2 className="w-3.5 h-3.5" />, title: "Select & Drag — move any shape" },
  { id: "pencil",    icon: <Pencil className="w-3.5 h-3.5" />,        title: "Pencil — draw freely" },
  { id: "arrow",     icon: <ArrowRight className="w-3.5 h-3.5" />,    title: "Arrow" },
  { id: "text",      icon: <Type className="w-3.5 h-3.5" />,          title: "Text — click to place" },
  { id: "highlight", icon: <Highlighter className="w-3.5 h-3.5" />,   title: "Highlight area" },
  { id: "rect",      icon: <Square className="w-3.5 h-3.5" />,        title: "Rectangle" },
  { id: "crop",      icon: <Crop className="w-3.5 h-3.5" />,          title: "Crop" },
];

export default function SSAnnotationToolbar({
  tool, color, strokeSize, canUndo, canRedo,
  onToolChange, onColorChange, onStrokeSizeChange, onUndo, onRedo, onClear,
}: SSAnnotationToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-[#181818] border-b border-[#282828] flex-wrap">

      {/* Tools */}
      <div className="flex items-center gap-0.5 p-1 bg-[#111] rounded-lg border border-[#282828]">
        {TOOLS.map(({ id, icon, title }) => (
          <button
            key={id}
            onClick={() => onToolChange(id)}
            title={title}
            className={`flex items-center justify-center w-7 h-7 rounded-md transition-all text-sm
              ${tool === id
                ? "bg-[#6ee7b7]/20 text-[#6ee7b7] ring-1 ring-[#6ee7b7]/50"
                : "text-[#777] hover:text-[#ccc] hover:bg-[#222]"
              }`}
          >
            {icon}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-[#2e2e2e]" />

      {/* Colors */}
      <div className="flex items-center gap-1.5">
        {SS_PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onColorChange(c)}
            title={c}
            className={`w-5 h-5 rounded-full transition-all hover:scale-110
              ${color === c ? "ring-2 ring-offset-1 ring-offset-[#181818] ring-[#6ee7b7] scale-110" : ""}`}
            style={{ backgroundColor: c, border: c === "#111111" ? "1px solid #444" : "none" }}
          />
        ))}
        {/* Custom color */}
        <label title="Custom color"
          className="w-5 h-5 rounded-full overflow-hidden cursor-pointer border border-dashed border-[#555] hover:border-[#6ee7b7] transition-colors"
          style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}>
          <input type="color" value={color} onChange={(e) => onColorChange(e.target.value)} className="opacity-0 w-0 h-0 absolute" />
        </label>
      </div>

      <div className="w-px h-5 bg-[#2e2e2e]" />

      {/* Stroke sizes */}
      <div className="flex items-center gap-0.5 p-1 bg-[#111] rounded-lg border border-[#282828]">
        {SS_STROKE_SIZES.map(({ label, value }) => (
          <button key={value} onClick={() => onStrokeSizeChange(value)} title={`Stroke ${label}`}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all
              ${strokeSize === value ? "bg-[#6ee7b7]/20 text-[#6ee7b7] ring-1 ring-[#6ee7b7]/50" : "text-[#777] hover:text-[#ccc] hover:bg-[#222]"}`}>
            <div className="rounded-full" style={{
              width: value === 2 ? 3 : value === 5 ? 6 : 10,
              height: value === 2 ? 3 : value === 5 ? 6 : 10,
              backgroundColor: strokeSize === value ? "#6ee7b7" : "#777",
            }} />
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-[#2e2e2e]" />

      {/* Undo / Redo / Clear */}
      <div className="flex items-center gap-0.5">
        <button onClick={onUndo} disabled={!canUndo} title="Undo"
          className="flex items-center justify-center w-7 h-7 rounded-md text-[#777] hover:text-[#ccc] hover:bg-[#222] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={onRedo} disabled={!canRedo} title="Redo"
          className="flex items-center justify-center w-7 h-7 rounded-md text-[#777] hover:text-[#ccc] hover:bg-[#222] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <Redo2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={onClear} title="Clear all"
          className="flex items-center justify-center w-7 h-7 rounded-md text-[#777] hover:text-red-400 hover:bg-red-400/10 transition-all">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Select mode hint */}
      {tool === "select" && (
        <span className="ml-auto text-[10px] text-[#6ee7b7]/60 font-mono hidden md:block">
          Click shape to select · Drag to move
        </span>
      )}
    </div>
  );
}

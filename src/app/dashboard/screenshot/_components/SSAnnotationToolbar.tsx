"use client";

import {
  MousePointer2, Pencil, ArrowRight, Type, Highlighter,
  Square, Circle, Hash, Eraser, Blend, Crop,
  Undo2, Redo2, Trash2,
} from "lucide-react";
import { SSAnnotationTool, SS_PRESET_COLORS, SS_STROKE_SIZES } from "@/hooks/useSSAnnotation";

interface Props {
  tool: SSAnnotationTool;
  color: string;
  strokeSize: number;
  opacity: number;
  badgeCount: number;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (t: SSAnnotationTool) => void;
  onColorChange: (c: string) => void;
  onStrokeSizeChange: (s: number) => void;
  onOpacityChange: (o: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}

const TOOLS: { id: SSAnnotationTool; icon: React.ReactNode; title: string }[] = [
  { id:"select",    icon:<MousePointer2 className="w-3.5 h-3.5"/>, title:"Select & Drag" },
  { id:"pencil",    icon:<Pencil className="w-3.5 h-3.5"/>,        title:"Pencil" },
  { id:"arrow",     icon:<ArrowRight className="w-3.5 h-3.5"/>,    title:"Arrow" },
  { id:"text",      icon:<Type className="w-3.5 h-3.5"/>,          title:"Text — click to place" },
  { id:"highlight", icon:<Highlighter className="w-3.5 h-3.5"/>,   title:"Highlight" },
  { id:"rect",      icon:<Square className="w-3.5 h-3.5"/>,        title:"Rectangle" },
  { id:"circle",    icon:<Circle className="w-3.5 h-3.5"/>,        title:"Circle / Oval" },
  { id:"badge",     icon:<Hash className="w-3.5 h-3.5"/>,          title:"Number Badge — click to place" },
  { id:"blur",      icon:<Blend className="w-3.5 h-3.5"/>,         title:"Blur / Mosaic — hide sensitive info" },
  { id:"eraser",    icon:<Eraser className="w-3.5 h-3.5"/>,        title:"Eraser" },
  { id:"crop",      icon:<Crop className="w-3.5 h-3.5"/>,          title:"Crop" },
];

export default function SSAnnotationToolbar({
  tool, color, strokeSize, opacity, badgeCount, canUndo, canRedo,
  onToolChange, onColorChange, onStrokeSizeChange, onOpacityChange,
  onUndo, onRedo, onClear,
}: Props) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-[#181818] border-b border-[#282828] flex-wrap">

      {/* Tools */}
      <div className="flex items-center gap-0.5 p-1 bg-[#111] rounded-lg border border-[#282828]">
        {TOOLS.map(({ id, icon, title }) => (
          <button key={id} onClick={() => onToolChange(id)} title={title}
            className={`relative flex items-center justify-center w-7 h-7 rounded-md transition-all
              ${tool === id
                ? "bg-[#6ee7b7]/20 text-[#6ee7b7] ring-1 ring-[#6ee7b7]/50"
                : "text-[#777] hover:text-[#ccc] hover:bg-[#222]"
              }`}>
            {icon}
            {/* badge counter preview */}
            {id === "badge" && tool === "badge" && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#6ee7b7] text-[#111] text-[8px] font-bold flex items-center justify-center leading-none">
                {badgeCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-[#2e2e2e]" />

      {/* Colors */}
      <div className="flex items-center gap-1.5">
        {SS_PRESET_COLORS.map((c) => (
          <button key={c} onClick={() => onColorChange(c)} title={c}
            className={`w-5 h-5 rounded-full transition-all hover:scale-110
              ${color === c ? "ring-2 ring-offset-1 ring-offset-[#181818] ring-[#6ee7b7] scale-110" : ""}`}
            style={{ backgroundColor: c, border: c === "#111111" ? "1px solid #444" : "none" }}
          />
        ))}
        {/* Custom color */}
        <label title="Custom color"
          className="w-5 h-5 rounded-full overflow-hidden cursor-pointer border border-dashed border-[#555] hover:border-[#6ee7b7] transition-colors"
          style={{ background: "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)" }}>
          <input type="color" value={color} onChange={e => onColorChange(e.target.value)} className="opacity-0 w-0 h-0 absolute"/>
        </label>
      </div>

      <div className="w-px h-5 bg-[#2e2e2e]" />

      {/* Stroke size */}
      <div className="flex items-center gap-0.5 p-1 bg-[#111] rounded-lg border border-[#282828]">
        {SS_STROKE_SIZES.map(({ label, value }) => (
          <button key={value} onClick={() => onStrokeSizeChange(value)} title={`Size ${label}`}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all
              ${strokeSize === value ? "bg-[#6ee7b7]/20 text-[#6ee7b7] ring-1 ring-[#6ee7b7]/50" : "text-[#777] hover:text-[#ccc] hover:bg-[#222]"}`}>
            <div className="rounded-full" style={{
              width: value===2?3:value===5?6:10,
              height: value===2?3:value===5?6:10,
              backgroundColor: strokeSize===value?"#6ee7b7":"#777",
            }}/>
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-[#2e2e2e]" />

      {/* Opacity slider */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#666] font-mono">OPACITY</span>
        <input
          type="range" min={10} max={100} step={5} value={Math.round(opacity * 100)}
          onChange={e => onOpacityChange(Number(e.target.value) / 100)}
          className="w-20 h-1 appearance-none rounded-full cursor-pointer accent-[#6ee7b7]"
          style={{ background: `linear-gradient(to right,#6ee7b7 ${opacity*100}%,#2e2e2e ${opacity*100}%)` }}
          title={`Opacity: ${Math.round(opacity * 100)}%`}
        />
        <span className="text-[10px] text-[#888] font-mono tabular-nums w-7">{Math.round(opacity * 100)}%</span>
      </div>

      <div className="w-px h-5 bg-[#2e2e2e]" />

      {/* Undo / Redo / Clear */}
      <div className="flex items-center gap-0.5">
        <button onClick={onUndo} disabled={!canUndo} title="Undo"
          className="flex items-center justify-center w-7 h-7 rounded-md text-[#777] hover:text-[#ccc] hover:bg-[#222] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <Undo2 className="w-3.5 h-3.5"/>
        </button>
        <button onClick={onRedo} disabled={!canRedo} title="Redo"
          className="flex items-center justify-center w-7 h-7 rounded-md text-[#777] hover:text-[#ccc] hover:bg-[#222] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <Redo2 className="w-3.5 h-3.5"/>
        </button>
        <button onClick={onClear} title="Clear all"
          className="flex items-center justify-center w-7 h-7 rounded-md text-[#777] hover:text-red-400 hover:bg-red-400/10 transition-all">
          <Trash2 className="w-3.5 h-3.5"/>
        </button>
      </div>

      {/* Contextual hint */}
      {tool === "blur" && (
        <span className="ml-1 text-[10px] text-[#6ee7b7]/50 font-mono">Drag over area to pixelate</span>
      )}
      {tool === "badge" && (
        <span className="ml-1 text-[10px] text-[#6ee7b7]/50 font-mono">Click to place badge #{badgeCount}</span>
      )}
    </div>
  );
}

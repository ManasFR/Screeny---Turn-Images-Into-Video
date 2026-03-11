import { useState, useCallback } from "react";

export type SSAnnotationTool =
  | "select" | "pencil" | "arrow" | "text"
  | "highlight" | "rect" | "circle" | "badge"
  | "blur" | "eraser" | "crop";

export interface SSPoint      { x: number; y: number; }
export interface SSCropRect   { x: number; y: number; w: number; h: number; }

// Base fields shared by all ops
interface SSOpBase { id: string; color: string; size: number; opacity: number; }

export interface SSPencilOp    extends SSOpBase { type: "pencil";    points: SSPoint[]; }
export interface SSArrowOp     extends SSOpBase { type: "arrow";     from: SSPoint; to: SSPoint; }
export interface SSTextOp      extends SSOpBase { type: "text";      pos: SSPoint; text: string; fontSize: number; }
export interface SSHighlightOp extends SSOpBase { type: "highlight"; from: SSPoint; to: SSPoint; }
export interface SSRectOp      extends SSOpBase { type: "rect";      from: SSPoint; to: SSPoint; }
export interface SSCircleOp    extends SSOpBase { type: "circle";    from: SSPoint; to: SSPoint; }
export interface SSBadgeOp     extends SSOpBase { type: "badge";     pos: SSPoint;  number: number; }
export interface SSBlurOp      extends SSOpBase { type: "blur";      from: SSPoint; to: SSPoint; pixelSize: number; }
export interface SSEraserOp    extends SSOpBase { type: "eraser";    points: SSPoint[]; }

export type SSDrawOperation =
  | SSPencilOp | SSArrowOp | SSTextOp | SSHighlightOp
  | SSRectOp | SSCircleOp | SSBadgeOp | SSBlurOp | SSEraserOp;

export const SS_PRESET_COLORS = [
  "#ef4444","#f97316","#fbbf24","#22c55e",
  "#06b6d4","#3b82f6","#a855f7","#ffffff","#111111",
];

export const SS_STROKE_SIZES = [
  { label: "S", value: 2 },
  { label: "M", value: 5 },
  { label: "L", value: 10 },
];

export function useSSAnnotation() {
  const [tool,        setTool]        = useState<SSAnnotationTool>("pencil");
  const [color,       setColor]       = useState("#ef4444");
  const [strokeSize,  setStrokeSize]  = useState(5);
  const [opacity,     setOpacity]     = useState(1.0);
  const [badgeCount,  setBadgeCount]  = useState(1);
  const [operations,  setOperations]  = useState<SSDrawOperation[]>([]);
  const [redoStack,   setRedoStack]   = useState<SSDrawOperation[]>([]);
  const [cropRect,    setCropRect]    = useState<SSCropRect | null>(null);

  const addOperation = useCallback((op: SSDrawOperation) => {
    setOperations((prev) => [...prev, op]);
    setRedoStack([]);
    // auto-increment badge counter
    if (op.type === "badge") setBadgeCount((n) => n + 1);
  }, []);

  const updateOperation = useCallback((id: string, updater: (op: SSDrawOperation) => SSDrawOperation) => {
    setOperations((prev) => prev.map((op) => (op.id === id ? updater(op) : op)));
  }, []);

  const undo = useCallback(() => {
    setOperations((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      // decrement badge count if undoing a badge
      if (last.type === "badge") setBadgeCount((n) => Math.max(1, n - 1));
      setRedoStack((r) => [...r, last]);
      return prev.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setRedoStack((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      if (last.type === "badge") setBadgeCount((n) => n + 1);
      setOperations((ops) => [...ops, last]);
      return prev.slice(0, -1);
    });
  }, []);

  const clear = useCallback(() => {
    setOperations([]);
    setRedoStack([]);
    setCropRect(null);
    setBadgeCount(1);
  }, []);

  return {
    tool, setTool,
    color, setColor,
    strokeSize, setStrokeSize,
    opacity, setOpacity,
    badgeCount,
    operations, addOperation, updateOperation,
    undo, redo, clear,
    cropRect, setCropRect,
    canUndo: operations.length > 0,
    canRedo: redoStack.length > 0,
  };
}

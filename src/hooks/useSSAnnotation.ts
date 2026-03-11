import { useState, useCallback } from "react";

// "select" = drag/move mode
export type SSAnnotationTool = "select" | "pencil" | "arrow" | "text" | "highlight" | "rect" | "crop";

export interface SSPoint { x: number; y: number; }
export interface SSCropRect { x: number; y: number; w: number; h: number; }

export interface SSPencilOp    { id: string; type: "pencil";    color: string; size: number; points: SSPoint[]; }
export interface SSArrowOp     { id: string; type: "arrow";     color: string; size: number; from: SSPoint; to: SSPoint; }
export interface SSTextOp      { id: string; type: "text";      color: string; size: number; pos: SSPoint; text: string; fontSize: number; }
export interface SSHighlightOp { id: string; type: "highlight"; color: string; size: number; from: SSPoint; to: SSPoint; }
export interface SSRectOp      { id: string; type: "rect";      color: string; size: number; from: SSPoint; to: SSPoint; }

export type SSDrawOperation = SSPencilOp | SSArrowOp | SSTextOp | SSHighlightOp | SSRectOp;

export const SS_PRESET_COLORS = [
  "#ef4444","#f97316","#fbbf24","#22c55e","#06b6d4","#3b82f6","#a855f7","#ffffff","#111111",
];

export const SS_STROKE_SIZES = [
  { label: "S", value: 2 },
  { label: "M", value: 5 },
  { label: "L", value: 10 },
];

export function useSSAnnotation() {
  const [tool, setTool] = useState<SSAnnotationTool>("pencil");
  const [color, setColor] = useState("#ef4444");
  const [strokeSize, setStrokeSize] = useState(5);
  const [operations, setOperations] = useState<SSDrawOperation[]>([]);
  const [redoStack, setRedoStack] = useState<SSDrawOperation[]>([]);
  const [cropRect, setCropRect] = useState<SSCropRect | null>(null);

  const addOperation = useCallback((op: SSDrawOperation) => {
    setOperations((prev) => [...prev, op]);
    setRedoStack([]);
  }, []);

  // Used by drag to update an op's position in-place
  const updateOperation = useCallback((id: string, updater: (op: SSDrawOperation) => SSDrawOperation) => {
    setOperations((prev) => prev.map((op) => (op.id === id ? updater(op) : op)));
  }, []);

  const undo = useCallback(() => {
    setOperations((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      setRedoStack((r) => [...r, last]);
      return prev.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setRedoStack((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      setOperations((ops) => [...ops, last]);
      return prev.slice(0, -1);
    });
  }, []);

  const clear = useCallback(() => {
    setOperations([]);
    setRedoStack([]);
    setCropRect(null);
  }, []);

  return {
    tool, setTool,
    color, setColor,
    strokeSize, setStrokeSize,
    operations, addOperation, updateOperation,
    undo, redo, clear,
    cropRect, setCropRect,
    canUndo: operations.length > 0,
    canRedo: redoStack.length > 0,
  };
}

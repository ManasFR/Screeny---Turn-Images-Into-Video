export interface ZoomPoint {
  id: number;
  x: number;
  y: number;
  isDragging: boolean;
  text: string;
}

export interface Slide {
  id: number;
  image: string;
  zoomPoints: ZoomPoint[];
  title: string;
  audio: string | null;
  slideDuration?: number; // ms per zoom segment — overrides global zoomDuration
}

export interface PlanLimits {
  hasAccess: boolean;
  videosUsed: number;
  videosLimit: number;
  videosRemaining: number;
  watermark: boolean;
  noWatermark: boolean;
  planName?: string;
}

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3';

export type ExportFormat = 'webm' | 'gif' | '4k-webm';

export interface VideoSettings {
  zoomLevel: number;
  zoomDuration: number;
  transitionDuration: number;
  transitionType: string;
  cursorType: string;
  textColor: string;
  textBgColor: string;
  textAnimation: string;
  textFontFamily: string;
  textPadding: number;
  textBorderRadius: number;
  backgroundType: string;
  backgroundValue: string;
  aspectRatio: AspectRatio;
  exportFormat: ExportFormat;
  webcamEnabled: boolean;
  webcamX: number;        // normalized 0-1 position on canvas
  webcamY: number;
  webcamSize: number;     // radius in px (canvas coords)
  webcamMirror: boolean;
}

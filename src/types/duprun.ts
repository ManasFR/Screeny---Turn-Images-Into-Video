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
}

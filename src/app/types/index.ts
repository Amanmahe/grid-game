// types/index.ts
export type DrawingMode = 0 | 1 | 2 | 3;
export type PenState = 0 | 1 | 2; // 0 = disabled, 1 = pen, 2 = eraser

export interface BoardState {
  board: boolean[][];
  cursorX: number;
  cursorY: number;
  currentMode: DrawingMode;
  penState: PenState;
  menuActive: boolean;
  menuSelection: number;
  timestamp: number;
}

export interface MenuItem {
  id: string;
  name: string;
  icon: string;
  action: () => void;
}

export interface GridCell {
  x: number;
  y: number;
  drawn: boolean;
}
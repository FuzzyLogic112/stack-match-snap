export interface TileData {
  id: string;
  icon: string;
  layer: number;
  x: number;
  y: number;
  isBlocked: boolean;
  isVisible: boolean;
}

export interface TrayTile {
  id: string;
  icon: string;
}

export type GameStatus = 'playing' | 'won' | 'lost';

export const TILE_ICONS = [
  '🐑', '🐄', '🐷', '🐔', '🐴', '🐰', '🦊', '🐻',
  '🌻', '🌸', '🍎', '🍊', '🥕', '🌽', '🍇', '🍓'
];

export const TRAY_SIZE = 7;
export const MATCH_COUNT = 3;

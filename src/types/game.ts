export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Coordinate {
  x: number;
  y: number;
}

export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type ThemeId = 'EMERALD' | 'NEON' | 'RETRO_GB' | 'ABYSS';

export type ItemType =
  | 'APPLE' // Normal red apple (+10 pts, grows 1)
  | 'GOLDEN' // Golden Apple (+30 pts, timed)
  | 'SLOW' // Freeze berry (slows snake for 6s, +15 pts)
  | 'SPEED' // Speed chili (speeds snake for 5s + double points, +25 pts)
  | 'GHOST' // Ghost star (pass through body for 5s, +20 pts)
  | 'SHRINK'; // Magic mushroom (shrinks snake length by 3, +20 pts)

export interface MapItem {
  id: string;
  type: ItemType;
  position: Coordinate;
  expiresAt?: number; // timestamp in ms (for despawning)
  durationSec?: number;
}

export interface ActiveBuff {
  type: ItemType;
  remainingMs: number;
  totalMs: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  decay: number;
  size: number;
}

export interface BotSnake {
  id: string;
  name: string;
  color: string;
  headColor: string;
  segments: Coordinate[];
  angle: number;
  targetAngle: number;
  speed: number;
  personality?: 'COILER' | 'INTERCEPTOR' | 'HUNTER' | 'GLUTTON';
}

export interface GameStats {
  highScore: number;
  totalGames: number;
  totalApples: number;
  longestSnake: number;
  longestSurvivalSec: number;
  maxDistance: number;
  botKills: number;
}

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  bgColor: string;
  boardBg: string;
  gridLine: string;
  wallColor: string;
  snakeHead: string;
  snakeBodyStart: string;
  snakeBodyEnd: string;
  snakeGlow: string;
  eyeColor: string;
  appleColor: string;
  appleLeaf: string;
}

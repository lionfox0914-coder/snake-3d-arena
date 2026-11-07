import { GameStats, ThemeConfig, ThemeId } from '../types/game';

const STATS_KEY = 'classic_snake_stats_v2';
const PREFS_KEY = 'classic_snake_prefs_v2';

export const THEMES: Record<ThemeId, ThemeConfig> = {
  EMERALD: {
    id: 'EMERALD',
    name: '翡翠綠境',
    bgColor: '#090d16',
    boardBg: '#0f172a',
    gridLine: 'rgba(51, 65, 85, 0.25)',
    wallColor: '#1e293b',
    snakeHead: '#10b981',
    snakeBodyStart: '#34d399',
    snakeBodyEnd: '#059669',
    snakeGlow: 'rgba(16, 185, 129, 0.4)',
    eyeColor: '#022c22',
    appleColor: '#ef4444',
    appleLeaf: '#22c55e',
  },
  NEON: {
    id: 'NEON',
    name: '霓虹夜影',
    bgColor: '#0b0914',
    boardBg: '#130d24',
    gridLine: 'rgba(168, 85, 247, 0.15)',
    wallColor: '#2b1b4a',
    snakeHead: '#06b6d4',
    snakeBodyStart: '#22d3ee',
    snakeBodyEnd: '#ec4899',
    snakeGlow: 'rgba(6, 182, 212, 0.5)',
    eyeColor: '#083344',
    appleColor: '#f43f5e',
    appleLeaf: '#a855f7',
  },
  RETRO_GB: {
    id: 'RETRO_GB',
    name: '復古掌機',
    bgColor: '#879738',
    boardBg: '#9bbc0f',
    gridLine: 'rgba(15, 56, 15, 0.12)',
    wallColor: '#306230',
    snakeHead: '#0f380f',
    snakeBodyStart: '#1b4a1b',
    snakeBodyEnd: '#306230',
    snakeGlow: 'rgba(15, 56, 15, 0.25)',
    eyeColor: '#9bbc0f',
    appleColor: '#0f380f',
    appleLeaf: '#306230',
  },
  ABYSS: {
    id: 'ABYSS',
    name: '深海幽藍',
    bgColor: '#030712',
    boardBg: '#081426',
    gridLine: 'rgba(56, 189, 248, 0.12)',
    wallColor: '#0f2942',
    snakeHead: '#38bdf8',
    snakeBodyStart: '#60a5fa',
    snakeBodyEnd: '#2563eb',
    snakeGlow: 'rgba(56, 189, 248, 0.4)',
    eyeColor: '#082f49',
    appleColor: '#fb7185',
    appleLeaf: '#38bdf8',
  },
};

export const INITIAL_STATS: GameStats = {
  highScore: 0,
  totalGames: 0,
  totalApples: 0,
  longestSnake: 10,
  longestSurvivalSec: 0,
  maxDistance: 0,
  botKills: 0,
};

export interface UserPrefs {
  theme: ThemeId;
  soundEnabled: boolean;
  touchControls: boolean;
}

export const INITIAL_PREFS: UserPrefs = {
  theme: 'EMERALD',
  soundEnabled: true,
  touchControls: true,
};

export function loadStats(): GameStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return INITIAL_STATS;
    return { ...INITIAL_STATS, ...JSON.parse(raw) };
  } catch {
    return INITIAL_STATS;
  }
}

export function saveStats(stats: GameStats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

export function loadPrefs(): UserPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return INITIAL_PREFS;
    return { ...INITIAL_PREFS, ...JSON.parse(raw) };
  } catch {
    return INITIAL_PREFS;
  }
}

export function savePrefs(prefs: UserPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

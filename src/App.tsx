/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ActiveBuff,
  BotSnake,
  Coordinate,
  GameState,
  ItemType,
  MapItem,
  Particle,
} from './types/game';
import { sound } from './utils/audio';
import {
  INITIAL_STATS,
  THEMES,
  loadPrefs,
  loadStats,
  savePrefs,
  saveStats,
  UserPrefs,
} from './utils/storage';
import { TopBar } from './components/TopBar';
import { GameHud } from './components/GameHud';
import { SnakeCanvas } from './components/SnakeCanvas';
import { VirtualDPad } from './components/VirtualDPad';
import { GameOverModal } from './components/GameOverModal';
import { StatsModal } from './components/StatsModal';
import { SettingsModal } from './components/SettingsModal';
import { HowToPlayModal } from './components/HowToPlayModal';

const BASE_SPEED = 7.2; // unified constant player speed
const TURN_SPEED = 5.2; // radians per second
const SEGMENT_DISTANCE = 0.52; // distance between snake body segments
const SEG_DIST_SQ = SEGMENT_DISTANCE * SEGMENT_DISTANCE;
const EAT_RADIUS = 1.05;
const DESIRED_ITEM_COUNT = 16;
const MAX_ITEM_DISTANCE = 48;

const BOT_CONFIGS: Array<{
  id: string;
  name: string;
  color: string;
  headColor: string;
  personality: 'COILER' | 'INTERCEPTOR' | 'HUNTER' | 'GLUTTON';
}> = [
  { id: 'bot_1', name: '赤焰狂蟒', color: '#f87171', headColor: '#ef4444', personality: 'HUNTER' },
  { id: 'bot_2', name: '深海巨蛟', color: '#60a5fa', headColor: '#3b82f6', personality: 'COILER' },
  { id: 'bot_3', name: '紫晶魔蚺', color: '#c084fc', headColor: '#a855f7', personality: 'INTERCEPTOR' },
  { id: 'bot_4', name: '金眼金蝰', color: '#fbbf24', headColor: '#f59e0b', personality: 'COILER' },
  { id: 'bot_5', name: '翡翠靈蛇', color: '#34d399', headColor: '#10b981', personality: 'GLUTTON' },
  { id: 'bot_6', name: '幽冥夜蟒', color: '#94a3b8', headColor: '#64748b', personality: 'INTERCEPTOR' },
  { id: 'bot_7', name: '極光幻蚺', color: '#2dd4bf', headColor: '#0d9488', personality: 'COILER' },
  { id: 'bot_8', name: '熾陽狂蜥', color: '#fb923c', headColor: '#ea580c', personality: 'HUNTER' },
  { id: 'bot_9', name: '魅影魔蛇', color: '#e879f9', headColor: '#d946ef', personality: 'COILER' },
];

export default function App() {
  // Persistence
  const [stats, setStats] = useState(loadStats);
  const [prefs, setPrefs] = useState<UserPrefs>(loadPrefs);

  // Modals
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // React states for UI / HUD rendering (Updated on events or throttled to prevent 60fps React thrashing)
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [score, setScore] = useState<number>(0);
  const [kills, setKills] = useState<number>(0);
  const [snakeLength, setSnakeLength] = useState<number>(10);
  const [botsCount, setBotsCount] = useState<number>(9);
  const [currentDistance, setCurrentDistance] = useState<number>(0);
  const [headAngleState, setHeadAngleState] = useState<number>(0);
  const [headCoord, setHeadCoord] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeBuffs, setActiveBuffs] = useState<ActiveBuff[]>([]);

  const [gameOverInfo, setGameOverInfo] = useState<{
    reason: string;
    isNewRecord: boolean;
  }>({ reason: '', isNewRecord: false });

  // High-performance game state refs read directly by SnakeCanvas at 60 FPS
  const gameStateRef = useRef<GameState>('TITLE_MENU');
  gameStateRef.current = gameState;

  const snakeRef = useRef<Coordinate[]>([]);
  if (snakeRef.current.length === 0) {
    for (let i = 0; i < 10; i++) {
      snakeRef.current.push({ x: -i * SEGMENT_DISTANCE, y: 0 });
    }
  }

  const botsRef = useRef<BotSnake[]>([]);
  const itemsRef = useRef<MapItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const activeBuffsRef = useRef<ActiveBuff[]>([]);
  const currentDistanceRef = useRef<number>(0);

  const headAngleRef = useRef<number>(0);
  const targetAngleRef = useRef<number | null>(null);
  const lastAngleStateRef = useRef<number>(0);
  const lastHudUpdateRef = useRef<number>(0);

  const scoreRef = useRef<number>(score);
  scoreRef.current = score;

  const killsRef = useRef<number>(kills);
  killsRef.current = kills;

  const maxDistanceExploredRef = useRef<number>(0);
  const isBoostKeyPressedRef = useRef<boolean>(false);
  const resetLoopTimersRef = useRef<boolean>(false);

  // Audio muted state
  const [isMuted, setIsMuted] = useState(() => sound.getMuted());
  const currentTheme = THEMES[prefs.theme] || THEMES.EMERALD;

  // Audio mute toggle
  const handleToggleMute = useCallback(() => {
    const next = sound.toggleMute();
    setIsMuted(next);
    setPrefs((prev) => {
      const updated = { ...prev, soundEnabled: !next };
      savePrefs(updated);
      return updated;
    });
  }, []);

  // Update user preferences
  const handleUpdatePrefs = useCallback((updated: Partial<UserPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...updated };
      savePrefs(next);
      if (updated.soundEnabled !== undefined) {
        sound.setMuted(!updated.soundEnabled);
        setIsMuted(!updated.soundEnabled);
      }
      return next;
    });
  }, []);

  // Helper to spawn a bot at a safe distance from center
  const createBot = useCallback((config: (typeof BOT_CONFIGS)[0], center: Coordinate): BotSnake => {
    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnDist = 24 + Math.random() * 16;
    const headX = center.x + Math.cos(spawnAngle) * spawnDist;
    const headY = center.y + Math.sin(spawnAngle) * spawnDist;
    const heading = spawnAngle + Math.PI / 2 + (Math.random() - 0.5) * 0.8;

    const length = 10 + Math.floor(Math.random() * 8);
    const segments: Coordinate[] = [];
    for (let i = 0; i < length; i++) {
      segments.push({
        x: headX - Math.cos(heading) * (i * SEGMENT_DISTANCE),
        y: headY - Math.sin(heading) * (i * SEGMENT_DISTANCE),
      });
    }

    return {
      id: `${config.id}_${Date.now()}_${Math.random()}`,
      name: config.name,
      color: config.color,
      headColor: config.headColor,
      personality: config.personality,
      segments,
      angle: heading,
      targetAngle: heading,
      speed: 5.6 + Math.random() * 0.8,
    };
  }, []);

  // Find a free coordinate in the infinite world around a center point
  const getFreeInfiniteCoordinate = useCallback(
    (
      center: Coordinate,
      currentSnake: Coordinate[],
      currentItems: MapItem[],
      minRadius = 5,
      maxRadius = 22
    ): Coordinate => {
      const occupied = currentSnake.slice(0, 15);

      for (let attempt = 0; attempt < 20; attempt++) {
        const radius = minRadius + Math.random() * (maxRadius - minRadius);
        const angle = Math.random() * Math.PI * 2;
        const candidateX = center.x + Math.cos(angle) * radius;
        const candidateY = center.y + Math.sin(angle) * radius;

        const tooCloseToSnake = occupied.some(
          (s) => Math.abs(s.x - candidateX) < 1.0 && Math.abs(s.y - candidateY) < 1.0
        );
        const tooCloseToItem = currentItems.some(
          (i) => Math.abs(i.position.x - candidateX) < 1.2 && Math.abs(i.position.y - candidateY) < 1.2
        );

        if (!tooCloseToSnake && !tooCloseToItem) {
          return { x: candidateX, y: candidateY };
        }
      }

      const fallbackAngle = Math.random() * Math.PI * 2;
      return {
        x: center.x + Math.cos(fallbackAngle) * 8,
        y: center.y + Math.sin(fallbackAngle) * 8,
      };
    },
    []
  );

  // Create an item helper in infinite space
  const createInfiniteMapItem = useCallback(
    (
      type: ItemType,
      currentSnake: Coordinate[],
      existingItems: MapItem[],
      minRadius = 5,
      maxRadius = 24,
      fixedCoord?: Coordinate
    ): MapItem => {
      const head = currentSnake[0] || { x: 0, y: 0 };
      const pos = fixedCoord || getFreeInfiniteCoordinate(head, currentSnake, existingItems, minRadius, maxRadius);
      const durationSec = type === 'GOLDEN' ? 14 : 16;
      return {
        id: `${type}_${Date.now()}_${Math.random()}`,
        type,
        position: pos,
        durationSec,
        expiresAt: type !== 'APPLE' ? Date.now() + durationSec * 1000 : undefined,
      };
    },
    [getFreeInfiniteCoordinate]
  );

  // Spawn visual particles directly in particle ref
  const emitParticles = useCallback((coord: Coordinate, color: string, count = 16) => {
    const list = particlesRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.0 + 1;
      list.push({
        x: coord.x,
        y: coord.y,
        vx: Math.cos(angle) * speed * 0.08,
        vy: Math.sin(angle) * speed * 0.08,
        color,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.02,
        size: Math.random() * 3 + 2.5,
      });
    }
  }, []);

  // Game over handler
  const handleGameOver = useCallback(
    (reason: string) => {
      if (gameStateRef.current === 'GAME_OVER') return;
      sound.playHit();
      sound.playGameOver();
      setGameState('GAME_OVER');
      gameStateRef.current = 'GAME_OVER';

      const finalScore = scoreRef.current;
      const finalDistance = maxDistanceExploredRef.current;
      const finalKills = killsRef.current;
      const isNew = finalScore > (stats.highScore || 0);

      setGameOverInfo({
        reason,
        isNewRecord: isNew,
      });

      setStats((prev) => {
        const next: typeof prev = {
          ...prev,
          totalGames: prev.totalGames + 1,
          longestSnake: Math.max(prev.longestSnake, snakeRef.current.length),
          highScore: Math.max(prev.highScore || 0, finalScore),
          maxDistance: Math.max(prev.maxDistance || 0, finalDistance),
          botKills: (prev.botKills || 0) + finalKills,
        };
        saveStats(next);
        return next;
      });
    },
    [stats.highScore, stats.maxDistance]
  );

  const handleGameOverRef = useRef(handleGameOver);
  handleGameOverRef.current = handleGameOver;

  // Start new game round
  const startNewGame = useCallback(() => {
    const initialSnake: Coordinate[] = [];
    for (let i = 0; i < 10; i++) {
      initialSnake.push({ x: -i * SEGMENT_DISTANCE, y: 0 });
    }

    const initialItems: MapItem[] = [];
    for (let i = 0; i < 6; i++) {
      initialItems.push(createInfiniteMapItem('APPLE', initialSnake, initialItems, 4, 16));
    }
    initialItems.push(createInfiniteMapItem('GOLDEN', initialSnake, initialItems, 6, 18));
    initialItems.push(createInfiniteMapItem('SLOW', initialSnake, initialItems, 7, 20));
    initialItems.push(createInfiniteMapItem('SPEED', initialSnake, initialItems, 8, 22));

    const initialBots = BOT_CONFIGS.map((cfg) => createBot(cfg, { x: 0, y: 0 }));

    headAngleRef.current = 0;
    targetAngleRef.current = 0;
    resetLoopTimersRef.current = true;
    snakeRef.current = initialSnake;
    botsRef.current = initialBots;
    itemsRef.current = initialItems;
    particlesRef.current = [];
    activeBuffsRef.current = [];
    scoreRef.current = 0;
    killsRef.current = 0;
    maxDistanceExploredRef.current = 0;
    currentDistanceRef.current = 0;
    gameStateRef.current = 'PLAYING';

    setHeadAngleState(0);
    setSnakeLength(initialSnake.length);
    setBotsCount(initialBots.length);
    setActiveBuffs([]);
    setScore(0);
    setKills(0);
    setCurrentDistance(0);
    setHeadCoord({ x: 0, y: 0 });
    setGameState('PLAYING');
  }, [createBot, createInfiniteMapItem]);

  // Toggle Pause / Resume
  const toggleStartPause = useCallback(() => {
    if (gameState === 'TITLE_MENU' || gameState === 'GAME_OVER') {
      startNewGame();
    } else if (gameState === 'PLAYING') {
      setGameState('PAUSED');
      gameStateRef.current = 'PAUSED';
    } else if (gameState === 'PAUSED') {
      setGameState('PLAYING');
      gameStateRef.current = 'PLAYING';
    }
  }, [gameState, startNewGame]);

  // Canvas click handler
  const handleCanvasClick = useCallback(() => {
    if (gameStateRef.current === 'PAUSED') {
      setGameState('PLAYING');
      gameStateRef.current = 'PLAYING';
    } else if (gameStateRef.current === 'TITLE_MENU') {
      startNewGame();
    }
  }, [startNewGame]);

  // Handle pointer / mouse target angle from Canvas
  const handlePointerMoveAngle = useCallback((angle: number | null) => {
    targetAngleRef.current = angle;
  }, []);

  // Continuous High-Performance Physics & Simulation Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let lastBuffTickTime = performance.now();

    const loop = (timestamp: number) => {
      animId = requestAnimationFrame(loop);

      if (resetLoopTimersRef.current) {
        resetLoopTimersRef.current = false;
        lastTime = timestamp;
        lastBuffTickTime = timestamp;
      }
      const dt = Math.min(0.064, (timestamp - lastTime) / 1000);
      lastTime = timestamp;

      if (gameStateRef.current === 'PLAYING') {
        const currentSnake = snakeRef.current;
        const currentHead = currentSnake[0] || { x: 0, y: 0 };
        const currentBots = botsRef.current;

        // Player thickness multiplier
        const playerGirth = 1.0 + Math.min(0.40, Math.max(0, currentSnake.length - 10) * 0.008);
        const playerHeadWorldRadius = 0.48 * playerGirth;

        // 1. Buffs countdown & item upkeep (every 100ms)
        if (timestamp - lastBuffTickTime >= 100) {
          const deltaBuff = timestamp - lastBuffTickTime;
          lastBuffTickTime = timestamp;

          if (activeBuffsRef.current.length > 0) {
            const nextBuffs = activeBuffsRef.current
              .map((b) => ({ ...b, remainingMs: b.remainingMs - deltaBuff }))
              .filter((b) => b.remainingMs > 0);
            activeBuffsRef.current = nextBuffs;
            setActiveBuffs(nextBuffs);
          }

          // Despawn expired or distant items
          const nowMs = Date.now();
          const validItems = itemsRef.current.filter((item) => {
            if (item.expiresAt && item.expiresAt <= nowMs) return false;
            const distFromPlayer = Math.hypot(item.position.x - currentHead.x, item.position.y - currentHead.y);
            return distFromPlayer <= MAX_ITEM_DISTANCE;
          });

          // Replenish items
          let appleCount = validItems.filter((i) => i.type === 'APPLE').length;
          while (appleCount < 6) {
            validItems.push(createInfiniteMapItem('APPLE', currentSnake, validItems, 5, 24));
            appleCount++;
          }

          while (validItems.length < DESIRED_ITEM_COUNT) {
            const pool: ItemType[] = ['APPLE', 'GOLDEN', 'SLOW', 'SPEED', 'GHOST', 'SHRINK'];
            const chosen = pool[Math.floor(Math.random() * pool.length)];
            validItems.push(createInfiniteMapItem(chosen, currentSnake, validItems, 6, 28));
          }

          itemsRef.current = validItems;

          // In-place particle decay
          const parts = particlesRef.current;
          if (parts.length > 0) {
            for (let i = parts.length - 1; i >= 0; i--) {
              const p = parts[i];
              p.x += p.vx;
              p.y += p.vy;
              p.alpha -= p.decay;
              if (p.alpha <= 0) {
                parts.splice(i, 1);
              }
            }
          }
        }

        // 2. Smooth Steering towards target angle
        let currentAngle = headAngleRef.current;
        const targetAngle = targetAngleRef.current;

        if (targetAngle !== null) {
          let diff = targetAngle - currentAngle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;

          const maxTurn = TURN_SPEED * dt;
          if (Math.abs(diff) < maxTurn) {
            currentAngle = targetAngle;
          } else {
            currentAngle += Math.sign(diff) * maxTurn;
          }
          headAngleRef.current = currentAngle;
        }

        // 3. Constant Speed Calculation
        let speed = BASE_SPEED;
        const hasSpeedBuff = activeBuffsRef.current.some((b) => b.type === 'SPEED');
        const hasSlowBuff = activeBuffsRef.current.some((b) => b.type === 'SLOW');

        if (hasSpeedBuff || isBoostKeyPressedRef.current) speed *= 1.45;
        if (hasSlowBuff) speed *= 0.68;

        // 4. Move Player Head
        const moveDist = speed * dt;
        const newHeadX = currentHead.x + Math.cos(currentAngle) * moveDist;
        const newHeadY = currentHead.y + Math.sin(currentAngle) * moveDist;

        // Update distance
        const currentDistM = Math.round(Math.hypot(newHeadX, newHeadY));
        currentDistanceRef.current = currentDistM;
        if (currentDistM > maxDistanceExploredRef.current) {
          maxDistanceExploredRef.current = currentDistM;
        }

        // Throttled HUD updates (10Hz) to eliminate React reconciliation overhead
        if (timestamp - lastHudUpdateRef.current >= 100) {
          lastHudUpdateRef.current = timestamp;
          setCurrentDistance(currentDistM);
          setHeadCoord({ x: Math.round(newHeadX * 10) / 10, y: Math.round(newHeadY * 10) / 10 });
          if (Math.abs(currentAngle - lastAngleStateRef.current) > 0.08) {
            lastAngleStateRef.current = currentAngle;
            setHeadAngleState(currentAngle);
          }
        }

        const hasGhost = activeBuffsRef.current.some((b) => b.type === 'GHOST');

        // 5. CRITICAL RULE: If player's head touches an opponent bot's body, game ends!
        // Highly optimized with coarse bounding & fast AABB before Math.hypot
        if (!hasGhost) {
          let hasCollided = false;
          for (let bIdx = 0; bIdx < currentBots.length; bIdx++) {
            const bot = currentBots[bIdx];
            const bHead = bot.segments[0];
            if (!bHead) continue;

            // Coarse check: skip bot if head is far
            if (Math.hypot(newHeadX - bHead.x, newHeadY - bHead.y) > 36) continue;

            const botGirth = 1.0 + Math.min(0.35, Math.max(0, bot.segments.length - 8) * 0.008);
            const botSegWorldRadius = 0.42 * botGirth;
            const hitDistance = (playerHeadWorldRadius + botSegWorldRadius) * 0.78;

            for (let segIdx = 0; segIdx < bot.segments.length; segIdx++) {
              const bSeg = bot.segments[segIdx];
              const dx = Math.abs(newHeadX - bSeg.x);
              if (dx > hitDistance) continue;
              const dy = Math.abs(newHeadY - bSeg.y);
              if (dy > hitDistance) continue;
              if (Math.hypot(dx, dy) < hitDistance) {
                handleGameOverRef.current(`頭部撞上了電腦對手【${bot.name}】的蛇身！`);
                hasCollided = true;
                break;
              }
            }
            if (hasCollided) break;
          }
          if (hasCollided) {
            return;
          }
        }

        // 6. Update Bot Snakes AI, Slither & Check if Bot Head hits Player Body
        const survivingBots: BotSnake[] = [];
        const droppedItems: MapItem[] = [];
        const botEatenItemIds = new Set<string>();

        for (let bIndex = 0; bIndex < currentBots.length; bIndex++) {
          const bot = currentBots[bIndex];
          const bHead = bot.segments[0] || { x: 0, y: 0 };
          const distToPlayer = Math.hypot(bHead.x - newHeadX, bHead.y - newHeadY);
          const botGirth = 1.0 + Math.min(0.35, Math.max(0, bot.segments.length - 8) * 0.008);
          const bHeadWorldRadius = 0.45 * botGirth;

          // Respawn bot if drifted too far
          if (distToPlayer > 52) {
            const respawnCfg = BOT_CONFIGS[bIndex % BOT_CONFIGS.length];
            survivingBots.push(createBot(respawnCfg, { x: newHeadX, y: newHeadY }));
            continue;
          }

          // Check if BOT HEAD hits PLAYER BODY (index >= 1) -> Bot dies and turns to food!
          // Optimized with fast squared distance
          let botDied = false;
          const pSegRadius = 0.44 * playerGirth;
          const killDist = (bHeadWorldRadius + pSegRadius) * 0.78;
          const killDistSq = killDist * killDist;

          for (let pIdx = 1; pIdx < currentSnake.length; pIdx++) {
            const pSeg = currentSnake[pIdx];
            const dx = Math.abs(bHead.x - pSeg.x);
            if (dx > killDist) continue;
            const dy = Math.abs(bHead.y - pSeg.y);
            if (dy > killDist) continue;

            if (dx * dx + dy * dy < killDistSq) {
              botDied = true;
              break;
            }
          }

          // Check if bot head hits another bot's body
          if (!botDied) {
            for (let otherIdx = 0; otherIdx < currentBots.length; otherIdx++) {
              if (otherIdx === bIndex) continue;
              const other = currentBots[otherIdx];
              const oHead = other.segments[0];
              if (oHead && Math.hypot(bHead.x - oHead.x, bHead.y - oHead.y) > 28) continue;

              const otherGirth = 1.0 + Math.min(0.35, Math.max(0, other.segments.length - 8) * 0.008);
              const otherSegRadius = 0.42 * otherGirth;
              const collideDist = (bHeadWorldRadius + otherSegRadius) * 0.75;
              const collideDistSq = collideDist * collideDist;

              for (let oIdx = 0; oIdx < other.segments.length; oIdx++) {
                const oSeg = other.segments[oIdx];
                const dx = Math.abs(bHead.x - oSeg.x);
                if (dx > collideDist) continue;
                const dy = Math.abs(bHead.y - oSeg.y);
                if (dy > collideDist) continue;

                if (dx * dx + dy * dy < collideDistSq) {
                  botDied = true;
                  break;
                }
              }
              if (botDied) break;
            }
          }

          if (botDied) {
            sound.playGoldenEat();
            emitParticles(bHead, bot.color, 20);

            // Drop a balanced number of items (4 to 6 items at most)
            const dropCount = Math.min(6, Math.max(3, Math.floor(bot.segments.length / 5)));
            const step = Math.max(1, Math.floor(bot.segments.length / dropCount));
            for (let sIdx = 1; sIdx < bot.segments.length && droppedItems.length < 6; sIdx += step) {
              const seg = bot.segments[sIdx];
              droppedItems.push({
                id: `drop_${Date.now()}_${Math.random()}`,
                type: droppedItems.length % 3 === 0 ? 'GOLDEN' : 'APPLE',
                position: { x: seg.x, y: seg.y },
                durationSec: 16,
                expiresAt: Date.now() + 16000,
              });
            }

            scoreRef.current += 60;
            setScore(scoreRef.current);
            killsRef.current += 1;
            setKills(killsRef.current);

            const respawnCfg = BOT_CONFIGS[bIndex % BOT_CONFIGS.length];
            survivingBots.push(createBot(respawnCfg, { x: newHeadX, y: newHeadY }));
            continue;
          }

          // SMART BOT AI STEERING
          let botTargetAngle = bot.targetAngle;
          const personality = bot.personality || 'HUNTER';

          if (distToPlayer < 18) {
            if (personality === 'COILER' || (bot.segments.length > 12 && personality !== 'GLUTTON')) {
              const angleFromPlayer = Math.atan2(bHead.y - newHeadY, bHead.x - newHeadX);
              botTargetAngle = angleFromPlayer + (Math.PI / 2 + 0.24);
            } else if (personality === 'INTERCEPTOR') {
              const leadDistance = Math.min(6.5, distToPlayer * 0.65);
              const leadX = newHeadX + Math.cos(currentAngle) * leadDistance;
              const leadY = newHeadY + Math.sin(currentAngle) * leadDistance;
              botTargetAngle = Math.atan2(leadY - bHead.y, leadX - bHead.x);
            } else if (personality === 'HUNTER') {
              const flankOffset = Math.PI / 3;
              const flankX = newHeadX + Math.cos(currentAngle + flankOffset) * 4.0;
              const flankY = newHeadY + Math.sin(currentAngle + flankOffset) * 4.0;
              botTargetAngle = Math.atan2(flankY - bHead.y, flankX - bHead.x);
            }
          }

          if (distToPlayer >= 18 || personality === 'GLUTTON') {
            let closestItemDist = 20;
            let targetItemPos: Coordinate | null = null;

            for (let iIdx = 0; iIdx < itemsRef.current.length; iIdx++) {
              const item = itemsRef.current[iIdx];
              const d = Math.hypot(item.position.x - bHead.x, item.position.y - bHead.y);
              if (d < closestItemDist) {
                closestItemDist = d;
                targetItemPos = item.position;
              }
            }

            if (targetItemPos) {
              botTargetAngle = Math.atan2(targetItemPos.y - bHead.y, targetItemPos.x - bHead.x);
            } else if (distToPlayer > 30) {
              botTargetAngle = Math.atan2(newHeadY - bHead.y, newHeadX - bHead.x);
            } else if (Math.random() < 0.04) {
              botTargetAngle += (Math.random() - 0.5) * 0.8;
            }
          }

          // SELF-PRESERVATION: Steer away if dangerously close to player body
          if (distToPlayer < 7.0) {
            for (let pIdx = 1; pIdx < Math.min(25, currentSnake.length); pIdx++) {
              const pSeg = currentSnake[pIdx];
              if (Math.abs(bHead.x - pSeg.x) > 3.0 || Math.abs(bHead.y - pSeg.y) > 3.0) continue;
              const away = Math.atan2(bHead.y - pSeg.y, bHead.x - pSeg.x);
              botTargetAngle = away;
              break;
            }
          }

          // Turn bot smoothly
          let bAngle = bot.angle;
          let diff = botTargetAngle - bAngle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;

          const maxBotTurn = 4.2 * dt;
          if (Math.abs(diff) < maxBotTurn) {
            bAngle = botTargetAngle;
          } else {
            bAngle += Math.sign(diff) * maxBotTurn;
          }

          // Move bot head
          const bMoveDist = bot.speed * dt;
          const nextBHeadX = bHead.x + Math.cos(bAngle) * bMoveDist;
          const nextBHeadY = bHead.y + Math.sin(bAngle) * bMoveDist;

          // In-place distance constraints for bot segments with squared distance check
          const bSegments = bot.segments;
          bSegments[0].x = nextBHeadX;
          bSegments[0].y = nextBHeadY;

          for (let i = 1; i < bSegments.length; i++) {
            const prev = bSegments[i - 1];
            const curr = bSegments[i];
            const dx = curr.x - prev.x;
            const dy = curr.y - prev.y;
            const distSq = dx * dx + dy * dy;

            if (distSq > SEG_DIST_SQ) {
              const dist = Math.sqrt(distSq);
              const factor = SEGMENT_DISTANCE / dist;
              curr.x = prev.x + dx * factor;
              curr.y = prev.y + dy * factor;
            }
          }

          // Bot eat food (MUST consume item to avoid runaway 60fps infinite growth)
          for (let iIdx = 0; iIdx < itemsRef.current.length; iIdx++) {
            const item = itemsRef.current[iIdx];
            if (botEatenItemIds.has(item.id)) continue;
            const dx = Math.abs(nextBHeadX - item.position.x);
            if (dx > 1.0) continue;
            const dy = Math.abs(nextBHeadY - item.position.y);
            if (dy > 1.0) continue;

            if (dx * dx + dy * dy < 1.0) {
              botEatenItemIds.add(item.id);
              // Cap bot length at 35 to prevent runaway segment buildup
              if (bSegments.length < 35) {
                const growth = item.type === 'GOLDEN' ? 3 : 2;
                const tail = bSegments[bSegments.length - 1];
                for (let g = 0; g < growth; g++) {
                  bSegments.push({ x: tail.x, y: tail.y });
                }
              }
              break;
            }
          }

          bot.angle = bAngle;
          bot.targetAngle = botTargetAngle;
          survivingBots.push(bot);
        }

        botsRef.current = survivingBots;

        // Clean up items eaten by bots
        if (botEatenItemIds.size > 0) {
          itemsRef.current = itemsRef.current.filter((item) => !botEatenItemIds.has(item.id));
        }

        // 7. Check Map Item Collision (Player Eating)
        let eatenItem: MapItem | null = null;
        const allItems = droppedItems.length > 0 ? [...itemsRef.current, ...droppedItems] : itemsRef.current;
        const remainingItems: MapItem[] = [];

        const eatThreshold = EAT_RADIUS * playerGirth;
        const eatThresholdSq = eatThreshold * eatThreshold;
        for (let i = 0; i < allItems.length; i++) {
          const item = allItems[i];
          const dx = Math.abs(newHeadX - item.position.x);
          const dy = Math.abs(newHeadY - item.position.y);
          if (
            !eatenItem &&
            dx < eatThreshold &&
            dy < eatThreshold &&
            dx * dx + dy * dy < eatThresholdSq
          ) {
            eatenItem = item;
          } else {
            remainingItems.push(item);
          }
        }

        // 8. Update Player Snake Segments In-Place with squared distance check
        currentSnake[0].x = newHeadX;
        currentSnake[0].y = newHeadY;

        for (let i = 1; i < currentSnake.length; i++) {
          const prev = currentSnake[i - 1];
          const curr = currentSnake[i];
          const dx = curr.x - prev.x;
          const dy = curr.y - prev.y;
          const distSq = dx * dx + dy * dy;

          if (distSq > SEG_DIST_SQ) {
            const dist = Math.sqrt(distSq);
            const factor = SEGMENT_DISTANCE / dist;
            curr.x = prev.x + dx * factor;
            curr.y = prev.y + dy * factor;
          }
        }

        // 9. Handle Eaten Item Rewards
        if (eatenItem) {
          const item = eatenItem as MapItem;
          let pts = 15;
          let particleColor = currentTheme.appleColor;

          if (item.type === 'APPLE') {
            sound.playEat();
            setStats((s) => {
              const updated = { ...s, totalApples: s.totalApples + 1 };
              saveStats(updated);
              return updated;
            });
            // Cap player snake length at 120 (gigantic, covers >3.5 screens)
            if (currentSnake.length < 120) {
              const tail = currentSnake[currentSnake.length - 1];
              for (let k = 0; k < 3; k++) {
                currentSnake.push({ x: tail.x, y: tail.y });
              }
            }
            setSnakeLength(currentSnake.length);
          } else if (item.type === 'GOLDEN') {
            pts = 50;
            particleColor = '#facc15';
            sound.playGoldenEat();
            if (currentSnake.length < 120) {
              const tail = currentSnake[currentSnake.length - 1];
              for (let k = 0; k < 5; k++) {
                currentSnake.push({ x: tail.x, y: tail.y });
              }
            }
            setSnakeLength(currentSnake.length);
          } else if (item.type === 'SLOW') {
            pts = 20;
            particleColor = '#38bdf8';
            sound.playPowerUp('SLOW');
            const nextBuffs: ActiveBuff[] = [
              ...activeBuffsRef.current.filter((b) => b.type !== 'SLOW'),
              { type: 'SLOW', remainingMs: 6000, totalMs: 6000 },
            ];
            activeBuffsRef.current = nextBuffs;
            setActiveBuffs(nextBuffs);
          } else if (item.type === 'SPEED') {
            pts = 30;
            particleColor = '#ea580c';
            sound.playPowerUp('SPEED');
            const nextBuffs: ActiveBuff[] = [
              ...activeBuffsRef.current.filter((b) => b.type !== 'SPEED'),
              { type: 'SPEED', remainingMs: 5000, totalMs: 5000 },
            ];
            activeBuffsRef.current = nextBuffs;
            setActiveBuffs(nextBuffs);
          } else if (item.type === 'GHOST') {
            pts = 25;
            particleColor = '#c084fc';
            sound.playPowerUp('GHOST');
            const nextBuffs: ActiveBuff[] = [
              ...activeBuffsRef.current.filter((b) => b.type !== 'GHOST'),
              { type: 'GHOST', remainingMs: 5000, totalMs: 5000 },
            ];
            activeBuffsRef.current = nextBuffs;
            setActiveBuffs(nextBuffs);
          } else if (item.type === 'SHRINK') {
            pts = 20;
            particleColor = '#10b981';
            sound.playPowerUp('SHRINK');
            const keepCount = Math.max(10, currentSnake.length - 8);
            currentSnake.splice(keepCount);
          }

          const finalPts = hasSpeedBuff ? pts * 2 : pts;
          const newScore = scoreRef.current + finalPts;
          scoreRef.current = newScore;
          setScore(newScore);

          emitParticles({ x: newHeadX, y: newHeadY }, particleColor, item.type === 'GOLDEN' ? 24 : 16);

          // Replenish new items
          if (item.type === 'APPLE') {
            remainingItems.push(createInfiniteMapItem('APPLE', currentSnake, remainingItems, 5, 24));
            if (Math.random() < 0.45) {
              const pool: ItemType[] = ['GOLDEN', 'SLOW', 'SPEED', 'GHOST', 'SHRINK'];
              const chosen = pool[Math.floor(Math.random() * pool.length)];
              remainingItems.push(createInfiniteMapItem(chosen, currentSnake, remainingItems, 7, 28));
            }
          }

          itemsRef.current = remainingItems;
        } else if (droppedItems.length > 0) {
          itemsRef.current = remainingItems;
        }
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [
    createBot,
    createInfiniteMapItem,
    currentTheme.appleColor,
    emitParticles,
  ]);

  // Keyboard controls for steering and pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        toggleStartPause();
        return;
      }

      if (e.code === 'KeyR') {
        e.preventDefault();
        startNewGame();
        return;
      }

      if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMute();
        return;
      }

      // Smooth keyboard steering
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        const nextAngle = headAngleRef.current - 0.28;
        targetAngleRef.current = nextAngle;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        const nextAngle = headAngleRef.current + 0.28;
        targetAngleRef.current = nextAngle;
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        targetAngleRef.current = -Math.PI / 2;
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        targetAngleRef.current = Math.PI / 2;
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        isBoostKeyPressedRef.current = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        isBoostKeyPressedRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleToggleMute, startNewGame, toggleStartPause]);

  // Reset stats
  const handleResetStats = useCallback(() => {
    if (confirm('確定要清除歷史戰績紀錄嗎？此動作無法復原。')) {
      setStats(INITIAL_STATS);
      saveStats(INITIAL_STATS);
    }
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col justify-between"
      style={{ backgroundColor: currentTheme.bgColor }}
    >
      {/* 1. Header */}
      <TopBar
        gameState={gameState}
        onStartPause={toggleStartPause}
        onRestart={startNewGame}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
      />

      {/* 2. Main Arena Section */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-3 sm:py-5 flex flex-col items-center justify-center gap-3">
        {/* HUD: Score, High Score, Snake Length, Alive Bots & Kills, Active Buffs */}
        <GameHud
          score={score}
          highScore={stats.highScore || 0}
          length={snakeLength}
          botsCount={botsCount}
          kills={kills}
          activeBuffs={activeBuffs}
          currentDistance={currentDistance}
          headCoordinate={headCoord}
        />

        {/* Infinite 360-degree Snake Canvas */}
        <div className="relative w-full flex flex-col items-center">
          <SnakeCanvas
            snakeRef={snakeRef}
            headAngleRef={headAngleRef}
            botsRef={botsRef}
            itemsRef={itemsRef}
            particlesRef={particlesRef}
            activeBuffsRef={activeBuffsRef}
            currentDistanceRef={currentDistanceRef}
            theme={currentTheme}
            gameState={gameState}
            onPointerMoveAngle={handlePointerMoveAngle}
            onCanvasClick={handleCanvasClick}
          />

          {/* Title Screen Overlay */}
          {gameState === 'TITLE_MENU' && (
            <div className="absolute inset-0 max-w-[540px] mx-auto rounded-xl bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-4 border border-slate-800">
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  3D 巨蟒爭霸
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  3D 立體全景視角 · 360° 滑鼠游標導引 · 智慧群蛇包圍 · 絲滑 60 FPS
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={startNewGame}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/40 transition-all active:scale-95 text-sm"
                >
                  開始遊戲
                </button>
                <button
                  type="button"
                  onClick={() => setIsHowToPlayOpen(true)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors text-xs"
                >
                  玩法說明
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-2">
                <span>碰到自己身體不算輸</span>
                <span aria-hidden="true">·</span>
                <span>撞到對手身體即出局</span>
                <span aria-hidden="true">·</span>
                <span>長度與粗度自然成長</span>
              </div>
            </div>
          )}
        </div>

        {/* 360-Degree Virtual Joystick for Touch / Mobile Players */}
        {prefs.touchControls && (
          <div className="w-full flex justify-center pt-0.5">
            <VirtualDPad
              onAngleChange={handlePointerMoveAngle}
              headAngle={headAngleState}
            />
          </div>
        )}
      </main>

      {/* 3. Footer */}
      <footer className="w-full py-3 border-t border-slate-800/60 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            360° 滑順巨蟒爭霸 · 智慧群蛇圍剿 · 極致效能優化
          </div>
          <div className="text-[11px] text-emerald-400/80 font-mono">
            60 FPS ULTRA PERFORMANCE
          </div>
        </div>
      </footer>

      {/* 4. Modals */}
      {gameState === 'GAME_OVER' && (
        <GameOverModal
          score={score}
          highScore={stats.highScore || 0}
          isNewRecord={gameOverInfo.isNewRecord}
          length={snakeLength}
          kills={kills}
          distance={maxDistanceExploredRef.current}
          reason={gameOverInfo.reason}
          onRestart={startNewGame}
        />
      )}

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
        onResetStats={handleResetStats}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        prefs={prefs}
        onUpdatePrefs={handleUpdatePrefs}
      />

      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </div>
  );
}

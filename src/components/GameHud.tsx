import React from 'react';
import { ActiveBuff } from '../types/game';
import { Flame, Shield, Snowflake, Compass, Swords, Trophy, Sparkles } from 'lucide-react';

interface GameHudProps {
  score: number;
  highScore: number;
  length: number;
  botsCount: number;
  kills: number;
  activeBuffs: ActiveBuff[];
  currentDistance: number;
  headCoordinate: { x: number; y: number };
}

export const GameHud: React.FC<GameHudProps> = ({
  score,
  highScore,
  length,
  botsCount,
  kills,
  activeBuffs,
  currentDistance,
  headCoordinate,
}) => {
  const xStr = headCoordinate.x >= 0 ? `+${headCoordinate.x.toFixed(0)}` : `${headCoordinate.x.toFixed(0)}`;
  const yStr = headCoordinate.y >= 0 ? `+${headCoordinate.y.toFixed(0)}` : `${headCoordinate.y.toFixed(0)}`;

  return (
    <div className="w-full max-w-xl mx-auto select-none space-y-2">
      {/* Primary 4-Meter Grid (No time limit, unified standard difficulty) */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg">
        {/* Score */}
        <div className="flex flex-col items-center justify-center">
          <span className="text-[10px] sm:text-[11px] font-medium tracking-wider text-slate-400 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
            <span>目前得分</span>
          </span>
          <span className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-emerald-400">
            {score}
          </span>
        </div>

        {/* High Score */}
        <div className="flex flex-col items-center justify-center border-l border-slate-800/80">
          <span className="text-[10px] sm:text-[11px] font-medium tracking-wider text-slate-400 flex items-center gap-1">
            <Trophy className="w-2.5 h-2.5 text-amber-400" />
            <span>歷史最高</span>
          </span>
          <span className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-amber-400">
            {highScore}
          </span>
        </div>

        {/* Snake Length */}
        <div className="flex flex-col items-center justify-center border-l border-slate-800/80">
          <span className="text-[10px] sm:text-[11px] font-medium tracking-wider text-slate-400">
            蛇身長度
          </span>
          <span className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-cyan-400">
            {length}
          </span>
        </div>

        {/* Kills & Opponents */}
        <div className="flex flex-col items-center justify-center border-l border-slate-800/80">
          <span className="text-[10px] sm:text-[11px] font-medium tracking-wider text-slate-400 flex items-center gap-1">
            <Swords className="w-2.5 h-2.5 text-rose-400" />
            <span>擊敗對手</span>
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-rose-400">
              {kills}
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              ({botsCount}在場)
            </span>
          </div>
        </div>
      </div>

      {/* Sub-bar: Exploration distance, Coordinate & Active Buffs */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 font-mono">
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          <span>探索: </span>
          <span className="font-bold text-slate-200">{currentDistance}m</span>
          <span className="text-[11px] text-slate-500">({xStr}, {yStr})</span>
        </div>

        {activeBuffs.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {activeBuffs.map((buff) => {
              const sec = (buff.remainingMs / 1000).toFixed(1);
              if (buff.type === 'SPEED') {
                return (
                  <div
                    key="SPEED"
                    className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded-md text-[11px] font-semibold text-amber-300"
                  >
                    <Flame className="w-3 h-3 animate-pulse text-amber-400" />
                    <span>魔椒雙倍 ({sec}s)</span>
                  </div>
                );
              }
              if (buff.type === 'SLOW') {
                return (
                  <div
                    key="SLOW"
                    className="flex items-center gap-1 px-2 py-0.5 bg-sky-500/20 border border-sky-500/40 rounded-md text-[11px] font-semibold text-sky-300"
                  >
                    <Snowflake className="w-3 h-3 animate-spin text-sky-400" />
                    <span>冰莓降速 ({sec}s)</span>
                  </div>
                );
              }
              if (buff.type === 'GHOST') {
                return (
                  <div
                    key="GHOST"
                    className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 border border-purple-500/40 rounded-md text-[11px] font-semibold text-purple-300"
                  >
                    <Shield className="w-3 h-3 text-purple-400" />
                    <span>幽靈穿身 ({sec}s)</span>
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
};

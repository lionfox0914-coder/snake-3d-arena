import React from 'react';
import { X, BarChart3, RotateCcw } from 'lucide-react';
import { GameStats } from '../types/game';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GameStats;
  onResetStats: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  onResetStats,
}) => {
  if (!isOpen) return null;

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    return `${mins}分${secs}秒`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">戰績紀錄</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats List */}
        <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
            <span className="text-slate-400">最高得分紀錄</span>
            <span className="font-mono font-bold text-amber-400 tabular-nums text-sm">{stats.highScore} 分</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
            <span className="text-slate-400">最長存活時長</span>
            <span className="font-mono font-bold text-sky-400 tabular-nums">{formatTime(stats.longestSurvivalSec || 0)}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
            <span className="text-slate-400">歷史最長蛇身</span>
            <span className="font-mono font-bold text-cyan-400 tabular-nums">{stats.longestSnake} 節</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
            <span className="text-slate-400">最遠探索距離</span>
            <span className="font-mono font-bold text-emerald-400 tabular-nums">{stats.maxDistance || 0} 公尺</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
            <span className="text-slate-400">擊毀電腦對手</span>
            <span className="font-mono font-bold text-purple-400 tabular-nums">{stats.botKills || 0} 隻</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
            <span className="text-slate-400">吃下蘋果總數</span>
            <span className="font-mono font-bold text-slate-200 tabular-nums">{stats.totalApples} 顆</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-400">累計遊玩局數</span>
            <span className="font-mono font-bold text-slate-200 tabular-nums">{stats.totalGames} 次</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onResetStats}
            className="px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl transition-colors border border-rose-900/30 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重置</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};

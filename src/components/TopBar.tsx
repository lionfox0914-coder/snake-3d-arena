import React from 'react';
import { Volume2, VolumeX, Play, Pause, RotateCcw } from 'lucide-react';
import { GameState } from '../types/game';

interface TopBarProps {
  gameState: GameState;
  onStartPause: () => void;
  onRestart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onOpenHowToPlay: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  gameState,
  onStartPause,
  onRestart,
  isMuted,
  onToggleMute,
  onOpenStats,
  onOpenSettings,
  onOpenHowToPlay,
}) => {
  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent whitespace-nowrap">
            貪食蛇
          </span>
          <span className="text-xs font-mono text-emerald-500/80 tracking-wider hidden sm:inline-block">
            INFINITE
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            type="button"
            onClick={onOpenHowToPlay}
            className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            遊戲說明
          </button>
          <button
            type="button"
            onClick={onOpenStats}
            className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            戰績紀錄
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            外觀設定
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? '開啟音效' : '關閉音效'}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-lg transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>

          {gameState === 'PLAYING' || gameState === 'PAUSED' ? (
            <button
              type="button"
              onClick={onRestart}
              title="重開本局"
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-lg transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={onStartPause}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-95 shadow-sm ${
              gameState === 'PLAYING'
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
            }`}
          >
            {gameState === 'PLAYING' ? (
              <>
                <Pause className="w-4 h-4" />
                <span>暫停</span>
              </>
            ) : gameState === 'PAUSED' ? (
              <>
                <Play className="w-4 h-4" />
                <span>繼續</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>開始遊戲</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

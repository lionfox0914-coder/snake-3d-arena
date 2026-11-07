import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy, Swords } from 'lucide-react';

interface GameOverModalProps {
  score: number;
  highScore: number;
  isNewRecord: boolean;
  length: number;
  kills: number;
  distance: number;
  reason: string;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  highScore,
  isNewRecord,
  length,
  kills,
  distance,
  reason,
  onRestart,
}) => {
  useEffect(() => {
    if (isNewRecord) {
      confetti({
        particleCount: 60,
        spread: 55,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#38bdf8'],
      });
    }
  }, [isNewRecord]);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-center space-y-4"
      >
        {/* Header */}
        <div>
          {isNewRecord ? (
            <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold text-sm mb-1">
              <Trophy className="w-4 h-4" />
              <span>突破歷史新高！</span>
            </div>
          ) : (
            <div className="text-xs uppercase tracking-wider text-rose-400 font-medium mb-1">
              遊戲結束
            </div>
          )}
          <h2 className="text-2xl font-black text-slate-100">
            {isNewRecord ? '太厲害了！' : '勝敗乃兵家常事'}
          </h2>
          <p className="text-xs text-rose-300/90 font-medium mt-1">{reason}</p>
        </div>

        {/* Score Board */}
        <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/80">
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-slate-400 font-medium">本次得分</span>
            <span className="text-2xl font-black font-mono tabular-nums text-emerald-400">
              {score}
            </span>
          </div>
          <div className="flex flex-col items-center border-l border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-medium">最高紀錄</span>
            <span className="text-2xl font-black font-mono tabular-nums text-amber-400">
              {highScore}
            </span>
          </div>
        </div>

        {/* Secondary Details */}
        <div className="flex items-center justify-center gap-2.5 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Swords className="w-3.5 h-3.5 text-rose-400" />
            <span>擊敗 {kills} 條對手</span>
          </span>
          <span aria-hidden="true">·</span>
          <span>探索 {distance}m</span>
          <span aria-hidden="true">·</span>
          <span>長度 {length} 節</span>
        </div>

        {/* Action Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRestart();
            }}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all active:scale-95 shadow-md shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>再來一局</span>
          </button>
        </div>
      </div>
    </div>
  );
};

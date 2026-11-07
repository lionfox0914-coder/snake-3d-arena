import React from 'react';
import { X, BookOpen, Keyboard, Navigation, Sparkles } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">貪食蛇操作與道具說明</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto space-y-3.5 text-xs text-slate-300 pr-1 flex-1">
          {/* Controls */}
          <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <Navigation className="w-4 h-4 text-emerald-400" />
              <span>3D 立體操控與視角切換</span>
            </div>
            <div className="space-y-1 text-slate-400 pt-0.5">
              <div>
                <span className="font-mono text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded mr-1.5">
                  滑鼠游標
                </span>
                在 3D 空間內移動滑鼠，蛇頭將以 360 度全方位滑順游向指引方向
              </div>
              <div>
                <span className="font-mono text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded mr-1.5">
                  右上角視角
                </span>
                可即時切換【3D立體】、【戰術俯瞰】與【追尾衝刺】三種鏡頭
              </div>
              <div>
                <span className="font-mono text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded mr-1.5">
                  Shift / 鍵盤
                </span>
                按住 Shift 加速衝刺；A / D 或方向鍵微調轉彎
              </div>
              <div>
                <span className="font-mono text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded mr-1.5">
                  Space
                </span>
                暫停 / 繼續遊戲；<span className="font-mono text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded mx-1">R</span>快速重來
              </div>
            </div>
          </div>

          {/* Infinite Map & Unified Difficulty */}
          <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-emerald-500/30">
            <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <span>🌌</span>
              <span>統一難度・長度粗度自然平衡成長</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              地圖無邊界限制，速度平穩好操控。每吃下一顆果實，蛇身的<strong className="text-emerald-400">「長度與粗度」</strong>會適度扎實增長，兼顧龐然氣勢與穿梭靈活性！
            </p>
          </div>

          {/* AI Bots & Collision Rules */}
          <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-purple-500/30">
            <div className="font-semibold text-purple-400 flex items-center gap-1.5">
              <span>🤖</span>
              <span>智慧對手・碰到自己不算輸</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              <strong className="text-emerald-300">【安全安全】</strong> <strong className="text-sky-300">碰到自己的身體不算輸！</strong> 您可以隨意盤旋或穿越自己的蛇身。<br />
              <strong className="text-rose-400">【致命死因】</strong> 唯有蛇頭撞上<strong className="text-rose-300">電腦對手的蛇身</strong>時才會遊戲結束！<br />
              <strong className="text-amber-400">【包圍戰術】</strong> 電腦對手變得更加聰明，懂得預判走位、甚至盤旋包圍您；誘導它們的頭部撞擊您的蛇身，就能引爆它們獲取大量果實！
            </p>
          </div>

          {/* Map Items */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>地圖道具效果</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-slate-950/50 rounded-lg border border-slate-800/60">
                <div className="font-semibold text-rose-400 flex items-center gap-1">
                  <span>🍎</span> 紅蘋果 (+10分)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">延長蛇身 1 節。</div>
              </div>
              <div className="p-2.5 bg-slate-950/50 rounded-lg border border-slate-800/60">
                <div className="font-semibold text-amber-300 flex items-center gap-1">
                  <span>⭐</span> 金蘋果 (+30分)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">限時搶食，高額積分。</div>
              </div>
              <div className="p-2.5 bg-slate-950/50 rounded-lg border border-slate-800/60">
                <div className="font-semibold text-sky-400 flex items-center gap-1">
                  <span>🫐</span> 冰晶莓 (+15分)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">緩速 6 秒，長蛇易轉彎。</div>
              </div>
              <div className="p-2.5 bg-slate-950/50 rounded-lg border border-slate-800/60">
                <div className="font-semibold text-orange-400 flex items-center gap-1">
                  <span>🌶️</span> 加速魔椒 (+25分)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">加速 5 秒且得分加倍！</div>
              </div>
              <div className="p-2.5 bg-slate-950/50 rounded-lg border border-slate-800/60">
                <div className="font-semibold text-purple-400 flex items-center gap-1">
                  <span>🛡️</span> 幽靈護盾 (+20分)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">5 秒內可穿透自身身軀。</div>
              </div>
              <div className="p-2.5 bg-slate-950/50 rounded-lg border border-slate-800/60">
                <div className="font-semibold text-emerald-400 flex items-center gap-1">
                  <span>🍄</span> 縮小靈菇 (+20分)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">縮短蛇身長度 3 節！</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 pt-1">
            <Navigation className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>手機觸控：可滑動螢幕或使用下方的方向鍵。</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors text-xs shadow-md shadow-emerald-900/30"
          >
            知道了，開始遊戲
          </button>
        </div>
      </div>
    </div>
  );
};

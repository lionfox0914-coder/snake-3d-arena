import React from 'react';
import { X, Palette, Volume2, VolumeX, Smartphone } from 'lucide-react';
import { ThemeId } from '../types/game';
import { THEMES, UserPrefs } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefs: UserPrefs;
  onUpdatePrefs: (updated: Partial<UserPrefs>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  prefs,
  onUpdatePrefs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-teal-400" />
            <h2 className="text-base font-bold text-slate-100">外觀與設定</h2>
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
        <div className="space-y-4 text-xs">
          {/* Theme Palette */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400">主題配色</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(THEMES) as ThemeId[]).map((tId) => {
                const t = THEMES[tId];
                const isSelected = prefs.theme === tId;
                return (
                  <button
                    key={tId}
                    type="button"
                    onClick={() => onUpdatePrefs({ theme: tId })}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1.5 transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-slate-800/90 shadow-sm ring-1 ring-emerald-500/50'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{t.name}</span>
                      {isSelected && <span className="text-[10px] text-emerald-400 font-mono">選中</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20"
                        style={{ backgroundColor: t.snakeHead }}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20"
                        style={{ backgroundColor: t.snakeBodyStart }}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20"
                        style={{ backgroundColor: t.appleColor }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-2">
                {prefs.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
                <span className="text-slate-200 font-medium">遊戲音效</span>
              </div>
              <button
                type="button"
                onClick={() => onUpdatePrefs({ soundEnabled: !prefs.soundEnabled })}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  prefs.soundEnabled ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                    prefs.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-200 font-medium">螢幕虛擬方向鍵</span>
              </div>
              <button
                type="button"
                onClick={() => onUpdatePrefs({ touchControls: !prefs.touchControls })}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  prefs.touchControls ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                    prefs.touchControls ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};

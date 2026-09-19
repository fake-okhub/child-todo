import React from 'react';
import { Volume2, VolumeX, Shield, Calendar as CalendarIcon, CheckSquare } from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { MarioCap, MarioCoin } from './MarioAssets';
import { isAndroidApp } from '../utils/androidBridge';

interface KidHeaderProps {
  childName: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenParentGate: () => void;
  currentView: 'tasks' | 'calendar';
  onToggleView: (view: 'tasks' | 'calendar') => void;
  totalBalance: number;
}

export const KidHeader: React.FC<KidHeaderProps> = ({
  childName,
  soundEnabled,
  onToggleSound,
  onOpenParentGate,
  currentView,
  onToggleView,
  totalBalance,
}) => {
  const now = new Date();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const dateStr = `${now.getMonth() + 1}月${now.getDate()}日 星期${weekDays[now.getDay()]}`;

  return (
    <header className="w-full max-w-4xl mx-auto px-3 sm:px-4 pt-4 pb-2 flex flex-wrap items-center justify-between gap-3">
      {/* Profile & Mario Theme Logo */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-red-500 border-3 border-red-700 shadow-md flex items-center justify-center cursor-pointer transform hover:scale-105 active:scale-95 transition-all p-1"
          title="超级马里奥能量站"
          onClick={() => soundEngine.playCoin()}
        >
          <MarioCap className="w-8 h-8 sm:w-9 sm:h-9" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              {childName} 的 Todo 乐园
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black border border-amber-300">
              <MarioCoin className="w-3.5 h-3.5" />
              <span>{totalBalance}分</span>
            </span>
            {isAndroidApp() ? (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black border border-indigo-300">
                🤖 APP
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                🌐 Web
              </span>
            )}
          </div>

          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
            <span>📅 {dateStr}</span>
            <span>•</span>
            <span className="text-emerald-700 font-bold">无上限充能中 ⚡</span>
          </div>
        </div>
      </div>

      {/* Header Actions for Tablet */}
      <div className="flex items-center gap-2">
        {/* Toggle between Checklist and Calendar */}
        <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center shadow-inner">
          <button
            onClick={() => {
              soundEngine.playPop();
              onToggleView('tasks');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all ${
              currentView === 'tasks'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            <span>今日清单</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playPop();
              onToggleView('calendar');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all ${
              currentView === 'calendar'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarIcon className="w-4 h-4 text-amber-600" />
            <span>日程日历</span>
          </button>
        </div>

        {/* Parent Management Gate Button */}
        <button
          onClick={() => {
            soundEngine.playPop();
            onOpenParentGate();
          }}
          className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-md transition-all active:scale-95"
        >
          <Shield className="w-4 h-4 text-amber-400" />
          <span>家长管理</span>
        </button>

        {/* Sound Switch */}
        <button
          onClick={onToggleSound}
          className={`p-2 rounded-2xl border transition-all shadow-sm ${
            soundEnabled
              ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              : 'bg-slate-100 text-slate-400 border-slate-200'
          }`}
          title={soundEnabled ? '音效开启' : '音效静音'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};

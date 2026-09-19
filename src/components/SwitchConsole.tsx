import React from 'react';
import { Gamepad2, Zap } from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { MarioCoin, MarioStar, SuperMushroom } from './MarioAssets';

interface SwitchConsoleProps {
  balanceMinutes: number;
  todayEarnedMinutes: number;
  dailyMaxMinutes: number;
  completedTasksCount: number;
  totalTasksCount: number;
  onOpenPlayModal: () => void;
}

export const SwitchConsole: React.FC<SwitchConsoleProps> = ({
  balanceMinutes,
  todayEarnedMinutes,
  dailyMaxMinutes,
  completedTasksCount,
  totalTasksCount,
  onOpenPlayModal,
}) => {
  // Battery percentage for today's goal
  const batteryPct = Math.min(100, Math.round((todayEarnedMinutes / (dailyMaxMinutes || 30)) * 100));

  const handleJoyConClick = () => {
    soundEngine.playSwitchSnap();
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-3 select-none px-2 sm:px-4">
      {/* Outer Shell Container */}
      <div className="relative flex items-stretch shadow-2xl rounded-3xl overflow-hidden border-4 border-slate-800 bg-slate-900 transition-all">
        
        {/* Left Joy-Con (Neon Blue) */}
        <div
          onClick={handleJoyConClick}
          title="点击咔嗒！左手柄"
          className="cursor-pointer relative w-16 sm:w-24 bg-gradient-to-b from-[#00C3E3] to-[#0099C4] flex flex-col justify-between items-center py-5 px-1 rounded-l-2xl border-r-4 border-slate-900 shadow-inner group transition-transform active:scale-95"
        >
          {/* Minus Button */}
          <div className="w-5 h-1.5 bg-slate-900/80 rounded-sm shadow-sm group-hover:bg-slate-950"></div>

          {/* Left Analog Stick */}
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-800 border-2 border-slate-700 shadow-lg flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-slate-700/80 border border-slate-600"></div>
          </div>

          {/* Direction Buttons (D-Pad) */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-slate-800 rounded-full border border-slate-700 shadow flex items-center justify-center text-[10px] text-white">▲</div>
            <div className="flex gap-2">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-slate-800 rounded-full border border-slate-700 shadow flex items-center justify-center text-[10px] text-white">◀</div>
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-slate-800 rounded-full border border-slate-700 shadow flex items-center justify-center text-[10px] text-white">▶</div>
            </div>
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-slate-800 rounded-full border border-slate-700 shadow flex items-center justify-center text-[10px] text-white">▼</div>
          </div>

          {/* Joy-Con 4 Player LEDs */}
          <div className="flex flex-col gap-1.5">
            {[0, 1, 2, 3].map((i) => {
              const isActive = completedTasksCount > i;
              return (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-500 ${
                    isActive
                      ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                      : 'bg-slate-800/60 border border-slate-700'
                  }`}
                />
              );
            })}
          </div>

          {/* Capture Square Button */}
          <div className="w-4 h-4 bg-slate-900 rounded-sm border border-slate-700 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-slate-700"></div>
          </div>
        </div>

        {/* Center Console Screen */}
        <div className="flex-1 bg-slate-950 p-4 sm:p-6 flex flex-col justify-between relative overflow-hidden">
          {/* Screen Glare Highlight */}
          <div className="absolute -top-12 -left-12 w-60 h-28 bg-white/5 rotate-12 blur-md pointer-events-none"></div>

          {/* Top Status Bar on Switch Screen */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 text-xs text-slate-300 font-mono">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/30 text-red-400 border border-red-500/30 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                NINTENDO SWITCH
              </span>
              <span className="hidden sm:inline text-slate-500">|</span>
              <span className="hidden sm:inline text-slate-400 font-sans">
                今日通关: {completedTasksCount}/{totalTasksCount} 项
              </span>
            </div>

            {/* Battery / Energy meter */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-bounce" />
                充能: {todayEarnedMinutes}/{dailyMaxMinutes}分
              </span>
              <div className="w-16 sm:w-24 h-4 bg-slate-800 rounded border border-slate-600 p-0.5 flex items-center">
                <div
                  className="h-full rounded-sm bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500 shadow-sm"
                  style={{ width: `${batteryPct}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Center Vault Display */}
          <div className="my-3 sm:my-4 flex flex-col sm:flex-row items-center justify-around gap-4 text-center sm:text-left">
            <div className="flex items-center gap-4">
              {/* Mario Star Avatar */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-1 shadow-lg shadow-amber-500/20 flex items-center justify-center animate-pulse">
                <div className="w-full h-full bg-slate-900 rounded-xl flex flex-col items-center justify-center p-2">
                  <MarioStar className="w-8 h-8" />
                  <span className="text-[9px] font-bold text-amber-300 tracking-wider">VAULT</span>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400 flex items-center gap-1 font-sans">
                  <span>周末 Switch 游戏总金库</span>
                  <MarioCoin className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-300 tracking-tight">
                    {balanceMinutes}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-slate-300 font-sans">分钟</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                  <span>
                    今日已充能 <strong className="text-amber-400">+{todayEarnedMinutes}</strong> 分钟 • 每周不设上限！
                  </span>
                </p>
              </div>
            </div>

            {/* Play Switch Action Button */}
            <button
              onClick={() => {
                soundEngine.playSwitchSnap();
                onOpenPlayModal();
              }}
              className="group relative inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white font-black text-base shadow-xl shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-red-400/40"
            >
              <Gamepad2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span>开启周末畅玩</span>
              <span className="text-xs bg-black/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                {balanceMinutes > 0 ? `${balanceMinutes}m` : '0m'}
              </span>
            </button>
          </div>

          {/* Bottom Bar with Mario Mushroom Asset */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <SuperMushroom className="w-4 h-4" />
              <span>平板专享大按键打卡，完成任务即可充能</span>
            </span>
            <span className="hidden sm:inline text-slate-400">
              🎮 努力通关，周末尽情享受 Switch！
            </span>
          </div>
        </div>

        {/* Right Joy-Con (Neon Red) */}
        <div
          onClick={handleJoyConClick}
          title="点击咔嗒！右手柄"
          className="cursor-pointer relative w-16 sm:w-24 bg-gradient-to-b from-[#FF3C28] to-[#D92512] flex flex-col justify-between items-center py-5 px-1 rounded-r-2xl border-l-4 border-slate-900 shadow-inner group transition-transform active:scale-95"
        >
          {/* Plus Button */}
          <div className="w-4 h-4 relative flex items-center justify-center group-hover:scale-110 transition-transform">
            <div className="w-4 h-1 bg-slate-900/80 rounded-sm"></div>
            <div className="h-4 w-1 bg-slate-900/80 rounded-sm absolute"></div>
          </div>

          {/* ABXY Action Buttons */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-slate-800 rounded-full border border-slate-700 shadow flex items-center justify-center text-[10px] text-white font-bold">X</div>
            <div className="flex gap-2">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-slate-800 rounded-full border border-slate-700 shadow flex items-center justify-center text-[10px] text-white font-bold">Y</div>
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-slate-800 rounded-full border border-slate-700 shadow flex items-center justify-center text-[10px] text-white font-bold">A</div>
            </div>
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-slate-800 rounded-full border border-slate-700 shadow flex items-center justify-center text-[10px] text-white font-bold">B</div>
          </div>

          {/* Right Analog Stick */}
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-800 border-2 border-slate-700 shadow-lg flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-slate-700/80 border border-slate-600"></div>
          </div>

          {/* Joy-Con 4 Player LEDs */}
          <div className="flex flex-col gap-1.5">
            {[0, 1, 2, 3].map((i) => {
              const isActive = completedTasksCount > i;
              return (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-500 ${
                    isActive
                      ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                      : 'bg-slate-800/60 border border-slate-700'
                  }`}
                />
              );
            })}
          </div>

          {/* Home Button */}
          <div className="w-4 h-4 bg-slate-900 rounded-full border border-slate-700 flex items-center justify-center">
            <div className="w-2 h-2 border border-slate-400 rounded-full"></div>
          </div>
        </div>

      </div>
    </div>
  );
};

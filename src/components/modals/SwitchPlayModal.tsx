import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Gamepad2, Sparkles, AlertCircle, ShieldCheck, Zap, Clock } from 'lucide-react';
import { soundEngine } from '../../utils/audio';
import { startNativeGamingAlarm, cancelNativeGamingAlarm } from '../../utils/androidBridge';

interface SwitchPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  balanceMinutes: number;
  onDeductMinutes: (minutes: number) => void;
}

const HOLD_DURATION_MS = 3000; // 3 seconds hold threshold to start

export const SwitchPlayModal: React.FC<SwitchPlayModalProps> = ({
  isOpen,
  onClose,
  balanceMinutes,
  onDeductMinutes,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isTimeUp, setIsTimeUp] = useState<boolean>(false);

  // 3-second hold to launch state
  const [pressProgress, setPressProgress] = useState<number>(0);
  const [isPressing, setIsPressing] = useState<boolean>(false);
  const [showTapTip, setShowTapTip] = useState<boolean>(false);

  const pressTimerRef = useRef<any>(null);
  const pressStartTimeRef = useRef<number | null>(null);
  const tipTimeoutRef = useRef<any>(null);

  // Time tracking refs to accurately deduct on the fly without losing time
  const consumedSecondsRef = useRef<number>(0);
  const deductedMinutesRef = useRef<number>(0);

  // Reset states when modal is freshly opened in non-playing state
  useEffect(() => {
    if (isOpen && !isPlaying && !isTimeUp) {
      setRemainingSeconds(balanceMinutes * 60);
      setPressProgress(0);
      setIsPressing(false);
      setIsPaused(false);
      consumedSecondsRef.current = 0;
      deductedMinutesRef.current = 0;
    }
  }, [isOpen, balanceMinutes]);

  // Active playing countdown interval
  useEffect(() => {
    let interval: any = null;

    if (isPlaying && !isPaused && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsPlaying(false);
            setIsPaused(false);
            setIsTimeUp(true);
            cancelNativeGamingAlarm();
            soundEngine.playTimerEnd();

            // Deduct any remaining whole minutes if needed
            const totalConsumed = consumedSecondsRef.current + 1;
            const targetMins = Math.ceil(totalConsumed / 60);
            const remainingToDeduct = targetMins - deductedMinutesRef.current;
            if (remainingToDeduct > 0) {
              onDeductMinutes(remainingToDeduct);
              deductedMinutesRef.current += remainingToDeduct;
            }
            return 0;
          }

          consumedSecondsRef.current += 1;
          const currentConsumedMins = Math.floor(consumedSecondsRef.current / 60);
          if (currentConsumedMins > deductedMinutesRef.current) {
            const delta = currentConsumedMins - deductedMinutesRef.current;
            deductedMinutesRef.current = currentConsumedMins;
            onDeductMinutes(delta);
          }

          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, isPaused, remainingSeconds, onDeductMinutes]);

  if (!isOpen) return null;

  // Clean up press animation loop
  const stopPressTracking = () => {
    if (pressTimerRef.current) {
      cancelAnimationFrame(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    pressStartTimeRef.current = null;
    setIsPressing(false);
  };

  const handlePressStart = () => {
    if (balanceMinutes <= 0 || isPlaying) return;
    stopPressTracking();
    setIsPressing(true);
    pressStartTimeRef.current = Date.now();

    const updateLoop = () => {
      if (!pressStartTimeRef.current) return;
      const elapsed = Date.now() - pressStartTimeRef.current;
      const progress = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
      setPressProgress(progress);

      if (progress >= 100) {
        stopPressTracking();
        triggerStartPlay();
      } else {
        pressTimerRef.current = requestAnimationFrame(updateLoop);
      }
    };

    pressTimerRef.current = requestAnimationFrame(updateLoop);
  };

  const handlePressEnd = () => {
    if (!isPressing && pressProgress === 0) return;
    const currentProgress = pressProgress;
    stopPressTracking();
    setPressProgress(0);

    // If user tapped without holding full 3 seconds, show educational tip
    if (currentProgress < 100) {
      soundEngine.playPop();
      setShowTapTip(true);
      if (tipTimeoutRef.current) clearTimeout(tipTimeoutRef.current);
      tipTimeoutRef.current = setTimeout(() => {
        setShowTapTip(false);
      }, 3500);
    }
  };

  const triggerStartPlay = () => {
    if (balanceMinutes <= 0) return;
    soundEngine.playSwitchSnap();
    const initialSeconds = balanceMinutes * 60;
    setRemainingSeconds(initialSeconds);
    consumedSecondsRef.current = 0;
    deductedMinutesRef.current = 0;
    setIsPlaying(true);
    setIsPaused(false);
    setIsTimeUp(false);
    setShowTapTip(false);

    // Register system native alarm with system alarm tone
    startNativeGamingAlarm(initialSeconds, '🎮 Switch 游戏时间到啦！');
  };

  const handlePause = () => {
    soundEngine.playPop();
    setIsPaused(true);
    // Cancel native alarm while paused to prevent firing during break
    cancelNativeGamingAlarm();
  };

  const handleResume = () => {
    soundEngine.playSwitchSnap();
    setIsPaused(false);
    // Re-schedule native alarm with exact remaining seconds
    startNativeGamingAlarm(remainingSeconds, '🎮 Switch 游戏时间到啦！');
  };

  const handleStopAndSave = () => {
    soundEngine.playPop();
    cancelNativeGamingAlarm();
    setIsPlaying(false);
    setIsPaused(false);
    setIsTimeUp(false);
    onClose();
  };

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const remainingSecondsHolding = Math.max(0, ((100 - pressProgress) / 100) * (HOLD_DURATION_MS / 1000)).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-4 border-red-500 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-white relative animate-in fade-in zoom-in-95 duration-200 select-none">
        <button
          onClick={handleStopAndSave}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold mb-1">
            <Gamepad2 className="w-4 h-4" />
            <span>NINTENDO SWITCH 周末畅玩时间</span>
          </div>
          <h3 className="text-2xl font-black tracking-tight">
            Switch 专属倒计时
          </h3>
        </div>

        {/* 1. NON-PLAYING READY MODE (探索与准备开机) */}
        {!isPlaying && !isTimeUp ? (
          <div>
            <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 my-4 text-center">
              <span className="text-xs text-slate-400 font-bold">当前本周累计总游戏时间</span>
              <div className="text-5xl font-black text-amber-400 my-1">
                {balanceMinutes} <span className="text-base font-normal text-slate-300">分钟</span>
              </div>
              <p className="text-xs text-slate-400">
                这是你平时按时打卡、运动与全科好习惯攒下的全部奖励！
              </p>
            </div>

            {balanceMinutes <= 0 ? (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-center my-4">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-amber-300">当前没有可游玩的时间哦！</p>
                <p className="text-xs text-slate-400 mt-1">
                  快去完成识字、口算、配音或绘本任务，为 Switch 充满电吧！
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>本次游玩模式：</span>
                  </div>
                  <span className="font-bold text-cyan-300">
                    全额兑换全部时间 ({balanceMinutes} 分钟)
                  </span>
                </div>

                {/* High Friction: Hold 3 seconds to launch */}
                <div className="relative pt-1">
                  <button
                    type="button"
                    onMouseDown={handlePressStart}
                    onMouseUp={handlePressEnd}
                    onMouseLeave={handlePressEnd}
                    onTouchStart={handlePressStart}
                    onTouchEnd={handlePressEnd}
                    className="relative w-full py-5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 text-white font-black text-lg overflow-hidden shadow-xl shadow-red-500/30 active:scale-98 transition-transform border-2 border-red-400/40"
                  >
                    {/* Filling progress bar under text */}
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-400 to-emerald-400 transition-all duration-75 opacity-90"
                      style={{ width: `${pressProgress}%` }}
                    />

                    {/* Button label & animation */}
                    <div className="relative z-10 flex items-center justify-center gap-2.5">
                      {isPressing ? (
                        <>
                          <Zap className="w-6 h-6 text-slate-950 animate-bounce" />
                          <span className="text-slate-950 font-black">
                            正在充能开机... 还需 {remainingSecondsHolding} 秒
                          </span>
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 fill-white" />
                          <span>按住 3 秒，为 Switch 充能开机</span>
                        </>
                      )}
                    </div>
                  </button>

                  {/* Safety reassurance badge */}
                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 mt-2.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>防误触保护：孩子可随意点击查看，只有长按满 3 秒才会扣除计时</span>
                  </div>
                </div>

                {/* Friendly Pop Tip when accidentally clicked */}
                {showTapTip && (
                  <div className="bg-amber-500/15 border border-amber-500/40 rounded-2xl p-3.5 text-xs text-amber-300 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <Zap className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>
                      <strong>不用担心！</strong> 随便轻点不会扣除任何时间。真正开机请<strong>按住按钮不放满 3 秒</strong>充能。
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : isPlaying || isPaused ? (
          /* 2. ACTIVE PLAYING OR PAUSED MODE */
          <div className="text-center py-4">
            <div className={`relative w-56 h-56 mx-auto rounded-full border-8 bg-slate-950 flex flex-col items-center justify-center transition-all duration-300 ${
              isPaused
                ? 'border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
                : 'border-red-500/50 shadow-[0_0_35px_rgba(239,68,68,0.35)]'
            }`}>
              <span className={`text-5xl font-black font-mono tracking-wider ${
                isPaused ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {formattedTime}
              </span>

              <span className="text-xs mt-2.5 flex items-center gap-1.5 font-bold">
                {isPaused ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <Pause className="w-3 h-3 fill-amber-400" />
                    已暂停计时
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    畅玩中 (系统闹铃同步)
                  </span>
                )}
              </span>
            </div>

            <p className="text-xs text-slate-400 my-3 leading-relaxed">
              💡 保持眼睛距离屏幕 40 厘米以上。中途暂停或退出，<strong>未使用的剩余时间均安全保留在金库中</strong>！
            </p>

            <div className="flex justify-center gap-3 mt-4">
              {isPaused ? (
                <button
                  type="button"
                  onClick={handleResume}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>继续游玩 (对齐闹铃)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePause}
                  className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-black flex items-center gap-2 border border-slate-700 transition-all active:scale-95"
                >
                  <Pause className="w-4 h-4" />
                  <span>暂停计时 (暂停闹铃)</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleStopAndSave}
                className="px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>保存并退出</span>
              </button>
            </div>
          </div>
        ) : (
          /* 3. TIME UP SCREEN (倒计时自然结束) */
          <div className="text-center py-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center shadow-lg mb-3 animate-bounce">
              <Sparkles className="w-10 h-10" />
            </div>
            <h4 className="text-2xl font-black text-white">
              时间到啦！下周继续！
            </h4>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              本次 Switch 游戏时间已结束。<br />
              闭上眼睛做做眼保健操，看看远处绿植休息一下吧！
            </p>

            <button
              onClick={handleStopAndSave}
              className="mt-6 w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm shadow-lg hover:scale-[1.02] active:scale-98 transition-all"
            >
              我知道了，保护好眼睛！
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

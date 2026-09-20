import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Gamepad2, AlertCircle, ShieldCheck, Zap, Clock, CheckCircle2 } from 'lucide-react';
import { soundEngine } from '../../utils/audio';
import { startNativeSystemTimer } from '../../utils/androidBridge';

interface SwitchPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  balanceMinutes: number;
  onDeductMinutes: (minutes: number) => void;
}

const HOLD_DURATION_MS = 3000; // 3 seconds threshold to start

export const SwitchPlayModal: React.FC<SwitchPlayModalProps> = ({
  isOpen,
  onClose,
  balanceMinutes,
  onDeductMinutes,
}) => {
  // 3-second hold to launch state
  const [pressProgress, setPressProgress] = useState<number>(0);
  const [isPressing, setIsPressing] = useState<boolean>(false);
  const [showTapTip, setShowTapTip] = useState<boolean>(false);
  const [isLaunched, setIsLaunched] = useState<boolean>(false);
  const [launchedMinutes, setLaunchedMinutes] = useState<number>(0);

  const pressTimerRef = useRef<number | null>(null);
  const pressStartTimeRef = useRef<number | null>(null);
  const tipTimeoutRef = useRef<any>(null);
  const isHoldingRef = useRef<boolean>(false);

  // Reset states when modal is freshly opened
  useEffect(() => {
    if (isOpen) {
      setPressProgress(0);
      setIsPressing(false);
      setShowTapTip(false);
      setIsLaunched(false);
      setLaunchedMinutes(0);
      isHoldingRef.current = false;
    } else {
      stopPressTracking();
    }
  }, [isOpen]);

  // Clean up press animation loop
  const stopPressTracking = () => {
    isHoldingRef.current = false;
    if (pressTimerRef.current !== null) {
      cancelAnimationFrame(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    pressStartTimeRef.current = null;
    setIsPressing(false);
  };

  const handlePressStart = () => {
    // Prevent default context menu or gestures
    if (balanceMinutes <= 0 || isLaunched) return;

    stopPressTracking();
    isHoldingRef.current = true;
    setIsPressing(true);
    setShowTapTip(false);
    pressStartTimeRef.current = performance.now();

    const updateLoop = () => {
      if (!isHoldingRef.current || !pressStartTimeRef.current) return;
      const elapsed = performance.now() - pressStartTimeRef.current;
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
    if (!isHoldingRef.current && pressProgress === 0) return;
    const currentProgress = pressProgress;
    stopPressTracking();
    setPressProgress(0);

    // If child tapped or released without holding full 3 seconds, show educational tip
    if (currentProgress < 100 && !isLaunched) {
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
    const minutesToLaunch = balanceMinutes;
    setLaunchedMinutes(minutesToLaunch);
    setIsLaunched(true);
    soundEngine.playSwitchSnap();

    // 1. Deduct all accumulated balance minutes immediately to prevent re-opening
    onDeductMinutes(minutesToLaunch);

    // 2. Launch Android native system clock timer (AlarmClock.ACTION_SET_TIMER)
    startNativeSystemTimer(minutesToLaunch * 60, '🎮 Switch 游戏时间');

    // 3. Smooth transition then close modal
    setTimeout(() => {
      onClose();
      setIsLaunched(false);
    }, 1300);
  };

  if (!isOpen) return null;

  const remainingSecondsHolding = Math.max(0, ((100 - pressProgress) / 100) * (HOLD_DURATION_MS / 1000)).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-4 border-red-500 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-white relative animate-in fade-in zoom-in-95 duration-200 select-none">
        {/* Close Button */}
        {!isLaunched && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

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

        {/* 1. LAUNCH SUCCESS STATE */}
        {isLaunched ? (
          <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg mb-3 border border-emerald-500/40 animate-pulse">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-2xl font-black text-white">
              充能成功，开机游玩！
            </h4>
            <p className="text-sm font-bold text-amber-400 mt-2">
              已全额兑换 {launchedMinutes} 分钟游戏时间
            </p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              正在自动唤起平板系统自带时钟倒计时...<br />
              锁屏休眠均能准时以系统最高优先级响铃提醒！
            </p>
          </div>
        ) : balanceMinutes <= 0 ? (
          /* 2. NO AVAILABLE TIME STATE */
          <div className="py-2">
            <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 my-4 text-center">
              <span className="text-xs text-slate-400 font-bold">当前本周累计总游戏时间</span>
              <div className="text-5xl font-black text-slate-500 my-1">
                0 <span className="text-base font-normal text-slate-400">分钟</span>
              </div>
              <p className="text-xs text-slate-400">
                本周奖励已全部兑换完毕或尚未开始积累
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-center my-4">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-amber-300">当前没有可游玩的时间哦！</p>
              <p className="text-xs text-slate-400 mt-1">
                快去完成识字、口算、配音或绘本任务，为 Switch 充满电吧！
              </p>
            </div>

            <button
              onClick={onClose}
              className="mt-2 w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors"
            >
              我知道了，去完成打卡！
            </button>
          </div>
        ) : (
          /* 3. READY TO LAUNCH (HIGH-FRICTION 3-SECOND HOLD BUTTON) */
          <div className="space-y-4">
            <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 my-2 text-center">
              <span className="text-xs text-slate-400 font-bold">当前本周累计总游戏时间</span>
              <div className="text-5xl font-black text-amber-400 my-1">
                {balanceMinutes} <span className="text-base font-normal text-slate-300">分钟</span>
              </div>
              <p className="text-xs text-slate-400">
                这是你平时按时打卡、运动与全科好习惯攒下的全部奖励！
              </p>
            </div>

            <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>本次游玩模式：</span>
              </div>
              <span className="font-bold text-cyan-300">
                全额兑换全部时间 ({balanceMinutes} 分钟)
              </span>
            </div>

            {/* High Friction: Hold 3 seconds to launch - Fixed Height, Anti-Jitter */}
            <div className="relative pt-1">
              <button
                type="button"
                onMouseDown={handlePressStart}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onTouchStart={handlePressStart}
                onTouchEnd={handlePressEnd}
                onTouchCancel={handlePressEnd}
                onContextMenu={(e) => e.preventDefault()}
                style={{
                  touchAction: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                  WebkitTouchCallout: 'none',
                }}
                className="relative w-full h-16 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 text-white font-black overflow-hidden shadow-xl shadow-red-500/30 border-2 border-red-400/40 flex items-center justify-center cursor-pointer select-none"
              >
                {/* Filling progress bar under text */}
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 via-amber-400 to-emerald-400 opacity-95 transition-all duration-75 pointer-events-none"
                  style={{ width: `${pressProgress}%` }}
                />

                {/* Button label: Rock-solid single line with tabular numbers */}
                <div className="relative z-10 flex items-center justify-center gap-2.5 px-4 pointer-events-none whitespace-nowrap">
                  {isPressing ? (
                    <>
                      <Zap className="w-5 h-5 text-slate-950 fill-slate-950 shrink-0" />
                      <span className="text-slate-950 font-black text-base sm:text-lg">
                        正在充能开机... 还需{' '}
                        <span className="font-mono tabular-nums inline-block w-8 text-center font-black">
                          {remainingSecondsHolding}
                        </span>{' '}
                        秒
                      </span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-white shrink-0" />
                      <span className="font-black text-base sm:text-lg">按住 3 秒，为 Switch 充能开机</span>
                    </>
                  )}
                </div>
              </button>

              {/* Safety reassurance badge */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 mt-2.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>防误触保护：轻点探索不会扣除，只有按满 3 秒才启动系统时钟</span>
              </div>
            </div>

            {/* Reserved fixed slot for Friendly Pop Tip to eliminate any layout shift */}
            <div className="min-h-[52px] flex items-center justify-center">
              {showTapTip ? (
                <div className="w-full bg-amber-500/15 border border-amber-500/40 rounded-2xl p-3 text-xs text-amber-300 flex items-center gap-2.5 animate-in fade-in duration-150">
                  <Zap className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>
                    <strong>不用担心！</strong> 随便轻点不会扣除任何时间。真正开机请<strong>按住按钮不放满 3 秒</strong>充能。
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                  💡 充能后将自动跳转至平板自带时钟应用，享受专注沉浸的游戏时光。
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

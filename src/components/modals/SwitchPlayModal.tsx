import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Gamepad2, Sparkles, AlertCircle } from 'lucide-react';
import { soundEngine } from '../../utils/audio';

interface SwitchPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  balanceMinutes: number;
  onDeductMinutes: (minutes: number) => void;
}

export const SwitchPlayModal: React.FC<SwitchPlayModalProps> = ({
  isOpen,
  onClose,
  balanceMinutes,
  onDeductMinutes,
}) => {
  const [selectedMins, setSelectedMins] = useState<number>(Math.min(balanceMinutes, 15));
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isTimeUp, setIsTimeUp] = useState<boolean>(false);

  useEffect(() => {
    if (balanceMinutes > 0 && selectedMins === 0) {
      setSelectedMins(Math.min(balanceMinutes, 15));
    }
  }, [balanceMinutes]);

  useEffect(() => {
    let interval: any;
    if (isPlaying && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsPlaying(false);
            setIsTimeUp(true);
            soundEngine.playTimerEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, remainingSeconds]);

  if (!isOpen) return null;

  const handleStartPlay = () => {
    if (selectedMins <= 0 || selectedMins > balanceMinutes) return;
    soundEngine.playSwitchSnap();
    onDeductMinutes(selectedMins);
    setRemainingSeconds(selectedMins * 60);
    setIsPlaying(true);
    setIsTimeUp(false);
  };

  const handlePause = () => {
    soundEngine.playPop();
    setIsPlaying(!isPlaying);
  };

  const handleStopAndClose = () => {
    soundEngine.playPop();
    setIsPlaying(false);
    setIsTimeUp(false);
    onClose();
  };

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-4 border-red-500 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-white relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={handleStopAndClose}
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

        {/* Play Status Mode */}
        {!isPlaying && !isTimeUp ? (
          <div>
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 my-4 text-center">
              <span className="text-xs text-slate-400 font-medium">当前时间金库余额</span>
              <div className="text-4xl font-black text-amber-400 my-1">
                {balanceMinutes} <span className="text-base font-normal text-slate-300">分钟</span>
              </div>
              <p className="text-xs text-slate-400">
                这是你平时认真完成学科任务攒下的奖励哦！
              </p>
            </div>

            {balanceMinutes <= 0 ? (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center my-4">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-amber-300">当前没有可游玩的时间哦！</p>
                <p className="text-xs text-slate-400 mt-1">
                  快去完成识字、拼音或绘本任务，为 Switch 充满电吧！
                </p>
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  选择本次游玩时长：
                </label>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[10, 15, 20, 30].map((m) => (
                    <button
                      key={m}
                      disabled={m > balanceMinutes}
                      onClick={() => {
                        soundEngine.playPop();
                        setSelectedMins(m);
                      }}
                      className={`py-3 rounded-2xl text-xs font-bold transition-all border ${
                        selectedMins === m
                          ? 'bg-gradient-to-b from-[#00C3E3] to-[#0099C4] text-white border-cyan-400 shadow-lg scale-105'
                          : m > balanceMinutes
                          ? 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      {m}分钟
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400 mb-6 px-1">
                  <span>游玩后剩余：{Math.max(0, balanceMinutes - selectedMins)} 分钟</span>
                  <button
                    onClick={() => {
                      soundEngine.playPop();
                      setSelectedMins(balanceMinutes);
                    }}
                    className="text-cyan-400 hover:underline font-bold"
                  >
                    全部兑换 ({balanceMinutes}分)
                  </button>
                </div>

                <button
                  onClick={handleStartPlay}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white font-black text-lg flex items-center justify-center gap-2 shadow-xl shadow-red-500/30 hover:scale-[1.02] active:scale-98 transition-all"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>开机游玩！启动倒计时</span>
                </button>
              </div>
            )}
          </div>
        ) : isPlaying ? (
          /* Active Playing Countdown */
          <div className="text-center py-4">
            <div className="relative w-52 h-52 mx-auto rounded-full border-8 border-red-500/40 bg-slate-950 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.3)] my-4">
              <span className="text-5xl font-black font-mono text-emerald-400 tracking-wider">
                {formattedTime}
              </span>
              <span className="text-xs text-slate-400 mt-2 flex items-center gap-1 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                畅玩中
              </span>
            </div>

            <p className="text-xs text-slate-400 my-3">
              💡 保持眼睛距离屏幕 40 厘米以上，注意用眼健康哦！
            </p>

            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={handlePause}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 border border-slate-700"
              >
                <Pause className="w-4 h-4" />
                <span>暂停</span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playPop();
                  setIsPlaying(false);
                }}
                className="px-6 py-3 rounded-xl bg-red-600/30 hover:bg-red-600/50 text-red-400 text-xs font-bold flex items-center gap-2 border border-red-500/30"
              >
                <RotateCcw className="w-4 h-4" />
                <span>提前结束</span>
              </button>
            </div>
          </div>
        ) : (
          /* Time Up Screen */
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
              onClick={handleStopAndClose}
              className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm shadow-lg hover:scale-[1.02] active:scale-98 transition-all"
            >
              我知道了，保护好眼睛！
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

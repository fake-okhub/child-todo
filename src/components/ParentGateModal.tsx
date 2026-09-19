import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Check } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface ParentGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DIGIT_MAP: Record<string, string> = {
  '0': '零',
  '1': '壹',
  '2': '贰',
  '3': '叁',
  '4': '肆',
  '5': '伍',
  '6': '陆',
  '7': '柒',
  '8': '捌',
  '9': '玖',
};

export const ParentGateModal: React.FC<ParentGateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Triple uppercase characters & target 3-digit string
  const [chineseText, setChineseText] = useState<string[]>(['陆', '贰', '柒']);
  const [targetDigits, setTargetDigits] = useState<string>('627');
  const [inputValue, setInputValue] = useState('');
  const [isError, setIsError] = useState(false);

  // Generate 3 random Chinese uppercase numbers
  const pickRandomThreeDigits = () => {
    const d1 = Math.floor(Math.random() * 9) + 1; // 1-9
    const d2 = Math.floor(Math.random() * 10);    // 0-9
    const d3 = Math.floor(Math.random() * 9) + 1; // 1-9

    const str = `${d1}${d2}${d3}`;
    const chars = [DIGIT_MAP[String(d1)], DIGIT_MAP[String(d2)], DIGIT_MAP[String(d3)]];

    setTargetDigits(str);
    setChineseText(chars);
  };

  useEffect(() => {
    if (isOpen) {
      pickRandomThreeDigits();
      setInputValue('');
      setIsError(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === targetDigits) {
      soundEngine.playCoin();
      onSuccess();
      onClose();
    } else {
      soundEngine.playPop();
      setIsError(true);
      setInputValue('');
      setTimeout(() => {
        setIsError(false);
        pickRandomThreeDigits();
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-4 border-slate-700 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => {
            soundEngine.playPop();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2 shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-800">
            家长识别验证
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            为防止小朋友误触，请依次识别输入 3 个大写汉字
          </p>
        </div>

        {/* 3 Chinese Uppercase Characters Display */}
        <div
          className={`my-4 py-5 px-4 rounded-3xl bg-gradient-to-b from-amber-50 to-orange-50 border-3 border-amber-300 text-center shadow-inner transition-transform ${
            isError ? 'animate-bounce border-red-400 bg-red-50' : ''
          }`}
        >
          <div className="flex items-center justify-center gap-4 text-4xl sm:text-5xl font-black text-slate-800 font-serif select-none tracking-wider">
            {chineseText.map((char, i) => (
              <span
                key={i}
                className="w-13 h-14 rounded-2xl bg-white/80 border border-amber-200 flex items-center justify-center shadow-sm"
              >
                {char}
              </span>
            ))}
          </div>

          <div className="text-[11px] text-amber-800 font-bold mt-2.5">
            请依次输入对应的 3 位阿拉伯数字
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            autoFocus
            maxLength={3}
            pattern="[0-9]*"
            inputMode="numeric"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.replace(/\D/g, ''))}
            className="w-full text-center py-3.5 px-4 text-2xl font-black rounded-2xl border-2 border-slate-300 focus:border-amber-500 focus:outline-none bg-slate-50 tracking-widest"
          />

          {isError && (
            <p className="text-xs font-bold text-red-500 text-center">
              数字不匹配，已刷新题目请重试
            </p>
          )}

          <button
            type="submit"
            disabled={inputValue.length < 3}
            className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>确认进入家长管理</span>
          </button>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { soundEngine } from '../utils/audio';

export const TTSLoadingModal: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  useEffect(() => {
    const unsub = soundEngine.addLoadingListener((loading, text) => {
      setIsLoading(loading);
      if (text) setLoadingText(text);
    });
    return unsub;
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-none">
      <div className="bg-slate-900/95 text-white px-5 py-3.5 rounded-2xl shadow-2xl border-2 border-purple-500/80 backdrop-blur-md flex items-center gap-3.5 max-w-md">
        <div className="w-9 h-9 rounded-xl bg-purple-600/30 text-purple-400 flex items-center justify-center flex-shrink-0">
          <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-black text-white flex items-center gap-1.5">
            <span>🎙️ AI 老师语音生成中...</span>
            <span className="text-[10px] bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded font-bold">
              处理中
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5 truncate">
            {loadingText || '正在通过大模型进行中文分词与高保真合成'}
          </p>
        </div>
      </div>
    </div>
  );
};

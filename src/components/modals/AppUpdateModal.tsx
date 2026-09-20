import React, { useState, useEffect } from 'react';
import { Sparkles, Download, CheckCircle2, AlertCircle, ArrowUpCircle, X, ShieldCheck } from 'lucide-react';
import type { AppUpdateInfo } from '../../utils/androidBridge';
import { isAndroidApp, triggerNativeUpdateDownload } from '../../utils/androidBridge';
import { soundEngine } from '../../utils/audio';

interface AppUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: AppUpdateInfo | null;
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  isOpen,
  onClose,
  updateInfo,
}) => {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<{ percent: number; current: number; total: number } | null>(null);
  const [downloadCompleted, setDownloadCompleted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.onUpdateDownloadProgress = (percent: number, current: number, total: number) => {
      setIsDownloading(true);
      setDownloadProgress({ percent, current, total });
    };

    window.onUpdateDownloadSuccess = (_path: string) => {
      setIsDownloading(false);
      setDownloadCompleted(true);
      soundEngine.playFanfare();
    };

    window.onUpdateDownloadError = (err: string) => {
      setIsDownloading(false);
      setError('下载升级包失败: ' + err);
      soundEngine.playPop();
    };

    return () => {
      window.onUpdateDownloadProgress = undefined;
      window.onUpdateDownloadSuccess = undefined;
      window.onUpdateDownloadError = undefined;
    };
  }, []);

  if (!isOpen || !updateInfo) return null;

  const handleStartUpdate = () => {
    soundEngine.playSwitchSnap();
    setError(null);

    if (isAndroidApp()) {
      setIsDownloading(true);
      setDownloadProgress({ percent: 0, current: 0, total: updateInfo.fileSize || 4800000 });
      const ok = triggerNativeUpdateDownload(updateInfo.downloadUrl, updateInfo.latestVersion);
      if (!ok) {
        setIsDownloading(false);
        setError('唤起原生下载服务失败，请检查网络权限');
      }
    } else {
      // Browser environment: trigger direct download
      window.open(updateInfo.downloadUrl, '_blank');
      onClose();
    }
  };

  const fileSizeStr = updateInfo.fileSize
    ? (updateInfo.fileSize / (1024 * 1024)).toFixed(1) + ' MB'
    : '4.6 MB';

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-4 border-rose-500/80 rounded-3xl max-w-md w-full p-6 shadow-2xl text-white relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-black">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>发现全新版本可用</span>
          </div>

          <h3 className="text-2xl font-black tracking-tight text-white">
            KidsTodo 体验焕新升级
          </h3>

          {/* Version comparison chip */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 font-mono text-xs font-bold border border-slate-700">
              当前: v{updateInfo.currentVersion}
            </span>
            <span className="text-rose-400 font-black">➔</span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-mono text-xs font-black border border-rose-500/40">
              最新: v{updateInfo.latestVersion}
            </span>
            <span className="text-[11px] text-slate-500 font-mono font-bold">
              ({fileSizeStr})
            </span>
          </div>
        </div>

        {/* Release Notes Preview */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 my-4 max-h-48 overflow-y-auto space-y-2 text-xs text-slate-300 leading-relaxed text-left">
          <div className="font-bold text-white flex items-center gap-1.5">
            <ArrowUpCircle className="w-4 h-4 text-rose-400" />
            <span>本次升级亮点：</span>
          </div>
          <div className="whitespace-pre-line text-slate-300 pl-1 text-[11px]">
            {updateInfo.releaseNotes ||
              '• 倒计时长按 3 秒充能开机（防误触高门槛机制）\n• 实时分钟精准扣减，暂停或中途退出不丢失任何已攒时间\n• 深度联动平板系统自带闹铃声，休眠熄屏准时唤醒\n• 家长后台新增每周时间自主一键清零功能'}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Downloading Progress Bar or Action Buttons */}
        {isDownloading ? (
          <div className="space-y-3 py-2">
            <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                <span>正在高速下载安装包...</span>
              </span>
              <span className="text-rose-400">{downloadProgress?.percent || 0}%</span>
            </div>

            {/* Progress Bar Container */}
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 rounded-full transition-all duration-150"
                style={{ width: `${downloadProgress?.percent || 0}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>
                {downloadProgress?.current
                  ? (downloadProgress.current / (1024 * 1024)).toFixed(1) + ' MB'
                  : '0 MB'}
              </span>
              <span>
                {downloadProgress?.total
                  ? (downloadProgress.total / (1024 * 1024)).toFixed(1) + ' MB'
                  : fileSizeStr}
              </span>
            </div>
          </div>
        ) : downloadCompleted ? (
          <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-1.5">
            <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
            <p className="text-xs font-bold text-emerald-300">
              下载完成！正在唤起系统覆盖安装...
            </p>
            <p className="text-[10px] text-slate-400">
              平滑升级，所有历史打卡与金库数据 100% 完整保留。
            </p>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleStartUpdate}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:opacity-95 text-white font-black text-sm shadow-xl shadow-rose-900/40 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98 transition-all"
            >
              <Download className="w-5 h-5" />
              <span>立即极速升级 (平滑覆盖安装)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold transition-colors"
            >
              稍后提醒我
            </button>
          </div>
        )}

        {/* Footer reassurance note */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 mt-4">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>官方同一签名保障 · 历史打卡和游戏余额永久保留</span>
        </div>
      </div>
    </div>
  );
};

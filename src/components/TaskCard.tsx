import React, { useState, useEffect } from 'react';
import { Check, Volume2, Edit3, Trash2, Sparkles, Loader2 } from 'lucide-react';
import type { TaskItem } from '../types';
import { SUBJECT_CONFIGS } from '../utils/storage';
import { soundEngine } from '../utils/audio';
import { MarioCoin } from './MarioAssets';

interface TaskCardProps {
  task: TaskItem;
  onToggleComplete: (task: TaskItem) => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
}) => {
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const config = SUBJECT_CONFIGS[task.subject] || SUBJECT_CONFIGS.custom;

  useEffect(() => {
    return soundEngine.addLoadingListener((loading) => {
      setIsAudioLoading(loading);
    });
  }, []);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAudioLoading) return;
    soundEngine.playPop();
    soundEngine.speak(`【${config.name}】${task.title}。${task.description || ''}`);
  };

  return (
    <div
      className={`relative rounded-3xl p-5 sm:p-6 border-3 transition-all duration-200 shadow-md ${
        task.isCompleted
          ? 'bg-slate-100/90 border-slate-300 opacity-80'
          : `${config.bgLight} ${config.borderLight} hover:shadow-xl hover:-translate-y-0.5`
      }`}
    >
      {/* Top Header Row: Subject Badge + Reward + Controls */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Subject Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-black shadow-sm bg-white border border-slate-200 ${config.textDark}`}
          >
            <span className="text-base">{config.icon}</span>
            <span>{config.name}</span>
          </span>

          {/* Reward Badge */}
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl text-xs font-black bg-amber-400 text-amber-950 shadow-sm border border-amber-500">
            <MarioCoin className="w-3.5 h-3.5" />
            <span>+{task.rewardMinutes} 分钟</span>
          </span>
        </div>

        {/* Action icons: TTS & Edit */}
        <div className="flex items-center gap-1">
          {/* TTS Read Aloud */}
          <button
            onClick={handleSpeak}
            disabled={isAudioLoading}
            className={`p-2.5 rounded-xl bg-white text-slate-500 shadow-sm border border-slate-200 transition-all ${
              isAudioLoading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-slate-100 hover:text-slate-800'
            }`}
            title={isAudioLoading ? '正在生成语音...' : '点击朗读任务要求'}
          >
            {isAudioLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          {/* Quick Edit */}
          <button
            onClick={() => {
              soundEngine.playPop();
              onEditTask(task);
            }}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 shadow-sm border border-slate-200 transition-colors"
            title="编辑任务"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            onClick={() => {
              soundEngine.playPop();
              if (confirm(`确定删除任务【${task.title}】吗？`)) {
                onDeleteTask(task.id);
              }
            }}
            className="p-2.5 rounded-xl bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 shadow-sm border border-slate-200 transition-colors"
            title="删除任务"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Task Content */}
      <div className="my-2">
        <h4
          className={`text-lg sm:text-xl font-black leading-snug tracking-tight ${
            task.isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
          }`}
        >
          {task.title}
        </h4>

        {task.description && (
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 line-clamp-2">
            {task.description}
          </p>
        )}
      </div>

      {/* Footer Checkbox Button (Tablet Large Target) */}
      <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
        <span className="text-xs text-slate-400 font-medium">
          {task.isCompleted ? '已累计入周末金库' : '完成后点击右侧打卡'}
        </span>

        <button
          onClick={() => onToggleComplete(task)}
          className={`min-h-[48px] px-6 py-2.5 rounded-2xl font-black text-sm sm:text-base flex items-center gap-2.5 shadow-md transition-all active:scale-95 ${
            task.isCompleted
              ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300 hover:bg-emerald-200'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/30 hover:scale-105'
          }`}
        >
          {task.isCompleted ? (
            <>
              <Check className="w-5 h-5 stroke-[3]" />
              <span>已完成打卡</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-200" />
              <span>打卡完成领奖</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Circle } from 'lucide-react';
import type { DayRecord, TaskItem } from '../types';
import { SUBJECT_CONFIGS, getTodayDateString } from '../utils/storage';
import { soundEngine } from '../utils/audio';
import { MarioCoin } from './MarioAssets';

interface CalendarViewProps {
  history: Record<string, DayRecord>;
  todayTasks: TaskItem[];
  onToggleCompleteToday?: (task: TaskItem) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  history,
  todayTasks,
  onToggleCompleteToday,
}) => {
  const todayStr = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [viewYear, setViewYear] = useState<number>(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(new Date().getMonth()); // 0-indexed

  // Month navigation
  const prevMonth = () => {
    soundEngine.playPop();
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    soundEngine.playPop();
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const goToday = () => {
    soundEngine.playPop();
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDate(todayStr);
  };

  // Build grid days
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Shift for Monday start: Mon(0) to Sun(6)
  const startOffset = (firstDayOfMonth + 6) % 7;

  const calendarCells = [];
  // Empty lead cells
  for (let i = 0; i < startOffset; i++) {
    calendarCells.push(null);
  }
  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  // Get selected day record: if today, use live todayTasks; otherwise from history
  const isSelectedToday = selectedDate === todayStr;
  const selectedDayRecord: DayRecord | undefined = isSelectedToday
    ? {
        date: todayStr,
        tasks: todayTasks,
        earnedMinutes: todayTasks.filter((t) => t.isCompleted).reduce((sum, t) => sum + t.rewardMinutes, 0),
        hasFullFiveCompleted: todayTasks.filter((t) => !t.isAutoHabit && t.isCompleted).length >= 5,
        hasAutoHabit: todayTasks.some((t) => t.isAutoHabit && t.isCompleted),
        allCompleted: todayTasks.length > 0 && todayTasks.every((t) => t.isCompleted),
      }
    : history[selectedDate];

  const tasksToShow = selectedDayRecord?.tasks || [];
  const completedTasks = tasksToShow.filter((t) => t.isCompleted);
  const uncompletedTasks = tasksToShow.filter((t) => !t.isCompleted);

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 my-4">
      {/* Container Box */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-3 border-slate-200 shadow-xl">
        {/* Calendar Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-800 flex items-center gap-2">
                <span>{viewYear} 年 {viewMonth + 1} 月</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  打卡足迹
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                绿色/金币圆点代表当天有完成打卡记录
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={goToday}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
            >
              回今天
            </button>
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="上个月"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="下个月"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="mb-6">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center text-xs font-black text-slate-400 mb-2">
            <div>一</div>
            <div>二</div>
            <div>三</div>
            <div>四</div>
            <div>五</div>
            <div className="text-red-400">六</div>
            <div className="text-red-400">日</div>
          </div>

          {/* Day cells with strictly centered numbers */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarCells.map((dayNum, idx) => {
              if (dayNum === null) {
                return <div key={`empty-${idx}`} className="h-14 sm:h-16 rounded-2xl bg-transparent" />;
              }

              const mStr = String(viewMonth + 1).padStart(2, '0');
              const dStr = String(dayNum).padStart(2, '0');
              const cellDate = `${viewYear}-${mStr}-${dStr}`;
              const isSelected = selectedDate === cellDate;
              const isTodayCell = cellDate === todayStr;

              // Check checkin status
              const cellRecord = isTodayCell
                ? {
                    hasAnyCompleted: todayTasks.some((t) => t.isCompleted),
                    allDone: todayTasks.length > 0 && todayTasks.every((t) => t.isCompleted),
                    earned: todayTasks.filter((t) => t.isCompleted).reduce((sum, t) => sum + t.rewardMinutes, 0),
                  }
                : {
                    hasAnyCompleted: (history[cellDate]?.earnedMinutes || 0) > 0,
                    allDone: history[cellDate]?.allCompleted || false,
                    earned: history[cellDate]?.earnedMinutes || 0,
                  };

              return (
                <button
                  key={cellDate}
                  onClick={() => {
                    soundEngine.playPop();
                    setSelectedDate(cellDate);
                  }}
                  className={`h-14 sm:h-16 p-1 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all relative ${
                    isSelected
                      ? 'bg-amber-400 text-slate-900 border-amber-500 shadow-md scale-105 z-10 font-black'
                      : isTodayCell
                      ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100 font-bold'
                      : cellRecord.hasAnyCompleted
                      ? 'bg-emerald-50/70 text-slate-800 border-emerald-200 hover:bg-emerald-100 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 font-medium'
                  }`}
                >
                  {/* Centered Day Number */}
                  <span className="text-sm sm:text-base font-black font-mono leading-none flex items-center justify-center">
                    {dayNum}
                  </span>

                  {/* Centered Dot / Coin / Star Indicator underneath */}
                  <div className="h-4 flex items-center justify-center gap-0.5 mt-1">
                    {cellRecord.hasAnyCompleted ? (
                      cellRecord.allDone ? (
                        <span className="text-[11px] sm:text-xs leading-none" title="全部通关">⭐</span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
                      )
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
                    )}

                    {cellRecord.earned > 0 && (
                      <span className="text-[9px] font-bold font-mono text-emerald-700 hidden sm:inline leading-none">
                        +{cellRecord.earned}m
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Detail List */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                <span>📅 {selectedDate}</span>
                {isSelectedToday && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500 text-white font-bold">
                    今天
                  </span>
                )}
              </h4>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                已完成: {completedTasks.length} 项
              </span>
              <span className="text-slate-400 flex items-center gap-1">
                <Circle className="w-3.5 h-3.5" />
                未完成: {uncompletedTasks.length} 项
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 font-mono flex items-center gap-1">
                <MarioCoin className="w-3.5 h-3.5" />
                共积累 {selectedDayRecord?.earnedMinutes || 0} 分钟
              </span>
            </div>
          </div>

          {/* Tasks Detail View (Completed vs Uncompleted Grayed-out) */}
          {tasksToShow.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
              该日期没有打卡记录
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Completed Tasks (Normal Vivid Cards) */}
              {completedTasks.map((task) => {
                const conf = SUBJECT_CONFIGS[task.subject] || SUBJECT_CONFIGS.custom;
                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-2xl border-2 flex items-center justify-between shadow-sm ${conf.bgLight} ${conf.borderLight}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-sm flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200">
                            {conf.icon} {conf.name}
                          </span>
                          <span className="text-sm font-black text-slate-800">
                            {task.title}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="px-2.5 py-1 rounded-xl bg-amber-400 text-amber-950 text-xs font-black shadow-sm">
                        +{task.rewardMinutes}分 Switch
                      </span>
                      {isSelectedToday && onToggleCompleteToday && (
                        <button
                          onClick={() => onToggleCompleteToday(task)}
                          className="text-xs text-slate-400 hover:text-red-500 underline ml-2"
                        >
                          撤销
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Uncompleted Tasks (Item Background Grayed Out - 用户明确要求背景置灰) */}
              {uncompletedTasks.map((task) => {
                const conf = SUBJECT_CONFIGS[task.subject] || SUBJECT_CONFIGS.custom;
                return (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-2xl border-2 border-slate-300 bg-slate-100 dark:bg-slate-800/60 opacity-60 flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 flex-shrink-0">
                        <Circle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-500">
                            {conf.icon} {conf.name}
                          </span>
                          <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                            {task.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-500">
                            未完成
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-slate-400 mt-0.5">{task.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-200 text-slate-500 text-xs font-bold">
                        +{task.rewardMinutes}分
                      </span>
                      {isSelectedToday && onToggleCompleteToday && (
                        <button
                          onClick={() => onToggleCompleteToday(task)}
                          className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm ml-2"
                        >
                          去打卡
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

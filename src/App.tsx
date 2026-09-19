import { useState, useEffect } from 'react';
import type { TaskItem, UserSettings, SubjectType, TaskTemplate, DayRecord } from './types';
import {
  loadTasks,
  saveTasks,
  loadSettings,
  saveSettings,
  loadTemplates,
  saveTemplates,
  loadHistory,
  saveDayRecord,
  saveHistory,
  getTodayDateString,
  createTasksFromTemplate,
  checkWeeklyFullAttendanceBonus,
  getRecentThursdayDateString,
} from './utils/storage';
import { soundEngine } from './utils/audio';
import { fireCelebrationConfetti } from './utils/confetti';
import { pullFromCloudflare, syncCloudFirst } from './utils/cloudSync';
import { syncDailyReminderToNative } from './utils/androidBridge';
import { KidHeader } from './components/KidHeader';
import { SwitchConsole } from './components/SwitchConsole';
import { SubjectFilter } from './components/SubjectFilter';
import { TaskCard } from './components/TaskCard';
import { CalendarView } from './components/CalendarView';
import { ParentGateModal } from './components/ParentGateModal';
import { ParentAdminModal } from './components/ParentAdminModal';
import { SwitchPlayModal } from './components/modals/SwitchPlayModal';
import { TTSLoadingModal } from './components/TTSLoadingModal';
import { MarioCoin, OneUpMushroom } from './components/MarioAssets';
import { Trophy } from 'lucide-react';

export function App() {
  const [tasks, setTasks] = useState<TaskItem[]>(() => loadTasks());
  const [templates, setTemplates] = useState<TaskTemplate[]>(() => loadTemplates());
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [history, setHistory] = useState<Record<string, DayRecord>>(() => loadHistory());

  // Views & Modals
  const [currentView, setCurrentView] = useState<'tasks' | 'calendar'>('tasks');
  const [currentSubject, setCurrentSubject] = useState<SubjectType | 'all'>('all');
  const [isParentGateOpen, setIsParentGateOpen] = useState<boolean>(false);
  const [isParentAdminOpen, setIsParentAdminOpen] = useState<boolean>(false);
  const [isPlayModalOpen, setIsPlayModalOpen] = useState<boolean>(false);
  const [justEarnedHabit, setJustEarnedHabit] = useState<boolean>(false);
  const [justEarnedWeeklyBonus, setJustEarnedWeeklyBonus] = useState<boolean>(false);

  // 1. Stale-While-Revalidate (SWR) Initial Cloud Load:
  // Immediately initialize from local storage, then fetch fresh data from Cloudflare KV as primary source
  useEffect(() => {
    pullFromCloudflare(settings.cloudSyncUrl || '/api/sync').then((res) => {
      if (res.success && res.data) {
        console.log('Successfully fetched fresh primary data from Cloudflare KV');
        const cloudData = res.data;
        if (cloudData.settings) {
          setSettings((prev) => ({ ...prev, ...cloudData.settings }));
          saveSettings(cloudData.settings);
        }
        if (cloudData.templates && Array.isArray(cloudData.templates)) {
          const cleanTemplates = cloudData.templates.filter((t) => t.id !== 'weekend-relaxed');
          if (cleanTemplates.length > 0) {
            setTemplates(cleanTemplates);
            saveTemplates(cleanTemplates);
          }
        }
        if (cloudData.tasks && Array.isArray(cloudData.tasks)) {
          const cleanTasks = cloudData.tasks.filter((t) => t.subject !== 'sports');
          if (cleanTasks.length > 0) {
            setTasks(cleanTasks);
            saveTasks(cleanTasks);
          }
        }
        if (cloudData.history) {
          const thurDate = getRecentThursdayDateString();
          let cleanHistory = cloudData.history;
          const keys = Object.keys(cleanHistory);
          // If cloud history has legacy mock keys, keep only Thursday
          if (keys.length > 1 && keys.includes(thurDate)) {
            cleanHistory = { [thurDate]: cleanHistory[thurDate] };
          }
          setHistory(cleanHistory);
          saveHistory(cleanHistory);
        }
      } else if (res.success && !res.data) {
        // Cloud KV is unseeded, seed Cloudflare KV with current initial state
        syncCloudFirst(settings.cloudSyncUrl || '/api/sync', {
          tasks,
          templates,
          history,
          settings,
        });
      }
    });
  }, []);

  // Update audio engine and native alarm when settings change
  useEffect(() => {
    soundEngine.setEnabled(settings.soundEnabled);
    soundEngine.setTTSConfig({
      ttsEngine: settings.ttsEngine,
      ttsVoice: settings.ttsVoice,
      siliconflowApiKey: settings.siliconflowApiKey,
      azureApiKey: settings.azureApiKey,
      azureRegion: settings.azureRegion,
      googleApiKey: settings.googleApiKey,
    });
    syncDailyReminderToNative(
      settings.dailyReminderEnabled ?? true,
      settings.dailyReminderTime || '17:30',
      '⏰ 小勇士打卡提醒',
      settings.dailyReminderMessage || '放学啦！记得完成今日 5 科打卡，积累周末 Switch 能量哦！'
    );
  }, [settings]);

  // Today stats & dynamic target
  const completedTasks = tasks.filter((t) => t.isCompleted);
  const todayEarnedMinutes = completedTasks.reduce((sum, t) => sum + t.rewardMinutes, 0);
  const regularTasks = tasks.filter((t) => !t.isAutoHabit);
  const allRegularTasksDone = regularTasks.length > 0 && regularTasks.every((t) => t.isCompleted);
  const plannedMinutes = regularTasks.reduce((sum, t) => sum + t.rewardMinutes, 0);
  const habitBonusMins = settings.habitRewardMinutes ?? 5;
  const dynamicDailyMax = plannedMinutes > 0 ? plannedMinutes + habitBonusMins : 30;

  // Filter tasks by subject
  const filteredTasks = tasks.filter((t) => {
    if (currentSubject === 'all') return true;
    return t.subject === currentSubject;
  });

  // Toggle task completion
  const handleToggleComplete = (task: TaskItem) => {
    if (!task.isCompleted) {
      // Completing task (+ task.rewardMinutes)
      const minutesToAdd = task.rewardMinutes || 5;
      let nextBalance = settings.balanceMinutes + minutesToAdd;

      let nextTasks = tasks.map((t) =>
        t.id === task.id ? { ...t, isCompleted: true, completedAt: new Date().toISOString() } : t
      );

      // Check Good Habit: When required number of regular scheduled tasks are completed
      const currentRegular = nextTasks.filter((t) => !t.isAutoHabit);
      const requiredCount = settings.requiredTasksForHabit ?? 5;
      const completedRegularCount = currentRegular.filter((t) => t.isCompleted).length;
      const isHabitUnlocked = completedRegularCount >= requiredCount;
      const alreadyHasAutoHabit = nextTasks.some((t) => t.isAutoHabit);

      if (isHabitUnlocked && !alreadyHasAutoHabit) {
        const autoHabit: TaskItem = {
          id: `habit-${Date.now()}`,
          subject: 'custom',
          title: `好习惯自动奖励：${requiredCount}门学科满勤完成！`,
          description: `今日已自觉完成 ${requiredCount} 门学科任务，系统自动解锁好习惯大奖`,
          rewardMinutes: habitBonusMins,
          isCompleted: true,
          completedAt: new Date().toISOString(),
          isAutoHabit: true,
        };

        nextTasks = [...nextTasks, autoHabit];
        nextBalance += habitBonusMins;
        setJustEarnedHabit(true);
        setTimeout(() => setJustEarnedHabit(false), 5000);
      }

      setTasks(nextTasks);
      setSettings((prev) => ({ ...prev, balanceMinutes: nextBalance }));

      // Update today's record in history
      const today = getTodayDateString();
      const updatedRegular = nextTasks.filter((t) => !t.isAutoHabit);
      const updatedRegularDone = updatedRegular.filter((t) => t.isCompleted).length;
      const updatedDayRecord: DayRecord = {
        date: today,
        tasks: nextTasks,
        earnedMinutes: nextTasks.filter((t) => t.isCompleted).reduce((sum, t) => sum + t.rewardMinutes, 0),
        hasFullFiveCompleted: updatedRegularDone >= requiredCount,
        hasAutoHabit: nextTasks.some((t) => t.isAutoHabit && t.isCompleted),
        allCompleted: nextTasks.length > 0 && nextTasks.every((t) => t.isCompleted),
      };
      saveDayRecord(updatedDayRecord);
      setHistory((prev) => ({ ...prev, [today]: updatedDayRecord }));

      // Check Weekly Full Attendance Bonus
      const updatedHistory = { ...history, [today]: updatedDayRecord };
      const attendanceCheck = checkWeeklyFullAttendanceBonus(
        updatedHistory,
        nextBalance,
        settings.weeklyBonusMinutes ?? 15
      );
      if (attendanceCheck.isEligible) {
        setSettings((prev) => ({ ...prev, balanceMinutes: attendanceCheck.newBalance }));
        setJustEarnedWeeklyBonus(true);
        soundEngine.playFanfare();
        fireCelebrationConfetti();
      } else {
        soundEngine.playCoin();
        fireCelebrationConfetti();
      }
    } else {
      // Undo completion
      soundEngine.playPop();
      const nextBalance = Math.max(0, settings.balanceMinutes - task.rewardMinutes);
      setSettings((prev) => ({ ...prev, balanceMinutes: nextBalance }));

      let nextTasks = tasks.map((t) =>
        t.id === task.id ? { ...t, isCompleted: false, completedAt: undefined } : t
      );

      // If undoing brought completed regular tasks below threshold, remove auto habit if present
      const currentRegular = nextTasks.filter((t) => !t.isAutoHabit);
      const requiredCount = settings.requiredTasksForHabit ?? 5;
      const completedRegularCount = currentRegular.filter((t) => t.isCompleted).length;
      const isHabitUnlocked = completedRegularCount >= requiredCount;
      if (!isHabitUnlocked) {
        const habitTask = nextTasks.find((t) => t.isAutoHabit);
        if (habitTask && habitTask.isCompleted) {
          const balanceWithoutHabit = Math.max(0, nextBalance - (habitTask.rewardMinutes || 5));
          setSettings((prev) => ({ ...prev, balanceMinutes: balanceWithoutHabit }));
        }
        nextTasks = nextTasks.filter((t) => !t.isAutoHabit);
      }

      setTasks(nextTasks);

      const today = getTodayDateString();
      const updatedRegular = nextTasks.filter((t) => !t.isAutoHabit);
      const updatedRegularDone = updatedRegular.filter((t) => t.isCompleted).length;
      const updatedDayRecord: DayRecord = {
        date: today,
        tasks: nextTasks,
        earnedMinutes: nextTasks.filter((t) => t.isCompleted).reduce((sum, t) => sum + t.rewardMinutes, 0),
        hasFullFiveCompleted: updatedRegularDone >= requiredCount,
        hasAutoHabit: nextTasks.some((t) => t.isAutoHabit && t.isCompleted),
        allCompleted: nextTasks.length > 0 && nextTasks.every((t) => t.isCompleted),
      };
      saveDayRecord(updatedDayRecord);
      setHistory((prev) => ({ ...prev, [today]: updatedDayRecord }));
    }
  };

  // Switch play deduction
  const handleDeductMinutes = (mins: number) => {
    const nextBalance = Math.max(0, settings.balanceMinutes - mins);
    setSettings((prev) => ({ ...prev, balanceMinutes: nextBalance }));
  };

  // Cloud-First Auto-Sync Pipeline:
  // Prioritizes syncing to Cloudflare KV first, then upon success writes to secondary local storage
  useEffect(() => {
    const timer = setTimeout(() => {
      syncCloudFirst(settings.cloudSyncUrl || '/api/sync', {
        tasks,
        templates,
        history,
        settings,
      }).catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, [tasks, templates, history, settings]);

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-slate-800 pb-20 font-sans antialiased selection:bg-red-500 selection:text-white">
      {/* Top Tablet Header */}
      <KidHeader
        childName={settings.childName}
        soundEnabled={settings.soundEnabled}
        onToggleSound={() => setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
        onOpenParentGate={() => setIsParentGateOpen(true)}
        currentView={currentView}
        onToggleView={setCurrentView}
        totalBalance={settings.balanceMinutes}
      />

      {/* Hero Nintendo Switch Energy Vault */}
      <SwitchConsole
        balanceMinutes={settings.balanceMinutes}
        todayEarnedMinutes={todayEarnedMinutes}
        dailyMaxMinutes={dynamicDailyMax}
        completedTasksCount={completedTasks.length}
        totalTasksCount={tasks.length}
        onOpenPlayModal={() => setIsPlayModalOpen(true)}
      />

      {/* Good Habit Auto-Earned Banner */}
      {justEarnedHabit && (
        <div className="w-full max-w-4xl mx-auto px-4 my-2">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-4 text-white shadow-xl flex items-center justify-between animate-bounce">
            <div className="flex items-center gap-3">
              <OneUpMushroom className="w-10 h-10 flex-shrink-0" />
              <div>
                <h4 className="font-black text-base sm:text-lg">
                  🎉 触发好习惯奖励！自动 +{habitBonusMins} 分钟 Switch！
                </h4>
                <p className="text-xs text-white/90">
                  今天全部学科任务已按时完成，好习惯奖励自动到账！
                </p>
              </div>
            </div>
            <span className="text-xs bg-black/20 px-3 py-1 rounded-xl font-black font-mono">
              +{habitBonusMins}m
            </span>
          </div>
        </div>
      )}

      {/* Weekly Full Attendance Bonus Banner */}
      {justEarnedWeeklyBonus && (
        <div className="w-full max-w-4xl mx-auto px-4 my-2">
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-3xl p-5 text-white shadow-2xl flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <Trophy className="w-12 h-12 text-yellow-200" />
              <div>
                <h4 className="font-black text-lg sm:text-xl">
                  🏆 周工作日全勤大奖达成！额外赠送 +{settings.weeklyBonusMinutes ?? 15} 分钟！
                </h4>
                <p className="text-xs sm:text-sm text-white/90">
                  本周一至周五 5 个工作日每日均满勤打卡，太厉害啦！
                </p>
              </div>
            </div>
            <button
              onClick={() => fireCelebrationConfetti()}
              className="px-4 py-2 rounded-2xl bg-white text-orange-600 font-black text-xs shadow-md hover:scale-105 transition-all"
            >
              放礼花 🎉
            </button>
          </div>
        </div>
      )}

      {/* VIEW 1: TODAY'S CHECKLIST (今日清单视图) */}
      {currentView === 'tasks' ? (
        <>
          {/* Subject Filter Tabs */}
          <SubjectFilter
            currentSubject={currentSubject}
            onSelectSubject={setCurrentSubject}
          />

          <main className="w-full max-w-4xl mx-auto px-3 sm:px-4 mt-2">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700">
                <span>今日任务打卡清单</span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-mono font-black">
                  {completedTasks.length} / {tasks.length} 已完成
                </span>
                {allRegularTasksDone && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    ✓ 全科达标
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <span>做完可累计奖励时长 • 全部完成自动加好习惯</span>
              </div>
            </div>

            {/* Task Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleComplete}
                  onEditTask={() => setIsParentGateOpen(true)}
                  onDeleteTask={() => setIsParentGateOpen(true)}
                />
              ))}
            </div>
          </main>
        </>
      ) : (
        /* VIEW 2: CALENDAR SCHEDULE MANAGEMENT (年月周日日程管理视图) */
        <CalendarView
          history={history}
          todayTasks={tasks}
          onToggleCompleteToday={handleToggleComplete}
        />
      )}

      {/* Footer */}
      <footer className="w-full max-w-4xl mx-auto px-4 mt-12 text-center text-xs text-slate-400 select-none">
        <p className="flex items-center justify-center gap-1.5">
          <MarioCoin className="w-4 h-4" />
          <span>家庭平板专享 • 一年级学科自律打卡 • 云端备份已连接至 kidstodo.jac.edu.kg</span>
        </p>
      </footer>

      {/* 1. Parent Identification Gate Modal (Chinese uppercase number) */}
      <ParentGateModal
        isOpen={isParentGateOpen}
        onClose={() => setIsParentGateOpen(false)}
        onSuccess={() => setIsParentAdminOpen(true)}
      />

      {/* 2. Parent Management Admin Modal */}
      <ParentAdminModal
        isOpen={isParentAdminOpen}
        onClose={() => setIsParentAdminOpen(false)}
        templates={templates}
        onSaveTemplates={setTemplates}
        onApplyTemplateToToday={(tmpl) => {
          const newTasks = createTasksFromTemplate(tmpl);
          setTasks(newTasks);
        }}
        settings={settings}
        onUpdateSettings={setSettings}
        onOpenPlayModal={() => setIsPlayModalOpen(true)}
        history={history}
        onUpdateHistory={setHistory}
        todayTasks={tasks}
        onUpdateTodayTasks={setTasks}
      />

      {/* 3. Weekend Switch Play Timer Modal */}
      <SwitchPlayModal
        isOpen={isPlayModalOpen}
        onClose={() => setIsPlayModalOpen(false)}
        balanceMinutes={settings.balanceMinutes}
        onDeductMinutes={handleDeductMinutes}
      />

      {/* 4. Global TTS Audio Loading HUD (Anti-Double-Click & Loading Indicator) */}
      <TTSLoadingModal />
    </div>
  );
}

export default App;

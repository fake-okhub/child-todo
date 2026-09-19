import React, { useState, useEffect } from 'react';
import {
  X,
  LayoutTemplate,
  Gamepad2,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  Circle,
  Sparkles,
  Volume2,
  Play,
  KeyRound,
  Loader2,
  Cloud,
  Smartphone,
  Bell,
  Clock,
  ArrowUpCircle,
  Download,
  RefreshCw,
  ShieldCheck,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import type {
  TaskTemplate,
  SubjectType,
  UserSettings,
  TemplateTask,
  DayRecord,
  TaskItem,
  TTSEngineType,
} from '../types';
import {
  SUBJECT_CONFIGS,
  getTodayDateString,
  getDateOffset,
  createTasksFromTemplate,
} from '../utils/storage';
import { soundEngine } from '../utils/audio';
import {
  isAndroidApp,
  syncDailyReminderToNative,
  testNativeReminder,
  getNativeAppVersion,
  checkAppUpdate,
  triggerNativeUpdateDownload,
  type AppUpdateInfo,
} from '../utils/androidBridge';
import { IOSTimeWheelPicker } from './common/IOSTimeWheelPicker';

export const SILICONFLOW_VOICES = [
  { id: 'FunAudioLLM/CosyVoice2-0.5B:claire', name: 'claire', tag: '🌸 温柔女声', desc: '知性亲切，极适合一年级伴读与生字指导 (推荐)' },
  { id: 'FunAudioLLM/CosyVoice2-0.5B:diana', name: 'diana', tag: '☀️ 欢快女声', desc: '活泼元气，富有鼓励感与能量' },
  { id: 'FunAudioLLM/CosyVoice2-0.5B:anna', name: 'anna', tag: '📖 优雅女声', desc: '端庄沉稳，适合专注绘本与课文精读' },
  { id: 'FunAudioLLM/CosyVoice2-0.5B:bella', name: 'bella', tag: '🔥 热情女声', desc: '声线开朗，充满朝气' },
  { id: 'FunAudioLLM/CosyVoice2-0.5B:david', name: 'david', tag: '👦 阳光男孩', desc: '清脆同龄小伙伴感，亲和力极佳' },
  { id: 'FunAudioLLM/CosyVoice2-0.5B:alex', name: 'alex', tag: '👔 沉稳男声', desc: '清晰标准，播报感与条理性强' },
  { id: 'FunAudioLLM/CosyVoice2-0.5B:benjamin', name: 'benjamin', tag: '🎙️ 温和男声', desc: '低沉舒缓，如耐心的大朋友' },
  { id: 'FunAudioLLM/CosyVoice2-0.5B:charles', name: 'charles', tag: '☕ 磁性男声', desc: '厚重温暖，适合故事旁白' },
];

export const AZURE_VOICES = [
  { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓', tag: '🌸 微软金牌伴读', desc: '多音字极准，极富表现力的名师少儿伴读音色 (最推荐)' },
  { id: 'zh-CN-YunxiNeural', name: '云希', tag: '👦 活泼男童音', desc: '机灵淘气，充满童趣与代入感' },
  { id: 'zh-CN-XiaoyiNeural', name: '晓伊', tag: '👧 甜美少儿女声', desc: '清甜可爱，适合绘本与少儿趣味配音' },
  { id: 'zh-CN-YunjianNeural', name: '云健', tag: '🎒 阳光少年男声', desc: '少先队员大哥哥般的声音' },
  { id: 'zh-CN-XiaohanNeural', name: '晓涵', tag: '📖 抒情温暖女声', desc: '温柔安静，适合绘本故事与晚间阅读' },
  { id: 'zh-CN-YunyangNeural', name: '云扬', tag: '👔 专业播音男声', desc: '吐字铿锵有力，课文朗读清晰规范' },
  { id: 'zh-CN-XiaomengNeural', name: '晓梦', tag: '🎈 故事姐姐女声', desc: '声线生动活泼，富有启发感' },
  { id: 'zh-CN-XiaomoNeural', name: '晓墨', tag: '☕ 沉稳解说女声', desc: '知性清晰，条理性极强' },
];

export const GOOGLE_VOICES = [
  { id: 'cmn-CN-Chirp3-HD-Achernar', name: 'Chirp3-HD 水委一', tag: '🌟 谷歌超高清知性女声', desc: 'Google 最新一代高保真模型，极度自然流畅 (最推荐)' },
  { id: 'cmn-CN-Chirp3-HD-Aoede', name: 'Chirp3-HD 木卫四十一', tag: '☀️ 欢快元气女声', desc: '活泼清亮，富有亲和力与鼓励感' },
  { id: 'cmn-CN-Chirp3-HD-Charon', name: 'Chirp3-HD 冥卫一', tag: '👦 清脆少年男声', desc: '清爽明朗，伙伴互动感强' },
  { id: 'cmn-CN-Chirp3-HD-Despina', name: 'Chirp3-HD 海卫五', tag: '🌸 温柔故事女声', desc: '舒缓亲切，适合绘本慢读' },
  { id: 'cmn-CN-Wavenet-A', name: 'WaveNet-A', tag: '📖 经典名师伴读女声', desc: '谷歌经典深层神经网络语音，咬字标准清晰' },
  { id: 'cmn-CN-Wavenet-B', name: 'WaveNet-B', tag: '👔 沉稳标准男声', desc: '深沉标准，播报感强' },
  { id: 'cmn-CN-Wavenet-D', name: 'WaveNet-D', tag: '👧 亲和少儿女声', desc: '清甜自然，适合低年级课文辅导' },
];

interface ParentAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: TaskTemplate[];
  onSaveTemplates: (templates: TaskTemplate[]) => void;
  onApplyTemplateToToday: (template: TaskTemplate) => void;
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onOpenPlayModal: () => void;
  history: Record<string, DayRecord>;
  onUpdateHistory: (history: Record<string, DayRecord>) => void;
  todayTasks: TaskItem[];
  onUpdateTodayTasks: (tasks: TaskItem[]) => void;
}

const DEFAULT_SUBJECT_TASKS: Record<SubjectType, { title: string; desc: string }> = {
  hanzi: {
    title: '读背语文书生字表5个生字，田字格描红1行',
    desc: '读准字音，工整书写，注意握笔与坐姿',
  },
  pinyin: {
    title: '声母韵母拼读卡片练习 10 分钟',
    desc: '大声拼读，分清前后鼻音与平翘舌音',
  },
  math: {
    title: '数学口算天天练 1 页（10-20道）',
    desc: '认真计算，仔细检查，养成细心好习惯',
  },
  dubbing: {
    title: '英语原声短句跟读与趣配音 1 遍',
    desc: '模仿纯正语调，大声开口说英语',
  },
  reading: {
    title: '专注阅读精选绘本 15 分钟',
    desc: '安静阅读，读完后给爸爸妈妈简单分享故事',
  },
  sports: {
    title: '阳光活力运动：跳绳 100 个或户外跑步 20 分钟',
    desc: '强健体魄，保护视力，活力满满',
  },
  custom: {
    title: '自主好习惯养成练习',
    desc: '自觉自律，认真坚持',
  },
};

export const ParentAdminModal: React.FC<ParentAdminModalProps> = ({
  isOpen,
  onClose,
  templates,
  onSaveTemplates,
  onApplyTemplateToToday,
  settings,
  onUpdateSettings,
  onOpenPlayModal,
  history,
  onUpdateHistory,
  todayTasks,
  onUpdateTodayTasks,
}) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'calendar' | 'voice' | 'switch' | 'reminder' | 'update'>('templates');
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(0);
  const [editingTemplates, setEditingTemplates] = useState<TaskTemplate[]>(templates);
  const [testReminderSent, setTestReminderSent] = useState<boolean>(false);

  // Online Update state
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{ percent: number; current: number; total: number } | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadCompleted, setDownloadCompleted] = useState<boolean>(false);

  // Set up window download callbacks from Native Android UpdateManager
  useEffect(() => {
    window.onUpdateDownloadProgress = (percent: number, current: number, total: number) => {
      setIsDownloading(true);
      setDownloadProgress({ percent, current, total });
    };
    window.onUpdateDownloadSuccess = (_path: string) => {
      setIsDownloading(false);
      setDownloadCompleted(true);
    };
    window.onUpdateDownloadError = (err: string) => {
      setIsDownloading(false);
      setUpdateError('下载更新包失败: ' + err);
    };

    return () => {
      window.onUpdateDownloadProgress = undefined;
      window.onUpdateDownloadSuccess = undefined;
      window.onUpdateDownloadError = undefined;
    };
  }, []);

  const handleCheckUpdate = async (silent = false) => {
    setIsCheckingUpdate(true);
    setUpdateError(null);
    try {
      const info = await checkAppUpdate();
      setUpdateInfo(info);
      if (!silent) {
        soundEngine.playCoin();
      }
    } catch (e: any) {
      console.error('Update check failed:', e);
      if (!silent) {
        setUpdateError(e.message || '检测更新失败，请检查网络连接');
      }
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  // Check update silently when opening modal
  useEffect(() => {
    if (isOpen) {
      handleCheckUpdate(true);
    }
  }, [isOpen]);

  const handleStartDownloadAndInstall = () => {
    if (!updateInfo) return;
    soundEngine.playPop();
    setIsDownloading(true);
    setDownloadProgress({ percent: 0, current: 0, total: updateInfo.fileSize || 0 });
    setUpdateError(null);
    setDownloadCompleted(false);

    if (isAndroidApp()) {
      const ok = triggerNativeUpdateDownload(updateInfo.downloadUrl, updateInfo.latestVersion);
      if (!ok) {
        setIsDownloading(false);
        setUpdateError('无法唤起原生下载器，正为您打开浏览器下载...');
        window.open(updateInfo.downloadUrl, '_blank');
      }
    } else {
      // In web browser
      setIsDownloading(false);
      window.open(updateInfo.downloadUrl, '_blank');
    }
  };

  // History date selection
  const todayStr = getTodayDateString();
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string>(getDateOffset(-1));

  // New task form for historical day
  const [newHistSubject, setNewHistSubject] = useState<SubjectType>('reading');
  const [newHistTitle, setNewHistTitle] = useState<string>('');
  const [newHistMinutes, setNewHistMinutes] = useState<number>(5);

  // Manual balance adjustment input
  const [adjustInput, setAdjustInput] = useState<number>(10);

  // Voice test phrase
  const [previewText, setPreviewText] = useState<string>(
    '读背语文书生字表5个生字，做口算数学题，开心学拼音！'
  );
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);
  const [detectedLocalVoices, setDetectedLocalVoices] = useState<
    Array<{ name: string; lang: string; default: boolean; isChinese: boolean }>
  >([]);
  const [showVoiceDiagnostics, setShowVoiceDiagnostics] = useState<boolean>(false);

  useEffect(() => {
    const unsub = soundEngine.addLoadingListener(setIsAudioLoading);
    return unsub;
  }, []);

  const handleInspectVoices = () => {
    soundEngine.playPop();
    const list = soundEngine.getLocalChineseVoices();
    setDetectedLocalVoices(list);
    setShowVoiceDiagnostics(true);
  };

  const handlePreviewVoice = (engine: TTSEngineType, voiceId: string) => {
    if (isAudioLoading) return;
    soundEngine.playSwitchSnap();
    soundEngine.setTTSConfig({
      ttsEngine: engine,
      ttsVoice: voiceId,
      siliconflowApiKey: settings.siliconflowApiKey,
      azureApiKey: settings.azureApiKey,
      azureRegion: settings.azureRegion,
      googleApiKey: settings.googleApiKey,
    });
    const textToSpeak = previewText.trim() || '读背语文书生字表5个生字，做口算数学题，开心学拼音！';
    soundEngine.speak(textToSpeak, engine, voiceId);
  };

  if (!isOpen) return null;

  const currentTemplate = editingTemplates[selectedTemplateIndex] || editingTemplates[0];

  // 1. Template Management Handlers
  const handleUpdateTaskInTemplate = (
    taskIdx: number,
    updated: Partial<TemplateTask>
  ) => {
    const nextTemplates = [...editingTemplates];
    const currentTasks = [...nextTemplates[selectedTemplateIndex].tasks];
    currentTasks[taskIdx] = { ...currentTasks[taskIdx], ...updated };
    nextTemplates[selectedTemplateIndex] = {
      ...nextTemplates[selectedTemplateIndex],
      tasks: currentTasks,
    };
    setEditingTemplates(nextTemplates);
    onSaveTemplates(nextTemplates);
  };

  const handleToggleSubjectInTemplate = (subject: SubjectType) => {
    soundEngine.playPop();
    const nextTemplates = [...editingTemplates];
    const currentTasks = [...nextTemplates[selectedTemplateIndex].tasks];
    const existingIndex = currentTasks.findIndex((t) => t.subject === subject);

    if (existingIndex >= 0) {
      // Uncheck / remove from template
      currentTasks.splice(existingIndex, 1);
    } else {
      // Check / add to template
      const def = DEFAULT_SUBJECT_TASKS[subject] || {
        title: `${SUBJECT_CONFIGS[subject].name}练习打卡`,
        desc: '认真完成',
      };
      currentTasks.push({
        subject,
        title: def.title,
        description: def.desc,
        rewardMinutes: 5,
      });
    }

    nextTemplates[selectedTemplateIndex] = {
      ...nextTemplates[selectedTemplateIndex],
      tasks: currentTasks,
    };
    setEditingTemplates(nextTemplates);
    onSaveTemplates(nextTemplates);
  };

  const handleAddTaskToTemplate = () => {
    soundEngine.playPop();
    const nextTemplates = [...editingTemplates];
    const newTask: TemplateTask = {
      subject: 'sports',
      title: '阳光活力运动：跳绳或户外跑步 20 分钟',
      description: '舒展身体，保护视力',
      rewardMinutes: 5,
    };
    nextTemplates[selectedTemplateIndex].tasks.push(newTask);
    setEditingTemplates(nextTemplates);
    onSaveTemplates(nextTemplates);
  };

  const handleDeleteTaskFromTemplate = (taskIdx: number) => {
    soundEngine.playPop();
    const nextTemplates = [...editingTemplates];
    nextTemplates[selectedTemplateIndex].tasks.splice(taskIdx, 1);
    setEditingTemplates(nextTemplates);
    onSaveTemplates(nextTemplates);
  };

  const handleAdjustBalance = (delta: number) => {
    soundEngine.playPop();
    const next = Math.max(0, settings.balanceMinutes + delta);
    onUpdateSettings({ ...settings, balanceMinutes: next });
  };

  // 2. Historical Calendar Management Handlers
  const getSelectedDayRecord = (): DayRecord | undefined => {
    if (selectedHistoryDate === todayStr) {
      return {
        date: todayStr,
        tasks: todayTasks,
        earnedMinutes: todayTasks.filter((t) => t.isCompleted).reduce((s, t) => s + t.rewardMinutes, 0),
        hasFullFiveCompleted: todayTasks.filter((t) => !t.isAutoHabit && t.isCompleted).length >= 5,
        hasAutoHabit: todayTasks.some((t) => t.isAutoHabit && t.isCompleted),
        allCompleted: todayTasks.length > 0 && todayTasks.every((t) => t.isCompleted),
      };
    }
    return history[selectedHistoryDate];
  };

  const handleInitHistoryDay = (date: string) => {
    soundEngine.playPop();
    const baseTemplate = editingTemplates[0] || templates[0];
    const initialTasks = createTasksFromTemplate(baseTemplate);

    const newRecord: DayRecord = {
      date,
      tasks: initialTasks,
      earnedMinutes: 0,
      hasFullFiveCompleted: false,
      hasAutoHabit: false,
      allCompleted: false,
    };

    const nextHistory = { ...history, [date]: newRecord };
    onUpdateHistory(nextHistory);
    if (date === todayStr) {
      onUpdateTodayTasks(initialTasks);
    }
  };

  const handleToggleHistoryTask = (date: string, taskId: string) => {
    const dayRec = getSelectedDayRecord();
    if (!dayRec) return;

    let balanceDelta = 0;
    let nextTasks = [...dayRec.tasks];
    const targetIdx = nextTasks.findIndex((t) => t.id === taskId);
    if (targetIdx === -1) return;

    const task = nextTasks[targetIdx];
    const willBeCompleted = !task.isCompleted;

    if (willBeCompleted) {
      soundEngine.playCoin();
      balanceDelta += task.rewardMinutes || 5;
      nextTasks[targetIdx] = {
        ...task,
        isCompleted: true,
        completedAt: new Date().toISOString(),
      };

      // Check if required number of regular subjects completed -> unlock auto habit
      const regularTasks = nextTasks.filter((t) => !t.isAutoHabit);
      const requiredCount = settings.requiredTasksForHabit ?? 5;
      const completedRegularCount = regularTasks.filter((t) => t.isCompleted).length;
      const isHabitUnlocked = completedRegularCount >= requiredCount;
      const alreadyHasHabit = nextTasks.some((t) => t.isAutoHabit);
      const habitMins = settings.habitRewardMinutes ?? 5;

      if (isHabitUnlocked && !alreadyHasHabit) {
        const autoHabit: TaskItem = {
          id: `hist-habit-${date}-${Date.now()}`,
          subject: 'custom',
          title: `好习惯自动奖励：${requiredCount}门学科满勤完成！`,
          description: `当日已自觉按时完成 ${requiredCount} 门学科，系统自动解锁好习惯大奖`,
          rewardMinutes: habitMins,
          isCompleted: true,
          completedAt: new Date().toISOString(),
          isAutoHabit: true,
        };
        nextTasks.push(autoHabit);
        balanceDelta += habitMins;
      }
    } else {
      soundEngine.playPop();
      balanceDelta -= task.rewardMinutes || 5;
      nextTasks[targetIdx] = {
        ...task,
        isCompleted: false,
        completedAt: undefined,
      };

      // If regular completed count drops below threshold, remove auto habit if present
      const regularTasks = nextTasks.filter((t) => !t.isAutoHabit);
      const requiredCount = settings.requiredTasksForHabit ?? 5;
      const completedRegularCount = regularTasks.filter((t) => t.isCompleted).length;
      const isHabitUnlocked = completedRegularCount >= requiredCount;
      if (!isHabitUnlocked) {
        const habitTask = nextTasks.find((t) => t.isAutoHabit);
        if (habitTask && habitTask.isCompleted) {
          balanceDelta -= (habitTask.rewardMinutes || 5);
        }
        nextTasks = nextTasks.filter((t) => !t.isAutoHabit);
      }
    }

    const currentRegular = nextTasks.filter((t) => !t.isAutoHabit);
    const requiredCount = settings.requiredTasksForHabit ?? 5;
    const currentCompleted = currentRegular.filter((t) => t.isCompleted).length;
    const updatedDayRecord: DayRecord = {
      date,
      tasks: nextTasks,
      earnedMinutes: nextTasks.filter((t) => t.isCompleted).reduce((s, t) => s + t.rewardMinutes, 0),
      hasFullFiveCompleted: currentCompleted >= requiredCount,
      hasAutoHabit: nextTasks.some((t) => t.isAutoHabit && t.isCompleted),
      allCompleted: nextTasks.length > 0 && nextTasks.every((t) => t.isCompleted),
    };

    const nextHistory = { ...history, [date]: updatedDayRecord };
    onUpdateHistory(nextHistory);
    if (date === todayStr) {
      onUpdateTodayTasks(nextTasks);
    }
    const newBalance = Math.max(0, settings.balanceMinutes + balanceDelta);
    onUpdateSettings({ ...settings, balanceMinutes: newBalance });
  };

  const handleDeleteHistoryTask = (date: string, taskId: string) => {
    soundEngine.playPop();
    const dayRec = getSelectedDayRecord();
    if (!dayRec) return;

    let balanceDelta = 0;
    const taskToDelete = dayRec.tasks.find((t) => t.id === taskId);
    if (taskToDelete && taskToDelete.isCompleted) {
      balanceDelta -= taskToDelete.rewardMinutes || 5;
    }

    let nextTasks = dayRec.tasks.filter((t) => t.id !== taskId);

    // If regular completed count drops below threshold, remove auto habit
    const currentRegular = nextTasks.filter((t) => !t.isAutoHabit);
    const requiredCount = settings.requiredTasksForHabit ?? 5;
    const currentCompleted = currentRegular.filter((t) => t.isCompleted).length;
    const isHabitUnlocked = currentCompleted >= requiredCount;
    if (!isHabitUnlocked) {
      const habitTask = nextTasks.find((t) => t.isAutoHabit);
      if (habitTask && habitTask.isCompleted) {
        balanceDelta -= (habitTask.rewardMinutes || 5);
      }
      nextTasks = nextTasks.filter((t) => !t.isAutoHabit);
    }

    const finalRegular = nextTasks.filter((t) => !t.isAutoHabit);
    const finalCompleted = finalRegular.filter((t) => t.isCompleted).length;
    const updatedDayRecord: DayRecord = {
      date,
      tasks: nextTasks,
      earnedMinutes: nextTasks.filter((t) => t.isCompleted).reduce((s, t) => s + t.rewardMinutes, 0),
      hasFullFiveCompleted: finalCompleted >= requiredCount,
      hasAutoHabit: nextTasks.some((t) => t.isAutoHabit && t.isCompleted),
      allCompleted: nextTasks.length > 0 && nextTasks.every((t) => t.isCompleted),
    };

    const nextHistory = { ...history, [date]: updatedDayRecord };
    onUpdateHistory(nextHistory);
    if (date === todayStr) {
      onUpdateTodayTasks(nextTasks);
    }
    if (balanceDelta !== 0) {
      const newBalance = Math.max(0, settings.balanceMinutes + balanceDelta);
      onUpdateSettings({ ...settings, balanceMinutes: newBalance });
    }
  };

  const handleAddHistoryTask = (date: string) => {
    if (!newHistTitle.trim()) return;
    soundEngine.playPop();

    const dayRec = getSelectedDayRecord();
    const currentTasks = dayRec ? [...dayRec.tasks] : [];

    const newTask: TaskItem = {
      id: `hist-task-${Date.now()}`,
      subject: newHistSubject,
      title: newHistTitle.trim(),
      description: '家长历史补录任务',
      rewardMinutes: newHistMinutes || 5,
      isCompleted: false,
    };

    const nextTasks = [...currentTasks, newTask];
    const currentRegular = nextTasks.filter((t) => !t.isAutoHabit);
    const updatedDayRecord: DayRecord = {
      date,
      tasks: nextTasks,
      earnedMinutes: nextTasks.filter((t) => t.isCompleted).reduce((s, t) => s + t.rewardMinutes, 0),
      hasFullFiveCompleted: currentRegular.length > 0 && currentRegular.every((t) => t.isCompleted),
      hasAutoHabit: nextTasks.some((t) => t.isAutoHabit && t.isCompleted),
      allCompleted: nextTasks.length > 0 && nextTasks.every((t) => t.isCompleted),
    };

    const nextHistory = { ...history, [date]: updatedDayRecord };
    onUpdateHistory(nextHistory);
    if (date === todayStr) {
      onUpdateTodayTasks(nextTasks);
    }
    setNewHistTitle('');
  };

  const handleOneClickFullAttendance = (date: string) => {
    soundEngine.playFanfare();
    const dayRec = getSelectedDayRecord();
    const currentTasks = dayRec ? [...dayRec.tasks] : createTasksFromTemplate(editingTemplates[0]);

    let addedMinutes = 0;
    let nextTasks = currentTasks.map((t) => {
      if (!t.isCompleted) {
        addedMinutes += t.rewardMinutes || 5;
        return { ...t, isCompleted: true, completedAt: new Date().toISOString() };
      }
      return t;
    });

    // Check if auto habit exists
    const hasHabit = nextTasks.some((t) => t.isAutoHabit);
    const habitMins = settings.habitRewardMinutes ?? 5;
    const regularTasks = nextTasks.filter((t) => !t.isAutoHabit);
    if (!hasHabit && regularTasks.length > 0) {
      const autoHabit: TaskItem = {
        id: `hist-habit-${date}-${Date.now()}`,
        subject: 'custom',
        title: '好习惯自动奖励：当日全勤满分！',
        description: '当日已自觉按时完成所有基础学科，系统自动解锁好习惯大奖',
        rewardMinutes: habitMins,
        isCompleted: true,
        completedAt: new Date().toISOString(),
        isAutoHabit: true,
      };
      nextTasks.push(autoHabit);
      addedMinutes += habitMins;
    }

    const updatedDayRecord: DayRecord = {
      date,
      tasks: nextTasks,
      earnedMinutes: nextTasks.filter((t) => t.isCompleted).reduce((s, t) => s + t.rewardMinutes, 0),
      hasFullFiveCompleted: true,
      hasAutoHabit: true,
      allCompleted: true,
    };

    const nextHistory = { ...history, [date]: updatedDayRecord };
    onUpdateHistory(nextHistory);
    if (date === todayStr) {
      onUpdateTodayTasks(nextTasks);
    }
    if (addedMinutes > 0) {
      const newBalance = settings.balanceMinutes + addedMinutes;
      onUpdateSettings({ ...settings, balanceMinutes: newBalance });
    }
  };

  const currentHistRecord = getSelectedDayRecord();
  const subjectsList: SubjectType[] = ['hanzi', 'pinyin', 'math', 'dubbing', 'reading', 'sports', 'custom'];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border-4 border-slate-700 relative animate-in fade-in zoom-in-95 duration-200 max-h-[94vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => {
            soundEngine.playPop();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Top Header */}
        <div className="flex flex-wrap items-center justify-between border-b pb-3 mb-3 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-slate-800 flex items-center gap-1.5">
                <span>🛡️ 家长管理后台</span>
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Cloud className="w-3 h-3 text-emerald-600" />
                云端优先 (Cloudflare KV)
              </span>
              {isAndroidApp() ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-300 animate-pulse">
                  <Smartphone className="w-3 h-3 text-indigo-600" />
                  🤖 安卓原生 APP 环境 (Native TTS & Alarm 就绪)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-300">
                  🌐 网页端环境 (支持 iPad/电脑)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              学科模板定制、历史补卡、每日定时闹铃与周末 Switch 畅玩（数据优先写入云端，离线自动保底）
            </p>
          </div>

          {/* Navigation Tabs (Templates, Calendar Retro-Checkin, Reminder Alarm, Voice, Switch Play) */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl flex-wrap">
            <button
              onClick={() => {
                soundEngine.playPop();
                setActiveTab('templates');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                activeTab === 'templates' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
              }`}
            >
              <LayoutTemplate className="w-3.5 h-3.5 text-amber-600" />
              <span>模板管理</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playPop();
                setActiveTab('calendar');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                activeTab === 'calendar' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 text-sky-600" />
              <span>历史补卡与日历</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playPop();
                setActiveTab('reminder');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                activeTab === 'reminder' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-amber-500" />
              <span>定时闹铃</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playPop();
                setActiveTab('voice');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                activeTab === 'voice' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-purple-600" />
              <span>语音引擎与音色</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playPop();
                setActiveTab('switch');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                activeTab === 'switch' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5 text-red-500" />
              <span>开启周末畅玩</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playPop();
                setActiveTab('update');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                activeTab === 'update' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
              }`}
            >
              <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>版本与更新</span>
              {updateInfo?.hasUpdate && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* TAB 1: 模板管理 (Template Management) */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              {/* Template Switcher */}
              <div className="flex items-center justify-between gap-2 bg-amber-50/70 p-3 rounded-2xl border border-amber-200">
                <div className="flex gap-2">
                  {editingTemplates.map((tmpl, idx) => (
                    <button
                      key={tmpl.id}
                      onClick={() => {
                        soundEngine.playPop();
                        setSelectedTemplateIndex(idx);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        selectedTemplateIndex === idx
                          ? 'bg-amber-400 text-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 hover:bg-amber-100 border border-amber-200'
                      }`}
                    >
                      {tmpl.name.slice(0, 10)}...
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    soundEngine.playFanfare();
                    onApplyTemplateToToday(currentTemplate);
                    alert(`已将【${currentTemplate.name}】成功推送到今日打卡清单！`);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs shadow hover:scale-105 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>推送到今日清单</span>
                </button>
              </div>

              {/* Child Profile & Incentive Rules */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3.5 rounded-2xl border border-indigo-200">
                <div className="text-xs font-black text-indigo-900 mb-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>⚙️ 孩子档案与激励时间规则配置</span>
                  </span>
                  <span className="text-[11px] text-indigo-600 font-normal">
                    自由配置时长，绝不锁死任何时间数值
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* Child Name */}
                  <div className="bg-white p-2.5 rounded-xl border border-indigo-100 flex flex-col justify-between">
                    <label className="text-[11px] font-bold text-slate-600 mb-1">
                      👦 孩子称呼：
                    </label>
                    <input
                      type="text"
                      value={settings.childName || '诚诚'}
                      onChange={(e) => onUpdateSettings({ ...settings, childName: e.target.value.trim() || '宝贝' })}
                      className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                      placeholder="如：诚诚"
                    />
                  </div>

                  {/* Habit Required Tasks Threshold */}
                  <div className="bg-white p-2.5 rounded-xl border border-indigo-100 flex flex-col justify-between">
                    <label className="text-[11px] font-bold text-slate-600 mb-1">
                      🎯 好习惯达标门槛：
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-500">满</span>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={settings.requiredTasksForHabit ?? 5}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...settings,
                            requiredTasksForHabit: Math.max(1, parseInt(e.target.value) || 1),
                          })
                        }
                        className="w-14 px-2 py-1 rounded-lg border border-slate-300 text-xs font-black font-mono text-center focus:outline-none focus:border-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-600">项触发</span>
                    </div>
                  </div>

                  {/* Daily Habit Bonus Minutes */}
                  <div className="bg-white p-2.5 rounded-xl border border-indigo-100 flex flex-col justify-between">
                    <label className="text-[11px] font-bold text-slate-600 mb-1">
                      ⭐ 好习惯奖励时长：
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-500">+</span>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={settings.habitRewardMinutes ?? 5}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...settings,
                            habitRewardMinutes: Math.max(1, parseInt(e.target.value) || 1),
                          })
                        }
                        className="w-14 px-2 py-1 rounded-lg border border-slate-300 text-xs font-black font-mono text-center focus:outline-none focus:border-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-600">分钟</span>
                    </div>
                  </div>

                  {/* Weekly Full Attendance Bonus Minutes */}
                  <div className="bg-white p-2.5 rounded-xl border border-indigo-100 flex flex-col justify-between">
                    <label className="text-[11px] font-bold text-slate-600 mb-1">
                      🏆 五天全勤大奖：
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-500">+</span>
                      <input
                        type="number"
                        min="1"
                        max="240"
                        value={settings.weeklyBonusMinutes ?? 15}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...settings,
                            weeklyBonusMinutes: Math.max(1, parseInt(e.target.value) || 1),
                          })
                        }
                        className="w-14 px-2 py-1 rounded-lg border border-slate-300 text-xs font-black font-mono text-center focus:outline-none focus:border-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-600">分钟</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requirement 1: Subject Checklist (运动项可在后台勾选，默认仅5项) */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                  <span>学科包含勾选（满 {settings.requiredTasksForHabit ?? 5} 项自动解锁好习惯，当前启用 {currentTemplate.tasks.length} 科）：</span>
                  <span className="text-[11px] text-amber-800 font-mono font-bold">
                    当前启用 {currentTemplate.tasks.length} 科
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {subjectsList.filter((s) => s !== 'custom').map((s) => {
                    const conf = SUBJECT_CONFIGS[s];
                    const isIncluded = currentTemplate.tasks.some((t) => t.subject === s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleToggleSubjectInTemplate(s)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                          isIncluded
                            ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-black ${
                            isIncluded ? 'bg-amber-500 text-white' : 'border border-slate-300'
                          }`}
                        >
                          {isIncluded ? '✓' : ''}
                        </span>
                        <span>
                          {conf.icon} {conf.name}
                        </span>
                        {s === 'sports' && !isIncluded && (
                          <span className="text-[10px] text-orange-600 bg-orange-100/70 px-1.5 py-0.5 rounded font-normal">
                            可选勾选
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Template Tasks Editor */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>模板详细任务项（每科完成奖励可灵活设定）：</span>
                  <button
                    onClick={handleAddTaskToTemplate}
                    className="text-emerald-700 hover:underline flex items-center gap-1 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>添加自选科目</span>
                  </button>
                </div>

                {currentTemplate.tasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                  >
                    {/* Subject Selector */}
                    <select
                      value={task.subject}
                      onChange={(e) =>
                        handleUpdateTaskInTemplate(idx, {
                          subject: e.target.value as SubjectType,
                        })
                      }
                      className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700"
                    >
                      {subjectsList.map((s) => (
                        <option key={s} value={s}>
                          {SUBJECT_CONFIGS[s].icon} {SUBJECT_CONFIGS[s].name}
                        </option>
                      ))}
                    </select>

                    {/* Task Title */}
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) =>
                        handleUpdateTaskInTemplate(idx, { title: e.target.value })
                      }
                      placeholder="任务内容要求"
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800"
                    />

                    {/* Editable Reward Minutes */}
                    <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 flex-shrink-0">
                      <span className="text-xs font-bold text-amber-800">+</span>
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={task.rewardMinutes ?? 5}
                        onChange={(e) =>
                          handleUpdateTaskInTemplate(idx, {
                            rewardMinutes: Math.max(1, parseInt(e.target.value) || 1),
                          })
                        }
                        className="w-12 text-center text-xs font-black font-mono bg-white border border-amber-300 rounded-lg py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <span className="text-xs font-bold text-amber-800">分钟</span>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteTaskFromTemplate(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                      title="删除此项"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: 历史补卡与日历管理 (Requirement 2: History Retroactive Check-in) */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              {/* Date Selection Bar */}
              <div className="bg-sky-50/70 p-3.5 rounded-2xl border border-sky-200">
                <div className="text-xs font-bold text-sky-900 mb-2 flex items-center justify-between">
                  <span>选择需要补打卡或修改的历史日期：</span>
                  <span className="text-[11px] text-sky-700 font-mono">
                    今天：{todayStr}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Quick past day buttons */}
                  {[
                    { label: '昨天', offset: -1 },
                    { label: '前天', offset: -2 },
                    { label: '3天前', offset: -3 },
                    { label: '4天前', offset: -4 },
                  ].map((p) => {
                    const dateStr = getDateOffset(p.offset);
                    const isSelected = selectedHistoryDate === dateStr;
                    return (
                      <button
                        key={p.offset}
                        onClick={() => {
                          soundEngine.playPop();
                          setSelectedHistoryDate(dateStr);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'bg-white border border-sky-200 text-sky-800 hover:bg-sky-100'
                        }`}
                      >
                        {p.label} ({dateStr.slice(5)})
                      </button>
                    );
                  })}

                  {/* Native Date Picker */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-xs text-slate-500 font-bold">任意日期:</span>
                    <input
                      type="date"
                      max={todayStr}
                      value={selectedHistoryDate}
                      onChange={(e) => {
                        soundEngine.playPop();
                        setSelectedHistoryDate(e.target.value);
                      }}
                      className="px-2.5 py-1.5 rounded-xl border border-sky-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Day Record Content */}
              {!currentHistRecord ? (
                /* Empty state: prompt to generate tasks for that day */
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl p-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2 font-bold">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black text-slate-800">
                    该历史日（{selectedHistoryDate}）暂无打卡数据
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    可能当时家长忘记给孩子打开网页打卡。您可以一键载入标准模板清单，然后勾选补录孩子实际完成的项目：
                  </p>
                  <button
                    onClick={() => handleInitHistoryDay(selectedHistoryDate)}
                    className="mt-4 px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black shadow-md flex items-center gap-2 mx-auto transition-transform hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>为【{selectedHistoryDate}】载入打卡清单并开始补卡</span>
                  </button>
                </div>
              ) : (
                /* Historical Day Tasks Management */
                <div className="space-y-3">
                  {/* Status Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800">
                        📅 {selectedHistoryDate} 打卡记录
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        已完成: {currentHistRecord.tasks.filter((t) => t.isCompleted).length} /{' '}
                        {currentHistRecord.tasks.length} 项
                      </span>
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                        +{currentHistRecord.earnedMinutes} 分钟
                      </span>
                    </div>

                    <button
                      onClick={() => handleOneClickFullAttendance(selectedHistoryDate)}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black shadow flex items-center gap-1.5 transition-transform hover:scale-105 active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>🌟 一键全勤满分补卡</span>
                    </button>
                  </div>

                  {/* Tasks List for Selected Historical Date */}
                  <div className="space-y-2">
                    {currentHistRecord.tasks.map((task) => {
                      const conf = SUBJECT_CONFIGS[task.subject] || SUBJECT_CONFIGS.custom;
                      return (
                        <div
                          key={task.id}
                          className={`p-3 rounded-2xl border-2 flex items-center justify-between gap-2 transition-all ${
                            task.isCompleted
                              ? 'bg-emerald-50/70 border-emerald-300 text-slate-800'
                              : 'bg-slate-50 border-slate-200 text-slate-500 opacity-80'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 flex-shrink-0">
                              {conf.icon} {conf.name}
                            </span>
                            <div className="truncate">
                              <span
                                className={`text-xs font-bold block truncate ${
                                  task.isCompleted ? 'text-slate-800' : 'text-slate-600'
                                }`}
                              >
                                {task.title}
                              </span>
                              {task.isAutoHabit && (
                                <span className="text-[10px] text-emerald-700 font-bold">
                                  ★ 全科达标好习惯自动奖励
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Toggle Button */}
                            <button
                              onClick={() => handleToggleHistoryTask(selectedHistoryDate, task.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition-all ${
                                task.isCompleted
                                  ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                                  : 'bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {task.isCompleted ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>已完成 (+{task.rewardMinutes}分)</span>
                                </>
                              ) : (
                                <>
                                  <Circle className="w-3.5 h-3.5" />
                                  <span>点击补打卡 (+{task.rewardMinutes}分)</span>
                                </>
                              )}
                            </button>

                            {/* Delete Task from History */}
                            <button
                              onClick={() => handleDeleteHistoryTask(selectedHistoryDate, task.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                              title="删除此项打卡记录"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Missing Task Form */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="text-xs font-bold text-slate-700 mb-2">
                      为【{selectedHistoryDate}】补录额外任务项：
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <select
                        value={newHistSubject}
                        onChange={(e) => setNewHistSubject(e.target.value as SubjectType)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700"
                      >
                        {subjectsList.map((s) => (
                          <option key={s} value={s}>
                            {SUBJECT_CONFIGS[s].icon} {SUBJECT_CONFIGS[s].name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={newHistTitle}
                        onChange={(e) => setNewHistTitle(e.target.value)}
                        placeholder="如：补读课外绘本、跳绳200下"
                        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800"
                      />

                      <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-slate-300 flex-shrink-0">
                        <span className="text-xs font-bold text-slate-500">+</span>
                        <input
                          type="number"
                          min="1"
                          max="180"
                          value={newHistMinutes}
                          onChange={(e) => setNewHistMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-12 text-center text-xs font-black font-mono border-none focus:outline-none"
                        />
                        <span className="text-xs font-bold text-slate-500">分钟</span>
                      </div>

                      <button
                        onClick={() => handleAddHistoryTask(selectedHistoryDate)}
                        disabled={!newHistTitle.trim()}
                        className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-all disabled:opacity-50 flex items-center justify-center gap-1 flex-shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>添加至该日</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: 语音与音色设置 (TTS Model & Voice Settings) */}
          {activeTab === 'voice' && (
            <div className="space-y-4">
              {/* Header Info */}
              <div className="bg-purple-50/80 p-3.5 rounded-2xl border border-purple-200">
                <div className="flex items-center gap-2 mb-1">
                  <Volume2 className="w-5 h-5 text-purple-700" />
                  <h4 className="text-sm font-black text-purple-950">
                    发音引擎与多模型音色库配置
                  </h4>
                </div>
                <p className="text-xs text-purple-800 leading-relaxed">
                  针对一年级多音字（如读背、数学、音乐）与生动伴读需求，支持自由切换阿里大模型、微软神经语音与本地引擎，并可即时试听对比。
                </p>
              </div>

              {/* Engine Select Cards (4 Providers) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 1. SiliconFlow CosyVoice2 */}
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playPop();
                    onUpdateSettings({
                      ...settings,
                      ttsEngine: 'siliconflow',
                      ttsVoice: settings.ttsVoice.startsWith('FunAudioLLM')
                        ? settings.ttsVoice
                        : 'FunAudioLLM/CosyVoice2-0.5B:claire',
                    });
                  }}
                  className={`p-3 rounded-2xl border-2 text-left transition-all relative ${
                    settings.ttsEngine === 'siliconflow'
                      ? 'bg-purple-100/60 border-purple-500 shadow-md ring-2 ring-purple-400/30'
                      : 'bg-white border-slate-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                      <span>🌟 阿里 CosyVoice2</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-200/80 text-purple-900 font-bold">
                      大模型
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    阿里通义大模型，拟真度极高，生字智能识别。
                  </p>
                </button>

                {/* 2. Microsoft Azure Speech */}
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playPop();
                    onUpdateSettings({
                      ...settings,
                      ttsEngine: 'azure',
                      ttsVoice: settings.ttsVoice.startsWith('zh-CN')
                        ? settings.ttsVoice
                        : 'zh-CN-XiaoxiaoNeural',
                    });
                  }}
                  className={`p-3 rounded-2xl border-2 text-left transition-all relative ${
                    settings.ttsEngine === 'azure'
                      ? 'bg-sky-100/60 border-sky-500 shadow-md ring-2 ring-sky-400/30'
                      : 'bg-white border-slate-200 hover:border-sky-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                      <span>🔷 微软 Azure 官方</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-200/80 text-sky-900 font-bold">
                      官方名师
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    Azure 官方神经语音，包含晓晓/云希等 8 款童音。
                  </p>
                </button>

                {/* 3. Google Cloud TTS */}
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playPop();
                    onUpdateSettings({
                      ...settings,
                      ttsEngine: 'google',
                      ttsVoice: settings.ttsVoice.startsWith('cmn-CN')
                        ? settings.ttsVoice
                        : 'cmn-CN-Chirp3-HD-Achernar',
                    });
                  }}
                  className={`p-3 rounded-2xl border-2 text-left transition-all relative ${
                    settings.ttsEngine === 'google'
                      ? 'bg-rose-100/60 border-rose-500 shadow-md ring-2 ring-rose-400/30'
                      : 'bg-white border-slate-200 hover:border-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                      <span>🔴 谷歌云 TTS</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-200/80 text-rose-900 font-bold">
                      Chirp3-HD
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    Google 最新超高清 Chirp3-HD 与经典 WaveNet。
                  </p>
                </button>

                {/* 4. Browser Local (Android / iOS Offline) */}
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playPop();
                    onUpdateSettings({
                      ...settings,
                      ttsEngine: 'browser',
                    });
                  }}
                  className={`p-3 rounded-2xl border-2 text-left transition-all relative ${
                    settings.ttsEngine === 'browser'
                      ? 'bg-amber-100/60 border-amber-500 shadow-md ring-2 ring-amber-400/30'
                      : 'bg-white border-slate-200 hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                      <span>📱 本地离线发音</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900 font-bold">
                      安卓/iOS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    平板系统自带发音，断网保底，内置同音字纠偏。
                  </p>
                </button>
              </div>

              {/* Section 1: SiliconFlow Config & Voices */}
              {settings.ttsEngine === 'siliconflow' && (
                <div className="space-y-3">
                  {/* API Key Input */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 flex-shrink-0">
                      <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                      <span>硅基流动 API Key：</span>
                    </div>
                    <input
                      type="text"
                      value={settings.siliconflowApiKey || ''}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          siliconflowApiKey: e.target.value.trim(),
                        })
                      }
                      placeholder="sk-bztig..."
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-mono font-bold text-slate-800"
                    />
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg font-bold flex-shrink-0 text-center">
                      ✓ 密钥已就绪
                    </span>
                  </div>

                  {/* Voices Grid */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>CosyVoice2 专属预置音色库（点击直接选用）：</span>
                      <span className="text-[11px] text-purple-700 font-bold font-mono">
                        共 8 款可选
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {SILICONFLOW_VOICES.map((v) => {
                        const isSelected = settings.ttsVoice === v.id;
                        return (
                          <div
                            key={v.id}
                            onClick={() => {
                              soundEngine.playPop();
                              onUpdateSettings({ ...settings, ttsVoice: v.id });
                            }}
                            className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-purple-50 border-purple-500 shadow-sm'
                                : 'bg-white border-slate-200 hover:border-purple-200'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black text-slate-800">
                                  {v.name}
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                                  {v.tag}
                                </span>
                                {isSelected && (
                                  <span className="text-[10px] font-black text-emerald-600">
                                    ✓ 当前选用
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                {v.desc}
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={isAudioLoading}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewVoice('siliconflow', v.id);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black flex items-center gap-1 shadow-sm flex-shrink-0 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                              title="试听发音"
                            >
                              {isAudioLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Play className="w-3 h-3 fill-current" />
                              )}
                              <span>{isAudioLoading ? '生成中...' : '试听'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Section 2: Microsoft Azure Speech Config & Voices */}
              {settings.ttsEngine === 'azure' && (
                <div className="space-y-3">
                  {/* Azure Key and Region Inputs */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 flex-shrink-0">
                      <KeyRound className="w-3.5 h-3.5 text-sky-600" />
                      <span>Azure Key：</span>
                    </div>
                    <input
                      type="text"
                      value={settings.azureApiKey || ''}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          azureApiKey: e.target.value.trim(),
                        })
                      }
                      placeholder="EnNTfoTVg..."
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-mono font-bold text-slate-800"
                    />
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs font-bold text-slate-600">区域：</span>
                      <input
                        type="text"
                        value={settings.azureRegion || 'westus2'}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...settings,
                            azureRegion: e.target.value.trim(),
                          })
                        }
                        placeholder="westus2"
                        className="w-24 px-2 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-mono font-bold text-slate-800 text-center"
                      />
                    </div>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg font-bold flex-shrink-0 text-center">
                      ✓ 官方节点已连接
                    </span>
                  </div>

                  {/* Azure Voices Grid */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>微软 Azure 官方神经音色库（点击直接选用）：</span>
                      <span className="text-[11px] text-sky-700 font-bold font-mono">
                        共 8 款官方名师童音
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {AZURE_VOICES.map((v) => {
                        const isSelected = settings.ttsVoice === v.id;
                        return (
                          <div
                            key={v.id}
                            onClick={() => {
                              soundEngine.playPop();
                              onUpdateSettings({ ...settings, ttsVoice: v.id });
                            }}
                            className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-sky-50 border-sky-500 shadow-sm'
                                : 'bg-white border-slate-200 hover:border-sky-200'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black text-slate-800">
                                  {v.name}
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800">
                                  {v.tag}
                                </span>
                                {isSelected && (
                                  <span className="text-[10px] font-black text-emerald-600">
                                    ✓ 当前选用
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                {v.desc}
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={isAudioLoading}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewVoice('azure', v.id);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black flex items-center gap-1 shadow-sm flex-shrink-0 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                              title="试听发音"
                            >
                              {isAudioLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Play className="w-3 h-3 fill-current" />
                              )}
                              <span>{isAudioLoading ? '生成中...' : '试听'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Section 3: Google Cloud TTS Config & Voices */}
              {settings.ttsEngine === 'google' && (
                <div className="space-y-3">
                  {/* Google Key Input */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 flex-shrink-0">
                      <KeyRound className="w-3.5 h-3.5 text-rose-600" />
                      <span>Google Cloud API Key：</span>
                    </div>
                    <input
                      type="text"
                      value={settings.googleApiKey || ''}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          googleApiKey: e.target.value.trim(),
                        })
                      }
                      placeholder="AIzaSyBC..."
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-mono font-bold text-slate-800"
                    />
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg font-bold flex-shrink-0 text-center">
                      ✓ 谷歌云已就绪
                    </span>
                  </div>

                  {/* Google Voices Grid */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>谷歌云 Chirp3-HD 高清 & WaveNet 音色库（点击直接选用）：</span>
                      <span className="text-[11px] text-rose-700 font-bold font-mono">
                        共 7 款精选音色
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {GOOGLE_VOICES.map((v) => {
                        const isSelected = settings.ttsVoice === v.id;
                        return (
                          <div
                            key={v.id}
                            onClick={() => {
                              soundEngine.playPop();
                              onUpdateSettings({ ...settings, ttsVoice: v.id });
                            }}
                            className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-rose-50 border-rose-500 shadow-sm'
                                : 'bg-white border-slate-200 hover:border-rose-200'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black text-slate-800">
                                  {v.name}
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                                  {v.tag}
                                </span>
                                {isSelected && (
                                  <span className="text-[10px] font-black text-emerald-600">
                                    ✓ 当前选用
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                {v.desc}
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={isAudioLoading}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewVoice('google', v.id);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-1 shadow-sm flex-shrink-0 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                              title="试听发音"
                            >
                              {isAudioLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Play className="w-3 h-3 fill-current" />
                              )}
                              <span>{isAudioLoading ? '生成中...' : '试听'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Section 4: Browser Engine (Android / iPad Offline Optimized) */}
              {settings.ttsEngine === 'browser' && (
                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 text-left space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-black text-slate-800">
                        安卓平板 / iOS 离线兼容模式
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleInspectVoices}
                      className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-[11px] font-bold border border-amber-300 transition-colors"
                    >
                      🔍 检测当前设备已安装音色
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    已深度增强对 Android 设备（华为、小米、三星、荣耀等平板）的底层兼容：开启自动音频通道激活、修复 Android Chromium 垃圾回收断音 Bug、并内置一年级生字同音字纠偏。
                  </p>

                  {/* Voice Diagnostics result if inspected */}
                  {showVoiceDiagnostics && (
                    <div className="bg-white p-3 rounded-xl border border-amber-200 text-xs space-y-2">
                      <div className="font-bold text-slate-700 flex items-center justify-between">
                        <span>设备本地音色检测结果：</span>
                        <span className="text-[10px] text-slate-400">
                          共发现 {detectedLocalVoices.length} 款音色
                        </span>
                      </div>
                      <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                        {detectedLocalVoices.filter((v) => v.isChinese).length > 0 ? (
                          detectedLocalVoices
                            .filter((v) => v.isChinese)
                            .map((v, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between py-1 px-2 rounded bg-amber-50/80 text-[11px] text-slate-700"
                              >
                                <span className="font-medium truncate">{v.name}</span>
                                <span className="text-emerald-700 font-mono font-bold flex-shrink-0">
                                  {v.lang} {v.default ? '(默认)' : ''}
                                </span>
                              </div>
                            ))
                        ) : (
                          <div className="text-[11px] text-amber-700 py-1">
                            未直接检测到中文语音包，系统将调用默认语音引擎自动拼读。
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Android Guidance Card */}
                  <div className="bg-white/80 p-3 rounded-xl border border-amber-200/70 text-[11px] text-slate-500 space-y-1">
                    <p className="font-bold text-amber-900">💡 安卓平板离线使用排查小贴士：</p>
                    <p>
                      若在安卓离线状态下无发音，可在平板系统【设置】→【辅助功能 / 更多设置】→【文字转语音 (TTS)】中确认已选择系统语音引擎并下载了普通话语音包。
                    </p>
                  </div>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      disabled={isAudioLoading}
                      onClick={() => handlePreviewVoice('browser', '')}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAudioLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                      <span>{isAudioLoading ? '正在发音...' : '试听当前设备本地发音效果'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Live Test Phrase Bar */}
              <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800">
                <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                  <span>多音字对比测试语句（包含：读背、数学口算、快乐、还书）：</span>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewText('读背语文书生字表5个生字，做口算数学题，开心学拼音！')
                    }
                    className="text-[10px] text-purple-300 hover:underline"
                  >
                    重置例句
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-purple-400"
                  />
                  <button
                    type="button"
                    disabled={isAudioLoading}
                    onClick={() =>
                      handlePreviewVoice(settings.ttsEngine, settings.ttsVoice)
                    }
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs font-black flex items-center gap-1 shadow-md flex-shrink-0 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAudioLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>{isAudioLoading ? 'AI 生成中...' : '立即试听'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: 每日定时打卡闹铃管理 (Daily Scheduled Alarm / Notification) */}
          {activeTab === 'reminder' && (
            <div className="space-y-4">
              {/* Header Info */}
              <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200">
                <div className="flex items-center gap-2 mb-1">
                  <Bell className="w-5 h-5 text-amber-600" />
                  <h4 className="text-sm font-black text-amber-950">
                    每日打卡定时闹铃与放学提醒
                  </h4>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  为一年级孩子设置放学或晚间固定打卡提醒。时间可随孩子作息动态调整，支持系统级高优先级闹铃，即使平板熄屏或应用置于后台，时间一到也会准时响铃弹出。
                </p>
              </div>

              {/* Status & Toggle Switch Card */}
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                      settings.dailyReminderEnabled ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-slate-800">
                      每日定时打卡闹铃
                    </h5>
                    <p className="text-xs text-slate-500">
                      {settings.dailyReminderEnabled
                        ? `闹铃已开启：每天 ${settings.dailyReminderTime || '17:30'} 准时提醒`
                        : '当前已关闭定时闹铃'}
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.dailyReminderEnabled ?? true}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      soundEngine.playPop();
                      const next = { ...settings, dailyReminderEnabled: enabled };
                      onUpdateSettings(next);
                      syncDailyReminderToNative(
                        enabled,
                        next.dailyReminderTime || '17:30',
                        '⏰ 小勇士打卡提醒',
                        next.dailyReminderMessage
                      );
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Dynamic iOS Style Wheel Picker */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>选择每日提醒时间（iOS 滚轮上下滑动）：</span>
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    上下滚动时/分即可动态设定
                  </span>
                </div>

                {/* iOS Drum Roll Wheel Picker */}
                <IOSTimeWheelPicker
                  value={settings.dailyReminderTime || '17:30'}
                  onChange={(newTime) => {
                    const next = { ...settings, dailyReminderTime: newTime };
                    onUpdateSettings(next);
                    syncDailyReminderToNative(
                      next.dailyReminderEnabled ?? true,
                      newTime,
                      '⏰ 小勇士打卡提醒',
                      next.dailyReminderMessage
                    );
                  }}
                />
              </div>

              {/* Reminder Message Textarea */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700">
                    闹铃提醒与语音播报文案：
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const defMsg = '放学啦！小勇士记得完成今日 5 科打卡，积累周末 Switch 能量哦！';
                      const next = { ...settings, dailyReminderMessage: defMsg };
                      onUpdateSettings(next);
                      syncDailyReminderToNative(
                        next.dailyReminderEnabled ?? true,
                        next.dailyReminderTime || '17:30',
                        '⏰ 小勇士打卡提醒',
                        defMsg
                      );
                    }}
                    className="text-[10px] text-amber-700 hover:underline font-bold"
                  >
                    恢复默认文案
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={
                    settings.dailyReminderMessage ||
                    '放学啦！小勇士记得完成今日 5 科打卡，积累周末 Switch 能量哦！'
                  }
                  onChange={(e) => {
                    const msg = e.target.value;
                    const next = { ...settings, dailyReminderMessage: msg };
                    onUpdateSettings(next);
                    syncDailyReminderToNative(
                      next.dailyReminderEnabled ?? true,
                      next.dailyReminderTime || '17:30',
                      '⏰ 小勇士打卡提醒',
                      msg
                    );
                  }}
                  placeholder="请输入提醒文案..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Instant Test Button & Environmental Diagnostic */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-2xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h5 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>即时效果测试</span>
                  </h5>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    点击测试当前设备的声音通道与通知弹窗表现。
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playFanfare();
                      testNativeReminder(
                        '🔔 小勇士打卡闹铃测试',
                        settings.dailyReminderMessage || '放学啦！记得完成今日 5 科打卡哦！'
                      );
                      setTestReminderSent(true);
                      setTimeout(() => setTestReminderSent(false), 4000);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>{testReminderSent ? '已触发测试！' : '🔔 立即测试定时闹铃'}</span>
                  </button>
                </div>
              </div>

              {/* Native Capability Info Card */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-1">
                <div className="font-black flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {isAndroidApp()
                      ? '已运行于安卓原生壳：享受系统级准时唤醒'
                      : '当前处于网页浏览器端（如 iPad/Chrome/Safari）'}
                  </span>
                </div>
                <p className="text-[11px] text-blue-800/90 leading-relaxed">
                  {isAndroidApp()
                    ? '在安卓原生 APP 模式下，系统通过 AlarmManager 与 WakeLock 深度调度，锁屏或切到桌面均能在设定的时间准时弹出 Heads-Up 顶部高优先级通知并播放提醒。'
                    : '在通用网页端，定时提醒支持浏览器标准桌面通知（若已授权）。安装或运行配套的【KidsTodo 原生安卓壳】可获得即使休眠也能响铃的最高系统级保障。'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: 开启周末畅玩 (Weekend Switch Play) */}
          {activeTab === 'switch' && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-900 text-white p-6 rounded-3xl border-4 border-red-500 text-center">
                <span className="text-xs text-slate-400 font-bold tracking-wider">
                  NINTENDO SWITCH 周末能量金库
                </span>
                <div className="text-5xl font-black text-amber-400 my-2">
                  {settings.balanceMinutes} <span className="text-base text-slate-300">分钟</span>
                </div>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  孩子平日按时完成学科打卡、运动与好习惯积累的游戏时间。每周时间不设上限！
                </p>

                <div className="mt-5 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      soundEngine.playSwitchSnap();
                      onClose();
                      onOpenPlayModal();
                    }}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-black text-sm shadow-xl shadow-red-500/30 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Gamepad2 className="w-5 h-5" />
                    <span>立即开启周末畅玩倒计时</span>
                  </button>
                </div>
              </div>

              {/* Manual Balance Adjustment */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800">
                    家长自由调账（输入任意分钟数奖励或扣除）：
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500">
                    当前金库：<span className="font-mono text-amber-600 font-black">{settings.balanceMinutes}</span> 分钟
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border-2 border-slate-300">
                    <span className="text-xs font-bold text-slate-500">时长:</span>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={adjustInput}
                      onChange={(e) => setAdjustInput(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center text-sm font-black font-mono border-none focus:outline-none text-slate-900"
                    />
                    <span className="text-xs font-bold text-slate-600">分钟</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAdjustBalance(adjustInput)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm flex items-center gap-1 transition-all active:scale-95"
                  >
                    <span>+ 奖励发放 ({adjustInput} 分钟)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAdjustBalance(-adjustInput)}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-sm flex items-center gap-1 transition-all active:scale-95"
                  >
                    <span>- 扣除时长 ({adjustInput} 分钟)</span>
                  </button>
                </div>

                {/* Quick select chips */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 font-bold">快捷数字:</span>
                  {[5, 10, 15, 20, 30, 45, 60].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        soundEngine.playPop();
                        setAdjustInput(val);
                      }}
                      className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                        adjustInput === val
                          ? 'bg-amber-400 border-amber-500 text-slate-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {val}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: 版本与更新 (Software Version & Online Update) */}
          {activeTab === 'update' && (
            <div className="space-y-4">
              {/* Card 1: App Info & Status */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
                      <ArrowUpCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black text-slate-800">KidsTodo 小勇士自律打卡</h4>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-black bg-emerald-100 text-emerald-800">
                          v{updateInfo?.currentVersion || getNativeAppVersion()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {isAndroidApp()
                          ? '🟢 Android 原生应用环境（支持系统级休眠闹铃与自动覆盖安装）'
                          : '🌐 Web 云端运行环境（iPad / 电脑浏览器已自动保持云端最新）'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCheckUpdate(false)}
                    disabled={isCheckingUpdate || isDownloading}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-white text-xs font-black flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                  >
                    {isCheckingUpdate ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>正在检测...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>立即检测新版本</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Error Banner if any */}
                {updateError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{updateError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCheckUpdate(false)}
                      className="text-xs underline font-bold hover:text-rose-900"
                    >
                      重试
                    </button>
                  </div>
                )}
              </div>

              {/* Card 2: Update Detection Result */}
              {updateInfo ? (
                updateInfo.hasUpdate ? (
                  // New Version Available
                  <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white p-5 rounded-2xl border-2 border-emerald-400 shadow-md space-y-4">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-black shadow-xs">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>发现新版本！</span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900">{updateInfo.releaseTitle}</h3>
                        <p className="text-xs text-slate-500">
                          发布时间: {updateInfo.publishedAt ? new Date(updateInfo.publishedAt).toLocaleString() : '最新'}
                          {updateInfo.fileSize && (
                            <span className="ml-2 font-mono font-bold text-slate-600">
                              (安装包大小: {(updateInfo.fileSize / (1024 * 1024)).toFixed(1)} MB)
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-xs">
                        <div className="text-center">
                          <span className="text-[10px] text-slate-400 font-bold block">当前版本</span>
                          <span className="text-xs font-mono font-black text-slate-600">
                            v{updateInfo.currentVersion}
                          </span>
                        </div>
                        <span className="text-emerald-500 font-black">➔</span>
                        <div className="text-center">
                          <span className="text-[10px] text-emerald-600 font-bold block">最新版本</span>
                          <span className="text-xs font-mono font-black text-emerald-700">
                            v{updateInfo.latestVersion}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Release Notes */}
                    {updateInfo.releaseNotes && (
                      <div className="space-y-1.5">
                        <h5 className="text-xs font-bold text-slate-700">📋 更新日志与更新内容:</h5>
                        <div className="bg-white/90 backdrop-blur-xs p-3.5 rounded-xl border border-emerald-200 text-xs text-slate-700 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed shadow-inner">
                          {updateInfo.releaseNotes}
                        </div>
                      </div>
                    )}

                    {/* Download Progress Bar */}
                    {isDownloading && downloadProgress && (
                      <div className="bg-white p-3.5 rounded-xl border border-emerald-300 space-y-2 shadow-xs">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span className="flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                            <span>正在下载更新包...</span>
                          </span>
                          <span className="font-mono text-emerald-700 font-black">
                            {downloadProgress.percent}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-300 ease-out shadow-xs"
                            style={{ width: `${Math.min(100, Math.max(0, downloadProgress.percent))}%` }}
                          />
                        </div>
                        {downloadProgress.total > 0 && (
                          <div className="text-[11px] text-slate-500 font-mono text-right">
                            {(downloadProgress.current / (1024 * 1024)).toFixed(1)} MB / {(downloadProgress.total / (1024 * 1024)).toFixed(1)} MB
                          </div>
                        )}
                      </div>
                    )}

                    {/* Download Success Notice */}
                    {downloadCompleted && (
                      <div className="p-3.5 bg-emerald-100/80 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">更新包已下载完成！系统安装器启动中...</p>
                          <p className="text-[11px] text-emerald-700 mt-0.5">
                            若平板弹出“允许安装未知应用”，请开启权限后返回，系统将自动继续完成覆盖安装。
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={handleStartDownloadAndInstall}
                        disabled={isDownloading}
                        className="flex-1 min-w-[200px] py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white font-black text-sm shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>正在下载更新包 ({downloadProgress?.percent || 0}%)...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>
                              {isAndroidApp() ? '立即下载并执行覆盖安装' : '下载最新 Android APK 安装包'}
                            </span>
                          </>
                        )}
                      </button>

                      <a
                        href={updateInfo.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>浏览器备用下载</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  // Up to Date
                  <div className="bg-emerald-50/60 p-6 rounded-2xl border border-emerald-200 text-center space-y-3">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-emerald-900">当前已是最新版本！</h4>
                      <p className="text-xs text-emerald-700 mt-1">
                        本地与云端版本均为 v{updateInfo.currentVersion}，无需更新，请放心使用。
                      </p>
                    </div>
                    <div className="pt-2 flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleCheckUpdate(false)}
                        disabled={isCheckingUpdate}
                        className="px-4 py-2 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-50 text-xs font-bold text-emerald-800 shadow-xs flex items-center gap-1.5 transition-all"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>重新检测</span>
                      </button>
                      <a
                        href="https://github.com/fake-okhub/child-todo/releases"
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs flex items-center gap-1.5 transition-all"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>查看历史发布版本</span>
                      </a>
                    </div>
                  </div>
                )
              ) : (
                // Initial State
                <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
                  <ArrowUpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">点击上方“立即检测新版本”按钮，自动对比云端 GitHub Release</p>
                </div>
              )}

              {/* Card 3: Seamless Installation Guide */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                  <span>关于在线更新与覆盖安装说明:</span>
                </h5>
                <ul className="text-[11px] text-slate-500 space-y-1 list-disc pl-4 leading-relaxed">
                  <li>
                    <strong className="text-slate-700">平滑覆盖升级：</strong>
                    新版本采用统一官方签名，直接覆盖安装，无需卸载旧应用，历史打卡和游戏时长数据完全保留。
                  </li>
                  <li>
                    <strong className="text-slate-700">权限说明：</strong>
                    Android 8.0+ 首次在线更新时，系统可能会提示“允许安装未知应用”，在设置中开启该权限后返回即可继续安装。
                  </li>
                  <li>
                    <strong className="text-slate-700">自动同步保障：</strong>
                    无论是在平板 App 还是网页端，打卡数据均通过 Cloudflare KV 云端实时双向加密同步。
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


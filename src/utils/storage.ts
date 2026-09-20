import type {
  TaskItem,
  UserSettings,
  SubjectConfig,
  SubjectType,
  TaskTemplate,
  DayRecord,
} from '../types';

export const SUBJECT_CONFIGS: Record<SubjectType, SubjectConfig> = {
  hanzi: {
    id: 'hanzi',
    name: '识字',
    icon: '📖',
    themeColor: '#F59E0B',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-300',
    textDark: 'text-amber-800',
  },
  pinyin: {
    id: 'pinyin',
    name: '拼音',
    icon: '🔤',
    themeColor: '#10B981',
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-300',
    textDark: 'text-emerald-800',
  },
  math: {
    id: 'math',
    name: '数字',
    icon: '🔢',
    themeColor: '#0EA5E9',
    bgLight: 'bg-sky-50',
    borderLight: 'border-sky-300',
    textDark: 'text-sky-800',
  },
  dubbing: {
    id: 'dubbing',
    name: '英语趣配音',
    icon: '🎙️',
    themeColor: '#8B5CF6',
    bgLight: 'bg-purple-50',
    borderLight: 'border-purple-300',
    textDark: 'text-purple-800',
  },
  reading: {
    id: 'reading',
    name: '绘本阅读',
    icon: '📚',
    themeColor: '#F43F5E',
    bgLight: 'bg-rose-50',
    borderLight: 'border-rose-300',
    textDark: 'text-rose-800',
  },
  sports: {
    id: 'sports',
    name: '运动',
    icon: '🏃',
    themeColor: '#F97316',
    bgLight: 'bg-orange-50',
    borderLight: 'border-orange-300',
    textDark: 'text-orange-800',
  },
  custom: {
    id: 'custom',
    name: '好习惯',
    icon: '⭐',
    themeColor: '#6366F1',
    bgLight: 'bg-indigo-50',
    borderLight: 'border-indigo-300',
    textDark: 'text-indigo-800',
  },
};

// Default template: Each subject defaults to 5 minutes, 5 items, no sports
export const DEFAULT_TEMPLATES: TaskTemplate[] = [
  {
    id: 'standard-5-subjects',
    name: '一年级每日 5 科标配模板',
    description: '涵盖识字、拼音、数学、英语趣配音、绘本 5 门核心学科，完成 5 项后自动解锁好习惯奖励',
    badge: '🎒 每日必修',
    tasks: [
      {
        subject: 'hanzi',
        title: '读背语文书生字表5个生字，田字格描红1行',
        description: '读准字音，工整书写，注意握笔与坐姿',
        rewardMinutes: 5,
      },
      {
        subject: 'pinyin',
        title: '声母韵母拼读卡片练习 10 分钟',
        description: '大声拼读，分清前后鼻音与平翘舌音',
        rewardMinutes: 5,
      },
      {
        subject: 'math',
        title: '数学口算天天练 1 页（10-20道）',
        description: '认真计算，仔细检查，养成细心好习惯',
        rewardMinutes: 5,
      },
      {
        subject: 'dubbing',
        title: '英语原声短句跟读与趣配音 1 遍',
        description: '模仿纯正语调，大声开口说英语',
        rewardMinutes: 5,
      },
      {
        subject: 'reading',
        title: '专注阅读精选绘本 15 分钟',
        description: '安静阅读，读完后给爸爸妈妈简单分享故事',
        rewardMinutes: 5,
      },
    ],
  },
];

const STORAGE_KEYS = {
  TASKS: 'switch_kids_todo_tasks_v7',
  SETTINGS: 'switch_kids_todo_settings_v7',
  TEMPLATES: 'switch_kids_todo_templates_v7',
  HISTORY: 'switch_kids_todo_history_v7',
  LAST_DATE: 'switch_kids_todo_last_date_v7',
};

/**
 * Get current time normalized to UTC+8 (Asia/Shanghai)
 */
export function getNowInUTC8(): Date {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + 8 * 3600000);
}

/**
 * Return today's date formatted as YYYY-MM-DD in UTC+8 (Asia/Shanghai)
 * Crossing 00:00:00 in UTC+8 immediately transitions to the next day.
 */
export function getTodayDateString(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    const utc8 = getNowInUTC8();
    const y = utc8.getFullYear();
    const m = String(utc8.getMonth() + 1).padStart(2, '0');
    const d = String(utc8.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

/**
 * Return a date offset from today by daysOffset in UTC+8 (Asia/Shanghai)
 */
export function getDateOffset(daysOffset: number): string {
  const utc8 = getNowInUTC8();
  utc8.setDate(utc8.getDate() + daysOffset);
  const y = utc8.getFullYear();
  const m = String(utc8.getMonth() + 1).padStart(2, '0');
  const d = String(utc8.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Return recent Thursday date string in UTC+8 (Asia/Shanghai)
 */
export function getRecentThursdayDateString(): string {
  const now = getNowInUTC8();
  const day = now.getDay(); // 0 is Sun, 1 is Mon, ..., 4 is Thu, 6 is Sat
  const diff = (day - 4 + 7) % 7;
  const target = new Date(now);
  target.setDate(now.getDate() - diff);
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const d = String(target.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}


// Generate history record: Only Thursday 5 subjects + auto habit completed
export function generateMockHistory(): Record<string, DayRecord> {
  const thurDate = getRecentThursdayDateString();
  const mock: Record<string, DayRecord> = {};

  const thursdayTasks: TaskItem[] = [
    {
      id: `task-thur-hanzi`,
      subject: 'hanzi',
      title: '读背语文书生字表5个生字，田字格描红1行',
      description: '读准字音，工整书写，注意握笔与坐姿',
      rewardMinutes: 5,
      isCompleted: true,
      completedAt: `${thurDate}T16:45:00.000Z`,
    },
    {
      id: `task-thur-pinyin`,
      subject: 'pinyin',
      title: '声母韵母拼读卡片练习 10 分钟',
      description: '大声拼读，分清前后鼻音与平翘舌音',
      rewardMinutes: 5,
      isCompleted: true,
      completedAt: `${thurDate}T17:10:00.000Z`,
    },
    {
      id: `task-thur-math`,
      subject: 'math',
      title: '数学口算天天练 1 页（10-20道）',
      description: '认真计算，仔细检查，养成细心好习惯',
      rewardMinutes: 5,
      isCompleted: true,
      completedAt: `${thurDate}T17:35:00.000Z`,
    },
    {
      id: `task-thur-dubbing`,
      subject: 'dubbing',
      title: '英语原声短句跟读与趣配音 1 遍',
      description: '模仿纯正语调，大声开口说英语',
      rewardMinutes: 5,
      isCompleted: true,
      completedAt: `${thurDate}T18:00:00.000Z`,
    },
    {
      id: `task-thur-reading`,
      subject: 'reading',
      title: '专注阅读精选绘本 15 分钟',
      description: '安静阅读，读完后给爸爸妈妈简单分享故事',
      rewardMinutes: 5,
      isCompleted: true,
      completedAt: `${thurDate}T18:25:00.000Z`,
    },
    {
      id: `task-thur-habit`,
      subject: 'custom',
      title: '好习惯自动奖励：5门学科全勤完成！',
      description: '当日已自觉按时完成所有基础学科，系统自动解锁好习惯大奖',
      rewardMinutes: 5,
      isCompleted: true,
      completedAt: `${thurDate}T18:25:05.000Z`,
      isAutoHabit: true,
    },
  ];

  mock[thurDate] = {
    date: thurDate,
    tasks: thursdayTasks,
    earnedMinutes: 30,
    hasFullFiveCompleted: true,
    hasAutoHabit: true,
    allCompleted: true,
  };

  return mock;
}

export const DEFAULT_SETTINGS: UserSettings = {
  childName: '小勇士',
  avatar: 'mario',
  balanceMinutes: 30, // 周四完成 5 门学科 (25分) + 好习惯自动解锁 (5分) = 30 分钟
  soundEnabled: true,
  cloudSyncUrl: typeof window !== 'undefined' ? `${window.location.origin}/api/sync` : '/api/sync',
  ttsEngine: 'siliconflow',
  ttsVoice: 'FunAudioLLM/CosyVoice2-0.5B:claire',
  siliconflowApiKey: 'sk-bztigxzwzjrdfieytvdsovkekfgwvabwtahcvqfwcamjdebv',
  azureApiKey: 'EnNTfoTVgTuHScOadfJOs5Y9WmxUBCe1WbB1ki33c5R0BzGtKeGfJQQJ99CGAC8vTInXJ3w3AAAYACOGXqt3',
  azureRegion: 'westus2',
  googleApiKey: 'AIzaSyBC3BFRYc8g9xIY0v10hEOJuX9mp7WNZjA',
  dailyReminderEnabled: true,
  dailyReminderTime: '17:30',
  dailyReminderMessage: '放学啦！小勇士记得完成今日 5 科打卡，积累周末 Switch 能量哦！',
  habitRewardMinutes: 5,
  requiredTasksForHabit: 5,
  weeklyBonusMinutes: 15,
};

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate legacy 'edge' to official 'azure'
      if (parsed.ttsEngine === 'edge') {
        parsed.ttsEngine = 'azure';
        parsed.ttsVoice = 'zh-CN-XiaoxiaoNeural';
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error(e);
  }
}

export function loadTemplates(): TaskTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_TEMPLATES;
}

export function saveTemplates(templates: TaskTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  } catch (e) {
    console.error(e);
  }
}

export function loadHistory(): Record<string, DayRecord> {
  const thurDate = getRecentThursdayDateString();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Sanitize: ensure no legacy mock days pollute history. Only Thursday or user-recorded days.
      if (parsed && typeof parsed === 'object') {
        const keys = Object.keys(parsed);
        // If it only contains Thursday or legitimate dates
        if (keys.length === 1 && keys[0] === thurDate) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
  // Initialize with strictly Thursday-only history record
  const initialMock = generateMockHistory();
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(initialMock));
  } catch (e) {
    console.error(e);
  }
  return initialMock;
}

export function saveDayRecord(record: DayRecord): void {
  try {
    const history = loadHistory();
    history[record.date] = record;
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch (e) {
    console.error(e);
  }
}

export function saveHistory(history: Record<string, DayRecord>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch (e) {
    console.error(e);
  }
}

export function createTasksFromTemplate(template: TaskTemplate): TaskItem[] {
  return template.tasks.map((t, idx) => ({
    id: `task-${Date.now()}-${idx}`,
    subject: t.subject,
    title: t.title,
    description: t.description,
    rewardMinutes: t.rewardMinutes || 5, // 优先采用模板中家长自定义的奖励分钟数
    isCompleted: false,
    isAutoHabit: false,
  }));
}

export function loadTasks(): TaskItem[] {
  const today = getTodayDateString();
  const lastDate = localStorage.getItem(STORAGE_KEYS.LAST_DATE);

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    let tasks: TaskItem[] = raw ? JSON.parse(raw) : [];

    // If new day, archive yesterday's state to history and re-instantiate today's list
    if (lastDate && lastDate !== today && tasks.length > 0) {
      const earned = tasks.filter((t) => t.isCompleted).reduce((sum, t) => sum + t.rewardMinutes, 0);
      const regularTasks = tasks.filter((t) => !t.isAutoHabit);
      const allRegularDone = regularTasks.length > 0 && regularTasks.every((t) => t.isCompleted);
      const dayRec: DayRecord = {
        date: lastDate,
        tasks: tasks,
        earnedMinutes: earned,
        hasFullFiveCompleted: allRegularDone,
        hasAutoHabit: tasks.some((t) => t.isAutoHabit && t.isCompleted),
        allCompleted: tasks.every((t) => t.isCompleted),
      };
      saveDayRecord(dayRec);

      // Reset for today based on active template
      const templates = loadTemplates();
      tasks = createTasksFromTemplate(templates[0]);
      localStorage.setItem(STORAGE_KEYS.LAST_DATE, today);
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      return tasks;
    }

    if (!lastDate) {
      localStorage.setItem(STORAGE_KEYS.LAST_DATE, today);
    }

    if (tasks.length === 0) {
      const templates = loadTemplates();
      tasks = createTasksFromTemplate(templates[0]);
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    }

    return tasks;
  } catch (e) {
    console.error(e);
    const templates = loadTemplates();
    return createTasksFromTemplate(templates[0]);
  }
}

export function saveTasks(tasks: TaskItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));

    // Also update today's record in history
    const today = getTodayDateString();
    const earned = tasks.filter((t) => t.isCompleted).reduce((sum, t) => sum + t.rewardMinutes, 0);
    const regularTasks = tasks.filter((t) => !t.isAutoHabit);
    const allRegularDone = regularTasks.length > 0 && regularTasks.every((t) => t.isCompleted);
    const dayRec: DayRecord = {
      date: today,
      tasks: tasks,
      earnedMinutes: earned,
      hasFullFiveCompleted: allRegularDone,
      hasAutoHabit: tasks.some((t) => t.isAutoHabit && t.isCompleted),
      allCompleted: tasks.length > 0 && tasks.every((t) => t.isCompleted),
    };
    saveDayRecord(dayRec);
  } catch (e) {
    console.error(e);
  }
}

/**
 * Check if the current week (Monday to Friday, 5 weekdays) has full attendance.
 * If all 5 weekdays have all tasks completed, awards +15 minutes once per week.
 */
export function checkWeeklyFullAttendanceBonus(
  history: Record<string, DayRecord>,
  currentBalance: number,
  bonusMinutes: number = 15
): { isEligible: boolean; newBalance: number; completedWeekdays: number } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  const monday = new Date(now);
  const diffToMonday = (dayOfWeek + 6) % 7;
  monday.setDate(now.getDate() - diffToMonday);

  const weekDayDates: string[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    weekDayDates.push(`${y}-${m}-${dayStr}`);
  }

  let completedCount = 0;
  for (const dStr of weekDayDates) {
    const rec = history[dStr];
    if (rec && rec.allCompleted && rec.hasFullFiveCompleted) {
      completedCount++;
    }
  }

  const bonusAwardKey = `full_attendance_bonus_awarded_${weekDayDates[0]}`;
  const alreadyAwarded = localStorage.getItem(bonusAwardKey) === 'true';

  if (completedCount === 5 && !alreadyAwarded) {
    localStorage.setItem(bonusAwardKey, 'true');
    return {
      isEligible: true,
      newBalance: currentBalance + bonusMinutes,
      completedWeekdays: 5,
    };
  }

  return {
    isEligible: false,
    newBalance: currentBalance,
    completedWeekdays: completedCount,
  };
}

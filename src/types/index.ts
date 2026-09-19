export type SubjectType = 'hanzi' | 'pinyin' | 'math' | 'dubbing' | 'reading' | 'sports' | 'custom';

export interface SubjectConfig {
  id: SubjectType;
  name: string;
  icon: string;
  themeColor: string;
  bgLight: string;
  borderLight: string;
  textDark: string;
}

export interface TaskItem {
  id: string;
  subject: SubjectType;
  title: string;
  description?: string;
  rewardMinutes: number; // 默认每个学科固定 +5 分钟
  isCompleted: boolean;
  completedAt?: string;
  isAutoHabit?: boolean; // 标记是否为全科完成自动触发的好习惯
}

export interface TemplateTask {
  subject: SubjectType;
  title: string;
  description?: string;
  rewardMinutes: number;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  badge: string;
  tasks: TemplateTask[];
}

export interface DayRecord {
  date: string; // YYYY-MM-DD
  tasks: TaskItem[];
  earnedMinutes: number;
  hasFullFiveCompleted: boolean; // 是否完成基础学科
  hasAutoHabit: boolean;         // 是否已加上好习惯5分
  allCompleted: boolean;
}

export type TTSEngineType = 'siliconflow' | 'azure' | 'google' | 'browser' | 'edge';

export interface UserSettings {
  childName: string;
  avatar: string;
  balanceMinutes: number; // 当前可兑换 Switch 总时长（不设上限）
  soundEnabled: boolean;
  cloudSyncUrl: string;
  lastSyncTime?: string;
  // 语音引擎与音色设置
  ttsEngine: TTSEngineType;
  ttsVoice: string;
  siliconflowApiKey?: string;
  azureApiKey?: string;
  azureRegion?: string;
  googleApiKey?: string;
  // 每日定时打卡闹铃配置
  dailyReminderEnabled: boolean;
  dailyReminderTime: string; // 格式 "HH:mm"，如 "17:30"
  dailyReminderMessage: string;
}


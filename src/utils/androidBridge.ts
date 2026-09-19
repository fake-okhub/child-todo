// Android Native Bridge Type Definitions and Helper Utilities

export interface NativeAndroidBridge {
  isApp?: () => boolean;
  isAndroidApp?: () => boolean;
  speak?: (text: string) => void;
  stopAudio?: () => void;
  setDailyReminder?: (enabled: boolean, timeStr: string, title: string, message: string) => void;
  testReminder?: (title: string, message: string) => void;
  keepScreenOn?: (enabled: boolean) => void;
}

declare global {
  interface Window {
    AndroidBridge?: NativeAndroidBridge;
  }
}

/**
 * Check whether currently running inside the native Android App shell
 */
export function isAndroidApp(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.AndroidBridge) {
    if (typeof window.AndroidBridge.isApp === 'function') {
      return window.AndroidBridge.isApp();
    }
    if (typeof window.AndroidBridge.isAndroidApp === 'function') {
      return window.AndroidBridge.isAndroidApp();
    }
    return true;
  }
  // Check userAgent flag if injected
  if (typeof navigator !== 'undefined' && navigator.userAgent.includes('KidsTodoAndroidApp')) {
    return true;
  }
  return false;
}

/**
 * Call native Android Text-to-Speech
 */
export function nativeSpeak(text: string): boolean {
  if (isAndroidApp() && window.AndroidBridge && typeof window.AndroidBridge.speak === 'function') {
    try {
      window.AndroidBridge.speak(text);
      return true;
    } catch (e) {
      console.warn('Native Android TTS error:', e);
    }
  }
  return false;
}

/**
 * Stop native Android Text-to-Speech
 */
export function nativeStopAudio(): void {
  if (isAndroidApp() && window.AndroidBridge && typeof window.AndroidBridge.stopAudio === 'function') {
    try {
      window.AndroidBridge.stopAudio();
    } catch (e) {
      console.warn('Native Android stop audio error:', e);
    }
  }
}

/**
 * Sync daily reminder time and status to Native Android system AlarmManager
 */
export function syncDailyReminderToNative(
  enabled: boolean,
  timeStr: string,
  title: string = '⏰ 小勇士打卡提醒',
  message: string = '放学啦！记得完成今日 5 科打卡，积累周末 Switch 游玩时间哦！'
): boolean {
  if (isAndroidApp() && window.AndroidBridge && typeof window.AndroidBridge.setDailyReminder === 'function') {
    try {
      window.AndroidBridge.setDailyReminder(enabled, timeStr, title, message);
      console.log(`[AndroidBridge] Scheduled daily alarm for ${timeStr} (enabled=${enabled})`);
      return true;
    } catch (e) {
      console.warn('Failed to sync reminder to native:', e);
    }
  }
  return false;
}

/**
 * Trigger an immediate test reminder on the device
 */
export function testNativeReminder(
  title: string = '🔔 测试打卡提醒',
  message: string = '这是小勇士 Todo 定时闹铃测试，系统通知与铃声已正常就绪！'
): boolean {
  if (isAndroidApp() && window.AndroidBridge && typeof window.AndroidBridge.testReminder === 'function') {
    try {
      window.AndroidBridge.testReminder(title, message);
      return true;
    } catch (e) {
      console.warn('Failed to trigger native test reminder:', e);
    }
  } else {
    // Fallback in browser: Web Notification if supported
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body: message, icon: '/favicon.ico' });
        return true;
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            new Notification(title, { body: message, icon: '/favicon.ico' });
          }
        });
        return true;
      }
    }
  }
  return false;
}

/**
 * Set keep screen on (useful for child math/reading tasks)
 */
export function setNativeKeepScreenOn(enabled: boolean): void {
  if (isAndroidApp() && window.AndroidBridge && typeof window.AndroidBridge.keepScreenOn === 'function') {
    try {
      window.AndroidBridge.keepScreenOn(enabled);
    } catch (e) {
      console.warn('Failed to set keep screen on:', e);
    }
  }
}

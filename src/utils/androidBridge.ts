// Android Native Bridge Type Definitions and Helper Utilities

export interface NativeAndroidBridge {
  isApp?: () => boolean;
  isAndroidApp?: () => boolean;
  speak?: (text: string) => void;
  stopAudio?: () => void;
  setDailyReminder?: (enabled: boolean, timeStr: string, title: string, message: string) => void;
  testReminder?: (title: string, message: string) => void;
  keepScreenOn?: (enabled: boolean) => void;
  getAppVersion?: () => string;
  getAppVersionCode?: () => number;
  downloadAndInstallApk?: (downloadUrl: string, versionName: string) => void;
  installApk?: (filePath: string) => void;
  startGamingAlarm?: (seconds: number, title: string) => void;
  cancelGamingAlarm?: () => void;
}


declare global {
  interface Window {
    AndroidBridge?: NativeAndroidBridge;
    onUpdateDownloadProgress?: (percent: number, currentBytes: number, totalBytes: number) => void;
    onUpdateDownloadSuccess?: (filePath: string) => void;
    onUpdateDownloadError?: (errorMessage: string) => void;
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

/**
 * Get native app version string (e.g. "1.0.0")
 */
export function getNativeAppVersion(): string {
  if (isAndroidApp() && window.AndroidBridge && typeof window.AndroidBridge.getAppVersion === 'function') {
    try {
      return window.AndroidBridge.getAppVersion();
    } catch (e) {
      console.warn('Failed to get native app version:', e);
    }
  }
  return '1.0.0';
}

/**
 * Get native app version code (e.g. 1)
 */
export function getNativeAppVersionCode(): number {
  if (isAndroidApp() && window.AndroidBridge && typeof window.AndroidBridge.getAppVersionCode === 'function') {
    try {
      return window.AndroidBridge.getAppVersionCode();
    } catch (e) {
      console.warn('Failed to get native app version code:', e);
    }
  }
  return 1;
}

export interface AppUpdateInfo {
  currentVersion: string;
  latestVersion: string;
  latestTagName: string;
  releaseTitle: string;
  releaseNotes: string;
  publishedAt: string;
  hasUpdate: boolean;
  downloadUrl: string;
  fileSize?: number;
}

/**
 * Semantic version comparison: returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export function compareSemVer(v1: string, v2: string): number {
  const parse = (v: string) =>
    v
      .replace(/^v/i, '')
      .split('.')
      .map((n) => parseInt(n, 10) || 0);
  const p1 = parse(v1);
  const p2 = parse(v2);
  const maxLen = Math.max(p1.length, p2.length);
  for (let i = 0; i < maxLen; i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

/**
 * Check whether a new App release is available from Cloudflare Worker or GitHub Releases
 */
export async function checkAppUpdate(forceFresh: boolean = false): Promise<AppUpdateInfo> {
  const currentVersion = getNativeAppVersion();

  let data: any = null;

  // 1. Try local Cloudflare Worker update endpoint first
  try {
    const url = forceFresh ? `/api/check-update?fresh=1&t=${Date.now()}` : '/api/check-update';
    const res = await fetch(url, { cache: 'no-cache' });
    if (res.ok) {
      const json = await res.json();
      if (json && json.success) {
        data = json;
      }
    }
  } catch (err) {
    console.warn('Worker check-update failed, trying direct GitHub API:', err);
  }

  // 2. Fallback to direct public GitHub API
  if (!data) {
    try {
      const ghRes = await fetch('https://api.github.com/repos/fake-okhub/child-todo/releases/latest', {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });
      if (ghRes.ok) {
        const ghJson = await ghRes.json();
        const tagName = ghJson.tag_name || 'v1.0.0';
        let releaseApk = null;
        if (Array.isArray(ghJson.assets)) {
          for (const asset of ghJson.assets) {
            const name = (asset.name || '').toLowerCase();
            if (name.includes('release') && name.endsWith('.apk')) {
              releaseApk = {
                downloadUrl: asset.browser_download_url,
                apiUrl: asset.url,
                size: asset.size,
              };
              break;
            }
          }
          if (!releaseApk && ghJson.assets[0]) {
            releaseApk = {
              downloadUrl: ghJson.assets[0].browser_download_url,
              apiUrl: ghJson.assets[0].url,
              size: ghJson.assets[0].size,
            };
          }
        }
        data = {
          tagName,
          version: tagName.replace(/^v/i, ''),
          name: ghJson.name || `KidsTodo ${tagName}`,
          publishedAt: ghJson.published_at,
          body: ghJson.body || '',
          releaseApk,
        };
      }
    } catch (ghErr) {
      console.error('Direct GitHub check failed:', ghErr);
      throw new Error('无法连接到版本更新服务器，请检查网络连接');
    }
  }

  if (!data) {
    throw new Error('获取最新版本信息失败');
  }

  const latestVersion = data.version || data.tagName?.replace(/^v/i, '') || '1.0.0';
  const hasUpdate = compareSemVer(latestVersion, currentVersion) > 0;
  const downloadUrl =
    data.releaseApk?.downloadUrl ||
    `https://github.com/fake-okhub/child-todo/releases/download/${data.tagName || 'v' + latestVersion}/KidsTodo-Release-${data.tagName || 'v' + latestVersion}.apk`;

  return {
    currentVersion,
    latestVersion,
    latestTagName: data.tagName || `v${latestVersion}`,
    releaseTitle: data.name || `KidsTodo v${latestVersion} 正式版`,
    releaseNotes: data.body || '',
    publishedAt: data.publishedAt || '',
    hasUpdate,
    downloadUrl,
    fileSize: data.releaseApk?.size,
  };
}

/**
 * Trigger download and install APK via Android Native Bridge
 */
export function triggerNativeUpdateDownload(downloadUrl: string, versionName: string): boolean {
  if (isAndroidApp() && window.AndroidBridge && typeof window.AndroidBridge.downloadAndInstallApk === 'function') {
    try {
      window.AndroidBridge.downloadAndInstallApk(downloadUrl, versionName);
      return true;
    } catch (e) {
      console.error('Failed to trigger native update download:', e);
    }
  }
  return false;
}

/**
 * Start native gaming alarm countdown using Android AlarmManager & system alarm sound
 */
export function startNativeGamingAlarm(seconds: number, title: string = '🎮 Switch 游戏时间到啦！'): boolean {
  if (isAndroidApp() && window.AndroidBridge && typeof window.AndroidBridge.startGamingAlarm === 'function') {
    try {
      window.AndroidBridge.startGamingAlarm(seconds, title);
      console.log(`[AndroidBridge] Scheduled native gaming alarm for ${seconds}s`);
      return true;
    } catch (e) {
      console.warn('Failed to start native gaming alarm:', e);
    }
  }
  return false;
}

/**
 * Cancel native gaming alarm countdown
 */
export function cancelNativeGamingAlarm(): boolean {
  if (isAndroidApp() && window.AndroidBridge && typeof window.AndroidBridge.cancelGamingAlarm === 'function') {
    try {
      window.AndroidBridge.cancelGamingAlarm();
      console.log('[AndroidBridge] Cancelled native gaming alarm');
      return true;
    } catch (e) {
      console.warn('Failed to cancel native gaming alarm:', e);
    }
  }
  return false;
}


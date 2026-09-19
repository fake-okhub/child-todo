import type { TaskItem, TaskTemplate, DayRecord, UserSettings } from '../types';
import { saveTasks, saveTemplates, saveHistory, saveSettings } from './storage';

export interface AppSyncData {
  tasks: TaskItem[];
  templates: TaskTemplate[];
  history: Record<string, DayRecord>;
  settings: UserSettings;
}

export async function pullFromCloudflare(
  endpointUrl: string
): Promise<{ success: boolean; data?: AppSyncData; error?: string }> {
  try {
    const res = await fetch(endpointUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return { success: true, data: json.data };
  } catch (err: any) {
    console.warn('Cloud pull error (using local cache):', err);
    return { success: false, error: err.message };
  }
}

/**
 * Cloud-First sync:
 * 1. Post to Cloudflare KV first as primary source of truth.
 * 2. When Cloudflare responds successfully, sync to secondary local cache (localStorage).
 * 3. Fallback to localStorage if offline.
 */
export async function syncCloudFirst(
  endpointUrl: string,
  payload: AppSyncData
): Promise<{ success: boolean; fromCloud: boolean; syncedAt?: string }> {
  try {
    const res = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        updatedAt: new Date().toISOString(),
      }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        // Cloud success! Now save to secondary trusted local storage
        saveSettings(payload.settings);
        saveTemplates(payload.templates);
        saveTasks(payload.tasks);
        saveHistory(payload.history);
        return { success: true, fromCloud: true, syncedAt: json.syncedAt };
      }
    }
  } catch (err) {
    console.warn('Cloud sync error, falling back to local storage:', err);
  }

  // Fallback: save to secondary local store
  saveSettings(payload.settings);
  saveTemplates(payload.templates);
  saveTasks(payload.tasks);
  saveHistory(payload.history);
  return { success: false, fromCloud: false };
}


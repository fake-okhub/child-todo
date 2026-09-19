import type { TTSEngineType } from '../types';
import { nativeSpeak, isAndroidApp } from './androidBridge';

// Web Audio API pure synthesized sound engine & Enhanced Natural TTS Engine

// Common Chinese polyphones in Grade 1 textbooks with homophone corrections for local SpeechSynthesis fallback
const HOMOPHONE_LOCAL_CORRECTIONS: Array<[RegExp, string]> = [
  [/读背/g, '读贝'],
  [/背诵/g, '贝诵'],
  [/背书/g, '贝书'],
  [/背包/g, '杯包'],
  [/长大/g, '掌大'],
  [/音乐/g, '因岳'],
  [/数数/g, '属数'],
  [/数学/g, '戍学'],
  [/还书/g, '环书'],
  [/睡觉/g, '睡叫'],
  [/重新/g, '虫新'],
  [/少儿/g, '绍儿'],
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private currentAudio: HTMLAudioElement | null = null;
  private cachedLocalVoices: SpeechSynthesisVoice[] = [];
  private activeUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        try {
          const list = window.speechSynthesis.getVoices();
          if (list && list.length > 0) {
            this.cachedLocalVoices = list;
          }
        } catch {
          // ignore
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  // 1. Nintendo Switch Joy-Con Snap Click
  public playSwitchSnap() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.04);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  // 2. Mario Coin / Energy Point Tingle
  public playCoin() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, t); // B5
    osc.frequency.setValueAtTime(1318.51, t + 0.08); // E6

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.setValueAtTime(0.4, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  // 3. Victory / Mission Complete Fanfare
  public playFanfare() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [
      { f: 523.25, d: 0.1, t: 0 },
      { f: 659.25, d: 0.1, t: 0.1 },
      { f: 783.99, d: 0.1, t: 0.2 },
      { f: 1046.5, d: 0.35, t: 0.3 },
    ];

    const now = this.ctx.currentTime;
    notes.forEach((n) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, now + n.t);

      gain.gain.setValueAtTime(0.4, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + n.t);
      osc.stop(now + n.t + n.d);
    });
  }

  // 4. Soft Button Pop
  public playPop() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.05);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  // 5. Timer Finish Chime
  public playTimerEnd() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [
      { f: 880, d: 0.2, t: 0 },
      { f: 659.25, d: 0.2, t: 0.2 },
      { f: 880, d: 0.4, t: 0.4 },
    ];
    const now = this.ctx.currentTime;
    notes.forEach((n) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      gain.gain.setValueAtTime(0.5, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + n.t);
      osc.stop(now + n.t + n.d);
    });
  }

  private ttsEngine: TTSEngineType = 'siliconflow';
  private ttsVoice: string = 'FunAudioLLM/CosyVoice2-0.5B:claire';
  private siliconflowApiKey: string = 'sk-bztigxzwzjrdfieytvdsovkekfgwvabwtahcvqfwcamjdebv';
  private azureApiKey: string = 'EnNTfoTVgTuHScOadfJOs5Y9WmxUBCe1WbB1ki33c5R0BzGtKeGfJQQJ99CGAC8vTInXJ3w3AAAYACOGXqt3';
  private azureRegion: string = 'westus2';
  private googleApiKey: string = 'AIzaSyBC3BFRYc8g9xIY0v10hEOJuX9mp7WNZjA';
  private isLoadingTTS: boolean = false;
  private isPlayingTTS: boolean = false;
  private currentLoadingText: string = '';
  private loadingListeners: Set<(loading: boolean, text?: string) => void> = new Set();
  private playingListeners: Set<(playing: boolean) => void> = new Set();

  public setTTSConfig(cfg: {
    ttsEngine?: TTSEngineType;
    ttsVoice?: string;
    siliconflowApiKey?: string;
    azureApiKey?: string;
    azureRegion?: string;
    googleApiKey?: string;
  }) {
    if (cfg.ttsEngine) this.ttsEngine = cfg.ttsEngine;
    if (cfg.ttsVoice) this.ttsVoice = cfg.ttsVoice;
    if (cfg.siliconflowApiKey) this.siliconflowApiKey = cfg.siliconflowApiKey;
    if (cfg.azureApiKey) this.azureApiKey = cfg.azureApiKey;
    if (cfg.azureRegion) this.azureRegion = cfg.azureRegion;
    if (cfg.googleApiKey) this.googleApiKey = cfg.googleApiKey;
  }

  public getIsLoadingTTS(): boolean {
    return this.isLoadingTTS;
  }

  public getCurrentLoadingText(): string {
    return this.currentLoadingText;
  }

  public getIsPlayingTTS(): boolean {
    return this.isPlayingTTS;
  }

  public getActiveUtterance(): SpeechSynthesisUtterance | null {
    return this.activeUtterance;
  }

  public addLoadingListener(fn: (loading: boolean, text?: string) => void): () => void {
    this.loadingListeners.add(fn);
    return () => this.loadingListeners.delete(fn);
  }

  public addPlayingListener(fn: (playing: boolean) => void): () => void {
    this.playingListeners.add(fn);
    return () => this.playingListeners.delete(fn);
  }

  private notifyLoading(loading: boolean, text?: string) {
    this.isLoadingTTS = loading;
    this.currentLoadingText = text || '';
    this.loadingListeners.forEach((fn) => fn(loading, text));
  }

  private notifyPlaying(playing: boolean) {
    this.isPlayingTTS = playing;
    this.playingListeners.forEach((fn) => fn(playing));
  }

  // Diagnostics: get detected Chinese local voices on current device (Android / iOS / Desktop)
  public getLocalChineseVoices(): Array<{ name: string; lang: string; default: boolean; isChinese: boolean }> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    const voices =
      this.cachedLocalVoices.length > 0 ? this.cachedLocalVoices : window.speechSynthesis.getVoices();
    return voices.map((v) => {
      const langLower = (v.lang || '').toLowerCase().replace('_', '-');
      const isChinese =
        langLower.startsWith('zh') ||
        langLower.startsWith('cmn') ||
        v.name.includes('Chinese') ||
        v.name.includes('中文') ||
        v.name.includes('普通话') ||
        v.name.includes('Mandarin');
      return {
        name: v.name,
        lang: v.lang,
        default: v.default,
        isChinese,
      };
    });
  }

  // 6. Natural Chinese TTS with Anti-Double-Click Guard & Loading Feedback
  public async speak(
    text: string,
    overrideEngine?: TTSEngineType,
    overrideVoice?: string
  ) {
    if (typeof window === 'undefined') return;

    // Guard: Prevent double/multiple clicks while speech is synthesizing
    if (this.isLoadingTTS) {
      console.log('Audio is currently loading/synthesizing, ignoring duplicate click');
      return;
    }

    // Stop previous speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }

    const engine = overrideEngine || this.ttsEngine;
    const voice = overrideVoice || this.ttsVoice;

    // Direct local browser speech
    if (engine === 'browser') {
      this.speakLocal(text);
      return;
    }

    // Pick API key according to engine
    let keyToUse = this.siliconflowApiKey;
    if (engine === 'azure') keyToUse = this.azureApiKey;
    else if (engine === 'google') keyToUse = this.googleApiKey;

    // Online neural TTS endpoint (SiliconFlow / Azure / Google Cloud)
    try {
      this.notifyLoading(true, text);

      const cleanText = text.slice(0, 150).trim();
      const params = new URLSearchParams({
        text: cleanText,
        engine,
        voice,
        key: keyToUse,
      });
      if (engine === 'azure') {
        params.set('region', this.azureRegion);
      }

      const ttsUrl = `/api/tts?${params.toString()}`;
      const audio = new Audio(ttsUrl);
      this.currentAudio = audio;

      // Timeout safety: if online synthesis takes > 10s, release loading lock
      const timer = setTimeout(() => {
        if (this.isLoadingTTS) {
          this.notifyLoading(false);
          this.speakLocal(text);
        }
      }, 10000);

      audio.onplay = () => {
        clearTimeout(timer);
        this.notifyLoading(false);
        this.notifyPlaying(true);
      };

      audio.onended = () => {
        clearTimeout(timer);
        this.notifyLoading(false);
        this.notifyPlaying(false);
        this.currentAudio = null;
      };

      audio.onerror = (e) => {
        clearTimeout(timer);
        this.notifyLoading(false);
        this.notifyPlaying(false);
        this.currentAudio = null;
        console.warn('Online TTS failed, gracefully falling back to local SpeechSynthesis:', e);
        this.speakLocal(text);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
        return;
      }
    } catch (e) {
      this.notifyLoading(false);
      this.speakLocal(text);
    }
  }

  // 7. Enhanced Local SpeechSynthesis Fallback with Android Compatibility & Homophone Disambiguation
  public speakLocal(text: string) {
    let processedText = text;
    for (const [re, replacement] of HOMOPHONE_LOCAL_CORRECTIONS) {
      processedText = processedText.replace(re, replacement);
    }

    // 0. If running inside Native Android Shell, directly use Native Android TTS (0ms, 100% reliable)
    if (isAndroidApp()) {
      const ok = nativeSpeak(processedText);
      if (ok) {
        this.notifyPlaying(true);
        setTimeout(() => this.notifyPlaying(false), Math.min(5000, Math.max(1500, processedText.length * 300)));
        return;
      }
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // 1. Android & iOS Audio Queue Unlock: Resume suspended speech engine and clear queue
    try {
      window.speechSynthesis.resume();
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn('SpeechSynthesis reset warning:', e);
    }

    const utterance = new SpeechSynthesisUtterance(processedText);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.92; // Ideal comfortable pace across Android & iOS
    utterance.pitch = 1.0;

    // 2. Multi-tier Fuzzy matching for Android and Apple TTS
    const voices =
      this.cachedLocalVoices.length > 0 ? this.cachedLocalVoices : window.speechSynthesis.getVoices();

    // Tier 1: High quality Chinese voices (Siri, Enhanced, Google, 晓晓, 婷婷, 小燕, 华为, 小米)
    let matchedVoice = voices.find((v) => {
      const lang = (v.lang || '').toLowerCase().replace('_', '-');
      const isZh = lang.startsWith('zh-cn') || lang.startsWith('cmn');
      const name = v.name;
      return (
        isZh &&
        (name.includes('Siri') ||
          name.includes('Enhanced') ||
          name.includes('Natural') ||
          name.includes('Xiaoxiao') ||
          name.includes('Ting-Ting') ||
          name.includes('Google') ||
          name.includes('小燕') ||
          name.includes('华为') ||
          name.includes('小米'))
      );
    });

    // Tier 2: Any zh-cn or cmn voice
    if (!matchedVoice) {
      matchedVoice = voices.find((v) => {
        const lang = (v.lang || '').toLowerCase().replace('_', '-');
        return lang === 'zh-cn' || lang.startsWith('zh-cn') || lang.startsWith('cmn');
      });
    }

    // Tier 3: Any Chinese dialect (zh, zh-TW, zh-HK)
    if (!matchedVoice) {
      matchedVoice = voices.find((v) => (v.lang || '').toLowerCase().startsWith('zh'));
    }

    // Tier 4: Fuzzy name match (contains Chinese or 中文)
    if (!matchedVoice) {
      matchedVoice = voices.find(
        (v) =>
          v.name.includes('Chinese') ||
          v.name.includes('中文') ||
          v.name.includes('Mandarin') ||
          v.name.includes('普通话')
      );
    }

    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang;
    }

    // 3. Android Chromium GC Bug Fix: retain utterance reference until completion
    this.activeUtterance = utterance;
    this.notifyPlaying(true);

    utterance.onend = () => {
      this.activeUtterance = null;
      this.notifyPlaying(false);
    };

    utterance.onerror = (err) => {
      this.activeUtterance = null;
      this.notifyPlaying(false);
      console.warn('Local speech synthesis error:', err);
    };

    // 4. Android Queue Hang Bug Fix: slight micro-delay after cancel
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('SpeechSynthesis.speak failed:', err);
        this.activeUtterance = null;
        this.notifyPlaying(false);
      }
    }, 30);
  }
}

export const soundEngine = new SoundEngine();

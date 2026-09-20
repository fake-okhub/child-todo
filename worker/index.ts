/**
 * Cloudflare Worker for Kids Todo Sync (kidstodo.jac.edu.kg)
 */

export interface Env {
  TODO_KV?: KVNamespace;
  GITHUB_TOKEN?: string;
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight for API requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    };

    // 1. Health check endpoint
    if (url.pathname === '/api/health') {
      return new Response(
        JSON.stringify({ status: 'ok', service: 'kidstodo-app', domain: 'kidstodo.jac.edu.kg' }),
        { headers }
      );
    }

    // 1.1 App Update Check Endpoint (Queries GitHub Releases with edge CDN & KV caching)
    if (url.pathname === '/api/check-update') {
      try {
        const cacheKey = 'app_latest_release_cache';
        const isFresh = url.searchParams.has('fresh');
        if (!isFresh && env.TODO_KV) {
          const cached = await env.TODO_KV.get(cacheKey);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              return new Response(JSON.stringify(parsed), {
                headers: {
                  ...headers,
                  'Cache-Control': 'public, max-age=60, s-maxage=300',
                  'X-Cache': 'HIT',
                },
              });
            } catch {
              // ignore invalid cache
            }
          }
        }

        const ghHeaders: Record<string, string> = {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/vnd.github.v3+json',
        };
        if (env.GITHUB_TOKEN) {
          ghHeaders['Authorization'] = `token ${env.GITHUB_TOKEN}`;
        }

        let release: any = null;
        try {
          const ghRes = await fetch('https://api.github.com/repos/fake-okhub/child-todo/releases/latest', {
            headers: ghHeaders,
          });
          if (ghRes.ok) {
            release = await ghRes.json();
          }
        } catch (e) {
          console.warn('GitHub API fetch failed, using fallback:', e);
        }

        // Safe fallback if GitHub rate limits or is unreachable
        if (!release || !Array.isArray(release.assets)) {
          release = {
            tag_name: 'v1.0.3',
            name: 'KidsTodo v1.0.3 正式发布版',
            published_at: new Date().toISOString(),
            body: '### 🎮 KidsTodo v1.0.3 核心特性与更新：\n\n1. **系统级时钟倒计时无缝直达与自动启跑**：修复 Android 11+ 软件包可见性拦截，点击充能开机后瞬间联动系统官方时钟 App，并自动启动倒计时，锁屏休眠准时大声提醒！\n2. **Google Play 保护机制安全加固与权限精简**：移除 Cleartext 明文传输，精简高危闹钟与冗余权限，配置安全网络策略，大幅提升安全合规性。\n3. **彻底解决长按按钮抖动与白按问题**：采用定高容器、禁用页面手势缩放与文字选择，彻底解决按压最后一秒弹窗抽动或误判松手的体验缺陷。\n4. **防误触全额时间兑换**：长按满 3 秒全额结算兑换金库时间，彻底杜绝探索时的误扣与重复扣减。\n5. **家长后台每周结算与自由调账**：家长可随时一键结算清零或任意奖励/扣除分钟。',
            html_url: 'https://github.com/fake-okhub/child-todo/releases/tag/v1.0.3',
            assets: [
              {
                name: 'KidsTodo-Release-v1.0.3.apk',
                browser_download_url: 'https://github.com/fake-okhub/child-todo/releases/download/v1.0.3/KidsTodo-Release-v1.0.3.apk',
                url: 'https://api.github.com/repos/fake-okhub/child-todo/releases/assets/574337291',
                size: 4860000,
              },
              {
                name: 'KidsTodo-Debug-v1.0.3.apk',
                browser_download_url: 'https://github.com/fake-okhub/child-todo/releases/download/v1.0.3/KidsTodo-Debug-v1.0.3.apk',
                url: 'https://api.github.com/repos/fake-okhub/child-todo/releases/assets/574337305',
                size: 5990000,
              },
            ],
          };
        }


        const tagName = release.tag_name || 'v1.0.0';
        const versionClean = tagName.replace(/^v/, '');

        let releaseApk = null;
        let debugApk = null;

        if (Array.isArray(release.assets)) {
          for (const asset of release.assets) {
            const name = (asset.name || '').toLowerCase();
            if (name.includes('release') && name.endsWith('.apk')) {
              releaseApk = {
                name: asset.name,
                downloadUrl: asset.browser_download_url,
                apiUrl: asset.url,
                size: asset.size,
              };
            } else if (name.includes('debug') && name.endsWith('.apk')) {
              debugApk = {
                name: asset.name,
                downloadUrl: asset.browser_download_url,
                apiUrl: asset.url,
                size: asset.size,
              };
            }
          }
          if (!releaseApk && release.assets.length > 0) {
            const first = release.assets[0];
            releaseApk = {
              name: first.name,
              downloadUrl: first.browser_download_url,
              apiUrl: first.url,
              size: first.size,
            };
          }
        }

        const payload = {
          success: true,
          tagName,
          version: versionClean,
          name: release.name || `KidsTodo ${tagName}`,
          publishedAt: release.published_at,
          body: release.body || '',
          htmlUrl: release.html_url,
          releaseApk,
          debugApk,
        };

        if (env.TODO_KV) {
          try {
            await env.TODO_KV.put(cacheKey, JSON.stringify(payload), { expirationTtl: 300 });
          } catch {
            // ignore KV put error
          }
        }

        return new Response(JSON.stringify(payload), {
          headers: {
            ...headers,
            'Cache-Control': 'public, max-age=60, s-maxage=300',
          },
        });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, error: err.message }),
          { status: 500, headers }
        );
      }
    }

    // 1.2 Direct APK Download & Web Landing Page endpoint
    if (url.pathname === '/api/download-apk' || url.pathname === '/download') {
      try {
        const type = url.searchParams.get('type') || 'release';
        const cacheKey = 'app_latest_release_cache';

        let releaseDownloadUrl = 'https://github.com/fake-okhub/child-todo/releases/download/v1.0.3/KidsTodo-Release-v1.0.3.apk';
        let debugDownloadUrl = 'https://github.com/fake-okhub/child-todo/releases/download/v1.0.3/KidsTodo-Debug-v1.0.3.apk';
        let releaseVersion = 'v1.0.3';
        let fileSizeStr = '4.6 MB';

        // 1. Check KV Cache first
        if (env.TODO_KV) {
          try {
            const cached = await env.TODO_KV.get(cacheKey);
            if (cached) {
              const data = JSON.parse(cached);
              if (data.releaseApk?.downloadUrl) releaseDownloadUrl = data.releaseApk.downloadUrl;
              if (data.debugApk?.downloadUrl) debugDownloadUrl = data.debugApk.downloadUrl;
              if (data.tagName) releaseVersion = data.tagName;
              if (data.releaseApk?.size) fileSizeStr = (data.releaseApk.size / (1024 * 1024)).toFixed(1) + ' MB';
            }
          } catch {
            // ignore
          }
        }

        const targetDownloadUrl = type === 'debug' ? debugDownloadUrl : releaseDownloadUrl;

        // If request is from API or explicit direct parameter or non-HTML client, 302 redirect directly
        const isHtmlClient = (request.headers.get('accept') || '').includes('text/html');
        const isDirect = url.searchParams.has('direct') || url.pathname === '/api/download-apk';

        if (isDirect || !isHtmlClient) {
          return Response.redirect(targetDownloadUrl, 302);
        }

        // Return a sleek, modern, mobile-friendly landing page with automatic download
        const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>下载 Switch 能量小勇士 App - ${releaseVersion}</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <meta http-equiv="refresh" content="1;url=${targetDownloadUrl}" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-rose-500 selection:text-white">
  <div class="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl text-center space-y-6">
    <!-- App Logo Icon -->
    <div class="relative w-24 h-24 mx-auto">
      <div class="absolute -inset-2 bg-gradient-to-r from-rose-500 to-cyan-500 rounded-3xl blur-lg opacity-40 animate-pulse"></div>
      <img src="/favicon.svg" alt="App Icon" class="relative w-24 h-24 rounded-2xl shadow-xl object-contain" />
    </div>

    <!-- Title & Meta -->
    <div class="space-y-1">
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
        <span>🎮 KidsTodo · 一年级打卡与游戏激励</span>
      </div>
      <h1 class="text-2xl font-black text-white pt-1">Switch 能量小勇士</h1>
      <p class="text-xs text-slate-400">Android 原生正式版 (${releaseVersion} · ${fileSizeStr})</p>
    </div>

    <!-- Auto download notification banner -->
    <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3.5 text-xs text-emerald-400 flex items-center justify-center gap-2">
      <svg class="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>正在自动拉起下载，如未开始请点击下方按钮：</span>
    </div>

    <!-- Action Buttons -->
    <div class="space-y-2.5 pt-1">
      <a href="${targetDownloadUrl}" download class="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:opacity-90 active:scale-98 text-white font-black text-sm shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 transition-all">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
        </svg>
        <span>立即下载正式版安装包 (APK)</span>
      </a>

      <div class="flex gap-2">
        <a href="/" class="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700/60 transition-all flex items-center justify-center gap-1.5">
          <span>🌐 进入网页版</span>
        </a>
        <a href="${debugDownloadUrl}" download class="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold border border-slate-700/60 transition-all flex items-center justify-center gap-1.5">
          <span>🛠️ 调试版下载</span>
        </a>
      </div>
    </div>

    <!-- Installation tips -->
    <div class="text-left bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-[11px] text-slate-400 space-y-1.5 leading-relaxed">
      <p class="font-bold text-slate-300 flex items-center gap-1.5">
        <span>💡 安装提示：</span>
      </p>
      <p>1. 下载完成后点击安装包，若提示<span class="text-slate-200 font-semibold">“允许安装未知应用”</span>，在设置中开启该选项即可继续。</p>
      <p>2. 原生 App 具备系统级休眠定时闹铃提醒，到点高优先级唤醒播报，建议日常使用平板安装此 App。</p>
    </div>
  </div>

  <script>
    setTimeout(function() {
      window.location.href = "${targetDownloadUrl}";
    }, 600);
  </script>
</body>
</html>`;

        return new Response(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=60, s-maxage=300',
          },
        });
      } catch (err: any) {
        return Response.redirect('https://github.com/fake-okhub/child-todo/releases', 302);
      }
    }

    // 2. Cloud Sync endpoint: GET to load data, POST to save data
    if (url.pathname === '/api/sync') {
      const key = 'user_sync_data_default';

      if (request.method === 'GET') {
        let data = null;
        if (env.TODO_KV) {
          const raw = await env.TODO_KV.get(key);
          if (raw) data = JSON.parse(raw);
        }
        return new Response(JSON.stringify({ success: true, data }), { headers });
      }

      if (request.method === 'POST') {
        try {
          const body = await request.json();
          if (env.TODO_KV) {
            await env.TODO_KV.put(key, JSON.stringify(body));
          }
          return new Response(
            JSON.stringify({ success: true, syncedAt: new Date().toISOString() }),
            { headers }
          );
        } catch (e: any) {
          return new Response(
            JSON.stringify({ success: false, error: e.message }),
            { status: 400, headers }
          );
        }
      }
    }

    // 3. Multi-Engine TTS Audio streaming proxy endpoint (SiliconFlow, Azure, Google Cloud with 24h Edge CDN caching)
    if (url.pathname === '/api/tts') {
      let text = url.searchParams.get('text');
      let engine = url.searchParams.get('engine') || 'siliconflow';
      let voice = url.searchParams.get('voice');
      let apiKey = url.searchParams.get('key');
      let region = url.searchParams.get('region') || 'westus2';

      if (request.method === 'POST') {
        try {
          const body = await request.clone().json();
          if (body.text) text = body.text;
          if (body.engine) engine = body.engine;
          if (body.voice) voice = body.voice;
          if (body.key) apiKey = body.key;
          if (body.region) region = body.region;
        } catch {
          // ignore non-json post
        }
      }

      if (!text) {
        return new Response(JSON.stringify({ error: 'Missing text parameter' }), {
          status: 400,
          headers,
        });
      }

      const cleanText = text.slice(0, 200).trim();

      const audioHeaders = new Headers({
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
        'Access-Control-Allow-Origin': '*',
      });

      // 3.1 Route: Microsoft Azure Speech (Official Neural Voices)
      if (engine === 'azure') {
        const azureKey = apiKey || 'EnNTfoTVgTuHScOadfJOs5Y9WmxUBCe1WbB1ki33c5R0BzGtKeGfJQQJ99CGAC8vTInXJ3w3AAAYACOGXqt3';
        const azureRegion = region || 'westus2';
        const targetVoice = voice || 'zh-CN-XiaoxiaoNeural';

        const escaped = cleanText
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');

        const ssml = `<speak version='1.0' xml:lang='zh-CN'><voice xml:lang='zh-CN' name='${targetVoice}'>${escaped}</voice></speak>`;

        try {
          const azureRes = await fetch(`https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
            method: 'POST',
            headers: {
              'Ocp-Apim-Subscription-Key': azureKey,
              'Content-Type': 'application/ssml+xml',
              'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
              'User-Agent': 'KidsTodo',
            },
            body: ssml,
          });

          if (azureRes.ok) {
            return new Response(azureRes.body, { headers: audioHeaders });
          }
          console.warn('Azure TTS returned non-200, status:', azureRes.status);
        } catch (err) {
          console.error('Azure TTS error, falling back:', err);
        }
      }

      // 3.2 Route: Google Cloud Text-to-Speech (Chirp3-HD & WaveNet)
      if (engine === 'google') {
        const googleKey = apiKey || 'AIzaSyBC3BFRYc8g9xIY0v10hEOJuX9mp7WNZjA';
        const targetVoice = voice || 'cmn-CN-Chirp3-HD-Achernar';

        try {
          const googleRes = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              input: { text: cleanText },
              voice: {
                languageCode: 'cmn-CN',
                name: targetVoice,
              },
              audioConfig: {
                audioEncoding: 'MP3',
              },
            }),
          });

          if (googleRes.ok) {
            const gData = (await googleRes.json()) as { audioContent?: string };
            if (gData.audioContent) {
              const binaryString = atob(gData.audioContent);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              return new Response(bytes.buffer, { headers: audioHeaders });
            }
          }
          console.warn('Google TTS returned non-200, status:', googleRes.status);
        } catch (err) {
          console.error('Google TTS error, falling back:', err);
        }
      }

      // 3.3 Route: SiliconFlow CosyVoice2
      if (engine === 'siliconflow') {
        const sfKey = apiKey || 'sk-bztigxzwzjrdfieytvdsovkekfgwvabwtahcvqfwcamjdebv';
        const targetVoice = voice || 'FunAudioLLM/CosyVoice2-0.5B:claire';

        try {
          const sfRes = await fetch('https://api.siliconflow.cn/v1/audio/speech', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sfKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'FunAudioLLM/CosyVoice2-0.5B',
              input: cleanText,
              voice: targetVoice.includes(':') ? targetVoice : `FunAudioLLM/CosyVoice2-0.5B:${targetVoice}`,
              response_format: 'mp3',
            }),
          });

          if (sfRes.ok) {
            return new Response(sfRes.body, { headers: audioHeaders });
          }
          console.warn('SiliconFlow TTS returned non-200, status:', sfRes.status);
        } catch (err) {
          console.error('SiliconFlow TTS error, falling back:', err);
        }
      }

      // 3.4 Fallback: Google Neural stream fallback
      const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-CN&client=tw-ob&q=${encodeURIComponent(cleanText)}`;

      try {
        const upstreamRes = await fetch(targetUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://translate.google.com/',
          },
        });

        if (upstreamRes.ok) {
          return new Response(upstreamRes.body, { headers: audioHeaders });
        }
        return new Response('TTS upstream error', { status: 502, headers });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers,
        });
      }
    }

    // 4. Serve Frontend Web App (HTML/CSS/JS) via Cloudflare Assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404, headers });
  },
};

/**
 * Cloudflare Worker for Kids Todo Sync (kidstodo.jac.edu.kg)
 */

export interface Env {
  TODO_KV?: KVNamespace;
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

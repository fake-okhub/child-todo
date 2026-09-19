# 🎮 Switch 能量小勇士 (KidsTodo)

> 专为一年级儿童打造的学科自律打卡与 Nintendo Switch 游戏时间激励系统。
> 结合趣味游戏化正向反馈、AI 多音色生字伴读、Android 原生轻量壳、系统级定时闹铃与 Cloudflare 全球边缘云同步。

[![Online URL](https://img.shields.io/badge/Web-kidstodo.jac.edu.kg-brightgreen)](https://kidstodo.jac.edu.kg)
[![React](https://img.shields.io/badge/React-19.2-blue)](https://react.dev/)
[![Android](https://img.shields.io/badge/Android-Kotlin%208.2-orange)](https://developer.android.com/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers%20KV-F38020)](https://workers.cloudflare.com/)

---

## 🌟 核心特色与功能

### 1. 🎒 一年级基础学科自律打卡
- **5 门核心基础学科**：识字表读背与田字格描红、声母韵母拼读、数学口算天天练、英语趣配音、绘本专注阅读。每完成一科固定奖励 **+5 分钟**。
- **好习惯自动触发**：当日自觉完成全部 5 门基础学科，系统自动解锁 **★ 好习惯大奖（+5 分钟）**。
- **全勤奖励**：周一至周五工作日全勤无缺漏，额外赠送 **+15 分钟**。

### 2. ⚡ Nintendo Switch 能量金库
- 孩子平日完成学科任务积攒的游戏时长，无上限存入金库；
- 周末开启畅玩模式，具备沉浸式倒计时与超时提醒，引导孩子自主守时。

### 3. ⏰ 家长管理后台与极简 iOS 滚轮闹铃
- **独立家长门禁**：大写中文数字验证码（如“叁”），防止孩子误触修改；
- **极简 iOS 滚轮时间选择器**：纯原生双列滚筒上下滑动，动态设定每日提醒时间；
- **系统级准时唤醒**：在 Android 原生壳下通过 `AlarmManager` + `WakeLock` 深度调度，锁屏休眠或切到后台均能准时弹出顶部 Heads-Up 高优先级通知响铃；设备重启自动恢复调度。

### 4. 🎙️ 多引擎 AI 伴读与离线原生语音
- **阿里通义 CosyVoice2 大模型**：知性少儿名师音色（claire/diana/anna等）；
- **微软 Azure 官方神经语音**：晓晓少儿金牌伴读、云希活泼男童音；
- **谷歌云 TTS**：最新超高清 Chirp3-HD 系列音色；
- **安卓底层原生离线发音**：通过 `window.AndroidBridge` 桥接原生系统 `TextToSpeech`，断网 0ms 瞬间朗读生字与拼音。

### 5. ☁️ 云端优先与离线双模存储
- **数据源**：Cloudflare KV 全球分布式边缘数据库；
- **双模体验**：SWR 策略毫秒级加载本地缓存，后台静默云同步，跨设备（iPad / 安卓平板 / 手机）数据实时一致。

---

## 📱 原生 Android 轻量壳 (`android/`)

- 采用原生 Kotlin + WebView 架构，体积仅 **4.4MB**，0 跨端框架冗余包袱；
- 预置已签名的正式 Release 生产包与 Debug 调试包；
- 远程直连线上应用，前端功能升级无需孩子平板频繁重装 APK。

### 安装与编译

```bash
# 1. 直接安装已生成的正式 Release APK 到安卓平板
adb install -r android/app/build/outputs/apk/release/app-release.apk

# 2. 或通过 Gradle 重新编译 Release 包
cd android && ./gradlew assembleRelease
```

---

## 💻 Web 前端开发与部署

```bash
# 安装依赖
pnpm install

# 本地启动
pnpm dev

# 生产环境打包
pnpm build

# 部署至 Cloudflare Workers
npx wrangler deploy
```

---

## 🌐 体验入口

- **生产环境自定义域名**：[https://kidstodo.jac.edu.kg](https://kidstodo.jac.edu.kg)
- **Cloudflare 托管域名**：[https://kidstodo.joysonchengg.workers.dev](https://kidstodo.joysonchengg.workers.dev)

---

## 📄 License

MIT License

package com.kidstodo.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebView
import java.util.Calendar

class AndroidBridge(
    private val activity: MainActivity,
    private val webView: WebView,
    private val ttsManager: TTSManager,
    private val updateManager: UpdateManager
) {

    companion object {
        private const val TAG = "KidsTodoBridge"
        private const val PREFS_NAME = "kidstodo_settings"
        private const val KEY_REMINDER_ENABLED = "reminder_enabled"
        private const val KEY_REMINDER_TIME = "reminder_time"
        private const val KEY_REMINDER_TITLE = "reminder_title"
        private const val KEY_REMINDER_MESSAGE = "reminder_message"
        private const val ALARM_REQUEST_CODE = 9988

        fun getPrefs(context: Context): SharedPreferences {
            return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        }

        fun rescheduleNextDailyAlarm(context: Context) {
            val prefs = getPrefs(context)
            val enabled = prefs.getBoolean(KEY_REMINDER_ENABLED, false)
            val timeStr = prefs.getString(KEY_REMINDER_TIME, "17:30") ?: "17:30"
            val title = prefs.getString(KEY_REMINDER_TITLE, "⏰ 小勇士打卡提醒") ?: "⏰ 小勇士打卡提醒"
            val message = prefs.getString(
                KEY_REMINDER_MESSAGE,
                "放学啦！记得完成今日 5 科打卡，积累周末 Switch 能量哦！"
            ) ?: "放学啦！记得完成今日 5 科打卡，积累周末 Switch 能量哦！"

            if (enabled) {
                scheduleAlarm(context, timeStr, title, message)
            } else {
                cancelAlarm(context)
            }
        }

        private fun scheduleAlarm(
            context: Context,
            timeStr: String,
            title: String,
            message: String
        ) {
            try {
                val parts = timeStr.split(":")
                if (parts.size != 2) return
                val hour = parts[0].toIntOrNull() ?: 17
                val minute = parts[1].toIntOrNull() ?: 30

                val calendar = Calendar.getInstance().apply {
                    set(Calendar.HOUR_OF_DAY, hour)
                    set(Calendar.MINUTE, minute)
                    set(Calendar.SECOND, 0)
                    set(Calendar.MILLISECOND, 0)
                }

                // If scheduled time already passed today, set for tomorrow
                if (calendar.timeInMillis <= System.currentTimeMillis()) {
                    calendar.add(Calendar.DAY_OF_YEAR, 1)
                }

                val intent = Intent(context, AlarmReceiver::class.java).apply {
                    putExtra("title", title)
                    putExtra("message", message)
                    putExtra("isTest", false)
                }

                val pendingIntent = PendingIntent.getBroadcast(
                    context,
                    ALARM_REQUEST_CODE,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )

                val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        calendar.timeInMillis,
                        pendingIntent
                    )
                } else {
                    alarmManager.setExact(
                        AlarmManager.RTC_WAKEUP,
                        calendar.timeInMillis,
                        pendingIntent
                    )
                }

                Log.i(
                    TAG,
                    "Alarm scheduled at ${calendar.time} for target time $timeStr"
                )
            } catch (e: Exception) {
                Log.e(TAG, "Failed to schedule alarm: ${e.message}", e)
            }
        }

        private fun cancelAlarm(context: Context) {
            try {
                val intent = Intent(context, AlarmReceiver::class.java)
                val pendingIntent = PendingIntent.getBroadcast(
                    context,
                    ALARM_REQUEST_CODE,
                    intent,
                    PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
                )
                if (pendingIntent != null) {
                    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
                    alarmManager.cancel(pendingIntent)
                    pendingIntent.cancel()
                    Log.i(TAG, "Alarm cancelled successfully")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to cancel alarm: ${e.message}", e)
            }
        }
    }

    @JavascriptInterface
    fun isApp(): Boolean {
        return true
    }

    @JavascriptInterface
    fun isAndroidApp(): Boolean {
        return true
    }

    @JavascriptInterface
    fun speak(text: String) {
        Handler(Looper.getMainLooper()).post {
            ttsManager.speak(text)
        }
    }

    @JavascriptInterface
    fun stopAudio() {
        Handler(Looper.getMainLooper()).post {
            ttsManager.stop()
        }
    }

    @JavascriptInterface
    fun setDailyReminder(enabled: Boolean, timeStr: String, title: String, message: String) {
        Log.i(TAG, "setDailyReminder called: enabled=$enabled, time=$timeStr, title=$title")
        val prefs = getPrefs(activity)
        prefs.edit()
            .putBoolean(KEY_REMINDER_ENABLED, enabled)
            .putString(KEY_REMINDER_TIME, timeStr)
            .putString(KEY_REMINDER_TITLE, title)
            .putString(KEY_REMINDER_MESSAGE, message)
            .apply()

        if (enabled) {
            scheduleAlarm(activity, timeStr, title, message)
        } else {
            cancelAlarm(activity)
        }
    }

    @JavascriptInterface
    fun testReminder(title: String, message: String) {
        Log.i(TAG, "testReminder called: title=$title, message=$message")
        Handler(Looper.getMainLooper()).post {
            val intent = Intent(activity, AlarmReceiver::class.java).apply {
                putExtra("title", title)
                putExtra("message", message)
                putExtra("isTest", true)
            }
            activity.sendBroadcast(intent)
        }
    }

    @JavascriptInterface
    fun keepScreenOn(enabled: Boolean) {
        Handler(Looper.getMainLooper()).post {
            if (enabled) {
                activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            } else {
                activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            }
        }
    }

    @JavascriptInterface
    fun getAppVersion(): String {
        return updateManager.getAppVersion()
    }

    @JavascriptInterface
    fun getAppVersionCode(): Int {
        return updateManager.getAppVersionCode()
    }

    @JavascriptInterface
    fun downloadAndInstallApk(downloadUrl: String, versionName: String) {
        updateManager.downloadAndInstall(downloadUrl, versionName)
    }

    @JavascriptInterface
    fun installApk(filePath: String) {
        updateManager.installApk(java.io.File(filePath))
    }
}

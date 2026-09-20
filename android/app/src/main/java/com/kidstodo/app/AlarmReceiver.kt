package com.kidstodo.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat

class AlarmReceiver : BroadcastReceiver() {

    companion object {
        const val CHANNEL_ID = "kidstodo_daily_reminder_channel"
        const val CHANNEL_NAME = "每日打卡定时提醒"
        const val GAMING_CHANNEL_ID = "kidstodo_gaming_alarm_channel"
        const val GAMING_CHANNEL_NAME = "Switch 游玩倒计时闹铃"
        const val NOTIFICATION_ID = 1001
        const val GAMING_NOTIFICATION_ID = 1002
        private const val TAG = "KidsTodoAlarm"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val isGamingAlarm = intent.getBooleanExtra("isGamingAlarm", false)
        val title = intent.getStringExtra("title")
            ?: if (isGamingAlarm) "🎮 Switch 游戏时间到啦！" else "⏰ 小勇士打卡提醒"
        val message = intent.getStringExtra("message")
            ?: if (isGamingAlarm) "本次 Switch 畅玩时间已结束，闭上眼睛休息一下吧！" else "放学啦！记得完成今日 5 科打卡，积累周末 Switch 能量哦！"
        val isTest = intent.getBooleanExtra("isTest", false)

        Log.i(TAG, "Alarm received: title='$title', isGamingAlarm=$isGamingAlarm, isTest=$isTest")

        // 1. Acquire wake lock with ACQUIRE_CAUSES_WAKEUP to ensure screen lights up reliably
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
        val wakeLock = powerManager?.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
            "KidsTodo:AlarmWakeLock"
        )
        wakeLock?.acquire(15 * 1000L) // 15 seconds timeout

        // 2. Launch Intent for user tapping the notification
        val tapIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("openedFromAlarm", true)
            if (isGamingAlarm) {
                putExtra("openedFromGamingAlarm", true)
            }
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            if (isGamingAlarm) 1 else 0,
            tapIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // 3. Select alarm/notification sound (TYPE_ALARM for gaming, TYPE_NOTIFICATION for daily reminder)
        val targetSoundUri = if (isGamingAlarm) {
            RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
        } else {
            RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
        }

        // 4. Create Notification Manager & Channel
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val targetChannelId = if (isGamingAlarm) GAMING_CHANNEL_ID else CHANNEL_ID
        val targetChannelName = if (isGamingAlarm) GAMING_CHANNEL_NAME else CHANNEL_NAME

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val audioAttributes = AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(if (isGamingAlarm) AudioAttributes.USAGE_ALARM else AudioAttributes.USAGE_NOTIFICATION)
                .build()

            val channel = NotificationChannel(
                targetChannelId,
                targetChannelName,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = if (isGamingAlarm) "Switch 畅玩倒计时结束闹铃" else "Todo 乐园每日定时打卡提醒通知"
                enableLights(true)
                enableVibration(true)
                vibrationPattern = if (isGamingAlarm) longArrayOf(0, 500, 300, 500, 300, 800) else longArrayOf(0, 300, 200, 300)
                setSound(targetSoundUri, audioAttributes)
            }
            notificationManager.createNotificationChannel(channel)
        }

        // 5. Build and present Heads-Up notification
        val notification = NotificationCompat.Builder(context, targetChannelId)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setSound(targetSoundUri)
            .setVibrate(if (isGamingAlarm) longArrayOf(0, 500, 300, 500, 300, 800) else longArrayOf(0, 300, 200, 300))
            .setContentIntent(pendingIntent)
            .build()

        notificationManager.notify(if (isGamingAlarm) GAMING_NOTIFICATION_ID else NOTIFICATION_ID, notification)

        // 6. Reschedule next day's alarm only if this was regular daily scheduled alarm (not gaming timer and not test)
        if (!isTest && !isGamingAlarm) {
            AndroidBridge.rescheduleNextDailyAlarm(context)
        }

        wakeLock?.release()
    }
}

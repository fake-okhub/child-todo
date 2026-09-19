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
        const val NOTIFICATION_ID = 1001
        private const val TAG = "KidsTodoAlarm"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val title = intent.getStringExtra("title") ?: "⏰ 小勇士打卡提醒"
        val message = intent.getStringExtra("message") ?: "放学啦！记得完成今日 5 科打卡，积累周末 Switch 能量哦！"
        val isTest = intent.getBooleanExtra("isTest", false)

        Log.i(TAG, "Alarm received: title='$title', message='$message', isTest=$isTest")

        // 1. Acquire partial wake lock to ensure notification displays reliably
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
        val wakeLock = powerManager?.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
            "KidsTodo:AlarmWakeLock"
        )
        wakeLock?.acquire(10 * 1000L) // 10 seconds timeout

        // 2. Launch Intent for user tapping the notification
        val tapIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("openedFromAlarm", true)
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            tapIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // 3. Notification sound
        val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

        // 4. Create Notification Manager & Channel
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val audioAttributes = AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .build()

            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Todo 乐园每日定时打卡提醒通知"
                enableLights(true)
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 300, 200, 300)
                setSound(defaultSoundUri, audioAttributes)
            }
            notificationManager.createNotificationChannel(channel)
        }

        // 5. Build and present Heads-Up notification
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setSound(defaultSoundUri)
            .setVibrate(longArrayOf(0, 300, 200, 300))
            .setContentIntent(pendingIntent)
            .build()

        notificationManager.notify(NOTIFICATION_ID, notification)

        // 6. Reschedule next day's alarm if this was a scheduled alarm (not one-time test)
        if (!isTest) {
            AndroidBridge.rescheduleNextDailyAlarm(context)
        }

        wakeLock?.release()
    }
}

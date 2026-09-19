package com.kidstodo.app

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Log
import android.webkit.WebView
import android.widget.Toast
import androidx.core.content.FileProvider
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL

class UpdateManager(
    private val activity: MainActivity,
    private val webView: WebView
) {
    companion object {
        private const val TAG = "UpdateManager"
    }

    private val mainHandler = Handler(Looper.getMainLooper())
    var pendingInstallFile: File? = null
        private set

    fun getAppVersion(): String {
        return try {
            val pInfo = activity.packageManager.getPackageInfo(activity.packageName, 0)
            pInfo.versionName ?: "1.0.0"
        } catch (e: Exception) {
            "1.0.0"
        }
    }

    fun getAppVersionCode(): Int {
        return try {
            val pInfo = activity.packageManager.getPackageInfo(activity.packageName, 0)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                pInfo.longVersionCode.toInt()
            } else {
                @Suppress("DEPRECATION")
                pInfo.versionCode
            }
        } catch (e: Exception) {
            1
        }
    }

    fun downloadAndInstall(downloadUrl: String, versionName: String) {
        Log.i(TAG, "Starting APK download from: $downloadUrl (version: $versionName)")
        
        mainHandler.post {
            Toast.makeText(activity, "正在下载 KidsTodo $versionName 新版本更新包...", Toast.LENGTH_SHORT).show()
        }

        Thread {
            try {
                val downloadDir = activity.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
                    ?: activity.cacheDir
                val apkFile = File(downloadDir, "KidsTodo-$versionName.apk")
                if (apkFile.exists()) {
                    apkFile.delete()
                }

                var currentUrl = downloadUrl
                var conn: HttpURLConnection
                var redirectCount = 0

                // Follow redirects (GitHub Release downloads redirect to AWS S3)
                while (true) {
                    val url = URL(currentUrl)
                    conn = url.openConnection() as HttpURLConnection
                    conn.connectTimeout = 15000
                    conn.readTimeout = 30000
                    conn.instanceFollowRedirects = false
                    conn.setRequestProperty("User-Agent", "KidsTodo-Android-App/${getAppVersion()}")
                    conn.setRequestProperty("Accept", "application/octet-stream, */*")
                    conn.connect()

                    val responseCode = conn.responseCode
                    if (responseCode in 300..399) {
                        val location = conn.getHeaderField("Location")
                        conn.disconnect()
                        if (location != null && redirectCount < 10) {
                            currentUrl = location
                            redirectCount++
                            continue
                        } else {
                            throw Exception("Too many redirects or missing Location header: $responseCode")
                        }
                    }

                    if (responseCode != HttpURLConnection.HTTP_OK) {
                        throw Exception("Server returned HTTP response: $responseCode")
                    }
                    break
                }

                val fileLength = conn.contentLength.toLong()
                val inputStream = conn.inputStream
                val outputStream = FileOutputStream(apkFile)

                val buffer = ByteArray(8192)
                var totalBytesRead = 0L
                var bytesRead: Int
                var lastReportedPercent = -1

                while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                    outputStream.write(buffer, 0, bytesRead)
                    totalBytesRead += bytesRead

                    if (fileLength > 0) {
                        val percent = ((totalBytesRead * 100) / fileLength).toInt()
                        if (percent != lastReportedPercent) {
                            lastReportedPercent = percent
                            notifyProgress(percent, totalBytesRead, fileLength)
                        }
                    }
                }

                outputStream.flush()
                outputStream.close()
                inputStream.close()
                conn.disconnect()

                Log.i(TAG, "Download finished successfully: ${apkFile.absolutePath} (${apkFile.length()} bytes)")

                notifySuccess(apkFile.absolutePath)

                // Trigger package installer on UI thread
                mainHandler.post {
                    installApk(apkFile)
                }

            } catch (e: Exception) {
                Log.e(TAG, "Failed to download update: ${e.message}", e)
                val errMsg = e.message ?: "未知下载错误"
                notifyError(errMsg)
                mainHandler.post {
                    Toast.makeText(activity, "下载更新失败: $errMsg", Toast.LENGTH_LONG).show()
                }
            }
        }.start()
    }

    fun installApk(file: File) {
        try {
            if (!file.exists()) {
                Toast.makeText(activity, "安装文件不存在: ${file.name}", Toast.LENGTH_SHORT).show()
                return
            }

            // Android 8.0+ permission check
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (!activity.packageManager.canRequestPackageInstalls()) {
                    pendingInstallFile = file
                    Toast.makeText(
                        activity,
                        "请开启“允许安装未知应用”权限，开启后返回即可自动安装",
                        Toast.LENGTH_LONG
                    ).show()
                    val reqIntent = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
                        data = Uri.parse("package:${activity.packageName}")
                    }
                    activity.startActivity(reqIntent)
                    return
                }
            }

            val intent = Intent(Intent.ACTION_VIEW).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
                val apkUri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    FileProvider.getUriForFile(activity, "${activity.packageName}.fileprovider", file)
                } else {
                    Uri.fromFile(file)
                }
                setDataAndType(apkUri, "application/vnd.android.package-archive")
            }

            pendingInstallFile = null
            activity.startActivity(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to trigger install: ${e.message}", e)
            Toast.makeText(activity, "无法启动安装程序: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    fun checkPendingInstall() {
        val file = pendingInstallFile ?: return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (activity.packageManager.canRequestPackageInstalls()) {
                Log.i(TAG, "Permission granted! Resuming pending install: ${file.name}")
                installApk(file)
            }
        }
    }

    private fun notifyProgress(percent: Int, current: Long, total: Long) {
        mainHandler.post {
            val script = "window.onUpdateDownloadProgress && window.onUpdateDownloadProgress($percent, $current, $total);"
            webView.evaluateJavascript(script, null)
        }
    }

    private fun notifySuccess(path: String) {
        mainHandler.post {
            val escapedPath = path.replace("\\", "\\\\").replace("'", "\\'")
            val script = "window.onUpdateDownloadSuccess && window.onUpdateDownloadSuccess('$escapedPath');"
            webView.evaluateJavascript(script, null)
        }
    }

    private fun notifyError(error: String) {
        mainHandler.post {
            val escapedErr = error.replace("\\", "\\\\").replace("'", "\\'")
            val script = "window.onUpdateDownloadError && window.onUpdateDownloadError('$escapedErr');"
            webView.evaluateJavascript(script, null)
        }
    }
}

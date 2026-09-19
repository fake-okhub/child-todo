# Keep JavaScript interfaces so WebView can communicate with Native Kotlin
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class com.kidstodo.app.AndroidBridge { *; }

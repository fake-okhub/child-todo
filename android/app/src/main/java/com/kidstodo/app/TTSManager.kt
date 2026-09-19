package com.kidstodo.app

import android.content.Context
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import java.util.Locale

class TTSManager(private val context: Context) : TextToSpeech.OnInitListener {

    private var tts: TextToSpeech? = null
    private var isInitialized = false
    private var pendingText: String? = null

    companion object {
        private const val TAG = "KidsTodoTTS"
        private const val UTTERANCE_ID = "kidstodo_tts_utterance"
    }

    init {
        tts = TextToSpeech(context.applicationContext, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            val result = tts?.setLanguage(Locale.SIMPLIFIED_CHINESE)
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                Log.w(TAG, "Simplified Chinese not fully supported, attempting default Locale...")
                tts?.setLanguage(Locale.CHINESE)
            }
            tts?.setPitch(1.05f) // Slightly friendly kid-friendly pitch
            tts?.setSpeechRate(0.92f) // Slightly relaxed pace for 1st grade comprehension

            tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) {
                    Log.d(TAG, "TTS onStart: $utteranceId")
                }

                override fun onDone(utteranceId: String?) {
                    Log.d(TAG, "TTS onDone: $utteranceId")
                }

                @Deprecated("Deprecated in Java")
                override fun onError(utteranceId: String?) {
                    Log.e(TAG, "TTS onError: $utteranceId")
                }
            })

            isInitialized = true
            Log.i(TAG, "Android Native TextToSpeech initialized successfully")

            pendingText?.let {
                speak(it)
                pendingText = null
            }
        } else {
            Log.e(TAG, "Failed to initialize Android TextToSpeech, status=$status")
        }
    }

    fun speak(text: String) {
        if (text.isBlank()) return

        if (!isInitialized) {
            Log.d(TAG, "TTS not ready yet, queuing text: $text")
            pendingText = text
            return
        }

        try {
            val params = Bundle().apply {
                putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f)
            }
            tts?.speak(text, TextToSpeech.QUEUE_FLUSH, params, UTTERANCE_ID)
        } catch (e: Exception) {
            Log.e(TAG, "Error in TTS speak: ${e.message}", e)
        }
    }

    fun stop() {
        try {
            tts?.stop()
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping TTS: ${e.message}", e)
        }
    }

    fun shutdown() {
        try {
            tts?.stop()
            tts?.shutdown()
            tts = null
            isInitialized = false
        } catch (e: Exception) {
            Log.e(TAG, "Error shutting down TTS: ${e.message}", e)
        }
    }
}

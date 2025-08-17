interface TTSOptions {
  text: string
  voiceId?: string
  stability?: number
  similarityBoost?: number
}

interface TTSResponse {
  audioUrl: string
  duration: number
  success: boolean
  error?: string
}

class TTSService {
  private apiKey: string | null = null
  private baseUrl = 'https://api.elevenlabs.io/v1'
  private defaultVoiceId = 'pNInz6obpgDQGcFmaJgB' // Adam voice (good for game show host)
  private isConfigured = false

  constructor() {
    this.apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY
    this.isConfigured = !!(this.apiKey && this.apiKey !== 'your-elevenlabs-api-key-here')
  }

  async generateSpeech(options: TTSOptions): Promise<TTSResponse> {
    if (!this.isConfigured) {
      return {
        audioUrl: '',
        duration: 0,
        success: false,
        error: 'ElevenLabs API key not configured'
      }
    }

    const voiceId = options.voiceId || this.defaultVoiceId
    
    try {
      const enhancedText = this.enhanceTextForSpeech(options.text)
      
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey!,
        },
        body: JSON.stringify({
          text: enhancedText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: options.stability ?? 0.6,
            similarity_boost: options.similarityBoost ?? 0.8,
            style: 0.7, // More expressive for game show host
            use_speaker_boost: true
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`)
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      // Estimate duration based on text length
      const wordCount = options.text.split(/\s+/).length
      const estimatedDuration = Math.ceil(wordCount / 3) * 1000 // ~3 words per second

      return {
        audioUrl,
        duration: estimatedDuration,
        success: true
      }
    } catch (error) {
      console.error('TTS generation failed:', error)
      
      let errorMessage = 'Unknown TTS error'
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error: Unable to reach ElevenLabs API'
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      return {
        audioUrl: '',
        duration: 0,
        success: false,
        error: errorMessage
      }
    }
  }

  private enhanceTextForSpeech(text: string): string {
    let enhanced = text

    // Add natural pauses for better speech flow
    enhanced = enhanced.replace(/([.!?])\s+([A-Z])/g, '$1 <break time="0.4s" /> $2')
    enhanced = enhanced.replace(/,\s+/g, ', <break time="0.2s" /> ')
    
    // Enhance excitement for game show energy
    enhanced = enhanced.replace(/!/g, '! <prosody rate="fast" pitch="+10%"></prosody>')
    
    return enhanced
  }

  isReady(): boolean {
    return this.isConfigured
  }

  getConfigurationHelp(): string {
    return `To enable AI voice synthesis:
1. Get an ElevenLabs API key from https://elevenlabs.io/
2. Add it to your .env file: VITE_ELEVENLABS_API_KEY=your-key-here
3. Restart the development server`
  }

  // Cleanup blob URLs to prevent memory leaks
  revokeAudioUrl(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  }
}

export const ttsService = new TTSService()
export type { TTSOptions, TTSResponse }

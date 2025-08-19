import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk'

export interface DeepgramResponse {
  transcript: string
  isFinal: boolean
  confidence: number
}

class DeepgramService {
  private deepgram: any = null
  private connection: any = null
  private mediaRecorder: MediaRecorder | null = null
  private isConfigured = false
  private isListening = false

  constructor() {
    const apiKey = (import.meta as any).env.VITE_DEEPGRAM_API_KEY
    
    if (apiKey && apiKey !== 'your-deepgram-api-key-here') {
      try {
        this.deepgram = createClient(apiKey)
        this.isConfigured = true
      } catch (error) {
        console.error('Failed to initialize Deepgram client:', error)
        this.isConfigured = false
      }
    }
  }

  async startListening(
    onTranscript: (response: DeepgramResponse) => void,
    onError: (error: any) => void,
    onStarted: () => void,
    onEnded: () => void
  ): Promise<boolean> {
    if (!this.isConfigured) {
      onError('Deepgram API key not configured.')
      return false
    }
    if (this.isListening) {
      console.warn('Already listening with Deepgram.')
      return true
    }

    try {
      this.connection = this.deepgram.listen.live({
        model: 'nova-2',
        smart_format: true,
        interim_results: true,
        language: 'en-US',
        utterance_end_ms: 1000, // End utterance after 1 second of silence
        endpointing: 100 // Milliseconds of silence to wait before sending final transcript
      })

      this.connection.on(LiveTranscriptionEvents.Open, () => {
        console.log('Deepgram connection opened.')
        onStarted()
        this.isListening = true
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
            this.mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0 && this.connection.getReadyState() === 1) {
                this.connection.send(event.data)
              }
            }
            this.mediaRecorder.start(250) // Send data every 250ms
          })
          .catch(err => {
            console.error('Error accessing microphone:', err)
            onError('Microphone access denied or failed.')
            this.stopListening()
          })
      })

      this.connection.on(LiveTranscriptionEvents.Close, () => {
        console.log('Deepgram connection closed.')
        this.stopListening()
        onEnded()
      })

      this.connection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
        const transcript = data.channel.alternatives[0].transcript
        const isFinal = data.is_final
        const confidence = data.channel.alternatives[0].confidence
        onTranscript({ transcript, isFinal, confidence })
      })

      this.connection.on(LiveTranscriptionEvents.Error, (error: any) => {
        console.error('Deepgram LiveTranscriptionEvents.Error:', error)
        onError(error)
        this.stopListening()
      })

      return true
    } catch (error) {
      console.error('Failed to establish Deepgram connection:', error)
      onError('Failed to establish Deepgram connection.')
      return false
    }
  }

  stopListening(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop()
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop())
      this.mediaRecorder = null
    }
    if (this.connection) {
      this.connection.finish()
      this.connection = null
    }
    this.isListening = false
  }

  isReady(): boolean {
    return this.isConfigured
  }

  getConfigurationHelp(): string {
    return `To enable Deepgram speech recognition:
    1. Get a Deepgram API key from https://console.deepgram.com/
    2. Add it to your .env file: VITE_DEEPGRAM_API_KEY=your-key-here
    3. Restart the development server`
  }
}

export const deepgramService = new DeepgramService()

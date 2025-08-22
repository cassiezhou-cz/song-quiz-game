import { aiService, type AIResponse } from './aiService'
import { ttsService, type TTSResponse } from './ttsService'

export interface HostResponse {
  text: string
  audioUrl?: string
  success: boolean
  error?: string
}

interface CharacterInfo {
  name: string
  emoji: string
  personality: string
  voiceId?: string
}

export class GameHostManager {
  private initialized = false
  private currentPersonality = 'riley'
  private isReady = false

  constructor() {
    this.isReady = aiService.isReady()
  }

  private getCharacterInfo(characterId: string): CharacterInfo {
    const characters: Record<string, CharacterInfo> = {
      riley: { 
        name: 'Riley', 
        emoji: '🎤', 
        personality: 'energetic',
        voiceId: 'h2dQOVyUfIDqY2whPOMo' // Nayva
      },
      willow: { 
        name: 'Willow', 
        emoji: '🌿', 
        personality: 'wise',
        voiceId: 'yj30vwTGJxSHezdAGsv9' // Jessa
      },
      alex: { 
        name: 'Alex', 
        emoji: '🎧', 
        personality: 'cool',
        voiceId: 'yl2ZDV1MzN4HbQJbMihG' // Alex
      },
      jordan: { 
        name: 'Jordan', 
        emoji: '😄', 
        personality: 'funny',
        voiceId: 'x8xv0H8Ako6Iw3cKXLoC' // Haven
      }
    }
    return characters[characterId] || characters.riley
  }

  async initialize(personalityId: string = 'riley'): Promise<boolean> {
    try {
      // Handle the "none" case - user doesn't want AI host
      if (personalityId === 'none') {
        console.log('🎪 AI Host: Disabled by user selection')
        this.initialized = false
        return false
      }

      this.currentPersonality = personalityId
      this.isReady = aiService.isReady()
      this.initialized = true

      console.log(`🎪 AI Host: Initialized with ${personalityId} personality`)
      return true

    } catch (error) {
      console.error('AI Host: Initialization error:', error)
      this.initialized = false
      return false
    }
  }

  async celebrateCorrectAnswer(
    playerName: string,
    playerScore: number,
    songTitle: string,
    songArtist: string,
    options?: {
      responseLength?: 'short' | 'medium' | 'long'
      generateVoice?: boolean
    }
  ): Promise<HostResponse> {
    if (!this.initialized) {
      return { text: 'Nice job!', success: false, error: 'Host not initialized' }
    }

    try {
      const character = this.getCharacterInfo(this.currentPersonality)
      const context = {
        gamePhase: 'correct_answer' as const,
        playerName,
        playerScore,
        opponentScore: 0,
        songTitle,
        songArtist,
        isCorrect: true,
        responseLength: options?.responseLength || 'medium',
        character
      }

      const response = await aiService.generateHostComment(context)
      
      let audioUrl: string | undefined

      if (options?.generateVoice && response.text && ttsService.isReady()) {
        const ttsResponse = await ttsService.generateSpeech({
          text: response.text,
          voiceId: character.voiceId,
          stability: 0.6,
          similarityBoost: 0.8
        })

        if (ttsResponse.success) {
          audioUrl = ttsResponse.audioUrl
        }
      }

      return {
        text: response.text,
        audioUrl,
        success: true
      }

    } catch (error: any) {
      console.error('AI Host: Failed to generate correct answer response:', error)
      return {
        text: this.getFallbackResponse('correct_answer', songTitle, songArtist),
        success: false,
        error: error.message
      }
    }
  }

  async handleIncorrectAnswer(
    playerName: string,
    songTitle: string,
    songArtist: string,
    options?: {
      responseLength?: 'short' | 'medium' | 'long'
      generateVoice?: boolean
    }
  ): Promise<HostResponse> {
    if (!this.initialized) {
      return { text: 'Nice try!', success: false, error: 'Host not initialized' }
    }

    try {
      const character = this.getCharacterInfo(this.currentPersonality)
      const context = {
        gamePhase: 'wrong_answer' as const,
        playerName,
        playerScore: 0,
        opponentScore: 0,
        songTitle,
        songArtist,
        isCorrect: false,
        responseLength: options?.responseLength || 'medium',
        character
      }

      const response = await aiService.generateHostComment(context)
      
      let audioUrl: string | undefined

      if (options?.generateVoice && response.text && ttsService.isReady()) {
        const ttsResponse = await ttsService.generateSpeech({
          text: response.text,
          voiceId: character.voiceId,
          stability: 0.6,
          similarityBoost: 0.8
        })

        if (ttsResponse.success) {
          audioUrl = ttsResponse.audioUrl
        }
      }

      return {
        text: response.text,
        audioUrl,
        success: true
      }

    } catch (error: any) {
      console.error('AI Host: Failed to generate incorrect answer response:', error)
      return {
        text: this.getFallbackResponse('wrong_answer', songTitle, songArtist),
        success: false,
        error: error.message
      }
    }
  }

  async introduceQuestion(
    questionNumber: number,
    totalQuestions: number,
    playlistName: string,
    options?: {
      responseLength?: 'short' | 'medium'
      generateVoice?: boolean
    }
  ): Promise<HostResponse> {
    if (!this.initialized) {
      return { text: "Here's your next song!", success: false, error: 'Host not initialized' }
    }

    try {
      const character = this.getCharacterInfo(this.currentPersonality)
      const context = {
        gamePhase: 'question_start' as const,
        playerName: 'Player',
        playerScore: 0,
        opponentScore: 0,
        responseLength: options?.responseLength || 'short',
        character
      }

      const response = await aiService.generateHostComment(context)
      
      let audioUrl: string | undefined

      if (options?.generateVoice && response.text && ttsService.isReady()) {
        const ttsResponse = await ttsService.generateSpeech({
          text: response.text,
          voiceId: character.voiceId,
          stability: 0.6,
          similarityBoost: 0.8
        })

        if (ttsResponse.success) {
          audioUrl = ttsResponse.audioUrl
        }
      }

      return {
        text: response.text,
        audioUrl,
        success: true
      }

    } catch (error: any) {
      console.error('AI Host: Failed to generate question intro:', error)
      return {
        text: this.getFallbackResponse('question_start'),
        success: false,
        error: error.message
      }
    }
  }

  async handleGameEnd(
    finalScore: number,
    totalQuestions: number,
    playlistName: string,
    options?: {
      generateVoice?: boolean
    }
  ): Promise<HostResponse> {
    if (!this.initialized) {
      return { text: 'Thanks for playing!', success: false, error: 'Host not initialized' }
    }

    try {
      const character = this.getCharacterInfo(this.currentPersonality)
      const context = {
        gamePhase: 'game_end' as const,
        playerName: 'Player',
        playerScore: finalScore,
        opponentScore: 0,
        responseLength: 'long' as const,
        character
      }

      const response = await aiService.generateHostComment(context)
      
      let audioUrl: string | undefined

      if (options?.generateVoice && response.text && ttsService.isReady()) {
        const ttsResponse = await ttsService.generateSpeech({
          text: response.text,
          voiceId: character.voiceId,
          stability: 0.6,
          similarityBoost: 0.8
        })

        if (ttsResponse.success) {
          audioUrl = ttsResponse.audioUrl
        }
      }

      return {
        text: response.text,
        audioUrl,
        success: true
      }

    } catch (error: any) {
      console.error('AI Host: Failed to generate game end response:', error)
      return {
        text: this.getFallbackResponse('game_end'),
        success: false,
        error: error.message
      }
    }
  }

  private getFallbackResponse(
    gamePhase: string, 
    songTitle?: string, 
    songArtist?: string
  ): string {
    const fallbacks = {
      riley: {
        question_start: "Let's hear this one!",
        correct_answer: "YES! You nailed it!",
        wrong_answer: songTitle && songArtist ? `That was "${songTitle}" by ${songArtist}!` : "Not quite, but keep going!",
        round_end: "Keep it up!",
        game_end: "Amazing game!"
      },
      willow: {
        question_start: "Listen deeply to this melody",
        correct_answer: "Beautifully done!",
        wrong_answer: songTitle && songArtist ? `That was "${songTitle}" by ${songArtist}` : "Every song teaches us something",
        round_end: "You're growing with each song",
        game_end: "What a meaningful journey"
      },
      alex: {
        question_start: "Here's a good track",
        correct_answer: "Nice! Good ear",
        wrong_answer: songTitle && songArtist ? `That was "${songTitle}" by ${songArtist}` : "Keep listening, you'll get it",
        round_end: "Solid round",
        game_end: "Good session!"
      },
      jordan: {
        question_start: "Ready for this one?",
        correct_answer: "BAM! You crushed it!",
        wrong_answer: songTitle && songArtist ? `Oops! That was "${songTitle}" by ${songArtist}` : "So close, yet so far!",
        round_end: "This is getting interesting!",
        game_end: "What a wild ride!"
      }
    }

    const characterFallbacks = fallbacks[this.currentPersonality as keyof typeof fallbacks] || fallbacks.riley
    return characterFallbacks[gamePhase as keyof typeof characterFallbacks] || "Great job playing!"
  }

  getStatus() {
    return {
      initialized: this.initialized,
      currentPersonality: this.currentPersonality,
      aiServiceReady: aiService.isReady(),
      ttsServiceReady: ttsService.isReady()
    }
  }

  isServiceReady(): boolean {
    return this.initialized && aiService.isReady()
  }

  // Alias for backwards compatibility
  isInitialized(): boolean {
    return this.initialized
  }

  async announceGameIntro(playlistName: string): Promise<HostResponse> {
    if (!this.initialized) {
      return { text: "Welcome to Song Quiz!", success: false, error: 'Host not initialized' }
    }

    try {
      const character = this.getCharacterInfo(this.currentPersonality)
      const context = {
        gamePhase: 'question_start' as const,
        playerName: 'Player',
        playerScore: 0,
        opponentScore: 0,
        responseLength: 'medium' as const,
        character
      }

      // Generate a personalized game intro
      const response = await aiService.generateHostComment(context)
      
      let audioUrl: string | undefined

      if (response.text && ttsService.isReady()) {
        const ttsResponse = await ttsService.generateSpeech({
          text: response.text,
          voiceId: character.voiceId,
          stability: 0.6,
          similarityBoost: 0.8
        })

        if (ttsResponse.success) {
          audioUrl = ttsResponse.audioUrl
        }
      }

      return {
        text: response.text || this.getFallbackGameIntro(playlistName),
        audioUrl,
        success: true
      }

    } catch (error: any) {
      console.error('AI Host: Failed to generate game intro:', error)
      return {
        text: this.getFallbackGameIntro(playlistName),
        success: false,
        error: error.message
      }
    }
  }

  private getFallbackGameIntro(playlistName: string): string {
    const character = this.getCharacterInfo(this.currentPersonality)
    
    const intros = {
      riley: `${character.emoji} Welcome to Song Quiz! Get ready to rock the ${playlistName} playlist! Let's see what you've got!`,
      willow: `${character.emoji} Welcome, music lover. Today we explore the beautiful sounds of the ${playlistName}. Listen with your heart.`,
      alex: `${character.emoji} Hey there! Time for some ${playlistName} vibes. Let's see if you know your music.`,
      jordan: `${character.emoji} Welcome to the show! The ${playlistName} are calling - let's see if you can answer! Get ready for some fun!`
    }

    return intros[this.currentPersonality as keyof typeof intros] || intros.riley
  }
}

// Export singleton instance
export const gameHost = new GameHostManager()
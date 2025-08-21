import { 
  aiHostService,
  type AIHostConfig,
  type AIHostRequest,
  type GameFlowStep
} from '../../ai-host/src/services/aiHostService'

export class GameHostManager {
  private initialized = false

  async initialize(): Promise<boolean> {
    try {
      const config: AIHostConfig = {
        gameType: 'songquiz',
        gameMode: 'multiplayer',
        personalityId: 'riley', // High-energy, playful personality for song quiz
        defaultResponseLength: 'medium',
        usageRate: {
          enabled: true,
          maxResponsesPerMinute: 20,
          cooldownBetweenResponses: 2
        }
      }

      const result = await aiHostService.initialize(config)
      this.initialized = result.success

      if (!result.success) {
        console.error('AI Host initialization failed:', result.error)
        return false
      }

      console.log('GameHost: Initialized with AI-powered responses')
      return true
    } catch (error) {
      console.error('GameHost: Initialization error:', error)
      this.initialized = false
      return false
    }
  }

  async celebrateCorrectAnswer(
    playerName: string,
    playerScore: number, 
    songDetails: string
  ): Promise<{ text: string; audioUrl?: string }> {
    if (!this.initialized) {
      // Fallback if not initialized
      return { text: `YES! ${playerName} nailed it with ${songDetails}!` }
    }

    try {
      const request: AIHostRequest = {
        scenario: `${playerName} correctly identified ${songDetails}! They now have ${playerScore} points. This is exciting!`,
        flowStep: {
          id: 'round_result',
          name: 'Correct Answer',
          description: 'Player answered correctly and earned points',
          settings: { isCorrect: true }
        },
        players: [{ id: '1', name: playerName, score: playerScore }],
        generateVoice: true,
        responseLength: 'medium'
      }

      const response = await aiHostService.generateResponse(request)
      
      if (response.success) {
        return {
          text: response.text,
          audioUrl: response.audioUrl
        }
      } else {
        console.warn('AI Host response failed:', response.error)
        return { text: `Amazing work, ${playerName}!` }
      }
    } catch (error) {
      console.error('Error generating celebration:', error)
      return { text: `Great job, ${playerName}!` }
    }
  }

  async handleIncorrectAnswer(
    playerName: string,
    guess: string,
    correctAnswer: string
  ): Promise<{ text: string; audioUrl?: string }> {
    if (!this.initialized) {
      // Fallback if not initialized
      return { text: `Not quite! That was ${correctAnswer}` }
    }

    try {
      const request: AIHostRequest = {
        scenario: `${playerName} guessed "${guess}" but the correct answer was "${correctAnswer}". Keep encouraging them to try again!`,
        flowStep: {
          id: 'round_result',
          name: 'Incorrect Answer',
          description: 'Player answered incorrectly but should be encouraged',
          settings: { isCorrect: false }
        },
        players: [{ id: '1', name: playerName, score: 0 }],
        generateVoice: true,
        responseLength: 'medium'
      }

      const response = await aiHostService.generateResponse(request)
      
      if (response.success) {
        return {
          text: response.text,
          audioUrl: response.audioUrl
        }
      } else {
        console.warn('AI Host response failed:', response.error)
        return { text: `Close! The answer was ${correctAnswer}` }
      }
    } catch (error) {
      console.error('Error generating encouragement:', error)
      return { text: `Keep trying! That was ${correctAnswer}` }
    }
  }

  async provideGameBanter(context: string): Promise<string> {
    if (!this.initialized) {
      return "This is getting exciting!"
    }

    try {
      const request: AIHostRequest = {
        scenario: context,
        flowStep: {
          id: 'banter',
          name: 'Host Commentary',
          description: 'General host commentary and game atmosphere',
          settings: {}
        },
        players: [{ id: '1', name: 'Player', score: 0 }],
        responseLength: 'banter',
        generateVoice: false // Skip voice for banter to keep it quick
      }

      const response = await aiHostService.generateResponse(request)
      return response.success ? response.text : "Great energy so far!"
    } catch (error) {
      console.error('Error generating banter:', error)
      return "Keep it up!"
    }
  }

  async announceNewRound(category: string, roundNumber: number): Promise<{ text: string; audioUrl?: string }> {
    if (!this.initialized) {
      return { text: `Round ${roundNumber}: ${category} - Let's see what you've got!` }
    }

    try {
      const request: AIHostRequest = {
        scenario: `Starting round ${roundNumber} with ${category} songs! Time to get the players excited and ready for the next challenge.`,
        flowStep: {
          id: 'round_start',
          name: 'New Round Announcement',
          description: 'Host announcing the start of a new round',
          settings: {}
        },
        players: [{ id: '1', name: 'Players', score: 0 }],
        generateVoice: true,
        responseLength: 'medium'
      }

      const response = await aiHostService.generateResponse(request)
      
      if (response.success) {
        return {
          text: response.text,
          audioUrl: response.audioUrl
        }
      } else {
        console.warn('AI Host response failed:', response.error)
        return { text: `Round ${roundNumber}: ${category}! Let's do this!` }
      }
    } catch (error) {
      console.error('Error generating round announcement:', error)
      return { text: `Round ${roundNumber}: ${category}!` }
    }
  }

  async switchPersonality(personalityId: string): Promise<boolean> {
    if (!this.initialized) {
      console.log(`GameHost: Would switch to personality ${personalityId} (not initialized)`)
      return false
    }

    try {
      // Update the configuration
      const result = aiHostService.updateConfig({ personalityId })
      if (result.success) {
        console.log(`GameHost: Successfully switched to personality ${personalityId}`)
        return true
      } else {
        console.warn(`GameHost: Failed to switch personality:`, result.error)
        return false
      }
    } catch (error) {
      console.error('Error switching personality:', error)
      return false
    }
  }

  getStatus() {
    if (!this.initialized) {
      return {
        initialized: false,
        ready: false,
        providers: {
          ai: 'not_initialized',
          tts: 'not_initialized'
        }
      }
    }

    try {
      return aiHostService.getStatus()
    } catch (error) {
      return {
        initialized: this.initialized,
        ready: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  isInitialized(): boolean {
    return this.initialized
  }
}

export const gameHost = new GameHostManager()
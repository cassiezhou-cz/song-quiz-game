import { 
  aiHostService,
  type AIHostConfig,
  type AIHostRequest,
  type GameFlowStep
} from '../../ai-host/src/services/aiHostService'

export class GameHostManager {
  private initialized = false

  async initialize(personalityId: string = 'riley'): Promise<boolean> {
    try {
      // Handle the "none" case - user doesn't want AI host
      if (personalityId === 'none') {
        console.log('🎪 HOSTMANAGER: Host disabled by user selection')
        this.initialized = false
        return false // Return false but don't error - this is intentional
      }

      // Map personalities to their corresponding ElevenLabs voice IDs
      const voiceMapping: Record<string, string> = {
        riley: 'h2dQOVyUfIDqY2whPOMo',   // Nayva
        willow: 'yj30vwTGJxSHezdAGsv9',  // Jessa
        alex: 'yl2ZDV1MzN4HbQJbMihG',   // Alex
        jordan: 'x8xv0H8Ako6Iw3cKXLoC'  // Haven
      }

      const config: AIHostConfig = {
        gameType: 'songquiz',
        gameMode: 'multiplayer',
        personalityId: personalityId, // Use selected personality
        voiceId: voiceMapping[personalityId], // Use matching voice
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

      console.log(`🎪 HOSTMANAGER: Initialized with personality "${personalityId}"`)
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
      // Add variety to scenarios to trigger different response types
      const scenarios = [
        `${playerName} absolutely nailed ${songDetails}! They're on fire with ${playerScore} points!`,
        `Perfect identification of ${songDetails}! ${playerName} is showing some serious music knowledge!`,
        `${playerName} crushed that one! ${songDetails} was spot on - they now have ${playerScore} points!`,
        `Impressive! ${playerName} knew ${songDetails} right away and earned those points!`,
        `That's how it's done! ${playerName} identified ${songDetails} like a true music fan!`
      ]
      
      const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)]
      
      const request: AIHostRequest = {
        scenario: randomScenario,
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
        console.log('🎪 HOSTMANAGER: ✅ AI-GENERATED correct response:', response.text)
        return {
          text: response.text,
          audioUrl: response.audioUrl
        }
      } else {
        console.warn('🎪 HOSTMANAGER: ❌ FALLBACK correct response due to:', response.error)
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
      // Add variety to incorrect answer scenarios
      const scenarios = [
        `${playerName} took a swing with "${guess}" but it was actually "${correctAnswer}". Close call!`,
        `Not quite! ${playerName} thought "${guess}" but we were looking for "${correctAnswer}". Keep that energy up!`,
        `Ooh, "${guess}" was a bold choice, but "${correctAnswer}" was what we needed! Try the next one!`,
        `${playerName} went with "${guess}" - good effort, but "${correctAnswer}" was the answer. Stay focused!`,
        `Close but not quite! "${guess}" vs "${correctAnswer}" - these can be tricky sometimes!`
      ]
      
      const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)]
      
      const request: AIHostRequest = {
        scenario: randomScenario,
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
        console.log('🎪 HOSTMANAGER: ✅ AI-GENERATED incorrect response:', response.text)
        return {
          text: response.text,
          audioUrl: response.audioUrl
        }
      } else {
        console.warn('🎪 HOSTMANAGER: ❌ FALLBACK incorrect response due to:', response.error)
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

  async announceGameIntro(playlistName: string): Promise<{ text: string; audioUrl?: string }> {
    console.log('🎪 HOSTMANAGER: announceGameIntro called for playlist:', playlistName)
    
    if (!this.initialized) {
      console.log('🎪 HOSTMANAGER: Not initialized, returning fallback')
      return { text: `Welcome to ${playlistName} Song Quiz! Let's see what you've got!` }
    }

    try {
      console.log('🎪 HOSTMANAGER: Creating AI request for game intro...')
      const request: AIHostRequest = {
        scenario: `Welcome to the ${playlistName} Song Quiz! Get the players excited and ready for some amazing music from the ${playlistName}. This is going to be fun!`,
        flowStep: {
          id: 'game_start',
          name: 'Game Introduction',
          description: 'Host introducing the game and getting players excited',
          settings: {}
        },
        players: [{ id: '1', name: 'Players', score: 0 }],
        generateVoice: true,
        responseLength: 'medium'
      }

      console.log('🎪 HOSTMANAGER: Sending request to aiHostService...')
      const response = await aiHostService.generateResponse(request)
      console.log('🎪 HOSTMANAGER: Received response from aiHostService:', { 
        success: response.success, 
        text: response.text, 
        hasAudio: !!response.audioUrl,
        audioUrl: response.audioUrl?.substring(0, 50) + '...' 
      })
      
      if (response.success) {
        return {
          text: response.text,
          audioUrl: response.audioUrl
        }
      } else {
        console.warn('🎪 HOSTMANAGER: AI Host response failed:', response.error)
        return { text: `Welcome to ${playlistName} Song Quiz! Let's get started!` }
      }
    } catch (error) {
      console.error('🎪 HOSTMANAGER: Error generating game intro:', error)
      return { text: `Welcome to ${playlistName} Song Quiz!` }
    }
  }

  async announceNewRound(category: string, roundNumber: number): Promise<{ text: string; audioUrl?: string }> {
    console.log('🎪 HOSTMANAGER: announceNewRound called:', { category, roundNumber })
    
    if (!this.initialized) {
      console.log('🎪 HOSTMANAGER: Not initialized for round announcement, returning fallback')
      return { text: `Round ${roundNumber}: ${category} - Let's see what you've got!` }
    }

    try {
      console.log('🎪 HOSTMANAGER: Creating AI request for round announcement...')
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

      console.log('🎪 HOSTMANAGER: Sending round announcement to aiHostService...')
      const response = await aiHostService.generateResponse(request)
      console.log('🎪 HOSTMANAGER: Received round response:', { 
        success: response.success, 
        text: response.text, 
        hasAudio: !!response.audioUrl 
      })
      
      if (response.success) {
        return {
          text: response.text,
          audioUrl: response.audioUrl
        }
      } else {
        console.warn('🎪 HOSTMANAGER: Round announcement failed:', response.error)
        return { text: `Round ${roundNumber}: ${category}! Let's do this!` }
      }
    } catch (error) {
      console.error('🎪 HOSTMANAGER: Error generating round announcement:', error)
      return { text: `Round ${roundNumber}: ${category}!` }
    }
  }

  async announceGameEnd(playerScore: number, opponentScore: number, playerWon: boolean): Promise<{ text: string; audioUrl?: string }> {
    console.log('🎪 HOSTMANAGER: announceGameEnd called:', { playerScore, opponentScore, playerWon })
    
    if (!this.initialized) {
      const fallbackText = playerWon ? "Congratulations! You won!" : "Good game! Better luck next time!"
      return { text: fallbackText }
    }

    try {
      const result = playerWon ? 'won' : (playerScore === opponentScore ? 'tied' : 'lost')
      const scenario = `The game is over! Player scored ${playerScore} points and opponent scored ${opponentScore}. The player ${result}. Give them a fitting final commentary!`
      
      console.log('🎪 HOSTMANAGER: Creating AI request for game end...')
      const request: AIHostRequest = {
        scenario,
        flowStep: {
          id: 'game_end',
          name: 'Game End Commentary',
          description: 'Host providing final commentary on game results',
          settings: { performance: playerWon ? 5 : (playerScore === opponentScore ? 3 : 1) }
        },
        players: [{ id: '1', name: 'Player', score: playerScore }],
        generateVoice: true,
        responseLength: 'long'
      }

      console.log('🎪 HOSTMANAGER: Sending game end request to aiHostService...')
      const response = await aiHostService.generateResponse(request)
      console.log('🎪 HOSTMANAGER: Received game end response:', { 
        success: response.success, 
        text: response.text, 
        hasAudio: !!response.audioUrl 
      })
      
      if (response.success) {
        return {
          text: response.text,
          audioUrl: response.audioUrl
        }
      } else {
        console.warn('🎪 HOSTMANAGER: Game end response failed:', response.error)
        const fallbackText = playerWon ? "Amazing performance!" : "Great effort out there!"
        return { text: fallbackText }
      }
    } catch (error) {
      console.error('🎪 HOSTMANAGER: Error generating game end:', error)
      return { text: "Thanks for playing!" }
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
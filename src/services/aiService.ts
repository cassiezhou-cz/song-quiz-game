import OpenAI from 'openai'

interface AIResponse {
  text: string
  processingTime: number
}

class AIService {
  private openai: OpenAI | null = null
  private isConfigured = false

  constructor() {
    const apiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY
    if (apiKey && apiKey !== 'your-openai-api-key-here') {
      this.openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Note: Only for development
      })
      this.isConfigured = true
    }
  }

  async generateHostComment(context: {
    gamePhase: 'question_start' | 'correct_answer' | 'wrong_answer' | 'round_end' | 'game_end'
    playerName: string
    playerScore: number
    opponentScore: number
    songTitle?: string
    songArtist?: string
    isCorrect?: boolean
    responseLength: 'short' | 'medium' | 'long'
    character?: { name: string; emoji: string; personality: string }
  }): Promise<AIResponse> {
    if (!this.isConfigured || !this.openai) {
      console.warn('🤖 AI Service: Not configured, using fallback response')
      return {
        text: this.getFallbackResponse(context),
        processingTime: 0
      }
    }

    const startTime = Date.now()
    
    const systemPrompt = this.buildSystemPrompt(context)
    const userPrompt = this.buildUserPrompt(context)

    try {
      const completion = await this.openai.chat.completions.create({
        model: (import.meta as any).env?.VITE_OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: this.getMaxTokens(context.responseLength),
        temperature: 0.8
      })

      const responseText = completion.choices[0]?.message?.content || ''
      const processingTime = Date.now() - startTime

      return {
        text: responseText,
        processingTime
      }
    } catch (error) {
      console.error('🤖 AI Service: Generation failed:', error)
      
      // Check for specific API errors
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Authentication')) {
          console.error('🤖 AI Service: API key authentication failed. Please check your OpenAI API key.')
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
          console.error('🤖 AI Service: API quota exceeded. Please check your OpenAI billing.')
        }
      }
      
      // Return fallback instead of throwing
      return {
        text: this.getFallbackResponse(context),
        processingTime: Date.now() - startTime
      }
    }
  }

  private buildSystemPrompt(context: any): string {
    const character = context.character || { name: 'Riley', personality: 'energetic' }
    
    const personalityPrompts = {
      energetic: `You are ${character.name}, an energetic and charismatic music quiz show host.
PERSONALITY:
- Enthusiastic and engaging with high energy
- Passionate about music across all decades
- Encouraging and builds excitement around competition
- Uses exclamations and dynamic language
- Celebrates wins with enthusiasm, encourages on losses`,

      wise: `You are ${character.name}, a wise and nurturing music guide.
PERSONALITY:
- Calm, thoughtful, and encouraging presence
- Speaks with gentle wisdom about music's deeper meaning
- Patient and supportive, never judgmental
- Uses nature and mindfulness metaphors
- Helps players connect emotionally with music`,

      cool: `You are ${character.name}, a laid-back DJ-style music quiz host.
PERSONALITY:
- Cool, smooth, and relaxed vibe
- Music aficionado with deep knowledge
- Uses casual, hip language and DJ terminology
- Calm but supportive, never loses composure
- Treats the quiz like a chill music session`,

      funny: `You are ${character.name}, a witty comedian hosting a music quiz.
PERSONALITY:
- Humorous and entertaining with clever wordplay
- Makes lighthearted jokes about music and answers
- Supportive but with comedic timing
- Uses puns, jokes, and funny observations
- Keeps the mood light and entertaining`
    }

    const personalityPrompt = personalityPrompts[character.personality as keyof typeof personalityPrompts] || personalityPrompts.energetic

    return `${personalityPrompt}

GAME CONTEXT:
- This is a competitive music quiz with 2 players
- Players guess song titles and artists from audio clips
- Each correct answer awards 10 points
- Current scores: ${context.playerName} has ${context.playerScore} points, opponent has ${context.opponentScore} points

RESPONSE STYLE:
- ${context.responseLength === 'short' ? 'Keep it to 1-3 words for quick reactions' : context.responseLength === 'medium' ? 'Use 3-8 words for brief commentary' : 'Use 12-20 words for fuller host commentary'}
- Be conversational and natural to your personality
- Reference the player by name: ${context.playerName}
- Match the energy of the game moment with your unique style

You ARE the host - respond as ${character.name}, not as an AI assistant.`
  }

  private buildUserPrompt(context: any): string {
    switch (context.gamePhase) {
      case 'question_start':
        return `The next song is starting. Build excitement for ${context.playerName}!`
      
      case 'correct_answer':
        return `${context.playerName} just correctly identified "${context.songTitle}" by ${context.songArtist}! They earned 10 points. React with enthusiasm!`
      
      case 'wrong_answer':
        return `${context.playerName} guessed incorrectly. The song was "${context.songTitle}" by ${context.songArtist}. Be encouraging but acknowledge the miss.`
      
      case 'round_end':
        return `Round finished! Current scores: ${context.playerName} has ${context.playerScore} points, opponent has ${context.opponentScore} points. Build excitement for what's coming!`
      
      case 'game_end':
        const isPlayerWin = context.playerScore > context.opponentScore
        return `Game over! Final scores: ${context.playerName} ${context.playerScore}, opponent ${context.opponentScore}. ${isPlayerWin ? `Congratulate ${context.playerName} on their victory!` : `Encourage ${context.playerName} - they played well but the opponent won this time.`}`
      
      default:
        return `Provide general encouraging commentary for ${context.playerName} in this music quiz game.`
    }
  }

  private getMaxTokens(responseLength: string): number {
    switch (responseLength) {
      case 'short': return 15
      case 'medium': return 25
      case 'long': return 50
      default: return 25
    }
  }

  private getFallbackResponse(context: any): string {
    const character = context.character || { name: 'Host', emoji: '🎤', personality: 'energetic' }
    
    // Character-specific fallback responses
    const fallbacks = {
      riley: {
        question_start: "🎤 Let's rock this next song!",
        correct_answer: "YES! You absolutely nailed it!",
        wrong_answer: context.songTitle && context.songArtist ? 
          `🎤 That was "${context.songTitle}" by ${context.songArtist}! Keep the energy up!` : 
          "🎤 Not quite, but you're doing great!",
        round_end: "🎤 What an amazing round! Keep it going!",
        game_end: "🎤 What an incredible game! You were awesome out there!"
      },
      willow: {
        question_start: "🌿 Listen with your heart to this melody",
        correct_answer: "🌿 Beautiful! You truly heard the music",
        wrong_answer: context.songTitle && context.songArtist ? 
          `🌿 That was "${context.songTitle}" by ${context.songArtist}. Every song teaches us something` : 
          "🌿 The music speaks differently to each of us",
        round_end: "🌿 Each round brings new musical wisdom",
        game_end: "🌿 What a meaningful musical journey we've shared"
      },
      alex: {
        question_start: "🎧 Here's a solid track for you",
        correct_answer: "🎧 Nice! You know your music",
        wrong_answer: context.songTitle && context.songArtist ? 
          `🎧 That was "${context.songTitle}" by ${context.songArtist}. Good track` : 
          "🎧 Keep listening, you'll get the next one",
        round_end: "🎧 Decent round, let's keep going",
        game_end: "🎧 Good session! You played well"
      },
      jordan: {
        question_start: "😄 Ready for this musical adventure?",
        correct_answer: "😄 BAM! You totally crushed that one!",
        wrong_answer: context.songTitle && context.songArtist ? 
          `😄 Plot twist! That was "${context.songTitle}" by ${context.songArtist}!` : 
          "😄 Oops! But hey, that's what makes it fun!",
        round_end: "😄 This game is getting exciting!",
        game_end: "😄 What a wild musical ride! You were fantastic!"
      }
    }

    const personalityFallbacks = fallbacks[character.personality as keyof typeof fallbacks] || fallbacks.riley
    return personalityFallbacks[context.gamePhase as keyof typeof personalityFallbacks] || "🎵 Keep the music playing!"
  }

  isReady(): boolean {
    return this.isConfigured
  }

  getConfigurationHelp(): string {
    return `To fix AI host commentary:

🔑 OpenAI API Key Issues:
1. Go to https://platform.openai.com/api-keys
2. Create a new API key (not project-specific)
3. Ensure you have billing set up and credits available
4. Replace the key in your .env file:
   VITE_OPENAI_API_KEY=sk-...your-new-key-here
5. Restart the development server

⚠️  Common Issues:
- Project keys (sk-proj-...) may have limited access
- Check your OpenAI billing/usage limits
- Verify your account has access to GPT models

💡 Alternative: The game will work with fallback text responses if AI fails`
  }
}

export const aiService = new AIService()
export type { AIResponse }

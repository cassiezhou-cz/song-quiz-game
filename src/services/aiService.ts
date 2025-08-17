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
      throw new Error('OpenAI API not configured')
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
      console.error('AI generation error:', error)
      throw new Error('Failed to generate AI response')
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

  isReady(): boolean {
    return this.isConfigured
  }

  getConfigurationHelp(): string {
    return `To enable AI host commentary:
1. Get an OpenAI API key from https://platform.openai.com/api-keys
2. Create a .env file in your project root
3. Add: VITE_OPENAI_API_KEY=your-actual-api-key-here
4. Restart the development server`
  }
}

export const aiService = new AIService()
export type { AIResponse }

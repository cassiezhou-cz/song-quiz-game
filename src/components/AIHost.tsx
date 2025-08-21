import { useState, useEffect, useRef } from 'react'
import { gameHost } from '../services/gameHostManager'
import './AIHost.css'

interface AIHostProps {
  gamePhase: 'question_start' | 'correct_answer' | 'wrong_answer' | 'round_end' | 'game_end'
  playerName: string
  playerScore: number
  opponentScore: number
  songTitle?: string
  songArtist?: string
  isCorrect?: boolean
  character: string
  enabled?: boolean
  voiceEnabled?: boolean
}

interface CharacterInfo {
  name: string
  emoji: string
  personality: string
}

const getCharacterInfo = (characterId: string): CharacterInfo => {
  const characters: Record<string, CharacterInfo> = {
    riley: { name: 'Riley', emoji: '🎤', personality: 'energetic' },
    willow: { name: 'Willow', emoji: '🌿', personality: 'wise' },
    alex: { name: 'Alex', emoji: '🎧', personality: 'cool' },
    jordan: { name: 'Jordan', emoji: '😄', personality: 'funny' }
  }
  return characters[characterId] || characters.riley
}

// Fallback responses when OpenAI is rate limited - character specific
const getFallbackComment = (
  gamePhase: string,
  character: string,
  _isCorrect?: boolean, 
  songTitle?: string, 
  songArtist?: string
): string => {
  const characterResponses = {
    riley: {
      question_start: ["Let's see what you've got!", "Here we go! This is exciting!", "Ready for this one?"],
      correct_answer: ["YES! You nailed it!", "Perfect! You're on fire!", "Outstanding work!", "Brilliant! That was amazing!"],
      wrong_answer: [`Not quite! That was ${songTitle} by ${songArtist}.`, "Keep going! You've got this!", "Nice try! Better luck next time!"],
      round_end: ["What an amazing round!", "You're doing fantastic!", "Keep that energy up!"],
      game_end: ["What a fantastic game! You were incredible!"]
    },
    willow: {
      question_start: ["Take your time with this one", "Listen deeply to this melody", "Feel the music guide you"],
      correct_answer: ["Beautifully done! Your intuition served you well", "Yes, you felt that one perfectly", "Your musical spirit shines through", "Wonderfully attuned!"],
      wrong_answer: [`That was ${songTitle} by ${songArtist}. Every song teaches us something`, "No worries, each guess brings wisdom", "Music speaks to us all differently"],
      round_end: ["You're growing with each song", "Your musical journey continues beautifully", "Trust in your evolving ear"],
      game_end: ["What a meaningful musical journey we've shared"]
    },
    alex: {
      question_start: ["Alright, let's vibe with this one", "Here's a good one", "Let's see if you know this track"],
      correct_answer: ["Nice! You know your music", "Smooth! That was clean", "Right on! Good ear", "Sweet! You got it"],
      wrong_answer: [`Nah, that was ${songTitle} by ${songArtist}`, "Close, but not quite there", "Keep listening, you'll get it"],
      round_end: ["Solid round", "You're flowing well", "Nice rhythm so far"],
      game_end: ["Good session! You've got taste"]
    },
    jordan: {
      question_start: ["Buckle up for this one!", "Oh, this is gonna be good!", "Ready to have some fun?"],
      correct_answer: ["BAM! You crushed it!", "Woohoo! That was perfect!", "Oh snap! You're good at this!", "Comedy gold! I mean... music gold!"],
      wrong_answer: [`Oops! That was actually ${songTitle} by ${songArtist}`, "Nice try, but that's a no from me!", "So close, yet so far!"],
      round_end: ["You're cracking me up with these moves!", "This is getting interesting!", "Plot twist coming up!"],
      game_end: ["What a wild ride! Thanks for the laughs!"]
    }
  }

  const responses = characterResponses[character as keyof typeof characterResponses] || characterResponses.riley
  const phaseResponses = responses[gamePhase as keyof typeof responses] || ["Great job playing along!"]
  
  return Array.isArray(phaseResponses) 
    ? phaseResponses[Math.floor(Math.random() * phaseResponses.length)]
    : phaseResponses
}

const AIHost: React.FC<AIHostProps> = ({
  gamePhase,
  playerName,
  playerScore,
  opponentScore,
  songTitle,
  songArtist,
  isCorrect,
  character,
  enabled = true,
  voiceEnabled = true
}) => {
  const characterInfo = getCharacterInfo(character)
  const [comment, setComment] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [showComment, setShowComment] = useState(false)
  const [lastRequestTime, setLastRequestTime] = useState<number>(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  
  const MIN_REQUEST_INTERVAL = 2000 // 2 seconds between OpenAI requests

  useEffect(() => {
    if (!enabled || !gameHost.isInitialized()) {
      // Try to initialize if not already done
      gameHost.initialize().catch(console.error)
      return
    }

    generateHostComment()
  }, [gamePhase, playerScore, opponentScore, enabled])

  const generateHostComment = async () => {
    if (!gameHost.isInitialized()) return

    setIsGenerating(true)
    setShowComment(false)
    
    try {
      let response: { text: string; audioUrl?: string }
      const now = Date.now()
      const timeSinceLastRequest = now - lastRequestTime
      
      // Use fallback if rate limiting
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        response = { text: getFallbackComment(gamePhase, character, isCorrect, songTitle, songArtist) }
      } else {
        try {
          setLastRequestTime(now)
          
          // Use appropriate gameHost method based on game phase
          if (gamePhase === 'correct_answer' && isCorrect) {
            const songDetails = songTitle && songArtist ? `"${songTitle}" by ${songArtist}` : 'the song'
            response = await gameHost.celebrateCorrectAnswer(playerName, playerScore, songDetails)
          } else if (gamePhase === 'wrong_answer' && !isCorrect) {
            const guess = 'their guess' // We don't have the actual guess here
            const correctAnswer = songTitle && songArtist ? `${songTitle} by ${songArtist}` : 'the correct answer'
            response = await gameHost.handleIncorrectAnswer(playerName, guess, correctAnswer)
          } else if (gamePhase === 'question_start') {
            response = await gameHost.announceNewRound('current category', 1)
          } else {
            // Use general banter for other phases
            const context = `${gamePhase} phase - player ${playerName} has ${playerScore} points`
            const text = await gameHost.provideGameBanter(context)
            response = { text: text || getFallbackComment(gamePhase, character, isCorrect, songTitle, songArtist) }
          }
        } catch (error: any) {
          console.warn('AI Host: Using fallback due to API error')
          response = { text: getFallbackComment(gamePhase, character, isCorrect, songTitle, songArtist) }
        }
      }

      setComment(response.text)
      setShowComment(true)

      // Use audio from gameHost response if available, otherwise generate TTS
      if (voiceEnabled && response.audioUrl) {
        setAudioUrl(response.audioUrl)
        setTimeout(() => {
          playVoice()
        }, 500)
      }
    } catch (error) {
      console.error('Failed to generate AI comment:', error)
      // Fall back to silent operation if AI fails
    } finally {
      setIsGenerating(false)
    }
  }

  // Note: TTS generation is now handled by the gameHost service
  // This method is kept for compatibility but may not be used

  const playVoice = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play().catch(error => {
        console.error('AI Host audio play failed:', error)
      })
      setIsPlaying(true)
    }
  }

  const handleAudioEnd = () => {
    setIsPlaying(false)
  }

  // Clean up audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  if (!enabled) {
    return null
  }

  return (
    <div className={`ai-host ${showComment ? 'active' : ''}`}>
      <div className="host-avatar">
        <div className={`avatar-icon ${isGenerating ? 'thinking' : ''} ${isPlaying ? 'speaking' : ''}`}>
          {characterInfo.emoji}
        </div>
        <div className="host-name">{characterInfo.name}</div>
      </div>
      
      {showComment && (
        <div className="host-comment">
          <div className="comment-bubble">
            {comment}
          </div>
          
          {voiceEnabled && audioUrl && (
            <button 
              className={`voice-button ${isPlaying ? 'playing' : ''}`}
              onClick={playVoice}
              disabled={isPlaying}
            >
              {isPlaying ? '🔊' : '🔇'}
            </button>
          )}
        </div>
      )}

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={handleAudioEnd}
          style={{ display: 'none' }}
        />
      )}

      {isGenerating && (
        <div className="generating-indicator">
          <div className="thinking-dots">
            <span>•</span>
            <span>•</span>
            <span>•</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default AIHost

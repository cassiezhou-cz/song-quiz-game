// Example: How to integrate AI Host into your existing Game.tsx
// This shows the key changes needed to add AI commentary

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AIHost from './AIHost' // Add this import
import './Game.css'

// Add AI host phase type
type AIHostPhase = 'question_start' | 'correct_answer' | 'wrong_answer' | 'round_end' | 'game_end'

const Game = () => {
  // ... existing state variables ...
  const [score, setScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [questionNumber, setQuestionNumber] = useState(1)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [opponentCorrect, setOpponentCorrect] = useState(false)
  const [gameComplete, setGameComplete] = useState(false)
  
  // ADD: AI Host state
  const [hostPhase, setHostPhase] = useState<AIHostPhase>('question_start')
  const [aiHostEnabled, setAiHostEnabled] = useState(true) // Could be user preference
  
  // ... existing game logic ...

  const startNewQuestion = () => {
    const question = generateQuizQuestion()
    setCurrentQuestion(question)
    setSelectedAnswer(null)
    setShowFeedback(false)
    setIsCorrect(false)
    setOpponentCorrect(false)
    
    // ADD: Trigger AI host for new question
    setHostPhase('question_start')
    
    if (audioRef.current && question.song.file) {
      audioRef.current.src = question.song.file
      audioRef.current.load()
    }
  }

  const handleAnswerSelect = (option: string) => {
    if (selectedAnswer) return

    setSelectedAnswer(option)
    const correct = option === currentQuestion.correctAnswer
    const oppCorrect = Math.random() < 0.4 // 40% opponent success rate
    
    setIsCorrect(correct)
    setOpponentCorrect(oppCorrect)
    
    // ADD: Update AI host phase based on answer
    setHostPhase(correct ? 'correct_answer' : 'wrong_answer')
    
    if (correct) {
      setScore(prev => prev + 10)
    }
    if (oppCorrect) {
      setOpponentScore(prev => prev + 10)
    }

    // Pause audio and show feedback
    if (audioRef.current) {
      audioRef.current.pause()
    }
    setShowFeedback(true)
  }

  const nextQuestion = () => {
    if (questionNumber >= totalQuestions) {
      setGameComplete(true)
      // ADD: Trigger game end AI commentary
      setHostPhase('game_end')
    } else {
      setQuestionNumber(prev => prev + 1)
      // ADD: Trigger round end commentary
      setHostPhase('round_end')
      
      // Start new question after brief delay for AI commentary
      setTimeout(() => {
        startNewQuestion()
      }, 2000)
    }
  }

  // ... rest of existing component logic ...

  return (
    <div className="game-container">
      <div className="game-content">
        {/* ... existing game header, main content ... */}
        
        {/* ADD: AI Host Component */}
        {!gameComplete && (
          <AIHost
            gamePhase={hostPhase}
            playerName="You" // Could be dynamic from user input
            playerScore={score}
            opponentScore={opponentScore}
            songTitle={currentQuestion?.song.title}
            songArtist={currentQuestion?.song.artist}
            isCorrect={isCorrect}
            enabled={aiHostEnabled}
            voiceEnabled={true} // Could be user preference
          />
        )}
        
        {/* ADD: AI Host toggle button (optional) */}
        <button 
          className="ai-toggle-btn"
          onClick={() => setAiHostEnabled(!aiHostEnabled)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: aiHostEnabled ? '#E146EF' : '#666',
            border: 'none',
            borderRadius: '25px',
            padding: '10px 15px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.9rem',
            zIndex: 999
          }}
        >
          🤖 AI Host: {aiHostEnabled ? 'ON' : 'OFF'}
        </button>
        
        {/* ... rest of existing JSX ... */}
      </div>
    </div>
  )
}

export default Game

/*
INTEGRATION CHECKLIST:

✅ 1. Import AIHost component
✅ 2. Add hostPhase state variable  
✅ 3. Add aiHostEnabled state (optional toggle)
✅ 4. Update startNewQuestion() to set hostPhase
✅ 5. Update handleAnswerSelect() to set hostPhase based on correct/incorrect
✅ 6. Update nextQuestion() to set hostPhase for round_end/game_end
✅ 7. Add AIHost component to JSX with proper props
✅ 8. Optional: Add toggle button for AI host on/off

NEXT STEPS:
1. Create .env file with your OpenAI API key
2. Test with AI host enabled
3. Add ElevenLabs key for voice synthesis
4. Customize personality in aiService.ts if desired
*/

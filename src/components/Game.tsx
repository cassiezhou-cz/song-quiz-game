import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './Game.css'

interface Song {
  id: string
  title: string
  artist: string
  file: string
  albumArt: string
  alternatives: string[]
}

interface QuizQuestion {
  song: Song
  options: string[]
  correctAnswer: string
}

const Game = () => {
  const navigate = useNavigate()
  const { playlist } = useParams<{ playlist: string }>()
  const audioRef = useRef<HTMLAudioElement>(null)
  
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [score, setScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [questionNumber, setQuestionNumber] = useState(1)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [opponentCorrect, setOpponentCorrect] = useState(false)
  const [gameComplete, setGameComplete] = useState(false)
  const totalQuestions = 5
  
  // 2010s playlist songs with curated alternatives
  const songs2010s: Song[] = [
    { 
      id: '1', 
      title: 'All of Me', 
      artist: 'John Legend', 
      file: '/songs/2010s/AllofMeJohnLegend.mp3', 
      albumArt: '/assets/album-art/2010s/AllOfMeJohnLegend.jpeg',
      alternatives: ['When I Was Your Man - Bruno Mars', 'Stay With Me - Sam Smith', 'Thinking Out Loud - Ed Sheeran']
    },
    { 
      id: '2', 
      title: 'All The Stars', 
      artist: 'Kendrick Lamar', 
      file: '/songs/2010s/AllTheStarsKendrick.mp3', 
      albumArt: '/assets/album-art/2010s/AllOfTheStarsKendrick.jpeg',
      alternatives: ['Location - Khalid', 'Love on the Brain - Rihanna', 'Pretty Little Fears - 6LACK feat. J. Cole']
    },
    { 
      id: '3', 
      title: 'Closer', 
      artist: 'The Chainsmokers', 
      file: '/songs/2010s/CloserChainsmokers.mp3', 
      albumArt: '/assets/album-art/2010s/CloserChainsmokers.jpeg',
      alternatives: ['It Ain\'t Me - Kygo & Selena Gomez', 'Faded - Zedd feat. Alessia Cara', 'Paris - Lauv']
    },
    { 
      id: '4', 
      title: 'Goosebumps', 
      artist: 'Travis Scott', 
      file: '/songs/2010s/GoosebumpsTravisScott.mp3', 
      albumArt: '/assets/album-art/2010s/GoosebumpsTravisScott.jpeg',
      alternatives: ['Lucid Dreams - Juice WRLD', 'Life Goes On - Lil Baby feat. Gunna & Lil Uzi Vert', 'Psycho - Post Malone feat. Ty Dolla $ign']
    },
    { 
      id: '5', 
      title: 'HUMBLE', 
      artist: 'Kendrick Lamar', 
      file: '/songs/2010s/HUMBLEKendrickLamar.mp3', 
      albumArt: '/assets/album-art/2010s/HUMBLEKendrickLamar.jpeg',
      alternatives: ['Mask Off - Future', 'Bad and Boujee - Migos feat. Lil Uzi Vert', 'Alright - J. Cole']
    },
    { 
      id: '6', 
      title: 'Low', 
      artist: 'Flo Rida', 
      file: '/songs/2010s/LowFloRida.mp3', 
      albumArt: '/assets/album-art/2010s/LowFloRida.jpeg',
      alternatives: ['Buy U a Drank - T-Pain feat. Yung Joc', 'Temperature - Sean Paul', 'Tipsy - J-Kwon']
    },
    { 
      id: '7', 
      title: 'One Dance', 
      artist: 'Drake', 
      file: '/songs/2010s/OneDanceDrake.mp3', 
      albumArt: '/assets/album-art/2010s/OneDanceDrake.jpeg',
      alternatives: ['Joanna - Afro B', 'On the Low - Burna Boy', 'Toast - Koffee']
    },
    { 
      id: '8', 
      title: 'Shut Up and Dance', 
      artist: 'Walk the Moon', 
      file: '/songs/2010s/ShupUpAndDance.mp3', 
      albumArt: '/assets/album-art/2010s/ShutUpAndDance.jpeg',
      alternatives: ['Fireflies - Owl City', 'Safe and Sound - Capital Cities', 'Cool Kids - Echosmith']
    },
    { 
      id: '9', 
      title: 'Sweater Weather', 
      artist: 'The Neighbourhood', 
      file: '/songs/2010s/SweaterWeatherTheNeighborhood.mp3', 
      albumArt: '/assets/album-art/2010s/SweaterWeatherTheNeighborhood.jpeg',
      alternatives: ['Sex - The 1975', 'Riptide - Vance Joy', 'Youth - Daughter']
    },
    { 
      id: '10', 
      title: 'Wake Me Up', 
      artist: 'Avicii', 
      file: '/songs/2010s/WakeMeUpAvicii.mp3', 
      albumArt: '/assets/album-art/2010s/WakeMeUpAvicii.jpeg',
      alternatives: ['Broken Arrows - Kygo', 'The Nights - Martin Garrix', 'Sunburst - Tobtok']
    }
  ]

  const getPlaylistSongs = (playlistName: string): Song[] => {
    switch (playlistName) {
      case '2010s':
        return songs2010s
      default:
        return songs2010s // Default to 2010s for now
    }
  }

  const generateQuizQuestion = (): QuizQuestion => {
    const playlistSongs = getPlaylistSongs(playlist || '2010s')
    const randomIndex = Math.floor(Math.random() * playlistSongs.length)
    const correctSong = playlistSongs[randomIndex]
    
    // Use curated alternatives for this song
    const wrongAnswers = correctSong.alternatives
    
    const correctAnswer = `${correctSong.title} - ${correctSong.artist}`
    const options = [...wrongAnswers, correctAnswer].sort(() => Math.random() - 0.5)
    
    return {
      song: correctSong,
      options,
      correctAnswer
    }
  }

  const startNewQuestion = () => {
    const question = generateQuizQuestion()
    setCurrentQuestion(question)
    setSelectedAnswer(null)
    setShowFeedback(false)
    setIsPlaying(false)
    setCurrentTime(0)
  }

  useEffect(() => {
    startNewQuestion()
  }, [playlist])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
    }
  }, [currentQuestion])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio || selectedAnswer) return // Don't allow play after answering

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer) return // Already answered
    
    setSelectedAnswer(answer)
    const playerCorrect = answer === currentQuestion?.correctAnswer
    setIsCorrect(playerCorrect)
    
    // Simulate opponent answer (40% chance of being correct)
    const opponentGetsItRight = Math.random() < 0.4
    setOpponentCorrect(opponentGetsItRight)
    
    setShowFeedback(true)
    
    // Pause audio
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      setIsPlaying(false)
    }
    
    // Award points
    if (playerCorrect) {
      setScore(prev => prev + 10)
    }
    if (opponentGetsItRight) {
      setOpponentScore(prev => prev + 10)
    }
  }

  const nextQuestion = () => {
    if (questionNumber >= totalQuestions) {
      setGameComplete(true)
    } else {
      setQuestionNumber(prev => prev + 1)
      startNewQuestion()
    }
  }

  const restartGame = () => {
    setScore(0)
    setOpponentScore(0)
    setQuestionNumber(1)
    setGameComplete(false)
    startNewQuestion()
  }

  const backToPlaylist = () => {
    navigate('/')
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!currentQuestion) {
    return <div className="game-loading">Loading quiz...</div>
  }

  if (gameComplete) {
    return (
      <div className="game-container">
        <div className="game-content">
          <header className="game-header">
            <img 
              src="/assets/Song Quiz Horizontal logo.png" 
              alt="Song Quiz Logo" 
              className="game-logo"
            />
          </header>

          <main className="game-main">
            <div className="final-score">
              {score > opponentScore && (
                <div className="confetti-container">
                  <div className="confetti-piece confetti-1">🎉</div>
                  <div className="confetti-piece confetti-2">🎊</div>
                  <div className="confetti-piece confetti-3">⭐</div>
                  <div className="confetti-piece confetti-4">🎉</div>
                  <div className="confetti-piece confetti-5">🎊</div>
                  <div className="confetti-piece confetti-6">⭐</div>
                  <div className="confetti-piece confetti-7">🎉</div>
                  <div className="confetti-piece confetti-8">🎊</div>
                  <div className="confetti-piece confetti-9">⭐</div>
                  <div className="confetti-piece confetti-10">🎉</div>
                </div>
              )}
              <h3 className="victory-message">
                {score > opponentScore ? 'You Win!' : score < opponentScore ? 'You lost' : 'It\'s a Tie!'}
              </h3>
              <div className="final-scores-container">
                <div className="player-final-score">
                  <h4>Your Score</h4>
                  <div className="score-display">
                    <span className="score-number">{score}</span>
                    <span className="score-total">/ {totalQuestions * 10}</span>
                  </div>
                  <p className="score-percentage">
                    {Math.round((score / (totalQuestions * 10)) * 100)}% Correct
                  </p>
                </div>
                
                <div className="vs-divider">VS</div>
                
                <div className="opponent-final-score">
                  <h4>Opponent Score</h4>
                  <div className="score-display">
                    <span className="score-number">{opponentScore}</span>
                    <span className="score-total">/ {totalQuestions * 10}</span>
                  </div>
                  <p className="score-percentage">
                    {Math.round((opponentScore / (totalQuestions * 10)) * 100)}% Correct
                  </p>
                </div>
              </div>
              

            </div>

            <div className="game-actions">
              <button className="game-btn restart-btn" onClick={restartGame}>
                🔄 Play Again
              </button>
              <button className="game-btn back-btn" onClick={backToPlaylist}>
                ← Back to Playlists
              </button>
            </div>
          </main>
          
          {/* Competitive Avatars */}
          <div className="avatars">
            <div className="avatar-container player-container">
              <img 
                src="/assets/YourAvatar.png" 
                alt="Your Avatar" 
                className="avatar player-avatar"
              />
            </div>
            
            <div className="avatar-container opponent-container">
              <img 
                src="/assets/OpponentAvatar.png" 
                alt="Opponent Avatar" 
                className="avatar opponent-avatar"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="game-container">
      <div className="game-content">
        <header className="game-header">
          <img 
            src="/assets/Song Quiz Horizontal logo.png" 
            alt="Song Quiz Logo" 
            className="game-logo"
          />
          <div className="quiz-info">
            <div className="quiz-progress">
              <span>Question {questionNumber} of {totalQuestions}</span>
            </div>
            <div className="competitive-scores">
              <div className="player-score">
                <span className="score-label">You:</span>
                <span className="score-value">{score}</span>
              </div>
              <div className="score-divider">|</div>
              <div className="opponent-score">
                <span className="score-label">Opponent:</span>
                <span className="score-value">{opponentScore}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="game-main">
          <div className="quiz-section">
            {!showFeedback && (
              <div className="audio-controls">
                <audio
                  ref={audioRef}
                  src={currentQuestion.song.file}
                  onEnded={() => setIsPlaying(false)}
                />
                
                <div className="progress-bar">
                  <div className="progress-time">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                  <div className="progress-track">
                    <div 
                      className="progress-fill"
                      style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="control-buttons">
                  <button 
                    className={`control-btn play-pause-btn ${selectedAnswer ? 'disabled' : ''}`}
                    onClick={togglePlayPause}
                    disabled={!!selectedAnswer}
                  >
                    {isPlaying ? '⏸️' : '▶️'}
                  </button>
                </div>
              </div>
            )}

            {showFeedback && (
              <div className="album-art-display">
                <img 
                  src={currentQuestion.song.albumArt} 
                  alt={`${currentQuestion.song.title} album art`}
                  className="album-art"
                />
                <div className="song-details">
                  <h3 className="revealed-song-title">{currentQuestion.song.title}</h3>
                  <p className="revealed-song-artist">by {currentQuestion.song.artist}</p>
                </div>
              </div>
            )}

            <div className="quiz-options">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  className={`quiz-option ${
                    selectedAnswer === option ? 
                      (isCorrect ? 'correct' : 'incorrect') : 
                      ''
                  } ${
                    showFeedback && option === currentQuestion.correctAnswer ? 'show-correct' : ''
                  }`}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={!!selectedAnswer}
                >
                  {option}
                </button>
              ))}
            </div>

            {showFeedback && (
              <div className="simple-feedback">
                <button className="next-question-btn" onClick={nextQuestion}>
                  {questionNumber >= totalQuestions ? 'Finish Quiz' : 'Next Question →'}
                </button>
              </div>
            )}
          </div>
        </main>
        
        {/* Competitive Avatars */}
        <div className="avatars">
          <div className="avatar-container player-container">
            <img 
              src="/assets/YourAvatar.png" 
              alt="Your Avatar" 
              className={`avatar player-avatar ${showFeedback && isCorrect ? 'celebrating' : ''}`}
            />
            {showFeedback && isCorrect && (
              <>
                <div className="sparkles">
                  <div className="sparkle sparkle-1">✨</div>
                  <div className="sparkle sparkle-2">⭐</div>
                  <div className="sparkle sparkle-3">✨</div>
                  <div className="sparkle sparkle-4">⭐</div>
                  <div className="sparkle sparkle-5">✨</div>
                </div>
                <div className="score-popup player-score-popup">
                  Correct! +10 Points
                </div>
              </>
            )}
          </div>
          
          <div className="avatar-container opponent-container">
            <img 
              src="/assets/OpponentAvatar.png" 
              alt="Opponent Avatar" 
              className={`avatar opponent-avatar ${showFeedback && opponentCorrect ? 'celebrating' : ''}`}
            />
            {showFeedback && opponentCorrect && (
              <>
                <div className="sparkles">
                  <div className="sparkle sparkle-1">✨</div>
                  <div className="sparkle sparkle-2">⭐</div>
                  <div className="sparkle sparkle-3">✨</div>
                  <div className="sparkle sparkle-4">⭐</div>
                  <div className="sparkle sparkle-5">✨</div>
                </div>
                <div className="score-popup opponent-score-popup">
                  Correct! +10 Points
                </div>
              </>
            )}
          </div>
        </div>
        
        <button 
          className="back-to-playlists-btn"
          onClick={backToPlaylist}
        >
          ← Back to Playlists
        </button>
      </div>
    </div>
  )
}

export default Game

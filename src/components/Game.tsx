import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AIHost from './AIHost'
import { deepgramService, type DeepgramResponse } from '../services/deepgramService'
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

type AIHostPhase = 'question_start' | 'correct_answer' | 'wrong_answer' | 'round_end' | 'game_end'

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
  const [artistCorrect, setArtistCorrect] = useState(false)
  const [songCorrect, setSongCorrect] = useState(false)
  const [pointsEarned, setPointsEarned] = useState(0)
  const [opponentCorrect, setOpponentCorrect] = useState(false)
  const [gameComplete, setGameComplete] = useState(false)
  const totalQuestions = 5

  // Speech Recognition state
  const [speechEnabled, setSpeechEnabled] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)

  // AI Host state - smart timing to avoid audio conflicts
  const [hostPhase, setHostPhase] = useState<AIHostPhase>('question_start')
  const [selectedHost, setSelectedHost] = useState<string>('riley')

  // Load selected AI Host character from localStorage (set in PlaylistSelection)
  useEffect(() => {
    const saved = localStorage.getItem('selectedAIHost')
    if (saved) {
      setSelectedHost(saved)
    }
  }, [])

  // Check Deepgram support on component mount
  useEffect(() => {
    const isSupported = deepgramService.isReady()
    setSpeechSupported(isSupported)
    
    // Enable speech by default if supported
    if (isSupported) {
      setSpeechEnabled(true)
    } else {
      console.log(deepgramService.getConfigurationHelp())
    }
  }, [])
  
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

  // 2000s playlist songs with curated alternatives
  const songs2000s: Song[] = [
    { 
      id: '1', 
      title: 'Complicated', 
      artist: 'Avril Lavigne', 
      file: '/songs/2000s/ComplicatedAvrilLavigne.mp3', 
      albumArt: '/assets/album-art/2000s/ComplicatedAvrilLavigne.jpeg',
      alternatives: ['Sk8er Boi - Simple Plan', 'Everywhere - Michelle Branch', 'Since U Been Gone - Kelly Clarkson']
    },
    { 
      id: '2', 
      title: 'Empire State of Mind', 
      artist: 'Jay Z (feat. Alicia Keys)', 
      file: '/songs/2000s/EmpireStateOfMindJayZ.mp3', 
      albumArt: '/assets/album-art/2000s/EmpireStateOfMindJayZ.jpeg',
      alternatives: ['Run This Town - Jay-Z, Rihanna & Kanye West', 'Nothin\' on You - B.o.B feat. Bruno Mars', 'All of the Lights - Kanye West feat. Rihanna & Kid Cudi']
    },
    { 
      id: '3', 
      title: 'Fireflies', 
      artist: 'Owl City', 
      file: '/songs/2000s/FirefliesOwlCity.mp3', 
      albumArt: '/assets/album-art/2000s/FirefliesOwlCity.jpeg',
      alternatives: ['Safe and Sound - Capital Cities', 'Shut Up and Dance - Walk The Moon', 'Electric Feel - MGMT']
    },
    { 
      id: '4', 
      title: 'Gimme More', 
      artist: 'Britney Spears', 
      file: '/songs/2000s/GimmeMoreBritneySpears.mp3', 
      albumArt: '/assets/album-art/2000s/GimmeMoreBritneySpears.jpeg',
      alternatives: ['Just Dance - Lady Gaga', 'Can\'t Get You Out of My Head - Kylie Minogue', 'Dirrty - Christina Aguilera']
    },
    { 
      id: '5', 
      title: 'I Want It That Way', 
      artist: 'Backstreet Boys', 
      file: '/songs/2000s/IWantItThatWayBackstreetBoys.mp3', 
      albumArt: '/assets/album-art/2000s/IWantItThatWayBackstreetBoys.jpeg',
      alternatives: ['Tearin\' Up My Heart - *NSYNC', 'Flying Without Wings - Westlife', 'Because of You - 98 Degrees']
    },
    { 
      id: '6', 
      title: 'The Middle', 
      artist: 'Jimmy Eat World', 
      file: '/songs/2000s/TheMiddleJimmyEatWorld.mp3', 
      albumArt: '/assets/album-art/2000s/TheMiddleJimmyEatWorld.jpeg',
      alternatives: ['Ocean Avenue - Yellowcard', 'Sugar, We\'re Goin Down - Fall Out Boy', 'Absolutely (Story of a Girl) - Nine Days']
    },
    { 
      id: '7', 
      title: 'Unwritten', 
      artist: 'Natasha Bedingfield', 
      file: '/songs/2000s/UnwrittenNatashaBedingfield.mp3', 
      albumArt: '/assets/album-art/2000s/UnwrittenNatashaBedingfield.jpeg',
      alternatives: ['Pocketful of Sunshine - Natasha Bedingfield', 'Breakaway - Kelly Clarkson', 'Suddenly I See - KT Tunstall']
    },
    { 
      id: '8', 
      title: 'Viva La Vida', 
      artist: 'Coldplay', 
      file: '/songs/2000s/VivaLaVidaColdplay.mp3', 
      albumArt: '/assets/album-art/2000s/VivaLaVidaColdplay.jpeg',
      alternatives: ['Chasing Cars - Snow Patrol', 'Clocks - Keane', 'Somewhere Only We Know - Keane']
    },
    { 
      id: '9', 
      title: 'Without Me', 
      artist: 'Eminem', 
      file: '/songs/2000s/WithoutMeEminem.mp3', 
      albumArt: '/assets/album-art/2000s/WithoutMeEminem.jpeg',
      alternatives: ['Forgot About Dre - Dr. Dre feat. Eminem', 'Hot in Herre - Nelly', 'In da Club - 50 Cent']
    },
    { 
      id: '10', 
      title: 'Yeah!', 
      artist: 'Usher (feat. Lil Jon & Ludacris)', 
      file: '/songs/2000s/YeahUsher.mp3', 
      albumArt: '/assets/album-art/2000s/YeahUsher.jpeg',
      alternatives: ['Get Low - Lil Jon & The East Side Boyz feat. Ying Yang Twins', 'Tipsy - J-Kwon', 'Lean Back - Terror Squad']
    }
  ]

  // 2020s playlist songs with curated alternatives
  const songs2020s: Song[] = [
    { 
      id: '1', 
      title: 'Cardigan', 
      artist: 'Taylor Swift', 
      file: '/songs/2020s/CardiganTaylorSwift.mp3', 
      albumArt: '/assets/album-art/2020s/CardiganTaylorSwift.jpeg',
      alternatives: ['Liability - Lorde', 'Celeste - Ezra Vine', 'Fine Line - Harry Styles']
    },
    { 
      id: '2', 
      title: 'Enemy', 
      artist: 'Imagine Dragons', 
      file: '/songs/2020s/EnemyImagineDragons.mp3', 
      albumArt: '/assets/album-art/2020s/EnemyImagineDragons.jpeg',
      alternatives: ['Believer - OneRepublic', 'Centuries - Fall Out Boy', 'Radioactive - AWOLNATION']
    },
    { 
      id: '3', 
      title: 'Good Luck, Babe', 
      artist: 'Chappell Roan', 
      file: '/songs/2020s/GoodLuckBabeChappellRoan.mp3', 
      albumArt: '/assets/album-art/2020s/GoodLuckBabeChappellRoan.jpeg',
      alternatives: ['Strangers - Halsey feat. Lauren Jauregui', 'Green Light - Lorde', 'Stayaway - MUNA']
    },
    { 
      id: '4', 
      title: 'Here With Me', 
      artist: 'd4vd', 
      file: '/songs/2020s/HereWithMed4vd.mp3', 
      albumArt: '/assets/album-art/2020s/HereWithMed4vd.jpeg',
      alternatives: ['Romantic Homicide - d4vd', 'comethru - Jeremy Zucker', 'idontwannabeyouanymore - Billie Eilish']
    },
    { 
      id: '5', 
      title: 'Snooze', 
      artist: 'SZA', 
      file: '/songs/2020s/SnoozeSZA.mp3', 
      albumArt: '/assets/album-art/2020s/SnoozeSZA.jpeg',
      alternatives: ['Nights - Frank Ocean', 'After Dark - Drake feat. Static Major & Ty Dolla $ign', 'Find Someone Like You - Snoh Aalegra']
    },
    { 
      id: '6', 
      title: 'Taste', 
      artist: 'Sabrina Carpenter', 
      file: '/songs/2020s/TasteSabrinaCarpenter.mp3', 
      albumArt: '/assets/album-art/2020s/TasteSabrinaCarpenter.jpeg',
      alternatives: ['Good Ones - Charli XCX', 'Sweet but Psycho - Ava Max', 'Don\'t Call Me Up - Mabel']
    },
    { 
      id: '7', 
      title: 'the boy is mine', 
      artist: 'Ariana Grande', 
      file: '/songs/2020s/TheBoyIsMineArianaGrande.mp3', 
      albumArt: '/assets/album-art/2020s/TheBoyIsMineArianaGrande.jpeg',
      alternatives: ['No Tears Left to Cry - Dua Lipa', 'Say So - Doja Cat', 'Levitating - Dua Lipa feat. DaBaby']
    },
    { 
      id: '8', 
      title: 'Too Many Nights', 
      artist: 'Metro Boomin', 
      file: '/songs/2020s/TooManyNightsMetroBoomin.mp3', 
      albumArt: '/assets/album-art/2020s/TooManyNightsMetroBoomin.jpeg',
      alternatives: ['Knife Talk - Drake feat. 21 Savage', 'Bank Account - 21 Savage', 'Life Goes On - Lil Baby & Gunna']
    },
    { 
      id: '9', 
      title: 'Traitor', 
      artist: 'Olivia Rodrigo', 
      file: '/songs/2020s/TraitorOliviaRodrigo.mp3', 
      albumArt: '/assets/album-art/2020s/TraitorOliviaRodrigo.jpeg',
      alternatives: ['drivers license - Conan Gray', 'Moral of the Story - Ashe', 'You Broke Me First - Tate McRae']
    },
    { 
      id: '10', 
      title: 'Woman', 
      artist: 'Doja Cat', 
      file: '/songs/2020s/WomanDojaCat.mp3', 
      albumArt: '/assets/album-art/2020s/WomanDojaCat.jpeg',
      alternatives: ['Kiss Me More - Saweetie feat. H.E.R.', 'Savage Remix - Megan Thee Stallion feat. Beyoncé', 'Truth Hurts - Lizzo']
    }
  ]

  const getPlaylistSongs = (playlistName: string): Song[] => {
    switch (playlistName) {
      case '2020s':
        return songs2020s
      case '2010s':
        return songs2010s
      case '2000s':
        return songs2000s
      default:
        return songs2010s // Default to 2010s if playlist not found
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
    setIsCorrect(false)
    setArtistCorrect(false)
    setSongCorrect(false)
    setPointsEarned(0)
    
    // No AI host during question phase - only during feedback
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
      audio.play().catch(error => {
        console.error('Quiz Audio: Play failed:', error)
      })
    }
    setIsPlaying(!isPlaying)
  }

  const handleAnswerSelect = (answer: string, artistMatch?: boolean, songMatch?: boolean) => {
    if (selectedAnswer) return // Already answered
    
    // Stop speech recognition if active
    stopSpeechRecognition()
    
    setSelectedAnswer(answer)
    const playerCorrect = answer === currentQuestion?.correctAnswer
    setIsCorrect(playerCorrect)
    
    // Handle partial scoring for speech recognition
    if (artistMatch !== undefined && songMatch !== undefined) {
      // Speech recognition with partial scoring
      setArtistCorrect(artistMatch)
      setSongCorrect(songMatch)
      const points = (artistMatch ? 10 : 0) + (songMatch ? 10 : 0)
      setPointsEarned(points)
    } else {
      // Traditional multiple choice - all or nothing
      if (playerCorrect) {
        setArtistCorrect(true)
        setSongCorrect(true)
        setPointsEarned(20)
      } else {
        setArtistCorrect(false)
        setSongCorrect(false)
        setPointsEarned(0)
      }
    }
    
    // Update AI host based on answer
    const newPhase = (artistMatch || songMatch || playerCorrect) ? 'correct_answer' : 'wrong_answer'
    setHostPhase(newPhase)
    
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
    
    // Award points based on new scoring system
    if (artistMatch !== undefined && songMatch !== undefined) {
      // Speech recognition with partial scoring
      const points = (artistMatch ? 10 : 0) + (songMatch ? 10 : 0)
      setScore(prev => prev + points)
    } else if (playerCorrect) {
      // Traditional multiple choice - full 20 points
      setScore(prev => prev + 20)
    }
    
    if (opponentGetsItRight) {
      // Opponent gets random partial or full score
      const opponentPoints = Math.random() < 0.5 ? 10 : 20
      setOpponentScore(prev => prev + opponentPoints)
    }
  }

  const nextQuestion = () => {
    if (questionNumber >= totalQuestions) {
      setGameComplete(true)
      setHostPhase('game_end')
    } else {
      setQuestionNumber(prev => prev + 1)
      setHostPhase('round_end')
      
      // Start new question after brief delay for AI commentary
      setTimeout(() => {
        startNewQuestion()
      }, 2000)
    }
  }

  const restartGame = () => {
    stopSpeechRecognition()
    setScore(0)
    setOpponentScore(0)
    setQuestionNumber(1)
    setGameComplete(false)
    startNewQuestion()
  }

  const backToPlaylist = () => {
    stopSpeechRecognition()
    navigate('/')
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Speech Recognition Functions
  const checkSpokenAnswer = (transcript: string): { answer: string | null, artistMatch: boolean, songMatch: boolean } => {
    if (!currentQuestion) return { answer: null, artistMatch: false, songMatch: false }
    
    const cleanTranscript = transcript.toLowerCase().trim()
    const songTitle = currentQuestion.song.title.toLowerCase()
    const songArtist = currentQuestion.song.artist.toLowerCase()
    
    // Check if transcript contains song title and/or artist
    const hasTitle = cleanTranscript.includes(songTitle)
    const hasArtist = cleanTranscript.includes(songArtist)
    
    // If we have at least one match, consider it a valid answer
    if (hasTitle || hasArtist) {
      return { 
        answer: currentQuestion.correctAnswer, 
        artistMatch: hasArtist, 
        songMatch: hasTitle 
      }
    }
    
    // Check against all possible answers for fallback
    for (const option of currentQuestion.options) {
      const optionLower = option.toLowerCase()
      if (cleanTranscript.includes(optionLower)) {
        // For multiple choice matches, we can't determine partial scores
        // so treat as full match if it's the correct answer
        const isCorrect = option === currentQuestion.correctAnswer
        return { 
          answer: option, 
          artistMatch: isCorrect, 
          songMatch: isCorrect 
        }
      }
    }
    
    return { answer: null, artistMatch: false, songMatch: false }
  }

  const startSpeechRecognition = async () => {
    if (!speechSupported || !speechEnabled || selectedAnswer || isListening) return

    // Pause the audio when starting speech recognition
    const audio = audioRef.current
    if (audio && isPlaying) {
      audio.pause()
      setIsPlaying(false)
    }

    const success = await deepgramService.startListening(
      // onTranscript callback
      (response: DeepgramResponse) => {
        const transcript = response.transcript.toLowerCase().trim()
        
        // Only process final results with decent confidence
        if (response.isFinal && response.confidence > 0.3 && transcript.length > 2) {
          const result = checkSpokenAnswer(transcript)
          if (result.answer) {
            stopSpeechRecognition()
            handleAnswerSelect(result.answer, result.artistMatch, result.songMatch)
          }
        }
      },
      // onError callback
      (error: any) => {
        console.error('Deepgram error:', error)
        setIsListening(false)
      },
      // onStarted callback
      () => {
        setIsListening(true)
      },
      // onEnded callback
      () => {
        setIsListening(false)
      }
    )

    if (!success) {
      setIsListening(false)
    }
  }

  const stopSpeechRecognition = () => {
    deepgramService.stopListening()
    setIsListening(false)
  }

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      deepgramService.stopListening()
    }
  }, [])

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
                    <span className="score-total">/ {totalQuestions * 20}</span>
                  </div>
                  <p className="score-percentage">
                    {Math.round((score / (totalQuestions * 20)) * 100)}% Correct
                  </p>
                </div>
                
                <div className="vs-divider">VS</div>
                
                <div className="opponent-final-score">
                  <h4>Opponent Score</h4>
                  <div className="score-display">
                    <span className="score-number">{opponentScore}</span>
                    <span className="score-total">/ {totalQuestions * 20}</span>
                  </div>
                  <p className="score-percentage">
                    {Math.round((opponentScore / (totalQuestions * 20)) * 100)}% Correct
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

            {/* Speech Recognition Interface - only show during question phase */}
            {speechSupported && speechEnabled && !selectedAnswer && !showFeedback && (
              <div className="speech-recognition-section">
                <p className="speech-instruction">
                  🎤 Speak the name of the song and artist:
                </p>
                <button
                  className={`speech-button ${isListening ? 'listening' : ''}`}
                  onClick={isListening ? stopSpeechRecognition : startSpeechRecognition}
                  disabled={!!selectedAnswer}
                >
                  {isListening ? (
                    <>
                      <span className="mic-icon listening">🎤</span>
                      <span className="listening-text">Listening...</span>
                    </>
                  ) : (
                    <>
                      <span className="mic-icon">🎤</span>
                      <span>Start Speaking</span>
                    </>
                  )}
                </button>
              </div>
            )}
            
            {!speechSupported && !showFeedback && (
              <div className="speech-recognition-section">
                <p className="speech-error">
                  Speech recognition is not available. Please configure Deepgram API key.
                </p>
              </div>
            )}

            {/* Results/Feedback Screen - combines album art and score breakdown */}
            {showFeedback && (
              <div className="feedback-container">
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

                <div className="score-breakdown">
                  <h3>You earned {pointsEarned} points!</h3>
                  {pointsEarned > 0 && (
                    <div className="breakdown-details">
                      {artistCorrect && <p>✅ Artist: {currentQuestion.song.artist} (+10 points)</p>}
                      {songCorrect && <p>✅ Song: {currentQuestion.song.title} (+10 points)</p>}
                      {!artistCorrect && pointsEarned > 0 && <p>❌ Artist: {currentQuestion.song.artist}</p>}
                      {!songCorrect && pointsEarned > 0 && <p>❌ Song: {currentQuestion.song.title}</p>}
                    </div>
                  )}
                  {pointsEarned === 0 && (
                    <div className="breakdown-details">
                      <p>The correct answer was:</p>
                      <p><strong>{currentQuestion.song.title}</strong> by <strong>{currentQuestion.song.artist}</strong></p>
                    </div>
                  )}
                </div>

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
                  {pointsEarned === 20 ? 'Perfect! +20 Points' :
                   pointsEarned === 10 ? (artistCorrect ? 'Artist Correct! +10 Points' : 'Song Correct! +10 Points') :
                   'Correct! +' + pointsEarned + ' Points'}
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
                  Correct! +{Math.random() < 0.5 ? '10' : '20'} Points
                </div>
              </>
            )}
          </div>
        </div>
        
                {/* AI Host Component */}
        {!gameComplete && selectedHost !== 'none' && (
          <AIHost
            gamePhase={hostPhase}
            playerName="You"
            playerScore={score}
            opponentScore={opponentScore}
            songTitle={currentQuestion?.song.title}
            songArtist={currentQuestion?.song.artist}
            isCorrect={isCorrect}
            character={selectedHost}
            enabled={true}
            voiceEnabled={true} // Voice synthesis enabled!
          />
        )}



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

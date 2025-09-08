import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import './Game.css'

interface Song {
  id: string
  title: string
  artist: string
  file: string
  albumArt: string
  alternatives: string[]
  artistAlternatives?: string[] // Alternative spellings/pronunciations for artist names
}

interface QuizQuestion {
  song: Song
  options: string[]
  correctAnswer: string
}


const Game = () => {
  const navigate = useNavigate()
  const { playlist } = useParams<{ playlist: string }>()
  const [searchParams] = useSearchParams()
  const version = searchParams.get('version') || 'Version A'
  const audioRef = useRef<HTMLAudioElement>(null)
  
  
  // Sound effect refs
  const correctAnswerSfxRef = useRef<HTMLAudioElement>(null)
  const victoryApplauseSfxRef = useRef<HTMLAudioElement>(null)
  
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
  const [opponentPointsEarned, setOpponentPointsEarned] = useState(0)
  const [gameComplete, setGameComplete] = useState(false)
  const totalQuestions = 7

  // Version A specific state
  const [streak, setStreak] = useState(0)
  const [isOnStreak, setIsOnStreak] = useState(false)
  const [opponentStreak, setOpponentStreak] = useState(0)
  const [opponentIsOnStreak, setOpponentIsOnStreak] = useState(false)
  const [opponentBuzzedIn, setOpponentBuzzedIn] = useState(false)
  const [playerBuzzedFirst, setPlayerBuzzedFirst] = useState(false)
  const [roundStartTime, setRoundStartTime] = useState<number>(0)
  const [speedBonusToggle, setSpeedBonusToggle] = useState(false)
  
  // Version B specific state
  const [currentStars, setCurrentStars] = useState(0)
  
  // Version C specific state
  const [timeRemaining, setTimeRemaining] = useState(60)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [allAttemptedSongs, setAllAttemptedSongs] = useState<Array<{
    song: any,
    pointsEarned: number,
    artistCorrect: boolean,
    songCorrect: boolean
  }>>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Version B star calculation
  const calculateStars = (totalScore: number): number => {
    if (totalScore < 20) return 0
    if (totalScore >= 20 && totalScore <= 50) return 1
    if (totalScore >= 51 && totalScore <= 109) return 2
    if (totalScore >= 110) return 3
    return 0
  }
  
  // Track used songs to prevent duplicates within the same game
  const [usedSongIds, setUsedSongIds] = useState<string[]>([])
  
  // Prevent multiple simultaneous question loading
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false)

  
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
      alternatives: ['Location - Khalid', 'Love on the Brain - Rihanna', 'Pretty Little Fears - 6LACK feat. J. Cole'],
      artistAlternatives: ['Kendrick Lamarr', 'Kendrick', 'Lamar']
    },
    { 
      id: '3', 
      title: 'Closer', 
      artist: 'The Chainsmokers', 
      file: '/songs/2010s/CloserChainsmokers.mp3', 
      albumArt: '/assets/album-art/2010s/CloserChainsmokers.jpeg',
      alternatives: ['It Ain\'t Me - Kygo & Selena Gomez', 'Faded - Zedd feat. Alessia Cara', 'Paris - Lauv'],
      artistAlternatives: ['Chainsmokers', 'Chain Smokers', 'Chainsmockers']
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
      alternatives: ['Mask Off - Future', 'Bad and Boujee - Migos feat. Lil Uzi Vert', 'Alright - J. Cole'],
      artistAlternatives: ['Kendrick Lamarr', 'Kendrick', 'Lamar']
    },
    { 
      id: '6', 
      title: 'Low', 
      artist: 'Flo Rida', 
      file: '/songs/2010s/LowFloRida.mp3', 
      albumArt: '/assets/album-art/2010s/LowFloRida.jpeg',
      alternatives: ['Buy U a Drank - T-Pain feat. Yung Joc', 'Temperature - Sean Paul', 'Tipsy - J-Kwon'],
      artistAlternatives: ['Flow Rider', 'Flow Rida', 'Flo Rider', 'Florida']
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
      alternatives: ['Sex - The 1975', 'Riptide - Vance Joy', 'Youth - Daughter'],
      artistAlternatives: ['Neighbourhood', 'Neighborhood', 'The Neighborhood']
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
      alternatives: ['Strangers - Halsey feat. Lauren Jauregui', 'Green Light - Lorde', 'Stayaway - MUNA'],
      artistAlternatives: ['Chapel Roan', 'Chapelle Roan', 'Chappel Roan']
    },
    { 
      id: '4', 
      title: 'Here With Me', 
      artist: 'd4vd', 
      file: '/songs/2020s/HereWithMed4vd.mp3', 
      albumArt: '/assets/album-art/2020s/HereWithMed4vd.jpeg',
      alternatives: ['Romantic Homicide - d4vd', 'comethru - Jeremy Zucker', 'idontwannabeyouanymore - Billie Eilish'],
      artistAlternatives: ['David', 'D4VD', 'D four V D', 'Dee Four Vee Dee']
    },
    { 
      id: '5', 
      title: 'Snooze', 
      artist: 'SZA', 
      file: '/songs/2020s/SnoozeSZA.mp3', 
      albumArt: '/assets/album-art/2020s/SnoozeSZA.jpeg',
      alternatives: ['Nights - Frank Ocean', 'After Dark - Drake feat. Static Major & Ty Dolla $ign', 'Find Someone Like You - Snoh Aalegra'],
      artistAlternatives: ['Essa', 'S-Z-A', 'Sza', 'Solana']
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
      alternatives: ['Knife Talk - Drake feat. 21 Savage', 'Bank Account - 21 Savage', 'Life Goes On - Lil Baby & Gunna'],
      artistAlternatives: ['Metro Booming', 'Metro Boomin\'', 'Metro']
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
    
    // Filter out songs that have already been used in this game
    const availableSongs = playlistSongs.filter(song => !usedSongIds.includes(song.id))
    
    // For Version C, if we've used all songs, reset the list (since it's a rapid-fire mode)
    // For other versions, if all songs have been used, reset and use all songs again
    const songsToChooseFrom = availableSongs.length > 0 ? availableSongs : playlistSongs
    
    // Reset used songs if we're out of unique songs (mainly for Version C)
    if (availableSongs.length === 0) {
      setUsedSongIds([])
    }
    
    const randomIndex = Math.floor(Math.random() * songsToChooseFrom.length)
    const correctSong = songsToChooseFrom[randomIndex]
    
    // Add this song to the used list
    setUsedSongIds(prev => [...prev, correctSong.id])
    
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
    // Prevent multiple simultaneous calls
    if (isLoadingQuestion) {
      return
    }
    setIsLoadingQuestion(true)
    
    // Stop and reset any currently playing audio - comprehensive cleanup
    const audio = audioRef.current
    if (audio) {
      console.log('🎵 START: Performing comprehensive audio cleanup')
      audio.pause()
      audio.currentTime = 0
      setIsPlaying(false)
      setCurrentTime(0)
      
      // Clear ALL event listeners that might interfere
      audio.oncanplay = null
      audio.oncanplaythrough = null 
      audio.onloadeddata = null
      audio.onloadedmetadata = null
      audio.onerror = null
      
      // Complete reset of audio element for all versions (not just Version C)
      audio.src = ''
      audio.load()
    }
    
    const question = generateQuizQuestion()
    setCurrentQuestion(question)
    setSelectedAnswer(null)
    setShowFeedback(false)
    setIsCorrect(false)
    setArtistCorrect(false)
    setSongCorrect(false)
    setPointsEarned(0)
    console.log(`🐛 BUG FIX: NOT resetting opponentPointsEarned in startNewQuestion - it should only reset when new scoring happens`)
    // setOpponentPointsEarned(0) // REMOVED - this was causing the popup mismatch!
    
    // Version-specific resets
    if (version === 'Version A') {
      setOpponentBuzzedIn(false)
      setPlayerBuzzedFirst(false)
      setRoundStartTime(Date.now())
      setSpeedBonusToggle(false) // Reset speed bonus toggle for new question
      
      // Randomly schedule opponent buzz-in (60% chance they buzz in first)
      if (Math.random() < 0.6) {
        const buzzInDelay = Math.random() * 8000 + 2000 // 2-10 seconds
        setTimeout(() => {
          if (!selectedAnswer) { // Only if player hasn't answered yet
            setOpponentBuzzedIn(true)
          }
        }, buzzInDelay)
      }
    } else if (version === 'Version B') {
      // Version B has no opponent mechanics, just update star progress
      setCurrentStars(calculateStars(score))
    } else if (version === 'Version C') {
      // Version C: Start timer if not already running, or continue if still running
      if (!isTimerRunning && timeRemaining === 60) {
        setIsTimerRunning(true)
      } else if (!isTimerRunning && timeRemaining > 0) {
        setIsTimerRunning(true)
      }
    }
    
    // Auto-play the song after audio element has loaded the new source
    // Use multiple attempts to ensure audio plays reliably
    const attemptAutoPlay = (attemptNumber = 1, maxAttempts = 3) => {
      const audioElement = audioRef.current
      console.log(`🎵 GAME: Auto-play attempt ${attemptNumber}/${maxAttempts} for ${version}:`, {
        hasAudioElement: !!audioElement,
        currentSrc: audioElement?.src,
        expectedFile: question.song.file,
        readyState: audioElement?.readyState,
        songTitle: question.song.title
      })
      
      if (audioElement) {
        // Ensure clean state before setting new source
        console.log('🎵 AUTOPLAY: Ensuring clean audio state')
        audioElement.pause()
        audioElement.currentTime = 0
        
        // Clear any existing event listeners to prevent conflicts
        audioElement.oncanplay = null
        audioElement.oncanplaythrough = null
        audioElement.onloadeddata = null
        audioElement.onloadedmetadata = null
        audioElement.onerror = null
        
        // Set the new source
        audioElement.src = question.song.file
        console.log(`🎵 AUTOPLAY: Set new source: ${question.song.file}`)
        
        // Add error handler for this attempt
        audioElement.onerror = (error) => {
          console.error(`🎵 AUTOPLAY: Audio loading error on attempt ${attemptNumber}:`, error)
          audioElement.onerror = null
          if (attemptNumber < maxAttempts) {
            setTimeout(() => attemptAutoPlay(attemptNumber + 1, maxAttempts), 500)
          } else {
            console.error('🎵 AUTOPLAY: All attempts failed due to loading errors')
            setIsPlaying(false)
            setIsLoadingQuestion(false)
          }
        }
        
        // Wait for audio to be ready and then play
        const playAudio = () => {
          // Clear error handler since we're about to play
          audioElement.onerror = null
          
          audioElement.play().then(() => {
            console.log(`🎵 GAME: Audio playback started successfully for ${question.song.title}`)
            setIsPlaying(true)
            setIsLoadingQuestion(false)
          }).catch(error => {
            console.error(`🎵 GAME: Auto-play attempt ${attemptNumber} failed for ${question.song.title}:`, error)
            if (attemptNumber < maxAttempts) {
              // Try again after a longer delay
              setTimeout(() => attemptAutoPlay(attemptNumber + 1, maxAttempts), 500)
            } else {
              console.error('🎵 GAME: All auto-play attempts failed')
              setIsPlaying(false)
              setIsLoadingQuestion(false)
            }
          })
        }
        
        // Try to play immediately if ready, or wait for audio to load
        if (audioElement.readyState >= 3) { // HAVE_FUTURE_DATA
          console.log('🎵 AUTOPLAY: Audio ready, playing immediately')
          playAudio()
        } else {
          console.log('🎵 AUTOPLAY: Waiting for audio to load...')
          audioElement.oncanplay = () => {
            console.log('🎵 AUTOPLAY: Audio can play, starting playback')
            audioElement.oncanplay = null
            playAudio()
          }
          
          // Add timeout in case oncanplay never fires
          const timeoutId = setTimeout(() => {
            console.warn('🎵 AUTOPLAY: Timeout waiting for canplay, trying anyway')
            audioElement.oncanplay = null
            if (audioElement.readyState >= 2) { // HAVE_CURRENT_DATA
              playAudio()
            } else if (attemptNumber < maxAttempts) {
              setTimeout(() => attemptAutoPlay(attemptNumber + 1, maxAttempts), 500)
            } else {
              console.error('🎵 AUTOPLAY: Final timeout - audio never became ready')
              setIsPlaying(false)
              setIsLoadingQuestion(false)
            }
          }, 3000) // 3 second timeout
          
          // Clear timeout when canplay fires
          audioElement.oncanplay = () => {
            console.log('🎵 AUTOPLAY: Audio can play, starting playback')
            clearTimeout(timeoutId)
            audioElement.oncanplay = null
            playAudio()
          }
          
          audioElement.load() // Force reload
        }
      } else {
        console.log('🎵 GAME: No audio element found')
        setIsLoadingQuestion(false)
      }
    }
    
    // Start auto-play with a short delay to allow audio element cleanup to complete
    setTimeout(() => attemptAutoPlay(), 500)
    
  }

  useEffect(() => {
    if (!playlist) {
      return
    }
    
    setUsedSongIds([]) // Reset used songs when playlist changes
    
    // Version C: Start timer when game begins
    if (version === 'Version C') {
      setIsTimerRunning(true)
      setTimeRemaining(60)
      setAllAttemptedSongs([])
    }
    
    startNewQuestion()
  }, [playlist])
  
  // Version C Timer Effect
  useEffect(() => {
    if (version === 'Version C' && isTimerRunning && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Timer reached 0, end the game
            setIsTimerRunning(false)
            setGameComplete(true)
            
            // Pause current audio
            const audio = audioRef.current
            if (audio) {
              audio.pause()
              setIsPlaying(false)
            }
            
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    
    // Cleanup timer
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [version, isTimerRunning, timeRemaining])


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
      setIsPlaying(false)
    } else {
      // Ensure audio is ready to play
      const attemptPlay = () => {
        audio.play().then(() => {
          setIsPlaying(true)
          console.log('🎵 GAME: Manual play started successfully')
        }).catch(error => {
          console.error('🎵 GAME: Manual play failed, attempting to reload:', error)
          // Try reloading the audio source and playing again
          const originalSrc = audio.src
          audio.src = ''
          audio.src = originalSrc
          audio.load()
          
          setTimeout(() => {
            audio.play().then(() => {
              setIsPlaying(true)
              console.log('🎵 GAME: Manual play retry successful')
            }).catch(retryError => {
              console.error('🎵 GAME: Manual play retry failed:', retryError)
              setIsPlaying(false)
            })
          }, 100)
        })
      }
      
      // If audio seems ready, play immediately, otherwise wait for it to load
      if (audio.readyState >= 2) { // HAVE_CURRENT_DATA
        attemptPlay()
      } else {
        audio.oncanplaythrough = () => {
          audio.oncanplaythrough = null
          attemptPlay()
        }
        audio.load()
      }
    }
  }

  // Version C rapid-fire scoring function
  const handleVersionCScore = (points: number) => {
    if (selectedAnswer || !isTimerRunning || !currentQuestion) return // Already answered or timer stopped or no question
    
    console.log('🎵 VERSION C: handleVersionCScore called with points:', points)
    
    setSelectedAnswer('manual_score')
    
    // Determine correctness based on points
    let artistCorrect = false
    let songCorrect = false
    
    if (points >= 20) {
      artistCorrect = true
      songCorrect = true
    } else if (points >= 10) {
      // For 10 points, don't set correctness indicators (as per previous fix)
      artistCorrect = false
      songCorrect = false
    }
    
    // Add this attempt to the tracking array
    setAllAttemptedSongs(prev => [...prev, {
      song: currentQuestion.song,
      pointsEarned: points,
      artistCorrect,
      songCorrect
    }])
    
    // Award points to player
    const newScore = score + points
    setScore(newScore)
    
    if (points > 0) {
      playCorrectAnswerSfx()
    }
    
    // Stop current audio completely
    const audio = audioRef.current
    if (audio) {
      console.log('🎵 VERSION C: Pausing current audio and resetting')
      audio.pause()
      audio.currentTime = 0
      setIsPlaying(false)
      setCurrentTime(0)
      // Clear event listeners to prevent conflicts
      audio.onloadeddata = null
      audio.oncanplay = null
      audio.oncanplaythrough = null
    }
    
    // Reset selected answer for next question
    setSelectedAnswer(null)
    
    // For Version C, immediately move to next song (very short delay to allow state updates)
    setTimeout(() => {
      console.log('🎵 VERSION C: Moving to next question after scoring', points, 'points')
      console.log('🎵 VERSION C: Current timer running:', isTimerRunning, 'Time remaining:', timeRemaining)
      startNewQuestion()
    }, 200) // Reduced delay for faster progression
  }

  // Version B manual scoring function
  const handleVersionBScore = (points: number) => {
    if (selectedAnswer) return // Already answered
    
    setSelectedAnswer('manual_score')
    
    // For Version B, questions 1-6 use 0,10,20 scoring
    // Question 7 uses 0,30 scoring
    let artistCorrect = false
    let songCorrect = false
    
    if (questionNumber === totalQuestions) {
      // Question 7: 0 or 30 points
      if (points === 30) {
        artistCorrect = true
        songCorrect = true
      }
      // For 10 points on Q7 (shouldn't happen, but just in case), don't set any correctness
    } else {
      // Questions 1-6: 0, 10, or 20 points
      if (points >= 20) {
        artistCorrect = true
        songCorrect = true
      }
      // For 10 points, don't set artistCorrect or songCorrect - leave them as false
      // This way we won't show ✅ or ❌ indicators, just the song info
    }
    
    setArtistCorrect(artistCorrect)
    setSongCorrect(songCorrect)
    setIsCorrect(points > 0) // Player gets credit for any points earned
    setPointsEarned(points)
    
    if (points > 0) {
      playCorrectAnswerSfx()
    }
    
    setShowFeedback(true)
    
    // Pause audio
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      setIsPlaying(false)
    }
    
    // Award points to player and update star progress
    const newScore = score + points
    setScore(newScore)
    setCurrentStars(calculateStars(newScore))
  }

  // Version A manual scoring function
  const handleManualScore = (points: number) => {
    if (selectedAnswer) return // Already answered
    
    setSelectedAnswer('manual_score')
    
    // Determine what the points represent
    let artistCorrect = false
    let songCorrect = false
    let basePoints = points
    
    if (points >= 20) {
      artistCorrect = true
      songCorrect = true
    }
    // For 10 points, don't set artistCorrect or songCorrect - leave them as false
    // This way we won't show ✅ or ❌ indicators, just the song info
    
    setArtistCorrect(artistCorrect)
    setSongCorrect(songCorrect)
    setIsCorrect(points > 0) // Player gets credit for any points earned
    
    // Calculate bonuses for Version A
    let bonusPoints = 0
    let bonusReasons: string[] = []
    
    // Speed bonus - use manual toggle
    if (speedBonusToggle) {
      bonusPoints += 10
      bonusReasons.push('Speed Bonus')
      setPlayerBuzzedFirst(true)
    } else {
      setPlayerBuzzedFirst(false)
    }
    
    // Streak bonus - check if player has 3+ correct in a row
    // Any positive score should count toward streak (including 10-point partial scores)
    if (points > 0) {
      const newStreak = streak + 1
      setStreak(newStreak)
      
      if (newStreak >= 3) {
        bonusPoints += 10
        bonusReasons.push('Streak Bonus')
        setIsOnStreak(true)
      }
    } else {
      setStreak(0)
      setIsOnStreak(false)
    }
    
    const totalPoints = basePoints + bonusPoints
    setPointsEarned(totalPoints)
    
    
    if (totalPoints > 0) {
      playCorrectAnswerSfx()
    }
    
    // Generate opponent random values ONCE to prevent flickering
    const opponentCorrectRandom = Math.random()
    const opponentPointsRandom = Math.random()
    
    // Simulate opponent answer (50% chance of being correct)
    const opponentGetsItRight = opponentCorrectRandom < 0.5
    const opponentPointsValue = opponentPointsRandom < 0.5 ? 10 : 20
    
    setOpponentCorrect(opponentGetsItRight)
    
    // Update opponent streak
    if (opponentGetsItRight) {
      const newOpponentStreak = opponentStreak + 1
      setOpponentStreak(newOpponentStreak)
      if (newOpponentStreak >= 3) {
        setOpponentIsOnStreak(true)
      }
    } else {
      setOpponentStreak(0)
      setOpponentIsOnStreak(false)
    }
    
    setShowFeedback(true)
    
    // Pause audio
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      setIsPlaying(false)
    }
    
    // Award points to player
    setScore(prev => prev + totalPoints)
    
    if (opponentGetsItRight) {
      // Use the pre-calculated opponent points (no new random generation)
      setOpponentPointsEarned(opponentPointsValue)
      setOpponentScore(prev => prev + opponentPointsValue)
    } else {
      setOpponentPointsEarned(0)
    }
  }

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer) return // Already answered
    
    setSelectedAnswer(answer)
    const playerCorrect = answer === currentQuestion?.correctAnswer
    setIsCorrect(playerCorrect)
    
    // Traditional multiple choice - all or nothing
    if (playerCorrect) {
      setArtistCorrect(true)
      setSongCorrect(true)
      setPointsEarned(20)
      // Play correct answer SFX for correct answer
      playCorrectAnswerSfx()
    } else {
      setArtistCorrect(false)
      setSongCorrect(false)
      setPointsEarned(0)
    }
    
    // Simulate opponent answer (50% chance of being correct)
    const opponentGetsItRight = Math.random() < 0.5
    setOpponentCorrect(opponentGetsItRight)
    
    // Update opponent streak (for non-Version A)
    if (opponentGetsItRight) {
      const newOpponentStreak = opponentStreak + 1
      setOpponentStreak(newOpponentStreak)
      if (newOpponentStreak >= 3) {
        setOpponentIsOnStreak(true)
      }
    } else {
      setOpponentStreak(0)
      setOpponentIsOnStreak(false)
    }
    
    setShowFeedback(true)
    
    // Pause audio
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      setIsPlaying(false)
    }
    
    // Award points
    if (playerCorrect) {
      setScore(prev => prev + 20)
    }
    
    if (opponentGetsItRight) {
      // Opponent gets random partial or full score
      const opponentPoints = Math.random() < 0.5 ? 10 : 20
      // setOpponentPointsEarned(opponentPoints) // DISABLED - causes race condition with handleManualScore
      // setOpponentScore(prev => prev + opponentPoints) // DISABLED - opponent scoring handled by handleManualScore only
    } else {
      // setOpponentPointsEarned(0) // DISABLED - opponent scoring handled by handleManualScore only
    }
  }

  const nextQuestion = () => {
    // First, properly stop and cleanup current audio
    const audio = audioRef.current
    if (audio) {
      console.log('🎵 NEXT: Stopping current audio before proceeding')
      audio.pause()
      audio.currentTime = 0
      setIsPlaying(false)
      setCurrentTime(0)
      // Clear any pending event listeners
      audio.oncanplay = null
      audio.oncanplaythrough = null
      audio.onloadeddata = null
    }

    if (questionNumber >= totalQuestions) {
      setGameComplete(true)
      
      // Play victory applause SFX if player won
      setTimeout(() => {
        if (score > opponentScore) {
          console.log('🎉 GAME: Player won!')
          playVictoryApplauseSfx()
        }
      }, 500) // Small delay to allow results to appear first
    } else {
      setQuestionNumber(prev => prev + 1)
      
      // Start new question with proper delay for cleanup
      setTimeout(() => {
        startNewQuestion()
      }, 1000)
    }
  }

  const restartGame = () => {
    setScore(0)
    setOpponentScore(0)
    setQuestionNumber(1)
    setGameComplete(false)
    setUsedSongIds([]) // Reset used songs for new game
    setIsLoadingQuestion(false) // Reset loading state
    // Reset opponent points tracking
    setOpponentPointsEarned(0)
    // Reset Version A streaks
    setStreak(0)
    setIsOnStreak(false)
    setOpponentStreak(0)
    setOpponentIsOnStreak(false)
    setSpeedBonusToggle(false) // Reset speed bonus toggle
    // Reset Version B stars
    setCurrentStars(0)
    // Reset Version C timer and attempts
    setTimeRemaining(60)
    setIsTimerRunning(false)
    setAllAttemptedSongs([])
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    
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

  // Sound effect functions
  const playCorrectAnswerSfx = () => {
    const sfx = correctAnswerSfxRef.current
    if (sfx) {
      sfx.currentTime = 0
      sfx.play().catch(error => {
        console.log('SFX: Correct answer sound failed to play:', error)
      })
    }
  }

  const playVictoryApplauseSfx = () => {
    console.log('🎉 SFX: playVictoryApplauseSfx called')
    console.log('🎉 SFX: Current game state:', { gameComplete, questionNumber, totalQuestions })
    
    // First, let's see what's in the DOM
    const allAudioElements = document.querySelectorAll('audio')
    console.log('🎉 SFX: ALL audio elements in DOM:', allAudioElements.length)
    
    for (let i = 0; i < allAudioElements.length; i++) {
      const audio = allAudioElements[i]
      console.log(`🎉 SFX: Audio ${i}:`, { 
        src: audio.src,
        outerHTML: audio.outerHTML.substring(0, 100) + '...',
        hasApplauseInSrc: audio.src.includes('sfx_sq_applause_correct_answer'),
        hasApplauseInHTML: audio.outerHTML.includes('sfx_sq_applause_correct_answer')
      })
    }
    
    // Try to find the audio element by ref first
    let sfx = victoryApplauseSfxRef.current
    console.log('🎉 SFX: Audio element via ref:', { 
      hasElement: !!sfx, 
      src: sfx?.src, 
      readyState: sfx?.readyState,
      duration: sfx?.duration
    })
    
    // If ref doesn't work, try to find it by DOM query as fallback
    if (!sfx) {
      console.log('🎉 SFX: Ref failed, trying DOM query fallback...')
      
      // Try multiple approaches to find the audio
      for (let i = 0; i < allAudioElements.length; i++) {
        const audio = allAudioElements[i]
        if (audio.src.includes('sfx_sq_applause_correct_answer') || 
            audio.outerHTML.includes('sfx_sq_applause_correct_answer')) {
          sfx = audio
          console.log('🎉 SFX: Found applause audio via DOM query at index:', i)
          break
        }
      }
    }
    
    if (sfx) {
      sfx.volume = 0.5 // Set to 50% volume as requested
      sfx.currentTime = 0
      console.log('🎉 SFX: Attempting to play victory applause at volume:', sfx.volume)
      
      sfx.play().then(() => {
        console.log('🎉 SFX: Victory applause started playing successfully')
      }).catch(error => {
        console.error('🎉 SFX: Victory applause sound failed to play:', error)
      })
    } else {
      console.error('🎉 SFX: No victory applause audio element found via ref OR DOM query!')
      console.log('🎉 SFX: victoryApplauseSfxRef.current:', victoryApplauseSfxRef.current)
    }
  }


  if (!currentQuestion) {
    return (
      <div className="game-loading">
        <div className="loading-content">
          <img 
            src="/assets/Opponent found.png" 
            alt="Opponent Found" 
            className="loading-image"
          />
          <h2 className="loading-title">Opponent Found!</h2>
          <p className="loading-subtitle">Preparing your musical challenge...</p>
        </div>
      </div>
    )
  }

  if (gameComplete) {
    return (
      <div className={`game-container ${version === 'Version B' ? 'version-b' : version === 'Version C' ? 'version-c' : ''}`}>
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
              {/* Version B Final Results */}
              {version === 'Version B' && (
                <div className="version-b-results">
                  {currentStars >= 2 && (
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
                  <h3 className="victory-message">Quiz Complete!</h3>
                  <div className="final-star-rating">
                    <div className="star-display">
                      {[1, 2, 3].map((starNum) => (
                        <span
                          key={starNum}
                          className={`star final-star ${currentStars >= starNum ? 'filled' : 'empty'}`}
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                    <p className="star-message">
                      {currentStars === 0 && "Keep practicing! Try again to earn your first star!"}
                      {currentStars === 1 && "Good job! You earned your first star!"}
                      {currentStars === 2 && "Great work! Two stars - you're getting good at this!"}
                      {currentStars === 3 && "Amazing! Perfect 3 stars - you're a music quiz master!"}
                    </p>
                    <p className="final-score-text">Final Score: {score}</p>
                  </div>
                </div>
              )}
              
              {/* Version C Final Results */}
              {version === 'Version C' && (
                <div className="version-c-results">
                  <div className="confetti-container">
                    <div className="confetti-piece confetti-1">🎉</div>
                    <div className="confetti-piece confetti-2">🎊</div>
                    <div className="confetti-piece confetti-3">⚡</div>
                    <div className="confetti-piece confetti-4">🎉</div>
                    <div className="confetti-piece confetti-5">🎊</div>
                    <div className="confetti-piece confetti-6">⚡</div>
                    <div className="confetti-piece confetti-7">🎉</div>
                    <div className="confetti-piece confetti-8">🎊</div>
                    <div className="confetti-piece confetti-9">⚡</div>
                    <div className="confetti-piece confetti-10">🎉</div>
                  </div>
                  <h3 className="victory-message">⚡ Time's Up! ⚡</h3>
                  <div className="version-c-final-stats">
                    <div className="final-score-large">
                      <div className="score-label">Final Score</div>
                      <div className="score-number">{score}</div>
                    </div>
                    <div className="rapid-fire-stats">
                      <div className="stat-item">
                        <div className="stat-value">{allAttemptedSongs.length}</div>
                        <div className="stat-label">Songs Attempted</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-value">{allAttemptedSongs.filter(song => song.pointsEarned > 0).length}</div>
                        <div className="stat-label">Songs Scored</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-value">{allAttemptedSongs.length > 0 ? Math.round((score / (allAttemptedSongs.length * 20)) * 100) : 0}%</div>
                        <div className="stat-label">Accuracy</div>
                      </div>
                    </div>
                  </div>
                  <div className="comprehensive-summary">
                    <h4>Complete Song Summary</h4>
                    <div className="song-attempts-grid">
                      {allAttemptedSongs.map((attempt, index) => (
                        <div key={index} className="attempt-card">
                          <div className="attempt-album-art">
                            <img 
                              src={attempt.song.albumArt} 
                              alt={`${attempt.song.title} album art`}
                              className="attempt-album-image"
                            />
                          </div>
                          <div className="attempt-info">
                            <div className="attempt-title">{attempt.song.title}</div>
                            <div className="attempt-artist">{attempt.song.artist}</div>
                            <div className={`attempt-score ${attempt.pointsEarned > 0 ? 'scored' : 'missed'}`}>
                              {attempt.pointsEarned} pts
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Version A and other versions results */}
              {version !== 'Version B' && version !== 'Version C' && (
                <>
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
                </>
              )}
              
              {/* Hide Your Score vs Opponent Score for Version C (single-player) */}
              {version !== 'Version C' && (
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
              )}
              

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
            
            {/* Version B Star Progress, Version C Score Tracker, or Opponent Avatar */}
            {version === 'Version B' ? (
              <div className="avatar-container star-container">
                <div className="version-b-star-progress">
                  <div className="star-progress-header">Progress</div>
                  <div className="star-display-large">
                    {[1, 2, 3].map((starNum) => (
                      <div key={starNum} className="star-item">
                        <span className={`star-large ${currentStars >= starNum ? 'filled' : 'empty'}`}>
                          ⭐
                        </span>
                        <div className="star-label">
                          {starNum === 1 ? '20+ pts' : starNum === 2 ? '51+ pts' : '110+ pts'}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="current-score-display">
                    <div className="score-label">Score</div>
                    <div className="score-value">{score}</div>
                  </div>
                </div>
              </div>
            ) : version === 'Version C' ? (
              null
            ) : (
              /* Show opponent avatar for Version A */
              <div className="avatar-container opponent-container">
                {/* Total Score Display Above Opponent Avatar */}
                {showFeedback && (
                  <div className="total-score-display opponent-total-score">
                    <div className="total-score-value">{opponentScore}</div>
                  </div>
                )}
                
                {/* Version A Opponent Buzz Indicator */}
                {version === 'Version A' && opponentBuzzedIn && !showFeedback && (
                  <div className="opponent-buzz-indicator">
                    <div className="buzz-alert">
                      <span className="buzz-icon">⚡</span>
                    </div>
                    <div className="buzz-text">ANSWERED!</div>
                  </div>
                )}
                
                <img 
                  src="/assets/OpponentAvatar.png" 
                  alt="Opponent Avatar" 
                  className={`avatar opponent-avatar ${showFeedback && opponentCorrect ? 'celebrating' : ''}`}
                />
                {showFeedback && opponentCorrect && !gameComplete && (
                  <>
                    <div className="sparkles">
                      <div className="sparkle sparkle-1">✨</div>
                      <div className="sparkle sparkle-2">⭐</div>
                      <div className="sparkle sparkle-3">✨</div>
                      <div className="sparkle sparkle-4">⭐</div>
                      <div className="sparkle sparkle-5">✨</div>
                    </div>
                    <div className="score-popup opponent-score-popup">
                      Correct! +{opponentPointsEarned} Points
                    </div>
                  </>
                )}
                
                {/* Version A Opponent Streak Text */}
                {version === 'Version A' && opponentIsOnStreak && (
                  <div className="avatar-streak-text opponent-streak-text">
                    🔥 {opponentStreak} Streak!
                  </div>
                )}
              </div>
            )}
          </div>
          

          {/* Sound Effect Audio Elements - Available on Game Complete Screen */}
          <audio 
            ref={correctAnswerSfxRef}
            preload="auto"
          >
            <source src="/assets/sfx_notify_correctAnswer_01.ogg" type="audio/ogg" />
            Your browser does not support the audio element.
          </audio>
          
          <audio 
            ref={victoryApplauseSfxRef}
            preload="auto"
          >
            <source src="/assets/sfx_sq_applause_correct_answer.ogg" type="audio/ogg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      </div>
    )
  }

  return (
    <div className={`game-container ${version === 'Version B' ? 'version-b' : version === 'Version C' ? 'version-c' : ''}`}>
      <div className="game-content">
        <header className="game-header">
          <img 
            src="/assets/Song Quiz Horizontal logo.png" 
            alt="Song Quiz Logo" 
            className="game-logo"
          />
          <div className="quiz-info">
            {(() => {
              console.log('🕐 TIMER RENDERING CHECK:', { version, isVersionC: version === 'Version C', timeRemaining });
              return null;
            })()}
            {version === 'Version C' ? (
              <div className="version-c-timer">
                <div className="timer-display">
                  <div className="timer-label">Time Remaining</div>
                  <div className={`timer-value ${timeRemaining <= 10 ? 'timer-urgent' : ''}`}>
                    {timeRemaining}s
                  </div>
                </div>
                <div className="attempts-counter">
                  Songs Attempted: {allAttemptedSongs.length}
                </div>
              </div>
            ) : (
              <div className="quiz-progress">
                <span>Question {questionNumber} of {totalQuestions}</span>
              </div>
            )}
            {/* Version B Star Progress moved to right side */}
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
                
                {/* Animated Sound Bars - hide for Version C */}
                {version !== 'Version C' && (
                  <div className={`sound-bars-container ${isPlaying ? 'playing' : ''}`}>
                    <div className="sound-bars">
                      <div className="sound-bar bar-1"></div>
                      <div className="sound-bar bar-2"></div>
                      <div className="sound-bar bar-3"></div>
                      <div className="sound-bar bar-4"></div>
                      <div className="sound-bar bar-5"></div>
                      <div className="sound-bar bar-6"></div>
                      <div className="sound-bar bar-7"></div>
                    </div>
                  </div>
                )}

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

            {/* Version A Manual Scoring */}
            {version === 'Version A' && !selectedAnswer && !showFeedback && (
              <div className="manual-scoring">
                <div className="score-buttons">
                  <button
                    className="score-button score-0"
                    onClick={() => handleManualScore(0)}
                  >
                    0 Points
                  </button>
                  <button
                    className="score-button score-10"
                    onClick={() => handleManualScore(10)}
                  >
                    10 Points
                  </button>
                  <button
                    className="score-button score-20"
                    onClick={() => handleManualScore(20)}
                  >
                    20 Points
                  </button>
                </div>
                <div className="speed-bonus-toggle">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={speedBonusToggle}
                      onChange={(e) => setSpeedBonusToggle(e.target.checked)}
                      className="toggle-checkbox"
                    />
                    <span className="toggle-text">Speed Bonus (+10 points)</span>
                  </label>
                </div>
              </div>
            )}
            
            {/* Version B Manual Scoring */}
            {version === 'Version B' && !selectedAnswer && !showFeedback && (
              <div className="manual-scoring">
                <div className="score-buttons">
                  <button
                    className="score-button score-0"
                    onClick={() => handleVersionBScore(0)}
                  >
                    0 Points
                  </button>
                  <button
                    className="score-button score-10"
                    onClick={() => handleVersionBScore(10)}
                  >
                    10 Points
                  </button>
                  <button
                    className="score-button score-20"
                    onClick={() => handleVersionBScore(20)}
                  >
                    20 Points
                  </button>
                  {/* Question 7 gets a 30-point option */}
                  {questionNumber === totalQuestions && (
                    <button
                      className="score-button score-30"
                      onClick={() => handleVersionBScore(30)}
                    >
                      30 Points
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Version C Rapid-Fire Scoring */}
            {(() => {
              console.log('🎯 VERSION C SCORING BUTTONS CHECK:', { version, isVersionC: version === 'Version C', selectedAnswer, showFeedback });
              return null;
            })()}
            {version === 'Version C' && !selectedAnswer && !showFeedback && (
              <div className="manual-scoring version-c-scoring">
                <div className="rapid-fire-header">
                  <div className="rapid-fire-title">⚡ Rapid Fire Mode</div>
                  <div className="rapid-fire-instruction">Score and move to next song instantly!</div>
                </div>
                <div className="score-buttons">
                  <button
                    className="score-button score-0"
                    onClick={() => handleVersionCScore(0)}
                  >
                    0 Points
                  </button>
                  <button
                    className="score-button score-10"
                    onClick={() => handleVersionCScore(10)}
                  >
                    10 Points
                  </button>
                  <button
                    className="score-button score-20"
                    onClick={() => handleVersionCScore(20)}
                  >
                    20 Points
                  </button>
                </div>
              </div>
            )}
            
            {/* Multiple Choice Options for other versions */}
            {version !== 'Version A' && version !== 'Version B' && version !== 'Version C' && !selectedAnswer && !showFeedback && (
              <div className="answer-options">
                <h3>What song is this?</h3>
                <div className="options-grid">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      className="option-button"
                      onClick={() => handleAnswerSelect(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Results/Feedback Screen - album art with simplified score breakdown */}
            {showFeedback && (
              <div className="feedback-container">
                <div className="album-art-display">
                  <img 
                    src={currentQuestion.song.albumArt} 
                    alt={`${currentQuestion.song.title} album art`}
                    className="album-art"
                  />
                </div>

                <div className="score-breakdown">
                  {version === 'Version A' && (
                    <div className="version-a-breakdown">
                      <div className="breakdown-details artist-title-section">
                        {/* For 10 points with no specific correctness, don't show indicators */}
                        {pointsEarned === 10 && !artistCorrect && !songCorrect ? (
                          <>
                            <p>Artist: {currentQuestion.song.artist}</p>
                            <p>Song: {currentQuestion.song.title}</p>
                          </>
                        ) : (
                          <>
                            <p>{artistCorrect ? '✅' : '❌'} Artist: {currentQuestion.song.artist} {artistCorrect ? '(+10 points)' : ''}</p>
                            <p>{songCorrect ? '✅' : '❌'} Song: {currentQuestion.song.title} {songCorrect ? '(+10 points)' : ''}</p>
                          </>
                        )}
                      </div>
                      {(playerBuzzedFirst || (isOnStreak && streak >= 3)) && (
                        <div className="breakdown-details bonus-section">
                          {playerBuzzedFirst && <p>⚡ Speed Bonus (+10 points)</p>}
                          {isOnStreak && streak >= 3 && <p>🔥 Streak Bonus (+10 points)</p>}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {version === 'Version B' && (
                    <div className="version-b-breakdown">
                      <div className="breakdown-details artist-title-section">
                        {/* For 10 points with no specific correctness, don't show indicators */}
                        {pointsEarned === 10 && !artistCorrect && !songCorrect ? (
                          <>
                            <p>Artist: {currentQuestion.song.artist}</p>
                            <p>Song: {currentQuestion.song.title}</p>
                          </>
                        ) : (
                          <>
                            <p>{artistCorrect ? '✅' : '❌'} Artist: {currentQuestion.song.artist}</p>
                            <p>{songCorrect ? '✅' : '❌'} Song: {currentQuestion.song.title}</p>
                          </>
                        )}
                        {pointsEarned > 0 && <p>Points Earned: {pointsEarned}</p>}
                      </div>
                      <div className="star-progress-result">
                        <div className="star-display">
                          Current Progress: 
                          {[1, 2, 3].map((starNum) => (
                            <span
                              key={starNum}
                              className={`star ${currentStars >= starNum ? 'filled' : 'empty'}`}
                            >
                              ⭐
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {version !== 'Version A' && version !== 'Version B' && (
                    <>
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
                    </>
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
            {/* Total Score Display Above Player Avatar */}
            {showFeedback && (
              <div className="total-score-display player-total-score">
                <div className="total-score-value">{score}</div>
              </div>
            )}
            
            
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
                  {version === 'Version A' ? `+${pointsEarned} Points` :
                   pointsEarned === 20 ? 'Perfect! +20 Points' :
                   pointsEarned === 10 ? (artistCorrect ? 'Artist Correct! +10 Points' : 'Song Correct! +10 Points') :
                   'Correct! +' + pointsEarned + ' Points'}
                </div>
              </>
            )}
            
            {/* Version A Player Streak Text */}
            {version === 'Version A' && isOnStreak && (
              <div className="avatar-streak-text player-streak-text">
                🔥 {streak} Streak!
              </div>
            )}
          </div>
          
          {/* Version B Star Progress, Version C Score Tracker, or Opponent Avatar */}
          {version === 'Version B' ? (
            <div className="avatar-container star-container">
              <div className="version-b-star-progress">
                <div className="star-progress-header">Progress</div>
                <div className="star-display-large">
                  {[1, 2, 3].map((starNum) => (
                    <div key={starNum} className="star-item">
                      <span className={`star-large ${currentStars >= starNum ? 'filled' : 'empty'}`}>
                        ⭐
                      </span>
                      <div className="star-label">
                        {starNum === 1 ? '20+ pts' : starNum === 2 ? '51+ pts' : '110+ pts'}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="current-score-display">
                  <div className="score-label">Score</div>
                  <div className="score-value">{score}</div>
                </div>
              </div>
            </div>
          ) : version === 'Version C' ? (
            <div className="avatar-container score-tracker-container">
              <div className="version-c-score-tracker">
                <div className="score-tracker-header">Live Score</div>
                <div className="live-score-display">
                  <div className="live-score-value">{score}</div>
                  <div className="live-score-label">Points</div>
                </div>
                <div className="score-stats">
                  <div className="stat-item">
                    <div className="stat-value">{allAttemptedSongs.filter(song => song.pointsEarned > 0).length}</div>
                    <div className="stat-label">Scored</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{allAttemptedSongs.length}</div>
                    <div className="stat-label">Questions</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Show opponent avatar for Version A */
            <div className="avatar-container opponent-container">
              {/* Total Score Display Above Opponent Avatar */}
              {showFeedback && (
                <div className="total-score-display opponent-total-score">
                  <div className="total-score-value">{opponentScore}</div>
                </div>
              )}
              
              <img 
                src="/assets/OpponentAvatar.png" 
                alt="Opponent Avatar" 
                className={`avatar opponent-avatar ${showFeedback && opponentCorrect ? 'celebrating' : ''}`}
              />
              
              {/* Opponent Score Popup - Missing from this container! */}
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
                    Correct! +{opponentPointsEarned} Points
                  </div>
                </>
              )}
              
              {/* Opponent Buzz In Indicator */}
              {opponentBuzzedIn && !showFeedback && (
                <div className="opponent-buzz-indicator">
                  <div className="buzz-alert">
                    <span className="buzz-icon">⚡</span>
                  </div>
                  <div className="buzz-text">ANSWERED!</div>
                </div>
              )}
              
              {/* Version A Opponent Streak Text */}
              {version === 'Version A' && opponentIsOnStreak && (
                <div className="avatar-streak-text opponent-streak-text">
                  🔥 {opponentStreak} Streak!
                </div>
              )}
            </div>
          )}
          
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

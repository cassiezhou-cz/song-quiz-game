import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getAvailableSongs, addPlayedSong } from '../utils/songTracker'
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
  const versionCScoreSfxRef = useRef<HTMLAudioElement>(null) // Version C scoring sound
  
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
  const [isPartialCredit, setIsPartialCredit] = useState(false) // Track 10-point partial credit scenarios
  
  // Track base correctness for each question (for accurate percentage calculation without bonuses)
  const [questionsCorrectness, setQuestionsCorrectness] = useState<Array<{artistCorrect: boolean, songCorrect: boolean}>>([])
  const [opponentQuestionsCorrectness, setOpponentQuestionsCorrectness] = useState<Array<{artistCorrect: boolean, songCorrect: boolean}>>([])
  
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
  
  // Version C specific state
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [allAttemptedSongs, setAllAttemptedSongs] = useState<Array<{
    song: any,
    pointsEarned: number,
    artistCorrect: boolean,
    songCorrect: boolean
  }>>([])
  
  // Version C Booster state removed - now using progressive streak multiplier system
  
  // Version C Auto-booster notification state
  const [autoBoosterNotification, setAutoBoosterNotification] = useState<string | null>(null)
  const [timerPulse, setTimerPulse] = useState(false)
  const [versionCStreak, setVersionCStreak] = useState(0) // Track streak for progressive multipliers
  const [showScoreConfetti, setShowScoreConfetti] = useState(false) // Track confetti animation
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Note: Song tracking is now handled by persistent localStorage via songTracker utility
  
  // Prevent multiple simultaneous question loading
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false)

  // Version B Lifelines state
  const [lifelinesUsed, setLifelinesUsed] = useState({
    doublePoints: false,
    skip: false,
    letterReveal: false
  })

  // Version B 2X Points booster state
  const [isDoublePointsActive, setIsDoublePointsActive] = useState(false)

  // Version B Letter Reveal state
  const [letterRevealInfo, setLetterRevealInfo] = useState<{
    type: 'artist' | 'song' | null
    displayText: string
  } | null>(null)

  // Version B Special Question transition state
  const [showSpecialQuestionTransition, setShowSpecialQuestionTransition] = useState(false)
  
  // Version B Special Question tracking
  const [specialQuestionNumbers, setSpecialQuestionNumbers] = useState<number[]>([])
  const [specialQuestionTypes, setSpecialQuestionTypes] = useState<{[key: number]: 'time-warp' | 'slo-mo' | 'hyperspeed'}>({})
  const [specialQuestionPlaylist, setSpecialQuestionPlaylist] = useState<string | null>(null)
  const [specialQuestionType, setSpecialQuestionType] = useState<'time-warp' | 'slo-mo' | 'hyperspeed' | null>(null)
  
  // Version B Lifeline attention animation
  const [showLifelineAttention, setShowLifelineAttention] = useState(false)
  const lifelineAttentionTimerRef = useRef<NodeJS.Timeout | null>(null)
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
      title: 'Blurred Lines', 
      artist: 'Robin Thicke', 
      file: '/songs/2010s/BlurredLinesRobinThicke.mp3', 
      albumArt: '/assets/album-art/2010s/BlurredLinesRobinThicke.jpeg',
      alternatives: ['Get Lucky - Daft Punk feat. Pharrell Williams', 'Can\'t Hold Us - Macklemore & Ryan Lewis', 'Treasure - Bruno Mars']
    },
    { 
      id: '4', 
      title: 'Closer', 
      artist: 'The Chainsmokers', 
      file: '/songs/2010s/CloserChainsmokers.mp3', 
      albumArt: '/assets/album-art/2010s/CloserChainsmokers.jpeg',
      alternatives: ['It Ain\'t Me - Kygo & Selena Gomez', 'Faded - Zedd feat. Alessia Cara', 'Paris - Lauv'],
      artistAlternatives: ['Chainsmokers', 'Chain Smokers', 'Chainsmockers']
    },
    { 
      id: '5', 
      title: 'Everybody Talks', 
      artist: 'Neon Trees', 
      file: '/songs/2010s/EverybodyTalksNeonTrees.mp3', 
      albumArt: '/assets/album-art/2010s/EverybodyTalksNeonTrees.jpeg',
      alternatives: ['Tongue Tied - Grouplove', 'Some Nights - Fun.', 'Pumped Up Kicks - Foster the People']
    },
    { 
      id: '6', 
      title: 'Goosebumps', 
      artist: 'Travis Scott', 
      file: '/songs/2010s/GoosebumpsTravisScott.mp3', 
      albumArt: '/assets/album-art/2010s/GoosebumpsTravisScott.jpeg',
      alternatives: ['Lucid Dreams - Juice WRLD', 'Life Goes On - Lil Baby feat. Gunna & Lil Uzi Vert', 'Psycho - Post Malone feat. Ty Dolla $ign']
    },
    { 
      id: '7', 
      title: 'Havana', 
      artist: 'Camila Cabello', 
      file: '/songs/2010s/HavanaCamilaCabello.mp3', 
      albumArt: '/assets/album-art/2010s/HavanaCamilaCabello.jpeg',
      alternatives: ['Senorita - Shawn Mendes & Camila Cabello', 'New Rules - Dua Lipa', 'Despacito - Luis Fonsi feat. Daddy Yankee']
    },
    { 
      id: '8', 
      title: 'HUMBLE', 
      artist: 'Kendrick Lamar', 
      file: '/songs/2010s/HUMBLEKendrickLamar.mp3', 
      albumArt: '/assets/album-art/2010s/HUMBLEKendrickLamar.jpeg',
      alternatives: ['Mask Off - Future', 'Bad and Boujee - Migos feat. Lil Uzi Vert', 'Alright - J. Cole'],
      artistAlternatives: ['Kendrick Lamarr', 'Kendrick', 'Lamar']
    },
    { 
      id: '9', 
      title: 'I Gotta Feeling', 
      artist: 'The Black Eyed Peas', 
      file: '/songs/2010s/IGottaFeelingTheBlackEyedPea.mp3', 
      albumArt: '/assets/album-art/2010s/IGottaFeelingTheBlackEyedPea.jpeg',
      alternatives: ['Boom Boom Pow - The Black Eyed Peas', 'Meet Me Halfway - The Black Eyed Peas', 'Imma Be - The Black Eyed Peas']
    },
    { 
      id: '10', 
      title: 'Just Dance', 
      artist: 'Lady Gaga', 
      file: '/songs/2010s/JustDanceLadyGaga.mp3', 
      albumArt: '/assets/album-art/2010s/JustDanceLadyGaga.jpeg',
      alternatives: ['Poker Face - Lady Gaga', 'Bad Romance - Lady Gaga', 'Paparazzi - Lady Gaga']
    },
    { 
      id: '11', 
      title: 'Lost', 
      artist: 'Frank Ocean', 
      file: '/songs/2010s/LostFrankOcean.mp3', 
      albumArt: '/assets/album-art/2010s/LostFrankOcean.jpeg',
      alternatives: ['Thinkin Bout You - Frank Ocean', 'Pyramids - Frank Ocean', 'Sweet Life - Frank Ocean']
    },
    { 
      id: '12', 
      title: 'Love The Way You Lie', 
      artist: 'Eminem', 
      file: '/songs/2010s/LoveTheWayYouLieEminem.mp3', 
      albumArt: '/assets/album-art/2010s/LoveTheWayYouLieEminem.jpeg',
      alternatives: ['Not Afraid - Eminem', 'Recovery - Eminem', 'The Monster - Eminem feat. Rihanna']
    },
    { 
      id: '13', 
      title: 'Love Yourself', 
      artist: 'Justin Bieber', 
      file: '/songs/2010s/LoveYourselfJustinBieber.mp3', 
      albumArt: '/assets/album-art/2010s/LoveYourselfJustinBieber.jpeg',
      alternatives: ['Sorry - Justin Bieber', 'What Do You Mean? - Justin Bieber', 'Cold Water - Major Lazer feat. Justin Bieber']
    },
    { 
      id: '14', 
      title: 'Low', 
      artist: 'Flo Rida', 
      file: '/songs/2010s/LowFloRida.mp3', 
      albumArt: '/assets/album-art/2010s/LowFloRida.jpeg',
      alternatives: ['Buy U a Drank - T-Pain feat. Yung Joc', 'Temperature - Sean Paul', 'Tipsy - J-Kwon'],
      artistAlternatives: ['Flow Rider', 'Flow Rida', 'Flo Rider', 'Florida']
    },
    { 
      id: '15', 
      title: 'One Dance', 
      artist: 'Drake', 
      file: '/songs/2010s/OneDanceDrake.mp3', 
      albumArt: '/assets/album-art/2010s/OneDanceDrake.jpeg',
      alternatives: ['Joanna - Afro B', 'On the Low - Burna Boy', 'Toast - Koffee']
    },
    { 
      id: '16', 
      title: 'One Last Time', 
      artist: 'Ariana Grande', 
      file: '/songs/2010s/OneLastTimeArianaGrande.mp3', 
      albumArt: '/assets/album-art/2010s/OneLastTimeArianaGrande.jpeg',
      alternatives: ['Problem - Ariana Grande feat. Iggy Azalea', 'Bang Bang - Jessie J, Ariana Grande & Nicki Minaj', 'Break Free - Ariana Grande feat. Zedd']
    },
    { 
      id: '17', 
      title: 'Only Girl (In The World)', 
      artist: 'Rihanna', 
      file: '/songs/2010s/OnlyGirl(InTheWorld)Rihanna.mp3', 
      albumArt: '/assets/album-art/2010s/OnlyGirl(InTheWorld)Rihanna.jpeg',
      alternatives: ['What\'s My Name? - Rihanna feat. Drake', 'S&M - Rihanna', 'We Found Love - Rihanna feat. Calvin Harris']
    },
    { 
      id: '18', 
      title: 'Pillow Talk', 
      artist: 'Zayn', 
      file: '/songs/2010s/PILLOWTALKZayn.mp3', 
      albumArt: '/assets/album-art/2010s/PILLOWTALKZayn.jpeg',
      alternatives: ['Dusk Till Dawn - Zayn feat. Sia', 'I Don\'t Wanna Live Forever - Zayn & Taylor Swift', 'Like I Would - Zayn']
    },
    { 
      id: '19', 
      title: 'Put Your Records On', 
      artist: 'Corrine Bailey Rae', 
      file: '/songs/2010s/PutYourRecordsOnCorrineBaileyRae.mp3', 
      albumArt: '/assets/album-art/2010s/PutYourRecordsOnCorrineBaileyRae.jpeg',
      alternatives: ['Come Away With Me - Norah Jones', 'Black to Black - Amy Winehouse', 'Breathe Me - Sia']
    },
    { 
      id: '20', 
      title: 'Shut Up and Dance', 
      artist: 'Walk the Moon', 
      file: '/songs/2010s/ShupUpAndDance.mp3', 
      albumArt: '/assets/album-art/2010s/ShutUpAndDance.jpeg',
      alternatives: ['Fireflies - Owl City', 'Safe and Sound - Capital Cities', 'Cool Kids - Echosmith']
    },
    { 
      id: '21', 
      title: 'Smack That', 
      artist: 'Akon', 
      file: '/songs/2010s/SmackThatAkon.mp3', 
      albumArt: '/assets/album-art/2010s/SmackThatAkon.jpeg',
      alternatives: ['I Wanna Love You - Akon feat. Snoop Dogg', 'Don\'t Matter - Akon', 'Lonely - Akon']
    },
    { 
      id: '22', 
      title: 'Sunflower', 
      artist: 'Post Malone', 
      file: '/songs/2010s/SunflowerPostMalone.mp3', 
      albumArt: '/assets/album-art/2010s/SunflowerPostMalone.jpeg',
      alternatives: ['Circles - Post Malone', 'Better Now - Post Malone', 'Rockstar - Post Malone feat. 21 Savage']
    },
    { 
      id: '23', 
      title: 'Super Bass', 
      artist: 'Nicki Minaj', 
      file: '/songs/2010s/SuperBassNickiMinaj.mp3', 
      albumArt: '/assets/album-art/2010s/SuperBassNickiMinaj.jpeg',
      alternatives: ['Starships - Nicki Minaj', 'Anaconda - Nicki Minaj', 'Your Love - Nicki Minaj']
    },
    { 
      id: '24', 
      title: 'Sweater Weather', 
      artist: 'The Neighbourhood', 
      file: '/songs/2010s/SweaterWeatherTheNeighborhood.mp3', 
      albumArt: '/assets/album-art/2010s/SweaterWeatherTheNeighborhood.jpeg',
      alternatives: ['Sex - The 1975', 'Riptide - Vance Joy', 'Youth - Daughter'],
      artistAlternatives: ['Neighbourhood', 'Neighborhood', 'The Neighborhood']
    },
    { 
      id: '25', 
      title: 'This Love', 
      artist: 'Maroon 5', 
      file: '/songs/2010s/ThisLoveMaroon5.mp3', 
      albumArt: '/assets/album-art/2010s/ThisLoveMaroon5.jpeg',
      alternatives: ['She Will Be Loved - Maroon 5', 'Sunday Morning - Maroon 5', 'Harder to Breathe - Maroon 5']
    },
    { 
      id: '26', 
      title: 'Uptown Funk', 
      artist: 'Mark Ronson', 
      file: '/songs/2010s/UptownFunkMarkRonson.mp3', 
      albumArt: '/assets/album-art/2010s/UptownFunkMarkRonson.jpeg',
      alternatives: ['24K Magic - Bruno Mars', 'Treasure - Bruno Mars', 'Count on Me - Bruno Mars']
    },
    { 
      id: '27', 
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
      title: '1,2 Step', 
      artist: 'Ciara', 
      file: '/songs/2000s/1,2StepCiara.mp3', 
      albumArt: '/assets/album-art/2000s/1,2StepCiara.jpeg',
      alternatives: ['Goodies - Ciara feat. Petey Pablo', 'Oh - Ciara feat. Ludacris', 'Get Up - Ciara feat. Chamillionaire']
    },
    { 
      id: '2', 
      title: 'Because of You', 
      artist: 'Ne-Yo', 
      file: '/songs/2000s/BecauseOfYouNe-Yo.mp3', 
      albumArt: '/assets/album-art/2000s/BecauseOfYouNe-Yo.jpeg',
      alternatives: ['So Sick - Ne-Yo', 'Sexy Love - Ne-Yo', 'Miss Independent - Ne-Yo']
    },
    { 
      id: '3', 
      title: 'Complicated', 
      artist: 'Avril Lavigne', 
      file: '/songs/2000s/ComplicatedAvrilLavigne.mp3', 
      albumArt: '/assets/album-art/2000s/ComplicatedAvrilLavigne.jpeg',
      alternatives: ['Sk8er Boi - Avril Lavigne', 'My Happy Ending - Avril Lavigne', 'I\'m with You - Avril Lavigne']
    },
    { 
      id: '4', 
      title: 'Dog Days Are Over', 
      artist: 'Florence + The Machine', 
      file: '/songs/2000s/DogDaysAreOverFlorence+TheMachine.mp3', 
      albumArt: '/assets/album-art/2000s/DogDaysAreOverFlorence+TheMachine.jpeg',
      alternatives: ['You\'ve Got the Love - Florence + The Machine', 'Shake It Out - Florence + The Machine', 'Rabbit Heart - Florence + The Machine']
    },
    { 
      id: '5', 
      title: 'Drops of Jupiter', 
      artist: 'Train', 
      file: '/songs/2000s/DropsOfJupiterTrain.mp3', 
      albumArt: '/assets/album-art/2000s/DropsOfJupiterTrain.jpeg',
      alternatives: ['Hey Soul Sister - Train', 'Drive By - Train', 'Meet Virginia - Train']
    },
    { 
      id: '6', 
      title: 'Empire State of Mind', 
      artist: 'Jay Z (feat. Alicia Keys)', 
      file: '/songs/2000s/EmpireStateOfMindJayZ.mp3', 
      albumArt: '/assets/album-art/2000s/EmpireStateOfMindJayZ.jpeg',
      alternatives: ['Run This Town - Jay-Z, Rihanna & Kanye West', '99 Problems - Jay-Z', 'Izzo (H.O.V.A.) - Jay-Z']
    },
    { 
      id: '7', 
      title: 'Fireflies', 
      artist: 'Owl City', 
      file: '/songs/2000s/FirefliesOwlCity.mp3', 
      albumArt: '/assets/album-art/2000s/FirefliesOwlCity.jpeg',
      alternatives: ['Vanilla Twilight - Owl City', 'Hello Seattle - Owl City', 'The Saltwater Room - Owl City']
    },
    { 
      id: '8', 
      title: 'Gimme More', 
      artist: 'Britney Spears', 
      file: '/songs/2000s/GimmeMoreBritneySpears.mp3', 
      albumArt: '/assets/album-art/2000s/GimmeMoreBritneySpears.jpeg',
      alternatives: ['Toxic - Britney Spears', 'Circus - Britney Spears', 'Womanizer - Britney Spears']
    },
    { 
      id: '9', 
      title: 'Hey Soul Sister', 
      artist: 'Train', 
      file: '/songs/2000s/HeySoulSisterTrain.mp3', 
      albumArt: '/assets/album-art/2000s/HeySoulSisterTrain.jpeg',
      alternatives: ['Drops of Jupiter - Train', 'Drive By - Train', 'Meet Virginia - Train']
    },
    { 
      id: '10', 
      title: 'I Gotta Feeling', 
      artist: 'The Black Eyed Peas', 
      file: '/songs/2000s/IGottaFeelingTheBlackEyedPeas.mp3', 
      albumArt: '/assets/album-art/2000s/IGottaFeelingTheBlackEyedPeas.jpeg',
      alternatives: ['Boom Boom Pow - The Black Eyed Peas', 'My Humps - The Black Eyed Peas', 'Meet Me Halfway - The Black Eyed Peas']
    },
    { 
      id: '11', 
      title: 'I Want It That Way', 
      artist: 'Backstreet Boys', 
      file: '/songs/2000s/IWantItThatWayBackstreetBoys.mp3', 
      albumArt: '/assets/album-art/2000s/IWantItThatWayBackstreetBoys.jpeg',
      alternatives: ['Everybody - Backstreet Boys', 'As Long As You Love Me - Backstreet Boys', 'Quit Playing Games - Backstreet Boys']
    },
    { 
      id: '12', 
      title: 'Just Dance', 
      artist: 'Lady Gaga', 
      file: '/songs/2000s/JustDanceLadyGaga.mp3', 
      albumArt: '/assets/album-art/2000s/JustDanceLadyGaga.jpeg',
      alternatives: ['Poker Face - Lady Gaga', 'Bad Romance - Lady Gaga', 'Paparazzi - Lady Gaga']
    },
    { 
      id: '13', 
      title: 'Kids', 
      artist: 'MGMT', 
      file: '/songs/2000s/KidsMGMT.mp3', 
      albumArt: '/assets/album-art/2000s/KidsMGMT.jpeg',
      alternatives: ['Electric Feel - MGMT', 'Time to Dance - MGMT', 'Weekend Wars - MGMT']
    },
    { 
      id: '14', 
      title: 'Last Resort', 
      artist: 'Papa Roach', 
      file: '/songs/2000s/LastResortPapaRoach.mp3', 
      albumArt: '/assets/album-art/2000s/LastResortPapaRoach.jpeg',
      alternatives: ['Scars to Your Beautiful - Papa Roach', 'Between Angels and Insects - Papa Roach', 'She Loves Me Not - Papa Roach']
    },
    { 
      id: '15', 
      title: 'Love Song', 
      artist: 'Sara Bareilles', 
      file: '/songs/2000s/LoveSongSaraBareilles.mp3', 
      albumArt: '/assets/album-art/2000s/LoveSongSaraBareilles.jpeg',
      alternatives: ['King of Anything - Sara Bareilles', 'Gravity - Sara Bareilles', 'Brave - Sara Bareilles']
    },
    { 
      id: '16', 
      title: 'Maneater', 
      artist: 'Nelly Furtado', 
      file: '/songs/2000s/ManeaterNellyFurtado.mp3', 
      albumArt: '/assets/album-art/2000s/ManeaterNellyFurtado.jpeg',
      alternatives: ['Promiscuous - Nelly Furtado feat. Timbaland', 'Say It Right - Nelly Furtado', 'I\'m Like a Bird - Nelly Furtado']
    },
    { 
      id: '17', 
      title: 'Sexy Back', 
      artist: 'Justin Timberlake', 
      file: '/songs/2000s/SexyBackJustinTimberlake.mp3', 
      albumArt: '/assets/album-art/2000s/SexyBackJustinTimberlake.jpeg',
      alternatives: ['Can\'t Stop the Feeling! - Justin Timberlake', 'Rock Your Body - Justin Timberlake', 'Cry Me a River - Justin Timberlake']
    },
    { 
      id: '18', 
      title: 'Since U Been Gone', 
      artist: 'Kelly Clarkson', 
      file: '/songs/2000s/SinceUBeenGoneKellyClarkson.mp3', 
      albumArt: '/assets/album-art/2000s/SinceUBeenGoneKellyClarkson.jpeg',
      alternatives: ['Behind These Hazel Eyes - Kelly Clarkson', 'Because of You - Kelly Clarkson', 'Breakaway - Kelly Clarkson']
    },
    { 
      id: '19', 
      title: 'Temperature', 
      artist: 'Sean Paul', 
      file: '/songs/2000s/TemperatureSeanPaul.mp3', 
      albumArt: '/assets/album-art/2000s/TemperatureSeanPaul.jpeg',
      alternatives: ['Get Busy - Sean Paul', 'Gimme the Light - Sean Paul', 'We Be Burnin\' - Sean Paul']
    },
    { 
      id: '20', 
      title: 'The Anthem', 
      artist: 'Good Charlotte', 
      file: '/songs/2000s/TheAnthemGoodCharlotte.mp3', 
      albumArt: '/assets/album-art/2000s/TheAnthemGoodCharlotte.jpeg',
      alternatives: ['Lifestyles of the Rich & Famous - Good Charlotte', 'I Just Wanna Live - Good Charlotte', 'The River - Good Charlotte']
    },
    { 
      id: '21', 
      title: 'The Kill', 
      artist: 'Thirty Seconds To Mars', 
      file: '/songs/2000s/TheKillThirtySecondsToMars.mp3', 
      albumArt: '/assets/album-art/2000s/TheKillThirtySecondsToMars.jpeg',
      alternatives: ['A Beautiful Lie - Thirty Seconds To Mars', 'Attack - Thirty Seconds To Mars', 'From Yesterday - Thirty Seconds To Mars']
    },
    { 
      id: '22', 
      title: 'The Middle', 
      artist: 'Jimmy Eat World', 
      file: '/songs/2000s/TheMiddleJimmyEatWorld.mp3', 
      albumArt: '/assets/album-art/2000s/TheMiddleJimmyEatWorld.jpeg',
      alternatives: ['The Sweetness - Jimmy Eat World', 'Bleed American - Jimmy Eat World', 'Salt Sweat Sugar - Jimmy Eat World']
    },
    { 
      id: '23', 
      title: 'The Sweet Escape', 
      artist: 'Gwen Stefani', 
      file: '/songs/2000s/TheSweetEscapeGwenStefani.mp3', 
      albumArt: '/assets/album-art/2000s/TheSweetEscapeGwenStefani.jpeg',
      alternatives: ['Hollaback Girl - Gwen Stefani', 'What You Waiting For? - Gwen Stefani', 'Rich Girl - Gwen Stefani feat. Eve']
    },
    { 
      id: '24', 
      title: 'Unwritten', 
      artist: 'Natasha Bedingfield', 
      file: '/songs/2000s/UnwrittenNatashaBedingfield.mp3', 
      albumArt: '/assets/album-art/2000s/UnwrittenNatashaBedingfield.jpeg',
      alternatives: ['Pocketful of Sunshine - Natasha Bedingfield', 'These Words - Natasha Bedingfield', 'Single - Natasha Bedingfield']
    },
    { 
      id: '25', 
      title: 'Viva La Vida', 
      artist: 'Coldplay', 
      file: '/songs/2000s/VivaLaVidaColdplay.mp3', 
      albumArt: '/assets/album-art/2000s/VivaLaVidaColdplay.jpeg',
      alternatives: ['Clocks - Coldplay', 'The Scientist - Coldplay', 'Yellow - Coldplay']
    },
    { 
      id: '26', 
      title: 'When You Were Young', 
      artist: 'The Killers', 
      file: '/songs/2000s/WhenYouWereYoungTheKiller.mp3', 
      albumArt: '/assets/album-art/2000s/WhenYouWereYoungTheKiller.jpeg',
      alternatives: ['Mr. Brightside - The Killers', 'Somebody Told Me - The Killers', 'All These Things That I\'ve Done - The Killers']
    },
    { 
      id: '27', 
      title: 'Without Me', 
      artist: 'Eminem', 
      file: '/songs/2000s/WithoutMeEminem.mp3', 
      albumArt: '/assets/album-art/2000s/WithoutMeEminem.jpeg',
      alternatives: ['The Real Slim Shady - Eminem', 'Stan - Eminem feat. Dido', 'Lose Yourself - Eminem']
    },
    { 
      id: '28', 
      title: 'Yeah!', 
      artist: 'Usher', 
      file: '/songs/2000s/Yeah!Usher.mp3', 
      albumArt: '/assets/album-art/2000s/Yeah!Usher.jpeg',
      alternatives: ['U Remind Me - Usher', 'Confessions Part II - Usher', 'Burn - Usher']
    }
  ]

  // 2020s playlist songs with curated alternatives
  const songs2020s: Song[] = [
    { 
      id: '1', 
      title: 'Beautiful Mistakes', 
      artist: 'Maroon 5', 
      file: '/songs/2020s/BeautifulMistakesMaroon5.mp3', 
      albumArt: '/assets/album-art/2020s/BeautifulMistakesMaroon5.jpeg',
      alternatives: ['Memories - Maroon 5', 'Sugar - Maroon 5', 'Don\'t Wanna Know - Maroon 5']
    },
    { 
      id: '2', 
      title: 'cardigan', 
      artist: 'Taylor Swift', 
      file: '/songs/2020s/cardiganTaylorSwift.mp3', 
      albumArt: '/assets/album-art/2020s/CardiganTaylorSwift.jpeg',
      alternatives: ['folklore - Taylor Swift', 'willow - Taylor Swift', 'betty - Taylor Swift']
    },
    { 
      id: '3', 
      title: 'Enemy', 
      artist: 'Imagine Dragons', 
      file: '/songs/2020s/EnemyImagineDragons.mp3', 
      albumArt: '/assets/album-art/2020s/EnemyImagineDragons.jpeg',
      alternatives: ['Believer - Imagine Dragons', 'Thunder - Imagine Dragons', 'Radioactive - Imagine Dragons']
    },
    { 
      id: '4', 
      title: 'Fast Car', 
      artist: 'Luke Combs', 
      file: '/songs/2020s/FastCarLukeCombs.mp3', 
      albumArt: '/assets/album-art/2020s/FastCarLukeCombs.jpeg',
      alternatives: ['When It Rains It Pours - Luke Combs', 'Hurricane - Luke Combs', 'Beautiful Crazy - Luke Combs']
    },
    { 
      id: '5', 
      title: 'Flowers', 
      artist: 'Miley Cyrus', 
      file: '/songs/2020s/FlowersMileyCyrus.mp3', 
      albumArt: '/assets/album-art/2020s/FlowersMileyCyrus.jpeg',
      alternatives: ['Party in the U.S.A. - Miley Cyrus', 'Wrecking Ball - Miley Cyrus', 'The Climb - Miley Cyrus']
    },
    { 
      id: '6', 
      title: 'Good Luck, Babe', 
      artist: 'Chappell Roan', 
      file: '/songs/2020s/GoodLuckBabeChappellRoan.mp3', 
      albumArt: '/assets/album-art/2020s/GoodLuckBabeChappellRoan.jpeg',
      alternatives: ['Pink Pony Club - Chappell Roan', 'Red Wine Supernova - Chappell Roan', 'HOT TO GO! - Chappell Roan'],
      artistAlternatives: ['Chapel Roan', 'Chapelle Roan', 'Chappel Roan']
    },
    { 
      id: '7', 
      title: 'Heat Waves', 
      artist: 'Glass Animals', 
      file: '/songs/2020s/HeatWavesGlassAnimals.mp3', 
      albumArt: '/assets/album-art/2020s/HeatWavesGlassAnimals.jpeg',
      alternatives: ['The Other Side of Paradise - Glass Animals', 'Your Love (Déjà Vu) - Glass Animals', 'Tokyo Drifting - Glass Animals']
    },
    { 
      id: '8', 
      title: 'Here With Me', 
      artist: 'd4vd', 
      file: '/songs/2020s/HereWithMed4vd.mp3', 
      albumArt: '/assets/album-art/2020s/HereWithMed4vd.jpeg',
      alternatives: ['Romantic Homicide - d4vd', 'Laundry Day - d4vd', 'Take Me to the Sun - d4vd'],
      artistAlternatives: ['David', 'D4VD', 'D four V D', 'Dee Four Vee Dee']
    },
    { 
      id: '9', 
      title: 'Houdini', 
      artist: 'Eminem', 
      file: '/songs/2020s/HoudiniEminem.mp3', 
      albumArt: '/assets/album-art/2020s/HoudiniEminem.jpeg',
      alternatives: ['Lose Yourself - Eminem', 'Till I Collapse - Eminem', 'The Real Slim Shady - Eminem']
    },
    { 
      id: '10', 
      title: 'I Don\'t Wanna Wait', 
      artist: 'David Guetta', 
      file: '/songs/2020s/IDontWannaWaitDavidGuetta.mp3', 
      albumArt: '/assets/album-art/2020s/IDontWannaWaitDavidGuetta.jpeg',
      alternatives: ['Titanium - David Guetta feat. Sia', 'When Love Takes Over - David Guetta feat. Kelly Rowland', 'Memories - David Guetta feat. Kid Cudi']
    },
    { 
      id: '11', 
      title: 'Industry Baby', 
      artist: 'Lil Nas X', 
      file: '/songs/2020s/INDUSTRYBABYLilNasX.mp3', 
      albumArt: '/assets/album-art/2020s/INDUSTRYBABYLilNasX.jpeg',
      alternatives: ['Old Town Road - Lil Nas X feat. Billy Ray Cyrus', 'Montero (Call Me By Your Name) - Lil Nas X', 'Panini - Lil Nas X']
    },
    { 
      id: '12', 
      title: 'Lose Somebody', 
      artist: 'Kygo', 
      file: '/songs/2020s/LoseSomebodyKygo.mp3', 
      albumArt: '/assets/album-art/2020s/LoseSomebodyKygo.jpeg',
      alternatives: ['Firestone - Kygo feat. Conrad Sewell', 'Stole the Show - Kygo feat. Parson James', 'It Ain\'t Me - Kygo & Selena Gomez']
    },
    { 
      id: '13', 
      title: 'Made You Look', 
      artist: 'Meghan Trainor', 
      file: '/songs/2020s/MadeYouLookMeghanTrainor.mp3', 
      albumArt: '/assets/album-art/2020s/MadeYouLookMeghanTrainor.jpeg',
      alternatives: ['All About That Bass - Meghan Trainor', 'Lips Are Movin - Meghan Trainor', 'Dear Future Husband - Meghan Trainor']
    },
    { 
      id: '14', 
      title: 'Peaches', 
      artist: 'Justin Bieber', 
      file: '/songs/2020s/PeachesJustinBieber.mp3', 
      albumArt: '/assets/album-art/2020s/PeachesJustinBieber.jpeg',
      alternatives: ['Sorry - Justin Bieber', 'Love Yourself - Justin Bieber', 'What Do You Mean? - Justin Bieber']
    },
    { 
      id: '15', 
      title: 'Smile', 
      artist: 'Katy Perry', 
      file: '/songs/2020s/SmileKatyPerry.mp3', 
      albumArt: '/assets/album-art/2020s/SmileKatyPerry.jpeg',
      alternatives: ['Roar - Katy Perry', 'Firework - Katy Perry', 'California Gurls - Katy Perry feat. Snoop Dogg']
    },
    { 
      id: '16', 
      title: 'Snooze', 
      artist: 'SZA', 
      file: '/songs/2020s/SnoozeSZA.mp3', 
      albumArt: '/assets/album-art/2020s/SnoozeSZA.jpeg',
      alternatives: ['Good Days - SZA', 'I Hate U - SZA', 'Kiss Me More - Doja Cat feat. SZA'],
      artistAlternatives: ['Essa', 'S-Z-A', 'Sza', 'Solana']
    },
    { 
      id: '17', 
      title: 'Stick Season', 
      artist: 'Noah Kahan', 
      file: '/songs/2020s/StickSeasonNoahKahan.mp3', 
      albumArt: '/assets/album-art/2020s/StickSeasonNoahKahan.jpeg',
      alternatives: ['I Am Not Okay - Noah Kahan', 'Hurt Somebody - Noah Kahan', 'False Confidence - Noah Kahan']
    },
    { 
      id: '18', 
      title: 'Taste', 
      artist: 'Sabrina Carpenter', 
      file: '/songs/2020s/TasteSabrinaCarpenter.mp3', 
      albumArt: '/assets/album-art/2020s/TasteSabrinaCarpenter.jpeg',
      alternatives: ['Espresso - Sabrina Carpenter', 'Nonsense - Sabrina Carpenter', 'Feather - Sabrina Carpenter']
    },
    { 
      id: '19', 
      title: 'Tattoo', 
      artist: 'Loreen', 
      file: '/songs/2020s/TattooLoreen.mp3', 
      albumArt: '/assets/album-art/2020s/TattooLoreen.jpeg',
      alternatives: ['Euphoria - Loreen', 'Statements - Loreen', 'Is It Love - Loreen']
    },
    { 
      id: '20', 
      title: 'the boy is mine', 
      artist: 'Ariana Grande', 
      file: '/songs/2020s/theboyismineArianaGrande.mp3', 
      albumArt: '/assets/album-art/2020s/theboysimineariangrande.jpeg',
      alternatives: ['7 rings - Ariana Grande', 'thank u, next - Ariana Grande', 'positions - Ariana Grande']
    },
    { 
      id: '21', 
      title: 'Too Many Nights', 
      artist: 'Metro Boomin', 
      file: '/songs/2020s/TooManyNightsMetroBoomin.mp3', 
      albumArt: '/assets/album-art/2020s/TooManyNightsMetroBoomin.jpeg',
      alternatives: ['Superhero - Future & Metro Boomin', 'Bad Boy - Juice WRLD & Metro Boomin', 'Creepin\' - Metro Boomin, The Weeknd & 21 Savage'],
      artistAlternatives: ['Metro Booming', 'Metro Boomin\'', 'Metro']
    },
    { 
      id: '22', 
      title: 'Traitor', 
      artist: 'Olivia Rodrigo', 
      file: '/songs/2020s/traitorOliviaRodrigo.mp3', 
      albumArt: '/assets/album-art/2020s/traitorOliviaRodrigo.jpeg',
      alternatives: ['drivers license - Olivia Rodrigo', 'good 4 u - Olivia Rodrigo', 'deja vu - Olivia Rodrigo']
    },
    { 
      id: '23', 
      title: 'Unholy', 
      artist: 'Sam Smith', 
      file: '/songs/2020s/UnholySamSmith.mp3', 
      albumArt: '/assets/album-art/2020s/UnholySamSmith.jpeg',
      alternatives: ['Stay With Me - Sam Smith', 'Too Good at Goodbyes - Sam Smith', 'I\'m Not the Only One - Sam Smith']
    },
    { 
      id: '24', 
      title: 'What It Is', 
      artist: 'Doechii', 
      file: '/songs/2020s/WhatItIsDoechii.mp3', 
      albumArt: '/assets/album-art/2020s/WhatItIsDoechii.jpeg',
      alternatives: ['Crazy - Doechii', 'Persuasive - Doechii', 'Bitch I\'m Nice - Doechii']
    },
    { 
      id: '25', 
      title: 'Woman', 
      artist: 'Doja Cat', 
      file: '/songs/2020s/WomanDojaCat.mp3', 
      albumArt: '/assets/album-art/2020s/WomanDojaCat.jpeg',
      alternatives: ['Say So - Doja Cat', 'Kiss Me More - Doja Cat feat. SZA', 'Paint The Town Red - Doja Cat']
    }
  ]

  // 90s playlist songs with curated alternatives  
  const songs90s: Song[] = [
    { 
      id: '1', 
      title: 'Wonderwall', 
      artist: 'Oasis', 
      file: '/songs/90s/WonderwallOasis.mp3', 
      albumArt: '/assets/album-art/90s/WonderwallOasis.jpeg',
      alternatives: ['Champagne Supernova - Oasis', 'Creep - Radiohead', 'Mr. Brightside - The Killers']
    },
    { 
      id: '2', 
      title: 'Come As You Are', 
      artist: 'Nirvana', 
      file: '/songs/90s/ComeAsYouAreNirvana.mp3', 
      albumArt: '/assets/album-art/90s/ComeAsYouAreNirvana.jpeg',
      alternatives: ['Smells Like Teen Spirit - Nirvana', 'Black - Pearl Jam', 'Alive - Pearl Jam']
    },
    { 
      id: '3', 
      title: 'No Scrubs', 
      artist: 'TLC', 
      file: '/songs/90s/NoScrubsTLC.mp3', 
      albumArt: '/assets/album-art/90s/NoScrubsTLC.jpeg',
      alternatives: ['Waterfalls - TLC', 'What\'s Up? - 4 Non Blondes', 'I Will Always Love You - Whitney Houston']
    },
    { 
      id: '4', 
      title: 'California Love', 
      artist: '2Pac', 
      file: '/songs/90s/CaliforniaLove2Pac.mp3', 
      albumArt: '/assets/album-art/90s/CaliforniaLove2Pac.jpeg',
      alternatives: ['Changes - 2Pac', 'Juicy - The Notorious B.I.G.', 'Gangsta\'s Paradise - Coolio'],
      artistAlternatives: ['Tupac', '2-Pac', 'Tupac Shakur', 'Two Pac']
    },
    { 
      id: '5', 
      title: 'Wannabe', 
      artist: 'Spice Girls', 
      file: '/songs/90s/WannabeSpiceGirls.mp3', 
      albumArt: '/assets/album-art/90s/WannabeSpiceGirls.jpeg',
      alternatives: ['Say You\'ll Be There - Spice Girls', 'MMMBop - Hanson', 'I Want It That Way - Backstreet Boys']
    },
    { 
      id: '6', 
      title: '1979', 
      artist: 'The Smashing Pumpkins', 
      file: '/songs/90s/1979TheSmashingPumpkins.mp3', 
      albumArt: '/assets/album-art/90s/1979TheSmashingPumpkins.jpeg',
      alternatives: ['Tonight, Tonight - The Smashing Pumpkins', 'Zero - The Smashing Pumpkins', 'Bullet with Butterfly Wings - The Smashing Pumpkins']
    },
    { 
      id: '7', 
      title: 'Zombie', 
      artist: 'The Cranberries', 
      file: '/songs/90s/ZombieTheCranberries.mp3', 
      albumArt: '/assets/album-art/90s/ZombieTheCranberries.jpeg',
      alternatives: ['Linger - The Cranberries', 'Dreams - The Cranberries', 'Ode to My Family - The Cranberries']
    },
    { 
      id: '8', 
      title: 'Black', 
      artist: 'Pearl Jam', 
      file: '/songs/90s/BlackPearlJam.mp3', 
      albumArt: '/assets/album-art/90s/BlackPearlJam.jpeg',
      alternatives: ['Alive - Pearl Jam', 'Jeremy - Pearl Jam', 'Even Flow - Pearl Jam']
    },
    { 
      id: '9', 
      title: 'Ironic', 
      artist: 'Alanis Morissette', 
      file: '/songs/90s/ironicAlanisMorissette.mp3', 
      albumArt: '/assets/album-art/90s/ironicAlanisMorissette.jpeg',
      alternatives: ['You Oughta Know - Alanis Morissette', 'Hand in My Pocket - Alanis Morissette', 'You Learn - Alanis Morissette']
    },
    { 
      id: '10', 
      title: 'U Can\'t Touch This', 
      artist: 'MC Hammer', 
      file: '/songs/90s/UCan\'tTouchThisMCHammer.mp3', 
      albumArt: '/assets/album-art/90s/UCan\'tTouchThisMCHammer.jpeg',
      alternatives: ['Ice Ice Baby - Vanilla Ice', 'Push It - Salt-N-Pepa', '2 Legit 2 Quit - MC Hammer']
    },
    { 
      id: '11', 
      title: 'Don\'t Speak', 
      artist: 'No Doubt', 
      file: '/songs/90s/Don\'tSpeakNoDoubt.mp3', 
      albumArt: '/assets/album-art/90s/Don\'tSpeakNoDoubt.jpeg',
      alternatives: ['Just a Girl - No Doubt', 'Spiderwebs - No Doubt', 'Sunday Girl - No Doubt']
    },
    { 
      id: '12', 
      title: 'Kiss Me', 
      artist: 'Sixpence None The Richer', 
      file: '/songs/90s/KissMeSixpenceNoneTheRicher.mp3', 
      albumArt: '/assets/album-art/90s/KissMeSixpenceNoneTheRicher.jpeg',
      alternatives: ['There She Goes - The La\'s', 'I\'m Gonna Be (500 Miles) - The Proclaimers', 'Semi-Charmed Life - Third Eye Blind']
    },
    { 
      id: '13', 
      title: 'Torn', 
      artist: 'Natalie Imbruglia', 
      file: '/songs/90s/TornNatalieImbruglia.mp3', 
      albumArt: '/assets/album-art/90s/TornNatalieImbruglia.jpeg',
      alternatives: ['Big Me - Foo Fighters', 'Counting Blue Cars - Dishwalla', 'Name - Goo Goo Dolls']
    },
    { 
      id: '14', 
      title: 'Always', 
      artist: 'Bon Jovi', 
      file: '/songs/90s/AlwaysBonJovi.mp3', 
      albumArt: '/assets/album-art/90s/AlwaysBonJovi.jpeg',
      alternatives: ['Bed of Roses - Bon Jovi', 'Livin\' on a Prayer - Bon Jovi', 'Wanted Dead or Alive - Bon Jovi']
    },
    { 
      id: '15', 
      title: '(Everything I Do) I Do It for You', 
      artist: 'Bryan Adams', 
      file: '/songs/90s/(EverythingIDo)IDoItForYouBryanAdams.mp3', 
      albumArt: '/assets/album-art/90s/(EverythingIDo)IDoItForYouBryanAdams.jpeg',
      alternatives: ['Summer of \'69 - Bryan Adams', 'Heaven - Bryan Adams', 'Run to You - Bryan Adams']
    },
    { 
      id: '16', 
      title: 'End of the Road', 
      artist: 'Boyz II Men', 
      file: '/songs/90s/EndOfTheRoadBoyztoMen.mp3', 
      albumArt: '/assets/album-art/90s/EndOfTheRoadBoyztoMen.jpeg',
      alternatives: ['I\'ll Make Love to You - Boyz II Men', 'Motownphilly - Boyz II Men', 'On Bended Knee - Boyz II Men'],
      artistAlternatives: ['Boys 2 Men', 'Boys II Men', 'Boyz 2 Men']
    },
    { 
      id: '17', 
      title: 'Always Be My Baby', 
      artist: 'Mariah Carey', 
      file: '/songs/90s/AlwaysBeMyBabyMariahCarey.mp3', 
      albumArt: '/assets/album-art/90s/AlwaysBeMyBabyMariahCarey.jpeg',
      alternatives: ['Vision of Love - Mariah Carey', 'Hero - Mariah Carey', 'Fantasy - Mariah Carey']
    },
    { 
      id: '18', 
      title: 'Shoop', 
      artist: 'Salt-N-Pepa', 
      file: '/songs/90s/ShoopSaltNPepa.mp3', 
      albumArt: '/assets/album-art/90s/ShoopSaltNPepa.jpeg',
      alternatives: ['Push It - Salt-N-Pepa', 'Whatta Man - Salt-N-Pepa feat. En Vogue', 'Let\'s Talk About Sex - Salt-N-Pepa']
    },
    { 
      id: '19', 
      title: 'Loser', 
      artist: 'Beck', 
      file: '/songs/90s/LoserBeck.mp3', 
      albumArt: '/assets/album-art/90s/LoserBeck.jpeg',
      alternatives: ['Where It\'s At - Beck', 'Devils Haircut - Beck', 'E-Pro - Beck']
    },
    { 
      id: '20', 
      title: 'Crazy', 
      artist: 'Aerosmith', 
      file: '/songs/90s/CrazyAerosmith.mp3', 
      albumArt: '/assets/album-art/90s/CrazyAerosmith.jpeg',
      alternatives: ['I Don\'t Want to Miss a Thing - Aerosmith', 'Love in an Elevator - Aerosmith', 'Sweet Emotion - Aerosmith']
    },
    { 
      id: '21', 
      title: 'High and Dry', 
      artist: 'Radiohead', 
      file: '/songs/90s/HighAndDryRadiohead.mp3', 
      albumArt: '/assets/album-art/90s/HighAndDryRadiohead.jpeg',
      alternatives: ['Creep - Radiohead', 'Fake Plastic Trees - Radiohead', 'Just - Radiohead']
    },
    { 
      id: '22', 
      title: 'Fly Away', 
      artist: 'Lenny Kravitz', 
      file: '/songs/90s/FlyAwayLennyKravitz.mp3', 
      albumArt: '/assets/album-art/90s/FlyAwayLennyKravitz.jpeg',
      alternatives: ['Are You Gonna Go My Way - Lenny Kravitz', 'It Ain\'t Over \'til It\'s Over - Lenny Kravitz', 'American Woman - Lenny Kravitz']
    },
    { 
      id: '23', 
      title: 'Killing Me Softly with His Song', 
      artist: 'Fugees', 
      file: '/songs/90s/KillingMeSoftlyWithHisSongFugees.mp3', 
      albumArt: '/assets/album-art/90s/KillingMeSoftlyWithHisSongFugees.jpeg',
      alternatives: ['Ready or Not - Fugees', 'Fu-Gee-La - Fugees', 'No Woman, No Cry - Fugees']
    },
    { 
      id: '24', 
      title: 'Under the Bridge', 
      artist: 'Red Hot Chili Peppers', 
      file: '/songs/90s/UnderTheBridgeTheRedHotChiliPeppers.mp3', 
      albumArt: '/assets/album-art/90s/UnderTheBridgeTheRedHotChiliPeppers.jpeg',
      alternatives: ['Give It Away - Red Hot Chili Peppers', 'Soul to Squeeze - Red Hot Chili Peppers', 'Californication - Red Hot Chili Peppers']
    },
    { 
      id: '25', 
      title: 'November Rain', 
      artist: 'Guns N\' Roses', 
      file: '/songs/90s/NovemberRainGunsNRoses.mp3', 
      albumArt: '/assets/album-art/90s/NovemberRainGunsNRoses.jpeg',
      alternatives: ['Sweet Child O\' Mine - Guns N\' Roses', 'Welcome to the Jungle - Guns N\' Roses', 'Paradise City - Guns N\' Roses']
    },
    { 
      id: '26', 
      title: 'Killing in the Name', 
      artist: 'Rage Against the Machine', 
      file: '/songs/90s/KillingInTheNameRageAgainstTheMachine.mp3', 
      albumArt: '/assets/album-art/90s/KillingInTheNameRageAgainstTheMachine.jpeg',
      alternatives: ['Bulls on Parade - Rage Against the Machine', 'Guerrilla Radio - Rage Against the Machine', 'Wake Up - Rage Against the Machine']
    },
    { 
      id: '27', 
      title: 'Enjoy the Silence', 
      artist: 'Depeche Mode', 
      file: '/songs/90s/EnjoyTheSilenceDepecheMode.mp3', 
      albumArt: '/assets/album-art/90s/EnjoyTheSilenceDepecheMode.jpeg',
      alternatives: ['Personal Jesus - Depeche Mode', 'Policy of Truth - Depeche Mode', 'World in My Eyes - Depeche Mode']
    },
    { 
      id: '28', 
      title: 'Walking on Broken Glass', 
      artist: 'Annie Lennox', 
      file: '/songs/90s/WalkingOnBrokenGlassAnnieLennox.mp3', 
      albumArt: '/assets/album-art/90s/WalkingOnBrokenGlassAnnieLennox.jpeg',
      alternatives: ['Why - Annie Lennox', 'Little Bird - Annie Lennox', 'Sweet Dreams - Eurythmics']
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
      case '90s':
        return songs90s
      default:
        return songs2010s // Default to 2010s if playlist not found
    }
  }

  // Song number mapping based on "Number Association of Songs" document
  const getSongNumber = (playlistName: string, title: string, artist: string): number => {
    const songMappings = {
      '90s': {
        '(Everything I Do) I Do It for You-Bryan Adams': 1,
        '1979-The Smashing Pumpkins': 2,
        'Always Be My Baby-Mariah Carey': 3,
        'Always-Bon Jovi': 4,
        'Black-Pearl Jam': 5,
        'California Love-2Pac': 6,
        'Come As You Are-Nirvana': 7,
        'Crazy-Aerosmith': 8,
        "Don't Speak-No Doubt": 9,
        'End of the Road-Boyz II Men': 10,
        'Enjoy the Silence-Depeche Mode': 11,
        'Fly Away-Lenny Kravitz': 12,
        'High and Dry-Radiohead': 13,
        'Ironic-Alanis Morissette': 14,
        'Killing in the Name-Rage Against the Machine': 15,
        'Killing Me Softly with His Song-Fugees': 16,
        'Kiss Me-Sixpence None The Richer': 17,
        'Loser-Beck': 18,
        'No Scrubs-TLC': 19,
        'November Rain-Guns N\' Roses': 20,
        'Shoop-Salt-N-Pepa': 21,
        'Torn-Natalie Imbruglia': 22,
        "U Can't Touch This-MC Hammer": 23,
        'Under the Bridge-Red Hot Chili Peppers': 24,
        'Walking on Broken Glass-Annie Lennox': 25,
        'Wannabe-Spice Girls': 26,
        'Wonderwall-Oasis': 27,
        'Zombie-The Cranberries': 28
      },
      '2000s': {
        '1,2 Step-Ciara': 1,
        'Because of You-Ne-Yo': 2,
        'Complicated-Avril Lavigne': 3,
        'Dog Days Are Over-Florence + The Machine': 4,
        'Drops of Jupiter-Train': 5,
        'Empire State of Mind-Jay Z (feat. Alicia Keys)': 6,
        'Fireflies-Owl City': 7,
        'Gimme More-Britney Spears': 8,
        'Hey Soul Sister-Train': 9,
        'I Gotta Feeling-The Black Eyed Peas': 10,
        'I Want It That Way-Backstreet Boys': 11,
        'Just Dance-Lady Gaga': 12,
        'Kids-MGMT': 13,
        'Last Resort-Papa Roach': 14,
        'Love Song-Sara Bareilles': 15,
        'Maneater-Nelly Furtado': 16,
        'Sexy Back-Justin Timberlake': 17,
        'Since U Been Gone-Kelly Clarkson': 18,
        'Temperature-Sean Paul': 19,
        'The Anthem-Good Charlotte': 20,
        'The Kill-Thirty Seconds To Mars': 21,
        'The Middle-Jimmy Eat World': 22,
        'The Sweet Escape-Gwen Stefani': 23,
        'Unwritten-Natasha Bedingfield': 24,
        'Viva La Vida-Coldplay': 25,
        'When You Were Young-The Killers': 26,
        'Without Me-Eminem': 27,
        'Yeah!-Usher': 28
      },
      '2010s': {
        'All of Me-John Legend': 1,
        'All The Stars-Kendrick Lamar': 2,
        'Blurred Lines-Robin Thicke': 3,
        'Closer-The Chainsmokers': 4,
        'Everybody Talks-Neon Trees': 5,
        'Goosebumps-Travis Scott': 6,
        'Havana-Camila Cabello': 7,
        'HUMBLE-Kendrick Lamar': 8,
        'I Gotta Feeling-The Black Eyed Peas': 9,
        'Just Dance-Lady Gaga': 10,
        'Lost-Frank Ocean': 11,
        'Love The Way You Lie-Eminem': 12,
        'Love Yourself-Justin Bieber': 13,
        'Low-Flo Rida': 14,
        'One Dance-Drake': 15,
        'One Last Time-Ariana Grande': 16,
        'Only Girl (In The World)-Rihanna': 17,
        'Pillow Talk-Zayn': 18,
        'Put Your Records On-Corrine Bailey Rae': 19,
        'Shut Up and Dance-Walk the Moon': 20,
        'Smack That-Akon': 21,
        'Sunflower-Post Malone': 22,
        'Super Bass-Nicki Minaj': 23,
        'Sweater Weather-The Neighbourhood': 24,
        'This Love-Maroon 5': 25,
        'Uptown Funk-Mark Ronson': 26,
        'Wake Me Up-Avicii': 27
      },
      '2020s': {
        'Beautiful Mistakes-Maroon 5': 1,
        'cardigan-Taylor Swift': 2,
        'Enemy-Imagine Dragons': 3,
        'Fast Car-Luke Combs': 4,
        'Flowers-Miley Cyrus': 5,
        'Good Luck, Babe-Chappell Roan': 6,
        'Heat Waves-Glass Animals': 7,
        'Here With Me-d4vd': 8,
        'Houdini-Eminem': 9,
        "I Don't Wanna Wait-David Guetta": 10,
        'Industry Baby-Lil Nas X': 11,
        'Lose Somebody-Kygo': 12,
        'Made You Look-Meghan Trainor': 13,
        'Peaches-Justin Bieber': 14,
        'Smile-Katy Perry': 15,
        'Snooze-SZA': 16,
        'Stick Season-Noah Kahan': 17,
        'Taste-Sabrina Carpenter': 18,
        'Tattoo-Loreen': 19,
        'the boy is mine-Ariana Grande': 20,
        'Too Many Nights-Metro Boomin': 21,
        'Traitor-Olivia Rodrigo': 22,
        'Unholy-Sam Smith': 23,
        'What It Is-Doechii': 24,
        'Woman-Doja Cat': 25
      }
    }

    const playlistMapping = songMappings[playlistName as keyof typeof songMappings]
    if (!playlistMapping) return 0

    // Create a key from title and artist for lookup
    const key = `${title}-${artist}`
    return playlistMapping[key as keyof typeof playlistMapping] || 0
  }

  const generateQuizQuestion = (): QuizQuestion => {
    const playlistSongs = getPlaylistSongs(playlist || '2010s')
    const currentPlaylist = playlist || '2010s'
    
    // Get available songs using the persistent tracker
    // This automatically handles resetting when all songs have been played
    const availableSongs = getAvailableSongs(currentPlaylist, playlistSongs)
    
    const randomIndex = Math.floor(Math.random() * availableSongs.length)
    const correctSong = availableSongs[randomIndex] as Song
    
    // Mark this song as played in persistent storage
    addPlayedSong(currentPlaylist, correctSong.id)
    
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

  const generateSpecialQuizQuestion = (questionType: 'time-warp' | 'slo-mo' | 'hyperspeed'): QuizQuestion => {
    const currentPlaylist = playlist || '2010s'
    
    // Get all available playlists except the current one
    const allPlaylists = ['90s', '2000s', '2010s', '2020s']
    const otherPlaylists = allPlaylists.filter(p => p !== currentPlaylist)
    
    // Randomly select one of the other playlists
    const randomPlaylistIndex = Math.floor(Math.random() * otherPlaylists.length)
    const specialPlaylist = otherPlaylists[randomPlaylistIndex]
    
    console.log('🎯 SPECIAL QUESTION: Using playlist', specialPlaylist, 'with type', questionType, 'instead of', currentPlaylist)
    
    // Store the special playlist for display (only for time-warp)
    if (questionType === 'time-warp') {
      setSpecialQuestionPlaylist(specialPlaylist)
    } else {
      setSpecialQuestionPlaylist(null) // No playlist display for slo-mo
    }
    
    const playlistSongs = getPlaylistSongs(specialPlaylist)
    
    // Get available songs from the special playlist
    const availableSongs = getAvailableSongs(specialPlaylist, playlistSongs)
    
    const randomIndex = Math.floor(Math.random() * availableSongs.length)
    const correctSong = availableSongs[randomIndex] as Song
    
    // Mark this song as played in the special playlist's storage
    addPlayedSong(specialPlaylist, correctSong.id)
    
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

  // Helper function to check if any lifelines are still available
  const hasAvailableLifelines = () => {
    return !lifelinesUsed.doublePoints || !lifelinesUsed.skip || !lifelinesUsed.letterReveal
  }

  // Helper function to start lifeline attention animation
  const startLifelineAttentionAnimation = () => {
    if (version !== 'Version B' || !hasAvailableLifelines()) {
      return
    }

    // Clear any existing timer
    if (lifelineAttentionTimerRef.current) {
      clearTimeout(lifelineAttentionTimerRef.current)
    }

    // Start animation after 5 seconds
    lifelineAttentionTimerRef.current = setTimeout(() => {
      setShowLifelineAttention(true)
      
      // Stop animation after 2 seconds
      setTimeout(() => {
        setShowLifelineAttention(false)
        
        // Schedule next animation if still no answer and lifelines available
        if (version === 'Version B' && hasAvailableLifelines() && !showFeedback) {
          startLifelineAttentionAnimation()
        }
      }, 2000)
    }, 5000)
  }

  // Helper function to stop lifeline attention animation
  const stopLifelineAttentionAnimation = () => {
    if (lifelineAttentionTimerRef.current) {
      clearTimeout(lifelineAttentionTimerRef.current)
      lifelineAttentionTimerRef.current = null
    }
    setShowLifelineAttention(false)
  }

  // Helper function that works with specific question number to avoid state timing issues
  const startNewQuestionWithNumber = (questionNum: number, specialType?: 'time-warp' | 'slo-mo' | 'hyperspeed') => {
    console.log('🎵 START: Starting question', questionNum, 'for version', version, 'with special type:', specialType)
    
    // Prevent multiple simultaneous calls
    if (isLoadingQuestion) {
      return
    }
    setIsLoadingQuestion(true)
    
    // Check if this is the special question for Version B
    if (version === 'Version B' && specialQuestionNumbers.includes(questionNum)) {
      console.log('🎵 VERSION B: Starting special question #', questionNum, 'with type:', specialType)
      // This is the special question - generate a question from a different playlist
      startNewQuestionInternal(true, specialType || 'time-warp') // Use passed specialType
      return
    }

    startNewQuestionInternal()
  }

  const startNewQuestion = () => {
    startNewQuestionWithNumber(questionNumber)
  }

  const startNewQuestionInternal = (isSpecialQuestion: boolean = false, specialType?: 'time-warp' | 'slo-mo' | 'hyperspeed') => {
    
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
  
  // Stop lifeline attention animation when starting new question
  stopLifelineAttentionAnimation()
  
  // Set the special question type immediately for audio playback
  if (isSpecialQuestion && specialType) {
    setSpecialQuestionType(specialType)
    console.log('🎯 SPECIAL QUESTION: Set type to', specialType, 'for audio playback')
  }
  
  const question = isSpecialQuestion && specialType ? generateSpecialQuizQuestion(specialType) : generateQuizQuestion()
    setCurrentQuestion(question)
    setSelectedAnswer(null)
    setShowFeedback(false)
    setIsCorrect(false)
    setArtistCorrect(false)
    setSongCorrect(false)
    setIsPartialCredit(false)
    setPointsEarned(0)
    setLetterRevealInfo(null) // Reset letter reveal info for new question
    // Note: opponentPointsEarned is not reset here to prevent popup display issues
    
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
      // Version B has no opponent mechanics
    } else if (version === 'Version C') {
      // Version C: Start timer if not already running, or continue if still running
      if (!isTimerRunning && timeRemaining === 30) {
        setIsTimerRunning(true)
      } else if (!isTimerRunning && timeRemaining > 0) {
        setIsTimerRunning(true)
      }
    }
    
    // Auto-play the song after audio element has loaded the new source
    // Use multiple attempts to ensure audio plays reliably
    const attemptAutoPlay = (attemptNumber = 1, maxAttempts = 3, currentSpecialType?: 'time-warp' | 'slo-mo' | 'hyperspeed') => {
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
        
        // Set playback rate immediately after setting source for special questions
        if (version === 'Version B' && specialQuestionNumbers.includes(questionNumber)) {
          if (currentSpecialType === 'slo-mo') {
            audioElement.playbackRate = 0.3
            console.log('🎵 SLO-MO: Set playback rate to 0.3 (30% speed) immediately after setting source')
          } else if (currentSpecialType === 'hyperspeed') {
            audioElement.playbackRate = 2.0
            console.log('🎵 HYPERSPEED: Set playback rate to 2.0 (200% speed) immediately after setting source')
          } else {
            audioElement.playbackRate = 1.0
            console.log('🎵 TIME-WARP: Set playback rate to 1.0 (100% speed) immediately after setting source')
          }
          console.log('🔍 DEBUG: Playback rate after source set:', audioElement.playbackRate)
        } else {
          audioElement.playbackRate = 1.0
          console.log('🎵 NORMAL: Set playback rate to 1.0 (100% speed) after setting source')
        }
        
        // Add error handler for this attempt
        audioElement.onerror = (error) => {
          console.error(`🎵 AUTOPLAY: Audio loading error on attempt ${attemptNumber}:`, error)
          audioElement.onerror = null
          if (attemptNumber < maxAttempts) {
            setTimeout(() => attemptAutoPlay(attemptNumber + 1, maxAttempts, currentSpecialType), 500)
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
          
          // Set playback rate for Slo-Mo special questions
          console.log('🔍 DEBUG: Auto-play playback rate check:', {
            version,
            questionNumber,
            specialQuestionNumbers,
            specialQuestionType,
            currentSpecialType,
            isVersionB: version === 'Version B',
            isSpecialQuestion: specialQuestionNumbers.includes(questionNumber),
            isSloMo: specialQuestionType === 'slo-mo',
            isSloMoDirect: currentSpecialType === 'slo-mo',
            currentPlaybackRate: audioElement.playbackRate
          })
          
          // Use the direct currentSpecialType parameter instead of state
          if (version === 'Version B' && currentSpecialType) {
            if (currentSpecialType === 'slo-mo') {
              audioElement.playbackRate = 0.3
              console.log('🎵 SLO-MO: Set playback rate to 0.3 (30% speed) for auto-play (using direct parameter)')
            } else if (currentSpecialType === 'hyperspeed') {
              audioElement.playbackRate = 2.0
              console.log('🎵 HYPERSPEED: Set playback rate to 2.0 (200% speed) for auto-play (using direct parameter)')
            } else {
              audioElement.playbackRate = 1.0
              console.log('🎵 TIME-WARP: Set playback rate to 1.0 (100% speed) for auto-play (using direct parameter)')
            }
            console.log('🔍 DEBUG: Actual playback rate after setting:', audioElement.playbackRate)
          } else {
            audioElement.playbackRate = 1.0
            console.log('🎵 NORMAL: Set playback rate to 1.0 (100% speed) for auto-play')
            console.log('🔍 DEBUG: Actual playback rate after setting:', audioElement.playbackRate)
          }
          
          audioElement.play().then(() => {
            console.log(`🎵 GAME: Audio playback started successfully for ${question.song.title}`)
            console.log('🔍 DEBUG: Final playback rate when playing:', audioElement.playbackRate)
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
          
          // Set playback rate after load for Slo-Mo special questions
          console.log('🔍 DEBUG: After load playback rate check:', {
            version,
            questionNumber,
            specialQuestionNumbers,
            specialQuestionType,
            currentSpecialType,
            isVersionB: version === 'Version B',
            isSpecialQuestion: specialQuestionNumbers.includes(questionNumber),
            isSloMo: specialQuestionType === 'slo-mo',
            isSloMoDirect: currentSpecialType === 'slo-mo'
          })
          
          // Use the direct currentSpecialType parameter instead of state
          if (version === 'Version B' && currentSpecialType) {
            if (currentSpecialType === 'slo-mo') {
              audioElement.playbackRate = 0.3
              console.log('🎵 SLO-MO: Set playback rate to 0.3 (30% speed) after load (using direct parameter)')
            } else if (currentSpecialType === 'hyperspeed') {
              audioElement.playbackRate = 2.0
              console.log('🎵 HYPERSPEED: Set playback rate to 2.0 (200% speed) after load (using direct parameter)')
            } else {
              audioElement.playbackRate = 1.0
              console.log('🎵 TIME-WARP: Set playback rate to 1.0 (100% speed) after load (using direct parameter)')
            }
            console.log('🔍 DEBUG: Actual playback rate after load setting:', audioElement.playbackRate)
          } else {
            audioElement.playbackRate = 1.0
            console.log('🎵 NORMAL: Set playback rate to 1.0 (100% speed) after load')
            console.log('🔍 DEBUG: Actual playback rate after load setting:', audioElement.playbackRate)
          }
        }
      } else {
        console.log('🎵 GAME: No audio element found')
        setIsLoadingQuestion(false)
      }
    }
    
    // Start auto-play with a short delay to allow audio element cleanup to complete
    setTimeout(() => attemptAutoPlay(1, 3, specialType), 500)
    
  }

  useEffect(() => {
    if (!playlist) {
      return
    }
    
    // Note: Song tracking persists across playlist changes (only resets on browser refresh)
    
    // Version B: Reset lifelines when starting a new session
    if (version === 'Version B') {
      setLifelinesUsed({
        doublePoints: false,
        skip: false,
        letterReveal: false
      })
      setIsDoublePointsActive(false)
      
      // Randomly select 1 or 2 special questions (50% chance for 2)
      const willHaveTwoSpecialQuestions = Math.random() < 0.5
      const numSpecialQuestions = willHaveTwoSpecialQuestions ? 2 : 1
      
      // Generate special question numbers (2-7, excluding Question 1)
      const availableQuestions = [2, 3, 4, 5, 6, 7]
      const selectedSpecialQuestions: number[] = []
      
      for (let i = 0; i < numSpecialQuestions; i++) {
        // Filter out questions that would create consecutive special questions
        const validQuestions = availableQuestions.filter(question => {
          // Check if this question would be consecutive with any already selected
          return !selectedSpecialQuestions.some(selected => Math.abs(question - selected) === 1)
        })
        
        // If no valid questions remain, break to avoid infinite loop
        if (validQuestions.length === 0) {
          console.warn('⚠️ WARNING: Cannot select more special questions without creating consecutive ones')
          break
        }
        
        const randomIndex = Math.floor(Math.random() * validQuestions.length)
        const selectedQuestion = validQuestions[randomIndex]
        selectedSpecialQuestions.push(selectedQuestion)
        
        // Remove the selected question from available questions
        const originalIndex = availableQuestions.indexOf(selectedQuestion)
        if (originalIndex > -1) {
          availableQuestions.splice(originalIndex, 1)
        }
      }
      
      selectedSpecialQuestions.sort((a, b) => a - b) // Sort in ascending order
      setSpecialQuestionNumbers(selectedSpecialQuestions)
      setSpecialQuestionPlaylist(null) // Reset special playlist
      setSpecialQuestionType(null) // Reset special question type
      
      // Pre-assign types to special questions to ensure variety
      const allTypes: ('time-warp' | 'slo-mo' | 'hyperspeed')[] = ['time-warp', 'slo-mo', 'hyperspeed']
      const shuffledTypes = [...allTypes].sort(() => Math.random() - 0.5) // Shuffle the types
      const assignedTypes: {[key: number]: 'time-warp' | 'slo-mo' | 'hyperspeed'} = {}
      
      selectedSpecialQuestions.forEach((questionNum, index) => {
        // Cycle through shuffled types to ensure variety
        assignedTypes[questionNum] = shuffledTypes[index % shuffledTypes.length]
      })
      
      setSpecialQuestionTypes(assignedTypes)
      
      console.log(`🎯 VERSION B: ${selectedSpecialQuestions.length} Special Question(s) will be:`, selectedSpecialQuestions)
      console.log(`🎯 VERSION B: Assigned types:`, assignedTypes)
      
      // Verify no consecutive special questions
      const hasConsecutive = selectedSpecialQuestions.some((question, index) => {
        if (index === 0) return false
        return question - selectedSpecialQuestions[index - 1] === 1
      })
      
      if (hasConsecutive) {
        console.error('❌ ERROR: Consecutive special questions detected:', selectedSpecialQuestions)
        // Fallback to single question 7 if there's an issue
        setSpecialQuestionNumbers([7])
        console.log('🎯 VERSION B: Fallback - Special Question set to Question 7')
      }
      
      // Verify all special question numbers are valid (2-7)
      const invalidQuestions = selectedSpecialQuestions.filter(q => q < 2 || q > 7)
      if (invalidQuestions.length > 0) {
        console.error('❌ ERROR: Invalid special question numbers:', invalidQuestions)
        // Fallback to single question 7 if there's an issue
        setSpecialQuestionNumbers([7])
        console.log('🎯 VERSION B: Fallback - Special Question set to Question 7')
      }
    }
    
    // Version C: Start timer when game begins
    if (version === 'Version C') {
      setIsTimerRunning(true)
      setTimeRemaining(30)
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
        // Set playback rate for special questions
        if (version === 'Version B' && specialQuestionNumbers.includes(questionNumber)) {
          if (specialQuestionType === 'slo-mo') {
            audio.playbackRate = 0.3
            console.log('🎵 SLO-MO: Set playback rate to 0.3 (30% speed) for manual play')
          } else if (specialQuestionType === 'hyperspeed') {
            audio.playbackRate = 2.0
            console.log('🎵 HYPERSPEED: Set playback rate to 2.0 (200% speed) for manual play')
          } else {
            audio.playbackRate = 1.0
            console.log('🎵 TIME-WARP: Set playback rate to 1.0 (100% speed) for manual play')
          }
        } else {
          audio.playbackRate = 1.0
          console.log('🎵 NORMAL: Set playback rate to 1.0 (100% speed) for manual play')
        }
        
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
            // Set playback rate for special questions (retry)
            if (version === 'Version B' && specialQuestionNumbers.includes(questionNumber)) {
              if (specialQuestionType === 'slo-mo') {
                audio.playbackRate = 0.3
                console.log('🎵 SLO-MO: Set playback rate to 0.3 (30% speed) for manual play retry')
              } else if (specialQuestionType === 'hyperspeed') {
                audio.playbackRate = 2.0
                console.log('🎵 HYPERSPEED: Set playback rate to 2.0 (200% speed) for manual play retry')
              } else {
                audio.playbackRate = 1.0
                console.log('🎵 TIME-WARP: Set playback rate to 1.0 (100% speed) for manual play retry')
              }
            } else {
              audio.playbackRate = 1.0
              console.log('🎵 NORMAL: Set playback rate to 1.0 (100% speed) for manual play retry')
            }
            
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
    
    // Update streak and apply streak multiplier
    let newStreak = versionCStreak
    let streakMultiplier = 1
    let showStreakNotification = false
    let streakMessage = ""
    
    if (points > 0) {
      // Increase streak for correct answers
      newStreak = versionCStreak + 1
      setVersionCStreak(newStreak)
      
      // Calculate multiplier based on new streak
      const previousMultiplier = getStreakMultiplier(versionCStreak)
      streakMultiplier = getStreakMultiplier(newStreak)
      
      // Show notification when multiplier changes
      if (streakMultiplier > previousMultiplier) {
        showStreakNotification = true
        if (streakMultiplier === 2) {
          streakMessage = '🔥 STREAK! 2× Multiplier Activated!'
        } else if (streakMultiplier === 3) {
          streakMessage = '🔥🔥 STREAK! 3× Multiplier Activated!'
        } else if (streakMultiplier === 4) {
          streakMessage = '🔥🔥🔥 MAX STREAK! 4× Multiplier!'
        }
      }
      
      console.log(`🎵 VERSION C: Streak ${newStreak}, Multiplier ${streakMultiplier}×`)
    } else {
      // Reset streak on incorrect/missed answers
      newStreak = 0
      setVersionCStreak(0)
      streakMultiplier = 1
      console.log('🎵 VERSION C: Streak reset to 0')
    }
    
    // Apply streak multiplier to points
    const finalPoints = points * streakMultiplier
    
    // Award points to player  
    const newScore = score + finalPoints
    setScore(newScore)
    
    // Show streak progression notification
    if (showStreakNotification) {
      setAutoBoosterNotification(streakMessage)
      setTimeout(() => {
        setAutoBoosterNotification(null)
      }, 3000) // Clear notification after 3 seconds
    }
    
    // Give +3 bonus seconds for any points earned
    if (points > 0 && isTimerRunning) {
      console.log('🎵 VERSION C: Adding +3 bonus seconds for scoring points!')
      setTimeRemaining(prev => prev + 3)
      
      // Show visual notification for bonus time
      setAutoBoosterNotification('⏰ +3 Bonus Seconds!')
      setTimeout(() => {
        setAutoBoosterNotification(null)
      }, 2000) // Clear notification after 2 seconds
      
      // Pulse the timer to make it obvious time was added
      setTimerPulse(true)
      setTimeout(() => {
        setTimerPulse(false)
      }, 1000) // Remove pulse after 1 second
      
      console.log('⏰ BONUS TIME: +3 seconds awarded for scoring!')
    }
    
    if (points > 0) {
      // Play Version C scoring sound effect and show confetti
      playVersionCScoreSfx()
      setShowScoreConfetti(true)
      
      // Clear confetti after animation
      setTimeout(() => {
        setShowScoreConfetti(false)
      }, 1500) // Clear after 1.5 seconds
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
    
    let artistCorrect = false
    let songCorrect = false
    
    // Check if this is the special question
    if (specialQuestionNumbers.includes(questionNumber)) {
      console.log('🎯 SPECIAL QUESTION: Scoring Question', questionNumber, 'with special points:', points)
      // Special Question: 50-100 points
      if (points >= 100) {
        artistCorrect = true
        songCorrect = true
      } else if (points >= 50) {
        // Partial credit for 50 points
        artistCorrect = false
        songCorrect = false
      }
    } else {
      console.log('🎵 NORMAL QUESTION: Scoring Question', questionNumber, 'with normal points:', points)
      // Questions 1-6: 0, 10, or 20 points
      if (points >= 20) {
        artistCorrect = true
        songCorrect = true
      }
      // For 10 points or 0 points, don't set artistCorrect or songCorrect - leave them as false
      // This way we won't show ✅ or ❌ indicators, just the song info
    }
    
    setArtistCorrect(artistCorrect)
    setSongCorrect(songCorrect)
    setIsCorrect(points > 0) // Player gets credit for positive points only
    setPointsEarned(points)
    
    // Record base correctness for percentage calculation (Version B)
    setQuestionsCorrectness(prev => [...prev, { artistCorrect, songCorrect }])
    
    if (points > 0) {
      playCorrectAnswerSfx()
    }
    
    setShowFeedback(true)
    
    // Reset 2X Points booster when feedback is shown (after scoring)
    if (isDoublePointsActive) {
      setIsDoublePointsActive(false)
    }
    
    // Pause audio
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      setIsPlaying(false)
    }
    
    // Award points to player
    const newScore = score + points
    setScore(newScore)
  }

  // Version B Lifeline handler
  const handleLifelineClick = (lifelineType: 'doublePoints' | 'skip' | 'letterReveal') => {
    // Stop lifeline attention animation when any lifeline is used
    stopLifelineAttentionAnimation()
    
    // Check if lifeline is already used
    if (lifelinesUsed[lifelineType]) {
      return // Do nothing if already used
    }

    // Mark lifeline as used
    setLifelinesUsed(prev => ({
      ...prev,
      [lifelineType]: true
    }))

    // Handle specific lifeline functionality
    if (lifelineType === 'doublePoints') {
      setIsDoublePointsActive(true)
      console.log('2X Points booster activated!')
    } else if (lifelineType === 'skip') {
      console.log('Skip booster activated!')
      
      // Stop current audio immediately
      const audio = audioRef.current
      if (audio) {
        audio.pause()
        audio.currentTime = 0
        setIsPlaying(false)
        setCurrentTime(0)
      }
      
      // Reset any current answer state
      setSelectedAnswer(null)
      setShowFeedback(false)
      setIsCorrect(false)
      setArtistCorrect(false)
      setSongCorrect(false)
      setIsPartialCredit(false)
      setPointsEarned(0)
      setLetterRevealInfo(null) // Clear letter reveal info
      
      // Generate and start a new question immediately
      setTimeout(() => {
        startNewQuestion()
      }, 100) // Small delay to ensure clean state reset
    } else if (lifelineType === 'letterReveal') {
      console.log('Letter Reveal booster activated!')
      
      if (currentQuestion) {
        // Randomly choose to reveal artist or song name
        const revealArtist = Math.random() < 0.5
        
        if (revealArtist) {
          const artistName = currentQuestion.song.artist
          // Create display text: first letter + spaces preserved + underscores for other letters
          const displayText = artistName.split('').map((char, index) => {
            if (index === 0) {
              return char.toUpperCase() // First letter revealed
            } else if (char === ' ') {
              return ' ' // Preserve spaces
            } else {
              return '_' // Other letters as underscores
            }
          }).join('')
          
          setLetterRevealInfo({
            type: 'artist',
            displayText: displayText
          })
          console.log(`Revealing artist: ${displayText}`)
        } else {
          const songName = currentQuestion.song.title
          // Create display text: first letter + spaces preserved + underscores for other letters
          const displayText = songName.split('').map((char, index) => {
            if (index === 0) {
              return char.toUpperCase() // First letter revealed
            } else if (char === ' ') {
              return ' ' // Preserve spaces
            } else {
              return '_' // Other letters as underscores
            }
          }).join('')
          
          setLetterRevealInfo({
            type: 'song',
            displayText: displayText
          })
          console.log(`Revealing song: ${displayText}`)
        }
      }
    }

    console.log(`Lifeline used: ${lifelineType}`)
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
      setIsPartialCredit(false) // Full credit
    } else if (points === 10) {
      // Partial credit - for percentage calculation, count as one correct out of two
      artistCorrect = true  // For percentage calculation, treat as partial credit
      songCorrect = false
      setIsPartialCredit(true) // Partial credit (don't show indicators in UI)
    } else {
      // No credit
      artistCorrect = false
      songCorrect = false
      setIsPartialCredit(false) // No credit
    }
    
    setArtistCorrect(artistCorrect)
    setSongCorrect(songCorrect)
    setIsCorrect(points > 0) // Player gets credit for any points earned
    
    // Record base correctness for percentage calculation (no bonuses)
    setQuestionsCorrectness(prev => [...prev, { artistCorrect, songCorrect }])
    
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
    
    // Record opponent base correctness for percentage calculation
    if (opponentGetsItRight) {
      if (opponentPointsValue >= 20) {
        setOpponentQuestionsCorrectness(prev => [...prev, { artistCorrect: true, songCorrect: true }])
      } else {
        // 10 points - partial credit (either artist or song correct)
        setOpponentQuestionsCorrectness(prev => [...prev, { artistCorrect: true, songCorrect: false }])
      }
    } else {
      setOpponentQuestionsCorrectness(prev => [...prev, { artistCorrect: false, songCorrect: false }])
    }
    
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
    // Stop lifeline attention animation when question is answered
    stopLifelineAttentionAnimation()
    
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
      
      // Record base correctness for percentage calculation
      setQuestionsCorrectness(prev => [...prev, { artistCorrect: true, songCorrect: true }])
    } else {
      setArtistCorrect(false)
      setSongCorrect(false)
      setPointsEarned(0)
      
      // Record base correctness for percentage calculation
      setQuestionsCorrectness(prev => [...prev, { artistCorrect: false, songCorrect: false }])
    }
    
    // Simulate opponent answer (50% chance of being correct)
    const opponentGetsItRight = Math.random() < 0.5
    setOpponentCorrect(opponentGetsItRight)
    
    // Record opponent base correctness for percentage calculation
    if (opponentGetsItRight) {
      setOpponentQuestionsCorrectness(prev => [...prev, { artistCorrect: true, songCorrect: true }])
    } else {
      setOpponentQuestionsCorrectness(prev => [...prev, { artistCorrect: false, songCorrect: false }])
    }
    
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
      
      // Version B: Verify that special question appeared
      if (version === 'Version B') {
        console.log('🎯 VERSION B SESSION COMPLETE: Special Questions were:', specialQuestionNumbers)
        if (specialQuestionNumbers.length === 0) {
          console.error('❌ ERROR: No Special Questions were set!')
        }
      }
      
      // Play victory applause SFX if player won
      setTimeout(() => {
        if (score > opponentScore) {
          console.log('🎉 GAME: Player won!')
          playVictoryApplauseSfx()
        }
      }, 500) // Small delay to allow results to appear first
    } else {
      const newQuestionNumber = questionNumber + 1
      console.log('🎵 NEXT: Moving to question', newQuestionNumber)
      
      // Check if we're about to start a Special Question in Version B
      if (version === 'Version B' && specialQuestionNumbers.includes(newQuestionNumber)) {
        console.log('🎯 SPECIAL QUESTION: Transition screen triggered for Question', newQuestionNumber)
        
        // Use pre-assigned type for this question to ensure variety
        const specialType = specialQuestionTypes[newQuestionNumber]
        console.log('🎯 PRE-ASSIGNED: Using pre-assigned type for Question', newQuestionNumber, ':', specialType)
        console.log('🎯 PRE-ASSIGNED: All assigned types:', specialQuestionTypes)
        
        if (!specialType) {
          console.error('❌ ERROR: No pre-assigned type found for question', newQuestionNumber)
          return
        }
        
        // Set the special question type for the transition screen
        setSpecialQuestionType(specialType)
        
        // Show Special Question transition screen
        setShowSpecialQuestionTransition(true)
        
        // After 3 seconds, hide transition and proceed to Special Question
        setTimeout(() => {
          setShowSpecialQuestionTransition(false)
          setQuestionNumber(newQuestionNumber)
          console.log('🎯 SPECIAL QUESTION: Starting Question', newQuestionNumber, 'with special scoring')
          
          // Start new question with proper delay for cleanup
          setTimeout(() => {
            startNewQuestionWithNumber(newQuestionNumber, specialType)
          }, 1000)
        }, 3000)
      } else {
        console.log('🎵 NORMAL QUESTION: Starting Question', newQuestionNumber)
        // Normal flow for other questions
        setQuestionNumber(newQuestionNumber)
        
        // Start new question with proper delay for cleanup
        setTimeout(() => {
          startNewQuestionWithNumber(newQuestionNumber)
        }, 1000)
      }
    }
  }

  const restartGame = () => {
    setScore(0)
    setOpponentScore(0)
    setQuestionNumber(1)
    setGameComplete(false)
    // Note: Song tracking persists across new games (only resets on browser refresh)
    setIsLoadingQuestion(false) // Reset loading state
    // Reset opponent points tracking
    setOpponentPointsEarned(0)
    // Reset Version A streaks
    setStreak(0)
    setIsOnStreak(false)
    setOpponentStreak(0)
    setOpponentIsOnStreak(false)
    setSpeedBonusToggle(false) // Reset speed bonus toggle
    setIsPartialCredit(false) // Reset partial credit state
    // Reset correctness tracking for percentage calculation
    setQuestionsCorrectness([])
    setOpponentQuestionsCorrectness([])
    // Reset Version C timer and attempts
    setTimeRemaining(30)
    setIsTimerRunning(false)
    setAllAttemptedSongs([])
    // Reset Version C streak tracking
    setVersionCStreak(0)
    setAutoBoosterNotification(null)
    // Reset Version B lifelines
    setLifelinesUsed({
      doublePoints: false,
      skip: false,
      letterReveal: false
    })
    setIsDoublePointsActive(false)
    setLetterRevealInfo(null) // Reset letter reveal info
    setShowSpecialQuestionTransition(false) // Reset Special Question transition
    setSpecialQuestionNumbers([]) // Reset special question tracking
    setSpecialQuestionTypes({}) // Reset special question types
    setSpecialQuestionPlaylist(null) // Reset special playlist
    setSpecialQuestionType(null) // Reset special question type
    stopLifelineAttentionAnimation() // Stop lifeline attention animation
    setTimerPulse(false)
    setShowScoreConfetti(false)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    // doublePointsTimerRef removed for streak multiplier system; no cleanup needed
    
    startNewQuestion()
  }

  // Debug function to force next question to be a specific special question type
  const handleDebugSpecialQuestion = (specialType: 'time-warp' | 'slo-mo' | 'hyperspeed') => {
    console.log('🐛 DEBUG: Forcing next question to be', specialType, 'Special Question')
    
    // Set the next question number as a special question
    const nextQuestionNumber = questionNumber + 1
    
    // Add this question to special question numbers
    setSpecialQuestionNumbers(prev => {
      const newNumbers = [...prev]
      if (!newNumbers.includes(nextQuestionNumber)) {
        newNumbers.push(nextQuestionNumber)
        newNumbers.sort((a, b) => a - b)
      }
      return newNumbers
    })
    
    // Set the special question type for this question
    setSpecialQuestionTypes(prev => ({
      ...prev,
      [nextQuestionNumber]: specialType
    }))
    
    // Set the special question type
    setSpecialQuestionType(specialType)
    
    console.log('🐛 DEBUG: Next question', nextQuestionNumber, 'will be', specialType, 'Special Question')
  }

  const backToPlaylist = () => {
    navigate('/')
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Version C Streak Multiplier Functions

  // activateBonusTime function removed - bonus time now automatically triggers on any points scored

  // Version C Streak Multiplier Helper Function
  const getStreakMultiplier = (streak: number): number => {
    if (streak >= 5) return 4 // Max multiplier at 5+ streak
    if (streak >= 4) return 3 // 3x multiplier at 4 streak
    if (streak >= 3) return 2 // 2x multiplier at 3 streak
    return 1 // No multiplier below 3 streak
  }

  // Calculate correct rate based on base correctness (no bonuses)
  const calculateCorrectRate = (correctnessData: Array<{artistCorrect: boolean, songCorrect: boolean}>): number => {
    if (correctnessData.length === 0) return 0
    
    const totalPossiblePoints = correctnessData.length * 20 // 10 for artist + 10 for song per question
    const earnedBasePoints = correctnessData.reduce((total, question) => {
      let points = 0
      if (question.artistCorrect) points += 10
      if (question.songCorrect) points += 10
      return total + points
    }, 0)
    
    return Math.round((earnedBasePoints / totalPossiblePoints) * 100)
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

  const playVersionCScoreSfx = () => {
    if (versionCScoreSfxRef.current) {
      versionCScoreSfxRef.current.currentTime = 0
      versionCScoreSfxRef.current.play().catch(error => {
        console.log('SFX: Version C score sound failed to play:', error)
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


  // Only show loading screen if no current question AND it's not Version B special question
  if (!currentQuestion && !(version === 'Version B' && questionNumber === totalQuestions)) {
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
          </header>

          <main className="game-main">
            <div className="final-score">
              {/* Version B Final Results */}
              {version === 'Version B' && (
                <div className="version-b-results">
                  <h3 className="victory-message">Quiz Complete!</h3>
                  <p className="final-score-text">Final Score: {score}</p>
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
              
              {/* Only show Your Score vs Opponent Score for Version A (has opponent) */}
              {version === 'Version A' && (
                <div className="final-scores-container">
                  <div className="player-final-score">
                    <h4>Your Score</h4>
                    <div className="score-display">
                      <span className="score-number">{score}</span>
                    </div>
                    <p className="score-percentage">
                      {calculateCorrectRate(questionsCorrectness)}% correct
                    </p>
                  </div>
                  
                  <div className="vs-divider">VS</div>
                  
                  <div className="opponent-final-score">
                    <h4>Opponent Score</h4>
                    <div className="score-display">
                      <span className="score-number">{opponentScore}</span>
                    </div>
                    <p className="score-percentage">
                      {calculateCorrectRate(opponentQuestionsCorrectness)}% correct
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
            {version === 'Version B' ? null : (
              <div className="avatar-container player-container">
                <img 
                  src="/assets/YourAvatar.png" 
                  alt="Your Avatar" 
                  className="avatar player-avatar"
                />
              </div>
            )}
            
            {/* Version C Score Tracker, or Opponent Avatar (Version A only) */}
            {version === 'Version C' ? (
              null
            ) : version === 'Version A' ? (
              /* Show opponent avatar for Version A only */
              <div className="avatar-container opponent-container">
                {/* Total Score Display Above Opponent Avatar */}
                {showFeedback && !gameComplete && (
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
            ) : null}
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
          
          <audio 
            ref={versionCScoreSfxRef}
            preload="auto"
          >
            <source src="/assets/sfx_notify_correctAnswer_01.ogg" type="audio/ogg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      </div>
    )
  }

  return (
    <div className={`game-container ${version === 'Version B' ? 'version-b' : version === 'Version C' ? 'version-c' : ''}`}>
      {/* Version C Auto-Booster Notification */}
      {version === 'Version C' && autoBoosterNotification && (
        <div className="auto-booster-notification">
          {autoBoosterNotification}
        </div>
      )}
      
      <div className="game-content">
        
        <header className="game-header" style={{ display: showSpecialQuestionTransition ? 'none' : 'flex' }}>
          <div className="quiz-info">
            {(() => {
              console.log('🕐 TIMER RENDERING CHECK:', { version, isVersionC: version === 'Version C', timeRemaining });
              return null;
            })()}
            {version === 'Version C' ? (
              <div className="version-c-timer">
                <div className={`timer-display ${timerPulse ? 'timer-pulse' : ''}`}>
                  <div className="timer-label">Time Remaining</div>
                  <div className={`timer-value ${timeRemaining <= 10 ? 'timer-urgent' : ''}`}>
                    {timeRemaining}s
                  </div>
                  {versionCStreak >= 3 && (
                    <div 
                      className="timer-streak-indicator" 
                      data-multiplier={getStreakMultiplier(versionCStreak)}
                    >
                      {getStreakMultiplier(versionCStreak) === 4 ? '🔥🔥🔥 ' : '🔥 '}
                      {getStreakMultiplier(versionCStreak)}× STREAK ACTIVE
                      {getStreakMultiplier(versionCStreak) === 4 ? ' 🔥🔥🔥' : ''}
                    </div>
                  )}
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

      {/* Version B Special Question Transition Screen */}
      {version === 'Version B' && showSpecialQuestionTransition && (
        <div className="special-question-transition-screen">
          <div className="special-question-transition-content">
            <div className="special-question-transition-text">SPECIAL QUESTION</div>
            <div className="genre-portal-text">
              {specialQuestionType === 'slo-mo' ? 'Slo-Mo' : specialQuestionType === 'hyperspeed' ? 'Hyperspeed' : 'Time Warp'}
            </div>
            {/* Animated Clock for Time Warp */}
            {specialQuestionType === 'time-warp' && (
              <div className="time-warp-clock">
                <div className="clock-face">
                  <div className="clock-center"></div>
                  <div className="clock-hand hour-hand"></div>
                  <div className="clock-hand minute-hand"></div>
                  <div className="clock-hand second-hand"></div>
                  {/* Clock numbers */}
                  <div className="clock-number clock-12">12</div>
                  <div className="clock-number clock-3">3</div>
                  <div className="clock-number clock-6">6</div>
                  <div className="clock-number clock-9">9</div>
                </div>
              </div>
            )}
            
            {/* Animated Snail Emoji for Slo-Mo */}
            {specialQuestionType === 'slo-mo' && (
              <div className="slo-mo-snail">
                <div className="snail-emoji">🐌</div>
              </div>
            )}
            
            {/* Animated Racecar Emoji for Hyperspeed */}
            {specialQuestionType === 'hyperspeed' && (
              <div className="hyperspeed-racecar">
                <div className="racecar-emoji">🏎️</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Version B Special Question Playlist Display (Time Warp only) */}
      {version === 'Version B' && specialQuestionNumbers.includes(questionNumber) && !showFeedback && specialQuestionType === 'time-warp' && (
        <div className="special-playlist-display">
          <div className="time-warp-label">TIME WARP</div>
          <div className="special-playlist-text">{specialQuestionPlaylist || 'Unknown Playlist'}</div>
        </div>
      )}

        <main className="game-main" style={{ display: showSpecialQuestionTransition ? 'none' : 'block' }}>
          <div className="quiz-section">
            {!showFeedback && (
              <div className="audio-controls">
                <audio
                  ref={audioRef}
                  src={currentQuestion?.song?.file}
                  onEnded={() => {
                    setIsPlaying(false)
                    // Start lifeline attention animation for Version B after song ends
                    if (version === 'Version B') {
                      startLifelineAttentionAnimation()
                    }
                  }}
                />
              </div>
            )}
            
            {/* Animated Sound Bars - hide for Version C */}
            {version !== 'Version C' && !showFeedback && (
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

            {/* Version B Letter Reveal Display */}
            {version === 'Version B' && letterRevealInfo && !showFeedback && (
              <div className="letter-reveal-display">
                <div className="letter-reveal-content">
                  <div className={`letter-reveal-label ${letterRevealInfo.type === 'song' ? 'song-label' : 'artist-label'}`}>
                    {letterRevealInfo.type === 'artist' ? 'Artist Name:' : 'Song Name:'}
                  </div>
                  <div className="letter-reveal-text">
                    {letterRevealInfo.displayText.split('').map((char, index) => (
                      char === ' ' ? (
                        <span key={index} className="letter-space"> </span>
                      ) : char === '_' ? (
                        <span key={index} className="letter-blank">_</span>
                      ) : (
                        <span key={index} className="letter-revealed">{char}</span>
                      )
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Version B Boosters */}
            {version === 'Version B' && !showFeedback && (
              <div className={`boosters-section ${showLifelineAttention ? 'lifeline-attention' : ''}`}>
                <div className="boosters-header">LIFELINES</div>
                <div className="boosters-container">
                  <div 
                    className={`booster-icon ${lifelinesUsed.doublePoints ? 'depleted' : ''}`}
                    onClick={() => handleLifelineClick('doublePoints')}
                    style={{ cursor: lifelinesUsed.doublePoints ? 'not-allowed' : 'pointer' }}
                  >
                    <div className="booster-label">2X Points</div>
                  </div>
                  <div 
                    className={`booster-icon ${lifelinesUsed.skip ? 'depleted' : ''}`}
                    onClick={() => handleLifelineClick('skip')}
                    style={{ cursor: lifelinesUsed.skip ? 'not-allowed' : 'pointer' }}
                  >
                    <div className="booster-label">Skip</div>
                  </div>
                  <div 
                    className={`booster-icon ${lifelinesUsed.letterReveal ? 'depleted' : ''}`}
                    onClick={() => handleLifelineClick('letterReveal')}
                    style={{ cursor: lifelinesUsed.letterReveal ? 'not-allowed' : 'pointer' }}
                  >
                    <div className="booster-label">Letter Reveal</div>
                  </div>
                </div>
              </div>
            )}


            {!showFeedback && (
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
            )}

            {!showFeedback && (
              <div className="control-buttons">
                <button 
                  className={`control-btn play-pause-btn ${selectedAnswer ? 'disabled' : ''}`}
                  onClick={togglePlayPause}
                  disabled={!!selectedAnswer}
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </button>
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
                {currentQuestion && (
                  <div className="song-number-display">
                    Song #{getSongNumber(playlist || '2010s', currentQuestion.song.title, currentQuestion.song.artist)}
                  </div>
                )}
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
                  onClick={() => handleVersionBScore(isDoublePointsActive ? (specialQuestionNumbers.includes(questionNumber) ? 100 : 20) : (specialQuestionNumbers.includes(questionNumber) ? 50 : 10))}
                >
                  {isDoublePointsActive ? (specialQuestionNumbers.includes(questionNumber) ? '100 Points' : '20 Points') : (specialQuestionNumbers.includes(questionNumber) ? '50 Points' : '10 Points')}
                </button>
                <button
                  className="score-button score-20"
                  onClick={() => handleVersionBScore(isDoublePointsActive ? (specialQuestionNumbers.includes(questionNumber) ? 200 : 40) : (specialQuestionNumbers.includes(questionNumber) ? 100 : 20))}
                >
                  {isDoublePointsActive ? (specialQuestionNumbers.includes(questionNumber) ? '200 Points' : '40 Points') : (specialQuestionNumbers.includes(questionNumber) ? '100 Points' : '20 Points')}
                </button>
                  {/* No special scoring for question 7 since it's now a special question */}
                </div>
                {currentQuestion && (
                  <div className="song-number-display">
                    Song #{getSongNumber(playlist || '2010s', currentQuestion.song.title, currentQuestion.song.artist)}
                  </div>
                )}
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
                {currentQuestion && (
                  <div className="song-number-display">
                    Song #{getSongNumber(playlist || '2010s', currentQuestion.song.title, currentQuestion.song.artist)}
                  </div>
                )}
              </div>
            )}
            
            {/* Multiple Choice Options for other versions */}
            {version !== 'Version A' && version !== 'Version B' && version !== 'Version C' && !selectedAnswer && !showFeedback && currentQuestion && (
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
            {showFeedback && currentQuestion && (
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
                        {/* For partial credit (10-point base), don't show indicators */}
                        {isPartialCredit ? (
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
        
        {/* Version C Boosters removed - now using progressive streak multiplier system */}
        
        {/* Competitive Avatars */}
        <div className="avatars">
          {version === 'Version B' ? null : (
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
                     version === 'Version B' ? (
                       pointsEarned === 20 ? 'Perfect! +20 Points' :
                       pointsEarned === 10 ? 'Correct! +10 Points' :
                       pointsEarned === 30 ? 'Perfect! +30 Points' :
                       'Correct! +' + pointsEarned + ' Points'
                     ) :
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
          )}
          
          {/* Version C Score Tracker, or Opponent Avatar (Version A only) */}
          {version === 'Version C' ? (
            <div className="avatar-container score-tracker-container">
              <div className={`version-c-score-tracker ${showScoreConfetti ? 'confetti-active' : ''}`}>
                {showScoreConfetti && (
                  <div className="score-confetti-container">
                    <div className="confetti-particle confetti-1">🎉</div>
                    <div className="confetti-particle confetti-2">⭐</div>
                    <div className="confetti-particle confetti-3">🎊</div>
                    <div className="confetti-particle confetti-4">✨</div>
                    <div className="confetti-particle confetti-5">🌟</div>
                    <div className="confetti-particle confetti-6">💫</div>
                  </div>
                )}
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
                <div className="attempts-counter-right">
                  Songs Attempted: {allAttemptedSongs.length}
                </div>
              </div>
            </div>
          ) : version === 'Version A' ? (
            /* Show opponent avatar for Version A only */
            <div className="avatar-container opponent-container">
              {/* Total Score Display Above Opponent Avatar */}
              {showFeedback && !gameComplete && (
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
          ) : null}
          
        </div>



        <button
          className="back-to-playlists-btn"
          onClick={backToPlaylist}
        >
          ← Back to Playlists
        </button>

        {/* Version B Restart Button - Debug Only */}
        {version === 'Version B' && !showSpecialQuestionTransition && (
          <button 
            className="restart-button"
            onClick={restartGame}
            title="Restart Version B Session (Debug)"
          >
            Restart
          </button>
        )}

        {/* Version B Special Question Debug Buttons */}
        {version === 'Version B' && !showSpecialQuestionTransition && (
          <div className="debug-special-buttons">
            <button 
              className="debug-special-button time-warp-debug"
              onClick={() => handleDebugSpecialQuestion('time-warp')}
              title="Force next question to be Time Warp Special Question"
            >
              TW
            </button>
            <button 
              className="debug-special-button slo-mo-debug"
              onClick={() => handleDebugSpecialQuestion('slo-mo')}
              title="Force next question to be Slo-Mo Special Question"
            >
              SM
            </button>
            <button 
              className="debug-special-button hyperspeed-debug"
              onClick={() => handleDebugSpecialQuestion('hyperspeed')}
              title="Force next question to be Hyperspeed Special Question"
            >
              HS
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export default Game

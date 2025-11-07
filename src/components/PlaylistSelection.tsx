import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import CollectionMenu from './CollectionMenu'
import './PlaylistSelection.css'

type LifelineType = 'skip' | 'artistLetterReveal' | 'songLetterReveal' | 'multipleChoiceArtist' | 'multipleChoiceSong'

type PlaylistRank = 'bronze' | 'silver' | 'gold' | 'platinum'

interface PlaylistProgress {
  progress: number // Number of segments filled (0-15)
}

// PROGRESSIVE XP SYSTEM - Each level requires 30 more XP than the previous
// Level 1: 100 XP, Level 2: 130 XP, Level 3: 160 XP, etc.
const getXPRequiredForLevel = (level: number): number => {
  return 100 + ((level - 1) * 30) // Level 1: 100, Level 2: 130, Level 3: 160, etc.
}

const PlaylistSelection = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [selectedMasterMode, setSelectedMasterMode] = useState(false)
  const [hoveredPlaylist, setHoveredPlaylist] = useState<string | null>(null)
  const [playlistStats, setPlaylistStats] = useState<Record<string, any>>({})
  const [showCollectionMenu, setShowCollectionMenu] = useState(false)
  const [collectionPlaylist, setCollectionPlaylist] = useState('')
  const [collectionRank, setCollectionRank] = useState<PlaylistRank>('bronze')
  const [showDailyChallengeModal, setShowDailyChallengeModal] = useState(false)
  const [dailyChallengePlaylist, setDailyChallengePlaylist] = useState('')
  const [dailyChallengeClosing, setDailyChallengeClosing] = useState(false)
  const [dailyChallengeTimers, setDailyChallengeTimers] = useState<Record<string, string>>({})
  const [dailyChallengeNewBadges, setDailyChallengeNewBadges] = useState<Set<string>>(new Set())
  const [masterModeNewBadges, setMasterModeNewBadges] = useState<Set<string>>(new Set())
  const [xpProgress, setXpProgress] = useState(() => {
    // Initialize from localStorage to avoid visual "fill up" on page load
    const savedLevel = parseInt(localStorage.getItem('player_level') || '1', 10)
    const savedXP = parseInt(localStorage.getItem('player_xp_progress') || '0', 10)
    const xpRequired = getXPRequiredForLevel(savedLevel)
    return Math.min((savedXP / xpRequired) * 100, 100)
  })
  const [actualXP, setActualXP] = useState(() => {
    return parseInt(localStorage.getItem('player_xp_progress') || '0', 10)
  })
  const [playerLevel, setPlayerLevel] = useState(() => {
    return parseInt(localStorage.getItem('player_level') || '1', 10)
  })
  const [displayLevel, setDisplayLevel] = useState(() => {
    return parseInt(localStorage.getItem('player_level') || '1', 10)
  })
  const [unlockedLifelines, setUnlockedLifelines] = useState<LifelineType[]>([])
  const [hatUnlocked, setHatUnlocked] = useState(false)
  
  // Player name state
  const [playerName, setPlayerName] = useState('')
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [nameInput, setNameInput] = useState('')

  // Debug hotkey state
  const [isHoveringXPBar, setIsHoveringXPBar] = useState(false)
  const [showLevelUpModal, setShowLevelUpModal] = useState(false)

  // Helper function: Check if Daily Challenge is available for a playlist
  const isDailyChallengeAvailable = (playlist: string): boolean => {
    const completedKey = `daily_challenge_completed_${playlist}`
    const completedTimestamp = localStorage.getItem(completedKey)
    
    if (!completedTimestamp) return true // Never completed, available
    
    const completed = parseInt(completedTimestamp, 10)
    const now = Date.now()
    const twentyFourHours = 24 * 60 * 60 * 1000
    
    return (now - completed) >= twentyFourHours
  }

  // Helper function: Get time remaining until Daily Challenge is available
  const getTimeRemaining = (playlist: string): string => {
    const completedKey = `daily_challenge_completed_${playlist}`
    const completedTimestamp = localStorage.getItem(completedKey)
    
    if (!completedTimestamp) return '00:00:00'
    
    const completed = parseInt(completedTimestamp, 10)
    const now = Date.now()
    const twentyFourHours = 24 * 60 * 60 * 1000
    const timeRemaining = twentyFourHours - (now - completed)
    
    if (timeRemaining <= 0) return '00:00:00'
    
    const hours = Math.floor(timeRemaining / (60 * 60 * 1000))
    const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000))
    const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const [newlyUnlockedLifeline, setNewlyUnlockedLifeline] = useState<LifelineType | null>(null)
  const [showHatUnlockModal, setShowHatUnlockModal] = useState(false)
  
  // Multi-stage level-up animation state
  const [showClosedPrize, setShowClosedPrize] = useState(false)
  const [shakeClosedPrize, setShakeClosedPrize] = useState(false)
  const [showOpenPrize, setShowOpenPrize] = useState(false)
  const [showModalContent, setShowModalContent] = useState(false)
  const [flyDownPrize, setFlyDownPrize] = useState(false)
  const [prizeType, setPrizeType] = useState<'treasure' | 'present'>('treasure')
  const [animateNextPrize, setAnimateNextPrize] = useState(false)

  // Playlist progression system state
  const playlists = ['2020s', '2010s', '2000s', '90s', 'Iconic Songs', 'Most Streamed Songs']
  const [playlistProgress, setPlaylistProgress] = useState<Record<string, PlaylistProgress>>({
    '2020s': { progress: 0 },
    '2010s': { progress: 0 },
    '2000s': { progress: 0 },
    '90s': { progress: 0 },
    'Iconic Songs': { progress: 0 },
    'Most Streamed Songs': { progress: 0 }
  })

  // Track which playlists have new songs
  const [playlistsWithNewSongs, setPlaylistsWithNewSongs] = useState<Set<string>>(new Set())

  // Load data whenever we navigate to this page
  useEffect(() => {
    console.log('🔄 PlaylistSelection mounted/navigated, location:', location.pathname)
    
    // Check for player name first
    const savedName = localStorage.getItem('player_name')
    if (savedName) {
      setPlayerName(savedName)
      console.log('👤 Loaded player name:', savedName)
    } else {
      // Show name prompt if no name is saved
      setShowNamePrompt(true)
      console.log('👤 No player name found, showing prompt')
    }
    
    const savedLevel = parseInt(localStorage.getItem('player_level') || '1', 10)
    setPlayerLevel(savedLevel)
    setDisplayLevel(savedLevel) // Initialize display level to match actual level
    
    const savedXP = parseInt(localStorage.getItem('player_xp_progress') || '0', 10)
    const xpRequired = getXPRequiredForLevel(savedLevel)
    const xpPercentage = Math.min((savedXP / xpRequired) * 100, 100)
    setActualXP(savedXP)
    setXpProgress(xpPercentage)
    
    const savedHatUnlocked = localStorage.getItem('hat_unlocked')
    setHatUnlocked(savedHatUnlocked === 'true')
    
    const savedLifelines = localStorage.getItem('unlocked_lifelines')
    if (savedLifelines) {
      try {
        const parsed = JSON.parse(savedLifelines) as LifelineType[]
        setUnlockedLifelines(parsed)
        console.log('📋 Loaded unlocked lifelines:', parsed)
      } catch (e) {
        console.error('Failed to parse unlocked lifelines:', e)
        setUnlockedLifelines([])
      }
    }

    // Load playlist progress
    const savedPlaylistProgress = localStorage.getItem('playlist_progress')
    if (savedPlaylistProgress) {
      try {
        const parsed = JSON.parse(savedPlaylistProgress) as Record<string, PlaylistProgress>
        setPlaylistProgress(parsed)
        console.log('📊 Loaded playlist progress:', parsed)
      } catch (e) {
        console.error('Failed to parse playlist progress:', e)
      }
    }

    // Load playlists with new songs
    const savedNewSongs = localStorage.getItem('playlists_with_new_songs')
    if (savedNewSongs) {
      try {
        const parsed = JSON.parse(savedNewSongs) as string[]
        setPlaylistsWithNewSongs(new Set(parsed))
        console.log('✨ Loaded playlists with new songs:', parsed)
      } catch (e) {
        console.error('Failed to parse playlists with new songs:', e)
      }
    }

    // Load viewed Daily Challenge buttons
    const savedViewedDC = localStorage.getItem('viewed_daily_challenge_buttons')
    const viewedDC = savedViewedDC ? JSON.parse(savedViewedDC) : []
    
    // Determine which playlists should show NEW badge (Gold tier and not yet viewed)
    const newBadges = new Set<string>()
    const progressData = savedPlaylistProgress ? JSON.parse(savedPlaylistProgress) : {}
    playlists.forEach(playlist => {
      const progress = progressData[playlist]?.progress || 0
      if (progress >= 10 && !viewedDC.includes(playlist)) {
        newBadges.add(playlist)
      }
    })
    setDailyChallengeNewBadges(newBadges)
    console.log('🔥 Daily Challenge NEW badges for:', Array.from(newBadges))

    // Load viewed Master Mode buttons
    const savedViewedMM = localStorage.getItem('viewed_master_mode_buttons')
    const viewedMM = savedViewedMM ? JSON.parse(savedViewedMM) : []
    
    // Determine which playlists should show Master Mode NEW badge (Platinum tier and not yet viewed)
    const mmNewBadges = new Set<string>()
    playlists.forEach(playlist => {
      const progress = progressData[playlist]?.progress || 0
      if (progress >= 15 && !viewedMM.includes(playlist)) {
        mmNewBadges.add(playlist)
      }
    })
    setMasterModeNewBadges(mmNewBadges)
    console.log('⚡ Master Mode NEW badges for:', Array.from(mmNewBadges))

    // Load stats for all playlists
    const stats: Record<string, any> = {}
    playlists.forEach(playlist => {
      const statsKey = `playlist_stats_${playlist}`
      const savedStats = localStorage.getItem(statsKey)
      if (savedStats) {
        try {
          stats[playlist] = JSON.parse(savedStats)
        } catch (e) {
          console.error(`Failed to parse stats for ${playlist}:`, e)
          stats[playlist] = { timesPlayed: 0, averageScore: 0, highestScore: 0, completedSongs: [] }
        }
      } else {
        stats[playlist] = { timesPlayed: 0, averageScore: 0, highestScore: 0, completedSongs: [] }
      }
    })
    setPlaylistStats(stats)
    console.log('📊 Loaded all playlist stats:', stats)
  }, [location])

  // Debug hotkey: Up arrow when hovering over XP bar to level up
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isHoveringXPBar && event.key === 'ArrowUp') {
        event.preventDefault()
        handleDebugLevelUp()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isHoveringXPBar, playerLevel, unlockedLifelines, hatUnlocked])

  // Update countdown timers every second
  useEffect(() => {
    const updateTimers = () => {
      const timers: Record<string, string> = {}
      playlists.forEach(playlist => {
        if (!isDailyChallengeAvailable(playlist)) {
          timers[playlist] = getTimeRemaining(playlist)
        }
      })
      setDailyChallengeTimers(timers)
    }

    // Update immediately
    updateTimers()

    // Update every second
    const interval = setInterval(updateTimers, 1000)
    return () => clearInterval(interval)
  }, [])

  // Helper function to get rank from progress
  const getRankFromProgress = (progress: number): PlaylistRank => {
    if (progress >= 15) return 'platinum'
    if (progress >= 10) return 'gold'
    if (progress >= 5) return 'silver'
    return 'bronze'
  }

  // Helper function to check if Master Mode is unlocked
  const isMasterModeUnlocked = (progress: number): boolean => {
    return progress >= 15 // Master Mode available at 15 segments (Platinum rank)
  }

  // Helper function to get medal image path
  const getMedalImage = (rank: PlaylistRank): string => {
    if (rank === 'bronze') return '/assets/MedalBronze.png'
    if (rank === 'silver') return '/assets/MedalSilver.png'
    if (rank === 'gold') return '/assets/MedalGold.png'
    return '/assets/MedalDiamond.png'
  }

  // Handler for medal button clicks
  const handleMedalClick = (playlist: string, rank: PlaylistRank) => {
    console.log(`Medal clicked for ${playlist} - Rank ${rank}`)
    setCollectionPlaylist(playlist)
    setCollectionRank(rank)
    setShowCollectionMenu(true)
    
    // Clear the "new songs" badge for this playlist
    setPlaylistsWithNewSongs(prev => {
      const updated = new Set(prev)
      updated.delete(playlist)
      localStorage.setItem('playlists_with_new_songs', JSON.stringify([...updated]))
      console.log(`✅ Cleared NEW badge for ${playlist}`)
      return updated
    })
  }

  const handleCloseCollectionMenu = () => {
    setShowCollectionMenu(false)
    setCollectionPlaylist('')
    setCollectionRank('bronze')
  }

  const handleCloseDailyChallengeModal = () => {
    setDailyChallengeClosing(true)
    setTimeout(() => {
      setShowDailyChallengeModal(false)
      setDailyChallengeClosing(false)
    }, 300) // Match the animation duration
  }

  const handleDailyChallengePlay = () => {
    console.log('🔥 Starting Daily Challenge for', dailyChallengePlaylist)
    handleCloseDailyChallengeModal()
    // Navigate to game with Daily Challenge mode
    navigate(`/game/${dailyChallengePlaylist}?version=Version B`, { 
      state: { 
        isDailyChallenge: true 
      } 
    })
  }

  const handleDailyChallengeButtonHover = (playlist: string) => {
    if (dailyChallengeNewBadges.has(playlist)) {
      // Mark as viewed
      const savedViewedDC = localStorage.getItem('viewed_daily_challenge_buttons')
      const viewedDC = savedViewedDC ? JSON.parse(savedViewedDC) : []
      if (!viewedDC.includes(playlist)) {
        viewedDC.push(playlist)
        localStorage.setItem('viewed_daily_challenge_buttons', JSON.stringify(viewedDC))
      }
      
      // Remove from NEW badges
      const updated = new Set(dailyChallengeNewBadges)
      updated.delete(playlist)
      setDailyChallengeNewBadges(updated)
      console.log('🔥 Daily Challenge button viewed for:', playlist)
    }
  }

  const handleMasterModeButtonHover = (playlist: string) => {
    if (masterModeNewBadges.has(playlist)) {
      // Mark as viewed
      const savedViewedMM = localStorage.getItem('viewed_master_mode_buttons')
      const viewedMM = savedViewedMM ? JSON.parse(savedViewedMM) : []
      if (!viewedMM.includes(playlist)) {
        viewedMM.push(playlist)
        localStorage.setItem('viewed_master_mode_buttons', JSON.stringify(viewedMM))
      }
      
      // Remove from NEW badges
      const updated = new Set(masterModeNewBadges)
      updated.delete(playlist)
      setMasterModeNewBadges(updated)
      console.log('⚡ Master Mode button viewed for:', playlist)
    }
  }

  // Keyboard shortcut: Spacebar to activate PLAY button in Daily Challenge modal
  useEffect(() => {
    if (!showDailyChallengeModal) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault() // Prevent page scroll
        handleDailyChallengePlay()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showDailyChallengeModal, dailyChallengePlaylist])

  const handlePlaylistSelect = (playlist: string, isMasterMode: boolean = false) => {
    setSelectedPlaylist(playlist)
    setSelectedMasterMode(isMasterMode)
    console.log(`Selected playlist: ${playlist}, Master Mode: ${isMasterMode}`)
    
    const progress = playlistProgress[playlist]?.progress || 0
    const rank = getRankFromProgress(progress)
    
    // Navigate directly to game after brief selection feedback
    setTimeout(() => {
      const gameVersion = isMasterMode ? 'Version C' : 'Version B'
      const url = `/game/${playlist}?version=${encodeURIComponent(gameVersion)}&progress=${progress}`
      navigate(url)
    }, 1000)
  }

  const handleNameSubmit = () => {
    if (nameInput.trim()) {
      const trimmedName = nameInput.trim()
      localStorage.setItem('player_name', trimmedName)
      setPlayerName(trimmedName)
      setShowNamePrompt(false)
      setNameInput('')
      console.log('👤 Player name set to:', trimmedName)
    }
  }

  const handleDebugRankUp = (playlist: string) => {
    const currentProgress = playlistProgress[playlist]?.progress || 0
    const newProgress = Math.min(currentProgress + 5, 15) // Add 5, cap at 15
    
    // Update local state
    setPlaylistProgress(prev => ({
      ...prev,
      [playlist]: { progress: newProgress }
    }))
    
    // Save to localStorage
    const savedProgress = localStorage.getItem('playlist_progress')
    let allProgress: Record<string, { progress: number }> = {}
    if (savedProgress) {
      try {
        allProgress = JSON.parse(savedProgress)
      } catch (e) {
        console.error('Failed to parse playlist progress:', e)
      }
    }
    allProgress[playlist] = { progress: newProgress }
    localStorage.setItem('playlist_progress', JSON.stringify(allProgress))
    
    console.log(`🐛 DEBUG: ${playlist} progress ${currentProgress} → ${newProgress}`)
  }

  // Start the multi-stage level-up animation
  const startLevelUpAnimation = (lifeline: LifelineType | null, isHatUnlock: boolean = false, specificPlayerLevel?: number) => {
    // Determine prize type based on actual player level reached (not level-up event count)
    // If specificPlayerLevel is provided, use it; otherwise fall back to checking stored level
    const playerLevelForPrize = specificPlayerLevel ?? parseInt(localStorage.getItem('player_level') || '1', 10)
    setPrizeType(playerLevelForPrize === 4 ? 'present' : 'treasure')
    console.log('🎁 Prize type determined: playerLevel =', playerLevelForPrize, ', prize =', playerLevelForPrize === 4 ? 'present' : 'treasure')
    
    // Stage 1: Show closed prize immediately
    setShowClosedPrize(true)
    console.log('🎁 Stage 1: Showing closed prize')
    
    // Stage 2: After 1 second, trigger shake
    setTimeout(() => {
      setShakeClosedPrize(true)
      console.log('📦 Stage 2: Shaking prize')
    }, 1000)
    
    // Stage 3: After shake (500ms), swap to open with fireworks
    setTimeout(() => {
      setShowClosedPrize(false)
      setShakeClosedPrize(false)
      setShowOpenPrize(true)
      console.log('✨ Stage 3: Prize opening with fireworks')
    }, 1500)
    
    // Stage 4: After fireworks display (800ms), show modal content
    setTimeout(() => {
      setShowModalContent(true)
      if (isHatUnlock) {
        setShowHatUnlockModal(true)
      } else {
        setNewlyUnlockedLifeline(lifeline)
        setShowLevelUpModal(true)
      }
      console.log('📋 Stage 4: Showing modal content')
    }, 2300)
  }

  // Debug function to level up player
  const handleDebugLevelUp = () => {
    const currentLevel = playerLevel
    const newLevel = currentLevel + 1
    
    // Update level
    setPlayerLevel(newLevel)
    setDisplayLevel(newLevel)
    localStorage.setItem('player_level', newLevel.toString())
    
    // Reset XP to 0 for the new level
    setActualXP(0)
    setXpProgress(0)
    localStorage.setItem('player_xp_progress', '0')
    
    // Increment level-up count
    const levelUpCount = parseInt(localStorage.getItem('level_up_count') || '0', 10) + 1
    localStorage.setItem('level_up_count', levelUpCount.toString())
    
    console.log(`🐛 DEBUG: Level up ${currentLevel} → ${newLevel}`)
    
    // Check for lifeline unlocks
    const lifelineUnlockOrder: LifelineType[] = ['skip', 'artistLetterReveal', 'songLetterReveal', 'multipleChoiceArtist', 'multipleChoiceSong']
    const nextLifelineToUnlock = lifelineUnlockOrder[unlockedLifelines.length]
    
    // Check for hat unlock (when reaching player level 4)
    if (newLevel === 4 && !hatUnlocked) {
      setHatUnlocked(true)
      localStorage.setItem('hat_unlocked', 'true')
      startLevelUpAnimation(null, true, newLevel)
      console.log('🎩 DEBUG: Hat unlocked! (reached player level', newLevel, ', level-up event #' + levelUpCount + ')')
    } else if (nextLifelineToUnlock) {
      // Show level-up animation with lifeline
      setUnlockedLifelines([...unlockedLifelines, nextLifelineToUnlock])
      localStorage.setItem('unlocked_lifelines', JSON.stringify([...unlockedLifelines, nextLifelineToUnlock]))
      startLevelUpAnimation(nextLifelineToUnlock, false, newLevel)
      console.log('🐛 DEBUG: Lifeline unlocked:', nextLifelineToUnlock, '(reached player level', newLevel, ', level-up event #' + levelUpCount + ')')
    }
  }

  // Close level-up modal
  const closeLevelUpModal = () => {
    // Start fly-down animation
    setFlyDownPrize(true)
    console.log('🚀 Starting fly-down animation')
    
    // After fly-down animation, fade out the overlay and reset
    setTimeout(() => {
      setShowLevelUpModal(false)
      setNewlyUnlockedLifeline(null)
      setShowOpenPrize(false)
      setShowModalContent(false)
      setShowClosedPrize(false)
      setFlyDownPrize(false)
      
      // Immediately animate in the next prize icon (no delay)
      setAnimateNextPrize(true)
      console.log('✨ Animating next prize icon into place')
      
      // Reset animation state after it completes
      setTimeout(() => {
        setAnimateNextPrize(false)
      }, 800)
    }, 400)
  }

  // Close hat unlock modal
  const closeHatUnlockModal = () => {
    // Start fly-down animation
    setFlyDownPrize(true)
    console.log('🚀 Starting fly-down animation (hat)')
    
    // After fly-down animation, fade out the overlay and reset
    setTimeout(() => {
      setShowHatUnlockModal(false)
      setShowOpenPrize(false)
      setShowModalContent(false)
      setShowClosedPrize(false)
      setFlyDownPrize(false)
      
      // Immediately animate in the next prize icon (no delay)
      setAnimateNextPrize(true)
      console.log('✨ Animating next prize icon into place')
      
      // Reset animation state after it completes
      setTimeout(() => {
        setAnimateNextPrize(false)
      }, 800)
    }, 400)
  }

  const handleXPReset = () => {
    localStorage.setItem('player_xp_progress', '0')
    localStorage.setItem('player_level', '1')
    localStorage.removeItem('unlocked_lifelines')
    localStorage.removeItem('lifeline_recharge_progress')
    localStorage.removeItem('lifeline_recharge_snapshot')
    localStorage.removeItem('level_up_count')
    localStorage.removeItem('hat_unlocked')
    localStorage.removeItem('player_name')
    localStorage.removeItem('playlist_progress')
    
    // Clear Daily Challenge cooldowns for all playlists
    playlists.forEach(playlist => {
      const completedKey = `daily_challenge_completed_${playlist}`
      localStorage.removeItem(completedKey)
    })
    localStorage.removeItem('completed_songs')
    localStorage.removeItem('playlists_with_new_songs')
    
    // Clear all playlist stats (including collections and master mode ranks)
    playlists.forEach(playlist => {
      localStorage.removeItem(`playlist_stats_${playlist}`)
      localStorage.removeItem(`new_songs_${playlist}`)
      localStorage.removeItem(`master_mode_rank_${playlist}`)
    })
    setXpProgress(0)
    setActualXP(0)
    setPlayerLevel(1)
    setDisplayLevel(1)
    setUnlockedLifelines([])
    setHatUnlocked(false)
    setPlayerName('')
    setShowNamePrompt(true)
    setPlaylistsWithNewSongs(new Set())
    // Reset all playlist progress to 0 segments
    setPlaylistProgress({
      '2020s': { progress: 0 },
      '2010s': { progress: 0 },
      '2000s': { progress: 0 },
      '90s': { progress: 0 },
      'Iconic Songs': { progress: 0 },
      'Most Streamed Songs': { progress: 0 }
    })
    // Reset all playlist stats
    const emptyStats: Record<string, any> = {}
    playlists.forEach(playlist => {
      emptyStats[playlist] = { timesPlayed: 0, averageScore: 0, highestScore: 0, completedSongs: [] }
    })
    setPlaylistStats(emptyStats)
    
    // Clear Daily Challenge timers state
    setDailyChallengeTimers({})
    
    // Clear viewed Daily Challenge buttons
    localStorage.removeItem('viewed_daily_challenge_buttons')
    setDailyChallengeNewBadges(new Set())
    
    // Clear viewed Master Mode buttons
    localStorage.removeItem('viewed_master_mode_buttons')
    setMasterModeNewBadges(new Set())
    
    console.log('XP Reset: Progress cleared, level reset to 1, all lifelines locked, hat removed, player name cleared, all playlist progress reset to 0, NEW badges cleared, all stats (including Master Mode ranks) cleared, Daily Challenge cooldowns and viewed buttons cleared, Master Mode viewed buttons cleared')
  }

  // Debug hotkey: Press Up arrow while hovering over a playlist to rank it up
  useEffect(() => {
    const handleDebugHotkey = (event: KeyboardEvent) => {
      // Only trigger if a playlist is hovered
      if (!hoveredPlaylist) return
      
      // Trigger on ArrowUp key
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        console.log('🐛 DEBUG: Up arrow pressed for', hoveredPlaylist)
        handleDebugRankUp(hoveredPlaylist)
      }
    }
    
    window.addEventListener('keydown', handleDebugHotkey)
    return () => window.removeEventListener('keydown', handleDebugHotkey)
  }, [hoveredPlaylist, playlistProgress])


  return (
    <div className="playlist-container">
      {/* Name Input Prompt */}
      {showNamePrompt && (
        <div className="name-prompt-overlay">
          <div className="name-prompt-modal">
            <h2 className="name-prompt-title">Welcome to Song Quiz!</h2>
            <p className="name-prompt-subtitle">What's your name?</p>
            <input 
              type="text"
              className="name-input"
              placeholder="Enter your name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleNameSubmit()
                }
              }}
              autoFocus
              maxLength={20}
            />
            <button 
              className="name-submit-btn"
              onClick={handleNameSubmit}
              disabled={!nameInput.trim()}
            >
              Let's Play!
            </button>
          </div>
        </div>
      )}

      <div className="playlist-content">
        <header className="header">
          <img 
            src="/assets/Song Quiz Horizontal logo.png" 
            alt="Song Quiz Logo" 
            className="logo"
          />
        </header>

        {/* Circular XP Meter */}
        <div 
          className="xp-bar-container-circular"
          onMouseEnter={() => setIsHoveringXPBar(true)}
          onMouseLeave={() => setIsHoveringXPBar(false)}
        >
          <div className="circular-xp-container-menu">
            <div className="circular-progress-wrapper">
              {/* Prize Icon Above Level Number Box */}
              {!(showClosedPrize || showOpenPrize || showLevelUpModal || showHatUnlockModal) && (
                <div className={`prize-icon-above ${animateNextPrize ? 'next-prize-appear' : ''}`}>
                  {displayLevel === 3 ? (
                    <img src="/assets/LevelUp_Present_Closed.png" alt="Present" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <img src="/assets/LevelUp_TreasureChest_Closed.png" alt="Treasure" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  )}
                </div>
              )}
              
              {/* Level Number Behind Avatar */}
              <div className="level-number-display">
                <span className="level-number">{playerLevel}</span>
              </div>
              
              <svg className="circular-progress-svg" viewBox="0 0 200 200">
                {/* Background circle */}
                <circle
                  className="circular-progress-bg"
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke="rgba(60, 60, 60, 1)"
                  strokeWidth="12"
                />
                {/* Progress circle */}
                <circle
                  className="circular-progress-fill"
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke="url(#xpGradientMenu)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray="534.07"
                  strokeDashoffset={534.07 - (534.07 * xpProgress) / 100}
                  transform="rotate(-90 100 100)"
                />
                <defs>
                  <linearGradient id="xpGradientMenu" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4ECDC4" />
                    <stop offset="100%" stopColor="#44A08D" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Avatar in center */}
              <div className="circular-xp-avatar">
                <img 
                  src={hatUnlocked ? "/assets/CatHatNeutral.png" : "/assets/CatNeutral.png"}
                  alt="Player Avatar" 
                  className="avatar-in-circle"
                />
              </div>
              
              {/* XP Text */}
              <div className="circular-xp-text">{actualXP}/{getXPRequiredForLevel(playerLevel)}</div>
            </div>
          </div>
        </div>

        {/* Player Name Below XP Meter */}
        <div className="player-name-below-xp">{playerName || 'Player'}</div>
        
        <main className="main">
          <section className="playlist-selection">
            
            <div className="playlist-buttons">
              {playlists.map((playlist) => {
                const progressData = playlistProgress[playlist] || { progress: 0 }
                const progress = progressData.progress
                const rank = getRankFromProgress(progress)
                const masterModeUnlocked = isMasterModeUnlocked(progress)
                const classNameMap: Record<string, string> = {
                  '2020s': 'playlist-2020s',
                  '2010s': 'playlist-2010s',
                  '2000s': 'playlist-2000s',
                  '90s': 'playlist-90s',
                  'Iconic Songs': 'playlist-iconic',
                  'Most Streamed Songs': 'playlist-most-streamed'
                }

                const stats = playlistStats[playlist] || { timesPlayed: 0, averageScore: 0, highestScore: 0 }
                const isHovered = hoveredPlaylist === playlist

                return (
                  <div 
                    key={playlist} 
                    className="playlist-item-with-meter"
                    onMouseEnter={() => setHoveredPlaylist(playlist)}
                    onMouseLeave={() => setHoveredPlaylist(null)}
                  >
                    {/* Inline Stats Display */}
                    <div className={`inline-stats ${isHovered ? 'visible' : ''}`}>
                      <div className="inline-stats-content">
                        {/* Master Mode Rank - Only show if player has attempted Master Mode */}
                        {(() => {
                          const masterModeRankKey = `master_mode_rank_${playlist}`
                          const bestRank = parseInt(localStorage.getItem(masterModeRankKey) || '0')
                          
                          if (bestRank > 0 && bestRank <= 10) {
                            return (
                              <div className="master-rank-section">
                                <div className="master-rank-label">Master Mode Rank</div>
                                <div className="master-rank-display">
                                  {bestRank === 1 ? (
                                    <div className="rank-emoji">🥇</div>
                                  ) : bestRank === 2 ? (
                                    <div className="rank-emoji">🥈</div>
                                  ) : bestRank === 3 ? (
                                    <div className="rank-emoji">🥉</div>
                                  ) : (
                                    <div className="rank-number">#{bestRank}</div>
                                  )}
                                </div>
                              </div>
                            )
                          }
                          return null
                        })()}
                        
                        <div className="inline-stats-row">
                          <div className="inline-stat">
                            <div className="inline-stat-icon">🎮</div>
                            <div className="inline-stat-value">{stats.timesPlayed}</div>
                            <div className="inline-stat-label">Played</div>
                          </div>
                          <div className="inline-stat">
                            <div className="inline-stat-icon">📊</div>
                            <div className="inline-stat-value">{stats.averageScore.toFixed(0)}</div>
                            <div className="inline-stat-label">Avg Score</div>
                          </div>
                          <div className="inline-stat">
                            <div className="inline-stat-icon">🏆</div>
                            <div className="inline-stat-value">{stats.highestScore}</div>
                            <div className="inline-stat-label">High Score</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button 
                      className={`playlist-button ${classNameMap[playlist]}`}
                      onClick={() => handlePlaylistSelect(playlist)}
                      disabled={selectedPlaylist !== null}
                    >
                      {/* Daily Challenge Button - Shows for Gold Tier and above */}
                      {progress >= 10 && (
                        <button
                          className={`daily-challenge-button ${!isDailyChallengeAvailable(playlist) ? 'disabled' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (isDailyChallengeAvailable(playlist)) {
                              setDailyChallengePlaylist(playlist)
                              setShowDailyChallengeModal(true)
                            }
                          }}
                          onMouseEnter={() => handleDailyChallengeButtonHover(playlist)}
                          title={isDailyChallengeAvailable(playlist) ? "Daily Challenge" : "Come back later"}
                          disabled={!isDailyChallengeAvailable(playlist)}
                        >
                          {dailyChallengeNewBadges.has(playlist) && (
                            <div className="daily-challenge-new-badge">NEW</div>
                          )}
                          <img 
                            src="/assets/PM_FireNote.png"
                            alt="Daily Challenge"
                            className="daily-challenge-icon"
                          />
                          {!isDailyChallengeAvailable(playlist) && dailyChallengeTimers[playlist] && (
                            <div className="daily-challenge-timer">
                              {dailyChallengeTimers[playlist]}
                            </div>
                          )}
                        </button>
                      )}

                      {/* Master Mode Button - Shows for Platinum Tier (15 segments) */}
                      {masterModeUnlocked && (
                        <button
                          className="master-mode-button-small"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePlaylistSelect(playlist, true)
                          }}
                          onMouseEnter={() => handleMasterModeButtonHover(playlist)}
                          title="Master Mode"
                          disabled={selectedPlaylist !== null}
                        >
                          {masterModeNewBadges.has(playlist) && (
                            <div className="master-mode-new-badge">NEW</div>
                          )}
                          <img 
                            src="/assets/PM_WinnerPodium.png"
                            alt="Master Mode"
                            className="master-mode-icon"
                          />
                        </button>
                      )}
                      <span className="decade">{playlist}</span>
                    </button>
                    
                    <div className="playlist-meter-row">
                      {/* Playlist Progress Meter - 15 segments with bronze/silver/gold backgrounds */}
                      {!masterModeUnlocked ? (
                        <div className="playlist-tier-meter">
                          {Array.from({ length: 15 }).map((_, index) => {
                            // Determine segment background tier
                            let segmentRank: PlaylistRank = 'bronze'
                            if (index >= 10) segmentRank = 'gold'
                            else if (index >= 5) segmentRank = 'silver'
                            
                            return (
                              <div
                                key={index}
                                className={`playlist-segment ${segmentRank}-segment ${index < progress ? 'filled' : ''}`}
                              />
                            )
                          })}
                        </div>
                      ) : (
                        <div className="playlist-mastered-text">
                          MASTERED
                        </div>
                      )}

                      {/* Medal Button */}
                      <div className="playlist-medal-wrapper">
                        {playlistsWithNewSongs.has(playlist) && (
                          <div className="new-songs-badge">NEW</div>
                        )}
                        <button
                          className="playlist-medal-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMedalClick(playlist, rank)
                          }}
                          aria-label={`View ${playlist} ${rank} rank details`}
                        >
                          <img 
                            src={getMedalImage(rank)}
                            alt={`${rank} Medal`}
                            className="playlist-medal-icon"
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {selectedPlaylist && (
              <div className="selection-feedback">
                <p>✨ You selected the <strong>{selectedPlaylist}</strong> playlist{selectedMasterMode ? ' - Master Mode!' : '!'}</p>
                <p><em>{selectedMasterMode ? '⚡ Entering speed challenge...' : 'Starting game...'}</em></p>
              </div>
            )}
          </section>
        </main>

        {/* Debug Panel */}
        <div className="debug-panel-menu">
          <div className="debug-label-menu">DEBUG</div>
          <button 
            className="debug-button-menu"
            onClick={handleXPReset}
          >
            XP Reset
          </button>
        </div>
      </div>

      {/* Collection Menu Modal */}
      {showCollectionMenu && (
        <CollectionMenu
          playlist={collectionPlaylist}
          rank={collectionRank}
          onClose={handleCloseCollectionMenu}
        />
      )}

      {/* Daily Challenge Modal */}
      {showDailyChallengeModal && (
        <div 
          className={`daily-challenge-modal-backdrop ${dailyChallengeClosing ? 'closing' : ''}`}
          onClick={handleCloseDailyChallengeModal}
        >
          <div 
            className={`daily-challenge-modal ${dailyChallengeClosing ? 'closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Fire Note Icon and Title */}
            <div className="daily-challenge-header">
              <img 
                src="/assets/PM_FireNote.png"
                alt="Daily Challenge"
                className="daily-challenge-header-icon"
              />
              <h2 className="daily-challenge-title">Daily Challenge</h2>
            </div>

            {/* Playlist Name */}
            <div className="daily-challenge-playlist-name">
              {dailyChallengePlaylist}
            </div>

            {/* Challenge Details Box */}
            <div className="daily-challenge-details-box">
              <div className="daily-challenge-emoji-icon">📖</div>
              <div className="daily-challenge-info">
                <div className="daily-challenge-name">Trivial Playlist</div>
                <div className="daily-challenge-description">Test your Trivia Knowledge</div>
              </div>
            </div>

            {/* Play Button */}
            <button 
              className="daily-challenge-play-button"
              onClick={handleDailyChallengePlay}
            >
              PLAY
            </button>
          </div>
        </div>
      )}

      {/* Level Up Multi-Stage Animation */}
      {(showClosedPrize || showOpenPrize || showLevelUpModal || showHatUnlockModal) && (
        <div className={`level-up-modal-overlay ${flyDownPrize ? 'overlay-fade-out' : ''}`}>
          {/* Stage 1 & 2: Closed prize (with optional shake) */}
          {showClosedPrize && (
            <div className={`prize-icon-large ${shakeClosedPrize ? 'shake' : ''} ${flyDownPrize ? 'fly-down' : ''}`}>
              <img 
                src={prizeType === 'present' ? '/assets/LevelUp_Present_Closed.png' : '/assets/LevelUp_TreasureChest_Closed.png'} 
                alt="Prize" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              />
            </div>
          )}
          
          {/* Stage 3: Open prize with fireworks */}
          {showOpenPrize && !showModalContent && (
            <div className="prize-icon-large prize-opening">
              <div className="fireworks-container">
                <div className="firework firework-1">✨</div>
                <div className="firework firework-2">💫</div>
                <div className="firework firework-3">⭐</div>
                <div className="firework firework-4">✨</div>
                <div className="firework firework-5">💫</div>
                <div className="firework firework-6">⭐</div>
                <div className="firework firework-7">✨</div>
                <div className="firework firework-8">💫</div>
              </div>
              <img 
                src={prizeType === 'present' ? '/assets/LevelUp_Present_Open.png' : '/assets/LevelUp_TreasureChest_Open.png'} 
                alt="Prize Opening" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              />
            </div>
          )}
          
          {/* Stage 4: Full modal with content */}
          {showModalContent && (
            <div className={`level-up-modal ${flyDownPrize ? 'fade-out' : ''}`}>
              <div className={`level-up-present-icon ${flyDownPrize ? 'fly-down-to-xp' : ''}`}>
                <img 
                  src={prizeType === 'present' ? '/assets/LevelUp_Present_Open.png' : '/assets/LevelUp_TreasureChest_Open.png'} 
                  alt="Prize" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                />
              </div>
              
              {showHatUnlockModal ? (
                <>
                  <h2 className="level-up-title">New Avatar Item!</h2>
                  <div className="level-up-lifeline-display">
                    <img 
                      src="/assets/Hat.png" 
                      alt="Hat" 
                      className="hat-unlock-image"
                    />
                  </div>
                  <button className="level-up-confirm-btn" onClick={closeHatUnlockModal}>
                    Continue
                  </button>
                </>
              ) : (
                <>
                  <h2 className="level-up-title">New Lifeline Unlocked!</h2>
                  <div className="level-up-lifeline-display">
                    {newlyUnlockedLifeline === 'skip' && (
                      <>
                        <div className="level-up-icon">🔄</div>
                        <div className="level-up-lifeline-name">Song Swap</div>
                      </>
                    )}
                    {newlyUnlockedLifeline === 'artistLetterReveal' && (
                      <>
                        <div className="level-up-icon">👤 <span className="small-emoji">🔤</span></div>
                        <div className="level-up-lifeline-name">Letter Reveal: Artist</div>
                      </>
                    )}
                    {newlyUnlockedLifeline === 'songLetterReveal' && (
                      <>
                        <div className="level-up-icon">🎵 <span className="small-emoji">🔤</span></div>
                        <div className="level-up-lifeline-name">Letter Reveal: Song</div>
                      </>
                    )}
                    {newlyUnlockedLifeline === 'multipleChoiceArtist' && (
                      <>
                        <div className="level-up-icon">
                          <div className="emoji-grid">
                            <span>👤</span><span>👤</span>
                            <span>👤</span><span>👤</span>
                          </div>
                        </div>
                        <div className="level-up-lifeline-name">Multiple Choice: Artist</div>
                      </>
                    )}
                    {newlyUnlockedLifeline === 'multipleChoiceSong' && (
                      <>
                        <div className="level-up-icon">
                          <div className="emoji-grid">
                            <span>🎵</span><span>🎵</span>
                            <span>🎵</span><span>🎵</span>
                          </div>
                        </div>
                        <div className="level-up-lifeline-name">Multiple Choice: Song</div>
                      </>
                    )}
                  </div>
                  <button className="level-up-confirm-btn" onClick={closeLevelUpModal}>
                    Continue
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PlaylistSelection

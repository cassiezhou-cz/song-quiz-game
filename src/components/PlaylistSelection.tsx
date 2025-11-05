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
  const [xpProgress, setXpProgress] = useState(0) // 0-100 percentage
  const [actualXP, setActualXP] = useState(0) // Actual XP value (not percentage)
  const [playerLevel, setPlayerLevel] = useState(1) // Player's current level
  const [displayLevel, setDisplayLevel] = useState(1) // Level to display on XP bar icon (delays update until modal dismissed)
  const [unlockedLifelines, setUnlockedLifelines] = useState<LifelineType[]>([])
  const [hatUnlocked, setHatUnlocked] = useState(false)
  
  // Player name state
  const [playerName, setPlayerName] = useState('')
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [nameInput, setNameInput] = useState('')

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
    console.log('XP Reset: Progress cleared, level reset to 1, all lifelines locked, hat removed, player name cleared, all playlist progress reset to 0, NEW badges cleared, and all stats (including Master Mode ranks) cleared')
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
      {/* Player Avatar */}
      <div className="player-avatar-container">
        <div className="player-avatar-image-wrapper">
          <img 
            src={hatUnlocked ? "/assets/CatHatNeutral.png" : "/assets/CatNeutral.png"}
            alt="Player Avatar" 
            className="player-avatar-image"
          />
        </div>
        <div className="player-avatar-label">{playerName || 'Player'}</div>
      </div>

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

        {/* XP Bar */}
        <div className="xp-bar-container">
          <div className="xp-bar">
            <div 
              className="xp-fill" 
              style={{ width: `${xpProgress}%` }}
            ></div>
            <div className="xp-bar-text">{actualXP}/{getXPRequiredForLevel(playerLevel)}</div>
          </div>
          <div className="xp-mystery-circle">
            <span className="treasure-icon">
              {displayLevel === 3 ? (
                '🎁'
              ) : (
                <img src="/assets/TreasureChest.png" alt="Treasure" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              )}
            </span>
            <span className="mystery-icon">{playerLevel}</span>
          </div>
        </div>
        
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
                        <button 
                          className="master-mode-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePlaylistSelect(playlist, true)
                          }}
                          disabled={selectedPlaylist !== null}
                        >
                          Master Mode
                        </button>
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
    </div>
  )
}

export default PlaylistSelection

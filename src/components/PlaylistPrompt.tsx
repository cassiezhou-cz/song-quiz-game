import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './PlaylistPrompt.css'

type PlaylistRank = 'bronze' | 'silver' | 'gold' | 'platinum'

// PLAYLIST XP SYSTEM - Each level requires 20 more XP than the previous
const getPlaylistXPRequired = (level: number): number => {
  return 50 + ((level - 1) * 20) // Level 1: 50, Level 2: 70, Level 3: 90, etc.
}

interface PlaylistStats {
  timesPlayed: number
  averageScore: number
  highestScore: number
}

interface PlaylistPromptProps {
  playlist: string
  level: number
  xp: number
  rank: PlaylistRank
  stats: PlaylistStats
  masterModeUnlocked: boolean
  onClose: () => void
  onStartDailyChallenge: () => void
}

const PlaylistPrompt = ({ 
  playlist, 
  level,
  xp, 
  rank, 
  stats,
  masterModeUnlocked,
  onClose,
  onStartDailyChallenge
}: PlaylistPromptProps) => {
  const navigate = useNavigate()
  
  // Check if Event is unlocked (Level 5 or above)
  const eventUnlocked = level >= 5
  console.log(`🎯🎯🎯 PlaylistPrompt for "${playlist}": level=${level}, eventUnlocked=${eventUnlocked}, disabled=${!eventUnlocked}`)

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Debug hotkeys for quick navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      
      if (event.key === 'Escape') {
        event.preventDefault()
        console.log('🐛 DEBUG: ESC pressed - closing prompt')
        onClose()
      } else if (key === 'q') {
        event.preventDefault()
        console.log('🐛 DEBUG: Q pressed - triggering Play button')
        handlePlay()
      } else if (key === 'w') {
        if (eventUnlocked) {
          event.preventDefault()
          console.log('🐛 DEBUG: W pressed - triggering Event button')
          handleEvent()
        } else {
          console.log('🐛 DEBUG: W pressed - Event button locked (need Level 5)')
        }
      } else if (key === 'e') {
        if (masterModeUnlocked) {
          event.preventDefault()
          console.log('🐛 DEBUG: E pressed - triggering Master button')
          handleMasterMode()
        } else {
          console.log('🐛 DEBUG: E pressed - Master button locked')
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [level, masterModeUnlocked, onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const xpRequired = getPlaylistXPRequired(level)

  const handlePlay = () => {
    const gameVersion = 'Version B'
    const url = `/game/${playlist}?version=${encodeURIComponent(gameVersion)}&level=${level}`
    navigate(url)
  }

  const handleMasterMode = () => {
    const gameVersion = 'Version C'
    const url = `/game/${playlist}?version=${encodeURIComponent(gameVersion)}&level=${level}`
    navigate(url)
  }

  const handleEvent = () => {
    console.log(`🎯 Event button CLICKED - level=${level}, will start=${level >= 5}`)
    if (level >= 5) {
      onStartDailyChallenge()
    }
  }

  // Get playlist description
  const getPlaylistDescription = (playlistName: string): string => {
    const descriptions: { [key: string]: string } = {
      '2020s': 'Jam out to these modern classics!',
      '2010s': 'A collection of 2010\'s hits!',
      '2000s': 'Smash hits from the turn of the century!',
      '90s': 'Radical songs from the 90\'s!',
      'Iconic Songs': 'A playlist of familiar ear worms!',
      'Most Streamed Songs': 'You just can\'t get enough of these hit songs!'
    }
    return descriptions[playlistName] || ''
  }

  return (
    <div className="playlist-prompt-backdrop" onClick={handleBackdropClick}>
      <div className="playlist-prompt-modal">
        <div className="playlist-prompt-content">
          {/* Playlist Name */}
          <header className="prompt-header">
            <h1 className="prompt-playlist-title">{playlist}</h1>
            <p className="prompt-playlist-description">{getPlaylistDescription(playlist)}</p>
          </header>

          {/* Stats Section */}
          <div className="prompt-stats-section">
            <div className="prompt-stats-grid">
              <div className="prompt-stat-card">
                <div className="prompt-stat-icon">🎮</div>
                <div className="prompt-stat-value">{stats.timesPlayed}</div>
                <div className="prompt-stat-label">Times Played</div>
              </div>
              <div className="prompt-stat-card">
                <div className="prompt-stat-icon">📊</div>
                <div className="prompt-stat-value">{stats.averageScore.toFixed(0)}</div>
                <div className="prompt-stat-label">Average Score</div>
              </div>
              <div className="prompt-stat-card">
                <div className="prompt-stat-icon">🏆</div>
                <div className="prompt-stat-value">{stats.highestScore}</div>
                <div className="prompt-stat-label">High Score</div>
              </div>
            </div>
          </div>

          {/* Playlist Meter */}
          <div className="prompt-meter-section">
            {level < 7 ? (
              <div className="prompt-meter-container">
                <div className="prompt-meter-bar-bg">
                  <div 
                    className="prompt-meter-bar-fill"
                    style={{ width: `${(xp / xpRequired) * 100}%` }}
                  />
                  <div className="prompt-meter-text">
                    {xp}/{xpRequired}
                  </div>
                </div>
                <div className="prompt-level-badge">{level}</div>
              </div>
            ) : (
              <div className="prompt-mastered-container">
                <div className="prompt-mastered-text">
                  MASTERED
                </div>
              </div>
            )}
          </div>

          {/* Button Section */}
          <div className="prompt-buttons-section">
            <button className="prompt-button prompt-play-button" onClick={handlePlay}>
              Play
            </button>
            <button 
              className={`prompt-button prompt-event-button ${!eventUnlocked ? 'locked' : ''}`}
              onClick={handleEvent}
              disabled={!eventUnlocked}
              title={!eventUnlocked ? "Unlock at Level 5" : "Event - Play Anytime!"}
            >
              {!eventUnlocked && (
                <div className="button-lock-badge">
                  <span className="lock-emoji">🔒</span>
                  <div className="button-level-badge">5</div>
                </div>
              )}
              Event
            </button>
            <button 
              className={`prompt-button prompt-master-button ${!masterModeUnlocked ? 'locked' : ''}`}
              onClick={handleMasterMode}
              disabled={!masterModeUnlocked}
              title={!masterModeUnlocked ? "Unlock at Level 7" : "Master"}
            >
              {!masterModeUnlocked && (
                <div className="button-lock-badge">
                  <span className="lock-emoji">🔒</span>
                  <div className="button-level-badge">7</div>
                </div>
              )}
              Master
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlaylistPrompt


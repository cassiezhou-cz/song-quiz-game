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
  endlessModeUnlocked: boolean
  endlessModeRank?: number // Player's best rank on Endless Mode leaderboard
  onClose: () => void
}

const PlaylistPrompt = ({ 
  playlist, 
  level,
  xp, 
  rank, 
  stats,
  endlessModeUnlocked,
  endlessModeRank,
  onClose
}: PlaylistPromptProps) => {
  const navigate = useNavigate()
  
  console.log(`🎯🎯🎯 PlaylistPrompt for "${playlist}": level=${level}`)

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
      } else if (key === 'e') {
        if (endlessModeUnlocked) {
          event.preventDefault()
          console.log('🐛 DEBUG: E pressed - triggering Endless button')
          handleEndlessMode()
        } else {
          console.log('🐛 DEBUG: E pressed - Endless button locked')
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [level, endlessModeUnlocked, onClose])

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

  const handleEndlessMode = () => {
    const gameVersion = 'Version C'
    const url = `/game/${playlist}?version=${encodeURIComponent(gameVersion)}&level=${level}`
    navigate(url)
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

          {/* Playlist Meter or Endless Mode Rank */}
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
              <div className="prompt-endless-rank-container">
                <div className="prompt-endless-rank-label">GLOBAL ENDLESS RANK</div>
                <div className="prompt-endless-rank-value">
                  #{endlessModeRank || '—'}
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
              className={`prompt-button prompt-endless-button ${!endlessModeUnlocked ? 'locked' : ''}`}
              onClick={handleEndlessMode}
              disabled={!endlessModeUnlocked}
              title={!endlessModeUnlocked ? "Unlock at Level 7" : "Endless"}
            >
              {!endlessModeUnlocked && (
                <div className="button-lock-badge">
                  <span className="lock-emoji">🔒</span>
                  <div className="button-level-badge">7</div>
                </div>
              )}
              Endless
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlaylistPrompt


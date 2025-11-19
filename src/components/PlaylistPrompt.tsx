import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './PlaylistPrompt.css'

type PlaylistRank = 'bronze' | 'silver' | 'gold' | 'platinum'

// PLAYLIST XP SYSTEM - Each level requires 20 more XP than the previous
const getPlaylistXPRequired = (level: number): number => {
  return 100 + ((level - 1) * 20) // Level 1: 100, Level 2: 120, Level 3: 140, etc.
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
  isDailyChallengeAvailable: boolean
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
  isDailyChallengeAvailable,
  masterModeUnlocked,
  onClose,
  onStartDailyChallenge
}: PlaylistPromptProps) => {
  const navigate = useNavigate()

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

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
    if (isDailyChallengeAvailable && level >= 5) {
      onStartDailyChallenge()
    }
  }

  // Check if Daily Challenge is unlocked (Level 5 or above)
  const eventUnlocked = level >= 5

  return (
    <div className="playlist-prompt-backdrop" onClick={handleBackdropClick}>
      <div className="playlist-prompt-modal">
        <div className="playlist-prompt-content">
          {/* Playlist Name */}
          <header className="prompt-header">
            <h1 className="prompt-playlist-title">{playlist}</h1>
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
            {level < 10 ? (
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
              className={`prompt-button prompt-event-button ${!eventUnlocked || !isDailyChallengeAvailable ? 'locked' : ''}`}
              onClick={handleEvent}
              disabled={!eventUnlocked || !isDailyChallengeAvailable}
              title={!eventUnlocked ? "Unlock at Level 5" : !isDailyChallengeAvailable ? "Come back later" : "Daily Challenge"}
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
              title={!masterModeUnlocked ? "Unlock at Level 10" : "Master"}
            >
              {!masterModeUnlocked && (
                <div className="button-lock-badge">
                  <span className="lock-emoji">🔒</span>
                  <div className="button-level-badge">10</div>
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


import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './PlaylistDetails.css'

interface CompletedSong {
  id: string
  artist: string
  song: string
  albumArt: string
}

interface PlaylistStats {
  timesPlayed: number
  averageScore: number
  highestScore: number
  completedSongs: CompletedSong[]
}

interface PlaylistDetailsProps {
  playlist: string
  tier: number
  isMasterMode: boolean
  onClose: () => void
}

const PlaylistDetails = ({ playlist, tier, isMasterMode, onClose }: PlaylistDetailsProps) => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<PlaylistStats>({
    timesPlayed: 0,
    averageScore: 0,
    highestScore: 0,
    completedSongs: []
  })

  useEffect(() => {
    if (!playlist) return

    // Load playlist-specific stats from localStorage
    const statsKey = `playlist_stats_${playlist}`
    const savedStats = localStorage.getItem(statsKey)
    
    if (savedStats) {
      try {
        const parsed = JSON.parse(savedStats)
        setStats(parsed)
      } catch (e) {
        console.error('Failed to parse playlist stats:', e)
      }
    }
  }, [playlist])

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const handleStartGame = () => {
    const gameVersion = isMasterMode ? 'Version C' : 'Version B'
    const url = `/game/${playlist}?version=${encodeURIComponent(gameVersion)}&tier=${tier}`
    navigate(url)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Get all songs for this playlist to display collection
  const getAllPlaylistSongs = () => {
    // This will need to match your song structure
    // For now, returning completed songs as IDs
    return stats.completedSongs
  }

  const getMedalImage = (tier: number): string => {
    if (tier === 1) return '/assets/MedalBronze.png'
    if (tier === 2) return '/assets/MedalSilver.png'
    return '/assets/MedalGold.png'
  }

  return (
    <div className="playlist-details-modal-backdrop" onClick={handleBackdropClick}>
      <div className="playlist-details-modal">
        <div className="playlist-details-content">
          <header className="details-header">
            <h1 className="playlist-title-large">{playlist}</h1>
            <img 
              src={getMedalImage(tier)}
              alt={`Tier ${tier} Medal`}
              className="playlist-medal-large"
            />
          </header>

        <div className="stats-section">
          <h2 className="section-title">Your Stats</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🎮</div>
              <div className="stat-value">{stats.timesPlayed}</div>
              <div className="stat-label">Times Played</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-value">{stats.averageScore.toFixed(0)}</div>
              <div className="stat-label">Average Score</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏆</div>
              <div className="stat-value">{stats.highestScore}</div>
              <div className="stat-label">Highest Score</div>
            </div>
          </div>
        </div>

        <div className="collection-section">
          <h2 className="section-title">
            Your Collection 
            <span className="collection-count">({stats.completedSongs.length} songs)</span>
          </h2>
          <div className="collection-grid">
            {stats.completedSongs.length === 0 ? (
              <div className="empty-collection">
                <div className="empty-icon">🎵</div>
                <p>No songs completed yet</p>
                <p className="empty-subtitle">Start playing to build your collection!</p>
              </div>
            ) : (
              stats.completedSongs.map((song, index) => (
                <div key={song.id || index} className="collection-item">
                  <img 
                    src={song.albumArt} 
                    alt={`${song.song} by ${song.artist}`}
                    className="collection-album-art"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const placeholder = target.nextElementSibling as HTMLElement
                      if (placeholder) {
                        placeholder.style.display = 'flex'
                      }
                    }}
                  />
                  <div className="collection-item-placeholder" style={{ display: 'none' }}>
                    <span className="note-icon">🎵</span>
                  </div>
                  <div className="collection-item-info">
                    <div className="collection-item-song">{song.song}</div>
                    <div className="collection-item-artist">{song.artist}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="action-section">
          {isMasterMode && (
            <div className="master-mode-badge">
              ⚡ Master Mode ⚡
            </div>
          )}
          <button className="start-game-button" onClick={handleStartGame}>
            {isMasterMode ? 'Start Master Mode' : 'Start Game'}
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}

export default PlaylistDetails


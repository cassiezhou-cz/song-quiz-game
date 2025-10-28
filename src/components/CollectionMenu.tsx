import { useState, useEffect } from 'react'
import './CollectionMenu.css'

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

interface CollectionMenuProps {
  playlist: string
  tier: number
  onClose: () => void
}

const CollectionMenu = ({ playlist, tier, onClose }: CollectionMenuProps) => {
  const [stats, setStats] = useState<PlaylistStats>({
    timesPlayed: 0,
    averageScore: 0,
    highestScore: 0,
    completedSongs: []
  })
  const [newSongIds, setNewSongIds] = useState<Set<string>>(new Set())

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

    // Load new songs for this playlist
    const newSongsKey = `new_songs_${playlist}`
    const savedNewSongs = localStorage.getItem(newSongsKey)
    if (savedNewSongs) {
      try {
        const parsed = JSON.parse(savedNewSongs) as string[]
        setNewSongIds(new Set(parsed))
        console.log(`✨ Loaded ${parsed.length} new songs for ${playlist}`)
      } catch (e) {
        console.error('Failed to parse new songs:', e)
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleClose = () => {
    // Clear all new song badges for this playlist when closing
    if (newSongIds.size > 0) {
      const newSongsKey = `new_songs_${playlist}`
      localStorage.removeItem(newSongsKey)
      console.log(`✅ Cleared all NEW song badges for ${playlist}`)
    }
    onClose()
  }

  const handleSongHover = (songId: string) => {
    if (newSongIds.has(songId)) {
      // Remove this song from the new songs set
      const updated = new Set(newSongIds)
      updated.delete(songId)
      setNewSongIds(updated)
      
      // Update localStorage
      const newSongsKey = `new_songs_${playlist}`
      if (updated.size === 0) {
        localStorage.removeItem(newSongsKey)
      } else {
        localStorage.setItem(newSongsKey, JSON.stringify([...updated]))
      }
      console.log(`✅ Cleared NEW badge for song: ${songId}`)
    }
  }

  const getMedalImage = (tier: number): string => {
    if (tier === 1) return '/assets/MedalBronze.png'
    if (tier === 2) return '/assets/MedalSilver.png'
    return '/assets/MedalGold.png'
  }

  return (
    <div className="collection-menu-backdrop" onClick={handleBackdropClick}>
      <div className="collection-menu-modal">
        <div className="collection-menu-content">
          <header className="collection-header">
            <h1 className="collection-title-large">{playlist}</h1>
            <img 
              src={getMedalImage(tier)}
              alt={`Tier ${tier} Medal`}
              className="collection-medal-large"
            />
          </header>

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
                stats.completedSongs.map((song, index) => {
                  const isNewSong = newSongIds.has(song.id)
                  return (
                    <div 
                      key={song.id || index} 
                      className="collection-item"
                      onMouseEnter={() => handleSongHover(song.id)}
                    >
                      {isNewSong && (
                        <div className="collection-new-badge">NEW</div>
                      )}
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
                  )
                })
              )}
            </div>
          </div>

          <div className="action-section">
            <button className="close-collection-button" onClick={handleClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CollectionMenu


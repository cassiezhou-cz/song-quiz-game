import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './PlaylistSelection.css'

const PlaylistSelection = () => {
  const navigate = useNavigate()
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<string>('Version A')
  const [xpProgress, setXpProgress] = useState(0) // 0-100 percentage

  // Load XP from localStorage on mount
  useEffect(() => {
    const savedXP = parseInt(localStorage.getItem('player_xp_progress') || '0', 10)
    setXpProgress(Math.min(savedXP, 100)) // Cap at 100
  }, [])

  const handlePlaylistSelect = (playlist: string) => {
    setSelectedPlaylist(playlist)
    console.log(`Selected playlist: ${playlist}, Version: ${selectedVersion}`)
    
    // Navigate to game with version parameter after a brief moment to show selection feedback
    const url = `/game/${playlist}?version=${encodeURIComponent(selectedVersion)}`
    console.log('🚀 NAVIGATING TO:', url, 'Version:', selectedVersion)
    setTimeout(() => {
      navigate(url)
    }, 1000)
  }

  const handleVersionSelect = (version: string) => {
    setSelectedVersion(version)
    console.log(`Selected version: ${version}`)
  }

  const handleXPReset = () => {
    localStorage.setItem('player_xp_progress', '0')
    setXpProgress(0)
    console.log('XP Reset: Progress cleared')
  }

  return (
    <div className="playlist-container">
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
          </div>
          <div className="xp-mystery-circle">
            <span className="treasure-icon">🎁</span>
            <span className="mystery-icon">?</span>
          </div>
        </div>
        
        <main className="main">
          <section className="playlist-selection">
            
            <div className="playlist-buttons">
              <button 
                className="playlist-button playlist-2020s"
                onClick={() => handlePlaylistSelect('2020s')}
                disabled={selectedPlaylist !== null}
              >
                <span className="decade">2020s</span>
              </button>
              
              <button 
                className="playlist-button playlist-2010s"
                onClick={() => handlePlaylistSelect('2010s')}
                disabled={selectedPlaylist !== null}
              >
                <span className="decade">2010s</span>
              </button>
              
              <button 
                className="playlist-button playlist-2000s"
                onClick={() => handlePlaylistSelect('2000s')}
                disabled={selectedPlaylist !== null}
              >
                <span className="decade">2000s</span>
              </button>
              
              <button 
                className="playlist-button playlist-90s"
                onClick={() => handlePlaylistSelect('90s')}
                disabled={selectedPlaylist !== null}
              >
                <span className="decade">90s</span>
              </button>
            </div>

            <div className="version-selection">
              <h3 className="version-title">Choose Game Version</h3>
              <div className="version-buttons">
                <button 
                  className={`version-button ${selectedVersion === 'Version A' ? 'selected' : ''}`}
                  onClick={() => handleVersionSelect('Version A')}
                  disabled={selectedPlaylist !== null}
                >
                  Version A
                </button>
                
                <button 
                  className={`version-button ${selectedVersion === 'Version B' ? 'selected' : ''}`}
                  onClick={() => handleVersionSelect('Version B')}
                  disabled={selectedPlaylist !== null}
                >
                  Version B
                </button>
                
                <button 
                  className={`version-button ${selectedVersion === 'Version C' ? 'selected' : ''}`}
                  onClick={() => handleVersionSelect('Version C')}
                  disabled={selectedPlaylist !== null}
                >
                  Version C
                </button>
              </div>
            </div>

            {selectedPlaylist && (
              <div className="selection-feedback">
                <p>✨ You selected the <strong>{selectedPlaylist}</strong> playlist with <strong>{selectedVersion}</strong>!</p>
                <p><em>Starting game...</em></p>
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
    </div>
  )
}

export default PlaylistSelection

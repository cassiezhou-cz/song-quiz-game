import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './PlaylistSelection.css'

const PlaylistSelection = () => {
  const navigate = useNavigate()
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)

  const handlePlaylistSelect = (playlist: string) => {
    setSelectedPlaylist(playlist)
    console.log(`Selected playlist: ${playlist}`)
    
    // Navigate to game after a brief moment to show selection feedback
    setTimeout(() => {
      navigate(`/game/${playlist}`)
    }, 1000)
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
            </div>

            {selectedPlaylist && (
              <div className="selection-feedback">
                <p>✨ You selected the <strong>{selectedPlaylist}</strong> playlist!</p>
                <p><em>Starting game...</em></p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

export default PlaylistSelection

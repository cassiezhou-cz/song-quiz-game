import { useState } from 'react'
import './App.css'

function App() {
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)

  const handlePlaylistSelect = (playlist: string) => {
    setSelectedPlaylist(playlist)
    console.log(`Selected playlist: ${playlist}`)
    // TODO: Navigate to playlist or implement playlist logic
  }

  return (
    <>
      <div className="container">
        <header className="header">
          <h1>🎵 Song Play for Playtests</h1>
          <p>Choose your musical era for playtesting</p>
        </header>
        
        <main className="main">
          <section className="playlist-selection">
            <h2>Select a Playlist</h2>
            <p>Pick a decade to start your music testing session:</p>
            
            <div className="playlist-buttons">
              <button 
                className="playlist-button playlist-2020s"
                onClick={() => handlePlaylistSelect('2020s')}
              >
                <span className="decade">2020s</span>
                <span className="description">Current hits & trends</span>
              </button>
              
              <button 
                className="playlist-button playlist-2010s"
                onClick={() => handlePlaylistSelect('2010s')}
              >
                <span className="decade">2010s</span>
                <span className="description">Pop, EDM & indie favorites</span>
              </button>
              
              <button 
                className="playlist-button playlist-2000s"
                onClick={() => handlePlaylistSelect('2000s')}
              >
                <span className="decade">2000s</span>
                <span className="description">Y2K classics & nostalgia</span>
              </button>
            </div>

            {selectedPlaylist && (
              <div className="selection-feedback">
                <p>✨ You selected the <strong>{selectedPlaylist}</strong> playlist!</p>
                <p><em>Playlist functionality coming soon...</em></p>
              </div>
            )}
          </section>
        </main>
        
        <footer className="footer">
          <p>Song Play for Playtests © 2024</p>
        </footer>
      </div>
    </>
  )
}

export default App

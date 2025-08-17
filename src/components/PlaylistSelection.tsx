import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './PlaylistSelection.css'

interface AIHostCharacter {
  id: string
  name: string
  emoji: string
  description: string
  personality: string
}

const aiHostCharacters: AIHostCharacter[] = [
  {
    id: 'none',
    name: 'No Host',
    emoji: '🔇',
    description: 'Silent quiz experience',
    personality: 'none'
  },
  {
    id: 'riley',
    name: 'Riley',
    emoji: '🎤',
    description: 'Energetic & enthusiastic',
    personality: 'energetic'
  },
  {
    id: 'willow',
    name: 'Willow',
    emoji: '🌿',
    description: 'Calm & wise mentor',
    personality: 'wise'
  },
  {
    id: 'alex',
    name: 'Alex',
    emoji: '🎧',
    description: 'Cool DJ vibes',
    personality: 'cool'
  },
  {
    id: 'jordan',
    name: 'Jordan',
    emoji: '😄',
    description: 'Funny & witty comedian',
    personality: 'funny'
  }
]

const PlaylistSelection = () => {
  const navigate = useNavigate()
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [selectedHost, setSelectedHost] = useState<string>('riley')

  // Load selected host from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('selectedAIHost')
    if (saved) {
      setSelectedHost(saved)
    }
  }, [])

  // Save selected host to localStorage whenever it changes
  const selectHost = (hostId: string) => {
    setSelectedHost(hostId)
    localStorage.setItem('selectedAIHost', hostId)
  }

  const handlePlaylistSelect = (playlist: string) => {
    setSelectedPlaylist(playlist)
    console.log(`Selected playlist: ${playlist}`)
    
    // Navigate to game after a brief moment to show selection feedback
    setTimeout(() => {
      navigate(`/game/${playlist}`)
    }, 1000)
  }

  return (
    <div className="playlist-container" style={{ position: 'relative', minHeight: '100vh' }}>
      <div className="playlist-content">
        <header className="header">
          <img 
            src="/assets/Song Quiz Horizontal logo.png" 
            alt="Song Quiz Logo" 
            className="logo"
          />
        </header>
        
        <main className="main" style={{ paddingBottom: '120px' }}>
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

        {/* AI Host Character Selection */}
        <div className="host-selection" style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '15px',
          padding: '15px',
          zIndex: 999,
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          minWidth: '400px',
          maxWidth: '500px'
        }}>
          <h4 style={{
            margin: '0 0 10px 0',
            color: 'white',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            Choose Your Host
          </h4>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {aiHostCharacters.map(character => (
              <button
                key={character.id}
                onClick={() => selectHost(character.id)}
                style={{
                  background: selectedHost === character.id ? '#E146EF' : 'rgba(255, 255, 255, 0.1)',
                  border: selectedHost === character.id ? '2px solid #E146EF' : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  minWidth: '70px',
                  minHeight: '50px'
                }}
              >
                <div style={{ fontSize: '1.3rem' }}>{character.emoji}</div>
                <div style={{ fontWeight: '500', fontSize: '0.75rem' }}>{character.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlaylistSelection

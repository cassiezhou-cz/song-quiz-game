import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './NameEntry.css'

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

function NameEntry() {
  const [playerName, setPlayerName] = useState('')
  const [selectedHost, setSelectedHost] = useState<string>('riley')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

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

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (playerName.trim().length < 1) {
      return
    }

    setIsSubmitting(true)
    
    // Store name and selected host in localStorage for persistence
    localStorage.setItem('playerName', playerName.trim())
    localStorage.setItem('selectedAIHost', selectedHost)
    
    // Navigate to playlist selection after brief feedback
    setTimeout(() => {
      navigate('/playlists')
    }, 800)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerName(e.target.value)
  }

  return (
    <div className="name-entry-container">
      <div className="name-entry-content">
        <header className="header">
          <img 
            src="/assets/Song Quiz Horizontal logo.png" 
            alt="Song Quiz Logo" 
            className="logo"
          />
        </header>
        
        <main className="main">
          <section className="name-entry-section">
            <h1 className="welcome-title">Welcome to Song Quiz!</h1>
            
            <form onSubmit={handleNameSubmit} className="name-form">
              <div className="input-group">
                <label htmlFor="playerName" className="name-label">
                  What's your name?
                </label>
                <input
                  type="text"
                  id="playerName"
                  value={playerName}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  className="name-input"
                  disabled={isSubmitting}
                  autoFocus
                  maxLength={50}
                />
              </div>

              {/* AI Host Selection */}
              <div className="host-selection-group">
                <label className="host-label">Choose Your Host</label>
                <div className="host-options">
                  {aiHostCharacters.map(character => (
                    <button
                      key={character.id}
                      type="button"
                      onClick={() => selectHost(character.id)}
                      className={`host-button ${selectedHost === character.id ? 'selected' : ''}`}
                      disabled={isSubmitting}
                    >
                      <div className="host-emoji">{character.emoji}</div>
                      <div className="host-name">{character.name}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              <button 
                type="submit" 
                className="continue-button"
                disabled={playerName.trim().length < 1 || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading-spinner"></span>
                    Getting Ready...
                  </>
                ) : (
                  'Continue to Playlists'
                )}
              </button>
            </form>
          </section>
        </main>
      </div>
    </div>
  )
}

export default NameEntry

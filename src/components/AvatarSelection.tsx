import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './AvatarSelection.css'

type AvatarType = 'Cat' | 'Boy' | 'Girl' | 'Corgi' | 'Robot' | 'Panda'

const avatars: AvatarType[] = ['Cat', 'Boy', 'Girl', 'Corgi', 'Robot', 'Panda']

const AvatarSelection = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarType | null>(null)
  const [hoveredAvatar, setHoveredAvatar] = useState<AvatarType | null>(null)

  // Get player name from location state (passed from name entry)
  const playerName = location.state?.playerName || localStorage.getItem('player_name') || 'Player'

  const handleAvatarSelect = (avatar: AvatarType) => {
    setSelectedAvatar(avatar)
  }

  const handleContinue = () => {
    if (selectedAvatar) {
      // Save selected avatar to localStorage
      localStorage.setItem('player_avatar', selectedAvatar)
      console.log('🎭 Player avatar set to:', selectedAvatar)
      
      // Navigate to playlist selection
      navigate('/')
    }
  }

  return (
    <div className="avatar-selection-container">
      <div className="avatar-selection-content">
        <h1 className="avatar-selection-title">Choose Your Avatar</h1>
        <p className="avatar-selection-subtitle">Welcome, {playerName}!</p>
        
        <div className="avatars-grid">
          {avatars.map((avatar) => (
            <div
              key={avatar}
              className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''} ${hoveredAvatar === avatar ? 'hovered' : ''}`}
              onClick={() => handleAvatarSelect(avatar)}
              onMouseEnter={() => setHoveredAvatar(avatar)}
              onMouseLeave={() => setHoveredAvatar(null)}
            >
              <div className="avatar-image-wrapper">
                <img
                  src={`/assets/${avatar}Neutral.png`}
                  alt={`${avatar} avatar`}
                  className="avatar-image"
                />
                {selectedAvatar === avatar && (
                  <div className="avatar-checkmark">✓</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          className="continue-btn"
          onClick={handleContinue}
          disabled={!selectedAvatar}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

export default AvatarSelection


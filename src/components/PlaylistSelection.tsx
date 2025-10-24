import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './PlaylistSelection.css'

type LifelineType = 'skip' | 'artistLetterReveal' | 'songLetterReveal' | 'multipleChoiceArtist' | 'multipleChoiceSong'

const PlaylistSelection = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [xpProgress, setXpProgress] = useState(0) // 0-100 percentage
  const [playerLevel, setPlayerLevel] = useState(1) // Player's current level
  const [unlockedLifelines, setUnlockedLifelines] = useState<LifelineType[]>([])
  const [lifelineRechargeProgress, setLifelineRechargeProgress] = useState<Partial<Record<LifelineType, number>>>({})
  const [hatUnlocked, setHatUnlocked] = useState(false)
  
  // Player name state
  const [playerName, setPlayerName] = useState('')
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [nameInput, setNameInput] = useState('')
  
  // Track previous progress to detect changes and trigger animations
  const previousRechargeProgress = useRef<Partial<Record<LifelineType, number>>>({})
  const [newlyLitLights, setNewlyLitLights] = useState<Record<string, boolean>>({}) // e.g., "skip-1": true
  const [newlyRechargedLifelines, setNewlyRechargedLifelines] = useState<LifelineType[]>([])
  const hasLoadedInitial = useRef(false)

  // Debug: Log whenever newlyLitLights changes
  useEffect(() => {
    if (Object.keys(newlyLitLights).length > 0) {
      console.log('🎨 RENDER: newlyLitLights state changed:', newlyLitLights)
      console.log('🎨 These segments should have fill-animation class now')
    }
  }, [newlyLitLights])

  // Load data whenever we navigate to this page
  useEffect(() => {
    console.log('🔄 PlaylistSelection mounted/navigated, location:', location.pathname)
    
    // Check for player name first
    const savedName = localStorage.getItem('player_name')
    if (savedName) {
      setPlayerName(savedName)
      console.log('👤 Loaded player name:', savedName)
    } else {
      // Show name prompt if no name is saved
      setShowNamePrompt(true)
      console.log('👤 No player name found, showing prompt')
    }
    
    const savedXP = parseInt(localStorage.getItem('player_xp_progress') || '0', 10)
    setXpProgress(Math.min(savedXP, 100))
    
    const savedLevel = parseInt(localStorage.getItem('player_level') || '1', 10)
    setPlayerLevel(savedLevel)
    
    const savedHatUnlocked = localStorage.getItem('hat_unlocked')
    setHatUnlocked(savedHatUnlocked === 'true')
    
    const savedLifelines = localStorage.getItem('unlocked_lifelines')
    if (savedLifelines) {
      try {
        const parsed = JSON.parse(savedLifelines) as LifelineType[]
        setUnlockedLifelines(parsed)
        console.log('📋 Loaded unlocked lifelines:', parsed)
      } catch (e) {
        console.error('Failed to parse unlocked lifelines:', e)
        setUnlockedLifelines([])
      }
    }
    
    const savedRecharge = localStorage.getItem('lifeline_recharge_progress')
    const previousSnapshot = localStorage.getItem('lifeline_recharge_snapshot')
    
    console.log('📦 Raw localStorage data:')
    console.log('  - lifeline_recharge_progress:', savedRecharge)
    console.log('  - lifeline_recharge_snapshot:', previousSnapshot)
    
    if (savedRecharge) {
      try {
        const currentProgress = JSON.parse(savedRecharge) as Partial<Record<LifelineType, number>>
        console.log('🔋 Current progress (parsed):', currentProgress)
        
        // Check if we have a snapshot to compare against
        if (previousSnapshot && !hasLoadedInitial.current) {
          try {
            const prevProgress = JSON.parse(previousSnapshot) as Partial<Record<LifelineType, number>>
            console.log('📸 Previous snapshot (parsed):', prevProgress)
            
            // Set the previous progress for comparison
            previousRechargeProgress.current = prevProgress
            
            // Now set current progress, which will trigger the detection useEffect
            setLifelineRechargeProgress(currentProgress)
            
            hasLoadedInitial.current = true
            console.log('✅ Setup complete - animations should trigger if there are changes')
          } catch (e) {
            console.error('Failed to parse previous snapshot:', e)
            previousRechargeProgress.current = currentProgress
            setLifelineRechargeProgress(currentProgress)
          }
        } else {
          // No snapshot or already loaded
          if (!hasLoadedInitial.current) {
            // First load without snapshot - set previous to empty so animations trigger for existing progress
            console.log('ℹ️ No snapshot found on first load - will trigger animations for existing progress')
            previousRechargeProgress.current = {}
            hasLoadedInitial.current = true
            setLifelineRechargeProgress(currentProgress)
          } else {
            // Already loaded - just update current
            console.log('ℹ️ Already loaded, just updating current progress')
            setLifelineRechargeProgress(currentProgress)
          }
        }
      } catch (e) {
        console.error('Failed to parse lifeline recharge progress:', e)
        setLifelineRechargeProgress({})
      }
    }
  }, [location])
  
  // Detect recharge progress changes and trigger animations
  useEffect(() => {
    const prev = previousRechargeProgress.current
    const current = lifelineRechargeProgress
    
    console.log('🔍 Detection useEffect triggered')
    console.log('  hasLoadedInitial:', hasLoadedInitial.current)
    console.log('  Previous keys:', Object.keys(prev))
    console.log('  Current keys:', Object.keys(current))
    
    // Skip if no current data
    if (Object.keys(current).length === 0) {
      console.log('⏭️ No current data, skipping')
      return
    }
    
    // Allow empty previous data - this means we'll animate all current progress (first time scenario)
    
    const newLitLights: Record<string, boolean> = {}
    const recharged: LifelineType[] = []
    
    console.log('🔍 Checking for recharge changes...')
    console.log('  Previous:', JSON.stringify(prev))
    console.log('  Current:', JSON.stringify(current))
    console.log('  Unlocked lifelines:', unlockedLifelines)
    
    // Check each lifeline for progress changes
    for (const lifeline of unlockedLifelines) {
      const prevProgress = prev[lifeline] !== undefined ? prev[lifeline]! : 3
      const currentProgress = current[lifeline] !== undefined ? current[lifeline]! : 3
      
      // If lifeline was fully charged (3) and now is recharging (< 3), treat as starting from 0
      // This handles the case where a lifeline was just used and is now recharging
      const wasFullyCharged = prevProgress === 3 && currentProgress < 3
      
      // If lifeline is being tracked for the first time (in current but not in prev), treat as starting from 0
      const isFirstTimeTracking = prev[lifeline] === undefined && currentProgress < 3
      
      const effectivePrevProgress = (wasFullyCharged || isFirstTimeTracking) ? 0 : prevProgress
      
      const statusText = wasFullyCharged ? ' (JUST USED - animating from 0!)' : (isFirstTimeTracking ? ' (first time tracking)' : '')
      console.log(`  ${lifeline}: ${effectivePrevProgress} → ${currentProgress}${statusText}`)
      
      // Skip if no change
      if (effectivePrevProgress === currentProgress) {
        console.log(`    No change for ${lifeline}`)
        continue
      }
      
      const changeText = wasFullyCharged ? ' (FIRST CHARGE after use!)' : (isFirstTimeTracking ? ' (first charge!)' : '')
      console.log(`🔋 CHANGE DETECTED for ${lifeline}: ${effectivePrevProgress} → ${currentProgress}${changeText}`)
      
      // Check which lights just lit up
      for (let i = 1; i <= 3; i++) {
        if (effectivePrevProgress < i && currentProgress >= i) {
          const lightKey = `${lifeline}-${i}`
          newLitLights[lightKey] = true
          console.log(`✨ Light ${i} will animate for ${lifeline} (key: ${lightKey})`)
          console.log(`   Condition: ${effectivePrevProgress} < ${i} AND ${currentProgress} >= ${i}`)
        }
      }
      
      // Debug: show what we're checking
      console.log(`   Checking segments 1-3 for ${lifeline}:`)
      for (let i = 1; i <= 3; i++) {
        console.log(`     Segment ${i}: prev=${effectivePrevProgress}, curr=${currentProgress}, shouldAnimate=${effectivePrevProgress < i && currentProgress >= i}`)
      }
      
      // Check if lifeline just became fully recharged
      if (effectivePrevProgress < 3 && currentProgress >= 3) {
        recharged.push(lifeline)
        console.log(`🎉 ${lifeline} is fully recharged!`)
      }
    }
    
    // Trigger animations if there are changes
    if (Object.keys(newLitLights).length > 0) {
      console.log('🎬 TRIGGERING LIGHT-UP ANIMATIONS:', newLitLights)
      console.log('🎬 Setting newlyLitLights state to:', newLitLights)
      setNewlyLitLights(newLitLights)
      
      // Log to verify state was set
      setTimeout(() => {
        console.log('🔍 Verify: newlyLitLights should now be:', newLitLights)
      }, 100)
      
      setTimeout(() => {
        console.log('🧹 Clearing light-up animations after 2.5s')
        setNewlyLitLights({})
      }, 2500) // Extended to 2.5s to ensure animation completes
    } else {
      console.log('❌ No light-up animations to trigger')
      console.log('   Current state:', current)
      console.log('   Previous state:', prev)
    }
    
    if (recharged.length > 0) {
      console.log('🎬 TRIGGERING RECHARGE ANIMATIONS:', recharged)
      setNewlyRechargedLifelines(recharged)
      setTimeout(() => {
        console.log('🧹 Clearing recharge animations')
        setNewlyRechargedLifelines([])
      }, 2000)
    } else {
      console.log('❌ No recharge animations to trigger')
    }
    
    // Update previous progress for next comparison
    console.log('💾 Updating previous progress to current')
    previousRechargeProgress.current = current
  }, [lifelineRechargeProgress, unlockedLifelines])

  const handlePlaylistSelect = (playlist: string) => {
    setSelectedPlaylist(playlist)
    console.log(`Selected playlist: ${playlist}, Version: Version B`)
    
    // Save a snapshot of current recharge progress before navigating (for animation detection on return)
    const currentRecharge = localStorage.getItem('lifeline_recharge_progress')
    if (currentRecharge) {
      localStorage.setItem('lifeline_recharge_snapshot', currentRecharge)
      console.log('📸 Saved recharge progress snapshot before navigating to game')
    }
    
    // Navigate to game with Version B after a brief moment to show selection feedback
    const url = `/game/${playlist}?version=Version%20B`
    console.log('🚀 NAVIGATING TO:', url, 'Version: Version B')
    setTimeout(() => {
      navigate(url)
    }, 1000)
  }

  const handleNameSubmit = () => {
    if (nameInput.trim()) {
      const trimmedName = nameInput.trim()
      localStorage.setItem('player_name', trimmedName)
      setPlayerName(trimmedName)
      setShowNamePrompt(false)
      setNameInput('')
      console.log('👤 Player name set to:', trimmedName)
    }
  }

  const handleXPReset = () => {
    localStorage.setItem('player_xp_progress', '0')
    localStorage.setItem('player_level', '1')
    localStorage.removeItem('unlocked_lifelines')
    localStorage.removeItem('lifeline_recharge_progress')
    localStorage.removeItem('lifeline_recharge_snapshot')
    localStorage.removeItem('level_up_count')
    localStorage.removeItem('hat_unlocked')
    localStorage.removeItem('player_name')
    setXpProgress(0)
    setPlayerLevel(1)
    setUnlockedLifelines([])
    setLifelineRechargeProgress({})
    setHatUnlocked(false)
    setPlayerName('')
    setShowNamePrompt(true)
    previousRechargeProgress.current = {}
    hasLoadedInitial.current = false
    console.log('XP Reset: Progress cleared, level reset to 1, all lifelines locked, recharge status reset, hat removed, and player name cleared')
  }

  return (
    <div className="playlist-container">
      {/* Player Avatar */}
      <div className="player-avatar-container">
        <div className="player-avatar-image-wrapper">
          <img 
            src={hatUnlocked ? "/assets/CatHatNeutral.png" : "/assets/CatNeutral.png"}
            alt="Player Avatar" 
            className="player-avatar-image"
          />
        </div>
        <div className="player-avatar-label">{playerName || 'Player'}</div>
      </div>

      {/* Name Input Prompt */}
      {showNamePrompt && (
        <div className="name-prompt-overlay">
          <div className="name-prompt-modal">
            <h2 className="name-prompt-title">Welcome to Song Quiz!</h2>
            <p className="name-prompt-subtitle">What's your name?</p>
            <input 
              type="text"
              className="name-input"
              placeholder="Enter your name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleNameSubmit()
                }
              }}
              autoFocus
              maxLength={20}
            />
            <button 
              className="name-submit-btn"
              onClick={handleNameSubmit}
              disabled={!nameInput.trim()}
            >
              Let's Play!
            </button>
          </div>
        </div>
      )}

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
            <span className="mystery-icon">{playerLevel}</span>
          </div>
        </div>

        {/* Available Lifelines Display */}
        {unlockedLifelines.length > 0 && (
          <div className="available-lifelines-container">
            <div className="available-lifelines-header">Available Lifelines</div>
            <div className="available-lifelines-list">
              {unlockedLifelines.map((lifeline) => {
                const rechargeProgress = lifelineRechargeProgress[lifeline] || 3 // Default to 3 (fully charged)
                const isRecharging = rechargeProgress < 3
                const isNewlyRecharged = newlyRechargedLifelines.includes(lifeline)
                
                return (
                  <div key={lifeline} className={`lifeline-display-item ${isRecharging ? 'recharging' : ''} ${isNewlyRecharged ? 'newly-recharged' : ''}`}>
                    {lifeline === 'skip' && (
                      <>
                        <div className="lifeline-display-icon">🔄</div>
                        <div className="lifeline-display-name">Song Swap</div>
                        <div className={`battery-meter ${rechargeProgress >= 3 ? 'fully-charged' : ''}`}>
                          <div className="battery-body">
                            <div className={`battery-segment ${rechargeProgress >= 1 ? 'filled' : ''} ${newlyLitLights['skip-1'] ? 'fill-animation' : ''}`}></div>
                            <div className={`battery-segment ${rechargeProgress >= 2 ? 'filled' : ''} ${newlyLitLights['skip-2'] ? 'fill-animation' : ''}`}></div>
                            <div className={`battery-segment ${rechargeProgress >= 3 ? 'filled' : ''} ${newlyLitLights['skip-3'] ? 'fill-animation' : ''}`}></div>
                          </div>
                          <div className="battery-tip"></div>
                        </div>
                        {isNewlyRecharged && (
                          <div className="recharged-label">RECHARGED</div>
                        )}
                      </>
                    )}
                    {lifeline === 'artistLetterReveal' && (
                      <>
                        <div className="lifeline-display-icon">👤 <span className="small-emoji">🔤</span></div>
                        <div className="lifeline-display-name">Letter Reveal: Artist</div>
                        <div className={`battery-meter ${rechargeProgress >= 3 ? 'fully-charged' : ''}`}>
                          <div className="battery-body">
                            <div className={`battery-segment ${rechargeProgress >= 1 ? 'filled' : ''} ${newlyLitLights['artistLetterReveal-1'] ? 'fill-animation' : ''}`}></div>
                            <div className={`battery-segment ${rechargeProgress >= 2 ? 'filled' : ''} ${newlyLitLights['artistLetterReveal-2'] ? 'fill-animation' : ''}`}></div>
                            <div className={`battery-segment ${rechargeProgress >= 3 ? 'filled' : ''} ${newlyLitLights['artistLetterReveal-3'] ? 'fill-animation' : ''}`}></div>
                          </div>
                          <div className="battery-tip"></div>
                        </div>
                        {isNewlyRecharged && (
                          <div className="recharged-label">RECHARGED</div>
                        )}
                      </>
                    )}
                    {lifeline === 'songLetterReveal' && (
                      <>
                        <div className="lifeline-display-icon">🎵 <span className="small-emoji">🔤</span></div>
                        <div className="lifeline-display-name">Letter Reveal: Song</div>
                        <div className={`battery-meter ${rechargeProgress >= 3 ? 'fully-charged' : ''}`}>
                          <div className="battery-body">
                            <div className={`battery-segment ${rechargeProgress >= 1 ? 'filled' : ''} ${newlyLitLights['songLetterReveal-1'] ? 'fill-animation' : ''}`}></div>
                            <div className={`battery-segment ${rechargeProgress >= 2 ? 'filled' : ''} ${newlyLitLights['songLetterReveal-2'] ? 'fill-animation' : ''}`}></div>
                            <div className={`battery-segment ${rechargeProgress >= 3 ? 'filled' : ''} ${newlyLitLights['songLetterReveal-3'] ? 'fill-animation' : ''}`}></div>
                          </div>
                          <div className="battery-tip"></div>
                        </div>
                        {isNewlyRecharged && (
                          <div className="recharged-label">RECHARGED</div>
                        )}
                      </>
                    )}
                    {lifeline === 'multipleChoiceArtist' && (
                      <>
                        <div className="lifeline-display-icon">
                          <div className="emoji-grid-small">
                            <span>👤</span><span>👤</span>
                            <span>👤</span><span>👤</span>
                          </div>
                        </div>
                        <div className="lifeline-display-name">Multiple Choice: Artist</div>
                        <div className={`battery-meter ${rechargeProgress >= 3 ? 'fully-charged' : ''}`}>
                          <div className="battery-body">
                            <div className={`battery-segment ${rechargeProgress >= 1 ? 'filled' : ''} ${newlyLitLights['multipleChoiceArtist-1'] ? 'fill-animation' : ''}`}></div>
                            <div className={`battery-segment ${rechargeProgress >= 2 ? 'filled' : ''} ${newlyLitLights['multipleChoiceArtist-2'] ? 'fill-animation' : ''}`}></div>
                            <div className={`battery-segment ${rechargeProgress >= 3 ? 'filled' : ''} ${newlyLitLights['multipleChoiceArtist-3'] ? 'fill-animation' : ''}`}></div>
                          </div>
                          <div className="battery-tip"></div>
                        </div>
                        {isNewlyRecharged && (
                          <div className="recharged-label">RECHARGED</div>
                        )}
                      </>
                    )}
                    {lifeline === 'multipleChoiceSong' && (
                      <>
                        <div className="lifeline-display-icon">
                          <div className="emoji-grid-small">
                            <span>🎵</span><span>🎵</span>
                            <span>🎵</span><span>🎵</span>
                          </div>
                        </div>
                        <div className="lifeline-display-name">Multiple Choice: Song</div>
                        <div className={`battery-meter ${rechargeProgress >= 3 ? 'fully-charged' : ''}`}>
                          <div className="battery-body">
                            <div className={`battery-segment ${rechargeProgress >= 1 ? 'filled' : ''} ${newlyLitLights['multipleChoiceSong-1'] ? 'fill-animation' : ''}`}></div>
                            <div className={`battery-segment ${rechargeProgress >= 2 ? 'filled' : ''} ${newlyLitLights['multipleChoiceSong-2'] ? 'fill-animation' : ''}`}></div>
                            <div className={`battery-segment ${rechargeProgress >= 3 ? 'filled' : ''} ${newlyLitLights['multipleChoiceSong-3'] ? 'fill-animation' : ''}`}></div>
                          </div>
                          <div className="battery-tip"></div>
                        </div>
                        {isNewlyRecharged && (
                          <div className="recharged-label">RECHARGED</div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
        
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
              
              <button 
                className="playlist-button playlist-iconic"
                onClick={() => handlePlaylistSelect('Iconic Songs')}
                disabled={selectedPlaylist !== null}
              >
                <span className="decade">Iconic Songs</span>
              </button>
              
              <button 
                className="playlist-button playlist-most-streamed"
                onClick={() => handlePlaylistSelect('Most Streamed Songs')}
                disabled={selectedPlaylist !== null}
              >
                <span className="decade">Most Streamed Songs</span>
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

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './PlaylistSelection.css'

type LifelineType = 'skip' | 'artistLetterReveal' | 'songLetterReveal' | 'multipleChoiceArtist' | 'multipleChoiceSong'

const PlaylistSelection = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<string>('Version A')
  const [xpProgress, setXpProgress] = useState(0) // 0-100 percentage
  const [unlockedLifelines, setUnlockedLifelines] = useState<LifelineType[]>([])
  const [lifelineRechargeProgress, setLifelineRechargeProgress] = useState<Partial<Record<LifelineType, number>>>({})
  
  // Track previous progress to detect changes and trigger animations
  const previousRechargeProgress = useRef<Partial<Record<LifelineType, number>>>({})
  const [newlyLitLights, setNewlyLitLights] = useState<Record<string, boolean>>({}) // e.g., "skip-1": true
  const [newlyRechargedLifelines, setNewlyRechargedLifelines] = useState<LifelineType[]>([])
  const hasLoadedInitial = useRef(false)

  // Load data whenever we navigate to this page
  useEffect(() => {
    console.log('🔄 PlaylistSelection mounted/navigated, location:', location.pathname)
    
    const savedXP = parseInt(localStorage.getItem('player_xp_progress') || '0', 10)
    setXpProgress(Math.min(savedXP, 100))
    
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
          // No snapshot or already loaded - just update current
          console.log('ℹ️ No snapshot or already loaded, just updating current progress')
          if (!hasLoadedInitial.current) {
            previousRechargeProgress.current = currentProgress
            hasLoadedInitial.current = true
          }
          setLifelineRechargeProgress(currentProgress)
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
    
    // Skip if no data
    if (Object.keys(current).length === 0) {
      console.log('⏭️ No current data, skipping')
      return
    }
    
    // Skip if no previous data
    if (Object.keys(prev).length === 0) {
      console.log('⏭️ No previous data, skipping (will be set on next check)')
      return
    }
    
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
      
      console.log(`  ${lifeline}: ${prevProgress} → ${currentProgress}`)
      
      // Skip if no change
      if (prevProgress === currentProgress) {
        console.log(`    No change for ${lifeline}`)
        continue
      }
      
      console.log(`🔋 CHANGE DETECTED for ${lifeline}: ${prevProgress} → ${currentProgress}`)
      
      // Check which lights just lit up
      for (let i = 1; i <= 3; i++) {
        if (prevProgress < i && currentProgress >= i) {
          const lightKey = `${lifeline}-${i}`
          newLitLights[lightKey] = true
          console.log(`✨ Light ${i} will animate for ${lifeline}`)
        }
      }
      
      // Check if lifeline just became fully recharged
      if (prevProgress < 3 && currentProgress >= 3) {
        recharged.push(lifeline)
        console.log(`🎉 ${lifeline} is fully recharged!`)
      }
    }
    
    // Trigger animations if there are changes
    if (Object.keys(newLitLights).length > 0) {
      console.log('🎬 TRIGGERING LIGHT-UP ANIMATIONS:', newLitLights)
      setNewlyLitLights(newLitLights)
      setTimeout(() => {
        console.log('🧹 Clearing light-up animations')
        setNewlyLitLights({})
      }, 1000)
    } else {
      console.log('❌ No light-up animations to trigger')
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
    console.log(`Selected playlist: ${playlist}, Version: ${selectedVersion}`)
    
    // Save a snapshot of current recharge progress before navigating (for animation detection on return)
    const currentRecharge = localStorage.getItem('lifeline_recharge_progress')
    if (currentRecharge) {
      localStorage.setItem('lifeline_recharge_snapshot', currentRecharge)
      console.log('📸 Saved recharge progress snapshot before navigating to game')
    }
    
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
    localStorage.removeItem('unlocked_lifelines')
    localStorage.removeItem('lifeline_recharge_progress')
    localStorage.removeItem('lifeline_recharge_snapshot')
    setXpProgress(0)
    setUnlockedLifelines([])
    setLifelineRechargeProgress({})
    previousRechargeProgress.current = {}
    hasLoadedInitial.current = false
    console.log('XP Reset: Progress cleared, all lifelines locked, and recharge status reset')
  }

  // DEBUG: Test recharge animation
  const handleTestRechargeAnimation = () => {
    console.log('🧪 TEST: Simulating recharge progress increment')
    
    // Get current progress
    const currentProgress = { ...lifelineRechargeProgress }
    
    // Increment first lifeline found with progress < 3
    for (const lifeline of unlockedLifelines) {
      const current = currentProgress[lifeline] || 3
      if (current < 3) {
        const newProgress = current + 1
        currentProgress[lifeline] = newProgress
        console.log(`🧪 TEST: Incrementing ${lifeline} from ${current} to ${newProgress}`)
        
        // Update localStorage and state
        localStorage.setItem('lifeline_recharge_progress', JSON.stringify(currentProgress))
        setLifelineRechargeProgress(currentProgress)
        break
      }
    }
  }

  return (
    <div className="playlist-container">
      {/* Player Avatar */}
      <div className="player-avatar-container">
        <div className="player-avatar-image-wrapper">
          <img 
            src="/assets/CatNeutral.png" 
            alt="Player Avatar" 
            className="player-avatar-image"
          />
        </div>
        <div className="player-avatar-label">Player</div>
      </div>

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
                        <div className="recharge-indicators">
                          <div className={`recharge-light ${rechargeProgress >= 1 ? 'lit' : ''} ${newlyLitLights['skip-1'] ? 'light-up' : ''}`}></div>
                          <div className={`recharge-light ${rechargeProgress >= 2 ? 'lit' : ''} ${newlyLitLights['skip-2'] ? 'light-up' : ''}`}></div>
                          <div className={`recharge-light ${rechargeProgress >= 3 ? 'lit' : ''} ${newlyLitLights['skip-3'] ? 'light-up' : ''}`}></div>
                        </div>
                      </>
                    )}
                    {lifeline === 'artistLetterReveal' && (
                      <>
                        <div className="lifeline-display-icon">👤 <span className="small-emoji">🔤</span></div>
                        <div className="lifeline-display-name">Letter Reveal: Artist</div>
                        <div className="recharge-indicators">
                          <div className={`recharge-light ${rechargeProgress >= 1 ? 'lit' : ''} ${newlyLitLights['artistLetterReveal-1'] ? 'light-up' : ''}`}></div>
                          <div className={`recharge-light ${rechargeProgress >= 2 ? 'lit' : ''} ${newlyLitLights['artistLetterReveal-2'] ? 'light-up' : ''}`}></div>
                          <div className={`recharge-light ${rechargeProgress >= 3 ? 'lit' : ''} ${newlyLitLights['artistLetterReveal-3'] ? 'light-up' : ''}`}></div>
                        </div>
                      </>
                    )}
                    {lifeline === 'songLetterReveal' && (
                      <>
                        <div className="lifeline-display-icon">🎵 <span className="small-emoji">🔤</span></div>
                        <div className="lifeline-display-name">Letter Reveal: Song</div>
                        <div className="recharge-indicators">
                          <div className={`recharge-light ${rechargeProgress >= 1 ? 'lit' : ''} ${newlyLitLights['songLetterReveal-1'] ? 'light-up' : ''}`}></div>
                          <div className={`recharge-light ${rechargeProgress >= 2 ? 'lit' : ''} ${newlyLitLights['songLetterReveal-2'] ? 'light-up' : ''}`}></div>
                          <div className={`recharge-light ${rechargeProgress >= 3 ? 'lit' : ''} ${newlyLitLights['songLetterReveal-3'] ? 'light-up' : ''}`}></div>
                        </div>
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
                        <div className="recharge-indicators">
                          <div className={`recharge-light ${rechargeProgress >= 1 ? 'lit' : ''} ${newlyLitLights['multipleChoiceArtist-1'] ? 'light-up' : ''}`}></div>
                          <div className={`recharge-light ${rechargeProgress >= 2 ? 'lit' : ''} ${newlyLitLights['multipleChoiceArtist-2'] ? 'light-up' : ''}`}></div>
                          <div className={`recharge-light ${rechargeProgress >= 3 ? 'lit' : ''} ${newlyLitLights['multipleChoiceArtist-3'] ? 'light-up' : ''}`}></div>
                        </div>
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
                        <div className="recharge-indicators">
                          <div className={`recharge-light ${rechargeProgress >= 1 ? 'lit' : ''} ${newlyLitLights['multipleChoiceSong-1'] ? 'light-up' : ''}`}></div>
                          <div className={`recharge-light ${rechargeProgress >= 2 ? 'lit' : ''} ${newlyLitLights['multipleChoiceSong-2'] ? 'light-up' : ''}`}></div>
                          <div className={`recharge-light ${rechargeProgress >= 3 ? 'lit' : ''} ${newlyLitLights['multipleChoiceSong-3'] ? 'light-up' : ''}`}></div>
                        </div>
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
          <button 
            className="debug-button-menu"
            onClick={handleTestRechargeAnimation}
            style={{ marginTop: '0.5rem' }}
          >
            Test Animation
          </button>
        </div>
      </div>
    </div>
  )
}

export default PlaylistSelection

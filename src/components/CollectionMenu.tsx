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

interface SongInfo {
  funFact: string
  globalAccuracy: number
  wrongName: {
    type: 'song' | 'artist'
    value: string
  }
}

type PlaylistRank = 'bronze' | 'silver' | 'gold' | 'platinum'

interface CollectionMenuProps {
  playlist: string
  rank: PlaylistRank
  onClose: () => void
}

// Generate rhyming wrong names based on the actual song/artist
const generateWrongName = (text: string, seed: number): string => {
  // Rhyme dictionary - maps words to their rhyming alternatives
  const rhymeMap: Record<string, string[]> = {
    // Common song/artist words
    'girl': ['world', 'pearl', 'curl', 'swirl'],
    'boy': ['joy', 'toy', 'roy', 'troy'],
    'love': ['dove', 'above', 'glove', 'shove'],
    'night': ['light', 'fight', 'right', 'sight', 'bright', 'flight'],
    'day': ['way', 'say', 'play', 'stay', 'bay', 'ray', 'may'],
    'me': ['be', 'see', 'free', 'tree', 'key', 'tea'],
    'you': ['true', 'blue', 'few', 'new', 'crew', 'zoo'],
    'here': ['fear', 'near', 'dear', 'clear', 'tear', 'year'],
    'there': ['where', 'care', 'dare', 'fair', 'hair', 'bear'],
    'life': ['wife', 'knife', 'strife', 'rife'],
    'time': ['rhyme', 'climb', 'lime', 'prime', 'mime'],
    'dance': ['chance', 'france', 'lance', 'trance', 'prance'],
    'song': ['long', 'strong', 'wrong', 'kong', 'gong'],
    'heart': ['start', 'part', 'art', 'cart', 'smart'],
    'baby': ['maybe', 'crazy', 'lazy', 'hazy', 'daisy'],
    'man': ['can', 'ran', 'plan', 'dan', 'stan'],
    'woman': ['human', 'roman', 'bowman', 'showman'],
    'fire': ['wire', 'tire', 'higher', 'buyer', 'liar'],
    'rain': ['pain', 'lane', 'chain', 'plane', 'spain', 'cane'],
    'star': ['far', 'car', 'bar', 'jar', 'scar'],
    'dreams': ['seems', 'teams', 'beams', 'streams', 'schemes'],
    'eyes': ['skies', 'lies', 'tries', 'flies', 'ties', 'cries'],
    'feel': ['real', 'deal', 'heal', 'steal', 'wheel'],
    'feelings': ['dealings', 'healings', 'ceilings', 'wheelings'],
    'money': ['honey', 'sunny', 'funny', 'bunny'],
    'town': ['down', 'crown', 'brown', 'clown', 'gown'],
    'street': ['meet', 'beat', 'heat', 'sweet', 'feet'],
    'soul': ['goal', 'roll', 'bowl', 'coal', 'toll', 'hole'],
    'mind': ['find', 'kind', 'blind', 'wind', 'signed'],
    'away': ['today', 'say', 'play', 'stay', 'bay'],
    'home': ['dome', 'rome', 'foam', 'roam', 'chrome'],
    'back': ['track', 'pack', 'jack', 'black', 'crack'],
    'go': ['flow', 'show', 'know', 'grow', 'snow', 'glow'],
    'think': ['blink', 'drink', 'link', 'pink', 'sink'],
    'know': ['show', 'flow', 'grow', 'snow', 'glow', 'throw'],
    'good': ['wood', 'hood', 'stood', 'could'],
    'bad': ['sad', 'mad', 'glad', 'had', 'dad'],
    'little': ['riddle', 'middle', 'fiddle', 'brittle'],
    'big': ['pig', 'fig', 'dig', 'wig', 'twig'],
    // Artist name components
    'perry': ['harry', 'berry', 'terry', 'jerry', 'carey'],
    'taylor': ['sailor', 'tailor', 'trailer', 'jailor'],
    'drake': ['lake', 'cake', 'make', 'break', 'snake'],
    'west': ['best', 'rest', 'test', 'nest', 'guest'],
    'mars': ['stars', 'bars', 'cars', 'jars', 'scars'],
    'styles': ['miles', 'smiles', 'tiles', 'trials', 'files'],
    'grande': ['bande', 'sande', 'branded'],
    'justin': ['dustin', 'rustin', 'tustin', 'augustin'],
    'shawn': ['dawn', 'lawn', 'fawn', 'yawn', 'drawn'],
    'sean': ['bean', 'jean', 'dean', 'lean', 'mean'],
    'travis': ['mavis', 'davis', 'clavis'],
    'kelly': ['belly', 'jelly', 'smelly', 'delly'],
    'bruno': ['juno', 'uno'],
    'billie': ['silly', 'hilly', 'frilly', 'willy', 'milly'],
    'charlie': ['harley', 'barley', 'marley', 'parley'],
    'miley': ['smiley', 'riley', 'wiley', 'kylie'],
    'weeknd': ['weekend', 'weakened'],
    'post': ['most', 'toast', 'coast', 'ghost', 'host'],
    'malone': ['alone', 'stone', 'phone', 'zone', 'cone']
  }
  
  const words = text.toLowerCase().split(' ').filter(w => w.length > 0)
  if (words.length === 0) return text
  
  // Try to find a word that has rhymes
  let replacedIndex = -1
  let replacement = ''
  
  // Use seed to determine which word to try replacing (consistently)
  const startIndex = seed % words.length
  
  for (let i = 0; i < words.length; i++) {
    const idx = (startIndex + i) % words.length
    const word = words[idx].toLowerCase()
    
    // Check for exact match first
    if (rhymeMap[word]) {
      const rhymes = rhymeMap[word]
      replacement = rhymes[seed % rhymes.length]
      replacedIndex = idx
      break
    }
    
    // Check for partial matches (words ending with common patterns)
    for (const [key, rhymes] of Object.entries(rhymeMap)) {
      if (word.endsWith(key) && word !== key) {
        // Word contains a rhymeable ending
        const prefix = word.slice(0, -key.length)
        replacement = prefix + rhymes[seed % rhymes.length]
        replacedIndex = idx
        break
      }
    }
    
    if (replacedIndex !== -1) break
  }
  
  // If we found a replacement, build the new name
  if (replacedIndex !== -1 && replacement) {
    const result = words.map((w, idx) => {
      if (idx === replacedIndex) {
        // Preserve capitalization pattern
        if (w[0] === w[0].toUpperCase()) {
          return replacement.charAt(0).toUpperCase() + replacement.slice(1)
        }
        return replacement
      }
      return text.split(' ')[idx] // Keep original capitalization
    }).join(' ')
    
    return result
  }
  
  // Fallback if no rhyme found - use completely different song/artist names
  const fallbackSongs = [
    'Wonderwall', 'Bohemian Rhapsody', 'Stairway to Heaven', 'Hotel California',
    'Smells Like Teen Spirit', 'Sweet Child O\' Mine', 'Billie Jean', 'Imagine',
    'Hey Jude', 'Like a Rolling Stone', 'Purple Haze', 'Born to Run',
    'Lose Yourself', 'Thriller', 'What\'s Going On', 'I Want to Hold Your Hand',
    'Dancing Queen', 'Every Breath You Take', 'Dreams', 'Mr. Brightside'
  ]
  
  const fallbackArtists = [
    'The Beatles', 'Queen', 'Led Zeppelin', 'Pink Floyd', 'Nirvana',
    'Radiohead', 'David Bowie', 'The Rolling Stones', 'Bob Dylan', 'Prince',
    'Fleetwood Mac', 'The Smiths', 'Joy Division', 'Talking Heads', 'R.E.M.',
    'The Clash', 'The Cure', 'Depeche Mode', 'Oasis', 'Blur'
  ]
  
  // Determine if this looks more like a song or artist name (more than 2 words = likely song)
  const isSong = words.length > 2
  const fallbackList = isSong ? fallbackSongs : fallbackArtists
  
  return fallbackList[seed % fallbackList.length]
}

// Fun song data - generated based on song ID hash
const generateSongInfo = (songId: string, songTitle: string, artist: string): SongInfo => {
  const funFacts = [
    "A 2014 study proclaims that this is the catchiest song of all time",
    "This song was written in under 20 minutes during a studio jam session",
    "The artist recorded this while recovering from laryngitis, creating its unique sound",
    "This track holds the record for most consecutive weeks at #1 in its debut year",
    "The music video was filmed in a single continuous take with no edits",
    "This song was originally rejected by three record labels before becoming a hit",
    "The opening riff was inspired by a dream the artist had",
    "This track features a backwards guitar solo that fans still debate about",
    "The song was recorded in a converted barn in rural England",
    "This became the most-streamed song within 24 hours of its release",
    "The artist wrote this as a tribute to their high school music teacher",
    "This song's beat was created using unconventional kitchen utensils",
    "The chorus melody came to the artist while stuck in traffic",
    "This track was recorded in one take at 3 AM with no rehearsal",
    "The song features a hidden message when played at half speed",
    "Over 200 artists requested to remix this before its official release",
    "This was the first song ever performed live in zero gravity",
    "The vocals were recorded in a bathroom for the natural reverb",
    "This track was composed entirely on a smartphone during a flight",
    "The artist had never played this instrument before recording this song",
    "This song's demo was discovered in a storage unit 10 years later",
    "The bass line was inspired by a washing machine rhythm",
    "This became a surprise hit after being featured in a meme",
    "The artist wrote this song as a bet to create a hit in under an hour",
    "This track was recorded during a thunderstorm, adding natural ambiance",
    "The melody came from a voicemail the artist accidentally recorded",
    "This song was initially written as a jingle for a commercial",
    "The artist performed this 500 times before ever recording it",
    "This track uses samples from a 1920s field recording",
    "The hook was inspired by a conversation overheard at a coffee shop"
  ]
  
  // Use song ID to create deterministic but varied hash
  const hash = songId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  
  // Use combined hash of song title and artist for more uniqueness
  const titleHash = songTitle.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const artistHash = artist.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const combinedHash = hash + titleHash + artistHash
  
  const factIndex = combinedHash % funFacts.length
  const useWrongSongName = combinedHash % 2 === 0
  const accuracy = 45 + (combinedHash % 40) // Random accuracy between 45-85%
  
  // Generate contextually similar wrong name
  const wrongValue = useWrongSongName 
    ? generateWrongName(songTitle, combinedHash)
    : generateWrongName(artist, combinedHash)
  
  return {
    funFact: funFacts[factIndex],
    globalAccuracy: accuracy,
    wrongName: {
      type: useWrongSongName ? 'song' : 'artist',
      value: wrongValue
    }
  }
}

const CollectionMenu = ({ playlist, rank, onClose }: CollectionMenuProps) => {
  const [stats, setStats] = useState<PlaylistStats>({
    timesPlayed: 0,
    averageScore: 0,
    highestScore: 0,
    completedSongs: []
  })
  const [newSongIds, setNewSongIds] = useState<Set<string>>(new Set())
  const [hoveredSong, setHoveredSong] = useState<CompletedSong | null>(null)
  const [hoverPanelPosition, setHoverPanelPosition] = useState<{ top: number, left: number, showAbove: boolean } | null>(null)

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

  const calculatePanelPosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    const panelHeight = 200 // Approximate height of the panel
    const panelWidth = 300
    const gap = 15
    
    // Calculate if panel would go off bottom of viewport
    const spaceBelow = window.innerHeight - rect.bottom
    const showAbove = spaceBelow < panelHeight + gap
    
    // Calculate vertical position
    let top = showAbove 
      ? rect.top - panelHeight - gap 
      : rect.bottom + gap
    
    // Calculate horizontal position (centered on item)
    let left = rect.left + (rect.width / 2) - (panelWidth / 2)
    
    // Adjust if panel would go off right edge
    if (left + panelWidth > window.innerWidth - 20) {
      left = window.innerWidth - panelWidth - 20
    }
    
    // Adjust if panel would go off left edge
    if (left < 20) {
      left = 20
    }
    
    return { top, left, showAbove }
  }

  const handleSongHover = (songId: string, event: React.MouseEvent<HTMLDivElement>) => {
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
    
    // Calculate position for hover panel
    const target = event.currentTarget
    const position = calculatePanelPosition(target)
    setHoverPanelPosition(position)
  }

  const getMedalImage = (rank: PlaylistRank): string => {
    if (rank === 'bronze') return '/assets/MedalBronze.png'
    if (rank === 'silver') return '/assets/MedalSilver.png'
    if (rank === 'gold') return '/assets/MedalGold.png'
    return '/assets/MedalDiamond.png'
  }

  return (
    <div className="collection-menu-backdrop" onClick={handleBackdropClick}>
      <div className="collection-menu-modal">
        <div className="collection-menu-content">
          <header className="collection-header">
            <h1 className="collection-title-large">{playlist}</h1>
            <img 
              src={getMedalImage(rank)}
              alt={`${rank} Medal`}
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
                      onMouseEnter={(e) => {
                        handleSongHover(song.id, e)
                        setHoveredSong(song)
                      }}
                      onMouseLeave={() => {
                        setHoveredSong(null)
                        setHoverPanelPosition(null)
                      }}
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

        {/* Global Hover Info Panel - Rendered outside items to avoid clipping */}
        {hoveredSong && hoverPanelPosition && (
          <div 
            className={`song-hover-info ${hoverPanelPosition.showAbove ? 'above' : ''}`}
            style={{
              top: `${hoverPanelPosition.top}px`,
              left: `${hoverPanelPosition.left}px`
            }}
          >
            <div className="hover-fun-fact">
              💡 {generateSongInfo(hoveredSong.id, hoveredSong.song, hoveredSong.artist).funFact}
            </div>
            <div className="hover-accuracy">
              <span className="globe-icon">🌍</span>
              <span className="accuracy-label">Global Accuracy:</span>
              <span className="accuracy-value">
                {generateSongInfo(hoveredSong.id, hoveredSong.song, hoveredSong.artist).globalAccuracy}%
              </span>
            </div>
            <div className="hover-wrong-name">
              <div className="wrong-name-label">
                Most Common Wrong {generateSongInfo(hoveredSong.id, hoveredSong.song, hoveredSong.artist).wrongName.type === 'song' ? 'Song Name' : 'Artist Name'}:
              </div>
              <div className="wrong-name-value">
                "{generateSongInfo(hoveredSong.id, hoveredSong.song, hoveredSong.artist).wrongName.value}"
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CollectionMenu


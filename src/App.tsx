import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import PlaylistSelection from './components/PlaylistSelection'
import AvatarSelection from './components/AvatarSelection'
import Game from './components/Game'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<PlaylistSelection />} />
          <Route path="/avatar-selection" element={<AvatarSelection />} />
          <Route path="/game/:playlist" element={<Game />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

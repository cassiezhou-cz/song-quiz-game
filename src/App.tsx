import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import NameEntry from './components/NameEntry'
import PlaylistSelection from './components/PlaylistSelection'
import Game from './components/Game'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<NameEntry />} />
          <Route path="/playlists" element={<PlaylistSelection />} />
          <Route path="/game/:playlist" element={<Game />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import PlaylistSelection from './components/PlaylistSelection'
import Game from './components/Game'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<PlaylistSelection />} />
          <Route path="/game/:playlist" element={<Game />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

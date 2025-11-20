import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import MatchView from './pages/MatchView'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route path="/" element={<Home />} />
        
        {/* Match View (Dynamic ID) */}
        <Route path="/match/:id" element={<MatchView />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
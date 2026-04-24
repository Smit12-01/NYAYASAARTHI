import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Emergency from './pages/Emergency'
import About from './pages/About'
import Laws from './pages/Laws'
import ComplaintTemplate from './pages/ComplaintTemplate'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-dark">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/chat"        element={<Chat />} />
          <Route path="/emergency"   element={<Emergency />} />
          <Route path="/about"       element={<About />} />
          <Route path="/laws"        element={<Laws />} />
          <Route path="/complaint"   element={<ComplaintTemplate />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

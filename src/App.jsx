import { Routes, Route, Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Emergency from './pages/Emergency'
import About from './pages/About'
import Laws from './pages/Laws'
import ComplaintTemplate from './pages/ComplaintTemplate'
import LivestreamViewer from './pages/LivestreamViewer'

// Shell layout: Navbar + Footer wrapping child routes
function AppShell() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-dark">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Fullscreen — no Navbar/Footer */}
      <Route path="/livestream/:roomId" element={<LivestreamViewer />} />

      {/* Main app shell */}
      <Route element={<AppShell />}>
        <Route path="/"          element={<Home />} />
        <Route path="/chat"      element={<Chat />} />
        <Route path="/emergency" element={<Emergency />} />
        <Route path="/about"     element={<About />} />
        <Route path="/laws"      element={<Laws />} />
        <Route path="/complaint" element={<ComplaintTemplate />} />
      </Route>
    </Routes>
  )
}

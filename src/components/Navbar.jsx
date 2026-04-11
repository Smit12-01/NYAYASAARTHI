import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Scale, Menu, X, MessageSquare, AlertTriangle, Info, Users, Zap, BookOpen, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const navLinks = [
  { to: '/',           label: 'Home',      icon: Zap },
  { to: '/chat',       label: 'Ask Legal', icon: MessageSquare },
  { to: '/laws',       label: 'Laws',      icon: BookOpen },
  { to: '/complaint',  label: 'Templates', icon: FileText },
  { to: '/emergency',  label: 'Emergency', icon: AlertTriangle },
  { to: '/about',      label: 'About',     icon: Info },
  { to: '/team',       label: 'Team',      icon: Users },
]

export default function Navbar() {
  const [open, setOpen]         = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname }            = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-surface-dark/90 backdrop-blur-xl border-b border-surface-border shadow-2xl' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg group-hover:shadow-primary-500/40 transition-shadow">
              <Scale size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">
              Nyaya<span className="text-primary-400">Saarthi</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === to
                    ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                } ${to === '/emergency' ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' : ''}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* CTA + Hamburger */}
          <div className="flex items-center gap-3">
            <Link to="/chat" className="hidden lg:flex btn-primary text-sm py-2 px-4 items-center gap-2">
              <MessageSquare size={15} />
              Ask Legal Question
            </Link>
            <button
              id="mobile-menu-btn"
              onClick={() => setOpen(!open)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Toggle menu"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-surface-dark/95 backdrop-blur-xl border-b border-surface-border"
          >
            <nav className="px-4 py-4 flex flex-col gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    pathname === to
                      ? 'bg-primary-600/20 text-primary-400 border border-primary-500/20'
                      : to === '/emergency'
                        ? 'text-red-400 hover:bg-red-500/10'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}
              <Link to="/chat" className="btn-primary text-sm mt-2 flex items-center justify-center gap-2">
                <MessageSquare size={15} />
                Ask Legal Question
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

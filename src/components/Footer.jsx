import { Link } from 'react-router-dom'
import { Scale, ExternalLink, Globe, Link2, Heart, BookOpen, FileText } from 'lucide-react'

const footerLinks = {
  'Legal Help': [
    { label: 'Online Fraud', to: '/chat?cat=fraud' },
    { label: 'Police Rights', to: '/chat?cat=police' },
    { label: 'Rental Disputes', to: '/chat?cat=rental' },
    { label: 'Consumer Rights', to: '/chat?cat=consumer' },
  ],
  'Resources': [
    { label: 'Law Reference', to: '/laws' },
    { label: 'Legal Templates', to: '/complaint' },
    { label: 'Emergency Help', to: '/emergency' },
    { label: 'Chat Interface', to: '/chat' },
  ],
  'Quick Laws': [
    { label: 'IPC Sections', to: '/chat?cat=ipc' },
    { label: 'IT Act 2000', to: '/chat?cat=it' },
    { label: 'CrPC Rights', to: '/chat?cat=crpc' },
    { label: 'About NyayaSaarthi', to: '/about' },
  ],
}

export default function Footer() {
  return (
    <footer className="border-t border-surface-border bg-surface-dark/80 backdrop-blur-xl mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <Scale size={18} className="text-white" />
              </div>
              <span className="font-display font-bold text-xl text-white">
                Nyaya<span className="text-primary-400">Saarthi</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              AI-powered legal assistant empowering every Indian citizen with free, instant, and structured legal guidance — in English and Hindi.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-5">
              <span className="badge bg-green-500/10 text-green-400 border border-green-500/20">Free Forever</span>
              <span className="badge bg-primary-500/10 text-primary-400 border border-primary-500/20">AI Powered</span>
              <span className="badge bg-purple-500/10 text-purple-400 border border-purple-500/20">Hindi + English</span>
            </div>

            {/* Quick action badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Link to="/laws" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card border border-surface-border text-slate-400 hover:text-primary-400 hover:border-primary-500/30 text-xs transition-all">
                <BookOpen size={11} /> Law Reference
              </Link>
              <Link to="/complaint" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card border border-surface-border text-slate-400 hover:text-primary-400 hover:border-primary-500/30 text-xs transition-all">
                <FileText size={11} /> Legal Templates
              </Link>
            </div>

            {/* Social */}
            <div className="flex gap-3 mt-5">
              {[Globe, Link2, ExternalLink].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg bg-surface-card border border-surface-border flex items-center justify-center text-slate-400 hover:text-primary-400 hover:border-primary-500/40 transition-all">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-white font-semibold text-sm mb-4">{section}</h3>
              <ul className="space-y-2">
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className="text-slate-400 hover:text-primary-400 text-sm transition-colors duration-200">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-surface-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © 2025 NyayaSaarthi. Made with <Heart size={12} className="inline text-red-400" /> for 1.4 Billion Indians.
          </p>
          <p className="text-slate-600 text-xs text-center max-w-md">
            <span className="text-yellow-500/70">⚠ Disclaimer:</span> NyayaSaarthi provides general legal information, not professional legal advice. Consult a qualified lawyer for your specific situation.
          </p>
        </div>
      </div>
    </footer>
  )
}

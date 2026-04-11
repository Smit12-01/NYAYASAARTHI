import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import {
  Send, Scale, ShieldAlert, Home, RefreshCw, Copy, Check,
  Mic, MicOff, MessageSquare, ChevronDown, Trash2, Globe,
  Printer, Share2, FileText, History, X, Bookmark, BookmarkCheck
} from 'lucide-react'
import { streamLegalQuery } from '../services/aiService'

/* ─── Category config ─── */
const CATEGORIES = [
  { id: 'fraud',    label: 'Online Fraud',    icon: ShieldAlert, color: 'from-red-500 to-orange-500',    hint: 'UPI fraud, phishing, cybercrime...' },
  { id: 'police',   label: 'Police Rights',   icon: Scale,       color: 'from-blue-500 to-cyan-500',     hint: 'Arrest, FIR, detention rights...' },
  { id: 'rental',   label: 'Rental Dispute',  icon: Home,        color: 'from-purple-500 to-pink-500',   hint: 'Eviction, deposit, landlord...' },
  { id: 'consumer', label: 'Consumer Rights', icon: ShieldAlert, color: 'from-green-500 to-teal-500',    hint: 'Product defects, e-commerce...' },
  { id: 'ipc',      label: 'IPC Sections',    icon: Scale,       color: 'from-orange-500 to-red-500',    hint: 'IPC, criminal law, offences...' },
  { id: 'crpc',     label: 'CrPC Rights',     icon: Scale,       color: 'from-cyan-500 to-blue-500',     hint: 'FIR, bail, arrest, chargesheet...' },
  { id: 'it',       label: 'IT Act',          icon: ShieldAlert, color: 'from-violet-500 to-purple-500', hint: 'Cybercrime, digital rights...' },
]

const SUGGESTED = {
  fraud:    ['Someone made a UPI transaction from my account', 'I got a fake job offer and paid money', 'My bank account was hacked'],
  police:   ['Police detained me without telling me why', 'Can police arrest without warrant?', 'What to do if FIR is not registered?'],
  rental:   ['Landlord refusing to return security deposit', 'Landlord increased rent illegally', 'I was forcibly evicted'],
  consumer: ['Received damaged product, seller refusing refund', 'E-commerce company not responding', 'Insurance claim rejected unfairly'],
  ipc:      ['What is IPC 420?', 'What is punishment for theft under IPC?', 'What is IPC 354?'],
  crpc:     ['What are my rights at arrest?', 'How to file an FIR?', 'What is bail under CrPC?'],
  it:       ['What is IT Act Section 66C?', 'Is sharing obscene content online a crime?', 'What to do in cybercrime case?'],
}

const STORAGE_KEY = 'nyayasaarthi_chat_sessions'

/* ─── Typing indicator ─── */
function TypingIndicator() {
  return (
    <div className="flex gap-3 message-enter">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center flex-shrink-0">
        <Scale size={14} className="text-white" />
      </div>
      <div className="bg-surface-card border border-surface-border px-5 py-4 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
        <span className="text-slate-500 text-xs ml-2">Analysing your legal query...</span>
      </div>
    </div>
  )
}

/* ─── Message bubble ─── */
function MessageBubble({ msg }) {
  const [copied, setCopied] = useState(false)
  const [saved,  setSaved]  = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html><html><head><title>NyayaSaarthi Legal Advice</title><style>body{font-family:Arial,sans-serif;max-width:700px;margin:2rem auto;padding:0 1rem;line-height:1.6}h2{color:#1e3a8a}pre{background:#f1f5f9;padding:1rem;border-radius:8px;white-space:pre-wrap}@media print{button{display:none}}</style></head><body><h1>NyayaSaarthi Legal Guidance</h1><p><em>${new Date().toLocaleString('en-IN')}</em></p><hr/><div>${msg.text.replace(/\n/g,'<br/>')}</div><hr/><p><small>⚠ Disclaimer: This is general legal information, not professional legal advice.</small></p></body></html>`)
    w.document.close()
    w.print()
  }

  const handleShare = () => {
    const text = `NyayaSaarthi Legal Guidance:\n\n${msg.text.substring(0, 500)}...\n\nGet free legal help: nyayasaarthi.in`
    if (navigator.share) {
      navigator.share({ title: 'NyayaSaarthi Legal Advice', text })
    } else {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSave = () => {
    const saved = JSON.parse(localStorage.getItem('nyayasaarthi_saved') || '[]')
    saved.push({ text: msg.text, time: msg.time, date: new Date().toLocaleDateString('en-IN') })
    localStorage.setItem('nyayasaarthi_saved', JSON.stringify(saved.slice(-20)))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (msg.role === 'user') {
    return (
      <div className="flex justify-end message-enter">
        <div className="bg-primary-600 text-white px-5 py-3.5 rounded-2xl rounded-br-sm max-w-[85%] md:max-w-md shadow-lg shadow-primary-900/30">
          <p className="text-sm leading-relaxed">{msg.text}</p>
          <p className="text-primary-300 text-xs mt-1.5 text-right">{msg.time}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 message-enter">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
        <Scale size={14} className="text-white" />
      </div>
      <div className="flex-1 max-w-[85%] md:max-w-2xl">
        <div className="bg-surface-card border border-surface-border px-5 py-4 rounded-2xl rounded-bl-sm shadow-lg">
          {msg.isDemo && (
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-surface-border">
              <span className="badge bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">Demo Mode · Connect backend for live AI</span>
            </div>
          )}
          {msg.isStreaming && (
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-primary-400 text-xs animate-pulse">● Typing...</span>
            </div>
          )}
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown
              components={{
                h2: ({ children }) => <h2 className="text-white font-bold text-base mt-4 mb-2 first:mt-0">{children}</h2>,
                h3: ({ children }) => <h3 className="text-primary-300 font-semibold text-sm mt-3 mb-1">{children}</h3>,
                p:  ({ children }) => <p className="text-slate-300 text-sm leading-relaxed mb-2">{children}</p>,
                ul: ({ children }) => <ul className="space-y-1 mb-3">{children}</ul>,
                ol: ({ children }) => <ol className="space-y-1 mb-3 list-decimal list-inside">{children}</ol>,
                li: ({ children }) => <li className="text-slate-300 text-sm flex gap-2"><span className="text-primary-400 mt-0.5">•</span><span>{children}</span></li>,
                strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                em:     ({ children }) => <em className="text-slate-400 not-italic text-xs">{children}</em>,
                hr:     () => <hr className="border-surface-border my-4" />,
                code:   ({ children }) => <code className="px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-300 text-xs font-mono">{children}</code>,
              }}
            >
              {msg.text}
            </ReactMarkdown>
          </div>
          {!msg.isStreaming && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-border">
              <span className="text-slate-600 text-xs">{msg.time}</span>
              <div className="flex items-center gap-1">
                <button onClick={handleCopy} className="flex items-center gap-1 text-slate-500 hover:text-primary-400 text-xs transition-colors px-2 py-1 rounded-lg hover:bg-primary-500/10" title="Copy">
                  {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={handlePrint} className="flex items-center gap-1 text-slate-500 hover:text-primary-400 text-xs transition-colors px-2 py-1 rounded-lg hover:bg-primary-500/10" title="Print">
                  <Printer size={12} />
                  Print
                </button>
                <button onClick={handleShare} className="flex items-center gap-1 text-slate-500 hover:text-primary-400 text-xs transition-colors px-2 py-1 rounded-lg hover:bg-primary-500/10" title="Share">
                  <Share2 size={12} />
                  Share
                </button>
                <button onClick={handleSave} className="flex items-center gap-1 text-slate-500 hover:text-yellow-400 text-xs transition-colors px-2 py-1 rounded-lg hover:bg-yellow-500/10" title="Save">
                  {saved ? <BookmarkCheck size={12} className="text-yellow-400" /> : <Bookmark size={12} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Session History Sidebar ─── */
function HistorySidebar({ sessions, currentId, onSelect, onClose, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute left-0 top-0 bottom-0 w-72 glass-card border-r border-surface-border z-20 flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
        <span className="text-white font-semibold text-sm flex items-center gap-2"><History size={14} /> Chat History</span>
        <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sessions.length === 0 ? (
          <p className="text-slate-500 text-xs p-4 text-center">No saved sessions yet</p>
        ) : sessions.map(s => (
          <div
            key={s.id}
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${s.id === currentId ? 'bg-primary-600/20 border border-primary-500/30' : 'hover:bg-white/5 border border-transparent'}`}
            onClick={() => { onSelect(s); onClose() }}
          >
            <MessageSquare size={13} className={s.id === currentId ? 'text-primary-400' : 'text-slate-500'} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{s.title || 'Legal consultation'}</p>
              <p className="text-slate-600 text-xs">{s.date}</p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); onDelete(s.id) }}
              className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

/* ─── Main Chat page ─── */
export default function Chat() {
  const [searchParams] = useSearchParams()
  const initCat = searchParams.get('cat') || 'fraud'
  const initQ   = searchParams.get('q') || ''
  const validCat = CATEGORIES.find(c => c.id === initCat)?.id || 'fraud'

  const [category, setCategory]     = useState(validCat)
  const [messages, setMessages]     = useState([])
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [listening, setListening]   = useState(false)
  const [lang, setLang]             = useState('en')
  const [showHistory, setShowHistory] = useState(false)
  const [sessions, setSessions]     = useState([])
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const bottomRef                   = useRef(null)
  const inputRef                    = useRef(null)
  const recognitionRef              = useRef(null)

  const currentCat = CATEGORIES.find(c => c.id === category)

  /* ── Load sessions from localStorage ── */
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    setSessions(stored)
  }, [])

  /* ── Starting welcome message ── */
  useEffect(() => {
    const sid = Date.now().toString()
    setCurrentSessionId(sid)
    const welcome = {
      id: 'welcome',
      role: 'bot',
      text: `Namaste! 🙏 I am **NyayaSaarthi**, your free AI legal assistant for Indian law.\n\nI can help you with:\n- 🛡️ Online fraud & cybercrime (IT Act 2000)\n- ⚖️ Police rights & arrest procedures (CrPC)\n- 🏠 Rental & tenant disputes\n- 🛒 Consumer rights & complaints\n- 📖 IPC / CrPC section explanations\n\nSelect a category above and describe your legal situation. I'll provide structured guidance with relevant laws and action steps.\n\n*कृपया हिंदी में भी पूछ सकते हैं — I understand both languages.*`,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      isDemo: false,
    }
    setMessages([welcome])

    // If a pre-filled query from Laws page
    if (initQ) {
      setTimeout(() => sendMessage(initQ, [welcome]), 300)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Auto-scroll ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  /* ── Save session when messages change ── */
  useEffect(() => {
    if (messages.length > 1 && currentSessionId) {
      const userMsgs = messages.filter(m => m.role === 'user')
      if (userMsgs.length === 0) return
      const session = {
        id: currentSessionId,
        title: userMsgs[0].text.substring(0, 40) + (userMsgs[0].text.length > 40 ? '…' : ''),
        date: new Date().toLocaleDateString('en-IN'),
        category,
        messages,
      }
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      const updated = [session, ...existing.filter(s => s.id !== currentSessionId)].slice(0, 20)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      setSessions(updated)
    }
  }, [messages])

  /* ── Voice input setup ── */
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SR()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
      recognitionRef.current.onresult = (e) => {
        setInput(e.results[0][0].transcript)
        setListening(false)
      }
      recognitionRef.current.onerror = () => setListening(false)
      recognitionRef.current.onend   = () => setListening(false)
    }
  }, [lang])

  const toggleVoice = () => {
    if (!recognitionRef.current) return
    if (listening) { recognitionRef.current.stop(); setListening(false) }
    else { recognitionRef.current.start(); setListening(true) }
  }

  const sendMessage = useCallback(async (text = input, currentMessages = messages) => {
    const trimmed = typeof text === 'string' ? text.trim() : input.trim()
    if (!trimmed || loading) return

    const userMsg = {
      id:   Date.now().toString(),
      role: 'user',
      text: trimmed,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }
    const newMessages = [...currentMessages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const history = currentMessages.slice(-6).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    }))

    const botId = Date.now().toString() + '-bot'

    streamLegalQuery({
      message: trimmed,
      category,
      history,
      onChunk: (chunk) => {
        setLoading(false)
        setMessages(prev => {
          const botMsg = prev.find(m => m.id === botId)
          if (!botMsg) {
            return [...prev, {
              id: botId,
              role: 'bot',
              text: chunk,
              time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              isStreaming: true
            }]
          }
          return prev.map(m => m.id === botId ? { ...m, text: m.text + chunk } : m)
        })
      },
      onEnd: (data) => {
        setMessages(prev => prev.map(m =>
          m.id === botId ? { ...m, text: data.fullReply || m.text, isStreaming: false, isDemo: data.isDemo } : m
        ))
        setLoading(false)
        inputRef.current?.focus()
      },
      onError: () => {
        setMessages(prev => [...prev, {
          id: botId + '-err',
          role: 'bot',
          text: 'Sorry, I encountered an error processing your request. Please try again in a moment.',
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        }])
        setLoading(false)
      }
    })
  }, [input, loading, messages, category])

  const clearChat = () => {
    const sid = Date.now().toString()
    setCurrentSessionId(sid)
    setMessages(prev => [prev[0]])
  }

  const loadSession = (session) => {
    setCategory(session.category || 'fraud')
    setMessages(session.messages || [])
    setCurrentSessionId(session.id)
  }

  const deleteSession = (id) => {
    const updated = sessions.filter(s => s.id !== id)
    setSessions(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  return (
    <div className="min-h-screen pt-16 flex flex-col">
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 relative">

        {/* History Sidebar */}
        <AnimatePresence>
          {showHistory && (
            <HistorySidebar
              sessions={sessions}
              currentId={currentSessionId}
              onSelect={loadSession}
              onClose={() => setShowHistory(false)}
              onDelete={deleteSession}
            />
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
              <MessageSquare size={22} className="text-primary-400" />
              Legal Consultation
            </h1>
            <p className="text-slate-400 text-sm mt-1">Ask your legal question — get structured Indian law guidance</p>
          </div>
          <button
            onClick={() => setShowHistory(h => !h)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-slate-400 bg-surface-card border border-surface-border hover:text-primary-400 hover:border-primary-500/30 transition-all"
          >
            <History size={13} />
            History {sessions.length > 0 && <span className="bg-primary-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">{sessions.length}</span>}
          </button>
        </div>

        {/* Category selector */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              id={`cat-${id}`}
              onClick={() => setCategory(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                category === id
                  ? `bg-gradient-to-r ${color} text-white shadow-lg`
                  : 'bg-surface-card border border-surface-border text-slate-400 hover:text-white hover:border-slate-500'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}

          {/* Language toggle */}
          <button
            id="lang-toggle"
            onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-slate-400 bg-surface-card border border-surface-border hover:text-primary-400 hover:border-primary-500/30 transition-all flex-shrink-0"
          >
            <Globe size={13} />
            {lang === 'en' ? 'EN' : 'हि'}
          </button>
        </div>

        {/* Hint bar */}
        <div className="glass rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2 text-sm">
          <ChevronDown size={14} className="text-primary-400" />
          <span className="text-slate-400">{currentCat?.hint}</span>
        </div>

        {/* Messages area */}
        <div className="flex-1 glass-card p-4 md:p-6 space-y-5 overflow-y-auto min-h-[400px] max-h-[60vh]">
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          <AnimatePresence>
            {loading && (
              <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <TypingIndicator />
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Suggested questions */}
        {messages.length <= 1 && (
          <div className="mt-4">
            <p className="text-slate-500 text-xs mb-2 uppercase tracking-wide">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED[category]?.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s, messages)}
                  className="text-xs px-3 py-2 rounded-lg bg-surface-card border border-surface-border text-slate-400 hover:text-primary-300 hover:border-primary-500/30 transition-all text-left"
                >
                  "{s}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="mt-4 glass-card p-3">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              id="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder={lang === 'hi' ? 'अपना कानूनी सवाल यहाँ लिखें...' : 'Describe your legal situation...'}
              rows={2}
              disabled={loading}
              className="input-field flex-1 resize-none text-sm"
            />
            <div className="flex flex-col gap-2">
              <button
                id="chat-send-btn"
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="btn-primary p-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                <Send size={18} />
              </button>
              <button
                id="voice-btn"
                onClick={toggleVoice}
                className={`p-3 rounded-xl border transition-all ${
                  listening
                    ? 'bg-red-500 border-red-500 text-white animate-pulse'
                    : 'bg-surface-card border-surface-border text-slate-400 hover:text-primary-400 hover:border-primary-500/30'
                }`}
              >
                {listening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-slate-600 text-xs">Enter to send • Shift+Enter for new line</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.href = '/complaint'}
                className="flex items-center gap-1 text-slate-600 hover:text-primary-400 text-xs transition-colors"
              >
                <FileText size={11} />
                Generate Template
              </button>
              <button
                id="clear-chat-btn"
                onClick={clearChat}
                className="flex items-center gap-1 text-slate-600 hover:text-red-400 text-xs transition-colors"
              >
                <Trash2 size={11} />
                Clear chat
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-slate-600 text-xs text-center mt-3">
          ⚠️ NyayaSaarthi provides general legal information, not professional advice. Consult a lawyer for legal representation.
        </p>
      </div>
    </div>
  )
}

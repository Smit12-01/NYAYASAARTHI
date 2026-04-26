import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone, MessageSquare, MapPin, AlertTriangle,
  Navigation, Copy, Check, ExternalLink, Share2,
  Wifi, WifiOff, RefreshCw, Settings, ChevronDown, ChevronUp,
  Camera, VideoOff, StopCircle, Radio
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import { io } from 'socket.io-client'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const userIcon = new L.Icon({
  iconUrl:   'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
})

const HELPLINES = [
  { name: 'Police',            number: '100',   color: 'from-blue-600 to-blue-800',       emoji: '🚔' },
  { name: 'Ambulance',         number: '108',   color: 'from-red-600 to-red-800',         emoji: '🚑' },
  { name: 'Women Helpline',    number: '1091',  color: 'from-pink-600 to-pink-800',       emoji: '👩' },
  { name: 'Cyber Crime',       number: '1930',  color: 'from-purple-600 to-purple-800',   emoji: '💻' },
  { name: 'Child Helpline',    number: '1098',  color: 'from-orange-600 to-orange-800',   emoji: '👶' },
  { name: 'Senior Citizen',    number: '14567', color: 'from-teal-600 to-teal-800',       emoji: '👴' },
  { name: 'Legal Aid (NALSA)', number: '15100', color: 'from-emerald-600 to-emerald-800', emoji: '⚖️' },
  { name: 'NHRC',              number: '14433', color: 'from-indigo-600 to-indigo-800',   emoji: '🏛️' },
]

/* ─── WebRTC config ─── */
const STUN = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] }
const SERVER_URL = import.meta.env.VITE_STREAM_SERVER_URL || 'https://nyayabot-backend.onrender.com'

/* ─── Map fly-to helper ─── */
function MapFlyTo({ pos }) {
  const map = useMap()
  useEffect(() => { if (pos) map.flyTo(pos, 16, { duration: 1.2 }) }, [pos, map])
  return null
}

/* ─── How to fix location instructions ─── */
function LocationFixInstructions({ onClose }) {
  const browser = (() => {
    const ua = navigator.userAgent
    if (ua.includes('Edg')) return 'edge'
    if (ua.includes('Chrome')) return 'chrome'
    if (ua.includes('Firefox')) return 'firefox'
    return 'chrome'
  })()

  const steps = {
    chrome: [
      '🔒 Click the lock/info icon in the address bar (left side)',
      '📍 Find "Location" in the site settings dropdown',
      '✅ Change it from "Block" to "Allow"',
      '🔄 Reload the page — location will activate automatically',
    ],
    edge: [
      '🔒 Click the lock icon in the address bar',
      '⚙️ Click "Permissions for this site"',
      '📍 Find "Location" and set it to "Allow"',
      '🔄 Reload the page',
    ],
    firefox: [
      '🔒 Click the shield/lock icon in the address bar',
      '➡️ Click "Connection secure" → "More information"',
      '📍 Go to "Permissions" tab → Location → Allow',
      '🔄 Reload the page',
    ],
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mt-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-amber-400 font-semibold text-sm flex items-center gap-2">
            <Settings size={14} /> How to Enable Location in Your Browser
          </p>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <ChevronUp size={14} />
          </button>
        </div>
        <ol className="space-y-2">
          {steps[browser].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <div className="mt-3 pt-3 border-t border-amber-500/20">
          <p className="text-xs text-slate-500">
            💡 Or use <span className="text-amber-400 font-medium">Manual Entry</span> below to type your coordinates.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Manual Location Input ─── */
function ManualLocationInput({ onSet }) {
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [err, setErr] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const la = parseFloat(lat), lo = parseFloat(lng)
    if (isNaN(la) || isNaN(lo) || la < -90 || la > 90 || lo < -180 || lo > 180) {
      setErr('Enter valid coordinates. India example: Lat 28.6139, Lng 77.2090')
      return
    }
    onSet({ lat: la.toFixed(6), lng: lo.toFixed(6), acc: 'manual' })
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <form onSubmit={handleSubmit} className="mt-3 space-y-2">
        <p className="text-slate-400 text-xs font-medium">Enter coordinates manually:</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-slate-500 text-[10px] uppercase tracking-wide">Latitude</label>
            <input
              type="number" step="any" placeholder="e.g. 28.6139"
              value={lat} onChange={e => setLat(e.target.value)}
              className="input-field text-xs py-2 mt-0.5 w-full"
            />
          </div>
          <div>
            <label className="text-slate-500 text-[10px] uppercase tracking-wide">Longitude</label>
            <input
              type="number" step="any" placeholder="e.g. 77.2090"
              value={lng} onChange={e => setLng(e.target.value)}
              className="input-field text-xs py-2 mt-0.5 w-full"
            />
          </div>
        </div>
        {err && <p className="text-red-400 text-xs">{err}</p>}
        <p className="text-slate-600 text-[10px]">
          💡 Find your coords at{' '}
          <a href="https://www.latlong.net/" target="_blank" rel="noopener noreferrer" className="text-primary-400 underline">
            latlong.net
          </a>
          {' '}or Google Maps → right-click your location
        </p>
        <button type="submit" className="w-full btn-primary text-xs py-2">
          📍 Set Location Manually
        </button>
      </form>
    </motion.div>
  )
}

export default function Emergency() {
  const [location, setLocation]         = useState(null)
  const [locLoading, setLocLoading]     = useState(false)
  const [locError, setLocError]         = useState('')
  const [permDenied, setPermDenied]     = useState(false)
  const [showFix, setShowFix]           = useState(false)
  const [showManual, setShowManual]     = useState(false)
  const [copied, setCopied]             = useState('')
  const [toast, setToast]               = useState('')
  const [online, setOnline]             = useState(navigator.onLine)
  const [shareUrl, setShareUrl]         = useState('')
  const watchRef                        = useRef(null)

  // ── Livestream state ──────────────────────────────────────────────────────
  const [streaming, setStreaming]         = useState(false)
  const [signalingReady, setSignalingReady] = useState(false) // server confirmed room
  const [streamLink, setStreamLink]       = useState('')
  const [streamCopied, setStreamCopied]   = useState(false)
  const [streamError, setStreamError]     = useState('')
  const [viewerCount, setViewerCount]     = useState(0)
  const localVideoRef                     = useRef(null)
  const socketRef                         = useRef(null)
  const peersRef                          = useRef({})          // viewerId → RTCPeerConnection
  const iceCacheRef                       = useRef({})          // viewerId → candidate[]
  const localStreamRef                    = useRef(null)
  const roomIdRef                         = useRef(null)

  useEffect(() => {
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // Check permission first, then auto-request
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        if (result.state === 'denied') {
          setPermDenied(true)
          setLocError('Location access is blocked in your browser.')
          setShowFix(true)
        } else {
          requestLocation()
        }
      })
    } else {
      requestLocation()
    }
  }, [])

  const showToast = (msg, duration = 3000) => {
    setToast(msg)
    setTimeout(() => setToast(''), duration)
  }

  const buildShareUrl = (lat, lng) => `https://maps.google.com/?q=${lat},${lng}`

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.')
      return
    }
    setLocLoading(true)
    setLocError('')
    setPermDenied(false)

    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6)
        const lng = pos.coords.longitude.toFixed(6)
        const acc = pos.coords.accuracy.toFixed(0)
        setLocation({ lat, lng, acc })
        setShareUrl(buildShareUrl(lat, lng))
        setLocLoading(false)
        setLocError('')
        setPermDenied(false)
        setShowFix(false)
        setShowManual(false)
        showToast('✅ Live location detected!')
      },
      (err) => {
        setLocLoading(false)
        if (err.code === 1) {
          setPermDenied(true)
          setLocError('Location access denied by browser.')
          setShowFix(true)
        } else if (err.code === 2) {
          setLocError('Location signal unavailable. Try outdoors or enable Wi-Fi.')
        } else {
          setLocError('Location request timed out. Please retry.')
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  useEffect(() => () => { if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current) }, [])

  // \u2500\u2500 Livestream helpers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  const stopLivestream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop())
      localStreamRef.current = null
    }
    Object.values(peersRef.current).forEach(pc => pc.close())
    peersRef.current  = {}
    iceCacheRef.current = {}
    if (socketRef.current) {
      socketRef.current.emit('livestream:end', { roomId: roomIdRef.current })
      socketRef.current.disconnect()
      socketRef.current = null
    }
    roomIdRef.current = null
    setStreaming(false)
    setSignalingReady(false)
    setStreamLink('')
    setViewerCount(0)
    setStreamError('')
    showToast('📷 Livestream ended')
  }, [])

  const startLivestream = useCallback(async () => {
    setStreamError('')
    try {
      // ── Step 1: Open camera ──────────────────────────────────────────────
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: true })
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      }
      localStreamRef.current = stream

      // ── Step 2: Generate link + show video IMMEDIATELY ───────────────────
      const roomId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
      roomIdRef.current = roomId
      const link = `${window.location.origin}/livestream/${roomId}`
      setStreamLink(link)   // link appears right away
      setStreaming(true)     // mounts the video element so useEffect can attach stream
      showToast('📷 Camera live! Share the link below.')

      // ── Step 3: Connect signaling server in background ───────────────────
      try { await fetch(`${SERVER_URL}/health`) } catch {}  // wake Render free tier

      const socket = io(SERVER_URL, { transports: ['polling', 'websocket'] })
      socketRef.current = socket

      socket.on('connect_error', (err) => {
        console.error('[Signaling] connect error', err.message)
        // Don't kill stream on signaling error — camera still works
        setSignalingReady(false)
      })

      socket.on('connect', () => {
        console.log('[Signaling] Connected, joining room', roomId)
        socket.emit('livestream:join', { roomId })
        setSignalingReady(true)  // mark ready on connect (works with old server too)
      })

      // New server: also responds with room-ready (no-op if already set above)
      socket.on('livestream:room-ready', () => setSignalingReady(true))

      // ── Step 4: New viewer joined — create WebRTC offer ───────────────────
      socket.on('livestream:viewer-joined', async ({ viewerId }) => {
        console.log('[WebRTC] Viewer joined:', viewerId)
        setViewerCount(c => c + 1)

        const pc = new RTCPeerConnection(STUN)
        peersRef.current[viewerId] = pc
        iceCacheRef.current[viewerId] = []

        stream.getTracks().forEach(track => pc.addTrack(track, stream))

        pc.onicecandidate = ({ candidate }) => {
          if (candidate) {
            socket.emit('livestream:ice-candidate', {
              roomId: roomIdRef.current, candidate, targetId: viewerId,
            })
          }
        }

        pc.onconnectionstatechange = () =>
          console.log(`[WebRTC] Peer ${viewerId} → ${pc.connectionState}`)

        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socket.emit('livestream:offer', { roomId: roomIdRef.current, viewerId, offer })
        console.log('[WebRTC] Offer sent to:', viewerId)
      })

      // ── Step 5: Viewer answered ───────────────────────────────────────────
      socket.on('livestream:answer', async ({ answer, viewerId }) => {
        const pc = peersRef.current[viewerId]
        if (!pc) return
        await pc.setRemoteDescription(new RTCSessionDescription(answer))
        const cached = iceCacheRef.current[viewerId] || []
        for (const c of cached) {
          try { await pc.addIceCandidate(new RTCIceCandidate(c)) } catch {}
        }
        iceCacheRef.current[viewerId] = []
      })

      // ── Step 6: ICE candidates from viewer (with queuing) ────────────────
      socket.on('livestream:ice-candidate', async ({ candidate, fromId }) => {
        const pc = peersRef.current[fromId]
        if (!pc || !candidate) return
        if (pc.remoteDescription) {
          try { await pc.addIceCandidate(new RTCIceCandidate(candidate)) } catch {}
        } else {
          iceCacheRef.current[fromId] = iceCacheRef.current[fromId] || []
          iceCacheRef.current[fromId].push(candidate)
        }
      })

      socket.on('disconnect', () => {
        console.log('[Signaling] Disconnected')
        setSignalingReady(false)
      })

    } catch (err) {
      console.error('[Livestream] error:', err)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setStreamError('Camera permission denied. Please allow camera access and try again.')
      } else {
        setStreamError('Could not start camera: ' + err.message)
      }
      setStreaming(false)
    }
  }, [stopLivestream])

  // Cleanup on unmount
  useEffect(() => () => stopLivestream(), [stopLivestream])

  // Attach camera stream to video element once it renders in the DOM
  useEffect(() => {
    if (streaming && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current
      localVideoRef.current.play().catch(() => {})
    }
  }, [streaming])

  const handleManualSet = (coords) => {
    setLocation(coords)
    setShareUrl(buildShareUrl(coords.lat, coords.lng))
    setLocError('')
    setPermDenied(false)
    setShowFix(false)
    setShowManual(false)
    showToast('📍 Manual location set successfully!')
  }

  const copyCoords = () => {
    if (!location) return
    navigator.clipboard.writeText(`Lat: ${location.lat}, Lng: ${location.lng}\nGoogle Maps: ${shareUrl}`)
    setCopied('coords'); showToast('📋 Coordinates copied!')
    setTimeout(() => setCopied(''), 2500)
  }

  const copyUrl = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied('url'); showToast('🔗 Google Maps link copied!')
    setTimeout(() => setCopied(''), 2500)
  }

  const shareLocation = async () => {
    if (!location) { requestLocation(); return }
    const text = `🆘 EMERGENCY! My location:\n${shareUrl}\nCall police: 100`
    if (navigator.share) {
      try { await navigator.share({ title: 'Emergency Location', text, url: shareUrl }); showToast('✅ Location shared!') }
      catch { copyUrl() }
    } else { copyUrl() }
  }

  const sendSOS = () => {
    const msg = location
      ? `🆘 EMERGENCY! I need help. My location: ${shareUrl} — Please call police 100`
      : '🆘 EMERGENCY! I need immediate help. Please call police: 100'
    window.open(`sms:?body=${encodeURIComponent(msg)}`)
  }

  const mapPos = location
    ? [parseFloat(location.lat), parseFloat(location.lng)]
    : [20.5937, 78.9629] // India center

  return (
    <div className="min-h-screen pt-16">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] bg-slate-800 border border-slate-600 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium whitespace-nowrap"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/30">
              <AlertTriangle size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display font-black text-2xl text-white">Emergency Help</h1>
              <p className="text-slate-400 text-sm">Live location • Helplines • SOS</p>
            </div>
          </div>
          <span className={`badge flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${online ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {online ? <Wifi size={11} /> : <WifiOff size={11} />}
            {online ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* SOS Bar */}
        <div className="mb-5 glass-card border border-red-500/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
              <AlertTriangle size={18} className="text-red-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">In Immediate Danger?</p>
              <p className="text-slate-400 text-xs">Call 112 (All emergencies) or 100 (Police)</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto flex-wrap">
            <a href="tel:112" className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-red-600/20">
              <Phone size={14} /> Call 112
            </a>
            <button onClick={sendSOS} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors">
              <MessageSquare size={14} /> SOS SMS
            </button>
            {!streaming ? (
              <button
                id="start-livestream-btn"
                onClick={startLivestream}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-600/20"
              >
                <Camera size={14} /> Live Camera
              </button>
            ) : (
              <button
                id="stop-livestream-btn"
                onClick={stopLivestream}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all animate-pulse"
              >
                <StopCircle size={14} /> Stop Stream
              </button>
            )}
          </div>
        </div>

        {/* Livestream Card */}
        <AnimatePresence>
          {(streaming || streamError) && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mb-5"
            >
              <div className="glass-card border border-purple-500/40 overflow-hidden">
                {/* Card header */}
                <div className="px-4 py-3 bg-gradient-to-r from-violet-600/20 to-purple-700/20 border-b border-purple-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio size={14} className="text-purple-400 animate-pulse" />
                    <span className="text-white font-semibold text-sm">Emergency Livestream</span>
                    {streaming && signalingReady && (
                      <span className="flex items-center gap-1 bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
                        LIVE
                      </span>
                    )}
                    {streaming && !signalingReady && (
                      <span className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                        <div className="w-2.5 h-2.5 border border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                        Connecting to server…
                      </span>
                    )}
                  </div>
                  {viewerCount > 0 && (
                    <span className="text-purple-300 text-xs">👁 {viewerCount} viewer{viewerCount !== 1 ? 's' : ''}</span>
                  )}
                </div>

                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Video preview */}
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    {streaming && (
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600/90 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                      </div>
                    )}
                  </div>

                  {/* Share link */}
                  <div className="flex flex-col justify-between gap-3">
                    <div>
                      <p className="text-slate-400 text-xs mb-1.5 font-medium">📎 Share this link to let others watch:</p>
                      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
                        <p className="text-purple-300 text-xs font-mono break-all leading-relaxed">{streamLink}</p>
                      </div>
                      {/* Warn if localhost — won't work on other devices */}
                      {window.location.hostname === 'localhost' && (
                        <div className="mt-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5">
                          <p className="text-amber-400 text-[10px] font-semibold mb-1">⚠️ Localhost detected</p>
                          <p className="text-amber-300/80 text-[10px] leading-relaxed">
                            This link only works on <strong>this computer</strong>.<br />
                            For other devices, replace <code className="bg-amber-500/20 px-1 rounded">localhost</code> with your network IP.<br />
                            Check your terminal — it shows: <code className="bg-amber-500/20 px-1 rounded">Network: http://10.x.x.x:5173</code><br />
                            Then use: <span className="text-amber-300 font-mono">http://10.x.x.x:5173/livestream/...</span>
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        id="copy-stream-link-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(streamLink)
                          setStreamCopied(true)
                          showToast('🔗 Stream link copied!')
                          setTimeout(() => setStreamCopied(false), 2500)
                        }}
                        className="flex items-center justify-center gap-1.5 bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 text-purple-300 text-xs py-2.5 rounded-xl transition-all"
                      >
                        {streamCopied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        {streamCopied ? 'Copied!' : 'Copy Link'}
                      </button>
                      {navigator.share && (
                        <button
                          id="share-stream-link-btn"
                          onClick={() => navigator.share({ title: '🆘 Emergency Live Stream', text: 'Watch my emergency livestream', url: streamLink }).catch(() => {})}
                          className="flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs py-2.5 rounded-xl transition-all"
                        >
                          <Share2 size={12} /> Share
                        </button>
                      )}
                    </div>
                    <button
                      onClick={stopLivestream}
                      className="w-full flex items-center justify-center gap-2 bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 text-red-400 text-xs py-2.5 rounded-xl transition-all"
                    >
                      <StopCircle size={12} /> Stop Livestream
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {streamError && !streaming && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mb-5 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3"
            >
              <VideoOff size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{streamError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ─── LEFT PANEL ─── */}
          <div className="space-y-5">

            {/* Location Card */}
            <div className="glass-card p-5">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <MapPin size={16} className="text-primary-400" />
                My Live Location
                {location && !permDenied && (
                  <span className="ml-auto badge bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
                    ● Live
                  </span>
                )}
                {location?.acc === 'manual' && (
                  <span className="ml-auto badge bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                    ✏️ Manual
                  </span>
                )}
              </h2>

              {/* Loading state */}
              {locLoading && !location && (
                <div className="flex items-center gap-3 bg-primary-500/10 border border-primary-500/20 rounded-xl p-3 mb-3">
                  <div className="w-4 h-4 border-2 border-primary-400/30 border-t-primary-400 rounded-full animate-spin flex-shrink-0" />
                  <p className="text-primary-300 text-sm">Detecting your location…</p>
                </div>
              )}

              {/* Permission denied error */}
              {locError && (
                <div className="space-y-2">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <p className="text-red-400 text-xs font-medium mb-1">⚠️ {locError}</p>
                    <div className="flex gap-2 mt-2">
                      {permDenied && (
                        <button
                          onClick={() => { setShowFix(!showFix); setShowManual(false) }}
                          className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          <Settings size={11} /> How to fix
                          {showFix ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        </button>
                      )}
                      {!permDenied && (
                        <button onClick={requestLocation} className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors">
                          <RefreshCw size={11} /> Retry
                        </button>
                      )}
                      <button
                        onClick={() => { setShowManual(!showManual); setShowFix(false) }}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        ✏️ Enter manually
                        {showManual ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showFix && <LocationFixInstructions onClose={() => setShowFix(false)} />}
                  </AnimatePresence>

                  <AnimatePresence>
                    {showManual && <ManualLocationInput onSet={handleManualSet} />}
                  </AnimatePresence>
                </div>
              )}

              {/* Location found */}
              {location && (
                <div className="space-y-3">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-green-400 text-xs font-semibold">
                        {location.acc === 'manual' ? 'Manual location set' : 'GPS location active'}
                      </span>
                    </div>
                    <p className="text-green-300 text-xs font-mono">Lat:  {location.lat}</p>
                    <p className="text-green-300 text-xs font-mono">Lng: {location.lng}</p>
                    {location.acc !== 'manual' && <p className="text-slate-500 text-xs mt-1">Accuracy: ±{location.acc} m</p>}
                  </div>

                  {/* Live shareable URL */}
                  <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
                    <p className="text-slate-500 text-[10px] uppercase tracking-wide mb-1.5">📎 Shareable Google Maps URL</p>
                    <p className="text-primary-400 text-xs font-mono break-all">{shareUrl}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={copyCoords} className="flex items-center justify-center gap-1.5 bg-surface-card border border-surface-border text-xs py-2.5 rounded-xl text-slate-300 hover:text-primary-400 hover:border-primary-500/30 transition-all">
                      {copied === 'coords' ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                      {copied === 'coords' ? 'Copied!' : 'Copy Coords'}
                    </button>
                    <button onClick={copyUrl} className="flex items-center justify-center gap-1.5 bg-surface-card border border-surface-border text-xs py-2.5 rounded-xl text-slate-300 hover:text-primary-400 hover:border-primary-500/30 transition-all">
                      {copied === 'url' ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                      {copied === 'url' ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={shareLocation} className="flex items-center justify-center gap-1.5 bg-primary-600 hover:bg-primary-500 text-white text-xs py-2.5 rounded-xl transition-colors">
                      <Share2 size={12} /> Share Location
                    </button>
                    <a href={shareUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs py-2.5 rounded-xl transition-colors">
                      <ExternalLink size={12} /> Open Maps
                    </a>
                  </div>
                  {location.acc !== 'manual' && (
                    <button onClick={requestLocation} className="w-full flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-slate-300 py-1 transition-colors">
                      <RefreshCw size={10} /> Refresh GPS
                    </button>
                  )}

                  {/* Manual override toggle */}
                  <button
                    onClick={() => setShowManual(!showManual)}
                    className="w-full flex items-center justify-center gap-1 text-xs text-slate-600 hover:text-slate-400 py-0.5 transition-colors"
                  >
                    ✏️ Enter different coordinates
                    {showManual ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  </button>
                  <AnimatePresence>
                    {showManual && <ManualLocationInput onSet={handleManualSet} />}
                  </AnimatePresence>
                </div>
              )}

              {/* No error, no location, not loading — show button */}
              {!location && !locLoading && !locError && (
                <button
                  id="get-location-btn"
                  onClick={requestLocation}
                  className="w-full btn-primary text-sm py-3 flex items-center justify-center gap-2"
                >
                  <Navigation size={15} /> Get My Location
                </button>
              )}
            </div>

            {/* Helplines */}
            <div>
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Phone size={16} className="text-primary-400" />
                Emergency Helplines
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {HELPLINES.map(({ name, number, color, emoji }) => (
                  <a
                    key={name}
                    href={`tel:${number}`}
                    id={`call-${number}`}
                    className={`bg-gradient-to-br ${color} p-3 rounded-2xl flex flex-col justify-between min-h-[78px] hover:scale-105 transition-transform shadow-lg`}
                  >
                    <span className="text-lg">{emoji}</span>
                    <div>
                      <p className="text-white/70 text-[10px] leading-tight">{name}</p>
                      <p className="text-white font-black font-display text-xl leading-none">{number}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ─── RIGHT PANEL ─── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Live Map */}
            <div className="glass-card overflow-hidden">
              <div className="p-4 border-b border-surface-border flex items-center justify-between">
                <h2 className="text-white font-semibold flex items-center gap-2 text-sm">
                  <MapPin size={15} className="text-primary-400" />
                  {location ? '📍 Your Location on Map' : '🗺️ Live Map'}
                </h2>
                <div className="flex items-center gap-2">
                  {location && (
                    <span className="badge bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
                      {location.acc === 'manual' ? '✏️ Manual' : '● Live GPS'}
                    </span>
                  )}
                  <span className="badge bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs">
                    OpenStreetMap
                  </span>
                </div>
              </div>

              <MapContainer
                center={mapPos}
                zoom={location ? 14 : 5}
                style={{ height: '360px', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {location ? (
                  <>
                    <MapFlyTo pos={mapPos} />
                    <Marker position={mapPos} icon={userIcon}>
                      <Popup>
                        <div className="text-sm font-bold">📍 {location.acc === 'manual' ? 'Manual Location' : 'You are here'}</div>
                        <div className="text-xs text-gray-500">
                          {location.acc !== 'manual' ? `Accuracy: ±${location.acc}m` : 'Set manually'}
                        </div>
                        <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs underline">
                          Open in Google Maps ↗
                        </a>
                      </Popup>
                    </Marker>
                    {location.acc !== 'manual' && (
                      <Circle
                        center={mapPos}
                        radius={parseFloat(location.acc) || 80}
                        pathOptions={{ color:'#ef4444', fillColor:'#ef4444', fillOpacity:0.12, weight:2 }}
                      />
                    )}
                  </>
                ) : (
                  <Marker position={mapPos}>
                    <Popup>
                      <div className="text-sm">🇮🇳 India</div>
                      <div className="text-xs text-gray-500">Allow location or enter manually</div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>

              <div className="p-3 bg-surface-card/50 border-t border-surface-border text-center">
                {location ? (
                  <p className="text-green-400 text-xs">
                    ✓ {location.acc === 'manual' ? 'Manual coordinates shown on map' : 'Live GPS active — updates as you move'}
                  </p>
                ) : locLoading ? (
                  <p className="text-primary-400 text-xs animate-pulse">🛰️ Acquiring GPS signal…</p>
                ) : permDenied ? (
                  <p className="text-amber-400 text-xs">
                    ⚠️ Location blocked — use <strong>How to fix</strong> steps or enter coordinates manually
                  </p>
                ) : (
                  <p className="text-slate-500 text-xs">Allow location access to see your live position on the map</p>
                )}
              </div>
            </div>

            {/* Safety Tips */}
            <div className="glass-card p-5 border border-yellow-500/20">
              <h3 className="text-yellow-400 font-semibold mb-4 flex items-center gap-2 text-sm">
                <AlertTriangle size={14} /> Emergency Safety Tips
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  '🚨 Stay calm — panic reduces your ability to think',
                  '📸 Document everything: photos, videos, screenshots',
                  '📞 Call 100 for police — stay on the line',
                  '💸 Never pay additional "fee" to fraudsters',
                  '🏃 Move to a safe, public place if in danger',
                  '📋 Note time, place, and descriptions of persons',
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-300 bg-white/[0.03] rounded-lg px-3 py-2.5">
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

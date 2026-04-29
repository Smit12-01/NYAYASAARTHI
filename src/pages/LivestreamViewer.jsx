import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { io } from 'socket.io-client'
import {
  AlertTriangle, WifiOff, VideoOff, Radio, Volume2, VolumeX,
  Shield, ShieldAlert, Eye, Phone, Camera, Activity
} from 'lucide-react'

/* ── Config ───────────────────────────────────────────────── */
const BACKEND_URL = import.meta.env.VITE_STREAM_SERVER_URL || 'http://localhost:3001'
const TM_MODEL_URL = 'https://teachablemachine.withgoogle.com/models/JxQWgH30R/'
const EMERGENCY_NUMBER = '+919904033842'
const CONFIDENCE_THRESHOLD = 0.80
const CAPTURE_COOLDOWN_MS = 10000
const DETECTION_INTERVAL = 1000
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
}

export default function LivestreamViewer() {
  const { roomId } = useParams()

  const remoteVideoRef = useRef(null)
  const canvasRef      = useRef(null)
  const socketRef      = useRef(null)
  const pcRef          = useRef(null)
  const iceCacheRef    = useRef([])
  const timeoutRef     = useRef(null)
  const keepAliveRef   = useRef(null)
  const statusRef      = useRef('connecting')
  const modelRef       = useRef(null)
  const detectionTimer = useRef(null)
  const lastCaptureRef = useRef(0)

  const [status, setStatus]             = useState('connecting')
  const [errorMsg, setErrorMsg]         = useState('')
  const [muted, setMuted]               = useState(true)
  const [dots, setDots]                 = useState('')
  const [aiReady, setAiReady]           = useState(false)
  const [aiActive, setAiActive]         = useState(false)
  const [lastLabel, setLastLabel]       = useState('—')
  const [lastConf, setLastConf]         = useState(0)
  const [dangerAlert, setDangerAlert]   = useState(false)
  const [evidence, setEvidence]         = useState([])
  const [modelError, setModelError]     = useState('')
  const [debugLog, setDebugLog]         = useState([])

  const log = useCallback((msg) => {
    console.log('[Viewer]', msg)
    setDebugLog(prev => [...prev.slice(-8), msg])
  }, [])

  const setS = useCallback((s) => { statusRef.current = s; setStatus(s) }, [])

  // Dots animation
  useEffect(() => {
    if (status !== 'connecting') return
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500)
    return () => clearInterval(t)
  }, [status])

  // Mute sync
  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.muted = muted
  }, [muted])

  // Load Teachable Machine model
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        log('Loading AI model...')
        const tm = await import('@teachablemachine/image')
        const model = await tm.load(TM_MODEL_URL + 'model.json', TM_MODEL_URL + 'metadata.json')
        if (!cancelled) { modelRef.current = model; setAiReady(true); log('AI model loaded ✅') }
      } catch (e) {
        if (!cancelled) setModelError('AI model load failed: ' + e.message)
      }
    }
    load()
    return () => { cancelled = true }
  }, [log])

  // Capture frame
  const captureFrame = useCallback(() => {
    const v = remoteVideoRef.current, c = canvasRef.current
    if (!v || !c || v.videoWidth === 0) return null
    c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d').drawImage(v, 0, 0)
    return c.toDataURL('image/jpeg', 0.75)
  }, [])

  // Run AI detection on the livestream video
  const runDetection = useCallback(async () => {
    const model = modelRef.current
    const video = remoteVideoRef.current
    if (!model || !video || video.readyState < 2 || video.videoWidth === 0) return
    try {
      const preds = await model.predict(video)
      if (!preds?.length) return
      let top = preds[0]
      for (const p of preds) if (p.probability > top.probability) top = p
      const { className: label, probability: conf } = top
      setLastLabel(label); setLastConf(conf)
      const now = Date.now()
      if (conf >= CONFIDENCE_THRESHOLD && now - lastCaptureRef.current >= CAPTURE_COOLDOWN_MS) {
        const isWeapon = label.toLowerCase().includes('weapon')
        const isHuman  = label.toLowerCase().includes('human')
        if (isWeapon || isHuman) {
          lastCaptureRef.current = now
          const img = captureFrame()
          const t   = new Date().toLocaleTimeString('en-IN')
          if (img) setEvidence(prev => [{ src: img, label, conf, time: t }, ...prev].slice(0, 20))
          if (isWeapon) setDangerAlert(true)
        }
      }
    } catch (e) { console.error('[AI]', e) }
  }, [captureFrame])

  // Start/stop detection based on stream status
  useEffect(() => {
    if (status === 'live' && aiReady) {
      setAiActive(true)
      detectionTimer.current = setInterval(runDetection, DETECTION_INTERVAL)
    } else {
      setAiActive(false)
      clearInterval(detectionTimer.current)
    }
    return () => clearInterval(detectionTimer.current)
  }, [status, aiReady, runDetection])

  // WebRTC + Socket.io
  useEffect(() => {
    if (!roomId) return

    log(`Room ID: ${roomId}`)
    log(`Backend: ${BACKEND_URL}`)
    setS('connecting')

    const socket = io(BACKEND_URL, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 30,
    })
    socketRef.current = socket

    // 90s timeout if stream never comes
    timeoutRef.current = setTimeout(() => {
      if (statusRef.current !== 'live') {
        log('❌ 90s timeout — no stream received')
        setS('error')
        setErrorMsg(
          'Stream not found after 90 seconds.\n\n' +
          'Check:\n' +
          '• Is broadcaster on Emergency page with camera active?\n' +
          '• Is the room ID in this URL the same one broadcaster generated?\n' +
          '• Is the backend server running? (node server/index.js)\n' +
          `• Backend URL used: ${BACKEND_URL}`
        )
      }
    }, 90000)

    keepAliveRef.current = setInterval(() => {
      if (socket.connected) socket.emit('ping')
    }, 20000)

    socket.on('connect', () => {
      log(`✅ Socket connected — ID: ${socket.id}`)
      log(`Joining room: ${roomId}`)
      socket.emit('livestream:viewer-join', { roomId })
    })

    socket.on('disconnect', (reason) => {
      log(`⚠️ Socket disconnected: ${reason}`)
    })

    socket.on('reconnect', () => {
      log('🔄 Reconnected — re-joining room')
      socket.emit('livestream:viewer-join', { roomId })
    })

    socket.on('connect_error', (err) => {
      log(`connect_error: ${err.message}`)
    })

    socket.on('livestream:waiting', () => {
      log('⏳ Waiting for broadcaster...')
      setS('connecting')
    })

    socket.on('livestream:error', ({ message }) => {
      log(`❌ Server error: ${message}`)
      clearTimeout(timeoutRef.current)
      setS('error')
      setErrorMsg(message)
    })

    socket.on('livestream:offer', async ({ offer, broadcasterId }) => {
      log(`📥 Offer received from broadcaster: ${broadcasterId}`)
      log(`Offer type: ${offer?.type}, SDP length: ${offer?.sdp?.length}`)
      clearTimeout(timeoutRef.current)

      if (pcRef.current) { pcRef.current.close(); pcRef.current = null }

      try {
        const pc = new RTCPeerConnection(ICE_SERVERS)
        pcRef.current = pc
        iceCacheRef.current = []

        pc.ontrack = (e) => {
          log(`🎥 Remote track: ${e.track.kind}`)
          const video = remoteVideoRef.current
          if (!video) return
          if (!video.srcObject) {
            video.srcObject = e.streams[0] || new MediaStream([e.track])
          } else {
            video.srcObject.addTrack(e.track)
          }
          video.muted = true
          video.play()
            .then(() => { log('▶️ Video playing — LIVE'); setS('live') })
            .catch(() => setS('live'))
        }

        pc.onicecandidate = ({ candidate }) => {
          if (candidate) {
            log(`🧊 Sending ICE to broadcaster (${candidate.type})`)
            socket.emit('livestream:ice-candidate', { roomId, candidate, targetId: broadcasterId })
          }
        }

        pc.oniceconnectionstatechange = () => log(`ICE: ${pc.iceConnectionState}`)
        pc.onconnectionstatechange = () => {
          log(`Peer: ${pc.connectionState}`)
          if (pc.connectionState === 'failed') {
            setS('error')
            setErrorMsg('WebRTC P2P failed.\n• Try refreshing both tabs\n• Firewall may be blocking WebRTC\n• Both must be on same network or internet')
          }
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer))
        log('Remote description set')

        for (const c of iceCacheRef.current) {
          try { await pc.addIceCandidate(new RTCIceCandidate(c)) } catch {}
        }
        iceCacheRef.current = []

        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        log('📤 Sending answer to broadcaster')
        socket.emit('livestream:answer', { roomId, answer })
      } catch (err) {
        log(`❌ Offer processing error: ${err.message}`)
        setS('error')
        setErrorMsg('WebRTC offer error: ' + err.message)
      }
    })

    socket.on('livestream:ice-candidate', async ({ candidate, fromId }) => {
      if (!candidate) return
      log(`🧊 ICE from ${fromId} (${candidate?.type})`)
      const pc = pcRef.current
      if (!pc) return
      if (pc.remoteDescription) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)) }
        catch (e) { log(`ICE add failed: ${e.message}`) }
      } else {
        iceCacheRef.current.push(candidate)
      }
    })

    socket.on('livestream:ended', () => {
      log('🔴 Stream ended by broadcaster')
      clearTimeout(timeoutRef.current)
      setS('ended')
      if (pcRef.current) { pcRef.current.close(); pcRef.current = null }
    })

    return () => {
      log('Cleanup')
      clearTimeout(timeoutRef.current)
      clearInterval(keepAliveRef.current)
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null }
      if (pcRef.current) { pcRef.current.close(); pcRef.current = null }
    }
  }, [roomId, log, setS])

  const labelColor = () =>
    lastLabel.toLowerCase().includes('weapon') ? 'text-red-400' :
    lastLabel.toLowerCase().includes('human') ? 'text-yellow-400' : 'text-green-400'
  const confPct = (lastConf * 100).toFixed(1)

  return (
    <div className="h-screen overflow-hidden bg-slate-950 flex flex-col">

      {/* Header */}
      <div className="bg-slate-900/80 border-b border-red-500/30 px-4 py-3 flex items-center justify-between backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
            <AlertTriangle size={14} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Emergency Livestream</p>
            <p className="text-slate-400 text-[10px] font-mono truncate max-w-[200px]">Room: {roomId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${aiActive ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
            <Activity size={10} className={aiActive ? 'animate-pulse' : ''} />
            AI {aiActive ? 'Active' : 'Inactive'}
          </span>
          {status === 'live' && (
            <button onClick={() => setMuted(m => !m)} className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs px-3 py-1.5 rounded-full transition-all">
              {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}{muted ? 'Unmute' : 'Mute'}
            </button>
          )}
          <AnimatePresence mode="wait">
            {status === 'live' && <motion.span key="live" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold px-3 py-1 rounded-full"><Radio size={10} className="animate-pulse" /> LIVE</motion.span>}
            {status === 'connecting' && <motion.span key="conn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-slate-400 text-xs flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />Connecting{dots}</motion.span>}
            {status === 'ended' && <motion.span key="ended" className="text-slate-500 text-xs">Stream ended</motion.span>}
          </AnimatePresence>
        </div>
      </div>

      {/* Weapon Alert Banner */}
      <AnimatePresence>
        {dangerAlert && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-red-600/20 border-b-2 border-red-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert size={20} className="text-red-400 animate-pulse" />
              <div>
                <p className="text-red-300 font-bold text-sm">⚠️ WEAPON DETECTED — Danger Alert</p>
                <p className="text-red-400/70 text-xs">Evidence captured from livestream. Contact emergency if required.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href={`tel:${EMERGENCY_NUMBER}`} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all">
                <Phone size={14} /> Call Emergency
              </a>
              <button onClick={() => setDangerAlert(false)} className="text-red-400 hover:text-red-200 text-xs px-2 py-1 rounded border border-red-500/30">Dismiss</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {modelError && <div className="bg-orange-900/30 border-b border-orange-500/30 px-4 py-2 text-orange-300 text-xs flex items-center gap-2"><AlertTriangle size={12} />{modelError}</div>}

      {/* Main layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* Video area */}
        <div className="flex-1 relative bg-black flex items-center justify-center">
          <video ref={remoteVideoRef} autoPlay muted playsInline className="w-full h-full object-contain max-h-[calc(100vh-200px)]" />
          <canvas ref={canvasRef} className="hidden" />

          {status === 'live' && muted && (
            <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={() => setMuted(false)}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 border border-white/20 text-white text-sm px-4 py-2 rounded-full backdrop-blur-sm hover:bg-black/90 transition-all">
              <VolumeX size={14} /> Tap to unmute audio
            </motion.button>
          )}

          <AnimatePresence>
            {status === 'connecting' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950">
                <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <p className="text-slate-300 text-sm font-medium">Connecting to stream{dots}</p>
                <p className="text-slate-500 text-xs text-center px-8">Waiting for broadcaster's camera…</p>
                {/* Debug log */}
                <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-3 max-w-sm w-full mx-4">
                  <p className="text-slate-500 text-[10px] uppercase tracking-wide mb-2">Debug Log</p>
                  {debugLog.map((l, i) => <p key={i} className="text-slate-400 text-[10px] font-mono">{l}</p>)}
                </div>
              </motion.div>
            )}
            {status === 'ended' && (
              <motion.div key="ended" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center"><VideoOff size={28} className="text-slate-500" /></div>
                <p className="text-white font-semibold">Stream has ended</p>
                <p className="text-slate-400 text-sm">The broadcaster stopped the livestream.</p>
              </motion.div>
            )}
            {status === 'error' && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 bg-slate-950 overflow-y-auto">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center"><WifiOff size={28} className="text-red-400" /></div>
                <p className="text-white font-semibold">Stream Unavailable</p>
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 max-w-sm w-full text-left">
                  <p className="text-red-300 text-xs whitespace-pre-wrap">{errorMsg}</p>
                </div>
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 max-w-sm w-full">
                  <p className="text-slate-400 text-[10px] uppercase tracking-wide mb-2">Connection Log</p>
                  {debugLog.map((l, i) => <p key={i} className="text-slate-400 text-[10px] font-mono">{l}</p>)}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => window.location.reload()} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-colors">🔄 Retry</button>
                  <a href="/emergency" className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-colors">Emergency Page</a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI Side Panel — overflow-hidden so the panel itself never scrolls */}
        <div className="w-full lg:w-80 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} className="text-purple-400" />
              <p className="text-white text-sm font-bold">AI Safety Monitor</p>
              <span className="text-slate-600 text-[10px] ml-auto">Monitoring livestream</span>
            </div>

            {status !== 'live' && (
              <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-3 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-600" />
                <p className="text-slate-400 text-xs">Waiting for livestream to start…</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-800/60 rounded-xl p-3">
                <p className="text-slate-400 text-[10px] uppercase tracking-wide mb-1">AI Status</p>
                <p className={`text-xs font-bold flex items-center gap-1.5 ${aiActive ? 'text-purple-300' : 'text-slate-500'}`}>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${aiActive ? 'bg-purple-400 animate-pulse' : 'bg-slate-600'}`} />
                  {aiActive ? 'Detecting' : aiReady ? 'Ready' : 'Loading…'}
                </p>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-3">
                <p className="text-slate-400 text-[10px] uppercase tracking-wide mb-1">Evidence</p>
                <p className="text-white text-xs font-bold flex items-center gap-1"><Camera size={10} className="text-slate-400" />{evidence.length} captured</p>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-3 col-span-2">
                <p className="text-slate-400 text-[10px] uppercase tracking-wide mb-1">Last Detection</p>
                <div className="flex items-center justify-between">
                  <p className={`text-xs font-bold ${labelColor()}`}><Eye size={10} className="inline mr-1" />{lastLabel}</p>
                  {lastConf > 0 && <span className="text-slate-400 text-[10px] font-mono">{confPct}%</span>}
                </div>
                {lastConf > 0 && (
                  <div className="mt-2 w-full bg-slate-700 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${lastLabel.toLowerCase().includes('weapon') ? 'bg-red-500' : lastLabel.toLowerCase().includes('human') ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${confPct}%` }} />
                  </div>
                )}
              </div>
            </div>

            <a href={`tel:${EMERGENCY_NUMBER}`} className="mt-3 w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-300 text-xs font-bold px-3 py-2.5 rounded-xl transition-all">
              <Phone size={12} /> Call Emergency: {EMERGENCY_NUMBER}
            </a>
          </div>

          {/* Evidence log — fills remaining sidebar height, scrolls internally */}
          <div className="flex-1 min-h-0 flex flex-col p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-300 text-xs font-bold uppercase tracking-wide">Evidence Log</p>
              {evidence.length > 0 && <button onClick={() => { setEvidence([]); setDangerAlert(false) }} className="text-slate-500 hover:text-slate-300 text-[10px] transition-colors">Clear all</button>}
            </div>
            {evidence.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3"><Camera size={18} className="text-slate-600" /></div>
                <p className="text-slate-500 text-xs">No evidence captured yet.</p>
                <p className="text-slate-600 text-[10px] mt-1">AI auto-captures from the livestream<br />when Human or Weapon exceeds 80%</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                <AnimatePresence>
                  {evidence.map((ev, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                      className={`rounded-xl overflow-hidden border flex-shrink-0 ${ev.label.toLowerCase().includes('weapon') ? 'border-red-500/50 bg-red-900/10' : 'border-slate-700 bg-slate-800/40'}`}>
                      {/* Aspect-ratio box: always shows full image, no clipping */}
                      <div className="w-full bg-black" style={{ aspectRatio: '16/9' }}>
                        <img src={ev.src} alt="Evidence" className="w-full h-full object-contain" />
                      </div>
                      <div className="px-2 py-1.5 flex items-center justify-between">
                        <span className={`text-[10px] font-bold ${ev.label.toLowerCase().includes('weapon') ? 'text-red-400' : ev.label.toLowerCase().includes('human') ? 'text-yellow-400' : 'text-green-400'}`}>
                          {ev.label.toLowerCase().includes('weapon') ? '⚠️ ' : '👁 '}{ev.label}
                        </span>
                        <span className="text-slate-500 text-[10px]">{ev.time}</span>
                      </div>
                      <div className="px-2 pb-1.5">
                        <span className="text-slate-400 text-[10px] font-mono">Confidence: {(ev.conf * 100).toFixed(1)}%</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-900/80 border-t border-slate-800 px-4 py-3 flex items-center justify-between">
        <p className="text-slate-500 text-xs">🔒 P2P encrypted — NyayaSaarthi AI Safety</p>
        <a href="tel:112" className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">📞 Call 112</a>
      </div>
    </div>
  )
}

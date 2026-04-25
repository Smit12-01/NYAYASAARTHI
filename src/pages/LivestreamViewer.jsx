import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { io } from 'socket.io-client'
import { AlertTriangle, WifiOff, VideoOff, Radio, Volume2, VolumeX } from 'lucide-react'

const STUN = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
}
const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function LivestreamViewer() {
  const { roomId } = useParams()
  const remoteVideoRef = useRef(null)
  const socketRef      = useRef(null)
  const pcRef          = useRef(null)
  const iceCacheRef    = useRef([])          // queue ICE candidates before remote desc
  const timeoutRef     = useRef(null)
  const statusRef      = useRef('waking')

  const [status, setStatus]         = useState('waking')
  const [errorMsg, setErrorMsg]     = useState('')
  const [muted, setMuted]           = useState(true)   // start muted to allow autoplay
  const [wakingDots, setWakingDots] = useState('')

  const setStatusSafe = (s) => { statusRef.current = s; setStatus(s) }

  // Animate dots
  useEffect(() => {
    if (status !== 'waking' && status !== 'connecting') return
    const t = setInterval(() => setWakingDots(d => d.length >= 3 ? '' : d + '.'), 500)
    return () => clearInterval(t)
  }, [status])

  // Sync muted state to video element
  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.muted = muted
  }, [muted])

  useEffect(() => {
    if (!roomId) return

    // Wake Render free-tier backend, then connect
    setStatusSafe('waking')
    fetch(`${SERVER_URL}/health`).catch(() => {}).finally(connect)

    function connect() {
      setStatusSafe('connecting')

      const socket = io(SERVER_URL, { transports: ['polling', 'websocket'] })
      socketRef.current = socket

      // Timeout: show error after 30s if stream never arrives
      timeoutRef.current = setTimeout(() => {
        if (statusRef.current !== 'live') {
          setStatusSafe('error')
          setErrorMsg('No stream found. Make sure the broadcaster has started the camera and both devices are online.')
        }
      }, 30000)

      socket.on('connect', () => {
        console.log('[Viewer] Socket connected, joining room:', roomId)
        socket.emit('livestream:viewer-join', { roomId })
      })

      socket.on('connect_error', (err) => {
        console.error('[Viewer] Socket error:', err.message)
        clearTimeout(timeoutRef.current)
        setStatusSafe('error')
        setErrorMsg('Cannot connect to server. Check internet connection.')
      })

      socket.on('livestream:waiting', () => {
        console.log('[Viewer] Waiting for broadcaster...')
        setStatusSafe('connecting')
      })

      socket.on('livestream:error', ({ message }) => {
        clearTimeout(timeoutRef.current)
        setStatusSafe('error')
        setErrorMsg(message)
      })

      // Broadcaster sent offer — do WebRTC handshake
      socket.on('livestream:offer', async ({ offer, broadcasterId }) => {
        console.log('[Viewer] Got offer from broadcaster:', broadcasterId)
        clearTimeout(timeoutRef.current)

        const pc = new RTCPeerConnection(STUN)
        pcRef.current = pc
        iceCacheRef.current = []

        // ── KEY FIX: video is muted so autoplay is allowed ──────────────────
        pc.ontrack = (event) => {
          console.log('[Viewer] Got track:', event.track.kind)
          if (!remoteVideoRef.current) return
          if (!remoteVideoRef.current.srcObject) {
            remoteVideoRef.current.srcObject = event.streams[0] || new MediaStream([event.track])
          } else {
            remoteVideoRef.current.srcObject.addTrack(event.track)
          }
          // Explicitly play (muted = autoplay-safe)
          remoteVideoRef.current.muted = true   // muted allows autoplay
          remoteVideoRef.current.play().then(() => {
            setStatusSafe('live')
            console.log('[Viewer] Video playing ✓')
          }).catch(err => {
            console.error('[Viewer] play() failed:', err)
            // Still show live — user can click to play
            setStatusSafe('live')
          })
        }

        pc.onconnectionstatechange = () => {
          console.log('[Viewer] Peer state:', pc.connectionState)
          if (pc.connectionState === 'failed') {
            setStatusSafe('error')
            setErrorMsg('Connection failed. Try refreshing both pages.')
          }
        }

        // Send ICE candidates to broadcaster
        pc.onicecandidate = ({ candidate }) => {
          if (candidate) {
            socket.emit('livestream:ice-candidate', { roomId, candidate, targetId: broadcasterId })
          }
        }

        // Set remote description first
        await pc.setRemoteDescription(new RTCSessionDescription(offer))

        // Flush any cached candidates that arrived before remote desc
        for (const c of iceCacheRef.current) {
          try { await pc.addIceCandidate(new RTCIceCandidate(c)) } catch {}
        }
        iceCacheRef.current = []

        // Create and send answer
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.emit('livestream:answer', { roomId, answer })
        console.log('[Viewer] Answer sent')
      })

      // ICE candidates from broadcaster — queue if remote desc not set yet
      socket.on('livestream:ice-candidate', async ({ candidate }) => {
        if (!candidate) return
        const pc = pcRef.current
        if (pc && pc.remoteDescription) {
          try { await pc.addIceCandidate(new RTCIceCandidate(candidate)) } catch {}
        } else {
          iceCacheRef.current.push(candidate)
        }
      })

      socket.on('livestream:ended', () => {
        clearTimeout(timeoutRef.current)
        setStatusSafe('ended')
        if (pcRef.current) { pcRef.current.close(); pcRef.current = null }
      })
    }

    return () => {
      clearTimeout(timeoutRef.current)
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null }
      if (pcRef.current) { pcRef.current.close(); pcRef.current = null }
    }
  }, [roomId])

  const statusLabel = {
    waking:     `Waking up server${wakingDots}`,
    connecting: `Connecting to stream${wakingDots}`,
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">

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
          {/* Mute toggle — always visible when live */}
          {status === 'live' && (
            <button
              onClick={() => setMuted(m => !m)}
              className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs px-3 py-1.5 rounded-full transition-all"
            >
              {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
              {muted ? 'Unmute' : 'Mute'}
            </button>
          )}

          <AnimatePresence mode="wait">
            {status === 'live' && (
              <motion.span key="live" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold px-3 py-1 rounded-full">
                <Radio size={10} className="animate-pulse" /> LIVE
              </motion.span>
            )}
            {(status === 'waking' || status === 'connecting') && (
              <motion.span key="conn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-slate-400 text-xs flex items-center gap-1.5">
                <div className="w-3 h-3 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                {statusLabel[status]}
              </motion.span>
            )}
            {status === 'ended' && (
              <motion.span key="ended" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-slate-500 text-xs">Stream ended</motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 relative bg-black flex items-center justify-center">

        {/* Video element — always mounted, muted for autoplay */}
        <video
          ref={remoteVideoRef}
          autoPlay
          muted          /* muted = autoplay allowed by browser */
          playsInline
          className="w-full h-full object-contain max-h-[calc(100vh-120px)]"
        />

        {/* Unmute prompt when live */}
        {status === 'live' && muted && (
          <motion.button
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => setMuted(false)}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 border border-white/20 text-white text-sm px-4 py-2 rounded-full backdrop-blur-sm hover:bg-black/90 transition-all"
          >
            <VolumeX size={14} /> Tap to unmute audio
          </motion.button>
        )}

        {/* Overlays */}
        <AnimatePresence>
          {(status === 'waking' || status === 'connecting') && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950">
              <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
              <p className="text-slate-300 text-sm font-medium">{statusLabel[status]}</p>
              {status === 'waking' && (
                <p className="text-slate-500 text-xs text-center px-8">
                  Server may be sleeping.<br />This takes up to 30 seconds on first load.
                </p>
              )}
              {status === 'connecting' && (
                <p className="text-slate-500 text-xs">Waiting for broadcaster's camera…</p>
              )}
            </motion.div>
          )}

          {status === 'ended' && (
            <motion.div key="ended" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                <VideoOff size={28} className="text-slate-500" />
              </div>
              <p className="text-white font-semibold">Stream has ended</p>
              <p className="text-slate-400 text-sm">The broadcaster stopped the livestream.</p>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 bg-slate-950">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <WifiOff size={28} className="text-red-400" />
              </div>
              <p className="text-white font-semibold">Stream Unavailable</p>
              <p className="text-slate-400 text-sm text-center max-w-xs">{errorMsg}</p>
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 max-w-sm text-left">
                <p className="text-slate-300 text-xs font-semibold mb-2">💡 Common fixes:</p>
                <ul className="text-slate-400 text-xs space-y-1.5 list-disc list-inside">
                  <li>Broadcaster must click <strong className="text-white">📷 Live Camera</strong> first</li>
                  <li>Link with <code className="bg-slate-700 px-1 rounded">localhost</code> only works on the same computer — use the Network IP shown in terminal</li>
                  <li>Both devices must be on the same WiFi or internet</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <button onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-colors">
                  🔄 Retry
                </button>
                <a href="/emergency" className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-colors">
                  Emergency Page
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="bg-slate-900/80 border-t border-slate-800 px-4 py-3 flex items-center justify-between">
        <p className="text-slate-500 text-xs">🔒 P2P encrypted video — NyayaBot Emergency</p>
        <a href="tel:112" className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
          📞 Call 112
        </a>
      </div>
    </div>
  )
}

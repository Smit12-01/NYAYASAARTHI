import axios from 'axios'
import { io } from 'socket.io-client'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// ── Socket initialization ──────────────────────────────────────────────────
export const socket = io(API_BASE, { autoConnect: false })

export function connectSocket() {
  if (!socket.connected) socket.connect()
}

export function disconnectSocket() {
  if (socket.connected) socket.disconnect()
}

// ── Legacy chat API call (still works if needed) ───────────────────────────
export async function sendLegalQuery({ message, category, history }) {
  try {
    const res = await axios.post(`${API_BASE}/api/chat`, {
      message,
      category,
      history,
    }, { timeout: 30000 })
    return { success: true, data: res.data }
  } catch (err) {
    return { success: false, error: err.message, data: { reply: 'Error connecting to server.', isDemo: true } }
  }
}

// ── Streaming Chat ─────────────────────────────────────────────────────────
export function streamLegalQuery({ message, category, history, onChunk, onEnd, onError }) {
  connectSocket()

  // Clean listeners
  socket.off('chat:stream')
  socket.off('chat:end')
  socket.off('chat:error')

  socket.on('chat:stream', (chunk) => onChunk(chunk))
  socket.on('chat:end', (data) => onEnd(data))
  socket.on('chat:error', (err) => onError(err))

  socket.emit('chat:message', { message, category, history })
}

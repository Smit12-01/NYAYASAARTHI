// aiService.js — routes all AI calls through backend /api/chat
// API key is NEVER in the frontend — it lives only in server/.env

// In local dev: VITE_API_BASE_URL=http://localhost:3001
// On Vercel:    VITE_API_BASE_URL=https://nyayabot-backend.onrender.com  (set in Vercel dashboard)
// Fallback:     empty string → relative /api/chat (for Vercel serverless if ever needed)
const BASE = import.meta.env.VITE_API_BASE_URL || ''
const API_URL = `${BASE}/api/chat`

/**
 * streamLegalQuery — POSTs to backend /api/chat and simulates word-by-word streaming.
 */
export async function streamLegalQuery({ message, category, history, onChunk, onEnd, onError }) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, category, history }),
    })

    // Surface HTTP errors clearly with the actual server message
    if (!response.ok) {
      let errMsg = `Server error ${response.status}`
      try {
        const errBody = await response.json()
        if (errBody?.error) errMsg = errBody.error
      } catch {}
      throw new Error(errMsg)
    }

    const data = await response.json()

    if (!data?.reply) {
      throw new Error('Empty response from AI — please try again.')
    }

    // Simulate word-by-word streaming for smooth UX
    const words = data.reply.split(' ')
    for (let i = 0; i < words.length; i++) {
      onChunk(words[i] + (i < words.length - 1 ? ' ' : ''))
      await sleep(12)
    }

    onEnd({
      fullReply: data.reply,
      isDemo:    data.isDemo   || false,
      engine:    data.engine   || 'unknown',
      timestamp: data.timestamp || new Date().toISOString(),
    })

  } catch (err) {
    console.error('[aiService] Error:', err.message)
    onError({ message: err.message })
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

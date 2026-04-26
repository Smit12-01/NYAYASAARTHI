// aiService.js — routes all AI calls through /api/chat (Vercel serverless)
// This avoids CORS issues with direct Pollinations calls from the browser.

const API_URL = '/api/chat'

/**
 * streamLegalQuery — calls /api/chat and simulates word-by-word streaming.
 */
export async function streamLegalQuery({ message, category, history, onChunk, onEnd, onError }) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, category, history }),
    })

    // Surface HTTP errors clearly
    if (!response.ok) {
      let errMsg = `Server error: ${response.status}`
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

// aiService.js — calls Pollinations AI directly from the frontend
// No API key required. Works everywhere: local, Vercel, Render, etc.

const POLLINATIONS_URL = 'https://text.pollinations.ai/'

const categoryContext = {
  fraud:    'online fraud, cybercrime, UPI fraud, phishing, IT Act 2000, Section 66C, Section 66D',
  police:   'police rights, arrest procedures, bail, CrPC, FIR filing, detention rights',
  rental:   'rental disputes, tenant rights, landlord issues, Rent Control Act, eviction',
  consumer: 'consumer rights, Consumer Protection Act 2019, NCDRC, product defects',
  ipc:      'IPC sections, criminal law, offences and penalties',
  it:       'IT Act 2000, cybercrime law, digital rights',
  crpc:     'Code of Criminal Procedure, FIR, bail, chargesheet, magistrate',
  tenant:   'tenant protection, rental agreements, rent courts',
}

function getSystemPrompt(category) {
  const context = categoryContext[category] || 'general Indian legal matters'
  return `You are NyayaSaarthi, an expert AI legal assistant specializing in Indian law.

FOCUS AREA: ${context}

RESPONSE FORMAT (always use this markdown structure):
## 🔍 Understanding Your Situation
[2-3 sentence analysis of the legal scenario]

## ⚖️ Applicable Laws & Rights
- **[Law Name, Section Number]**: Brief explanation of how it applies
[List 3-5 most relevant laws]

## 🎯 Immediate Action Steps
1. [Action] — [Why and when, with timeline]
2. [Continue numbered list]

## 📞 Important Contacts & Resources
- [Helpline/Authority]: [Contact details]

## ⚠️ Important Notes
[Key warnings, caveats, when to hire a lawyer]

---
*Disclaimer: This is general legal information, not professional legal advice. Consult a qualified advocate for your specific case.*

RULES:
- Only cite REAL Indian laws (IPC, CrPC, IT Act 2000, Constitution, Consumer Protection Act, etc.)
- If user writes in Hindi, respond primarily in Hindi with English legal terms
- Always recommend consulting a lawyer for serious criminal matters
- Be concise, clear, and actionable — not verbose
- If question is unrelated to law, politely redirect: "I specialise in Indian legal matters..."
- Never fabricate case law or section numbers`
}

/**
 * Send a legal query and return the AI response directly from Pollinations.
 */
export async function sendLegalQuery({ message, category, history }) {
  const messages = [
    { role: 'system', content: getSystemPrompt(category) },
    ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ]

  const response = await fetch(POLLINATIONS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model: 'openai' }),
  })

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status} ${response.statusText}`)
  }

  const reply = await response.text()

  return {
    success: true,
    data: {
      reply,
      isDemo: false,
      timestamp: new Date().toISOString(),
    },
  }
}

/**
 * streamLegalQuery — calls Pollinations and simulates word-by-word streaming
 * for a smooth typing effect in the UI.
 */
export async function streamLegalQuery({ message, category, history, onChunk, onEnd, onError }) {
  try {
    const result = await sendLegalQuery({ message, category, history })
    const { reply, isDemo, timestamp } = result.data
    const words = reply.split(' ')

    // Simulate streaming word-by-word for smooth UX
    for (let i = 0; i < words.length; i++) {
      onChunk(words[i] + (i < words.length - 1 ? ' ' : ''))
      await sleep(15)
    }

    onEnd({ fullReply: reply, isDemo, timestamp })
  } catch (err) {
    console.error('[aiService] Pollinations API error:', err.message)
    onError({ message: err.message })
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

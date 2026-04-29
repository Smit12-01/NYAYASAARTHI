// api/chat.js — Vercel Serverless Function
// AI: Gemini 1.5 Flash via REST API (no npm package needed)
// Fallback: Pollinations free API
// Final fallback: demo response (never returns 500)

// ── Category context ───────────────────────────────────────────────────────────
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
## Understanding Your Situation
[2-3 sentence analysis of the legal scenario]

## Applicable Laws & Rights
- **[Law Name, Section Number]**: Brief explanation of how it applies
[List 3-5 most relevant laws]

## Immediate Action Steps
1. [Action] - [Why and when, with timeline]
2. [Continue numbered list]

## Important Contacts & Resources
- [Helpline/Authority]: [Contact details]

## Important Notes
[Key warnings, caveats, when to hire a lawyer]

---
*Disclaimer: This is general legal information, not professional legal advice.*

RULES:
- Only cite REAL Indian laws (IPC, CrPC, IT Act 2000, Constitution, Consumer Protection Act, etc.)
- If user writes in Hindi, respond primarily in Hindi with English legal terms
- Always recommend consulting a lawyer for serious criminal matters
- Be concise, clear, and actionable
- Never fabricate case law or section numbers`
}

function getDemoResponse(category) {
  const demos = {
    fraud: `## Understanding Your Situation
This appears to involve online fraud or cybercrime - one of the fastest-growing legal issues in India.

## Applicable Laws & Rights
- **IT Act 2000, Section 66C**: Identity theft - imprisonment up to 3 years + fine up to Rs 1 lakh
- **IT Act 2000, Section 66D**: Cheating by personation using computer - up to 3 years
- **IPC Section 420**: Cheating and dishonestly inducing delivery of property
- **RBI Circular 2017**: Zero liability for unauthorized transactions reported within 3 days

## Immediate Action Steps
1. **Within 1 hour** - Call **1930** (National Cyber Crime Helpline, 24x7)
2. **Within 3 hours** - Register complaint at **cybercrime.gov.in**
3. **Same day** - Visit your bank, request transaction reversal
4. **Within 24 hours** - File FIR at nearest police station under IT Act 66C/66D

## Important Contacts & Resources
- **Cyber Crime Helpline**: 1930
- **Portal**: cybercrime.gov.in
- **RBI Banking Helpline**: 14448

## Important Notes
- Preserve all evidence: screenshots, transaction IDs, emails
- Banks under RBI mandate must resolve fraud complaints within 90 days
- Do NOT share OTPs or re-engage with the fraudster

---
*Disclaimer: This is general legal information, not professional legal advice.*`,

    police: `## Understanding Your Situation
Your query involves police interactions and arrest rights under Indian law.

## Applicable Laws & Rights
- **CrPC Section 50**: Right to be informed of grounds of arrest immediately
- **CrPC Section 56**: Must be produced before magistrate within 24 hours
- **Article 22**: Constitutional right to consult and be defended by a lawyer
- **CrPC Section 41A**: Police must issue notice before arrest in many cases

## Immediate Action Steps
1. **At arrest** - Ask: "What is the reason for my arrest?" (your legal right)
2. **Immediately** - Request to inform one family member or friend
3. **Right now** - Ask for access to your lawyer
4. **Within 24 hours** - You MUST be presented before a Magistrate

## Important Contacts & Resources
- **Police Control Room**: 100
- **National Legal Services Authority**: 15100 (free legal aid)
- **National Human Rights Commission**: nhrc.nic.in

## Important Notes
- Police CANNOT hold you beyond 24 hours without magistrate's remand order
- You have the right to REMAIN SILENT
- FIR copy is your legal right - police must provide it free within 24 hours

---
*Disclaimer: This is general legal information, not professional legal advice.*`,
  }
  return demos[category] || demos.fraud
}

// ── Rate limiting ──────────────────────────────────────────────────────────────
const rateMap = new Map()
function rateLimit(ip, limit = 20, windowMs = 60000) {
  const now = Date.now()
  const rec = rateMap.get(ip) || { count: 0, reset: now + windowMs }
  if (now > rec.reset) { rec.count = 0; rec.reset = now + windowMs }
  rec.count++
  rateMap.set(ip, rec)
  return rec.count <= limit
}

// ── Gemini REST API — no npm package, just fetch ──────────────────────────────
async function callGeminiREST(systemPrompt, history, userMessage) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')

  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey

  // Gemini requires: non-empty content, starts with 'user', alternating roles
  var rawHistory = (history || []).filter(function(h) {
    return h && h.content && typeof h.content === 'string' && h.content.trim().length > 0
  })

  // Drop leading 'model' turns — Gemini rejects history that starts with model
  while (rawHistory.length > 0 && rawHistory[0].role !== 'user') {
    rawHistory.shift()
  }

  var contents = rawHistory.slice(-6).map(function(h) {
    return {
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }],
    }
  })

  // Always append the current user message
  contents.push({ role: 'user', parts: [{ text: userMessage }] })

  var resp = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: contents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig:  { temperature: 0.3, maxOutputTokens: 2048 },
    }),
  })

  if (!resp.ok) {
    var errBody = await resp.json().catch(function() { return {} })
    var msg = (errBody && errBody.error && errBody.error.message) || resp.statusText
    throw new Error('Gemini REST ' + resp.status + ': ' + msg)
  }

  var data = await resp.json()
  var text =
    data &&
    data.candidates &&
    data.candidates[0] &&
    data.candidates[0].content &&
    data.candidates[0].content.parts &&
    data.candidates[0].content.parts[0] &&
    data.candidates[0].content.parts[0].text

  if (!text) {
    // Log full response to help debug safety blocks etc.
    console.error('[Gemini] Unexpected response:', JSON.stringify(data).substring(0, 500))
    throw new Error('Gemini returned empty/blocked response')
  }
  return text
}

// ── Pollinations fallback ──────────────────────────────────────────────────────
async function callPollinations(systemPrompt, history, userMessage) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6).map(function(h) { return { role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content } }),
    { role: 'user', content: userMessage },
  ]
  const response = await fetch('https://text.pollinations.ai/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: messages, model: 'openai' }),
  })
  if (!response.ok) throw new Error('Pollinations ' + response.status + ': ' + response.statusText)
  return response.text()
}

// ── Main handler ───────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  // CORS — same-origin on Vercel, but set header for safety
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!reply) {
    reply = getDemoResponse(category)
    isDemo = true
    usedEngine = 'demo'
    console.log('[Chat] FALLBACK using demo response')
  }

  console.log('[Chat] Sending response — engine=' + usedEngine + ' isDemo=' + isDemo)

  return res.json({
    reply:     reply,
    category:  category,
    isDemo:    isDemo,
    engine:    usedEngine,
    timestamp: new Date().toISOString(),
  })
}

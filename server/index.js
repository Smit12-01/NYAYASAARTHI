const express    = require('express')
const cors       = require('cors')
const helmet     = require('helmet')
const morgan     = require('morgan')
const http       = require('http')
const { Server } = require('socket.io')
require('dotenv').config()

const app = express()

// ── CORS origins ──────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://nyayasaarthi.vercel.app',
  /https:\/\/nyayasaarthi.*\.vercel\.app/,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean)

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    const ok = ALLOWED_ORIGINS.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    )
    cb(ok ? null : new Error(`CORS blocked: ${origin}`), ok)
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
}

const server = http.createServer(app)
const io     = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'], credentials: true },
  // Keep connections alive on Render free tier (which kills idle sockets)
  pingInterval: 10000,   // send ping every 10s
  pingTimeout:  60000,   // wait 60s for pong before disconnecting
  transports:   ['polling', 'websocket'],
})

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors(corsOptions))
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))

// ── AI clients (lazy-loaded) ──────────────────────────────────────────────────
function getGemini() {
  if (!process.env.GEMINI_API_KEY) return null
  const { GoogleGenerativeAI } = require('@google/generative-ai')
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
}

const openai = process.env.OPENAI_API_KEY
  ? (() => { const OpenAI = require('openai'); return new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) })()
  : null

// ── System prompt ─────────────────────────────────────────────────────────────
function getSystemPrompt(category) {
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

// ── Rate limiting (simple in-memory) ─────────────────────────────────────────
const rateMap = new Map()
function rateLimit(ip, limit = 20, window = 60000) {
  const now = Date.now()
  const record = rateMap.get(ip) || { count: 0, reset: now + window }
  if (now > record.reset) { record.count = 0; record.reset = now + window }
  record.count++
  rateMap.set(ip, record)
  return record.count <= limit
}

// ── Root health ───────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'NyayaSaarthi API', version: '1.0.0' })
})

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'NyayaSaarthi API',
    version: '1.0.0',
    gemini:  !!process.env.GEMINI_API_KEY,
    openai:  !!openai,
    timestamp: new Date().toISOString(),
  })
})

// ── AI chat handler (Gemini → Pollinations → demo) ────────────────────────────
async function handleAiChat(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'
  if (!rateLimit(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please wait 1 minute.' })
  }

  const { message, category = 'fraud', history = [] } = req.body || {}

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required.' })
  }
  if (message.length > 1000) {
    return res.status(400).json({ error: 'Message too long (max 1000 characters).' })
  }

  const systemPrompt = getSystemPrompt(category)
  let reply = null
  let isDemo = false
  let engine = ''

  // 1️⃣ Try Gemini
  const gemini = getGemini()
  if (gemini) {
    try {
      const model = gemini.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: systemPrompt,
      })
      const chatHistory = history.slice(-6).map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }],
      }))
      const chat = model.startChat({ history: chatHistory })
      const result = await chat.sendMessage(message)
      reply = result.response.text()
      engine = 'gemini'
      console.log(`[AI] ✅ Gemini responded (${reply.length} chars)`)
    } catch (err) {
      console.error('[AI] ❌ Gemini failed:', err.message)
    }
  } else {
    console.warn('[AI] ⚠️  GEMINI_API_KEY not set')
  }

  // 2️⃣ Try OpenAI
  if (!reply && openai) {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message },
      ]
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', messages, max_tokens: 1200, temperature: 0.3,
      })
      reply = completion.choices[0].message.content
      engine = 'openai'
      console.log(`[AI] ✅ OpenAI responded`)
    } catch (err) {
      console.error('[AI] ❌ OpenAI failed:', err.message)
    }
  }

  // 3️⃣ Try Pollinations (free fallback)
  if (!reply) {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message },
      ]
      const pollRes = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, model: 'openai' }),
      })
      if (pollRes.ok) {
        reply = await pollRes.text()
        engine = 'pollinations'
        console.log(`[AI] ✅ Pollinations responded`)
      } else {
        throw new Error(`Pollinations ${pollRes.status}`)
      }
    } catch (err) {
      console.error('[AI] ❌ Pollinations failed:', err.message)
    }
  }

  // 4️⃣ Demo fallback — always works
  if (!reply) {
    const demo = getDemoResponse(message, category)
    reply = demo.reply
    isDemo = true
    engine = 'demo'
    console.log('[AI] ⚠️  Using demo response')
  }

  return res.json({ reply, category, isDemo, engine, timestamp: new Date().toISOString() })
}

app.post('/api/chat', handleAiChat)
app.post('/api/ask',  handleAiChat)  // alias used by some frontend versions

// ── Categories endpoint ───────────────────────────────────────────────────────
app.get('/api/categories', (req, res) => {
  res.json([
    { id: 'fraud',    label: 'Online Fraud',    laws: ['IT Act 2000', 'IPC 420', 'IPC 66C'] },
    { id: 'police',   label: 'Police Rights',   laws: ['CrPC 50-56', 'Article 22'] },
    { id: 'rental',   label: 'Rental Disputes', laws: ['Model Tenancy Act 2021', 'TPA 1882'] },
    { id: 'consumer', label: 'Consumer Rights', laws: ['Consumer Protection Act 2019'] },
  ])
})

// ── WebSocket chat (real-time streaming) ───────────────────────────────────────

// Livestream rooms: roomId → { broadcasterId, viewerIds[] }
const livestreamRooms  = new Map()
// Viewers who arrived before broadcaster: roomId → [{ socketId, timeout }]
const pendingViewers   = new Map()
// Grace-period reconnect timers: roomId → timeoutHandle
const reconnectTimers  = new Map()

io.on('connection', (socket) => {
  console.log('[WS] Connected:', socket.id)

  // ── Livestream signaling ──────────────────────────────────────────────────

  // Broadcaster creates / re-registers a room
  socket.on('livestream:join', ({ roomId }) => {
    if (!roomId) return
    socket.join(roomId)

    // If this room had a pending reconnect timer, cancel it
    if (reconnectTimers.has(roomId)) {
      clearTimeout(reconnectTimers.get(roomId))
      reconnectTimers.delete(roomId)
      console.log(`[Livestream] Broadcaster reconnected for room ${roomId}`)
    }

    livestreamRooms.set(roomId, { broadcasterId: socket.id, viewerIds: [] })
    console.log(`[Livestream] ✅ Room registered: ${roomId} by broadcaster ${socket.id}`)

    // Notify any viewers who arrived early
    const pending = pendingViewers.get(roomId) || []
    pending.forEach(({ viewerId, timeoutHandle }) => {
      clearTimeout(timeoutHandle)
      const room = livestreamRooms.get(roomId)
      if (!room) return
      room.viewerIds.push(viewerId)
      socket.emit('livestream:viewer-joined', { viewerId })
      console.log(`[Livestream] Notified broadcaster of pending viewer ${viewerId}`)
    })
    pendingViewers.delete(roomId)

    socket.emit('livestream:room-ready', { roomId })
  })

  // Viewer joins — broadcaster may not be ready yet, so queue them
  socket.on('livestream:viewer-join', ({ roomId }) => {
    if (!roomId) return
    const room = livestreamRooms.get(roomId)

    if (room) {
      // Broadcaster already here — notify immediately
      socket.join(roomId)
      room.viewerIds.push(socket.id)
      console.log(`[Livestream] Viewer ${socket.id} joined room ${roomId}`)
      socket.to(room.broadcasterId).emit('livestream:viewer-joined', { viewerId: socket.id })
    } else {
      // Broadcaster not ready yet — keep viewer waiting up to 60s
      console.log(`[Livestream] Viewer ${socket.id} waiting for room ${roomId}`)
      const timeoutHandle = setTimeout(() => {
        // Still no broadcaster after 60s → error
        const stillPending = pendingViewers.get(roomId) || []
        const remaining = stillPending.filter(v => v.viewerId !== socket.id)
        if (remaining.length) pendingViewers.set(roomId, remaining)
        else pendingViewers.delete(roomId)
        socket.emit('livestream:error', { message: 'Stream not found. Make sure the broadcaster has started the camera.' })
      }, 60000)

      const list = pendingViewers.get(roomId) || []
      list.push({ viewerId: socket.id, timeoutHandle })
      pendingViewers.set(roomId, list)
      socket.join(roomId)

      // Tell viewer they're waiting
      socket.emit('livestream:waiting', { message: 'Waiting for broadcaster to start...' })
    }
  })

  // Broadcaster → relay offer to specific viewer
  socket.on('livestream:offer', ({ viewerId, offer }) => {
    console.log(`[Livestream] Relaying offer to viewer ${viewerId}`)
    io.to(viewerId).emit('livestream:offer', { offer, broadcasterId: socket.id })
  })

  // Viewer → relay answer to broadcaster
  socket.on('livestream:answer', ({ roomId, answer }) => {
    const room = livestreamRooms.get(roomId)
    if (room) {
      console.log(`[Livestream] Relaying answer from viewer ${socket.id}`)
      io.to(room.broadcasterId).emit('livestream:answer', { answer, viewerId: socket.id })
    }
  })

  // ICE candidates — relay to specific target
  socket.on('livestream:ice-candidate', ({ roomId, candidate, targetId }) => {
    if (targetId) {
      io.to(targetId).emit('livestream:ice-candidate', { candidate, fromId: socket.id })
    } else {
      socket.to(roomId).emit('livestream:ice-candidate', { candidate, fromId: socket.id })
    }
  })

  // Broadcaster ends the stream explicitly
  socket.on('livestream:end', ({ roomId }) => {
    socket.to(roomId).emit('livestream:ended')
    livestreamRooms.delete(roomId)
    const pending = pendingViewers.get(roomId) || []
    pending.forEach(({ timeoutHandle }) => clearTimeout(timeoutHandle))
    pendingViewers.delete(roomId)
    console.log(`[Livestream] Room ${roomId} ended by broadcaster`)
  })

  // ── Chat streaming ────────────────────────────────────────────────────────

  socket.on('chat:message', async ({ message, category, history = [] }) => {
    if (!message || message.length > 1000) return

    try {
      if (openai) {
        const stream = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: getSystemPrompt(category || 'fraud') },
            ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
            { role: 'user',   content: message },
          ],
          max_tokens: 1200,
          temperature: 0.3,
          stream: true,
        })

        let fullReply = ''
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || ''
          if (content) {
            fullReply += content
            socket.emit('chat:stream', content)
          }
        }
        socket.emit('chat:end', { fullReply })
      } else {
        // Simulate streaming for demo mode
        const demo = getDemoResponse(message, category || 'fraud').reply
        const words = demo.split(' ')
        for (let i = 0; i < words.length; i++) {
          socket.emit('chat:stream', words[i] + ' ')
          await new Promise(r => setTimeout(r, 30))
        }
        socket.emit('chat:end', { fullReply: demo, isDemo: true })
      }
    } catch (err) {
      console.error('[Stream Error]', err.message)
      socket.emit('chat:error', { message: 'AI error — please try again' })
    }
  })

  socket.on('disconnect', () => {
    console.log('[WS] Disconnected:', socket.id)

    for (const [roomId, room] of livestreamRooms.entries()) {
      if (room.broadcasterId === socket.id) {
        // ── Grace period: wait 8s before closing room ──────────────────────
        // Broadcaster may just be reconnecting (Render drops idle sockets)
        console.log(`[Livestream] Broadcaster ${socket.id} disconnected — waiting 8s for reconnect (room: ${roomId})`)
        const timer = setTimeout(() => {
          // Check if broadcaster reconnected with the same roomId
          const currentRoom = livestreamRooms.get(roomId)
          if (currentRoom && currentRoom.broadcasterId === socket.id) {
            io.to(roomId).emit('livestream:ended')
            livestreamRooms.delete(roomId)
            const pending = pendingViewers.get(roomId) || []
            pending.forEach(({ timeoutHandle }) => clearTimeout(timeoutHandle))
            pendingViewers.delete(roomId)
            console.log(`[Livestream] Room ${roomId} closed after grace period`)
          }
          reconnectTimers.delete(roomId)
        }, 8000)
        reconnectTimers.set(roomId, timer)
      } else {
        room.viewerIds = room.viewerIds.filter(id => id !== socket.id)
      }
    }

    // Clean up if this was a pending viewer
    for (const [roomId, list] of pendingViewers.entries()) {
      const found = list.find(v => v.viewerId === socket.id)
      if (found) {
        clearTimeout(found.timeoutHandle)
        const remaining = list.filter(v => v.viewerId !== socket.id)
        if (remaining.length) pendingViewers.set(roomId, remaining)
        else pendingViewers.delete(roomId)
      }
    }
  })
})

// ── Demo fallback response ─────────────────────────────────────────────────────
function getDemoResponse(message, category) {
  const replies = {
    fraud: `## 🔍 Understanding Your Situation
Based on your query, this appears to involve online fraud or cybercrime — one of the fastest-growing legal issues in India.

## ⚖️ Applicable Laws & Rights
- **IT Act 2000, Section 66C**: Identity theft — imprisonment up to 3 years + fine up to ₹1 lakh
- **IT Act 2000, Section 66D**: Cheating by personation using computer — up to 3 years
- **IPC Section 420**: Cheating and dishonestly inducing delivery of property
- **IPC Section 406**: Criminal breach of trust (for investment frauds)
- **RBI Circular 2017**: Zero liability for unauthorized transactions reported within 3 days

## 🎯 Immediate Action Steps
1. **Within 1 hour** — Call **1930** (National Cyber Crime Helpline, 24×7)
2. **Within 3 hours** — Register complaint at **cybercrime.gov.in** (save complaint number)
3. **Same day** — Visit your bank, request transaction reversal, and submit written complaint
4. **Within 24 hours** — File FIR at nearest police station under IT Act 66C/66D
5. **Within 7 days** — Approach Cyber Cell of your city police

## 📞 Important Contacts & Resources
- 🆘 **Cyber Crime Helpline**: 1930
- 🌐 **Portal**: cybercrime.gov.in
- 📱 **RBI Banking Helpline**: 14448
- 🏛️ **Cyber Crime Police Station**: Available in all major cities

## ⚠️ Important Notes
- **Preserve all evidence**: Screenshots, transaction IDs, emails, call recordings
- Banks under RBI mandate must resolve fraud complaints within 90 days
- For fraud above ₹1 lakh, seriously consider hiring a cybercrime lawyer
- Do NOT share OTPs or re-engage with the fraudster

---
*Disclaimer: This is general legal information, not professional legal advice.*`,

    police: `## 🔍 Understanding Your Situation
Your query involves police interactions and arrest rights under Indian law. You have strong constitutional protections during any police encounter.

## ⚖️ Applicable Laws & Rights
- **CrPC Section 50**: Right to be informed of grounds of arrest immediately
- **CrPC Section 56**: Must be produced before magistrate within 24 hours of arrest
- **Article 22**: Constitutional right to consult and be defended by a lawyer
- **D.K. Basu v. State of West Bengal (1997)**: Supreme Court guidelines on arrest
- **CrPC Section 41A**: Police must issue notice before arrest in many cases

## 🎯 Immediate Action Steps
1. **At arrest** — Calmly ask: "What is the reason for my arrest?" (your legal right)
2. **Immediately** — Request to inform one family member or friend (cannot be denied)
3. **Right now** — Ask for access to your lawyer — this right begins from arrest
4. **Within 24 hours** — You MUST be presented before a Magistrate; if not, report to NHRC
5. **After release** — File complaint with Superintendent of Police if rights were violated

## 📞 Important Contacts & Resources
- 🆘 **Police Control Room**: 100
- ⚖️ **National Legal Services Authority**: 15100 (free legal aid)
- 📞 **National Human Rights Commission**: nhrc.nic.in
- 🏛️ **District Legal Aid**: Free lawyer for trial

## ⚠️ Important Notes
- Police CANNOT hold you beyond 24 hours without magistrate's remand order
- You have the right to REMAIN SILENT — statements in custody are admissible
- Torture or third-degree treatment is illegal — file complaint under IPC 330
- FIR copy is your legal right — police must provide it free within 24 hours

---
*Disclaimer: This is general legal information, not professional legal advice.*`,

    rental: `## 🔍 Understanding Your Situation
Rental disputes in India are governed by state-specific Rent Control Acts and the Model Tenancy Act 2021. Tenants have significant legal protections.

## ⚖️ Applicable Laws & Rights
- **Model Tenancy Act 2021**: Standard national framework (adopted by many states)
- **Transfer of Property Act 1882, Sec 105-117**: Governs all lease agreements
- **State Rent Control Acts**: Delhi RCA, Maharashtra RCA, etc. — very tenant-friendly
- **IPC Section 441**: Criminal trespass — applies to illegal forced eviction
- **Consumer Protection Act 2019**: For landlord-builder disputes on new properties

## 🎯 Immediate Action Steps
1. **Today** — Document everything: photos, receipts, WhatsApp messages, emails
2. **This week** — Send legal notice via registered post (15-day response period)
3. **If no response** — File petition with Rent Controller/Rent Court in your district
4. **For illegal eviction** — File FIR at police station under IPC 441 (criminal trespass)
5. **Security deposit** — File consumer complaint at DCDRC if landlord refuses within 30 days

## 📞 Important Contacts & Resources
- 🏛️ **Rent Controller**: Part of your district court — file complaint there
- ⚖️ **District Consumer Forum (DCDRC)**: For security deposit disputes up to ₹1 crore
- 📞 **District Legal Services Authority**: Free legal aid available

## ⚠️ Important Notes
- Security deposit is capped at **2 months rent** under Model Tenancy Act
- Landlord needs minimum **2 months written notice** before terminating tenancy
- Unregistered agreements over 11 months lose some legal enforceability
- Landlord CANNOT cut electricity/water — it's harassment (punishable)

---
*Disclaimer: This is general legal information, not professional legal advice.*`,
  }

  return {
    reply: replies[category] || replies.fraud,
    category,
    timestamp: new Date().toISOString(),
    isDemo: true,
  }
}

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Endpoint not found' }))

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   NyayaSaarthi API Server             ║
║   Port    : ${PORT}                      ║
║   AI Mode : ${openai ? 'OpenAI GPT-4o-mini' : 'Demo (no API key)'}  ║
║   Status  : Running ✓                 ║
╚═══════════════════════════════════════╝
  `)
})

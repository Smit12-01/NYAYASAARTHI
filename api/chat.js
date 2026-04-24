// api/chat.js — Vercel Serverless Function
// This runs on Vercel's edge and calls OpenAI directly.

// No longer requiring OpenAI, using free Pollinations API
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

function getDemoResponse(category) {
  const demos = {
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
  }
  return demos[category] || demos.fraud
}

// Simple in-memory rate limit (resets per serverless instance)
const rateMap = new Map()
function rateLimit(ip, limit = 15, windowMs = 60000) {
  const now = Date.now()
  const rec = rateMap.get(ip) || { count: 0, reset: now + windowMs }
  if (now > rec.reset) { rec.count = 0; rec.reset = now + windowMs }
  rec.count++
  rateMap.set(ip, rec)
  return rec.count <= limit
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'
  if (!rateLimit(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please wait 1 minute.' })
  }

  const { message, category = 'fraud', history = [] } = req.body || {}

  if (!message || typeof message !== 'string' || message.length > 1000) {
    return res.status(400).json({ error: 'Invalid message.' })
  }

  try {
    const messages = [
      { role: 'system', content: getSystemPrompt(category) },
      ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ]

    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model: 'openai'
      })
    })

    if (!response.ok) {
      throw new Error(`Pollinations API error: ${response.statusText}`)
    }

    const reply = await response.text()

    return res.json({
      reply,
      category,
      timestamp: new Date().toISOString(),
      isDemo: false,
    })
  } catch (err) {
    console.error('[OpenAI Error]', err.message)
    return res.json({
      reply: getDemoResponse(category),
      category,
      timestamp: new Date().toISOString(),
      isDemo: true,
      error: 'AI temporarily unavailable — showing demo response',
    })
  }
}

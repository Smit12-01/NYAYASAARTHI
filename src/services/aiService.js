// aiService.js — calls the Vercel serverless /api/chat endpoint
// No Socket.IO needed; works fully on Vercel's serverless platform.

/**
 * Send a legal query and return the AI response.
 * Falls back to a built-in demo if the API call fails.
 */
export async function sendLegalQuery({ message, category, history }) {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, category, history }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `HTTP ${res.status}`)
    }

    const data = await res.json()
    return { success: true, data }
  } catch (err) {
    console.error('[aiService] error:', err.message)
    return {
      success: false,
      error: err.message,
      data: {
        reply: getFrontendDemo(category),
        isDemo: true,
        timestamp: new Date().toISOString(),
      },
    }
  }
}

/**
 * streamLegalQuery — wraps sendLegalQuery with the same callback API
 * that Chat.jsx expects (onChunk, onEnd, onError).
 * Since Vercel serverless doesn't support true streaming without extra setup,
 * we simulate a word-by-word reveal for a smooth UX.
 */
export async function streamLegalQuery({ message, category, history, onChunk, onEnd, onError }) {
  try {
    const result = await sendLegalQuery({ message, category, history })

    if (!result.success && !result.data?.reply) {
      onError({ message: result.error })
      return
    }

    const { reply, isDemo, timestamp } = result.data
    const words = reply.split(' ')

    // Simulate streaming word-by-word
    for (let i = 0; i < words.length; i++) {
      onChunk(words[i] + (i < words.length - 1 ? ' ' : ''))
      await sleep(18)   // ~18ms per word → smooth reveal
    }

    onEnd({ fullReply: reply, isDemo, timestamp })
  } catch (err) {
    onError({ message: err.message })
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ── Inline demo (shown when API is unreachable) ────────────────────────────
function getFrontendDemo(category) {
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
- 🏛️ **District Legal Aid**: Free lawyer at trial

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

    rental: `## 🔍 Understanding Your Situation
Rental disputes in India are governed by state-specific Rent Control Acts and the Model Tenancy Act 2021.

## ⚖️ Applicable Laws & Rights
- **Model Tenancy Act 2021**: Standard national framework (adopted by many states)
- **Transfer of Property Act 1882, Sec 105-117**: Governs all lease agreements
- **State Rent Control Acts**: Delhi RCA, Maharashtra RCA, etc.
- **IPC Section 441**: Criminal trespass — applies to illegal forced eviction
- **Consumer Protection Act 2019**: For landlord-builder disputes on new properties

## 🎯 Immediate Action Steps
1. **Today** — Document everything: photos, receipts, WhatsApp messages, emails
2. **This week** — Send legal notice via registered post (15-day response period)
3. **If no response** — File petition with Rent Controller/Rent Court in your district
4. **For illegal eviction** — File FIR at police station under IPC 441
5. **Security deposit** — File consumer complaint at DCDRC if landlord refuses within 30 days

## 📞 Important Contacts & Resources
- 🏛️ **Rent Controller**: Part of your district court
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

  return demos[category] || demos.fraud
}

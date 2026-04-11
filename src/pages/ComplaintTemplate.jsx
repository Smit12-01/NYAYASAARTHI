import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Copy, Check, Download, ArrowLeft, ChevronDown,
  AlertTriangle, Scale, User, MapPin, Calendar, Hash
} from 'lucide-react'

/* ─── Template definitions ─── */
const TEMPLATES = [
  {
    id: 'fir',
    name: 'FIR Draft',
    icon: AlertTriangle,
    color: 'from-red-500 to-orange-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    desc: 'First Information Report template for filing at local police station',
    fields: [
      { id: 'complainantName',  label: 'Your Full Name',             type: 'text',     placeholder: 'Ravi Kumar Sharma' },
      { id: 'complainantAddr',  label: 'Your Address',               type: 'textarea', placeholder: 'House No. 12, Main Street, Delhi - 110001' },
      { id: 'complainantPhone', label: 'Your Phone Number',          type: 'text',     placeholder: '9876543210' },
      { id: 'accusedName',     label: 'Accused Name (if known)',     type: 'text',     placeholder: 'Unknown / John Doe' },
      { id: 'incidentDate',    label: 'Date of Incident',            type: 'date',     placeholder: '' },
      { id: 'incidentPlace',   label: 'Place of Incident',           type: 'text',     placeholder: 'Near XYZ Bank ATM, New Delhi' },
      { id: 'incidentDesc',    label: 'Description of Incident',     type: 'textarea', placeholder: 'Describe what happened in detail...' },
      { id: 'lossAmount',      label: 'Estimated Loss (₹)',          type: 'text',     placeholder: '50,000' },
      { id: 'witnessName',     label: 'Witness Name (if any)',        type: 'text',     placeholder: 'Optional' },
      { id: 'policeStation',   label: 'Police Station Name',          type: 'text',     placeholder: 'Connaught Place Police Station' },
    ],
    generate: (fields) => `
TO,
The Station House Officer (SHO)
${fields.policeStation || '[Police Station Name]'}
[City]

SUB: First Information Report (FIR) Regarding [Nature of Offence]

Respected Sir/Madam,

I, ${fields.complainantName || '[Your Name]'}, resident of ${fields.complainantAddr || '[Your Address]'}, Phone: ${fields.complainantPhone || '[Phone]'}, do hereby lodge this complaint and request you to register an FIR under relevant sections of the Indian Penal Code / IT Act 2000.

── DETAILS OF INCIDENT ──────────────────────────────────

Date of Incident : ${fields.incidentDate || '[Date]'}
Place of Incident : ${fields.incidentPlace || '[Place]'}
Name of Accused : ${fields.accusedName || 'Unknown / Not known at this time'}
Estimated Loss : ₹${fields.lossAmount || '[Amount]'}

── DESCRIPTION ─────────────────────────────────────────

${fields.incidentDesc || '[Describe the incident in detail]'}

── WITNESS ─────────────────────────────────────────────

${fields.witnessName ? `Name of Witness: ${fields.witnessName}` : 'No witness at the time of incident.'}

── PRAYER ──────────────────────────────────────────────

I, therefore, request you to:
1. Register an FIR against the accused under applicable sections of IPC / IT Act 2000
2. Investigate the matter and take appropriate legal action
3. Provide me a copy of the registered FIR free of cost (as per Section 154(3) CrPC)

I declare that the information given above is true and correct to the best of my knowledge.

Yours faithfully,

________________________
${fields.complainantName || '[Your Name]'}
Date: ${new Date().toLocaleDateString('en-IN')}
Phone: ${fields.complainantPhone || '[Phone]'}
Address: ${fields.complainantAddr || '[Address]'}

IMPORTANT: You have the right to receive a copy of the FIR — this is mandatory under Section 154(3) CrPC. If police refuse, escalate to SP/DSP.
`.trim()
  },

  {
    id: 'consumer',
    name: 'Consumer Complaint',
    icon: Scale,
    color: 'from-green-500 to-teal-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    desc: 'Consumer complaint for District Consumer Disputes Redressal Commission (DCDRC)',
    fields: [
      { id: 'complainantName',  label: 'Your Full Name',             type: 'text',     placeholder: 'Priya Nair' },
      { id: 'complainantAddr',  label: 'Your Complete Address',      type: 'textarea', placeholder: 'Flat 5A, Sunshine Apartments, Mumbai - 400001' },
      { id: 'complainantPhone', label: 'Your Phone / Email',         type: 'text',     placeholder: '9876543210 / priya@email.com' },
      { id: 'companyName',     label: 'Company / Seller Name',       type: 'text',     placeholder: 'ABC Electronics Ltd.' },
      { id: 'companyAddr',     label: 'Company Address',             type: 'textarea', placeholder: 'Company registered address...' },
      { id: 'productName',     label: 'Product / Service',           type: 'text',     placeholder: 'Samsung Galaxy S23 / Amazon Order #12345' },
      { id: 'purchaseDate',    label: 'Date of Purchase',            type: 'date',     placeholder: '' },
      { id: 'purchaseAmount',  label: 'Amount Paid (₹)',             type: 'text',     placeholder: '45,000' },
      { id: 'defectDesc',      label: 'Nature of Defect / Dispute',  type: 'textarea', placeholder: 'Describe the defect, promise broken, or service failure...' },
      { id: 'reliefSought',    label: 'Relief / Compensation Sought',type: 'text',     placeholder: 'Full refund of ₹45,000 + ₹10,000 compensation' },
    ],
    generate: (fields) => `
BEFORE THE DISTRICT CONSUMER DISPUTES REDRESSAL COMMISSION
[District Name]

CONSUMER COMPLAINT NO: _____ / ${new Date().getFullYear()}

IN THE MATTER OF:

COMPLAINANT:
${fields.complainantName || '[Your Name]'}
${fields.complainantAddr || '[Your Address]'}
Phone/Email: ${fields.complainantPhone || '[Contact]'}

                    vs.

OPPOSITE PARTY (OP):
${fields.companyName || '[Company Name]'}
${fields.companyAddr || '[Company Address]'}

── FACTS OF THE CASE ───────────────────────────────────

1. The Complainant purchased "${fields.productName || '[Product/Service]'}" from the OP on ${fields.purchaseDate || '[Date]'} for a total amount of ₹${fields.purchaseAmount || '[Amount]'}.

2. DEFICIENCY / DEFECT:
${fields.defectDesc || '[Describe the defect or service deficiency in detail]'}

3. The Complainant brought the issue to the OP's attention and requested resolution, but the OP failed to resolve the same causing mental agony and financial loss.

── LEGAL PROVISIONS RELIED UPON ────────────────────────

1. Section 2(7) — Consumer Protection Act 2019 (defines "consumer")
2. Section 2(11) — Definition of "deficiency in service"
3. Section 35 — Jurisdiction of District Commission
4. Section 39 — Relief available to consumer

── PRAYER ──────────────────────────────────────────────

The Complainant, therefore, most humbly prays that this Hon'ble Commission may be pleased to:

a) Direct the OP to pay: ${fields.reliefSought || '[Relief sought]'}
b) Direct OP to pay compensation for mental agony and harassment
c) Direct OP to pay litigation costs
d) Pass any other order as the Commission deems fit and proper

VERIFICATION:
I, ${fields.complainantName || '[Name]'}, do hereby verify and declare that the contents of this complaint are true and correct to the best of my knowledge and belief.

________________________
${fields.complainantName || '[Complainant Signature]'}
Date: ${new Date().toLocaleDateString('en-IN')}
Place: [City]

Note: File this at your District Consumer Commission. For claims under ₹1 crore — District Commission. ₹1–10 crore — State Commission. Above ₹10 crore — National Commission (NCDRC).
`.trim()
  },

  {
    id: 'rti',
    name: 'RTI Application',
    icon: FileText,
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    desc: 'Right to Information application under RTI Act 2005',
    fields: [
      { id: 'applicantName',  label: 'Your Full Name',               type: 'text',     placeholder: 'Amit Patel' },
      { id: 'applicantAddr',  label: 'Your Address',                 type: 'textarea', placeholder: 'Your complete postal address' },
      { id: 'applicantPhone', label: 'Your Phone / Email',           type: 'text',     placeholder: '9876543210' },
      { id: 'department',     label: 'Department / Office',          type: 'text',     placeholder: 'e.g., Municipal Corporation of Delhi / Income Tax Dept' },
      { id: 'infoSought',     label: 'Information Sought',           type: 'textarea', placeholder: 'Describe specifically what information you are seeking...' },
      { id: 'period',         label: 'Period for Which Info Sought', type: 'text',     placeholder: 'e.g., April 2023 to March 2024' },
    ],
    generate: (fields) => `
TO,
The Public Information Officer (PIO)
${fields.department || '[Department Name]'}
[Office Address]
[City, State, PIN]

SUB: Application for Information Under Right to Information Act, 2005

Respected Sir/Madam,

I, ${fields.applicantName || '[Your Name]'}, Indian Citizen, residing at ${fields.applicantAddr || '[Your Address]'}, phone: ${fields.applicantPhone || '[Phone]'}, hereby request the following information under the Right to Information Act, 2005:

── INFORMATION SOUGHT ──────────────────────────────────

Department / Office: ${fields.department || '[Department]'}
Period: ${fields.period || '[Period]'}

${fields.infoSought || '[Describe the specific information you are seeking in clear, concise terms]'}

── FEES ────────────────────────────────────────────────

The required application fee of ₹10/- is enclosed as:
[ ] Demand Draft / [ ] Indian Postal Order / [ ] Court Fee Stamp / [ ] Online Payment

Note: BPL card holders are exempt from fee (attach copy of BPL card).

── DECLARATION ─────────────────────────────────────────

I am a citizen of India and the information sought is not covered under Section 8 and 9 of the RTI Act. I hereby declare that I am not seeking information in a commercial interest.

Yours faithfully,

________________________
${fields.applicantName || '[Your Name]'}
Date: ${new Date().toLocaleDateString('en-IN')}
Phone: ${fields.applicantPhone || '[Phone]'}

IMPORTANT TIPS:
• The PIO must respond within 30 days (48 hours for life/liberty matters)
• If unsatisfied, appeal to First Appellate Authority within 30 days
• If still unsatisfied, appeal to Central/State Information Commission
• RTI Helpline: 1800-11-8004
`.trim()
  },

  {
    id: 'legal-notice',
    name: 'Legal Notice',
    icon: Hash,
    color: 'from-purple-500 to-pink-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    desc: 'Formal legal notice to be sent before filing a case in court',
    fields: [
      { id: 'senderName',    label: 'Sender Name (You)',              type: 'text',     placeholder: 'Sunita Mehta' },
      { id: 'senderAddr',   label: 'Sender Address',                  type: 'textarea', placeholder: 'Your complete address' },
      { id: 'recipientName', label: 'Recipient Name',                 type: 'text',     placeholder: 'Person/Company to whom notice is sent' },
      { id: 'recipientAddr', label: 'Recipient Address',              type: 'textarea', placeholder: 'Recipient complete address' },
      { id: 'subject',      label: 'Subject of Notice',               type: 'text',     placeholder: 'Non-return of security deposit / Illegal eviction / Unpaid dues' },
      { id: 'grievance',    label: 'Details of Grievance',             type: 'textarea', placeholder: 'Explain the issue, your demands, and what happened...' },
      { id: 'demand',       label: 'Your Demand',                     type: 'text',     placeholder: 'Return ₹1,50,000 security deposit within 15 days' },
      { id: 'noticePeriod', label: 'Response Period (days)',           type: 'text',     placeholder: '15' },
    ],
    generate: (fields) => `
LEGAL NOTICE

Sender: ${fields.senderName || '[Your Name]'}
        ${fields.senderAddr || '[Your Address]'}

Date: ${new Date().toLocaleDateString('en-IN')}

To,
${fields.recipientName || '[Recipient Name]'}
${fields.recipientAddr || '[Recipient Address]'}

Sub: ${fields.subject || '[Subject of Legal Notice]'}

Sir/Madam,

Under instructions from and on behalf of my client ${fields.senderName || '[Your Name]'}, I hereby serve upon you this Legal Notice as follows:

── FACTS ───────────────────────────────────────────────

${fields.grievance || '[Describe the dispute, events, and your grievance in chronological order]'}

── DEMAND ──────────────────────────────────────────────

My client hereby demands that you:

${fields.demand || '[State your specific demand clearly]'}

You are hereby called upon to comply with the above demand within ${fields.noticePeriod || '15'} days from the receipt of this notice. 

FAILING WHICH, my client shall be constrained to initiate appropriate legal proceedings before the competent court/tribunal for recovery of dues + compensation + litigation costs — entirely at your risk and expense.

This notice is issued without prejudice to all other rights and remedies available to my client in law and equity.

________________________
${fields.senderName || '[Sender]'}
Date: ${new Date().toLocaleDateString('en-IN')}

NOTE: It is advisable to send this notice via:
 1. Registered Post with Acknowledgment Due (RPAD)
 2. Speed Post (trackable)
Keep the postal receipt and delivery proof safely.
`.trim()
  },
]

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }
const fadeIn  = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.4 } } }

/* ─── Field Component ─── */
function Field({ f, value, onChange }) {
  return (
    <div>
      <label className="block text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wide" htmlFor={f.id}>
        {f.label}
      </label>
      {f.type === 'textarea' ? (
        <textarea
          id={f.id}
          value={value}
          onChange={e => onChange(f.id, e.target.value)}
          placeholder={f.placeholder}
          rows={3}
          className="input-field text-sm resize-none w-full"
        />
      ) : f.type === 'date' ? (
        <input
          id={f.id}
          type="date"
          value={value}
          onChange={e => onChange(f.id, e.target.value)}
          className="input-field text-sm w-full"
        />
      ) : (
        <input
          id={f.id}
          type="text"
          value={value}
          onChange={e => onChange(f.id, e.target.value)}
          placeholder={f.placeholder}
          className="input-field text-sm w-full"
        />
      )}
    </div>
  )
}

/* ─── Main Component ─── */
export default function ComplaintTemplate() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)
  const [fieldValues, setFieldValues] = useState({})
  const [preview, setPreview]   = useState('')
  const [copied, setCopied]     = useState(false)

  const handleSelect = (tpl) => {
    setSelected(tpl)
    setFieldValues({})
    setPreview('')
  }

  const handleChange = (id, val) => {
    const newVals = { ...fieldValues, [id]: val }
    setFieldValues(newVals)
    setPreview(selected.generate(newVals))
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(preview)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    const w = window.open('', '_blank')
    w.document.write(`<pre style="font-family:monospace;white-space:pre-wrap;padding:2rem;font-size:13px">${preview}</pre>`)
    w.document.close()
    w.print()
  }

  if (!selected) {
    return (
      <div className="min-h-screen pt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* Header — always visible on mount */}
          <div className="mb-10">
            <span className="badge bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm px-3 py-1 mb-4 inline-block">
              Free Legal Templates
            </span>
            <h1 className="font-display font-black text-4xl md:text-5xl text-white mb-3">
              Generate <span className="gradient-text">Legal Documents</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl">
              Create ready-to-use FIR drafts, consumer complaints, RTI applications, and legal notices — personalised for your situation.
            </p>
          </div>

          {/* Template cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {TEMPLATES.map((tpl, i) => {
              const Icon = tpl.icon
              return (
                <motion.button
                  key={tpl.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  whileHover={{ y: -4 }}
                  onClick={() => handleSelect(tpl)}
                  className={`glass-card p-6 text-left border ${tpl.border} group hover:border-opacity-60 transition-all duration-200`}
                >
                  <div className={`w-12 h-12 rounded-xl ${tpl.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tpl.color} flex items-center justify-center`}>
                      <Icon size={20} className="text-white" />
                    </div>
                  </div>
                  <h3 className="text-white font-bold text-xl font-display mb-2">{tpl.name}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">{tpl.desc}</p>
                  <span className="flex items-center gap-1.5 text-primary-400 text-sm font-medium group-hover:gap-3 transition-all">
                    Generate Template <ChevronDown size={14} className="rotate-[-90deg]" />
                  </span>
                </motion.button>
              )
            })}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 glass-card p-5 border border-yellow-500/20 flex gap-4"
          >
            <AlertTriangle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-semibold text-sm">Important Disclaimer</p>
              <p className="text-slate-400 text-sm mt-1">
                These templates are for educational reference only and should be reviewed by a qualified legal professional before submission.
                Laws may vary by state. Consult a licensed advocate for critical matters.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  const Icon = selected.icon

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Back + Title */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selected.color} flex items-center justify-center`}>
              <Icon size={18} className="text-white" />
            </div>
            <h1 className="font-display font-bold text-2xl text-white">{selected.name}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Form */}
          <div className="space-y-4">
            <div className="glass-card p-6">
              <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
                <User size={16} className="text-primary-400" />
                Fill Your Details
              </h2>
              <div className="space-y-4">
                {selected.fields.map(f => (
                  <Field
                    key={f.id}
                    f={f}
                    value={fieldValues[f.id] || ''}
                    onChange={handleChange}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <FileText size={16} className="text-primary-400" />
                  Generated Document
                </h2>
                {preview && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-surface-card border border-surface-border text-slate-400 hover:text-primary-400 hover:border-primary-500/30 transition-all"
                    >
                      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-500 transition-colors"
                    >
                      <Download size={12} />
                      Print / Save
                    </button>
                  </div>
                )}
              </div>

              {preview ? (
                <pre className="text-slate-300 text-xs font-mono leading-relaxed whitespace-pre-wrap bg-surface-dark/50 rounded-xl p-4 border border-surface-border overflow-auto max-h-[600px]">
                  {preview}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText size={40} className="text-slate-700 mb-3" />
                  <p className="text-slate-500">Fill in your details on the left</p>
                  <p className="text-slate-600 text-sm">Your document will appear here instantly</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

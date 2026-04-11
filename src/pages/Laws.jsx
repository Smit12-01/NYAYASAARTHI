import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Search, ChevronDown, ChevronUp, Scale, Shield, Cpu,
  MessageSquare, BookOpen, ArrowRight, Filter, X
} from 'lucide-react'

/* ─── Law database ─── */
const LAW_SECTIONS = [
  // ── IPC ──────────────────────────────────────────────────────────────────
  { id: 'ipc-302', law: 'IPC', section: '302', title: 'Punishment for Murder', type: 'Criminal',
    desc: 'Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine.',
    relevance: 'Applicable when someone intentionally causes death of another person.',
    penalty: 'Death or life imprisonment + fine', tags: ['murder', 'homicide', 'death'] },
  { id: 'ipc-304', law: 'IPC', section: '304', title: 'Culpable Homicide Not Amounting to Murder', type: 'Criminal',
    desc: 'Punishment for culpable homicide not amounting to murder — imprisonment up to 10 years or life.',
    relevance: 'When death is caused without premeditation or under sudden provocation.',
    penalty: 'Up to 10 years / life imprisonment', tags: ['homicide', 'manslaughter', 'death'] },
  { id: 'ipc-307', law: 'IPC', section: '307', title: 'Attempt to Murder', type: 'Criminal',
    desc: 'Whoever does any act with such intention or knowledge, and under such circumstances that, if he by that act caused death, he would be guilty of murder.',
    relevance: 'Used when someone tries to kill but does not succeed.',
    penalty: 'Up to 10 years + fine; life if hurt caused', tags: ['attempt', 'murder', 'assault'] },
  { id: 'ipc-354', law: 'IPC', section: '354', title: 'Assault or Criminal Force to Woman with Intent to Outrage Modesty', type: 'Criminal',
    desc: 'Whoever assaults or uses criminal force to any woman, intending to outrage or knowing it to be likely that he will outrage her modesty.',
    relevance: 'Applies to physical assault, molestation, unwanted touching of women.',
    penalty: '1–5 years imprisonment + fine', tags: ['women', 'assault', 'molestation', 'harassment'] },
  { id: 'ipc-375', law: 'IPC', section: '375', title: 'Rape', type: 'Criminal',
    desc: 'A man is said to commit "rape" if he penetrates without consent under specified circumstances. Consent obtained through fear or fraud is not valid.',
    relevance: 'Core definition of rape under Indian Penal Code.',
    penalty: 'Minimum 7 years to life imprisonment', tags: ['rape', 'sexual assault', 'women', 'consent'] },
  { id: 'ipc-376', law: 'IPC', section: '376', title: 'Punishment for Rape', type: 'Criminal',
    desc: 'Whoever commits rape shall be punished with rigorous imprisonment of not less than 7 years, but may extend to 10 years or life imprisonment.',
    relevance: 'Sentencing provision for rape conviction.',
    penalty: 'Min 7 years to life; death if victim dies or is in persistent vegetative state', tags: ['rape', 'punishment', 'women'] },
  { id: 'ipc-379', law: 'IPC', section: '379', title: 'Punishment for Theft', type: 'Criminal',
    desc: 'Whoever commits theft shall be punished with imprisonment of either description for a term which may extend to three years, or with fine, or with both.',
    relevance: 'Basic theft of movable property without owner consent.',
    penalty: 'Up to 3 years + fine', tags: ['theft', 'stolen', 'property'] },
  { id: 'ipc-395', law: 'IPC', section: '395', title: 'Punishment for Dacoity', type: 'Criminal',
    desc: 'When five or more persons conjointly commit or attempt to commit a robbery — punishment is rigorous imprisonment for 10 years to life.',
    relevance: 'Group robbery by 5 or more persons.',
    penalty: 'Rigorous imprisonment 10 years to life', tags: ['dacoity', 'robbery', 'group'] },
  { id: 'ipc-406', law: 'IPC', section: '406', title: 'Criminal Breach of Trust', type: 'Criminal',
    desc: 'Whoever commits criminal breach of trust shall be punished with imprisonment up to 3 years, or fine, or both.',
    relevance: 'When someone entrusted with property misappropriates it — common in investment frauds.',
    penalty: 'Up to 3 years + fine', tags: ['fraud', 'trust', 'investment', 'cheating'] },
  { id: 'ipc-420', law: 'IPC', section: '420', title: 'Cheating and Dishonestly Inducing Delivery of Property', type: 'Criminal',
    desc: 'Cheating: deceiving someone to deliver property or to make/alter/destroy valuable documents.',
    relevance: 'The most commonly cited fraud section — applies to UPI scams, fake deals, online fraud.',
    penalty: 'Up to 7 years + fine', tags: ['fraud', 'cheating', 'upi', 'scam', 'online'] },
  { id: 'ipc-441', law: 'IPC', section: '441', title: 'Criminal Trespass', type: 'Criminal',
    desc: 'Whoever enters into or upon property in possession of another with intent to commit offence or to intimidate, insult or annoy any person in possession.',
    relevance: 'Used when landlord illegally enters or forcibly evicts tenants.',
    penalty: 'Up to 3 months + fine', tags: ['trespass', 'landlord', 'eviction', 'rental'] },
  { id: 'ipc-499', law: 'IPC', section: '499', title: 'Defamation', type: 'Criminal',
    desc: 'Whoever, by words either spoken or intended to be read, or by signs or visible representations, makes or publishes any imputation concerning any person.',
    relevance: 'Used for false statements that harm reputation — online or offline.',
    penalty: 'Up to 2 years + fine', tags: ['defamation', 'reputation', 'social media', 'false'] },
  { id: 'ipc-503', law: 'IPC', section: '503', title: 'Criminal Intimidation', type: 'Criminal',
    desc: 'Threatening another person with injury to person, reputation, or property to cause alarm or compel them to do any act.',
    relevance: 'Threats via phone, WhatsApp, or in person.',
    penalty: 'Up to 2 years + fine; up to 7 years for anonymous threat', tags: ['threat', 'intimidation', 'extortion'] },
  { id: 'ipc-509', law: 'IPC', section: '509', title: 'Word, Gesture or Act Intended to Insult Modesty of Women', type: 'Criminal',
    desc: 'Whoever, intending to insult the modesty of any woman, utters any word, makes any sound or gesture, or exhibits any object intending it to be seen.',
    relevance: 'Eve-teasing, catcalling, obscene gestures towards women.',
    penalty: 'Up to 3 years + fine', tags: ['women', 'harassment', 'eve-teasing', 'gesture'] },

  // ── CrPC ─────────────────────────────────────────────────────────────────
  { id: 'crpc-41', law: 'CrPC', section: '41', title: 'When Police May Arrest Without Warrant', type: 'Procedural',
    desc: 'A police officer may arrest without warrant any person who has been concerned in any cognizable offence or against whom a reasonable complaint has been made.',
    relevance: 'Defines when police can arrest you without a court warrant.',
    penalty: 'N/A — procedural right', tags: ['arrest', 'police', 'warrant', 'rights'] },
  { id: 'crpc-41a', law: 'CrPC', section: '41A', title: 'Notice of Appearance Before Police Officer', type: 'Procedural',
    desc: 'The police officer shall issue notice to appear before him where arrest is not required. The person shall not be arrested if they comply with notice.',
    relevance: 'Police must issue notice (not arrest) for offences punishable < 7 years unless conditions exist.',
    penalty: 'N/A — protective right', tags: ['arrest', 'police', 'notice', 'rights'] },
  { id: 'crpc-50', law: 'CrPC', section: '50', title: 'Person Arrested to be Informed of Grounds', type: 'Procedural',
    desc: 'Every police officer arresting any person without warrant shall forthwith communicate to him full particulars of the offence for which he is arrested.',
    relevance: 'Your RIGHT to know WHY you are being arrested. Police cannot deny this.',
    penalty: 'N/A — constitutional right', tags: ['arrest', 'police', 'rights', 'inform'] },
  { id: 'crpc-56', law: 'CrPC', section: '56', title: 'Person Arrested to Be Taken Before Magistrate', type: 'Procedural',
    desc: 'A police officer making an arrest without warrant shall take the person arrested before a Magistrate having jurisdiction without unnecessary delay.',
    relevance: 'Police MUST produce you before magistrate within 24 hours of arrest.',
    penalty: 'N/A — fundamental right', tags: ['arrest', 'magistrate', '24 hours', 'police'] },
  { id: 'crpc-154', law: 'CrPC', section: '154', title: 'Information in Cognizable Cases (FIR)', type: 'Procedural',
    desc: 'Every information relating to a cognizable offence shall be reduced to writing by the officer in charge of a police station — this is an FIR.',
    relevance: 'Right to file FIR — police CANNOT refuse to register an FIR for cognizable offences.',
    penalty: 'N/A — right to file FIR', tags: ['fir', 'police', 'complaint', 'cognizable'] },
  { id: 'crpc-161', law: 'CrPC', section: '161', title: 'Examination of Witnesses by Police', type: 'Procedural',
    desc: 'Any police officer may examine any person supposed to be acquainted with the facts and circumstances of the case.',
    relevance: 'You cannot be forced to be a witness against yourself (right against self-incrimination).',
    penalty: 'N/A — procedural', tags: ['witness', 'statement', 'police', 'rights'] },
  { id: 'crpc-436', law: 'CrPC', section: '436', title: 'Bail in Bailable Offences', type: 'Procedural',
    desc: 'When any person accused of a bailable offence is arrested without warrant, they shall be released on bail if they are prepared to give bail.',
    relevance: 'You have a RIGHT to bail for bailable offences — police cannot deny it.',
    penalty: 'N/A — right to bail', tags: ['bail', 'bailable', 'release', 'police'] },
  { id: 'crpc-437', law: 'CrPC', section: '437', title: 'Bail in Non-Bailable Offences', type: 'Procedural',
    desc: 'When any person accused of a non-bailable offence is arrested, court may release on bail if it is not prima facie case of serious offence.',
    relevance: 'Court can grant bail even in non-bailable offences under certain conditions.',
    penalty: 'N/A — bail provision', tags: ['bail', 'non-bailable', 'court', 'rights'] },

  // ── IT Act ───────────────────────────────────────────────────────────────
  { id: 'it-66', law: 'IT Act', section: '66', title: 'Computer Related Offences', type: 'Cyber',
    desc: 'If any person, dishonestly or fraudulently, does any act referred to in section 43 (unauthorized access, damage, disruption) shall be punished.',
    relevance: 'General computer crime — hacking, unauthorized access, system disruption.',
    penalty: 'Up to 3 years + fine up to ₹5 lakh', tags: ['hacking', 'computer', 'cyber', 'unauthorized'] },
  { id: 'it-66c', law: 'IT Act', section: '66C', title: 'Identity Theft', type: 'Cyber',
    desc: 'Whoever, fraudulently or dishonestly makes use of the electronic signature, password or any other unique identification feature of any other person.',
    relevance: 'Using someone else\'s OTP, password, login credentials, Aadhaar — identity theft.',
    penalty: 'Up to 3 years + fine up to ₹1 lakh', tags: ['identity theft', 'otp', 'aadhaar', 'password', 'fraud'] },
  { id: 'it-66d', law: 'IT Act', section: '66D', title: 'Cheating by Personation Using Computer Resource', type: 'Cyber',
    desc: 'Whoever, by means of any communication device or computer resource cheats by personating.',
    relevance: 'Fake customer care calls, impersonating bank/RBI, fake job offers online.',
    penalty: 'Up to 3 years + fine up to ₹1 lakh', tags: ['impersonation', 'fake', 'scam', 'fraud', 'upi'] },
  { id: 'it-66e', law: 'IT Act', section: '66E', title: 'Violation of Privacy', type: 'Cyber',
    desc: 'Whoever intentionally or knowingly captures, publishes or transmits image of private area of any person without their consent.',
    relevance: 'Voyeurism, revenge porn, hidden camera, publishing intimate images without consent.',
    penalty: 'Up to 3 years + fine up to ₹2 lakh', tags: ['privacy', 'voyeurism', 'image', 'consent', 'women'] },
  { id: 'it-67', law: 'IT Act', section: '67', title: 'Publishing Obscene Material in Electronic Form', type: 'Cyber',
    desc: 'Whoever publishes or transmits or causes to be published in electronic form any material which is lascivious or appeals to prurient interest.',
    relevance: 'Sharing obscene content, pornographic material via WhatsApp, social media.',
    penalty: 'First offence: 3 years + ₹5L fine; Repeat: 5 years + ₹10L fine', tags: ['obscene', 'pornography', 'social media', 'content'] },
  { id: 'it-67a', law: 'IT Act', section: '67A', title: 'Publishing Sexually Explicit Material in Electronic Form', type: 'Cyber',
    desc: 'Whoever publishes or transmits a material which contains sexually explicit act or conduct.',
    relevance: 'Explicit sexual content sharing online — stricter than section 67.',
    penalty: 'First: 5 years + ₹10L; Repeat: 7 years + ₹10L', tags: ['sexual content', 'explicit', 'online', 'social media'] },
  { id: 'it-66f', law: 'IT Act', section: '66F', title: 'Cyber Terrorism', type: 'Cyber',
    desc: 'Whoever commits cyberterrorism — attempting to threaten the unity, integrity, sovereignty or security of India by using computer resources.',
    relevance: 'Most serious cyber offence — targeting critical infrastructure.',
    penalty: 'Life imprisonment', tags: ['terrorism', 'cyber', 'national security'] },
  { id: 'it-43', law: 'IT Act', section: '43', title: 'Penalty for Damage to Computer System', type: 'Cyber',
    desc: 'If any person without permission damages, deletes or alters any computer or network resource, they shall be liable to pay damages.',
    relevance: 'Civil remedy for data damage, unauthorized access, malware attacks.',
    penalty: 'Compensatory damages (no criminal jail term)', tags: ['damage', 'data', 'hacking', 'malware'] },

  // ── Consumer Protection ───────────────────────────────────────────────────
  { id: 'cpa-2', law: 'Consumer Act', section: '2(7)', title: 'Definition of Consumer', type: 'Consumer',
    desc: 'Consumer means any person who buys goods or hires services for consideration — paid or promised or partly paid. Does not include commercial purchasers.',
    relevance: 'You are a "consumer" entitled to protection when buying goods/services for personal use.',
    penalty: 'N/A — definitional', tags: ['consumer', 'definition', 'buyer', 'services'] },
  { id: 'cpa-35', law: 'Consumer Act', section: '35', title: 'Manner of Filing Complaint', type: 'Consumer',
    desc: 'Any consumer may file a complaint to District Commission. Claims up to ₹1 crore go to District Commission, up to ₹10 crore to State Commission.',
    relevance: 'How and where to file a consumer complaint based on value of claim.',
    penalty: 'N/A — procedural', tags: ['complaint', 'consumer forum', 'DCDRC', 'filing'] },
  { id: 'cpa-89', law: 'Consumer Act', section: '89', title: 'Penalty for Misleading Advertisement', type: 'Consumer',
    desc: 'Manufacturer or endorser of a false/misleading advertisement shall be punished with imprisonment up to 2 years + fine up to ₹10 lakh.',
    relevance: 'Action against companies and influencers who post misleading ads.',
    penalty: 'Up to 2 years + ₹10L fine; repeat: 5 years + ₹50L', tags: ['advertisement', 'misleading', 'brand', 'influencer'] },
]

const LAW_COLORS = {
  IPC: { bg: 'bg-red-500/10', border: 'border-red-500/20', badge: 'bg-red-500/20 text-red-400', icon: Shield, iconColor: 'text-red-400' },
  CrPC: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', badge: 'bg-blue-500/20 text-blue-400', icon: Scale, iconColor: 'text-blue-400' },
  'IT Act': { bg: 'bg-purple-500/10', border: 'border-purple-500/20', badge: 'bg-purple-500/20 text-purple-400', icon: Cpu, iconColor: 'text-purple-400' },
  'Consumer Act': { bg: 'bg-green-500/10', border: 'border-green-500/20', badge: 'bg-green-500/20 text-green-400', icon: BookOpen, iconColor: 'text-green-400' },
}

const ALL_LAWS = ['All', 'IPC', 'CrPC', 'IT Act', 'Consumer Act']
const ALL_TYPES = ['All', 'Criminal', 'Procedural', 'Cyber', 'Consumer']

/* ─── Accordion Card ─── */
function LawCard({ item, navigate }) {
  const [open, setOpen] = useState(false)
  const style = LAW_COLORS[item.law]
  const Icon = style.icon

  return (
    <motion.div
      layout
      className={`glass-card border ${style.border} overflow-hidden transition-all duration-200`}
    >
      <button
        className="w-full text-left px-5 py-4 flex items-center gap-4"
        onClick={() => setOpen(o => !o)}
      >
        <div className={`w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} className={style.iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`badge ${style.badge} text-xs font-bold`}>{item.law} §{item.section}</span>
            <span className="badge bg-surface-card border border-surface-border text-slate-500 text-xs">{item.type}</span>
          </div>
          <h3 className="text-white font-semibold text-sm mt-1 truncate">{item.title}</h3>
        </div>
        <div className="flex-shrink-0 ml-2">
          {open ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3 border-t border-surface-border pt-4">
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Full Text</p>
                <p className="text-slate-300 text-sm leading-relaxed">{item.desc}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">When It Applies</p>
                <p className="text-slate-300 text-sm leading-relaxed">{item.relevance}</p>
              </div>
              <div className={`px-4 py-3 rounded-xl ${style.bg} border ${style.border}`}>
                <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Penalty</p>
                <p className={`font-semibold text-sm ${style.iconColor}`}>{item.penalty}</p>
              </div>
              <button
                onClick={() => navigate(`/chat?cat=${item.law === 'IPC' ? 'ipc' : item.law === 'CrPC' ? 'crpc' : item.law === 'IT Act' ? 'it' : 'consumer'}&q=${encodeURIComponent(item.law + ' Section ' + item.section + ' — ' + item.title)}`)}
                className="w-full flex items-center justify-center gap-2 btn-primary text-sm py-2.5"
              >
                <MessageSquare size={14} />
                Ask NyayaSaarthi About This Section
                <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ─── Main Page ─── */
export default function Laws() {
  const navigate = useNavigate()
  const [query, setQuery]     = useState('')
  const [lawFilter, setLaw]   = useState('All')
  const [typeFilter, setType] = useState('All')

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return LAW_SECTIONS.filter(item => {
      const matchesLaw  = lawFilter === 'All' || item.law === lawFilter
      const matchesType = typeFilter === 'All' || item.type === typeFilter
      const matchesQ    = !q || item.title.toLowerCase().includes(q)
        || item.section.includes(q)
        || item.desc.toLowerCase().includes(q)
        || item.tags.some(t => t.includes(q))
      return matchesLaw && matchesType && matchesQ
    })
  }, [query, lawFilter, typeFilter])

  const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }} className="mb-8">
          <motion.span variants={fadeUp} className="badge bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm px-3 py-1 mb-4 inline-block">
            Indian Legal Reference
          </motion.span>
          <motion.h1 variants={fadeUp} className="font-display font-black text-4xl md:text-5xl text-white mb-3">
            Law <span className="gradient-text">Reference</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-slate-400 text-lg max-w-2xl">
            Quick-reference guide to key IPC, CrPC, IT Act, and Consumer Protection Act sections — searchable and explained in plain language.
          </motion.p>
        </motion.div>

        {/* Search + filters */}
        <div className="glass-card p-4 mb-6 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="laws-search"
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by section number, keyword (fraud, arrest, bail)..."
              className="input-field pl-11 text-sm"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1 text-slate-500 text-xs"><Filter size={12} /> Law:</span>
            {ALL_LAWS.map(l => (
              <button
                key={l}
                onClick={() => setLaw(l)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${lawFilter === l ? 'bg-primary-600 text-white' : 'bg-surface-card border border-surface-border text-slate-400 hover:text-white'}`}
              >
                {l}
              </button>
            ))}
            <span className="flex items-center gap-1 text-slate-500 text-xs ml-3"><Filter size={12} /> Type:</span>
            {ALL_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${typeFilter === t ? 'bg-primary-600 text-white' : 'bg-surface-card border border-surface-border text-slate-400 hover:text-white'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-500 text-sm">
            Showing <span className="text-white font-semibold">{filtered.length}</span> of {LAW_SECTIONS.length} sections
          </p>
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 text-primary-400 hover:text-primary-300 text-sm transition-colors"
          >
            <MessageSquare size={14} />
            Ask NyayaSaarthi
          </button>
        </div>

        {/* Accordion list */}
        {filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <BookOpen size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No sections match your search. Try different keywords.</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.04 } } }}
            className="space-y-3"
          >
            {filtered.map(item => (
              <motion.div key={item.id} variants={fadeUp}>
                <LawCard item={item} navigate={navigate} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 glass-card p-7 text-center border border-primary-500/20"
        >
          <Scale size={28} className="text-primary-400 mx-auto mb-3" />
          <h3 className="font-display font-bold text-xl text-white mb-2">Need Personalised Guidance?</h3>
          <p className="text-slate-400 text-sm mb-5">
            The reference above shows general provisions. For your specific situation, ask NyayaSaarthi — it will analyse which sections apply to your case.
          </p>
          <button onClick={() => navigate('/chat')} className="btn-primary inline-flex items-center gap-2">
            <MessageSquare size={16} />
            Get Legal Guidance
            <ArrowRight size={16} />
          </button>
        </motion.div>

      </div>
    </div>
  )
}

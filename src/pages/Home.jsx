import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MessageSquare, ShieldAlert, Home as HomeIcon, Scale, ArrowRight,
  CheckCircle, TrendingUp, Users, Zap, ChevronRight,
  Search, Star, Lock, Globe
} from 'lucide-react'

/* ─── Animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}
const stagger = { show: { transition: { staggerChildren: 0.12 } } }

/* ─── Data ─── */
const problems = [
  {
    icon: ShieldAlert,
    color: 'from-red-500 to-orange-500',
    bg:    'bg-red-500/10',
    border:'border-red-500/20',
    badge: 'Online Fraud',
    title: 'Got Cheated Online?',
    desc:  'UPI fraud, phishing, fake investments, e-commerce scams — know your rights under the IT Act 2000 and how to file a cybercrime complaint.',
    steps: ['File on cybercrime.gov.in', 'Freeze fraudulent account', 'Report to CERT-In'],
  },
  {
    icon: Scale,
    color: 'from-blue-500 to-cyan-500',
    bg:    'bg-blue-500/10',
    border:'border-blue-500/20',
    badge: 'Police Rights',
    title: 'Know Your Rights During Arrest',
    desc:  'You have rights under CrPC Section 50–56. Police cannot detain you indefinitely. Know when to ask for a lawyer and how to file a complaint.',
    steps: ['Right to be informed of charges', '24-hour magistrate rule', 'Right to bail'],
  },
  {
    icon: HomeIcon,
    color: 'from-purple-500 to-pink-500',
    bg:    'bg-purple-500/10',
    border:'border-purple-500/20',
    badge: 'Rental Disputes',
    title: 'Landlord-Tenant Conflict?',
    desc:  'Illegal eviction, security deposit, rent hikes — understand your rights under state Rent Control Acts and how to approach the Rent Court.',
    steps: ['Serve legal notice', 'Approach Rent Controller', 'File for compensation'],
  },
]

const stats = [
  { value: '7.4L+',   label: 'Fraud cases in 2023',     icon: ShieldAlert, color: 'text-red-400' },
  { value: '72%',     label: 'Indians unaware of rights',icon: Users,       color: 'text-yellow-400' },
  { value: '50K+',    label: 'Legal queries answered',   icon: MessageSquare, color: 'text-green-400' },
  { value: '₹0',      label: 'Cost of NyayaSaarthi',    icon: Star,        color: 'text-primary-400' },
]

const steps = [
  { step: '01', icon: Search,        title: 'Describe Your Problem',  desc: 'Type your legal question in plain English or Hindi — no jargon needed.' },
  { step: '02', icon: Zap,           title: 'AI Analyses Your Case',  desc: 'Our AI identifies relevant IPC/CrPC sections and applicable rights instantly.' },
  { step: '03', icon: CheckCircle,   title: 'Get Structured Guidance', desc: 'Receive step-by-step action plan with laws, rights and next steps clearly explained.' },
]

const features = [
  { icon: Lock,   title: 'Private & Secure',    desc: 'Your conversations are encrypted and never shared.' },
  { icon: Globe,  title: 'Hindi + English',      desc: 'Full support for both languages — ask in any.' },
  { icon: Zap,    title: 'Instant Responses',    desc: 'AI responds in under 3 seconds with structured answers.' },
  { icon: Star,   title: 'Expert-Verified Laws', desc: 'All legal references are verified by legal experts.' },
]

/* ─── Component ─── */
export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="overflow-x-hidden">

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Background orbs */}
        <div className="orb w-[600px] h-[600px] bg-primary-600 top-10 -left-60" style={{ animationDelay: '0s' }} />
        <div className="orb w-[400px] h-[400px] bg-purple-600 top-40 right-0"   style={{ animationDelay: '2s' }} />
        <div className="orb w-[300px] h-[300px] bg-cyan-600 bottom-20 left-1/3" style={{ animationDelay: '4s' }} />

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div variants={fadeUp} className="flex justify-center mb-6">
              <span className="badge bg-primary-500/10 text-primary-300 border border-primary-500/30 text-sm px-4 py-1.5">
                🇮🇳 Free Legal Help for Every Indian Citizen
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fadeUp} className="font-display font-black text-5xl sm:text-6xl lg:text-7xl leading-tight text-white mb-6">
              AI-Powered{' '}
              <span className="gradient-text">Legal Assistant</span>
              <br />for Every Indian
            </motion.h1>

            {/* Sub */}
            <motion.p variants={fadeUp} className="text-slate-400 text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
              Understand your legal rights in seconds. Get free, structured guidance on fraud, police rights, rental disputes — in English or Hindi.
            </motion.p>

            {/* CTA buttons */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                id="hero-cta-chat"
                onClick={() => navigate('/chat')}
                className="btn-primary text-base px-8 py-4 flex items-center gap-3 text-lg"
              >
                <MessageSquare size={20} />
                Ask Your Legal Question
                <ArrowRight size={18} />
              </button>
              <button
                id="hero-cta-emergency"
                onClick={() => navigate('/emergency')}
                className="flex items-center gap-2 px-8 py-4 text-base font-semibold text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/10 transition-all duration-200"
              >
                <ShieldAlert size={18} />
                Emergency Help
              </button>
            </motion.div>

            {/* Trust badges */}
            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-6 mt-12 text-slate-500 text-sm">
              {['Free to use', 'No registration required', 'Hindi + English', 'AI-powered'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-green-400" />
                  {t}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero chat preview card */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-20 max-w-2xl mx-auto"
          >
            <div className="glass-card p-5 glow-blue">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-slate-500 text-xs ml-2">NyayaSaarthi Chat</span>
              </div>
              {/* Fake chat messages */}
              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="bg-primary-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-sm max-w-xs">
                    Someone transferred money from my PhonePe account, what should I do?
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <Scale size={13} className="text-white" />
                  </div>
                  <div className="bg-surface-card border border-surface-border text-sm px-4 py-3 rounded-2xl rounded-bl-sm max-w-sm">
                    <p className="text-slate-300 mb-2">Here's what you must do <span className="text-primary-400 font-semibold">immediately</span>:</p>
                    <ul className="space-y-1 text-slate-400 text-xs">
                      <li>📞 <span className="text-white">Call 1930</span> — National Cybercrime Helpline</li>
                      <li>🌐 File complaint at <span className="text-primary-400">cybercrime.gov.in</span></li>
                      <li>📧 Send grievance to your bank within 3 days</li>
                      <li>⚖️ <span className="text-white">IT Act 2000, Sec 66C</span> — identity theft covers this</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="py-16 border-y border-surface-border bg-surface-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {stats.map(({ value, label, icon: Icon, color }) => (
              <motion.div key={label} variants={fadeUp} className="text-center">
                <div className="flex justify-center mb-2">
                  <Icon size={24} className={color} />
                </div>
                <p className={`font-display font-black text-4xl ${color}`}>{value}</p>
                <p className="text-slate-400 text-sm mt-1">{label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ PROBLEM CARDS ═══ */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-primary-400 font-semibold text-sm uppercase tracking-widest mb-3">Common Legal Situations</motion.p>
            <motion.h2 variants={fadeUp} className="section-title">We Help You With</motion.h2>
            <motion.p variants={fadeUp} className="section-sub">
              Three of the most common legal problems faced by Indians today — handled quickly and clearly.
            </motion.p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {problems.map(({ icon: Icon, color, bg, border, badge, title, desc, steps: s }) => (
              <motion.div
                key={badge}
                variants={fadeUp}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`glass-card p-7 border ${border} group cursor-pointer`}
                onClick={() => navigate(`/chat?cat=${badge.toLowerCase().replace(' ', '-')}`)}
              >
                <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center mb-5`}>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                    <Icon size={20} className="text-white" />
                  </div>
                </div>
                <span className={`badge ${bg} ${border} border text-xs mb-3`}>
                  <span className={`bg-gradient-to-r ${color} bg-clip-text text-transparent font-bold`}>{badge}</span>
                </span>
                <h3 className="text-white font-bold text-xl mb-3 font-display">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-5">{desc}</p>
                <ul className="space-y-2">
                  {s.map(step => (
                    <li key={step} className="flex items-center gap-2 text-xs text-slate-400">
                      <ChevronRight size={14} className="text-primary-400 flex-shrink-0" />
                      {step}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-1 text-primary-400 text-sm font-medium mt-5 group-hover:gap-2 transition-all">
                  Ask NyayaSaarthi <ArrowRight size={14} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="py-24 bg-surface-card/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-950/10 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-primary-400 font-semibold text-sm uppercase tracking-widest mb-3">Simple Process</motion.p>
            <motion.h2 variants={fadeUp} className="section-title">How NyayaSaarthi Works</motion.h2>
            <motion.p variants={fadeUp} className="section-sub">
              From question to clarity in under 30 seconds.
            </motion.p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
          >
            {/* Connecting line (desktop) */}
            <div className="absolute top-10 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-primary-500/40 to-transparent hidden md:block" />

            {steps.map(({ step, icon: Icon, title, desc }) => (
              <motion.div key={step} variants={fadeUp} className="text-center">
                <div className="relative inline-flex mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-2xl shadow-primary-900/50">
                    <Icon size={28} className="text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary-400 text-surface-dark text-xs font-black flex items-center justify-center">
                    {step}
                  </span>
                </div>
                <h3 className="text-white font-bold text-lg mb-3 font-display">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">{desc}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <button
              id="hiw-cta"
              onClick={() => navigate('/chat')}
              className="btn-primary text-base px-8 py-4 inline-flex items-center gap-3"
            >
              Try It Free Now <ArrowRight size={18} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} className="section-title">Why Trust NyayaSaarthi?</motion.h2>
            <motion.p variants={fadeUp} className="section-sub">
              Built for real Indians, with real legal knowledge — not generic AI.
            </motion.p>
          </motion.div>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {features.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                variants={fadeUp}
                className="glass-card p-6 text-center hover:border-primary-500/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mx-auto mb-4">
                  <Icon size={22} className="text-primary-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{title}</h3>
                <p className="text-slate-400 text-sm">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ CTA BANNER ═══ */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-800 to-primary-950" />
        <div className="orb w-96 h-96 bg-primary-400 top-0 right-0 opacity-20" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display font-black text-4xl md:text-5xl text-white mb-5">
              क्या आपको कानूनी मदद चाहिए?
            </h2>
            <p className="text-primary-200 text-xl mb-8">
              NyayaSaarthi is free, instant, and available 24×7 for every Indian.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                id="bottom-cta-chat"
                onClick={() => navigate('/chat')}
                className="bg-white text-primary-700 font-bold px-8 py-4 rounded-xl hover:bg-primary-50 transition-colors flex items-center gap-2 justify-center text-lg"
              >
                <MessageSquare size={20} />
                Start Free Consultation
              </button>
              <button
                id="bottom-cta-emergency"
                onClick={() => navigate('/emergency')}
                className="border border-white/30 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2 justify-center"
              >
                <ShieldAlert size={18} />
                Emergency Help
              </button>
            </div>
            <p className="text-primary-300/60 text-sm mt-6">
              <TrendingUp size={14} className="inline mr-1" />
              50,000+ legal questions answered this month
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

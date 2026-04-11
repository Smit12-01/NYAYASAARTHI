import { motion } from 'framer-motion'
import { Scale, Target, Eye, Heart, ArrowRight, MessageSquare, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6 } },
}
const stagger = { show: { transition: { staggerChildren: 0.12 } } }

const problems = [
  { stat: '72%', desc: 'Indians do not know their basic constitutional rights', color: 'text-red-400' },
  { stat: '₹20K Cr', desc: 'Lost to cybercrime & online fraud in India annually', color: 'text-orange-400' },
  { stat: '3 Cr+', desc: 'Pending cases in Indian courts — justice delayed', color: 'text-yellow-400' },
  { stat: '90%', desc: 'Victims who unknowingly waive their legal rights', color: 'text-pink-400' },
]

const missions = [
  {
    icon: Eye,
    title: 'Legal Awareness',
    desc: 'Every Indian deserves to understand their rights under the Constitution, IPC, CrPC and other key laws — without needing a law degree.',
  },
  {
    icon: Target,
    title: 'Instant Guidance',
    desc: 'Provide free, real-time, AI-powered legal assistance that is accurate, accessible and structured for non-lawyers.',
  },
  {
    icon: Heart,
    title: 'Equal Justice',
    desc: 'Bridge the gap between expensive legal services and the millions of Indians who cannot afford a lawyer but need help now.',
  },
]

const timeline = [
  { year: '2024 Q1', event: 'Problem identified — legal awareness gap in India', done: true },
  { year: '2024 Q2', event: 'Prototype built — AI + Indian law integration', done: true },
  { year: '2024 Q3', event: 'Pilot tested with 500+ users across India', done: true },
  { year: '2025',    event: 'NyayaSaarthi launched — free for all Indian citizens', done: true },
  { year: '2025+',   event: 'Hindi voice support + WhatsApp integration', done: false },
  { year: '2026',    event: '22 regional language support + lawyer connect', done: false },
]

export default function About() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Hero */}
        <motion.div
          variants={stagger} initial="hidden" animate="show"
          className="text-center mb-20"
        >
          <motion.span variants={fadeUp} className="badge bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm px-4 py-1.5 mb-5 inline-block">
            Our Story & Mission
          </motion.span>
          <motion.h1 variants={fadeUp} className="font-display font-black text-5xl md:text-6xl text-white mb-6">
            Justice Should Be<br />
            <span className="gradient-text">Free for All</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed">
            NyayaSaarthi was born from a simple observation: millions of Indians face legal challenges every day without knowing their rights, because legal help is either too expensive or too complicated.
          </motion.p>
        </motion.div>

        {/* Problem section */}
        <motion.section
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="mb-20"
        >
          <motion.h2 variants={fadeUp} className="section-title text-center mb-4">The Problem We're Solving</motion.h2>
          <motion.p variants={fadeUp} className="section-sub text-center mb-12">
            India has one of the world's largest legal systems — yet most citizens have no access to it.
          </motion.p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {problems.map(({ stat, desc, color }) => (
              <motion.div key={stat} variants={fadeUp} className="glass-card p-6 text-center">
                <p className={`font-display font-black text-4xl ${color} mb-3`}>{stat}</p>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Mission section */}
        <motion.section
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="mb-20"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div variants={fadeUp}>
              <p className="text-primary-400 font-semibold text-sm uppercase tracking-widest mb-3">Our Mission</p>
              <h2 className="section-title mb-6">Empowering Every Citizen With Legal Knowledge</h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                We believe that knowing your rights is the first step to exercising them. NyayaSaarthi combines the power of modern AI with the depth of Indian legal framework to deliver free, instant, and reliable legal guidance to anyone with a smartphone.
              </p>
              <p className="text-slate-400 leading-relaxed">
                From a village farmer facing land disputes to an urban professional fighting cybercrime — NyayaSaarthi speaks your language and knows your rights.
              </p>
              <button
                onClick={() => navigate('/chat')}
                className="btn-primary mt-8 flex items-center gap-2 w-fit"
              >
                <MessageSquare size={16} />
                Try NyayaSaarthi Free
                <ArrowRight size={16} />
              </button>
            </motion.div>
            <motion.div variants={fadeUp} className="space-y-4">
              {missions.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="glass-card p-5 flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* Values */}
        <motion.section
          initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
          className="mb-20 glass-card p-8 md:p-12"
        >
          <motion.h2 variants={fadeUp} className="section-title text-center mb-12">Our Core Principles</motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { emoji: '🔓', title: 'Always Free',      desc: 'NyayaSaarthi will always offer free basic legal guidance. No paywalls for fundamental rights.' },
              { emoji: '🎯', title: 'Accuracy First',   desc: 'Every legal reference is verified against actual Indian law. We never make up statutes.' },
              { emoji: '🔐', title: 'Privacy By Design', desc: 'Your legal queries are private. We do not sell or share your data with anyone.' },
            ].map(({ emoji, title, desc }) => (
              <motion.div key={title} variants={fadeUp}>
                <div className="text-5xl mb-4">{emoji}</div>
                <h3 className="text-white font-bold text-lg mb-3 font-display">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Timeline */}
        <motion.section
          initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
          className="mb-16"
        >
          <motion.h2 variants={fadeUp} className="section-title text-center mb-12">Our Journey</motion.h2>
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary-500 to-transparent" />
            <div className="space-y-6">
              {timeline.map(({ year, event, done }, i) => (
                <motion.div key={i} variants={fadeUp} className="flex gap-4 pl-14 relative">
                  <div className={`absolute left-3.5 top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${done ? 'bg-primary-600 border-primary-500' : 'bg-surface-dark border-surface-border'}`}>
                    {done && <CheckCircle size={10} className="text-white" />}
                  </div>
                  <div>
                    <span className={`badge text-xs px-2 py-0.5 mb-1 ${done ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' : 'bg-surface-card text-slate-500 border border-surface-border'}`}>
                      {year}
                    </span>
                    <p className={`text-sm ${done ? 'text-slate-300' : 'text-slate-500'}`}>{event}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Legal disclaimer */}
        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="glass-card p-6 border border-yellow-500/20 text-center"
        >
          <Scale size={24} className="text-yellow-400 mx-auto mb-3" />
          <h3 className="text-white font-semibold mb-2">Important Legal Disclaimer</h3>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
            NyayaSaarthi provides general legal information and educational content based on publicly available Indian laws. The information provided does not constitute legal advice and should not be relied upon as such. For specific legal matters, please consult a qualified advocate registered with the Bar Council of India.
          </p>
        </motion.div>
      </div>
    </div>
  )
}

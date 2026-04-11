import { motion } from 'framer-motion'
import { ExternalLink, Globe, Link2, Mail, Code, Brain, Palette } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6 } },
}
const stagger = { show: { transition: { staggerChildren: 0.1 } } }

const team = [
  {
    id: 'tirth',
    name:  'Tirth',
    role:  'Full Stack Developer',
    dept:  'Engineering',
    icon:  Code,
    color: 'from-blue-500 to-cyan-500',
    bg:    'bg-blue-500/10',
    border:'border-blue-500/20',
    bio:   'Architected the Node.js backend, real-time chat with Socket.io, and the React frontend. Led overall system design and API integration.',
    skills:['React', 'Node.js', 'Express', 'Socket.io', 'OpenAI API'],
    social: { github: '#', linkedin: '#', twitter: '#' },
    initials: 'TI',
  },
  {
    id: 'sahil',
    name:  'Sahil',
    role:  'AI & Legal Research Engineer',
    dept:  'AI & Legal',
    icon:  Brain,
    color: 'from-purple-500 to-pink-500',
    bg:    'bg-purple-500/10',
    border:'border-purple-500/20',
    bio:   'Designed the AI legal prompt framework, curated the IPC/CrPC/IT Act reference database, and fine-tuned structured legal response schemas.',
    skills:['OpenAI API', 'Prompt Engineering', 'Legal NLP', 'Python', 'LangChain'],
    social: { github: '#', linkedin: '#', twitter: '#' },
    initials: 'SA',
  },
  {
    id: 'omshree',
    name:  'Omshree',
    role:  'Data & API Integration',
    dept:  'Engineering',
    icon:  Code,
    color: 'from-violet-500 to-indigo-500',
    bg:    'bg-violet-500/10',
    border:'border-violet-500/20',
    bio:   'Handled data pipelines, API integrations, and the legal database structuring. Ensured robust data flow between frontend, backend, and AI services.',
    skills:['REST APIs', 'Data Modeling', 'Node.js', 'MongoDB', 'Integration Testing'],
    social: { github: '#', linkedin: '#', twitter: '#' },
    initials: 'OM',
  },
  {
    id: 'uplaksh',
    name:  'Uplaksh',
    role:  'UI/UX Designer & Frontend',
    dept:  'Design',
    icon:  Palette,
    color: 'from-orange-500 to-yellow-500',
    bg:    'bg-orange-500/10',
    border:'border-orange-500/20',
    bio:   'Designed the NyayaSaarthi brand identity, glassmorphism UI, user experience flows, chat interface, and the accessibility-first responsive design system.',
    skills:['Figma', 'TailwindCSS', 'Framer Motion', 'UX Research', 'React'],
    social: { github: '#', linkedin: '#', twitter: '#' },
    initials: 'UP',
  },
  {
    id: 'smit',
    name:  'Smit',
    role:  'Backend Developer',
    dept:  'Engineering',
    icon:  Code,
    color: 'from-green-500 to-teal-500',
    bg:    'bg-green-500/10',
    border:'border-green-500/20',
    bio:   'Built the server-side REST API, rate limiting, security middleware, and WebSocket streaming architecture for real-time AI responses.',
    skills:['Node.js', 'Express', 'Socket.io', 'REST APIs', 'Security'],
    social: { github: '#', linkedin: '#', twitter: '#' },
    initials: 'SM',
  },
  {
    id: 'diya',
    name:  'Diya',
    role:  'Legal Research & Content',
    dept:  'Legal',
    icon:  Brain,
    color: 'from-rose-500 to-pink-500',
    bg:    'bg-rose-500/10',
    border:'border-rose-500/20',
    bio:   'Verified all legal content, mapped real case scenarios to applicable laws, and ensured accuracy of IPC, CrPC, IT Act, and Consumer Protection Act references.',
    skills:['Indian Law', 'Legal Writing', 'IPC/CrPC', 'Case Analysis', 'Legal Tech'],
    social: { github: '#', linkedin: '#', twitter: '#' },
    initials: 'DI',
  },
]

const advisors = [
  { name: 'Adv. Ramesh Kumar', title: 'Senior Advocate, Delhi HC', initials: 'RK' },
  { name: 'Prof. Meena Iyer',  title: 'Legal Studies, NLSIU',     initials: 'MI' },
  { name: 'Vikram Singh',      title: 'Ex-IPS, Cyber Cell Head',  initials: 'VS' },
]

export default function Team() {
  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Header */}
        <motion.div
          variants={stagger} initial="hidden" animate="show"
          className="text-center mb-16"
        >
          <motion.span variants={fadeUp} className="badge bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm px-4 py-1.5 mb-5 inline-block">
            The People Behind NyayaSaarthi
          </motion.span>
          <motion.h1 variants={fadeUp} className="font-display font-black text-5xl md:text-6xl text-white mb-6">
            Built With <span className="gradient-text">Passion</span> for Justice
          </motion.h1>
          <motion.p variants={fadeUp} className="text-slate-400 text-xl max-w-2xl mx-auto">
            A multidisciplinary team of engineers, AI specialists, designers, and legal experts — united by one mission: making legal help accessible to every Indian.
          </motion.p>
        </motion.div>

        {/* Core team */}
        <motion.div
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16"
        >
          {team.map(({ id, name, role, dept, icon: Icon, color, bg, border, bio, skills, social, initials }) => (
            <motion.div
              key={id}
              variants={fadeUp}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`glass-card p-7 border ${border} group`}
            >
              <div className="flex items-start gap-5 mb-5">
                {/* Avatar */}
                <div className="relative">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-display font-black text-xl shadow-lg`}>
                    {initials}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg ${bg} border ${border} flex items-center justify-center`}>
                    <Icon size={12} className={`bg-gradient-to-r ${color} bg-clip-text`} style={{ color: 'transparent', fill: 'currentColor' }} />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="text-white font-bold text-xl font-display">{name}</h3>
                  <p className={`font-semibold text-sm bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{role}</p>
                  <span className={`badge ${bg} border ${border} text-xs mt-1`}>
                    <span className={`bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{dept}</span>
                  </span>
                </div>
              </div>

              <p className="text-slate-400 text-sm leading-relaxed mb-5">{bio}</p>

              {/* Skills */}
              <div className="flex flex-wrap gap-2 mb-5">
                {skills.map(s => (
                  <span key={s} className="px-2.5 py-1 rounded-lg bg-surface-dark border border-surface-border text-slate-400 text-xs">
                    {s}
                  </span>
                ))}
              </div>

              {/* Social */}
              <div className="flex gap-2 border-t border-surface-border pt-4">
                {[
                  { href: social.github,   Icon: ExternalLink, label: 'GitHub' },
                  { href: social.linkedin, Icon: Globe,         label: 'LinkedIn' },
                  { href: social.twitter,  Icon: Link2,         label: 'Twitter' },
                  { href: '#',             Icon: Mail,     label: 'Email' },
                ].map(({ href, Icon: SocialIcon, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="w-8 h-8 rounded-lg bg-surface-dark border border-surface-border flex items-center justify-center text-slate-500 hover:text-primary-400 hover:border-primary-500/30 transition-all"
                  >
                    <SocialIcon size={14} />
                  </a>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Advisors */}
        <motion.section
          initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
          className="mb-16"
        >
          <motion.h2 variants={fadeUp} className="text-white font-display font-bold text-2xl text-center mb-8">Legal Advisors</motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {advisors.map(({ name, title, initials }) => (
              <motion.div key={name} variants={fadeUp} className="glass-card p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
                  {initials}
                </div>
                <h3 className="text-white font-semibold">{name}</h3>
                <p className="text-slate-400 text-sm mt-1">{title}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Join us banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="glass-card p-8 text-center border border-primary-500/20"
        >
          <h3 className="font-display font-bold text-2xl text-white mb-3">Want to Join Our Mission?</h3>
          <p className="text-slate-400 mb-6">
            We're looking for developers, legal experts, and designers who are passionate about access to justice.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Legal Researcher', 'React Developer', 'Hindi Content Writer', 'UI/UX Designer'].map(role => (
              <span key={role} className="badge bg-primary-500/10 border border-primary-500/20 text-primary-400 px-3 py-1.5">
                {role}
              </span>
            ))}
          </div>
          <a
            href="mailto:careers@nyayasaarthi.in"
            id="join-team-btn"
            className="btn-primary mt-6 inline-flex items-center gap-2"
          >
            <Mail size={16} />
            Get In Touch
          </a>
        </motion.div>
      </div>
    </div>
  )
}

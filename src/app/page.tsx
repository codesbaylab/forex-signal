'use client'
import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useInView,
} from 'framer-motion'

/* ─── data ─── */
const TICKER_FALLBACK = [
  { pair: 'XAU/USD', dir: 'BUY',  change: '+1.23%', price: '2341.50' },
  { pair: 'EUR/USD', dir: 'BUY',  change: '+0.42%', price: '1.08420' },
  { pair: 'GBP/USD', dir: 'BUY',  change: '+0.29%', price: '1.26540' },
  { pair: 'USD/JPY', dir: 'SELL', change: '-0.55%', price: '151.820' },
]

const SIGNALS = [
  { pair: 'XAU/USD', dir: 'BUY',  entry: '2341.50', tp: '2380.00', sl: '2315.00', status: 'WIN',    pips: '+385', time: '1h ago' },
  { pair: 'EUR/USD', dir: 'BUY',  entry: '1.08420', tp: '1.09100', sl: '1.08000', status: 'ACTIVE', pips: '+68',  time: '2m ago' },
  { pair: 'GBP/USD', dir: 'SELL', entry: '1.26540', tp: '1.25800', sl: '1.27100', status: 'ACTIVE', pips: '+74',  time: '15m ago' },
  { pair: 'USD/JPY', dir: 'SELL', entry: '151.820', tp: '150.500', sl: '152.400', status: 'ACTIVE', pips: '+132', time: '3h ago' },
]

const FEATURES = [
  { icon: '⚡', title: 'Instant Signals', desc: 'BUY/SELL alerts with entry, TP and SL the moment our AI detects opportunity.' },
  { icon: '🔐', title: 'USDT Wallet', desc: 'Built-in USDT (TRC20) wallet. Deposit, withdraw or transfer instantly.' },
  { icon: '📊', title: 'Technical AI', desc: 'RSI, MACD, EMA and Bollinger Bands analyzed 24/7 across all major pairs.' },
  { icon: '🌐', title: 'All Major Pairs', desc: 'Forex & gold — 10 instruments covered with real-time price feeds.' },
  { icon: '🎁', title: 'Referral Income', desc: 'Earn multi-level commissions when your network subscribes. Up to 4 levels deep.' },
  { icon: '📈', title: 'Signal History', desc: 'Full win/loss history with detailed analytics on every signal ever posted.' },
]

const PLANS = [
  { name: 'Free', monthlyPrice: 0, features: ['Limited signals', 'Basic market access', 'Community access', 'Email support'], cta: 'Get Started', featured: false },
  { name: 'Pro', monthlyPrice: 59, features: ['Unlimited signals', 'XAU/USD + major pairs', 'Real-time alerts', '4-level referral commissions', 'Full signal history', 'Priority support'], cta: 'Go Pro', featured: true },
]

const STATS = [
  { value: '12,847+', label: 'Active Traders' },
  { value: '89%', label: 'Win Rate' },
  { value: '3,200+', label: 'Signals / Month' },
  { value: '4 Levels', label: 'Referral Depth' },
]

/* ─── helpers ─── */
const ease = [0.25, 0.46, 0.45, 0.94] as const

function useTilt() {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { stiffness: 300, damping: 30 })

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top) / rect.height - 0.5)
  }
  function onLeave() { x.set(0); y.set(0) }

  return { rotateX, rotateY, onMove, onLeave }
}

function ScrollReveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 60, rotateX: 15 }}
      animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{ duration: 0.8, delay, ease }}
      style={{ transformPerspective: 1200 }}
    >
      {children}
    </motion.div>
  )
}

function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { rotateX, rotateY, onMove, onLeave } = useTilt()
  return (
    <motion.div
      className={className}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={{ scale: 1.04, z: 30 }}
      transition={{ scale: { duration: 0.2 } }}
    >
      {children}
    </motion.div>
  )
}

function formatLandingPrice(pair: string, price: string): string {
  const p = parseFloat(price)
  if (pair.includes('JPY')) return p.toFixed(3)
  if (pair.startsWith('XAU')) return p.toFixed(2)
  return p.toFixed(5)
}

/* ─── page ─── */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [ticker, setTicker] = useState(TICKER_FALLBACK)
  const [loggedIn, setLoggedIn] = useState(false)
  const [landingBilling, setLandingBilling] = useState<'monthly' | 'annual'>('monthly')
  const [discountPct, setDiscountPct] = useState(17)

  useEffect(() => {
    fetch('/api/settings/public').then(r => r.json()).then(j => {
      if (j.annualDiscountPct) setDiscountPct(j.annualDiscountPct)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) setLoggedIn(true)
    })
  }, [])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    fetch('/api/forex/prices')
      .then((r) => r.json())
      .then((json) => {
        if (!json.data || Object.keys(json.data).length === 0) return
        setTicker((prev) =>
          prev.map((t) => {
            const live = json.data[t.pair]
            if (!live) return t
            const pct = parseFloat(live.pct)
            return {
              pair: t.pair,
              dir: pct >= 0 ? 'BUY' : 'SELL',
              price: formatLandingPrice(t.pair, live.price),
              change: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
            }
          })
        )
      })
      .catch(() => {})
  }, [])

  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '40%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.88])
  const heroRotateX = useTransform(scrollYProgress, [0, 0.6], [0, 8])

  const doubled = [...ticker, ...ticker]

  return (
    <div className="min-h-screen bg-[#050f09] text-white overflow-x-hidden">

      {/* ── Navbar ── */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#050f09]/80 backdrop-blur-2xl border-b border-white/10' : 'bg-transparent'}`}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center font-black text-white shadow-lg shadow-green-900/50">S</div>
            <span className="font-extrabold text-white text-lg tracking-tight">SignalFX Pro</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60 font-medium">
            {['Features', 'Signals', 'Pricing'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-white transition-colors">{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {loggedIn ? (
              <Link href="/dashboard" className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 text-white font-bold px-5 py-2 rounded-xl text-sm shadow-lg shadow-green-900/40 transition-all duration-200 hover:scale-105">
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm text-white/70 hover:text-white px-4 py-2 transition-colors font-medium">Login</Link>
                <Link href="/auth/register" className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 text-white font-bold px-5 py-2 rounded-xl text-sm shadow-lg shadow-green-900/40 transition-all duration-200 hover:scale-105">
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-20 overflow-hidden">
        {/* Parallax background */}
        <motion.div className="absolute inset-0 pointer-events-none" style={{ y: heroY }}>
          <div className="absolute top-1/4 left-1/4 w-[700px] h-[700px] bg-green-700/20 rounded-full blur-[140px] animate-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] animate-glow" style={{ animationDelay: '1.5s' }} />
          <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </motion.div>

        {/* Floating signal cards — left */}
        <motion.div
          className="absolute left-[4%] top-[28%] hidden xl:block"
          initial={{ opacity: 0, x: -80, rotateY: -25 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 1, delay: 0.8, ease }}
          style={{ y: useTransform(scrollYProgress, [0, 1], [0, -80]), transformPerspective: 1000 }}
        >
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 w-54 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white text-sm">EUR/USD</span>
              <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">BUY</span>
            </div>
            <div className="text-2xl font-black text-white mb-2">1.0842</div>
            <div className="flex justify-between text-xs text-white/40 mb-2"><span>TP 1.0910</span><span>SL 1.0800</span></div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full w-2/3 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full animate-pulse" /></div>
          </div>
        </motion.div>

        {/* Floating signal cards — right */}
        <motion.div
          className="absolute right-[4%] top-[32%] hidden xl:block"
          initial={{ opacity: 0, x: 80, rotateY: 25 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 1, delay: 1, ease }}
          style={{ y: useTransform(scrollYProgress, [0, 1], [0, -120]), transformPerspective: 1000 }}
        >
          <div className="bg-white/5 backdrop-blur-xl border border-green-500/30 rounded-2xl p-4 w-54 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white text-sm">XAU/USD</span>
              <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">WIN ✓</span>
            </div>
            <div className="text-2xl font-black text-white mb-2">2341.50</div>
            <div className="flex justify-between text-xs text-white/40 mb-2"><span>TP 2380.00</span><span>SL 2315.00</span></div>
            <div className="text-green-400 font-bold text-sm">+385 pips</div>
          </div>
        </motion.div>

        {/* Hero text */}
        <motion.div
          className="relative z-10 text-center max-w-4xl mx-auto"
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale, rotateX: heroRotateX, transformPerspective: 1200 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold px-4 py-2 rounded-full mb-8"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" />
            Live signals active now — 3 new in the last hour
          </motion.div>

          <motion.h1
            className="text-6xl md:text-7xl lg:text-8xl font-black leading-[1.02] mb-6 tracking-tight"
            initial={{ opacity: 0, y: 50, rotateX: 20 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease }}
            style={{ transformPerspective: 1200 }}
          >
            Trade Smarter
            <span className="block bg-gradient-to-r from-green-400 via-emerald-300 to-green-500 bg-clip-text text-transparent animate-gradient-x">
              with AI Signals
            </span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-white/55 mb-10 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease }}
          >
            Professional BUY/SELL signals for forex, gold & crypto. Precision entry, TP and SL — delivered the moment an opportunity appears.
          </motion.p>

          <motion.div
            className="flex items-center justify-center gap-4 flex-wrap"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55, ease }}
          >
            <Link href="/auth/register" className="group relative bg-gradient-to-r from-green-500 to-green-700 text-white font-bold px-10 py-4 rounded-2xl text-base shadow-xl shadow-green-900/50 transition-all duration-300 hover:scale-110 hover:shadow-green-700/60 overflow-hidden">
              <span className="relative z-10">Start for Free →</span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
            <Link href="/auth/login" className="border border-white/20 hover:border-green-500/50 text-white/80 hover:text-white font-semibold px-10 py-4 rounded-2xl text-base transition-all duration-300 hover:bg-white/5 hover:scale-105">
              Sign In
            </Link>
          </motion.div>

          <motion.p
            className="text-white/25 text-sm mt-5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          >
            No credit card required · Cancel anytime · Crypto payments
          </motion.p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          style={{ opacity: heroOpacity }}
        >
          <span className="text-white/30 text-xs font-medium tracking-widest uppercase">Scroll</span>
          <motion.div
            className="w-5 h-8 border border-white/20 rounded-full flex items-start justify-center p-1"
            animate={{ y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <div className="w-1 h-1.5 bg-white/40 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Live Ticker ── */}
      <div className="border-y border-white/10 bg-white/[0.02] py-3 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {doubled.map((t, i) => (
            <div key={i} className="inline-flex items-center gap-3 mx-8">
              <span className="font-bold text-white text-sm">{t.pair}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.dir === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{t.dir}</span>
              <span className="text-white/60 text-sm font-mono">{t.price}</span>
              <span className={`text-xs font-semibold ${t.dir === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{t.change}</span>
              <span className="text-white/10 mx-2">|</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <ScrollReveal key={s.label} delay={i * 0.1} className="text-center">
              <div className="text-4xl md:text-5xl font-black text-white mb-2 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">{s.value}</div>
              <div className="text-green-400 text-sm font-semibold">{s.label}</div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Signal Preview ── */}
      <section id="signals" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-14">
            <div className="inline-block bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full mb-4">LIVE SIGNALS</div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-3">See What You Get</h2>
            <p className="text-white/45 text-lg">Real signals — entry, TP, SL, and win tracking in one card</p>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SIGNALS.map((s, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <TiltCard className={`relative bg-white/5 border ${s.status === 'WIN' ? 'border-green-500/50' : s.dir === 'BUY' ? 'border-green-500/20' : 'border-red-500/20'} rounded-2xl p-5 cursor-default h-full`}>
                  {s.status === 'WIN' && (
                    <div className="absolute -top-2.5 -right-2.5 bg-gradient-to-r from-green-500 to-emerald-400 text-green-900 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-lg">WIN ✓</div>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-black text-white text-lg">{s.pair}</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.dir === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{s.dir}</span>
                  </div>
                  <div className="text-2xl font-black text-white mb-3">{s.entry}</div>
                  <div className="space-y-1.5 text-xs text-white/40 mb-3">
                    <div className="flex justify-between"><span>Take Profit</span><span className="text-green-400 font-semibold">{s.tp}</span></div>
                    <div className="flex justify-between"><span>Stop Loss</span><span className="text-red-400 font-semibold">{s.sl}</span></div>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 border-t border-white/10">
                    <span className="text-green-400 font-bold text-sm">{s.pips} pips</span>
                    <span className="text-white/25 text-xs">{s.time}</span>
                  </div>
                </TiltCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 px-6 border-y border-white/5 bg-white/[0.015]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-14">
            <div className="inline-block bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full mb-4">FEATURES</div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-3">Everything you need to win</h2>
            <p className="text-white/45 text-lg">Built for serious traders. No noise, just edge.</p>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 0.08}>
                <TiltCard className="group bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-green-500/30 rounded-2xl p-6 transition-colors duration-300 cursor-default h-full">
                  <div className="text-3xl mb-4">{f.icon}</div>
                  <h3 className="font-bold text-white text-lg mb-2">{f.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{f.desc}</p>
                </TiltCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal className="text-center mb-10">
            <div className="inline-block bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full mb-4">PRICING</div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-3">Simple, transparent pricing</h2>
            <p className="text-white/45 text-lg">Pay with USDT. Cancel anytime.</p>
          </ScrollReveal>

          {/* Billing toggle */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center bg-white/10 rounded-xl p-1 gap-1">
              <button
                onClick={() => setLandingBilling('monthly')}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${landingBilling === 'monthly' ? 'bg-white text-gray-900 shadow' : 'text-white/60 hover:text-white'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setLandingBilling('annual')}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${landingBilling === 'annual' ? 'bg-white text-gray-900 shadow' : 'text-white/60 hover:text-white'}`}
              >
                Annually
                <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Save {discountPct}%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {PLANS.map((plan, i) => {
              const isAnnual = landingBilling === 'annual'
              const discountMultiplier = 1 - discountPct / 100
              const displayPrice = plan.monthlyPrice === 0 ? 0 : isAnnual ? Math.round(plan.monthlyPrice * discountMultiplier) : plan.monthlyPrice
              const annualTotal = Math.round(plan.monthlyPrice * discountMultiplier) * 12
              return (
                <ScrollReveal key={plan.name} delay={i * 0.12}>
                  <TiltCard className={`relative rounded-2xl p-7 flex flex-col h-full ${plan.featured ? 'bg-gradient-to-b from-green-600/80 to-green-900/80 border border-green-400/40 shadow-2xl shadow-green-900/50' : 'bg-white/5 border border-white/10'}`}>
                    {plan.featured && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-400 to-emerald-400 text-green-900 text-xs font-black px-4 py-1 rounded-full shadow-lg whitespace-nowrap">MOST POPULAR</div>
                    )}
                    <div className="mb-6">
                      <h3 className="font-bold text-lg text-white mb-2">{plan.name}</h3>
                      {plan.monthlyPrice === 0 ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-5xl font-black text-white">Free</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black text-white">${displayPrice}</span>
                            <span className="text-white/40 text-sm">/month</span>
                          </div>
                          {isAnnual
                            ? <p className="text-white/40 text-xs mt-1">Billed as <span className="text-white/60 font-semibold">${annualTotal}/year</span></p>
                            : <p className="text-white/40 text-xs mt-1">or <span className="text-green-400 font-semibold">${Math.round(plan.monthlyPrice * discountMultiplier)}/mo</span> billed annually</p>
                          }
                        </>
                      )}
                    </div>
                    <ul className="space-y-3 flex-1 mb-7">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-center gap-2.5 text-sm">
                          <svg className="w-4 h-4 flex-shrink-0 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-white/75">{feat}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/auth/register" className={`block text-center font-bold py-3.5 rounded-xl transition-all duration-200 hover:scale-105 ${plan.featured ? 'bg-white text-green-800 hover:bg-gray-100 shadow-lg' : 'bg-green-600/80 hover:bg-green-500 text-white'}`}>
                      {plan.cta}
                    </Link>
                  </TiltCard>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Referral Banner ── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <TiltCard className="relative bg-gradient-to-r from-green-900/60 to-emerald-900/40 border border-green-500/30 rounded-3xl p-12 text-center overflow-hidden cursor-default">
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              <div className="relative z-10">
                <div className="text-5xl mb-5">🎁</div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Earn While You Sleep</h2>
                <p className="text-white/55 text-lg mb-8 max-w-xl mx-auto">Share your referral link and earn commissions up to 4 levels deep — every time your network subscribes.</p>
                <Link href="/auth/register" className="inline-block bg-gradient-to-r from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 text-white font-bold px-10 py-4 rounded-2xl transition-all duration-300 hover:scale-110 shadow-xl shadow-green-900/40">
                  Start Earning Now →
                </Link>
              </div>
            </TiltCard>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center font-black text-white text-sm">S</div>
              <span className="font-extrabold text-white">SignalFX Pro</span>
            </div>
            <p className="text-white/25 text-sm">© 2026 SignalFX Pro. All rights reserved.</p>
            <div className="flex items-center gap-6 text-white/35 text-sm">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/auth/login" className="hover:text-white transition-colors">Login</Link>
            </div>
          </div>
          <div className="border-t border-white/5 pt-5">
            <p className="text-white/20 text-xs text-center leading-relaxed max-w-3xl mx-auto">
              <span className="font-semibold text-white/30">Risk Disclaimer:</span> Trading forex and gold involves substantial risk of loss and is not suitable for all investors. Past performance of signals is not indicative of future results. SignalFX Pro provides signals for informational purposes only and does not constitute financial advice. Never trade with money you cannot afford to lose. Please consult a licensed financial advisor before making any investment decisions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

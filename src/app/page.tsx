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

const STATS = [
  { value: '7 Days', label: 'Free Trial' },
  { value: '$4/mo',  label: 'After Trial' },
  { value: '7',      label: 'Commission Levels' },
  { value: '100%',   label: 'Paid to Network' },
]


const FREE_FEATURES = [
  { icon: '📡', title: 'Live Price Feed',   desc: 'XAU/USD, EUR/USD, GBP/USD & USD/JPY updated every 5 minutes.' },
  { icon: '🔐', title: 'USDT Wallet',       desc: 'Built-in USDT TRC20 wallet — deposit, withdraw and transfer freely.' },
  { icon: '📈', title: 'Signal History',    desc: 'Browse all closed signals with entry, TP, SL and final result.' },
  { icon: '🔗', title: 'Referral Link',     desc: 'Your referral link is active from day 1 — start building your network during the trial.' },
]

const PRO_FEATURES = [
  { icon: '⚡', title: 'Live AI Signals',        desc: 'Real-time BUY/SELL alerts with entry, TP and SL the moment they are published.' },
  { icon: '💰', title: 'Referral Rewards',        desc: 'Earn commissions automatically when the people you invite subscribe to the platform.' },
  { icon: '📊', title: 'Full Trade Analysis',    desc: 'Every signal comes with market structure bias, session context and risk/reward breakdown.' },
  { icon: '🏆', title: 'Priority Support',       desc: 'Dedicated support tickets with faster response times for Pro members.' },
]

type LivePlan = { id: string; name: string; price: number; features: string[] }

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
  const [scrolled, setScrolled]   = useState(false)
  const [ticker, setTicker]       = useState(TICKER_FALLBACK)
  const [loggedIn, setLoggedIn]   = useState(false)
  const [plans, setPlans]         = useState<LivePlan[]>([])

  useEffect(() => {
    fetch('/api/plans').then(r => r.json()).then(j => {
      if (j.success && Array.isArray(j.data)) {
        setPlans(j.data.map((p: { id: string; name: string; price: number | string; features: unknown }) => ({
          id: p.id, name: p.name, price: Number(p.price),
          features: Array.isArray(p.features) ? p.features as string[] : [],
        })))
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => { if (data.user) setLoggedIn(true) })
  }, [])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    fetch('/api/forex/prices').then(r => r.json()).then(json => {
      if (!json.data || Object.keys(json.data).length === 0) return
      setTicker(prev => prev.map(t => {
        const live = json.data[t.pair]
        if (!live) return t
        const pct = parseFloat(live.pct)
        return { pair: t.pair, dir: pct >= 0 ? 'BUY' : 'SELL', price: formatLandingPrice(t.pair, live.price), change: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%` }
      }))
    }).catch(() => {})
  }, [])

  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY       = useTransform(scrollYProgress, [0, 1], ['0%', '40%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const heroScale   = useTransform(scrollYProgress, [0, 1], [1, 0.88])
  const heroRotateX = useTransform(scrollYProgress, [0, 0.6], [0, 8])
  const doubled = [...ticker, ...ticker]

  const proPlans = plans.filter(p => p.price > 0)

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
            {['Features', 'Commissions', 'Pricing'].map(item => (
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
                  Try Free — 7 Days
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-20 overflow-hidden">
        <motion.div className="absolute inset-0 pointer-events-none" style={{ y: heroY }}>
          <div className="absolute top-1/4 left-1/4 w-[700px] h-[700px] bg-green-700/20 rounded-full blur-[140px] animate-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] animate-glow" style={{ animationDelay: '1.5s' }} />
          <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </motion.div>

        {/* Floating card left */}
        <motion.div
          className="absolute left-[4%] top-[28%] hidden xl:block"
          initial={{ opacity: 0, x: -80, rotateY: -25 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 1, delay: 0.8, ease }}
          style={{ y: useTransform(scrollYProgress, [0, 1], [0, -80]), transformPerspective: 1000 }}
        >
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 w-54 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white text-sm">XAU/USD</span>
              <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">BUY</span>
            </div>
            <div className="text-2xl font-black text-white mb-2">3971.94</div>
            <div className="flex justify-between text-xs text-white/40 mb-2"><span>TP 3992.72</span><span>SL 3961.55</span></div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full w-2/3 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full animate-pulse" /></div>
          </div>
        </motion.div>

        {/* Floating card right */}
        <motion.div
          className="absolute right-[4%] top-[32%] hidden xl:block"
          initial={{ opacity: 0, x: 80, rotateY: 25 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 1, delay: 1, ease }}
          style={{ y: useTransform(scrollYProgress, [0, 1], [0, -120]), transformPerspective: 1000 }}
        >
          <div className="bg-white/5 backdrop-blur-xl border border-green-500/30 rounded-2xl p-4 w-54 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white text-sm">Commission</span>
              <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">L1 · 35%</span>
            </div>
            <div className="text-2xl font-black text-white mb-1">$16.80</div>
            <div className="text-xs text-white/40 mb-2">from 1 referral · $48/yr plan</div>
            <div className="text-green-400 font-bold text-sm">Paid to wallet ✓</div>
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
            7-day free trial · No card needed · Referral link active from day 1
          </motion.div>

          <motion.h1
            className="text-6xl md:text-7xl lg:text-8xl font-black leading-[1.02] mb-6 tracking-tight"
            initial={{ opacity: 0, y: 50, rotateX: 20 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease }}
            style={{ transformPerspective: 1200 }}
          >
            AI Signals.
            <span className="block bg-gradient-to-r from-green-400 via-emerald-300 to-green-500 bg-clip-text text-transparent animate-gradient-x">
              Earn While You Trade.
            </span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-white/55 mb-10 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease }}
          >
            Get daily Gold trade signals with entry, stop loss and take profit — and earn referral rewards every time someone you invite subscribes.
          </motion.p>

          <motion.div
            className="flex items-center justify-center gap-4 flex-wrap"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55, ease }}
          >
            <Link href="/auth/register" className="group relative bg-gradient-to-r from-green-500 to-green-700 text-white font-bold px-10 py-4 rounded-2xl text-base shadow-xl shadow-green-900/50 transition-all duration-300 hover:scale-110 hover:shadow-green-700/60 overflow-hidden">
              <span className="relative z-10">Start Free Trial →</span>
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
            7 days free · Then $4/month billed annually · USDT TRC20 payments
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

      {/* ── Features ── */}
      <section id="features" className="py-20 px-6 border-y border-white/5 bg-white/[0.015]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-14">
            <div className="inline-block bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full mb-4">WHAT YOU GET</div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-3">Free trial. Full access. Real earnings.</h2>
            <p className="text-white/45 text-lg">Start for free. Your referral link is live from day 1 — commissions held and released the moment you upgrade.</p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free / Trial column */}
            <ScrollReveal delay={0}>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-7 h-full">
                <div className="inline-block bg-white/10 text-white/70 text-xs font-bold px-3 py-1 rounded-full mb-6">7-DAY FREE TRIAL</div>
                <div className="space-y-5">
                  {FREE_FEATURES.map(f => (
                    <div key={f.title} className="flex gap-4">
                      <span className="text-2xl shrink-0">{f.icon}</span>
                      <div>
                        <p className="font-bold text-white text-sm mb-1">{f.title}</p>
                        <p className="text-white/45 text-xs leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-white/10">
                  <p className="text-white/30 text-xs text-center">No credit card · No commitment · Cancel anytime</p>
                </div>
              </div>
            </ScrollReveal>

            {/* Pro column */}
            <ScrollReveal delay={0.1}>
              <div className="bg-gradient-to-b from-green-600/30 to-green-900/30 border border-green-500/30 rounded-2xl p-7 h-full relative">
                <div className="inline-block bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-6">PRO — $4/mo · $48/yr</div>
                <div className="space-y-5">
                  {PRO_FEATURES.map(f => (
                    <div key={f.title} className="flex gap-4">
                      <span className="text-2xl shrink-0">{f.icon}</span>
                      <div>
                        <p className="font-bold text-white text-sm mb-1">{f.title}</p>
                        <p className="text-white/45 text-xs leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-white/10">
                  <a href="/auth/register" className="block text-center bg-green-500 hover:bg-green-400 text-white font-bold py-3 rounded-xl transition-colors text-sm">
                    Start Free Trial →
                  </a>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Referral Rewards ── */}
      <section id="commissions" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal className="text-center mb-14">
            <div className="inline-block bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full mb-4">REFERRAL REWARDS</div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-3">Share & earn on every subscription</h2>
            <p className="text-white/45 text-lg max-w-xl mx-auto">
              Invite friends. When they subscribe, you earn a commission — automatically paid to your USDT wallet.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              {[
                { icon: '🔗', title: 'Link Active on Day 1', desc: 'Your referral link works from the first day of your free trial. Start sharing immediately.' },
                { icon: '⚡', title: 'Auto USDT Payouts',   desc: 'Commissions are paid directly to your USDT wallet the moment your referral subscribes.' },
                { icon: '♾️', title: 'Earn Every Renewal',  desc: 'When your referrals renew annually, you earn again. Build once, earn every year.' },
              ].map(item => (
                <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <p className="font-bold text-white text-sm mb-2">{item.title}</p>
                  <p className="text-white/40 text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/30 border border-green-500/20 rounded-2xl p-6 text-center">
              <p className="text-white/50 text-sm mb-1">Example payout on a single referral</p>
              <p className="text-3xl font-black text-white mb-1">$16.80 <span className="text-green-400">USDT</span></p>
              <p className="text-white/30 text-xs">35% of $48/year subscription · paid instantly</p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Pricing simple strip ── */}
      <section id="pricing" className="py-16 px-6 border-t border-white/5 bg-white/[0.015]">
        <div className="max-w-2xl mx-auto text-center">
          <ScrollReveal>
            <div className="inline-block bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full mb-6">PRICING</div>
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-6xl font-black text-white">$4</span>
              <span className="text-white/40 text-xl">/ month</span>
            </div>
            <p className="text-white/40 text-sm mb-8">Billed annually — $48/year · Pay with USDT TRC20 · Cancel anytime</p>
            <Link href="/auth/register" className="inline-block bg-gradient-to-r from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 text-white font-bold px-12 py-4 rounded-2xl text-base shadow-xl shadow-green-900/50 transition-all duration-300 hover:scale-110">
              Start Free — 7 Days Trial →
            </Link>
            <p className="text-white/20 text-xs mt-4">No credit card required during trial</p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <TiltCard className="relative bg-gradient-to-r from-green-900/60 to-emerald-900/40 border border-green-500/30 rounded-3xl p-12 text-center overflow-hidden cursor-default">
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              <div className="relative z-10">
                <div className="text-5xl mb-5">🚀</div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Start free. Build your network. Get paid.</h2>
                <p className="text-white/55 text-lg mb-3 max-w-xl mx-auto">
                  Your referral link is active from the first day of your trial. Every signup under you is a pending commission — waiting for you to upgrade and collect.
                </p>
                <p className="text-green-400 font-bold text-sm mb-8">7-day free trial · No credit card · USDT payouts</p>
                <Link href="/auth/register" className="inline-block bg-gradient-to-r from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 text-white font-bold px-10 py-4 rounded-2xl transition-all duration-300 hover:scale-110 shadow-xl shadow-green-900/40">
                  Join Free Now →
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
              <span className="font-semibold text-white/30">Risk Disclaimer:</span> Trading forex and gold involves substantial risk of loss and is not suitable for all investors. Past performance of signals is not indicative of future results. SignalFX Pro provides signals for informational purposes only and does not constitute financial advice. Never trade with money you cannot afford to lose.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

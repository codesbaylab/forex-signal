'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const TICKER = [
  { pair: 'EUR/USD', dir: 'BUY', change: '+0.42%', price: '1.0842' },
  { pair: 'GBP/JPY', dir: 'SELL', change: '-0.81%', price: '196.34' },
  { pair: 'XAU/USD', dir: 'BUY', change: '+1.23%', price: '2341.50' },
  { pair: 'BTC/USD', dir: 'BUY', change: '+3.17%', price: '68,420' },
  { pair: 'USD/JPY', dir: 'SELL', change: '-0.55%', price: '151.82' },
  { pair: 'GBP/USD', dir: 'BUY', change: '+0.29%', price: '1.2654' },
  { pair: 'AUD/USD', dir: 'SELL', change: '-0.38%', price: '0.6521' },
  { pair: 'ETH/USD', dir: 'BUY', change: '+2.44%', price: '3,812' },
  { pair: 'USD/CHF', dir: 'SELL', change: '-0.19%', price: '0.9012' },
  { pair: 'NZD/USD', dir: 'BUY', change: '+0.61%', price: '0.6134' },
]

const SIGNALS = [
  { pair: 'EUR/USD', dir: 'BUY', entry: '1.0842', tp: '1.0910', sl: '1.0800', status: 'ACTIVE', pips: '+68', time: '2m ago' },
  { pair: 'GBP/JPY', dir: 'SELL', entry: '196.34', tp: '195.10', sl: '197.20', status: 'ACTIVE', pips: '+124', time: '8m ago' },
  { pair: 'XAU/USD', dir: 'BUY', entry: '2341.50', tp: '2380.00', sl: '2315.00', status: 'WIN', pips: '+385', time: '1h ago' },
  { pair: 'BTC/USD', dir: 'BUY', entry: '68,420', tp: '72,000', sl: '65,000', status: 'ACTIVE', pips: '+3580', time: '3h ago' },
]

const FEATURES = [
  { icon: '⚡', title: 'Instant Signals', desc: 'BUY/SELL alerts with entry, TP and SL delivered the moment our AI detects an opportunity.' },
  { icon: '🔐', title: 'Crypto Wallet', desc: 'Built-in USDT, BTC & BNB wallet. Deposit, withdraw or transfer funds instantly.' },
  { icon: '📊', title: 'Technical AI', desc: 'RSI, MACD, EMA and Bollinger Bands analyzed 24/7 across all major pairs.' },
  { icon: '🌐', title: 'All Major Pairs', desc: 'Forex, gold, crypto — 40+ instruments covered with real-time price feeds.' },
  { icon: '🎁', title: 'Referral Income', desc: 'Earn multi-level commissions when your network subscribes. Up to 4 levels deep.' },
  { icon: '📈', title: 'Signal History', desc: 'Full win/loss history with detailed analytics on every signal ever posted.' },
]

const STATS = [
  { value: 12847, label: 'Active Traders', suffix: '+' },
  { value: 89, label: 'Win Rate', suffix: '%' },
  { value: 3200, label: 'Signals This Month', suffix: '+' },
  { value: 4, label: 'Referral Levels', suffix: '' },
]

const PLANS = [
  { name: 'Free', price: 0, period: 'forever', features: ['5 signals/day', 'Basic pairs only', 'Community access', 'Email support'], cta: 'Get Started', featured: false },
  { name: 'Basic', price: 29, period: 'month', features: ['50 signals/day', 'All major pairs', 'Real-time alerts', '2-level referral', 'Priority support'], cta: 'Start Basic', featured: false },
  { name: 'Pro', price: 59, period: 'month', features: ['Unlimited signals', 'All pairs + crypto', 'Instant push alerts', '4-level referral', 'Analytics dashboard', 'API access'], cta: 'Go Pro', featured: true },
]

function useCountUp(target: number, duration = 1800) {
  const [val, setVal] = useState(0)
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    const steps = 60
    const step = target / steps
    let cur = 0
    const t = setInterval(() => {
      cur += step
      if (cur >= target) { setVal(target); clearInterval(t) }
      else setVal(Math.floor(cur))
    }, duration / steps)
    return () => clearInterval(t)
  }, [target, duration])
  return val
}

function StatCard({ value, label, suffix }: { value: number; label: string; suffix: string }) {
  const count = useCountUp(value)
  return (
    <div className="text-center animate-fade-up">
      <div className="text-5xl font-black text-white mb-1 tabular-nums">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-green-300 text-sm font-medium">{label}</div>
    </div>
  )
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const doubled = [...TICKER, ...TICKER]

  return (
    <div className="min-h-screen bg-[#050f09] text-white overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#050f09]/90 backdrop-blur-xl border-b border-white/10 shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center font-black text-white text-base shadow-lg shadow-green-900/50">F</div>
            <span className="font-extrabold text-white text-lg tracking-tight">ForexSignal</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60 font-medium">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#signals" className="hover:text-white transition-colors">Signals</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-white/70 hover:text-white transition-colors font-medium px-4 py-2">Login</Link>
            <Link href="/auth/register" className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-green-900/40">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-green-700/20 rounded-full blur-[120px] animate-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-green-500/10 rounded-full blur-[100px] animate-glow" style={{ animationDelay: '1.5s' }} />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        {/* Floating signal cards */}
        <div className="absolute left-[5%] top-[30%] hidden lg:block animate-float" style={{ animationDelay: '0s' }}>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 w-52 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white text-sm">EUR/USD</span>
              <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">BUY</span>
            </div>
            <div className="text-2xl font-black text-white mb-1">1.0842</div>
            <div className="flex justify-between text-xs text-white/50">
              <span>TP: 1.0910</span><span>SL: 1.0800</span>
            </div>
            <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full w-2/3 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="absolute right-[5%] top-[35%] hidden lg:block animate-float2" style={{ animationDelay: '2s' }}>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 w-52 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white text-sm">XAU/USD</span>
              <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">WIN</span>
            </div>
            <div className="text-2xl font-black text-white mb-1">2341.50</div>
            <div className="flex justify-between text-xs text-white/50">
              <span>TP: 2380.00</span><span>SL: 2315.00</span>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <span className="text-green-400 text-xs font-bold">+385 pips</span>
              <span className="text-green-400 text-xs">✓ Closed</span>
            </div>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold px-4 py-2 rounded-full mb-8 animate-fade-up">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" />
            Live signals active now — 3 new signals in the last hour
          </div>
          <h1 className="text-6xl md:text-7xl font-black leading-[1.05] mb-6 animate-fade-up-delay-1 tracking-tight">
            Trade Smarter with
            <span className="block bg-gradient-to-r from-green-400 via-emerald-300 to-green-500 bg-clip-text text-transparent animate-gradient-x">
              AI-Powered Signals
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-up-delay-2">
            Professional BUY/SELL signals for forex, gold & crypto. Precision entry, TP and SL levels — delivered the moment an opportunity appears.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap animate-fade-up-delay-3">
            <Link href="/auth/register" className="group bg-gradient-to-r from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all duration-200 shadow-xl shadow-green-900/50 hover:shadow-green-700/50 hover:scale-105">
              Start for Free →
            </Link>
            <Link href="/auth/login" className="border border-white/20 hover:border-white/40 text-white/80 hover:text-white font-semibold px-8 py-4 rounded-2xl text-base transition-all duration-200 hover:bg-white/5">
              Sign In
            </Link>
          </div>
          <p className="text-white/30 text-sm mt-5 animate-fade-up-delay-4">No credit card required · Cancel anytime · Crypto payments only</p>
        </div>
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
              <span className="text-white/10">|</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats ── */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-black/20">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
          {STATS.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </section>

      {/* ── Signal Preview ── */}
      <section id="signals" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 animate-fade-up">
            <div className="inline-block bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full mb-4">LIVE SIGNALS</div>
            <h2 className="text-4xl font-black text-white mb-3">See What You Get</h2>
            <p className="text-white/50 text-lg">Real signals from our AI engine — entry, TP, SL, and win tracking</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SIGNALS.map((s, i) => (
              <div key={i} className={`animate-fade-up-delay-${i + 1} group relative bg-white/5 hover:bg-white/10 border ${s.status === 'WIN' ? 'border-green-500/40' : s.dir === 'BUY' ? 'border-green-500/20' : 'border-red-500/20'} rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-900/20`}>
                {s.status === 'WIN' && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">WIN ✓</div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-black text-white text-lg">{s.pair}</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.dir === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{s.dir}</span>
                </div>
                <div className="text-2xl font-black text-white mb-3">{s.entry}</div>
                <div className="space-y-1.5 text-xs text-white/50 mb-3">
                  <div className="flex justify-between"><span>Take Profit</span><span className="text-green-400 font-semibold">{s.tp}</span></div>
                  <div className="flex justify-between"><span>Stop Loss</span><span className="text-red-400 font-semibold">{s.sl}</span></div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-green-400 font-bold text-sm">{s.pips} pips</span>
                  <span className="text-white/30 text-xs">{s.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 animate-fade-up">
            <div className="inline-block bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full mb-4">FEATURES</div>
            <h2 className="text-4xl font-black text-white mb-3">Everything you need to win</h2>
            <p className="text-white/50 text-lg">Built for serious traders. No noise, just edge.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`animate-fade-up-delay-${i + 1} group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/30 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-900/10`}>
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-200">{f.icon}</div>
                <h3 className="font-bold text-white text-lg mb-2">{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 animate-fade-up">
            <div className="inline-block bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full mb-4">PRICING</div>
            <h2 className="text-4xl font-black text-white mb-3">Simple, transparent pricing</h2>
            <p className="text-white/50 text-lg">Pay with crypto. Cancel anytime.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <div key={plan.name} className={`animate-fade-up-delay-${i + 1} relative rounded-2xl p-7 flex flex-col transition-all duration-300 hover:scale-[1.02] ${
                plan.featured
                  ? 'bg-gradient-to-b from-green-600 to-green-800 border border-green-500/50 shadow-2xl shadow-green-900/50'
                  : 'bg-white/5 border border-white/10 hover:border-white/20'
              }`}>
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-400 to-emerald-400 text-green-900 text-xs font-black px-4 py-1 rounded-full shadow-lg whitespace-nowrap">
                    MOST POPULAR
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-bold text-lg text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-white">${plan.price}</span>
                    <span className="text-white/50 text-sm">/{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 flex-1 mb-7">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2.5 text-sm">
                      <svg className="w-4 h-4 flex-shrink-0 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-white/80">{feat}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register" className={`block text-center font-bold py-3 rounded-xl transition-all duration-200 ${
                  plan.featured
                    ? 'bg-white text-green-800 hover:bg-gray-100 shadow-lg'
                    : 'bg-green-600 hover:bg-green-500 text-white'
                }`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Referral Banner ── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-r from-green-900/60 to-emerald-900/40 border border-green-500/30 rounded-3xl p-10 text-center overflow-hidden">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="relative z-10">
              <div className="text-4xl mb-4">🎁</div>
              <h2 className="text-3xl font-black text-white mb-3">Earn While You Sleep</h2>
              <p className="text-white/60 text-lg mb-6 max-w-xl mx-auto">Share your referral link and earn commissions up to 4 levels deep — every time your network subscribes.</p>
              <Link href="/auth/register" className="inline-block bg-gradient-to-r from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 text-white font-bold px-8 py-4 rounded-2xl transition-all duration-200 hover:scale-105 shadow-xl shadow-green-900/40">
                Start Earning Now →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center font-black text-white text-sm">F</div>
            <span className="font-extrabold text-white">ForexSignal</span>
          </div>
          <p className="text-white/30 text-sm">© 2025 ForexSignal. All rights reserved. Trading involves risk.</p>
          <div className="flex items-center gap-6 text-white/40 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <Link href="/auth/login" className="hover:text-white transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

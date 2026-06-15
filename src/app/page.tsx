import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  const features = [
    {
      icon: '📡',
      title: 'Live Signals',
      desc: 'Real-time BUY/SELL signals with entry, TP and SL levels for all major forex pairs.',
    },
    {
      icon: '💰',
      title: 'Crypto Wallet',
      desc: 'Integrated multi-currency wallet supporting USDT, BTC, and BNB for seamless payments.',
    },
    {
      icon: '🎁',
      title: 'Referral Rewards',
      desc: 'Earn multi-level commissions when your referrals subscribe to any plan.',
    },
  ]

  const plans = [
    { name: 'Free', price: '$0', period: '/forever', features: ['5 signals/day', 'Basic pairs only', 'Community access'], cta: 'Get Started', href: '/auth/register', featured: false },
    { name: 'Basic', price: '$29', period: '/month', features: ['50 signals/day', 'All major pairs', 'Email alerts', '1-level referral'], cta: 'Start Basic', href: '/auth/register', featured: false },
    { name: 'Pro', price: '$59', period: '/month', features: ['Unlimited signals', 'All pairs + crypto', 'Priority alerts', '3-level referral', 'Analytics dashboard'], cta: 'Go Pro', href: '/auth/register', featured: true },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-700 text-white font-bold flex items-center justify-center text-sm">F</div>
          <span className="font-extrabold text-gray-900 text-lg">ForexSignal</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" className="text-gray-700">Login</Button>
          </Link>
          <Link href="/auth/register">
            <Button className="bg-brand-700 hover:bg-brand-800 text-white">Get Started Free</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 text-white py-24 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-white/20">
            🔴 Live signals active now
          </div>
          <h1 className="text-5xl font-extrabold leading-tight mb-5 tracking-tight">
            Real-Time Forex Signals,<br />Powered by AI
          </h1>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Professional-grade BUY/SELL signals for forex and crypto markets. Trade smarter with precision entry, TP, and SL levels delivered in real-time.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/auth/register">
              <Button className="bg-white text-brand-700 hover:bg-gray-100 font-bold px-8 py-3 text-base h-auto">
                Get Started Free →
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" className="text-white border border-white/30 hover:bg-white/10 px-8 py-3 text-base h-auto">
                Sign in
              </Button>
            </Link>
          </div>
          <p className="text-white/50 text-sm mt-6">No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Everything you need to trade</h2>
            <p className="text-gray-500 text-lg">Built for serious traders who want edge without complexity</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Simple, transparent pricing</h2>
            <p className="text-gray-500 text-lg">Choose the plan that fits your trading style</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.name} className={`rounded-2xl border p-7 flex flex-col ${plan.featured ? 'bg-brand-700 border-brand-700 text-white' : 'bg-white border-gray-100'}`}>
                <div className="mb-6">
                  <h3 className={`font-bold text-lg mb-1 ${plan.featured ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-extrabold ${plan.featured ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                    <span className={`text-sm ${plan.featured ? 'text-white/70' : 'text-gray-500'}`}>{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 flex-1 mb-7">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm">
                      <svg className={`w-4 h-4 flex-shrink-0 ${plan.featured ? 'text-white/80' : 'text-brand-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={plan.featured ? 'text-white/90' : 'text-gray-700'}>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href}>
                  <Button className={`w-full ${plan.featured ? 'bg-white text-brand-700 hover:bg-gray-100' : 'bg-brand-700 hover:bg-brand-800 text-white'}`}>
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10 px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-700 text-white font-bold flex items-center justify-center text-xs">F</div>
            <span className="font-bold text-gray-700">ForexSignal</span>
          </div>
          <p className="text-gray-400 text-sm">© 2025 ForexSignal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-brand-600 hover:underline mb-8 inline-block">&larr; Back to home</Link>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: July 1, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using SignalFX Pro (&ldquo;the Platform&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. Description of Service</h2>
            <p>SignalFX Pro provides forex and gold trading signals, market analysis, and an optional multi-level referral program. Signals are for informational purposes only and do not constitute financial advice or investment recommendations.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. Risk Disclaimer</h2>
            <p>Trading forex, gold, and other financial instruments involves substantial risk of loss. Past signal performance is not indicative of future results. You may lose all or part of your invested capital. Only trade with capital you can afford to lose. SignalFX Pro is not liable for any trading losses incurred by users.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. Subscriptions and Billing</h2>
            <p>Subscriptions are billed annually. Payment is made in USDT (TRC20) from your platform wallet. All payments are final and non-refundable unless required by applicable law. Subscription access is personal and non-transferable.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Free Trial</h2>
            <p>New users receive a free trial period as configured by the platform administrator. Trial access provides full platform features. Upon trial expiry, continued access requires an active paid subscription.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Referral Program</h2>
            <p>The referral program allows users to earn commissions when referred users purchase subscriptions. Commission rates are subject to change. Commissions are credited in USDT to your platform wallet. Abuse of the referral system, including fake registrations or self-referrals, may result in account termination and forfeiture of commissions.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. Prohibited Use</h2>
            <p>You may not use the Platform to: (a) violate any law or regulation; (b) create fake or disposable accounts; (c) engage in market manipulation or illegal trading; (d) attempt to reverse-engineer or disrupt the Platform; (e) redistribute signals without written permission.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">8. Account Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these Terms. Upon termination, wallet balances above the minimum withdrawal threshold may be withdrawn within 30 days.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">9. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, SignalFX Pro shall not be liable for any indirect, incidental, special, or consequential damages arising from use of the Platform, including but not limited to trading losses, loss of profits, or data loss.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">10. Changes to Terms</h2>
            <p>We may update these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the new Terms. Material changes will be notified via the Platform&apos;s announcement system.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">11. Contact</h2>
            <p>For questions about these Terms, contact us through the support ticket system on the Platform.</p>
          </section>

        </div>
      </div>
    </div>
  )
}

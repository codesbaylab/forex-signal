import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-brand-600 hover:underline mb-8 inline-block">&larr; Back to home</Link>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: July 1, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly: your email address, name, and any profile details you choose to add. We also collect usage data such as login times, pages visited, and actions taken within the Platform (e.g., signals viewed, wallet transactions).</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <p>We use your information to: (a) provide and operate the Platform; (b) process transactions and calculate referral commissions; (c) send you notifications about signals, account activity, and Platform updates; (d) detect and prevent fraud or abuse; (e) comply with legal obligations.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. Information Sharing</h2>
            <p>We do not sell your personal information. We may share data with: (a) service providers who operate the Platform infrastructure (e.g., Supabase for authentication, database hosting); (b) payment processors for deposit and withdrawal operations; (c) law enforcement when required by law. Your referral code is publicly shareable by design — only the code itself, not your personal details, is embedded in referral links.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. Data Retention</h2>
            <p>We retain your account data for as long as your account is active. Transaction and commission records are retained for at least 5 years for financial compliance. You may request account deletion; however, transaction records may be retained as required by law.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Security</h2>
            <p>We implement industry-standard security measures including encrypted connections (TLS), hashed credentials via Supabase Auth, and row-level security on the database. No system is perfectly secure — use a strong, unique password and enable any available 2FA.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Cookies</h2>
            <p>We use session cookies for authentication, maintained by Supabase Auth. We do not use advertising or tracking cookies. You can clear cookies at any time but this will log you out of the Platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have rights to access, correct, or delete your personal data. To exercise these rights, submit a request via the support ticket system. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">8. Children</h2>
            <p>The Platform is not intended for users under 18 years of age. We do not knowingly collect data from minors. If you believe a minor has registered, please contact us immediately.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes via the Platform&apos;s announcement system. Continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">10. Contact</h2>
            <p>For privacy-related questions or data requests, contact us via the support ticket system on the Platform.</p>
          </section>

        </div>
      </div>
    </div>
  )
}

export const metadata = { title: 'Privacy Policy — TrueNorth Frames' }

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: July 2026</p>

      <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Who we are</h2>
          <p>TrueNorth Frames is an Edmonton-based photographer marketplace operated by Yogesh Strategy and Analytics. We connect clients with local photographers. Contact us at <a href="mailto:aceinnovate21@gmail.com" className="text-blue-600">aceinnovate21@gmail.com</a>.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Data we collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Account information: name, email address, profile photo</li>
            <li>Booking and messaging data between clients and photographers</li>
            <li>Social platform data (Instagram, Facebook, Google) when you choose to connect them for trust score calculation</li>
            <li>Usage data: pages visited, features used</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">3. How we use your data</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To operate the platform and facilitate bookings</li>
            <li>To calculate and display trust scores for photographer profiles</li>
            <li>To send transactional notifications about bookings and messages</li>
            <li>To improve platform features</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Social platform data</h2>
          <p>When you connect Instagram, Facebook, or Google, we access only the data necessary to calculate your trust score (follower count, post engagement, review ratings). We do not post on your behalf. You can disconnect at any time from your dashboard.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Data sharing</h2>
          <p>We do not sell your personal data. We share data only with service providers necessary to operate the platform (Supabase for database, Cloudflare for storage, Resend for email).</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Data deletion and retention</h2>
          <p>You can delete your account at any time from your account settings, or request deletion by emailing us at <a href="mailto:aceinnovate21@gmail.com" className="text-blue-600">aceinnovate21@gmail.com</a>. When you do, we delete or de-identify the personal data associated with your account, such as your profile, uploaded content, and preferences.</p>
          <p className="mt-2">Some data cannot be fully deleted for legal and operational reasons, including:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Messages you sent to another user remain visible to that user, since they are also that user's record of the conversation.</li>
            <li>Booking, transaction, and payment records we are required to retain for legal, tax, and accounting purposes.</li>
            <li>Data we must keep to comply with the law, resolve disputes, prevent fraud, or enforce our agreements.</li>
          </ul>
          <p className="mt-2">Where we retain such data, we limit it to what is necessary and, where practical, remove information that directly identifies you. Backup copies are removed on our regular backup rotation cycle.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Cookies</h2>
          <p>We use session cookies for authentication only. We do not use tracking or advertising cookies.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Contact</h2>
          <p>For any privacy concerns: <a href="mailto:aceinnovate21@gmail.com" className="text-blue-600">aceinnovate21@gmail.com</a></p>
        </section>
      </div>
    </div>
  )
}

export const metadata = { title: 'Terms of Service — TrueNorth Frames' }

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: July 2026</p>

      <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Acceptance</h2>
          <p>By using TrueNorth Frames you agree to these terms. If you do not agree, do not use the platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Platform description</h2>
          <p>TrueNorth Frames is a marketplace connecting clients with photographers in Edmonton, Alberta, operated by Yogesh Strategy and Analytics. We facilitate discovery and booking but are not a party to agreements between clients and photographers.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">3. User accounts</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You must provide accurate information when creating an account</li>
            <li>You are responsible for maintaining the security of your account</li>
            <li>You must be 18 or older to use the platform</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Photographer responsibilities</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Photographers must honour confirmed bookings or provide timely notice of cancellation</li>
            <li>Profile information must be accurate and up to date</li>
            <li>Connected social accounts must belong to the photographer</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Client responsibilities</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Clients must honour confirmed bookings or cancel with reasonable notice</li>
            <li>Reviews must be honest and based on genuine experiences</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Prohibited conduct</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Posting false reviews or misrepresenting yourself</li>
            <li>Harassment or abusive communication</li>
            <li>Attempting to circumvent platform features</li>
            <li>Using the platform for any unlawful purpose</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Intellectual property and content licence</h2>
          <p>Photographers retain full ownership of the photos and content they upload. By uploading content to TrueNorth Frames, you grant us a non-exclusive, royalty-free, worldwide licence to host, store, reproduce, and display that content <strong>on the TrueNorth Frames platform</strong> for the purpose of operating the platform &mdash; including on your public profile and in platform features such as photographer discovery and featured listings.</p>
          <p className="mt-2">This licence is limited to use on the platform itself. We will not use your content in external or paid marketing (for example, off-platform advertising, paid social campaigns, or promotional materials on third-party sites) without your separate, express permission.</p>
          <p className="mt-2">This licence lasts for as long as your content remains on the platform. When you delete specific content or your account, the licence ends and we will remove that content from public display within a reasonable period, subject to the retention limits described in our Privacy Policy (for example, backup rotation and cached copies served by third parties may persist temporarily).</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Reviews and user-generated content</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Reviews and other content submitted by users reflect the views of those users, not TrueNorth Frames. We do not endorse, verify, or guarantee any user-generated content.</li>
            <li>By submitting a review or other content, you grant us a non-exclusive, royalty-free licence to display, store, moderate, and distribute it on the platform.</li>
            <li>We may, at our discretion, moderate, edit for policy compliance, decline to publish, or remove content &mdash; for example, content that is false, unlawful, harassing, or violates these terms &mdash; but we are under no obligation to monitor or remove content.</li>
            <li>To the fullest extent permitted by law, TrueNorth Frames is not liable for content posted by users, including reviews. A review being unfavourable is not, on its own, grounds for removal or a claim against us. Genuine disputes about a review may be submitted to us for review under our content policies.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Trust Scores</h2>
          <p>Trust Scores are estimates generated from third-party data (such as Google, Instagram, Facebook, and Yelp) and native platform activity. They are provided for general informational purposes only and are <strong>not guarantees</strong> of a photographer&rsquo;s quality, reliability, or suitability.</p>
          <p className="mt-2">Third-party data may be incomplete, delayed, outdated, or inaccurate, and scores may change over time. You should not rely on a Trust Score as the sole basis for a booking or any other decision. To the fullest extent permitted by law, TrueNorth Frames is not liable for decisions made in reliance on a Trust Score.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Limitation of liability</h2>
          <p>TrueNorth Frames is not liable for disputes between clients and photographers, payment issues handled outside the platform, or indirect damages arising from use of the platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">11. Changes to terms</h2>
          <p>We may update these terms. Continued use of the platform after changes constitutes acceptance.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">12. Contact</h2>
          <p>Questions about these terms: <a href="mailto:aceinnovate21@gmail.com" className="text-blue-600">aceinnovate21@gmail.com</a></p>
        </section>
      </div>
    </div>
  )
}

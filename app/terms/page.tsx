export const metadata = { title: 'Terms of Service — TrueNorth Frames' }

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: May 2026</p>

      <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Acceptance</h2>
          <p>By using TrueNorth Frames you agree to these terms. If you do not agree, do not use the platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Platform description</h2>
          <p>TrueNorth Frames is a marketplace connecting clients with photographers in Edmonton, Alberta. We facilitate discovery and booking but are not a party to agreements between clients and photographers.</p>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Intellectual property</h2>
          <p>Photographers retain full ownership of their photos and content. By uploading to TrueNorth Frames you grant us a limited licence to display your content on the platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Limitation of liability</h2>
          <p>TrueNorth Frames is not liable for disputes between clients and photographers, payment issues handled outside the platform, or indirect damages arising from use of the platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Changes to terms</h2>
          <p>We may update these terms. Continued use of the platform after changes constitutes acceptance.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Contact</h2>
          <p>Questions about these terms: <a href="mailto:aceinnovate21@gmail.com" className="text-blue-600">aceinnovate21@gmail.com</a></p>
        </section>
      </div>
    </div>
  )
}

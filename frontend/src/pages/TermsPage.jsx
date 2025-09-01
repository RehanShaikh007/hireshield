import React from 'react'

const TermsPage = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <div className="space-y-6 text-gray-700 max-w-4xl">
        <section>
          <h2 className="text-xl font-semibold mb-3 text-gray-900">1. Acceptance of Terms</h2>
          <p>By accessing and using this verification platform, you accept and agree to be bound by the terms and provision of this agreement.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-gray-900">2. Use License</h2>
          <p>Permission is granted to temporarily access the materials on this platform for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-gray-900">3. User Responsibilities</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You are responsible for maintaining the confidentiality of your account credentials</li>
            <li>You must provide accurate and complete information during registration</li>
            <li>You agree not to use the service for any unlawful purpose</li>
            <li>You must not attempt to gain unauthorized access to any part of the system</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-gray-900">4. Data and Privacy</h2>
          <p>Your use of this platform is also governed by our Privacy Policy. By using our service, you consent to the collection and use of information as detailed in our Privacy Policy.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-gray-900">5. Service Availability</h2>
          <p>We strive to maintain high availability of our services, but we do not guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue any part of the service at any time.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-gray-900">6. Limitation of Liability</h2>
          <p>In no event shall this platform or its suppliers be liable for any damages arising out of the use or inability to use the materials on this platform.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-gray-900">7. Contact Information</h2>
          <p>For questions about these Terms of Service, please contact us at terms@hireshield.in</p>
        </section>
      </div>
    </div>
  )
}

export default TermsPage

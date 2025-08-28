export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Privacy Policy</h1>
        <p className="text-slate-600">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Privacy Content */}
      <div className="prose prose-slate max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Information We Collect</h2>
          <p className="text-slate-600 mb-4">
            At Fastios, we collect information to provide better services to real estate professionals 
            and their clients. The types of information we collect include:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>Personal information (name, email address, phone number)</li>
            <li>Professional information (real estate license, brokerage details)</li>
            <li>Transaction data (property details, deal progress, client interactions)</li>
            <li>Usage data (how you interact with our platform)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. How We Use Your Information</h2>
          <p className="text-slate-600 mb-4">
            We use the collected information to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>Facilitate real estate transactions between agents and clients</li>
            <li>Provide transaction tracking and document management</li>
            <li>Send important updates about deals and platform features</li>
            <li>Improve our services and develop new features</li>
            <li>Ensure platform security and prevent fraud</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Information Sharing</h2>
          <p className="text-slate-600 mb-4">
            We do not sell, trade, or rent your personal information. We may share information:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>Between agents and their authorized clients within the platform</li>
            <li>With service providers who assist in our operations</li>
            <li>When required by law or to protect rights and safety</li>
            <li>With your explicit consent</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Data Security</h2>
          <p className="text-slate-600 mb-4">
            We implement industry-standard security measures to protect your information, including:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>Encryption of sensitive data in transit and at rest</li>
            <li>Regular security audits and updates</li>
            <li>Access controls and authentication mechanisms</li>
            <li>Secure data centers with physical security measures</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Your Rights</h2>
          <p className="text-slate-600 mb-4">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of marketing communications</li>
            <li>Export your data in a portable format</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Cookies</h2>
          <p className="text-slate-600">
            We use cookies and similar technologies to enhance your experience, analyze usage patterns, 
            and personalize content. You can manage cookie preferences through your browser settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Changes to This Policy</h2>
          <p className="text-slate-600">
            We may update this privacy policy from time to time. We will notify you of any significant 
            changes via email or platform notification.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Contact Us</h2>
          <p className="text-slate-600">
            If you have questions about this privacy policy or our data practices, please contact us at:
          </p>
          <div className="mt-4 text-slate-600">
            <p>Email: privacy@fastios.com</p>
            <p>Phone: 1-800-FASTIOS</p>
            <p>Address: 123 Real Estate Way, Suite 100, San Francisco, CA 94105</p>
          </div>
        </section>
      </div>
    </div>
  )
}
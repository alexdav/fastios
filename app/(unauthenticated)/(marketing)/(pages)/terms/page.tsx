export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Terms of Service</h1>
        <p className="text-slate-600">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Terms Content */}
      <div className="prose prose-slate max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Acceptance of Terms</h2>
          <p className="text-slate-600">
            By accessing and using Fastios, you agree to be bound by these Terms of Service and all 
            applicable laws and regulations. Fastios is a platform designed for real estate professionals 
            to manage client relationships and track property transactions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Description of Service</h2>
          <p className="text-slate-600 mb-4">
            Fastios provides:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>Real estate transaction management tools</li>
            <li>Client portal for buyers and sellers</li>
            <li>Document storage and sharing capabilities</li>
            <li>Communication tools between agents and clients</li>
            <li>Progress tracking for real estate deals</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. User Accounts</h2>
          <p className="text-slate-600 mb-4">
            To use Fastios, you must:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>Provide accurate and complete registration information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Be a licensed real estate professional or an authorized client</li>
            <li>Promptly notify us of any unauthorized account use</li>
            <li>Be responsible for all activities under your account</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Professional Use</h2>
          <p className="text-slate-600 mb-4">
            As a real estate professional using Fastios, you agree to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>Comply with all real estate laws and regulations</li>
            <li>Maintain appropriate licenses and certifications</li>
            <li>Use the platform only for legitimate business purposes</li>
            <li>Protect client confidentiality and privacy</li>
            <li>Provide accurate property and transaction information</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Prohibited Uses</h2>
          <p className="text-slate-600 mb-4">
            You may not:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>Use the service for any illegal or unauthorized purpose</li>
            <li>Misrepresent property information or transaction details</li>
            <li>Violate fair housing laws or engage in discrimination</li>
            <li>Share or sell access to your account</li>
            <li>Attempt to breach or test system security</li>
            <li>Upload malicious code or interfere with service operation</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Fees and Payment</h2>
          <p className="text-slate-600">
            Subscription fees are billed in advance on a monthly or annual basis. All fees are 
            non-refundable except as required by law. We reserve the right to change fees with 
            30 days' notice.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Intellectual Property</h2>
          <p className="text-slate-600">
            All content, features, and functionality of Fastios are owned by us and are protected by 
            copyright, trademark, and other intellectual property laws. You retain ownership of content 
            you upload but grant us a license to use it in providing our services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Limitation of Liability</h2>
          <p className="text-slate-600">
            Fastios is provided "as is" without warranties of any kind. We are not liable for any 
            indirect, incidental, or consequential damages arising from your use of the service. Our 
            total liability shall not exceed the fees paid by you in the preceding 12 months.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. Indemnification</h2>
          <p className="text-slate-600">
            You agree to indemnify and hold harmless Fastios from any claims arising from your use 
            of the service, violation of these terms, or infringement of any third-party rights.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">10. Termination</h2>
          <p className="text-slate-600">
            We may terminate or suspend your account immediately for violations of these terms. Upon 
            termination, your right to use the service will cease immediately. You may terminate your 
            account at any time through your account settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">11. Governing Law</h2>
          <p className="text-slate-600">
            These terms are governed by the laws of California, United States, without regard to 
            conflict of law principles. Any disputes shall be resolved in the courts of San Francisco 
            County, California.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">12. Contact Information</h2>
          <p className="text-slate-600">
            For questions about these Terms of Service, please contact us at:
          </p>
          <div className="mt-4 text-slate-600">
            <p>Email: legal@fastios.com</p>
            <p>Phone: 1-800-FASTIOS</p>
            <p>Address: 123 Real Estate Way, Suite 100, San Francisco, CA 94105</p>
          </div>
        </section>
      </div>
    </div>
  )
}
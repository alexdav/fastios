export default function FeaturesPage() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Powerful Features</h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Everything real estate professionals need to manage clients and close deals faster
        </p>
      </div>

      {/* Main Features Grid */}
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <div className="p-6 border border-slate-200 rounded-lg">
          <div className="w-12 h-12 bg-blue-100 rounded-lg mb-4 flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-3">Deal Pipeline</h3>
          <p className="text-slate-600 mb-4">
            Track every deal from initial contact to closing with our visual pipeline.
          </p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Customizable deal stages
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Automated status updates
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Deal timeline tracking
            </li>
          </ul>
        </div>

        <div className="p-6 border border-slate-200 rounded-lg">
          <div className="w-12 h-12 bg-green-100 rounded-lg mb-4 flex items-center justify-center">
            <span className="text-2xl">👥</span>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-3">Client Portal</h3>
          <p className="text-slate-600 mb-4">
            Give clients 24/7 access to their transaction status and documents.
          </p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Real-time progress updates
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Secure document access
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              In-app messaging
            </li>
          </ul>
        </div>

        <div className="p-6 border border-slate-200 rounded-lg">
          <div className="w-12 h-12 bg-purple-100 rounded-lg mb-4 flex items-center justify-center">
            <span className="text-2xl">📄</span>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-3">Document Management</h3>
          <p className="text-slate-600 mb-4">
            Store, organize, and share all transaction documents securely.
          </p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Electronic signatures
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Version control
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Compliance tracking
            </li>
          </ul>
        </div>

        <div className="p-6 border border-slate-200 rounded-lg">
          <div className="w-12 h-12 bg-orange-100 rounded-lg mb-4 flex items-center justify-center">
            <span className="text-2xl">📱</span>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-3">Communication Hub</h3>
          <p className="text-slate-600 mb-4">
            Keep all stakeholders connected throughout the transaction.
          </p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Automated notifications
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Email & SMS updates
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Activity feed
            </li>
          </ul>
        </div>
      </div>

      {/* Additional Features */}
      <div className="bg-slate-50 rounded-lg p-8 mb-16">
        <h2 className="text-2xl font-semibold text-slate-900 mb-6 text-center">
          More Powerful Features
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-2">📅</div>
            <h4 className="font-semibold text-slate-900 mb-1">Calendar Integration</h4>
            <p className="text-sm text-slate-600">
              Sync showings, closings, and deadlines with your calendar
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🔒</div>
            <h4 className="font-semibold text-slate-900 mb-1">Bank-Level Security</h4>
            <p className="text-sm text-slate-600">
              256-bit encryption and SOC 2 compliance
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">📊</div>
            <h4 className="font-semibold text-slate-900 mb-1">Analytics Dashboard</h4>
            <p className="text-sm text-slate-600">
              Track performance metrics and conversion rates
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🏠</div>
            <h4 className="font-semibold text-slate-900 mb-1">MLS Integration</h4>
            <p className="text-sm text-slate-600">
              Import property details directly from MLS
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">💰</div>
            <h4 className="font-semibold text-slate-900 mb-1">Commission Tracking</h4>
            <p className="text-sm text-slate-600">
              Calculate and track commissions automatically
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">👥</div>
            <h4 className="font-semibold text-slate-900 mb-1">Team Collaboration</h4>
            <p className="text-sm text-slate-600">
              Work seamlessly with co-agents and staff
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">
          Ready to streamline your real estate business?
        </h2>
        <p className="text-slate-600 mb-6">
          Join thousands of agents delivering exceptional client experiences.
        </p>
        <a
          href="/signup"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Start Your Free Trial
        </a>
      </div>
    </div>
  )
}
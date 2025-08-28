export default function PricingPage() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-slate-600">
          Choose the plan that works best for your team
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {/* Starter Plan */}
        <div className="bg-white border border-slate-200 rounded-lg p-8">
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Starter</h3>
            <p className="text-slate-600 text-sm mb-4">Perfect for side projects</p>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-slate-900">$0</span>
              <span className="text-slate-600 ml-2">/month</span>
            </div>
          </div>
          <ul className="space-y-3 mb-8">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-slate-600">Up to 3 projects</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-slate-600">Basic templates</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-slate-600">Community support</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-slate-600">1 GB storage</span>
            </li>
          </ul>
          <button className="w-full bg-slate-100 text-slate-900 py-2 px-4 rounded-lg font-semibold hover:bg-slate-200 transition">
            Get Started
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-blue-600 text-white rounded-lg p-8 relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <span className="bg-green-500 text-white text-sm px-3 py-1 rounded-full font-semibold">
              Most Popular
            </span>
          </div>
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-2">Pro</h3>
            <p className="text-blue-100 text-sm mb-4">For professional developers</p>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold">$29</span>
              <span className="text-blue-100 ml-2">/month</span>
            </div>
          </div>
          <ul className="space-y-3 mb-8">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-white mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Unlimited projects</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-white mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Premium templates</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-white mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Priority support</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-white mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>100 GB storage</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-white mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Advanced analytics</span>
            </li>
          </ul>
          <button className="w-full bg-white text-blue-600 py-2 px-4 rounded-lg font-semibold hover:bg-blue-50 transition">
            Start Free Trial
          </button>
        </div>

        {/* Enterprise Plan */}
        <div className="bg-white border border-slate-200 rounded-lg p-8">
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Enterprise</h3>
            <p className="text-slate-600 text-sm mb-4">For large teams</p>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-slate-900">$99</span>
              <span className="text-slate-600 ml-2">/month</span>
            </div>
          </div>
          <ul className="space-y-3 mb-8">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-slate-600">Everything in Pro</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-slate-600">Team collaboration</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-slate-600">Dedicated support</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-slate-600">Unlimited storage</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-slate-600">Custom integrations</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-slate-600">SLA guarantee</span>
            </li>
          </ul>
          <button className="w-full bg-slate-900 text-white py-2 px-4 rounded-lg font-semibold hover:bg-slate-800 transition">
            Contact Sales
          </button>
        </div>
      </div>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold text-slate-900 text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">
              Can I change plans at any time?
            </h3>
            <p className="text-slate-600">
              Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">
              Do you offer a free trial?
            </h3>
            <p className="text-slate-600">
              Yes, all paid plans come with a 14-day free trial. No credit card required.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">
              What payment methods do you accept?
            </h3>
            <p className="text-slate-600">
              We accept all major credit cards, PayPal, and wire transfers for enterprise customers.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">
              Is there a discount for annual billing?
            </h3>
            <p className="text-slate-600">
              Yes, we offer a 20% discount when you pay annually instead of monthly.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
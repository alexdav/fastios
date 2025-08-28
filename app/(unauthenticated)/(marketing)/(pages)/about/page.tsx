export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">About Fastios</h1>
        <p className="text-xl text-slate-600">
          Revolutionizing real estate transactions for modern professionals
        </p>
      </div>

      {/* Mission Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Our Mission</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          We believe that real estate transactions should be transparent, efficient, and stress-free. 
          Fastios was created to bridge the communication gap between real estate agents and their 
          clients, providing a centralized platform where everyone stays informed and connected.
        </p>
        <p className="text-slate-600 leading-relaxed">
          Our platform empowers agents to deliver exceptional client experiences while streamlining 
          their workflow. From initial contact to closing, we make every step of the journey smoother 
          for everyone involved.
        </p>
      </section>

      {/* Values Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-slate-900 mb-6">Our Values</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Transparency</h3>
            <p className="text-slate-600">
              Keep clients informed with real-time updates on their property transactions.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Efficiency</h3>
            <p className="text-slate-600">
              Streamline workflows to close deals faster and with less friction.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Security</h3>
            <p className="text-slate-600">
              Protect sensitive transaction data with bank-level security measures.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Innovation</h3>
            <p className="text-slate-600">
              Continuously improve the real estate experience with modern technology.
            </p>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-slate-900 mb-6">The Team</h2>
        <p className="text-slate-600 leading-relaxed mb-8">
          Fastios is built by a team of real estate and technology professionals who understand 
          the unique challenges of property transactions. With decades of combined experience 
          in both industries, we're committed to making real estate deals smoother for agents 
          and clients alike.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-3"></div>
            <h3 className="font-semibold text-slate-900">Sarah Chen</h3>
            <p className="text-sm text-slate-600">CEO & Co-founder</p>
          </div>
          <div className="text-center">
            <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-3"></div>
            <h3 className="font-semibold text-slate-900">Michael Rodriguez</h3>
            <p className="text-sm text-slate-600">CTO & Co-founder</p>
          </div>
          <div className="text-center">
            <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-3"></div>
            <h3 className="font-semibold text-slate-900">Emily Watson</h3>
            <p className="text-sm text-slate-600">Head of Real Estate Operations</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-12 bg-slate-50 rounded-lg">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Ready to Transform Your Business?</h2>
        <p className="text-slate-600 mb-6">
          Join thousands of real estate professionals using Fastios to delight their clients.
        </p>
        <a
          href="/signup"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Start Your Free Trial
        </a>
      </section>
    </div>
  )
}
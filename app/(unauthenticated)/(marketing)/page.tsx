import Link from 'next/link'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

export default function MarketingLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Simple Header for Homepage */}
        <header className="py-6">
          <nav className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-slate-900">
                Fastios
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <SignedOut>
                <Link
                  href="/signin"
                  className="text-slate-600 hover:text-slate-900 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Get Started
                </Link>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <main className="mt-16 md:mt-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
              Welcome to Fastios
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              The modern platform for real estate professionals. 
              Manage clients, track deals, and close faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Start Building
              </Link>
              <Link
                href="/about"
                className="inline-block bg-white text-slate-900 px-8 py-3 rounded-lg font-semibold border border-slate-300 hover:bg-slate-50 transition"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-24 grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-blue-600 text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Deal Tracking</h3>
              <p className="text-slate-600">
                Keep clients informed with real-time deal progress.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-green-600 text-2xl">🛠️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Client Portal</h3>
              <p className="text-slate-600">
                Give clients 24/7 access to their transaction details.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-purple-600 text-2xl">🚀</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Document Management</h3>
              <p className="text-slate-600">
                Securely store and share all transaction documents.
              </p>
            </div>
          </div>
        </main>

        {/* Simple Footer */}
        <footer className="mt-24 py-8 border-t border-slate-200">
          <div className="text-center text-slate-600">
            <p>&copy; {new Date().getFullYear()} Fastios. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
import Link from 'next/link'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

export default function MarketingPagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* More comprehensive header for marketing pages */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-xl font-bold text-slate-900">
                Fastios
              </Link>
              <div className="hidden md:flex items-center space-x-6">
                <Link
                  href="/features"
                  className="text-slate-600 hover:text-slate-900 transition"
                >
                  Features
                </Link>
                <Link
                  href="/pricing"
                  className="text-slate-600 hover:text-slate-900 transition"
                >
                  Pricing
                </Link>
                <Link
                  href="/about"
                  className="text-slate-600 hover:text-slate-900 transition"
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="text-slate-600 hover:text-slate-900 transition"
                >
                  Contact
                </Link>
              </div>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </main>

      {/* More detailed footer for marketing pages */}
      <footer className="bg-slate-50 border-t border-slate-200 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Fastios</h3>
              <p className="text-slate-600 text-sm">
                Streamline real estate transactions for agents and clients.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/features" className="text-slate-600 hover:text-slate-900 text-sm">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-slate-600 hover:text-slate-900 text-sm">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-slate-600 hover:text-slate-900 text-sm">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-slate-600 hover:text-slate-900 text-sm">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="text-slate-600 hover:text-slate-900 text-sm">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-slate-600 hover:text-slate-900 text-sm">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-200">
            <p className="text-center text-slate-600 text-sm">
              &copy; {new Date().getFullYear()} Fastios. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
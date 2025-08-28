'use client'

import { useUser } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const currentUser = useQuery(api.users.getCurrentUser)
  const [viewMode, setViewMode] = useState<'agent' | 'client' | null>(null)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/signin')
    }
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    if (currentUser) {
      setViewMode(currentUser.role as 'agent' | 'client')
    }
  }, [currentUser])

  // Show loading state while checking auth
  if (!isLoaded || !currentUser || !viewMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Define navigation based on view mode
  const agentNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Deals', href: '/deals', icon: '🏠' },
    { name: 'Clients', href: '/clients', icon: '👥' },
    { name: 'Documents', href: '/documents', icon: '📄' },
    { name: 'Analytics', href: '/analytics', icon: '📈' },
    { name: 'Settings', href: '/settings', icon: '⚙️' },
  ]

  const clientNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'My Transaction', href: '/my-transaction', icon: '📊' },
    { name: 'Documents', href: '/documents', icon: '📄' },
    { name: 'Messages', href: '/messages', icon: '💬' },
    { name: 'Profile', href: '/profile', icon: '👤' },
  ]

  const navigation = viewMode === 'agent' ? agentNavigation : clientNavigation
  const isAgent = currentUser.role === 'agent'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                Fastios
              </Link>
              {isAgent && viewMode === 'client' && (
                <span className="ml-3 px-2 py-1 text-xs font-medium text-orange-600 bg-orange-100 rounded-full">
                  Client Preview Mode
                </span>
              )}
              {!isAgent && (
                <span className="ml-3 px-2 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-full">
                  Client Portal
                </span>
              )}
              {isAgent && viewMode === 'agent' && (
                <span className="ml-3 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
                  Agent
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle for Agents */}
              {isAgent && (
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('agent')}
                    className={`px-3 py-1 text-sm font-medium rounded transition ${
                      viewMode === 'agent'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Agent View
                  </button>
                  <button
                    onClick={() => setViewMode('client')}
                    className={`px-3 py-1 text-sm font-medium rounded transition ${
                      viewMode === 'client'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Client View
                  </button>
                </div>
              )}
              
              <button className="text-gray-500 hover:text-gray-700">
                <span className="text-xl">🔔</span>
              </button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-4">
            <div className="mb-8">
              <p className="text-sm font-medium text-gray-500">
                {viewMode === 'agent' ? 'Welcome back,' : 'Welcome,'}
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {currentUser.name || (viewMode === 'agent' ? 'Agent' : 'Client')}
              </p>
              {viewMode === 'client' && isAgent && (
                <p className="text-xs text-orange-600 mt-1">Preview Mode Active</p>
              )}
              {viewMode === 'client' && !isAgent && (
                <p className="text-xs text-gray-500 mt-1">Your agent: Sarah Johnson</p>
              )}
            </div>
            
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                        isActive
                          ? viewMode === 'agent'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-green-50 text-green-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>

            {/* Contact Agent Card (Client View Only) */}
            {viewMode === 'client' && (
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-2">Need Help?</p>
                <p className="text-xs text-blue-700 mb-3">
                  {isAgent ? 'Preview of client contact card' : 'Your agent is here to help'}
                </p>
                <button className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 transition">
                  Contact Agent
                </button>
              </div>
            )}

            {/* Agent Helper (Preview Mode Only) */}
            {isAgent && viewMode === 'client' && (
              <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                <p className="text-sm font-semibold text-orange-900 mb-2">Agent Tools</p>
                <p className="text-xs text-orange-700">
                  You're viewing the client experience. Use this to guide clients through their portal.
                </p>
              </div>
            )}
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Pass view mode to children via context or props */}
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
'use client'

import { useUser, SignInButton } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useEffect, useState } from 'react'

export default function ConvexDebugPage() {
  const { user, isLoaded: clerkLoaded, isSignedIn } = useUser()
  const currentUser = useQuery(api.users.getCurrentUser)
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser)
  const setUserRole = useMutation(api.users.setUserRole)
  const [selectedRole, setSelectedRole] = useState<'agent' | 'client'>('agent')

  // Sync Clerk user with Convex database
  useEffect(() => {
    if (isSignedIn && clerkLoaded) {
      createOrUpdateUser()
        .then(() => console.log('User synced with Convex'))
        .catch(console.error)
    }
  }, [isSignedIn, clerkLoaded, createOrUpdateUser])

  // Update selected role when user data loads
  useEffect(() => {
    if (currentUser?.role) {
      setSelectedRole(currentUser.role)
    }
  }, [currentUser])

  const handleRoleChange = async (role: 'agent' | 'client') => {
    try {
      await setUserRole({ role })
      setSelectedRole(role)
      console.log(`Role changed to ${role}`)
    } catch (error) {
      console.error('Failed to change role:', error)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-white">
      <div className="z-10 w-full max-w-5xl font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-900">
          Clerk + Convex Integration Test
        </h1>
        
        {!isSignedIn && (
          <div className="text-center">
            <p className="mb-4 text-gray-700">Please sign in to test the integration</p>
            <SignInButton mode="modal">
              <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Sign In
              </button>
            </SignInButton>
          </div>
        )}
        
        {isSignedIn && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-300 text-green-900 px-4 py-3 rounded">
              <h2 className="font-bold mb-2">✅ Clerk Authentication Status</h2>
              <p>Signed in as: {user?.primaryEmailAddress?.emailAddress}</p>
              <p>Clerk User ID: {user?.id}</p>
            </div>
            
            <div className={`border px-4 py-3 rounded ${
              currentUser 
                ? 'bg-blue-50 border-blue-300 text-blue-900' 
                : 'bg-yellow-50 border-yellow-300 text-yellow-900'
            }`}>
              <h2 className="font-bold mb-2">
                {currentUser ? '✅ Convex Database Status' : '⏳ Syncing with Convex...'}
              </h2>
              {currentUser ? (
                <>
                  <p>Database ID: {currentUser._id}</p>
                  <p>Clerk ID in DB: {currentUser.clerkId}</p>
                  <p>Email in DB: {currentUser.email || 'Not set'}</p>
                  <p>Name in DB: {currentUser.name || 'Not set'}</p>
                </>
              ) : (
                <p>Creating user record in Convex database...</p>
              )}
            </div>
            
            <div className="bg-gray-50 border border-gray-300 text-gray-900 px-4 py-3 rounded">
              <h2 className="font-bold mb-2">Integration Summary</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Clerk authentication: ✅ Working</li>
                <li>Convex connection: {currentUser ? '✅ Working' : '⏳ Connecting...'}</li>
                <li>User sync: {currentUser ? '✅ Synced' : '⏳ Syncing...'}</li>
                <li>Auth token passing: {currentUser ? '✅ Verified' : '⏳ Verifying...'}</li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-300 px-4 py-3 rounded">
              <h2 className="font-bold mb-2">🧪 Development Tools</h2>
              <div className="mb-4">
                <p className="text-sm text-yellow-900 mb-3">Change your user role for testing:</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleRoleChange('agent')}
                    className={`px-4 py-2 rounded font-medium transition ${
                      selectedRole === 'agent'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Agent Role
                  </button>
                  <button
                    onClick={() => handleRoleChange('client')}
                    className={`px-4 py-2 rounded font-medium transition ${
                      selectedRole === 'client'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Client Role
                  </button>
                </div>
                <p className="text-xs text-yellow-700 mt-3">
                  Current role: <span className="font-bold">{currentUser?.role || 'Not set'}</span>
                </p>
              </div>
              <div className="border-t border-yellow-200 pt-3">
                <p className="text-sm font-semibold text-yellow-900 mb-2">Quick Links:</p>
                <div className="flex gap-3">
                  <a
                    href="/dashboard"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Go to Dashboard →
                  </a>
                  <a
                    href="/dashboard?view=client"
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    Preview Client View →
                  </a>
                </div>
              </div>
              <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
                <p className="text-xs text-amber-700 font-medium">
                  🔧 Development Tools - Not available in production
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
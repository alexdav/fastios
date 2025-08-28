'use client'

import { useUser, SignInButton } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useEffect, useState } from 'react'

export default function ConvexDebugPage() {
  const { user, isLoaded: clerkLoaded, isSignedIn } = useUser()
  const currentUser = useQuery(api.users.getCurrentUser)
  const userRole = useQuery(api.users.getUserRole)
  const currentAgent = useQuery(api.agents.getCurrentAgent)
  const currentClient = useQuery(api.clients.getCurrentClient)
  const firstAgent = useQuery(api.agents.getFirstAgent)
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser)
  const createAgent = useMutation(api.agents.createAgent)
  const createClient = useMutation(api.clients.createClient)
  const createDemoAgent = useMutation(api.agents.createDemoAgent)
  const deleteAgent = useMutation(api.agents.deleteAgent)
  const deleteClient = useMutation(api.clients.deleteClient)
  const [creatingProfile, setCreatingProfile] = useState<'agent' | 'client' | null>(null)
  const [deletingProfile, setDeletingProfile] = useState<'agent' | 'client' | null>(null)

  // Sync Clerk user with Convex database
  useEffect(() => {
    if (isSignedIn && clerkLoaded) {
      createOrUpdateUser()
        .then(() => console.log('User synced with Convex'))
        .catch(console.error)
    }
  }, [isSignedIn, clerkLoaded, createOrUpdateUser])

  const handleCreateAgentProfile = async () => {
    try {
      setCreatingProfile('agent')
      // For demo, we need to find an agent to assign the client to
      // In production, this would be handled differently
      const allAgents = await createAgent({
        phone: '555-0100',
        company: 'Demo Realty',
        licenseNumber: 'DRE-12345'
      })
      console.log('Agent profile created')
      setCreatingProfile(null)
    } catch (error) {
      console.error('Failed to create agent profile:', error)
      setCreatingProfile(null)
    }
  }

  const handleCreateClientProfile = async () => {
    try {
      setCreatingProfile('client')
      
      // Always use or create a demo agent for testing
      // (you wouldn't be a client of yourself)
      let agentId: string
      
      // Check if there's any existing demo agent or other agent in the system
      if (firstAgent) {
        agentId = firstAgent._id
        console.log('Using existing agent for client testing')
      } else {
        // Create a demo agent
        console.log('Creating demo agent for client testing...')
        agentId = await createDemoAgent()
        console.log('Demo agent created with ID:', agentId)
      }
      
      await createClient({
        agentId: agentId,
        phone: '555-0200'
      })
      console.log('Client profile created')
      setCreatingProfile(null)
    } catch (error) {
      console.error('Failed to create client profile:', error)
      setCreatingProfile(null)
    }
  }

  const handleDeleteAgentProfile = async () => {
    try {
      setDeletingProfile('agent')
      await deleteAgent()
      console.log('Agent profile deleted')
      setDeletingProfile(null)
    } catch (error) {
      console.error('Failed to delete agent profile:', error)
      setDeletingProfile(null)
    }
  }

  const handleDeleteClientProfile = async () => {
    try {
      setDeletingProfile('client')
      await deleteClient()
      console.log('Client profile deleted')
      setDeletingProfile(null)
    } catch (error) {
      console.error('Failed to delete client profile:', error)
      setDeletingProfile(null)
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
            
            <div className="bg-purple-50 border border-purple-300 px-4 py-3 rounded">
              <h2 className="font-bold mb-2">👤 Profile Status</h2>
              <div className="flex gap-4 text-sm">
                <span className={currentUser ? 'text-green-600' : 'text-gray-400'}>
                  {currentUser ? '✓' : '○'} User
                </span>
                <span className={currentAgent ? 'text-green-600' : 'text-gray-400'}>
                  {currentAgent ? '✓' : '○'} Agent
                </span>
                <span className={currentClient ? 'text-green-600' : 'text-gray-400'}>
                  {currentClient ? '✓' : '○'} Client
                </span>
              </div>
              {userRole && (
                <p className="text-sm text-purple-700 mt-2">
                  Current role: <span className="font-bold">{userRole}</span>
                </p>
              )}
            </div>
            
            <div className="bg-yellow-50 border border-yellow-300 px-4 py-3 rounded">
              <h2 className="font-bold mb-2">🧪 Development Tools</h2>
              <div className="mb-4">
                <p className="text-sm text-yellow-900 mb-3">Create test profiles:</p>
                <div className="flex gap-4">
                  <button
                    onClick={handleCreateAgentProfile}
                    disabled={!!currentAgent || creatingProfile !== null || deletingProfile !== null}
                    className={`px-4 py-2 rounded font-medium transition ${
                      currentAgent
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : creatingProfile === 'agent'
                        ? 'bg-blue-400 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {currentAgent ? 'Agent Profile Exists' : creatingProfile === 'agent' ? 'Creating...' : 'Create Agent Profile'}
                  </button>
                  <button
                    onClick={handleCreateClientProfile}
                    disabled={!!currentClient || creatingProfile !== null || deletingProfile !== null}
                    className={`px-4 py-2 rounded font-medium transition ${
                      currentClient
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : creatingProfile === 'client'
                        ? 'bg-green-400 text-white'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {currentClient ? 'Client Profile Exists' : creatingProfile === 'client' ? 'Creating...' : 'Create Client Profile'}
                  </button>
                </div>
                {(currentAgent || currentClient) && (
                  <div className="mt-4 flex gap-4">
                    {currentAgent && (
                      <button
                        onClick={handleDeleteAgentProfile}
                        disabled={deletingProfile !== null || creatingProfile !== null}
                        className={`px-4 py-2 rounded font-medium transition ${
                          deletingProfile === 'agent'
                            ? 'bg-red-400 text-white'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {deletingProfile === 'agent' ? 'Deleting...' : 'Delete Agent Profile'}
                      </button>
                    )}
                    {currentClient && (
                      <button
                        onClick={handleDeleteClientProfile}
                        disabled={deletingProfile !== null || creatingProfile !== null}
                        className={`px-4 py-2 rounded font-medium transition ${
                          deletingProfile === 'client'
                            ? 'bg-red-400 text-white'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {deletingProfile === 'client' ? 'Deleting...' : 'Delete Client Profile'}
                      </button>
                    )}
                  </div>
                )}
                {!currentAgent && !currentClient && (
                  <p className="text-xs text-yellow-700 mt-3">
                    Create test profiles to explore different user roles and features
                  </p>
                )}
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
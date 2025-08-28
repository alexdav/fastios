'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import AgentDashboard from './_components/AgentDashboard'
import ClientDashboard from './_components/ClientDashboard'

export default function DashboardPage() {
  const currentUser = useQuery(api.users.getCurrentUser)
  const userRole = useQuery(api.users.getUserRole)
  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<'agent' | 'client' | null>(null)

  // Check for view query parameter (for agents switching views)
  const viewParam = searchParams.get('view') as 'agent' | 'client' | null

  useEffect(() => {
    // Debug logging
    console.log('Dashboard state:', {
      currentUser,
      userRole,
      viewMode,
      viewParam
    })
  }, [currentUser, userRole, viewMode, viewParam])

  useEffect(() => {
    if (userRole !== undefined && userRole !== null) {
      // If user is an agent and has a view param, use that
      if (userRole === 'agent' && viewParam) {
        setViewMode(viewParam)
      } else {
        // Otherwise use their actual role
        setViewMode(userRole as 'agent' | 'client')
      }
    }
  }, [userRole, viewParam])

  // Show debug info
  if (!currentUser || userRole === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
          <p className="mt-2 text-xs text-slate-500">
            User: {currentUser ? 'loaded' : 'loading'} | Role: {userRole === undefined ? 'loading' : userRole}
          </p>
        </div>
      </div>
    )
  }

  // If user has no role, show setup message
  if (userRole === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Welcome to FastiOS!</h2>
          <p className="text-slate-600 mb-6">You need to set up your profile to continue.</p>
          <a 
            href="/convex" 
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Set Up Profile
          </a>
        </div>
      </div>
    )
  }

  if (!viewMode) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const isAgent = userRole === 'agent'
  const isPreviewMode = isAgent && viewMode === 'client'

  // Render appropriate dashboard based on view mode
  if (viewMode === 'agent') {
    return <AgentDashboard />
  } else {
    return <ClientDashboard isPreview={isPreviewMode} />
  }
}
'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import AgentDashboard from './_components/AgentDashboard'
import ClientDashboard from './_components/ClientDashboard'

export default function DashboardPage() {
  const currentUser = useQuery(api.users.getCurrentUser)
  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<'agent' | 'client' | null>(null)

  // Check for view query parameter (for agents switching views)
  const viewParam = searchParams.get('view') as 'agent' | 'client' | null

  useEffect(() => {
    if (currentUser) {
      // If user is an agent and has a view param, use that
      if (currentUser.role === 'agent' && viewParam) {
        setViewMode(viewParam)
      } else {
        // Otherwise use their actual role
        setViewMode(currentUser.role as 'agent' | 'client')
      }
    }
  }, [currentUser, viewParam])

  if (!currentUser || !viewMode) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const isAgent = currentUser.role === 'agent'
  const isPreviewMode = isAgent && viewMode === 'client'

  // Render appropriate dashboard based on view mode
  if (viewMode === 'agent') {
    return <AgentDashboard />
  } else {
    return <ClientDashboard isPreview={isPreviewMode} />
  }
}
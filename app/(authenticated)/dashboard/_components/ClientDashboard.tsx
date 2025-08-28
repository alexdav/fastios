'use client'

import { useUser } from '@clerk/nextjs'

interface ClientDashboardProps {
  isPreview?: boolean
  agentName?: string
}

export default function ClientDashboard({ isPreview, agentName = 'Sarah Johnson' }: ClientDashboardProps) {
  const { user } = useUser()

  return (
    <div>
      {/* Preview Mode Banner for Agents */}
      {isPreview && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start">
            <span className="text-xl mr-3">👁️</span>
            <div>
              <p className="font-semibold text-orange-900">Client View Preview</p>
              <p className="text-sm text-orange-700 mt-1">
                This is what your client sees when they log in. You can guide them through any of these features.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Real Estate Journey</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {isPreview ? 'John Smith (Preview)' : user?.firstName || 'Client'}!
        </p>
      </div>

      {/* Current Deal Status */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-8 border border-green-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Current Transaction</h2>
          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
            In Progress
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Property</p>
            <p className="font-semibold text-gray-900">123 Main Street</p>
            <p className="text-sm text-gray-500">San Francisco, CA 94105</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Type</p>
            <p className="font-semibold text-gray-900">Buying</p>
            <p className="text-sm text-gray-500">Single Family Home</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Expected Closing</p>
            <p className="font-semibold text-gray-900">March 15, 2024</p>
            <p className="text-sm text-gray-500">28 days remaining</p>
          </div>
        </div>
        {isPreview && (
          <div className="mt-4 p-3 bg-orange-50 rounded border border-orange-200">
            <p className="text-xs text-orange-700">
              <span className="font-semibold">Agent Tip:</span> Clients can see their deal progress here. 
              Encourage them to check this regularly for updates.
            </p>
          </div>
        )}
      </div>

      {/* Progress Timeline */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Transaction Progress</h2>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          <div className="space-y-6">
            <div className="flex items-center">
              <div className="relative z-10 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <div className="ml-6">
                <p className="font-medium text-gray-900">Offer Accepted</p>
                <p className="text-sm text-gray-500">Completed on Feb 1, 2024</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="relative z-10 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <div className="ml-6">
                <p className="font-medium text-gray-900">Inspection Completed</p>
                <p className="text-sm text-gray-500">Completed on Feb 8, 2024</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="relative z-10 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">•</span>
              </div>
              <div className="ml-6">
                <p className="font-medium text-gray-900">Loan Processing</p>
                <p className="text-sm text-gray-500">In progress - 75% complete</p>
                {isPreview && (
                  <p className="text-xs text-orange-600 mt-1">
                    Agent: Remind client to submit remaining bank documents
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <div className="relative z-10 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">4</span>
              </div>
              <div className="ml-6">
                <p className="font-medium text-gray-400">Final Walkthrough</p>
                <p className="text-sm text-gray-400">Scheduled for Mar 14, 2024</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="relative z-10 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">5</span>
              </div>
              <div className="ml-6">
                <p className="font-medium text-gray-400">Closing</p>
                <p className="text-sm text-gray-400">Scheduled for Mar 15, 2024</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Recent Documents</h2>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">📄</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Purchase Agreement</p>
                    <p className="text-xs text-gray-500">Uploaded 2 days ago</p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-700">
                  <span className="text-sm">View</span>
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">📋</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Inspection Report</p>
                    <p className="text-xs text-gray-500">Uploaded 1 week ago</p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-700">
                  <span className="text-sm">View</span>
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">🏦</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Loan Pre-Approval</p>
                    <p className="text-xs text-gray-500">Uploaded 2 weeks ago</p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-700">
                  <span className="text-sm">View</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Action Required</h2>
            {isPreview && (
              <p className="text-xs text-orange-600 mt-1">
                These are tasks the client needs to complete
              </p>
            )}
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input type="checkbox" className="mt-1 rounded border-gray-300" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Upload proof of insurance</p>
                  <p className="text-xs text-gray-500">Due by Feb 20, 2024</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <input type="checkbox" className="mt-1 rounded border-gray-300" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Review and sign disclosure documents</p>
                  <p className="text-xs text-gray-500">Due by Feb 22, 2024</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <input type="checkbox" className="mt-1 rounded border-gray-300" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Schedule final walkthrough</p>
                  <p className="text-xs text-gray-500">Due by Mar 1, 2024</p>
                </div>
              </div>
            </div>
            <button className="w-full mt-6 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition">
              Upload Documents
            </button>
            {isPreview && (
              <p className="text-xs text-orange-600 mt-2 text-center">
                Guide client to click here to upload required documents
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
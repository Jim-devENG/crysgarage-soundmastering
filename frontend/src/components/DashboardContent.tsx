'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import AudioUploader from './AudioUploader'
import AudioList from './AudioList'

export default function DashboardContent() {
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 gap-8">
          {/* Audio Upload Section */}
          <div className="bg-gray-800/60 rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">Process Audio</h2>
            <AudioUploader />
          </div>

          {/* Audio Files Section */}
          <div className="bg-gray-800/60 rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">Your Audio Files</h2>
            <AudioList />
          </div>

          {/* Stats Card */}
          <div className="bg-gray-800/60 rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-xl font-semibold text-white mb-2">Welcome back!</h2>
            <p className="text-gray-400">You're logged in as {session?.user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  )
} 
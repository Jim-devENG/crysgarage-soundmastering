'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { audioApi } from '@/lib/api'
import CustomMasteringDashboard from '@/components/CustomMasteringDashboard'

interface AudioFile {
  id: string
  original_filename: string
  status: string
  file_size: number
  created_at: string
  mastered_path?: string
  original_path?: string
  metadata?: any
}

export default function CustomMasteringPage() {
  const params = useParams()
  const audioFileId = params.id as string
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAudioFile = async () => {
      try {
        setLoading(true)
        const response = await audioApi.getAudioFile(audioFileId)
        setAudioFile(response.data || response)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load audio file')
      } finally {
        setLoading(false)
      }
    }

    if (audioFileId) {
      loadAudioFile()
    }
  }, [audioFileId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-red-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto mb-4"></div>
          <p className="text-white">Loading mastering dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !audioFile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-red-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          <p className="text-gray-400 mb-4">{error || 'Audio file not found'}</p>
          <a href="/ai-mastering" className="text-red-400 hover:text-red-300">
            Back to Sound Mastering
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-red-900 p-6">
      <CustomMasteringDashboard audioFile={audioFile} />
    </div>
  )
} 
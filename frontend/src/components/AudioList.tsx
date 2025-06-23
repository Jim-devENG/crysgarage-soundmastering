'use client'

import { useEffect, useState } from 'react'
import { audioApi } from '@/lib/api'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface AudioFile {
  id: string
  name: string
  status: string
  created_at: string
  duration?: number
  size?: number
}

interface Pagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export default function AudioList() {
  const [files, setFiles] = useState<AudioFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadFiles(currentPage)
  }, [currentPage])

  const loadFiles = async (page: number) => {
    try {
      setLoading(true)
      const response = await audioApi.getAudioFiles(page)
      setFiles(response.data)
      setPagination(response.pagination)
    } catch (err) {
      setError('Failed to load audio files')
    } finally {
      setLoading(false)
    }
  }

  const handlePrev = () => {
    if (pagination && pagination.current_page > 1) {
      setCurrentPage(pagination.current_page - 1)
    }
  }

  const handleNext = () => {
    if (pagination && pagination.current_page < pagination.last_page) {
      setCurrentPage(pagination.current_page + 1)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-700/50 rounded-lg"></div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
        {error}
      </div>
    )
  }

  if (!Array.isArray(files) || files.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No audio files uploaded yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {files.map((file) => (
        <div
          key={file.id}
          className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/50 hover:border-purple-500/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">{file.name}</h3>
              <p className="text-sm text-gray-400">
                {new Date(file.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span
                className={`px-2 py-1 rounded text-sm ${
                  file.status === 'completed'
                    ? 'bg-green-500/10 text-green-400'
                    : file.status === 'processing'
                    ? 'bg-yellow-500/10 text-yellow-400'
                    : 'bg-gray-500/10 text-gray-400'
                }`}
              >
                {file.status}
              </span>
              <button
                onClick={() => window.location.href = `/audio/${file.id}`}
                className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                View
              </button>
            </div>
          </div>
        </div>
      ))}
      {/* Pagination Controls */}
      {pagination && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={handlePrev}
            disabled={pagination.current_page === 1}
            className="p-2 rounded-full bg-gray-700 text-white disabled:opacity-50"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-300">
            Page {pagination.current_page} of {pagination.last_page}
          </span>
          <button
            onClick={handleNext}
            disabled={pagination.current_page === pagination.last_page}
            className="p-2 rounded-full bg-gray-700 text-white disabled:opacity-50"
            aria-label="Next Page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
} 
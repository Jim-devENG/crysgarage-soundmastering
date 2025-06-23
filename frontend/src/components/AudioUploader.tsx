'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { audioApi } from '@/lib/api'

export default function AudioUploader() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    try {
      setUploading(true)
      setError(null)
      setProgress(0)

      // Upload file
      const response = await audioApi.uploadAudio(file)
      const audioFileId = response.data?.id || response.id
      setJobId(audioFileId)

      // Poll for status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await audioApi.getProcessingStatus(audioFileId)
          const status = statusResponse.data
          setProgress(status.progress || 0)

          if (status.status === 'completed') {
            clearInterval(pollInterval)
            setUploading(false)
            // Handle completion - maybe redirect to results page
          } else if (status.status === 'failed') {
            clearInterval(pollInterval)
            setError(status.error_message || 'Processing failed')
            setUploading(false)
          }
        } catch (err) {
          clearInterval(pollInterval)
          setError('Error checking status')
          setUploading(false)
        }
      }, 2000)
    } catch (err) {
      setError('Upload failed')
      setUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a']
    },
    maxFiles: 1
  })

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-purple-500 bg-purple-500/10' : 'border-gray-600 hover:border-purple-500'}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="space-y-4">
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-gray-300">Processing: {progress}%</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-6xl mb-4">🎵</div>
            <p className="text-xl text-gray-300">
              {isDragActive
                ? 'Drop your audio file here'
                : 'Drag and drop your audio file here, or click to select'}
            </p>
            <p className="text-sm text-gray-400">
              Supports MP3, WAV, OGG, and M4A files
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {jobId && !uploading && !error && (
        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
          Processing complete! Job ID: {jobId}
        </div>
      )}
    </div>
  )
} 
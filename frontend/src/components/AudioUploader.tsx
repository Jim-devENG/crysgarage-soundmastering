'use client'

import { useState, useCallback } from 'react'
// import { useDropzone } from 'react-dropzone'
// import { audioApi } from '@/lib/api'

interface AudioUploaderProps {
  wavOnly?: boolean
  onUploadComplete?: (audioFile: any) => void
  onError?: (error: string) => void
}

export default function AudioUploader({ wavOnly = false, onUploadComplete, onError }: AudioUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      setError(null)
      setProgress(0)
      console.log('Starting upload for file:', file.name, 'Size:', file.size)

      // Simulate upload for now
      setTimeout(() => {
        setUploading(false)
        setProgress(100)
        if (onUploadComplete) {
          onUploadComplete({
            id: 'temp-id',
            original_name: file.name,
            status: 'completed'
          })
        }
      }, 2000)

    } catch (err: any) {
      console.error('Upload error:', err)
      const errorMsg = err.message || 'Upload failed'
      setError(errorMsg)
      if (onError) onError(errorMsg)
      setUploading(false)
    }
  }, [onUploadComplete, onError])

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-purple-500">
        <input 
          type="file" 
          accept="audio/*" 
          onChange={handleFileSelect}
          className="hidden"
          id="file-input"
        />
        <label htmlFor="file-input" className="cursor-pointer">
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
                Click to select audio file
              </p>
              <p className="text-sm text-gray-400">
                {wavOnly 
                  ? 'Only WAV files are supported for lite automatic mastering'
                  : 'Supports MP3, WAV, OGG, and M4A files'
                }
              </p>
              {wavOnly && (
                <p className="text-xs text-yellow-400">
                  💡 Tip: Convert your audio to WAV format for faster processing without conversion
                </p>
              )}
            </div>
          )}
        </label>
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
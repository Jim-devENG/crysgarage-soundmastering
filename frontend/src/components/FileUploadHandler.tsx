'use client'

import { useState, useCallback } from 'react'
import { audioApi } from '@/lib/api'

interface FileUploadHandlerProps {
  onUploadComplete?: (audioFile: any) => void
  onError?: (error: string) => void
}

export default function FileUploadHandler({ onUploadComplete, onError }: FileUploadHandlerProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = useCallback(async (fileInput: File | any) => {
    try {
      setUploading(true)
      setError(null)

      console.log('File input received:', fileInput)

      // Handle file path objects
      if (fileInput && typeof fileInput === 'object' && fileInput.path && !(fileInput instanceof File)) {
        console.log('Detected file path object:', fileInput)
        
        // For web applications, we need to use a file input to read the actual file
        // This is a workaround for when file pickers return path objects
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'audio/*'
        
        input.onchange = async (e) => {
          const target = e.target as HTMLInputElement
          const file = target.files?.[0]
          
          if (file) {
            try {
              const response = await audioApi.uploadAudio(file)
              console.log('Upload successful:', response)
              if (onUploadComplete) {
                onUploadComplete(response)
              }
            } catch (err: any) {
              const errorMsg = err.message || 'Upload failed'
              console.error('Upload error:', errorMsg)
              setError(errorMsg)
              if (onError) onError(errorMsg)
            } finally {
              setUploading(false)
            }
          }
        }
        
        input.click()
        return
      }

      // Handle regular File objects
      if (fileInput instanceof File) {
        const response = await audioApi.uploadAudio(fileInput)
        console.log('Upload successful:', response)
        if (onUploadComplete) {
          onUploadComplete(response)
        }
      } else {
        throw new Error('Invalid file input provided')
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Upload failed'
      console.error('Upload error:', errorMsg)
      setError(errorMsg)
      if (onError) onError(errorMsg)
    } finally {
      setUploading(false)
    }
  }, [onUploadComplete, onError])

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold mb-4">File Upload Handler</h3>
      
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            handleFileUpload(file)
          }
        }}
        className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
      />

      {uploading && (
        <div className="mt-4 p-2 bg-blue-500/10 border border-blue-500/20 rounded">
          Uploading...
        </div>
      )}

      {error && (
        <div className="mt-4 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400">
          {error}
        </div>
      )}
    </div>
  )
} 
'use client'

import { useState } from 'react'
import { audioApi } from '@/lib/api'

export default function TestUpload() {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<string>('')
  const [error, setError] = useState<string>('')

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('TestUpload: File selected:', file)
    console.log('TestUpload: File type:', typeof file)
    console.log('TestUpload: File instanceof File:', file instanceof File)
    console.log('TestUpload: File name:', file.name)
    console.log('TestUpload: File size:', file.size)

    setUploading(true)
    setError('')
    setResult('')

    try {
      console.log('Testing upload with file:', file.name, 'Size:', file.size)
      
      const response = await audioApi.uploadAudio(file)
      
      console.log('Upload response:', response)
      setResult(JSON.stringify(response, null, 2))
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upload Test</h1>
      
      <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-blue-400 text-sm">
          <strong>Note:</strong> This is using the public test upload route (no authentication required) for demonstration purposes.
          In production, you would use the authenticated upload route.
        </p>
      </div>
      
      <div className="mb-4">
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
        />
      </div>

      {uploading && (
        <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-blue-400">Uploading...</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400">Error: {error}</p>
        </div>
      )}

      {result && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <h3 className="text-green-400 font-semibold mb-2">Upload Result:</h3>
          <pre className="text-sm text-green-300 overflow-auto">{result}</pre>
        </div>
      )}
    </div>
  )
} 
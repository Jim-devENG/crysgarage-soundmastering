'use client'

import { useState } from 'react'
import { audioApi } from '@/lib/api'

export default function TestUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<string>('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      console.log('File selected:', selectedFile)
      console.log('File type:', selectedFile.type)
      console.log('File size:', selectedFile.size)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setResult('No file selected')
      return
    }

    setUploading(true)
    setResult('')

    try {
      console.log('Uploading file:', file)
      const response = await audioApi.uploadAudio(file)
      console.log('Upload response:', response)
      setResult(`Success: ${JSON.stringify(response, null, 2)}`)
    } catch (error: any) {
      console.error('Upload error:', error)
      setResult(`Error: ${error.message || 'Upload failed'}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-4 border rounded">
      <h2 className="text-lg font-bold mb-4">Test Upload</h2>
      
      <div className="mb-4">
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
        />
      </div>

      {file && (
        <div className="mb-4 p-2 bg-gray-800 rounded">
          <p><strong>Selected File:</strong></p>
          <p>Name: {file.name}</p>
          <p>Type: {file.type}</p>
          <p>Size: {file.size} bytes</p>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>

      {result && (
        <div className="mt-4 p-2 bg-gray-800 rounded">
          <pre className="text-sm">{result}</pre>
        </div>
      )}
    </div>
  )
} 
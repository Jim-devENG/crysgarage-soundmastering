'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Sparkles, 
  Music, 
  Play, 
  Upload, 
  Download, 
  Lock,
  AlertCircle,
  Info,
  Check
} from 'lucide-react'
import AudioUploader from '@/components/AudioUploader'

export default function FreeAutomaticStudio() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedFile, setProcessedFile] = useState<string | null>(null)

  const handleFileUpload = (file: File) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size must be under 5MB for free tier')
      return
    }
    setUploadedFile(file)
    setProcessedFile(null)
  }

  const handleMastering = async () => {
    if (!uploadedFile) return
    
    setIsProcessing(true)
    
    try {
      const formData = new FormData()
      formData.append('audio', uploadedFile)
      
      // Use free mastering backend for free tier
      const response = await fetch('/api/audio/upload/free', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      if (response.ok) {
        const result = await response.json()
        setProcessedFile('/api/placeholder-processed-audio')
        console.log('Free automatic mastering completed:', result)
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Free automatic mastering error:', error)
      alert('Mastering failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Music className="text-blue-400 w-8 h-8 mr-3" />
            <h1 className="text-4xl font-bold text-white">Free Automatic Studio</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Try our mastering service for free. Basic processing with MP3 export.
          </p>
          <Badge className="mt-4 bg-blue-600 text-white">
            <Lock className="w-4 h-4 mr-2" />
            Free Tier - Limited Features
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Upload Your Track
              </CardTitle>
              <CardDescription className="text-gray-400">
                Upload your audio file (max 5MB) for free mastering
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AudioUploader onFileUpload={handleFileUpload} />
              {uploadedFile && (
                <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
                  <p className="text-white font-medium">{uploadedFile.name}</p>
                  <p className="text-gray-400 text-sm">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <div className="mt-2">
                    <Badge className="bg-green-500 text-white">
                      <Check className="w-3 h-3 mr-1" />
                      File size OK
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Processing Section */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Sparkles className="w-5 h-5 mr-2" />
                Free Automatic Processing
              </CardTitle>
              <CardDescription className="text-gray-400">
                Basic mastering with standard settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-white font-semibold">What's Included:</h4>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-400" />
                    Basic mastering processing
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-400" />
                    MP3 download format
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-400" />
                    Standard quality output
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-400" />
                    24-hour processing time
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-white font-semibold">Limitations:</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li className="flex items-center">
                    <Lock className="w-4 h-4 mr-2 text-red-400" />
                    No custom settings
                  </li>
                  <li className="flex items-center">
                    <Lock className="w-4 h-4 mr-2 text-red-400" />
                    No WAV/FLAC export
                  </li>
                  <li className="flex items-center">
                    <Lock className="w-4 h-4 mr-2 text-red-400" />
                    No batch processing
                  </li>
                </ul>
              </div>

              <Button 
                onClick={handleMastering}
                disabled={!uploadedFile || isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start Free Mastering
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Processing Status */}
        {isProcessing && (
          <Card className="mt-8 bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-white font-semibold mb-4">Processing Your Track</h3>
                <Progress value={65} className="mb-4" />
                <p className="text-gray-400 text-sm">
                  This may take up to 24 hours for free tier processing
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {processedFile && (
          <Card className="mt-8 bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Download className="w-5 h-5 mr-2" />
                Your Mastered Track
              </CardTitle>
              <CardDescription className="text-gray-400">
                Download your free mastered track
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Music className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      {uploadedFile?.name.replace(/\.[^/.]+$/, '')}_mastered.mp3
                    </h3>
                    <p className="text-gray-400 text-sm">Free tier mastered version</p>
                  </div>
                </div>
                <Badge className="bg-blue-500 text-white">
                  <Download className="w-3 h-3 mr-1" />
                  MP3
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Download className="w-4 h-4 mr-2" />
                  Download MP3
                </Button>
                <Button variant="outline" className="border-gray-600 text-gray-300">
                  <Play className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upgrade Section */}
        <Card className="mt-8 bg-gradient-to-r from-green-600 to-green-700 border-green-500">
          <CardContent className="p-6 text-center">
            <h3 className="text-white text-xl font-semibold mb-2">
              Ready for More Control?
            </h3>
            <p className="text-green-100 mb-4">
              Upgrade to Automatic or Advanced for custom settings, faster processing, and more formats.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button className="bg-white text-green-600 hover:bg-gray-100">
                <Sparkles className="w-4 h-4 mr-2" />
                Try Automatic
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
                <Lock className="w-4 h-4 mr-2" />
                View All Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
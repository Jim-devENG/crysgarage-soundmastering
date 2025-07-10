'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Sparkles, 
  Music, 
  Play, 
  Upload, 
  Download, 
  Settings,
  Headphones,
  Zap,
  Check,
  Star,
  Lock
} from 'lucide-react'
import AudioUploader from '@/components/AudioUploader'

export default function AutomaticStudio() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedFile, setProcessedFile] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState('pop')

  const presets = [
    { id: 'pop', name: 'Pop', description: 'Bright, punchy sound with enhanced vocals', icon: '🎵' },
    { id: 'rock', name: 'Rock', description: 'Aggressive, powerful sound with heavy bass', icon: '🤘' },
    { id: 'jazz', name: 'Jazz', description: 'Warm, smooth sound with natural dynamics', icon: '🎷' },
    { id: 'electronic', name: 'Electronic', description: 'Clean, modern sound with tight bass', icon: '🎛️' },
    { id: 'afrobeats', name: 'Afrobeats', description: 'Optimized for Nigerian and African music', icon: '🌍' },
    { id: 'gospel', name: 'Gospel', description: 'Clear vocals with warm instrumentation', icon: '🙏' },
  ]

  const handleUploadComplete = (audioFile: any) => {
    // For now, we'll simulate having a file uploaded
    // In a real implementation, you might want to store the file reference differently
    setUploadedFile(new File([], audioFile.original_name || 'uploaded_file.wav'))
    setProcessedFile(null)
  }

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error)
    alert(`Upload failed: ${error}`)
  }

  const handleMastering = async () => {
    if (!uploadedFile) return
    
    setIsProcessing(true)
    
    try {
      const formData = new FormData()
      formData.append('audio', uploadedFile)
      formData.append('preset', selectedPreset)
      formData.append('tier', 'automatic')
      
      // Use automatic mastering backend
      const response = await fetch('/api/audio/upload/automatic', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      if (response.ok) {
        const result = await response.json()
        setProcessedFile('/api/placeholder-processed-audio')
        console.log('Automatic mastering completed:', result)
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Automatic mastering error:', error)
      alert('Mastering failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="text-green-400 w-8 h-8 mr-3" />
            <h1 className="text-4xl font-bold text-white">Automatic Studio</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Professional mastering with smart presets and custom controls.
          </p>
          <Badge className="mt-4 bg-green-600 text-white">
            <Star className="w-4 h-4 mr-2" />
            Popular Choice
          </Badge>
        </div>

        <div className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Upload Section */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Your Audio
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Upload your WAV, MP3, or FLAC file (max 50MB)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AudioUploader 
                  onUploadComplete={handleUploadComplete}
                  onError={handleUploadError}
                />
                {uploadedFile && (
                  <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
                    <p className="text-white font-medium">{uploadedFile.name}</p>
                    <p className="text-gray-400 text-sm">
                      File uploaded successfully
                    </p>
                    <div className="mt-2">
                      <Badge className="bg-green-500 text-white">
                        <Check className="w-3 h-3 mr-1" />
                        Ready for mastering
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Genre Selection Section */}
            <Card className={`bg-gray-800/50 border-gray-700 ${!uploadedFile ? 'opacity-50' : ''}`}>
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Music className="w-5 h-5 mr-2" />
                  Choose Genre
                  {!uploadedFile && (
                    <Lock className="w-4 h-4 ml-2 text-gray-400" />
                  )}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {uploadedFile 
                    ? "Select a genre preset for optimal mastering"
                    : "Upload a file first to select genre"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <label className="text-white text-sm font-medium">Genre Preset</label>
                  <div className="grid grid-cols-2 gap-2">
                    {presets.map((preset) => (
                      <div
                        key={preset.id}
                        className={`p-3 rounded-lg border transition-colors ${
                          !uploadedFile 
                            ? 'border-gray-600 bg-gray-700/30 cursor-not-allowed'
                            : selectedPreset === preset.id
                              ? 'border-green-500 bg-green-500/10 cursor-pointer'
                              : 'border-gray-600 hover:border-green-500/50 cursor-pointer'
                        }`}
                        onClick={() => uploadedFile && setSelectedPreset(preset.id)}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{preset.icon}</span>
                          <div>
                            <p className={`font-medium text-sm ${
                              !uploadedFile ? 'text-gray-500' : 'text-white'
                            }`}>
                              {preset.name}
                            </p>
                            <p className={`text-xs ${
                              !uploadedFile ? 'text-gray-600' : 'text-gray-400'
                            }`}>
                              {preset.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-white font-semibold">Processing Options</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">Enhance Clarity</span>
                      <Switch defaultChecked disabled={!uploadedFile} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">Reduce Noise</span>
                      <Switch defaultChecked disabled={!uploadedFile} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">Optimize for Streaming</span>
                      <Switch defaultChecked disabled={!uploadedFile} />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleMastering}
                  disabled={!uploadedFile || isProcessing}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Start Automatic Mastering
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          {processedFile && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Download className="w-5 h-5 mr-2" />
                  Mastered Audio
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Your professionally mastered track
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">
                        {uploadedFile?.name.replace(/\.[^/.]+$/, '')}_mastered
                      </h3>
                      <p className="text-gray-400 text-sm">Automatic tier mastered version</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-green-500 text-white">
                      <Download className="w-3 h-3 mr-1" />
                      WAV
                    </Badge>
                    <Badge className="bg-blue-500 text-white">
                      <Download className="w-3 h-3 mr-1" />
                      MP3
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Download className="w-4 h-4 mr-2" />
                    Download WAV
                  </Button>
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
        </div>
      </div>
    </div>
  )
} 
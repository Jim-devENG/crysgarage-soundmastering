'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Music, Settings, Download, Play, Pause, Upload } from 'lucide-react'
import AudioUploader from '@/components/AudioUploader'
import AudioPlayer from '@/components/AudioPlayer'

export default function MasteringPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [processedFile, setProcessedFile] = useState<string | null>(null)

  const masteringPresets = [
    { name: 'Pop', description: 'Bright, punchy sound with enhanced vocals', icon: '🎵' },
    { name: 'Rock', description: 'Aggressive, powerful sound with heavy bass', icon: '🤘' },
    { name: 'Jazz', description: 'Warm, smooth sound with natural dynamics', icon: '🎷' },
    { name: 'Electronic', description: 'Clean, modern sound with tight bass', icon: '🎛️' },
    { name: 'Classical', description: 'Natural, spacious sound with clarity', icon: '🎻' },
    { name: 'Hip Hop', description: 'Bass-heavy with crisp highs', icon: '🎤' },
  ]

  const handleFileUpload = (file: File) => {
    setUploadedFile(file)
    setProcessedFile(null)
  }

  const handleMastering = async () => {
    if (!uploadedFile) return
    
    setIsProcessing(true)
    // Simulate processing time
    setTimeout(() => {
      setIsProcessing(false)
      setProcessedFile('/api/placeholder-processed-audio')
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="text-red-400 w-8 h-8 mr-3" />
            <h1 className="text-4xl font-bold text-white">AI Mastering Studio</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Professional-grade AI mastering with advanced algorithms and customizable presets
          </p>
        </div>

        <Tabs defaultValue="upload" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="upload" className="data-[state=active]:bg-red-600">
              <Upload className="w-4 h-4 mr-2" />
              Upload & Process
            </TabsTrigger>
            <TabsTrigger value="presets" className="data-[state=active]:bg-red-600">
              <Music className="w-4 h-4 mr-2" />
              Mastering Presets
            </TabsTrigger>
            <TabsTrigger value="advanced" className="data-[state=active]:bg-red-600">
              <Settings className="w-4 h-4 mr-2" />
              Advanced Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Your Audio
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Upload your WAV, MP3, or FLAC file for AI mastering
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
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Mastering Options
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Choose your mastering approach
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-white text-sm font-medium">Target Loudness</label>
                    <Slider defaultValue={[14]} max={20} min={8} step={0.1} />
                    <p className="text-gray-400 text-xs">-14 LUFS (Industry Standard)</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-white text-sm font-medium">Stereo Width</label>
                    <Slider defaultValue={[50]} max={100} min={0} step={1} />
                    <p className="text-gray-400 text-xs">50% (Balanced)</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">Enhance Clarity</span>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">Reduce Noise</span>
                    <Switch />
                  </div>

                  <Button 
                    onClick={handleMastering}
                    disabled={!uploadedFile || isProcessing}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Start Mastering
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

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
                  <AudioPlayer audioUrl={processedFile} />
                  <div className="flex gap-2 mt-4">
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Download className="w-4 h-4 mr-2" />
                      Download WAV
                    </Button>
                    <Button variant="outline" className="border-gray-600 text-gray-300">
                      <Download className="w-4 h-4 mr-2" />
                      Download MP3
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="presets" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {masteringPresets.map((preset) => (
                <Card key={preset.name} className="bg-gray-800/50 border-gray-700 hover:border-red-500/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <span className="text-2xl mr-3">{preset.icon}</span>
                      {preset.name}
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      {preset.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                        Optimized
                      </Badge>
                      <Badge variant="outline" className="border-red-500 text-red-400">
                        AI Enhanced
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Advanced Mastering Parameters</CardTitle>
                <CardDescription className="text-gray-400">
                  Fine-tune your mastering settings for professional results
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-white text-sm font-medium">Compression Ratio</label>
                      <Slider defaultValue={[2]} max={10} min={1} step={0.1} />
                    </div>
                    <div>
                      <label className="text-white text-sm font-medium">Attack Time</label>
                      <Slider defaultValue={[10]} max={50} min={1} step={1} />
                    </div>
                    <div>
                      <label className="text-white text-sm font-medium">Release Time</label>
                      <Slider defaultValue={[100]} max={500} min={10} step={10} />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-white text-sm font-medium">EQ Low Shelf</label>
                      <Slider defaultValue={[0]} max={10} min={-10} step={0.5} />
                    </div>
                    <div>
                      <label className="text-white text-sm font-medium">EQ High Shelf</label>
                      <Slider defaultValue={[0]} max={10} min={-10} step={0.5} />
                    </div>
                    <div>
                      <label className="text-white text-sm font-medium">Limiter Threshold</label>
                      <Slider defaultValue={[-1]} max={0} min={-10} step={0.1} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 
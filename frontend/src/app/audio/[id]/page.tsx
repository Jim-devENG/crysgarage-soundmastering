'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { audioApi } from '@/lib/api'
import AudioComparison from '@/components/AudioComparison'
import { MasteringSettings } from '@/components/MasteringOptions'
import AudioPreview, { AudioPreviewRef } from '@/components/AudioPreview'
import EQControls from '@/components/EQControls'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, RefreshCw, Settings, Play } from 'lucide-react'
import RealTimeMastering from '@/components/RealTimeMastering'

interface AudioFile {
  id: string
  original_filename: string
  status: string
  created_at: string
  original_url?: string
  mastered_url?: string
  mp3_url?: string
  original_path?: string
  mastered_path?: string
  metadata?: {
    processing_time?: number
    ai_processing_time?: number
    eq_processing_time?: number
    output_size?: number
    original_size?: number
    original_format?: string
    output_format?: string
    rms_level?: number
    peak_level?: number
    dynamic_range?: number
    analysis?: {
      rms_level?: number
      peak_level?: number
      dynamic_range?: number
    }
  }
}

export default function AudioDetailPage() {
  const params = useParams()
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioPreviewRef = useRef<AudioPreviewRef>(null)
  const [activeTab, setActiveTab] = useState('comparison')

  const defaultMasteringSettings = {
    genre_preset: 'pop',
    processing_quality: 'standard',
    target_loudness: -14,
    compression_ratio: 4,
    eq_settings: {
      bass: 0,
      low_mid: 0,
      mid: 0,
      high_mid: 0,
      treble: 0
    }
  }

  useEffect(() => {
    loadAudioFile()
  }, [params.id])

  const loadAudioFile = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Loading audio file with ID:', params.id)
      
      const response = await audioApi.getAudioFile(params.id as string)
      console.log('Audio file response:', response)
      
      setAudioFile(response.data)
    } catch (err: any) {
      console.error('Error loading audio file:', err)
      console.error('Error response:', err.response?.data)
      console.error('Error status:', err.response?.status)
      
      setError(err.response?.data?.message || err.message || 'Failed to load audio file')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyMastering = async (settings: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/audio/${params.id}/mastering`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mastering_settings: settings })
      })

      if (!response.ok) {
        throw new Error('Failed to apply mastering')
      }

      // Reload audio file to get updated metadata
      await loadAudioFile()
      setActiveTab('mastering')
    } catch (err: any) {
      console.error('Mastering error:', err)
      setError(err.message || 'Failed to apply mastering')
    } finally {
      setLoading(false)
    }
  }

  const handleSettingsChange = (settings: any) => {
    // This will be called when real-time settings change
    console.log('Settings changed:', settings)
  }

  const handleApplyEQ = async (eqSettings: any) => {
    try {
      setProcessing(true)
      setError(null)
      
      // Map the bands array to the expected backend format
      const backendEQSettings = {
        eq_settings: {
          enabled: true,
          bass: eqSettings.bands?.[0]?.gain || 0,
          low_mid: eqSettings.bands?.[1]?.gain || 0,
          mid: eqSettings.bands?.[2]?.gain || 0,
          high_mid: eqSettings.bands?.[3]?.gain || 0,
          treble: eqSettings.bands?.[4]?.gain || 0,
        }
      }
      
      console.log('Sending EQ settings to backend:', backendEQSettings)
      
      const response = await audioApi.applyEQ(params.id as string, backendEQSettings)
      setAudioFile(response.data)
      
      // Reload the audio file to get updated metadata
      await loadAudioFile()
    } catch (err: any) {
      console.error('EQ application error:', err)
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to apply EQ settings'
      setError(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePlayMastered = () => {
    console.log('Play Mastered button clicked')
    
    // Switch to the mastering tab where the Audio Preview is located
    const masteringTab = document.querySelector('[data-value="mastering"]') as HTMLElement
    if (masteringTab) {
      console.log('Switching to mastering tab')
      masteringTab.click()
    } else {
      console.error('Mastering tab not found')
    }
    
    // Trigger playback in the Audio Preview component
    setTimeout(() => {
      console.log('Attempting to play audio via ref')
      if (audioPreviewRef.current?.play) {
        audioPreviewRef.current.play()
      } else {
        console.error('Audio preview ref not available')
      }
    }, 200) // Increased timeout to ensure tab switch completes
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
      <div className="animate-pulse space-y-8">
        <div className="h-8 bg-gray-700/50 rounded-lg w-1/3"></div>
        <div className="h-40 bg-gray-700/50 rounded-lg"></div>
        <div className="h-64 bg-gray-700/50 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
        {error}
          </div>
        </div>
      </div>
    )
  }

  if (!audioFile) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
      <div className="text-center py-8">
        <p className="text-gray-400">Audio file not found</p>
          </div>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Pending</Badge>
      case 'processing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Processing</Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Completed</Badge>
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{audioFile.original_filename}</h1>
            <div className="flex items-center gap-4 text-gray-400">
              <span>ID: {audioFile.id}</span>
              <span>•</span>
              <span>{new Date(audioFile.created_at).toLocaleDateString()}</span>
              <span>•</span>
              {getStatusBadge(audioFile.status)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={loadAudioFile}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            {audioFile.mastered_url && (
              <>
                <Button
                  onClick={handlePlayMastered}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Play Mastered
                </Button>
                <Button
                  onClick={() => {
                    console.log('Testing audio URL:', audioFile.mastered_url)
                    if (audioFile.mastered_url) {
                      window.open(audioFile.mastered_url, '_blank')
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  Test URL
                </Button>
                <Button
                  onClick={() => handleDownload(audioFile.mastered_url!, `${audioFile.original_filename}_mastered.wav`)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Mastered
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Processing Status */}
        {audioFile.status === 'pending' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                <div>
                  <h3 className="font-semibold text-white">Processing your audio file...</h3>
                  <p className="text-gray-400">This may take a few minutes depending on the file size.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {audioFile.status === 'processing' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                <div>
                  <h3 className="font-semibold text-white">Sound mastering your audio file...</h3>
                  <p className="text-gray-400">Applying AI mastering and enhancements.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {audioFile.status === 'failed' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-red-500 rounded-full mr-3"></div>
        <div>
                  <h3 className="font-semibold text-red-400">Processing Failed</h3>
                  <p className="text-gray-400">There was an error processing your audio file.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {audioFile.status === 'completed' && (
          <Tabs defaultValue="comparison" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="comparison">Audio Comparison</TabsTrigger>
              <TabsTrigger value="mastering">Mastering Options</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="comparison" className="space-y-6">
              {audioFile.mastered_url && (
                <AudioComparison
                  originalUrl={audioFile.original_url || ''}
                  masteredUrl={audioFile.mastered_url || ''}
                  onComparisonChange={(isComparing) => {
                    console.log('Comparison mode:', isComparing)
                  }}
                />
              )}
            </TabsContent>

            <TabsContent value="mastering" className="space-y-6">
              {audioFile.mastered_url ? (
                <RealTimeMastering
            audioFileId={audioFile.id}
                  originalUrl={audioFile.original_url || ''}
                  masteredUrl={audioFile.mastered_url || ''}
                  onSettingsChange={handleSettingsChange}
                  onApplyMastering={handleApplyMastering}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No mastered version available. Apply mastering first.
                  </p>
                  <Button onClick={() => handleApplyMastering(defaultMasteringSettings)}>
                    Apply Default Mastering
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Processing Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Processing Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Processing Time:</span>
                      <span className="font-mono">
                        {audioFile.metadata?.processing_time ? 
                          `${audioFile.metadata.processing_time}s` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Processing Time:</span>
                      <span className="font-mono">
                        {audioFile.metadata?.ai_processing_time ? 
                          `${audioFile.metadata.ai_processing_time}s` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">EQ Processing Time:</span>
                      <span className="font-mono">
                        {audioFile.metadata?.eq_processing_time ? 
                          `${audioFile.metadata.eq_processing_time}s` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Original Format:</span>
                      <span className="font-mono uppercase">
                        {audioFile.metadata?.original_format || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Output Format:</span>
                      <span className="font-mono uppercase">
                        {audioFile.metadata?.output_format || 'WAV'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* File Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>File Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Original Size:</span>
                      <span className="font-mono">
                        {audioFile.metadata?.original_size ? 
                          `${(audioFile.metadata.original_size / 1024 / 1024).toFixed(1)} MB` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Output Size:</span>
                      <span className="font-mono">
                        {audioFile.metadata?.output_size ? 
                          `${(audioFile.metadata.output_size / 1024 / 1024).toFixed(1)} MB` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">RMS Level:</span>
                      <span className="font-mono">
                        {audioFile.metadata?.analysis?.rms_level || audioFile.metadata?.rms_level ? 
                          `${audioFile.metadata?.analysis?.rms_level || audioFile.metadata?.rms_level} dB` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Peak Level:</span>
                      <span className="font-mono">
                        {audioFile.metadata?.analysis?.peak_level || audioFile.metadata?.peak_level ? 
                          `${audioFile.metadata?.analysis?.peak_level || audioFile.metadata?.peak_level} dB` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Dynamic Range:</span>
                      <span className="font-mono">
                        {audioFile.metadata?.analysis?.dynamic_range || audioFile.metadata?.dynamic_range ? 
                          `${audioFile.metadata?.analysis?.dynamic_range || audioFile.metadata?.dynamic_range} dB` : 'N/A'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
        </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
} 
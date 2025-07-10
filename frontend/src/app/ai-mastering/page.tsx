'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  Music, 
  Settings, 
  Play, 
  Pause, 
  Download, 
  Sparkles,
  Volume2,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  Headphones,
  Activity,
  Mic,
  Guitar,
  Drum
} from 'lucide-react'
import { audioApi } from '@/lib/api'
import { getSession } from 'next-auth/react'
import MasteringReport from '@/components/MasteringReport'
import AudioUploader from '@/components/AudioUploader'
import AudioPlayer from '@/components/AudioPlayer'
import MasteringAnalysis from '@/components/MasteringAnalysis'
import AudioPlaybackPopup from '@/components/AudioPlaybackPopup'
import RealTimeMasteredPlayback from '@/components/RealTimeMasteredPlayback'
import type { AudioFile } from '@/types/audio'

const GENRE_OPTIONS = [
  { 
    value: 'pop', 
    label: 'Pop', 
    description: 'Bright, punchy, radio-ready',
    icon: Music,
    color: 'from-pink-500 to-purple-600'
  },
  { 
    value: 'rock', 
    label: 'Rock', 
    description: 'Powerful, dynamic, aggressive',
    icon: Guitar,
    color: 'from-red-500 to-orange-600'
  },
  { 
    value: 'electronic', 
    label: 'Electronic', 
    description: 'Deep bass, crisp highs',
    icon: Activity,
    color: 'from-blue-500 to-cyan-600'
  },
  { 
    value: 'jazz', 
    label: 'Jazz', 
    description: 'Warm, natural, dynamic',
    icon: Music,
    color: 'from-amber-500 to-yellow-600'
  },
  { 
    value: 'classical', 
    label: 'Classical', 
    description: 'Natural, spacious, detailed',
    icon: Mic,
    color: 'from-emerald-500 to-teal-600'
  },
  { 
    value: 'hiphop', 
    label: 'Hip Hop', 
    description: 'Heavy bass, clear vocals',
    icon: Drum,
    color: 'from-purple-500 to-indigo-600'
  },
  { 
    value: 'country', 
    label: 'Country', 
    description: 'Warm, organic, acoustic',
    icon: Music,
    color: 'from-green-500 to-emerald-600'
  },
  { 
    value: 'folk', 
    label: 'Folk', 
    description: 'Intimate, natural, acoustic',
    icon: Headphones,
    color: 'from-orange-500 to-red-600'
  },
]

export default function AIMasteringPage() {
  const router = useRouter()
  const [uploadedFile, setUploadedFile] = useState<AudioFile | null>(null)
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [masteringType, setMasteringType] = useState<'automatic' | 'advanced'>('automatic')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [selectedGenre, setSelectedGenre] = useState('pop')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [masteringAnalysis, setMasteringAnalysis] = useState<any>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [playbackPopup, setPlaybackPopup] = useState<{
    isVisible: boolean;
    masteringType: 'automatic' | 'advanced';
    masteredPath?: string;
  }>({
    isVisible: false,
    masteringType: 'automatic'
  })
  
  const audioRef = useRef<HTMLAudioElement>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    try {
      setUploading(true)
      setError(null)
      setProgress(0)

      // Upload file
      const response = await audioApi.uploadAudio(file)
      const audioFile = response.data || response
      setUploadedFile(audioFile)

      // Poll for status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await audioApi.getProcessingStatus(audioFile.id)
          const status = statusResponse.data || statusResponse
          setProgress(status.progress || 0)

          if (status.status === 'completed') {
            clearInterval(pollInterval)
            setUploading(false)
            setProcessing(false)
            // Update the file with completed status
            setUploadedFile(prev => prev ? { ...prev, status: 'completed', mastered_path: status.mastered_path } : null)
            
            // Fetch mastering analysis data
            try {
              const analysisResponse = await audioApi.getProcessingStatus(audioFile.id)
              const analysisData = analysisResponse.data || analysisResponse
              console.log('Analysis response:', analysisData)
              if (analysisData.mastering_changes) {
                console.log('Setting mastering analysis:', analysisData.mastering_changes)
                setMasteringAnalysis(analysisData.mastering_changes)
              } else {
                console.log('No mastering_changes found in response')
              }
            } catch (analysisError) {
              console.log('Could not fetch mastering analysis:', analysisError)
            }
          } else if (status.status === 'failed') {
            clearInterval(pollInterval)
            setError(status.error_message || 'Processing failed')
            setUploading(false)
            setProcessing(false)
          } else if (status.status === 'processing') {
            setProcessing(true)
          }
        } catch (err) {
          clearInterval(pollInterval)
          setError('Error checking status')
          setUploading(false)
          setProcessing(false)
        }
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed')
      setUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'audio/*': ['.mp3', '.wav', '.ogg', '.m4a', '.flac'] },
    maxFiles: 1
  })

  const handleAutomaticMaster = async () => {
    if (!uploadedFile) return
    
    try {
      setProcessing(true)
      setError(null)
      
      // Apply automatic mastering with genre-specific settings
      const automaticMasterSettings = {
        target_loudness: -8,
        target_loudness_enabled: true,
        genre_preset: selectedGenre,
        processing_quality: 'standard' as const,
        stereo_width: 20,
        stereo_width_enabled: true,
        bass_boost: 6,
        presence_boost: 6,
        boost_enabled: true,
        dynamic_range: 'compressed' as const,
        high_freq_enhancement: true,
        low_freq_enhancement: true,
        noise_reduction: false
      }

      await audioApi.applyAdvancedMastering(uploadedFile.id, automaticMasterSettings)
      
      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await audioApi.getProcessingStatus(uploadedFile.id)
          const status = statusResponse.data || statusResponse
          setProgress(status.progress || 0)

          if (status.status === 'completed') {
            clearInterval(pollInterval)
            setProcessing(false)
            setUploadedFile(prev => prev ? { ...prev, status: 'completed', mastered_path: status.mastered_path } : null)
            
            // Fetch mastering analysis data
            try {
              const analysisResponse = await audioApi.getProcessingStatus(uploadedFile.id)
              const analysisData = analysisResponse.data || analysisResponse
              console.log('Analysis response:', analysisData)
              if (analysisData.mastering_changes) {
                console.log('Setting mastering analysis:', analysisData.mastering_changes)
                setMasteringAnalysis(analysisData.mastering_changes)
              } else {
                console.log('No mastering_changes found in response')
              }
              
              // Automatically open the playback popup for automatic mastering
              if (analysisData.mastered_path) {
                setTimeout(() => {
                  openPlaybackPopup('automatic', analysisData.mastered_path)
                }, 500)
              }
            } catch (analysisError) {
              console.log('Could not fetch mastering analysis:', analysisError)
            }
          } else if (status.status === 'failed') {
            clearInterval(pollInterval)
            setError(status.error_message || 'Automatic mastering failed')
            setProcessing(false)
          }
        } catch (err) {
          clearInterval(pollInterval)
          setError('Error checking status')
          setProcessing(false)
        }
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Automatic mastering failed')
      setProcessing(false)
    }
  }

  const handleAdvancedMaster = () => {
    if (!uploadedFile) return
    router.push(`/ai-mastering/custom/${uploadedFile.id}`)
  }

  const handleDownload = async () => {
    if (!uploadedFile?.mastered_path) {
      console.error('No mastered path available:', uploadedFile)
      setError('No mastered audio available for download')
      return
    }
    
    try {
      console.log('Starting download for file:', uploadedFile.id)
      console.log('Mastered path:', uploadedFile.mastered_path)
      
      // Try the regular download endpoint first
      try {
        const blob = await audioApi.downloadAudio(uploadedFile.id, 'wav')
        console.log('Download response blob:', blob)
        
        if (!blob || blob.size === 0) {
          throw new Error('Download returned empty or invalid file')
        }
        
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `mastered_${uploadedFile.original_filename}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } catch (downloadError) {
        console.error('Download failed:', downloadError)
        // Fallback: direct download link
        const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL}/storage/${uploadedFile.mastered_path}`
        window.open(downloadUrl, '_blank')
      }
    } catch (err: any) {
      console.error('Download error:', err)
      setError('Download failed: ' + (err.message || 'Unknown error'))
    }
  }

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
      setDuration(audioRef.current.duration)
    }
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const openPlaybackPopup = (masteringType: 'automatic' | 'advanced', masteredPath?: string) => {
    console.log(`Opening ${masteringType} playback popup with path:`, masteredPath)
    setPlaybackPopup({
      isVisible: true,
      masteringType,
      masteredPath
    })
  }

  const closePlaybackPopup = () => {
    setPlaybackPopup({
      isVisible: false,
      masteringType: 'automatic'
    })
  }

  const handleDownloadMastered = async (masteringType: 'automatic' | 'advanced') => {
    if (!uploadedFile) return
    
    try {
      console.log(`Starting download for ${masteringType} mastered file:`, uploadedFile.id)
      
      // Try the regular download endpoint first
      try {
        const blob = await audioApi.downloadAudio(uploadedFile.id, 'wav')
        console.log('Download response blob:', blob)
        
        if (!blob || blob.size === 0) {
          throw new Error('Download returned empty or invalid file')
        }
        
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${masteringType}_mastered_${uploadedFile.original_filename}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } catch (downloadError) {
        console.error('Download failed:', downloadError)
        // Fallback: direct download link
        const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL}/storage/${playbackPopup.masteredPath}`
        window.open(downloadUrl, '_blank')
      }
    } catch (err: any) {
      console.error('Download error:', err)
      setError('Download failed: ' + (err.message || 'Unknown error'))
    }
  }

  // Set up audio source when mastered_path changes
  useEffect(() => {
    if (uploadedFile?.mastered_path && audioRef.current) {
      const audioUrl = `${process.env.NEXT_PUBLIC_API_URL}/storage/${uploadedFile.mastered_path}`
      audioRef.current.src = audioUrl
      console.log('Audio source set to:', audioUrl)
    }
  }, [uploadedFile?.mastered_path])

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 md:p-6">
        {/* Hidden audio element for playback */}
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setDuration(audioRef.current.duration)
            }
          }}
          onError={(e) => {
            console.error('Audio playback error:', e)
            setError('Audio playback failed. Please try refreshing the page.')
          }}
        />
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-red-500 to-purple-600 rounded-full mb-4 md:mb-6">
              <Zap className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 md:mb-4 bg-gradient-to-r from-red-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              Sound Mastering Studio
            </h1>
            <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto px-4">
              Transform your music with professional AI-powered mastering. Choose your genre and let our AI create the perfect master.
            </p>
          </div>
          <Tabs value={masteringType} onValueChange={(value) => setMasteringType(value as 'automatic' | 'advanced')} className="space-y-8 md:space-y-12">
            {/* Service Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Automatic Mastering Card */}
              <Card 
                className={`cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  masteringType === 'automatic' 
                    ? 'bg-gradient-to-br from-red-500/20 to-purple-600/20 border-red-400/50 shadow-lg shadow-red-500/25' 
                    : 'bg-gradient-to-br from-gray-800/60 to-gray-700/60 border-gray-600/50 hover:border-gray-500/50'
                }`}
                onClick={() => setMasteringType('automatic')}
              >
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    masteringType === 'automatic' 
                      ? 'bg-gradient-to-r from-red-500 to-purple-600' 
                      : 'bg-gray-700'
                  }`}>
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className={`text-xl font-bold ${
                    masteringType === 'automatic' ? 'text-white' : 'text-gray-300'
                  }`}>
                    Automatic Mastering
                  </CardTitle>
                  <p className="text-sm text-gray-400 mt-2">
                    AI-powered mastering with genre presets
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Genre-specific optimization</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>One-click processing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Professional results</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Advanced Mastering Card */}
              <Card 
                className={`cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  masteringType === 'advanced' 
                    ? 'bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border-blue-400/50 shadow-lg shadow-blue-500/25' 
                    : 'bg-gradient-to-br from-gray-800/60 to-gray-700/60 border-gray-600/50 hover:border-gray-500/50'
                }`}
                onClick={() => setMasteringType('advanced')}
              >
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    masteringType === 'advanced' 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-600' 
                      : 'bg-gray-700'
                  }`}>
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className={`text-xl font-bold ${
                    masteringType === 'advanced' ? 'text-white' : 'text-gray-300'
                  }`}>
                    Advanced Studio
                  </CardTitle>
                  <p className="text-sm text-gray-400 mt-2">
                    Professional controls with real-time preview
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Full control over settings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Real-time processing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Professional results</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Automatic Master Tab */}
            <TabsContent value="automatic" className="space-y-8">
              {/* Upload Section */}
              <Card className="bg-gradient-to-r from-gray-800/60 to-gray-700/60 border-gray-600/50 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-white flex items-center justify-center gap-3">
                    <Upload className="text-red-400" />
                    Upload Your Audio
                  </CardTitle>
                  <p className="text-gray-400">Drag and drop your audio file to get started</p>
                </CardHeader>
                <CardContent>
                  <div
                    {...getRootProps()}
                    className={`border-3 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
                      isDragActive 
                        ? 'border-red-400 bg-red-400/10 scale-105' 
                        : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/30'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="w-16 h-16 mx-auto mb-6 text-gray-400" />
                    <p className="text-white text-xl mb-3 font-medium">
                      {isDragActive ? 'Drop your audio file here' : 'Drag & drop audio file here'}
                    </p>
                    <p className="text-gray-400 text-lg mb-4">or click to browse</p>
                    <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500">
                      <Badge variant="outline" className="bg-gray-800/50">MP3</Badge>
                      <Badge variant="outline" className="bg-gray-800/50">WAV</Badge>
                      <Badge variant="outline" className="bg-gray-800/50">OGG</Badge>
                      <Badge variant="outline" className="bg-gray-800/50">M4A</Badge>
                      <Badge variant="outline" className="bg-gray-800/50">FLAC</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Genre Selection */}
              {uploadedFile && (
                <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/30 backdrop-blur-sm">
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl text-white flex items-center justify-center gap-3">
                      <Music className="text-yellow-400" />
                      Choose Your Genre
                    </CardTitle>
                    <p className="text-gray-300">Select the genre that best matches your track for optimal mastering</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {GENRE_OPTIONS.map((genre) => {
                        const IconComponent = genre.icon
                        return (
                          <div
                            key={genre.value}
                            onClick={() => setSelectedGenre(genre.value)}
                            className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 group ${
                              selectedGenre === genre.value
                                ? `border-yellow-400 bg-gradient-to-br ${genre.color} text-white shadow-lg shadow-yellow-400/25 scale-105`
                                : 'border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white bg-gray-800/30 hover:bg-gray-700/50'
                            }`}
                          >
                            <div className="text-center">
                              <IconComponent className={`w-8 h-8 mx-auto mb-3 ${
                                selectedGenre === genre.value ? 'text-white' : 'text-gray-400 group-hover:text-white'
                              }`} />
                              <div className="font-semibold text-lg mb-1">{genre.label}</div>
                              <div className="text-xs opacity-75 leading-relaxed">{genre.description}</div>
                            </div>
                            {selectedGenre === genre.value && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-black" />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Automatic Master Button */}
              {uploadedFile && (
                <Card className="bg-gradient-to-r from-gray-800/60 to-gray-700/60 border-gray-600/50 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <Button 
                      onClick={handleAutomaticMaster} 
                      disabled={processing}
                      className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                          Mastering in Progress...
                        </>
                      ) : (
                        <>
                          <Zap className="w-6 h-6 mr-3" />
                          Master with {selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1)} Settings
                        </>
                      )}
                    </Button>
                    {processing && (
                      <div className="mt-4 text-center">
                        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                          <div
                            className="bg-gradient-to-r from-red-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <p className="text-gray-400">{progress}% Complete</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              {/* Processing Status */}
              {processing && (
                <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/30 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-purple-600 rounded-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-lg">AI Mastering in Progress</p>
                        <p className="text-gray-300">Applying {selectedGenre} genre-specific settings...</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Error Display */}
              {error && (
                <Card className="bg-gradient-to-r from-red-900/20 to-red-800/20 border-red-500/30 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-red-400 font-semibold">{error}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Success Message */}
              {uploadedFile?.status === 'completed' && (
                <Card className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/30 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-green-400 font-semibold text-lg">Mastering Completed!</p>
                        <p className="text-green-300">Your {selectedGenre} track has been mastered with professional quality</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Preview and Download for Automatic */}
              {uploadedFile?.automatic_mastered_path && (
                <Card className="bg-gradient-to-r from-gray-800/60 to-gray-700/60 border-gray-600/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-2xl text-white flex items-center gap-3">
                      <Play className="text-red-400" />
                      Automatic Mastering Complete
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-white font-medium mb-2">Automatic Mastering Ready</p>
                      <p className="text-gray-400 text-sm mb-6">Your track has been mastered with {selectedGenre} settings</p>
                      
                      <Button 
                        onClick={() => openPlaybackPopup('automatic', uploadedFile.automatic_mastered_path)}
                        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700"
                      >
                        <Play className="w-6 h-6 mr-3" />
                        Preview & Download Automatic Master
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Mastering Analysis for Automatic */}
              {masteringAnalysis && (
                <MasteringAnalysis 
                  analysis={masteringAnalysis}
                  isLoading={analyzing}
                />
              )}
            </TabsContent>
            {/* Advanced Master Tab */}
            <TabsContent value="advanced" className="space-y-8">
              <Card className="bg-gradient-to-r from-gray-800/60 to-gray-700/60 border-gray-600/50 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-white flex items-center justify-center gap-3">
                    <Settings className="text-blue-400" />
                    Advanced Mastering Studio
                  </CardTitle>
                  <p className="text-gray-300">Access professional-grade mastering controls with real-time preview</p>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Settings className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">Professional Mastering Controls</h3>
                    <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
                      Take full control of your mastering process with advanced EQ, compression, limiting, and real-time processing capabilities.
                    </p>
                    
                    {uploadedFile ? (
                      <Button 
                        onClick={handleAdvancedMaster}
                        className="h-16 text-xl font-semibold bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 px-8"
                      >
                        <Settings className="w-6 h-6 mr-3" />
                        Open Advanced Mastering Dashboard
                      </Button>
                    ) : (
                      <div className="space-y-6">
                        <p className="text-gray-500 text-lg">
                          Upload an audio file first to access advanced mastering controls.
                        </p>
                        <div
                          {...getRootProps()}
                          className="border-3 border-dashed border-gray-600 rounded-2xl p-8 text-center cursor-pointer hover:border-gray-500 hover:bg-gray-800/30 transition-all duration-300"
                        >
                          <input {...getInputProps()} />
                          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-white text-lg font-medium">Upload Audio for Advanced Mastering</p>
                          <p className="text-gray-400 mt-2">Drag & drop or click to browse</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {/* Audio Playback Popup */}
      <AudioPlaybackPopup
        isVisible={playbackPopup.isVisible}
        onClose={closePlaybackPopup}
        masteringType={playbackPopup.masteringType}
        audioFile={uploadedFile}
        masteredPath={playbackPopup.masteredPath}
        masteringAnalysis={masteringAnalysis}
        onDownload={() => handleDownloadMastered(playbackPopup.masteringType)}
      />
    </>
  )
} 
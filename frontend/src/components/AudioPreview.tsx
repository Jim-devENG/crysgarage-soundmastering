'use client'

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react'

interface AudioPreviewProps {
  audioUrl: string
  onSettingsChange?: (settings: any) => void
  masteringSettings?: any
  audioFileId?: string | undefined
  mp3Url?: string
}

export interface AudioPreviewRef {
  play: () => void
  pause: () => void
  reset: () => void
}

const AudioPreview = forwardRef<AudioPreviewRef, AudioPreviewProps>(({ audioUrl, onSettingsChange, masteringSettings, audioFileId, mp3Url }, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isLooping, setIsLooping] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [isAudioReady, setIsAudioReady] = useState(false)
  const [audioLoading, setAudioLoading] = useState(true)
  const [convertingToMP3, setConvertingToMP3] = useState(false)
  const [currentAudioUrl, setCurrentAudioUrl] = useState(audioUrl)

  // Real-time mastering preview settings
  const [previewSettings, setPreviewSettings] = useState({
    bass: 0,
    treble: 0,
    volume: 0,
    stereoWidth: 0,
  })

  // Check if audio format is supported
  const checkAudioSupport = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase()
    const audio = document.createElement('audio')
    
    const formatSupport = {
      wav: audio.canPlayType('audio/wav'),
      mp3: audio.canPlayType('audio/mpeg'),
      ogg: audio.canPlayType('audio/ogg'),
      aac: audio.canPlayType('audio/aac'),
      m4a: audio.canPlayType('audio/mp4'),
    }
    
    console.log('Audio format support:', formatSupport)
    console.log('File extension:', extension)
    
    if (extension && formatSupport[extension as keyof typeof formatSupport]) {
      const support = formatSupport[extension as keyof typeof formatSupport]
      console.log(`Support for .${extension}:`, support)
      return support !== ''
    }
    
    return true // Assume supported if we can't determine
  }

  // Convert to MP3 if needed
  const convertToMP3 = async () => {
    if (!audioFileId || convertingToMP3) return
    
    try {
      setConvertingToMP3(true)
      setAudioError('Converting to MP3 for better browser compatibility...')
      
      const { audioApi } = await import('@/lib/api')
      const response = await audioApi.convertToMP3(audioFileId)
      
      if (response.data?.mp3_url) {
        setCurrentAudioUrl(response.data.mp3_url)
        setAudioError(null)
        console.log('Successfully converted to MP3:', response.data.mp3_url)
      }
    } catch (error) {
      console.error('MP3 conversion failed:', error)
      setAudioError('Failed to convert to MP3. Please try again.')
    } finally {
      setConvertingToMP3(false)
    }
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    console.log('Setting up audio event listeners for URL:', currentAudioUrl)
    console.log('Audio format support check:', checkAudioSupport(currentAudioUrl))
    
    setAudioLoading(true)
    setAudioError(null)

    // First check if the file exists
    fetch(currentAudioUrl, { method: 'HEAD' })
      .then(response => {
        if (response.status === 404) {
          setAudioError('Audio file not found. The file may have been deleted or never created.')
          setAudioLoading(false)
          return
        } else if (response.status >= 400) {
          setAudioError(`Server error: ${response.status} ${response.statusText}`)
          setAudioLoading(false)
          return
        }
        
        // File exists, continue with audio setup
        console.log('Audio file exists, setting up audio element')
      })
      .catch(() => {
        setAudioError('Cannot access audio file. Check your internet connection.')
        setAudioLoading(false)
        return
      })

    // Add a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (audioLoading) {
        console.warn('Audio loading timeout - checking if file exists')
        setAudioError('Audio loading timed out. Checking if file exists...')
        setAudioLoading(false)
      }
    }, 10000) // 10 second timeout

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => {
      setDuration(audio.duration)
      console.log('Audio duration loaded:', audio.duration)
    }
    const handleEnded = () => setIsPlaying(false)
    const handleCanPlay = () => {
      console.log('Audio can play')
      setIsAudioReady(true)
      setAudioLoading(false)
      clearTimeout(loadingTimeout)
    }
    const handleError = (e: any) => {
      console.error('Audio error:', e)
      clearTimeout(loadingTimeout)
      console.error('Audio error details:', {
        error: e.target.error,
        networkState: e.target.networkState,
        readyState: e.target.readyState,
        src: e.target.src,
        currentSrc: e.target.currentSrc
      })
      
      let errorMessage = 'Unknown audio error'
      
      if (e.target.error) {
        switch (e.target.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Audio playback was aborted'
            break
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error while loading audio'
            break
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Audio format not supported or file is corrupted'
            break
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Audio format not supported by browser'
            // Automatically try MP3 conversion if WAV is not supported
            if (currentAudioUrl.includes('.wav') && audioFileId && !convertingToMP3) {
              console.log('WAV not supported, attempting MP3 conversion...')
              convertToMP3()
              return
            }
            break
          default:
            errorMessage = `Audio error: ${e.target.error.message || 'Unknown error'}`
        }
      } else if (e.target.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
        errorMessage = 'No audio source available'
      } else if (e.target.networkState === HTMLMediaElement.NETWORK_LOADING) {
        errorMessage = 'Audio is still loading'
      } else if (e.target.networkState === HTMLMediaElement.NETWORK_IDLE) {
        // Check if the file actually exists by making a HEAD request
        fetch(currentAudioUrl, { method: 'HEAD' })
          .then(response => {
            if (response.status === 404) {
              setAudioError('Audio file not found. The file may have been deleted or never created.')
            } else if (response.status >= 400) {
              setAudioError(`Server error: ${response.status} ${response.statusText}`)
            } else {
              setAudioError('Audio file exists but cannot be played. Try refreshing the page.')
            }
          })
          .catch(() => {
            setAudioError('Cannot access audio file. Check your internet connection.')
          })
        return
      }
      
      setAudioError(errorMessage)
      setAudioLoading(false)
    }
    const handleLoadStart = () => {
      console.log('Audio loading started')
      setAudioLoading(true)
      setAudioError(null)
    }
    const handleLoadedData = () => {
      console.log('Audio data loaded')
      setIsAudioReady(true)
      setAudioLoading(false)
    }
    const handleLoad = () => {
      console.log('Audio load complete')
      setAudioLoading(false)
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('error', handleError)
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('loadeddata', handleLoadedData)
    audio.addEventListener('load', handleLoad)

    return () => {
      clearTimeout(loadingTimeout)
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('loadeddata', handleLoadedData)
      audio.removeEventListener('load', handleLoad)
    }
  }, [currentAudioUrl, audioFileId, convertingToMP3])

  // Update currentAudioUrl when audioUrl prop changes
  useEffect(() => {
    setCurrentAudioUrl(audioUrl)
  }, [audioUrl])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = isMuted ? 0 : volume
    audio.playbackRate = playbackRate
    audio.loop = isLooping
  }, [volume, isMuted, playbackRate, isLooping])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) {
      console.error('No audio element found')
      return
    }

    console.log('Toggle play called, current state:', isPlaying)
    console.log('Audio ready state:', audio.readyState)
    console.log('Audio URL:', audio.src)

    try {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
      } else {
        console.log('Attempting to play audio...')
        await audio.play()
        setIsPlaying(true)
        console.log('Audio playback started successfully')
      }
    } catch (error) {
      console.error('Error playing audio:', error)
      setAudioError(`Playback error: ${error}`)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = value[0]
    setCurrentTime(value[0])
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
    if (value[0] > 0 && isMuted) {
      setIsMuted(false)
    }
  }

  const resetAudio = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = 0
    setCurrentTime(0)
    if (isPlaying) {
      audio.play()
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handlePreviewSettingChange = (key: string, value: number) => {
    const newSettings = { ...previewSettings, [key]: value }
    setPreviewSettings(newSettings)
    
    // Notify parent component
    onSettingsChange?.(newSettings)
  }

  useImperativeHandle(ref, () => ({
    play: async () => {
      const audio = audioRef.current
      if (!audio) return
      
      try {
        if (!isPlaying) {
          console.log('Attempting to play audio via ref...')
          await audio.play()
          setIsPlaying(true)
          console.log('Audio playback started successfully via ref')
        }
      } catch (error) {
        console.error('Error playing audio via ref:', error)
        setAudioError(`Playback error: ${error}`)
      }
    },
    pause: () => {
      const audio = audioRef.current
      if (audio) {
        audio.pause()
        setIsPlaying(false)
      }
    },
    reset: resetAudio
  }))

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Audio Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Audio Player */}
        <audio ref={audioRef} src={currentAudioUrl} preload="metadata" />
        
        {/* Debug Info */}
        {audioError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
            {audioError}
            {audioError.includes('format not supported') && audioFileId && !convertingToMP3 && (
              <div className="mt-2">
                <Button 
                  onClick={convertToMP3} 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                >
                  Convert to MP3
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* Audio Status */}
        <div className="text-xs text-gray-400 space-y-1">
          <div>URL: {currentAudioUrl}</div>
          <div>Ready: {isAudioReady ? 'Yes' : 'No'}</div>
          <div>Loading: {audioLoading ? 'Yes' : 'No'}</div>
          <div>Converting to MP3: {convertingToMP3 ? 'Yes' : 'No'}</div>
          <div>Duration: {duration ? formatTime(duration) : 'Loading...'}</div>
          <div>Ready State: {audioRef.current?.readyState || 'Unknown'}</div>
          <div>Network State: {audioRef.current?.networkState || 'Unknown'}</div>
          <div>Format: {currentAudioUrl.split('.').pop()?.toUpperCase() || 'Unknown'}</div>
          <div>Format Supported: {checkAudioSupport(currentAudioUrl) ? 'Yes' : 'No'}</div>
        </div>
        
        {/* Playback Controls */}
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={resetAudio}
            disabled={!isPlaying && currentTime === 0}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={togglePlay}
            className="w-16 h-16 rounded-full"
            disabled={!isAudioReady || audioLoading}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMute}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <Slider
            value={[currentTime]}
            onValueChange={handleSeek}
            max={duration}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Volume Control */}
        <div className="space-y-2">
          <Label>Volume</Label>
          <Slider
            value={[volume]}
            onValueChange={handleVolumeChange}
            min={0}
            max={1}
            step={0.01}
            className="w-full"
          />
        </div>

        {/* Real-time Mastering Preview */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Real-time Preview</h4>
          <div className="space-y-4">
            {/* Bass */}
            <div className="space-y-2">
              <Label>Bass: {previewSettings.bass} dB</Label>
              <Slider
                value={[previewSettings.bass]}
                onValueChange={([value]) => handlePreviewSettingChange('bass', value)}
                min={-12}
                max={12}
                step={0.5}
                className="w-full"
              />
            </div>

            {/* Treble */}
            <div className="space-y-2">
              <Label>Treble: {previewSettings.treble} dB</Label>
              <Slider
                value={[previewSettings.treble]}
                onValueChange={([value]) => handlePreviewSettingChange('treble', value)}
                min={-12}
                max={12}
                step={0.5}
                className="w-full"
              />
            </div>

            {/* Volume */}
            <div className="space-y-2">
              <Label>Volume: {previewSettings.volume} dB</Label>
              <Slider
                value={[previewSettings.volume]}
                onValueChange={([value]) => handlePreviewSettingChange('volume', value)}
                min={-20}
                max={6}
                step={0.5}
                className="w-full"
              />
            </div>

            {/* Stereo Width */}
            <div className="space-y-2">
              <Label>Stereo Width: {previewSettings.stereoWidth}%</Label>
              <Slider
                value={[previewSettings.stereoWidth]}
                onValueChange={([value]) => handlePreviewSettingChange('stereoWidth', value)}
                min={-20}
                max={20}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Playback Options */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isLooping}
                onChange={(e) => setIsLooping(e.target.checked)}
                className="rounded"
              />
              <span>Loop</span>
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <span>Speed:</span>
            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(Number(e.target.value))}
              className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

export default AudioPreview 
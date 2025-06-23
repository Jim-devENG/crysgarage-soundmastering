'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Pause } from 'lucide-react'
import axios from 'axios'

export default function AudioDebug() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Test with a known working audio URL
  const testAudioUrl = 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
      } else {
        await audio.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('Audio playback error:', error)
      setError(`Error: ${error}`)
    }
  }

  const testYourAudio = async () => {
    // This will test with your actual audio URL
    const audio = audioRef.current
    if (!audio) return

    try {
      audio.src = testAudioUrl
      await audio.load()
      await audio.play()
      setIsPlaying(true)
      setError(null)
    } catch (error) {
      console.error('Test audio error:', error)
      setError(`Test audio error: ${error}`)
    }
  }

  const applyEQ = async () => {
    // This function is not provided in the original file or the code block
    // It's assumed to exist as it's called in the applyEQ function
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Audio Debug Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <audio ref={audioRef} preload="metadata" />
        
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm text-gray-400">
            This component tests basic audio playback with a known working audio file.
          </p>
          
          <div className="flex space-x-2">
            <Button onClick={testYourAudio} variant="outline" size="sm">
              Test with Sample Audio
            </Button>
            
            <Button 
              onClick={togglePlay} 
              variant="outline" 
              size="sm"
              disabled={!audioRef.current?.src}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
          </div>
        </div>

        <div className="text-xs text-gray-400 space-y-1">
          <div>Test URL: {testAudioUrl}</div>
          <div>Audio Element: {audioRef.current ? 'Created' : 'Not created'}</div>
          <div>Playing: {isPlaying ? 'Yes' : 'No'}</div>
        </div>
      </CardContent>
    </Card>
  )
} 
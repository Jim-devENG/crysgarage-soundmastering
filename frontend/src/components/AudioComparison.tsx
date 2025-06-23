'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react'

interface AudioComparisonProps {
  originalUrl: string
  masteredUrl: string
  onComparisonChange?: (isComparing: boolean) => void
}

export default function AudioComparison({ 
  originalUrl, 
  masteredUrl, 
  onComparisonChange 
}: AudioComparisonProps) {
  const originalAudioRef = useRef<HTMLAudioElement>(null)
  const masteredAudioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isComparing, setIsComparing] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<'original' | 'mastered'>('original')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const togglePlay = () => {
    const originalAudio = originalAudioRef.current
    const masteredAudio = masteredAudioRef.current

    if (!originalAudio || !masteredAudio) return

    if (isPlaying) {
      originalAudio.pause()
      masteredAudio.pause()
      setIsPlaying(false)
    } else {
      if (isComparing) {
        originalAudio.currentTime = currentTime
        masteredAudio.currentTime = currentTime
        originalAudio.play()
        masteredAudio.play()
      } else {
        const audio = currentTrack === 'original' ? originalAudio : masteredAudio
        audio.currentTime = currentTime
        audio.play()
      }
      setIsPlaying(true)
    }
  }

  const toggleComparison = () => {
    setIsComparing(!isComparing)
    onComparisonChange?.(!isComparing)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>A/B Comparison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={currentTrack === 'original' ? "default" : "outline"}
            onClick={() => setCurrentTrack('original')}
            disabled={isComparing}
          >
            Original
          </Button>
          <Button
            variant={currentTrack === 'mastered' ? "default" : "outline"}
            onClick={() => setCurrentTrack('mastered')}
            disabled={isComparing}
          >
            Mastered
          </Button>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button onClick={togglePlay}>
            {isPlaying ? <Pause /> : <Play />}
          </Button>
          <Button variant="outline" onClick={toggleComparison}>
            {isComparing ? "Exit Comparison" : "Start Comparison"}
          </Button>
        </div>

        <div className="text-center">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        <audio ref={originalAudioRef} src={originalUrl} preload="metadata" />
        <audio ref={masteredAudioRef} src={masteredUrl} preload="metadata" />
      </CardContent>
    </Card>
  )
} 
'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Activity } from 'lucide-react'

interface AudioVisualizerProps {
  audioUrl?: string
  isPlaying: boolean
  currentTime: number
  duration: number
}

export default function AudioVisualizer({ 
  audioUrl, 
  isPlaying, 
  currentTime, 
  duration
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null)

  useEffect(() => {
    if (!audioUrl || !canvasRef.current) return

    const initAudio = async () => {
      try {
        const audio = new Audio(audioUrl)
        const context = new (window.AudioContext || (window as any).webkitAudioContext)()
        const source = context.createMediaElementSource(audio)
        const analyserNode = context.createAnalyser()
        
        analyserNode.fftSize = 256
        source.connect(analyserNode)
        analyserNode.connect(context.destination)
        
        const bufferLength = analyserNode.frequencyBinCount
        const data = new Uint8Array(bufferLength)
        
        setAudioContext(context)
        setAnalyser(analyserNode)
        setDataArray(data)
      } catch (error) {
        console.error('Error initializing audio context:', error)
      }
    }

    initAudio()

    return () => {
      if (audioContext) {
        audioContext.close()
      }
    }
  }, [audioUrl])

  useEffect(() => {
    if (!canvasRef.current || !analyser || !dataArray) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      if (!isPlaying) return

      analyser.getByteFrequencyData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#ef4444' // red-500

      const barWidth = (canvas.width / dataArray.length) * 2.5
      let barHeight
      let x = 0

      for (let i = 0; i < dataArray.length; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height

        ctx.fillStyle = `hsl(${240 + (i * 360) / dataArray.length}, 70%, 60%)`
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

        x += barWidth + 1
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    if (isPlaying) {
      draw()
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, analyser, dataArray])

  return (
    <Card className="bg-gray-800/60 border-gray-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <BarChart3 className="text-red-400" />
          Frequency Spectrum
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={400}
            height={100}
            className="w-full h-24 bg-gray-900 rounded-lg"
          />
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-500 text-sm">Audio visualization will appear when playing</p>
            </div>
          )}
        </div>
        
        {/* Progress indicator */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>{Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}</span>
            <span>{Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div
              className="bg-red-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
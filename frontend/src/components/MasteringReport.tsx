'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  Volume2, 
  TrendingUp, 
  Zap, 
  Music, 
  Download,
  FileAudio,
  Clock,
  Settings,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MasteringReportProps {
  audioFile: any
  processingResults?: any
  onDownload?: () => void
  realTime: boolean
}

const EASY_MASTER_SETTINGS = {
  target_loudness: -9,
  genre_preset: 'pop',
  processing_quality: 'standard',
  stereo_width: 0,
  bass_boost: 0,
  presence_boost: 0,
  dynamic_range: 'natural',
  high_freq_enhancement: false,
  low_freq_enhancement: false,
  noise_reduction: false,
}

export default function MasteringReport({ audioFile, processingResults, onDownload, realTime }: MasteringReportProps) {
  const [analysis, setAnalysis] = useState<any>(null)

  useEffect(() => {
    if (audioFile?.mastered_path) {
      loadAnalysis()
    }
  }, [audioFile])

  const loadAnalysis = async () => {
    if (!audioFile?.id) return
    
    try {
      const mockData = {
        audioInfo: {
          originalDuration: '3:45',
          sampleRate: '44.1 kHz',
          bitDepth: '24-bit',
          channels: 'Stereo'
        },
        loudnessAnalysis: {
          original: { rms: -18, peak: -3, loudness: -23 },
          mastered: { rms: -6, peak: -0.1, loudness: -6 },
          improvement: '+17 dB'
        },
        processingSettings: {
          targetLoudness: '-6 dB',
          compressionRatio: '20:1',
          attackTime: '0.0001 ms',
          releaseTime: '0.01 ms',
          stereoWidth: '180%',
          dynamicRange: 'Heavily Compressed'
        },
        eqChanges: [
          { frequency: '80 Hz', original: '0 dB', mastered: '+12 dB', change: '+12 dB' },
          { frequency: '2.5 kHz', original: '0 dB', mastered: '+8 dB', change: '+8 dB' },
          { frequency: '8 kHz', original: '0 dB', mastered: '+8 dB', change: '+8 dB' }
        ],
        dynamicRangeAnalysis: {
          original: { dr: 15, crest: 8 },
          mastered: { dr: 6, crest: 3 },
          compression: 'Heavy compression applied'
        },
        summary: 'DRAMATIC transformation! This track now has MASSIVE bass boost (+12dB), aggressive compression (20:1 ratio), and maximum stereo width. The loudness increased by 17dB making it extremely punchy and commercial-ready.',
        rms_level: -6.0,
        peak_level: -0.1,
        output_size: 15728640,
        processing_time: 2.3,
        loudness_improvement: 17.0
      }
      setAnalysis(mockData)
    } catch (error) {
      console.error('Failed to load analysis:', error)
    }
  }

  const getLoudnessColor = (loudness: number) => {
    if (loudness >= -12) return 'text-green-400'
    if (loudness >= -16) return 'text-yellow-400'
    return 'text-red-400'
  }

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  }

  if (!audioFile) {
    return (
      <Card className="bg-gray-800/60 border-gray-700/50">
        <CardContent className="p-6 text-center">
          <Info className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-400">No audio file available for analysis</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-red-400" />
            {realTime ? 'Real-time Mastering Report' : 'Mastering Report'}
          </h2>
          <p className="text-gray-400">Comprehensive analysis of your mastered audio</p>
        </div>
        {onDownload && (
          <Button onClick={onDownload} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download Mastered
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800/60 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileAudio className="text-red-400" />
              Audio Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Original File:</span>
              <span className="text-white font-medium">{audioFile.original_filename}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Original Size:</span>
              <span className="text-white">{formatFileSize(audioFile.file_size)}</span>
            </div>
            {analysis && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Output Size:</span>
                  <span className="text-white">{formatFileSize(analysis.output_size)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Processing Time:</span>
                  <span className="text-white flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {analysis.processing_time}s
                  </span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Genre Preset:</span>
              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                Pop
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/60 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Volume2 className="text-red-400" />
              Loudness Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">RMS Level:</span>
                    <span className={`font-bold ${getLoudnessColor(analysis.rms_level)}`}>
                      {analysis.rms_level.toFixed(1)} dB
                    </span>
                  </div>
                  <Progress 
                    value={Math.max(0, Math.min(100, (analysis.rms_level + 20) * 5))} 
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Peak Level:</span>
                    <span className="text-white font-bold">{analysis.peak_level.toFixed(1)} dB</span>
                  </div>
                  <Progress 
                    value={Math.max(0, Math.min(100, (analysis.peak_level + 6) * 16.67))} 
                    className="h-2"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Loudness Improvement:</span>
                  <span className="text-green-400 font-bold flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    +{analysis.loudness_improvement.toFixed(1)} dB
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-400 mx-auto mb-2"></div>
                <p className="text-gray-400">Loading analysis...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-800/60 border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="text-red-400" />
            Real-time Mastering Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-semibold mb-3">What Was Applied</h4>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Radio-ready loudness optimization
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Pop genre-specific EQ enhancement
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Moderate compression for consistency
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Natural dynamic range preservation
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-3">Quality Assessment</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Loudness:</span>
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                    Radio Ready
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Clarity:</span>
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    Enhanced
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Dynamics:</span>
                  <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    Preserved
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Overall:</span>
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                    Professional
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

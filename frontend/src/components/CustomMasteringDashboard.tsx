'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Pause, 
  Volume2, 
  Download, 
  Upload, 
  Settings, 
  Zap, 
  BarChart3,
  RotateCcw,
  Save,
  Eye,
  EyeOff,
  Music
} from 'lucide-react'
import { audioApi } from '@/lib/api'
import { useDropzone } from 'react-dropzone'
import AudioVisualizer from './AudioVisualizer'
import ProcessingBreakdown from './ProcessingBreakdown'
import { getSession } from 'next-auth/react'
import MasteringReport from './MasteringReport'
// import { debounce } from 'lodash'
import type { AudioFile } from '@/types/audio'
import EQSection from './EQSection'

interface MasteringSettings {
  // Limiter Settings
  limiter_enabled: boolean
  limiter_threshold: number
  limiter_release: number
  limiter_ceiling: number
  
  // Automatic Mastering
  auto_mastering_enabled: boolean
  target_loudness: number
  genre_preset: string
  processing_quality: 'fast' | 'standard' | 'high'
  
  // Reference Audio
  reference_audio_enabled: boolean
  reference_audio_path?: string
  
  // Advanced Options
  stereo_width: number
  bass_boost: number
  presence_boost: number
  dynamic_range: 'compressed' | 'natural' | 'expanded'
  high_freq_enhancement: boolean
  low_freq_enhancement: boolean
  noise_reduction: boolean
  
  // EQ Settings
  eq_bands: {
    [key: string]: number
  }
}

const defaultSettings: MasteringSettings = {
  limiter_enabled: true,
  limiter_threshold: -3.0,
  limiter_release: 50,
  limiter_ceiling: -0.3,
  auto_mastering_enabled: true,
  target_loudness: -6,
  genre_preset: 'pop',
  processing_quality: 'standard',
  reference_audio_enabled: false,
  stereo_width: 1.8,
  bass_boost: 3,
  presence_boost: 2,
  dynamic_range: 'compressed',
  high_freq_enhancement: true,
  low_freq_enhancement: true,
  noise_reduction: false,
  eq_bands: {
    '32': 2,
    '64': 3,
    '125': 1,
    '250': 0,
    '500': 0,
    '1k': 1,
    '2k': 2,
    '4k': 1,
    '8k': 2,
    '16k': 1
  }
}

const GENRE_PRESETS = [
  { value: 'pop', label: 'Pop', description: 'Bright, punchy, radio-ready' },
  { value: 'rock', label: 'Rock', description: 'Powerful, dynamic, aggressive' },
  { value: 'electronic', label: 'Electronic', description: 'Deep bass, crisp highs' },
  { value: 'jazz', label: 'Jazz', description: 'Warm, natural, dynamic' },
  { value: 'classical', label: 'Classical', description: 'Natural, spacious, detailed' },
  { value: 'hiphop', label: 'Hip Hop', description: 'Heavy bass, clear vocals' },
  { value: 'country', label: 'Country', description: 'Warm, organic, acoustic' },
  { value: 'folk', label: 'Folk', description: 'Intimate, natural, acoustic' },
]

interface CustomMasteringDashboardProps {
  audioFile: AudioFile
}

// Define a type for local UI settings
interface LocalSettings {
  target_loudness: number;
  compression_ratio: number;
  attack_time: number;
  release_time: number;
  eq_settings: {
    low_shelf: { freq: number; gain: number };
    high_shelf: { freq: number; gain: number };
    presence: { freq: number; gain: number; q: number };
  };
  stereo_width: number;
  dynamic_range: 'compressed' | 'natural' | 'expanded';
  limiter_enabled: boolean;
  limiter_threshold: number;
  limiter_release: number;
  limiter_ceiling: number;
  auto_mastering_enabled: boolean;
  genre_preset: string;
  processing_quality: 'fast' | 'standard' | 'high';
  reference_audio_enabled: boolean;
  eq_bands: { [key: string]: number };
  noise_reduction: boolean;
  bass_boost: number;
  presence_boost: number;
}

function toMasteringSettings(local: LocalSettings) {
  return {
    // Basic mastering settings
    target_loudness: local.target_loudness,
    genre_preset: local.genre_preset as any,
    processing_quality: local.processing_quality,
    
    // Advanced options
    stereo_width: Math.round(local.stereo_width * 10),
    bass_boost: local.bass_boost,
    presence_boost: local.presence_boost,
    dynamic_range: local.dynamic_range,
    high_freq_enhancement: true,
    low_freq_enhancement: true,
    noise_reduction: local.noise_reduction ?? false,
    
    // Limiter settings
    limiter_enabled: local.limiter_enabled,
    limiter_threshold: local.limiter_threshold,
    limiter_release: local.limiter_release,
    limiter_ceiling: local.limiter_ceiling,
    
    // Automatic mastering
    auto_mastering_enabled: local.auto_mastering_enabled,
    
    // Reference audio
    reference_audio_enabled: local.reference_audio_enabled,
    
    // EQ settings - convert to the format expected by backend
    eq_settings: {
      low_shelf: local.eq_settings.low_shelf,
      high_shelf: local.eq_settings.high_shelf,
      presence: local.eq_settings.presence
    },
    
    // Compression settings
    compression_ratio: local.compression_ratio,
    attack_time: local.attack_time,
    release_time: local.release_time,
    
    // EQ bands for detailed frequency control
    eq_bands: local.eq_bands
  }
}

// Native debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Utility function to clamp values
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

// Add SimpleDropdown component
function SimpleDropdown({ onSelect, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        className="btn btn-primary"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        Download
      </button>
      {open && (
        <div className="absolute z-10 mt-2 w-32 bg-white rounded shadow border">
          <button className="block w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => { setOpen(false); onSelect('wav'); }}>WAV</button>
          <button className="block w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => { setOpen(false); onSelect('mp3'); }}>MP3</button>
          <button className="block w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => { setOpen(false); onSelect('flac'); }}>FLAC</button>
        </div>
      )}
    </div>
  );
}

// Update DownloadDropdown to use explicit types
function DownloadDropdown({ audioId, originalFilename }: { audioId: string; originalFilename: string }) {
  const [downloading, setDownloading] = useState(false);

  const downloadAudio = async (format: string) => {
    setDownloading(true);
    const res = await fetch(`/api/audio/${audioId}/download?format=${format}`);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${originalFilename}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    setDownloading(false);
  };

  return (
    <SimpleDropdown onSelect={downloadAudio} disabled={downloading} />
  );
}

// Helper to get the best mastered path
function getMasteredPath(audioFile: any) {
  return audioFile.mastered_path || audioFile.automatic_mastered_path || audioFile.advanced_mastered_path || null;
}

export default function CustomMasteringDashboard({ audioFile }: CustomMasteringDashboardProps) {
  // Use LocalSettings for the local state
  const [settings, setSettings] = useState<LocalSettings>({
    target_loudness: -6,
    compression_ratio: 20,
    attack_time: 0.0001,
    release_time: 0.01,
    eq_settings: {
      low_shelf: { freq: 80, gain: 12 },
      high_shelf: { freq: 8000, gain: 8 },
      presence: { freq: 2500, gain: 8, q: 1 }
    },
    stereo_width: 1.8,
    dynamic_range: 'compressed',
    limiter_enabled: true,
    limiter_threshold: -3.0,
    limiter_release: 50,
    limiter_ceiling: -0.3,
    auto_mastering_enabled: true,
    genre_preset: 'pop',
    processing_quality: 'standard',
    reference_audio_enabled: false,
    eq_bands: {
      '32': 2,
      '64': 3,
      '125': 1,
      '250': 0,
      '500': 0,
      '1k': 1,
      '2k': 2,
      '4k': 1,
      '8k': 2,
      '16k': 1
    },
    noise_reduction: false,
    bass_boost: 3,
    presence_boost: 2
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [processingResults, setProcessingResults] = useState<any>(null)
  const [referenceAudio, setReferenceAudio] = useState<File | null>(null)
  const [originalAudioUrl, setOriginalAudioUrl] = useState<string>('')
  const [masteredAudioUrl, setMasteredAudioUrl] = useState<string>('')
  const [realTimeStatus, setRealTimeStatus] = useState<string>('')
  const [lastProcessedSettings, setLastProcessedSettings] = useState<string>('') // Cache for processed settings
  
  // Web Audio API for real-time processing
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null)
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  const [audioNodes, setAudioNodes] = useState<{
    gain: GainNode | null
    eqBands: BiquadFilterNode[] | null
    bass: BiquadFilterNode | null
    treble: BiquadFilterNode | null
    presence: BiquadFilterNode | null
    compressor: DynamicsCompressorNode | null
    stereo: StereoPannerNode | null
    analyser: AnalyserNode | null
  }>({
    gain: null,
    eqBands: null,
    bass: null,
    treble: null,
    presence: null,
    compressor: null,
    stereo: null,
    analyser: null
  })
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(128))
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const masteredAudioRef = useRef<HTMLAudioElement>(null)
  const visualizerRef = useRef<HTMLCanvasElement>(null)
  const [masteringError, setMasteringError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Load audio URLs
  useEffect(() => {
    const loadAudioUrls = async () => {
      try {
        if (audioFile.original_path) {
          const originalUrl = `${process.env.NEXT_PUBLIC_API_URL}/storage/${audioFile.original_path}`
          setOriginalAudioUrl(originalUrl)
          
          // Initialize Web Audio API
          await initializeWebAudio(originalUrl)
        }
        if (audioFile.mastered_path) {
          const masteredUrl = `${process.env.NEXT_PUBLIC_API_URL}/storage/${audioFile.mastered_path}`
          setMasteredAudioUrl(masteredUrl)
        }
      } catch (error) {
        console.error('Error loading audio URLs:', error)
      }
    }

    loadAudioUrls()
  }, [audioFile])

  // Handle user interaction to resume audio context
  useEffect(() => {
    const handleUserInteraction = async () => {
      if (audioContext && audioContext.state === 'suspended') {
        try {
          await audioContext.resume()
          console.log('Audio context resumed after user interaction')
        } catch (error) {
          console.error('Failed to resume audio context:', error)
        }
      }
    }

    // Add event listeners for user interaction
    const events = ['click', 'touchstart', 'keydown']
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction)
      })
    }
  }, [audioContext])

  // Initialize Web Audio API
  const initializeWebAudio = async (audioUrl: string) => {
    try {
      console.log('Initializing Web Audio API with URL:', audioUrl)
      
      // Create audio context
      const context = new (window.AudioContext || (window as any).webkitAudioContext)()
      console.log('Audio context created, state:', context.state)
      setAudioContext(context)

      // Fetch and decode audio
      console.log('Fetching audio file...')
      const response = await fetch(audioUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`)
      }
      
      const arrayBuffer = await response.arrayBuffer()
      console.log('Audio fetched, size:', arrayBuffer.byteLength)
      
      const buffer = await context.decodeAudioData(arrayBuffer)
      console.log('Audio decoded, duration:', buffer.duration)
      setAudioBuffer(buffer)

      // Create audio nodes
      const gain = context.createGain()
      const eqFrequencies = [32, 64, 125, 250, 500, 1000, 4000, 8000]
      const eqBands = eqFrequencies.map(freq => {
        const filter = context.createBiquadFilter()
        filter.type = 'peaking'
        filter.frequency.value = freq
        filter.Q.value = 1.2
        filter.gain.value = 0
        return filter
      })
      const bass = context.createBiquadFilter()
      const treble = context.createBiquadFilter()
      const presence = context.createBiquadFilter()
      const compressor = context.createDynamicsCompressor()
      const stereo = context.createStereoPanner()
      const analyser = context.createAnalyser()

      // Configure nodes
      bass.type = 'lowshelf'
      bass.frequency.value = 80
      bass.gain.value = 0

      treble.type = 'highshelf'
      treble.frequency.value = 8000
      treble.gain.value = 0

      presence.type = 'peaking'
      presence.frequency.value = 2500
      presence.Q.value = 1
      presence.gain.value = 0

      compressor.threshold.value = -24
      compressor.knee.value = 30
      compressor.ratio.value = 12
      compressor.attack.value = 0.003
      compressor.release.value = 0.25

      // Connect nodes
      gain.connect(eqBands[0])
      eqBands.reduce((prev, curr, i) => {
        if (i === 0) return curr
        eqBands[i - 1].connect(curr)
        return curr
      }, eqBands[0])
      eqBands[eqBands.length - 1].connect(bass)
      bass.connect(treble)
      treble.connect(presence)
      presence.connect(compressor)
      compressor.connect(stereo)
      stereo.connect(analyser)
      analyser.connect(context.destination)

      console.log('Audio nodes created and connected')
      setAudioNodes({ gain, eqBands, bass, treble, presence, compressor, stereo, analyser })

    } catch (error) {
      console.error('Error initializing Web Audio API:', error)
      // Don't throw - let the fallback HTML audio work
    }
  }

  // Apply real-time effects using Web Audio API
  const applyRealTimeEffects = useCallback((newSettings: LocalSettings) => {
    try {
      if (!audioNodes.bass || !audioNodes.treble || !audioNodes.presence || 
          !audioNodes.compressor || !audioNodes.stereo || !audioNodes.gain) {
        console.warn('Web Audio nodes not ready for real-time effects')
        return
      }

      // Apply EQ settings
      if (newSettings.eq_settings) {
        const eq = newSettings.eq_settings
        
        if (eq.low_shelf) {
          audioNodes.eqBands?.forEach((band, i) => {
            if (i === 0) {
              band.frequency.value = eq.low_shelf.freq
              band.gain.value = eq.low_shelf.gain
            }
          })
        }
        
        if (eq.high_shelf) {
          audioNodes.treble.frequency.value = eq.high_shelf.freq
          audioNodes.treble.gain.value = eq.high_shelf.gain
        }
        
        if (eq.presence) {
          audioNodes.presence.frequency.value = eq.presence.freq
          audioNodes.presence.Q.value = eq.presence.q
          audioNodes.presence.gain.value = eq.presence.gain
        }
      }

      // Apply compression
      if (newSettings.compression_ratio > 1) {
        audioNodes.compressor.ratio.value = newSettings.compression_ratio
        audioNodes.compressor.attack.value = newSettings.attack_time
        audioNodes.compressor.release.value = newSettings.release_time
      }

      // Apply stereo width
      if (newSettings.stereo_width !== 0) {
        audioNodes.stereo.pan.value = Math.tanh(newSettings.stereo_width / 20)
      }

      // Apply bass and presence boosts
      if (newSettings.bass_boost !== 0) {
        audioNodes.bass.gain.value += newSettings.bass_boost
      }

      if (newSettings.presence_boost !== 0) {
        audioNodes.presence.gain.value += newSettings.presence_boost
      }

      // Apply target loudness
      if (newSettings.target_loudness !== -6) {
        const gainValue = Math.pow(10, (newSettings.target_loudness + 6) / 20)
        audioNodes.gain.gain.value = gainValue
      }

      // Clamp all EQ band gains and check for NaN/Infinity
      if (audioNodes.eqBands && newSettings.eq_bands) {
        const bandKeys = ['32','64','125','250','500','1k','4k','8k']
        audioNodes.eqBands.forEach((band, i) => {
          let gain = newSettings.eq_bands[bandKeys[i]] ?? 0
          gain = clamp(gain, -12, 6)
          if (!isFinite(gain)) gain = 0
          band.gain.value = gain
        })
      }
      // Clamp bass boost
      let bassBoost = clamp(newSettings.bass_boost ?? 0, -12, 6)
      if (!isFinite(bassBoost)) bassBoost = 0
      if (audioNodes.bass) audioNodes.bass.gain.value = bassBoost

      // Ensure compressor/limiter is at the end of the chain (already in chain)
      // Optionally, set compressor parameters for strong limiting
      if (audioNodes.compressor) {
        audioNodes.compressor.threshold.value = -10
        audioNodes.compressor.ratio.value = 20
        audioNodes.compressor.attack.value = 0.003
        audioNodes.compressor.release.value = 0.25
      }
    } catch (error) {
      console.error('Error applying real-time effects:', error)
    }
  }, [audioNodes])

  // Play audio with Web Audio API
  const playWithWebAudio = useCallback(() => {
    if (!audioContext || !audioBuffer || !audioNodes.gain) {
      console.warn('Web Audio API not ready, falling back to HTML audio')
      if (audioRef.current) {
        audioRef.current.play()
        setIsPlaying(true)
      }
      return
    }

    try {
      // Resume audio context if suspended (required for autoplay policies)
      if (audioContext.state === 'suspended') {
        audioContext.resume()
      }

      // Stop any existing source
      if (audioSource) {
        audioSource.stop()
      }

      // Create new source
      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioNodes.gain)
      setAudioSource(source)

      source.start(0)
      setIsPlaying(true)

      source.onended = () => {
        setIsPlaying(false)
        setAudioSource(null)
      }
    } catch (error) {
      console.error('Web Audio API playback failed:', error)
      // Fallback to HTML audio
      if (audioRef.current) {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }, [audioContext, audioBuffer, audioNodes.gain, audioSource])

  // Stop audio
  const stopWebAudio = useCallback(() => {
    if (audioSource) {
      audioSource.stop()
      setAudioSource(null)
    }
    setIsPlaying(false)
  }, [audioSource])

  // Real-time audio visualizer
  const renderVisualizer = useCallback(() => {
    if (!audioNodes.analyser || !visualizerRef.current) return

    const canvas = visualizerRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const analyser = audioNodes.analyser
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    
    const draw = () => {
      if (!isPlaying) return

      requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      ctx.fillStyle = 'rgb(0, 0, 0)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const barWidth = (canvas.width / dataArray.length) * 2.5
      let barHeight
      let x = 0

      for (let i = 0; i < dataArray.length; i++) {
        barHeight = dataArray[i] / 2

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
        gradient.addColorStop(0, '#ff4444')
        gradient.addColorStop(0.5, '#ffaa44')
        gradient.addColorStop(1, '#44ff44')

        ctx.fillStyle = gradient
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

        x += barWidth + 1
      }
    }

    draw()
  }, [audioNodes.analyser, isPlaying])

  // Start visualizer when playing
  useEffect(() => {
    if (isPlaying && audioNodes.analyser) {
      renderVisualizer()
    }
  }, [isPlaying, audioNodes.analyser, renderVisualizer])

  // Audio playback controls
  const togglePlayback = () => {
    if (isPlaying) {
      stopWebAudio()
    } else {
      // Try Web Audio API first, fallback to regular audio
      if (audioContext && audioBuffer && audioNodes.gain) {
        playWithWebAudio()
      } else {
        // Fallback to regular HTML audio
        if (audioRef.current) {
          audioRef.current.play()
          setIsPlaying(true)
        }
      }
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
    if (audioNodes.gain) {
      audioNodes.gain.gain.value = newVolume
    }
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  // Real-time mastering with Web Audio API
  const applyRealTimeMastering = useCallback(async (settingsToApply: any) => {
    try {
      // Apply effects immediately using Web Audio API
      applyRealTimeEffects(settingsToApply)
      
      // Show success indicator
      setRealTimeStatus('Applied')
      setTimeout(() => setRealTimeStatus(''), 1000)
      
    } catch (error) {
      console.error('Real-time mastering failed:', error)
      setRealTimeStatus('Failed')
      setTimeout(() => setRealTimeStatus(''), 3000)
    }
  }, [applyRealTimeEffects])

  // Debounced real-time mastering with shorter delay
  const debouncedRealTimeMastering = useCallback(
    debounce((settingsToApply: any) => {
      applyRealTimeMastering(settingsToApply)
    }, 50), // Ultra-fast 50ms delay for immediate response
    [applyRealTimeMastering]
  )

  // Settings management with immediate Web Audio API effects
  const updateSettings = useCallback((newSettings: Partial<LocalSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    
    // Apply real-time effects immediately if enabled
    if (isProcessing) {
      // Apply effects instantly using Web Audio API
      applyRealTimeEffects(updatedSettings)
      
      // Also trigger server processing for final mastering
      debouncedRealTimeMastering(updatedSettings)
    }
  }, [settings, isProcessing, applyRealTimeEffects, debouncedRealTimeMastering])

  // Reference audio upload
  const onReferenceAudioDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setReferenceAudio(file)
    
    try {
      // For now, just enable reference audio without uploading
      updateSettings({ reference_audio_enabled: true })
      console.log('Reference audio enabled (upload not implemented)')
    } catch (error) {
      console.error('Error enabling reference audio:', error)
    }
  }, [updateSettings])

  const { getRootProps: getReferenceRootProps, getInputProps: getReferenceInputProps } = useDropzone({
    onDrop: onReferenceAudioDrop,
    accept: { 'audio/*': ['.mp3', '.wav', '.ogg', '.m4a', '.flac'] },
    maxFiles: 1
  })

  // Poll for mastering status if still processing
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPolling && audioFile.id) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/audio/${audioFile.id}/status`);
          const data = await res.json();
          if (data?.data?.mastered_path) {
            setAudioFile((prev: any) => ({ ...prev, mastered_path: data.data.mastered_path }));
            setIsPolling(false);
          }
          if (data?.data?.error_message) {
            setMasteringError(data.data.error_message);
            setIsPolling(false);
          }
        } catch (err) {
          setMasteringError('Failed to check mastering status.');
          setIsPolling(false);
        }
      }, 5000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isPolling, audioFile.id]);

  // Update executeMastering to handle errors and start polling
  const executeMastering = async () => {
    setIsProcessing(true);
    setMasteringError(null);
    try {
      const response = await audioApi.applyAdvancedMastering(audioFile.id, toMasteringSettings(settings));
      setProcessingResults(response.data || response);
      setShowBreakdown(true);
      // If no mastered_path, start polling
      if (!(response.data?.mastered_path || response.mastered_path)) {
        setIsPolling(true);
      } else {
        setIsPolling(false);
      }
    } catch (error: any) {
      setMasteringError(error?.response?.data?.message || 'Mastering failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download mastered audio
  const downloadMastered = async () => {
    if (!getMasteredPath(audioFile)) {
      console.error('No mastered path available:', audioFile)
      return
    }
    
    try {
      console.log('Starting download for file:', audioFile.id)
      console.log('Mastered path:', getMasteredPath(audioFile))
      
      // Try the regular download endpoint first
      try {
        const blob = await audioApi.downloadAudio(audioFile.id, 'wav')
        console.log('Download response blob:', blob)
        
        if (!blob || blob.size === 0) {
          throw new Error('Download returned empty or invalid file')
        }
        
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `mastered_${audioFile.original_filename}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        console.log('Download completed successfully')
        return
      } catch (downloadError) {
        console.warn('Regular download failed, trying test endpoint:', downloadError)
        
        // Fallback to test download endpoint
        const testUrl = `http://localhost:8000/api/test-download/${getMasteredPath(audioFile)}`
        const response = await fetch(testUrl, {
          method: 'GET',
          credentials: 'include',
        })
        
        if (!response.ok) {
          throw new Error(`Test download failed: ${response.status} ${response.statusText}`)
        }
        
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `mastered_${audioFile.original_filename}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        console.log('Download completed successfully via test endpoint')
      }
    } catch (error: any) {
      console.error('Download failed:', error)
      console.error('Error details:', error.response?.data || error.message)
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Error/Status Handling */}
        {masteringError && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{masteringError}</div>
        )}
        {isPolling && !masteringError && (
          <div className="mb-4 p-4 bg-yellow-100 text-yellow-700 rounded">Mastering in progress... (This may take a few minutes)</div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Custom Mastering</h1>
            <p className="text-gray-400">{audioFile.original_filename}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => window.history.back()}>
              Back
            </Button>
            <Button onClick={downloadMastered} disabled={!getMasteredPath(audioFile)}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Playback Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Playback Controls */}
            <Card className="bg-gray-800/60 border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Play className="text-red-400" />
                  Playback Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Audio Players (Hidden) */}
                <audio
                  ref={audioRef}
                  src={originalAudioUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  style={{ display: 'none' }}
                />
                <audio
                  ref={masteredAudioRef}
                  src={masteredAudioUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  style={{ display: 'none' }}
                />

                {/* Play/Pause Button */}
                <Button 
                  onClick={togglePlayback} 
                  className="w-full"
                  disabled={!originalAudioUrl}
                >
                  {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>{Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}</span>
                    <span>{Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Volume Control */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Volume</span>
                  </div>
                  <Slider
                    value={[volume]}
                    onValueChange={([value]) => handleVolumeChange(value)}
                    min={0}
                    max={1}
                    step={0.01}
                    className="w-full"
                  />
                </div>

                {/* Real-time Audio Visualizer */}
                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400">Real-time Effects</span>
                    </div>
                    <canvas
                      ref={visualizerRef}
                      width={300}
                      height={60}
                      className="w-full h-15 bg-black rounded border border-gray-600"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Real-time Processing Toggle */}
            <Card className="bg-gray-800/60 border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="text-red-400" />
                  Real-time Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Enable real-time changes</span>
                    <Switch
                      checked={isProcessing}
                      onCheckedChange={setIsProcessing}
                    />
                  </div>
                  
                  {isProcessing && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Web Audio API (Instant)</span>
                        <Badge className="bg-green-500 text-white">
                          {audioContext ? 'Ready' : 'Loading...'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Server Processing (Final)</span>
                        <Badge className="bg-blue-500 text-white">
                          Cached
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-gray-500">
                        Changes are applied instantly using Web Audio API. Server processing creates the final mastered file.
                      </p>
                    </>
                  )}
                  
                  {/* Real-time Status Indicator */}
                  {realTimeStatus && (
                    <div className="mt-4">
                      <Badge className={`${realTimeStatus === 'Applied' ? 'bg-green-500' : realTimeStatus === 'Failed' ? 'bg-red-500' : 'bg-gray-500'} text-white`}>
                        {realTimeStatus === 'Applied' ? '✓ Applied' : realTimeStatus === 'Failed' ? '✗ Failed' : realTimeStatus}
                      </Badge>
                    </div>
                  )}

                  {/* Debug Information */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-4 p-3 bg-gray-900 rounded text-xs">
                      <div className="text-gray-400 mb-2">Debug Info:</div>
                      <div>Audio Context: {audioContext ? 'Ready' : 'Not Ready'}</div>
                      <div>Audio Buffer: {audioBuffer ? 'Loaded' : 'Not Loaded'}</div>
                      <div>Audio Nodes: {audioNodes.gain ? 'Connected' : 'Not Connected'}</div>
                      <div>Audio Source: {audioSource ? 'Active' : 'Inactive'}</div>
                      <div>Context State: {audioContext?.state || 'Unknown'}</div>
                      <div>Original URL: {originalAudioUrl ? 'Set' : 'Not Set'}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Mastering Controls */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gray-800/60 border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white">Crysgarage Studio 1</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* EQ Section */}
                <EQSection
                  bands={[
                    settings.eq_bands['32'] ?? 0,
                    settings.eq_bands['64'] ?? 0,
                    settings.eq_bands['125'] ?? 0,
                    settings.eq_bands['250'] ?? 0,
                    settings.eq_bands['500'] ?? 0,
                    settings.eq_bands['1k'] ?? 0,
                    settings.eq_bands['4k'] ?? 0,
                    settings.eq_bands['8k'] ?? 0,
                  ]}
                  onBandChange={(i, value) => {
                    const freqs = ['32','64','125','250','500','1k','4k','8k']
                    const newSettings = {
                      ...settings,
                      eq_bands: { ...settings.eq_bands, [freqs[i]]: value }
                    };
                    setSettings(newSettings);
                    applyRealTimeEffects(newSettings);
                  }}
                  knobs={[
                    Math.round((settings.target_loudness + 20) * 5),
                    Math.round((settings.eq_settings.presence.gain + 12) * 4.16),
                    Math.round((settings.bass_boost + 12) * 4.16),
                  ]}
                  onKnobChange={(i, value) => {
                    let newSettings = { ...settings };
                    if (i === 0) newSettings = { ...newSettings, target_loudness: value / 5 - 20 };
                    if (i === 1) newSettings = {
                      ...newSettings,
                      eq_settings: { ...newSettings.eq_settings, presence: { ...newSettings.eq_settings.presence, gain: value / 4.16 - 12 } }
                    };
                    if (i === 2) newSettings = { ...newSettings, bass_boost: value / 4.16 - 12 };
                    setSettings(newSettings);
                    applyRealTimeEffects(newSettings);
                  }}
                  toggles={[
                    settings.bass_boost > 0,
                    settings.stereo_width > 0,
                    settings.stereo_width > 0,
                    settings.target_loudness !== -14,
                  ]}
                  onToggle={(i, checked) => {
                    let newSettings = { ...settings };
                    if (i === 0) newSettings = { ...newSettings, bass_boost: checked ? 6 : 0 };
                    if (i === 1) newSettings = { ...newSettings, stereo_width: checked ? 10 : 0 };
                    if (i === 2) newSettings = { ...newSettings, stereo_width: checked ? 10 : 0 };
                    if (i === 3) newSettings = { ...newSettings, target_loudness: checked ? -6 : -14 };
                    setSettings(newSettings);
                    applyRealTimeEffects(newSettings);
                  }}
                />
                {/* Compressor Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Compressor</CardTitle>
                    <Switch
                      checked={settings.compression_ratio > 1}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateSettings({ compression_ratio: 4 })
                        } else {
                          updateSettings({ compression_ratio: 1 })
                        }
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-white">Threshold: {settings.compression_ratio} dB</Label>
                      <Slider
                        value={[settings.compression_ratio]}
                        onValueChange={([value]) => updateSettings({ compression_ratio: value })}
                        min={-60}
                        max={0}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Ratio: {settings.compression_ratio}:1</Label>
                      <Slider
                        value={[settings.compression_ratio]}
                        onValueChange={([value]) => updateSettings({ compression_ratio: value })}
                        min={1}
                        max={20}
                        step={0.5}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Attack: {settings.attack_time} ms</Label>
                      <Slider
                        value={[settings.attack_time * 1000]}
                        onValueChange={([value]) => updateSettings({ attack_time: value / 1000 })}
                        min={0.1}
                        max={100}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Release: {settings.release_time * 1000} ms</Label>
                      <Slider
                        value={[settings.release_time * 1000]}
                        onValueChange={([value]) => updateSettings({ release_time: value / 1000 })}
                        min={10}
                        max={1000}
                        step={10}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
                {/* Stereo Width Section */}
                <div className="space-y-4">
                  <CardTitle className="text-white">Stereo Width</CardTitle>
                  <div className="space-y-2">
                    <Label className="text-white">Stereo Width: {settings.stereo_width}%</Label>
                    <Slider
                      value={[settings.stereo_width]}
                      onValueChange={([value]) => updateSettings({ stereo_width: value })}
                      min={-20}
                      max={20}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
                {/* Target Loudness Section */}
                <div className="space-y-4">
                  <CardTitle className="text-white">Target Loudness</CardTitle>
                  <div className="space-y-2">
                    <Label className="text-white">Target Loudness</Label>
                    <Slider
                      value={[settings.target_loudness]}
                      onValueChange={([value]) => setSettings({...settings, target_loudness: value})}
                      min={-20}
                      max={-3}
                      step={0.5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>-20 dB</span>
                      <span className="text-white font-medium">{settings.target_loudness} dB</span>
                      <span>-3 dB</span>
                    </div>
                  </div>
                </div>
                {/* Limiter Section */}
                <div className="space-y-4">
                  <CardTitle className="text-white">Limiter</CardTitle>
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Enable Limiter</Label>
                    <Switch
                      checked={settings.limiter_enabled}
                      onCheckedChange={(checked) => updateSettings({ limiter_enabled: checked })}
                    />
                  </div>
                  {settings.limiter_enabled && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-white">Threshold: {settings.limiter_threshold} dB</Label>
                        <Slider
                          value={[settings.limiter_threshold]}
                          onValueChange={([value]) => updateSettings({ limiter_threshold: value })}
                          min={-30}
                          max={0}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Release: {settings.limiter_release} ms</Label>
                        <Slider
                          value={[settings.limiter_release]}
                          onValueChange={([value]) => updateSettings({ limiter_release: value })}
                          min={5}
                          max={1000}
                          step={5}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Ceiling: {settings.limiter_ceiling} dB</Label>
                        <Slider
                          value={[settings.limiter_ceiling]}
                          onValueChange={([value]) => updateSettings({ limiter_ceiling: value })}
                          min={-3}
                          max={0}
                          step={0.01}
                          className="w-full"
                        />
                      </div>
                    </>
                  )}
                </div>
                {/* Reference Audio Toggle */}
                <div className="space-y-4">
                  <Label className="text-white">Specify Reference Audio By Myself</Label>
                  <Switch
                    checked={settings.reference_audio_enabled}
                    onCheckedChange={(checked) => updateSettings({ reference_audio_enabled: checked })}
                  />
                  {settings.reference_audio_enabled && (
                    <div {...getReferenceRootProps()} className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-red-500 transition-colors">
                      <input {...getReferenceInputProps()} />
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-400">{referenceAudio ? referenceAudio.name : 'Drop reference audio here or click to select'}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Spectrum Visualizer and Real-time Report at Bottom */}
            <div className="space-y-6">
              {/* Frequency Spectrum Visualizer */}
              {/* <Card className="bg-gray-800/60 border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="text-blue-400" />
                    Frequency Spectrum
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AudioVisualizer 
                    audioUrl={masteredAudioUrl}
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    duration={duration}
                  />
                </CardContent>
              </Card> */}
              
              {/* Real-time Report */}
              <Card className="bg-gray-800/60 border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Eye className="text-green-400" />
                    Real-time Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MasteringReport 
                    audioFile={audioFile}
                    processingResults={processingResults}
                    onDownload={downloadMastered}
                    realTime
                  />
                </CardContent>
              </Card>
            </div>
            
            {/* Execute Button */}
            <Card className="bg-gray-800/60 border-gray-700/50">
              <CardContent className="pt-6">
                <Button 
                  onClick={executeMastering} 
                  disabled={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Settings className="w-4 h-4 mr-2" />
                      Execute Mastering
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Processing Breakdown */}
        {showBreakdown && processingResults && (
          <div className="mt-8">
            <ProcessingBreakdown results={processingResults} />
          </div>
        )}

        {/* After mastering completes, show the DownloadDropdown */}
        {getMasteredPath(audioFile) && (
          <div className="mt-4">
            <DownloadDropdown audioId={audioFile.id} originalFilename={audioFile.original_filename} />
          </div>
        )}
      </div>
    </div>
  )
} 
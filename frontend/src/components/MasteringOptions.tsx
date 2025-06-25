export interface MasteringSettings {
  // AI Mastering Settings
  target_loudness: number
  target_loudness_enabled: boolean
  genre_preset: string
  processing_quality: 'fast' | 'standard' | 'high'
  
  // Post-Processing
  stereo_width: number
  stereo_width_enabled: boolean
  bass_boost: number
  presence_boost: number
  boost_enabled: boolean
  
  // Advanced Settings
  dynamic_range: 'compressed' | 'natural' | 'expanded'
  high_freq_enhancement: boolean
  low_freq_enhancement: boolean
  noise_reduction: boolean
} 
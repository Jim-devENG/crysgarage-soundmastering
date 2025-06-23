'use client'

import { useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface MasteringOptionsProps {
  onApply: (settings: MasteringSettings) => void
  loading?: boolean
}

export interface MasteringSettings {
  // AI Mastering Settings
  target_loudness: number
  genre_preset: string
  processing_quality: 'fast' | 'standard' | 'high'
  
  // Post-Processing
  stereo_width: number
  bass_boost: number
  presence_boost: number
  
  // Advanced Settings
  dynamic_range: 'compressed' | 'natural' | 'expanded'
  high_freq_enhancement: boolean
  low_freq_enhancement: boolean
  noise_reduction: boolean
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

const QUALITY_OPTIONS = [
  { value: 'fast', label: 'Fast', description: 'Quick processing, good quality' },
  { value: 'standard', label: 'Standard', description: 'Balanced speed and quality' },
  { value: 'high', label: 'High Quality', description: 'Best quality, slower processing' },
]

export default function MasteringOptions({ onApply, loading = false }: MasteringOptionsProps) {
  const [settings, setSettings] = useState<MasteringSettings>({
    target_loudness: -14,
    genre_preset: 'pop',
    processing_quality: 'standard',
    stereo_width: 0,
    bass_boost: 0,
    presence_boost: 0,
    dynamic_range: 'natural',
    high_freq_enhancement: false,
    low_freq_enhancement: false,
    noise_reduction: false,
  })

  const handleSettingChange = (key: keyof MasteringSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleApply = () => {
    onApply(settings)
  }

  return (
    <div className="space-y-6">
      {/* AI Mastering Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI Mastering Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Target Loudness */}
          <div className="space-y-2">
            <Label>Target Loudness: {settings.target_loudness} dB</Label>
            <Slider
              value={[settings.target_loudness]}
              onValueChange={([value]) => handleSettingChange('target_loudness', value)}
              min={-20}
              max={-8}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>-20 dB (Dynamic)</span>
              <span>-14 dB (Standard)</span>
              <span>-8 dB (Loud)</span>
            </div>
          </div>

          {/* Genre Preset */}
          <div className="space-y-2">
            <Label>Genre Preset</Label>
            <Select value={settings.genre_preset} onValueChange={(value) => handleSettingChange('genre_preset', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GENRE_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    <div>
                      <div className="font-medium">{preset.label}</div>
                      <div className="text-xs text-gray-500">{preset.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Processing Quality */}
          <div className="space-y-2">
            <Label>Processing Quality</Label>
            <Select value={settings.processing_quality} onValueChange={(value) => handleSettingChange('processing_quality', value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUALITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Post-Processing Enhancements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Post-Processing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stereo Width */}
          <div className="space-y-2">
            <Label>Stereo Width: {settings.stereo_width}%</Label>
            <Slider
              value={[settings.stereo_width]}
              onValueChange={([value]) => handleSettingChange('stereo_width', value)}
              min={-20}
              max={20}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Narrower</span>
              <span>Natural</span>
              <span>Wider</span>
            </div>
          </div>

          {/* Bass Boost */}
          <div className="space-y-2">
            <Label>Bass Enhancement: {settings.bass_boost} dB</Label>
            <Slider
              value={[settings.bass_boost]}
              onValueChange={([value]) => handleSettingChange('bass_boost', value)}
              min={-3}
              max={6}
              step={0.5}
              className="w-full"
            />
          </div>

          {/* Presence Boost */}
          <div className="space-y-2">
            <Label>Presence Enhancement: {settings.presence_boost} dB</Label>
            <Slider
              value={[settings.presence_boost]}
              onValueChange={([value]) => handleSettingChange('presence_boost', value)}
              min={-3}
              max={6}
              step={0.5}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Advanced Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dynamic Range */}
          <div className="space-y-2">
            <Label>Dynamic Range</Label>
            <Select value={settings.dynamic_range} onValueChange={(value) => handleSettingChange('dynamic_range', value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compressed">Compressed (Radio-ready)</SelectItem>
                <SelectItem value="natural">Natural (Preserve dynamics)</SelectItem>
                <SelectItem value="expanded">Expanded (More dynamic)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Enhancement Switches */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="high-freq">High Frequency Enhancement</Label>
              <Switch
                id="high-freq"
                checked={settings.high_freq_enhancement}
                onCheckedChange={(checked) => handleSettingChange('high_freq_enhancement', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="low-freq">Low Frequency Enhancement</Label>
              <Switch
                id="low-freq"
                checked={settings.low_freq_enhancement}
                onCheckedChange={(checked) => handleSettingChange('low_freq_enhancement', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="noise-reduction">Noise Reduction</Label>
              <Switch
                id="noise-reduction"
                checked={settings.noise_reduction}
                onCheckedChange={(checked) => handleSettingChange('noise_reduction', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Apply Button */}
      <Button 
        onClick={handleApply} 
        disabled={loading}
        className="w-full"
        size="lg"
      >
        {loading ? 'Processing...' : 'Apply Mastering Settings'}
      </Button>
    </div>
  )
} 
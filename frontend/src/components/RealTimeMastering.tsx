'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Settings, RotateCcw, Download } from 'lucide-react'
import AudioComparison from './AudioComparison'

interface MasteringSettings {
  genre_preset: string
  processing_quality: string
  target_loudness: number
  compression_ratio: number
  eq_settings: {
    bass: number
    low_mid: number
    mid: number
    high_mid: number
    treble: number
  }
}

interface RealTimeMasteringProps {
  audioFileId: string
  originalUrl: string
  masteredUrl: string
  onSettingsChange: (settings: MasteringSettings) => void
  onApplyMastering: (settings: MasteringSettings) => Promise<void>
}

const defaultSettings: MasteringSettings = {
  genre_preset: 'pop',
  processing_quality: 'standard',
  target_loudness: -10,
  compression_ratio: 8,
  eq_settings: {
    bass: 3,
    low_mid: 1,
    mid: 1,
    high_mid: 2,
    treble: 2
  }
}

export default function RealTimeMastering({
  audioFileId,
  originalUrl,
  masteredUrl,
  onSettingsChange,
  onApplyMastering
}: RealTimeMasteringProps) {
  const [settings, setSettings] = useState<MasteringSettings>(defaultSettings)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false)

  const updateSettings = (newSettings: Partial<MasteringSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    onSettingsChange(updatedSettings)
    
    if (isRealTimeEnabled) {
      // Apply settings with debounce
      setTimeout(() => {
        applyMastering(updatedSettings)
      }, 1000)
    }
  }

  const applyMastering = async (settingsToApply: MasteringSettings = settings) => {
    setIsProcessing(true)
    try {
      const token = localStorage.getItem('token')
      const endpoint = isRealTimeEnabled ? 'realtime-mastering' : 'mastering'
      
      const response = await fetch(`/api/audio/${audioFileId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mastering_settings: settingsToApply })
      })

      if (!response.ok) {
        throw new Error('Failed to apply mastering')
      }

      const result = await response.json()
      console.log('Mastering result:', result)
      
      // Call the callback to update the parent component
      await onApplyMastering(settingsToApply)
    } catch (error) {
      console.error('Mastering failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    onSettingsChange(defaultSettings)
  }

  return (
    <div className="space-y-6">
      <AudioComparison
        originalUrl={originalUrl}
        masteredUrl={masteredUrl}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Real-time Mastering</span>
            <div className="flex items-center gap-2">
              <span className="text-sm">Real-time</span>
              <Switch
                checked={isRealTimeEnabled}
                onCheckedChange={setIsRealTimeEnabled}
              />
              {isProcessing && (
                <span className="text-sm text-muted-foreground">Processing...</span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Genre</label>
              <Select
                value={settings.genre_preset}
                onValueChange={(value) => updateSettings({ genre_preset: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pop">Pop</SelectItem>
                  <SelectItem value="rock">Rock</SelectItem>
                  <SelectItem value="electronic">Electronic</SelectItem>
                  <SelectItem value="jazz">Jazz</SelectItem>
                  <SelectItem value="classical">Classical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Quality</label>
              <Select
                value={settings.processing_quality}
                onValueChange={(value) => updateSettings({ processing_quality: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fast">Fast</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high">High Quality</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Target Loudness: {settings.target_loudness} dB
            </label>
            <Slider
              value={[settings.target_loudness]}
              onValueChange={([value]) => updateSettings({ target_loudness: value })}
              min={-20}
              max={-8}
              step={0.5}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Compression Ratio: {settings.compression_ratio}:1
            </label>
            <Slider
              value={[settings.compression_ratio]}
              onValueChange={([value]) => updateSettings({ compression_ratio: value })}
              min={1}
              max={30}
              step={0.5}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Equalizer</h3>
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(settings.eq_settings).map(([band, value]) => (
                <div key={band} className="space-y-2">
                  <label className="text-sm font-medium capitalize">
                    {band.replace('_', ' ')}: {value}dB
                  </label>
                  <Slider
                    value={[value]}
                    onValueChange={([newValue]) => 
                      updateSettings({
                        eq_settings: {
                          ...settings.eq_settings,
                          [band]: newValue
                        }
                      })
                    }
                    min={-18}
                    max={18}
                    step={0.5}
                    orientation="vertical"
                    className="h-32"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={resetSettings}
                disabled={isProcessing}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              
              <Button
                onClick={() => applyMastering()}
                disabled={isProcessing || isRealTimeEnabled}
              >
                <Settings className="h-4 w-4 mr-2" />
                Apply Mastering
              </Button>
            </div>
            
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
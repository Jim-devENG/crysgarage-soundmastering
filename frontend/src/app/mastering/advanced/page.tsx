'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Crown, 
  Music, 
  Upload, 
  Download, 
  Settings,
  Headphones,
  Play,
  Pause,
  Volume2,
  Zap,
  Target,
  Sparkles
} from 'lucide-react'
// import AudioUploader from '@/components/AudioUploader'

interface MasteringSettings {
  genre: string
  quality: string
  dynamicRange: number
  highFreqEnhancement: boolean
  lowFreqEnhancement: boolean
  noiseReduction: boolean
  autoMastering: boolean
  boostLevel: number
  stereoWidth: number
  compression: number
  limiting: number
  // New EQ Settings
  lowShelfFreq: number
  lowShelfGain: number
  highShelfFreq: number
  highShelfGain: number
  presenceFreq: number
  presenceGain: number
  presenceQ: number
}

export default function AdvancedStudio() {
  const [testSwitch, setTestSwitch] = useState(false)
  const [sliderValue, setSliderValue] = useState([50])
  const [masteringSettings, setMasteringSettings] = useState<MasteringSettings>({
    genre: 'pop',
    quality: 'high',
    dynamicRange: 12,
    highFreqEnhancement: true,
    lowFreqEnhancement: true,
    noiseReduction: false,
    autoMastering: true,
    boostLevel: 3,
    stereoWidth: 120,
    compression: 4,
    limiting: 0.1,
    // New EQ Settings
    lowShelfFreq: 80,
    lowShelfGain: 15,
    highShelfFreq: 8000,
    highShelfGain: 12,
    presenceFreq: 2500,
    presenceGain: 12,
    presenceQ: 1
  })

  const updateSetting = (key: keyof MasteringSettings, value: any) => {
    setMasteringSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Crown className="text-purple-400 w-8 h-8 mr-3" />
            <h1 className="text-4xl font-bold text-white">Advanced Studio</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Professional mastering suite with full control and batch processing.
          </p>
          <Badge className="mt-4 bg-purple-600 text-white">
            <Crown className="w-4 h-4 mr-2" />
            Professional Tier
          </Badge>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="upload" className="data-[state=active]:bg-purple-600">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-purple-600">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="processing" className="data-[state=active]:bg-purple-600">
              <Play className="w-4 h-4 mr-2" />
              Processing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Music className="w-5 h-5 mr-2" />
                  Upload Audio Files
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Upload your audio files for professional mastering
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">AudioUploader temporarily disabled for testing</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Headphones className="w-5 h-5 mr-2" />
                  Mastering Settings
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Configure your mastering parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Genre & Quality Presets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white text-sm font-medium">Genre</label>
                    <Select value={masteringSettings.genre} onValueChange={(value) => updateSetting('genre', value)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pop">Pop</SelectItem>
                        <SelectItem value="rock">Rock</SelectItem>
                        <SelectItem value="hiphop">Hip Hop</SelectItem>
                        <SelectItem value="electronic">Electronic</SelectItem>
                        <SelectItem value="jazz">Jazz</SelectItem>
                        <SelectItem value="classical">Classical</SelectItem>
                        <SelectItem value="afrobeats">Afrobeats</SelectItem>
                        <SelectItem value="reggae">Reggae</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-white text-sm font-medium">Quality</label>
                    <Select value={masteringSettings.quality} onValueChange={(value) => updateSetting('quality', value)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Dynamic Range */}
                <div>
                  <label className="text-white text-sm font-medium">Dynamic Range: {masteringSettings.dynamicRange}dB</label>
                  <Slider
                    value={[masteringSettings.dynamicRange]}
                    onValueChange={(value) => updateSetting('dynamicRange', value[0])}
                    max={20}
                    min={6}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* NEW: Detailed EQ Controls */}
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg">EQ Settings</h3>
                  
                  {/* Low Shelf EQ */}
                  <div className="space-y-2">
                    <label className="text-white text-sm font-medium">Low Shelf: {masteringSettings.lowShelfFreq}Hz, {masteringSettings.lowShelfGain}dB</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-gray-400 text-xs">Frequency (Hz)</label>
                        <Slider
                          value={[masteringSettings.lowShelfFreq]}
                          onValueChange={(value) => updateSetting('lowShelfFreq', value[0])}
                          max={200}
                          min={20}
                          step={5}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400 text-xs">Gain (dB)</label>
                        <Slider
                          value={[masteringSettings.lowShelfGain]}
                          onValueChange={(value) => updateSetting('lowShelfGain', value[0])}
                          max={20}
                          min={-10}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* High Shelf EQ */}
                  <div className="space-y-2">
                    <label className="text-white text-sm font-medium">High Shelf: {masteringSettings.highShelfFreq}Hz, {masteringSettings.highShelfGain}dB</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-gray-400 text-xs">Frequency (Hz)</label>
                        <Slider
                          value={[masteringSettings.highShelfFreq]}
                          onValueChange={(value) => updateSetting('highShelfFreq', value[0])}
                          max={20000}
                          min={2000}
                          step={100}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400 text-xs">Gain (dB)</label>
                        <Slider
                          value={[masteringSettings.highShelfGain]}
                          onValueChange={(value) => updateSetting('highShelfGain', value[0])}
                          max={20}
                          min={-10}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Presence EQ */}
                  <div className="space-y-2">
                    <label className="text-white text-sm font-medium">Presence: {masteringSettings.presenceFreq}Hz, {masteringSettings.presenceGain}dB, Q={masteringSettings.presenceQ}</label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-gray-400 text-xs">Frequency (Hz)</label>
                        <Slider
                          value={[masteringSettings.presenceFreq]}
                          onValueChange={(value) => updateSetting('presenceFreq', value[0])}
                          max={5000}
                          min={500}
                          step={50}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400 text-xs">Gain (dB)</label>
                        <Slider
                          value={[masteringSettings.presenceGain]}
                          onValueChange={(value) => updateSetting('presenceGain', value[0])}
                          max={20}
                          min={-10}
                          step={1}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400 text-xs">Q Factor</label>
                        <Slider
                          value={[masteringSettings.presenceQ]}
                          onValueChange={(value) => updateSetting('presenceQ', value[0])}
                          max={3}
                          min={0.1}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhancement Toggles */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">High Frequency Enhancement</span>
                    <Switch
                      checked={masteringSettings.highFreqEnhancement}
                      onCheckedChange={(checked) => updateSetting('highFreqEnhancement', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">Low Frequency Enhancement</span>
                    <Switch
                      checked={masteringSettings.lowFreqEnhancement}
                      onCheckedChange={(checked) => updateSetting('lowFreqEnhancement', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">Noise Reduction</span>
                    <Switch
                      checked={masteringSettings.noiseReduction}
                      onCheckedChange={(checked) => updateSetting('noiseReduction', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">Auto Mastering</span>
                    <Switch
                      checked={masteringSettings.autoMastering}
                      onCheckedChange={(checked) => updateSetting('autoMastering', checked)}
                    />
                  </div>
                </div>

                {/* Advanced Controls */}
                <div className="space-y-4">
                  <div>
                    <label className="text-white text-sm font-medium">Boost Level: {masteringSettings.boostLevel}dB</label>
                    <Slider
                      value={[masteringSettings.boostLevel]}
                      onValueChange={(value) => updateSetting('boostLevel', value[0])}
                      max={6}
                      min={0}
                      step={0.5}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-white text-sm font-medium">Stereo Width: {masteringSettings.stereoWidth}%</label>
                    <Slider
                      value={[masteringSettings.stereoWidth]}
                      onValueChange={(value) => updateSetting('stereoWidth', value[0])}
                      max={150}
                      min={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-white text-sm font-medium">Compression: {masteringSettings.compression}:1</label>
                    <Slider
                      value={[masteringSettings.compression]}
                      onValueChange={(value) => updateSetting('compression', value[0])}
                      max={10}
                      min={1}
                      step={0.5}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-white text-sm font-medium">Limiting: {masteringSettings.limiting}dB</label>
                    <Slider
                      value={[masteringSettings.limiting]}
                      onValueChange={(value) => updateSetting('limiting', value[0])}
                      max={0}
                      min={-3}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="processing">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Processing
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Start the mastering process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Upload files first to start processing</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 
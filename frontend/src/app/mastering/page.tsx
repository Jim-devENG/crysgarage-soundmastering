'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Sparkles, 
  Music, 
  Play, 
  Upload, 
  Download, 
  Star, 
  Zap,
  Crown,
  Headphones,
  Mic,
  Video,
  Lock,
  Check,
  X
} from 'lucide-react'

export default function MasteringPage() {
  const masteringTiers = [
    {
      name: "Free Automatic",
      description: "Perfect for trying out our mastering service",
      features: [
        "Basic mastering processing",
        "MP3 download format",
        "Standard quality output",
        "1 track per session",
        "24-hour processing time"
      ],
      limitations: [
        "No custom settings",
        "Limited to 5MB file size",
        "No WAV/FLAC export",
        "No batch processing"
      ],
      icon: Music,
      color: "bg-blue-600",
      badge: "Free",
      link: "/mastering/free-automatic",
      popular: false
    },
    {
      name: "Automatic",
      description: "Professional mastering with smart presets",
      features: [
        "Advanced mastering algorithms",
        "Multiple format exports (WAV, MP3, FLAC)",
        "Genre-specific presets",
        "Up to 50MB file size",
        "2-hour processing time",
        "Custom EQ adjustments",
        "Stereo enhancement"
      ],
      limitations: [
        "Limited custom settings",
        "No batch processing",
        "Standard support"
      ],
      icon: Sparkles,
      color: "bg-green-600",
      badge: "Popular",
      link: "/mastering/automatic",
      popular: true
    },
    {
      name: "Advanced",
      description: "Full control with professional tools",
      features: [
        "Complete mastering suite",
        "Unlimited file sizes",
        "Real-time processing",
        "Batch processing (up to 10 files)",
        "Custom mastering profiles",
        "Advanced EQ and compression",
        "Multi-band processing",
        "Reference track comparison",
        "Priority support"
      ],
      limitations: [
        "Requires mastering knowledge",
        "Higher learning curve"
      ],
      icon: Crown,
      color: "bg-purple-600",
      badge: "Pro",
      link: "/mastering/advanced",
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="text-red-400 w-8 h-8 mr-3" />
            <h1 className="text-4xl font-bold text-white">Choose Your Mastering Studio</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Select the perfect mastering tier for your needs. From free trials to professional tools.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {masteringTiers.map((tier, index) => (
            <Card 
              key={index} 
              className={`relative bg-gray-800/50 border-gray-700 transition-all duration-300 hover:shadow-lg ${
                tier.popular 
                  ? 'border-green-500/50 shadow-lg shadow-green-500/20 scale-105' 
                  : 'hover:border-red-500/30'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-green-600 text-white px-4 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    {tier.badge}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className={`w-16 h-16 ${tier.color} rounded-lg flex items-center justify-center`}>
                    <tier.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-white text-2xl">{tier.name}</CardTitle>
                <CardDescription className="text-gray-400">
                  {tier.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-white font-semibold flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-400" />
                    What's Included
                  </h4>
                  <ul className="space-y-2">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-gray-300 text-sm">
                        <Check className="w-4 h-4 mr-2 text-green-400 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {tier.limitations.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-white font-semibold flex items-center">
                      <X className="w-4 h-4 mr-2 text-red-400" />
                      Limitations
                    </h4>
                    <ul className="space-y-2">
                      {tier.limitations.map((limitation, limitationIndex) => (
                        <li key={limitationIndex} className="flex items-center text-gray-400 text-sm">
                          <X className="w-4 h-4 mr-2 text-red-400 flex-shrink-0" />
                          {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Link href={tier.link}>
                  <Button 
                    className={`w-full ${
                      tier.popular 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    } text-white`}
                  >
                    {tier.name === "Free Automatic" ? (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start Free
                      </>
                    ) : tier.popular ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Choose {tier.name}
                      </>
                    ) : (
                      <>
                        <Crown className="w-4 h-4 mr-2" />
                        Choose {tier.name}
                      </>
                    )}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-2xl text-center">Feature Comparison</CardTitle>
            <CardDescription className="text-gray-400 text-center">
              Compare what each tier offers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-white font-semibold py-3">Feature</th>
                    <th className="text-center text-blue-400 font-semibold py-3">Free Automatic</th>
                    <th className="text-center text-green-400 font-semibold py-3">Automatic</th>
                    <th className="text-center text-purple-400 font-semibold py-3">Advanced</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  <tr className="border-b border-gray-700">
                    <td className="text-gray-300 py-3">File Size Limit</td>
                    <td className="text-center text-gray-400">5MB</td>
                    <td className="text-center text-gray-400">50MB</td>
                    <td className="text-center text-gray-400">Unlimited</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="text-gray-300 py-3">Export Formats</td>
                    <td className="text-center text-gray-400">MP3 only</td>
                    <td className="text-center text-gray-400">WAV, MP3, FLAC</td>
                    <td className="text-center text-gray-400">All formats</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="text-gray-300 py-3">Processing Time</td>
                    <td className="text-center text-gray-400">24 hours</td>
                    <td className="text-center text-gray-400">2 hours</td>
                    <td className="text-center text-gray-400">Real-time</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="text-gray-300 py-3">Custom Settings</td>
                    <td className="text-center text-red-400">✗</td>
                    <td className="text-center text-green-400">✓</td>
                    <td className="text-center text-green-400">✓</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="text-gray-300 py-3">Batch Processing</td>
                    <td className="text-center text-red-400">✗</td>
                    <td className="text-center text-red-400">✗</td>
                    <td className="text-center text-green-400">✓</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="text-gray-300 py-3">Support</td>
                    <td className="text-center text-gray-400">Community</td>
                    <td className="text-center text-gray-400">Email</td>
                    <td className="text-center text-gray-400">Priority</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
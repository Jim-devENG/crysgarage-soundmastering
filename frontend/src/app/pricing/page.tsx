'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Check, Sparkles, Music, Crown, Zap, Star } from 'lucide-react'

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for hobbyists and beginners',
      price: isAnnual ? 9 : 12,
      originalPrice: isAnnual ? 144 : 12,
      features: [
        '5 AI mastering sessions per month',
        'Basic mastering presets',
        'WAV and MP3 downloads',
        'Email support',
        'Standard processing time (24h)',
      ],
      icon: Music,
      popular: false,
    },
    {
      name: 'Professional',
      description: 'Ideal for musicians and content creators',
      price: isAnnual ? 29 : 39,
      originalPrice: isAnnual ? 468 : 39,
      features: [
        'Unlimited AI mastering sessions',
        'Advanced mastering presets',
        'All audio formats (WAV, MP3, FLAC)',
        'Priority email support',
        'Fast processing time (6h)',
        'Custom mastering settings',
        'Batch processing (up to 10 files)',
      ],
      icon: Sparkles,
      popular: true,
    },
    {
      name: 'Studio',
      description: 'For professional studios and labels',
      price: isAnnual ? 79 : 99,
      originalPrice: isAnnual ? 1188 : 99,
      features: [
        'Everything in Professional',
        'Unlimited batch processing',
        'Priority processing (2h)',
        'Phone and email support',
        'Custom mastering profiles',
        'Advanced audio analysis',
        'API access for integration',
        'White-label options',
      ],
      icon: Crown,
      popular: false,
    },
  ]

  const savings = (original: number, discounted: number) => {
    return Math.round(((original - discounted) / original) * 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="text-red-400 w-8 h-8 mr-3" />
            <h1 className="text-4xl font-bold text-white">Choose Your Plan</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Professional AI mastering at affordable prices. Start free and upgrade as you grow.
          </p>

          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm ${!isAnnual ? 'text-white' : 'text-gray-400'}`}>Monthly</span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-red-600"
            />
            <span className={`text-sm ${isAnnual ? 'text-white' : 'text-gray-400'}`}>
              Annual
              {isAnnual && (
                <Badge className="ml-2 bg-green-500 text-xs">Save up to 25%</Badge>
              )}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={`relative bg-gray-800/50 border-gray-700 transition-all duration-300 hover:shadow-lg ${
                plan.popular 
                  ? 'border-red-500/50 shadow-lg shadow-red-500/20 scale-105' 
                  : 'hover:border-red-500/30'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-red-600 text-white px-4 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <plan.icon className={`w-12 h-12 ${plan.popular ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <CardTitle className="text-white text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-gray-400">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-4xl font-bold text-white">${plan.price}</span>
                    <span className="text-gray-400">/month</span>
                  </div>
                  {isAnnual && (
                    <div className="flex items-center justify-center space-x-2 mt-2">
                      <span className="text-gray-400 line-through">${plan.originalPrice}</span>
                      <Badge className="bg-green-500 text-xs">
                        Save {savings(plan.originalPrice, plan.price * 12)}%
                      </Badge>
                    </div>
                  )}
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  {plan.popular ? (
                    <>
                      <Crown className="w-4 h-4 mr-2" />
                      Get Started
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Choose Plan
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Card className="bg-gray-800/50 border-gray-700 max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Enterprise Solutions</CardTitle>
              <CardDescription className="text-gray-400 text-lg">
                Custom solutions for large-scale operations and special requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="text-center">
                  <h3 className="text-white text-xl font-semibold mb-2">Custom Integration</h3>
                  <p className="text-gray-400 mb-4">
                    Integrate our AI mastering API into your existing workflow
                  </p>
                  <Button variant="outline" className="border-gray-600 text-gray-300">
                    Contact Sales
                  </Button>
                </div>
                <div className="text-center">
                  <h3 className="text-white text-xl font-semibold mb-2">White Label</h3>
                  <p className="text-gray-400 mb-4">
                    Brand our mastering service as your own platform
                  </p>
                  <Button variant="outline" className="border-gray-600 text-gray-300">
                    Learn More
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">What audio formats do you support?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  We support WAV, MP3, FLAC, AIFF, and other common audio formats up to 24-bit/96kHz.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">How fast is the processing?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Processing times vary by plan: Standard (24h), Professional (6h), Studio (2h).
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Do you offer refunds?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  We offer a 30-day money-back guarantee for all paid plans.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Sparkles, 
  Music, 
  Play, 
  Upload, 
  Download, 
  Star, 
  Users, 
  Zap,
  Globe,
  Headphones,
  Mic,
  Video,
  TrendingUp
} from 'lucide-react'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const features = [
    {
      icon: Sparkles,
      title: "Professional Mastering",
      description: "Advanced algorithms deliver professional-quality mastering in minutes"
    },
    {
      icon: Upload,
      title: "Simple Upload",
      description: "Drag and drop your tracks. Our system handles the rest with intelligent processing"
    },
    {
      icon: Download,
      title: "Multiple Formats",
      description: "Export in WAV, MP3, FLAC for any platform or distribution need"
    },
    {
      icon: Headphones,
      title: "Genre-Specific",
      description: "Optimized for Afrobeats, Hip-Hop, Gospel, and all African music genres"
    }
  ]

  const testimonials = [
    {
      name: "Adebayo Oke",
      role: "Afrobeats Producer",
      content: "Crysgarage Studio transformed my tracks. The mastering is incredible for Nigerian music.",
      rating: 5
    },
    {
      name: "Chioma Eze",
      role: "Gospel Artist",
      content: "Professional quality at an affordable price. Perfect for independent artists like me.",
      rating: 5
    },
    {
      name: "Kemi Adebayo",
      role: "Content Creator",
      content: "My podcast sounds so much better now. The mastering is studio-quality.",
      rating: 5
    }
  ]

  const stats = [
    { number: "50K+", label: "Tracks Mastered" },
    { number: "10K+", label: "Happy Artists" },
    { number: "99%", label: "Satisfaction Rate" },
    { number: "24/7", label: "Processing" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <Badge className="mb-6 bg-red-600 text-white px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Professional Sound Mastering
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Professional
              <span className="text-red-400 block">Audio Mastering</span>
              <span className="text-3xl md:text-4xl text-gray-300 font-normal">
                for African Music
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              Transform your music with cutting-edge mastering technology. Perfect for Afrobeats, 
              Gospel, Hip-Hop, and all African music genres. Get studio-quality mastering 
              in minutes, not days.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {session ? (
                <Link href="/mastering">
                  <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Start Mastering Now
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup">
                    <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Start Free Trial
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 text-lg">
                      <Play className="w-5 h-5 mr-2" />
                      View Pricing
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Demo Audio Player */}
            <div className="max-w-2xl mx-auto">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                        <Music className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Before & After Demo</h3>
                        <p className="text-gray-400 text-sm">Afrobeats Track - "Summer Vibes"</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500 text-white">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Mastered
                    </Badge>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                      <span>Before</span>
                      <span>After</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 bg-gray-600 rounded h-2">
                        <div className="bg-gray-400 h-2 rounded" style={{width: '60%'}}></div>
                      </div>
                      <Play className="w-4 h-4 text-red-400" />
                      <div className="flex-1 bg-gray-600 rounded h-2">
                        <div className="bg-red-400 h-2 rounded" style={{width: '90%'}}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-red-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400 text-sm md:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Choose Crysgarage Studio?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Built specifically for African music producers and artists. 
              Get professional mastering that understands your sound.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700 hover:border-red-500/50 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="py-20 bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Perfect for Every Creator
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From independent artists to content creators, we've got you covered
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Mic className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white font-semibold text-xl mb-2">
                  Independent Musicians
                </h3>
                <p className="text-gray-400 mb-4">
                  Affordable professional mastering for artists who can't afford expensive studios
                </p>
                <Badge className="bg-blue-500 text-white">
                  Perfect for Afrobeats, Gospel, Hip-Hop
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Music className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white font-semibold text-xl mb-2">
                  Music Producers
                </h3>
                <p className="text-gray-400 mb-4">
                  Quick, efficient mastering tools to enhance your production workflow
                </p>
                <Badge className="bg-green-500 text-white">
                  Bulk processing available
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white font-semibold text-xl mb-2">
                  Content Creators
                </h3>
                <p className="text-gray-400 mb-4">
                  Professional sound for podcasts, YouTube videos, and social media content
                </p>
                <Badge className="bg-purple-500 text-white">
                  Optimized for platforms
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Trusted by African Artists
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              See what Nigerian and African musicians are saying about our mastering
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="text-white font-semibold">
                      {testimonial.name}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {testimonial.role}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-red-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Music?
          </h2>
          <p className="text-xl text-red-100 mb-8">
            Join thousands of African artists who trust Crysgarage Studio for professional mastering
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {session ? (
              <Link href="/mastering">
                <Button size="lg" className="bg-white text-red-600 hover:bg-gray-100 px-8 py-4 text-lg">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Mastering Now
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg" className="bg-white text-red-600 hover:bg-gray-100 px-8 py-4 text-lg">
                    <Zap className="w-5 h-5 mr-2" />
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-red-600 px-8 py-4 text-lg">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    View Plans
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="text-red-400 w-8 h-8" />
                <span className="text-xl font-bold text-white">Crysgarage Studio</span>
              </div>
              <p className="text-gray-400">
                Professional sound mastering for African music. Professional quality, affordable prices.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/mastering" className="hover:text-white transition">Sound Mastering</Link></li>
                <li><Link href="/courses" className="hover:text-white transition">Courses</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition">API Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Crysgarage Studio. All rights reserved. Made for African music.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Sparkles, Play, Clock, Users, Star, BookOpen, Video, Music } from 'lucide-react'

export default function CoursesPage() {
  const courses = [
    {
      id: 1,
      title: 'Audio Production Fundamentals',
      description: 'Learn the basics of audio production, recording techniques, and DAW workflow',
      duration: '8 weeks',
      students: 1247,
      rating: 4.8,
      price: '$99',
      level: 'Beginner',
      lessons: 24,
      thumbnail: '/api/placeholder-course-1.jpg',
      progress: 0,
      isEnrolled: false,
    },
    {
      id: 2,
      title: 'Advanced Mixing Techniques',
      description: 'Master professional mixing techniques for commercial-quality productions',
      duration: '12 weeks',
      students: 892,
      rating: 4.9,
      price: '$149',
      level: 'Intermediate',
      lessons: 36,
      thumbnail: '/api/placeholder-course-2.jpg',
      progress: 65,
      isEnrolled: true,
    },
    {
      id: 3,
      title: 'AI Mastering Masterclass',
      description: 'Learn to use AI tools for professional mastering and audio enhancement',
      duration: '6 weeks',
      students: 567,
      rating: 4.7,
      price: '$79',
      level: 'Advanced',
      lessons: 18,
      thumbnail: '/api/placeholder-course-3.jpg',
      progress: 0,
      isEnrolled: false,
    },
    {
      id: 4,
      title: 'Music Theory for Producers',
      description: 'Essential music theory concepts for electronic music production',
      duration: '10 weeks',
      students: 2034,
      rating: 4.6,
      price: '$89',
      level: 'Beginner',
      lessons: 30,
      thumbnail: '/api/placeholder-course-4.jpg',
      progress: 0,
      isEnrolled: false,
    },
    {
      id: 5,
      title: 'Sound Design & Synthesis',
      description: 'Create unique sounds and textures using modern synthesis techniques',
      duration: '14 weeks',
      students: 445,
      rating: 4.9,
      price: '$129',
      level: 'Intermediate',
      lessons: 42,
      thumbnail: '/api/placeholder-course-5.jpg',
      progress: 0,
      isEnrolled: false,
    },
    {
      id: 6,
      title: 'Professional Audio Engineering',
      description: 'Complete guide to professional audio engineering and studio techniques',
      duration: '16 weeks',
      students: 678,
      rating: 4.8,
      price: '$199',
      level: 'Advanced',
      lessons: 48,
      thumbnail: '/api/placeholder-course-6.jpg',
      progress: 0,
      isEnrolled: false,
    },
  ]

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-500'
      case 'Intermediate': return 'bg-yellow-500'
      case 'Advanced': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="text-red-400 w-8 h-8 mr-3" />
            <h1 className="text-4xl font-bold text-white">Audio Production Courses</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Master the art of audio production with our comprehensive courses taught by industry professionals
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="bg-gray-800/50 border-gray-700 hover:border-red-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20">
              <div className="relative">
                <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-800 rounded-t-lg flex items-center justify-center">
                  <Music className="w-16 h-16 text-gray-400" />
                </div>
                <Badge className={`absolute top-3 left-3 ${getLevelColor(course.level)}`}>
                  {course.level}
                </Badge>
                {course.isEnrolled && (
                  <Badge className="absolute top-3 right-3 bg-green-500">
                    Enrolled
                  </Badge>
                )}
              </div>
              
              <CardHeader>
                <CardTitle className="text-white text-lg">{course.title}</CardTitle>
                <CardDescription className="text-gray-400">
                  {course.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {course.duration}
                  </div>
                  <div className="flex items-center">
                    <Video className="w-4 h-4 mr-1" />
                    {course.lessons} lessons
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {course.students.toLocaleString()} students
                  </div>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-1 text-yellow-400" />
                    {course.rating}
                  </div>
                </div>

                {course.isEnrolled && course.progress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-white">{course.price}</span>
                  {course.isEnrolled ? (
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Play className="w-4 h-4 mr-2" />
                      Continue Learning
                    </Button>
                  ) : (
                    <Button className="bg-red-600 hover:bg-red-700">
                      Enroll Now
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Card className="bg-gray-800/50 border-gray-700 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Ready to Start Learning?</CardTitle>
              <CardDescription className="text-gray-400 text-lg">
                Join thousands of students mastering audio production
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-red-600 hover:bg-red-700">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Browse All Courses
                </Button>
                <Button size="lg" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Free Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 
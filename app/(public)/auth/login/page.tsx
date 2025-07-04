"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Eye, EyeOff, Globe, MapPin, Home, Users, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

interface LoginFormData {
  email: string
  password: string
}

function isApiError(error: unknown): error is { error?: string; message?: string; response?: { data?: { message?: string } } } {
  return typeof error === 'object' && error !== null;
}

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  })

  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const loadingToast = toast.loading('Signing in...')
    
    try {
      await login.mutateAsync(formData)
      toast.dismiss(loadingToast)
      toast.success('Welcome back! 🎉')
      router.push('/')
    } catch (error: unknown) {
      toast.dismiss(loadingToast)
      
      // Handle different error formats
      let errorMessage = 'Login failed. Please try again.'
      
      if (isApiError(error)) {
        if (typeof error.error === 'string') {
          errorMessage = error.error
        } else if (typeof error.message === 'string') {
          errorMessage = error.message
        } else if (
          error.response &&
          error.response.data &&
          typeof error.response.data.message === 'string'
        ) {
          errorMessage = error.response.data.message
        }
      }
      
      toast.error(errorMessage)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100/30">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
          {/* Left Side - Login Form */}
          <div className="w-full max-w-lg mx-auto lg:mx-0">
            <Card className="border-0 shadow-2xl shadow-orange-200/20 bg-white">
              <CardHeader className="text-center pb-8 pt-10">
                <div className="w-16 h-16 bg-orange-100 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                  <Globe className="w-8 h-8 text-orange-500" />
                </div>
                <CardTitle className="text-3xl font-semibold text-gray-900 mb-2">Welcome back</CardTitle>
                <CardDescription className="text-gray-600 text-lg">Sign in to your Abroado account</CardDescription>
              </CardHeader>

              <CardContent className="px-10 pb-10">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="h-12 border-gray-200 focus:border-orange-400 focus:ring-orange-400/20 rounded-xl"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                        Password
                      </Label>
                      <Link
                        href="/forgot-password"
                        className="text-sm text-orange-600 hover:text-orange-700 transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className="h-12 pr-12 border-gray-200 focus:border-orange-400 focus:ring-orange-400/20 rounded-xl"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-12 px-4 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5 text-gray-400" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-200"
                    disabled={login.isPending}
                  >
                    {login.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing in...
                      </div>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </form>

                <div className="text-center pt-8 mt-8 border-t border-gray-100">
                  <p className="text-gray-600">Don&apos;t have an account?{" "}
                    <Link
                      href="/auth/register"
                      className="font-medium text-orange-600 hover:text-orange-700 transition-colors"
                    >
                      Sign up
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Benefits */}
          <div className="hidden lg:block">
            <div className="space-y-10">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">Connect with expats worldwide</h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Join thousands of people sharing their experiences of living, working, and studying abroad.
                </p>
              </div>

              <div className="space-y-6">
                {[
                  {
                    icon: <MapPin className="w-6 h-6 text-orange-500" />,
                    title: "Discover Cities",
                    description: "Read authentic reviews from people who've lived there",
                  },
                  {
                    icon: <Home className="w-6 h-6 text-orange-500" />,
                    title: "Find Accommodation",
                    description: "Connect with roommates and find perfect housing",
                  },
                  {
                    icon: <Users className="w-6 h-6 text-orange-500" />,
                    title: "Build Your Network",
                    description: "Connect with fellow expats and local communities",
                  },
                  {
                    icon: <MessageCircle className="w-6 h-6 text-orange-500" />,
                    title: "Share Experiences",
                    description: "Help others with your insights and learn from theirs",
                  },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex gap-5 p-6 rounded-2xl bg-white/70 backdrop-blur-sm border border-orange-100/50 shadow-sm"
                  >
                    <div className="flex-shrink-0 w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <div className="pt-1">
                      <h3 className="font-semibold text-gray-900 mb-2 text-lg">{feature.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

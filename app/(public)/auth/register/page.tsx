"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Eye, EyeOff, Check, AlertCircle, Globe, Compass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

interface RegisterFormData {
  email: string
  username: string
  password: string
  confirmPassword: string
  role: "EXPLORER" | "ABROADER"
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "EXPLORER",
  })

  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { register } = useAuth()
  const router = useRouter()

  // Password validation helpers
  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
  }

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    // Validate password requirements
    if (!passwordChecks.length || !passwordChecks.uppercase || !passwordChecks.lowercase || !passwordChecks.number) {
      toast.error('Please meet all password requirements')
      return
    }
    
    const loadingToast = toast.loading('Creating your account...')
    
    try {
      await register.mutateAsync({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        role: formData.role
      })
      toast.dismiss(loadingToast)
      toast.success('Account created successfully! Welcome to Abroado! 🎉')
      router.push('/')
    } catch (error: any) {
      toast.dismiss(loadingToast)
      
      // Handle different error formats
      let errorMessage = 'Registration failed. Please try again.'
      
      // The error object from useAuth is already a JavaScript object, not JSON string
      if (error.error) {
        // Use the specific error message from the API
        errorMessage = error.error
      } else if (error.message) {
        // Fallback to the general message
        errorMessage = error.message
      } else if (error.response?.data?.message) {
        // Handle axios error responses
        errorMessage = error.response.data.message
      }
      
      toast.error(errorMessage)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100/30">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
          {/* Left Side - Registration Form */}
          <div className="w-full max-w-lg mx-auto lg:mx-0">
            <Card className="border-0 shadow-2xl shadow-orange-200/20 bg-white">
              <CardHeader className="text-center pb-8 pt-10">
                <div className="w-16 h-16 bg-orange-100 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                  <Globe className="w-8 h-8 text-orange-500" />
                </div>
                <CardTitle className="text-3xl font-semibold text-gray-900 mb-2">Join Abroado</CardTitle>
                <CardDescription className="text-gray-600 text-lg">Start your journey abroad today</CardDescription>
              </CardHeader>

              <CardContent className="px-10 pb-10">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Username & Email Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                        Username
                      </Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Choose username"
                        value={formData.username}
                        onChange={(e) => handleInputChange("username", e.target.value)}
                        className="h-12 border-gray-200 focus:border-orange-400 focus:ring-orange-400/20 rounded-xl"
                        required
                      />
                    </div>

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
                  </div>

                  {/* Password */}
                  <div className="space-y-3">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create password"
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

                    {/* Password Requirements */}
                    {formData.password && (
                      <div className="bg-gray-50 rounded-xl p-4 mt-3">
                        <p className="text-xs font-medium text-gray-600 mb-3">Password requirements:</p>
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries({
                            "8+ characters": passwordChecks.length,
                            Uppercase: passwordChecks.uppercase,
                            Lowercase: passwordChecks.lowercase,
                            Number: passwordChecks.number,
                          }).map(([label, isValid]) => (
                            <div key={label} className="flex items-center gap-2">
                              <div
                                className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                  isValid ? "bg-orange-100" : "bg-gray-200"
                                }`}
                              >
                                <Check className={`w-2.5 h-2.5 ${isValid ? "text-orange-600" : "text-gray-400"}`} />
                              </div>
                              <span className={`text-xs ${isValid ? "text-orange-600" : "text-gray-500"}`}>
                                {label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        className="h-12 pr-12 border-gray-200 focus:border-orange-400 focus:ring-orange-400/20 rounded-xl"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-12 px-4 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5 text-gray-400" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">I am an...</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        className={`relative p-6 rounded-2xl border-2 transition-all duration-200 ${
                          formData.role === "EXPLORER"
                            ? "border-orange-300 bg-orange-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                        onClick={() => handleInputChange("role", "EXPLORER")}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                              formData.role === "EXPLORER" ? "bg-orange-100" : "bg-gray-100"
                            }`}
                          >
                            <Compass
                              className={`w-6 h-6 ${
                                formData.role === "EXPLORER" ? "text-orange-600" : "text-gray-500"
                              }`}
                            />
                          </div>
                          <div className="text-center">
                            <div
                              className={`font-medium ${
                                formData.role === "EXPLORER" ? "text-orange-900" : "text-gray-700"
                              }`}
                            >
                              Explorer
                            </div>
                            <div
                              className={`text-sm ${
                                formData.role === "EXPLORER" ? "text-orange-600" : "text-gray-500"
                              }`}
                            >
                              Planning to move
                            </div>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        className={`relative p-6 rounded-2xl border-2 transition-all duration-200 ${
                          formData.role === "ABROADER"
                            ? "border-orange-300 bg-orange-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                        onClick={() => handleInputChange("role", "ABROADER")}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                              formData.role === "ABROADER" ? "bg-orange-100" : "bg-gray-100"
                            }`}
                          >
                            <Globe
                              className={`w-6 h-6 ${
                                formData.role === "ABROADER" ? "text-orange-600" : "text-gray-500"
                              }`}
                            />
                          </div>
                          <div className="text-center">
                            <div
                              className={`font-medium ${
                                formData.role === "ABROADER" ? "text-orange-900" : "text-gray-700"
                              }`}
                            >
                              Abroader
                            </div>
                            <div
                              className={`text-sm ${
                                formData.role === "ABROADER" ? "text-orange-600" : "text-gray-500"
                              }`}
                            >
                              Already abroad
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-200"
                    disabled={register.isPending}
                  >
                    {register.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating account...
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>

                <div className="text-center pt-8 mt-8 border-t border-gray-100">
                  <p className="text-gray-600">
                    Already have an account?{" "}
                    <Link href="/auth/login" className="font-medium text-orange-600 hover:text-orange-700 transition-colors">
                      Sign in
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
                <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">Your journey abroad starts here</h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Connect with a global community of explorers and expats. Get real insights, find housing, and build
                  meaningful connections.
                </p>
              </div>

              <div className="space-y-6">
                {[
                  {
                    icon: <Compass className="w-6 h-6 text-orange-500" />,
                    title: "Choose Your Path",
                    description: "Whether exploring or already abroad, find your community",
                  },
                  {
                    icon: <Globe className="w-6 h-6 text-orange-500" />,
                    title: "Real City Insights",
                    description: "Honest reviews from people who've actually lived there",
                  },
                  {
                    icon: <AlertCircle className="w-6 h-6 text-orange-500" />,
                    title: "Housing Support",
                    description: "Find roommates and accommodation with confidence",
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

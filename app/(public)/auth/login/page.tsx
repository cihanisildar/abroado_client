"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import Image from "next/image"
import logo from "@/public/signaling_18391003.png"
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-100 via-white to-orange-50">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="flex justify-center items-center">
          {/* Login Form */}
          <div className="w-full max-w-md mx-auto">
            <Card className="overflow-hidden border border-orange-100/50 shadow-xl shadow-orange-100/20 bg-white/70 backdrop-blur-sm">
              <CardHeader className="text-center pb-6 pt-8 px-6">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-50 rounded-[2rem] rotate-[10deg] mx-auto mb-4 flex items-center justify-center transform transition-transform hover:rotate-0 duration-300">
                  <Image src={logo} alt="Abroado Signpost" className="w-7 h-7" />
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">Welcome back</CardTitle>
                <CardDescription className="text-gray-500">Sign in to your Abroado account</CardDescription>
              </CardHeader>

              <CardContent className="px-6 pb-6">
                <form onSubmit={handleSubmit} className="space-y-4">
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
                      className="h-10 bg-white/80 border-gray-200 focus:border-orange-400 focus:ring-orange-400/20 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-0"
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
                        className="h-10 pr-12 bg-white/80 border-gray-200 focus:border-orange-400 focus:ring-orange-400/20 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-0"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-10 px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-lg shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300"
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

                <div className="text-center pt-6 mt-6 border-t border-gray-100">
                  <p className="text-gray-500">Don&apos;t have an account?{" "}
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
        </div>
      </div>
    </div>
  )
}

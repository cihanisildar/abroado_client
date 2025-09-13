"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Check,
  Compass,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import GoogleAuthButton from "@/components/ui/GoogleAuthButton";

interface RegisterFormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  role: "EXPLORER" | "ABROADER";
}

function isApiError(
  error: unknown
): error is {
  error?: string;
  message?: string;
  response?: { data?: { message?: string } };
} {
  return typeof error === "object" && error !== null;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "EXPLORER",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof RegisterFormData, string>>
  >({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  // Password validation helpers
  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Validate password requirements
    if (
      !passwordChecks.length ||
      !passwordChecks.uppercase ||
      !passwordChecks.lowercase ||
      !passwordChecks.number
    ) {
      toast.error("Please meet all password requirements");
      return;
    }

    const loadingToast = toast.loading("Creating your account...");

    try {
      await register.mutateAsync({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        role: formData.role,
      });
      toast.dismiss(loadingToast);
      toast.success("Account created successfully! Welcome to Abroado! 🎉");
      router.push("/");
    } catch (error: unknown) {
      toast.dismiss(loadingToast);

      // Handle different error formats
      let errorMessage = "Registration failed. Please try again.";

      if (isApiError(error)) {
        if (typeof error.error === "string") {
          errorMessage = error.error;
        } else if (typeof error.message === "string") {
          errorMessage = error.message;
        } else if (
          error.response &&
          error.response.data &&
          typeof error.response.data.message === "string"
        ) {
          errorMessage = error.response.data.message;
        }
      }

      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-100 via-white to-orange-50">
      <div className="container mx-auto px-4 pt-20 pb-8 lg:pt-24 lg:pb-12">
        <div className="flex justify-center items-center">
          {/* Registration Form */}
          <div className="w-full max-w-md mx-auto">
            <Card className="overflow-hidden border border-orange-100/50 shadow-xl shadow-orange-100/20 bg-white/70 backdrop-blur-sm">
              <CardHeader className="text-center pb-6 pt-8 px-6">
                <CardTitle className="text-2xl font-bold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                  Create Account
                </CardTitle>
                <CardDescription className="text-gray-500">
                  Start your journey abroad today
                </CardDescription>
              </CardHeader>

              <CardContent className="px-6 pb-6">
                {/* Google OAuth Button */}
                <GoogleAuthButton 
                  className="w-full mb-4" 
                  variant="outline"
                  size="default"
                />
                
                {/* Divider - Only show if we have a Google button */}
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or create account with email</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Username & Email Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="username"
                        className="text-sm font-medium text-gray-700"
                      >
                        Username
                      </Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Choose username"
                        value={formData.username}
                        onChange={(e) =>
                          handleInputChange("username", e.target.value)
                        }
                        className="h-10 bg-white/80 border-gray-200 focus:border-orange-400 focus:ring-orange-400/20 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-0"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-sm font-medium text-gray-700"
                      >
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className="h-10 bg-white/80 border-gray-200 focus:border-orange-400 focus:ring-orange-400/20 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-0"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-3">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-700"
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create password"
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
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

                    {/* Password Requirements */}
                    {formData.password && (
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-orange-100/50">
                        <p className="text-xs font-medium text-gray-600 mb-2">
                          Password requirements:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries({
                            "8+ characters": passwordChecks.length,
                            Uppercase: passwordChecks.uppercase,
                            Lowercase: passwordChecks.lowercase,
                            Number: passwordChecks.number,
                          }).map(([label, isValid]) => (
                            <div
                              key={label}
                              className="flex items-center gap-2"
                            >
                              <div
                                className={`w-3 h-3 rounded-full flex items-center justify-center transition-colors duration-200 ${
                                  isValid ? "bg-orange-100" : "bg-gray-100"
                                }`}
                              >
                                <Check
                                  className={`w-2 h-2 transition-colors duration-200 ${
                                    isValid
                                      ? "text-orange-600"
                                      : "text-gray-400"
                                  }`}
                                />
                              </div>
                              <span
                                className={`text-xs transition-colors duration-200 ${
                                  isValid ? "text-orange-600" : "text-gray-500"
                                }`}
                              >
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
                    <Label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium text-gray-700"
                    >
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          handleInputChange("confirmPassword", e.target.value)
                        }
                        className="h-10 pr-12 bg-white/80 border-gray-200 focus:border-orange-400 focus:ring-orange-400/20 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-0"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-10 px-3 hover:bg-transparent"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      I am a...
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        onClick={() => handleInputChange("role", "EXPLORER")}
                        className={`h-auto py-3 px-3 flex flex-col items-center gap-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-0 focus:bg-orange-100 hover:bg-orange-50 ${
                          formData.role === "EXPLORER"
                            ? "bg-orange-100 border-orange-200 text-orange-700"
                            : "bg-white/60 border-gray-200 text-gray-600"
                        }`}
                      >
                        <Compass
                          className={`w-4 h-4 ${
                            formData.role === "EXPLORER"
                              ? "text-orange-500"
                              : "text-gray-400"
                          }`}
                        />
                        <span className="text-sm font-medium">Explorer</span>
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleInputChange("role", "ABROADER")}
                        className={`h-auto py-3 px-3 flex flex-col items-center gap-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-0 focus:bg-orange-100 hover:bg-orange-50 ${
                          formData.role === "ABROADER"
                            ? "bg-orange-100 border-orange-200 text-orange-700"
                            : "bg-white/60 border-gray-200 text-gray-600"
                        }`}
                      >
                        <Globe
                          className={`w-4 h-4 ${
                            formData.role === "ABROADER"
                              ? "text-orange-500"
                              : "text-gray-400"
                          }`}
                        />
                        <span className="text-sm font-medium">Abroader</span>
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-lg shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300"
                    disabled={register.isPending}
                  >
                    {register.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating account...
                      </div>
                    ) : (
                      "Create account"
                    )}
                  </Button>
                </form>

                <div className="text-center pt-6 mt-6 border-t border-gray-100">
                  <p className="text-gray-500">
                    Already have an account?{" "}
                    <Link
                      href="/auth/login"
                      className="font-medium text-orange-600 hover:text-orange-700 transition-colors"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

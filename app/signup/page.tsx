"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Monitor, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    password: "",
    confirmPassword: "",
    plan: "monthly",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  // Password validation
  const passwordValidation = {
    length: formData.password.length >= 6,
    match: formData.password === formData.confirmPassword && formData.confirmPassword.length > 0,
  }

  const isFormValid =
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.email.trim() &&
    passwordValidation.length &&
    passwordValidation.match

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!isFormValid) {
      setError("Please fill in all required fields correctly")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          company: formData.company,
          password: formData.password,
          plan: formData.plan,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Store token in localStorage
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))

        // Redirect to dashboard
        router.push("/dashboard")
      } else {
        setError(data.message || "Registration failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center mb-6">
            <Monitor className="h-8 w-8 mr-2" />
            <span className="text-2xl font-bold">SignageCloud</span>
          </Link>
          <h2 className="text-3xl font-bold">Create your account</h2>
          <p className="mt-2 text-gray-600">Start your digital signage journey today</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Enter your information to create an account</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4" variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company name</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                  placeholder="Acme Inc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  {passwordValidation.length ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <span className={passwordValidation.length ? "text-green-600" : "text-gray-500"}>
                    At least 6 characters
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {formData.confirmPassword && (
                  <div className="flex items-center space-x-2 text-sm">
                    {passwordValidation.match ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={passwordValidation.match ? "text-green-600" : "text-red-600"}>
                      Passwords match
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label>Choose your plan</Label>
                <RadioGroup
                  value={formData.plan}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, plan: value }))}
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly" className="flex-1 cursor-pointer">
                      <div className="font-medium">Monthly - $15/screen/month</div>
                      <div className="text-sm text-gray-500">Perfect for getting started</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="annual" id="annual" />
                    <Label htmlFor="annual" className="flex-1 cursor-pointer">
                      <div className="font-medium">Annual - $144/screen/year</div>
                      <div className="text-sm text-gray-500">Save 20% with annual billing</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading || !isFormValid}>
                {loading ? "Creating Account..." : "Create Account & Start Free Trial"}
              </Button>
            </form>

            <div className="text-center text-sm mt-4">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

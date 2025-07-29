"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Shield, Trash2, RefreshCw, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"
import { API_BASE_URL } from "@/lib/api"
import { GmailTokenManager } from "@/lib/GmailTokenManager"

interface UserProfileProps {
  gmailProfile: any
}

export default function UserProfile({ gmailProfile }: UserProfileProps) {
  const [userEmail, setUserEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [deleteEmail, setDeleteEmail] = useState("")

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token")
    return {
      Authorization: `Bearer ${token}`,
      accept: "application/json",
    }
  }

  const resendVerification = async () => {
    if (!userEmail) return

    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch(`${API_BASE_URL}/resend-verification?email=${userEmail}`, {
        method: "POST",
        headers: getAuthHeaders(),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.msg)
      } else {
        setError(data.detail || "Failed to resend verification")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetGmailTokens = async () => {
    if (!userEmail) return

    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch(`${API_BASE_URL}/reset-gmail-tokens/${userEmail}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        setMessage("Gmail tokens reset successfully. Please reconnect your Gmail account.")
      } else {
        setError("Failed to reset Gmail tokens")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteUser = async () => {
    if (!deleteEmail || deleteEmail !== userEmail) {
      setError("Please enter your email address to confirm deletion")
      return
    }

    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch(`${API_BASE_URL}/admin/delete-user?email=${deleteEmail}`, {
        method: "DELETE",
        headers: {
          accept: "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("User deleted successfully. You will be logged out.")
        setTimeout(() => {
          localStorage.removeItem("access_token")
          localStorage.removeItem("user_email")
          window.location.reload()
        }, 2000)
      } else {
        setError(data.detail || "Failed to delete user")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const connectGmail = () => {
    window.open("https://email-agent-backendd.vercel.app/gmail/authorize", "_blank")
  }

  useEffect(() => {
    const email = localStorage.getItem("user_email")
    if (email) {
      setUserEmail(email)
    }
  }, [])

  return (
    <div className="p-6 space-y-6 min-h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Email Address</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{userEmail}</span>
                <Badge variant="secondary">Verified</Badge>
              </div>
            </div>
            <div>
              <Label>Account Status</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">Active</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gmail Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Gmail Integration
          </CardTitle>
          <CardDescription>Manage your Gmail connection and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {gmailProfile ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-600 font-medium">Gmail Connected</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-semibold">Email Address</div>
                  <div className="text-gray-600">{gmailProfile.emailAddress}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-semibold">Total Messages</div>
                  <div className="text-gray-600">{gmailProfile.messagesTotal}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-semibold">Total Threads</div>
                  <div className="text-gray-600">{gmailProfile.threadsTotal}</div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={resetGmailTokens} variant="outline" disabled={isLoading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Gmail Connection
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span className="text-orange-600 font-medium">Gmail Not Connected</span>
              </div>

              <p className="text-sm text-gray-600">
                Connect your Gmail account to access your emails and use AI-powered features.
              </p>

              <Button onClick={connectGmail}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect Gmail
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Account Actions
          </CardTitle>
          <CardDescription>Manage your account verification and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label>Resend Verification Email</Label>
              <p className="text-sm text-gray-600 mb-2">
                If you need to verify your email address again, click the button below.
              </p>
              <Button onClick={resendVerification} variant="outline" disabled={isLoading}>
                <Mail className="h-4 w-4 mr-2" />
                Resend Verification
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <Trash2 className="h-5 w-5 mr-2" />
            Danger Zone
          </CardTitle>
          <CardDescription>Permanently delete your account and all associated data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="delete-email">Type your email address to confirm deletion</Label>
            <Input
              id="delete-email"
              type="email"
              placeholder="Enter your email address"
              value={deleteEmail}
              onChange={(e) => setDeleteEmail(e.target.value)}
            />
          </div>

          <Button onClick={deleteUser} variant="destructive" disabled={isLoading || deleteEmail !== userEmail}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

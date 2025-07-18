"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Inbox, User, LogOut, RefreshCw, ExternalLink, CheckCircle, AlertCircle } from "lucide-react"
import EmailList from "@/components/email-list"
import EmailDetail from "@/components/email-detail"
import UserProfile from "@/components/user-profile"

interface EmailDashboardProps {
  onLogout: () => void
}

interface GmailProfile {
  emailAddress: string
  messagesTotal: number
  threadsTotal: number
  historyId: string
}

export default function EmailDashboard({ onLogout }: EmailDashboardProps) {
  const [activeTab, setActiveTab] = useState("inbox")
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null)
  const [gmailProfile, setGmailProfile] = useState<GmailProfile | null>(null)
  const [isGmailConnected, setIsGmailConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token")
    return {
      Authorization: `Bearer ${token}`,
      accept: "application/json",
    }
  }

  const checkGmailConnection = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`https://email-agent-backendd.vercel.app/gmail/profile?token=${token}`, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const profile = await response.json()
        setGmailProfile(profile)
        setIsGmailConnected(true)
      } else {
        setIsGmailConnected(false)
      }
    } catch (err) {
      setIsGmailConnected(false)
    }
  }

  const connectGmail = async () => {
    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("https://email-agent-backendd.vercel.app/gmail/authorize", {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        // This would typically redirect to Google OAuth
        setMessage("Redirecting to Google for authorization...")
        // In a real implementation, this would open a popup or redirect
        window.open("https://email-agent-backendd.vercel.app/gmail/authorize", "_blank")
      } else {
        setError("Failed to initiate Gmail connection")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("user_email")
    onLogout()
  }

  useEffect(() => {
    checkGmailConnection()
  }, [])

  const renderContent = () => {
    switch (activeTab) {
      case "inbox":
        return selectedEmailId ? (
          <EmailDetail emailId={selectedEmailId} onBack={() => setSelectedEmailId(null)} />
        ) : (
          <EmailList onSelectEmail={setSelectedEmailId} isGmailConnected={isGmailConnected} />
        )
      case "profile":
        return <UserProfile gmailProfile={gmailProfile} />
      default:
        return <EmailList onSelectEmail={setSelectedEmailId} isGmailConnected={isGmailConnected} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Mail className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Email Agent</h1>
            {isGmailConnected && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Gmail Connected
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {!isGmailConnected && (
              <Button onClick={connectGmail} disabled={isLoading} variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                {isLoading ? "Connecting..." : "Connect Gmail"}
              </Button>
            )}
            <Button onClick={checkGmailConnection} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 p-4">
          <nav className="space-y-2">
            <Button
              variant={activeTab === "inbox" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                setActiveTab("inbox")
                setSelectedEmailId(null)
              }}
            >
              <Inbox className="h-4 w-4 mr-2" />
              Inbox
              {gmailProfile && (
                <Badge variant="secondary" className="ml-auto">
                  {gmailProfile.messagesTotal}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeTab === "profile" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("profile")}
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
          </nav>

          {/* Gmail Status Card */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Gmail Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {isGmailConnected ? (
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Connected
                  </div>
                  {gmailProfile && (
                    <div className="text-xs text-gray-500">
                      <div>Messages: {gmailProfile.messagesTotal}</div>
                      <div>Threads: {gmailProfile.threadsTotal}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Not Connected
                  </div>
                  <Button onClick={connectGmail} size="sm" className="w-full">
                    Connect Gmail
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {message && (
            <Alert className="m-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="m-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

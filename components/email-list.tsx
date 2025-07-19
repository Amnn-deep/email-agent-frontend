"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Mail, RefreshCw, Bot, AlertCircle, CheckCircle, ExternalLink, User, Calendar, X } from "lucide-react"
import ComposeEmail from "@/components/compose-email"

interface EmailListProps {
  onSelectEmail: (emailId: string) => void
  isGmailConnected: boolean
}

interface GmailMessage {
  id: string
  threadId: string
}

interface GmailMessageDetail {
  id: string
  threadId: string
  subject: string
  from: string
  to: string
  date: string
  snippet: string
  body: string
}

interface SimpleEmail {
  subject: string
  index: number
}

interface EnhancedGmailMessage extends GmailMessage {
  details?: GmailMessageDetail
  friendlyName?: string
  category?: string
  categoryColor?: string
}

export default function EmailList({ onSelectEmail, isGmailConnected }: EmailListProps) {
  const [gmailMessages, setGmailMessages] = useState<EnhancedGmailMessage[]>([])
  const [simpleEmails, setSimpleEmails] = useState<SimpleEmail[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [lastReply, setLastReply] = useState<any>(null)
  const [showCompose, setShowCompose] = useState(false)

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token")
    return {
      Authorization: `Bearer ${token}`,
      accept: "application/json",
    }
  }

  const generateFriendlyName = (email: GmailMessageDetail): { name: string; category: string; color: string } => {
    const subject = email.subject.toLowerCase()
    const from = email.from.toLowerCase()
    const snippet = email.snippet.toLowerCase()

    // Extract sender name
    const senderMatch = email.from.match(/^(.+?)\s*</)
    const senderName = senderMatch ? senderMatch[1].trim() : email.from.split("@")[0]

    // Job-related emails
    if (from.includes("linkedin")) {
      if (subject.includes("job") || subject.includes("alert")) {
        return {
          name: `LinkedIn Job Alert - ${email.subject.split(":")[0] || "New Opportunities"}`,
          category: "Career",
          color: "bg-blue-100 text-blue-800",
        }
      }
      return {
        name: `LinkedIn - ${senderName}`,
        category: "Professional",
        color: "bg-blue-100 text-blue-800",
      }
    }

    // Gaming platforms
    if (from.includes("epic") || from.includes("steam") || from.includes("ubisoft")) {
      const platform = from.includes("epic") ? "Epic Games" : from.includes("steam") ? "Steam" : "Gaming Platform"
      if (subject.includes("sale") || subject.includes("offer")) {
        return {
          name: `${platform} Sale Alert`,
          category: "Gaming",
          color: "bg-purple-100 text-purple-800",
        }
      }
      return {
        name: `${platform} Update`,
        category: "Gaming",
        color: "bg-purple-100 text-purple-800",
      }
    }

    // E-commerce
    if (from.includes("amazon") || from.includes("flipkart") || from.includes("myntra")) {
      const platform = from.includes("amazon") ? "Amazon" : from.includes("flipkart") ? "Flipkart" : "Shopping"
      if (subject.includes("order") || subject.includes("delivery")) {
        return {
          name: `${platform} Order Update`,
          category: "Shopping",
          color: "bg-orange-100 text-orange-800",
        }
      }
      if (subject.includes("sale") || subject.includes("deal")) {
        return {
          name: `${platform} Deal Alert`,
          category: "Shopping",
          color: "bg-orange-100 text-orange-800",
        }
      }
      return {
        name: `${platform} Notification`,
        category: "Shopping",
        color: "bg-orange-100 text-orange-800",
      }
    }

    // Financial services
    if (from.includes("bank") || from.includes("paytm") || from.includes("phonepe") || from.includes("gpay")) {
      const service = from.includes("paytm")
        ? "Paytm"
        : from.includes("phonepe")
          ? "PhonePe"
          : from.includes("gpay")
            ? "Google Pay"
            : "Bank"
      if (subject.includes("transaction") || subject.includes("payment")) {
        return {
          name: `${service} Transaction Alert`,
          category: "Finance",
          color: "bg-green-100 text-green-800",
        }
      }
      return {
        name: `${service} Update`,
        category: "Finance",
        color: "bg-green-100 text-green-800",
      }
    }

    // Social media
    if (from.includes("facebook") || from.includes("instagram") || from.includes("twitter")) {
      const platform = from.includes("facebook") ? "Facebook" : from.includes("instagram") ? "Instagram" : "Twitter"
      return {
        name: `${platform} Notification`,
        category: "Social",
        color: "bg-pink-100 text-pink-800",
      }
    }

    // GitHub/Development
    if (from.includes("github") || from.includes("gitlab") || from.includes("stackoverflow")) {
      const platform = from.includes("github") ? "GitHub" : from.includes("gitlab") ? "GitLab" : "Stack Overflow"
      return {
        name: `${platform} Update`,
        category: "Development",
        color: "bg-gray-100 text-gray-800",
      }
    }

    // Newsletter/Marketing
    if (from.includes("noreply") || from.includes("no-reply") || subject.includes("newsletter")) {
      // Try to extract company name from email domain
      const domain = email.from.split("@")[1]?.split(".")[0] || "Newsletter"
      const companyName = domain.charAt(0).toUpperCase() + domain.slice(1)

      if (subject.includes("sale") || subject.includes("offer") || subject.includes("deal")) {
        return {
          name: `${companyName} Promotion`,
          category: "Marketing",
          color: "bg-yellow-100 text-yellow-800",
        }
      }
      return {
        name: `${companyName} Newsletter`,
        category: "Newsletter",
        color: "bg-gray-100 text-gray-800",
      }
    }

    // Personal emails
    if (!from.includes("noreply") && !from.includes("no-reply") && !email.from.includes("<")) {
      return {
        name: `Personal - ${senderName}`,
        category: "Personal",
        color: "bg-indigo-100 text-indigo-800",
      }
    }

    // Default case - use subject or sender
    const shortSubject = email.subject.length > 30 ? email.subject.substring(0, 30) + "..." : email.subject

    return {
      name: shortSubject || `Email from ${senderName}`,
      category: "General",
      color: "bg-gray-100 text-gray-800",
    }
  }

  const fetchEmailDetails = async (messageId: string): Promise<GmailMessageDetail | null> => {
    try {
      const response = await fetch(`https://email-agent-backendd.vercel.app/gmail/message/${messageId}`, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        return await response.json()
      }
    } catch (err) {
      console.error(`Failed to fetch details for message ${messageId}:`, err)
    }
    return null
  }

  const fetchGmailMessages = async () => {
    if (!isGmailConnected) return

    setIsLoading(true)
    setError("")
    setLastReply(null) // Clear AI reply when refreshing

    try {
      const response = await fetch(`https://email-agent-backendd.vercel.app/gmail/messages`, {
        headers: getAuthHeaders(),
      })

      if (response.status === 401) {
        // Unauthorized: clear token and prompt reconnect
        localStorage.removeItem("access_token")
        setError("Session expired. Please reconnect your Gmail account.")
        setGmailMessages([])
        return
      }
      if (response.status === 500) {
        setError("Server error. Please try again later.")
        setGmailMessages([])
        return
      }

      if (response.ok) {
        const data = await response.json()
        const messages: GmailMessage[] = data.messages || []

        // Fetch details for first few messages to generate friendly names
        const enhancedMessages: EnhancedGmailMessage[] = []

        for (const message of messages.slice(0, 10)) {
          // Limit to first 10 for performance
          const details = await fetchEmailDetails(message.id)
          if (details) {
            const friendlyInfo = generateFriendlyName(details)
            enhancedMessages.push({
              ...message,
              details,
              friendlyName: friendlyInfo.name,
              category: friendlyInfo.category,
              categoryColor: friendlyInfo.color,
            })
          } else {
            enhancedMessages.push({
              ...message,
              friendlyName: `Email ${message.id.substring(0, 8)}...`,
              category: "Unknown",
              categoryColor: "bg-gray-100 text-gray-800",
            })
          }
        }

        // Add remaining messages without details for now
        for (const message of messages.slice(10)) {
          enhancedMessages.push({
            ...message,
            friendlyName: `Email ${message.id.substring(0, 8)}...`,
            category: "Unknown",
            categoryColor: "bg-gray-100 text-gray-800",
          })
        }

        setGmailMessages(enhancedMessages)
        setError("") // Clear error on success
      } else {
        setError("Failed to fetch Gmail messages")
        setGmailMessages([])
      }
    } catch (err) {
      setError("Network error. Please try again.")
      setGmailMessages([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSimpleEmails = async () => {
    setIsLoading(true)
    setError("")
    setLastReply(null) // Clear AI reply when refreshing

    try {
      const response = await fetch(`https://email-agent-backendd.vercel.app/emails`, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const emails = await response.json()
        const emailsWithIndex = emails.map((subject: string, index: number) => ({
          subject,
          index,
        }))
        setSimpleEmails(emailsWithIndex)
      } else {
        setError("Failed to fetch emails")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const generateReplyToLast = async () => {
    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch(`https://email-agent-backendd.vercel.app/reply`, {
        method: "POST",
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        setLastReply(data)
        setMessage("AI reply generated successfully!")
      } else {
        setError("Failed to generate reply")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 1) return "Today"
      if (diffDays === 2) return "Yesterday"
      if (diffDays <= 7) return `${diffDays - 1} days ago`

      return date.toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const dismissAIReply = () => {
    setLastReply(null)
    setMessage("")
  }

  useEffect(() => {
    fetchSimpleEmails()
    if (isGmailConnected) {
      fetchGmailMessages()
    }
  }, [isGmailConnected])

  if (!isGmailConnected && gmailMessages.length === 0 && simpleEmails.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader className="text-center">
            <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <CardTitle>Connect Your Gmail</CardTitle>
            <CardDescription>
              Connect your Gmail account to start managing your emails with AI assistance
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.reload()} className="mt-4">
              <ExternalLink className="h-4 w-4 mr-2" />
              Connect Gmail
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inbox</h2>
          <p className="text-gray-600">
            {isGmailConnected ? `${gmailMessages.length} Gmail messages` : `${simpleEmails.length} emails`}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={isGmailConnected ? fetchGmailMessages : fetchSimpleEmails}
            variant="outline"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCompose(true)} variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Compose
          </Button>
          <Button onClick={generateReplyToLast} disabled={isLoading}>
            <Bot className="h-4 w-4 mr-2" />
            AI Reply to Last
          </Button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}


      {/* Show loading message if loading, hide error and empty state while loading */}
      {isLoading ? (
        <Alert>
          <Mail className="h-4 w-4 animate-bounce" />
          <AlertDescription>
            Please wait, your emails are loading...
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error.includes('500') || error.toLowerCase().includes('server')
                  ? 'Server error. Please check your connection or try again later.'
                  : error.includes('401')
                    ? 'Authentication error. Please log in again.'
                    : error}
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Last Reply Card */}
      {lastReply && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-blue-600" />
                  AI Generated Reply
                </CardTitle>
                <CardDescription>Reply to: {lastReply.last_email}</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={dismissAIReply} className="h-8 w-8 p-0 hover:bg-blue-100">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Summary:</h4>
              <p className="text-sm text-gray-600">{lastReply.summary}</p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Suggested Reply:</h4>
              <div className="bg-white p-3 rounded border text-sm">{lastReply.reply}</div>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={dismissAIReply}>
                Dismiss Reply
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gmail Messages */}
      {isGmailConnected && gmailMessages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Gmail Messages
          </h3>
          <div className="grid gap-4">
            {gmailMessages.map((message) => (
              <Card
                key={message.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onSelectEmail(message.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Mail className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{message.friendlyName}</p>
                        {message.details && (
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span className="truncate max-w-32">
                                {message.details.from.split("<")[0].trim() || message.details.from}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(message.details.date)}</span>
                            </div>
                          </div>
                        )}
                        {message.details?.snippet && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {message.details.snippet.substring(0, 100)}...
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {message.category && <Badge className={message.categoryColor}>{message.category}</Badge>}
                      <Badge variant="secondary">Gmail</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Simple Emails */}
      {simpleEmails.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Email Subjects
          </h3>
          <div className="grid gap-4">
            {simpleEmails.map((email) => (
              <Card key={email.index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <Mail className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">{email.subject}</p>
                        <p className="text-sm text-gray-500">Email #{email.index + 1}</p>
                      </div>
                    </div>
                    <Badge variant="outline">Simple</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State: Only show if not loading and no emails and no error */}
      {!isLoading && !error && gmailMessages.length === 0 && simpleEmails.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No emails found</h3>
            <p className="text-gray-600 mb-4">
              {isGmailConnected
                ? "Your Gmail inbox appears to be empty."
                : "Connect your Gmail account to see your emails here."}
            </p>
          </CardContent>
        </Card>
      )}
      {showCompose && <ComposeEmail onClose={() => setShowCompose(false)} />}
    </div>
  )
}

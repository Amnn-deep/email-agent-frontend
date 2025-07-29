"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Mail, RefreshCw, Bot, AlertCircle, CheckCircle, ExternalLink, User, Calendar, X } from "lucide-react"
import { API_BASE_URL } from "@/lib/api"
import ComposeEmail from "@/components/compose-email"
import { GmailTokenManager } from "@/lib/gmail-tokens"

interface EmailListProps {
  onSelectEmail: (emailId: string) => void
  isGmailConnected: boolean
  setGmailConnected: (connected: boolean) => void
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

export default function EmailList({ onSelectEmail, isGmailConnected, setGmailConnected }: EmailListProps) {
  const [gmailMessages, setGmailMessages] = useState<EnhancedGmailMessage[]>([])
  const [simpleEmails, setSimpleEmails] = useState<SimpleEmail[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [lastReply, setLastReply] = useState<any>(null)
  const [showCompose, setShowCompose] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0)
  const MESSAGES_PER_PAGE = 10

  // Load cached emails/messages on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedList = localStorage.getItem("gmail_message_list")
      const cachedDetails = localStorage.getItem("gmail_message_details")
      if (cachedList && cachedDetails) {
        try {
          const list = JSON.parse(cachedList)
          const details = JSON.parse(cachedDetails)
          setGmailMessages(list)
          // Optionally, you could merge details into list if needed
        } catch {}
      }
    }
  }, [])

  // Save to cache whenever gmailMessages changes
  useEffect(() => {
    if (typeof window !== "undefined" && gmailMessages.length > 0) {
      localStorage.setItem("gmail_message_list", JSON.stringify(gmailMessages))
      // Optionally, cache details separately if you want
      // localStorage.setItem("gmail_message_details", JSON.stringify(detailsArray))
    }
  }, [gmailMessages])

  // Pagination logic
  const paginatedMessages = gmailMessages.slice(currentPage * MESSAGES_PER_PAGE, (currentPage + 1) * MESSAGES_PER_PAGE)

  // Pagination controls
  const hasPrev = currentPage > 0
  const hasNext = (currentPage + 1) * MESSAGES_PER_PAGE < gmailMessages.length

  // Handle OAuth callback parameters
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const success = params.get("success")
      const email = params.get("email")
      // Support both 'access_token' and 'token' for access token
      const accessToken = params.get("access_token") || params.get("token")
      const refreshToken = params.get("refresh_token") || params.get("refreshToken")
      const tokenExpiry = params.get("token_expiry") || params.get("expiry")
      
      if (success === "true" && email && accessToken) {
        // Store the tokens properly
        GmailTokenManager.storeTokens({
          accessToken,
          refreshToken: refreshToken || undefined,
          tokenExpiry: tokenExpiry || undefined,
          userEmail: email,
        })
        
        setGmailConnected(true)
        setMessage(`Gmail account linked successfully for ${email}`)
        window.history.replaceState({}, document.title, window.location.pathname)
        fetchGmailMessages()
      }
    }
  }, [setGmailConnected])

  // Check for valid tokens on mount and set Gmail as connected if found
  useEffect(() => {
    if (typeof window !== "undefined") {
      const tokens = GmailTokenManager.getTokens();
      if (tokens && GmailTokenManager.isTokenValid()) {
        setGmailConnected(true);
      }
    }
  }, [setGmailConnected]);

  const getAuthHeaders = () => {
    try {
      return GmailTokenManager.getAuthHeaders()
    } catch (error) {
      // If tokens are invalid, disconnect Gmail
      setGmailConnected(false)
      GmailTokenManager.clearTokens()
      return {}
    }
  }

  const generateFriendlyName = (email: GmailMessageDetail): { name: string; category: string; color: string } => {
    const subject = email.subject.toLowerCase()
    const from = email.from.toLowerCase()
    const snippet = email.snippet.toLowerCase()

    const senderMatch = email.from.match(/^(.+?)\s*</)
    const senderName = senderMatch ? senderMatch[1].trim() : email.from.split("@")[0]

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

    if (from.includes("facebook") || from.includes("instagram") || from.includes("twitter")) {
      const platform = from.includes("facebook") ? "Facebook" : from.includes("instagram") ? "Instagram" : "Twitter"
      return {
        name: `${platform} Notification`,
        category: "Social",
        color: "bg-pink-100 text-pink-800",
      }
    }

    if (from.includes("github") || from.includes("gitlab") || from.includes("stackoverflow")) {
      const platform = from.includes("github") ? "GitHub" : from.includes("gitlab") ? "GitLab" : "Stack Overflow"
      return {
        name: `${platform} Update`,
        category: "Development",
        color: "bg-gray-100 text-gray-800",
      }
    }

    if (from.includes("noreply") || from.includes("no-reply") || subject.includes("newsletter")) {
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

    if (!from.includes("noreply") && !from.includes("no-reply") && !email.from.includes("<")) {
      return {
        name: `Personal - ${senderName}`,
        category: "Personal",
        color: "bg-indigo-100 text-indigo-800",
      }
    }

    const shortSubject = email.subject.length > 30 ? email.subject.substring(0, 30) + "..." : email.subject
    return {
      name: shortSubject || `Email from ${senderName}`,
      category: "General",
      color: "bg-gray-100 text-gray-800",
    }
  }

  const fetchEmailDetails = async (messageId: string): Promise<GmailMessageDetail | null> => {
    // Always get the token from GmailTokenManager
    let headers: any = {};
    try {
      headers = GmailTokenManager.getAuthHeaders();
    } catch (err) {
      setError("Missing or invalid token. Please reconnect Gmail.");
      setGmailConnected(false);
      GmailTokenManager.clearTokens();
      return null;
    }
    try {
      // DO NOT append ?token=... to the URL!
      const response = await fetch(`${API_BASE_URL}/gmail/message/${messageId}`, {
        headers,
      });
      if (response.status === 401) {
        setError("Session expired or invalid credentials. Please reconnect Gmail.");
        setGmailMessages([]);
        setGmailConnected(false);
        GmailTokenManager.clearTokens();
        return null;
      }
      if (response.ok) {
        return await response.json();
      }
      console.error(`Failed to fetch details for message ${messageId}:`, response.status);
      return null;
    } catch (err) {
      console.error(`Failed to fetch details for message ${messageId}:`, err);
      return null;
    }
  }

  const fetchGmailMessages = async () => {
    if (!isGmailConnected) return

    if (!GmailTokenManager.isTokenValid()) {
      setError("Session expired or invalid credentials. Please reconnect Gmail.")
      setGmailMessages([])
      setGmailConnected(false)
      GmailTokenManager.clearTokens()
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError("")
    setLastReply(null)
    setGmailMessages([]) // Clear previous messages

    try {
      const response = await fetch(`${API_BASE_URL}/gmail/messages`, {
        headers: getAuthHeaders(),
      })

      if (response.status === 401) {
        setError("Session expired or invalid credentials. Please reconnect Gmail.")
        setGmailMessages([])
        setGmailConnected(false)
        GmailTokenManager.clearTokens()
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

        // Incrementally add each message as soon as its details are loaded
        messages.slice(0, 10).forEach(async (message) => {
          const details = await fetchEmailDetails(message.id)
          if (details) {
            const friendlyInfo = generateFriendlyName(details)
            setGmailMessages((prev) => [
              ...prev,
              {
                ...message,
                details,
                friendlyName: friendlyInfo.name,
                category: friendlyInfo.category,
                categoryColor: friendlyInfo.color,
              },
            ])
          }
        })
      }
    } catch (err) {
      setError("Failed to fetch Gmail messages.")
      setGmailMessages([])
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
    if (isGmailConnected && GmailTokenManager.isTokenValid()) {
      fetchGmailMessages()
    } else if (isGmailConnected && !GmailTokenManager.isTokenValid()) {
      // If connected but tokens are invalid, disconnect
      setGmailConnected(false)
      GmailTokenManager.clearTokens()
      setError("Session expired. Please reconnect Gmail.")
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
            <Button
              onClick={() => {
                window.location.href = `${API_BASE_URL}/gmail/authorize`
              }}
              className="mt-4"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Connect to Google
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inbox</h2>
          <p className="text-gray-600">
            {isGmailConnected ? `${gmailMessages.length} Gmail messages` : `${simpleEmails.length} emails`}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={isGmailConnected ? fetchGmailMessages : undefined}
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
        </div>
      </div>

      {message && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

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
            <>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error.includes('500') || error.toLowerCase().includes('server')
                    ? 'Server error. Please check your connection or try again later.'
                    : error.includes('401')
                      ? 'Authentication error. Please reconnect Gmail.'
                      : error}
                </AlertDescription>
              </Alert>
              <div className="flex justify-center mt-4">
                <Button
                  onClick={() => {
                    window.location.href = `${API_BASE_URL}/gmail/authorize`
                  }}
                  variant="outline"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Reconnect to Google
                </Button>
              </div>
            </>
          )}
        </>
      )}

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

      {isGmailConnected && gmailMessages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Gmail Messages
          </h3>
          <div className="grid gap-4">
            {paginatedMessages.map((message) => (
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
          {hasPrev && (
            <Button variant="outline" onClick={() => setCurrentPage(prev => prev - 1)}>Previous</Button>
          )}
          {hasNext && (
            <Button variant="outline" onClick={() => setCurrentPage(prev => prev + 1)}>Next</Button>
          )}
        </div>
      )}

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
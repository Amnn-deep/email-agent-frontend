"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Bot,
  Send,
  User,
  Calendar,
  Mail,
  AlertCircle,
  CheckCircle,
  Copy,
  Hash,
  MessageSquare,
} from "lucide-react"
import { API_BASE_URL } from "@/lib/api"
import ComposeEmail from "@/components/compose-email"
import { GmailTokenManager } from "@/lib/gmail-tokens"

interface EmailDetailProps {
  emailId: string
  onBack: () => void
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

interface AIReply {
  message_id: string
  summary: string
  reply: string
}

export default function EmailDetail({ emailId, onBack }: EmailDetailProps) {
  const [emailDetail, setEmailDetail] = useState<GmailMessageDetail | null>(null)
  const [aiReply, setAiReply] = useState<AIReply | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingReply, setIsGeneratingReply] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [customReply, setCustomReply] = useState("")
  const [showCompose, setShowCompose] = useState(false)

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token")
    return {
      Authorization: `Bearer ${token}`,
      accept: "application/json",
    }
  }

  const fetchEmailDetail = async () => {
    setIsLoading(true)
    setError("")

    try {
      // Use the correct token from GmailTokenManager
      const headers = GmailTokenManager.getAuthHeaders();
      console.log('GmailTokenManager.getTokens() before fetch:', GmailTokenManager.getTokens());
      const response = await fetch(`${API_BASE_URL}/gmail/message/${emailId}`, {
        headers,
      })

      if (response.ok) {
        const data = await response.json()
        setEmailDetail(data)

        // Automatically generate AI summary after loading email
        setTimeout(() => {
          generateAIReply()
        }, 500)
      } else {
        setError("Failed to fetch email details")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const generateAIReply = async () => {
    setIsGeneratingReply(true)
    setError("")
    setMessage("")

    try {
      // Use login_token (JWT) for Authorization header, Google token for query param
      const loginToken = localStorage.getItem("login_token");
      const tokens = GmailTokenManager.getTokens();
      const googleToken = tokens ? tokens.accessToken : null;
      if (!loginToken || !googleToken) {
        setError("Missing authentication. Please log in again.");
        setIsGeneratingReply(false);
        return;
      }
      const headers = {
        Authorization: `Bearer ${loginToken}`,
        "Content-Type": "application/json",
        accept: "application/json",
      };
      const response = await fetch(`${API_BASE_URL}/gmail/ai-reply/${emailId}?token=${googleToken}`, {
        method: "POST",
        headers,
      })

      if (response.ok) {
        const data = await response.json()
        console.log("AI Reply Response:", data) // Debug log

        // Check if we have a proper reply
        if (data.reply && data.reply.trim().length > 50) {
          setAiReply(data)
          setCustomReply(data.reply)
          setMessage("AI reply generated successfully!")
        } else {
          // Generate a better fallback reply based on email content
          const fallbackReply = generateFallbackReply(emailDetail)
          setAiReply({
            message_id: emailId,
            summary: data.summary || "This email requires your attention.",
            reply: fallbackReply,
          })
          setCustomReply(fallbackReply)
          setMessage("AI reply generated with enhanced content!")
        }
      } else {
        const errorData = await response.json()
        console.error("AI Reply Error:", errorData)

        // Generate a contextual fallback reply
        if (emailDetail) {
          const fallbackReply = generateFallbackReply(emailDetail)
          setAiReply({
            message_id: emailId,
            summary: "Unable to generate AI summary, but here's a contextual reply based on the email content.",
            reply: fallbackReply,
          })
          setCustomReply(fallbackReply)
          setMessage("Generated contextual reply based on email content!")
        } else {
          setError("Failed to generate AI reply")
        }
      }
    } catch (err) {
      console.error("Network Error:", err)

      // Generate a contextual fallback reply even on network error
      if (emailDetail) {
        const fallbackReply = generateFallbackReply(emailDetail)
        setAiReply({
          message_id: emailId,
          summary: "Network error occurred, but here's a contextual reply based on the email content.",
          reply: fallbackReply,
        })
        setCustomReply(fallbackReply)
        setMessage("Generated contextual reply (offline mode)!")
      } else {
        setError("Network error. Please try again.")
      }
    } finally {
      setIsGeneratingReply(false)
    }
  }

  // Add this new function to generate contextual fallback replies
  const generateFallbackReply = (email: GmailMessageDetail | null): string => {
    if (!email) return "Thank you for your email. I'll review it and get back to you soon.\n\nBest regards,\nAman Deep"

    const subject = email.subject.toLowerCase()
    const from = email.from.toLowerCase()
    const snippet = email.snippet.toLowerCase()

    // Job-related emails
    if (
      subject.includes("job") ||
      subject.includes("career") ||
      subject.includes("position") ||
      subject.includes("analyst") ||
      subject.includes("developer") ||
      subject.includes("engineer") ||
      from.includes("linkedin") ||
      from.includes("naukri") ||
      from.includes("indeed")
    ) {
      if (from.includes("linkedin") && (subject.includes("alert") || subject.includes("recommendation"))) {
        return `Dear LinkedIn Team,

Thank you for sending me these job recommendations. I'm actively looking for opportunities in data analysis and related fields.

I'm particularly interested in roles that involve:
- Data analysis and visualization
- Business intelligence and reporting
- Statistical modeling and insights
- Working with large datasets

I have experience with Python, SQL, Excel, and various data analysis tools. I'm excited to explore these opportunities and would appreciate any additional recommendations that match my profile.

Please keep me updated with similar positions.

Best regards,
Aman Deep`
      }

      if (subject.includes("application") || subject.includes("interview")) {
        return `Dear Hiring Manager,

Thank you for your email regarding the position. I'm very interested in this opportunity and excited about the possibility of joining your team.

I have relevant experience in data analysis and would love to discuss how my skills can contribute to your organization. I'm available for an interview at your convenience and can provide additional information about my background if needed.

Please let me know the next steps in the process.

Looking forward to hearing from you.

Best regards,
Aman Deep`
      }

      return `Dear Hiring Team,

Thank you for reaching out about this opportunity. I'm interested in learning more about the position and how my background in data analysis might be a good fit.

I'm currently seeking roles where I can apply my analytical skills and contribute to data-driven decision making. I'd be happy to discuss my experience and qualifications in more detail.

Please let me know if you need any additional information from my end.

Best regards,
Aman Deep`
    }

    // Marketing/promotional emails
    if (
      subject.includes("sale") ||
      subject.includes("offer") ||
      subject.includes("discount") ||
      subject.includes("deal") ||
      from.includes("noreply") ||
      from.includes("marketing")
    ) {
      return `Thank you for your email.

I appreciate you thinking of me for this offer. I'll review the details and get back to you if I'm interested.

Best regards,
Aman Deep`
    }

    // Newsletter/update emails
    if (
      subject.includes("newsletter") ||
      subject.includes("update") ||
      subject.includes("news") ||
      subject.includes("weekly") ||
      subject.includes("monthly")
    ) {
      return `Thank you for the update.

I appreciate you keeping me informed. I'll review the information you've shared.

Best regards,
Aman Deep`
    }

    // Professional/business emails
    if (
      from.includes("company") ||
      from.includes("team") ||
      subject.includes("meeting") ||
      subject.includes("project") ||
      subject.includes("collaboration")
    ) {
      return `Dear ${extractDisplayName(email.from) || "Team"},

Thank you for your email. I've reviewed the information you've shared and appreciate you reaching out.

I'm interested in discussing this further. Please let me know if you need any additional information from my side or if there are next steps we should take.

I look forward to your response.

Best regards,
Aman Deep`
    }

    // Default professional reply
    return `Dear ${extractDisplayName(email.from) || "Sir/Madam"},

Thank you for your email. I've received your message and will review it carefully.

I appreciate you taking the time to reach out, and I'll get back to you with a proper response soon.

If this is urgent, please feel free to follow up.

Best regards,
Aman Deep`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setMessage("Copied to clipboard!")
    setTimeout(() => setMessage(""), 3000)
  }

  const sendReply = async () => {
    if (!customReply.trim()) {
      setError("Please enter a reply message")
      return
    }

    // For now, copy the reply to clipboard and show instructions
    // since the backend doesn't have a send reply endpoint
    copyToClipboard(customReply)
    setMessage("Reply copied to clipboard! You can paste it in your email client to send.")

    // Alternative: Open Gmail compose with pre-filled content
    if (emailDetail) {
      const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailDetail?.from ?? "")}&su=${encodeURIComponent(`Re: ${emailDetail?.subject ?? ""}`)}&body=${encodeURIComponent(customReply)}`
      window.open(gmailComposeUrl, "_blank")
      setMessage("Gmail compose window opened with your reply!")
    }
  }

  const saveDraft = async () => {
    if (!customReply.trim()) {
      setError("Please enter a reply message")
      return
    }

    copyToClipboard(customReply)
    setMessage("Reply copied to clipboard!")
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return dateString
    }
  }

  const extractEmailAddress = (emailString: string) => {
    const match = emailString.match(/<(.+)>/)
    return match ? match[1] : emailString
  }

  const extractDisplayName = (emailString: string) => {
    const match = emailString.match(/^(.+)\s<.+>$/)
    return match ? match[1].trim() : emailString
  }

  const getEmailDomain = (email: string) => {
    const cleanEmail = extractEmailAddress(email)
    return cleanEmail.split("@")[1] || ""
  }

  const getEmailCategory = (from: string, subject: string) => {
    const domain = getEmailDomain(from).toLowerCase()
    const subjectLower = subject.toLowerCase()

    if (domain.includes("linkedin")) return { category: "Professional", color: "bg-blue-100 text-blue-800" }
    if (domain.includes("github") || domain.includes("gitlab"))
      return { category: "Development", color: "bg-purple-100 text-purple-800" }
    if (subjectLower.includes("job") || subjectLower.includes("career"))
      return { category: "Career", color: "bg-green-100 text-green-800" }
    if (domain.includes("noreply") || domain.includes("no-reply"))
      return { category: "Automated", color: "bg-gray-100 text-gray-800" }
    if (subjectLower.includes("sale") || subjectLower.includes("offer"))
      return { category: "Marketing", color: "bg-orange-100 text-orange-800" }

    return { category: "General", color: "bg-gray-100 text-gray-800" }
  }

  useEffect(() => {
    fetchEmailDetail()
  }, [emailId])

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error && !emailDetail) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inbox
        </Button>
      </div>
    )
  }

  const emailCategory = emailDetail ? getEmailCategory(emailDetail.from, emailDetail.subject) : null

  return (
    <div className="p-6 space-y-6 min-h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inbox
        </Button>
        <div className="flex space-x-2">
          <Button onClick={() => setShowCompose(true)} variant="outline" disabled={!emailDetail}>
            Reply
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

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Email Detail */}
      {emailDetail && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <div className="flex items-center space-x-3">
                  <CardTitle className="text-xl">{emailDetail?.subject ?? ""}</CardTitle>
                  {emailCategory && <Badge className={emailCategory.color}>{emailCategory.category}</Badge>}
                  <Badge variant="secondary">Gmail</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <span className="font-medium">From:</span>
                        <div className="text-gray-600">
                          <div className="font-medium">{extractDisplayName(emailDetail?.from ?? "")}</div>
                          <div className="text-xs text-gray-500">{extractEmailAddress(emailDetail?.from ?? "")}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <span className="font-medium">To:</span>
                        <div className="text-gray-600">
                          <div className="font-medium">{extractDisplayName(emailDetail?.to ?? "")}</div>
                          <div className="text-xs text-gray-500">{extractEmailAddress(emailDetail?.to ?? "")}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <span className="font-medium">Date:</span>
                        <div className="text-gray-600">{formatDate(emailDetail?.date ?? "")}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Hash className="h-4 w-4 text-gray-500" />
                      <div>
                        <span className="font-medium">Thread:</span>
                        <div className="text-gray-600 font-mono text-xs">{emailDetail?.threadId ?? ""}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {emailDetail?.snippet && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <h4 className="font-semibold text-sm text-gray-700">Preview:</h4>
                </div>
                <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border-l-4 border-blue-200">
                  {emailDetail?.snippet}
                </p>
              </div>
            )}

            {/* Email Content Preview */}
            {emailDetail?.body && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <h4 className="font-semibold text-sm text-gray-700">Content Preview:</h4>
                  </div>
                  <Button onClick={() => copyToClipboard(emailDetail?.body ?? "")} variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Full Content
                  </Button>
                </div>
                <div className="bg-white border rounded-lg p-4 max-h-32 overflow-y-auto text-sm text-gray-700">
                  {emailDetail?.body?.substring(0, 200) ?? ""}...
                </div>
              </div>
            )}

            <Separator />

            {/* Email Statistics */}
            {emailDetail?.body && (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-lg font-semibold text-blue-600">{(emailDetail?.body ?? "").length}</div>
                  <div className="text-xs text-gray-600">Characters</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-lg font-semibold text-green-600">
                    {(emailDetail?.body ?? "").split(" ").length}
                  </div>
                  <div className="text-xs text-gray-600">Words</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-lg font-semibold text-purple-600">{getEmailDomain(emailDetail.from)}</div>
                  <div className="text-xs text-gray-600">Domain</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Reply - now shows automatically as Email Summary */}
      {aiReply && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Bot className="h-5 w-5 mr-2 text-blue-600" />
              Email Summary & Suggested Reply
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold text-base text-gray-700 mb-3">📋 Summary:</h4>
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <p className="text-base text-gray-700 leading-relaxed">{aiReply.summary}</p>
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-base text-gray-700">✉️ Suggested Reply:</h4>
                <Button onClick={() => copyToClipboard(aiReply.reply)} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-1" />
                  Copy Reply
                </Button>
              </div>
              <Textarea
                value={customReply}
                onChange={(e) => setCustomReply(e.target.value)}
                className="min-h-40 bg-white text-base leading-relaxed"
                placeholder="Edit the AI-generated reply..."
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={saveDraft} disabled={isLoading || !customReply.trim()}>
                {isLoading ? "Saving..." : "Copy to Clipboard"}
              </Button>
              <Button onClick={sendReply} disabled={isLoading || !customReply.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Open in Gmail
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Metadata */}
      {emailDetail && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center">
              <Hash className="h-4 w-4 mr-2" />
              Technical Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Message ID:</span>
                  <p className="text-gray-600 font-mono text-xs break-all">{emailDetail.id}</p>
                </div>
                <div>
                  <span className="font-semibold">Thread ID:</span>
                  <p className="text-gray-600 font-mono text-xs break-all">{emailDetail.threadId}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Received:</span>
                  <p className="text-gray-600">{formatDate(emailDetail.date)}</p>
                </div>
                <div>
                  <span className="font-semibold">Source:</span>
                  <p className="text-gray-600">Gmail API</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showCompose && emailDetail && (
        <ComposeEmail
          onClose={() => setShowCompose(false)}
          replyTo={{
            to: emailDetail.from,
            subject: emailDetail.subject.startsWith("Re: ") ? emailDetail.subject : `Re: ${emailDetail.subject}`,
            messageId: emailDetail.id,
          }}
        />
      )}
    </div>
  )
}

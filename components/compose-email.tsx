"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Send, X, AlertCircle, CheckCircle } from "lucide-react"

interface ComposeEmailProps {
  onClose: () => void
  replyTo?: {
    to: string
    subject: string
    messageId?: string
  }
}

export default function ComposeEmail({ onClose, replyTo }: ComposeEmailProps) {
  const [emailData, setEmailData] = useState({
    to: replyTo?.to || "",
    subject: replyTo?.subject || "",
    body: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token")
    return {
      Authorization: `Bearer ${token}`,
      accept: "application/json",
      "Content-Type": "application/json",
    }
  }

  const sendEmail = async () => {
    if (!emailData.to.trim() || !emailData.subject.trim() || !emailData.body.trim()) {
      setError("Please fill in all required fields")
      return
    }

    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      const payload = {
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
        ...(replyTo?.messageId && { in_reply_to: replyTo.messageId }),
      }

      const response = await fetch("http://127.0.0.1:8000/gmail/send-email", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setMessage("Email sent successfully!")
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.detail || "Failed to send email")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const saveDraft = async () => {
    if (!emailData.body.trim()) {
      setError("Please enter email content")
      return
    }

    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("http://127.0.0.1:8000/gmail/save-draft", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(emailData),
      })

      if (response.ok) {
        setMessage("Draft saved successfully!")
      } else {
        const errorData = await response.json()
        setError(errorData.detail || "Failed to save draft")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{replyTo ? "Reply" : "Compose Email"}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="to">To *</Label>
            <Input
              id="to"
              type="email"
              placeholder="recipient@example.com"
              value={emailData.to}
              onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              type="text"
              placeholder="Email subject"
              value={emailData.subject}
              onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message *</Label>
            <Textarea
              id="body"
              placeholder="Type your message here..."
              className="min-h-48"
              value={emailData.body}
              onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="outline" onClick={saveDraft} disabled={isLoading}>
              Save Draft
            </Button>
            <Button onClick={sendEmail} disabled={isLoading}>
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? "Sending..." : "Send"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

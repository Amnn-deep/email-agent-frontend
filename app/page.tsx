"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import LoginForm from "@/components/login-form"
import EmailDashboard from "@/components/email-dashboard"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (token) {
      // Verify token is still valid by making a test API call
      fetch("https://email-agent-backendd.vercel.app/gmail/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
          accept: "application/json",
        },
      })
        .then((response) => {
          if (response.ok) {
            setIsAuthenticated(true)
          } else {
            localStorage.removeItem("access_token")
            setIsAuthenticated(false)
          }
        })
        .catch(() => {
          localStorage.removeItem("access_token")
          setIsAuthenticated(false)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      {isAuthenticated ? (
        <EmailDashboard onLogout={() => setIsAuthenticated(false)} />
      ) : (
        <LoginForm onLogin={() => setIsAuthenticated(true)} />
      )}
    </div>
  )
}

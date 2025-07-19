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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-24 w-24 sm:h-32 sm:w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto flex flex-col items-center px-2 sm:px-4 md:px-8">
      <div className="w-full max-w-md sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl flex flex-col flex-1">
        {isAuthenticated ? (
          <EmailDashboard onLogout={() => setIsAuthenticated(false)} />
        ) : (
          <LoginForm onLogin={() => setIsAuthenticated(true)} />
        )}
      </div>
    </div>
  )
}

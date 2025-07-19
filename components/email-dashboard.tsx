"use client"

import { useState, useEffect } from "react"
import { Menu, Mail, Inbox, User, LogOut, RefreshCw, ExternalLink, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import EmailList from "@/components/email-list"
import EmailDetail from "@/components/email-detail"
import UserProfile from "@/components/user-profile"

function EmailDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("inbox");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  type GmailProfile = {
    messagesTotal: number;
    threadsTotal: number;
    // add other properties as needed
  };
  const [gmailProfile, setGmailProfile] = useState<GmailProfile | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Connect Gmail logic (replace with real API call in production)
  const connectGmail = async () => {
    setIsLoading(true);
    setError("");
    try {
      // Simulate API call for Gmail connect
      // Replace this with your real OAuth or backend call
      // Example: await fetch('/api/connect-gmail')
      setTimeout(() => {
        setIsGmailConnected(true);
        setIsLoading(false);
        setError("");
      }, 1000);
    } catch (err) {
      setError("Failed to connect Gmail");
      setIsLoading(false);
    }
  };

  // Check Gmail connection (replace with real API call in production)
  const checkGmailConnection = async () => {
    setError("");
    // Optionally, check token validity here
  };

  // Logout logic
  const handleLogout = () => {
    setIsGmailConnected(false);
    setGmailProfile(null);
    setError("");
  };

  useEffect(() => {
    setSidebarOpen(false);
    setError("");
    // Automatically connect to Gmail on mount if not already connected or loading
    if (!isGmailConnected && !isLoading) {
      connectGmail();
    }
  }, []);

  // Auto-fetch emails when Gmail is connected and inbox is active
  useEffect(() => {
    if (isGmailConnected && activeTab === "inbox") {
      // Simulate a fetch by calling EmailList's fetch logic
      // If EmailList expects a prop like onAutoFetch, you can call it here
      // Otherwise, trigger a state change to force EmailList to reload
      setMessage(""); // Optionally clear any previous messages
      setError("");
      // Optionally, you can add a state like 'shouldFetchEmails' and pass it to EmailList
      // For now, EmailList should fetch emails on mount or when isGmailConnected changes
    }
  }, [isGmailConnected, activeTab]);

  useEffect(() => {
    setError("");
  }, [activeTab]);

  function renderContent() {
    if (activeTab === "profile") {
      return <UserProfile gmailProfile={gmailProfile} />;
    } else if (selectedEmailId) {
      return <EmailDetail emailId={selectedEmailId} onBack={() => setSelectedEmailId(null)} />;
    } else {
      return <EmailList onSelectEmail={setSelectedEmailId} isGmailConnected={isGmailConnected} />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Hamburger menu for mobile */}
            <button
              className="sm:hidden mr-2 p-2 rounded hover:bg-gray-100 focus:outline-none"
              aria-label="Open sidebar"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
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
        {/* Sidebar for desktop, drawer for mobile */}
        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-30 sm:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
        <aside
          className={
            `w-64 bg-white border-r border-gray-200 p-4 z-50 ` +
            `sm:static sm:translate-x-0 sm:block ` +
            `${sidebarOpen ? 'fixed top-0 left-0 h-full shadow-lg transition-transform duration-200 translate-x-0' : 'fixed top-0 -translate-x-full sm:translate-x-0 sm:block'} ` +
            `sm:relative`
          }
          style={{ maxWidth: '16rem' }}
        >
          {/* Close button for mobile */}
          <div className="flex justify-end sm:hidden mb-2">
            <button
              className="p-2 rounded hover:bg-gray-100 focus:outline-none"
              aria-label="Close sidebar"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="text-xl">×</span>
            </button>
          </div>
          <nav className="space-y-2">
            <Button
              variant={activeTab === "inbox" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                setActiveTab("inbox")
                setSelectedEmailId(null)
                setSidebarOpen(false)
              }}
            >
              <Inbox className="h-4 w-4 mr-2" />
              Inbox
              {gmailProfile && (
                <Badge variant="secondary" className="ml-auto">
                  {gmailProfile?.messagesTotal}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeTab === "profile" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                setActiveTab("profile")
                setSidebarOpen(false)
              }}
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
                      <div>Messages: {gmailProfile?.messagesTotal}</div>
                      <div>Threads: {gmailProfile?.threadsTotal}</div>
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
          {/* Only show error if not connected and not loading */}
          {error && !isGmailConnected && !isLoading && (
            <Alert variant="destructive" className="m-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {message && (
            <Alert className="m-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default EmailDashboard;

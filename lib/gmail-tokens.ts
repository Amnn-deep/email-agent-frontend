// Gmail token management utilities

export interface GmailTokens {
  accessToken: string
  refreshToken?: string
  tokenExpiry?: string
  userEmail?: string
}

export const GmailTokenManager = {
  // Store Gmail tokens in localStorage
  storeTokens: (tokens: GmailTokens) => {
    if (tokens.accessToken) {
      localStorage.setItem("gmail_access_token", tokens.accessToken)
    }
    if (tokens.refreshToken) {
      localStorage.setItem("gmail_refresh_token", tokens.refreshToken)
    }
    if (tokens.tokenExpiry) {
      localStorage.setItem("gmail_token_expiry", tokens.tokenExpiry)
    }
    if (tokens.userEmail) {
      localStorage.setItem("gmail_user_email", tokens.userEmail)
    }
  },

  // Get stored Gmail tokens
  getTokens: (): GmailTokens | null => {
    const accessToken = localStorage.getItem("gmail_access_token")
    if (!accessToken) return null
    return {
      accessToken,
      refreshToken: localStorage.getItem("gmail_refresh_token") || undefined,
      tokenExpiry: localStorage.getItem("gmail_token_expiry") || undefined,
      userEmail: localStorage.getItem("gmail_user_email") || undefined,
    }
  },

  // Check if tokens are valid
  isTokenValid: (): boolean => {
    const tokens = GmailTokenManager.getTokens()
    if (!tokens) return false

    // Check if token is expired
    if (tokens.tokenExpiry) {
      const expiryTime = new Date(tokens.tokenExpiry).getTime()
      const currentTime = new Date().getTime()
      if (currentTime >= expiryTime) {
        return false
      }
    }

    return true
  },

  // Clear all Gmail tokens
  clearTokens: () => {
    localStorage.removeItem("gmail_access_token")
    localStorage.removeItem("gmail_refresh_token")
    localStorage.removeItem("gmail_token_expiry")
    localStorage.removeItem("gmail_user_email")
  },

  // Get auth headers for API requests
  getAuthHeaders: () => {
    const tokens = GmailTokenManager.getTokens()
    if (!tokens) {
      throw new Error("No Gmail tokens found. Please reconnect Gmail.")
    }

    if (!GmailTokenManager.isTokenValid()) {
      throw new Error("Gmail token has expired. Please reconnect to refresh.")
    }

    // Send the token directly - let backend handle Gmail API calls
    return {
      Authorization: `Bearer ${tokens.accessToken}`,
      "Content-Type": "application/json",
      accept: "application/json",
    }
  },
} 
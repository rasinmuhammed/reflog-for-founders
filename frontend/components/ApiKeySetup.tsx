'use client'

import { useState } from 'react'
import { Key, X, ExternalLink, CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ApiKeySetupProps {
  userEmail: string
  onComplete: () => void
  onClose?: () => void
  required?: boolean
}

export default function ApiKeySetup({ userEmail, onComplete, onClose, required = false }: ApiKeySetupProps) {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your API key')
      return
    }

    if (!apiKey.startsWith('gsk_')) {
      setError('Invalid API key format. Groq API keys start with "gsk_"')
      return
    }

    setSaving(true)
    setError('')

    try {
      const response = await fetch(
        `${API_URL}/users/${encodeURIComponent(userEmail)}/groq-key`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groq_api_key: apiKey })
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Failed to save API key')
      }

      setSuccess(true)
      setTimeout(() => {
        onComplete()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to save API key')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[#000000]/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-[#242424] border border-[#242424]/60 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#242424]/60 sticky top-0 bg-[#242424]/95 backdrop-blur-md z-10 rounded-t-3xl">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-[#933DC9] to-[#53118F] p-3 rounded-xl">
              <Key className="w-6 h-6 text-[#FBFAEE]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#FBFAEE]">
                {required ? 'API Key Required' : 'Setup Your Groq API Key'}
              </h2>
              <p className="text-sm text-[#FBFAEE]/70">Free AI analysis with your own key</p>
            </div>
          </div>
          {!required && onClose && (
            <button
              onClick={onClose}
              className="text-[#FBFAEE]/60 hover:text-[#FBFAEE] transition p-2 hover:bg-[#000000]/30 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Box */}
          <div className="bg-gradient-to-br from-[#933DC9]/20 to-[#53118F]/20 border border-[#933DC9]/30 rounded-2xl p-6">
            <h3 className="font-semibold text-[#FBFAEE] mb-3 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-[#C488F8]" />
              Why do I need this?
            </h3>
            <ul className="space-y-2 text-sm text-[#FBFAEE]/80">
              <li className="flex items-start">
                <span className="text-[#C488F8] mr-2">•</span>
                <span>Reflog uses your own Groq API key for AI analysis</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#C488F8] mr-2">•</span>
                <span>This keeps your data private and the service free</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#C488F8] mr-2">•</span>
                <span>Groq offers a generous free tier (perfect for personal use)</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#C488F8] mr-2">•</span>
                <span>Your key is stored securely and only used for your requests</span>
              </li>
            </ul>
          </div>

          {/* Steps to Get Key */}
          <div className="bg-[#000000]/40 border border-[#242424]/50 rounded-xl p-6">
            <h3 className="font-semibold text-[#FBFAEE] mb-4">How to Get Your Free API Key:</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-gradient-to-r from-[#933DC9] to-[#53118F] text-[#FBFAEE] w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-[#FBFAEE]/90 mb-2">Visit Groq Console</p>
                  <a
                    href="https://console.groq.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-[#C488F8] hover:text-[#933DC9] transition text-sm"
                  >
                    <span>console.groq.com</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-gradient-to-r from-[#933DC9] to-[#53118F] text-[#FBFAEE] w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-[#FBFAEE]/90">Sign up (it's free!) and verify your email</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-gradient-to-r from-[#933DC9] to-[#53118F] text-[#FBFAEE] w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-[#FBFAEE]/90">Click "API Keys" → "Create API Key"</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-gradient-to-r from-[#933DC9] to-[#53118F] text-[#FBFAEE] w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  4
                </div>
                <div className="flex-1">
                  <p className="text-[#FBFAEE]/90">Copy your key (starts with "gsk_") and paste below</p>
                </div>
              </div>
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-sm font-medium text-[#FBFAEE]/80 mb-2">
              Your Groq API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value)
                  setError('')
                }}
                placeholder="gsk_..."
                className="w-full px-4 py-3 pr-12 bg-[#000000]/50 border border-[#242424]/60 text-[#FBFAEE] placeholder-[#FBFAEE]/50 rounded-lg focus:ring-2 focus:ring-[#933DC9] focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FBFAEE]/60 hover:text-[#FBFAEE] transition"
              >
                {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {error && (
              <div className="mt-2 flex items-center space-x-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mt-2 flex items-center space-x-2 text-green-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>API key saved successfully!</span>
              </div>
            )}
          </div>

          {/* Privacy Note */}
          <div className="bg-[#933DC9]/10 border border-[#933DC9]/30 rounded-xl p-4">
            <p className="text-sm text-[#FBFAEE]/80">
              🔒 <strong className="text-[#C488F8]">Privacy:</strong> Your API key is stored securely
              and only used to make AI requests on your behalf. We never share it or use it for
              anything else.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            {!required && onClose && (
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-[#000000]/40 text-[#FBFAEE]/80 rounded-xl font-semibold hover:bg-[#000000]/60 transition border border-[#242424]/50"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !apiKey.trim()}
              className={`${!required && onClose ? 'flex-1' : 'w-full'} bg-gradient-to-r from-[#933DC9] to-[#53118F] text-[#FBFAEE] px-6 py-3 rounded-xl font-semibold hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Validating & Saving...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Saved!
                </>
              ) : (
                'Save API Key'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
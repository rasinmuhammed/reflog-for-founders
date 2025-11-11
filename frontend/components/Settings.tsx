'use client'

import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Key, Bell, X, Loader2, CheckCircle, AlertCircle, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface SettingsProps {
  userEmail: string
  onClose: () => void
}

export default function Setting({ userEmail, onClose }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'api-key' | 'notifications'>('api-key')
  const [hasKey, setHasKey] = useState(false)
  const [keyPreview, setKeyPreview] = useState('')
  const [newKey, setNewKey] = useState('')
  const [showNewKey, setShowNewKey] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadApiKeyStatus()
  }, [userEmail])

  const loadApiKeyStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `${API_URL}/users/${encodeURIComponent(userEmail)}/groq-key/status`
      )
      const data = await response.json()
      setHasKey(data.has_key)
      setKeyPreview(data.key_preview || '')
    } catch (error) {
      console.error('Failed to load API key status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveKey = async () => {
    if (!newKey.trim()) {
      setError('Please enter an API key')
      return
    }

    if (!newKey.startsWith('gsk_')) {
      setError('Invalid API key format. Groq API keys start with "gsk_"')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(
        `${API_URL}/users/${encodeURIComponent(userEmail)}/groq-key`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groq_api_key: newKey })
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Failed to save API key')
      }

      setSuccess('API key saved successfully!')
      setNewKey('')
      await loadApiKeyStatus()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save API key')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteKey = async () => {
    if (!confirm('Are you sure you want to delete your API key? AI features will be disabled.')) {
      return
    }

    setDeleting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(
        `${API_URL}/users/${encodeURIComponent(userEmail)}/groq-key`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error('Failed to delete API key')
      }

      setSuccess('API key deleted successfully')
      await loadApiKeyStatus()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to delete API key')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[#000000]/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-[#242424] border border-[#242424]/60 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#242424]/60 sticky top-0 bg-[#242424]/95 backdrop-blur-md z-10 rounded-t-3xl">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-[#933DC9] to-[#53118F] p-3 rounded-xl">
              <SettingsIcon className="w-6 h-6 text-[#FBFAEE]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#FBFAEE]">Settings</h2>
              <p className="text-sm text-[#FBFAEE]/70">Manage your account preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#FBFAEE]/60 hover:text-[#FBFAEE] transition p-2 hover:bg-[#000000]/30 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#242424]/60 px-6">
          <button
            onClick={() => setActiveTab('api-key')}
            className={`px-4 py-3 font-medium transition-all border-b-2 ${
              activeTab === 'api-key'
                ? 'border-[#933DC9] text-[#C488F8]'
                : 'border-transparent text-[#FBFAEE]/60 hover:text-[#FBFAEE]/90'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4" />
              <span>API Key</span>
              {!hasKey && (
                <span className="w-2 h-2 bg-orange-500 rounded-full" />
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-3 font-medium transition-all border-b-2 ${
              activeTab === 'notifications'
                ? 'border-[#933DC9] text-[#C488F8]'
                : 'border-transparent text-[#FBFAEE]/60 hover:text-[#FBFAEE]/90'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {activeTab === 'api-key' && (
            <>
              {/* Current Status */}
              <div className={`rounded-2xl p-6 border-2 ${
                hasKey
                  ? 'bg-green-900/20 border-green-500/40'
                  : 'bg-orange-900/20 border-orange-500/40'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-[#FBFAEE] text-lg flex items-center">
                    {hasKey ? (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                        API Key Configured
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 mr-2 text-orange-400" />
                        No API Key Set
                      </>
                    )}
                  </h3>
                </div>
                {hasKey ? (
                  <>
                    <p className="text-sm text-[#FBFAEE]/70 mb-2">
                      Your Groq API key is configured and AI features are enabled.
                    </p>
                    <div className="bg-[#000000]/40 rounded-lg p-3 mb-3">
                      <p className="text-xs text-[#FBFAEE]/60 mb-1">Current Key:</p>
                      <p className="text-sm text-[#FBFAEE] font-mono">{keyPreview}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-[#FBFAEE]/70">
                    Add your Groq API key to enable AI analysis features. Get a free key from Groq.
                  </p>
                )}
              </div>

              {/* How to Get Key */}
              <div className="bg-[#000000]/40 border border-[#242424]/50 rounded-xl p-6">
                <h3 className="font-semibold text-[#FBFAEE] mb-4 flex items-center">
                  <Key className="w-5 h-5 mr-2 text-[#933DC9]" />
                  {hasKey ? 'Update Your API Key' : 'Get Your Free API Key'}
                </h3>
                
                {!hasKey && (
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start space-x-3 text-sm">
                      <div className="bg-[#933DC9]/20 text-[#C488F8] w-6 h-6 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xs">
                        1
                      </div>
                      <div className="flex-1">
                        <p className="text-[#FBFAEE]/90">Visit Groq Console</p>
                        <a
                          href="https://console.groq.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-[#C488F8] hover:text-[#933DC9] transition text-xs mt-1"
                        >
                          <span>console.groq.com</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 text-sm">
                      <div className="bg-[#933DC9]/20 text-[#C488F8] w-6 h-6 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xs">
                        2
                      </div>
                      <p className="text-[#FBFAEE]/90 flex-1">Sign up and verify your email</p>
                    </div>
                    <div className="flex items-start space-x-3 text-sm">
                      <div className="bg-[#933DC9]/20 text-[#C488F8] w-6 h-6 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xs">
                        3
                      </div>
                      <p className="text-[#FBFAEE]/90 flex-1">Create an API key and paste it below</p>
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="relative mb-4">
                  <input
                    type={showNewKey ? 'text' : 'password'}
                    value={newKey}
                    onChange={(e) => {
                      setNewKey(e.target.value)
                      setError('')
                    }}
                    placeholder="gsk_..."
                    className="w-full px-4 py-3 pr-12 bg-[#000000]/50 border border-[#242424]/60 text-[#FBFAEE] placeholder-[#FBFAEE]/50 rounded-lg focus:ring-2 focus:ring-[#933DC9] focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewKey(!showNewKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FBFAEE]/60 hover:text-[#FBFAEE] transition"
                  >
                    {showNewKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Messages */}
                {error && (
                  <div className="mb-4 flex items-center space-x-2 text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="mb-4 flex items-center space-x-2 text-green-400 text-sm bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleSaveKey}
                    disabled={saving || !newKey.trim()}
                    className="flex-1 bg-gradient-to-r from-[#933DC9] to-[#53118F] text-[#FBFAEE] px-4 py-2.5 rounded-lg font-semibold hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      hasKey ? 'Update Key' : 'Save Key'
                    )}
                  </button>
                  {hasKey && (
                    <button
                      onClick={handleDeleteKey}
                      disabled={deleting}
                      className="px-4 py-2.5 bg-red-900/40 hover:bg-red-900/60 text-red-300 rounded-lg font-semibold transition disabled:opacity-60 flex items-center"
                    >
                      {deleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Privacy Note */}
              <div className="bg-[#933DC9]/10 border border-[#933DC9]/30 rounded-xl p-4">
                <p className="text-sm text-[#FBFAEE]/80">
                  🔒 <strong className="text-[#C488F8]">Privacy & Security:</strong> Your API key
                  is stored securely and only used to make AI requests on your behalf. We never
                  share it or use it for anything else. You maintain full control over your API
                  usage and costs.
                </p>
              </div>
            </>
          )}

          {activeTab === 'notifications' && (
            <div className="text-center py-12 text-[#FBFAEE]/60">
              <Bell className="w-16 h-16 mx-auto mb-4 text-[#FBFAEE]/30" />
              <p>Notification settings coming soon...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#242424]/60 p-6 sticky bottom-0 bg-[#242424]/95 backdrop-blur-md">
          <button
            onClick={onClose}
            className="w-full bg-[#000000]/40 text-[#FBFAEE]/80 px-6 py-3 rounded-xl font-semibold hover:bg-[#000000]/60 transition border border-[#242424]/50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
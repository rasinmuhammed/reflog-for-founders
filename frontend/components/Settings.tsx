'use client'

import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Key, Bell, X, Loader2, CheckCircle, AlertCircle, Trash2, Eye, EyeOff, ExternalLink, Link2, Unlink, Calendar, Mail } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface SettingsProps {
  userEmail: string
  onClose: () => void
}

export default function Setting({ userEmail, onClose }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'api-key' | 'integrations' | 'notifications'>('api-key')
  const [hasKey, setHasKey] = useState(false)
  const [keyPreview, setKeyPreview] = useState('')
  const [newKey, setNewKey] = useState('')
  const [showNewKey, setShowNewKey] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [googleStatus, setGoogleStatus] = useState<{
    is_configured: boolean
    is_connected: boolean
    scopes: string[]
  }>({ is_configured: false, is_connected: false, scopes: [] })
  const [connectingGoogle, setConnectingGoogle] = useState(false)

  useEffect(() => {
    loadApiKeyStatus()
    loadGoogleStatus()

    const params = new URLSearchParams(window.location.search)
    if (params.get('google_connected')) {
      setSuccess('Google account connected successfully!')
      loadGoogleStatus()
      window.history.replaceState({}, '', window.location.pathname)
    }
    if (params.get('google_error')) {
      setError('Failed to connect Google account. Please try again.')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [userEmail])

  const loadApiKeyStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/users/${encodeURIComponent(userEmail)}/groq-key/status`)
      const data = await response.json()
      setHasKey(data.has_key)
      setKeyPreview(data.key_preview || '')
    } catch (err) {
      console.error('Failed to load API key status:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadGoogleStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/google/status/${encodeURIComponent(userEmail)}`)
      const data = await response.json()
      setGoogleStatus(data)
    } catch (err) {
      console.error('Failed to load Google status:', err)
    }
  }

  const handleConnectGoogle = async () => {
    setConnectingGoogle(true)
    try {
      const response = await fetch(
        `${API_URL}/auth/google/connect/${encodeURIComponent(userEmail)}?redirect_uri=${encodeURIComponent(window.location.origin + '/settings')}`
      )
      const data = await response.json()
      if (data.authorization_url) {
        window.location.href = data.authorization_url
      }
    } catch (err) {
      setError('Failed to initiate Google connection')
      setConnectingGoogle(false)
    }
  }

  const handleDisconnectGoogle = async () => {
    if (!confirm('Disconnect your Google account? Calendar and email features will use demo data.')) return
    try {
      await fetch(`${API_URL}/auth/google/disconnect/${encodeURIComponent(userEmail)}`, { method: 'DELETE' })
      setSuccess('Google account disconnected')
      await loadGoogleStatus()
    } catch (err) {
      setError('Failed to disconnect Google account')
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
      const response = await fetch(`${API_URL}/users/${encodeURIComponent(userEmail)}/groq-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groq_api_key: newKey })
      })

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
    if (!confirm('Are you sure you want to delete your API key? AI features will be disabled.')) return

    setDeleting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_URL}/users/${encodeURIComponent(userEmail)}/groq-key`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete API key')

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
    <div
      className="fixed inset-0 backdrop-blur-md flex items-center justify-center p-4 z-50"
      style={{ background: 'rgba(0,0,0,0.9)' }}
    >
      <div
        className="rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5 sticky top-0 z-10"
          style={{ background: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg" style={{ background: 'var(--color-accent-muted)' }}>
              <SettingsIcon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>Settings</h2>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Manage your account</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:opacity-70 transition" style={{ color: 'var(--color-text-muted)' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
          {[
            { id: 'api-key', label: 'API Key', icon: Key, badge: !hasKey },
            { id: 'integrations', label: 'Integrations', icon: Link2, badge: googleStatus.is_connected },
            { id: 'notifications', label: 'Notifications', icon: Bell }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
              style={{
                background: activeTab === tab.id ? 'var(--color-accent-muted)' : 'transparent',
                color: activeTab === tab.id ? 'var(--color-accent)' : 'var(--color-text-muted)'
              }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: tab.badge ? 'var(--color-success)' : 'var(--color-warning)' }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Messages */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--color-success)' }}>
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}

          {activeTab === 'api-key' && (
            <>
              {/* Status Card */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: hasKey ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                  border: `1px solid ${hasKey ? 'rgba(34,197,94,0.3)' : 'rgba(234,179,8,0.3)'}`
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {hasKey ? (
                    <CheckCircle className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                  ) : (
                    <AlertCircle className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />
                  )}
                  <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {hasKey ? 'API Key Configured' : 'No API Key Set'}
                  </span>
                </div>
                {hasKey && (
                  <p className="text-sm font-mono pl-7" style={{ color: 'var(--color-text-muted)' }}>{keyPreview}</p>
                )}
              </div>

              {/* Key Input */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                  <Key className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                  {hasKey ? 'Update Key' : 'Get Your Free API Key'}
                </h3>

                {!hasKey && (
                  <div className="space-y-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    <p>1. Visit <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--color-accent)' }}>console.groq.com</a></p>
                    <p>2. Sign up and verify your email</p>
                    <p>3. Create an API key and paste it below</p>
                  </div>
                )}

                <div className="relative">
                  <input
                    type={showNewKey ? 'text' : 'password'}
                    value={newKey}
                    onChange={(e) => { setNewKey(e.target.value); setError('') }}
                    placeholder="gsk_..."
                    className="w-full px-4 py-3 pr-12 rounded-lg text-sm"
                    style={{
                      background: 'var(--color-bg-shell)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewKey(!showNewKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {showNewKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveKey}
                    disabled={saving || !newKey.trim()}
                    className="flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background: 'var(--color-accent)', color: 'white' }}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {hasKey ? 'Update Key' : 'Save Key'}
                  </button>
                  {hasKey && (
                    <button
                      onClick={handleDeleteKey}
                      disabled={deleting}
                      className="px-4 py-2.5 rounded-lg"
                      style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)' }}
                    >
                      {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Privacy Note */}
              <div className="rounded-lg p-3 text-sm" style={{ background: 'var(--color-accent-muted)', color: 'var(--color-text-muted)' }}>
                🔒 <strong style={{ color: 'var(--color-accent)' }}>Privacy:</strong> Your API key is encrypted and only used for AI requests on your behalf.
              </div>
            </>
          )}

          {activeTab === 'integrations' && (
            <>
              <div
                className="rounded-xl p-4"
                style={{
                  background: googleStatus.is_connected ? 'rgba(34,197,94,0.1)' : 'var(--color-bg-shell)',
                  border: `1px solid ${googleStatus.is_connected ? 'rgba(34,197,94,0.3)' : 'var(--color-border)'}`
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Google</h3>
                      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Calendar & Gmail</p>
                    </div>
                  </div>
                  {googleStatus.is_connected && (
                    <span className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-success)' }}>
                      <CheckCircle className="w-4 h-4" /> Connected
                    </span>
                  )}
                </div>

                {googleStatus.is_connected ? (
                  <>
                    <div className="flex gap-4 mb-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" style={{ color: 'var(--color-success)' }} /> Calendar</span>
                      <span className="flex items-center gap-1"><Mail className="w-4 h-4" style={{ color: 'var(--color-success)' }} /> Email</span>
                    </div>
                    <button onClick={handleDisconnectGoogle} className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-error)' }}>
                      <Unlink className="w-4 h-4" /> Disconnect
                    </button>
                  </>
                ) : googleStatus.is_configured ? (
                  <button
                    onClick={handleConnectGoogle}
                    disabled={connectingGoogle}
                    className="w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 bg-white text-gray-800"
                  >
                    {connectingGoogle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                    Connect Google Account
                  </button>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--color-warning)' }}>
                    Google OAuth not configured. Using demo data.
                  </p>
                )}
              </div>

              {/* Microsoft / Outlook (Placeholder) */}
              <div
                className="rounded-xl p-4 mt-4 opacity-75"
                style={{
                  background: 'var(--color-bg-shell)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#0078D4] flex items-center justify-center text-white">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.5,2.75L1,5.65c-0.2,0.06-0.34,0.22-0.34,0.43v11.83c0,0.22,0.15,0.39,0.36,0.43l10.48,2.78 c0.12,0.03,0.25-0.01,0.33-0.09c0.09-0.09,0.13-0.2,0.13-0.32V12.01V2.85C11.96,2.6,11.75,2.5,11.5,2.75z M10.46,16.5 l-7.96-1.59v-5.26l7.96,1.25V16.5z M10.46,9.59L2.5,8.34V4.28l7.96-1.92V9.59z M22.9,5.74l-9.94-1.99 c-0.18-0.04-0.36,0.09-0.36,0.28v15.93c0,0.19,0.18,0.32,0.36,0.28l9.94-2c0.27-0.05,0.46-0.29,0.46-0.56V6.31 C23.36,6.03,23.17,5.79,22.9,5.74z M21.86,16.48l-7.76,1.43v-4.7l7.76-1.12V16.48z M21.86,10.74l-7.76,1.13V8.04l7.76-1.39 V10.74z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                        Microsoft Outlook
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-yellow-500/30 text-yellow-500 bg-yellow-500/10">Coming Soon</span>
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Calendar & Teams</p>
                    </div>
                  </div>
                  <button
                    disabled
                    className="px-4 py-2 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed"
                    style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}
                  >
                    Connect
                  </button>
                </div>
                <p className="text-xs italic" style={{ color: 'var(--color-text-subtle)' }}>
                  Integration via Microsoft Graph API is currently in development.
                </p>
              </div>

              <div className="rounded-lg p-3 text-sm" style={{ background: 'var(--color-accent-muted)', color: 'var(--color-text-muted)' }}>
                🔒 <strong style={{ color: 'var(--color-accent)' }}>Privacy:</strong> Read-only access. Your data is never stored.
              </div>
            </>
          )}

          {activeTab === 'notifications' && (
            <div className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Notification settings coming soon...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5" style={{ borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg font-medium text-sm"
            style={{ background: 'var(--color-bg-shell)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
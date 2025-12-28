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
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: 'rgba(1, 39, 49, 0.95)', backdropFilter: 'blur(5px)' }}
    >
      <div
        className="card max-w-xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5 sticky top-0 z-10"
          style={{
            borderBottom: '1px solid var(--color-border-subtle)',
            background: 'var(--color-bg-card)'
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-lg"
              style={{ background: 'var(--color-accent-muted)' }}
            >
              <Key className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {required ? 'API Key Required' : 'Setup Groq API Key'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Free AI analysis with your own key
              </p>
            </div>
          </div>
          {!required && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition hover:bg-white/5"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Info Box */}
          <div
            className="rounded-lg p-5"
            style={{
              background: 'var(--color-accent-muted)',
              border: '1px solid var(--color-border)'
            }}
          >
            <h3
              className="font-medium text-sm mb-3 flex items-center"
              style={{ color: 'var(--color-accent)' }}
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Why do I need this?
            </h3>
            <ul className="space-y-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <li className="flex items-start">
                <span className="mr-2 text-accent">•</span>
                <span>Reflog uses your own Groq API key for AI analysis</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-accent">•</span>
                <span>This keeps your data private and the service free</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-accent">•</span>
                <span>Groq offers a generous free tier (perfect for personal use)</span>
              </li>
            </ul>
          </div>

          {/* Steps to Get Key */}
          <div
            className="rounded-lg p-5"
            style={{
              background: 'var(--color-bg-shell)',
              border: '1px solid var(--color-border-subtle)'
            }}
          >
            <h3 className="font-medium text-sm mb-4">How to Get Your Free API Key:</h3>
            <div className="space-y-4">
              {[
                { step: 1, text: 'Visit Groq Console', link: 'https://console.groq.com' },
                { step: 2, text: 'Sign up (free!) and verify your email' },
                { step: 3, text: 'Click "API Keys" → "Create API Key"' },
                { step: 4, text: 'Copy your key (starts with "gsk_") and paste below' }
              ].map(({ step, text, link }) => (
                <div key={step} className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center text-sm font-semibold flex-shrink-0"
                    style={{
                      background: 'var(--color-accent-muted)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-accent)'
                    }}
                  >
                    {step}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{text}</p>
                    {link && (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs mt-1 transition hover:underline"
                        style={{ color: 'var(--color-accent)' }}
                      >
                        <span>{link.replace('https://', '')}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
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
                className="input pr-12"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition hover:text-white"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <div
                className="mt-2 flex items-center gap-2 text-xs"
                style={{ color: 'var(--color-error)' }}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div
                className="mt-2 flex items-center gap-2 text-xs"
                style={{ color: 'var(--color-success)' }}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>API key saved successfully!</span>
              </div>
            )}
          </div>

          {/* Privacy Note */}
          <div
            className="rounded-lg p-4 text-xs"
            style={{
              background: 'rgba(70, 155, 167, 0.1)',
              border: '1px solid var(--color-success)',
              color: 'var(--color-text-secondary)'
            }}
          >
            🔒 <strong style={{ color: 'var(--color-success)' }}>Privacy:</strong> Your API key is stored securely
            and only used to make AI requests on your behalf.
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {!required && onClose && (
              <button
                onClick={onClose}
                className="btn btn-ghost flex-1"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !apiKey.trim()}
              className={`${!required && onClose ? 'flex-1' : 'w-full'} btn btn-primary`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
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
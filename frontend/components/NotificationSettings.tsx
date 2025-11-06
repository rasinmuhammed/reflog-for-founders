'use client'

import { useState, useEffect } from 'react'
import { Bell, Mail, Clock, Send, X, Loader2, CheckCircle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface NotificationSettingsProps {
  userEmail: string
  onClose: () => void
}

interface Preferences {
  email_notifications_enabled: boolean
  morning_reminder_time: string
  evening_reminder_time: string
  timezone: string
}

export default function NotificationSettings({ userEmail, onClose }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<Preferences>({
    email_notifications_enabled: true,
    morning_reminder_time: '09:00',
    evening_reminder_time: '18:00',
    timezone: 'UTC'
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sendingTest, setSendingTest] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadPreferences()
  }, [userEmail])

  const loadPreferences = async () => {
    try {
      const response = await fetch(
        `${API_URL}/users/${encodeURIComponent(userEmail)}/notification-preferences`
      )
      const data = await response.json()
      setPreferences(data)
    } catch (error) {
      console.error('Failed to load preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    
    try {
      await fetch(
        `${API_URL}/users/${encodeURIComponent(userEmail)}/notification-preferences`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(preferences)
        }
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save preferences:', error)
      alert('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const sendTestEmail = async (type: 'morning' | 'evening' | 'weekly') => {
    setSendingTest(type)
    
    try {
      await fetch(
        `${API_URL}/users/${encodeURIComponent(userEmail)}/test-notification?notification_type=${type}`,
        { method: 'POST' }
      )
      alert(`Test ${type} email sent! Check your inbox.`)
    } catch (error) {
      console.error('Failed to send test:', error)
      alert('Failed to send test email')
    } finally {
      setSendingTest(null)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#000000]/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="bg-[#242424] rounded-3xl p-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#933DC9] mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#000000]/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-[#242424] border border-[#242424]/60 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#242424]/60 sticky top-0 bg-[#242424]/95 backdrop-blur-md z-10 rounded-t-3xl">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-[#933DC9] to-[#53118F] p-3 rounded-xl">
              <Bell className="w-6 h-6 text-[#FBFAEE]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#FBFAEE]">Notification Settings</h2>
              <p className="text-sm text-[#FBFAEE]/70">Manage your email reminders</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#FBFAEE]/60 hover:text-[#FBFAEE] transition p-2 hover:bg-[#000000]/30 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Master Toggle */}
          <div className="bg-gradient-to-br from-[#933DC9]/20 to-[#53118F]/20 border border-[#933DC9]/30 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="w-6 h-6 text-[#C488F8]" />
                <div>
                  <h3 className="font-semibold text-[#FBFAEE] text-lg">Email Notifications</h3>
                  <p className="text-sm text-[#FBFAEE]/70">Receive reminders and summaries</p>
                </div>
              </div>
              <button
                onClick={() => setPreferences({
                  ...preferences,
                  email_notifications_enabled: !preferences.email_notifications_enabled
                })}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  preferences.email_notifications_enabled
                    ? 'bg-gradient-to-r from-[#933DC9] to-[#53118F]'
                    : 'bg-[#000000]/40'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-[#FBFAEE] transition-transform ${
                    preferences.email_notifications_enabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {preferences.email_notifications_enabled && (
            <>
              {/* Reminder Times */}
              <div className="bg-[#000000]/40 border border-[#242424]/50 rounded-xl p-6 space-y-4">
                <h3 className="font-semibold text-[#FBFAEE] flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-[#933DC9]" />
                  Reminder Schedule
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#FBFAEE]/80 mb-2">
                      Morning Reminder
                    </label>
                    <input
                      type="time"
                      value={preferences.morning_reminder_time}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        morning_reminder_time: e.target.value
                      })}
                      className="w-full px-4 py-2 bg-[#000000]/50 border border-[#242424]/60 text-[#FBFAEE] rounded-lg focus:ring-2 focus:ring-[#933DC9]"
                    />
                    <p className="text-xs text-[#FBFAEE]/60 mt-1">Set your daily commitment</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#FBFAEE]/80 mb-2">
                      Evening Reminder
                    </label>
                    <input
                      type="time"
                      value={preferences.evening_reminder_time}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        evening_reminder_time: e.target.value
                      })}
                      className="w-full px-4 py-2 bg-[#000000]/50 border border-[#242424]/60 text-[#FBFAEE] rounded-lg focus:ring-2 focus:ring-[#933DC9]"
                    />
                    <p className="text-xs text-[#FBFAEE]/60 mt-1">Review your day</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#FBFAEE]/80 mb-2">
                    Timezone
                  </label>
                  <select
                    value={preferences.timezone}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      timezone: e.target.value
                    })}
                    className="w-full px-4 py-2 bg-[#000000]/50 border border-[#242424]/60 text-[#FBFAEE] rounded-lg focus:ring-2 focus:ring-[#933DC9]"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern (ET)</option>
                    <option value="America/Chicago">Central (CT)</option>
                    <option value="America/Denver">Mountain (MT)</option>
                    <option value="America/Los_Angeles">Pacific (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Central Europe (CET)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Asia/Kolkata">India (IST)</option>
                    <option value="Australia/Sydney">Sydney (AEDT)</option>
                  </select>
                </div>
              </div>

              {/* Test Emails */}
              <div className="bg-[#000000]/40 border border-[#242424]/50 rounded-xl p-6">
                <h3 className="font-semibold text-[#FBFAEE] mb-4 flex items-center">
                  <Send className="w-5 h-5 mr-2 text-[#933DC9]" />
                  Test Notifications
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => sendTestEmail('morning')}
                    disabled={sendingTest !== null}
                    className="px-4 py-2 bg-[#242424]/60 hover:bg-[#242424] text-[#FBFAEE] rounded-lg transition border border-[#242424]/50 disabled:opacity-50 text-sm"
                  >
                    {sendingTest === 'morning' ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      'Morning Email'
                    )}
                  </button>
                  <button
                    onClick={() => sendTestEmail('evening')}
                    disabled={sendingTest !== null}
                    className="px-4 py-2 bg-[#242424]/60 hover:bg-[#242424] text-[#FBFAEE] rounded-lg transition border border-[#242424]/50 disabled:opacity-50 text-sm"
                  >
                    {sendingTest === 'evening' ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      'Evening Email'
                    )}
                  </button>
                  <button
                    onClick={() => sendTestEmail('weekly')}
                    disabled={sendingTest !== null}
                    className="px-4 py-2 bg-[#242424]/60 hover:bg-[#242424] text-[#FBFAEE] rounded-lg transition border border-[#242424]/50 disabled:opacity-50 text-sm"
                  >
                    {sendingTest === 'weekly' ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      'Weekly Summary'
                    )}
                  </button>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-[#933DC9]/10 border border-[#933DC9]/30 rounded-xl p-4">
                <p className="text-sm text-[#FBFAEE]/80">
                  <strong className="text-[#C488F8]">How it works:</strong><br/>
                  • Morning reminders help you set daily commitments<br/>
                  • Evening reminders keep you accountable<br/>
                  • Weekly summaries show your progress patterns<br/>
                  • All emails respect your accountability style
                </p>
              </div>
            </>
          )}

          {/* Save Button */}
          <div className="flex space-x-3 pt-4 sticky bottom-0 bg-[#242424] pb-1">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-[#000000]/40 text-[#FBFAEE]/80 rounded-xl font-semibold hover:bg-[#000000]/60 transition border border-[#242424]/50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-[#933DC9] to-[#53118F] text-[#FBFAEE] px-6 py-3 rounded-xl font-semibold hover:brightness-110 transition disabled:opacity-60 flex items-center justify-center"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Saved!
                </>
              ) : (
                'Save Preferences'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
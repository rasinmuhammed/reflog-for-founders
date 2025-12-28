'use client'

import { useState, useEffect } from 'react'
import { UserButton } from '@clerk/nextjs'
import axios from 'axios'
import {
  Github, Brain, Target, Settings, TrendingUp, AlertCircle,
  CheckCircle, MessageCircle, BookOpen, Menu, X, History,
  Eye, Calendar as CalendarIcon, ArrowRight, Sparkles
} from 'lucide-react'
import CheckInModal from './CheckInModal'
import AgentInsights from './AgentInsights'
import Chat from './Chat'
import LifeDecisions from './LifeDecisions'
import InteractionHistory from './InteractionHistory'
import CommitmentTracker from './CommitmentTracker'
import NotificationBanner from './NotificationBanner'
import CommitmentCalendar from './CommitmentCalendar'
import NotificationSettings from './NotificationSettings'
import ApiKeySetup from './ApiKeySetup'
import MetricsInput from './MetricsInput'
import FounderScore from './FounderScore'
import TimeAllocation from './TimeAllocation'
import WeeklyReview from './WeeklyReview'
import QuickCheckin from './QuickCheckin'
import AvoidancePatterns from './AvoidancePatterns'
import CommandCenter from './CommandCenter'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface DashboardProps {
  userIdentifier: string
}

interface DashboardData {
  user: {
    email: string
    username: string | null
    full_name: string | null
    member_since: string
    business_stage: string | null
    primary_goal: string | null
    check_in_frequency: string
    accountability_style: string
  }
  github: {
    connected: boolean
    total_repos: number
    active_repos: number
    languages: Record<string, number>
    patterns: Array<{
      type: string
      severity: string
      message: string
    }>
  }
  business_metrics: Record<string, Array<{
    value: number
    unit: string | null
    timestamp: string
  }>>
  stats: {
    total_checkins: number
    commitments_kept: number
    success_rate: number
    avg_energy: number
    current_streak: number
  }
  recent_advice: Array<{
    id: number
    agent: string
    advice: string
    date: string
    type: string
  }>
}

type TabType = 'command' | 'overview' | 'chat' | 'commitments' | 'time' | 'weekly' | 'decisions' | 'history'

export default function Dashboard({ userIdentifier }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCheckin, setShowCheckin] = useState(false)
  const [showQuickCheckin, setShowQuickCheckin] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState<TabType>('command')
  const [showSettings, setShowSettings] = useState(false)
  const [hasGroqKey, setHasGroqKey] = useState(false)
  const [checkingKey, setCheckingKey] = useState(true)
  const [showApiKeySetup, setShowApiKeySetup] = useState(false)

  useEffect(() => {
    loadDashboard()
  }, [userIdentifier, refreshKey])

  useEffect(() => {
    checkGroqKeyStatus()
  }, [userIdentifier])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/dashboard/${encodeURIComponent(userIdentifier)}`)
      setData(response.data)
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const checkGroqKeyStatus = async () => {
    setCheckingKey(true)
    try {
      const response = await axios.get(
        `${API_URL}/users/${encodeURIComponent(userIdentifier)}/groq-key/status`
      )
      setHasGroqKey(response.data.has_key)
      if (!response.data.has_key) {
        setShowApiKeySetup(true)
      }
    } catch (error) {
      console.error('Failed to check API key status:', error)
    } finally {
      setCheckingKey(false)
    }
  }

  const handleCheckinComplete = () => {
    setShowCheckin(false)
    setRefreshKey(prev => prev + 1)
  }

  // Loading State
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-background)' }}
      >
        <div className="text-center">
          <div className="relative">
            <div
              className="animate-spin rounded-full h-16 w-16 mx-auto mb-6"
              style={{
                borderWidth: '3px',
                borderStyle: 'solid',
                borderColor: 'var(--color-border)',
                borderTopColor: 'var(--color-text-muted)'
              }}
            />
          </div>
          <p style={{ color: 'var(--color-text-muted)' }}>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Error State
  if (!data) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'var(--color-background)' }}
      >
        <div
          className="text-center rounded-2xl p-8 max-w-md w-full"
          style={{
            background: 'var(--color-accent-error-bg)',
            border: '1px solid var(--color-accent-error-border)'
          }}
        >
          <AlertCircle
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: 'var(--color-accent-error-light)' }}
          />
          <p
            className="text-lg mb-4"
            style={{ color: 'var(--color-accent-error-light)' }}
          >
            Failed to load dashboard data.
          </p>
          <button
            onClick={loadDashboard}
            className="mt-4 px-6 py-2 rounded-lg font-semibold transition"
            style={{
              background: 'var(--color-accent-primary-muted)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-accent-primary-border)'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'command', label: 'Command', icon: Sparkles },
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'commitments', label: 'Ship', icon: CalendarIcon },
    { id: 'time', label: 'Time', icon: TrendingUp },
    { id: 'weekly', label: 'Weekly', icon: BookOpen },
    { id: 'decisions', label: 'Decisions', icon: Brain },
    { id: 'history', label: 'History', icon: History }
  ]

  // If Command Center is active, render it directly
  if (activeTab === 'command') {
    return (
      <div style={{ background: 'var(--color-background)' }}>
        <NotificationBanner
          userIdentifier={userIdentifier}
          onReviewClick={() => setActiveTab('commitments')}
        />

        {/* Tab Switcher */}
        <div
          className="sticky top-0 z-40"
          style={{
            background: 'var(--color-background)',
            borderBottom: '1px solid var(--color-border-subtle)'
          }}
        >
          <div className="max-w-6xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="px-3 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium whitespace-nowrap"
                      style={{
                        background: isActive ? 'var(--color-background-elevated)' : 'transparent',
                        color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                        border: isActive ? '1px solid var(--color-border)' : '1px solid transparent'
                      }}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg transition-all relative"
                style={{
                  background: 'var(--color-background-elevated)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)'
                }}
              >
                <Settings className="w-5 h-5" />
                {!hasGroqKey && (
                  <span
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full ring-2 animate-pulse"
                    style={{
                      background: 'var(--color-accent-warning)',
                      borderColor: 'var(--color-background)'
                    }}
                  />
                )}
              </button>
            </div>
          </div>
        </div>

        <CommandCenter
          userEmail={userIdentifier}
          userName={data.user.full_name || undefined}
        />

        {showSettings && (
          <NotificationSettings
            userEmail={userIdentifier}
            onClose={() => setShowSettings(false)}
          />
        )}
        {showApiKeySetup && (
          <ApiKeySetup
            userEmail={userIdentifier}
            onComplete={() => {
              setShowApiKeySetup(false)
              setHasGroqKey(true)
              setRefreshKey(prev => prev + 1)
            }}
            onClose={() => setShowApiKeySetup(false)}
            required={!hasGroqKey}
          />
        )}
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--color-background)', color: 'var(--color-text-primary)' }}>
      <NotificationBanner
        userIdentifier={userIdentifier}
        onReviewClick={() => setActiveTab('commitments')}
      />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Tab Bar */}
        <div className="flex items-center justify-between mb-8">
          <div
            className="flex items-center gap-1 p-1 rounded-xl"
            style={{
              background: 'var(--color-background-elevated)',
              border: '1px solid var(--color-border)'
            }}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
                  style={{
                    background: isActive ? 'var(--color-background-hover)' : 'transparent',
                    color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    border: isActive ? '1px solid var(--color-border)' : '1px solid transparent'
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>

          <button
            onClick={() => setShowSettings(true)}
            className="p-2.5 rounded-xl transition-all relative"
            style={{
              background: 'var(--color-background-elevated)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)'
            }}
          >
            <Settings className="w-5 h-5" />
            {!hasGroqKey && (
              <span
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full ring-2 animate-pulse"
                style={{
                  background: 'var(--color-accent-warning)',
                  borderColor: 'var(--color-background)'
                }}
              />
            )}
          </button>
        </div>

        {/* API Key Warning */}
        {!hasGroqKey && !checkingKey && (
          <div
            className="rounded-xl p-4 mb-6"
            style={{
              background: 'var(--color-accent-warning-bg)',
              border: '1px solid var(--color-accent-warning-border)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5" style={{ color: 'var(--color-accent-warning-light)' }} />
                <div>
                  <p
                    className="font-medium text-sm"
                    style={{ color: 'var(--color-accent-warning-light)' }}
                  >
                    AI Features Disabled
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Add your Groq API key to enable AI
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowApiKeySetup(true)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition"
                style={{
                  background: 'var(--color-accent-warning-bg)',
                  color: 'var(--color-accent-warning-light)',
                  border: '1px solid var(--color-accent-warning-border)'
                }}
              >
                Setup
              </button>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Stats Cards */}
            <div className="lg:col-span-1 space-y-6">
              <FounderScore userIdentifier={userIdentifier} />

              {/* Business Stage Card */}
              {data.user.business_stage && (
                <div
                  className="rounded-2xl p-6"
                  style={{
                    background: 'var(--color-background-elevated)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <div className="flex items-center mb-4">
                    <div
                      className="p-2 rounded-lg mr-3"
                      style={{
                        background: 'var(--color-accent-primary-bg)',
                        border: '1px solid var(--color-accent-primary-border)'
                      }}
                    >
                      <Target className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
                    </div>
                    <h3 className="text-lg font-bold">Your Journey</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Stage</p>
                      <p className="font-semibold capitalize">
                        {data.user.business_stage.replace(/_/g, ' ')}
                      </p>
                    </div>
                    {data.user.primary_goal && (
                      <div>
                        <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Primary Goal</p>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          {data.user.primary_goal}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* GitHub Stats */}
              {data.github.connected && (
                <div
                  className="rounded-2xl p-6"
                  style={{
                    background: 'var(--color-background-elevated)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <div className="flex items-center mb-4">
                    <div
                      className="p-2 rounded-lg mr-3"
                      style={{ background: 'var(--color-background-hover)' }}
                    >
                      <Github className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                    </div>
                    <h3 className="text-lg font-bold">GitHub</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className="rounded-lg p-3 text-center"
                      style={{ background: 'var(--color-background)' }}
                    >
                      <div className="text-2xl font-bold">{data.github.total_repos}</div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Repos</div>
                    </div>
                    <div
                      className="rounded-lg p-3 text-center"
                      style={{ background: 'var(--color-background)' }}
                    >
                      <div
                        className="text-2xl font-bold"
                        style={{ color: 'var(--color-accent-success-light)' }}
                      >
                        {data.github.active_repos}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Active</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Execution Stats */}
              <div
                className="rounded-2xl p-6"
                style={{
                  background: 'var(--color-background-elevated)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <h3 className="text-lg font-bold mb-4">Execution Tracker</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className="rounded-xl p-4 text-center"
                      style={{
                        background: 'var(--color-accent-success-bg)',
                        border: '1px solid var(--color-accent-success-border)'
                      }}
                    >
                      <div
                        className="text-3xl font-bold"
                        style={{ color: 'var(--color-accent-success-light)' }}
                      >
                        {data.stats.current_streak}
                      </div>
                      <div className="text-xs uppercase tracking-wider mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        Day Streak
                      </div>
                    </div>
                    <div
                      className="rounded-xl p-4 text-center flex flex-col justify-center"
                      style={{ background: 'var(--color-background)' }}
                    >
                      <div className="text-2xl font-bold">
                        {data.stats.success_rate.toFixed(0)}%
                      </div>
                      <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        Success Rate
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className="rounded-lg p-3 text-center"
                      style={{ background: 'var(--color-background)' }}
                    >
                      <div className="text-2xl font-bold">{data.stats.total_checkins}</div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Reality Checks</div>
                    </div>
                    <div
                      className="rounded-lg p-3 text-center"
                      style={{ background: 'var(--color-background)' }}
                    >
                      <div
                        className="text-2xl font-bold"
                        style={{ color: 'var(--color-accent-success-light)' }}
                      >
                        {data.stats.commitments_kept}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Shipped</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Metrics & Analysis */}
            <div className="lg:col-span-2 space-y-6">
              <MetricsInput
                userIdentifier={userIdentifier}
                onUpdate={() => setRefreshKey(prev => prev + 1)}
              />
              <AvoidancePatterns userIdentifier={userIdentifier} />
              <AgentInsights advice={data.recent_advice} />
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="max-w-5xl mx-auto">
            <Chat userIdentifier={userIdentifier} />
          </div>
        )}

        {activeTab === 'commitments' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <CommitmentTracker
              userIdentifier={userIdentifier}
              onReviewComplete={() => setRefreshKey(prev => prev + 1)}
            />
            <CommitmentCalendar userIdentifier={userIdentifier} />
          </div>
        )}

        {activeTab === 'time' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <TimeAllocation
              userIdentifier={userIdentifier}
              statedPriority={data?.user.primary_goal?.toLowerCase().includes('revenue') ? 'revenue' : 'product'}
            />
          </div>
        )}

        {activeTab === 'weekly' && (
          <div className="max-w-3xl mx-auto">
            <WeeklyReview
              userIdentifier={userIdentifier}
              onComplete={() => setRefreshKey(prev => prev + 1)}
            />
          </div>
        )}

        {activeTab === 'decisions' && (
          <div className="max-w-6xl mx-auto">
            <LifeDecisions userIdentifier={userIdentifier} />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-5xl mx-auto">
            <InteractionHistory userIdentifier={userIdentifier} />
          </div>
        )}
      </main>

      {showCheckin && (
        <CheckInModal
          userIdentifier={userIdentifier}
          onClose={() => setShowCheckin(false)}
          onComplete={handleCheckinComplete}
        />
      )}
      {showSettings && (
        <NotificationSettings
          userEmail={userIdentifier}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showApiKeySetup && (
        <ApiKeySetup
          userEmail={userIdentifier}
          onComplete={() => {
            setShowApiKeySetup(false)
            setHasGroqKey(true)
            setRefreshKey(prev => prev + 1)
          }}
          onClose={() => setShowApiKeySetup(false)}
          required={!hasGroqKey}
        />
      )}

      {/* Floating Check-in Button */}
      <button
        onClick={() => setShowQuickCheckin(true)}
        className="fixed bottom-8 right-8 group z-50"
      >
        <div
          className="flex items-center gap-2.5 px-6 py-4 rounded-2xl font-semibold shadow-lg transition-all"
          style={{
            background: 'var(--color-accent-primary-muted)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-accent-primary-border)'
          }}
        >
          <CalendarIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Reality Check</span>
          <span className="sm:hidden">Check-in</span>
        </div>
      </button>

      {/* Quick Check-in Modal */}
      {showQuickCheckin && (
        <QuickCheckin
          userIdentifier={userIdentifier}
          onComplete={() => setRefreshKey(prev => prev + 1)}
          onClose={() => setShowQuickCheckin(false)}
        />
      )}
    </div>
  )
}
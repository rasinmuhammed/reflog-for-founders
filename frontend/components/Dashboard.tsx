'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { UserButton } from '@clerk/nextjs'
import axios from 'axios'
import {
  Github, Brain, Target, Settings, TrendingUp, AlertCircle,
  CheckCircle, MessageCircle, BookOpen, Menu, X, History,
  Eye, Calendar as CalendarIcon, ArrowRight, Sparkles
} from 'lucide-react'
import CheckInModal from './CheckInModal'
import AgentInsights from './AgentInsights'
import NotificationBanner from './NotificationBanner'
import NotificationSettings from './NotificationSettings'
import ApiKeySetup from './ApiKeySetup'
import FounderScore from './FounderScore'
import QuickCheckin from './QuickCheckin'
import CommandPalette from './CommandPalette'

// Lazy load heavy components for better performance
const Chat = lazy(() => import('./Chat'))
const CommandCenter = lazy(() => import('./CommandCenter'))
const LifeDecisions = lazy(() => import('./LifeDecisions'))
const InteractionHistory = lazy(() => import('./InteractionHistory'))
const CommitmentTracker = lazy(() => import('./CommitmentTracker'))
const CommitmentCalendar = lazy(() => import('./CommitmentCalendar'))
const MetricsInput = lazy(() => import('./MetricsInput'))
const TimeAllocation = lazy(() => import('./TimeAllocation'))
const WeeklyReview = lazy(() => import('./WeeklyReview'))
const AvoidancePatterns = lazy(() => import('./AvoidancePatterns'))
// Phase 2 Components - Lazy loaded
const ShadowRoast = lazy(() => import('./ShadowRoast'))
const PivotSimulator = lazy(() => import('./PivotSimulator'))
const DriftAlerts = lazy(() => import('./DriftAlerts'))

// Keyboard shortcuts hook
import { useGlobalShortcuts } from '../hooks/useKeyboardShortcuts'

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
  const [activeTab, setActiveTab] = useState<TabType>('overview')  // Changed to overview to show Shadow Mode by default
  const [showSettings, setShowSettings] = useState(false)
  const [hasGroqKey, setHasGroqKey] = useState(false)
  const [checkingKey, setCheckingKey] = useState(true)
  const [showApiKeySetup, setShowApiKeySetup] = useState(false)
  const [alertCount, setAlertCount] = useState(0)
  const [showCommandPalette, setShowCommandPalette] = useState(false)

  // Keyboard shortcuts
  useGlobalShortcuts({
    onQuickCheckin: () => setShowQuickCheckin(true),
    onCommandPalette: () => setShowCommandPalette(true),
    onNavigateTab: (index) => {
      const tabIds: TabType[] = ['command', 'overview', 'chat', 'commitments', 'decisions']
      if (tabIds[index]) setActiveTab(tabIds[index])
    }
  })

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
    { id: 'overview', label: 'Overview', icon: Target },  // Moved to first position
    { id: 'command', label: 'Command', icon: Sparkles },
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

        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-pulse text-center">
              <Brain className="w-12 h-12 mx-auto mb-4 text-purple-400" />
              <p className="text-sm text-gray-400">Loading Command Center...</p>
            </div>
          </div>
        }>
          <CommandCenter
            userEmail={userIdentifier}
            userName={data.user.full_name || undefined}
          />
        </Suspense>

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
          <Suspense fallback={<div className="animate-pulse h-96 bg-gray-800/20 rounded-xl" />}>
            <div className="space-y-6">
              {/* Drift Alerts - Top Priority */}
              <DriftAlerts
                userIdentifier={userIdentifier}
                onAlertCount={setAlertCount}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Stats & Shadow Mode */}
                <div className="lg:col-span-1 space-y-6">
                  <FounderScore userIdentifier={userIdentifier} />

                  {/* Shadow Mode - The Roast */}
                  <ShadowRoast userIdentifier={userIdentifier} />

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
                  {/* Pivot Simulator - Prominent Placement */}
                  <PivotSimulator userIdentifier={userIdentifier} />

                  <MetricsInput
                    userIdentifier={userIdentifier}
                    onUpdate={() => setRefreshKey(prev => prev + 1)}
                  />
                  <AvoidancePatterns userIdentifier={userIdentifier} />
                  <AgentInsights advice={data.recent_advice} />
                </div>
              </div>
            </div>
          </Suspense>
        )}

        {activeTab === 'chat' && (
          <Suspense fallback={<div className="flex items-center justify-center h-96"><div className="animate-pulse text-gray-400">Loading chat...</div></div>}>
            <div className="max-w-5xl mx-auto">
              <Chat userIdentifier={userIdentifier} />
            </div>
          </Suspense>
        )}

        {activeTab === 'commitments' && (
          <Suspense fallback={<div className="animate-pulse h-96 bg-gray-800/20 rounded-xl" />}>
            <div className="max-w-6xl mx-auto space-y-6">
              <CommitmentTracker
                userIdentifier={userIdentifier}
                onReviewComplete={() => setRefreshKey(prev => prev + 1)}
              />
              <CommitmentCalendar userIdentifier={userIdentifier} />
            </div>
          </Suspense>
        )}

        {activeTab === 'time' && (
          <Suspense fallback={<div className="animate-pulse h-96 bg-gray-800/20 rounded-xl" />}>
            <div className="max-w-4xl mx-auto space-y-6">
              <TimeAllocation
                userIdentifier={userIdentifier}
                statedPriority={data?.user.primary_goal?.toLowerCase().includes('revenue') ? 'revenue' : 'product'}
              />
            </div>
          </Suspense>
        )}

        {activeTab === 'weekly' && (
          <Suspense fallback={<div className="animate-pulse h-96 bg-gray-800/20 rounded-xl" />}>
            <div className="max-w-3xl mx-auto">
              <WeeklyReview
                userIdentifier={userIdentifier}
                onComplete={() => setRefreshKey(prev => prev + 1)}
              />
            </div>
          </Suspense>
        )}

        {activeTab === 'decisions' && (
          <Suspense fallback={<div className="animate-pulse h-96 bg-gray-800/20 rounded-xl" />}>
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Pivot Simulator at top of Decisions tab */}
              <PivotSimulator userIdentifier={userIdentifier} />
              <LifeDecisions userIdentifier={userIdentifier} />
            </div>
          </Suspense>
        )}

        {activeTab === 'history' && (
          <Suspense fallback={<div className="animate-pulse h-96 bg-gray-800/20 rounded-xl" />}>
            <div className="max-w-5xl mx-auto">
              <InteractionHistory userIdentifier={userIdentifier} />
            </div>
          </Suspense>
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

      {/* Command Palette (Cmd+/) */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigate={(tab) => setActiveTab(tab as TabType)}
        onQuickCheckin={() => setShowQuickCheckin(true)}
      />
    </div>
  )
}
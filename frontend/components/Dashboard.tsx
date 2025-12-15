// Update your Dashboard.tsx to accept userIdentifier instead of githubUsername

'use client'

import { useState, useEffect } from 'react'
import { UserButton } from '@clerk/nextjs'
import axios from 'axios'
import { Github, Brain, Target, Settings, TrendingUp, AlertCircle, CheckCircle, MessageCircle, BookOpen, Menu, X, History, Eye, Calendar as CalendarIcon, ArrowRight } from 'lucide-react'
import CheckInModal from './CheckInModal'
import AgentInsights from './AgentInsights'
import Chat from './Chat'
import LifeDecisions from './LifeDecisions'
import InteractionHistory from './InteractionHistory'
import MarkdownRenderer from './MarkdownRenderer'
import CommitmentTracker from './CommitmentTracker'
import NotificationBanner from './NotificationBanner'
import CommitmentCalendar from './CommitmentCalendar'
import NotificationSettings from './NotificationSettings'
import ApiKeySetup from './ApiKeySetup'
import Setting from './Settings'
import MetricsInput from './MetricsInput'
import FounderScore from './FounderScore'
import TimeAllocation from './TimeAllocation'
import WeeklyReview from './WeeklyReview'
import QuickCheckin from './QuickCheckin'
import AvoidancePatterns from './AvoidancePatterns'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface DashboardProps {
  userIdentifier: string // Can be email or github_username
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

type TabType = 'overview' | 'chat' | 'commitments' | 'time' | 'weekly' | 'decisions' | 'history'

export default function Dashboard({ userIdentifier }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCheckin, setShowCheckin] = useState(false)
  const [showQuickCheckin, setShowQuickCheckin] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
      <div className="min-h-screen bg-[#000000] text-[#FBFAEE] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-[#933DC9] mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain className="w-8 h-8 text-[#933DC9]" />
            </div>
          </div>
          <p className="text-[#FBFAEE]/80 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Error State
  if (!data) {
    return (
      <div className="min-h-screen bg-[#000000] text-[#FBFAEE] flex items-center justify-center p-4">
        <div className="text-center bg-red-900/30 border border-red-500/40 rounded-2xl p-8 max-w-md w-full">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-red-300 text-lg mb-4">Failed to load dashboard data.</p>
          <button
            onClick={loadDashboard}
            className="mt-4 px-6 py-2 bg-[#933DC9] text-[#FBFAEE] rounded-lg hover:bg-[#7d34ad] transition font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const activePercentage = data.github.total_repos > 0
    ? (data.github.active_repos / data.github.total_repos * 100).toFixed(0)
    : 0

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'commitments', label: 'Ship', icon: CalendarIcon },
    { id: 'time', label: 'Time', icon: TrendingUp },
    { id: 'weekly', label: 'Weekly', icon: BookOpen },
    { id: 'decisions', label: 'Decisions', icon: Brain },
    { id: 'history', label: 'History', icon: History }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030303] via-[#0a0a0a] to-[#050505] text-[#FBFAEE]">
      <NotificationBanner
        userIdentifier={userIdentifier}
        onReviewClick={() => setActiveTab('commitments')}
      />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Premium Tab Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-gradient-to-r from-[#1a1a1a]/80 to-[#0f0f0f]/80 border border-[#252525]/60 backdrop-blur-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-medium ${isActive
                    ? 'text-white'
                    : 'text-[#FBFAEE]/50 hover:text-[#FBFAEE]/80 hover:bg-white/5'
                    }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-[#933DC9]/25 to-[#53118F]/20 rounded-xl border border-[#933DC9]/30" />
                  )}
                  <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-[#C488F8]' : ''}`} />
                  <span className="hidden sm:inline relative z-10">{tab.label}</span>
                </button>
              )
            })}
          </div>

          <button
            onClick={() => setShowSettings(true)}
            className="p-2.5 rounded-xl bg-[#1a1a1a]/60 border border-[#252525]/50 hover:bg-[#252525]/60 hover:border-[#333] transition-all relative group"
          >
            <Settings className="w-5 h-5 text-[#FBFAEE]/60 group-hover:text-[#FBFAEE] transition" />
            {!hasGroqKey && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full ring-2 ring-[#0a0a0a] animate-pulse" />
            )}
          </button>
        </div>

        {/* API Key Warning */}
        {!hasGroqKey && !checkingKey && (
          <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-yellow-300 font-medium text-sm">AI Features Disabled</p>
                  <p className="text-yellow-300/70 text-xs">Add your Groq API key to enable AI</p>
                </div>
              </div>
              <button
                onClick={() => setShowApiKeySetup(true)}
                className="bg-yellow-500/20 text-yellow-300 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-yellow-500/30 transition"
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
              {/* Founder Score Card */}
              <FounderScore userIdentifier={userIdentifier} />

              {/* Business Stage Card */}
              {data.user.business_stage && (
                <div className="bg-[#242424] border border-[#242424]/50 rounded-2xl shadow-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-gradient-to-br from-[#933DC9] to-[#53118F] p-2 rounded-lg mr-3">
                      <Target className="w-5 h-5 text-[#FBFAEE]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#FBFAEE]">Your Journey</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-[#FBFAEE]/60 mb-1">Stage</p>
                      <p className="text-[#FBFAEE] font-semibold capitalize">
                        {data.user.business_stage.replace(/_/g, ' ')}
                      </p>
                    </div>
                    {data.user.primary_goal && (
                      <div>
                        <p className="text-xs text-[#FBFAEE]/60 mb-1">Primary Goal</p>
                        <p className="text-sm text-[#FBFAEE]/90">{data.user.primary_goal}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* GitHub Stats (if connected) */}
              {data.github.connected && (
                <div className="bg-[#242424] border border-[#242424]/50 rounded-2xl shadow-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-gradient-to-br from-[#333] to-[#111] p-2 rounded-lg mr-3">
                      <Github className="w-5 h-5 text-[#FBFAEE]/90" />
                    </div>
                    <h3 className="text-lg font-bold text-[#FBFAEE]">GitHub</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#000000]/40 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-[#FBFAEE]">{data.github.total_repos}</div>
                        <div className="text-xs text-[#FBFAEE]/60">Repos</div>
                      </div>
                      <div className="bg-[#000000]/40 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-400">{data.github.active_repos}</div>
                        <div className="text-xs text-[#FBFAEE]/60">Active</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Accountability Stats */}
              <div className="bg-[#242424] border border-[#242424]/50 rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-bold text-[#FBFAEE] mb-4">Execution Tracker</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-[#933DC9]/20 to-[#53118F]/20 border border-[#933DC9]/30 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-[#C488F8]">
                        {data.stats.current_streak}
                      </div>
                      <div className="text-xs text-[#FBFAEE]/70 uppercase tracking-wider mt-1">Day Streak</div>
                    </div>
                    <div className="bg-[#000000]/40 border border-white/5 rounded-xl p-4 text-center flex flex-col justify-center">
                      <div className="text-2xl font-bold text-[#FBFAEE]">
                        {data.stats.success_rate.toFixed(0)}%
                      </div>
                      <div className="text-xs text-[#FBFAEE]/60 mt-1">Success Rate</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#000000]/40 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-[#FBFAEE]">{data.stats.total_checkins}</div>
                      <div className="text-xs text-[#FBFAEE]/60">Reality Checks</div>
                    </div>
                    <div className="bg-[#000000]/40 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-400">{data.stats.commitments_kept}</div>
                      <div className="text-xs text-[#FBFAEE]/60">Shipped</div>
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

      {/* Premium Floating Check-in Button */}
      <button
        onClick={() => setShowQuickCheckin(true)}
        className="fixed bottom-8 right-8 group z-50"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#933DC9] to-[#53118F] rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
        <div className="relative flex items-center gap-2.5 bg-gradient-to-r from-[#933DC9] to-[#53118F] px-6 py-4 rounded-2xl font-semibold text-white shadow-2xl shadow-purple-900/40 group-hover:shadow-purple-900/60 transition-all group-hover:scale-[1.02]">
          <div className="p-1 bg-white/20 rounded-lg">
            <CalendarIcon className="w-5 h-5" />
          </div>
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
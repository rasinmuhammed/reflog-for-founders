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
  }
  recent_advice: Array<{
    id: number
    agent: string
    advice: string
    date: string
    type: string
  }>
}

type TabType = 'overview' | 'chat' | 'commitments' | 'decisions' | 'history'

export default function Dashboard({ userIdentifier }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCheckin, setShowCheckin] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    loadDashboard()
  }, [userIdentifier, refreshKey])

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
    { id: 'commitments', label: 'Commitments', icon: CalendarIcon },
    { id: 'decisions', label: 'Decisions', icon: BookOpen },
    { id: 'history', label: 'History', icon: History }
  ]

  return (
    <div className="min-h-screen bg-[#000000] text-[#FBFAEE]">
      <NotificationBanner
        userIdentifier={userIdentifier}
        onReviewClick={() => setActiveTab('commitments')}
      />

      {/* Header */}
      <header className="bg-[#000000]/80 border-b border-[#242424]/50 sticky top-0 z-40 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo and User Info */}
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-[#933DC9] to-[#53118F] p-3 rounded-2xl shadow-lg">
                <Brain className="w-7 h-7 text-[#FBFAEE]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#933DC9] to-[#53118F] bg-clip-text text-transparent">
                  Reflog
                </h1>
                <p className="text-xs text-[#FBFAEE]/60">
                  {data.user.full_name || data.user.email}
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1 bg-[#242424]/40 rounded-full p-1 border border-[#242424]/60">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-full transition-all flex items-center space-x-2 text-sm ${
                      isActive
                        ? 'bg-[#933DC9]/20 text-[#C488F8] shadow-md ring-1 ring-[#933DC9]/30'
                        : 'text-[#FBFAEE]/70 hover:text-[#FBFAEE] hover:bg-[#242424]/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#C488F8]' : ''}`} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCheckin(true)}
                className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-[#933DC9] to-[#53118F] px-5 py-2.5 rounded-xl font-semibold hover:brightness-110 transition-all shadow-lg"
              >
                <CalendarIcon className="w-4 h-4" />
                <span>Daily Check-in</span>
              </button>

              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10 ring-2 ring-[#933DC9]/40"
                  }
                }}
              />
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 hover:bg-[#242424]/50 rounded-lg transition"
              >
                <Settings className="w-5 h-5 text-[#FBFAEE]/70" />
              </button>
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-[#FBFAEE]/70 hover:text-[#FBFAEE] p-2 hover:bg-[#242424]/50 rounded-xl transition"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 pt-2 border-t border-[#242424]/50">
              <div className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id)
                        setMobileMenuOpen(false)
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-all text-base ${
                        isActive
                          ? 'bg-[#933DC9]/20 text-[#C488F8]'
                          : 'text-[#FBFAEE]/80 hover:bg-[#242424]/50 hover:text-[#FBFAEE]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => {
                  setShowCheckin(true)
                  setMobileMenuOpen(false)
                }}
                className="w-full mt-3 bg-gradient-to-r from-[#933DC9] to-[#53118F] text-[#FBFAEE] px-4 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2"
              >
                <CalendarIcon className="w-5 h-5" />
                <span>Daily Check-in</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Stats Cards */}
            <div className="lg:col-span-1 space-y-6">
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
                <h3 className="text-lg font-bold text-[#FBFAEE] mb-4">Accountability</h3>
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-[#933DC9]/20 to-[#53118F]/20 border border-[#933DC9]/30 rounded-xl p-4 text-center">
                    <div className="text-4xl font-bold text-[#C488F8]">
                      {data.stats.success_rate.toFixed(0)}%
                    </div>
                    <div className="text-sm text-[#FBFAEE]/70">Success Rate</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#000000]/40 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-[#FBFAEE]">{data.stats.total_checkins}</div>
                      <div className="text-xs text-[#FBFAEE]/60">Check-ins</div>
                    </div>
                    <div className="bg-[#000000]/40 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-400">{data.stats.commitments_kept}</div>
                      <div className="text-xs text-[#FBFAEE]/60">Kept</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Recent Activity */}
            <div className="lg:col-span-2 space-y-6">
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
    </div>

  )
}
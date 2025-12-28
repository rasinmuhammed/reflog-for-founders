'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import {
    Sparkles, Calendar, Mail, TrendingUp, Zap,
    ChevronRight, Target, Brain, MessageSquare,
    History, BarChart3, RefreshCw, Settings
} from 'lucide-react'
import MeetingWorkflow from './MeetingWorkflow'
import ActionTracker from './ActionTracker'
import WeeklyReview from './WeeklyReview'
import Chat from './Chat'
import QuickCheckin from './QuickCheckin'
import Setting from './Settings'
import { useToast } from './ui/Toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface CommandCenterProps {
    userEmail: string
    userName?: string
}

interface DashboardData {
    brief?: {
        priorities: Array<{ priority: string; reasoning: string }>
        decisions_needed: string[]
        follow_up_radar: string[]
    }
    stats: {
        pending_actions: number
        todays_meetings: number
        unread_emails: number
        ship_rate: number
        energy_level: string | null
    }
    calendar_summary?: string
    email_summary?: string
}

type TabType = 'brief' | 'checkin' | 'meetings' | 'actions' | 'history' | 'review' | 'assist'

export default function CommandCenter({ userEmail, userName }: CommandCenterProps) {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<TabType>('brief')
    const [generating, setGenerating] = useState(false)
    const [showCheckinModal, setShowCheckinModal] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const { showError } = useToast()

    useEffect(() => {
        loadDashboard()
    }, [userEmail])

    const loadDashboard = async () => {
        setLoading(true)
        try {
            const res = await axios.get(`${API_URL}/cos/founder-dashboard/${encodeURIComponent(userEmail)}`)
            setData(res.data)
        } catch (err) {
            console.error('Failed to load dashboard:', err)
            showError('Failed to load dashboard. Please refresh.')
            setData({
                stats: {
                    pending_actions: 0,
                    todays_meetings: 0,
                    unread_emails: 0,
                    ship_rate: 0,
                    energy_level: null
                }
            })
        } finally {
            setLoading(false)
        }
    }

    const generateBrief = async () => {
        setGenerating(true)
        try {
            const res = await axios.post(`${API_URL}/cos/auto-brief/${encodeURIComponent(userEmail)}`)
            setData(prev => prev ? { ...prev, brief: res.data } : prev)
        } catch (err) {
            console.error('Failed to generate brief:', err)
            showError('Failed to generate brief. Check your API key in Settings.')
        } finally {
            setGenerating(false)
        }
    }

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good morning'
        if (hour < 17) return 'Good afternoon'
        return 'Good evening'
    }

    const tabs = [
        { id: 'brief' as TabType, label: 'Brief', icon: Sparkles },
        { id: 'checkin' as TabType, label: 'Check-in', icon: Target },
        { id: 'meetings' as TabType, label: 'Meetings', icon: Calendar },
        { id: 'actions' as TabType, label: 'Actions', icon: Zap },
        { id: 'assist' as TabType, label: 'Ask Reflog', icon: MessageSquare },
        { id: 'review' as TabType, label: 'Review', icon: BarChart3 },
    ]

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-shell)' }}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                >
                    <div
                        className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center animate-pulse"
                        style={{ background: 'var(--color-accent-muted)' }}
                    >
                        <Brain className="w-6 h-6" style={{ color: 'var(--color-accent)' }} />
                    </div>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                        Loading intelligence...
                    </p>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen" style={{ background: 'var(--color-bg-shell)' }}>
            {/* Top Navigation Bar */}
            <header
                className="sticky top-0 z-50"
                style={{
                    background: 'var(--color-bg-shell)',
                    borderBottom: '1px solid var(--color-border)'
                }}
            >
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo & Title */}
                        <div className="flex items-center gap-4">
                            <div
                                className="p-2 rounded-lg"
                                style={{ background: 'var(--color-accent-muted)' }}
                            >
                                <Sparkles className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold">Reflog</h1>
                                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                    Executive Intelligence
                                </p>
                            </div>
                        </div>

                        {/* Right side - Settings & Greeting */}
                        <div className="flex items-center gap-4">
                            {/* Settings Button */}
                            <button
                                onClick={() => setShowSettings(true)}
                                className="p-2 rounded-lg transition-all hover:bg-[var(--color-accent-muted)]"
                                style={{ color: 'var(--color-text-muted)' }}
                                title="Settings"
                            >
                                <Settings className="w-5 h-5" />
                            </button>

                            {/* Greeting */}
                            <div className="text-right">
                                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                                    {getGreeting()},
                                </p>
                                <p className="font-medium">
                                    {userName || userEmail.split('@')[0]}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Stats Strip */}
            <section
                className="py-6"
                style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
            >
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <StatCard
                            icon={<Zap className="w-4 h-4" />}
                            label="Actions"
                            value={data?.stats?.pending_actions || 0}
                        />
                        <StatCard
                            icon={<Calendar className="w-4 h-4" />}
                            label="Meetings"
                            value={data?.stats?.todays_meetings || 0}
                        />
                        <StatCard
                            icon={<Mail className="w-4 h-4" />}
                            label="Unread"
                            value={data?.stats?.unread_emails || 0}
                            highlight={data?.stats?.unread_emails ? data.stats.unread_emails > 10 : false}
                        />
                        <StatCard
                            icon={<TrendingUp className="w-4 h-4" />}
                            label="Ship Rate"
                            value={`${data?.stats?.ship_rate || 0}%`}
                        />
                        <StatCard
                            icon={<Target className="w-4 h-4" />}
                            label="Energy"
                            value={data?.stats?.energy_level || '—'}
                        />
                    </div>
                </div>
            </section>

            {/* Tab Navigation */}
            <nav className="py-4">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                        {tabs.map(tab => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className="nav-tab whitespace-nowrap"
                                    style={isActive ? {
                                        color: 'var(--color-text-primary)',
                                        background: 'var(--color-accent-muted)',
                                        border: '1px solid var(--color-border)'
                                    } : undefined}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{tab.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="py-6 min-h-[500px]">
                <div className="max-w-7xl mx-auto px-6">
                    <AnimatePresence mode="wait">
                        {activeTab === 'brief' && (
                            <motion.div
                                key="brief"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <BriefSection
                                    brief={data?.brief}
                                    generating={generating}
                                    onGenerate={generateBrief}
                                />
                            </motion.div>
                        )}

                        {activeTab === 'checkin' && (
                            <motion.div
                                key="checkin"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <div className="card p-8 text-center max-w-2xl mx-auto">
                                    <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-accent/20">
                                        <Target className="w-8 h-8 text-accent" />
                                    </div>
                                    <h2 className="section-title mb-2">Daily Commitment</h2>
                                    <p className="section-subtitle mb-8">
                                        Align your focus. Log your wins.
                                    </p>
                                    <button
                                        onClick={() => setShowCheckinModal(true)}
                                        className="btn btn-primary px-8 py-3 text-lg h-auto"
                                    >
                                        Open Check-in
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'meetings' && (
                            <motion.div
                                key="meetings"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <MeetingWorkflow userEmail={userEmail} />
                            </motion.div>
                        )}

                        {activeTab === 'actions' && (
                            <motion.div
                                key="actions"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <ActionTracker userEmail={userEmail} />
                            </motion.div>
                        )}

                        {activeTab === 'assist' && (
                            <motion.div
                                key="assist"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="h-[600px]"
                            >
                                <Chat userIdentifier={userEmail} />
                            </motion.div>
                        )}

                        {activeTab === 'review' && (
                            <motion.div
                                key="review"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="max-w-2xl mx-auto"
                            >
                                <WeeklyReview userIdentifier={userEmail} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* Checkin Modal */}
            <AnimatePresence>
                {showCheckinModal && (
                    <QuickCheckin
                        userIdentifier={userEmail}
                        onClose={() => setShowCheckinModal(false)}
                        onComplete={() => {
                            loadDashboard() // Refresh stats
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Settings Modal */}
            {showSettings && (
                <Setting
                    userEmail={userEmail}
                    onClose={() => setShowSettings(false)}
                />
            )}
        </div>
    )
}

// Sub-components

function StatCard({
    icon,
    label,
    value,
    highlight
}: {
    icon: React.ReactNode
    label: string
    value: string | number
    highlight?: boolean
}) {
    return (
        <div
            className="stat-card"
            style={highlight ? { borderColor: 'var(--color-warning)' } : undefined}
        >
            <div className="flex items-center gap-2 mb-2">
                <span style={{ color: 'var(--color-accent)' }}>{icon}</span>
                <span className="stat-label" style={{ marginTop: 0 }}>{label}</span>
            </div>
            <div className="stat-value">{value}</div>
        </div>
    )
}

function BriefSection({
    brief,
    generating,
    onGenerate
}: {
    brief?: DashboardData['brief']
    generating: boolean
    onGenerate: () => void
}) {
    return (
        <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="section-title flex items-center gap-2">
                        <Sparkles className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                        Daily Intelligence Brief
                    </h2>
                    <p className="section-subtitle">Your morning strategic overview</p>
                </div>
                <button
                    onClick={onGenerate}
                    disabled={generating}
                    className="btn btn-primary"
                >
                    {generating ? (
                        <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4" />
                            Generate Brief
                        </>
                    )}
                </button>
            </div>

            {brief ? (
                <div className="space-y-6">
                    {/* Priorities */}
                    {brief.priorities && brief.priorities.length > 0 && (
                        <div>
                            <h3
                                className="text-sm font-semibold mb-3 flex items-center gap-2 text-accent"
                            >
                                <Target className="w-4 h-4" />
                                Today's Priorities
                            </h3>
                            <div className="space-y-3">
                                {brief.priorities.map((p, i) => (
                                    <div
                                        key={i}
                                        className="p-4 rounded-lg bg-shell border border-border-subtle"
                                        style={{
                                            background: 'var(--color-bg-shell)',
                                            border: '1px solid var(--color-border-subtle)'
                                        }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span
                                                className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
                                                style={{
                                                    background: 'var(--color-accent-muted)',
                                                    color: 'var(--color-accent)'
                                                }}
                                            >
                                                {i + 1}
                                            </span>
                                            <div>
                                                <p className="font-medium text-sm">{p.priority}</p>
                                                <p
                                                    className="text-xs mt-1"
                                                    style={{ color: 'var(--color-text-muted)' }}
                                                >
                                                    {p.reasoning}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Decisions */}
                    {brief.decisions_needed && brief.decisions_needed.length > 0 && (
                        <div>
                            <h3
                                className="text-sm font-semibold mb-3 flex items-center gap-2 text-warning"
                            >
                                <Brain className="w-4 h-4" />
                                Decisions Needed
                            </h3>
                            <ul className="space-y-2">
                                {brief.decisions_needed.map((d, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start gap-2 text-sm text-secondary"
                                    >
                                        <ChevronRight
                                            className="w-4 h-4 mt-0.5 flex-shrink-0 text-warning"
                                        />
                                        {d}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <Sparkles className="w-12 h-12 mx-auto" />
                    </div>
                    <p className="empty-state-title">No brief generated yet</p>
                    <p className="empty-state-text">
                        Click "Generate Brief" to get your morning intelligence report.
                    </p>
                </div>
            )}
        </div>
    )
}

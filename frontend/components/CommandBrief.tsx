'use client'

import { useState, useEffect } from 'react'
import {
    Sparkles,
    RefreshCw,
    AlertTriangle,
    Clock,
    Users,
    ChevronRight,
    CheckCircle
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface CommandBriefProps {
    userEmail: string
}

interface Brief {
    top_priorities?: Array<{
        priority: string
        why: string
        first_action: string
    }>
    decision_queue?: Array<{
        decision: string
        stakes: string
        recommendation: string
    }>
    follow_up_radar?: Array<{
        thread: string
        days_cold: number
        suggested_action: string
    }>
    delegation_candidates?: Array<{
        task: string
        suggested_owner: string
        reason: string
    }>
    calendar_risk?: string
}

export default function CommandBrief({ userEmail }: CommandBriefProps) {
    const [brief, setBrief] = useState<Brief | null>(null)
    const [loading, setLoading] = useState(false)
    const [lastGenerated, setLastGenerated] = useState<Date | null>(null)

    const generateBrief = async () => {
        setLoading(true)
        try {
            const response = await fetch(`${API_URL}/cos/auto-brief/${userEmail}`, {
                method: 'POST'
            })
            if (response.ok) {
                const data = await response.json()
                setBrief(data.brief)
                setLastGenerated(new Date())
            }
        } catch (err) {
            console.error('Failed to generate brief:', err)
        } finally {
            setLoading(false)
        }
    }

    // Fetch latest brief on mount
    useEffect(() => {
        const fetchLatest = async () => {
            try {
                const response = await fetch(`${API_URL}/cos/daily-brief/latest/${userEmail}`)
                if (response.ok) {
                    const data = await response.json()
                    setBrief(data)
                }
            } catch {
                // No existing brief
            }
        }
        fetchLatest()
    }, [userEmail])

    return (
        <div
            className="rounded-xl p-6"
            style={{
                background: 'var(--color-background-elevated)',
                border: '1px solid var(--color-border)'
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2
                        className="text-xl font-semibold flex items-center gap-2"
                        style={{ color: 'var(--color-text-primary)' }}
                    >
                        <Sparkles className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                        Command Brief
                    </h2>
                    <p
                        className="text-sm mt-1"
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        {lastGenerated
                            ? `Generated ${lastGenerated.toLocaleTimeString()}`
                            : 'Your daily intelligence report'
                        }
                    </p>
                </div>

                <button
                    onClick={generateBrief}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    style={{
                        background: 'var(--color-accent-primary-muted)',
                        color: 'var(--color-text-primary)',
                        border: '1px solid var(--color-accent-primary-border)'
                    }}
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Generating...' : 'Generate Brief'}
                </button>
            </div>

            {/* Content */}
            {!brief ? (
                <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        Generate your morning brief to see today&apos;s priorities
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Top Priorities */}
                    {brief.top_priorities && brief.top_priorities.length > 0 && (
                        <section>
                            <h3
                                className="text-sm font-medium mb-3 flex items-center gap-2"
                                style={{ color: 'var(--color-text-secondary)' }}
                            >
                                <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-accent-success-light)' }} />
                                Top Priorities
                            </h3>
                            <div className="space-y-3">
                                {brief.top_priorities.map((item, i) => (
                                    <div
                                        key={i}
                                        className="p-4 rounded-xl"
                                        style={{
                                            background: 'var(--color-background)',
                                            border: '1px solid var(--color-border-subtle)'
                                        }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span
                                                className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                                                style={{
                                                    background: 'var(--color-accent-success-bg)',
                                                    color: 'var(--color-accent-success-light)'
                                                }}
                                            >
                                                {i + 1}
                                            </span>
                                            <div className="flex-1">
                                                <p style={{ color: 'var(--color-text-primary)' }} className="font-medium">
                                                    {item.priority}
                                                </p>
                                                <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                                                    Why: {item.why}
                                                </p>
                                                <p className="text-sm mt-2 flex items-center gap-1" style={{ color: 'var(--color-accent-primary)' }}>
                                                    <ChevronRight className="w-3 h-3" />
                                                    First action: {item.first_action}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Decision Queue */}
                    {brief.decision_queue && brief.decision_queue.length > 0 && (
                        <section>
                            <h3
                                className="text-sm font-medium mb-3 flex items-center gap-2"
                                style={{ color: 'var(--color-text-secondary)' }}
                            >
                                <AlertTriangle className="w-4 h-4" style={{ color: 'var(--color-accent-warning-light)' }} />
                                Decisions Needed
                            </h3>
                            <div className="space-y-3">
                                {brief.decision_queue.map((item, i) => (
                                    <div
                                        key={i}
                                        className="p-4 rounded-xl"
                                        style={{
                                            background: 'var(--color-accent-warning-bg)',
                                            border: '1px solid var(--color-accent-warning-border)'
                                        }}
                                    >
                                        <p style={{ color: 'var(--color-text-primary)' }} className="font-medium">
                                            {item.decision}
                                        </p>
                                        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                                            Stakes: {item.stakes}
                                        </p>
                                        <p className="text-sm mt-2" style={{ color: 'var(--color-accent-warning-light)' }}>
                                            Recommendation: {item.recommendation}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Follow-up Radar */}
                    {brief.follow_up_radar && brief.follow_up_radar.length > 0 && (
                        <section>
                            <h3
                                className="text-sm font-medium mb-3 flex items-center gap-2"
                                style={{ color: 'var(--color-text-secondary)' }}
                            >
                                <Clock className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                                Follow-up Radar
                            </h3>
                            <div className="space-y-2">
                                {brief.follow_up_radar.map((item, i) => (
                                    <div
                                        key={i}
                                        className="p-3 rounded-lg flex items-center justify-between"
                                        style={{
                                            background: 'var(--color-background)',
                                            border: '1px solid var(--color-border-subtle)'
                                        }}
                                    >
                                        <div>
                                            <p style={{ color: 'var(--color-text-primary)' }}>{item.thread}</p>
                                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                                {item.days_cold} days cold
                                            </p>
                                        </div>
                                        <span
                                            className="text-xs px-2 py-1 rounded"
                                            style={{
                                                background: 'var(--color-accent-warning-bg)',
                                                color: 'var(--color-accent-warning-light)'
                                            }}
                                        >
                                            Action needed
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Delegation Candidates */}
                    {brief.delegation_candidates && brief.delegation_candidates.length > 0 && (
                        <section>
                            <h3
                                className="text-sm font-medium mb-3 flex items-center gap-2"
                                style={{ color: 'var(--color-text-secondary)' }}
                            >
                                <Users className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                                Delegation Candidates
                            </h3>
                            <div className="space-y-2">
                                {brief.delegation_candidates.map((item, i) => (
                                    <div
                                        key={i}
                                        className="p-3 rounded-lg"
                                        style={{
                                            background: 'var(--color-background)',
                                            border: '1px solid var(--color-border-subtle)'
                                        }}
                                    >
                                        <p style={{ color: 'var(--color-text-primary)' }}>{item.task}</p>
                                        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                                            → {item.suggested_owner}: {item.reason}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Calendar Risk */}
                    {brief.calendar_risk && (
                        <div
                            className="p-4 rounded-xl"
                            style={{
                                background: 'var(--color-accent-warning-bg)',
                                border: '1px solid var(--color-accent-warning-border)'
                            }}
                        >
                            <p className="text-sm" style={{ color: 'var(--color-accent-warning-light)' }}>
                                <AlertTriangle className="w-4 h-4 inline mr-2" />
                                Calendar Alert: {brief.calendar_risk}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

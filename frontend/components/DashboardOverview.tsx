'use client'

import React from 'react'
import { motion } from 'framer-motion'
import ShadowRoast from './ShadowRoast'
import FounderScore from './FounderScore'
import DriftAlerts from './DriftAlerts'
import { ArrowRight, Zap, Target, BookOpen, CheckCircle2 } from 'lucide-react'

interface DashboardOverviewProps {
    userIdentifier: string
    onNavigate: (view: string) => void
}

export default function DashboardOverview({ userIdentifier, onNavigate }: DashboardOverviewProps) {
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.08 }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h1
                        className="text-2xl font-semibold tracking-tight"
                        style={{ color: 'var(--color-text-primary)' }}
                    >
                        Overview
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                        Your executive intelligence briefing
                    </p>
                </div>
                <div
                    className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full"
                    style={{
                        background: 'var(--color-success-bg)',
                        color: 'var(--color-success)',
                        border: '1px solid var(--color-border-subtle)'
                    }}
                >
                    <span
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ background: 'var(--color-success)' }}
                    />
                    Systems Online
                </div>
            </div>

            {/* Drift Alerts - Top Priority */}
            <motion.div variants={itemVariants}>
                <DriftAlerts userIdentifier={userIdentifier} onAlertCount={() => { }} />
            </motion.div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Hero: Shadow Mode - Spans 8 cols */}
                <motion.div variants={itemVariants} className="lg:col-span-8">
                    <ShadowRoast userIdentifier={userIdentifier} />
                </motion.div>

                {/* Right Column - Spans 4 cols */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Founder Score */}
                    <motion.div variants={itemVariants}>
                        <FounderScore userIdentifier={userIdentifier} />
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div
                        variants={itemVariants}
                        className="card p-5"
                    >
                        <h3
                            className="text-xs font-semibold uppercase tracking-widest mb-4"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            Quick Actions
                        </h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => onNavigate('checkin')}
                                className="w-full group flex items-center justify-between p-3 rounded-lg transition-all"
                                style={{
                                    background: 'var(--color-bg-elevated)',
                                    border: '1px solid var(--color-border-subtle)'
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="p-2 rounded-lg"
                                        style={{ background: 'var(--color-accent-bg)' }}
                                    >
                                        <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                                    </div>
                                    <span
                                        className="text-sm font-medium"
                                        style={{ color: 'var(--color-text-primary)' }}
                                    >
                                        Log Check-in
                                    </span>
                                </div>
                                <ArrowRight
                                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                                    style={{ color: 'var(--color-text-muted)' }}
                                />
                            </button>

                            <button
                                onClick={() => onNavigate('chat')}
                                className="w-full group flex items-center justify-between p-3 rounded-lg transition-all"
                                style={{
                                    background: 'var(--color-bg-elevated)',
                                    border: '1px solid var(--color-border-subtle)'
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="p-2 rounded-lg"
                                        style={{ background: 'var(--color-warmth-bg)' }}
                                    >
                                        <Zap className="w-4 h-4" style={{ color: 'var(--color-warmth)' }} />
                                    </div>
                                    <span
                                        className="text-sm font-medium"
                                        style={{ color: 'var(--color-text-primary)' }}
                                    >
                                        Ask Reflog AI
                                    </span>
                                </div>
                                <ArrowRight
                                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                                    style={{ color: 'var(--color-text-muted)' }}
                                />
                            </button>

                            <button
                                onClick={() => onNavigate('review')}
                                className="w-full group flex items-center justify-between p-3 rounded-lg transition-all"
                                style={{
                                    background: 'var(--color-bg-elevated)',
                                    border: '1px solid var(--color-border-subtle)'
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="p-2 rounded-lg"
                                        style={{ background: 'var(--color-warning-bg)' }}
                                    >
                                        <BookOpen className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />
                                    </div>
                                    <span
                                        className="text-sm font-medium"
                                        style={{ color: 'var(--color-text-primary)' }}
                                    >
                                        Weekly Review
                                    </span>
                                </div>
                                <ArrowRight
                                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                                    style={{ color: 'var(--color-text-muted)' }}
                                />
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    )
}

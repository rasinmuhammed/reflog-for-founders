'use client'

import React from 'react'
import { motion } from 'framer-motion'
import FounderScore from './FounderScore'
import DriftAlerts from './DriftAlerts'
import RoastSun from './RoastSun'
import FloatingCard from './ui/FloatingCard'
import { ArrowRight, Zap, Target, BookOpen, CheckCircle2, Brain, Sparkles } from 'lucide-react'

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

            {/* Top Row: Drift Alerts + Roast Sun */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div variants={itemVariants}>
                    <DriftAlerts userIdentifier={userIdentifier} onAlertCount={() => { }} />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <RoastSun userIdentifier={userIdentifier} />
                </motion.div>
            </div>

            {/* Anti-Gravity Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Hero: Getting Started with Floating Cards - Spans 8 cols */}
                <div className="lg:col-span-8">
                    <FloatingCard floatDuration={5} floatDistance={15} delay={0}>
                        <div className="p-8">
                            <div className="flex items-start gap-4 mb-6">
                                <motion.div
                                    animate={{
                                        rotate: [0, 360],
                                        scale: [1, 1.1, 1]
                                    }}
                                    transition={{
                                        rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                                        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                                    }}
                                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{ background: 'var(--color-accent-muted)' }}
                                >
                                    <Sparkles className="w-6 h-6" style={{ color: 'var(--color-accent)' }} />
                                </motion.div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                                        Welcome to Reflog
                                    </h2>
                                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                                        Your AI-powered executive intelligence platform
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Getting Started Steps - each floats independently */}
                                <FloatingCard floatDuration={3.5} floatDistance={8} delay={0.2} className="overflow-hidden">
                                    <button
                                        onClick={() => onNavigate('checkin')}
                                        className="w-full p-4 text-left hover:scale-[1.02] transition-transform"
                                        style={{ background: 'transparent' }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 mt-0.5" style={{ color: 'var(--color-success)' }} />
                                            <div>
                                                <h3 className="font-semibold mb-1">1. Log Your First Check-in</h3>
                                                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                                    Set your daily commitment and track what you ship
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                </FloatingCard>

                                <FloatingCard floatDuration={4.2} floatDistance={10} delay={0.5} className="overflow-hidden">
                                    <button
                                        onClick={() => onNavigate('competitors')}
                                        className="w-full p-4 text-left hover:scale-[1.02] transition-transform"
                                        style={{ background: 'transparent' }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Target className="w-5 h-5 mt-0.5" style={{ color: 'var(--color-accent)' }} />
                                            <div>
                                                <h3 className="font-semibold mb-1">2. Track Competitors</h3>
                                                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                                    Get AI-powered intelligence on your market
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                </FloatingCard>

                                <FloatingCard floatDuration={3.8} floatDistance={9} delay={0.8} className="overflow-hidden">
                                    <button
                                        onClick={() => onNavigate('chat')}
                                        className="w-full p-4 text-left hover:scale-[1.02] transition-transform"
                                        style={{ background: 'transparent' }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Brain className="w-5 h-5 mt-0.5" style={{ color: 'var(--color-warmth)' }} />
                                            <div>
                                                <h3 className="font-semibold mb-1">3. Ask Your Board</h3>
                                                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                                    Get strategic advice from AI advisors
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                </FloatingCard>

                                <FloatingCard floatDuration={4.5} floatDistance={11} delay={1.1} className="overflow-hidden">
                                    <button
                                        onClick={() => onNavigate('brief')}
                                        className="w-full p-4 text-left hover:scale-[1.02] transition-transform"
                                        style={{ background: 'transparent' }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Sparkles className="w-5 h-5 mt-0.5" style={{ color: 'var(--color-accent)' }} />
                                            <div>
                                                <h3 className="font-semibold mb-1">4. View Your Brief</h3>
                                                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                                    Daily intelligence briefing across all areas
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                </FloatingCard>
                            </div>

                            {/* Pro Tip with subtle glow */}
                            <motion.div
                                animate={{
                                    boxShadow: [
                                        '0 0 20px rgba(14, 165, 233, 0.2)',
                                        '0 0 30px rgba(14, 165, 233, 0.3)',
                                        '0 0 20px rgba(14, 165, 233, 0.2)'
                                    ]
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="mt-6 p-4 rounded-lg"
                                style={{
                                    background: 'var(--color-accent-muted)',
                                    border: '1px solid var(--color-accent)'
                                }}
                            >
                                <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-accent)' }}>
                                    💡 Pro Tip
                                </p>
                                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                    Start with a daily check-in. Reflog learns from your patterns and gets smarter over time.
                                </p>
                            </motion.div>
                        </div>
                    </FloatingCard>
                </div>

                {/* Right Column - Spans 4 cols */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Quick Actions - Floating */}
                    <FloatingCard floatDuration={4.8} floatDistance={14} delay={0.3}>
                        <div className="p-5">
                            <h3
                                className="text-xs font-semibold uppercase tracking-widest mb-4"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                Quick Actions
                            </h3>
                            <div className="space-y-2">
                                <motion.button
                                    whileHover={{ scale: 1.02, x: 4 }}
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
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02, x: 4 }}
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
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02, x: 4 }}
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
                                </motion.button>
                            </div>
                        </div>
                    </FloatingCard>
                </div>
            </div>
        </motion.div >
    )
}

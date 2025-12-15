'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import {
    AlertTriangle, TrendingDown, Calendar,
    Share2, ChevronRight, Flame, Target, Loader2
} from 'lucide-react'
import ShareCard from './ShareCard'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface AvoidancePatternsProps {
    userIdentifier: string
}

interface PatternData {
    has_patterns: boolean
    ship_rate: number
    total_checkins: number
    shipped_count: number
    patterns: Array<{
        topic: string
        mentioned: number
        avoided: number
        avoidance_rate: number
        message: string
    }>
    excuse_patterns: Array<{
        category: string
        count: number
        message: string
    }>
    best_day: { day: string; rate: number } | null
    worst_day: { day: string; rate: number } | null
    brutal_insight: string
}

interface ProgressData {
    has_data: boolean
    recent_rate: number
    past_rate: number | null
    improvement: number | null
    message: string
}

export default function AvoidancePatterns({ userIdentifier }: AvoidancePatternsProps) {
    const [patterns, setPatterns] = useState<PatternData | null>(null)
    const [progress, setProgress] = useState<ProgressData | null>(null)
    const [loading, setLoading] = useState(true)
    const [showShare, setShowShare] = useState<'insight' | 'progress' | null>(null)

    useEffect(() => {
        loadPatterns()
    }, [userIdentifier])

    const loadPatterns = async () => {
        try {
            const [patternsRes, progressRes] = await Promise.all([
                axios.get(`${API_URL}/analysis/${encodeURIComponent(userIdentifier)}/patterns`),
                axios.get(`${API_URL}/analysis/${encodeURIComponent(userIdentifier)}/progress`)
            ])
            setPatterns(patternsRes.data)
            setProgress(progressRes.data)
        } catch (err) {
            console.error('Failed to load patterns:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#252525] rounded-2xl p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-[#C488F8] animate-spin" />
            </div>
        )
    }

    if (!patterns?.has_patterns && !progress?.has_data) {
        return (
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#252525] rounded-2xl p-8 text-center">
                <Target className="w-10 h-10 text-[#C488F8] mx-auto mb-4 opacity-50" />
                <p className="text-[#FBFAEE]/70">Keep checking in to unlock pattern insights</p>
                <p className="text-xs text-[#FBFAEE]/40 mt-1">Need at least 3+ check-ins</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Brutal Insight */}
            {patterns?.brutal_insight && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#252525] rounded-2xl p-6"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-400" />
                            <h3 className="font-semibold text-white">Reality Check</h3>
                        </div>
                        <button
                            onClick={() => setShowShare('insight')}
                            className="p-2 hover:bg-white/10 rounded-lg transition"
                        >
                            <Share2 className="w-4 h-4 text-[#FBFAEE]/50 hover:text-[#C488F8]" />
                        </button>
                    </div>
                    <p className="text-lg text-[#FBFAEE]/90 leading-relaxed">
                        {patterns.brutal_insight}
                    </p>
                </motion.div>
            )}

            {/* Progress Comparison */}
            {progress?.has_data && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#252525] rounded-2xl p-6"
                >
                    <div className="flex items-start justify-between mb-4">
                        <h3 className="font-semibold text-white">Your Progress</h3>
                        <button
                            onClick={() => setShowShare('progress')}
                            className="p-2 hover:bg-white/10 rounded-lg transition"
                        >
                            <Share2 className="w-4 h-4 text-[#FBFAEE]/50 hover:text-[#C488F8]" />
                        </button>
                    </div>

                    <div className="flex items-center justify-center gap-6 mb-4">
                        <div className="text-center">
                            <p className="text-xs text-[#FBFAEE]/50 mb-1">4 weeks ago</p>
                            <p className="text-2xl font-bold text-[#FBFAEE]/60">
                                {progress.past_rate ?? '--'}%
                            </p>
                        </div>
                        <ChevronRight className="w-6 h-6 text-[#FBFAEE]/30" />
                        <div className="text-center">
                            <p className="text-xs text-[#FBFAEE]/50 mb-1">This week</p>
                            <p className="text-2xl font-bold text-white">
                                {progress.recent_rate}%
                            </p>
                        </div>
                    </div>

                    {progress.improvement !== null && (
                        <div className="text-center">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${progress.improvement > 0
                                    ? 'bg-green-500/20 text-green-400'
                                    : progress.improvement < 0
                                        ? 'bg-red-500/20 text-red-400'
                                        : 'bg-gray-500/20 text-gray-400'
                                }`}>
                                {progress.improvement > 0 ? '+' : ''}{progress.improvement}%
                                <TrendingDown className={`w-3 h-3 ${progress.improvement >= 0 ? 'rotate-180' : ''}`} />
                            </span>
                        </div>
                    )}

                    {progress.message && (
                        <p className="text-sm text-center text-[#FBFAEE]/60 mt-3">
                            {progress.message}
                        </p>
                    )}
                </motion.div>
            )}

            {/* Avoidance Patterns */}
            {patterns?.patterns && patterns.patterns.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#252525] rounded-2xl p-6"
                >
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <Flame className="w-5 h-5 text-red-400" />
                        Avoidance Patterns
                    </h3>
                    <div className="space-y-3">
                        {patterns.patterns.map((pattern, i) => (
                            <div key={i} className="p-4 bg-[#0a0a0a] rounded-xl border border-red-500/20">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-white">{pattern.topic}</span>
                                    <span className="text-xs text-red-400 bg-red-500/20 px-2 py-0.5 rounded-full">
                                        {pattern.avoidance_rate}% avoided
                                    </span>
                                </div>
                                <p className="text-sm text-[#FBFAEE]/60">{pattern.message}</p>
                                <p className="text-xs text-[#FBFAEE]/40 mt-1">
                                    Mentioned {pattern.mentioned}x, delivered {pattern.mentioned - pattern.avoided}x
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Best/Worst Days */}
            {(patterns?.best_day || patterns?.worst_day) && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-2 gap-4"
                >
                    {patterns.best_day && (
                        <div className="bg-gradient-to-br from-green-900/20 to-[#0f0f0f] border border-green-500/20 rounded-2xl p-4 text-center">
                            <Calendar className="w-5 h-5 text-green-400 mx-auto mb-2" />
                            <p className="text-lg font-bold text-white">{patterns.best_day.day}</p>
                            <p className="text-xs text-green-400">{patterns.best_day.rate}% ship rate</p>
                            <p className="text-xs text-[#FBFAEE]/40 mt-1">Your best day</p>
                        </div>
                    )}
                    {patterns.worst_day && (
                        <div className="bg-gradient-to-br from-red-900/20 to-[#0f0f0f] border border-red-500/20 rounded-2xl p-4 text-center">
                            <Calendar className="w-5 h-5 text-red-400 mx-auto mb-2" />
                            <p className="text-lg font-bold text-white">{patterns.worst_day.day}</p>
                            <p className="text-xs text-red-400">{patterns.worst_day.rate}% ship rate</p>
                            <p className="text-xs text-[#FBFAEE]/40 mt-1">Needs work</p>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Share Modals */}
            {showShare === 'insight' && patterns && (
                <ShareCard
                    type="insight"
                    data={{
                        insight: patterns.brutal_insight
                    }}
                    onClose={() => setShowShare(null)}
                />
            )}
            {showShare === 'progress' && progress && (
                <ShareCard
                    type="progress"
                    data={{
                        primaryStat: String(progress.recent_rate),
                        secondaryStat: String(progress.past_rate ?? 0),
                        improvement: progress.improvement ?? 0,
                        insight: progress.message
                    }}
                    onClose={() => setShowShare(null)}
                />
            )}
        </div>
    )
}

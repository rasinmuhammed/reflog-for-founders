'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
    Skull, AlertTriangle, Eye, Download, RefreshCw, Flame, Target,
    TrendingDown, Sparkles, ArrowRight, Copy, Twitter, Share2, Zap
} from 'lucide-react'
import { motion } from 'framer-motion'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ShadowData {
    has_data: boolean
    roast: string
    stated_priority: string | null
    actual_focus: string | null
    discrepancy_score: number
    focus_score: number
    truth_bombs: string[]
    last_updated?: string
}

interface ShadowRoastProps {
    userIdentifier: string
}

// Demo data to show value before user sets up the script
const DEMO_DATA: ShadowData = {
    has_data: true,
    roast: "You said your priority was 'Revenue & Sales', but 73% of your commits were in frontend/styles. You're not building a business, you're perfecting pixels. Your customers won't notice that button radius you spent 4 hours on.",
    stated_priority: "Revenue & Sales",
    actual_focus: "Frontend/Styling (pixel pushing)",
    discrepancy_score: 78,
    focus_score: 35,
    truth_bombs: [
        "Peak commit time: 11pm-2am. That's not hustle, that's avoidance of the hard conversations you should be having during business hours.",
        "Only 2 commits touched anything related to payments or billing this month. Your MRR shows it.",
        "Focus score: 35/100. You're spread across 8 different areas. Pick one and finish it."
    ]
}

export default function ShadowRoast({ userIdentifier }: ShadowRoastProps) {
    const [data, setData] = useState<ShadowData | null>(null)
    const [loading, setLoading] = useState(true)
    const [showDemo, setShowDemo] = useState(true)
    const [savageMode, setSavageMode] = useState(false)
    const [copied, setCopied] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        fetchRoast()
    }, [userIdentifier])

    const fetchRoast = async () => {
        try {
            const response = await axios.get(`${API_URL}/shadow/roast/${userIdentifier}`)
            setData(response.data)
            // If no real data, automatically show demo after a short delay
            if (!response.data.has_data) {
                setTimeout(() => setShowDemo(true), 800)
            }
        } catch (error) {
            console.error('Failed to fetch shadow data:', error)
            // On error, show demo mode
            setTimeout(() => setShowDemo(true), 500)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const handleRefresh = () => {
        setRefreshing(true)
        fetchRoast()
    }

    const copyRoast = () => {
        if (displayData?.roast) {
            navigator.clipboard.writeText(displayData.roast)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const shareToTwitter = () => {
        if (displayData?.roast) {
            const text = encodeURIComponent(`My brutal reality check from @ReflogApp:\n\n"${displayData.roast}"\n\nDiscrepancy: ${displayData.discrepancy_score}%\n\nGet yours: reflogapp.com`)
            window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
        }
    }

    if (loading) {
        return (
            <div className="bg-[#0a0a0a] border border-red-900/30 rounded-2xl p-6 animate-pulse">
                <div className="h-6 w-48 bg-red-900/20 rounded mb-4" />
                <div className="h-24 bg-red-900/10 rounded" />
            </div>
        )
    }

    // Determine which data to display (real or demo)
    const displayData = data?.has_data ? data : (showDemo ? DEMO_DATA : null)
    const isDemo = !data?.has_data && showDemo

    // Determine severity color based on discrepancy
    const getSeverityColors = (score: number) => {
        if (score >= 70) return {
            border: 'border-red-500/50',
            bg: 'bg-gradient-to-br from-red-950/30 to-red-900/10',
            accent: 'text-red-400',
            glow: 'shadow-lg shadow-red-500/10'
        }
        if (score >= 40) return {
            border: 'border-yellow-500/30',
            bg: 'bg-gradient-to-br from-yellow-950/20 to-orange-900/10',
            accent: 'text-yellow-400',
            glow: ''
        }
        return {
            border: 'border-green-500/30',
            bg: 'bg-gradient-to-br from-green-950/10 to-emerald-900/5',
            accent: 'text-green-400',
            glow: ''
        }
    }

    const colors = displayData ? getSeverityColors(displayData.discrepancy_score) : getSeverityColors(0)

    return (
        <div className={`${colors.bg} ${colors.border} border rounded-2xl p-6 ${colors.glow} relative overflow-hidden`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-red-500 to-transparent" />
            </div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-500/20 rounded-xl">
                            <Skull className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-[#FBFAEE] flex items-center">
                                Shadow Mode
                                <span className="ml-2 text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full font-medium">
                                    THE ROAST
                                </span>
                                {isDemo && (
                                    <span className="ml-2 text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full font-medium flex items-center">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        DEMO
                                    </span>
                                )}
                            </h3>
                            <p className="text-xs text-[#FBFAEE]/40">Your code vs your claims</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Copy Button */}
                        <button
                            onClick={copyRoast}
                            className="p-2 hover:bg-white/5 rounded-lg transition flex items-center gap-1.5 text-xs"
                            title="Copy roast"
                        >
                            <Copy className={`w-4 h-4 ${copied ? 'text-green-400' : 'text-[#FBFAEE]/60'}`} />
                            {copied && <span className="text-green-400">Copied!</span>}
                        </button>

                        {/* Share to Twitter */}
                        <button
                            onClick={shareToTwitter}
                            className="p-2 hover:bg-white/5 rounded-lg transition group"
                            title="Share on Twitter"
                        >
                            <Twitter className="w-4 h-4 text-[#1DA1F2] group-hover:scale-110 transition" />
                        </button>

                        {/* Refresh */}
                        {!isDemo && (
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="p-2 hover:bg-white/5 rounded-lg transition"
                            >
                                <RefreshCw className={`w-4 h-4 text-[#FBFAEE]/60 ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                        )}
                    </div>
                </div>

                {!displayData ? (
                    /* Initial loading state before demo shows */
                    <div className="text-center py-6">
                        <Eye className="w-12 h-12 mx-auto text-[#FBFAEE]/20 mb-3" />
                        <p className="text-[#FBFAEE]/60 mb-2">Analyzing your reality...</p>
                        <p className="text-xs text-[#FBFAEE]/40">Preparing your truth check</p>
                    </div>
                ) : (
                    <>
                        {/* Demo Banner - Shows above the data when in demo mode */}
                        {isDemo && (
                            <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                                <div className="flex items-start space-x-3">
                                    <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm text-purple-300 font-medium mb-1">
                                            This is a sample roast from a real founder
                                        </p>
                                        <p className="text-xs text-[#FBFAEE]/50 mb-2">
                                            See what Shadow Mode reveals. Your reality check waits below.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Discrepancy Score */}
                        <div className="flex items-center justify-between mb-4 p-3 bg-black/30 rounded-xl">
                            <div>
                                <p className="text-xs text-[#FBFAEE]/40 uppercase tracking-wider">Reality Gap</p>
                                <div className="flex items-baseline space-x-1">
                                    <span className={`text-3xl font-bold ${colors.accent}`}>{displayData.discrepancy_score}</span>
                                    <span className="text-[#FBFAEE]/40">%</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-[#FBFAEE]/40 uppercase tracking-wider">Focus Score</p>
                                <div className="flex items-baseline space-x-1 justify-end">
                                    <span className="text-2xl font-bold text-[#FBFAEE]/80">{displayData.focus_score}</span>
                                    <span className="text-[#FBFAEE]/40">/100</span>
                                </div>
                            </div>
                        </div>

                        {/* Priority vs Reality */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="p-3 bg-black/20 rounded-xl">
                                <div className="flex items-center space-x-2 mb-1">
                                    <Target className="w-3.5 h-3.5 text-blue-400" />
                                    <p className="text-xs text-[#FBFAEE]/40">{isDemo ? 'They Said' : 'You Said'}</p>
                                </div>
                                <p className="text-sm font-medium text-[#FBFAEE]/80 truncate">
                                    {displayData.stated_priority || 'Not specified'}
                                </p>
                            </div>
                            <div className="p-3 bg-black/20 rounded-xl">
                                <div className="flex items-center space-x-2 mb-1">
                                    <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                                    <p className="text-xs text-[#FBFAEE]/40">Actually Did</p>
                                </div>
                                <p className="text-sm font-medium text-[#FBFAEE]/80 truncate">
                                    {displayData.actual_focus || 'Unknown'}
                                </p>
                            </div>
                        </div>

                        {/* The Roast */}
                        <div className="p-4 bg-black/30 rounded-xl border border-red-500/20 mb-4">
                            <div className="flex items-start space-x-3">
                                <Flame className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-[#FBFAEE]/90 leading-relaxed">
                                    {displayData.roast}
                                </p>
                            </div>
                        </div>

                        {/* Truth Bombs */}
                        {displayData.truth_bombs && displayData.truth_bombs.length > 0 && (
                            <div className="space-y-2 mb-4">
                                <p className="text-xs text-[#FBFAEE]/40 uppercase tracking-wider flex items-center">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Truth Bombs
                                </p>
                                {displayData.truth_bombs.map((bomb, idx) => (
                                    <div key={idx} className="flex items-start space-x-2 p-2 bg-black/20 rounded-lg">
                                        <span className="text-red-400 mt-0.5">•</span>
                                        <p className="text-xs text-[#FBFAEE]/70">{bomb}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Demo CTA - Only show in demo mode */}
                        {isDemo && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-purple-900/30 to-red-900/20 border border-purple-500/30 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-[#FBFAEE] mb-1">
                                            See YOUR Reality Check
                                        </p>
                                        <p className="text-xs text-[#FBFAEE]/50">
                                            Run the Local Truth Agent on your repos
                                        </p>
                                    </div>
                                    <a
                                        href="/scripts/reflog-truth.py"
                                        download
                                        className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded-xl transition text-sm font-bold shadow-lg shadow-red-500/25"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>Get Script</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </a>
                                </div>
                                <p className="text-xs text-[#FBFAEE]/30 mt-3">
                                    Run: <code className="px-1 py-0.5 bg-black/30 rounded">python reflog-truth.py --email {userIdentifier}</code>
                                </p>
                            </div>
                        )}

                        {/* Last Updated - Only show for real data */}
                        {!isDemo && displayData.last_updated && (
                            <p className="text-xs text-[#FBFAEE]/30 mt-4 text-center">
                                Last analyzed: {new Date(displayData.last_updated).toLocaleDateString()}
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

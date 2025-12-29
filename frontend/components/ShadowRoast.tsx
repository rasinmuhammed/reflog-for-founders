'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Skull, AlertTriangle, Eye, Download, RefreshCw, Flame, Target, TrendingDown } from 'lucide-react'

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

export default function ShadowRoast({ userIdentifier }: ShadowRoastProps) {
    const [data, setData] = useState<ShadowData | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        fetchRoast()
    }, [userIdentifier])

    const fetchRoast = async () => {
        try {
            const response = await axios.get(`${API_URL}/shadow/roast/${userIdentifier}`)
            setData(response.data)
        } catch (error) {
            console.error('Failed to fetch shadow data:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const handleRefresh = () => {
        setRefreshing(true)
        fetchRoast()
    }

    if (loading) {
        return (
            <div className="bg-[#0a0a0a] border border-red-900/30 rounded-2xl p-6 animate-pulse">
                <div className="h-6 w-48 bg-red-900/20 rounded mb-4" />
                <div className="h-24 bg-red-900/10 rounded" />
            </div>
        )
    }

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

    const colors = data ? getSeverityColors(data.discrepancy_score) : getSeverityColors(0)

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
                            </h3>
                            <p className="text-xs text-[#FBFAEE]/40">Your code vs your claims</p>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="p-2 hover:bg-white/5 rounded-lg transition"
                    >
                        <RefreshCw className={`w-4 h-4 text-[#FBFAEE]/40 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {!data?.has_data ? (
                    /* No data state */
                    <div className="text-center py-6">
                        <Eye className="w-12 h-12 mx-auto text-[#FBFAEE]/20 mb-3" />
                        <p className="text-[#FBFAEE]/60 mb-4">No shadow data yet</p>
                        <p className="text-xs text-[#FBFAEE]/40 mb-4 max-w-sm mx-auto">
                            Run the Local Truth Agent to analyze your real work patterns and see your reality check.
                        </p>
                        <a
                            href="/scripts/reflog-truth.py"
                            download
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition text-sm font-medium"
                        >
                            <Download className="w-4 h-4" />
                            <span>Download Truth Agent</span>
                        </a>
                    </div>
                ) : (
                    <>
                        {/* Discrepancy Score */}
                        <div className="flex items-center justify-between mb-4 p-3 bg-black/30 rounded-xl">
                            <div>
                                <p className="text-xs text-[#FBFAEE]/40 uppercase tracking-wider">Reality Gap</p>
                                <div className="flex items-baseline space-x-1">
                                    <span className={`text-3xl font-bold ${colors.accent}`}>{data.discrepancy_score}</span>
                                    <span className="text-[#FBFAEE]/40">%</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-[#FBFAEE]/40 uppercase tracking-wider">Focus Score</p>
                                <div className="flex items-baseline space-x-1 justify-end">
                                    <span className="text-2xl font-bold text-[#FBFAEE]/80">{data.focus_score}</span>
                                    <span className="text-[#FBFAEE]/40">/100</span>
                                </div>
                            </div>
                        </div>

                        {/* Priority vs Reality */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="p-3 bg-black/20 rounded-xl">
                                <div className="flex items-center space-x-2 mb-1">
                                    <Target className="w-3.5 h-3.5 text-blue-400" />
                                    <p className="text-xs text-[#FBFAEE]/40">You Said</p>
                                </div>
                                <p className="text-sm font-medium text-[#FBFAEE]/80 truncate">
                                    {data.stated_priority || 'Not specified'}
                                </p>
                            </div>
                            <div className="p-3 bg-black/20 rounded-xl">
                                <div className="flex items-center space-x-2 mb-1">
                                    <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                                    <p className="text-xs text-[#FBFAEE]/40">Actually Did</p>
                                </div>
                                <p className="text-sm font-medium text-[#FBFAEE]/80 truncate">
                                    {data.actual_focus || 'Unknown'}
                                </p>
                            </div>
                        </div>

                        {/* The Roast */}
                        <div className="p-4 bg-black/30 rounded-xl border border-red-500/20 mb-4">
                            <div className="flex items-start space-x-3">
                                <Flame className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-[#FBFAEE]/90 leading-relaxed">
                                    {data.roast}
                                </p>
                            </div>
                        </div>

                        {/* Truth Bombs */}
                        {data.truth_bombs && data.truth_bombs.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs text-[#FBFAEE]/40 uppercase tracking-wider flex items-center">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Truth Bombs
                                </p>
                                {data.truth_bombs.map((bomb, idx) => (
                                    <div key={idx} className="flex items-start space-x-2 p-2 bg-black/20 rounded-lg">
                                        <span className="text-red-400 mt-0.5">•</span>
                                        <p className="text-xs text-[#FBFAEE]/70">{bomb}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Last Updated */}
                        {data.last_updated && (
                            <p className="text-xs text-[#FBFAEE]/30 mt-4 text-center">
                                Last analyzed: {new Date(data.last_updated).toLocaleDateString()}
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

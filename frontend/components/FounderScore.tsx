'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { TrendingUp, TrendingDown, Zap, Target, Flame, Activity } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface FounderScoreProps {
    userIdentifier: string
}

interface ScoreBreakdown {
    revenueVelocity: number      // 30%
    executionRate: number        // 30%
    consistency: number          // 20%
    engagement: number           // 20%
}

interface ScoreData {
    totalScore: number
    breakdown: ScoreBreakdown
    trend: 'up' | 'down' | 'stable'
    insight: string
}

export default function FounderScore({ userIdentifier }: FounderScoreProps) {
    const [scoreData, setScoreData] = useState<ScoreData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadScore()
    }, [userIdentifier])

    const loadScore = async () => {
        try {
            const response = await axios.get(`${API_URL}/founder-score/${encodeURIComponent(userIdentifier)}`)
            setScoreData(response.data)
        } catch (error) {
            console.error('Failed to load founder score:', error)
            // Set default score based on local calculation
            setScoreData({
                totalScore: 50,
                breakdown: {
                    revenueVelocity: 50,
                    executionRate: 50,
                    consistency: 50,
                    engagement: 50
                },
                trend: 'stable',
                insight: 'Start tracking your metrics to get personalized insights.'
            })
        } finally {
            setLoading(false)
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400'
        if (score >= 60) return 'text-[#C488F8]'
        if (score >= 40) return 'text-yellow-400'
        return 'text-red-400'
    }

    const getScoreGradient = (score: number) => {
        if (score >= 80) return 'from-green-500 to-emerald-500'
        if (score >= 60) return 'from-[#933DC9] to-[#53118F]'
        if (score >= 40) return 'from-yellow-500 to-orange-500'
        return 'from-red-500 to-orange-500'
    }

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'up': return <TrendingUp className="w-5 h-5 text-green-400" />
            case 'down': return <TrendingDown className="w-5 h-5 text-red-400" />
            default: return <Activity className="w-5 h-5 text-[#FBFAEE]/50" />
        }
    }

    if (loading) {
        return (
            <div className="bg-[#242424] border border-[#242424]/50 rounded-2xl p-6 animate-pulse">
                <div className="h-32 bg-[#000000]/30 rounded-full w-32 mx-auto mb-4"></div>
                <div className="h-6 bg-[#000000]/30 rounded w-1/2 mx-auto"></div>
            </div>
        )
    }

    if (!scoreData || !scoreData.breakdown) return null

    const { totalScore, breakdown, trend, insight } = scoreData

    const breakdownItems = [
        { key: 'revenueVelocity', label: 'Revenue Velocity', weight: '30%', icon: Zap },
        { key: 'executionRate', label: 'Execution Rate', weight: '30%', icon: Target },
        { key: 'consistency', label: 'Consistency', weight: '20%', icon: Flame },
        { key: 'engagement', label: 'Engagement', weight: '20%', icon: Activity }
    ]

    return (
        <div className="bg-[#242424] border border-[#242424]/50 rounded-2xl p-6 shadow-xl">
            {/* Score Display */}
            <div className="flex flex-col items-center mb-6">
                <div className="relative">
                    {/* Outer ring */}
                    <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${getScoreGradient(totalScore)} p-1`}>
                        <div className="w-full h-full rounded-full bg-[#242424] flex items-center justify-center">
                            <div className="text-center">
                                <div className={`text-4xl font-bold ${getScoreColor(totalScore)}`}>
                                    {Math.round(totalScore)}
                                </div>
                                <div className="text-xs text-[#FBFAEE]/60">/ 100</div>
                            </div>
                        </div>
                    </div>
                    {/* Trend indicator */}
                    <div className="absolute -top-1 -right-1 bg-[#242424] rounded-full p-1.5 border border-[#242424]">
                        {getTrendIcon(trend)}
                    </div>
                </div>

                <h3 className="text-xl font-bold text-[#FBFAEE] mt-4">Founder Score</h3>
                <p className="text-sm text-[#FBFAEE]/60 text-center mt-1">{insight}</p>
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
                {breakdownItems.map(({ key, label, weight, icon: Icon }) => {
                    const value = breakdown[key as keyof ScoreBreakdown]
                    return (
                        <div key={key} className="flex items-center space-x-3">
                            <div className="bg-[#000000]/40 p-2 rounded-lg">
                                <Icon className="w-4 h-4 text-[#933DC9]" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-[#FBFAEE]/80">{label}</span>
                                    <span className="text-xs text-[#FBFAEE]/50">{weight}</span>
                                </div>
                                <div className="h-2 bg-[#000000]/40 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-gradient-to-r ${getScoreGradient(value)} transition-all duration-500`}
                                        style={{ width: `${value}%` }}
                                    />
                                </div>
                            </div>
                            <span className={`text-sm font-semibold ${getScoreColor(value)}`}>{value}</span>
                        </div>
                    )
                })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-[#242424]/40">
                <div className="flex justify-center space-x-4 text-xs">
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-400 mr-1"></span> &lt;40</span>
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-yellow-400 mr-1"></span> 40-59</span>
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-[#C488F8] mr-1"></span> 60-79</span>
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-400 mr-1"></span> 80+</span>
                </div>
            </div>
        </div>
    )
}

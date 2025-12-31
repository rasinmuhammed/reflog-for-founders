'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { Flame, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { PulsingCard } from './ui/FloatingCard'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface RoastSunProps {
    userIdentifier: string
}

/**
 * RoastSun - The "Sun" of the Dashboard
 * 
 * Central pulsating widget displaying the latest roast
 */
export default function RoastSun({ userIdentifier }: RoastSunProps) {
    const [roastData, setRoastData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadRoast()
    }, [userIdentifier])

    const loadRoast = async () => {
        try {
            const response = await axios.get(`${API_URL}/shadow/roast/${encodeURIComponent(userIdentifier)}`)
            setRoastData(response.data)
        } catch (error) {
            console.error('Failed to load roast:', error)
            // Set default if no roast available
            setRoastData({
                roast: "Start tracking your work to get your first roast.",
                discrepancy_score: 0,
                has_data: false
            })
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <PulsingCard className="p-6" pulseColor="rgba(251, 146, 60, 0.3)">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto" />
                </div>
            </PulsingCard>
        )
    }

    if (!roastData?.has_data) {
        return (
            <PulsingCard className="p-6" pulseColor="rgba(100, 116, 139, 0.3)">
                <div className="text-center">
                    <Flame className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        No roast yet. Start tracking your work.
                    </p>
                </div>
            </PulsingCard>
        )
    }

    const getTrendIcon = () => {
        const trend = roastData.trend || 'stable'
        if (trend === 'up') return <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
        if (trend === 'down') return <TrendingDown className="w-4 h-4" style={{ color: 'var(--color-danger)' }} />
        return <Minus className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'rgb(239, 68, 68)' // Red - high discrepancy
        if (score >= 60) return 'rgb(251, 146, 60)' // Orange
        if (score >= 40) return 'rgb(234, 179, 8)' // Yellow
        return 'rgb(34, 197, 94)' // Green - low discrepancy
    }

    const pulseColor = `rgba(${roastData.discrepancy_score >= 80 ? '239, 68, 68' :
            roastData.discrepancy_score >= 60 ? '251, 146, 60' :
                roastData.discrepancy_score >= 40 ? '234, 179, 8' :
                    '34, 197, 94'
        }, 0.4)`

    return (
        <PulsingCard className="p-6" pulseColor={pulseColor}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                    >
                        <Flame className="w-6 h-6" style={{ color: getScoreColor(roastData.discrepancy_score) }} />
                    </motion.div>
                    <h3 className="font-bold text-sm uppercase tracking-wide" style={{ color: 'var(--color-text-primary)' }}>
                        The Roast
                    </h3>
                </div>
                {getTrendIcon()}
            </div>

            {/* Roast Text */}
            <p className="text-base mb-4 leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                {roastData.roast}
            </p>

            {/* Metrics Row */}
            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
                <div>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Reality Gap</p>
                    <p className="text-lg font-bold" style={{ color: getScoreColor(roastData.discrepancy_score) }}>
                        {roastData.discrepancy_score}%
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Actual Focus</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                        {roastData.actual_focus || 'Unknown'}
                    </p>
                </div>
            </div>

            {/* Truth Bombs */}
            {roastData.truth_bombs && roastData.truth_bombs.length > 0 && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-warning)' }}>
                        💣 Truth Bombs
                    </p>
                    <ul className="space-y-1">
                        {roastData.truth_bombs.slice(0, 2).map((bomb: string, i: number) => (
                            <li key={i} className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                • {bomb}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </PulsingCard>
    )
}

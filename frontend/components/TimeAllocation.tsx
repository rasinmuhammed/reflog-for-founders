'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import {
    Clock, Code, Phone, Users, Briefcase, Coffee,
    PieChart, AlertTriangle, Save, Loader2, Plus, Trash2
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface TimeAllocationProps {
    userIdentifier: string
    statedPriority?: string // e.g., "revenue", "product", "fundraising"
}

interface TimeEntry {
    category: string
    hours: number
    icon: React.ElementType
    color: string
}

const categoryConfig: Record<string, { icon: React.ElementType; color: string; priority: string }> = {
    'Product/Building': { icon: Code, color: 'from-blue-500 to-cyan-500', priority: 'product' },
    'Sales/Revenue': { icon: Phone, color: 'from-green-500 to-emerald-500', priority: 'revenue' },
    'Customer Success': { icon: Users, color: 'from-purple-500 to-violet-500', priority: 'customer' },
    'Admin/Ops': { icon: Briefcase, color: 'from-gray-500 to-slate-500', priority: 'ops' },
    'Meetings': { icon: Coffee, color: 'from-yellow-500 to-amber-500', priority: 'meetings' },
    'Fundraising': { icon: Briefcase, color: 'from-pink-500 to-rose-500', priority: 'fundraising' }
}

export default function TimeAllocation({ userIdentifier, statedPriority = 'revenue' }: TimeAllocationProps) {
    const [timeEntries, setTimeEntries] = useState<Record<string, number>>({
        'Product/Building': 0,
        'Sales/Revenue': 0,
        'Customer Success': 0,
        'Admin/Ops': 0,
        'Meetings': 0,
        'Fundraising': 0
    })
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [saveSuccess, setSaveSuccess] = useState(false)

    useEffect(() => {
        loadTimeData()
    }, [userIdentifier])

    const loadTimeData = async () => {
        setError(null)
        try {
            const response = await axios.get(`${API_URL}/time-allocation/${encodeURIComponent(userIdentifier)}/today`)
            if (response.data && response.data.entries) {
                const entries: Record<string, number> = {}
                Object.keys(categoryConfig).forEach(cat => {
                    entries[cat] = response.data.entries[cat] || 0
                })
                setTimeEntries(entries)
            }
        } catch (error: any) {
            console.error('Failed to load time data:', error)
            setError(error.response?.status === 429
                ? 'Too many requests. Please wait a moment.'
                : 'Failed to load time data. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const saveTimeData = async () => {
        setSaving(true)
        setError(null)
        setSaveSuccess(false)
        try {
            await axios.post(`${API_URL}/time-allocation/${encodeURIComponent(userIdentifier)}`, {
                entries: timeEntries
            })
            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 3000)
        } catch (error: any) {
            console.error('Failed to save time data:', error)
            setError(error.response?.status === 429
                ? 'Too many requests. Please wait a moment.'
                : 'Failed to save. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const adjustTime = (category: string, delta: number) => {
        setTimeEntries(prev => ({
            ...prev,
            [category]: Math.max(0, Math.min(12, (prev[category] || 0) + delta))
        }))
    }

    const totalHours = Object.values(timeEntries).reduce((a, b) => a + b, 0)

    // Calculate percentages for pie chart
    const getPercentage = (hours: number) => totalHours > 0 ? (hours / totalHours * 100) : 0

    // Find priority mismatch
    const salesPercentage = getPercentage(timeEntries['Sales/Revenue'])
    const productPercentage = getPercentage(timeEntries['Product/Building'])
    const meetingsPercentage = getPercentage(timeEntries['Meetings'])

    const getMismatchWarning = (): string | null => {
        if (statedPriority === 'revenue' && salesPercentage < 30 && totalHours > 4) {
            return `You said revenue is your priority, but only ${salesPercentage.toFixed(0)}% of time on sales. Are you avoiding it?`
        }
        if (meetingsPercentage > 40 && totalHours > 4) {
            return `${meetingsPercentage.toFixed(0)}% of your day in meetings. When do you actually ship?`
        }
        if (productPercentage > 70 && salesPercentage < 10 && totalHours > 4) {
            return `${productPercentage.toFixed(0)}% on product, ${salesPercentage.toFixed(0)}% on sales. Classic founder trap.`
        }
        return null
    }

    const mismatchWarning = getMismatchWarning()

    if (loading) {
        return (
            <div className="bg-[#242424] border border-[#242424]/50 rounded-2xl p-6 animate-pulse">
                <div className="h-8 bg-[#000000]/30 rounded w-1/3 mb-6"></div>
                <div className="h-32 bg-[#000000]/30 rounded-xl"></div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#242424] border border-[#242424]/50 rounded-2xl p-6 shadow-xl"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-[#933DC9] to-[#53118F] p-2 rounded-xl shadow-lg shadow-purple-900/20">
                        <Clock className="w-6 h-6 text-[#FBFAEE]" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[#FBFAEE]">Time Reality Check</h3>
                        <p className="text-xs text-[#FBFAEE]/60">Where did your hours actually go?</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-[#C488F8]">{totalHours}h</div>
                    <div className="text-xs text-[#FBFAEE]/50">logged today</div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-900/30 border border-red-500/40 rounded-xl p-4 mb-6 flex items-center space-x-3"
                >
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-300">{error}</p>
                </motion.div>
            )}

            {/* Success Message */}
            {saveSuccess && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-green-900/30 border border-green-500/40 rounded-xl p-4 mb-6 flex items-center space-x-3"
                >
                    <Save className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <p className="text-sm text-green-300">Time logged successfully!</p>
                </motion.div>
            )}

            {/* Priority Mismatch Warning */}
            {mismatchWarning && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-yellow-900/30 border border-yellow-500/40 rounded-xl p-4 mb-6 flex items-start space-x-3"
                >
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-sm text-yellow-300">Priority Mismatch</p>
                        <p className="text-sm text-[#FBFAEE]/70">{mismatchWarning}</p>
                    </div>
                </motion.div>
            )}

            {/* Time Categories Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {Object.entries(categoryConfig).map(([category, { icon: Icon, color }]) => (
                    <motion.div
                        key={category}
                        whileHover={{ scale: 1.02 }}
                        className="bg-[#000000]/40 border border-[#242424]/40 rounded-xl p-4 hover:border-[#933DC9]/30 transition group"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={`bg-gradient-to-br ${color} p-1.5 rounded-lg`}>
                                <Icon className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-xs text-[#FBFAEE]/50">
                                {getPercentage(timeEntries[category]).toFixed(0)}%
                            </span>
                        </div>
                        <div className="text-xs text-[#FBFAEE]/70 mb-2 truncate">{category}</div>
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => adjustTime(category, -0.5)}
                                className="w-8 h-8 rounded-lg bg-[#242424] text-[#FBFAEE]/60 hover:bg-red-900/30 hover:text-red-400 transition flex items-center justify-center"
                            >
                                -
                            </button>
                            <span className="text-xl font-bold text-[#FBFAEE]">
                                {timeEntries[category]}h
                            </span>
                            <button
                                onClick={() => adjustTime(category, 0.5)}
                                className="w-8 h-8 rounded-lg bg-[#242424] text-[#FBFAEE]/60 hover:bg-green-900/30 hover:text-green-400 transition flex items-center justify-center"
                            >
                                +
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Visual Breakdown Bar */}
            {totalHours > 0 && (
                <div className="mb-6">
                    <div className="text-xs text-[#FBFAEE]/60 mb-2">Time Distribution</div>
                    <div className="h-4 rounded-full overflow-hidden flex bg-[#000000]/40">
                        {Object.entries(categoryConfig).map(([category, { color }]) => {
                            const pct = getPercentage(timeEntries[category])
                            if (pct === 0) return null
                            return (
                                <motion.div
                                    key={category}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.5 }}
                                    className={`h-full bg-gradient-to-r ${color}`}
                                    title={`${category}: ${pct.toFixed(0)}%`}
                                />
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4 border-t border-[#242424]/40">
                <p className="text-xs text-[#FBFAEE]/50">
                    Track daily to spot patterns
                </p>
                <button
                    onClick={saveTimeData}
                    disabled={saving}
                    className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-[#933DC9] to-[#53118F] text-[#FBFAEE] rounded-xl font-semibold hover:brightness-110 transition disabled:opacity-60 shadow-lg shadow-purple-900/20"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Saving...</span>
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            <span>Log Time</span>
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import {
    TrendingUp, TrendingDown, DollarSign, Users, Clock,
    Plus, Minus, Save, Loader2, BarChart3, AlertCircle,
    ArrowUpRight, ArrowDownRight, AlertTriangle, Phone
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface MetricsInputProps {
    userIdentifier: string
    onUpdate?: () => void
}

interface BusinessMetrics {
    mrr: number
    customers: number
    activeUsers: number
    runway: number
    churnRate: number
    salesCalls: number
    meetingsBooked: number
}

interface MetricHistory {
    current: number
    previous: number
    change: number
    changePercent: number
}

interface VanityWarning {
    type: 'danger' | 'warning' | 'info'
    title: string
    message: string
}

export default function MetricsInput({ userIdentifier, onUpdate }: MetricsInputProps) {
    const [metrics, setMetrics] = useState<BusinessMetrics>({
        mrr: 0,
        customers: 0,
        activeUsers: 0,
        runway: 0,
        churnRate: 0,
        salesCalls: 0,
        meetingsBooked: 0
    })
    const [history, setHistory] = useState<Record<string, MetricHistory>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showQuickActions, setShowQuickActions] = useState(false)
    const [lastUpdated, setLastUpdated] = useState<string | null>(null)

    useEffect(() => {
        loadMetrics()
    }, [userIdentifier])

    const loadMetrics = async () => {
        try {
            const response = await axios.get(`${API_URL}/metrics/${encodeURIComponent(userIdentifier)}`)
            if (response.data) {
                setMetrics(response.data.current || metrics)
                setHistory(response.data.history || {})
                setLastUpdated(response.data.lastUpdated)
            }
        } catch (error) {
            console.error('Failed to load metrics:', error)
        } finally {
            setLoading(false)
        }
    }

    const saveMetrics = async () => {
        setSaving(true)
        try {
            await axios.post(`${API_URL}/metrics/${encodeURIComponent(userIdentifier)}`, metrics)
            await loadMetrics()
            if (onUpdate) onUpdate()
        } catch (error) {
            console.error('Failed to save metrics:', error)
        } finally {
            setSaving(false)
        }
    }

    const quickAdjust = (field: keyof BusinessMetrics, amount: number) => {
        setMetrics(prev => ({
            ...prev,
            [field]: Math.max(0, prev[field] + amount)
        }))
    }

    // === VANITY METRIC DETECTION ===
    const getVanityWarnings = (): VanityWarning[] => {
        const warnings: VanityWarning[] = []

        // Active users growing but MRR flat = vanity trap
        if (metrics.activeUsers > 100 && metrics.mrr < 1000) {
            warnings.push({
                type: 'danger',
                title: 'Vanity Metric Alert',
                message: `${metrics.activeUsers} active users but only $${metrics.mrr} MRR. Users don't pay bills—paying customers do.`
            })
        }

        // Zero sales calls = building in a vacuum
        if (metrics.salesCalls === 0 && metrics.customers < 10) {
            warnings.push({
                type: 'danger',
                title: 'No Customer Conversations',
                message: 'Zero sales calls this week. Are you building what people actually want to pay for?'
            })
        }

        // High churn + low customers = death spiral
        if (metrics.churnRate > 5 && metrics.customers < 50) {
            warnings.push({
                type: 'danger',
                title: 'Churn Crisis',
                message: `${metrics.churnRate}% churn with ${metrics.customers} customers. Fix retention before acquiring more.`
            })
        }

        // Low runway warning
        if (metrics.runway > 0 && metrics.runway < 6) {
            warnings.push({
                type: 'warning',
                title: 'Runway Alert',
                message: `${metrics.runway} months of runway. Time to focus ruthlessly on revenue or fundraising.`
            })
        }

        // Good pattern: sales calls happening
        if (metrics.salesCalls >= 10) {
            warnings.push({
                type: 'info',
                title: 'Sales Momentum',
                message: `${metrics.salesCalls} sales calls. Good hustle. What's your close rate?`
            })
        }

        return warnings
    }

    const getChangeIndicator = (key: string) => {
        const h = history[key]
        if (!h || h.change === 0) return null

        const isPositive = h.change > 0
        const isGoodMetric = !['churnRate'].includes(key)
        const isGood = isGoodMetric ? isPositive : !isPositive

        return (
            <div className={`flex items-center text-xs ${isGood ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>{Math.abs(h.changePercent).toFixed(1)}%</span>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="bg-[#242424] border border-[#242424]/50 rounded-2xl p-6 animate-pulse">
                <div className="h-8 bg-[#000000]/30 rounded w-1/3 mb-6"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 bg-[#000000]/30 rounded-xl"></div>
                    ))}
                </div>
            </div>
        )
    }

    const metricConfigs = [
        { key: 'mrr', label: 'MRR', icon: DollarSign, prefix: '$', quickAmounts: [100, 500, 1000] },
        { key: 'customers', label: 'Paying Customers', icon: Users, prefix: '', quickAmounts: [1, 5, 10] },
        { key: 'activeUsers', label: 'Active Users', icon: BarChart3, prefix: '', quickAmounts: [10, 50, 100] },
        { key: 'runway', label: 'Runway (months)', icon: Clock, prefix: '', quickAmounts: [1, 3, 6] },
        { key: 'churnRate', label: 'Churn Rate', icon: TrendingDown, suffix: '%', quickAmounts: [0.5, 1, 2] },
        { key: 'salesCalls', label: 'Sales Calls', icon: Phone, prefix: '', quickAmounts: [5, 10, 20] },
        { key: 'meetingsBooked', label: 'Demos Booked', icon: TrendingUp, prefix: '', quickAmounts: [1, 3, 5] }
    ]

    const warnings = getVanityWarnings()

    return (
        <div className="bg-[#242424] border border-[#242424]/50 rounded-2xl p-6 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-[#933DC9] to-[#53118F] p-2 rounded-xl">
                        <BarChart3 className="w-6 h-6 text-[#FBFAEE]" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[#FBFAEE]">Reality Metrics</h3>
                        <p className="text-xs text-[#FBFAEE]/60">
                            {lastUpdated ? `Last updated: ${new Date(lastUpdated).toLocaleDateString()}` : 'Track what actually matters'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowQuickActions(!showQuickActions)}
                    className="px-4 py-2 bg-[#000000]/40 text-[#FBFAEE]/80 rounded-xl text-sm font-medium hover:bg-[#000000]/60 transition border border-[#242424]/50"
                >
                    {showQuickActions ? 'Hide Quick Actions' : 'Quick Actions'}
                </button>
            </div>

            {/* Vanity Metric Warnings */}
            {warnings.length > 0 && (
                <div className="space-y-2 mb-6">
                    {warnings.map((warning, idx) => (
                        <div
                            key={idx}
                            className={`rounded-xl p-4 flex items-start space-x-3 ${warning.type === 'danger'
                                    ? 'bg-red-900/30 border border-red-500/40'
                                    : warning.type === 'warning'
                                        ? 'bg-yellow-900/30 border border-yellow-500/40'
                                        : 'bg-green-900/30 border border-green-500/40'
                                }`}
                        >
                            <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${warning.type === 'danger' ? 'text-red-400'
                                    : warning.type === 'warning' ? 'text-yellow-400'
                                        : 'text-green-400'
                                }`} />
                            <div>
                                <p className={`font-semibold text-sm ${warning.type === 'danger' ? 'text-red-300'
                                        : warning.type === 'warning' ? 'text-yellow-300'
                                            : 'text-green-300'
                                    }`}>{warning.title}</p>
                                <p className="text-sm text-[#FBFAEE]/70 mt-0.5">{warning.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {metricConfigs.map(({ key, label, icon: Icon, prefix, suffix, quickAmounts }) => (
                    <div
                        key={key}
                        className="bg-[#000000]/40 border border-[#242424]/40 rounded-xl p-4 hover:border-[#933DC9]/30 transition"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <Icon className="w-4 h-4 text-[#933DC9]" />
                                <span className="text-sm text-[#FBFAEE]/70">{label}</span>
                            </div>
                            {getChangeIndicator(key)}
                        </div>

                        <div className="flex items-center space-x-2">
                            <span className="text-[#FBFAEE]/50 text-sm">{prefix}</span>
                            <input
                                type="number"
                                value={metrics[key as keyof BusinessMetrics]}
                                onChange={(e) => setMetrics({ ...metrics, [key]: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-transparent text-2xl font-bold text-[#FBFAEE] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            {suffix && <span className="text-[#FBFAEE]/50 text-sm">{suffix}</span>}
                        </div>

                        {/* Quick Actions */}
                        {showQuickActions && (
                            <div className="flex items-center gap-1 mt-3 pt-3 border-t border-[#242424]/40">
                                {quickAmounts.map(amount => (
                                    <button
                                        key={amount}
                                        onClick={() => quickAdjust(key as keyof BusinessMetrics, amount)}
                                        className="flex-1 px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs font-medium hover:bg-green-600/30 transition"
                                    >
                                        +{amount}
                                    </button>
                                ))}
                                <button
                                    onClick={() => quickAdjust(key as keyof BusinessMetrics, -quickAmounts[0])}
                                    className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs font-medium hover:bg-red-600/30 transition"
                                >
                                    -{quickAmounts[0]}
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4 border-t border-[#242424]/40">
                <p className="text-xs text-[#FBFAEE]/50">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    Revenue metrics only. Vanity metrics get flagged.
                </p>
                <button
                    onClick={saveMetrics}
                    disabled={saving}
                    className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-[#933DC9] to-[#53118F] text-[#FBFAEE] rounded-xl font-semibold hover:brightness-110 transition disabled:opacity-60"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Saving...</span>
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            <span>Save Metrics</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}


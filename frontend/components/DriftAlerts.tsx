'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { AlertTriangle, Bell, X, ChevronRight, Shield, TrendingDown, Clock, Target, Flame } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface DriftAlert {
    id: number
    agent: string
    title: string
    message: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    alert_type: string
    action: string
    created_at: string
    dismissed: boolean
}

interface DriftAlertsProps {
    userIdentifier: string
    onAlertCount?: (count: number) => void
}

export default function DriftAlerts({ userIdentifier, onAlertCount }: DriftAlertsProps) {
    const [alerts, setAlerts] = useState<DriftAlert[]>([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState(false)

    useEffect(() => {
        fetchAlerts()
    }, [userIdentifier])

    const fetchAlerts = async () => {
        try {
            const response = await axios.get(`${API_URL}/alerts/${userIdentifier}`)
            const activeAlerts = response.data.alerts.filter((a: DriftAlert) => !a.dismissed)
            setAlerts(activeAlerts)
            if (onAlertCount) {
                onAlertCount(activeAlerts.length)
            }
        } catch (error) {
            console.error('Failed to fetch alerts:', error)
        } finally {
            setLoading(false)
        }
    }

    const dismissAlert = async (alertId: number) => {
        try {
            await axios.put(`${API_URL}/alerts/${alertId}/dismiss`)
            setAlerts(prev => prev.filter(a => a.id !== alertId))
            if (onAlertCount) {
                onAlertCount(alerts.length - 1)
            }
        } catch (error) {
            console.error('Failed to dismiss alert:', error)
        }
    }

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'critical':
                return {
                    bg: 'bg-red-500/20',
                    border: 'border-red-500/50',
                    icon: 'text-red-400',
                    badge: 'bg-red-500 text-white'
                }
            case 'high':
                return {
                    bg: 'bg-orange-500/20',
                    border: 'border-orange-500/50',
                    icon: 'text-orange-400',
                    badge: 'bg-orange-500 text-white'
                }
            case 'medium':
                return {
                    bg: 'bg-yellow-500/20',
                    border: 'border-yellow-500/50',
                    icon: 'text-yellow-400',
                    badge: 'bg-yellow-500 text-black'
                }
            default:
                return {
                    bg: 'bg-blue-500/20',
                    border: 'border-blue-500/50',
                    icon: 'text-blue-400',
                    badge: 'bg-blue-500 text-white'
                }
        }
    }

    const getAlertIcon = (alertType: string) => {
        switch (alertType) {
            case 'no_checkin':
                return Clock
            case 'focus_drop':
                return TrendingDown
            case 'completion_crash':
                return Target
            case 'high_discrepancy':
                return Flame
            default:
                return AlertTriangle
        }
    }

    if (loading) {
        return null
    }

    if (alerts.length === 0) {
        return null
    }

    // Collapsed view - just a notification bar
    if (!expanded) {
        const highestSeverity = alerts[0]?.severity || 'medium'
        const styles = getSeverityStyles(highestSeverity)

        return (
            <button
                onClick={() => setExpanded(true)}
                className={`w-full ${styles.bg} border ${styles.border} rounded-xl p-3 flex items-center justify-between hover:bg-opacity-80 transition group`}
            >
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <Bell className={`w-5 h-5 ${styles.icon}`} />
                        <span className={`absolute -top-1 -right-1 w-4 h-4 ${styles.badge} text-xs rounded-full flex items-center justify-center font-bold`}>
                            {alerts.length}
                        </span>
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-medium text-[#FBFAEE]">
                            {alerts.length} Drift {alerts.length === 1 ? 'Alert' : 'Alerts'}
                        </p>
                        <p className="text-xs text-[#FBFAEE]/50">
                            {alerts[0]?.title}
                        </p>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#FBFAEE]/40 group-hover:translate-x-1 transition" />
            </button>
        )
    }

    // Expanded view - full alert list
    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-red-400" />
                    <h3 className="font-bold text-[#FBFAEE]">Drift Alerts</h3>
                    <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">
                        {alerts.length} active
                    </span>
                </div>
                <button
                    onClick={() => setExpanded(false)}
                    className="text-[#FBFAEE]/40 hover:text-[#FBFAEE] transition text-sm"
                >
                    Collapse
                </button>
            </div>

            {/* Alert Cards */}
            {alerts.map(alert => {
                const styles = getSeverityStyles(alert.severity)
                const Icon = getAlertIcon(alert.alert_type)

                return (
                    <div
                        key={alert.id}
                        className={`${styles.bg} border ${styles.border} rounded-xl p-4 relative group`}
                    >
                        {/* Dismiss button */}
                        <button
                            onClick={() => dismissAlert(alert.id)}
                            className="absolute top-2 right-2 p-1 rounded-lg bg-black/20 opacity-0 group-hover:opacity-100 transition hover:bg-black/40"
                        >
                            <X className="w-4 h-4 text-[#FBFAEE]/60" />
                        </button>

                        <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg bg-black/30 ${styles.icon}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 pr-6">
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-bold text-[#FBFAEE]">{alert.title}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${styles.badge}`}>
                                        {alert.severity}
                                    </span>
                                </div>
                                <p className="text-sm text-[#FBFAEE]/80 mb-2">
                                    {alert.message}
                                </p>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-[#FBFAEE]/40">
                                        From: {alert.agent}
                                    </p>
                                    {alert.action && (
                                        <p className="text-xs text-purple-400">
                                            → {alert.action}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

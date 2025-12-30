'use client'

import React, { useState } from 'react'
import axios from 'axios'
import {
    Target, Loader2, TrendingUp, TrendingDown, AlertTriangle,
    Lightbulb, ArrowRight, Building2, Flame, CheckCircle2, XCircle, RotateCcw
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ComparableStartup {
    name: string
    from: string
    to: string
    outcome: string
    lesson: string
}

interface SimulationResult {
    id: number
    title: string
    pivot_type: string
    survival_probability: number
    confidence: string
    probability_factors?: {
        base_rate: number
        adjustments: Array<{ factor: string; impact: number }>
    }
    comparable_startups: ComparableStartup[]
    risk_factors: string[]
    brutal_truth: string
    recommendations: string[]
    simulated_at: string
}

interface PivotSimulatorProps {
    userIdentifier: string
    onSimulationComplete?: (result: SimulationResult) => void
}

export default function PivotSimulator({ userIdentifier, onSimulationComplete }: PivotSimulatorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [simulating, setSimulating] = useState(false)
    const [result, setResult] = useState<SimulationResult | null>(null)

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        current_situation: '',
        target_market: ''
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const runSimulation = async (e: React.FormEvent) => {
        e.preventDefault()
        setSimulating(true)

        try {
            const response = await axios.post(`${API_URL}/simulate-pivot/${encodeURIComponent(userIdentifier)}`, formData)
            setResult(response.data)
            if (onSimulationComplete) {
                onSimulationComplete(response.data)
            }
        } catch (error) {
            console.error('Simulation failed:', error)
        } finally {
            setSimulating(false)
        }
    }

    const getSurvivalColor = (prob: number) => {
        if (prob >= 60) return 'text-emerald-400'
        if (prob >= 40) return 'text-yellow-400'
        return 'text-red-400'
    }

    const getConfidenceBadge = (confidence: string) => {
        const colors = {
            high: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
            low: 'bg-red-500/10 text-red-400 border-red-500/20'
        }
        return colors[confidence as keyof typeof colors] || colors.medium
    }

    const resetSimulator = () => {
        setResult(null)
        setFormData({ title: '', description: '', current_situation: '', target_market: '' })
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full card p-6 group transition-all hover:bg-[var(--color-bg-elevated)]"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div
                            className="p-3 rounded-xl transition-colors group-hover:bg-[var(--color-accent-muted)]"
                            style={{ background: 'var(--color-bg-hover)' }}
                        >
                            <Target className="w-6 h-6" style={{ color: 'var(--color-accent)' }} />
                        </div>
                        <div className="text-left">
                            <p
                                className="font-bold text-lg"
                                style={{ color: 'var(--color-text-primary)' }}
                            >
                                Pivot Simulator
                            </p>
                            <p
                                className="text-sm"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                Simulate difficult decisions before executing
                            </p>
                        </div>
                    </div>
                    <div
                        className="p-2 rounded-full border transition-all group-hover:bg-[var(--color-accent-muted)] group-hover:border-[var(--color-accent)]"
                        style={{ borderColor: 'var(--color-border)' }}
                    >
                        <ArrowRight className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                </div>
            </button>
        )
    }

    return (
        <div className="rounded-2xl overflow-hidden card">
            {/* Header */}
            <div
                className="p-6 flex items-center justify-between"
                style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
            >
                <div className="flex items-center space-x-3">
                    <Target className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                    <div>
                        <h3
                            className="font-bold text-lg"
                            style={{ color: 'var(--color-text-primary)' }}
                        >
                            Pivot Simulator
                        </h3>
                        <p
                            className="text-xs"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            Executive Decision Intelligence
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => { setIsOpen(false); resetSimulator(); }}
                    className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition"
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    ✕
                </button>
            </div>

            <div className="p-6">
                {!result ? (
                    /* Simulation Form */
                    <form onSubmit={runSimulation} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                                Pivot Title
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="e.g., B2C to B2B SaaS"
                                className="input"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                                Current Situation
                            </label>
                            <textarea
                                name="current_situation"
                                value={formData.current_situation}
                                onChange={handleInputChange}
                                placeholder="Where is your business now? Revenue, traction, team..."
                                className="input h-24 resize-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                                Pivot Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="What's the play? What changes?"
                                className="input h-32 resize-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                                Target Market
                            </label>
                            <input
                                type="text"
                                name="target_market"
                                value={formData.target_market}
                                onChange={handleInputChange}
                                placeholder="Who will you serve?"
                                className="input"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={simulating}
                            className="btn btn-primary w-full py-3 text-base"
                        >
                            {simulating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Simulating Outcomes...</span>
                                </>
                            ) : (
                                <>
                                    <Target className="w-5 h-5" />
                                    <span>Run Simulation</span>
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    /* Simulation Results */
                    <div className="space-y-6 animate-fadeIn">
                        {/* Survival Probability */}
                        <div
                            className="text-center p-8 rounded-xl relative overflow-hidden"
                            style={{
                                background: 'var(--color-bg-shell)',
                                border: '1px solid var(--color-border)'
                            }}
                        >
                            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
                                Probability of Success
                            </p>
                            <div className="flex items-center justify-center space-x-2 mb-3">
                                <span className={`text-6xl font-bold ${getSurvivalColor(result.survival_probability)}`}>
                                    {result.survival_probability}
                                </span>
                                <span className="text-2xl" style={{ color: 'var(--color-text-subtle)' }}>%</span>
                            </div>
                            <span
                                className={`text-xs px-3 py-1 rounded-full border ${getConfidenceBadge(result.confidence)}`}
                            >
                                {result.confidence} confidence
                            </span>
                        </div>

                        {/* Probability Factors */}
                        {result.probability_factors && (
                            <div className="p-5 rounded-xl border border-dashed" style={{ borderColor: 'var(--color-border)' }}>
                                <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>Calculation Breakdown</p>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span style={{ color: 'var(--color-text-muted)' }}>Base rate for {result.pivot_type}</span>
                                        <span style={{ color: 'var(--color-text-primary)' }}>{result.probability_factors.base_rate}%</span>
                                    </div>
                                    {result.probability_factors.adjustments.map((adj, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span style={{ color: 'var(--color-text-secondary)' }}>{adj.factor}</span>
                                            <span className={adj.impact > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                                {adj.impact > 0 ? '+' : ''}{adj.impact}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* The Brutal Truth */}
                        <div
                            className="p-5 rounded-xl border"
                            style={{
                                background: 'rgba(239, 68, 68, 0.05)',
                                borderColor: 'rgba(239, 68, 68, 0.2)'
                            }}
                        >
                            <div className="flex items-start space-x-4">
                                <div className="p-2 rounded-lg bg-red-500/10">
                                    <Flame className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-red-500 mb-2">The Brutal Truth</p>
                                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                                        {result.brutal_truth}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Comparable Startups */}
                        <div>
                            <p className="text-xs uppercase tracking-widest mb-3 flex items-center" style={{ color: 'var(--color-text-muted)' }}>
                                <Building2 className="w-3.5 h-3.5 mr-2" />
                                Comparable Pivots
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {result.comparable_startups.map((startup, idx) => (
                                    <div
                                        key={idx}
                                        className="p-4 rounded-lg border transition-all hover:bg-[var(--color-bg-hover)]"
                                        style={{
                                            background: 'var(--color-bg-shell)',
                                            borderColor: 'var(--color-border-subtle)'
                                        }}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{startup.name}</span>
                                            {startup.outcome === 'success' ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-red-400" />
                                            )}
                                        </div>
                                        <div className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
                                            {startup.from} → {startup.to}
                                        </div>
                                        <div className="text-xs italic pl-2 border-l-2" style={{ color: 'var(--color-text-subtle)', borderColor: 'var(--color-border)' }}>
                                            "{startup.lesson}"
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Risk Factors */}
                        <div>
                            <p className="text-xs uppercase tracking-widest mb-3 flex items-center" style={{ color: 'var(--color-text-muted)' }}>
                                <AlertTriangle className="w-3.5 h-3.5 mr-2" />
                                Critical Risks
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {result.risk_factors.map((risk, idx) => (
                                    <span
                                        key={idx}
                                        className="text-xs px-3 py-1.5 rounded-md border"
                                        style={{
                                            background: 'var(--color-bg-shell)',
                                            borderColor: 'var(--color-border)',
                                            color: 'var(--color-text-secondary)'
                                        }}
                                    >
                                        {risk}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div>
                            <p className="text-xs uppercase tracking-widest mb-3 flex items-center" style={{ color: 'var(--color-text-muted)' }}>
                                <Lightbulb className="w-3.5 h-3.5 mr-2" />
                                Recommendations
                            </p>
                            <div className="space-y-2">
                                {result.recommendations.map((rec, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-start space-x-3 p-3 rounded-lg border border-dashed"
                                        style={{ borderColor: 'var(--color-border-subtle)' }}
                                    >
                                        <ArrowRight className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-accent)' }} />
                                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{rec}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={resetSimulator}
                            className="btn btn-secondary w-full"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Run Another Simulation
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

'use client'

import React, { useState } from 'react'
import axios from 'axios'
import {
    Target, Loader2, TrendingUp, TrendingDown, AlertTriangle,
    Lightbulb, ArrowRight, Building2, Flame, CheckCircle2, XCircle
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
            const response = await axios.post(`${API_URL}/simulate-pivot/${userIdentifier}`, formData)
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
        if (prob >= 60) return 'text-green-400'
        if (prob >= 40) return 'text-yellow-400'
        return 'text-red-400'
    }

    const getConfidenceBadge = (confidence: string) => {
        const colors = {
            high: 'bg-green-500/20 text-green-400',
            medium: 'bg-yellow-500/20 text-yellow-400',
            low: 'bg-red-500/20 text-red-400'
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
                className="w-full p-4 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 rounded-xl hover:border-purple-400/50 transition group"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition">
                            <Target className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-[#FBFAEE]">Pivot Simulator</p>
                            <p className="text-xs text-[#FBFAEE]/50">Simulate your pivot before burning cash</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition" />
                </div>
            </button>
        )
    }

    return (
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-purple-500/30 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-purple-500/10 border-b border-purple-500/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Target className="w-6 h-6 text-purple-400" />
                        <div>
                            <h3 className="font-bold text-[#FBFAEE]">Pivot Simulator</h3>
                            <p className="text-xs text-[#FBFAEE]/50">AI-powered pivot outcome prediction</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setIsOpen(false); resetSimulator(); }}
                        className="text-[#FBFAEE]/40 hover:text-[#FBFAEE] transition"
                    >
                        ✕
                    </button>
                </div>
            </div>

            <div className="p-6">
                {!result ? (
                    /* Simulation Form */
                    <form onSubmit={runSimulation} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[#FBFAEE]/80 mb-1">
                                Pivot Title
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="e.g., B2C to B2B Enterprise"
                                className="w-full px-4 py-2 bg-black/50 border border-purple-500/30 rounded-xl text-[#FBFAEE] placeholder-[#FBFAEE]/30 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#FBFAEE]/80 mb-1">
                                Current Situation
                            </label>
                            <textarea
                                name="current_situation"
                                value={formData.current_situation}
                                onChange={handleInputChange}
                                placeholder="Where is your business now? Revenue, traction, team..."
                                className="w-full px-4 py-2 bg-black/50 border border-purple-500/30 rounded-xl text-[#FBFAEE] placeholder-[#FBFAEE]/30 focus:ring-2 focus:ring-purple-500 h-20 resize-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#FBFAEE]/80 mb-1">
                                Pivot Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="What's the pivot? Why are you considering it?"
                                className="w-full px-4 py-2 bg-black/50 border border-purple-500/30 rounded-xl text-[#FBFAEE] placeholder-[#FBFAEE]/30 focus:ring-2 focus:ring-purple-500 h-24 resize-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#FBFAEE]/80 mb-1">
                                Target Market (optional)
                            </label>
                            <input
                                type="text"
                                name="target_market"
                                value={formData.target_market}
                                onChange={handleInputChange}
                                placeholder="Who will you serve after the pivot?"
                                className="w-full px-4 py-2 bg-black/50 border border-purple-500/30 rounded-xl text-[#FBFAEE] placeholder-[#FBFAEE]/30 focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={simulating}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-500 hover:to-indigo-500 transition disabled:opacity-50 flex items-center justify-center space-x-2"
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
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {/* Survival Probability */}
                        <div className="text-center p-6 bg-black/30 rounded-xl border border-purple-500/20">
                            <p className="text-sm text-[#FBFAEE]/50 uppercase tracking-wider mb-2">
                                Survival Probability
                            </p>
                            <div className="flex items-center justify-center space-x-2">
                                <span className={`text-6xl font-bold ${getSurvivalColor(result.survival_probability)}`}>
                                    {result.survival_probability}
                                </span>
                                <span className="text-2xl text-[#FBFAEE]/40">%</span>
                            </div>
                            <span className={`text-xs px-3 py-1 rounded-full ${getConfidenceBadge(result.confidence)}`}>
                                {result.confidence} confidence
                            </span>
                        </div>

                        {/* Probability Factors */}
                        {result.probability_factors && (
                            <div className="p-4 bg-black/20 rounded-xl">
                                <p className="text-xs text-[#FBFAEE]/50 uppercase tracking-wider mb-3">Calculation Breakdown</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#FBFAEE]/60">Base rate for {result.pivot_type}</span>
                                        <span className="text-[#FBFAEE]">{result.probability_factors.base_rate}%</span>
                                    </div>
                                    {result.probability_factors.adjustments.map((adj, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span className="text-[#FBFAEE]/60">{adj.factor}</span>
                                            <span className={adj.impact > 0 ? 'text-green-400' : 'text-red-400'}>
                                                {adj.impact > 0 ? '+' : ''}{adj.impact}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* The Brutal Truth */}
                        <div className="p-4 bg-red-950/30 rounded-xl border border-red-500/30">
                            <div className="flex items-start space-x-3">
                                <Flame className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-red-400 mb-2">The Brutal Truth</p>
                                    <p className="text-sm text-[#FBFAEE]/90 leading-relaxed">
                                        {result.brutal_truth}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Comparable Startups */}
                        <div>
                            <p className="text-xs text-[#FBFAEE]/50 uppercase tracking-wider mb-3 flex items-center">
                                <Building2 className="w-3.5 h-3.5 mr-1" />
                                Similar Pivots
                            </p>
                            <div className="space-y-3">
                                {result.comparable_startups.map((startup, idx) => (
                                    <div key={idx} className="p-3 bg-black/20 rounded-xl border border-purple-500/10">
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="font-bold text-[#FBFAEE]">{startup.name}</span>
                                            {startup.outcome === 'success' ? (
                                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-red-400" />
                                            )}
                                        </div>
                                        <p className="text-xs text-[#FBFAEE]/60 mb-1">
                                            {startup.from} → {startup.to}
                                        </p>
                                        <p className="text-xs text-purple-300/80 italic">
                                            "{startup.lesson}"
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Risk Factors */}
                        <div>
                            <p className="text-xs text-[#FBFAEE]/50 uppercase tracking-wider mb-3 flex items-center">
                                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                                Risk Factors
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {result.risk_factors.map((risk, idx) => (
                                    <span key={idx} className="text-xs px-3 py-1 bg-red-500/10 text-red-300 rounded-full border border-red-500/20">
                                        {risk}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div>
                            <p className="text-xs text-[#FBFAEE]/50 uppercase tracking-wider mb-3 flex items-center">
                                <Lightbulb className="w-3.5 h-3.5 mr-1" />
                                Recommendations
                            </p>
                            <div className="space-y-2">
                                {result.recommendations.map((rec, idx) => (
                                    <div key={idx} className="flex items-start space-x-2 p-2 bg-purple-500/10 rounded-lg">
                                        <ArrowRight className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-[#FBFAEE]/80">{rec}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* New Simulation Button */}
                        <button
                            onClick={resetSimulator}
                            className="w-full py-2 text-center text-purple-400 hover:text-purple-300 text-sm transition"
                        >
                            Run Another Simulation
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

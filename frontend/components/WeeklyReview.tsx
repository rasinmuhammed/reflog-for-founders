'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Calendar, Trophy, TrendingUp, AlertTriangle, Target,
    ChevronRight, Loader2, Send, Brain, Sparkles, X
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface WeeklyReviewProps {
    userIdentifier: string
    onComplete?: () => void
}

interface ReviewData {
    wins: string[]
    metricsContext: string
    biggestBlocker: string
    whatAvoiding: string
    nextWeekFocus: string
}

export default function WeeklyReview({ userIdentifier, onComplete }: WeeklyReviewProps) {
    const [step, setStep] = useState(0)
    const [reviewData, setReviewData] = useState<ReviewData>({
        wins: [''],
        metricsContext: '',
        biggestBlocker: '',
        whatAvoiding: '',
        nextWeekFocus: ''
    })
    const [aiAnalysis, setAiAnalysis] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const steps = [
        { title: 'Wins', subtitle: 'What actually shipped/closed/launched?' },
        { title: 'Metrics', subtitle: 'MRR, users, runway - what changed and why?' },
        { title: 'Blockers', subtitle: 'What\'s actually stopping progress?' },
        { title: 'Avoidance', subtitle: 'The hard thing you keep postponing' },
        { title: 'Focus', subtitle: 'ONE thing that will move the needle' }
    ]

    const addWin = () => {
        if (reviewData.wins.length < 5) {
            setReviewData(prev => ({ ...prev, wins: [...prev.wins, ''] }))
        }
    }

    const removeWin = (index: number) => {
        if (reviewData.wins.length > 1) {
            setReviewData(prev => ({
                ...prev,
                wins: prev.wins.filter((_, i) => i !== index)
            }))
        }
    }

    const updateWin = (index: number, value: string) => {
        setReviewData(prev => ({
            ...prev,
            wins: prev.wins.map((w, i) => i === index ? value : w)
        }))
    }

    const handleSubmit = async () => {
        setSubmitting(true)
        try {
            const response = await axios.post(`${API_URL}/weekly-review/${encodeURIComponent(userIdentifier)}`, {
                wins: reviewData.wins.filter(w => w.trim()),
                key_metrics: { context: reviewData.metricsContext },
                biggest_blocker: reviewData.biggestBlocker,
                what_avoiding: reviewData.whatAvoiding,
                next_week_focus: reviewData.nextWeekFocus
            })
            setAiAnalysis(response.data.ai_analysis || 'Review submitted successfully.')
            setStep(5) // Show AI analysis
            if (onComplete) onComplete()
        } catch (error) {
            console.error('Failed to submit review:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const canProgress = () => {
        switch (step) {
            case 0: return reviewData.wins.some(w => w.trim().length > 0)
            case 1: return reviewData.metricsContext.trim().length > 0
            case 2: return reviewData.biggestBlocker.trim().length > 0
            case 3: return reviewData.whatAvoiding.trim().length > 0
            case 4: return reviewData.nextWeekFocus.trim().length > 0
            default: return false
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#242424] border border-[#242424]/50 rounded-2xl shadow-xl overflow-hidden"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#933DC9] to-[#53118F] p-6">
                <div className="flex items-center space-x-3">
                    <div className="bg-white/20 p-2 rounded-xl">
                        <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Weekly Strategic Review</h3>
                        <p className="text-sm text-white/70">Honest reflection. AI-powered insights.</p>
                    </div>
                </div>

                {/* Progress */}
                {step < 5 && (
                    <div className="mt-4 flex space-x-2">
                        {steps.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${idx < step ? 'bg-white' : idx === step ? 'bg-white/60' : 'bg-white/20'
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-6">
                <AnimatePresence mode="wait">
                    {step < 5 ? (
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="mb-6">
                                <h4 className="text-lg font-semibold text-[#FBFAEE] flex items-center">
                                    <span className="bg-[#933DC9]/20 text-[#C488F8] w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                                        {step + 1}
                                    </span>
                                    {steps[step].title}
                                </h4>
                                <p className="text-sm text-[#FBFAEE]/60 mt-1 ml-11">{steps[step].subtitle}</p>
                            </div>

                            {/* Step Content */}
                            {step === 0 && (
                                <div className="space-y-3">
                                    {reviewData.wins.map((win, idx) => (
                                        <div key={idx} className="flex items-center space-x-2">
                                            <Trophy className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                                            <input
                                                value={win}
                                                onChange={(e) => updateWin(idx, e.target.value)}
                                                placeholder="What did you actually ship/close/launch?"
                                                className="flex-1 bg-[#000000]/40 border border-[#242424]/60 text-[#FBFAEE] placeholder-[#FBFAEE]/30 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#933DC9]/50 focus:border-[#933DC9] transition outline-none"
                                            />
                                            {reviewData.wins.length > 1 && (
                                                <button onClick={() => removeWin(idx)} className="text-red-400/60 hover:text-red-400 transition">
                                                    <X className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {reviewData.wins.length < 5 && (
                                        <button
                                            onClick={addWin}
                                            className="text-sm text-[#C488F8] hover:text-[#933DC9] transition flex items-center space-x-1"
                                        >
                                            <span>+ Add another win</span>
                                        </button>
                                    )}
                                </div>
                            )}

                            {step === 1 && (
                                <textarea
                                    value={reviewData.metricsContext}
                                    onChange={(e) => setReviewData(prev => ({ ...prev, metricsContext: e.target.value }))}
                                    placeholder="e.g., MRR went from $2k to $2.5k because we closed 2 new customers. Churn increased because..."
                                    rows={4}
                                    className="w-full bg-[#000000]/40 border border-[#242424]/60 text-[#FBFAEE] placeholder-[#FBFAEE]/30 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#933DC9]/50 focus:border-[#933DC9] transition outline-none resize-none"
                                />
                            )}

                            {step === 2 && (
                                <textarea
                                    value={reviewData.biggestBlocker}
                                    onChange={(e) => setReviewData(prev => ({ ...prev, biggestBlocker: e.target.value }))}
                                    placeholder="Be specific. What is the #1 thing blocking your progress right now?"
                                    rows={4}
                                    className="w-full bg-[#000000]/40 border border-[#242424]/60 text-[#FBFAEE] placeholder-[#FBFAEE]/30 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#933DC9]/50 focus:border-[#933DC9] transition outline-none resize-none"
                                />
                            )}

                            {step === 3 && (
                                <div>
                                    <textarea
                                        value={reviewData.whatAvoiding}
                                        onChange={(e) => setReviewData(prev => ({ ...prev, whatAvoiding: e.target.value }))}
                                        placeholder="The hard conversation, the difficult task, the thing you keep saying 'tomorrow' to..."
                                        rows={4}
                                        className="w-full bg-[#000000]/40 border border-[#242424]/60 text-[#FBFAEE] placeholder-[#FBFAEE]/30 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#933DC9]/50 focus:border-[#933DC9] transition outline-none resize-none"
                                    />
                                    <p className="text-xs text-[#FBFAEE]/50 mt-2 flex items-center">
                                        <AlertTriangle className="w-3 h-3 mr-1 text-yellow-500" />
                                        This is the most important question. Be brutally honest.
                                    </p>
                                </div>
                            )}

                            {step === 4 && (
                                <div>
                                    <input
                                        value={reviewData.nextWeekFocus}
                                        onChange={(e) => setReviewData(prev => ({ ...prev, nextWeekFocus: e.target.value }))}
                                        placeholder="ONE thing. Not five. One."
                                        className="w-full bg-[#000000]/40 border border-[#242424]/60 text-[#FBFAEE] placeholder-[#FBFAEE]/30 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#933DC9]/50 focus:border-[#933DC9] transition outline-none text-lg font-medium"
                                    />
                                    <p className="text-xs text-[#FBFAEE]/50 mt-2 flex items-center">
                                        <Target className="w-3 h-3 mr-1 text-[#933DC9]" />
                                        This becomes your north star for the week.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        // AI Analysis
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center"
                        >
                            <div className="bg-gradient-to-br from-[#933DC9]/20 to-[#53118F]/20 rounded-2xl p-6 border border-[#933DC9]/30">
                                <div className="flex items-center justify-center space-x-2 mb-4">
                                    <Sparkles className="w-6 h-6 text-[#C488F8]" />
                                    <span className="text-lg font-semibold text-[#FBFAEE]">AI Analysis</span>
                                </div>
                                <p className="text-[#FBFAEE]/80 text-left whitespace-pre-line">{aiAnalysis}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation */}
                {step < 5 && (
                    <div className="flex justify-between mt-8">
                        <button
                            onClick={() => setStep(Math.max(0, step - 1))}
                            disabled={step === 0}
                            className="px-4 py-2 text-[#FBFAEE]/60 hover:text-[#FBFAEE] transition disabled:opacity-30"
                        >
                            Back
                        </button>

                        {step < 4 ? (
                            <button
                                onClick={() => setStep(step + 1)}
                                disabled={!canProgress()}
                                className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-[#933DC9] to-[#53118F] text-white rounded-xl font-semibold hover:brightness-110 transition disabled:opacity-40 shadow-lg shadow-purple-900/20"
                            >
                                <span>Continue</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={!canProgress() || submitting}
                                className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-[#933DC9] to-[#53118F] text-white rounded-xl font-semibold hover:brightness-110 transition disabled:opacity-40 shadow-lg shadow-purple-900/20"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Analyzing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Brain className="w-4 h-4" />
                                        <span>Get AI Insights</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    )
}

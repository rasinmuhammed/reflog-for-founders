'use client'

import { useState } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Calendar, Trophy, TrendingUp, AlertTriangle, Target,
    ChevronRight, Loader2, Brain, X
} from 'lucide-react'
import { useToast } from './ui/Toast'

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
    const [submitting, setSubmitting] = useState(false)
    const { showError, showSuccess } = useToast()

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
            setStep(5)
            showSuccess('Weekly review submitted!')
            if (onComplete) onComplete()
        } catch (error) {
            console.error('Failed to submit review:', error)
            showError('Failed to submit review. Please try again.')
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
            className="card overflow-hidden"
        >
            {/* Header */}
            <div
                className="p-6"
                style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div
                        className="p-2.5 rounded-lg"
                        style={{ background: 'var(--color-accent-muted)' }}
                    >
                        <Calendar className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                    </div>
                    <div>
                        <h3 className="section-title">Weekly Strategic Review</h3>
                        <p className="section-subtitle">
                            Honest reflection. AI-powered insights.
                        </p>
                    </div>
                </div>

                {/* Progress */}
                {step < 5 && (
                    <div className="flex gap-2">
                        {steps.map((_, idx) => (
                            <div
                                key={idx}
                                className="h-1.5 flex-1 rounded-full transition-all duration-300"
                                style={{
                                    background: idx < step
                                        ? 'var(--color-success)'
                                        : idx === step
                                            ? 'var(--color-accent)'
                                            : 'var(--color-border)'
                                }}
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
                                <h4 className="text-base font-semibold flex items-center">
                                    <span
                                        className="w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold mr-3"
                                        style={{
                                            background: 'var(--color-accent-muted)',
                                            color: 'var(--color-accent)',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    >
                                        {step + 1}
                                    </span>
                                    {steps[step].title}
                                </h4>
                                <p
                                    className="text-sm mt-1 ml-10"
                                    style={{ color: 'var(--color-text-muted)' }}
                                >
                                    {steps[step].subtitle}
                                </p>
                            </div>

                            {/* Step Content */}
                            {step === 0 && (
                                <div className="space-y-3">
                                    {reviewData.wins.map((win, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <Trophy
                                                className="w-5 h-5 flex-shrink-0"
                                                style={{ color: 'var(--color-warning)' }}
                                            />
                                            <input
                                                value={win}
                                                onChange={(e) => updateWin(idx, e.target.value)}
                                                placeholder="What did you actually ship/close/launch?"
                                                className="input"
                                            />
                                            {reviewData.wins.length > 1 && (
                                                <button
                                                    onClick={() => removeWin(idx)}
                                                    className="p-2 rounded-lg transition"
                                                    style={{ color: 'var(--color-error)' }}
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {reviewData.wins.length < 5 && (
                                        <button
                                            onClick={addWin}
                                            className="text-sm transition flex items-center gap-1 ml-7 hover:underline"
                                            style={{ color: 'var(--color-accent)' }}
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
                                    placeholder="e.g., MRR went from $2k to $2.5k, user churn decreased..."
                                    rows={4}
                                    className="input resize-none"
                                />
                            )}

                            {step === 2 && (
                                <textarea
                                    value={reviewData.biggestBlocker}
                                    onChange={(e) => setReviewData(prev => ({ ...prev, biggestBlocker: e.target.value }))}
                                    placeholder="Be specific. What is the #1 thing blocking your progress?"
                                    rows={4}
                                    className="input resize-none"
                                />
                            )}

                            {step === 3 && (
                                <div>
                                    <textarea
                                        value={reviewData.whatAvoiding}
                                        onChange={(e) => setReviewData(prev => ({ ...prev, whatAvoiding: e.target.value }))}
                                        placeholder="The hard conversation, the difficult task, what you keep postponing..."
                                        rows={4}
                                        className="input resize-none"
                                    />
                                    <p
                                        className="text-xs mt-2 flex items-center"
                                        style={{ color: 'var(--color-warning)' }}
                                    >
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        This is the most important question. Be honest.
                                    </p>
                                </div>
                            )}

                            {step === 4 && (
                                <div>
                                    <input
                                        value={reviewData.nextWeekFocus}
                                        onChange={(e) => setReviewData(prev => ({ ...prev, nextWeekFocus: e.target.value }))}
                                        placeholder="ONE thing. Not five. One."
                                        className="input text-lg"
                                    />
                                    <p
                                        className="text-xs mt-2 flex items-center"
                                        style={{ color: 'var(--color-accent)' }}
                                    >
                                        <Target className="w-3 h-3 mr-1" />
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
                        >
                            <div
                                className="rounded-xl p-6"
                                style={{
                                    background: 'var(--color-success-bg)',
                                    border: '1px solid var(--color-success)'
                                }}
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Brain className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                                    <span className="font-semibold">CoS Analysis</span>
                                </div>
                                <p
                                    className="text-sm whitespace-pre-line leading-relaxed"
                                    style={{ color: 'var(--color-text-secondary)' }}
                                >
                                    {aiAnalysis}
                                </p>
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
                            className="btn btn-ghost"
                        >
                            Back
                        </button>

                        {step < 4 ? (
                            <button
                                onClick={() => setStep(step + 1)}
                                disabled={!canProgress()}
                                className="btn btn-secondary"
                            >
                                <span>Continue</span>
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={!canProgress() || submitting}
                                className="btn btn-primary"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Analyzing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Brain className="w-4 h-4" />
                                        <span>Get CoS Insights</span>
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

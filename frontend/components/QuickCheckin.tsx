'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import {
    Rocket, Check, X, Loader2, Zap, Sparkles
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface QuickCheckinProps {
    userIdentifier: string
    onComplete?: () => void
    onClose?: () => void
}

interface TodayCommitment {
    id: number
    commitment: string
    timestamp: string
    shipped: boolean | null
}

export default function QuickCheckin({ userIdentifier, onComplete, onClose }: QuickCheckinProps) {
    const [commitment, setCommitment] = useState('')
    const [loading, setLoading] = useState(false)
    const [todayCommitment, setTodayCommitment] = useState<TodayCommitment | null>(null)
    const [mode, setMode] = useState<'check' | 'commit' | 'review'>('check')
    const [aiResponse, setAiResponse] = useState<string | null>(null)

    useEffect(() => {
        checkTodayStatus()
    }, [userIdentifier])

    const checkTodayStatus = async () => {
        try {
            const res = await axios.get(`${API_URL}/cos/quick-checkin/${encodeURIComponent(userIdentifier)}/today`)
            if (res.data.commitment) {
                setTodayCommitment(res.data)
                setMode(res.data.shipped === null ? 'review' : 'check')
            } else {
                setMode('commit')
            }
        } catch {
            setMode('commit')
        }
    }

    const handleCommit = async () => {
        if (!commitment.trim() || commitment.split(' ').length > 15) return
        setLoading(true)
        try {
            const res = await axios.post(`${API_URL}/cos/quick-checkin/${encodeURIComponent(userIdentifier)}`, {
                commitment: commitment.trim()
            })
            setAiResponse(res.data.ai_response || null)
            setTodayCommitment({
                id: res.data.id,
                commitment: commitment.trim(),
                timestamp: new Date().toISOString(),
                shipped: null
            })
            setMode('review')
            setTimeout(() => onComplete?.(), 2000)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleReview = async (shipped: boolean) => {
        if (!todayCommitment) return
        setLoading(true)
        try {
            const res = await axios.post(`${API_URL}/cos/quick-checkin/${encodeURIComponent(userIdentifier)}/review`, {
                shipped,
                excuse: shipped ? null : 'Not today'
            })
            setAiResponse(res.data.feedback || null)
            setTodayCommitment({ ...todayCommitment, shipped })
            setTimeout(() => {
                onComplete?.()
                onClose?.()
            }, 3000)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const wordCount = commitment.trim().split(/\s+/).filter(Boolean).length

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ background: 'rgba(1, 39, 49, 0.9)', backdropFilter: 'blur(5px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose?.()}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-lg card overflow-hidden"
            >
                {/* Header */}
                <div
                    className="p-5"
                    style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="p-2.5 rounded-lg"
                            style={{ background: 'var(--color-accent-muted)' }}
                        >
                            <Zap className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Daily Commitment</h2>
                            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                                {mode === 'commit' ? 'One thing. No excuses.' : 'Did you execute?'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <AnimatePresence mode="wait">
                        {/* Morning: Make commitment */}
                        {mode === 'commit' && (
                            <motion.div
                                key="commit"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-5"
                            >
                                <div>
                                    <label className="block text-sm font-medium mb-3">
                                        What's the <span style={{ color: 'var(--color-accent)' }}>ONE thing</span> you'll execute today?
                                    </label>
                                    <input
                                        type="text"
                                        value={commitment}
                                        onChange={(e) => setCommitment(e.target.value)}
                                        placeholder="e.g., Launch landing page"
                                        className="input py-4 text-base"
                                        maxLength={100}
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleCommit()}
                                    />
                                    <div
                                        className="flex justify-between mt-2 text-xs"
                                        style={{ color: 'var(--color-text-muted)' }}
                                    >
                                        <span>{wordCount}/10 words recommended</span>
                                        <span style={{ color: wordCount > 10 ? 'var(--color-warning)' : 'inherit' }}>
                                            Keep it focused
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCommit}
                                    disabled={!commitment.trim() || loading}
                                    className="btn btn-primary w-full py-4 text-base"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Rocket className="w-5 h-5" />
                                            Commit to it
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        )}

                        {/* Evening: Review commitment */}
                        {mode === 'review' && todayCommitment && todayCommitment.shipped === null && (
                            <motion.div
                                key="review"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                <div
                                    className="p-5 rounded-lg"
                                    style={{
                                        background: 'var(--color-bg-shell)',
                                        border: '1px solid var(--color-border)'
                                    }}
                                >
                                    <p
                                        className="text-xs uppercase tracking-wide mb-2"
                                        style={{ color: 'var(--color-text-muted)' }}
                                    >
                                        Today's commitment
                                    </p>
                                    <p className="text-lg font-medium">
                                        "{todayCommitment.commitment}"
                                    </p>
                                </div>

                                <p
                                    className="text-center font-medium"
                                    style={{ color: 'var(--color-text-secondary)' }}
                                >
                                    Did you execute?
                                </p>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleReview(true)}
                                        disabled={loading}
                                        className="btn"
                                        style={{
                                            background: 'var(--color-success-bg)',
                                            border: '1px solid var(--color-success)',
                                            color: 'var(--color-success)'
                                        }}
                                    >
                                        <Check className="w-5 h-5" />
                                        Yes, done
                                    </button>
                                    <button
                                        onClick={() => handleReview(false)}
                                        disabled={loading}
                                        className="btn"
                                        style={{
                                            background: 'var(--color-error-bg)',
                                            border: '1px solid var(--color-error)',
                                            color: 'var(--color-error)'
                                        }}
                                    >
                                        <X className="w-5 h-5" />
                                        Not today
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Done state */}
                        {todayCommitment && todayCommitment.shipped !== null && (
                            <motion.div
                                key="done"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8"
                            >
                                <div
                                    className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4"
                                    style={{
                                        background: todayCommitment.shipped
                                            ? 'var(--color-success-bg)'
                                            : 'var(--color-error-bg)',
                                        border: `1px solid ${todayCommitment.shipped
                                            ? 'var(--color-success)'
                                            : 'var(--color-error)'}`
                                    }}
                                >
                                    {todayCommitment.shipped ? (
                                        <Check className="w-7 h-7" style={{ color: 'var(--color-success)' }} />
                                    ) : (
                                        <X className="w-7 h-7" style={{ color: 'var(--color-error)' }} />
                                    )}
                                </div>
                                <p className="text-base font-medium mb-2">
                                    {todayCommitment.shipped ? 'Executed.' : 'Tomorrow.'}
                                </p>
                                {aiResponse && (
                                    <p
                                        className="text-sm max-w-sm mx-auto"
                                        style={{ color: 'var(--color-text-muted)' }}
                                    >
                                        {aiResponse}
                                    </p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div
                    className="px-6 py-4 flex items-center justify-between text-xs"
                    style={{
                        borderTop: '1px solid var(--color-border-subtle)',
                        color: 'var(--color-text-muted)'
                    }}
                >
                    <div className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Reflog</span>
                    </div>
                    <button onClick={onClose} className="hover:opacity-80 transition">
                        Close
                    </button>
                </div>
            </motion.div>
        </motion.div>
    )
}

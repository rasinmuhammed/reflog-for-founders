'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import {
    Rocket, Check, X, Loader2, Zap,
    ArrowRight, Sparkles, Clock
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
            const res = await axios.get(`${API_URL}/quick-checkin/${encodeURIComponent(userIdentifier)}/today`)
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
            const res = await axios.post(`${API_URL}/quick-checkin/${encodeURIComponent(userIdentifier)}`, {
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
            const res = await axios.post(`${API_URL}/quick-checkin/${encodeURIComponent(userIdentifier)}/review`, {
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && onClose?.()}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-lg bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-[#252525] rounded-3xl overflow-hidden shadow-2xl"
            >
                {/* Header */}
                <div className="p-6 border-b border-[#252525] bg-gradient-to-r from-[#933DC9]/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-[#933DC9] to-[#53118F] rounded-xl">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Reality Check</h2>
                            <p className="text-sm text-[#FBFAEE]/50">
                                {mode === 'commit' ? 'One thing. No excuses.' : 'Did you ship it?'}
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
                                    <label className="block text-sm font-medium text-[#FBFAEE]/80 mb-3">
                                        What's the <span className="text-[#C488F8]">ONE thing</span> you'll ship today?
                                    </label>
                                    <input
                                        type="text"
                                        value={commitment}
                                        onChange={(e) => setCommitment(e.target.value)}
                                        placeholder="e.g., Launch landing page"
                                        className="w-full px-5 py-4 bg-[#0a0a0a] border border-[#333] rounded-2xl text-white text-lg placeholder-[#555] focus:ring-2 focus:ring-[#933DC9] focus:border-[#933DC9] transition"
                                        maxLength={100}
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleCommit()}
                                    />
                                    <div className="flex justify-between mt-2 text-xs text-[#FBFAEE]/40">
                                        <span>{wordCount}/10 words recommended</span>
                                        <span className={wordCount > 10 ? 'text-yellow-400' : ''}>
                                            Keep it focused
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCommit}
                                    disabled={!commitment.trim() || loading}
                                    className="w-full py-4 bg-gradient-to-r from-[#933DC9] to-[#53118F] text-white rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:brightness-110 transition shadow-lg shadow-purple-900/30"
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
                                <div className="p-5 bg-[#0a0a0a] border border-[#333] rounded-2xl">
                                    <p className="text-xs text-[#FBFAEE]/50 uppercase tracking-wide mb-2">
                                        Today's commitment
                                    </p>
                                    <p className="text-xl text-white font-medium">
                                        "{todayCommitment.commitment}"
                                    </p>
                                </div>

                                <p className="text-center text-[#FBFAEE]/80 font-medium">
                                    Did you ship it?
                                </p>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleReview(true)}
                                        disabled={loading}
                                        className="py-4 bg-green-600/20 border border-green-500/40 text-green-400 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-green-600/30 transition"
                                    >
                                        <Check className="w-5 h-5" />
                                        Yes, shipped!
                                    </button>
                                    <button
                                        onClick={() => handleReview(false)}
                                        disabled={loading}
                                        className="py-4 bg-red-600/20 border border-red-500/40 text-red-400 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-red-600/30 transition"
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
                                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${todayCommitment.shipped
                                    ? 'bg-green-500/20 border-2 border-green-500'
                                    : 'bg-red-500/20 border-2 border-red-500'
                                    }`}>
                                    {todayCommitment.shipped ? (
                                        <Check className="w-8 h-8 text-green-400" />
                                    ) : (
                                        <X className="w-8 h-8 text-red-400" />
                                    )}
                                </div>
                                <p className="text-lg font-semibold text-white mb-2">
                                    {todayCommitment.shipped ? 'Great work!' : 'Tomorrow is another day.'}
                                </p>
                                {aiResponse && (
                                    <p className="text-sm text-[#FBFAEE]/70 max-w-sm mx-auto">
                                        {aiResponse}
                                    </p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#252525] flex items-center justify-between text-xs text-[#FBFAEE]/40">
                    <div className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#C488F8]" />
                        <span>Powered by Reflog AI</span>
                    </div>
                    <button onClick={onClose} className="hover:text-white transition">
                        Close
                    </button>
                </div>
            </motion.div>
        </motion.div>
    )
}

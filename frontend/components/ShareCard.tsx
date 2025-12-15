'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
    Share2, Download, Copy, Check, Twitter,
    Linkedin, Sparkles, TrendingUp, Flame, Trophy
} from 'lucide-react'
import html2canvas from 'html2canvas'

interface ShareCardProps {
    type: 'weekly' | 'streak' | 'progress' | 'insight'
    data: {
        title?: string
        subtitle?: string
        primaryStat?: string
        primaryLabel?: string
        secondaryStat?: string
        secondaryLabel?: string
        insight?: string
        streak?: number
        shipRate?: number
        improvement?: number
        userName?: string
    }
    onClose?: () => void
}

export default function ShareCard({ type, data, onClose }: ShareCardProps) {
    const [copied, setCopied] = useState(false)
    const [downloading, setDownloading] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null)

    const handleDownload = async () => {
        if (!cardRef.current) return
        setDownloading(true)
        try {
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: '#0a0a0a',
                scale: 2
            })
            const link = document.createElement('a')
            link.download = `reflog-${type}-${Date.now()}.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
        } catch (err) {
            console.error('Download failed:', err)
        } finally {
            setDownloading(false)
        }
    }

    const handleCopyLink = async () => {
        // In production, this would generate a shareable URL
        const shareText = `${data.title} - ${data.primaryStat} ${data.primaryLabel}`
        await navigator.clipboard.writeText(shareText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleTwitterShare = () => {
        const text = `${data.insight || data.title} 🚀\n\nTracking my founder journey with @ReflogApp`
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
    }

    const handleLinkedInShare = () => {
        const text = `${data.insight || data.title}`
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}`, '_blank')
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && onClose?.()}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="max-w-md w-full"
            >
                {/* Shareable Card */}
                <div
                    ref={cardRef}
                    className="bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#0f0f0f] border border-[#252525] rounded-3xl overflow-hidden p-8"
                >
                    {/* Reflog Branding */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#933DC9] to-[#53118F] flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-white tracking-tight">Reflog</span>
                        </div>
                        <span className="text-xs text-[#FBFAEE]/40">reflog.app</span>
                    </div>

                    {/* Card Content by Type */}
                    {type === 'streak' && (
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 flex items-center justify-center">
                                <Flame className="w-10 h-10 text-orange-400" />
                            </div>
                            <div>
                                <div className="text-5xl font-black text-white">{data.streak}</div>
                                <p className="text-[#FBFAEE]/60 mt-1">Day Streak</p>
                            </div>
                            <p className="text-sm text-[#FBFAEE]/50">
                                {data.streak && data.streak >= 7
                                    ? "Consistency is building 🔥"
                                    : "Every day counts"}
                            </p>
                        </div>
                    )}

                    {type === 'progress' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-center gap-4">
                                <div className="text-center">
                                    <p className="text-xs text-[#FBFAEE]/50 mb-1">4 weeks ago</p>
                                    <div className="text-3xl font-bold text-[#FBFAEE]/60">
                                        {data.secondaryStat || '--'}%
                                    </div>
                                </div>
                                <TrendingUp className={`w-8 h-8 ${data.improvement && data.improvement > 0 ? 'text-green-400' : 'text-red-400'}`} />
                                <div className="text-center">
                                    <p className="text-xs text-[#FBFAEE]/50 mb-1">Now</p>
                                    <div className="text-3xl font-bold text-white">
                                        {data.primaryStat || '--'}%
                                    </div>
                                </div>
                            </div>
                            <div className="text-center">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${data.improvement && data.improvement > 0
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {data.improvement && data.improvement > 0 ? '+' : ''}{data.improvement || 0}% Ship Rate
                                </span>
                            </div>
                            {data.insight && (
                                <p className="text-sm text-center text-[#FBFAEE]/70">{data.insight}</p>
                            )}
                        </div>
                    )}

                    {type === 'weekly' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <Trophy className="w-12 h-12 text-[#C488F8] mx-auto mb-3" />
                                <h3 className="text-xl font-bold text-white mb-1">Weekly Summary</h3>
                                <p className="text-[#FBFAEE]/60">{data.subtitle}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#0a0a0a] rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-white">{data.primaryStat}</div>
                                    <p className="text-xs text-[#FBFAEE]/50">{data.primaryLabel}</p>
                                </div>
                                <div className="bg-[#0a0a0a] rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-[#C488F8]">{data.secondaryStat}%</div>
                                    <p className="text-xs text-[#FBFAEE]/50">{data.secondaryLabel}</p>
                                </div>
                            </div>
                            {data.insight && (
                                <p className="text-sm text-center text-[#FBFAEE]/70 italic">"{data.insight}"</p>
                            )}
                        </div>
                    )}

                    {type === 'insight' && (
                        <div className="space-y-6">
                            <div className="p-6 bg-gradient-to-br from-[#933DC9]/10 to-transparent border border-[#933DC9]/20 rounded-2xl">
                                <p className="text-lg text-white font-medium leading-relaxed">
                                    "{data.insight}"
                                </p>
                            </div>
                            {data.userName && (
                                <p className="text-sm text-center text-[#FBFAEE]/50">
                                    Insight for {data.userName}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-8 pt-4 border-t border-[#252525] flex items-center justify-center">
                        <p className="text-xs text-[#FBFAEE]/30">
                            Your AI accountability partner for founders
                        </p>
                    </div>
                </div>

                {/* Share Actions */}
                <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] border border-[#333] rounded-xl text-white text-sm hover:bg-[#252525] transition"
                    >
                        <Download className="w-4 h-4" />
                        {downloading ? 'Saving...' : 'Save Image'}
                    </button>
                    <button
                        onClick={handleCopyLink}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] border border-[#333] rounded-xl text-white text-sm hover:bg-[#252525] transition"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                        onClick={handleTwitterShare}
                        className="p-2.5 bg-[#1a1a1a] border border-[#333] rounded-xl text-white hover:bg-[#252525] transition"
                    >
                        <Twitter className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleLinkedInShare}
                        className="p-2.5 bg-[#1a1a1a] border border-[#333] rounded-xl text-white hover:bg-[#252525] transition"
                    >
                        <Linkedin className="w-4 h-4" />
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="mt-4 w-full py-2 text-center text-sm text-[#FBFAEE]/50 hover:text-white transition"
                >
                    Close
                </button>
            </motion.div>
        </motion.div>
    )
}

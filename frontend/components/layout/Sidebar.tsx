"use client"

import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { useClerk, useUser, UserButton } from "@clerk/nextjs"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import {
    LayoutDashboard, Flame, Trophy, TrendingUp,
    Sparkles, ChevronRight
} from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function Sidebar() {
    const pathname = usePathname()
    const { user } = useUser()
    const email = user?.primaryEmailAddress?.emailAddress

    const { data: stats } = useQuery({
        queryKey: ['gamification', email],
        queryFn: async () => {
            if (!email) return null
            const res = await axios.get(`${API_URL}/gamification/stats/${email}`)
            return res.data
        },
        enabled: !!email,
        staleTime: 30000
    })

    const xpProgress = stats ? (stats.xp / stats.next_level_xp) * 100 : 0

    return (
        <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-72 bg-gradient-to-b from-[#0a0a0a] to-[#000000] border-r border-[#1a1a1a] p-6 flex flex-col h-screen sticky top-0"
        >
            {/* Logo */}
            <div className="mb-8">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#933DC9] to-[#53118F] flex items-center justify-center shadow-lg shadow-purple-900/30">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div className="absolute -inset-1 bg-gradient-to-br from-[#933DC9] to-[#53118F] rounded-xl blur-lg opacity-30 -z-10" />
                    </div>
                    <div>
                        <span className="text-xl font-bold text-white tracking-tight">Reflog</span>
                        <p className="text-[10px] text-[#FBFAEE]/40 uppercase tracking-widest">Founder OS</p>
                    </div>
                </div>
            </div>

            {/* User Card */}
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#252525]">
                <div className="flex items-center gap-3 mb-4">
                    <UserButton
                        afterSignOutUrl="/"
                        appearance={{
                            elements: {
                                avatarBox: "w-11 h-11 ring-2 ring-[#933DC9]/40 ring-offset-2 ring-offset-[#0a0a0a]"
                            }
                        }}
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                            {user?.firstName || 'Founder'}
                        </p>
                        <p className="text-xs text-[#FBFAEE]/50 truncate">
                            {email}
                        </p>
                    </div>
                </div>

                {/* Level Progress */}
                {stats && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Trophy className="w-3.5 h-3.5 text-[#C488F8]" />
                                <span className="text-xs font-medium text-[#FBFAEE]/70">Level {stats.level}</span>
                            </div>
                            <span className="text-xs text-[#FBFAEE]/40">{stats.xp}/{stats.next_level_xp} XP</span>
                        </div>
                        <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${xpProgress}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-[#933DC9] to-[#C488F8] rounded-full"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Stats Row */}
            {stats && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-[#1a1a1a]/50 border border-[#252525]/50">
                        <div className="flex items-center gap-2 mb-1">
                            <Flame className="w-4 h-4 text-orange-400" />
                            <span className="text-lg font-bold text-white">{stats.current_streak}</span>
                        </div>
                        <p className="text-[10px] text-[#FBFAEE]/40 uppercase tracking-wide">Day Streak</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#1a1a1a]/50 border border-[#252525]/50">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-green-400" />
                            <span className="text-lg font-bold text-white">{stats.total_checkins}</span>
                        </div>
                        <p className="text-[10px] text-[#FBFAEE]/40 uppercase tracking-wide">Check-ins</p>
                    </div>
                </div>
            )}

            {/* Main Navigation - Single Dashboard Link */}
            <nav className="flex-1">
                <div className="mb-2">
                    <p className="text-[10px] text-[#FBFAEE]/30 uppercase tracking-widest font-medium px-3 mb-2">
                        Navigation
                    </p>
                </div>
                <motion.div
                    whileHover={{ x: 2 }}
                    className="relative"
                >
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[#933DC9]/15 to-[#933DC9]/5 border border-[#933DC9]/20 text-white cursor-default">
                        <div className="p-1.5 rounded-lg bg-[#933DC9]/20">
                            <LayoutDashboard className="w-4 h-4 text-[#C488F8]" />
                        </div>
                        <span className="font-medium text-sm">Dashboard</span>
                        <ChevronRight className="w-4 h-4 ml-auto text-[#C488F8]/60" />
                    </div>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-[#933DC9] to-[#C488F8] rounded-r-full" />
                </motion.div>
            </nav>

            {/* Footer */}
            <div className="pt-4 border-t border-[#1a1a1a]">
                <div className="flex items-center justify-between text-[10px] text-[#FBFAEE]/30">
                    <span>© 2024 Reflog</span>
                    <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        Online
                    </span>
                </div>
            </div>
        </motion.aside>
    )
}

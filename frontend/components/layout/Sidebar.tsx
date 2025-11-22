"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Target, Zap, Settings, LogOut } from "lucide-react"

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Strategy", href: "/strategy", icon: Target },
    { name: "Execution", href: "/execution", icon: Zap },
    { name: "Settings", href: "/settings", icon: Settings },
]

import { useUser } from "@clerk/nextjs"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"

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
        enabled: !!email
    })

    return (
        <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-64 border-r border-white/5 bg-reflog-void/90 backdrop-blur-xl p-6 flex flex-col z-50 flex-shrink-0"
        >
            {/* Logo */}
            <div className="mb-8 flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-gradient-to-br from-reflog-amber to-reflog-rose animate-pulse-slow" />
                <span className="text-xl font-bold tracking-tighter text-white">REFLOG</span>
            </div>

            {/* Founder Level */}
            {stats && (
                <div className="mb-8 bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-xs text-reflog-muted uppercase tracking-wider font-semibold">Founder Level</span>
                        <span className="text-xl font-bold text-reflog-amber">{stats.level}</span>
                    </div>
                    <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(stats.xp / stats.next_level_xp) * 100}%` }}
                            className="h-full bg-gradient-to-r from-reflog-amber to-reflog-rose"
                        />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-reflog-muted">
                        <span>{stats.xp} XP</span>
                        <span>{stats.next_level_xp} XP</span>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-reflog-amber/10 text-reflog-amber shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                                    : "text-reflog-muted hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="border-t border-white/5 pt-6">
                <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-reflog-muted transition-colors hover:bg-reflog-rose/10 hover:text-reflog-rose">
                    <LogOut className="h-5 w-5" />
                    Sign Out
                </button>
            </div>
        </motion.aside>
    )
}

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { UserButton, useUser } from '@clerk/nextjs'
import { Sparkles, Target, Brain, MessageSquare, Calendar, BarChart3, Settings as SettingsIcon } from 'lucide-react'

interface DashboardLayoutProps {
    children: React.ReactNode
    activeView: string
    onViewChange: (view: string) => void
    onSettingsClick: () => void
}

const navItems = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'brief', label: 'Brief', icon: Sparkles },
    { id: 'simulator', label: 'Simulator', icon: Target },
    { id: 'meetings', label: 'Meetings', icon: Calendar },
    { id: 'actions', label: 'Actions', icon: BarChart3 },
    { id: 'chat', label: 'Ask Reflog', icon: MessageSquare },
    { id: 'review', label: 'Review', icon: Brain },
]

export default function DashboardLayout({
    children,
    activeView,
    onViewChange,
    onSettingsClick
}: DashboardLayoutProps) {
    const { user } = useUser()

    return (
        <div
            className="flex min-h-screen"
            style={{ background: 'var(--color-bg-shell)' }}
        >
            {/* Sidebar */}
            <motion.aside
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-64 flex flex-col h-screen sticky top-0"
                style={{
                    background: 'var(--color-bg-shell)',
                    borderRight: '1px solid var(--color-border)'
                }}
            >
                {/* Logo */}
                <div className="p-6">
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo.png"
                            alt="Reflog"
                            className="w-10 h-10 object-contain"
                        />
                        <div>
                            <span
                                className="text-lg font-bold"
                                style={{ color: 'var(--color-text-primary)' }}
                            >
                                Reflog
                            </span>
                            <p
                                className="text-[10px] uppercase tracking-widest"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                Executive OS
                            </p>
                        </div>
                    </div>
                </div>

                {/* User Info */}
                <div
                    className="mx-4 p-4 rounded-xl mb-6"
                    style={{
                        background: 'var(--color-bg-elevated)',
                        border: '1px solid var(--color-border)'
                    }}
                >
                    <div className="flex items-center gap-3">
                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    avatarBox: "w-10 h-10 ring-2 ring-offset-2",
                                }
                            }}
                        />
                        <div className="flex-1 min-w-0">
                            <p
                                className="text-sm font-medium truncate"
                                style={{ color: 'var(--color-text-primary)' }}
                            >
                                {user?.firstName || 'Founder'}
                            </p>
                            <p
                                className="text-xs truncate"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                {user?.primaryEmailAddress?.emailAddress}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-1">
                    <p
                        className="text-[10px] uppercase tracking-widest font-medium px-3 mb-2"
                        style={{ color: 'var(--color-text-subtle)' }}
                    >
                        Navigation
                    </p>
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = activeView === item.id
                        return (
                            <motion.button
                                key={item.id}
                                whileHover={{ x: 2 }}
                                onClick={() => onViewChange(item.id)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left"
                                style={{
                                    background: isActive ? 'var(--color-accent-muted)' : 'transparent',
                                    color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                                    border: isActive ? '1px solid var(--color-border)' : '1px solid transparent'
                                }}
                            >
                                <Icon className="w-4 h-4" style={{ color: isActive ? 'var(--color-accent)' : 'inherit' }} />
                                <span className="text-sm font-medium">{item.label}</span>
                            </motion.button>
                        )
                    })}
                </nav>

                {/* Settings Button */}
                <div className="p-4 mt-auto">
                    <button
                        onClick={onSettingsClick}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
                        style={{
                            color: 'var(--color-text-muted)',
                            border: '1px solid var(--color-border-subtle)'
                        }}
                    >
                        <SettingsIcon className="w-4 h-4" />
                        <span className="text-sm">Settings</span>
                    </button>
                </div>

                {/* Footer */}
                <div
                    className="p-4"
                    style={{ borderTop: '1px solid var(--color-border-subtle)' }}
                >
                    <div
                        className="flex items-center justify-between text-[10px]"
                        style={{ color: 'var(--color-text-subtle)' }}
                    >
                        <span>© 2024 Reflog</span>
                        <span className="flex items-center gap-1">
                            <span
                                className="w-1.5 h-1.5 rounded-full animate-pulse"
                                style={{ background: 'var(--color-success)' }}
                            />
                            Online
                        </span>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8 max-w-[1400px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Zap, Target, Brain, MessageSquare, History, Command } from 'lucide-react'

interface CommandPaletteProps {
    isOpen: boolean
    onClose: () => void
    onNavigate: (tab: string) => void
    onQuickCheckin: () => void
}

export default function CommandPalette({ isOpen, onClose, onNavigate, onQuickCheckin }: CommandPaletteProps) {
    const [query, setQuery] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    const commands = [
        { id: 'checkin', label: 'Quick Check-in', icon: Target, action: onQuickCheckin, shortcut: '⌘K' },
        { id: 'command', label: 'Go to Command Center', icon: Zap, action: () => onNavigate('command') },
        { id: 'overview', label: 'Go to Overview', icon: Target, action: () => onNavigate('overview') },
        { id: 'chat', label: 'Go to Chat', icon: MessageSquare, action: () => onNavigate('chat') },
        { id: 'decisions', label: 'Go to Decisions', icon: Brain, action: () => onNavigate('decisions') },
        { id: 'history', label: 'Go to History', icon: History, action: () => onNavigate('history') },
    ]

    const filteredCommands = commands.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase())
    )

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    const handleSelect = (command: typeof commands[0]) => {
        command.action()
        onClose()
        setQuery('')
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4"
                style={{ background: 'rgba(0, 0, 0, 0.8)' }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-2xl rounded-2xl overflow-hidden"
                    style={{
                        background: 'var(--color-background-elevated)',
                        border: '1px solid var(--color-border)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}
                >
                    {/* Search Input */}
                    <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                        <Search className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Type a command or search..."
                            className="flex-1 bg-transparent outline-none text-lg"
                            style={{ color: 'var(--color-text-primary)' }}
                        />
                        <div
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                            style={{
                                background: 'var(--color-background)',
                                color: 'var(--color-text-muted)'
                            }}
                        >
                            <Command className="w-3 h-3" />
                            <span>/</span>
                        </div>
                    </div>

                    {/* Commands List */}
                    <div className="max-h-96 overflow-y-auto">
                        {filteredCommands.length === 0 ? (
                            <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
                                No commands found
                            </div>
                        ) : (
                            filteredCommands.map((command, index) => {
                                const Icon = command.icon
                                return (
                                    <button
                                        key={command.id}
                                        onClick={() => handleSelect(command)}
                                        className="w-full flex items-center gap-3 p-4 hover:bg-[var(--color-background-hover)] transition-colors"
                                        style={{
                                            borderBottom: index < filteredCommands.length - 1 ? '1px solid var(--color-border-subtle)' : 'none'
                                        }}
                                    >
                                        <div
                                            className="p-2 rounded-lg"
                                            style={{ background: 'var(--color-accent-primary-bg)' }}
                                        >
                                            <Icon className="w-4 h-4" style={{ color: 'var(--color-accent-primary)' }} />
                                        </div>
                                        <span className="flex-1 text-left" style={{ color: 'var(--color-text-primary)' }}>
                                            {command.label}
                                        </span>
                                        {command.shortcut && (
                                            <span
                                                className="text-xs px-2 py-1 rounded"
                                                style={{
                                                    background: 'var(--color-background)',
                                                    color: 'var(--color-text-muted)'
                                                }}
                                            >
                                                {command.shortcut}
                                            </span>
                                        )}
                                    </button>
                                )
                            })
                        )}
                    </div>

                    {/* Footer Hint */}
                    <div
                        className="px-4 py-2 text-xs flex items-center justify-between border-t"
                        style={{
                            background: 'var(--color-background)',
                            borderColor: 'var(--color-border-subtle)',
                            color: 'var(--color-text-muted)'
                        }}
                    >
                        <span>Press ↑↓ to navigate</span>
                        <span>↵ to select</span>
                        <span>esc to close</span>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

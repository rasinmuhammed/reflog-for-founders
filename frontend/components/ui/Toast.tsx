'use client'

import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle, XCircle, X, AlertTriangle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
    id: string
    message: string
    type: ToastType
    duration?: number
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void
    showError: (message: string) => void
    showSuccess: (message: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
        const id = Math.random().toString(36).substr(2, 9)
        setToasts(prev => [...prev, { id, message, type, duration }])

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id))
            }, duration)
        }
    }, [])

    const showError = useCallback((message: string) => {
        showToast(message, 'error', 5000)
    }, [showToast])

    const showSuccess = useCallback((message: string) => {
        showToast(message, 'success', 3000)
    }, [showToast])

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />
            case 'error': return <XCircle className="w-5 h-5 text-red-400" />
            case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />
            default: return <AlertCircle className="w-5 h-5 text-blue-400" />
        }
    }

    const getStyles = (type: ToastType) => {
        switch (type) {
            case 'success': return 'bg-green-900/90 border-green-500/40'
            case 'error': return 'bg-red-900/90 border-red-500/40'
            case 'warning': return 'bg-yellow-900/90 border-yellow-500/40'
            default: return 'bg-blue-900/90 border-blue-500/40'
        }
    }

    return (
        <ToastContext.Provider value={{ showToast, showError, showSuccess }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-24 right-8 z-[100] space-y-2 max-w-sm">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100 }}
                            className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-lg ${getStyles(toast.type)}`}
                        >
                            {getIcon(toast.type)}
                            <p className="text-sm text-white flex-1">{toast.message}</p>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="text-white/50 hover:text-white transition p-0.5"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    )
}

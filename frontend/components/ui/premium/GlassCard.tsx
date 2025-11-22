"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface GlassCardProps {
    children: ReactNode
    className?: string
    hoverEffect?: boolean
}

export function GlassCard({ children, className, hoverEffect = true }: GlassCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={cn(
                "relative overflow-hidden rounded-xl border border-white/10 bg-reflog-raisin/40 backdrop-blur-xl",
                "shadow-[0_0_15px_rgba(0,0,0,0.5)]",
                hoverEffect && "transition-all duration-300 hover:border-reflog-amber/30 hover:shadow-[0_0_25px_rgba(245,158,11,0.1)]",
                className
            )}
        >
            {/* Noise Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/noise.png')] mix-blend-overlay" />

            {/* Content */}
            <div className="relative z-10 p-6">
                {children}
            </div>
        </motion.div>
    )
}

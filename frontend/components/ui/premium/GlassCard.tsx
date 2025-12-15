"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface GlassCardProps {
    children: ReactNode
    className?: string
    hoverEffect?: boolean
    variant?: "default" | "purple" | "success" | "warning" | "danger"
    glow?: boolean
}

export function GlassCard({
    children,
    className,
    hoverEffect = true,
    variant = "default",
    glow = false
}: GlassCardProps) {
    const variants = {
        default: "border-white/10 hover:border-[#933DC9]/30",
        purple: "border-[#933DC9]/30 bg-[#933DC9]/5",
        success: "border-green-500/30 bg-green-500/5",
        warning: "border-yellow-500/30 bg-yellow-500/5",
        danger: "border-red-500/30 bg-red-500/5"
    }

    const glowStyles = {
        default: "hover:shadow-[0_0_30px_rgba(147,61,201,0.15)]",
        purple: "shadow-[0_0_25px_rgba(147,61,201,0.1)] hover:shadow-[0_0_40px_rgba(147,61,201,0.2)]",
        success: "shadow-[0_0_25px_rgba(34,197,94,0.1)] hover:shadow-[0_0_40px_rgba(34,197,94,0.2)]",
        warning: "shadow-[0_0_25px_rgba(234,179,8,0.1)] hover:shadow-[0_0_40px_rgba(234,179,8,0.2)]",
        danger: "shadow-[0_0_25px_rgba(239,68,68,0.1)] hover:shadow-[0_0_40px_rgba(239,68,68,0.2)]"
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn(
                "relative overflow-hidden rounded-2xl border bg-[#242424]/80 backdrop-blur-xl",
                variants[variant],
                hoverEffect && "transition-all duration-300",
                glow && glowStyles[variant],
                className
            )}
        >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

            {/* Noise Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[url('/noise.png')] mix-blend-overlay" />

            {/* Accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#933DC9]/30 to-transparent" />

            {/* Content */}
            <div className="relative z-10 p-6">
                {children}
            </div>
        </motion.div>
    )
}

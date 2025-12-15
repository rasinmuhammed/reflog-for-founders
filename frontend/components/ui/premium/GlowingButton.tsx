"use client"

import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface GlowingButtonProps extends HTMLMotionProps<"button"> {
    children: ReactNode
    variant?: "primary" | "danger" | "success" | "ghost" | "premium"
    size?: "sm" | "md" | "lg"
    className?: string
}

export function GlowingButton({
    children,
    variant = "primary",
    size = "md",
    className,
    ...props
}: GlowingButtonProps) {
    const variants = {
        primary: "bg-gradient-to-r from-[#933DC9] to-[#53118F] text-white shadow-[0_0_20px_rgba(147,61,201,0.4)] hover:shadow-[0_0_35px_rgba(147,61,201,0.6)]",
        danger: "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_35px_rgba(239,68,68,0.6)]",
        success: "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_35px_rgba(34,197,94,0.6)]",
        ghost: "bg-transparent border border-white/10 text-[#FBFAEE] hover:bg-white/5 hover:border-[#933DC9]/30",
        premium: "bg-gradient-to-r from-[#C488F8] via-[#933DC9] to-[#53118F] text-white shadow-[0_0_25px_rgba(196,136,248,0.5)] hover:shadow-[0_0_40px_rgba(196,136,248,0.7)]",
    }

    const sizes = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3",
        lg: "px-8 py-4 text-lg"
    }

    return (
        <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={cn(
                "relative rounded-xl font-semibold transition-all duration-300",
                "flex items-center justify-center gap-2",
                "overflow-hidden",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {/* Shimmer effect for premium variant */}
            {variant === "premium" && (
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
            )}
            <span className="relative z-10 flex items-center gap-2">{children}</span>
        </motion.button>
    )
}

"use client"

import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface GlowingButtonProps extends HTMLMotionProps<"button"> {
    children: ReactNode
    variant?: "primary" | "danger" | "success" | "ghost"
    className?: string
}

export function GlowingButton({ children, variant = "primary", className, ...props }: GlowingButtonProps) {
    const variants = {
        primary: "bg-reflog-amber text-black shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:shadow-[0_0_25px_rgba(245,158,11,0.6)]",
        danger: "bg-reflog-rose text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] hover:shadow-[0_0_25px_rgba(244,63,94,0.6)]",
        success: "bg-reflog-emerald text-black shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)]",
        ghost: "bg-transparent border border-white/10 text-reflog-white hover:bg-white/5",
    }

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "relative px-6 py-3 rounded-lg font-semibold transition-all duration-300",
                "flex items-center justify-center gap-2",
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </motion.button>
    )
}

"use client"

import { cn } from "@/lib/utils"
import { InputHTMLAttributes, forwardRef } from "react"

interface CyberInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
}

export const CyberInput = forwardRef<HTMLInputElement, CyberInputProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="space-y-2">
                {label && (
                    <label className="text-sm font-medium text-reflog-muted uppercase tracking-wider">
                        {label}
                    </label>
                )}
                <div className="relative group">
                    <input
                        ref={ref}
                        className={cn(
                            "w-full bg-reflog-raisin/50 border border-white/10 rounded-lg px-4 py-3",
                            "text-reflog-white placeholder:text-white/20",
                            "focus:outline-none focus:border-reflog-amber/50 focus:ring-1 focus:ring-reflog-amber/50",
                            "transition-all duration-300",
                            className
                        )}
                        {...props}
                    />
                    {/* Glow effect on focus/hover */}
                    <div className="absolute inset-0 rounded-lg bg-reflog-amber/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300" />
                </div>
                {error && <p className="text-xs text-reflog-rose">{error}</p>}
            </div>
        )
    }
)
CyberInput.displayName = "CyberInput"

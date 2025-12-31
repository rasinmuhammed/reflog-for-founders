'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface FloatingCardProps {
    children: React.ReactNode
    className?: string
    floatDuration?: number // Duration in seconds for one float cycle
    floatDistance?: number // Distance in pixels to float up/down
    glowColor?: string // Optional glow color
    delay?: number // Delay before animation starts
}

/**
 * FloatingCard - Zero Gravity UI Component
 * 
 * Creates a card that floats gently like an object in zero gravity.
 * Perfect for premium, "weightless" dashboard aesthetics.
 */
export default function FloatingCard({
    children,
    className = '',
    floatDuration = 4,
    floatDistance = 12,
    glowColor,
    delay = 0
}: FloatingCardProps) {
    // Base card styles with enhanced glassmorphism
    const cardStyles = {
        background: 'var(--color-bg-card)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: glowColor
            ? `0 0 40px ${glowColor}, 0 8px 32px rgba(0, 0, 0, 0.3)`
            : '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 1px rgba(255, 255, 255, 0.1)',
    }

    return (
        <motion.div
            animate={{
                y: [0, -floatDistance, 0]
            }}
            transition={{
                duration: floatDuration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: delay
            }}
            className={`rounded-xl ${className}`}
            style={cardStyles}
        >
            {children}
        </motion.div>
    )
}

/**
 * PulsingCard - For "Sun" roast widget
 * 
 * Central glowing card with pulsing animation
 */
export function PulsingCard({
    children,
    className = '',
    pulseColor = 'rgba(236, 72, 153, 0.3)'
}: {
    children: React.ReactNode
    className?: string
    pulseColor?: string
}) {
    return (
        <motion.div
            animate={{
                boxShadow: [
                    `0 0 20px ${pulseColor}, 0 8px 32px rgba(0, 0, 0, 0.3)`,
                    `0 0 60px ${pulseColor}, 0 8px 32px rgba(0, 0, 0, 0.3)`,
                    `0 0 20px ${pulseColor}, 0 8px 32px rgba(0, 0, 0, 0.3)`
                ]
            }}
            transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
            }}
            className={`rounded-xl ${className}`}
            style={{
                background: 'var(--color-bg-card)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
        >
            {children}
        </motion.div>
    )
}

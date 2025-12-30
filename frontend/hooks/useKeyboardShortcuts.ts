import { useEffect, useCallback } from 'react'

interface ShortcutConfig {
    key: string
    ctrl?: boolean
    cmd?: boolean
    shift?: boolean
    alt?: boolean
    callback: () => void
    description: string
}

const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        for (const shortcut of shortcuts) {
            const ctrlKey = shortcut.ctrl && event.ctrlKey
            const cmdKey = shortcut.cmd && (isMac ? event.metaKey : event.ctrlKey)
            const shiftKey = shortcut.shift ? event.shiftKey : !event.shiftKey
            const altKey = shortcut.alt ? event.altKey : !event.altKey

            const modifierMatch = (ctrlKey || cmdKey) && shiftKey && altKey
            const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()

            if (modifierMatch && keyMatch) {
                event.preventDefault()
                shortcut.callback()
                break
            }
        }
    }, [shortcuts])

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])
}

// Global shortcuts hook for dashboard
export function useGlobalShortcuts(actions: {
    onQuickCheckin?: () => void
    onCommandPalette?: () => void
    onGenerateRoast?: () => void
    onSimulatePivot?: () => void
    onNavigateTab?: (tabIndex: number) => void
}) {
    const shortcuts: ShortcutConfig[] = [
        {
            key: 'k',
            cmd: true,
            callback: () => actions.onQuickCheckin?.(),
            description: 'Quick Check-in'
        },
        {
            key: '/',
            cmd: true,
            callback: () => actions.onCommandPalette?.(),
            description: 'Command Palette'
        },
        {
            key: 'r',
            cmd: true,
            callback: () => actions.onGenerateRoast?.(),
            description: 'Generate Roast'
        },
        {
            key: 's',
            cmd: true,
            callback: () => actions.onSimulatePivot?.(),
            description: 'Simulate Pivot'
        },
        // Tab navigation
        ...([1, 2, 3, 4, 5] as const).map(num => ({
            key: String(num),
            cmd: true,
            callback: () => actions.onNavigateTab?.(num - 1),
            description: `Navigate to tab ${num}`
        }))
    ]

    useKeyboardShortcuts(shortcuts)

    return shortcuts
}

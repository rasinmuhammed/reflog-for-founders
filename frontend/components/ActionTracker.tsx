'use client'

import { useState, useEffect } from 'react'
import {
    CheckSquare,
    Plus,
    Clock,
    User,
    X,
    Filter
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ActionTrackerProps {
    userEmail: string
}

interface ActionItem {
    id: number
    title: string
    owner: string
    deadline: string | null
    priority: string
    status: string
    source_type?: string
    created_at: string
}

export default function ActionTracker({ userEmail }: ActionTrackerProps) {
    const [actions, setActions] = useState<ActionItem[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<string>('pending')
    const [showAddModal, setShowAddModal] = useState(false)

    const fetchActions = async () => {
        try {
            const url = filter
                ? `${API_URL}/cos/actions/${userEmail}?status=${filter}`
                : `${API_URL}/cos/actions/${userEmail}`
            const response = await fetch(url)
            if (response.ok) {
                const data = await response.json()
                setActions(data)
            }
        } catch (err) {
            console.error('Failed to fetch actions:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchActions()
    }, [userEmail, filter])

    const updateStatus = async (actionId: number, newStatus: string) => {
        try {
            await fetch(`${API_URL}/cos/actions/${actionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })
            fetchActions()
        } catch (err) {
            console.error('Failed to update action:', err)
        }
    }

    const isOverdue = (deadline: string | null) => {
        if (!deadline) return false
        return new Date(deadline) < new Date()
    }

    const formatDeadline = (deadline: string | null) => {
        if (!deadline) return 'No deadline'
        const date = new Date(deadline)
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        if (date.toDateString() === today.toDateString()) return 'Today'
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'high':
                return {
                    background: 'var(--color-bg-shell)',
                    color: 'var(--color-warning)',
                    border: '1px solid var(--color-warning)'
                }
            case 'critical':
                return {
                    background: 'var(--color-bg-shell)',
                    color: 'var(--color-error)',
                    border: '1px solid var(--color-error)'
                }
            default:
                return {
                    background: 'var(--color-bg-shell)',
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)'
                }
        }
    }

    return (
        <div className="card h-full p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="section-title flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-accent" />
                        Action Items
                    </h2>
                    <p className="section-subtitle">
                        {actions.length} items • Execute with precision
                    </p>
                </div>

                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn btn-secondary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Action
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-muted" />
                {['pending', 'completed', 'overdue'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${filter === status
                            ? 'bg-accent/10 text-accent border border-accent/20'
                            : 'text-muted hover:text-primary'
                            }`}
                        style={{
                            background: filter === status ? 'var(--color-accent-muted)' : 'transparent',
                            color: filter === status ? 'var(--color-accent)' : 'var(--color-text-muted)',
                            border: filter === status ? '1px solid var(--color-accent)' : '1px solid transparent'
                        }}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Actions List */}
            {loading ? (
                <div className="text-center py-12">
                    <div
                        className="w-8 h-8 border-2 rounded-full animate-spin mx-auto"
                        style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-accent)' }}
                    />
                </div>
            ) : actions.length === 0 ? (
                <div className="text-center py-12">
                    <CheckSquare className="w-12 h-12 mx-auto mb-4 text-muted" />
                    <p className="text-muted">No {filter} actions</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {actions.map((action) => (
                        <div
                            key={action.id}
                            className="p-4 rounded-xl flex items-center gap-4 transition hover:bg-white/5"
                            style={{
                                background: 'var(--color-bg-card)',
                                border: isOverdue(action.deadline) && action.status !== 'completed'
                                    ? '1px solid var(--color-error)'
                                    : '1px solid var(--color-border-subtle)'
                            }}
                        >
                            {/* Checkbox */}
                            <button
                                onClick={() => updateStatus(action.id, action.status === 'completed' ? 'pending' : 'completed')}
                                className="w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors"
                                style={{
                                    borderColor: action.status === 'completed'
                                        ? 'var(--color-success)'
                                        : 'var(--color-border)',
                                    background: action.status === 'completed'
                                        ? 'var(--color-success)'
                                        : 'transparent'
                                }}
                            >
                                {action.status === 'completed' && (
                                    <svg className="w-3 h-3" fill="var(--color-daintree)" viewBox="0 0 12 12">
                                        <path d="M10.28 2.28L4 8.56 1.72 6.28a.75.75 0 00-1.06 1.06l3 3a.75.75 0 001.06 0l7-7a.75.75 0 00-1.06-1.06z" />
                                    </svg>
                                )}
                            </button>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p
                                    className={`font-medium ${action.status === 'completed' ? 'line-through opacity-50' : ''}`}
                                    style={{ color: 'var(--color-text-primary)' }}
                                >
                                    {action.title}
                                </p>
                                <div className="flex items-center gap-4 mt-1.5 text-sm text-muted">
                                    <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {action.owner}
                                    </span>
                                    <span
                                        className="flex items-center gap-1"
                                        style={{
                                            color: isOverdue(action.deadline) && action.status !== 'completed'
                                                ? 'var(--color-error)'
                                                : 'var(--color-text-muted)'
                                        }}
                                    >
                                        <Clock className="w-3 h-3" />
                                        {formatDeadline(action.deadline)}
                                    </span>
                                </div>
                            </div>

                            {/* Priority Badge */}
                            <span
                                className="px-2 py-1 rounded text-xs font-medium capitalize flex-shrink-0"
                                style={getPriorityStyle(action.priority)}
                            >
                                {action.priority}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <AddActionModal
                    userEmail={userEmail}
                    onClose={() => setShowAddModal(false)}
                    onAdded={fetchActions}
                />
            )}
        </div>
    )
}


// ==============================================================================
// Add Action Modal
// ==============================================================================

function AddActionModal({
    userEmail,
    onClose,
    onAdded
}: {
    userEmail: string
    onClose: () => void
    onAdded: () => void
}) {
    const [title, setTitle] = useState('')
    const [owner, setOwner] = useState('')
    const [deadline, setDeadline] = useState('')
    const [priority, setPriority] = useState('medium')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title || !owner || !deadline) return

        setLoading(true)
        try {
            const response = await fetch(`${API_URL}/cos/actions/${userEmail}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, owner, deadline, priority })
            })
            if (response.ok) {
                onAdded()
                onClose()
            }
        } catch (err) {
            console.error('Failed to add action:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-daintree/90 backdrop-blur-sm"
        >
            <div className="card w-full max-w-md">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold"> Add Action Item </h3>
                    <button
                        onClick={onClose}
                        className="text-muted hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm mb-2 text-muted"> What needs to be done? </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Action item title..."
                            required
                            className="input w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-2 text-muted"> Who owns this? </label>
                        <input
                            type="text"
                            value={owner}
                            onChange={(e) => setOwner(e.target.value)}
                            placeholder="Owner name..."
                            required
                            className="input w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-2 text-muted"> Deadline </label>
                        <input
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            required
                            className="input w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-2 text-muted"> Priority </label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            className="input w-full"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !title || !owner || !deadline}
                        className="btn btn-primary w-full"
                    >
                        {loading ? 'Adding...' : 'Add Action'}
                    </button>
                </form>
            </div>
        </div>
    )
}

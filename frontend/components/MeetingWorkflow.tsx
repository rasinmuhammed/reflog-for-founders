'use client'

import { useState, useEffect } from 'react'
import {
    Video,
    Plus,
    Clock,
    Users,
    FileText,
    X,
    ChevronRight,
    Sparkles
} from 'lucide-react'
import { useToast } from './ui/Toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface MeetingWorkflowProps {
    userEmail: string
}

interface Meeting {
    id: number
    title: string
    scheduled_at: string
    duration_minutes: number
    attendees: Array<{ name: string; email?: string }>
    status: string
    has_prep: boolean
    has_wrap: boolean
}

export default function MeetingWorkflow({ userEmail }: MeetingWorkflowProps) {
    const [meetings, setMeetings] = useState<Meeting[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [activeView, setActiveView] = useState<'list' | 'prep' | 'notes' | 'wrap'>('list')
    const { showError } = useToast()

    const fetchMeetings = async () => {
        try {
            const response = await fetch(`${API_URL}/cos/meetings/${userEmail}`)
            if (response.ok) {
                const data = await response.json()
                setMeetings(data)
            } else {
                showError('Failed to load meetings')
            }
        } catch (err) {
            console.error('Failed to fetch meetings:', err)
            showError('Failed to load meetings')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMeetings()
    }, [userEmail])

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        if (date.toDateString() === today.toDateString()) {
            return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
        }
        if (date.toDateString() === tomorrow.toDateString()) {
            return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
        }
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        })
    }

    return (
        <div className="card h-full p-6">
            {activeView === 'list' && (
                <>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="section-title flex items-center gap-2">
                                <Video className="w-5 h-5 text-accent" />
                                Meetings
                            </h2>
                            <p className="section-subtitle">
                                Prep before, wrap after — never leave empty-handed
                            </p>
                        </div>

                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn btn-secondary flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Meeting
                        </button>
                    </div>

                    {/* Meetings List */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div
                                className="w-8 h-8 border-2 rounded-full animate-spin mx-auto"
                                style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-accent)' }}
                            />
                        </div>
                    ) : meetings.length === 0 ? (
                        <div className="text-center py-12">
                            <Video className="w-12 h-12 mx-auto mb-4 text-muted" />
                            <p className="text-muted">No meetings scheduled</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {meetings.map((meeting) => (
                                <div
                                    key={meeting.id}
                                    className="p-4 rounded-xl transition hover:bg-white/5"
                                    style={{
                                        background: 'var(--color-bg-card)',
                                        border: '1px solid var(--color-border-subtle)'
                                    }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="font-medium text-primary">
                                                {meeting.title}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-muted">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDate(meeting.scheduled_at)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    {meeting.attendees?.length || 0} attendees
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            {!meeting.has_prep && meeting.status === 'scheduled' && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedMeeting(meeting)
                                                        setActiveView('prep')
                                                    }}
                                                    className="btn btn-ghost text-xs px-3 py-1.5 h-auto text-accent border border-accent/20 hover:bg-accent/10 hover:text-accent"
                                                >
                                                    Generate Prep
                                                </button>
                                            )}
                                            {meeting.has_prep && meeting.status === 'scheduled' && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedMeeting(meeting)
                                                        setActiveView('notes')
                                                    }}
                                                    className="btn btn-ghost text-xs px-3 py-1.5 h-auto text-success border border-success/20 hover:bg-success/10 hover:text-success"
                                                    style={{ color: 'var(--color-success)', borderColor: 'rgba(70, 155, 167, 0.3)' }}
                                                >
                                                    Add Notes
                                                </button>
                                            )}
                                            {meeting.status === 'completed' && (
                                                <span
                                                    className="px-2 py-1 rounded text-xs bg-success/10 text-success border border-success/20"
                                                    style={{ color: 'var(--color-success)', borderColor: 'rgba(70, 155, 167, 0.3)' }}
                                                >
                                                    Completed
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {activeView === 'prep' && selectedMeeting && (
                <MeetingPrepView
                    meeting={selectedMeeting}
                    onBack={() => {
                        setActiveView('list')
                        setSelectedMeeting(null)
                        fetchMeetings()
                    }}
                />
            )}

            {activeView === 'notes' && selectedMeeting && (
                <MeetingNotesView
                    meeting={selectedMeeting}
                    onBack={() => {
                        setActiveView('list')
                        setSelectedMeeting(null)
                        fetchMeetings()
                    }}
                />
            )}

            {/* Add Modal */}
            {showAddModal && (
                <AddMeetingModal
                    userEmail={userEmail}
                    onClose={() => setShowAddModal(false)}
                    onAdded={fetchMeetings}
                />
            )}
        </div>
    )
}


// ==============================================================================
// Meeting Prep View
// ==============================================================================

function MeetingPrepView({ meeting, onBack }: { meeting: Meeting; onBack: () => void }) {
    const [prep, setPrep] = useState<Record<string, unknown> | null>(null)
    const [loading, setLoading] = useState(false)

    const generatePrep = async () => {
        setLoading(true)
        try {
            const response = await fetch(`${API_URL}/cos/meeting-prep/${meeting.id}`, {
                method: 'POST'
            })
            if (response.ok) {
                const data = await response.json()
                setPrep(data.prep)
            }
        } catch (err) {
            console.error('Failed to generate prep:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <button
                onClick={onBack}
                className="flex items-center gap-2 mb-4 text-sm text-muted hover:text-white transition"
            >
                ← Back to meetings
            </button>

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-primary">
                        {meeting.title}
                    </h2>
                    <p className="text-sm mt-1 text-muted">
                        Meeting prep brief
                    </p>
                </div>

                {!prep && (
                    <button
                        onClick={generatePrep}
                        disabled={loading}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Sparkles className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
                        {loading ? 'Generating...' : 'Generate Prep'}
                    </button>
                )}
            </div>

            {!prep ? (
                <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted" />
                    <p className="text-muted">
                        Generate a prep brief to enter this meeting prepared
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(prep).map(([key, value]) => (
                        <div
                            key={key}
                            className="p-4 rounded-xl"
                            style={{
                                background: 'var(--color-bg-shell)',
                                border: '1px solid var(--color-border-subtle)'
                            }}
                        >
                            <h3 className="text-sm font-medium mb-2 capitalize text-accent-muted flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                                {key.replace(/_/g, ' ')}
                            </h3>
                            <div className="text-primary text-sm leading-relaxed">
                                {typeof value === 'string' ? (
                                    <p>{value}</p>
                                ) : Array.isArray(value) ? (
                                    <ul className="space-y-1">
                                        {value.map((item, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <ChevronRight className="w-3 h-3 flex-shrink-0 mt-1 text-muted" />
                                                {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <pre className="text-sm whitespace-pre-wrap font-sans">{JSON.stringify(value, null, 2)}</pre>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}


// ==============================================================================
// Meeting Notes View
// ==============================================================================

function MeetingNotesView({ meeting, onBack }: { meeting: Meeting; onBack: () => void }) {
    const [notes, setNotes] = useState('')
    const [wrap, setWrap] = useState<Record<string, unknown> | null>(null)
    const [loading, setLoading] = useState(false)

    const generateWrap = async () => {
        if (!notes.trim()) return
        setLoading(true)
        try {
            const response = await fetch(`${API_URL}/cos/meeting-wrap/${meeting.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes })
            })
            if (response.ok) {
                const data = await response.json()
                setWrap(data.wrap)
            }
        } catch (err) {
            console.error('Failed to generate wrap:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <button
                onClick={onBack}
                className="flex items-center gap-2 mb-4 text-sm text-muted hover:text-white transition"
            >
                ← Back to meetings
            </button>

            <div className="mb-6">
                <h2 className="text-xl font-semibold text-primary">
                    {meeting.title}
                </h2>
                <p className="text-sm mt-1 text-muted">
                    {wrap ? 'Meeting wrap-up' : 'Add your meeting notes'}
                </p>
            </div>

            {!wrap ? (
                <div className="space-y-4">
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Paste your meeting notes here... Include key discussion points, decisions made, and action items mentioned."
                        className="input w-full h-48 resize-none"
                    />

                    <button
                        onClick={generateWrap}
                        disabled={loading || !notes.trim()}
                        className="btn btn-primary w-full flex items-center justify-center gap-2"
                    >
                        <Sparkles className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
                        {loading ? 'Processing...' : 'Generate Wrap-up'}
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div
                        className="p-4 rounded-xl bg-success/10 border border-success/20 text-success"
                        style={{ color: 'var(--color-success)', borderColor: 'rgba(70, 155, 167, 0.3)' }}
                    >
                        <p className="text-sm flex items-center gap-2">
                            ✓ Meeting wrap generated with action items and follow-up draft
                        </p>
                    </div>

                    {Object.entries(wrap).map(([key, value]) => (
                        <div
                            key={key}
                            className="p-4 rounded-xl"
                            style={{
                                background: 'var(--color-bg-shell)',
                                border: '1px solid var(--color-border-subtle)'
                            }}
                        >
                            <h3 className="text-sm font-medium mb-2 capitalize text-accent-muted flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                                {key.replace(/_/g, ' ')}
                            </h3>
                            <div className="text-primary text-sm leading-relaxed">
                                {typeof value === 'string' ? (
                                    <p className="whitespace-pre-wrap">{value}</p>
                                ) : Array.isArray(value) ? (
                                    <ul className="space-y-2">
                                        {value.map((item, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <ChevronRight className="w-3 h-3 flex-shrink-0 mt-1 text-muted" />
                                                {typeof item === 'object' ? (
                                                    <div>
                                                        {Object.entries(item as Record<string, unknown>).map(([k, v]) => (
                                                            <p key={k}><strong className="text-accent">{k}:</strong> {String(v)}</p>
                                                        ))}
                                                    </div>
                                                ) : String(item)}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <pre className="text-sm whitespace-pre-wrap font-sans">{JSON.stringify(value, null, 2)}</pre>
                                )}
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={onBack}
                        className="btn btn-secondary w-full"
                    >
                        Done
                    </button>
                </div>
            )}
        </div>
    )
}


// ==============================================================================
// Add Meeting Modal
// ==============================================================================

function AddMeetingModal({
    userEmail,
    onClose,
    onAdded
}: {
    userEmail: string
    onClose: () => void
    onAdded: () => void
}) {
    const [title, setTitle] = useState('')
    const [scheduledAt, setScheduledAt] = useState('')
    const [duration, setDuration] = useState(30)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title || !scheduledAt) return

        setLoading(true)
        try {
            const response = await fetch(`${API_URL}/cos/meetings/${userEmail}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    scheduled_at: new Date(scheduledAt).toISOString(),
                    duration_minutes: duration,
                    attendees: []
                })
            })
            if (response.ok) {
                onAdded()
                onClose()
            }
        } catch (err) {
            console.error('Failed to add meeting:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-daintree/90 backdrop-blur-sm">
            <div className="card w-full max-w-md">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold"> Add Meeting </h3>
                    <button
                        onClick={onClose}
                        className="text-muted hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm mb-2 text-muted"> Meeting Title </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Product Review with Team"
                            required
                            className="input w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-2 text-muted"> Date & Time </label>
                        <input
                            type="datetime-local"
                            value={scheduledAt}
                            onChange={(e) => setScheduledAt(e.target.value)}
                            required
                            className="input w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-2 text-muted"> Duration (minutes) </label>
                        <select
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value))}
                            className="input w-full"
                        >
                            <option value={15}>15 min</option>
                            <option value={30}>30 min</option>
                            <option value={45}>45 min</option>
                            <option value={60}>1 hour</option>
                            <option value={90}>1.5 hours</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !title || !scheduledAt}
                        className="btn btn-primary w-full"
                    >
                        {loading ? 'Adding...' : 'Add Meeting'}
                    </button>
                </form>
            </div>
        </div>
    )
}

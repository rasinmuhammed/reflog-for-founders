'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import {
    Target,
    TrendingUp,
    AlertTriangle,
    Play,
    Plus,
    Loader2,
    ExternalLink,
    X,
    RefreshCw
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface CompetitorIntel {
    competitor: string
    category: string
    threat_level: string
    brief: string
    actions: string[]
    last_updated: string
}

interface Competitor {
    id: number
    name: string
    website: string
    category: string
    is_active: boolean
    last_checked: string | null
    added_at: string
}

export default function CompetitorTracking({ userIdentifier }: { userIdentifier: string }) {
    const [intelligence, setIntelligence] = useState<CompetitorIntel[]>([])
    const [competitors, setCompetitors] = useState<Competitor[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [researching, setResearching] = useState<number | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        website: '',
        category: 'General',
        product_hunt_url: '',
        twitter_handle: '',
        blog_rss: '',
        notes: ''
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [intelRes, compRes] = await Promise.all([
                axios.get(`${API_URL}/competitors/intel/${userIdentifier}`),
                axios.get(`${API_URL}/competitors/list/${userIdentifier}`)
            ])
            setIntelligence(intelRes.data.intelligence || [])
            setCompetitors(compRes.data)
        } catch (err) {
            console.error('Failed to load competitor data:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleAddCompetitor = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await axios.post(`${API_URL}/competitors/add/${userIdentifier}`, formData)
            setShowAddForm(false)
            setFormData({
                name: '',
                website: '',
                category: 'General',
                product_hunt_url: '',
                twitter_handle: '',
                blog_rss: '',
                notes: ''
            })
            loadData()
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to add competitor')
        }
    }

    const handleResearch = async (competitorId: number) => {
        setResearching(competitorId)
        try {
            await axios.post(`${API_URL}/competitors/research/${competitorId}`)
            loadData()
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Research failed')
        } finally {
            setResearching(null)
        }
    }

    const getThreatBadge = (level: string) => {
        const styles = {
            critical: 'bg-red-500/10 text-red-500 border-red-500/20',
            high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
            medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
            low: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
        }
        return styles[level as keyof typeof styles] || styles.low
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        Competitor Intelligence
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        AI-powered market intelligence from public sources
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="btn btn-primary"
                >
                    <Plus className="w-4 h-4" />
                    Track Competitor
                </button>
            </div>

            {/* Add Competitor Form */}
            {showAddForm && (
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                            Add Competitor to Track
                        </h3>
                        <button onClick={() => setShowAddForm(false)} className="p-1 hover:opacity-70">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleAddCompetitor} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                                    Company Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input"
                                    required
                                    placeholder="e.g., Linear, Notion"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                                    Website *
                                </label>
                                <input
                                    type="url"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    className="input"
                                    required
                                    placeholder="https://..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                                    Category
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="input"
                                >
                                    <option value="General">General</option>
                                    <option value="Project Management">Project Management</option>
                                    <option value="CRM">CRM</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Analytics">Analytics</option>
                                    <option value="Infrastructure">Infrastructure</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                                    Twitter Handle
                                </label>
                                <input
                                    type="text"
                                    value={formData.twitter_handle}
                                    onChange={(e) => setFormData({ ...formData, twitter_handle: e.target.value })}
                                    className="input"
                                    placeholder="@company"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                                    Product Hunt URL (optional)
                                </label>
                                <input
                                    type="url"
                                    value={formData.product_hunt_url}
                                    onChange={(e) => setFormData({ ...formData, product_hunt_url: e.target.value })}
                                    className="input"
                                    placeholder="https://www.producthunt.com/products/..."
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                                    Blog RSS Feed (optional)
                                </label>
                                <input
                                    type="url"
                                    value={formData.blog_rss}
                                    onChange={(e) => setFormData({ ...formData, blog_rss: e.target.value })}
                                    className="input"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button type="submit" className="btn btn-primary flex-1">
                                Add Competitor
                            </button>
                            <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Intelligence Reports */}
            {loading ? (
                <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: 'var(--color-accent)' }} />
                </div>
            ) : competitors.length === 0 ? (
                <div className="card p-12 text-center">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--color-text-muted)' }} />
                    <p className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                        No competitors being tracked
                    </p>
                    <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                        Add competitors to get AI-powered market intelligence from public sources
                    </p>
                    <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
                        <Plus className="w-4 h-4" />
                        Track Your First Competitor
                    </button>
                </div>
            ) : (
                <>
                    {/* Tracked Competitors List - ALWAYS SHOW FIRST */}
                    <div className="card p-6">
                        <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--color-text-primary)' }}>
                            Tracked Competitors ({competitors.length})
                        </h3>
                        <div className="space-y-2">
                            {competitors.map((comp) => (
                                <div
                                    key={comp.id}
                                    className="flex items-center justify-between p-3 rounded-lg"
                                    style={{ background: 'var(--color-bg-hover)' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                                                {comp.name}
                                            </p>
                                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                                {comp.category}
                                                {comp.last_checked && (
                                                    <span> • Last checked {new Date(comp.last_checked).toLocaleDateString()}</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={comp.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-secondary text-xs"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            Visit
                                        </a>
                                        <button
                                            onClick={() => handleResearch(comp.id)}
                                            disabled={researching === comp.id}
                                            className="btn btn-primary text-xs"
                                        >
                                            {researching === comp.id ? (
                                                <>
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    Researching...
                                                </>
                                            ) : (
                                                <>
                                                    <RefreshCw className="w-3 h-3" />
                                                    Research Now
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {intelligence.length === 0 && (
                            <div className="mt-4 p-3 rounded-lg text-center" style={{
                                background: 'var(--color-accent-bg)',
                                border: '1px solid var(--color-accent)'
                            }}>
                                <p className="text-sm" style={{ color: 'var(--color-accent)' }}>
                                    💡 Click "Research Now" on a competitor to generate AI intelligence
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Intelligence Cards - Show if any exist */}
                    {intelligence.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                                Intelligence Reports
                            </h3>
                            {intelligence.map((intel, idx) => (
                                <div key={idx} className="card p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                                                {intel.competitor}
                                            </h3>
                                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                                {intel.category} • Last updated {new Date(intel.last_updated).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className={`text-xs px-3 py-1 rounded-full border ${getThreatBadge(intel.threat_level)}`}>
                                            {intel.threat_level} threat
                                        </span>
                                    </div>

                                    <div className="prose prose-sm mb-4 whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>
                                        {intel.brief}
                                    </div>

                                    {intel.actions && intel.actions.length > 0 && (
                                        <div className="space-y-2 pt-4 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
                                            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                                                Recommended Actions
                                            </p>
                                            {intel.actions.map((action, i) => (
                                                <div key={i} className="flex items-start gap-2 text-sm">
                                                    <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
                                                    <span style={{ color: 'var(--color-text-secondary)' }}>{action}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { TrendingUp, AlertCircle, HelpCircle, Target, Plus, X, ChevronDown, ChevronRight, Calendar, ArrowRight, Loader2, Brain } from 'lucide-react'
import MarkdownRenderer from './MarkdownRenderer'

// Assuming API_URL is defined elsewhere or replace with actual URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface LifeDecision {
  id: number
  title: string
  description: string
  decision_type: string
  impact_areas: string[]
  timestamp: string
  time_horizon: string
  ai_analysis?: string
  lessons_learned?: string[]
}

interface LifeDecisionsProps {
  userIdentifier: string
}

export default function LifeDecisions({ userIdentifier }: LifeDecisionsProps) {
  const [decisions, setDecisions] = useState<LifeDecision[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    decision_type: 'major_decision',
    impact_areas: [] as string[],
    time_horizon: '1_year'
  })

  useEffect(() => {
    fetchDecisions()
  }, [userIdentifier])

  const fetchDecisions = async () => {
    try {
      const response = await axios.get(`${API_URL}/life-decisions/${userIdentifier}`)
      setDecisions(response.data)
    } catch (error) {
      console.error('Failed to fetch decisions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const toggleImpactArea = (area: string) => {
    setFormData(prev => {
      const areas = prev.impact_areas.includes(area)
        ? prev.impact_areas.filter(a => a !== area)
        : [...prev.impact_areas, area]
      return { ...prev, impact_areas: areas }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAnalyzing(true)

    try {
      const response = await axios.post(`${API_URL}/life-decisions/${userIdentifier}`, formData)
      setDecisions(prev => [response.data, ...prev])
      setShowForm(false)
      setFormData({
        title: '',
        description: '',
        decision_type: 'major_decision',
        impact_areas: [],
        time_horizon: '1_year'
      })
      // Auto-expand the new decision to show analysis
      setExpandedId(response.data.id)
    } catch (error) {
      console.error('Failed to create decision:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const impactOptions = [
    'Revenue', 'Product', 'Team', 'Personal Health', 'Market Position', 'Fundraising', 'Lifestyle'
  ]

  const decisionTypeIcons: Record<string, React.ReactNode> = {
    major_decision: <TrendingUp className="w-5 h-5" />,
    mistake: <AlertCircle className="w-5 h-5" />,
    pivot: <Target className="w-5 h-5" />,
    experiment: <HelpCircle className="w-5 h-5" />
  }

  if (loading) {
    return <div className="text-[#FBFAEE]/50 text-center py-8">Loading decisions...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-[#FBFAEE] flex items-center">
          <Target className="w-5 h-5 mr-2 text-[#933DC9]" />
          Life & Business Decisions
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-[#933DC9] hover:bg-[#7d34ad] text-[#FBFAEE] rounded-xl transition shadow-lg shadow-[#933DC9]/20"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showForm ? 'Cancel' : 'New Decision'}</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-[#242424] border border-[#242424]/50 rounded-2xl p-6 animate-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#FBFAEE]/80 mb-1">Decision Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-[#000000]/50 border border-[#242424]/60 rounded-xl text-[#FBFAEE] focus:ring-2 focus:ring-[#933DC9] focus:border-transparent"
                placeholder="e.g., Pivot to B2B"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#FBFAEE]/80 mb-1">Type</label>
                <select
                  name="decision_type"
                  value={formData.decision_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-[#000000]/50 border border-[#242424]/60 rounded-xl text-[#FBFAEE] focus:ring-2 focus:ring-[#933DC9] focus:border-transparent"
                >
                  <option value="major_decision">Major Decision</option>
                  <option value="mistake">Mistake / Failure</option>
                  <option value="pivot">Strategic Pivot</option>
                  <option value="experiment">Experiment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#FBFAEE]/80 mb-1">Time Horizon</label>
                <select
                  name="time_horizon"
                  value={formData.time_horizon}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-[#000000]/50 border border-[#242424]/60 rounded-xl text-[#FBFAEE] focus:ring-2 focus:ring-[#933DC9] focus:border-transparent"
                >
                  <option value="1_month">1 Month</option>
                  <option value="3_months">3 Months</option>
                  <option value="1_year">1 Year</option>
                  <option value="5_years">5 Years</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#FBFAEE]/80 mb-1">Description & Context</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-[#000000]/50 border border-[#242424]/60 rounded-xl text-[#FBFAEE] focus:ring-2 focus:ring-[#933DC9] focus:border-transparent h-32 resize-none"
                placeholder="Describe the situation, options considered, and why you're making this choice..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#FBFAEE]/80 mb-2">Impact Areas</label>
              <div className="flex flex-wrap gap-2">
                {impactOptions.map(area => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleImpactArea(area)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${formData.impact_areas.includes(area)
                      ? 'bg-[#933DC9] text-[#FBFAEE]'
                      : 'bg-[#242424] text-[#FBFAEE]/60 hover:bg-[#242424]/80'
                      }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={analyzing}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-[#933DC9] to-[#53118F] text-[#FBFAEE] rounded-xl hover:from-[#A35AD4] hover:to-[#6E2EA4] transition disabled:opacity-50 shadow-lg"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Impact...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    <span>Analyze Decision</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {decisions.map((decision) => (
          <div
            key={decision.id}
            className={`bg-[#242424] border border-[#242424]/50 rounded-xl overflow-hidden transition-all duration-200 ${expandedId === decision.id ? 'ring-1 ring-[#933DC9]/50' : 'hover:bg-[#242424]/80'}`}
          >
            <div
              onClick={() => setExpandedId(expandedId === decision.id ? null : decision.id)}
              className="p-5 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-[#000000]/30 rounded-xl text-[#933DC9]">
                    {decisionTypeIcons[decision.decision_type] || <Target className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#FBFAEE] text-lg mb-1">{decision.title}</h4>
                    <div className="flex items-center space-x-3 text-xs text-[#FBFAEE]/50">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(decision.timestamp).toLocaleDateString()}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#000000]/30 border border-[#FBFAEE]/10 capitalize">
                        {decision.decision_type.replace('_', ' ')}
                      </span>
                      <span>{decision.time_horizon.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
                {expandedId === decision.id ?
                  <ChevronDown className="w-5 h-5 text-[#FBFAEE]/40" /> :
                  <ChevronRight className="w-5 h-5 text-[#FBFAEE]/40" />
                }
              </div>

              <div className="mt-3 pl-[3.75rem]">
                <div className="flex flex-wrap gap-2">
                  {decision.impact_areas.map(area => (
                    <span key={area} className="text-xs px-2 py-0.5 rounded-md bg-[#933DC9]/10 text-[#C488F8] border border-[#933DC9]/20">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {expandedId === decision.id && (
              <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2 duration-200">
                <div className="ml-[3.75rem]">
                  <div className="h-px bg-[#FBFAEE]/10 mb-4" />

                  <div className="mb-4">
                    <h5 className="text-sm font-semibold text-[#FBFAEE]/60 mb-2 uppercase tracking-wider">Context</h5>
                    <p className="text-[#FBFAEE]/80 text-sm leading-relaxed">{decision.description}</p>
                  </div>

                  {decision.ai_analysis && (
                    <div className="bg-gradient-to-br from-[#933DC9]/10 to-[#53118F]/10 border border-[#933DC9]/20 rounded-xl p-4 mb-4">
                      <h5 className="text-sm font-bold text-[#C488F8] mb-2 flex items-center">
                        <Brain className="w-4 h-4 mr-2" />
                        AI Analysis
                      </h5>
                      <div className="prose prose-invert prose-sm max-w-none text-[#FBFAEE]/90">
                        <MarkdownRenderer content={decision.ai_analysis} />
                      </div>
                    </div>
                  )}

                  {decision.lessons_learned && decision.lessons_learned.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-[#FBFAEE]/60 mb-2 uppercase tracking-wider">Projected Lessons</h5>
                      <ul className="space-y-2">
                        {decision.lessons_learned.map((lesson, idx) => (
                          <li key={idx} className="flex items-start text-sm text-[#FBFAEE]/70">
                            <ArrowRight className="w-4 h-4 mr-2 text-[#933DC9] mt-0.5 flex-shrink-0" />
                            <span>{lesson}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
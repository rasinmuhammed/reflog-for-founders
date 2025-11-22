'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Clock, MessageSquare, CheckCircle, AlertTriangle, BarChart, Brain, Target, ChevronRight, ChevronDown, Calendar } from 'lucide-react'
import MarkdownRenderer from './MarkdownRenderer'

// Assuming API_URL is defined elsewhere or replace with actual URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Interaction {
  id: number
  agent_name: string
  advice: string
  created_at: string
  interaction_type: string
}

interface InteractionHistoryProps {
  userIdentifier: string
}

export default function InteractionHistory({ userIdentifier }: InteractionHistoryProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`${API_URL}/advice/${userIdentifier}?limit=20`)
        setInteractions(response.data)
      } catch (error) {
        console.error('Failed to fetch history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [userIdentifier])

  const agentColors: Record<string, string> = {
    'Analyst': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    'Psychologist': 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    'Contrarian': 'text-red-400 bg-red-400/10 border-red-400/20',
    'Strategist': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    'Multi-Agent Chat': 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    'Onboarding Strategist': 'text-pink-400 bg-pink-400/10 border-pink-400/20'
  }

  const agentIcons: Record<string, React.ReactNode> = {
    'Analyst': <BarChart className="w-5 h-5" />,
    'Psychologist': <Brain className="w-5 h-5" />,
    'Contrarian': <AlertTriangle className="w-5 h-5" />,
    'Strategist': <Target className="w-5 h-5" />,
    'Multi-Agent Chat': <MessageSquare className="w-5 h-5" />,
    'Onboarding Strategist': <Target className="w-5 h-5" />
  }

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id)
  }

  if (loading) {
    return <div className="text-[#FBFAEE]/50 text-center py-8">Loading history...</div>
  }

  if (interactions.length === 0) {
    return (
      <div className="text-center py-12 bg-[#242424] rounded-2xl border border-[#242424]/50">
        <Clock className="w-12 h-12 text-[#FBFAEE]/20 mx-auto mb-4" />
        <p className="text-[#FBFAEE]/60">No interaction history yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-[#FBFAEE] mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2 text-[#933DC9]" />
        Recent Advice
      </h3>

      <div className="space-y-3">
        {interactions.map((interaction) => (
          <div
            key={interaction.id}
            className={`bg-[#242424] border border-[#242424]/50 rounded-xl overflow-hidden transition-all duration-200 ${expandedId === interaction.id ? 'ring-1 ring-[#933DC9]/50' : 'hover:bg-[#242424]/80'}`}
          >
            <div
              onClick={() => toggleExpand(interaction.id)}
              className="p-4 cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg ${agentColors[interaction.agent_name] || 'text-gray-400 bg-gray-400/10'}`}>
                  {agentIcons[interaction.agent_name] || <MessageSquare className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-[#FBFAEE]">{interaction.agent_name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#000000]/30 text-[#FBFAEE]/50 border border-[#FBFAEE]/10">
                      {interaction.interaction_type}
                    </span>
                  </div>
                  <div className="text-xs text-[#FBFAEE]/40 mt-1 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(interaction.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {expandedId === interaction.id ?
                <ChevronDown className="w-5 h-5 text-[#FBFAEE]/40" /> :
                <ChevronRight className="w-5 h-5 text-[#FBFAEE]/40" />
              }
            </div>

            {expandedId === interaction.id && (
              <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                <div className="h-px bg-[#FBFAEE]/10 mb-4" />
                <div className="prose prose-invert prose-sm max-w-none text-[#FBFAEE]/80">
                  <MarkdownRenderer content={interaction.advice} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
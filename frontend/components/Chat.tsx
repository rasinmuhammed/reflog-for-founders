'use client'

import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { Send, Brain, BarChart, AlertTriangle, Target, Loader2, MessageCircle, History, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import MarkdownRenderer from './MarkdownRenderer'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface AgentContribution {
  agent: string
  output: string
  timestamp: string
}

interface Message {
  type: 'user' | 'assistant' | 'error'
  content: string
  debate?: Array<{
    agent: string
    perspective: string
  }>
  insights?: string[]
  actions?: Array<{
    action: string
    priority: string
  }>
  raw_deliberation?: AgentContribution[]
  timestamp: Date
}

interface ChatProps {
  userIdentifier: string
}

export default function Chat({ userIdentifier }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [expandedDebateIndex, setExpandedDebateIndex] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const agentIcons: Record<string, React.ReactNode> = {
    'Analyst': <BarChart className="w-4 h-4" />,
    'Psychologist': <Brain className="w-4 h-4" />,
    'Challenger': <AlertTriangle className="w-4 h-4" />,
    'Strategist': <Target className="w-4 h-4" />
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input
    setInput('')

    setMessages(prev => [...prev, {
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }])

    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/cos/chat/${encodeURIComponent(userIdentifier)}`, {
        message: userMessage
      })

      setMessages(prev => [...prev, {
        type: 'assistant',
        content: response.data.response,
        debate: response.data.agent_debate,
        insights: response.data.key_insights,
        actions: response.data.recommended_actions,
        raw_deliberation: response.data.raw_deliberation,
        timestamp: new Date()
      }])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        type: 'error',
        content: 'Failed to get response. Please try again.',
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickPrompts = [
    "What should I focus on this week?",
    "Analyze my decision patterns",
    "Prepare for a difficult conversation",
    "Should I pursue this opportunity?"
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] card overflow-hidden">
      {/* Header */}
      <div
        className="p-5 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-lg"
            style={{ background: 'var(--color-accent-muted)' }}
          >
            <MessageCircle className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
          </div>
          <div>
            <h2 className="section-title text-base sm:text-lg">Chat with Reflog</h2>
            <p className="section-subtitle">
              Strategic advisor at your service
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto p-5 space-y-5"
        style={{ background: 'var(--color-bg-shell)' }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div
              className="p-4 rounded-xl w-16 h-16 mx-auto mb-5 flex items-center justify-center"
              style={{ background: 'var(--color-accent-muted)' }}
            >
              <Brain className="w-8 h-8" style={{ color: 'var(--color-accent)' }} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Ask Reflog</h3>
            <p
              className="text-sm mb-8 max-w-md mx-auto"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Strategic guidance, decision support, and honest feedback.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(prompt)}
                  className="p-4 text-left rounded-lg text-sm transition hover:bg-opacity-80"
                  style={{
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  <Sparkles
                    className="w-3.5 h-3.5 inline mr-2"
                    style={{ color: 'var(--color-accent)' }}
                  />
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx}>
              {msg.type === 'user' ? (
                <div className="flex justify-end">
                  <div
                    className="px-5 py-3 rounded-xl max-w-2xl text-sm"
                    style={{
                      background: 'var(--color-accent-muted)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ) : msg.type === 'assistant' ? (
                <div className="space-y-3">
                  {/* Main Response */}
                  <div
                    className="px-5 py-4 rounded-xl max-w-3xl"
                    style={{
                      background: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <MarkdownRenderer
                      content={msg.content}
                      className="text-sm"
                    />
                  </div>

                  {/* Agent Debate Section */}
                  {msg.debate && msg.debate.length > 0 && (
                    <div className="ml-4">
                      <button
                        onClick={() => setExpandedDebateIndex(expandedDebateIndex === idx ? null : idx)}
                        className="flex items-center gap-2 text-xs font-medium transition mb-2"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>
                          {expandedDebateIndex === idx ? 'Hide' : 'Show'} Perspectives
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-full text-xs"
                          style={{
                            background: 'var(--color-accent-muted)',
                            color: 'var(--color-accent)'
                          }}
                        >
                          {msg.debate.length} agents
                        </span>
                        {expandedDebateIndex === idx ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {expandedDebateIndex === idx && (
                        <div className="space-y-2">
                          {msg.debate.map((agent, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-3 p-3 rounded-lg"
                              style={{
                                background: 'var(--color-bg-shell)',
                                border: '1px solid var(--color-border-subtle)'
                              }}
                            >
                              <div
                                className="p-2 rounded-md mt-0.5"
                                style={{
                                  background: 'var(--color-accent-muted)',
                                  border: '1px solid var(--color-border)'
                                }}
                              >
                                {agentIcons[agent.agent] || <Brain className="w-4 h-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm mb-1">{agent.agent}</div>
                                <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                  <MarkdownRenderer content={agent.perspective} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Key Insights */}
                  {msg.insights && msg.insights.length > 0 && (
                    <div
                      className="ml-4 rounded-lg p-4"
                      style={{
                        background: 'var(--color-bg-shell)',
                        border: '1px solid var(--color-border)'
                      }}
                    >
                      <h4
                        className="font-medium text-sm mb-2 flex items-center"
                        style={{ color: 'var(--color-accent)' }}
                      >
                        <Brain className="w-3.5 h-3.5 mr-2" />
                        Key Insights
                      </h4>
                      <ul className="space-y-1.5">
                        {msg.insights.map((insight, i) => (
                          <li
                            key={i}
                            className="text-xs flex items-start"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            <span
                              className="mr-2"
                              style={{ color: 'var(--color-accent)' }}
                            >•</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommended Actions */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div
                      className="ml-4 rounded-lg p-4"
                      style={{
                        background: 'rgba(70, 155, 167, 0.1)',
                        border: '1px solid var(--color-success)'
                      }}
                    >
                      <h4
                        className="font-medium text-sm mb-2 flex items-center"
                        style={{ color: 'var(--color-success)' }}
                      >
                        <Target className="w-3.5 h-3.5 mr-2" />
                        Recommended Actions
                      </h4>
                      <ul className="space-y-1.5">
                        {msg.actions.map((action, i) => (
                          <li
                            key={i}
                            className="text-xs flex items-start"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            <span
                              className="font-bold mr-2"
                              style={{
                                color: action.priority === 'high'
                                  ? 'var(--color-warning)'
                                  : 'var(--color-success)'
                              }}
                            >
                              {i + 1}.
                            </span>
                            <span>{action.action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="px-5 py-3 rounded-lg max-w-md text-sm"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid var(--color-error)',
                    color: 'var(--color-error)'
                  }}
                >
                  <p>{msg.content}</p>
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-start gap-3">
            <div
              className="px-5 py-4 rounded-xl"
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)'
              }}
            >
              <div className="flex items-center gap-3">
                <Loader2
                  className="w-4 h-4 animate-spin"
                  style={{ color: 'var(--color-accent)' }}
                />
                <div>
                  <p className="text-sm font-medium">Analyzing...</p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Reflog is deliberating on your question
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        className="p-4"
        style={{ borderTop: '1px solid var(--color-border-subtle)' }}
      >
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Reflog..."
            className="input resize-none"
            style={{ minHeight: '52px' }}
            rows={2}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="btn btn-primary p-3"
            style={{ height: '52px', width: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p
          className="text-xs mt-2 text-center"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Press Enter to send • Strategic insights
        </p>
      </div>
    </div>
  )
}
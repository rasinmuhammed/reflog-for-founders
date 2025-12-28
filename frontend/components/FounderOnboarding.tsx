'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import {
  Sparkles, ChevronRight, ChevronLeft, Check,
  Loader2, Brain, Target, Building, Users
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface OnboardingProps {
  onComplete: (email: string) => void
}

interface OnboardingData {
  company_name: string
  company_stage: string
  team_size: string
  biggest_challenge: string
  goals: string[]
}

const stages = [
  { value: 'idea', label: 'Idea Stage' },
  { value: 'pre-seed', label: 'Pre-Seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series-a', label: 'Series A' },
  { value: 'series-b+', label: 'Series B+' },
  { value: 'bootstrapped', label: 'Bootstrapped' }
]

const teamSizes = [
  { value: 'solo', label: 'Solo' },
  { value: '2-5', label: '2-5' },
  { value: '6-15', label: '6-15' },
  { value: '16-50', label: '16-50' },
  { value: '50+', label: '50+' }
]

const goals = [
  'Better prioritization',
  'Decision support',
  'Competitor awareness',
  'Accountability',
  'Strategic clarity',
  'Meeting preparation'
]

export default function FounderOnboarding({ onComplete }: OnboardingProps) {
  const { user } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress || ''
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<OnboardingData>({
    company_name: '',
    company_stage: '',
    team_size: '',
    biggest_challenge: '',
    goals: []
  })

  const steps = [
    { title: 'Your Company', icon: Building },
    { title: 'Your Team', icon: Users },
    { title: 'Your Focus', icon: Target },
    { title: 'Ready', icon: Sparkles }
  ]

  const updateField = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  const toggleGoal = (goal: string) => {
    setData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }))
  }

  const canProgress = () => {
    switch (step) {
      case 0: return data.company_name.trim() && data.company_stage
      case 1: return data.team_size
      case 2: return data.goals.length > 0
      case 3: return true
      default: return false
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      // Backend expects email as query param and OnboardingData in body
      await axios.post(`${API_URL}/users/onboard?email=${encodeURIComponent(email)}`, {
        business_stage: data.company_stage || 'idea',
        primary_goal: data.goals || 'Building MVP',
        check_in_frequency: 'daily',
        accountability_style: 'balanced',
        key_metrics: ['Revenue', 'Users', 'Growth'],
        biggest_challenge: data.biggest_challenge || 'Not specified',
        work_style: 'focused',
        github_username: null,
        groq_api_key: null
      })
      onComplete(email)
    } catch (err) {
      console.error('Onboarding failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--color-bg-shell)' }}
    >
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'var(--color-accent-muted)' }}
          >
            <Sparkles className="w-6 h-6" style={{ color: 'var(--color-accent)' }} />
          </div>
          <h1 className="text-xl font-semibold">Welcome to Reflog</h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Let's set up your Executive Intelligence
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div
              key={i}
              className="flex items-center"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold"
                style={{
                  background: i <= step ? 'var(--color-accent)' : 'var(--color-bg-elevated)',
                  color: i <= step ? 'var(--color-bg-shell)' : 'var(--color-text-muted)',
                  border: '1px solid var(--color-border)'
                }}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className="w-8 h-0.5 mx-1"
                  style={{
                    background: i < step ? 'var(--color-accent)' : 'var(--color-border)'
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <motion.div
          className="card p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AnimatePresence mode="wait">
            {/* Step 0: Company */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <Building className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-accent)' }} />
                  <h2 className="text-lg font-semibold">Your Company</h2>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Tell us about your startup
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Company Name</label>
                  <input
                    type="text"
                    value={data.company_name}
                    onChange={(e) => updateField('company_name', e.target.value)}
                    placeholder="Acme Inc."
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Stage</label>
                  <div className="grid grid-cols-3 gap-2">
                    {stages.map(stage => (
                      <button
                        key={stage.value}
                        onClick={() => updateField('company_stage', stage.value)}
                        className="p-3 rounded-lg text-sm font-medium transition"
                        style={{
                          background: data.company_stage === stage.value
                            ? 'var(--color-accent-muted)'
                            : 'var(--color-bg-shell)',
                          border: `1px solid ${data.company_stage === stage.value
                            ? 'var(--color-accent)'
                            : 'var(--color-border)'}`,
                          color: data.company_stage === stage.value
                            ? 'var(--color-accent)'
                            : 'var(--color-text-secondary)'
                        }}
                      >
                        {stage.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 1: Team */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <Users className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-accent)' }} />
                  <h2 className="text-lg font-semibold">Your Team</h2>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    How big is your team?
                  </p>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {teamSizes.map(size => (
                    <button
                      key={size.value}
                      onClick={() => updateField('team_size', size.value)}
                      className="p-4 rounded-lg text-center transition"
                      style={{
                        background: data.team_size === size.value
                          ? 'var(--color-accent-muted)'
                          : 'var(--color-bg-shell)',
                        border: `1px solid ${data.team_size === size.value
                          ? 'var(--color-accent)'
                          : 'var(--color-border)'}`,
                        color: data.team_size === size.value
                          ? 'var(--color-accent)'
                          : 'var(--color-text-secondary)'
                      }}
                    >
                      <p className="text-lg font-bold">{size.label}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Focus */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <Target className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-accent)' }} />
                  <h2 className="text-lg font-semibold">Your Focus</h2>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    What do you want help with?
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {goals.map(goal => (
                    <button
                      key={goal}
                      onClick={() => toggleGoal(goal)}
                      className="p-3 rounded-lg text-sm font-medium text-left flex items-center gap-2 transition"
                      style={{
                        background: data.goals.includes(goal)
                          ? 'var(--color-accent-muted)'
                          : 'var(--color-bg-shell)',
                        border: `1px solid ${data.goals.includes(goal)
                          ? 'var(--color-accent)'
                          : 'var(--color-border)'}`,
                        color: data.goals.includes(goal)
                          ? 'var(--color-accent)'
                          : 'var(--color-text-secondary)'
                      }}
                    >
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center"
                        style={{
                          background: data.goals.includes(goal)
                            ? 'var(--color-accent)'
                            : 'transparent',
                          border: '1px solid var(--color-border)'
                        }}
                      >
                        {data.goals.includes(goal) && (
                          <Check className="w-3 h-3" style={{ color: 'var(--color-bg-shell)' }} />
                        )}
                      </div>
                      {goal}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Ready */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center py-4"
              >
                <div
                  className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                  style={{ background: 'var(--color-accent-muted)' }}
                >
                  <Sparkles className="w-8 h-8" style={{ color: 'var(--color-accent)' }} />
                </div>
                <h2 className="text-xl font-semibold mb-2">You're all set</h2>
                <p
                  className="text-sm mb-8"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Your Executive Intelligence is ready to operate.
                </p>

                <div
                  className="p-4 rounded-lg mb-8 text-left"
                  style={{
                    background: 'var(--color-bg-shell)',
                    border: '1px solid var(--color-border-subtle)'
                  }}
                >
                  <p className="text-sm font-medium mb-2">Quick summary:</p>
                  <ul className="text-sm space-y-1" style={{ color: 'var(--color-text-muted)' }}>
                    <li>• {data.company_name} ({data.company_stage})</li>
                    <li>• Team size: {data.team_size}</li>
                    <li>• Focus: {data.goals.slice(0, 2).join(', ')}</li>
                  </ul>
                </div>

                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="btn btn-primary w-full text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Launch Command Center
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          {step < 3 && (
            <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
              <button
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="btn btn-ghost disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProgress()}
                className="btn btn-primary disabled:opacity-40"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Rocket, Target, TrendingUp, Shield,
  ChevronRight, ChevronLeft, Check, Loader2, Sparkles,
  Github, AlertCircle, Zap, Users, DollarSign, Mail, Calendar
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface FounderOnboardingProps {
  onComplete: (email: string) => void
}

interface FormData {
  businessStage: string
  primaryGoal: string
  checkInFrequency: string
  accountabilityStyle: string
  keyMetrics: string[]
  biggestChallenge: string
  workStyle: string
  githubUsername: string
  enableEmailReminders: boolean
}

const businessStages = [
  { id: 'idea', label: 'Idea Stage', icon: '💡' },
  { id: 'building_mvp', label: 'Building MVP', icon: '🔨' },
  { id: 'early_revenue', label: 'Early Revenue (<$10K)', icon: '🌱' },
  { id: 'scaling', label: 'Scaling (>$10K)', icon: '🚀' },
  { id: 'established', label: 'Established', icon: '🏆' }
]

const accountabilityStyles = [
  { id: 'gentle', label: 'Supportive', icon: '🤝', desc: 'Gentle encouragement' },
  { id: 'balanced', label: 'Balanced', icon: '⚖️', desc: 'Direct but fair' },
  { id: 'intense', label: 'No BS', icon: '🔥', desc: 'Brutally honest' }
]

const availableMetrics = [
  { id: 'mrr', label: 'MRR', icon: DollarSign },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'runway', label: 'Runway', icon: Calendar },
  { id: 'growth_rate', label: 'Growth %', icon: TrendingUp }
]

const stepConfig = [
  { title: 'Your Business', subtitle: 'Quick setup' },
  { title: 'Accountability', subtitle: 'How we help' },
  { title: 'Final Details', subtitle: 'Almost done!' }
]

export default function FounderOnboarding({ onComplete }: FounderOnboardingProps) {
  const { user, isLoaded } = useUser()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [direction, setDirection] = useState(1)

  const [formData, setFormData] = useState<FormData>({
    businessStage: '',
    primaryGoal: '',
    checkInFrequency: 'daily',
    accountabilityStyle: 'balanced',
    keyMetrics: ['mrr', 'customers', 'runway'],
    biggestChallenge: '',
    workStyle: 'flexible',
    githubUsername: '',
    enableEmailReminders: true
  })

  const handleSubmit = async () => {
    const email = user?.emailAddresses[0]?.emailAddress
    const fullName = user?.fullName

    if (!email) {
      setError('Could not get user email. Please try logging in again.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `${API_URL}/users/onboard?email=${encodeURIComponent(email)}&full_name=${encodeURIComponent(fullName || 'User')}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            business_stage: formData.businessStage,
            primary_goal: formData.primaryGoal,
            check_in_frequency: formData.checkInFrequency,
            accountability_style: formData.accountabilityStyle,
            key_metrics: formData.keyMetrics,
            biggest_challenge: formData.biggestChallenge,
            work_style: formData.workStyle,
            github_username: formData.githubUsername || null,
            enable_email_reminders: formData.enableEmailReminders
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to complete onboarding')
      }

      onComplete(email)
    } catch (err: any) {
      setError(err.message || 'Failed to complete setup. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const validateCurrentStep = useCallback(() => {
    switch (step) {
      case 1: return formData.businessStage !== '' && formData.primaryGoal.length >= 5
      case 2: return formData.accountabilityStyle !== ''
      case 3: return true
      default: return true
    }
  }, [step, formData])

  const toggleMetric = (metricId: string) => {
    setFormData(prev => ({
      ...prev,
      keyMetrics: prev.keyMetrics.includes(metricId)
        ? prev.keyMetrics.filter(m => m !== metricId)
        : [...prev.keyMetrics, metricId]
    }))
  }

  const nextStep = () => {
    if (validateCurrentStep()) {
      setDirection(1)
      setStep(prev => Math.min(prev + 1, 3))
      setError('')
    }
  }

  const prevStep = () => {
    setDirection(-1)
    setStep(prev => Math.max(prev - 1, 1))
    setError('')
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && validateCurrentStep()) {
        if (step < 3) nextStep()
        else if (!loading) handleSubmit()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [step, formData, loading, validateCurrentStep])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#933DC9] animate-spin" />
      </div>
    )
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 })
  }

  return (
    <div className="min-h-screen bg-[#000000] text-[#FBFAEE] flex items-center justify-center p-4">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#933DC9]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[#53118F]/15 rounded-full blur-[80px]" />
      </div>

      <div className="max-w-xl w-full relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center space-x-2 mb-2">
            <div className="bg-gradient-to-br from-[#933DC9] to-[#53118F] p-2 rounded-xl">
              <Rocket className="w-6 h-6 text-[#FBFAEE]" />
            </div>
            <h1 className="text-2xl font-bold">Welcome to Reflog</h1>
          </div>
          <p className="text-[#FBFAEE]/60 text-sm">
            {user?.firstName ? `Hey ${user.firstName}! Quick 3-step setup.` : '3-step setup to get started.'}
          </p>
        </motion.div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${s < step ? 'bg-green-500' : s === step ? 'bg-gradient-to-br from-[#933DC9] to-[#53118F]' : 'bg-[#242424]'
                }`}>
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 ${s < step ? 'bg-green-500' : 'bg-[#242424]'}`} />}
            </div>
          ))}
        </div>

        {/* Main Card */}
        <motion.div
          className="bg-[#242424]/90 backdrop-blur-xl border border-[#242424] rounded-2xl shadow-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="p-5 border-b border-[#242424]">
            <h2 className="text-xl font-bold">{stepConfig[step - 1].title}</h2>
            <p className="text-[#FBFAEE]/50 text-sm">{stepConfig[step - 1].subtitle}</p>
          </div>

          <div className="p-5 min-h-[280px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.15 }}
              >
                {/* Step 1: Business Stage + Goal */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-[#FBFAEE]/70 mb-2">What stage are you at?</label>
                      <div className="flex flex-wrap gap-2">
                        {businessStages.map((stage) => (
                          <button
                            key={stage.id}
                            onClick={() => setFormData({ ...formData, businessStage: stage.id })}
                            className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 transition ${formData.businessStage === stage.id
                                ? 'bg-[#933DC9]/20 border-[#933DC9] border'
                                : 'bg-[#000000]/40 border-[#242424] border hover:border-[#933DC9]/50'
                              }`}
                          >
                            <span>{stage.icon}</span>
                            <span>{stage.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-[#FBFAEE]/70 mb-2">What's your main goal?</label>
                      <textarea
                        value={formData.primaryGoal}
                        onChange={(e) => setFormData({ ...formData, primaryGoal: e.target.value })}
                        placeholder="e.g., Reach $10K MRR by March"
                        className="w-full px-4 py-3 bg-[#000000]/50 border border-[#242424] rounded-xl text-[#FBFAEE] placeholder-[#FBFAEE]/30 focus:ring-2 focus:ring-[#933DC9] focus:border-[#933DC9] resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Accountability + Metrics */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-[#FBFAEE]/70 mb-2">How should we hold you accountable?</label>
                      <div className="space-y-2">
                        {accountabilityStyles.map((style) => (
                          <button
                            key={style.id}
                            onClick={() => setFormData({ ...formData, accountabilityStyle: style.id })}
                            className={`w-full p-3 rounded-xl flex items-center justify-between transition ${formData.accountabilityStyle === style.id
                                ? 'bg-[#933DC9]/15 border-[#933DC9] border'
                                : 'bg-[#000000]/40 border-[#242424] border hover:border-[#933DC9]/50'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{style.icon}</span>
                              <div className="text-left">
                                <div className="font-medium">{style.label}</div>
                                <div className="text-xs text-[#FBFAEE]/50">{style.desc}</div>
                              </div>
                            </div>
                            {formData.accountabilityStyle === style.id && <Check className="w-5 h-5 text-green-400" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-[#FBFAEE]/70 mb-2">Which metrics matter?</label>
                      <div className="flex flex-wrap gap-2">
                        {availableMetrics.map((m) => {
                          const Icon = m.icon
                          const selected = formData.keyMetrics.includes(m.id)
                          return (
                            <button
                              key={m.id}
                              onClick={() => toggleMetric(m.id)}
                              className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 transition ${selected
                                  ? 'bg-[#933DC9]/20 border-[#933DC9] border'
                                  : 'bg-[#000000]/40 border-[#242424] border hover:border-[#933DC9]/50'
                                }`}
                            >
                              <Icon className="w-4 h-4" />
                              <span>{m.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Final Details */}
                {step === 3 && (
                  <div className="space-y-4">
                    {/* Email Toggle */}
                    <div
                      className={`p-4 rounded-xl border cursor-pointer transition ${formData.enableEmailReminders
                          ? 'bg-[#933DC9]/10 border-[#933DC9]/50'
                          : 'bg-[#000000]/40 border-[#242424]'
                        }`}
                      onClick={() => setFormData({ ...formData, enableEmailReminders: !formData.enableEmailReminders })}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Mail className={`w-5 h-5 ${formData.enableEmailReminders ? 'text-[#C488F8]' : 'text-[#FBFAEE]/50'}`} />
                          <div>
                            <div className="font-medium text-sm">Daily email reminders</div>
                            <div className="text-xs text-[#FBFAEE]/50">Morning check-in + evening review</div>
                          </div>
                        </div>
                        <div className={`w-10 h-6 rounded-full p-0.5 transition ${formData.enableEmailReminders ? 'bg-[#933DC9]' : 'bg-[#242424]'}`}>
                          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${formData.enableEmailReminders ? 'translate-x-4' : ''}`} />
                        </div>
                      </div>
                    </div>

                    {/* GitHub (Optional) */}
                    <div className="p-4 rounded-xl border border-[#242424] bg-[#000000]/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Github className="w-4 h-4 text-[#FBFAEE]/60" />
                        <span className="text-sm text-[#FBFAEE]/70">GitHub <span className="text-xs text-[#FBFAEE]/40">(optional)</span></span>
                      </div>
                      <input
                        type="text"
                        value={formData.githubUsername}
                        onChange={(e) => setFormData({ ...formData, githubUsername: e.target.value })}
                        placeholder="username"
                        className="w-full px-3 py-2 bg-[#000000]/50 border border-[#242424] rounded-lg text-sm text-[#FBFAEE] placeholder-[#FBFAEE]/30 focus:ring-1 focus:ring-[#933DC9]"
                      />
                    </div>

                    {/* Ready Message */}
                    <div className="bg-gradient-to-r from-[#933DC9]/10 to-[#53118F]/10 border border-[#933DC9]/20 rounded-xl p-4 flex items-start gap-3">
                      <Zap className="w-5 h-5 text-[#C488F8] flex-shrink-0" />
                      <p className="text-sm text-[#FBFAEE]/80">
                        Your AI advisory board is ready. Start with your first Reality Check.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Error */}
            {error && (
              <motion.div
                className="mt-4 p-3 bg-red-900/30 border border-red-500/40 rounded-lg flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-red-300 text-sm">{error}</p>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-[#242424] flex items-center justify-between">
            {step > 1 ? (
              <button onClick={prevStep} className="flex items-center gap-1 px-4 py-2 text-sm text-[#FBFAEE]/70 hover:text-[#FBFAEE] transition">
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                onClick={nextStep}
                disabled={!validateCurrentStep()}
                className="flex items-center gap-1 px-5 py-2.5 bg-gradient-to-r from-[#933DC9] to-[#53118F] text-white rounded-lg font-medium text-sm disabled:opacity-40 shadow-lg shadow-purple-900/20"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-1 px-6 py-2.5 bg-gradient-to-r from-[#933DC9] to-[#53118F] text-white rounded-lg font-medium text-sm disabled:opacity-60 shadow-lg shadow-purple-900/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Get Started
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>

        <p className="text-center text-xs text-[#FBFAEE]/30 mt-3">
          Press <kbd className="px-1 py-0.5 bg-[#242424] rounded text-[#FBFAEE]/50">Enter</kbd> to continue
        </p>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Calendar, Target, Brain, Users, FileText, Zap } from 'lucide-react'

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Redirect signed-in users to dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/founder')
    }
  }, [isLoaded, isSignedIn, router])

  // Show loading while checking auth
  if (!isLoaded || isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#012731' }}>
        <div className="text-center">
          <Image src="/logo.png" alt="Reflog" width={48} height={48} className="mx-auto animate-pulse" />
        </div>
      </div>
    )
  }

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setSubmitting(true)

    // Submit to Google Forms
    const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSdZZIkT6Pylj0oQYydNIOXVZ9a_Cuu6lwLIrb1EoamdopFlRQ/formResponse'
    const formData = new FormData()
    formData.append('entry.1249127030', email)

    try {
      await fetch(formUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
      })
      setSubmitted(true)
      setEmail('')
    } catch (error) {
      console.error('Waitlist error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const features = [
    { icon: Brain, title: 'Executive Intelligence', desc: 'AI-powered daily briefs and decision support' },
    { icon: Target, title: 'Commitment Tracking', desc: 'One commitment per day. Ship, not plan.' },
    { icon: Calendar, title: 'Meeting Intelligence', desc: 'Pre-meeting prep and action extraction' },
    { icon: Zap, title: 'Pattern Recognition', desc: 'Surface blockers before they derail you' },
    { icon: Users, title: 'Delegation Support', desc: 'Every action has an owner and deadline' },
    { icon: FileText, title: 'Decision Journal', desc: 'Build a playbook of founder wisdom' }
  ]

  return (
    <div className="min-h-screen" style={{ background: '#012731' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl" style={{
        background: 'rgba(1, 39, 49, 0.8)',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Reflog" width={36} height={36} className="object-contain" />
            <span className="text-xl font-bold text-white">Reflog</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="px-5 py-2.5 text-sm font-medium text-white/70 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-5 py-2.5 text-sm font-medium rounded-lg transition"
              style={{
                background: 'rgba(241, 179, 147, 0.15)',
                border: '1px solid rgba(241, 179, 147, 0.3)',
                color: '#F1B393'
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Abstract Background Shape */}
        <div className="absolute top-0 right-0 w-[60%] h-full pointer-events-none">
          <Image
            src="/abstract-hero.png"
            alt=""
            fill
            className="object-contain object-right"
            priority
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          {/* MVP Commitment Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{
              background: 'rgba(70, 155, 167, 0.15)',
              border: '1px solid rgba(70, 155, 167, 0.3)'
            }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#469BA7' }} />
            <span className="text-sm" style={{ color: '#469BA7' }}>
              🚀 Building in Public — 2025 MVP Commitment
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6 max-w-4xl"
            style={{
              fontFamily: "var(--font-display)",
              color: '#F1F3F9',
              lineHeight: 1.1
            }}
          >
            Stop Managing.
            <br />
            <span style={{ color: '#F1B393' }}>Start Executing.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl mb-10 max-w-2xl"
            style={{ color: '#469BA7', lineHeight: 1.6 }}
          >
            Your AI Chief of Staff. Daily briefs, meeting intelligence, action tracking.
            The operational backbone that lets founders focus on building.
          </motion.p>

          {/* Waitlist Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {submitted ? (
              <div className="inline-flex items-center gap-3 px-6 py-4 rounded-xl" style={{
                background: 'rgba(70, 155, 167, 0.15)',
                border: '1px solid rgba(70, 155, 167, 0.3)'
              }}>
                <Check className="w-5 h-5" style={{ color: '#469BA7' }} />
                <span style={{ color: '#469BA7' }}>You're on the list! Check your email.</span>
              </div>
            ) : (
              <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-3 max-w-lg">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 px-5 py-4 rounded-xl text-base outline-none transition"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#F1F3F9'
                  }}
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-4 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #F1B393 0%, #e8a07f 100%)',
                    color: '#012731',
                    boxShadow: '0 4px 20px rgba(241, 179, 147, 0.3)'
                  }}
                >
                  {submitting ? 'Joining...' : 'Join Waitlist'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
            <p className="mt-4 text-sm" style={{ color: 'rgba(70, 155, 167, 0.7)' }}>
              Join 500+ founders getting early access. Free for early users.
            </p>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-6 mt-12"
          >
            {['Free for early users', 'No credit card required', 'Works with your calendar'].map((text, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check className="w-4 h-4" style={{ color: '#469BA7' }} />
                <span className="text-sm" style={{ color: '#DBD0A8' }}>{text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* MVP Disclaimer Banner */}
      <section className="py-6" style={{
        background: 'rgba(241, 179, 147, 0.08)',
        borderTop: '1px solid rgba(241, 179, 147, 0.15)',
        borderBottom: '1px solid rgba(241, 179, 147, 0.15)'
      }}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm md:text-base" style={{ color: '#F1B393' }}>
            <strong>🎯 Our 2025 Commitment:</strong> We're actively building Reflog.
            Join the waitlist to get early access when the MVP launches. This is our public commitment to ship.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24" style={{ background: '#005765' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span
              className="inline-block px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider mb-4"
              style={{
                background: 'rgba(241, 179, 147, 0.15)',
                border: '1px solid rgba(241, 179, 147, 0.3)',
                color: '#F1B393'
              }}
            >
              Our Vision
            </span>
            <h2
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{
                fontFamily: "var(--font-display)",
                color: '#F1F3F9'
              }}
            >
              Everything a Founder Needs
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: '#469BA7' }}>
              A single system for commitments, meetings, decisions, and accountability.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl transition hover:scale-[1.02]"
                style={{
                  background: 'rgba(1, 39, 49, 0.5)',
                  border: '1px solid rgba(70, 155, 167, 0.2)'
                }}
              >
                <feature.icon className="w-10 h-10 mb-4" style={{ color: '#F1B393' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#F1F3F9' }}>
                  {feature.title}
                </h3>
                <p className="text-sm" style={{ color: '#469BA7' }}>
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24" style={{ background: '#012731' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{
              fontFamily: "var(--font-display)",
              color: '#F1F3F9'
            }}
          >
            Ready to Execute?
          </h2>
          <p className="text-lg mb-10" style={{ color: '#469BA7' }}>
            Join the waitlist and be first to experience the future of founder productivity.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition"
            style={{
              background: 'linear-gradient(135deg, #F1B393 0%, #e8a07f 100%)',
              color: '#012731',
              boxShadow: '0 4px 20px rgba(241, 179, 147, 0.3)'
            }}
          >
            Get Early Access
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12" style={{
        background: '#012731',
        borderTop: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Reflog" width={28} height={28} className="object-contain" />
              <span className="font-semibold text-white">Reflog</span>
            </div>
            <div className="flex gap-8">
              <Link href="/privacy" className="text-sm transition" style={{ color: '#469BA7' }}>
                Privacy
              </Link>
              <Link href="/terms" className="text-sm transition" style={{ color: '#469BA7' }}>
                Terms
              </Link>
            </div>
          </div>
          <div className="text-center mt-8">
            <p className="text-sm" style={{ color: 'rgba(70, 155, 167, 0.6)' }}>
              © {new Date().getFullYear()} Reflog. Built with 🧠 for founders who ship.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
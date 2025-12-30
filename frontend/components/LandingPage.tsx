'use client'

import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import {
  Sparkles, Brain, Target, Calendar,
  TrendingUp, Shield, Zap, ChevronRight,
  Check, MessageSquare
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--color-bg-shell)', minHeight: '100vh' }}>
      {/* Navigation */}
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(1, 39, 49, 0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--color-border)'
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Reflog"
                className="w-8 h-8 object-contain"
              />
              <span className="text-lg font-semibold">Reflog</span>
            </div>

            <div className="flex items-center gap-3">
              <SignInButton mode="modal">
                <button className="btn btn-ghost">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="btn btn-primary">Get Started</button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </nav>

      {/* Ambient Background Layer */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Deep Abstract Blob - Top Left */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 30, 0],
            y: [0, -30, 0]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full mix-blend-screen filter blur-[100px]"
          style={{
            background: 'radial-gradient(circle, var(--color-abyssal) 0%, transparent 70%)',
            opacity: 0.4
          }}
        />

        {/* Accent Highlight - Center Right */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -50, 0],
            y: [0, 50, 0]
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute top-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full mix-blend-screen filter blur-[120px]"
          style={{
            background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)',
            opacity: 0.3
          }}
        />

        {/* Warm Glow - Bottom Left (Subtle) */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
          className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] rounded-full mix-blend-screen filter blur-[150px]"
          style={{
            background: 'radial-gradient(circle, rgba(241, 179, 147, 0.4) 0%, transparent 70%)', // Apricot Spring
            opacity: 0.2
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-8"
              style={{
                background: 'var(--color-accent-bg)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-accent)'
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Executive Intelligence
            </div>

            {/* Headline */}
            <h1
              className="text-4xl md:text-6xl font-bold leading-tight mb-6"
              style={{ letterSpacing: '-0.02em' }}
            >
              Your competitive edge.
              <br />
              <span style={{ color: 'var(--color-accent)' }}>
                Operated by AI.
              </span>
            </h1>

            {/* Subheadline */}
            <p
              className="text-lg md:text-xl max-w-2xl mx-auto mb-10"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Strategic intelligence, competitor tracking, and decision support.
              Not a chatbot—an operator that runs alongside you.
            </p>

            {/* CTAs */}
            <div className="flex items-center justify-center gap-4">
              <SignUpButton mode="modal">
                <button className="btn btn-primary text-base px-8 py-3">
                  Start Free
                  <ChevronRight className="w-4 h-4" />
                </button>
              </SignUpButton>
              <button
                className="btn btn-secondary text-base px-6 py-3"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                See how it works
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Preview Section */}
      <section className="relative z-10 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="card p-2"
            style={{
              boxShadow: '0 20px 60px rgba(1, 39, 49, 0.5)',
              border: '1px solid var(--color-border)'
            }}
          >
            <div
              className="rounded-lg p-8"
              style={{ background: 'var(--color-bg-card)' }}
            >
              {/* Mock Dashboard Preview */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo.png"
                    alt="Reflog"
                    className="w-10 h-10 object-contain"
                  />
                  <div>
                    <p className="font-semibold">Good morning</p>
                    <p
                      className="text-xs"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      3 priorities • 2 decisions needed
                    </p>
                  </div>
                </div>
                <div className="badge badge-accent">
                  <Zap className="w-3 h-3 mr-1" />
                  5 actions pending
                </div>
              </div>

              {/* Mock Priority Items */}
              <div className="space-y-3">
                {[
                  'Review competitor pricing changes from yesterday',
                  'Prepare for investor call at 2pm',
                  'Decision needed: Expand to EU market or focus US'
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-4 rounded-lg"
                    style={{
                      background: 'var(--color-bg-shell)',
                      border: '1px solid var(--color-border-subtle)'
                    }}
                  >
                    <span
                      className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
                      style={{
                        background: 'var(--color-accent-muted)',
                        color: 'var(--color-accent)'
                      }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              What Reflog handles
            </h2>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Strategic operations that compound over time
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: 'Daily Intelligence',
                description: 'Morning briefs with priorities, decisions needed, and strategic context. No more wondering what to focus on.'
              },
              {
                icon: TrendingUp,
                title: 'Competitor Tracking',
                description: 'Monitor competitor moves, pricing changes, and market shifts. Stay informed without the noise.'
              },
              {
                icon: Target,
                title: 'Commitment Tracking',
                description: 'Track what you said you\'d do. Get honest feedback on execution patterns and accountability.'
              },
              {
                icon: Calendar,
                title: 'Meeting Intelligence',
                description: 'Pre-meeting briefs and post-meeting action extraction. Never go into a meeting unprepared.'
              },
              {
                icon: MessageSquare,
                title: 'Strategic Advisor',
                description: 'On-demand advice that considers your context, history, and patterns. Not generic chatbot responses.'
              },
              {
                icon: Shield,
                title: 'Decision Support',
                description: 'Framework-based decision analysis when you face hard choices. Think clearly under pressure.'
              }
            ].map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="card p-6 card-hover"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                    style={{ background: 'var(--color-accent-muted)' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {feature.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section
        className="relative z-10 py-20 px-6"
        style={{ borderTop: '1px solid var(--color-border-subtle)' }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Built different
          </h2>
          <div
            className="text-lg leading-relaxed space-y-4"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <p>
              Most AI tools feel like talking to a search engine.
              Reflog is designed to be your strategic partner.
            </p>
            <p>
              It doesn't just answer questions—it <em>operates</em>.
              It tracks your commitments, surfaces what matters,
              and holds you accountable to what you said you'd do.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-6">
        <div
          className="max-w-4xl mx-auto card p-12 text-center"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)'
          }}
        >
          <h2 className="text-3xl font-bold mb-4">
            Ready for Executive Intelligence?
          </h2>
          <p
            className="text-lg mb-8"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Start free. No credit card required.
          </p>
          <SignUpButton mode="modal">
            <button className="btn btn-primary text-lg px-10 py-4">
              Get Started
              <ChevronRight className="w-5 h-5" />
            </button>
          </SignUpButton>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="relative z-10 py-8 px-6"
        style={{ borderTop: '1px solid var(--color-border-subtle)' }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Reflog"
              className="w-5 h-5 object-contain"
            />
            <span className="text-sm font-medium">Reflog</span>
          </div>
          <p
            className="text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            © 2024 Reflog. Executive Intelligence for founders.
          </p>
        </div>
      </footer>
    </div>
  )
}
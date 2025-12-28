import { SignUp } from '@clerk/nextjs'
import { Sparkles, Check } from 'lucide-react'
import Link from 'next/link'

export default function SignUpPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--color-bg-shell)' }}
    >
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Benefits */}
        <div className="hidden lg:block">
          <Link href="/" className="flex items-center gap-3 mb-8">
            <div
              className="p-2.5 rounded-lg"
              style={{
                background: 'var(--color-accent-muted)',
                border: '1px solid var(--color-border)'
              }}
            >
              <Sparkles className="w-6 h-6" style={{ color: 'var(--color-accent)' }} />
            </div>
            <span className="text-xl font-semibold">Reflog</span>
          </Link>

          <h1 className="text-3xl lg:text-4xl font-bold mb-6">
            Your Executive Intelligence.
            <br />
            <span style={{ color: 'var(--color-accent)' }}>
              Operates alongside you.
            </span>
          </h1>

          <p
            className="text-lg mb-8"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Strategic intelligence, competitor tracking, and decision support for founders who execute.
          </p>

          <div className="space-y-3">
            {[
              'Daily briefs with AI-powered priorities',
              'Competitor intelligence and market tracking',
              'Strategic decision support and honest feedback',
              'Commitment tracking that holds you accountable'
            ].map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <Check
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  style={{ color: 'var(--color-accent)' }}
                />
                <span style={{ color: 'var(--color-text-secondary)' }}>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Sign Up Form */}
        <div className="w-full">
          {/* Mobile Logo */}
          <Link href="/" className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div
              className="p-2.5 rounded-lg"
              style={{
                background: 'var(--color-accent-muted)',
                border: '1px solid var(--color-border)'
              }}
            >
              <Sparkles className="w-6 h-6" style={{ color: 'var(--color-accent)' }} />
            </div>
            <span className="text-xl font-semibold">Reflog</span>
          </Link>

          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl font-bold mb-2">Create your account</h2>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Start free. No credit card required.
            </p>
          </div>

          <div className="flex justify-center lg:justify-start">
            <SignUp
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-[#023542] border border-[rgba(70,155,167,0.2)] shadow-xl rounded-xl",
                  headerTitle: "text-[#F1F3F9]",
                  headerSubtitle: "text-[rgba(241,243,249,0.5)]",
                  socialButtonsBlockButton: "bg-[#012731] border-[rgba(70,155,167,0.2)] text-[#F1F3F9] hover:bg-[#034654]",
                  socialButtonsBlockButtonText: "text-[#F1F3F9]",
                  formButtonPrimary: "bg-[#469BA7] text-[#012731] hover:bg-[#3d8a95]",
                  formFieldInput: "bg-[#012731] border-[rgba(70,155,167,0.2)] text-[#F1F3F9] placeholder-[rgba(241,243,249,0.3)]",
                  formFieldLabel: "text-[rgba(241,243,249,0.8)]",
                  footerActionLink: "text-[#469BA7] hover:text-[#5aa8b3]",
                  identityPreviewText: "text-[#F1F3F9]",
                  identityPreviewEditButton: "text-[#469BA7]",
                  formFieldSuccessText: "text-[#469BA7]"
                }
              }}
              routing="path"
              path="/sign-up"
              signInUrl="/sign-in"
            />
          </div>

          <div className="mt-8 text-center lg:text-left">
            <p
              className="text-sm"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Already have an account?{' '}
              <Link
                href="/sign-in"
                className="font-medium"
                style={{ color: 'var(--color-accent)' }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
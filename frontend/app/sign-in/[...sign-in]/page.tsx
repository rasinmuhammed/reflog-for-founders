import { SignIn } from '@clerk/nextjs'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function SignInPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--color-bg-shell)' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
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

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Sign in to Reflog
          </p>
        </div>

        <div className="flex justify-center">
          <SignIn
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
                identityPreviewEditButton: "text-[#469BA7]"
              }
            }}
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
          />
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Don't have an account?{' '}
            <Link
              href="/sign-up"
              className="font-medium"
              style={{ color: 'var(--color-accent)' }}
            >
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
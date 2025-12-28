'use client'

import { useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import CommandCenter from '../components/CommandCenter'
import FounderOnboarding from '../components/FounderOnboarding'
import LandingPage from '../components/LandingPage'
import { Brain } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Home() {
  const { isSignedIn, isLoaded, user } = useUser()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [isOnboarded, setIsOnboarded] = useState(false)
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const email = user.emailAddresses?.[0]?.emailAddress
      if (email) {
        setUserEmail(email)
        setUserName(user.firstName || null)
        checkOnboardingStatus(email)
      } else {
        setCheckingOnboarding(false)
      }
    } else if (isLoaded) {
      setCheckingOnboarding(false)
    }
  }, [isLoaded, isSignedIn, user])

  const checkOnboardingStatus = async (email: string) => {
    try {
      const response = await fetch(`${API_URL}/users/by-email/${encodeURIComponent(email)}`)

      if (response.ok) {
        const userData = await response.json()
        setIsOnboarded(userData.onboarding_complete === true)
      } else if (response.status === 404) {
        setIsOnboarded(false)
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error)
      setIsOnboarded(false)
    } finally {
      setCheckingOnboarding(false)
    }
  }

  const handleOnboardingComplete = async (email: string) => {
    await user?.update({
      unsafeMetadata: {
        ...user.unsafeMetadata,
        onboardingCompleted: true,
        onboardingDate: new Date().toISOString()
      }
    })

    setUserEmail(email)
    setIsOnboarded(true)
  }

  // Loading state
  if (!isLoaded || checkingOnboarding) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-bg-shell)' }}
      >
        <div className="text-center animate-fadeIn">
          <div
            className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'var(--color-accent-muted)' }}
          >
            <Brain
              className="w-6 h-6 animate-pulse"
              style={{ color: 'var(--color-accent)' }}
            />
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Initializing Reflog...
          </p>
        </div>
      </div>
    )
  }

  // Landing page for non-authenticated users
  if (!isSignedIn) {
    return <LandingPage />
  }

  // Onboarding for new users
  if (!isOnboarded) {
    return (
      <main style={{ background: 'var(--color-bg-shell)', minHeight: '100vh' }}>
        <FounderOnboarding onComplete={handleOnboardingComplete} />
      </main>
    )
  }

  // Command Center for onboarded users
  return (
    <CommandCenter
      userEmail={userEmail!}
      userName={userName || undefined}
    />
  )
}
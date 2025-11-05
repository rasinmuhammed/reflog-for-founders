'use client'

import { useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import Dashboard from '../components/Dashboard'
import FounderOnboarding from '../components/FounderOnboarding'
import LandingPage from '../components/LandingPage'
import { Loader2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Home() {
  const { isSignedIn, isLoaded, user } = useUser()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isOnboarded, setIsOnboarded] = useState(false)
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const email = user.emailAddresses?.[0]?.emailAddress
      if (email) {
        setUserEmail(email)
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
      // Check if user exists and is onboarded
      const response = await fetch(`${API_URL}/users/by-email/${encodeURIComponent(email)}`)
      
      if (response.ok) {
        const userData = await response.json()
        setIsOnboarded(userData.onboarding_complete === true)
      } else if (response.status === 404) {
        // User doesn't exist yet, needs onboarding
        setIsOnboarded(false)
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error)
      // On error, assume not onboarded
      setIsOnboarded(false)
    } finally {
      setCheckingOnboarding(false)
    }
  }

  const handleOnboardingComplete = async (email: string) => {
    // Update Clerk metadata
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

  // Show loading state while checking authentication
  if (!isLoaded || checkingOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Show landing page if not signed in
  if (!isSignedIn) {
    return <LandingPage />
  }

  // Show onboarding if signed in but not onboarded
  if (!isOnboarded) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <FounderOnboarding onComplete={handleOnboardingComplete} />
      </main>
    )
  }

  // Show dashboard if fully onboarded
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Dashboard userIdentifier={userEmail!} />
    </main>
  )
}
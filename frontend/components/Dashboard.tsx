'use client'

import React, { useState, Suspense, lazy } from 'react'
import DashboardLayout from './layout/DashboardLayout'
import DashboardOverview from './DashboardOverview'
import { Brain } from 'lucide-react'

// Lazy load feature components for performance
// Lazy load feature components for performance
const Chat = lazy(() => import('./Chat'))
const WeeklyReview = lazy(() => import('./WeeklyReview'))
const MeetingWorkflow = lazy(() => import('./MeetingWorkflow'))
const ActionTracker = lazy(() => import('./ActionTracker'))
const QuickCheckin = lazy(() => import('./QuickCheckin'))
const Settings = lazy(() => import('./Settings'))
const CommandBrief = lazy(() => import('./CommandBrief'))
const PivotSimulator = lazy(() => import('./PivotSimulator'))

// Loading skeleton using existing palette
const LoadingSkeleton = () => (
  <div
    className="w-full h-80 rounded-xl animate-pulse"
    style={{
      background: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border-subtle)'
    }}
  />
)

interface DashboardProps {
  userIdentifier: string
}

type ViewType = 'overview' | 'brief' | 'meetings' | 'actions' | 'chat' | 'review' | 'checkin' | 'simulator'

export default function Dashboard({ userIdentifier }: DashboardProps) {
  const [activeView, setActiveView] = useState<ViewType>('overview')
  const [showSettings, setShowSettings] = useState(false)
  const [showCheckin, setShowCheckin] = useState(false)

  const handleViewChange = (view: string) => {
    if (view === 'checkin') {
      setShowCheckin(true)
      return
    }
    setActiveView(view as ViewType)
  }

  const renderView = () => {
    switch (activeView) {
      case 'overview':
        return (
          <DashboardOverview
            userIdentifier={userIdentifier}
            onNavigate={handleViewChange}
          />
        )

      case 'brief':
        return (
          <Suspense fallback={<LoadingSkeleton />}>
            <CommandBrief userEmail={userIdentifier} />
          </Suspense>
        )

      case 'simulator':
        return (
          <Suspense fallback={<LoadingSkeleton />}>
            <PivotSimulator userIdentifier={userIdentifier} />
          </Suspense>
        )

      case 'meetings':
        return (
          <Suspense fallback={<LoadingSkeleton />}>
            <MeetingWorkflow userEmail={userIdentifier} />
          </Suspense>
        )

      case 'actions':
        return (
          <Suspense fallback={<LoadingSkeleton />}>
            <ActionTracker userEmail={userIdentifier} />
          </Suspense>
        )

      case 'chat':
        return (
          <Suspense fallback={<LoadingSkeleton />}>
            <Chat userIdentifier={userIdentifier} />
          </Suspense>
        )

      case 'review':
        return (
          <Suspense fallback={<LoadingSkeleton />}>
            <WeeklyReview userIdentifier={userIdentifier} />
          </Suspense>
        )

      default:
        return (
          <DashboardOverview
            userIdentifier={userIdentifier}
            onNavigate={handleViewChange}
          />
        )
    }
  }

  return (
    <>
      <DashboardLayout
        activeView={activeView}
        onViewChange={handleViewChange}
        onSettingsClick={() => setShowSettings(true)}
      >
        {renderView()}
      </DashboardLayout>

      {/* Settings Modal */}
      {showSettings && (
        <Suspense fallback={null}>
          <Settings
            userEmail={userIdentifier}
            onClose={() => setShowSettings(false)}
          />
        </Suspense>
      )}

      {/* Quick Checkin Modal */}
      {showCheckin && (
        <Suspense fallback={null}>
          <QuickCheckin
            userIdentifier={userIdentifier}
            onComplete={() => {
              setShowCheckin(false)
              // Optionally refresh the overview
            }}
            onClose={() => setShowCheckin(false)}
          />
        </Suspense>
      )}
    </>
  )
}
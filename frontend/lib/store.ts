import { create } from 'zustand'

interface UIState {
    isSidebarOpen: boolean
    toggleSidebar: () => void
    closeSidebar: () => void
}

export const useUIStore = create<UIState>((set) => ({
    isSidebarOpen: true, // Default open on desktop
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    closeSidebar: () => set({ isSidebarOpen: false }),
}))

interface UserProfile {
    id: number
    email: string
    full_name: string | null
    github_username: string | null
    onboarding_complete: boolean
    business_stage: string | null
    primary_goal: string | null
    has_groq_key: boolean
}

interface UserState {
    profile: UserProfile | null
    setProfile: (profile: UserProfile) => void
    clearProfile: () => void
}

export const useUserStore = create<UserState>((set) => ({
    profile: null,
    setProfile: (profile) => set({ profile }),
    clearProfile: () => set({ profile: null }),
}))

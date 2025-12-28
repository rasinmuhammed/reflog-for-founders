'use client'

import { Brain } from 'lucide-react'

export default function PrivacyPage() {
    return (
        <div className="min-h-screen" style={{ background: 'var(--color-bg-shell)' }}>
            {/* Header */}
            <header className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <div className="max-w-4xl mx-auto flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'var(--color-accent-muted)' }}
                    >
                        <Brain className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                    </div>
                    <span className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        Reflog
                    </span>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <h1
                    className="text-3xl font-bold mb-8"
                    style={{ color: 'var(--color-text-primary)' }}
                >
                    Privacy Policy
                </h1>

                <div className="prose prose-invert" style={{ color: 'var(--color-text-secondary)' }}>
                    <p className="text-lg mb-6">
                        Last updated: December 28, 2025
                    </p>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                            1. Information We Collect
                        </h2>
                        <p className="mb-4">We collect information you provide directly:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Account Information:</strong> Email, name, and profile data via Clerk authentication</li>
                            <li><strong>Business Data:</strong> Company name, stage, team size, and metrics you input</li>
                            <li><strong>Usage Data:</strong> Check-ins, meetings, decisions, and AI interactions</li>
                            <li><strong>API Keys:</strong> Third-party API keys you provide (encrypted at rest)</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                            2. How We Use Your Information
                        </h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>To provide and improve the Reflog service</li>
                            <li>To generate AI-powered insights and recommendations</li>
                            <li>To track your progress and provide accountability features</li>
                            <li>To communicate with you about service updates</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                            3. Data Storage & Security
                        </h2>
                        <p className="mb-4">
                            We take security seriously:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Data is stored in secure PostgreSQL databases (Neon)</li>
                            <li>API keys are encrypted using industry-standard encryption</li>
                            <li>Authentication is handled by Clerk with industry best practices</li>
                            <li>HTTPS encryption for all data in transit</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                            4. Third-Party Services
                        </h2>
                        <p className="mb-4">We use the following third-party services:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Clerk:</strong> Authentication and user management</li>
                            <li><strong>Groq/OpenAI:</strong> AI/LLM providers (using keys you provide)</li>
                            <li><strong>Neon:</strong> Database hosting</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                            5. Your Rights
                        </h2>
                        <p className="mb-4">You have the right to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Access your personal data</li>
                            <li>Request deletion of your account and data</li>
                            <li>Export your data</li>
                            <li>Opt out of non-essential communications</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                            6. Data Retention
                        </h2>
                        <p>
                            We retain your data for as long as your account is active. Upon account deletion,
                            we will delete your personal data within 30 days, except where required by law.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                            7. Cookies
                        </h2>
                        <p>
                            We use essential cookies for authentication and session management.
                            We may use analytics cookies with your consent to improve the service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                            8. Changes to This Policy
                        </h2>
                        <p>
                            We may update this Privacy Policy from time to time. We will notify you of any
                            material changes via email or in-app notification.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                            9. Contact Us
                        </h2>
                        <p>
                            For privacy-related questions, contact us at privacy@reflog.app
                        </p>
                    </section>
                </div>
            </main>
        </div>
    )
}

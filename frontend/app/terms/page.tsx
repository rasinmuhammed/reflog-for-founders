'use client'

import { Brain } from 'lucide-react'

export default function TermsPage() {
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
                    Terms of Service
                </h1>

                <div className="prose prose-invert" style={{ color: 'var(--color-text-secondary)' }}>
                    <p className="text-lg mb-6">
                        Last updated: December 28, 2025
                    </p>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                            1. Acceptance of Terms
                        </h2>
                        <p>
                            By accessing and using Reflog (&quot;the Service&quot;), you accept and agree to be bound by the terms
                            and provision of this agreement. If you do not agree to abide by these terms, please do not
                            use this service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                            2. Description of Service
                        </h2>
                        <p>
                            Reflog is an Executive Intelligence platform designed to help founders and executives
                            manage priorities, meetings, and strategic decisions. The Service uses artificial intelligence
                            to provide insights and recommendations.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                            3. User Responsibilities
                        </h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                            <li>You agree to provide accurate information during registration</li>
                            <li>You will not use the Service for any unlawful purposes</li>
                            <li>You are responsible for any API keys you provide (BYOK model)</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                            4. Data and Privacy
                        </h2>
                        <p>
                            Your use of the Service is also governed by our Privacy Policy. By using Reflog,
                            you consent to the collection and use of information as described in the Privacy Policy.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                            5. AI-Generated Content
                        </h2>
                        <p>
                            The Service uses AI to generate insights and recommendations. While we strive for accuracy,
                            AI-generated content should be reviewed and not solely relied upon for critical business decisions.
                            Reflog is not liable for decisions made based on AI recommendations.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                            6. Limitation of Liability
                        </h2>
                        <p>
                            The Service is provided &quot;as is&quot; without warranties of any kind. Reflog shall not be liable
                            for any indirect, incidental, special, consequential, or punitive damages resulting from
                            your use of the Service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                            7. Changes to Terms
                        </h2>
                        <p>
                            We reserve the right to modify these terms at any time. Continued use of the Service
                            after changes constitutes acceptance of the new terms.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                            8. Contact
                        </h2>
                        <p>
                            For questions about these Terms, please contact us at legal@reflog.app
                        </p>
                    </section>
                </div>
            </main>
        </div>
    )
}

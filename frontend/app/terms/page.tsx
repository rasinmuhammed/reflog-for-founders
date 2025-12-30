'use client'

export default function TermsOfService() {
    return (
        <div className="min-h-screen" style={{ background: 'var(--color-bg-shell)' }}>
            <div className="max-w-4xl mx-auto px-6 py-16">
                <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
                <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
                    Last updated: December 30, 2024
                </p>

                <div className="space-y-8 leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            By accessing and using Reflog ("the Service"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            Reflog provides executive intelligence and productivity tools for founders, including AI-powered insights, commitment tracking, decision support, and analytics.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            You are responsible for:
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                            <li>Maintaining the security of your account credentials</li>
                            <li>All activities that occur under your account</li>
                            <li>Notifying us immediately of any unauthorized access</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">4. Data Ownership</h2>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            <strong>You own your data.</strong> By using Reflog, you grant us a license to use your data solely to:
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                            <li>Provide and improve the Service</li>
                            <li>Generate AI-powered insights and recommendations</li>
                            <li>Create aggregated, anonymized analytics</li>
                        </ul>
                        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                            You can export or delete your data at any time from Settings.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">5. Acceptable Use</h2>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            You agree not to:
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                            <li>Use the Service for any illegal purpose</li>
                            <li>Attempt to access or interfere with other users' accounts</li>
                            <li>Reverse engineer or attempt to extract source code</li>
                            <li>Use automated systems to scrape or abuse the Service</li>
                            <li>Share your account credentials with others</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">6. AI-Generated Content</h2>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            Reflog uses AI to generate insights, advice, and analysis. This content:
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                            <li>Is provided for informational purposes only</li>
                            <li>Should not be considered professional advice</li>
                            <li>May contain errors or inaccuracies</li>
                            <li>Should be verified independently for critical decisions</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">7. Service Availability</h2>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            We strive for 99.9% uptime but do not guarantee uninterrupted service. We may:
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                            <li>Perform scheduled maintenance with advance notice</li>
                            <li>Experience occasional downtime</li>
                            <li>Modify or discontinue features with notice</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">8. Termination</h2>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            We reserve the right to suspend or terminate accounts that:
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                            <li>Violate these Terms of Service</li>
                            <li>Engage in abusive or fraudulent behavior</li>
                            <li>Fail to pay applicable fees (for paid plans)</li>
                        </ul>
                        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                            You may delete your account at any time from Settings.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            To the maximum extent permitted by law, Reflog shall not be liable for:
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                            <li>Any indirect, incidental, or consequential damages</li>
                            <li>Loss of profits, data, or business opportunities</li>
                            <li>Decisions made based on AI-generated content</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            We may update these terms from time to time. Continued use of the Service after changes constitutes acceptance of the new terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">11. Contact</h2>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            Questions about these terms? Contact us at: legal@reflogapp.com
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}

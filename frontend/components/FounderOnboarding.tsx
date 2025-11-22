import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs'; // 1. Import the useUser hook
import {
  Rocket, Target, TrendingUp, Calendar, Shield, Brain,
  ChevronRight, ChevronLeft, Check, Loader2, Sparkles,
  Github, AlertCircle
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface FounderOnboardingProps {
  onComplete: (email: string) => void;
}

interface FormData {
  businessStage: string;
  primaryGoal: string;
  checkInFrequency: string;
  accountabilityStyle: string;
  keyMetrics: string[];
  biggestChallenge: string;
  workStyle: string;
  githubUsername: string;
}

export default function FounderOnboarding({ onComplete }: FounderOnboardingProps) {
  const { user } = useUser(); // 2. Get the currently logged-in user
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState<FormData>({
    businessStage: '',
    primaryGoal: '',
    checkInFrequency: 'daily',
    accountabilityStyle: 'coach',
    keyMetrics: [],
    biggestChallenge: '',
    workStyle: '',
    githubUsername: ''
  });

  // ... (all your existing definitions for businessStages, accountabilityStyles, etc. remain the same) ...
  const businessStages = [
    { id: 'idea', label: 'Idea Stage', desc: 'Validating concept, no product yet', icon: '💡' },
    { id: 'building_mvp', label: 'Building MVP', desc: 'Creating first version', icon: '🔨' },
    { id: 'early_revenue', label: 'Early Revenue', desc: '<$10K MRR, finding PMF', icon: '🌱' },
    { id: 'scaling', label: 'Scaling', desc: '>$10K MRR, growing fast', icon: '🚀' },
    { id: 'established', label: 'Established', desc: 'Profitable, focusing on growth', icon: '🏆' }
  ];

  const accountabilityStyles = [
    { id: 'gentle', label: 'Supportive', desc: 'Encouraging with gentle pushes', icon: '🤝', color: 'from-green-600 to-emerald-500' },
    { id: 'balanced', label: 'Balanced', desc: 'Direct but empathetic', icon: '⚖️', color: 'from-blue-600 to-purple-600' },
    { id: 'intense', label: 'No BS', desc: 'Brutally honest, no excuses', icon: '🔥', color: 'from-red-600 to-orange-600' }
  ];

  const checkInFrequencies = [
    { id: 'daily', label: 'Daily', desc: 'Every day commitment tracking' },
    { id: 'weekdays', label: 'Weekdays', desc: 'Monday through Friday' },
    { id: 'weekly', label: 'Weekly', desc: 'Once per week check-in' }
  ];

  const availableMetrics = [
    'Monthly Recurring Revenue (MRR)',
    'Total Customers',
    'Active Users',
    'Runway (months)',
    'Product Milestones',
    'Customer Conversations',
    'Revenue Growth Rate',
    'Churn Rate'
  ];

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    // 3. Get the REAL user data from the hook
    const email = user?.emailAddresses[0]?.emailAddress;
    const fullName = user?.fullName;

    if (!email) {
      setError('Could not get user email. Please try logging in again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 4. Use the REAL email and fullName in the request
      const response = await fetch(`${API_URL}/users/onboard?email=${encodeURIComponent(email)}&full_name=${encodeURIComponent(fullName || 'User')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_stage: formData.businessStage,
          primary_goal: formData.primaryGoal,
          check_in_frequency: formData.checkInFrequency,
          accountability_style: formData.accountabilityStyle,
          key_metrics: formData.keyMetrics,
          biggest_challenge: formData.biggestChallenge,
          work_style: formData.workStyle,
          github_username: formData.githubUsername || null
        })
      });

      if (!response.ok) throw new Error('Failed to complete onboarding');

      // 5. Pass the REAL email to the onComplete handler
      onComplete(email);
    } catch (err) {
      setError('Failed to complete onboarding. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const validateCurrentStep = () => {
    switch (step) {
      case 1: return formData.businessStage !== '';
      case 2: return formData.primaryGoal.length > 10;
      case 3: return formData.keyMetrics.length > 0;
      case 4: return formData.biggestChallenge.length > 10;
      case 5: return true;
      default: return true;
    }
  };

  const toggleMetric = (metric: string) => {
    setFormData(prev => ({
      ...prev,
      keyMetrics: prev.keyMetrics.includes(metric)
        ? prev.keyMetrics.filter(m => m !== metric)
        : [...prev.keyMetrics, metric]
    }));
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setStep(prev => Math.min(prev + 1, 6));
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#FBFAEE] flex items-center justify-center p-4">
      {/* ... (rest of your component's JSX) ... */}

      {/* (No changes to the JSX structure, only to the logic above) */}

      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#933DC9]/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#53118F]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-4xl w-full relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 mb-4">
            <div className="bg-gradient-to-br from-[#933DC9] to-[#53118F] p-3 rounded-2xl">
              <Rocket className="w-8 h-8 text-[#FBFAEE]" />
            </div>
            <h1 className="text-4xl font-bold">Welcome to Reflog</h1>
          </div>
          <p className="text-[#FBFAEE]/70 text-lg">Your AI accountability partner for founders</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div key={s} className={`flex-1 h-2 mx-1 rounded-full transition-all ${s <= step ? 'bg-gradient-to-r from-[#933DC9] to-[#53118F]' : 'bg-[#242424]'
                }`} />
            ))}
          </div>
          <div className="text-sm text-[#FBFAEE]/60 text-center">
            Step {step} of 6
          </div>
        </div>

        <div className="bg-[#242424] border border-[#242424]/50 rounded-3xl shadow-2xl p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-3">Where are you in your journey?</h2>
                <p className="text-[#FBFAEE]/70">This helps us tailor advice to your stage</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {businessStages.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => setFormData({ ...formData, businessStage: stage.id })}
                    className={`p-6 rounded-xl text-left transition-all border-2 ${formData.businessStage === stage.id
                      ? 'bg-gradient-to-br from-[#933DC9]/30 to-[#53118F]/30 border-[#933DC9] scale-105'
                      : 'bg-[#000000]/40 border-[#242424]/50 hover:border-[#933DC9]/50'
                      }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="text-4xl">{stage.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{stage.label}</h3>
                        <p className="text-sm text-[#FBFAEE]/60">{stage.desc}</p>
                      </div>
                      {formData.businessStage === stage.id && (
                        <Check className="w-6 h-6 text-green-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <Target className="w-16 h-16 mx-auto mb-4 text-[#933DC9]" />
                <h2 className="text-3xl font-bold mb-3">What's your primary goal?</h2>
                <p className="text-[#FBFAEE]/70">Be specific. We'll hold you to this.</p>
              </div>

              <textarea
                value={formData.primaryGoal}
                onChange={(e) => setFormData({ ...formData, primaryGoal: e.target.value })}
                placeholder="e.g., Reach $10K MRR by end of Q2 by acquiring 50 paying customers"
                className="w-full px-4 py-4 bg-[#000000]/50 border border-[#242424]/60 text-[#FBFAEE] placeholder-[#FBFAEE]/50 rounded-xl focus:ring-2 focus:ring-[#933DC9] resize-none"
                rows={4}
              />

              <div className="bg-[#933DC9]/10 border border-[#933DC9]/30 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Sparkles className="w-5 h-5 text-[#C488F8] mt-0.5" />
                  <div>
                    <p className="text-sm text-[#FBFAEE]/80 font-medium mb-1">Pro Tip</p>
                    <p className="text-sm text-[#FBFAEE]/70">
                      Good goals have numbers, deadlines, and clear outcomes.
                      "Get more users" is vague. "Get 100 sign-ups in 30 days" is actionable.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-[#933DC9]" />
                <h2 className="text-3xl font-bold mb-3">What metrics matter most?</h2>
                <p className="text-[#FBFAEE]/70">Select the metrics you want to track</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableMetrics.map((metric) => (
                  <button
                    key={metric}
                    onClick={() => toggleMetric(metric)}
                    className={`p-4 rounded-xl text-left transition-all border ${formData.keyMetrics.includes(metric)
                      ? 'bg-[#933DC9]/20 border-[#933DC9]/50 text-[#FBFAEE]'
                      : 'bg-[#000000]/40 border-[#242424]/50 text-[#FBFAEE]/70 hover:border-[#933DC9]/30'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{metric}</span>
                      {formData.keyMetrics.includes(metric) && (
                        <Check className="w-5 h-5 text-[#C488F8]" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-[#933DC9]" />
                <h2 className="text-3xl font-bold mb-3">What's your biggest challenge?</h2>
                <p className="text-[#FBFAEE]/70">Be honest. This helps us give relevant advice.</p>
              </div>

              <textarea
                value={formData.biggestChallenge}
                onChange={(e) => setFormData({ ...formData, biggestChallenge: e.target.value })}
                placeholder="e.g., I struggle with consistent outreach. I know I need to do 10 sales calls per week but I keep avoiding them..."
                className="w-full px-4 py-4 bg-[#000000]/50 border border-[#242424]/60 text-[#FBFAEE] placeholder-[#FBFAEE]/50 rounded-xl focus:ring-2 focus:ring-[#933DC9] resize-none"
                rows={5}
              />

              <div className="grid grid-cols-3 gap-4 mt-6">
                {[
                  { id: 'morning_person', icon: '🌅', label: 'Morning Person' },
                  { id: 'night_owl', icon: '🌙', label: 'Night Owl' },
                  { id: 'flexible', icon: '🔄', label: 'Flexible' }
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setFormData({ ...formData, workStyle: style.id })}
                    className={`p-4 rounded-xl border ${formData.workStyle === style.id
                      ? 'bg-[#933DC9]/20 border-[#933DC9]/50'
                      : 'bg-[#000000]/40 border-[#242424]/50 hover:border-[#933DC9]/30'
                      }`}
                  >
                    <div className="text-2xl mb-2">{style.icon}</div>
                    <div className="text-sm font-medium">{style.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <Shield className="w-16 h-16 mx-auto mb-4 text-[#933DC9]" />
                <h2 className="text-3xl font-bold mb-3">How should we keep you accountable?</h2>
                <p className="text-[#FBFAEE]/70">Choose your coaching style</p>
              </div>

              <div className="space-y-4">
                {accountabilityStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setFormData({ ...formData, accountabilityStyle: style.id })}
                    className={`w-full p-6 rounded-xl text-left transition-all border-2 ${formData.accountabilityStyle === style.id
                      ? `bg-gradient-to-r ${style.color}/20 border-[#933DC9] scale-105`
                      : 'bg-[#000000]/40 border-[#242424]/50 hover:border-[#933DC9]/50'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-4xl">{style.icon}</div>
                        <div>
                          <h3 className="font-bold text-xl mb-1">{style.label}</h3>
                          <p className="text-[#FBFAEE]/60">{style.desc}</p>
                        </div>
                      </div>
                      {formData.accountabilityStyle === style.id && (
                        <Check className="w-6 h-6 text-green-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-[#FBFAEE]/80 mb-3">
                  Check-in Frequency
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {checkInFrequencies.map((freq) => (
                    <button
                      key={freq.id}
                      onClick={() => setFormData({ ...formData, checkInFrequency: freq.id })}
                      className={`p-4 rounded-xl text-center transition-all border ${formData.checkInFrequency === freq.id
                        ? 'bg-[#933DC9]/20 border-[#933DC9]/50'
                        : 'bg-[#000000]/40 border-[#242424]/50 hover:border-[#933DC9]/30'
                        }`}
                    >
                      <Calendar className="w-6 h-6 mx-auto mb-2" />
                      <div className="font-medium text-sm">{freq.label}</div>
                      <div className="text-xs text-[#FBFAEE]/60 mt-1">{freq.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <Github className="w-16 h-16 mx-auto mb-4 text-[#FBFAEE]/70" />
                <h2 className="text-3xl font-bold mb-3">Connect GitHub (Optional)</h2>
                <p className="text-[#FBFAEE]/70">
                  For technical founders who want code pattern analysis
                </p>
              </div>

              <div className="bg-[#000000]/40 border border-[#242424]/50 rounded-xl p-6">
                <label className="block text-sm font-medium text-[#FBFAEE]/80 mb-3">
                  GitHub Username
                </label>
                <input
                  type="text"
                  value={formData.githubUsername}
                  onChange={(e) => setFormData({ ...formData, githubUsername: e.target.value })}
                  placeholder="octocat"
                  className="w-full px-4 py-3 bg-[#000000]/50 border border-[#242424]/60 text-[#FBFAEE] placeholder-[#FBFAEE]/50 rounded-xl focus:ring-2 focus:ring-[#933DC9]"
                />
                <p className="text-xs text-[#FBFAEE]/60 mt-2">
                  You can skip this and add it later from settings
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-900/30 border border-red-500/40 rounded-xl">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <button
                onClick={prevStep}
                className="flex items-center space-x-2 px-6 py-3 bg-[#000000]/40 text-[#FBFAEE]/80 rounded-xl hover:bg-[#000000]/60 transition border border-[#242424]/50"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 6 ? (
              <button
                onClick={nextStep}
                disabled={!validateCurrentStep()}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#933DC9] to-[#53118F] text-[#FBFAEE] rounded-xl hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !validateCurrentStep()}
                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-[#933DC9] to-[#53118F] text-[#FBFAEE] rounded-xl hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Setting up...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Setup</span>
                    <Check className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
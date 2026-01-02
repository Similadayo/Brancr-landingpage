'use client';

import { OnboardingWizard } from '@/app/(tenant)/components/OnboardingWizard';

export default function ManualOnboardingPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
            <OnboardingWizard />
        </div>
    );
}

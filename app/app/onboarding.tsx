import { useMemo } from 'react';
import { OnboardingProgressWrapper } from '@/components/onboarding/onboarding-progress-wrapper';
import { AgeStep } from '@/components/onboarding/steps/age-step';
import { GenerateImageStep } from '@/components/onboarding/steps/generate-image-step';
import { GenderStep } from '@/components/onboarding/steps/gender-step';
import { GoalsStep } from '@/components/onboarding/steps/goals-step';
import { ManifestationPitchStep } from '@/components/onboarding/steps/manifestation-pitch-step';
import { NameStep } from '@/components/onboarding/steps/name-step';
import { PaywallStep } from '@/components/onboarding/steps/paywall-step';
import { PhotoUploadStep } from '@/components/onboarding/steps/photo-upload-step';
import { VisionInputStep } from '@/components/onboarding/steps/vision-input-step';
import { WelcomeStep } from '@/components/onboarding/steps/welcome-step';
import { OnboardingStep } from '@/components/onboarding/types';

export default function OnboardingScreen() {
    const ONBOARDING_STEPS = useMemo<OnboardingStep[]>(() => [
        {
            component: WelcomeStep,
            showProgressIndicator: false,
        },
        {
            component: VisionInputStep,
            continueButtonText: 'Weiter',
            initialCanContinue: false,
        },
        {
            component: GoalsStep,
            continueButtonText: 'Bestätigen',
            initialCanContinue: false,
        },
        {
            component: NameStep,
            continueButtonText: 'Weiter',
            initialCanContinue: false,
        },
        {
            component: AgeStep,
            continueButtonText: 'Weiter',
            initialCanContinue: false,
        },
        {
            component: GenderStep,
            continueButtonText: 'Weiter',
            initialCanContinue: false,
        },
        {
            component: PhotoUploadStep,
            continueButtonText: 'Weiter',
        },
        {
            component: ManifestationPitchStep,
            continueButtonText: 'Weiter',
        },
        {
            component: GenerateImageStep,
            continueButtonText: 'Wow, weiter!',
            initialCanContinue: false,
            showProgressIndicator: false,
        },
        {
            component: PaywallStep,
            showProgressIndicator: false,
            showContinueButton: false,
        },
    ], []);

    return <OnboardingProgressWrapper steps={ONBOARDING_STEPS} />;
}

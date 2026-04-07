import { useMemo } from 'react';
import { OnboardingProgressWrapper } from '@/components/onboarding/onboarding-progress-wrapper';
import { AgeStep } from '@/components/onboarding/steps/age-step';
import { CategoryStep } from '@/components/onboarding/steps/category-step';
import { makeEmotionSlide } from '@/components/onboarding/steps/emotion-slide-step';
import { GenerateImageStep } from '@/components/onboarding/steps/generate-image-step';
import { NameStep } from '@/components/onboarding/steps/name-step';
import { PaywallStep } from '@/components/onboarding/steps/paywall-step';
import { PhotoUploadStep } from '@/components/onboarding/steps/photo-upload-step';
import { VisionInputStep } from '@/components/onboarding/steps/vision-input-step';
import { OnboardingStep } from '@/components/onboarding/types';

const HookSlide = makeEmotionSlide({
    label: 'PHASE 1',
    headline: 'Stell dir vor, du könntest dein zukünftiges Leben sehen.',
    subtext: 'Nicht träumen. Sehen.',
});

const IdentityShiftSlide = makeEmotionSlide({
    label: 'PHASE 2',
    headline: 'Stell dir vor… du hast es geschafft.',
    subtext: 'Wie fühlt sich das an?',
});

const MicroLogicSlide = makeEmotionSlide({
    label: 'PHASE 3',
    headline: 'Dein Gehirn glaubt, was es regelmäßig sieht.',
    subtext: 'Wiederholung schafft Realität.',
});

export default function OnboardingScreen() {
    const ONBOARDING_STEPS = useMemo<OnboardingStep[]>(() => [
        { component: HookSlide,          showProgressIndicator: false, showContinueButton: false, theme: 'light' },
        { component: CategoryStep,       showProgressIndicator: false, showContinueButton: false, theme: 'light' },
        { component: IdentityShiftSlide, showProgressIndicator: false, showContinueButton: false, theme: 'light' },
        { component: MicroLogicSlide,    showProgressIndicator: false, showContinueButton: false, theme: 'light' },
        { component: PhotoUploadStep,    continueButtonText: 'Weiter' },
        { component: VisionInputStep,    continueButtonText: 'Weiter', initialCanContinue: false },
        { component: GenerateImageStep,  continueButtonText: 'Wow, weiter!', initialCanContinue: false, showProgressIndicator: false },
        { component: NameStep,           continueButtonText: 'Weiter', initialCanContinue: false },
        { component: AgeStep,            continueButtonText: 'Weiter', initialCanContinue: false },
        { component: PaywallStep,        showProgressIndicator: false, showContinueButton: false },
    ], []);

    return <OnboardingProgressWrapper steps={ONBOARDING_STEPS} />;
}

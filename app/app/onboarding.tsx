import { OnboardingProgressWrapper } from '@/components/onboarding/onboarding-progress-wrapper';
import { AddWidgetStep } from '@/components/onboarding/steps/add-widget-step';
import { makeEmotionSlide } from '@/components/onboarding/steps/emotion-slide-step';
import { NameStep } from '@/components/onboarding/steps/name-step';
import { NotificationSetupStep } from '@/components/onboarding/steps/notification-setup-step';
import { PhotoBridgeStep } from '@/components/onboarding/steps/photo-bridge-step';
import { PhotoUploadStep } from '@/components/onboarding/steps/photo-upload-step';
import { TrialOfferStep } from '@/components/onboarding/steps/trial-offer-step';
import { TrialReminderStep } from '@/components/onboarding/steps/trial-reminder-step';
import { VisionGenerationStep } from '@/components/onboarding/steps/vision-generation-step';
import { VisionReactionStep } from '@/components/onboarding/steps/vision-reaction-step';
import { VisionStep } from '@/components/onboarding/steps/vision-step';
import { WhatYouWillGetStep } from '@/components/onboarding/steps/what-you-will-get-step';
import { OnboardingStep } from '@/components/onboarding/types';
import { MediaHandler } from '@/lib/media-handler';
import { useUserDataStore } from '@/stores/UserDataStore';
import { SelfReferenceImages } from '@/types/user-data';
import { registerPushNotifications } from '@/utils/register-push-notifications';
import { File } from 'expo-file-system';
import * as StoreReview from 'expo-store-review';
import { fetch } from 'expo/fetch';
import { useCallback, useMemo } from 'react';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8080';

const SELF_REF_KEYS: (keyof SelfReferenceImages)[] = ['face_front', 'face_smile', 'face_left', 'face_right', 'body'];

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

const CompanionSlide = makeEmotionSlide({
    label: 'DEIN WEG',
    headline: 'Wir begleiten dich auf deinem Weg.',
    subtext: 'Jeden Tag erinnern wir dich an dein Ziel, damit du nicht vergisst, wohin du willst.',
});

export default function OnboardingScreen() {
    const handleUploadAndComposite = useCallback(async () => {
        const { selfReferenceImages, userId, updateSelfReferenceImages } = useUserDataStore.getState();
        const filledKeys = SELF_REF_KEYS.filter((k) => selfReferenceImages[k]);
        if (filledKeys.length === 0) return;

        // 1. Presign
        const { urls } = await fetch(`${BACKEND_URL}/self-reference/presign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-rc-user-id': userId },
            body: JSON.stringify({ types: filledKeys }),
        }).then((r) => r.json() as Promise<{ urls: Record<string, string> }>);

        // 2. Upload + save locally
        const newPaths: Partial<SelfReferenceImages> = {};
        await Promise.all(
            filledKeys.map(async (key) => {
                const uri = selfReferenceImages[key]!;
                const arrayBuffer = await new File(uri).arrayBuffer();
                await fetch(urls[key], { method: 'PUT', body: arrayBuffer, headers: { 'Content-Type': 'image/jpeg' } });
                newPaths[key] = MediaHandler.saveFromLocal(uri, `self-reference/${userId}/${key}`);
            })
        );
        updateSelfReferenceImages(newPaths);

        // 3. Composite + description (awaited so description is ready before generation)
        await fetch(`${BACKEND_URL}/self-reference/composite`, {
            method: 'POST',
            headers: { 'x-rc-user-id': userId },
        });
    }, []);

    const handleRequestNotifications = useCallback(async () => {
        const { status } = await registerPushNotifications();
        if (status === 'granted') {
            useUserDataStore.getState().updateSettings({ notifications: true });
        }
    }, []);

    const ONBOARDING_STEPS = useMemo<OnboardingStep[]>(() => [
        { component: HookSlide, showProgressIndicator: false, showContinueButton: false, theme: 'light' },
        { component: NameStep, theme: 'light', continueButtonText: 'Weiter', initialCanContinue: false },
        { component: VisionStep, showProgressIndicator: false, continueButtonText: 'Weiter', initialCanContinue: false },
        { component: IdentityShiftSlide, showProgressIndicator: false, showContinueButton: false, theme: 'light' },
        { component: MicroLogicSlide, showProgressIndicator: false, showContinueButton: false, theme: 'light' },
        { component: PhotoBridgeStep, showProgressIndicator: false, continueButtonText: 'Zeig es mir', theme: 'light' },
        { component: PhotoUploadStep, continueButtonText: 'Kreiere meine Vision!', theme: 'light', initialCanContinue: false, preContinue: handleUploadAndComposite },
        {
            component: VisionGenerationStep, showProgressIndicator: false, showContinueButton: false, preContinue: async () => {
                try {
                    const isAvailable = await StoreReview.isAvailableAsync();
                    if (isAvailable) await StoreReview.requestReview();
                } catch { /* silently continue */ }
            }
        },
        { component: VisionReactionStep, theme: 'light', continueButtonText: 'Weiter', initialCanContinue: false },
        { component: CompanionSlide, showProgressIndicator: false, showContinueButton: false, theme: 'light' },
        { component: NotificationSetupStep, theme: 'light', continueButtonText: 'Weiter', initialCanContinue: false, preContinue: handleRequestNotifications },
        { component: AddWidgetStep, theme: 'light', continueButtonText: 'Weiter' },
        { component: TrialOfferStep, theme: 'light', continueButtonText: 'Weiter' },
        { component: TrialReminderStep, theme: 'light', continueButtonText: 'Weiter' },
        { component: WhatYouWillGetStep, theme: 'light', continueButtonText: 'Los geht\'s!' },
    ], [handleUploadAndComposite]);

    return <OnboardingProgressWrapper steps={ONBOARDING_STEPS} />;
}

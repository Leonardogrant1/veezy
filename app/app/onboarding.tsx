import { OnboardingProgressWrapper } from '@/components/onboarding/onboarding-progress-wrapper';
import { AddWidgetStep } from '@/components/onboarding/steps/add-widget-step';
import { makeEmotionSlide } from '@/components/onboarding/steps/emotion-slide-step';
import { NameStep } from '@/components/onboarding/steps/name-step';
import { NotificationSetupStep } from '@/components/onboarding/steps/notification-setup-step';
import { PhotoBridgeStep } from '@/components/onboarding/steps/photo-bridge-step';
import { PhotoUploadStep } from '@/components/onboarding/steps/photo-upload-step';
import { TrackingStep } from '@/components/onboarding/steps/tracking-step';
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
import { fetch } from 'expo/fetch';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8080';

const SELF_REF_KEYS: (keyof SelfReferenceImages)[] = ['face_front', 'face_smile', 'face_left', 'face_right', 'body'];

export default function OnboardingScreen() {
    const { t } = useTranslation();

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

    const ONBOARDING_STEPS = useMemo<OnboardingStep[]>(() => {
        const HookSlide = makeEmotionSlide({
            label: t('onboarding.hook.label'),
            headline: t('onboarding.hook.headline'),
            subtext: t('onboarding.hook.subtext'),
        });

        const IdentityShiftSlide = makeEmotionSlide({
            label: t('onboarding.identity_shift.label'),
            headline: t('onboarding.identity_shift.headline'),
            subtext: t('onboarding.identity_shift.subtext'),
        });

        const MicroLogicSlide = makeEmotionSlide({
            label: t('onboarding.micro_logic.label'),
            headline: t('onboarding.micro_logic.headline'),
            subtext: t('onboarding.micro_logic.subtext'),
        });

        const CompanionSlide = makeEmotionSlide({
            label: t('onboarding.companion.label'),
            headline: t('onboarding.companion.headline'),
            subtext: t('onboarding.companion.subtext'),
        });

        return [
            { component: HookSlide, showProgressIndicator: false, showContinueButton: false, theme: 'light' },
            { component: TrackingStep, showProgressIndicator: false, continueButtonText: t('common.continue'), theme: 'light' },
            { component: NameStep, theme: 'light', continueButtonText: t('common.continue'), initialCanContinue: false },
            { component: VisionStep, showProgressIndicator: false, continueButtonText: t('common.continue'), initialCanContinue: false },
            { component: IdentityShiftSlide, showProgressIndicator: false, showContinueButton: false, theme: 'light' },
            { component: MicroLogicSlide, showProgressIndicator: false, showContinueButton: false, theme: 'light' },
            { component: PhotoBridgeStep, showProgressIndicator: false, continueButtonText: t('onboarding.photo_bridge.continue'), theme: 'light' },
            { component: PhotoUploadStep, continueButtonText: t('onboarding.photo_upload.continue'), theme: 'light', initialCanContinue: false, preContinue: handleUploadAndComposite },
            { component: VisionGenerationStep, showProgressIndicator: false, showContinueButton: false },
            { component: VisionReactionStep, theme: 'light', continueButtonText: t('common.continue'), initialCanContinue: false },
            { component: CompanionSlide, showProgressIndicator: false, showContinueButton: false, theme: 'light' },
            { component: NotificationSetupStep, theme: 'light', continueButtonText: t('common.continue'), initialCanContinue: false, preContinue: handleRequestNotifications },
            { component: AddWidgetStep, theme: 'light', continueButtonText: t('common.continue') },
            { component: TrialOfferStep, theme: 'light', continueButtonText: t('common.continue') },
            { component: TrialReminderStep, theme: 'light', continueButtonText: t('common.continue') },
            { component: WhatYouWillGetStep, theme: 'light', continueButtonText: t('onboarding.what_you_get.cta') },
        ];
    }, [handleUploadAndComposite, t]);

    return <OnboardingProgressWrapper steps={ONBOARDING_STEPS} />;
}

import { OnboardingProgressWrapper } from '@/components/onboarding/onboarding-progress-wrapper';
import { AddWidgetStep } from '@/components/onboarding/steps/add-widget-step';
import { DemoGenerationStep } from '@/components/onboarding/steps/demo-generation-step';
import { makeEmotionSlide } from '@/components/onboarding/steps/emotion-slide-step';
import { NameStep } from '@/components/onboarding/steps/name-step';
import { NotificationSetupStep } from '@/components/onboarding/steps/notification-setup-step';
import { TrackingStep } from '@/components/onboarding/steps/tracking-step';
import { TrialOfferStep } from '@/components/onboarding/steps/trial-offer-step';
import { TrialReminderStep } from '@/components/onboarding/steps/trial-reminder-step';
import { WhatYouWillGetStep } from '@/components/onboarding/steps/what-you-will-get-step';
import { OnboardingStep } from '@/components/onboarding/types';
import { trackerManager } from '@/lib/tracking/tracker-manager';
import { useUserDataStore } from '@/stores/UserDataStore';
import { syncPushToken } from '@/services/push-token-sync';
import { registerPushNotifications } from '@/utils/register-push-notifications';
import * as TrackingTransparency from "expo-tracking-transparency";
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export default function OnboardingScreen() {
    const { t } = useTranslation();

    const handleRequestNotifications = useCallback(async () => {
        const { status } = await registerPushNotifications();
        if (status === 'granted') {
            useUserDataStore.getState().updateSettings({ notifications: true });
            syncPushToken().catch(() => { });
        }
    }, []);

    const handleRequestTracking = useCallback(async () => {

        const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
        trackerManager.track('tracking_permission', {
            status: status === 'granted' ? 'authorized' : 'declined',
        });
    }, [])

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
            { component: TrackingStep, showProgressIndicator: false, continueButtonText: t('common.continue'), theme: 'light', preContinue: handleRequestTracking },
            { component: NameStep, theme: 'light', continueButtonText: t('common.continue'), initialCanContinue: false },
            { component: IdentityShiftSlide, showProgressIndicator: false, showContinueButton: false, theme: 'light' },
            { component: MicroLogicSlide, showProgressIndicator: false, showContinueButton: false, theme: 'light' },
            { component: DemoGenerationStep, showProgressIndicator: false, showContinueButton: false },
            { component: CompanionSlide, showProgressIndicator: false, showContinueButton: false, theme: 'light' },
            { component: NotificationSetupStep, theme: 'light', continueButtonText: t('common.continue'), initialCanContinue: false, preContinue: handleRequestNotifications },
            { component: AddWidgetStep, theme: 'light', continueButtonText: t('common.continue') },
            { component: TrialOfferStep, theme: 'light', continueButtonText: t('common.continue') },
            { component: TrialReminderStep, theme: 'light', continueButtonText: t('common.continue') },
            { component: WhatYouWillGetStep, theme: 'light', continueButtonText: t('onboarding.what_you_get.cta') },
        ];
    }, [handleRequestNotifications, handleRequestTracking, t]);

    return <OnboardingProgressWrapper steps={ONBOARDING_STEPS} />;
}

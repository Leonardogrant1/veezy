import { OnboardingProgressWrapper } from '@/components/onboarding/onboarding-progress-wrapper';
import { AgeStep } from '@/components/onboarding/steps/age-step';
import { AttributionStep } from '@/components/onboarding/steps/attribution-step';
import { DemoGenerationStep } from '@/components/onboarding/steps/demo-generation-step';
import { NameStep } from '@/components/onboarding/steps/name-step';
import { NotificationExplainStep } from '@/components/onboarding/steps/notification-explain-step';
import { ScienceStep } from '@/components/onboarding/steps/science-step';
import { NotificationSetupStep } from '@/components/onboarding/steps/notification-setup-step';
import { PersonalizationStep } from '@/components/onboarding/steps/personalization-step';
import { ReferralCodeStep } from '@/components/onboarding/steps/referral-code-step';
import { TrackingStep } from '@/components/onboarding/steps/tracking-step';
import { TrialOfferStep } from '@/components/onboarding/steps/trial-offer-step';
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
        return [
            { component: AttributionStep, theme: 'light', continueButtonText: t('common.continue'), initialCanContinue: false },
            { component: AgeStep, theme: 'light', continueButtonText: t('common.continue'), initialCanContinue: false },
            { component: TrackingStep, showProgressIndicator: false, continueButtonText: t('common.continue'), theme: 'light', preContinue: handleRequestTracking },
            { component: NameStep, theme: 'light', continueButtonText: t('common.continue'), initialCanContinue: false },
            { component: ScienceStep, theme: 'light', continueButtonText: t('common.continue') },
            { component: DemoGenerationStep, showProgressIndicator: false, showContinueButton: false },
            { component: NotificationExplainStep, showProgressIndicator: false, continueButtonText: t('common.continue') },
            { component: NotificationSetupStep, theme: 'light', showContinueButton: false, preContinue: handleRequestNotifications },
            { component: PersonalizationStep, theme: 'light', showContinueButton: false, showProgressIndicator: false },
            { component: ReferralCodeStep, theme: 'light', continueButtonText: t('common.continue'), initialCanContinue: true },
            { component: TrialOfferStep, theme: 'light', continueButtonText: t('onboarding.trial.cta') },
        ];
    }, [handleRequestNotifications, handleRequestTracking, t]);

    return <OnboardingProgressWrapper steps={ONBOARDING_STEPS} />;
}

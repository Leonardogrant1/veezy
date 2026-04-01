import { useMemo } from 'react';
import StoreReview from 'expo-store-review';
import * as TrackingTransparency from 'expo-tracking-transparency';
import { trackerManager } from '@/lib/tracking/tracker-manager';

import { OnboardingProgressWrapper } from '@/components/onboarding/onboarding-progress-wrapper';
import { ActivityStep } from '@/components/onboarding/steps/activity-step';
import { AddWidgetStep } from '@/components/onboarding/steps/add-widget-step';
import { AffirmationsFamiliarityStep } from '@/components/onboarding/steps/affirmations-familiarity-step';
import { AgeStep } from '@/components/onboarding/steps/age-step';
import { ChampionsStep } from '@/components/onboarding/steps/champions-step';
import { CommitmentStep } from '@/components/onboarding/steps/commitment-step';
import { GenderStep } from '@/components/onboarding/steps/gender-step';
import { HabitStep } from '@/components/onboarding/steps/habit-step';
import { ImprovementStep } from '@/components/onboarding/steps/improvement-step';
import { NameStep } from '@/components/onboarding/steps/name-step';
import { NotificationScheduleStep } from '@/components/onboarding/steps/notification-schedule-step';
import { NotificationsStep } from '@/components/onboarding/steps/notifications-step';
import { RatingStep } from '@/components/onboarding/steps/rating-step';
import { ReferralStep } from '@/components/onboarding/steps/referral-step';
import { SportCategoryStep } from '@/components/onboarding/steps/sport-category-step';
import { TrackingStep } from '@/components/onboarding/steps/tracking-step';
import { TrialOfferStep } from '@/components/onboarding/steps/trial-offer-step';
import { TrialReminderStep } from '@/components/onboarding/steps/trial-reminder-step';
import { WelcomeStep } from '@/components/onboarding/steps/welcome-step';
import { WhatYouWillGetStep } from '@/components/onboarding/steps/what-you-will-get-step';
import { OnboardingStep } from '@/components/onboarding/types';
import { useNotifications } from '@/contexts/NotificationContext';



export default function OnboardingScreen() {

  const { registerPushNotificationsAndSaveToken } = useNotifications();

  const ONBOARDING_STEPS = useMemo<OnboardingStep[]>(() => [
    {
      component: WelcomeStep,
      showProgressIndicator: false,
    },
    {
      component: ChampionsStep,
      showProgressIndicator: false,
    },
    {
      component: TrackingStep,
      continueButtonText: 'Continue',
      preContinue: async () => {
        const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
        trackerManager.track('tracking_permission', {
          status: status === 'granted' ? 'authorized' : 'declined',
        });
      },
    },
    {
      component: NameStep,
      continueButtonText: 'Continue',
      initialCanContinue: false,
    },
    {
      component: GenderStep,
      initialCanContinue: false,
    },
    {
      component: ReferralStep,
      initialCanContinue: false,
    },
    {
      component: AgeStep,
      initialCanContinue: false,
    },
    {
      component: SportCategoryStep,
      initialCanContinue: false,
    },
    {
      component: ActivityStep,
      initialCanContinue: false,
    },
    {
      component: AffirmationsFamiliarityStep,
      initialCanContinue: false,
    },
    {
      component: ImprovementStep,
      continueButtonText: 'Continue',
      initialCanContinue: false,
    },
    {
      component: HabitStep,
      continueButtonText: 'Build my habit',
    },
    {
      component: NotificationScheduleStep,
      continueButtonText: 'Continue',
    },
    {
      component: NotificationsStep,
      continueButtonText: 'Enable Notifications',
      preContinue: async () => {
        await registerPushNotificationsAndSaveToken();
      },
    },
    {
      component: AddWidgetStep,
      continueButtonText: 'I will!',
      initialCanContinue: false,
    },
    {
      component: CommitmentStep,
      showContinueButton: false,
    },
    {
      component: RatingStep,
      showProgressIndicator: false,
      continueButtonText: 'Rate Now',
      preContinue: async () => {
        try {
          const isAvailable = await StoreReview.isAvailableAsync();
          if (isAvailable) {
            await StoreReview.requestReview();
          }
        } catch (_) {
          // silently continue if store review fails
        }
      },
    },
    {
      component: TrialOfferStep,
      continueButtonText: 'Continue',
    },
    {
      component: TrialReminderStep,
      continueButtonText: 'Continue',
    },
    {
      component: WhatYouWillGetStep,
      continueButtonText: "Let's get started!",
    },
  ], [registerPushNotificationsAndSaveToken]);


  return (
    <OnboardingProgressWrapper
      steps={ONBOARDING_STEPS}
    />
  );
}

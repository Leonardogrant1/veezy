import * as Notifications from 'expo-notifications';
import { createContext, useContext, useEffect, useState } from 'react';

import { trackerManager } from '@/lib/tracking/tracker-manager';
import { checkAndReschedule } from '@/services/notifications';
import { useUserDataStore } from '@/stores/UserDataStore';
import { useVisionStore } from '@/stores/VisionStore';
import { devLog } from '@/utils/dev-log';
import { registerPushNotifications } from '@/utils/register-push-notifications';

interface NotificationContextValue {
    expoPushToken: string | null;
    registerPushNotificationsAndSaveToken: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const notifications = useUserDataStore((s) => s.notifications);
    const notificationsPerDay = useUserDataStore((s) => s.notificationsPerDay);
    const notificationStartHour = useUserDataStore((s) => s.notificationStartHour);
    const notificationEndHour = useUserDataStore((s) => s.notificationEndHour);
    const motivationStyle = useUserDataStore((s) => s.motivationStyle);
    const isPremium = useUserDataStore((s) => s.isPremium);
    const visions = useVisionStore((s) => s.visions);
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

    useEffect(() => {
        const notificationListener = Notifications.addNotificationReceivedListener(notification => {
            devLog('Notification received:', notification);
        });

        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            devLog('Notification response:', response);
        });

        return () => {
            notificationListener.remove();
            responseListener.remove();
        };
    }, []);

    useEffect(() => {
        if (!notifications) {
            Notifications.cancelAllScheduledNotificationsAsync();
            return;
        }

        const sourceVisions = isPremium ? visions : visions.slice(0, 3);
        const visionAffirmations = sourceVisions.flatMap((v) =>
            motivationStyle === 'fuel' ? (v.affirmationsFuel ?? []) : (v.affirmationsAffirmation ?? [])
        );

        checkAndReschedule({
            notificationsEnabled: true,
            notificationsPerDay,
            notificationStartHour,
            notificationEndHour,
            randomizeNotificationTimes: true,
            selectedCategories: ['all'],
            visionAffirmations,
        });
    }, [notifications, isPremium, visions, notificationsPerDay, notificationStartHour, notificationEndHour, motivationStyle]);

    const registerPushNotificationsAndSaveToken = async () => {
        const { status, pushTokenString } = await registerPushNotifications();
        trackerManager.track('notifications_permission', {
            status: status === 'granted' ? 'authorized' : 'declined',
        });
        setExpoPushToken(pushTokenString);
    };

    return (
        <NotificationContext.Provider value={{ expoPushToken, registerPushNotificationsAndSaveToken }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
    return ctx;
}

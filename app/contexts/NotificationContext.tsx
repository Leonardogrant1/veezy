import * as Notifications from 'expo-notifications';
import { createContext, useContext, useEffect, useState } from 'react';

import { trackerManager } from '@/lib/tracking/tracker-manager';
import { useUserDataStore } from '@/stores/UserDataStore';
import { devLog } from '@/utils/dev-log';
import { registerPushNotifications } from '@/utils/register-push-notifications';

interface NotificationContextValue {
    expoPushToken: string | null;
    registerPushNotificationsAndSaveToken: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const notifications = useUserDataStore((s) => s.notifications);
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
        }
    }, [notifications]);

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

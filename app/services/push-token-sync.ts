import * as Notifications from 'expo-notifications';
import { fetch } from 'expo/fetch';

import { useUserDataStore } from '@/stores/UserDataStore';
import { devLog } from '@/utils/dev-log';
import { registerPushNotifications } from '@/utils/register-push-notifications';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';

// Uploads the Expo push token to the backend. If the user was never asked
// for notification permission, this prompts (via registerPushNotifications);
// an explicit denial is respected and never re-prompted.
export async function syncPushToken(): Promise<void> {
    const { userId, lastSentPushToken, setLastSentPushToken } = useUserDataStore.getState();
    if (!userId) return;

    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'denied') return;

    // 'granted' → token is fetched silently; 'undetermined' → registerPushNotifications prompts
    const { pushTokenString } = await registerPushNotifications();
    if (!pushTokenString || pushTokenString === lastSentPushToken) return;

    const res = await fetch(`${BACKEND_URL}/user-data/push-token`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'x-rc-user-id': userId,
        },
        body: JSON.stringify({ token: pushTokenString }),
    });
    if (res.ok) {
        devLog('Push token synced');
        setLastSentPushToken(pushTokenString);
    }
}

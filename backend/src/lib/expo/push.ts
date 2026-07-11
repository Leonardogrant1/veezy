import { logger } from '@/utils/logger.js';

export interface PushMessage {
    title: string;
    body: string;
    data?: Record<string, string>;
}

export async function sendPushNotification(token: string, message: PushMessage): Promise<void> {
    try {
        const res = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: token,
                sound: 'default',
                title: message.title,
                body: message.body,
                data: message.data ?? {},
            }),
        });
        if (!res.ok) {
            logger.warn({ status: res.status, body: await res.text() }, 'Expo push send failed');
        }
    } catch (err: any) {
        logger.warn({ err: err.message }, 'Expo push send error');
    }
}

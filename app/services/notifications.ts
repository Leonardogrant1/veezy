import * as Notifications from 'expo-notifications';
import { createMMKV } from 'react-native-mmkv';

import AFFIRMATIONS from '@/assets/affirmations.json';
import { devLog } from '@/utils/dev-log';

type NotificationSettings = {
    notificationsEnabled: boolean;
    notificationsPerDay: number;
    notificationStartHour: number;
    notificationEndHour: number;
    randomizeNotificationTimes: boolean;
    selectedCategories: string[];
    visionAffirmations?: string[];
};

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const storage = createMMKV({ id: 'notification-storage' });
const LAST_SCHEDULED_KEY = 'lastScheduled';

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

export async function scheduleNotifications(settings: NotificationSettings): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!settings.notificationsEnabled) return;
    if (!settings.selectedCategories || settings.selectedCategories.length === 0) return;

    const {
        notificationsPerDay,
        notificationStartHour,
        notificationEndHour,
        randomizeNotificationTimes,
        selectedCategories,
    } = settings;

    const MAX_NOTIFICATIONS = 60;
    const days = Math.floor(MAX_NOTIFICATIONS / notificationsPerDay);
    const totalNeeded = days * notificationsPerDay;

    // Use vision-specific affirmations if available, otherwise fall back to generic pool
    const sourceAffirmations = settings.visionAffirmations && settings.visionAffirmations.length > 0
        ? settings.visionAffirmations
        : AFFIRMATIONS;

    // Shuffle affirmations and repeat until we have enough
    let pool: string[] = [];
    while (pool.length < totalNeeded) {
        pool = [...pool, ...shuffle(sourceAffirmations)];
    }

    let affirmationIndex = 0;
    const scheduled: Promise<string>[] = [];

    for (let day = 0; day < days; day++) {
        const date = new Date();
        date.setDate(date.getDate() + day + 1);

        for (let i = 0; i < notificationsPerDay; i++) {
            const body = pool[affirmationIndex++];

            const baseHour = notificationStartHour + i * (notificationEndHour - notificationStartHour) / notificationsPerDay;
            const hour = Math.floor(baseHour);
            const baseMinute = Math.round((baseHour % 1) * 60);
            const offset = randomizeNotificationTimes ? Math.floor(Math.random() * 21) - 10 : 0;
            const minute = clamp(baseMinute + offset, 0, 59);

            scheduled.push(
                Notifications.scheduleNotificationAsync({
                    content: {
                        title: '✨ veezy',
                        body,
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                        year: date.getFullYear(),
                        month: date.getMonth() + 1,
                        day: date.getDate(),
                        hour,
                        minute,
                        second: 0,
                    },
                })
            );
        }
    }

    await Promise.all(scheduled);
    storage.set(LAST_SCHEDULED_KEY, new Date().toISOString());
    devLog(`Scheduled ${totalNeeded} notifications over ${days} days`);
}

export async function checkAndReschedule(settings: NotificationSettings): Promise<void> {
    const lastScheduled = storage.getString(LAST_SCHEDULED_KEY);

    if (!lastScheduled) {
        await scheduleNotifications(settings);
        return;
    }

    const daysSince = (Date.now() - new Date(lastScheduled).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince >= 7) {
        await scheduleNotifications(settings);
    }
}

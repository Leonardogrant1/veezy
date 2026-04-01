import * as Notifications from 'expo-notifications';
import { createMMKV } from 'react-native-mmkv';

import { buildFeed, Category } from '@/data/quotes';
import { UserDataSettings } from '@/types/user-data';
import { devLog } from '@/utils/dev-log';

const storage = createMMKV({ id: 'notification-storage' });
const LAST_SCHEDULED_KEY = 'lastScheduled';

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

export async function scheduleNotifications(settings: UserDataSettings): Promise<void> {
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

    const allQuotes = buildFeed(selectedCategories as Category[]);
    if (allQuotes.length === 0) return;

    const MAX_NOTIFICATIONS = 60; // Puffer lassen
    const days = Math.floor(MAX_NOTIFICATIONS / notificationsPerDay);
    const totalNeeded = days * notificationsPerDay;
    let quoteIndex = 0;

    const scheduled: Promise<string>[] = [];

    for (let day = 0; day < days; day++) {
        const date = new Date();
        date.setDate(date.getDate() + day + 1);

        for (let i = 0; i < notificationsPerDay; i++) {
            const quote = allQuotes[quoteIndex % allQuotes.length];
            quoteIndex++;

            const baseHour = notificationStartHour + i * (notificationEndHour - notificationStartHour) / notificationsPerDay;
            const hour = Math.floor(baseHour);
            const baseMinute = Math.round((baseHour % 1) * 60);
            const offset = randomizeNotificationTimes ? Math.floor(Math.random() * 21) - 10 : 0;
            const minute = clamp(baseMinute + offset, 0, 59);

            const body = quote.author ? `"${quote.text}" — ${quote.author}` : quote.text;

            scheduled.push(
                Notifications.scheduleNotificationAsync({
                    content: {
                        title: 'Discipl',
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

export async function checkAndReschedule(settings: UserDataSettings): Promise<void> {
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

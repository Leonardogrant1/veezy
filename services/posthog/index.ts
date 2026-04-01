import PostHog from 'posthog-react-native';

export const posthog = new PostHog(
    process.env.EXPO_PUBLIC_POSTHOG_EU_API_KEY ?? '',
    { host: process.env.EXPO_PUBLIC_POSTHOG_URL ?? 'https://eu.i.posthog.com' }
);

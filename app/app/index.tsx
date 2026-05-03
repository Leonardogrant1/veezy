import * as SplashScreen from 'expo-splash-screen';
import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { useAppReadyStore } from '@/stores/AppReadyStore';
import { useUserDataStore } from '@/stores/UserDataStore';

export default function Index() {
    const cloudSyncReady = useAppReadyStore((s) => s.cloudSyncReady);
    const hasOnboarded = useUserDataStore((s) => s.hasOnboarded);
    const hasSeenTutorial = useUserDataStore((s) => s.hasSeenTutorial);

    useEffect(() => {
        if (cloudSyncReady) {
            SplashScreen.hideAsync();
        }
    }, [cloudSyncReady]);

    if (!cloudSyncReady) return null;
    if (!hasOnboarded) return <Redirect href="/start" />;
    if (!hasSeenTutorial) return <Redirect href="/tutorial" />;
    return <Redirect href="/home" />;
}


import { useUserDataStore } from '@/stores/UserDataStore';
import { Redirect } from 'expo-router';



export default function Index() {
    const hasCompletedOnboarding = useUserDataStore((s) => s.hasCompletedOnboarding);
    const hasSeenTutorial = useUserDataStore((s) => s.hasSeenTutorial);

    if (!hasCompletedOnboarding) {
        return <Redirect href="/start" />
    }

    if (!hasSeenTutorial) {
        return <Redirect href="/tutorial" />
    }

    return <Redirect href="/home" />
}


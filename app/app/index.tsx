import { Redirect } from 'expo-router';

export default function Index() {
    return <Redirect href="/home" />;

    // TODO: re-enable onboarding flow
    // const hasCompletedOnboarding = useUserDataStore((s) => s.hasCompletedOnboarding);
    // const hasSeenTutorial = useUserDataStore((s) => s.hasSeenTutorial);
    // if (!hasCompletedOnboarding) return <Redirect href="/start" />;
    // if (!hasSeenTutorial) return <Redirect href="/tutorial" />;
    // return <Redirect href="/home" />;
}


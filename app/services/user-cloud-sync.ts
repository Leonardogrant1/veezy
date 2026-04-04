import { fetch } from 'expo/fetch';
import { useUserDataStore } from '@/stores/UserDataStore';
import { useVisionStore } from '@/stores/VisionStore';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';

export class UserCloudSync {
    static async upload(): Promise<void> {
        const userId = useUserDataStore.getState().userId;
        if (!userId) return;

        const s = useUserDataStore.getState();
        const backup = {
            visions: useVisionStore.getState().visions,
            hasOnboarded: s.hasOnboarded,
            hasSeenTutorial: s.hasSeenTutorial,
            name: s.name,
            age: s.age,
            gender: s.gender,
            notifications: s.notifications,
            imagesUsed: s.imagesUsed,
            selfReferenceImages: s.selfReferenceImages,
        };

        await fetch(`${BACKEND_URL}/user-data/backup`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-rc-user-id': userId,
            },
            body: JSON.stringify(backup),
        });
    }

    static async deleteVisionImage(visionId: string): Promise<void> {
        const userId = useUserDataStore.getState().userId;
        if (!userId) return;

        await fetch(`${BACKEND_URL}/user-data/vision-image?visionId=${visionId}`, {
            method: 'DELETE',
            headers: { 'x-rc-user-id': userId },
        });
    }

    static async restore(): Promise<boolean> {
        const userId = useUserDataStore.getState().userId;
        if (!userId) return false;

        // Skip restore if this is not a fresh install
        if (useVisionStore.getState().visions.length > 0) return false;

        const res = await fetch(`${BACKEND_URL}/user-data/backup`, {
            headers: { 'x-rc-user-id': userId },
        });
        if (!res.ok) return false; // 404 = no backup exists yet

        const backup = await res.json() as {
            visions: any[];
            hasOnboarded: boolean;
            hasSeenTutorial: boolean;
            name: string;
            age: number;
            gender: 'male' | 'female' | 'other';
            notifications: boolean;
            imagesUsed: number;
            selfReferenceImages: {
                face_front: string | null;
                face_left: string | null;
                face_right: string | null;
                body: string | null;
            };
        };

        const { visions, ...userData } = backup;
        useVisionStore.setState({ visions });
        useUserDataStore.setState({
            hasOnboarded: userData.hasOnboarded ?? false,
            hasSeenTutorial: userData.hasSeenTutorial ?? false,
            name: userData.name ?? '',
            age: userData.age ?? 0,
            gender: userData.gender ?? 'other',
            notifications: userData.notifications ?? false,
            imagesUsed: userData.imagesUsed ?? 0,
            selfReferenceImages: userData.selfReferenceImages ?? {
                face_front: null,
                face_left: null,
                face_right: null,
                body: null,
            },
        });

        return true;
    }
}

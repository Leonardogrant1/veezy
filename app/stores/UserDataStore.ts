import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { storage, StorageKeys } from '@/lib/storage';
import { SelfReferenceImages, UserData } from '@/types/user-data';


const mmkvStorage = createJSONStorage(() => ({
    getItem: (name: string) => storage.getString(name) ?? null,
    setItem: (name: string, value: string) => storage.set(name, value),
    removeItem: (name: string) => storage.remove(name),
}));

type UserDataStore = UserData & {
    completeOnboarding: () => void;
    completeTutorial: () => void;
    updateSettings: (patch: Partial<Pick<UserData, 'name' | 'birthday' | 'gender' | 'notifications' | 'notificationsPerDay' | 'notificationStartHour' | 'notificationEndHour' | 'haptics' | 'motivationStyle' | 'primaryCategory'>>) => void;
    updateSelfReferenceImages: (patch: Partial<SelfReferenceImages>) => void;
};

export const useUserDataStore = create<UserDataStore>()(
    persist(
        (set) => ({
            _hydrated: false,
            userId: '',
            hasOnboarded: false,
            hasSeenTutorial: false,
            name: '',
            birthday: null,
            gender: 'other' as const,
            notifications: false,
            notificationsPerDay: 3,
            notificationStartHour: 8,
            notificationEndHour: 21,
            haptics: true,
            motivationStyle: 'affirmation' as const,
            primaryCategory: null,
            imagesUsed: 0,
            isPremium: false,
            selfReferenceImages: { face_front: null, face_left: null, face_right: null, body: null },
            completeOnboarding: () => set({ hasOnboarded: true }),
            completeTutorial: () => set({ hasSeenTutorial: true }),
            updateSettings: (patch) => set((s) => ({ ...s, ...patch })),
            updateSelfReferenceImages: (patch) => set((s) => ({
                selfReferenceImages: { ...s.selfReferenceImages, ...patch },
            })),
        }),
        {
            name: StorageKeys.USER_DATA,
            storage: mmkvStorage
        }
    )
);

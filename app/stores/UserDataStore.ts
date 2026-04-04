import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { storage, StorageKeys } from '@/lib/storage';
import { SelfReferenceImages, UserData } from '@/types/user-data';


const mmkvStorage = createJSONStorage(() => ({
    getItem: (name: string) => storage.getString(name) ?? null,
    setItem: (name: string, value: string) => storage.set(name, value),
    removeItem: (name: string) => storage.delete(name),
}));

type UserDataStore = UserData & {
    completeOnboarding: () => void;
    completeTutorial: () => void;
    updateSettings: (patch: Partial<Pick<UserData, 'name' | 'age' | 'gender' | 'notifications'>>) => void;
    updateSelfReferenceImages: (patch: Partial<SelfReferenceImages>) => void;
};

export const useUserDataStore = create<UserDataStore>()(
    persist(
        (set) => ({
            userId: '',
            hasOnboarded: false,
            hasSeenTutorial: false,
            name: '',
            age: 0,
            gender: 'other' as const,
            notifications: false,
            imagesUsed: 0,
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
            storage: mmkvStorage,
        }
    )
);

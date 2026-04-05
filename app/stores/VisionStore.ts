import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { storage, StorageKeys } from '@/lib/storage';
import { Vision } from '@/types/vision';

const mmkvStorage = createJSONStorage(() => ({
    getItem: (name: string) => storage.getString(name) ?? null,
    setItem: (name: string, value: string) => storage.set(name, value),
    removeItem: (name: string) => storage.remove(name),
}));

type VisionStore = {
    visions: Vision[];
    addVision: (vision: Omit<Vision, 'createdAt'> & { id?: string }) => void;
    updatePhrase: (id: string, phrase: string) => void;
    updateImage: (id: string, imagePath: string) => void;
    deleteVision: (id: string) => void;
};

export const useVisionStore = create<VisionStore>()(
    persist(
        (set) => ({
            visions: [],
            addVision: (vision) => set((s) => ({
                visions: [...s.visions, { ...vision, id: vision.id ?? Date.now().toString(), createdAt: new Date().toISOString(), imageVersion: 1 }],
            })),
            updatePhrase: (id, phrase) => set((s) => ({
                visions: s.visions.map((v) => v.id === id ? { ...v, phrase } : v),
            })),
            updateImage: (id, imagePath) => set((s) => ({
                visions: s.visions.map((v) => v.id === id ? { ...v, imagePath, imageVersion: (v.imageVersion ?? 1) + 1 } : v),
            })),
            deleteVision: (id) => set((s) => ({
                visions: s.visions.filter((v) => v.id !== id),
            })),
        }),
        {
            name: StorageKeys.VISIONS,
            storage: mmkvStorage,
        }
    )
);

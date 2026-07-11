import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { storage, StorageKeys } from '@/lib/storage';
import { Vision, VisionStatus } from '@/types/vision';

const mmkvStorage = createJSONStorage(() => ({
    getItem: (name: string) => storage.getString(name) ?? null,
    setItem: (name: string, value: string) => storage.set(name, value),
    removeItem: (name: string) => storage.remove(name),
}));

type VisionStore = {
    visions: Vision[];
    focusVisionId: string | null;
    addVision: (vision: Omit<Vision, 'createdAt'> & { id?: string }) => void;
    updatePhrase: (id: string, phrase: string) => void;
    updateImage: (id: string, imagePath: string) => void;
    setVisionStatus: (id: string, status: VisionStatus) => void;
    setFocusVisionId: (id: string | null) => void;
    deleteVision: (id: string) => void;
};

export const useVisionStore = create<VisionStore>()(
    persist(
        (set) => ({
            visions: [],
            focusVisionId: null,
            addVision: (vision) => set((s) => ({
                visions: [...s.visions, { ...vision, id: vision.id ?? Date.now().toString(), createdAt: new Date().toISOString(), imageVersion: 1 }],
            })),
            updatePhrase: (id, phrase) => set((s) => ({
                visions: s.visions.map((v) => v.id === id ? { ...v, phrase } : v),
            })),
            updateImage: (id, imagePath) => set((s) => ({
                visions: s.visions.map((v) => v.id === id ? { ...v, imagePath, imageVersion: (v.imageVersion ?? 1) + 1, status: 'ready' as const, pendingSince: undefined } : v),
            })),
            setVisionStatus: (id, status) => set((s) => ({
                visions: s.visions.map((v) => v.id === id ? { ...v, status, pendingSince: status === 'pending' ? Date.now() : undefined } : v),
            })),
            setFocusVisionId: (id) => set({ focusVisionId: id }),
            deleteVision: (id) => set((s) => ({
                visions: s.visions.filter((v) => v.id !== id),
            })),
        }),
        {
            name: StorageKeys.VISIONS,
            storage: mmkvStorage,
            partialize: (s) => ({ visions: s.visions }) as Pick<VisionStore, 'visions'>,
        }
    )
);

import { create } from 'zustand';

interface AppReadyStore {
    cloudSyncReady: boolean;
}

export const useAppReadyStore = create<AppReadyStore>()(() => ({
    cloudSyncReady: false,
}));

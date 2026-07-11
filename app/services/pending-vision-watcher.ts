import { AppState } from 'react-native';

import { MediaHandler } from '@/lib/media-handler';
import { WidgetBridge } from '@/services/widgets/widget-bridge';
import { useUserDataStore } from '@/stores/UserDataStore';
import { useVisionStore } from '@/stores/VisionStore';
import { devLog } from '@/utils/dev-log';
import { fetchVisionStatus } from '@/utils/generateVision';

const POLL_INTERVAL_MS = 10_000;
const PENDING_TIMEOUT_MS = 5 * 60 * 1000;

let started = false;
let checking = false;
let onCompleted: (() => void) | null = null;

async function checkNow(): Promise<void> {
    if (checking) return;
    checking = true;
    try {
        const { visions, updateImage, setVisionStatus } = useVisionStore.getState();
        const pending = visions.filter((v) => v.status === 'pending');
        if (pending.length === 0) return;

        const userId = useUserDataStore.getState().userId;
        if (!userId) return;

        await Promise.all(pending.map(async (v) => {
            try {
                const res = await fetchVisionStatus(v.id, userId);
                if (res.status === 'done' && res.signedUrl && res.imageKey) {
                    const path = await MediaHandler.saveFromRemote(res.signedUrl, res.imageKey);
                    updateImage(v.id, path);
                    WidgetBridge.updateImage(path, v.id).catch(() => { });
                    WidgetBridge.sync(useVisionStore.getState().visions).catch(() => { });
                    onCompleted?.();
                    return;
                }
                if (res.status === 'failed') {
                    setVisionStatus(v.id, 'failed');
                    return;
                }
                // Still pending server-side — client timeout is only the fallback
                if (v.pendingSince && Date.now() - v.pendingSince > PENDING_TIMEOUT_MS) {
                    devLog('Pending vision timed out:', v.id);
                    setVisionStatus(v.id, 'failed');
                }
            } catch {
                // Status fetch failed — apply the timeout so visions don't hang forever
                if (v.pendingSince && Date.now() - v.pendingSince > PENDING_TIMEOUT_MS) {
                    setVisionStatus(v.id, 'failed');
                }
            }
        }));
    } finally {
        checking = false;
    }
}

export const PendingVisionWatcher = {
    start(): void {
        if (started) return;
        started = true;
        setInterval(() => { void checkNow(); }, POLL_INTERVAL_MS);
        AppState.addEventListener('change', (state) => {
            if (state === 'active') void checkNow();
        });
        void checkNow();
    },
    checkNow,
    setOnCompleted(cb: () => void): void {
        onCompleted = cb;
    },
};

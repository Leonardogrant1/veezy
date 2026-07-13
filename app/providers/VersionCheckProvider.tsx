import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { ForceUpdateScreen } from '@/components/version/ForceUpdateScreen';
import { UpdateSheet } from '@/components/version/UpdateSheet';
import { storage, StorageKeys } from '@/lib/storage';
import { COOLDOWN_MS, compareVersions, fetchStoreVersion, fetchVersionCheck } from '@/services/version-check';

type UpdateStatus = 'ok' | 'update_available' | 'force_update';

type State = {
    status: UpdateStatus;
    storeVersion: string | null;
    releaseNotes: string | null;
};

const BACKGROUND_THRESHOLD_MS = 60 * 1000;

function isCooldownActive(): boolean {
    const raw = storage.getString(StorageKeys.VERSION_DIALOG_DISMISSED_AT);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    return Number.isFinite(dismissedAt) && Date.now() - dismissedAt < COOLDOWN_MS;
}

function setCooldown(): void {
    storage.set(StorageKeys.VERSION_DIALOG_DISMISSED_AT, String(Date.now()));
}

export function VersionCheckProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<State>({ status: 'ok', storeVersion: null, releaseNotes: null });
    const backgroundedAt = useRef<number | null>(null);
    const mountedRef = useRef(true);

    async function runChecks() {
        const localVersion = Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? null;
        if (!localVersion) return;

        const [storeResult, checkResult] = await Promise.allSettled([
            fetchStoreVersion(),
            fetchVersionCheck(localVersion),
        ]);

        if (!mountedRef.current) return;

        // DEBUG: Force-Update erzwingen zum Testen
        // const checkResult = { status: 'fulfilled' as const, value: { updateRequired: true } };

        // Backend-Kompatibilitäts-Check hat höchste Priorität
        if (checkResult.status === 'fulfilled' && checkResult.value.updateRequired) {
            setState({ status: 'force_update', storeVersion: null, releaseNotes: null });
            return;
        }

        if (storeResult.status === 'fulfilled') {
            const { version: storeVersion, releaseNotes } = storeResult.value;
            const diff = compareVersions(localVersion, storeVersion);
            if (diff === 'major') {
                setState({ status: 'force_update', storeVersion, releaseNotes });
                return;
            }
            if (diff === 'minor') {
                setState({
                    status: isCooldownActive() ? 'ok' : 'update_available',
                    storeVersion,
                    releaseNotes,
                });
                return;
            }
        }

        // patch, equal oder fehlgeschlagene Checks → ok (fail open)
        setState({ status: 'ok', storeVersion: null, releaseNotes: null });
    }

    useEffect(() => {
        runChecks();

        const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
            if (nextState === 'background' || nextState === 'inactive') {
                backgroundedAt.current = Date.now();
            } else if (nextState === 'active' && backgroundedAt.current !== null) {
                const elapsed = Date.now() - backgroundedAt.current;
                backgroundedAt.current = null;
                if (elapsed >= BACKGROUND_THRESHOLD_MS) {
                    runChecks();
                }
            }
        });

        return () => {
            mountedRef.current = false;
            sub.remove();
        };
    }, []);

    function handleDismiss() {
        setCooldown();
        setState((prev) => ({ ...prev, status: 'ok' }));
    }

    if (state.status === 'force_update') {
        return <ForceUpdateScreen releaseNotes={state.releaseNotes} />;
    }

    return (
        <>
            {children}
            {state.status === 'update_available' && state.storeVersion ? (
                <UpdateSheet
                    storeVersion={state.storeVersion}
                    releaseNotes={state.releaseNotes}
                    onDismiss={handleDismiss}
                />
            ) : null}
        </>
    );
}

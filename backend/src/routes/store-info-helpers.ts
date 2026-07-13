import gplay from 'google-play-scraper';

export type StoreInfo = { version: string; releaseNotes: string };

type AppStoreLookupResponse = {
    results?: { version: string; releaseNotes?: string }[];
};

export async function fetchIosVersionInfo(bundleId: string): Promise<StoreInfo> {
    const res = await fetch(`https://itunes.apple.com/lookup?bundleId=${bundleId}`);
    if (!res.ok) throw new Error(`iTunes lookup failed: ${res.status}`);
    const json = (await res.json()) as AppStoreLookupResponse;
    const result = json.results?.[0];
    if (!result) throw new Error('App not found in App Store');
    return { version: result.version, releaseNotes: result.releaseNotes ?? '' };
}

export async function fetchAndroidVersionInfo(appId: string): Promise<StoreInfo> {
    const appInfo = await gplay.app({ appId });
    return { version: appInfo.version, releaseNotes: appInfo.recentChanges ?? '' };
}

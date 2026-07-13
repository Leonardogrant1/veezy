import { Hono } from 'hono';
import { ANDROID_PACKAGE_NAME, IOS_BUNDLE_ID } from '../config/version-config.js';
import { logger } from '../utils/logger.js';
import { getCached, getStale, setCached } from '../utils/ttl-cache.js';
import { fetchAndroidVersionInfo, fetchIosVersionInfo, type StoreInfo } from './store-info-helpers.js';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

const storeInfoRoute = new Hono();

async function handleStoreInfo(
    cacheKey: string,
    fetchInfo: () => Promise<StoreInfo>,
): Promise<{ body: StoreInfo | { error: string }; status: 200 | 502 }> {
    const cached = getCached<StoreInfo>(cacheKey);
    if (cached) return { body: cached, status: 200 };

    try {
        const info = await fetchInfo();
        setCached(cacheKey, info, TWO_HOURS_MS);
        return { body: info, status: 200 };
    } catch (error) {
        logger.error({ error, cacheKey }, 'store info fetch failed');
        // Abgelaufener Cache ist besser als gar keine Antwort
        const stale = getStale<StoreInfo>(cacheKey);
        if (stale) return { body: stale, status: 200 };
        return { body: { error: 'store info unavailable' }, status: 502 };
    }
}

storeInfoRoute.get('/ios', async (c) => {
    const { body, status } = await handleStoreInfo('store-info-ios', () => fetchIosVersionInfo(IOS_BUNDLE_ID));
    return c.json(body, status);
});

storeInfoRoute.get('/android', async (c) => {
    const { body, status } = await handleStoreInfo('store-info-android', () => fetchAndroidVersionInfo(ANDROID_PACKAGE_NAME));
    return c.json(body, status);
});

export default storeInfoRoute;

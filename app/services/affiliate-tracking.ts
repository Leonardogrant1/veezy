import Purchases from 'react-native-purchases';
import { getBuildEnvironment } from '@/utils/build-environment';

export type AffiliateTrackResult = 'success' | 'not_found' | 'network_error';

const AFFILIATE_TRACK_URL = 'https://www.northbyte.studio/api/affiliate/track';

export async function trackAffiliateCode(affiliateCode: string): Promise<AffiliateTrackResult> {
    try {
        const revenueCatUserId = await Purchases.getAppUserID();
        if (!revenueCatUserId) return 'network_error';
        const response = await fetch(AFFILIATE_TRACK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                appSlug: 'veezy',
                affiliateCode,
                // veezy hat keine separate App-User-ID — RevenueCat ist die Identität
                appUserId: revenueCatUserId,
                revenueCatUserId,
                environment: getBuildEnvironment(),
            }),
        });
        if (response.status === 201) return 'success';
        if (response.status === 404) return 'not_found';
        return 'network_error';
    } catch {
        return 'network_error';
    }
}

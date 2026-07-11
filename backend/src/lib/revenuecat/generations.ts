import { logger } from '@/utils/logger.js';
import { RevenueCatClient } from './client.js';
import { RCAttribute } from './types.js';

const ATTR_COUNT = 'generation_count';
const DEFAULT_GENERATIONS = 3;

function getRawCount(attributes: RCAttribute[]): number | null {
    const attr = attributes.find((a) => a.name === ATTR_COUNT);
    if (!attr) return null;
    return parseInt(attr.value, 10);
}

export async function ensureGenerationCount(userId: string): Promise<number> {
    const attributes = await RevenueCatClient.fetchAttributes(userId);
    const count = getRawCount(attributes);
    if (count !== null) return count;
    await RevenueCatClient.setAttributes(userId, { [ATTR_COUNT]: String(DEFAULT_GENERATIONS) });
    return DEFAULT_GENERATIONS;
}

export async function deductGeneration(userId: string, currentCount: number): Promise<void> {
    try {
        await RevenueCatClient.setAttributes(userId, { [ATTR_COUNT]: String(currentCount - 1) });
    } catch (err: any) {
        logger.error({ err: err.message }, 'Failed to deduct generation_count');
    }
}

export async function refundGeneration(userId: string): Promise<void> {
    try {
        const count = await ensureGenerationCount(userId);
        await RevenueCatClient.setAttributes(userId, { [ATTR_COUNT]: String(count + 1) });
    } catch (err: any) {
        logger.error({ err: err.message }, 'Failed to refund generation_count');
    }
}

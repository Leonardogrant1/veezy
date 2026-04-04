import { logger } from '@/utils/logger.js';
import { RevenueCatClient } from './client.js';
import { RCCustomer } from './types.js';

const ATTR_COUNT = 'generation_count';
const DEFAULT_GENERATIONS = 3;

function getRawCount(customer: RCCustomer): number | null {
    const items = customer.attributes?.items;
    if (!items) return null;
    const attr = items.find((a) => a.name === ATTR_COUNT);
    if (!attr) return null;
    return parseInt(attr.value, 10);
}

export function getGenerationCount(customer: RCCustomer): number {
    return getRawCount(customer) ?? 0;
}

export async function ensureGenerationCount(userId: string, customer: RCCustomer): Promise<number> {
    const count = getRawCount(customer);
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

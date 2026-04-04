import { RevenueCatClient } from '@/lib/revenuecat/client.js';
import type { RCCustomer } from '@/lib/revenuecat/types.js';
import { logger } from '@/utils/logger.js';
import { createMiddleware } from 'hono/factory';

export const revenuecatAuth = createMiddleware<{
    Variables: { rcUserId: string; rcCustomer: RCCustomer };
}>(async (c, next) => {
    const userId = c.req.header('x-rc-user-id');
    if (!userId) return c.json({ error: 'Missing x-rc-user-id header' }, 401);

    try {
        const customer = await RevenueCatClient.fetchCustomer(userId);
        c.set('rcUserId', userId);
        c.set('rcCustomer', customer);
        return next();
    } catch (err: any) {
        if (err.status === 404) return c.json({ error: 'Invalid user' }, 401);
        logger.error({ err: err.message }, 'RevenueCat auth failed');
        return c.json({ error: 'Auth check failed' }, 500);
    }
});

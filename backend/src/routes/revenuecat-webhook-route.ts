import { RevenueCatClient } from '@/lib/revenuecat/client.js';
import { logger } from '@/utils/logger.js';
import { Hono } from 'hono';

const GENERATIONS_BY_PRODUCT: Record<string, number> = {
    veezy_premium_weekly: 10,
    veezy_premium_yearly: 180,
};

const revenueCatWebhookRoute = new Hono();

revenueCatWebhookRoute.post('/', async (c) => {
    // Verify webhook secret
    const authHeader = c.req.header('Authorization');
    const secret = process.env.REVENUECAT_WEBHOOK_SECRET;

    if (!secret) {
        logger.error('REVENUECAT_WEBHOOK_SECRET is not configured');
        return c.json({ error: 'Server configuration error' }, 500);
    }

    if (authHeader !== `Bearer ${secret}`) {
        logger.warn('RevenueCat webhook unauthorized attempt');
        return c.json({ error: 'Unauthorized' }, 401);
    }

    let body: any;
    try {
        body = await c.req.json();
    } catch {
        return c.json({ error: 'Invalid JSON' }, 400);
    }

    const event = body?.event;
    if (!event?.type || !event?.app_user_id) {
        return c.json({ error: 'Invalid event payload' }, 400);
    }

    const { type, app_user_id: userId, product_id, environment } = event;

    logger.info({ type, userId, product_id, environment }, 'RevenueCat webhook received');

    try {
        switch (type) {
            case 'INITIAL_PURCHASE':
            case 'RENEWAL':
            case 'UNCANCELLATION': {
                const toAdd = GENERATIONS_BY_PRODUCT[product_id];
                if (!toAdd) {
                    logger.warn({ userId, type, product_id }, 'Unknown product_id, skipping generation grant');
                    break;
                }
                await RevenueCatClient.setAttributes(userId, {
                    generation_count: String(toAdd),
                });
                logger.info({ userId, type, product_id, granted: toAdd }, 'Generations reset');
                break;
            }

            case 'EXPIRATION': {
                await RevenueCatClient.setAttributes(userId, {
                    generation_count: '0',
                });
                logger.info({ userId, type }, 'Subscription expired — generation count reset to 0');
                break;
            }

            case 'CANCELLATION':
            case 'BILLING_ISSUE':
            case 'PRODUCT_CHANGE':
                // No action needed — entitlements are fetched live from RC on each request
                logger.info({ userId, type }, 'Subscription event logged');
                break;

            default:
                logger.info({ type, userId }, 'Unhandled RevenueCat event type');
        }
    } catch (err: any) {
        logger.error({ err: err.message, type, userId }, 'Failed to process RevenueCat webhook event');
        return c.json({ error: 'Processing error' }, 500);
    }

    return c.json({ ok: true });
});

export default revenueCatWebhookRoute;

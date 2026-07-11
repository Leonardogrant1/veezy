import { Hono } from 'hono';
import { sendPushNotification } from '@/lib/expo/push.js';
import { revenuecatAuth } from '@/middleware/revenuecat-auth.js';
import { R2Storage } from '@/lib/r2/storage.js';
import { ensureGenerationCount } from '@/lib/revenuecat/generations.js';
import { RCCustomer } from '@/lib/revenuecat/types.js';
import { logger } from '@/utils/logger.js';

const userDataRoute = new Hono<{
    Variables: { rcUserId: string; rcCustomer: RCCustomer };
}>();

userDataRoute.get('/backup', revenuecatAuth, async (c) => {
    const userId = c.var.rcUserId;
    const buffer = await R2Storage.downloadBuffer(`user-data/${userId}.json`);
    if (!buffer || buffer.length === 0) {
        logger.warn({ userId }, 'No backup found for user');
        return c.json({ error: 'Not found' }, 404);
    }
    const text = buffer.toString('utf8');
    try {
        return c.json(JSON.parse(text));
    } catch {
        return c.json({ error: 'Corrupt backup' }, 500);
    }
});

userDataRoute.put('/backup', revenuecatAuth, async (c) => {
    const userId = c.var.rcUserId;
    const body = await c.req.text();

    // Validate incoming data is non-empty JSON
    let parsed: unknown;
    try {
        parsed = JSON.parse(body);
    } catch {
        logger.warn({ userId }, 'Backup rejected: invalid JSON');
        return c.json({ error: 'Invalid JSON' }, 400);
    }

    const isEmpty =
        parsed === null ||
        parsed === undefined ||
        (typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed as object).length === 0) ||
        (Array.isArray(parsed) && (parsed as unknown[]).length === 0);

    if (isEmpty) {
        // Check if existing backup exists in R2 — if so, refuse to overwrite with empty data
        const existing = await R2Storage.downloadBuffer(`user-data/${userId}.json`);
        if (existing && existing.length > 0) {
            logger.warn({ userId }, 'Backup rejected: attempted to overwrite existing data with empty payload');
            return c.json({ error: 'Cannot overwrite existing backup with empty data' }, 409);
        }
        logger.warn({ userId }, 'Backup rejected: empty payload, no existing data to protect');
        return c.json({ error: 'Empty backup not allowed' }, 400);
    }

    await R2Storage.uploadBuffer(
        `user-data/${userId}.json`,
        Buffer.from(body, 'utf8'),
        'application/json',
    );
    return c.json({ ok: true });
});

userDataRoute.get('/signed-url', revenuecatAuth, async (c) => {
    const userId = c.var.rcUserId;
    const key = c.req.query('key');
    if (!key) return c.json({ error: 'key query param required' }, 400);

    const allowed =
        key.startsWith(`vision-images/${userId}/`) ||
        key.startsWith(`self-reference/${userId}/`);
    if (!allowed) return c.json({ error: 'Forbidden' }, 403);

    const url = await R2Storage.getSignedUrl(key);
    return c.json({ url });
});

userDataRoute.get('/generations', revenuecatAuth, async (c) => {
    const userId = c.var.rcUserId;
    const count = await ensureGenerationCount(userId);
    return c.json({ count });
});

userDataRoute.delete('/vision-image', revenuecatAuth, async (c) => {
    const userId = c.var.rcUserId;
    const visionId = c.req.query('visionId');
    if (!visionId) return c.json({ error: 'visionId query param required' }, 400);

    await R2Storage.deleteImage(`vision-images/${userId}/${visionId}`);
    return c.json({ ok: true });
});

// Dev helper: sends a real remote push to the caller's stored token,
// exercising the full chain (R2 token -> Expo Push API -> device).
userDataRoute.post('/test-push', revenuecatAuth, async (c) => {
    const userId = c.var.rcUserId;
    const buf = await R2Storage.downloadBuffer(`user-data/${userId}/push-token`);
    const token = buf?.toString('utf8');
    if (!token) return c.json({ error: 'No push token stored for this user' }, 404);

    await sendPushNotification(token, {
        title: 'DEV: Test Remote Push 🚀',
        body: 'Die Push-Kette funktioniert (R2 → Expo → Gerät).',
        data: { test: 'true' },
    });
    return c.json({ ok: true });
});

userDataRoute.put('/push-token', revenuecatAuth, async (c) => {
    const userId = c.var.rcUserId;
    const body = await c.req.json<{ token?: unknown }>().catch(() => ({ token: undefined }));
    const token = body.token;
    if (!token || typeof token !== 'string') {
        return c.json({ error: 'token is required' }, 400);
    }
    await R2Storage.uploadBuffer(
        `user-data/${userId}/push-token`,
        Buffer.from(token, 'utf8'),
        'text/plain',
    );
    return c.json({ ok: true });
});

export default userDataRoute;

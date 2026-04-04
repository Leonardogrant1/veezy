import { Hono } from 'hono';
import { revenuecatAuth } from '@/middleware/revenuecat-auth.js';
import { R2Storage } from '@/lib/r2/storage.js';
import { RCCustomer } from '@/lib/revenuecat/types.js';

const userDataRoute = new Hono<{
    Variables: { rcUserId: string; rcCustomer: RCCustomer };
}>();

userDataRoute.get('/backup', revenuecatAuth, async (c) => {
    const userId = c.var.rcUserId;
    const buffer = await R2Storage.downloadBuffer(`user-data/${userId}.json`);
    if (!buffer) return c.json({ error: 'Not found' }, 404);
    return c.json(JSON.parse(buffer.toString('utf8')));
});

userDataRoute.put('/backup', revenuecatAuth, async (c) => {
    const userId = c.var.rcUserId;
    const body = await c.req.text();
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

userDataRoute.delete('/vision-image', revenuecatAuth, async (c) => {
    const userId = c.var.rcUserId;
    const visionId = c.req.query('visionId');
    if (!visionId) return c.json({ error: 'visionId query param required' }, 400);

    await R2Storage.deleteImage(`vision-images/${userId}/${visionId}`);
    return c.json({ ok: true });
});

export default userDataRoute;

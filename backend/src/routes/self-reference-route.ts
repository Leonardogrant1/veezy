import sharp from 'sharp';
import { Hono } from 'hono';
import { revenuecatAuth } from '../middleware/revenuecat-auth.js';
import { R2Storage } from '../lib/r2/storage.js';
import { describePersonFromImages } from '../prompts/describe-person.js';
import { getSelfReferenceKey } from '../utils/get-self-reference-key.js';

const selfReferenceRoute = new Hono();

const VALID_TYPES = ['face_front', 'face_smile', 'face_left', 'face_right', 'body'] as const;
type ValidType = typeof VALID_TYPES[number];

selfReferenceRoute.post('/presign', revenuecatAuth, async (c) => {
    const { types } = await c.req.json<{ types: string[] }>();

    if (!Array.isArray(types) || types.length === 0) {
        return c.json({ error: 'types must be a non-empty array' }, 400);
    }

    const invalid = types.find((t) => !VALID_TYPES.includes(t as ValidType));
    if (invalid) return c.json({ error: `Invalid type: ${invalid}` }, 400);

    const entries = await Promise.all(
        (types as ValidType[]).map(async (type) => {
            const key = getSelfReferenceKey(c.var.rcUserId, type);
            const url = await R2Storage.getSignedUploadUrl(key);
            return [type, url] as const;
        })
    );

    return c.json({ urls: Object.fromEntries(entries) });
});

const THUMB_W = 384;
const THUMB_H = 512; // 3:4

selfReferenceRoute.post('/composite', revenuecatAuth, async (c) => {
    const userId = c.var.rcUserId;

    // Download all available self-reference images in parallel
    const buffers = (
        await Promise.all(
            VALID_TYPES.map((type) => R2Storage.downloadBuffer(getSelfReferenceKey(userId, type)))
        )
    ).filter((b): b is Buffer => b !== null);

    if (buffers.length === 0) {
        return c.json({ error: 'No self-reference images found' }, 400);
    }

    // Resize each to fixed thumbnail size
    const thumbs = await Promise.all(
        buffers.map((buf) =>
            sharp(buf).resize(THUMB_W, THUMB_H, { fit: 'cover', position: 'top' }).toBuffer()
        )
    );

    // Layout: 2-column grid
    const cols = Math.min(2, thumbs.length);
    const rows = Math.ceil(thumbs.length / cols);
    const canvasW = cols * THUMB_W;
    const canvasH = rows * THUMB_H;

    const composite = await sharp({
        create: { width: canvasW, height: canvasH, channels: 3, background: { r: 18, g: 18, b: 18 } },
    })
        .composite(
            thumbs.map((input, i) => ({
                input,
                left: (i % cols) * THUMB_W,
                top: Math.floor(i / cols) * THUMB_H,
            }))
        )
        .jpeg({ quality: 82 })
        .toBuffer();

    const compositeKey = getSelfReferenceKey(userId, 'composite');
    await R2Storage.uploadBuffer(compositeKey, composite);

    // Regenerate cached person description (awaited so frontend can proceed after description is ready)
    const compositeBase64 = composite.toString('base64');
    await describePersonFromImages([compositeBase64])
        .then((description) =>
            R2Storage.uploadBuffer(
                getSelfReferenceKey(userId, 'description'),
                Buffer.from(description, 'utf8'),
                'text/plain',
            )
        )
        .catch(() => {}); // non-critical fallback

    return c.json({ ok: true });
});

export default selfReferenceRoute;

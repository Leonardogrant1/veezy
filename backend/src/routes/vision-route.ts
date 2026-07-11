import { sendPushNotification } from '@/lib/expo/push.js';
import { generateImage } from '@/lib/images/generate-image.js';
import { R2Storage } from '@/lib/r2/storage.js';
import { deductGeneration, ensureGenerationCount } from '@/lib/revenuecat/generations.js';
import { RCCustomer } from '@/lib/revenuecat/types.js';
import { revenuecatAuth } from '@/middleware/revenuecat-auth.js';
import { describePersonFromImages } from '@/prompts/describe-person.js';
import { generateSceneDescription } from '@/prompts/generate-scene.js';
import { generatePhraseAndAffirmations } from '@/prompts/phrase.js';
import { getSelfReferenceKey } from '@/utils/get-self-reference-key.js';
import { logger } from '@/utils/logger.js';
import { Hono } from 'hono';

const visionRoute = new Hono<{
    Variables: { rcUserId: string; rcCustomer: RCCustomer };
}>();

type VisionStatus = 'pending' | 'done' | 'failed';

interface WorkerPayload {
    userId: string;
    visionId: string;
    visionDescription: string;
    existingPhrases?: string[];
    language: 'de' | 'en';
}

const statusKey = (userId: string, visionId: string) => `vision-status/${userId}/${visionId}`;
const imageKeyFor = (userId: string, visionId: string) => `vision-images/${userId}/${visionId}`;

async function writeStatus(userId: string, visionId: string, status: VisionStatus): Promise<void> {
    await R2Storage.uploadBuffer(
        statusKey(userId, visionId),
        Buffer.from(JSON.stringify({ status }), 'utf8'),
        'application/json',
    );
}

async function readStatus(userId: string, visionId: string): Promise<VisionStatus | null> {
    const buf = await R2Storage.downloadBuffer(statusKey(userId, visionId));
    if (!buf) return null;
    try {
        return (JSON.parse(buf.toString('utf8')) as { status: VisionStatus }).status;
    } catch {
        return null;
    }
}

function getWorkerSecret(): string {
    const secret = process.env.INTERNAL_WORKER_SECRET;
    if (!secret) throw new Error('INTERNAL_WORKER_SECRET not set');
    return secret;
}

function fireWorker(origin: string, payload: WorkerPayload): Promise<void> {
    logger.info({ origin, visionId: payload.visionId }, 'Dispatching vision worker');
    return fetch(`${origin}/vision/worker`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': getWorkerSecret(),
        },
        body: JSON.stringify(payload),
    }).then(async (res) => {
        if (!res.ok) {
            logger.error({ status: res.status, visionId: payload.visionId }, 'Worker self-call returned error status');
            await writeStatus(payload.userId, payload.visionId, 'failed');
            return;
        }
        void res.body?.cancel();
    }).catch((err) => {
        logger.error({ err: err?.message, visionId: payload.visionId }, 'Worker self-call failed');
        writeStatus(payload.userId, payload.visionId, 'failed').catch(() => { });
    });
}

async function getPushToken(userId: string): Promise<string | null> {
    const buf = await R2Storage.downloadBuffer(`user-data/${userId}/push-token`);
    return buf?.toString('utf8') ?? null;
}

visionRoute.post('/generate', revenuecatAuth, async (c) => {
    const { visionDescription, existingPhrases, motivationStyle, language, sync } = await c.req.json();
    const lang: 'de' | 'en' = language === 'de' ? 'de' : 'en';

    if (!visionDescription || typeof visionDescription !== 'string') {
        return c.json({ error: 'visionDescription is required' }, 400);
    }

    logger.info({ existingPhrasesCount: Array.isArray(existingPhrases) ? existingPhrases.length : 0, sync: !!sync }, 'Vision generate request received');

    const userId = c.var.rcUserId;
    const count = await ensureGenerationCount(userId);
    if (count <= 0) {
        return c.json({ error: 'No generations remaining', count: 0 }, 403);
    }

    // Load composite from R2 (existence check for async; input for sync)
    const composite = await R2Storage.downloadBuffer(getSelfReferenceKey(userId, 'composite'));
    if (!composite) {
        return c.json({ error: 'No composite image found. Upload reference images first.' }, 400);
    }

    // Synchronous path — used by onboarding only (transition flag)
    if (sync === true) {
        try {
            const compositeBase64 = composite.toString('base64');

            const cachedDescBuffer = await R2Storage.downloadBuffer(getSelfReferenceKey(userId, 'description'));
            const cachedPersonDesc = cachedDescBuffer?.toString('utf8') ?? null;

            const phrasePromise = generatePhraseAndAffirmations(visionDescription, lang);

            const imagePipeline = (async () => {
                let personDesc = cachedPersonDesc;
                if (!personDesc) {
                    personDesc = await describePersonFromImages([compositeBase64]);
                    R2Storage.uploadBuffer(
                        getSelfReferenceKey(userId, 'description'),
                        Buffer.from(personDesc, 'utf8'),
                        'text/plain',
                    ).catch(() => { });
                }
                const sceneDesc = await generateSceneDescription(personDesc, visionDescription, Array.isArray(existingPhrases) ? existingPhrases : undefined, lang);
                return generateImage(sceneDesc, personDesc, [{ base64: compositeBase64, mimeType: 'image/jpeg' }]);
            })();

            const [phraseResult, resultB64] = await Promise.all([phrasePromise, imagePipeline]);

            const visionId = crypto.randomUUID();
            const imageKey = imageKeyFor(userId, visionId);
            await R2Storage.uploadBuffer(imageKey, Buffer.from(resultB64, 'base64'));
            const signedUrl = await R2Storage.getSignedUrl(imageKey);

            deductGeneration(userId, count); // fire-and-forget

            return c.json({ phrase: phraseResult.phrase, category: phraseResult.category, affirmationsAffirmation: phraseResult.affirmationsAffirmation, affirmationsFuel: phraseResult.affirmationsFuel, signedUrl, imageKey, visionId });
        } catch (error: any) {
            logger.error({ error: error.message }, 'Vision generate (sync) failed');
            return c.json({ error: 'Vision generation failed' }, 500);
        }
    }

    // Async path (default): phrase now, image in the worker
    try {
        getWorkerSecret(); // fail fast before any state is written

        const phraseResult = await generatePhraseAndAffirmations(visionDescription, lang);

        const visionId = crypto.randomUUID();
        await writeStatus(userId, visionId, 'pending');

        const proto = c.req.header('x-forwarded-proto') ?? 'http';
        const origin = `${proto}://${new URL(c.req.url).host}`;
        const workerPromise = fireWorker(origin, {
            userId,
            visionId,
            visionDescription,
            existingPhrases: Array.isArray(existingPhrases) ? existingPhrases : undefined,
            language: lang,
        });
        // Cloud Run throttles CPU after the response is sent — give the outbound
        // worker request time to be flushed before returning.
        await Promise.race([workerPromise, new Promise((resolve) => setTimeout(resolve, 1500))]);

        return c.json({
            visionId,
            phrase: phraseResult.phrase,
            category: phraseResult.category,
            affirmationsAffirmation: phraseResult.affirmationsAffirmation,
            affirmationsFuel: phraseResult.affirmationsFuel,
            status: 'pending' as const,
        });
    } catch (error: any) {
        logger.error({ error: error.message }, 'Vision generate (async dispatch) failed');
        return c.json({ error: 'Vision generation failed' }, 500);
    }
});

visionRoute.post('/regenerate', revenuecatAuth, async (c) => {
    const { visionId, visionDescription, existingPhrases, language } = await c.req.json();
    const lang: 'de' | 'en' = language === 'de' ? 'de' : 'en';

    if (!visionId || typeof visionId !== 'string') {
        return c.json({ error: 'visionId is required' }, 400);
    }
    if (!visionDescription || typeof visionDescription !== 'string') {
        return c.json({ error: 'visionDescription is required' }, 400);
    }

    const userId = c.var.rcUserId;
    const count = await ensureGenerationCount(userId);
    if (count <= 0) {
        return c.json({ error: 'No generations remaining', count: 0 }, 403);
    }

    const composite = await R2Storage.downloadBuffer(getSelfReferenceKey(userId, 'composite'));
    if (!composite) {
        return c.json({ error: 'No composite image found. Upload reference images first.' }, 400);
    }

    try {
        getWorkerSecret(); // fail fast before any state is written

        await writeStatus(userId, visionId, 'pending');

        const proto = c.req.header('x-forwarded-proto') ?? 'http';
        const origin = `${proto}://${new URL(c.req.url).host}`;
        const workerPromise = fireWorker(origin, {
            userId,
            visionId,
            visionDescription,
            existingPhrases: Array.isArray(existingPhrases) ? existingPhrases : undefined,
            language: lang,
        });
        // Cloud Run throttles CPU after the response is sent — give the outbound
        // worker request time to be flushed before returning.
        await Promise.race([workerPromise, new Promise((resolve) => setTimeout(resolve, 1500))]);

        return c.json({ visionId, status: 'pending' as const });
    } catch (error: any) {
        logger.error({ error: error.message }, 'Vision regenerate (async dispatch) failed');
        return c.json({ error: 'Vision regeneration failed' }, 500);
    }
});

visionRoute.post('/worker', async (c) => {
    if (c.req.header('x-internal-secret') !== getWorkerSecret()) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const payload = await c.req.json<WorkerPayload>().catch(() => null);
    if (!payload?.userId || !payload?.visionId || !payload?.visionDescription) {
        return c.json({ error: 'Invalid payload' }, 400);
    }
    const { userId, visionId, visionDescription, existingPhrases } = payload;
    const lang: 'de' | 'en' = payload.language === 'de' ? 'de' : 'en';

    const pushToken = await getPushToken(userId).catch(() => null);

    try {
        const composite = await R2Storage.downloadBuffer(getSelfReferenceKey(userId, 'composite'));
        if (!composite) throw new Error('No composite image found');
        const compositeBase64 = composite.toString('base64');

        const cachedDescBuffer = await R2Storage.downloadBuffer(getSelfReferenceKey(userId, 'description'));
        let personDesc = cachedDescBuffer?.toString('utf8') ?? null;
        if (!personDesc) {
            personDesc = await describePersonFromImages([compositeBase64]);
            R2Storage.uploadBuffer(
                getSelfReferenceKey(userId, 'description'),
                Buffer.from(personDesc, 'utf8'),
                'text/plain',
            ).catch(() => { });
        }

        const sceneDesc = await generateSceneDescription(personDesc, visionDescription, existingPhrases, lang);
        const resultB64 = await generateImage(sceneDesc, personDesc, [{ base64: compositeBase64, mimeType: 'image/jpeg' }]);

        await R2Storage.uploadBuffer(imageKeyFor(userId, visionId), Buffer.from(resultB64, 'base64'));
        await writeStatus(userId, visionId, 'done');

        const count = await ensureGenerationCount(userId);
        deductGeneration(userId, count); // fire-and-forget, wie bisher

        if (pushToken) {
            await sendPushNotification(pushToken, {
                title: lang === 'de' ? 'Deine Vision ist fertig ✨' : 'Your vision is ready ✨',
                body: lang === 'de' ? 'Schau sie dir jetzt an.' : 'Take a look now.',
                data: { visionId },
            });
        }

        logger.info({ userId, visionId }, 'Vision worker completed');
        return c.json({ ok: true });
    } catch (error: any) {
        logger.error({ error: error.message, userId, visionId }, 'Vision worker failed');
        await writeStatus(userId, visionId, 'failed').catch(() => { });
        if (pushToken) {
            await sendPushNotification(pushToken, {
                title: lang === 'de' ? 'Deine Vision konnte nicht erstellt werden — versuch es nochmal' : "Your vision couldn't be created — please try again",
                body: lang === 'de' ? 'Öffne die App und starte einen neuen Versuch.' : 'Open the app and try again.',
                data: { visionId },
            });
        }
        return c.json({ ok: false });
    }
});

visionRoute.get('/status', revenuecatAuth, async (c) => {
    const userId = c.var.rcUserId;
    const visionId = c.req.query('visionId');
    if (!visionId) return c.json({ error: 'visionId query param required' }, 400);

    const status = await readStatus(userId, visionId);
    if (!status) return c.json({ error: 'Not found' }, 404);

    if (status === 'done') {
        const imageKey = imageKeyFor(userId, visionId);
        const signedUrl = await R2Storage.getSignedUrl(imageKey);
        return c.json({ status, signedUrl, imageKey });
    }
    return c.json({ status });
});

export default visionRoute;

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

visionRoute.post('/generate', revenuecatAuth, async (c) => {
    const { visionDescription, existingPhrases, motivationStyle, language } = await c.req.json();
    const lang: 'de' | 'en' = language === 'de' ? 'de' : 'en';

    if (!visionDescription || typeof visionDescription !== 'string') {
        return c.json({ error: 'visionDescription is required' }, 400);
    }

    logger.info({ existingPhrasesCount: Array.isArray(existingPhrases) ? existingPhrases.length : 0 }, 'Vision generate request received');

    const userId = c.var.rcUserId;
    const count = await ensureGenerationCount(userId);
    if (count <= 0) {
        return c.json({ error: 'No generations remaining', count: 0 }, 403);
    }

    // Load composite from R2
    const composite = await R2Storage.downloadBuffer(getSelfReferenceKey(userId, 'composite'));
    if (!composite) {
        return c.json({ error: 'No composite image found. Upload reference images first.' }, 400);
    }

    try {
        const compositeBase64 = composite.toString('base64');

        // Load cached person description (generated when composite was last built)
        const cachedDescBuffer = await R2Storage.downloadBuffer(getSelfReferenceKey(userId, 'description'));
        const cachedPersonDesc = cachedDescBuffer?.toString('utf8') ?? null;

        // Both phrase styles run in parallel with the image pipeline
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
        const imageKey = `vision-images/${userId}/${visionId}`;
        await R2Storage.uploadBuffer(imageKey, Buffer.from(resultB64, 'base64'));
        const signedUrl = await R2Storage.getSignedUrl(imageKey);

        deductGeneration(userId, count); // fire-and-forget

        return c.json({ phrase: phraseResult.phrase, category: phraseResult.category, affirmationsAffirmation: phraseResult.affirmationsAffirmation, affirmationsFuel: phraseResult.affirmationsFuel, signedUrl, imageKey, visionId });
    } catch (error: any) {
        logger.error({ error: error.message }, 'Vision generate failed');
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
    console.log('count', count);
    if (count <= 0) {
        return c.json({ error: 'No generations remaining', count: 0 }, 403);
    }

    const composite = await R2Storage.downloadBuffer(getSelfReferenceKey(userId, 'composite'));
    if (!composite) {
        return c.json({ error: 'No composite image found. Upload reference images first.' }, 400);
    }

    try {
        const compositeBase64 = composite.toString('base64');

        const cachedDescBuffer = await R2Storage.downloadBuffer(getSelfReferenceKey(userId, 'description'));
        const cachedPersonDesc = cachedDescBuffer?.toString('utf8') ?? null;

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
        const resultB64 = await generateImage(sceneDesc, personDesc, [{ base64: compositeBase64, mimeType: 'image/jpeg' }]);

        const imageKey = `vision-images/${userId}/${visionId}`;
        await R2Storage.uploadBuffer(imageKey, Buffer.from(resultB64, 'base64'));
        const signedUrl = await R2Storage.getSignedUrl(imageKey);

        deductGeneration(userId, count);

        return c.json({ signedUrl, imageKey });
    } catch (error: any) {
        logger.error({ error: error.message }, 'Vision regenerate failed');
        return c.json({ error: 'Vision regeneration failed' }, 500);
    }
});

export default visionRoute;

import { generateImageWithGeminiVertex } from '@/lib/gemini/generate-image-vertex.js';
import { R2Storage } from '@/lib/r2/storage.js';
import { deductGeneration, ensureGenerationCount } from '@/lib/revenuecat/generations.js';
import { RCCustomer } from '@/lib/revenuecat/types.js';
import { revenuecatAuth } from '@/middleware/revenuecat-auth.js';
import { describePersonFromImages } from '@/prompts/describe-person.js';
import { generateSceneDescription } from '@/prompts/generate-scene.js';
import { generatePhrase } from '@/prompts/phrase.js';
import { getSelfReferenceKey } from '@/utils/get-self-reference-key.js';
import { logger } from '@/utils/logger.js';
import { Hono } from 'hono';

const visionRoute = new Hono<{
    Variables: { rcUserId: string; rcCustomer: RCCustomer };
}>();

visionRoute.post('/generate', revenuecatAuth, async (c) => {
    const { visionDescription } = await c.req.json();

    if (!visionDescription || typeof visionDescription !== 'string') {
        return c.json({ error: 'visionDescription is required' }, 400);
    }

    const userId = c.var.rcUserId;
    const count = await ensureGenerationCount(userId, c.var.rcCustomer);
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

        // Phrase runs in parallel with the image pipeline
        const phrasePromise = generatePhrase(visionDescription);

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
            const sceneDesc = await generateSceneDescription(personDesc, visionDescription);
            return generateImageWithGeminiVertex(sceneDesc, personDesc, [{ base64: compositeBase64, mimeType: 'image/jpeg' }]);
        })();

        const [phrase, resultB64] = await Promise.all([phrasePromise, imagePipeline]);

        const visionId = crypto.randomUUID();
        const imageKey = `visions/${userId}/${visionId}`;
        await R2Storage.uploadBuffer(imageKey, Buffer.from(resultB64, 'base64'));
        const signedUrl = await R2Storage.getSignedUrl(imageKey);

        deductGeneration(userId, count); // fire-and-forget

        return c.json({ phrase, signedUrl, imageKey, visionId });
    } catch (error: any) {
        logger.error({ error: error.message }, 'Vision generate failed');
        return c.json({ error: 'Vision generation failed' }, 500);
    }
});

export default visionRoute;

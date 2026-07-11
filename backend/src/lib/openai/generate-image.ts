import { toFile } from 'openai';
import { logger } from '@/utils/logger.js';
import { getOpenAIClient } from './client.js';

const OPENAI_IMAGE_MODEL = 'gpt-image-2';

const CAMERA_SETTINGS = `Shot on Sony A7R V, 85mm f/1.4 lens, natural light, photorealistic, ultra-detailed, 8K resolution, candid photography style`;

export async function generateImageWithGptImage(
    sceneDescription: string,
    personDescription: string,
    referenceImages: Array<{ base64: string; mimeType: string }>,
): Promise<string> {
    const client = getOpenAIClient();

    const prompt = `Create a single photorealistic photograph of the following scene.

ASPECT RATIO: Portrait orientation (taller than wide). Fill the entire vertical frame.

CRITICAL — ONE SCENE ONLY: This must be a single, unified photograph. Absolutely no collage, no grid, no split panels, no before/after, no multiple scenes, no side-by-side layouts. One frame. One moment. One location.

PERSON (use the reference image to accurately depict this person):
${personDescription}

IDENTITY vs. POSE — read carefully, these are two separate rules:

1. IDENTITY — keep IDENTICAL to the reference image: facial features, eye color, nose, lips, jawline, skin tone, hairstyle, hair color, beard, body build. The person must be instantly recognizable as the same person.

2. POSE & EXPRESSION — must be COMPLETELY NEW, never copied from the reference photo: facial expression, mouth (smiling or not, open or closed), gaze direction, head angle, camera angle, body pose, lighting on the face.

The reference photo shows ONE frozen moment. You are creating a DIFFERENT moment of the same person's life. Pasting the reference face 1:1 into a new background is a FAILURE.

Hard requirements for the new image:
- The facial expression MUST match the emotion of the scene — if the scene is positive or aspirational, the person is genuinely smiling or laughing with visible warmth, EVEN IF the reference photo shows a neutral or serious face.
- The head and camera angle MUST be different from the reference photo — never a straight frontal portrait copy.
- Natural, candid body language that belongs to the scene — the person is doing something, not posing for a portrait.
- ANATOMICALLY CORRECT PROPORTIONS: head, face, limbs and body must be in realistic proportion to each other, like in a real photograph of an adult. The head must NOT be oversized relative to the body — no caricature-like or doll-like proportions.

SCENE:
${sceneDescription}

STYLE: ${CAMERA_SETTINGS}

Critical: One scene, one frame. Same person (identity), new moment (expression, angle, pose) — never a copy of the reference photo.`;

    const files = await Promise.all(
        referenceImages.map((img, i) =>
            toFile(Buffer.from(img.base64, 'base64'), `reference-${i}.${img.mimeType.split('/')[1] ?? 'jpg'}`, {
                type: img.mimeType,
            }),
        ),
    );

    logger.info({ prompt }, 'gpt-image prompt');

    const result = await client.images.edit({
        model: OPENAI_IMAGE_MODEL,
        image: files,
        prompt,
        size: '1024x1536',
        quality: 'high',
    });

    const imageData = result.data?.[0]?.b64_json;
    if (!imageData) throw new Error('No image returned from OpenAI');
    return imageData;
}

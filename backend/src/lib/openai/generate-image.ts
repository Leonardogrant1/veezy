import OpenAI from 'openai';
import { getOpenAIClient } from './client.js';

const OPENAI_IMAGE_MODEL = 'gpt-5.5';

const CAMERA_SETTINGS = `Shot on Sony A7R V, 85mm f/1.4 lens, natural light, photorealistic, ultra-detailed, 8K resolution, candid photography style`;

function extractImage(response: OpenAI.Responses.Response): string {
    const result = response.output
        .filter((output) => output.type === 'image_generation_call')
        .map((output) => output.result)
        .find((r): r is string => typeof r === 'string');

    if (!result) throw new Error('No image returned from OpenAI');
    return result;
}

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

The reference image is ONLY for the person's identity (face, features, build). Do NOT copy the reference photo's expression, pose, camera angle, clothing or setting. Instead, depict the person naturally integrated into the scene below — with an expression, pose and perspective that fit the scene.

SCENE:
${sceneDescription}

STYLE: ${CAMERA_SETTINGS}

Critical: One scene, one frame. The person must closely match the reference photo provided.`;

    const response = await client.responses.create({
        model: OPENAI_IMAGE_MODEL,
        input: [
            {
                role: 'user',
                content: [
                    { type: 'input_text', text: prompt },
                    ...referenceImages.map((img) => ({
                        type: 'input_image' as const,
                        image_url: `data:${img.mimeType};base64,${img.base64}`,
                        detail: 'high' as const,
                    })),
                ],
            },
        ],
        tools: [
            {
                type: 'image_generation',
                size: '1024x1536',
                quality: 'high',
            },
        ],
    });

    return extractImage(response);
}

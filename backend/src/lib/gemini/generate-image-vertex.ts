import { GoogleGenAI } from '@google/genai';

const GEMINI_MODEL = 'gemini-3-pro-image-preview';

const CAMERA_SETTINGS = `Shot on Sony A7R V, 85mm f/1.4 lens, natural light, photorealistic, ultra-detailed, 8K resolution, candid photography style`;

let _client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
    if (_client) return _client;

    const b64 = process.env.SERVICE_ACCOUNT_B64;
    if (!b64) throw new Error('SERVICE_ACCOUNT_B64 not set');

    const keyJson = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));

    _client = new GoogleGenAI({
        vertexai: true,
        project: keyJson.project_id,
        location: "global",
        googleAuthOptions: {
            credentials: keyJson,
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        },
    });

    return _client;
}

export async function generateImageWithGeminiVertex(
    sceneDescription: string,
    personDescription: string,
    referenceImages: Array<{ base64: string; mimeType: string }>,
): Promise<string> {
    const client = getClient();

    const prompt = `Create a photorealistic image of the following scene.

PERSON (use the reference image to accurately depict this person):
${personDescription}

SCENE:
${sceneDescription}

STYLE: ${CAMERA_SETTINGS}

Important: The person in the image must closely match the reference photo provided.`;

    const contents = [
        { text: prompt },
        ...referenceImages.map((img) => ({
            inlineData: {
                mimeType: img.mimeType,
                data: img.base64,
            },
        })),
    ];

    const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: {
            responseModalities: ['IMAGE', 'TEXT'],
        },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData?.mimeType?.startsWith('image/'));
    const imageData = imagePart?.inlineData?.data;

    if (!imageData) throw new Error('No image returned from Gemini (Vertex)');
    return imageData;
}

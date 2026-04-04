const GEMINI_MODEL = 'gemini-3-pro-image-preview';

const CAMERA_SETTINGS = `Shot on Sony A7R V, 85mm f/1.4 lens, natural light, photorealistic, ultra-detailed, 8K resolution, candid photography style`;

export async function generateImageWithGemini(
    sceneDescription: string,
    personDescription: string,
    referenceImages: Array<{ base64: string; mimeType: string }>,
): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not set');

    const prompt = `Create a photorealistic image of the following scene.

PERSON (use the reference image to accurately depict this person):
${personDescription}

SCENE:
${sceneDescription}

STYLE: ${CAMERA_SETTINGS}

Important: The person in the image must closely match the reference photo provided.`;

    const parts: any[] = [
        { text: prompt },
        ...referenceImages.map((img) => ({
            inline_data: {
                mime_type: img.mimeType,
                data: img.base64,
            },
        })),
    ];

    const body = {
        contents: [{ role: 'user', parts }],
        generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
        },
    };

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
            },
            body: JSON.stringify(body),
        },
    );

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const imageData = data?.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.inlineData?.mimeType?.startsWith('image/'),
    )?.inlineData?.data;

    if (!imageData) throw new Error('No image returned from Gemini');
    return imageData;
}

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export type GenerateVisionResult = {
    phrase: string;
    imageUrl: string;   // signed URL for preview
    imageKey: string;
    visionId: string;
};

export async function generateVision(description: string, userId: string): Promise<GenerateVisionResult> {
    const response = await fetch(`${BACKEND_URL}/vision/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-rc-user-id': userId,
        },
        body: JSON.stringify({ visionDescription: description }),
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Generation failed (${response.status})`);
    }

    const data = await response.json();
    return {
        phrase: data.phrase,
        imageUrl: data.signedUrl,
        imageKey: data.imageKey,
        visionId: data.visionId,
    };
}

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export type GenerateVisionResult = {
    visionId: string;
    phrase: string;
    category: string;
    affirmationsAffirmation: string[];
    affirmationsFuel: string[];
};

export type GenerateVisionSyncResult = GenerateVisionResult & {
    imageUrl: string;   // signed URL for preview
    imageKey: string;
};

export type VisionStatusResult = {
    status: 'pending' | 'done' | 'failed';
    signedUrl?: string;
    imageKey?: string;
};

export async function generateVision(description: string, userId: string, existingPhrases?: string[], motivationStyle?: string, language: 'de' | 'en' = 'en'): Promise<GenerateVisionResult> {
    const response = await fetch(`${BACKEND_URL}/vision/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-rc-user-id': userId,
        },
        body: JSON.stringify({ visionDescription: description, existingPhrases, motivationStyle, language }),
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Generation failed (${response.status})`);
    }

    const data = await response.json();
    return {
        visionId: data.visionId,
        phrase: data.phrase,
        category: data.category,
        affirmationsAffirmation: data.affirmationsAffirmation ?? [],
        affirmationsFuel: data.affirmationsFuel ?? [],
    };
}

// Synchronous variant — onboarding only (transition until onboarding goes async)
export async function generateVisionSync(description: string, userId: string, existingPhrases?: string[], motivationStyle?: string, language: 'de' | 'en' = 'en'): Promise<GenerateVisionSyncResult> {
    const response = await fetch(`${BACKEND_URL}/vision/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-rc-user-id': userId,
        },
        body: JSON.stringify({ visionDescription: description, existingPhrases, motivationStyle, language, sync: true }),
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Generation failed (${response.status})`);
    }

    const data = await response.json();
    return {
        visionId: data.visionId,
        phrase: data.phrase,
        category: data.category,
        imageUrl: data.signedUrl,
        imageKey: data.imageKey,
        affirmationsAffirmation: data.affirmationsAffirmation ?? [],
        affirmationsFuel: data.affirmationsFuel ?? [],
    };
}

export async function regenerateVision(visionId: string, description: string, userId: string, existingPhrases?: string[], language: 'de' | 'en' = 'en'): Promise<void> {
    const response = await fetch(`${BACKEND_URL}/vision/regenerate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-rc-user-id': userId,
        },
        body: JSON.stringify({ visionId, visionDescription: description, existingPhrases, language }),
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Regeneration failed (${response.status})`);
    }
}

export async function fetchVisionStatus(visionId: string, userId: string): Promise<VisionStatusResult> {
    const response = await fetch(`${BACKEND_URL}/vision/status?visionId=${encodeURIComponent(visionId)}`, {
        headers: { 'x-rc-user-id': userId },
    });

    if (!response.ok) {
        throw new Error(`Status fetch failed (${response.status})`);
    }

    return await response.json() as VisionStatusResult;
}

import { getOpenAIClient } from '@/lib/openai/client.js';

const SYSTEM_PROMPT = `You are a physical appearance specialist. Your sole task is to describe the person's body and face in precise detail.

Describe ONLY:
- Face: shape, skin tone, eye color and shape, eyebrows, nose, lips, jawline, cheekbones
- Hair: color, length, texture, style
- Facial hair (if any): style, density, color
- Body: build, visible physique
- Distinctive physical features

NEVER mention: clothing, background, environment, furniture, posture, what the person is doing, mood, or personality.

Output a compact, factual description. No introductory sentences, no conclusions. Maximum 250 words.`;

export async function describePersonFromImages(imageBase64s: string[]): Promise<string> {
    const imageContent = imageBase64s.map((b64) => ({
        type: 'image_url' as const,
        image_url: {
            url: `data:image/jpeg;base64,${b64}`,
            detail: 'high' as const,
        },
    }));

    const response = await getOpenAIClient().chat.completions.create({
        model: 'gpt-5.1',
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
                role: 'user',
                content: [
                    ...imageContent,
                    { type: 'text', text: 'Describe this person in detail.' },
                ],
            },
        ],
        max_completion_tokens: 400,
    });

    const description = response.choices[0]?.message?.content?.trim();
    if (!description) throw new Error('OpenAI returned empty description');
    return description;
}

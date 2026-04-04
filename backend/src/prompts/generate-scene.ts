import { getOpenAIClient } from '@/lib/openai/client.js';

const SYSTEM_PROMPT = `You are a creative director specializing in aspirational lifestyle photography.
Given a person's physical description and their life goal/vision, create a vivid scene description for a photorealistic image.

The scene should:
- Place the specific person (using their physical description) in a setting that embodies their achieved goal
- Feel like a real, candid photograph — not a fantasy or illustration
- Be specific about location, lighting, time of day, environment
- Show the person as successful, confident, and living their vision
- Be detailed enough for an AI image generator to create a precise scene

Output only the scene description, no preamble or explanation.`;

export async function generateSceneDescription(personDescription: string, goal: string): Promise<string> {
    const response = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4.1',
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
                role: 'user',
                content: `Person description:\n${personDescription}\n\nGoal/Vision:\n${goal}`,
            },
        ],
        max_completion_tokens: 400,
        temperature: 0.85,
    });

    const scene = response.choices[0]?.message?.content?.trim();
    if (!scene) throw new Error('OpenAI returned empty scene description');
    return scene;
}

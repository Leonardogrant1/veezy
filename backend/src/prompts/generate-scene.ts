import { getOpenAIClient } from '@/lib/openai/client.js';

const SYSTEM_PROMPT = `You are a creative director specializing in aspirational lifestyle photography.
Given a person's physical description and their life goal/vision, write a scene description for a single photorealistic image.

Rules:
- ONE scene. One location. One moment in time. A single photograph.
- Never describe multiple locations, multiple time frames, sequences, or transitions.
- Place the specific person in a setting that embodies their achieved goal.
- Feel like a real, candid photograph — not a fantasy, illustration, or collage.
- Be specific about location, lighting, time of day, and environment.
- Show the person as confident and living their vision.
- Keep the description focused and unified — everything in the scene belongs to the same frame.
- The output must describe ONLY ONE single scene — as if captured in a single camera frame.
- Do NOT describe any before/after states, multiple locations, or sequences of events.
- Portrait orientation: the scene should work as a tall vertical photograph (3:4 ratio, taller than wide).

Output only the scene description, no preamble or explanation.`;

export async function generateSceneDescription(personDescription: string, goal: string, existingPhrases?: string[]): Promise<string> {
    const existingContext = existingPhrases && existingPhrases.length > 0
        ? `\n\nExisting visions context (maintain visual and lifestyle consistency with these — same world, same level of luxury/success, same environment):\n${existingPhrases.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
        : '';

    const response = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4.1',
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
                role: 'user',
                content: `Person description:\n${personDescription}\n\nGoal/Vision:\n${goal}${existingContext}`,
            },
        ],
        max_completion_tokens: 400,
        temperature: 0.85,
    });

    const scene = response.choices[0]?.message?.content?.trim();
    if (!scene) throw new Error('OpenAI returned empty scene description');
    return scene;
}

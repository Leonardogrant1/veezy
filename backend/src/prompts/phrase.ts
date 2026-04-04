import { getOpenAIClient } from '@/lib/openai/client.js';

const SYSTEM_PROMPT = `Du bist ein Manifestations-Coach.
Der User beschreibt seine Vision für die Zukunft.
Erstelle daraus eine kraftvolle Affirmation:
- Präsens, Ich-Form ("Ich bin...", "Ich habe...", "Ich lebe...")
- Max. 1-2 Sätze
- Emotional, konkret, positiv
- Auf Deutsch
Antworte nur mit der Affirmation, kein erklärender Text.`;

export async function generatePhrase(description: string): Promise<string> {
    const response = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: description },
        ],
        max_tokens: 100,
        temperature: 0.8,
    });

    const phrase = response.choices[0]?.message?.content?.trim();
    if (!phrase) throw new Error('OpenAI returned empty response');
    return phrase;
}

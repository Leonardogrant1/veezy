import { getOpenAIClient } from '@/lib/openai/client.js';
import { zodResponseFormat } from 'openai/helpers/zod.js';
import z from 'zod';

const SYSTEM_PROMPT = `Du bist ein Manifestations-Coach.
Der User beschreibt seine Vision für die Zukunft.
Erstelle daraus eine kraftvolle Affirmation und wähle die passende Kategorie.

Affirmation:
- Präsens, Ich-Form ("Ich bin...", "Ich habe...", "Ich lebe...")
- Max. 1-2 Sätze
- Emotional, konkret, positiv
- Auf Deutsch

Kategorien:
- wealth: Geld, Business, Karriere, Erfolg
- body: Fitness, Gesundheit, Aussehen
- lifestyle: Reisen, Wohnen, Freiheit, Genuss
- relationships: Liebe, Familie, Freunde, Partnerschaft
- mindset: Growth, Spiritualität, Mindset, innere Stärke
- purpose: Mission, Impact, Legacy, Sinn

Antworte ausschließlich mit JSON: { "phrase": "...", "category": "..." }`;

export type PhraseResult = {
    phrase: string;
    category: 'wealth' | 'body' | 'lifestyle' | 'relationships' | 'mindset' | 'purpose';
};

const PhraseResultSchema = z.object({
    phrase: z.string(),
    category: z.enum(['wealth', 'body', 'lifestyle', 'relationships', 'mindset', 'purpose']),
});

export async function generatePhrase(description: string): Promise<PhraseResult> {
    const response = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: description },
        ],
        response_format: zodResponseFormat(PhraseResultSchema, "data"),
        max_tokens: 150,
        temperature: 0.8,
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) throw new Error('OpenAI returned empty response');

    const parsed = JSON.parse(raw) as PhraseResult;
    if (!parsed.phrase || !parsed.category) throw new Error('Invalid phrase response structure');
    return parsed;
}

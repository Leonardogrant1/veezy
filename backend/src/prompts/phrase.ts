import { getOpenAIClient } from '@/lib/openai/client.js';
import { zodResponseFormat } from 'openai/helpers/zod.js';
import z from 'zod';

const SYSTEM_PROMPT_AFFIRMATION = `Du bist ein Manifestations-Coach.
Der User beschreibt seine Vision für die Zukunft.
Erstelle daraus eine kraftvolle Affirmation, wähle die passende Kategorie, und erstelle 5 kurze, personalisierte Affirmationen zur Vision.

Affirmation (phrase):
- Präsens, Ich-Form ("Ich bin...", "Ich habe...", "Ich lebe...")
- Max. 1-2 Sätze
- Emotional, konkret, positiv
- Auf Deutsch

Affirmations (5 Stück):
- Präsens, Ich-Form
- Kurz (max. 1 Satz)
- Positiv, bestätigend, ruhig
- Auf Deutsch

Kategorien:
- wealth: Geld, Business, Karriere, Erfolg
- body: Fitness, Gesundheit, Aussehen
- lifestyle: Reisen, Wohnen, Freiheit, Genuss
- relationships: Liebe, Familie, Freunde, Partnerschaft
- mindset: Growth, Spiritualität, Mindset, innere Stärke
- purpose: Mission, Impact, Legacy, Sinn

Antworte ausschließlich mit JSON: { "phrase": "...", "category": "...", "affirmations": ["...", "...", "...", "...", "..."] }`;

const SYSTEM_PROMPT_FUEL = `Du bist ein knallharter Motivations-Coach.
Der User beschreibt seine Vision für die Zukunft.
Erstelle daraus einen treibenden Motivationssatz, wähle die passende Kategorie, und erstelle 5 kurze Fuel-Sätze zur Vision.

Phrase (phrase):
- Dringlichkeit, Klarheit, kein Weichspülen
- Spricht die Konsequenz des Nicht-Handelns an ODER den Antrieb zur Vision
- Max. 1-2 Sätze
- Auf Deutsch
- Beispiele: "Jetzt Gas geben oder für immer davon träumen.", "Finanziell frei werden oder beim Versuch draufgehen."

Fuel-Sätze (5 Stück):
- Kurz, direkt, triggern Dringlichkeit oder Stolz
- Variiert: mal anspornen, mal erinnern was auf dem Spiel steht
- Auf Deutsch

Kategorien:
- wealth: Geld, Business, Karriere, Erfolg
- body: Fitness, Gesundheit, Aussehen
- lifestyle: Reisen, Wohnen, Freiheit, Genuss
- relationships: Liebe, Familie, Freunde, Partnerschaft
- mindset: Growth, Spiritualität, Mindset, innere Stärke
- purpose: Mission, Impact, Legacy, Sinn

Antworte ausschließlich mit JSON: { "phrase": "...", "category": "...", "affirmations": ["...", "...", "...", "...", "..."] }`;

export type PhraseResult = {
    phrase: string;
    category: 'wealth' | 'body' | 'lifestyle' | 'relationships' | 'mindset' | 'purpose';
    affirmations: string[];
};

const PhraseResultSchema = z.object({
    phrase: z.string(),
    category: z.enum(['wealth', 'body', 'lifestyle', 'relationships', 'mindset', 'purpose']),
    affirmations: z.array(z.string()).length(5),
});

export async function generatePhrase(description: string, motivationStyle: 'affirmation' | 'fuel' = 'affirmation'): Promise<PhraseResult> {
    const systemPrompt = motivationStyle === 'fuel' ? SYSTEM_PROMPT_FUEL : SYSTEM_PROMPT_AFFIRMATION;
    const response = await getOpenAIClient().chat.completions.create({
        model: 'gpt-5.1',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: description },
        ],
        response_format: zodResponseFormat(PhraseResultSchema as any, "data"),
        max_completion_tokens: 400,
        temperature: 0.8,
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) throw new Error('OpenAI returned empty response');

    const parsed = JSON.parse(raw) as PhraseResult;
    if (!parsed.phrase || !parsed.category || !Array.isArray(parsed.affirmations)) throw new Error('Invalid phrase response structure');
    return parsed;
}

import { getOpenAIClient } from '@/lib/openai/client.js';
import { zodResponseFormat } from 'openai/helpers/zod.js';
import z from 'zod';

const SYSTEM_PROMPT_PHRASE = `Du bist ein Manifestations-Coach.
Der User beschreibt seine Vision für die Zukunft.
Erstelle daraus eine kraftvolle, positive Affirmation und wähle die passende Kategorie.

Phrase:
- Präsens, Ich-Form ("Ich bin...", "Ich habe...", "Ich lebe...")
- Max. 1-2 Sätze
- Ruhig, stark, positiv — niemals dringend oder drängend
- Auf Deutsch

Kategorien:
- wealth: Geld, Business, Karriere, Erfolg
- body: Fitness, Gesundheit, Aussehen
- lifestyle: Reisen, Wohnen, Freiheit, Genuss
- relationships: Liebe, Familie, Freunde, Partnerschaft
- mindset: Growth, Spiritualität, Mindset, innere Stärke
- purpose: Mission, Impact, Legacy, Sinn

Antworte ausschließlich mit JSON: { "phrase": "...", "category": "..." }`;

const SYSTEM_PROMPT_AFFIRMATION = `Du bist ein Manifestations-Coach.
Der User beschreibt seine Vision für die Zukunft.
Erstelle daraus 5 kurze, personalisierte Affirmationen zur Vision.

Affirmationen (5 Stück):
- Präsens, Ich-Form
- Kurz (max. 1 Satz)
- Positiv, bestätigend, ruhig
- Auf Deutsch

Antworte ausschließlich mit JSON: { "affirmations": ["...", "...", "...", "...", "..."] }`;

const SYSTEM_PROMPT_FUEL = `Du bist ein knallharter Motivations-Coach.
Der User beschreibt seine Vision für die Zukunft.
Erstelle daraus 5 kurze Fuel-Sätze zur Vision.

Fuel-Sätze (5 Stück):
- Kurz, direkt, triggern Dringlichkeit oder Stolz
- Variiert: mal anspornen, mal erinnern was auf dem Spiel steht
- Auf Deutsch

Antworte ausschließlich mit JSON: { "affirmations": ["...", "...", "...", "...", "..."] }`;

export type BothPhrasesResult = {
    phrase: string;
    category: 'wealth' | 'body' | 'lifestyle' | 'relationships' | 'mindset' | 'purpose';
    affirmationsAffirmation: string[];
    affirmationsFuel: string[];
};

const PhraseAndCategorySchema = z.object({
    phrase: z.string(),
    category: z.enum(['wealth', 'body', 'lifestyle', 'relationships', 'mindset', 'purpose']),
});

const AffirmationsSchema = z.object({
    affirmations: z.array(z.string()).length(5),
});

type Category = BothPhrasesResult['category'];

async function generatePhraseAndCategory(description: string, language: 'de' | 'en' = 'en'): Promise<{ phrase: string; category: Category }> {
    const systemPrompt = SYSTEM_PROMPT_PHRASE + `\n\nRespond in ${language === 'de' ? 'German' : 'English'}.`;
    const response = await getOpenAIClient().chat.completions.create({
        model: 'gpt-5.1',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: description },
        ],
        response_format: zodResponseFormat(PhraseAndCategorySchema as any, "data"),
        max_completion_tokens: 200,
        temperature: 0.8,
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) throw new Error('OpenAI returned empty response');

    const parsed = JSON.parse(raw);
    if (!parsed.phrase || !parsed.category) throw new Error('Invalid phrase response structure');
    return parsed;
}

async function generateAffirmationsForStyle(description: string, style: 'affirmation' | 'fuel', language: 'de' | 'en' = 'en'): Promise<string[]> {
    const basePrompt = style === 'fuel' ? SYSTEM_PROMPT_FUEL : SYSTEM_PROMPT_AFFIRMATION;
    const systemPrompt = basePrompt + `\n\nRespond in ${language === 'de' ? 'German' : 'English'}.`;
    const response = await getOpenAIClient().chat.completions.create({
        model: 'gpt-5.1',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: description },
        ],
        response_format: zodResponseFormat(AffirmationsSchema as any, "data"),
        max_completion_tokens: 300,
        temperature: 0.8,
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) throw new Error('OpenAI returned empty response');

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.affirmations)) throw new Error('Invalid affirmations response structure');
    return parsed.affirmations;
}

export async function generatePhraseAndAffirmations(description: string, language: 'de' | 'en' = 'en'): Promise<BothPhrasesResult> {
    const [phraseAndCat, affirmationResult, fuelResult] = await Promise.all([
        generatePhraseAndCategory(description, language),
        generateAffirmationsForStyle(description, 'affirmation', language),
        generateAffirmationsForStyle(description, 'fuel', language),
    ]);

    return {
        phrase: phraseAndCat.phrase,
        category: phraseAndCat.category,
        affirmationsAffirmation: affirmationResult,
        affirmationsFuel: fuelResult,
    };
}

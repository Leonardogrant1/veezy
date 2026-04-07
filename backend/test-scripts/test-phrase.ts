import "dotenv/config";

import { generatePhrase } from "@/prompts/phrase.js";

// ─── Config ───────────────────────────────────────────────────────────────────

const TEST_CASES: { description: string; style: 'affirmation' | 'fuel' }[] = [
    { description: "Ich will in Brasilien leben und ein Haus am Strand haben", style: 'affirmation' },
    { description: "Ich will in Brasilien leben und ein Haus am Strand haben", style: 'fuel' },
    { description: "Ich möchte finanziell frei sein und mein eigenes Business aufbauen", style: 'fuel' },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
    for (const { description, style } of TEST_CASES) {
        console.log("\n─────────────────────────────────────────────");
        console.log(`Style:  ${style.toUpperCase()}`);
        console.log(`Input:  ${description}`);
        console.log("─────────────────────────────────────────────");

        const result = await generatePhrase(description, style);

        console.log(`Category: ${result.category}`);
        console.log(`Phrase:   ${result.phrase}`);
        console.log("Messages:");
        result.affirmations.forEach((a, i) => console.log(`  ${i + 1}. ${a}`));
    }
})();

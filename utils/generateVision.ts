// utils/generateVision.ts
//
// Swap the mock body for a real fetch once the endpoint is ready.
// The call signature and return type stay the same.

export type GenerateVisionResult = {
  phrase: string;
  imageUrl: string;
};

export async function generateVision(description: string): Promise<GenerateVisionResult> {
  // --- MOCK (replace with real API call) ---
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return {
    phrase: `Ich lebe ${description}.`,
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  };
  // --- END MOCK ---

  // Real implementation (uncomment and fill in):
  // const response = await fetch('/api/generate-vision', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ description }),
  // });
  // if (!response.ok) throw new Error('Generation failed');
  // return response.json();
}

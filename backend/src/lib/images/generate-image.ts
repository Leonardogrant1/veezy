import { generateImageWithGeminiVertex } from '@/lib/gemini/generate-image-vertex.js';
import { generateImageWithGptImage } from '@/lib/openai/generate-image.js';

export enum ImageModel {
    GptImage = 'gpt-image',
    Gemini = 'gemini',
}

export async function generateImage(
    sceneDescription: string,
    personDescription: string,
    referenceImages: Array<{ base64: string; mimeType: string }>,
    model: ImageModel = ImageModel.GptImage,
): Promise<string> {
    switch (model) {
        case ImageModel.Gemini:
            return generateImageWithGeminiVertex(sceneDescription, personDescription, referenceImages);
        case ImageModel.GptImage:
            return generateImageWithGptImage(sceneDescription, personDescription, referenceImages);
    }
}

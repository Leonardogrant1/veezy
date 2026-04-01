
import fs from "fs/promises";
import path from "path";

process.env.GEMINI_API_KEY = "AIzaSyANwAJ84-rhhNy3ODP6xu9c86dciJska0Y";

(async () => {


    const imageFront = await fs.readFile(path.resolve(__dirname, "font.jpg"));
    const imageLeft = await fs.readFile(path.resolve(__dirname, "left.jpg"));
    const imageRight = await fs.readFile(path.resolve(__dirname, "right.jpg"));
    const imageBody = await fs.readFile(path.resolve(__dirname, "body.jpg"));
    const base64ImageFront = imageFront.toString("base64");
    const base64ImageLeft = imageLeft.toString("base64");
    const base64ImageRight = imageRight.toString("base64");
    const base64ImageBody = imageBody.toString("base64");

    const goal = "I want to be a successfull business man building apps. I want to travel a lot, be jacked."

    const prompt = `A real photograph taken with a Sony A7IV, 85mm f/1.4 lens, ISO 400, 1/200s shutter speed. Shot by a professional lifestyle photographer.

IMPORTANT — Reference images provided:
- Image 1-3: Face reference. Use this person's exact face, facial structure, skin tone, and features.

Body reference description (Image 2 — match this EXACTLY):

- Shoulders: Very broad, round, capped deltoids — significantly wider than the hips
- Arms: Large, thick upper arms with clearly visible bicep peak and tricep separation. Arms are notably voluminous
- Chest: Full, wide chest with visible muscle separation down the sternum. Pecs have good mass and definition
- Abs: Clearly visible 6-pack with strong muscle separation between each block. Midsection is tight and narrow compared to the upper body
- Overall build: Classic V-taper physique — wide on top, narrow waist. Looks like someone who has trained seriously for several years
- Body fat: Low, approximately 10-12% — definition is clear but not shredded/competition level
- Skin tone: Fair/light with slight redness on the face and ears
- Hair: Short on the sides, slightly longer and curly/wavy on top, light brown to dirty blonde
- Posture: Upright, chest out, confident stance
- Size impression: Medium-tall frame, filled out — not bulky/powerlifter, but clearly a trained athlete with size

The subject is shirtless, sitting at an outdoor terrace in Brazil. He is working on a MacBook Pro, relaxed but focused — candid, natural pose, not posed. 

Setting: A beautiful open-air terrace overlooking lush Brazilian landscape — tropical vegetation, maybe a glimpse of ocean or mountains in the distance. The terrace has a rustic-modern feel, natural wood table, maybe a fresh coconut or coffee nearby.

Lighting: Bright tropical midday or late afternoon sun, warm golden tones. Natural shadows on his bare skin from sunlight. Slight sweat sheen on skin from the heat — looks real and natural. Sun hitting the laptop screen slightly.

Background: Softly blurred tropical scenery behind him — palm trees, blue sky, maybe Rio-esque landscape.

Film grain, natural color grading, warm golden hour tones. Looks like a candid travel editorial photo. No AI glow. No studio lighting. No posed stock photo feel.`

    const model = "gemini-3.1-flash-image-preview" //  "gemini-3-pro-image-preview" 
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt
                        },
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": base64ImageFront
                            }
                        },
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": base64ImageLeft
                            }
                        },
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": base64ImageRight
                            }
                        },
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": base64ImageBody
                            }
                        }
                    ]
                }
            ],

            "generationConfig": {
                "imageConfig": {
                    "aspectRatio": "1:1",
                    "imageSize": "2K"
                }
            }
        })
    });

    const data = await res.json();
    const b64Res = data.candidates[0].content.parts[0].inlineData.data;

    await fs.writeFile(path.resolve(__dirname, "result.jpg"), Buffer.from(b64Res, "base64"));

})()
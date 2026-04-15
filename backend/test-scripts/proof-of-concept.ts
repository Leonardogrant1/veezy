import "dotenv/config";

import fs from "fs/promises";
import path from "path";


import { generateImageWithGeminiVertex } from "@/lib/gemini/generate-image-vertex.js";
import { R2Storage } from "@/lib/r2/storage.js";
import { describePersonFromImages } from "@/prompts/describe-person.js";
import { generateSceneDescription } from "@/prompts/generate-scene.js";
import { getSelfReferenceKey } from "@/utils/get-self-reference-key.js";

// ─── Config ───────────────────────────────────────────────────────────────────

const USER_ID = "cb00c367-4f22-47d6-baa5-ed77436dd541";
const GOAL = "Ich will einen roten ferrari fahren";

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
    // Step 0 — Load composite from R2
    console.log("⬇️  Loading composite from R2...");
    const composite = await R2Storage.downloadBuffer(getSelfReferenceKey(USER_ID, "composite"));
    if (!composite) throw new Error("Composite not found in R2");
    const compositeBase64 = composite.toString("base64");

    // Step 1 — Person description (cached or generated)
    let personDescription: string;
    const cachedDesc = await R2Storage.downloadBuffer(getSelfReferenceKey(USER_ID, "description"));
    if (cachedDesc) {
        personDescription = cachedDesc.toString("utf8");
        console.log("✅ Using cached description from R2");
    } else {
        personDescription = await describePersonFromImages([compositeBase64]);
        // Cache for future use
        await R2Storage.uploadBuffer(
            getSelfReferenceKey(USER_ID, "description"),
            Buffer.from(personDescription, "utf8"),
            "text/plain",
        );
        console.log("⚡ Generated and cached description");
    }
    console.log("\n📋 Person description:\n", personDescription);

    // Step 2 — Scene description
    const sceneDescription = await generateSceneDescription(personDescription, GOAL);
    console.log("\n🎬 Scene description:\n", sceneDescription);

    // Step 3 — Generate image via Gemini on Vertex AI
    console.log("🎨 Generating image with Gemini (Vertex AI)...");
    const b64 = await generateImageWithGeminiVertex(sceneDescription, personDescription, [
        { base64: compositeBase64, mimeType: "image/jpeg" },
    ]);

    const outPath = path.resolve(process.cwd(), "result.jpg");
    await fs.writeFile(outPath, Buffer.from(b64, "base64"));
    console.log(`\n✅ Image saved to ${outPath}`);
})();

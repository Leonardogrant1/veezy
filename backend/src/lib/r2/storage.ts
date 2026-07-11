import { DeleteObjectCommand, GetObjectCommand, GetObjectCommandOutput, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getR2Client } from './client.js';


function getBucket(): string {
    const bucket = process.env.R2_BUCKET_NAME;
    if (!bucket) throw new Error('R2_BUCKET_NAME not set');
    return bucket;
}


// r2/storage.ts

export class R2Storage {

    // Upload (bleibt gleich)
    static async uploadImage(key: string, base64: string): Promise<void> {
        await getR2Client().send(new PutObjectCommand({
            Bucket: getBucket(),
            Key: key,
            Body: Buffer.from(base64, 'base64'),
            ContentType: 'image/jpeg',
        }));
        // kein public URL mehr zurückgeben
    }

    // Upload raw Buffer
    static async uploadBuffer(key: string, buffer: Buffer, contentType = 'image/jpeg'): Promise<void> {
        await getR2Client().send(new PutObjectCommand({
            Bucket: getBucket(),
            Key: key,
            Body: buffer,
            ContentType: contentType,
        }));
    }

    // Download raw Buffer (returns null if key doesn't exist)
    static async downloadBuffer(key: string): Promise<Buffer | null> {
        try {
            const result: GetObjectCommandOutput = await getR2Client().send(new GetObjectCommand({
                Bucket: getBucket(),
                Key: key,
            }));
            if (!result.Body) return null;
            const chunks: Uint8Array[] = [];
            for await (const chunk of result.Body as AsyncIterable<Uint8Array>) {
                chunks.push(chunk);
            }
            return Buffer.concat(chunks);
        } catch (err: any) {
            // Missing keys are an expected code path (status polling, cache misses) — don't log them
            if (err.name === 'NoSuchKey') return null;
            console.log(err);
            throw err;
        }
    }

    // Presigned Upload URL (PUT)
    static async getSignedUploadUrl(key: string): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: getBucket(),
            Key: key,
            ContentType: 'image/jpeg',
        });
        return getSignedUrl(getR2Client(), command, { expiresIn: 300 }); // 5 min
    }

    // Presigned Download URL
    static async getSignedUrl(key: string): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: getBucket(),
            Key: key,
        });

        return getSignedUrl(getR2Client(), command, { expiresIn: 3600 }); // 1h
    }

    // Delete (bleibt gleich)
    static async deleteImage(key: string): Promise<void> {
        await getR2Client().send(new DeleteObjectCommand({
            Bucket: getBucket(),
            Key: key,
        }));
    }
}
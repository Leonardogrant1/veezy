import { File, Paths } from 'expo-file-system';

export class MediaHandler {

    static toUri(relativePath: string): string {
        return `${Paths.document.uri}${relativePath}`;
    }

    static exists(relativePath: string): boolean {
        return new File(Paths.document, relativePath).exists;
    }

    static async saveFromRemote(remoteUrl: string, relativePath: string): Promise<string> {
        const dest = new File(Paths.document, relativePath);
        if (!dest.parentDirectory.exists) {
            dest.parentDirectory.create({ intermediates: true });
        }
        await File.downloadFileAsync(remoteUrl, dest);
        return relativePath;
    }

    static saveFromLocal(sourceUri: string, relativePath: string): string {
        const dest = new File(Paths.document, relativePath);
        if (!dest.parentDirectory.exists) {
            dest.parentDirectory.create({ intermediates: true });
        }
        const source = new File(sourceUri);
        if (dest.exists) dest.delete();
        source.copy(dest);
        return relativePath;
    }

    static delete(relativePath: string): void {
        const file = new File(Paths.document, relativePath);
        if (file.exists) file.delete();
    }
}

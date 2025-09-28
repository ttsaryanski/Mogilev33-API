import bucket from "./gcsConfig.js";

export function hasErrorCode(err: unknown): err is { code: number } {
    return err !== null && typeof err === "object" && "code" in err;
}

export async function deleteFileFromGCS(filePath: string): Promise<void> {
    try {
        const file = bucket.file(filePath);
        await file.delete();
    } catch (err: unknown) {
        if (hasErrorCode(err) && err.code === 404) {
            console.warn(`File not found in GCS: ${filePath}`);
        } else {
            throw err;
        }
    }
}

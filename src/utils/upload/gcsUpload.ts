import bucket from "./gcsConfig.js";

interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}

export async function uploadFileToGCS(file: MulterFile): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!file) {
            return reject("No file provided!");
        }

        const blob = bucket.file(file.originalname);
        const blobStream = blob.createWriteStream({
            resumable: false,
            contentType: file.mimetype,
        });

        blobStream.on("error", (err) => reject(err));

        blobStream.on("finish", () => {
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            resolve(publicUrl);
        });

        blobStream.end(file.buffer);
    });
}

import { uploadFileToGCS } from "../utils/upload/gcsUpload.js";
import { deleteFileFromGCS } from "../utils/upload/gcsDelete.js";

import { GCSServiceTypes } from "../types/ServicesTypes.js";

export const gcsService: GCSServiceTypes = {
    async uploadFile(file: Express.Multer.File): Promise<string> {
        return await uploadFileToGCS(file);
    },

    async deleteFile(filePath: string): Promise<void> {
        return await deleteFileFromGCS(filePath);
    },
};
